import { Hono } from "hono";
import type { Context } from "hono";
import { Fetcher, VectorizeIndex, D1Database, R2Bucket } from "@cloudflare/workers-types";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { drizzle } from "drizzle-orm/d1";
import { skills, versions, user } from "../db/src/schema";
import { eq, desc, and } from "drizzle-orm";
import { createAuth } from "./auth";
import { createRedisClient, Ratelimit } from "./lib";
import { renderer } from "./renderer";
import { HomePage } from "./pages/Home";
import { DocsPage } from "./pages/Docs";
import { LoginPage } from "./pages/Login";
import { SkillsPage } from "./pages/Skills";
import { SkillDetailPage } from "./pages/SkillDetail";
import { indexSkill, searchSkills } from "./lib/search";

type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  VECTORIZE: VectorizeIndex;
  AI: Fetcher;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ENVIRONMENT: string;
};

type Variables = {
  user?: unknown;
  session?: unknown;
  apiKey?: unknown;
  userId?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://skillz.lat", "https://skillz.dev"], // Adjust as needed
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Static files are served via wrangler.toml assets configuration

// UI Renderer
app.use("*", renderer);

// UI Routes
app.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  const trendingSkills = await db.select().from(skills).orderBy(desc(skills.createdAt)).limit(6);

  return c.render(<HomePage skills={trendingSkills} user={session?.user} />, { title: "Home" });
});

app.get("/docs", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return c.render(<DocsPage user={session?.user} />, { title: "Documentation" });
});

app.get("/login", (c) => {
  return c.render(<LoginPage />, { title: "Sign In" });
});

app.get("/skills", async (c) => {
  const db = drizzle(c.env.DB);
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  const query = c.req.query("q");
  let allSkills;

  if (query) {
    allSkills = await searchSkills(query, c.env);
  } else {
    allSkills = await db.select().from(skills).orderBy(desc(skills.createdAt)).limit(20);
  }

  return c.render(<SkillsPage skills={allSkills} query={query} user={session?.user} />, { title: "Skills" });
});

app.get("/skills/:name", async (c) => {
  const name = c.req.param("name");
  const db = drizzle(c.env.DB);
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  const skill = await db.select().from(skills).where(eq(skills.name, name)).limit(1);

  if (skill.length === 0) {
    return c.notFound();
  }

  const skillVersions = await db
    .select()
    .from(versions)
    .where(eq(versions.skillId, skill[0].id))
    .orderBy(desc(versions.createdAt));

  const parsedVersions = skillVersions.map((v) => ({
    ...v,
    manifest: JSON.parse(v.manifest as string),
  }));

  return c.render(<SkillDetailPage skill={skill[0]} versions={parsedVersions} user={session?.user} />, {
    title: skill[0].name,
  });
});

// Auth endpoints
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// DEV ONLY: Create test user endpoint
// DEV ONLY: Create test user endpoint
app.post("/api/dev/create-test-user", async (c) => {
  if (c.env.ENVIRONMENT !== "development") {
    return c.json({ error: "Not found" }, 404);
  }

  const db = drizzle(c.env.DB);

  try {
    // First, delete the test user if it exists (make this truly idempotent)
    await db
      .delete(user)
      .where(eq(user.email, "dev@test.local"))
      .catch(() => {});

    // Now create a fresh one
    const signupResponse = await fetch("http://localhost:8787/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "dev@test.local",
        password: "devpassword",
        name: "Dev User",
      }),
    });

    const signupData = (await signupResponse.json()) as { error?: string };

    if (!signupResponse.ok) {
      console.error("Signup failed:", signupData);
      return c.json({ error: signupData.error || "Signup failed", details: signupData }, 400);
    }

    return c.json({ success: true, message: "Test user created!" });
  } catch (error) {
    console.error("Create test user error:", error);
    return c.json({ error: "Failed to create test user", details: String(error) }, 500);
  }
});

// DEV ONLY: Delete test user endpoint
app.post("/api/dev/delete-test-user", async (c) => {
  if (c.env.ENVIRONMENT !== "development") {
    return c.json({ error: "Not found" }, 404);
  }

  const db = drizzle(c.env.DB);

  try {
    await db.delete(user).where(eq(user.email, "dev@test.local"));
    return c.json({ success: true, message: "Test user deleted" });
  } catch (error) {
    console.error("Delete test user error:", error);
    return c.json({ error: "Failed to delete test user", details: String(error) }, 500);
  }
});

