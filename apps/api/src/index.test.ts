import { describe, it, expect } from 'vitest';
import app from './index';

const MOCK_ENV = {
    DB: {},
    BUCKET: {},
    VECTORIZE: {},
    AI: {},
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    GOOGLE_CLIENT_ID: 'mock',
    GOOGLE_CLIENT_SECRET: 'mock'
};

describe('API Routes', () => {
    describe('GET /', () => {
        it('should return health check', async () => {
            const res = await app.request('/', {}, MOCK_ENV);
            expect(res.status).toBe(200);

            const data = await res.json() as { name: string; status: string };
            expect(data.name).toBe('skillz-api');
            expect(data.status).toBe('ok');
        });
    });

    describe.skip('GET /api/v1/skills', () => {
        it('should return skills list', async () => {
            const res = await app.request('/api/v1/skills', {}, MOCK_ENV);
            expect(res.status).toBe(200);

            const data = await res.json() as { skills: unknown[] };
            expect(data).toHaveProperty('skills');
            expect(Array.isArray(data.skills)).toBe(true);
        });

        it('should support pagination', async () => {
            const res = await app.request('/api/v1/skills?limit=10&offset=0', {}, MOCK_ENV);
            expect(res.status).toBe(200);

            const data = await res.json() as { limit: number; offset: number };
            expect(data.limit).toBe(10);
            expect(data.offset).toBe(0);
        });

        it('should support search query', async () => {
            const res = await app.request('/api/v1/skills?q=test', {}, MOCK_ENV);
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data).toHaveProperty('skills');
        });
    });

    describe.skip('GET /api/v1/search', () => {
        it('should require query parameter', async () => {
            const res = await app.request('/api/v1/search', {}, MOCK_ENV);
            expect(res.status).toBe(400);
        });

        it('should return search results', async () => {
            const res = await app.request('/api/v1/search?q=test', {}, MOCK_ENV);
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data).toHaveProperty('query');
            expect(data).toHaveProperty('results');
        });
    });

    describe.skip('GET /api/v1/stats', () => {
        it('should return registry statistics', async () => {
            const res = await app.request('/api/v1/stats', {}, MOCK_ENV);
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data).toHaveProperty('totalSkills');
            expect(data).toHaveProperty('totalUsers');
            expect(data).toHaveProperty('totalDownloads');
        });
    });
});
