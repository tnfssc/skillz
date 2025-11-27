import { Ai } from "@cloudflare/ai";
import { VectorizeIndex, Fetcher, D1Database } from "@cloudflare/workers-types";
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
  env: { AI: Fetcher; VECTORIZE: VectorizeIndex; DB: D1Database },
  limit: number = 20,
  filters?: {
    author?: string;
    license?: string;
    tags?: string[];
  },
): Promise<SearchResult[]> {
  // 1. Generate embedding for the query
  const ai = new Ai(env.AI);
  const queryVector = await generateEmbedding(ai, query);

  // 2. Search Vectorize for semantic matches
  const vectorResults = await env.VECTORIZE.query(queryVector, {
    topK: limit * 2, // Get more results for filtering
    returnMetadata: true,
  });

  // 3. Search D1 for keyword matches (fallback/hybrid)
  const db = drizzle(env.DB);

  // Build where clause based on filters
  const conditions = or(like(skills.name, `%${query}%`), like(skills.description, `%${query}%`));

  const keywordResults = await db.select().from(skills).where(conditions).limit(limit);

  // 4. Merge and rank results
  const resultsMap = new Map<number, SearchResult>();

  // Process vector results with metadata filtering
  for (const match of vectorResults.matches) {
    const skillId = Number(match.metadata?.skillId);
    if (!skillId) continue;

    // Apply filters on metadata
    if (filters) {
      const metadata = match.metadata;

      // Filter by author
      if (filters.author && metadata?.author !== filters.author) {
        continue;
      }

      // Filter by license
      if (filters.license && metadata?.license !== filters.license) {
        continue;
      }

      // Filter by tags (skill must have at least one of the requested tags)
      if (filters.tags && filters.tags.length > 0) {
        const skillTags = (metadata?.tags as string[]) || [];
        const hasMatchingTag = filters.tags.some((tag) => skillTags.includes(tag));
        if (!hasMatchingTag) {
          continue;
        }
      }
    }

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
  skill: {
    id: number;
    name: string;
    description: string | null;
    tags?: string[];
    license?: string | null;
    author?: string;
  },
  env: { AI: Fetcher; VECTORIZE: VectorizeIndex },
) {
  const ai = new Ai(env.AI);

  // Create rich text for embedding including tags, license, and author context
  const tagText = skill.tags && skill.tags.length > 0 ? ` Tags: ${skill.tags.join(", ")}` : "";
  const licenseText = skill.license ? ` License: ${skill.license}` : "";
  const authorText = skill.author ? ` By ${skill.author}` : "";

  const text = `${skill.name}: ${skill.description || ""}${tagText}${licenseText}${authorText}`;
  const vector = await generateEmbedding(ai, text);

  await env.VECTORIZE.insert([
    {
      id: skill.id.toString(),
      values: vector,
      metadata: {
        skillId: skill.id,
        name: skill.name,
        tags: skill.tags || [],
        license: skill.license || "",
        author: skill.author || "",
      },
    },
  ]);
}