// DEV ONLY: Backfill embeddings
app.post("/api/dev/backfill", async (c) => {
  if (c.env.ENVIRONMENT !== "development") {
    return c.json({ error: "Not found" }, 404);
  }

  const db = drizzle(c.env.DB);

  try {
    const allSkills = await db.select().from(skills);
    let count = 0;
    const errors = [];

    for (const skill of allSkills) {
      try {
        await indexSkill({ id: skill.id, name: skill.name, description: skill.description }, c.env);
        count++;
      } catch (e) {
        console.error(`Failed to index ${skill.name}:`, e);
        errors.push({ name: skill.name, error: String(e) });
      }
    }

    return c.json({
      success: true,
      message: `Indexed ${count} skills`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Backfill failed:", error);
    return c.json({ error: "Backfill failed", details: String(error) }, 500);
  }
});

// API v1 routes
const api = new Hono<{ Bindings: Bindings }>();

// Middleware to check auth - supports both session (web) and API keys (CLI)
const authMiddleware = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: () => Promise<void>) => {
  const auth = createAuth(c.env);

  // Try to get Authorization header for API key
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify API key with Better Auth
    const verification = await auth.api.verifyApiKey({
      body: {
        key: apiKey,
        permissions: { api: ["read", "write"] },
      },
    });

    if (!verification.valid) {
      return c.json({ error: "Invalid or expired API key" }, 401);
    }

    if (verification.error) {
      return c.json({ error: "Failed to verify API key" }, 500);
    }

    // Set user context from API key (key contains userId)
    // We'll need to fetch user details if needed
    c.set("apiKey", verification.key);
    c.set("userId", verification.key?.userId);
    await next();
    return;
  }

  // Otherwise, try session-based auth (for web)
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};

// Rate limiting middleware
const rateLimitMiddleware = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: () => Promise<void>,
) => {
  if (!c.env.UPSTASH_REDIS_REST_URL || !c.env.UPSTASH_REDIS_REST_TOKEN) {
    // Skip if not configured (e.g. local dev without redis)
    await next();
    return;
  }
  const redis = createRedisClient(c.env.UPSTASH_REDIS_REST_URL, c.env.UPSTASH_REDIS_REST_TOKEN);
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
  });
  const ip = c.req.header("CF-Connecting-IP") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return c.json({ error: "Too Many Requests" }, 429);
  }
  await next();
};

api.use("*", rateLimitMiddleware);

// Me endpoint
api.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  return c.json(user);
});

