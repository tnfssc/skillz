import { describe, it, expect, vi } from "vitest";
import app from "./index";

// Mock Redis
vi.mock("./lib", () => ({
  createRedisClient: () => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  }),
  Ratelimit: class {
    static slidingWindow() {
      return {};
    }
    limit() {
      return { success: true };
    }
  },
}));

const createMockD1 = () => {
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => null,
        run: async () => ({ success: true, meta: {} }),
        all: async () => ({ results: [] }),
        raw: async () => [],
      }),
    }),
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as any;
};

const MOCK_ENV = {
  DB: createMockD1(),
  BUCKET: {},
  VECTORIZE: {},
  AI: {},
  UPSTASH_REDIS_REST_URL: "https://mock-redis.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "mock-token",
  GOOGLE_CLIENT_ID: "mock",
  GOOGLE_CLIENT_SECRET: "mock",
};

describe("API Routes", () => {
  describe("GET /", () => {
    it("should return health check", async () => {
      const res = await app.request("/", {}, MOCK_ENV);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain("<!DOCTYPE html>");
    });
  });

  describe.skip("GET /api/v1/skills", () => {
    it("should return skills list", async () => {
      const res = await app.request("/api/v1/skills", {}, MOCK_ENV);
      expect(res.status).toBe(200);

      const data = (await res.json()) as { skills: unknown[] };
      expect(data).toHaveProperty("skills");
      expect(Array.isArray(data.skills)).toBe(true);
    });

    it("should support pagination", async () => {
      const res = await app.request("/api/v1/skills?limit=10&offset=0", {}, MOCK_ENV);
      expect(res.status).toBe(200);

      const data = (await res.json()) as { limit: number; offset: number };
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(0);
    });

    it("should support search query", async () => {
      const res = await app.request("/api/v1/skills?q=test", {}, MOCK_ENV);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("skills");
    });
  });

  describe.skip("GET /api/v1/search", () => {
    it("should require query parameter", async () => {
      const res = await app.request("/api/v1/search", {}, MOCK_ENV);
      expect(res.status).toBe(400);
    });

    it("should return search results", async () => {
      const res = await app.request("/api/v1/search?q=test", {}, MOCK_ENV);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("query");
      expect(data).toHaveProperty("results");
    });
  });

  describe.skip("GET /api/v1/stats", () => {
    it("should return registry statistics", async () => {
      const res = await app.request("/api/v1/stats", {}, MOCK_ENV);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("totalSkills");
      expect(data).toHaveProperty("totalUsers");
      expect(data).toHaveProperty("totalDownloads");
    });
  });
});
