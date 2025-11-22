import { drizzle } from "drizzle-orm/d1";
import { skills } from "../db/src/schema";
import { Ai } from "@cloudflare/ai";
import { generateEmbedding } from "../src/lib/ai";

// This script is meant to be run as a Worker or via wrangler dev
// It cannot be run directly with ts-node because it needs Cloudflare bindings

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    if (request.url.endsWith("/backfill")) {
      const db = drizzle(env.DB);
      const ai = new Ai(env.AI);

      const allSkills = await db.select().from(skills);
      let count = 0;

      for (const skill of allSkills) {
        const text = `${skill.name}: ${skill.description || ""}`;
        console.log(`Generating embedding for ${skill.name}...`);

        try {
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
          count++;
        } catch (e) {
          console.error(`Failed to index ${skill.name}:`, e);
        }
      }

      return new Response(`Indexed ${count} skills`);
    }

    return new Response("Use /backfill to start indexing");
  },
};