// Skills endpoints
api.get("/skills", async (c) => {
  const db = drizzle(c.env.DB);
  const query = c.req.query("q");
  const limit = Number(c.req.query("limit") || "20");
  const offset = Number(c.req.query("offset") || "0");

  try {
    let allSkills;
    if (query) {
      // Search by name or description using hybrid search
      const results = await searchSkills(query, c.env, limit);
      allSkills = results;
    } else {
      allSkills = await db.select().from(skills).orderBy(desc(skills.createdAt)).limit(limit).offset(offset);
    }

    return c.json({
      skills: allSkills,
      total: allSkills.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    const message = c.env.ENVIRONMENT === "development" ? String(error) : "Internal Server Error";
    return c.json({ error: "Failed to fetch skills", details: message }, 500);
  }
});

api.get("/skills/:name", async (c) => {
  const name = c.req.param("name");
  const db = drizzle(c.env.DB);

  try {
    const skill = await db.select().from(skills).where(eq(skills.name, name)).limit(1);

    if (skill.length === 0) {
      return c.json({ error: "Skill not found" }, 404);
    }

    // Get all versions for this skill
    const skillVersions = await db
      .select()
      .from(versions)
      .where(eq(versions.skillId, skill[0].id))
      .orderBy(desc(versions.createdAt));

    return c.json({
      ...skill[0],
      versions: skillVersions.map((v) => ({
        ...v,
        manifest: JSON.parse(v.manifest as string),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch skill:", error);
    const message = c.env.ENVIRONMENT === "development" ? String(error) : "Internal Server Error";
    return c.json({ error: "Failed to fetch skill", details: message }, 500);
  }
});

api.get("/skills/:name/:version", async (c) => {
  const { name, version: versionStr } = c.req.param();
  const db = drizzle(c.env.DB);

  try {
    const skill = await db.select().from(skills).where(eq(skills.name, name)).limit(1);

    if (skill.length === 0) {
      return c.json({ error: "Skill not found" }, 404);
    }

    const skillVersion = await db
      .select()
      .from(versions)
      .where(and(eq(versions.skillId, skill[0].id), eq(versions.version, versionStr)))
      .limit(1);

    if (skillVersion.length === 0) {
      return c.json({ error: "Version not found" }, 404);
    }

    return c.json({
      skill: skill[0],
      version: {
        ...skillVersion[0],
        manifest: JSON.parse(skillVersion[0].manifest as string),
      },
    });
  } catch (error) {
    console.error("Failed to fetch skill version:", error);
    const message = c.env.ENVIRONMENT === "development" ? String(error) : "Internal Server Error";
    return c.json({ error: "Failed to fetch skill version", details: message }, 500);
  }
});

api.post("/skills", authMiddleware, async (c) => {
  let userId = c.get("userId");
  let userName = "Unknown";

  // Try to get user from session if not set by API key
  if (!userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = c.get("user") as any;
    if (user) {
      userId = user.id;
      userName = user.name;
    }
  }

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);

  // If we have userId but no name (API key case), fetch user
  if (userId && userName === "Unknown") {
    const u = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (u.length > 0) {
      userName = u[0].name;
    }
  }

  try {
    const body = await c.req.parseBody();
    const name = body["name"] as string;
    const version = body["version"] as string;
    const tarball = body["tarball"] as File;

    if (!name || !version || !tarball) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Validate name format (lowercase alphanumeric and hyphens)
    const nameRegex = /^[a-z0-9-]+$/;
    if (!nameRegex.test(name)) {
      return c.json({ error: "Invalid name. Must be lowercase alphanumeric with hyphens." }, 400);
    }

    // Validate version format (simple semver)
    const versionRegex =
      /^\d+\.\d+\.\d+(?:-[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/;
    if (!versionRegex.test(version)) {
      return c.json({ error: "Invalid version format. Must be SemVer." }, 400);
    }

    // 1. Validate file size (Max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (tarball.size > MAX_SIZE) {
      return c.json({ error: "File too large. Max size is 10MB." }, 413);
    }

    // Calculate SHA256 integrity
    const tarballBuffer = await tarball.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", tarballBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const integrity = `sha256-${hashHex}`;

    // 2. Store in R2
    const key = `${name}/${name}-${version}.tgz`;
    await c.env.BUCKET.put(key, tarballBuffer, {
      httpMetadata: {
        contentType: "application/gzip",
      },
    });

    // Check if skill exists
    const skill = await db.select().from(skills).where(eq(skills.name, name)).limit(1);
    let skillId;

    if (skill.length === 0) {
      // Create skill
      const result = await db
        .insert(skills)
        .values({
          name,
          description: "Published via CLI",
          author: userName,
          authorId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: skills.id });
      skillId = result[0].id;
    } else {
      skillId = skill[0].id;
      // Optional: Check if current user is the author
      if (skill[0].authorId !== userId) {
        return c.json({ error: "You are not the author of this skill" }, 403);
      }
    }

    // Create version
    // @ts-expect-error env.BETTER_AUTH_URL is not defined
    const baseUrl = c.env.BETTER_AUTH_URL || "http://localhost:8787";
    const tarballUrl = `${baseUrl}/api/v1/tarballs/${name}/${name}-${version}.tgz`;

    await db.insert(versions).values({
      skillId,
      version,
      description: "Published via CLI",
      tarballUrl,
      integrity, // Real SHA256
      manifest: JSON.stringify({ name, version }),
      createdAt: new Date(),
    });

    // Index for vector search (fire and forget)
    c.executionCtx.waitUntil(
      indexSkill(
        { id: skillId, name, description: "Published via CLI" }, // TODO: Get description from manifest
        c.env,
      ),
    );

    return c.json({ success: true, name, version });
  } catch (error) {
    console.error("Publish failed:", error);
    const message = c.env.ENVIRONMENT === "development" ? String(error) : "Internal Server Error";
    return c.json({ error: "Publish failed", details: message }, 500);
  }
});

api.delete("/skills/:name/:version", authMiddleware, async (c) => {
  // TODO: Implement unpublish logic
  return c.json({ message: "Not implemented yet" }, 501);
});

// Users endpoints
api.get("/users/:username", async (c) => {
  // TODO: Update this to search by name or email since username is gone
  // Or assume 'name' is username
  const username = c.req.param("username");
  const db = drizzle(c.env.DB);

  try {
    const foundUser = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.name, username))
      .limit(1);

    if (foundUser.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get user's skills
    const userSkills = await db.select().from(skills).where(eq(skills.authorId, foundUser[0].id));

    return c.json({
      ...foundUser[0],
      skills: userSkills,
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    const message = c.env.ENVIRONMENT === "development" ? String(error) : "Internal Server Error";
    return c.json({ error: "Failed to fetch user", details: message }, 500);
  }
});

// Search endpoint

// Stats endpoint
api.get("/stats", async (c) => {
  const db = drizzle(c.env.DB);

  try {
    // TODO: Implement proper aggregation
    const totalSkills = await db.select().from(skills);
    const totalUsers = await db.select().from(user);

    return c.json({
      totalSkills: totalSkills.length,
      totalUsers: totalUsers.length,
      totalDownloads: 0, // TODO: Calculate from downloads table
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    const message = c.env.ENVIRONMENT === "development" ? String(error) : "Internal Server Error";
    return c.json({ error: "Failed to fetch stats", details: message }, 500);
  }
});

// Tarball download endpoint
api.get("/tarballs/:name/:filename", async (c) => {
  const { name, filename } = c.req.param();
  const key = `${name}/${filename}`;

  const object = await c.env.BUCKET.get(key);

  if (!object) {
    return c.json({ error: "Tarball not found" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, {
    headers,
  });
});

app.route("/api/v1", api);

export default app;
