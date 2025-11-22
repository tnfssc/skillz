import { Ai } from "@cloudflare/ai";
import { VectorizeIndex } from "@cloudflare/workers-types";
import { generateEmbedding } from "./ai";
import { drizzle } from "drizzle-orm/d1";
import { skills } from "../../db/src/schema";
import { like, or, inArray } from "drizzle-orm";
import type { Skill } from "../types";

export interface SearchResult extends Skill {
  score: number;
}

export async function searchSkills(
  query: string,
  env: { AI: any; VECTORIZE: VectorizeIndex; DB: D1Database },
  limit: number = 20,
): Promise<SearchResult[]> {
  // 1. Generate embedding for the query
  const ai = new Ai(env.AI);
  const queryVector = await generateEmbedding(ai, query);

  // 2. Search Vectorize for semantic matches
  const vectorResults = await env.VECTORIZE.query(queryVector, {
    topK: limit,
    returnMetadata: true,
  });

  // 3. Search D1 for keyword matches (fallback/hybrid)
  const db = drizzle(env.DB);
  const keywordResults = await db
    .select()
    .from(skills)
    .where(or(like(skills.name, `%${query}%`), like(skills.description, `%${query}%`)))
    .limit(limit);

  // 4. Merge and rank results
  const resultsMap = new Map<number, SearchResult>();

  // Process vector results
  for (const match of vectorResults.matches) {
    const skillId = Number(match.metadata?.skillId);
    if (!skillId) continue;

    // We need to fetch the full skill details for these IDs later
    resultsMap.set(skillId, {
      id: skillId,
      score: match.score,
    } as SearchResult);
  }

  // Process keyword results
  for (const skill of keywordResults) {
    if (resultsMap.has(skill.id)) {
      // Boost score if it appears in both
      const existing = resultsMap.get(skill.id)!;
      existing.score += 0.5; // Arbitrary boost for exact keyword match
      Object.assign(existing, skill);
    } else {
      resultsMap.set(skill.id, {
        ...skill,
        score: 0.5, // Base score for keyword match
      });
    }
  }

  // Fetch missing details for vector-only matches
  const missingIds = Array.from(resultsMap.values())
    .filter((r) => !r.name)
    .map((r) => r.id);

  if (missingIds.length > 0) {
    const details = await db.select().from(skills).where(inArray(skills.id, missingIds));

    for (const skill of details) {
      const result = resultsMap.get(skill.id);
      if (result) {
        Object.assign(result, skill);
      }
    }
  }

  // Filter out any results that still don't have names (e.g. deleted skills still in vector index)
  const finalResults = Array.from(resultsMap.values())
    .filter((r) => r.name)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return finalResults;
}

export async function indexSkill(
  skill: { id: number; name: string; description: string | null },
  env: { AI: any; VECTORIZE: VectorizeIndex },
) {
  const ai = new Ai(env.AI);
  const text = `${skill.name}: ${skill.description || ""}`;
  const vector = await generateEmbedding(ai, text);

  await env.VECTORIZE.insert([
    {
      id: skill.id.toString(),
      values: vector,
      metadata: {
        skillId: skill.id,
        name: skill.name,
      },
    },
  ]);
}
