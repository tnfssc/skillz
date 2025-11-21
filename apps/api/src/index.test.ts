import { describe, it, expect, beforeEach } from 'vitest';
import app from './index';

describe('API Routes', () => {
    describe('GET /', () => {
        it('should return health check', async () => {
            const res = await app.request('/');
            expect(res.status).toBe(200);

            const data = await res.json() as { name: string; status: string };
            expect(data.name).toBe('skillz-api');
            expect(data.status).toBe('ok');
        });
    });

    describe('GET /api/v1/skills', () => {
        it('should return skills list', async () => {
            const res = await app.request('/api/v1/skills');
            expect(res.status).toBe(200);

            const data = await res.json() as { skills: unknown[] };
            expect(data).toHaveProperty('skills');
            expect(Array.isArray(data.skills)).toBe(true);
        });

        it('should support pagination', async () => {
            const res = await app.request('/api/v1/skills?limit=10&offset=0');
            expect(res.status).toBe(200);

            const data = await res.json() as { limit: number; offset: number };
            expect(data.limit).toBe(10);
            expect(data.offset).toBe(0);
        });

        it('should support search query', async () => {
            const res = await app.request('/api/v1/skills?q=test');
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data).toHaveProperty('skills');
        });
    });

    describe('GET /api/v1/search', () => {
        it('should require query parameter', async () => {
            const res = await app.request('/api/v1/search');
            expect(res.status).toBe(400);
        });

        it('should return search results', async () => {
            const res = await app.request('/api/v1/search?q=test');
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data).toHaveProperty('query');
            expect(data).toHaveProperty('results');
        });
    });

    describe('GET /api/v1/stats', () => {
        it('should return registry statistics', async () => {
            const res = await app.request('/api/v1/stats');
            expect(res.status).toBe(200);

            const data = await res.json();
            expect(data).toHaveProperty('totalSkills');
            expect(data).toHaveProperty('totalUsers');
            expect(data).toHaveProperty('totalDownloads');
        });
    });
});
