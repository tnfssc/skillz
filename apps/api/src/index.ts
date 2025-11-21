import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { drizzle } from 'drizzle-orm/d1';
import { skills, versions, user } from '@skillz/db';
import { eq, like, desc, and } from 'drizzle-orm';
import { createAuth } from './auth';
import { createRedisClient, Ratelimit } from '@skillz/shared';

type Bindings = {
    DB: D1Database;
    BUCKET: R2Bucket;
    VECTORIZE: VectorizeIndex;
    AI: Ai;
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: ['http://localhost:5173', 'https://skillz.dev'], // Adjust as needed
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}));

// Health check
app.get('/', (c) => {
    return c.json({
        name: 'skillz-api',
        version: '0.1.0',
        status: 'ok'
    });
});

// Auth endpoints
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
    const auth = createAuth(c.env);
    return auth.handler(c.req.raw);
});

// DEV ONLY: Create test user endpoint
app.post('/api/dev/create-test-user', async (c) => {
    const db = drizzle(c.env.DB);
    
    try {
        // First, delete the test user if it exists (make this truly idempotent)
        await db.delete(user).where(eq(user.email, 'dev@test.local')).catch(() => {});
        
        // Now create a fresh one
        const signupResponse = await fetch('http://localhost:8787/api/auth/sign-up/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'dev@test.local',
                password: 'devpassword',
                name: 'Dev User',
            }),
        });

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
            console.error('Signup failed:', signupData);
            return c.json({ error: signupData.error || 'Signup failed', details: signupData }, 400);
        }

        return c.json({ success: true, message: 'Test user created!' });
    } catch (error) {
        console.error('Create test user error:', error);
        return c.json({ error: 'Failed to create test user', details: String(error) }, 500);
    }
});

// DEV ONLY: Delete test user endpoint
app.post('/api/dev/delete-test-user', async (c) => {
    const db = drizzle(c.env.DB);
    
    try {
        await db.delete(user).where(eq(user.email, 'dev@test.local'));
        return c.json({ success: true, message: 'Test user deleted' });
    } catch (error) {
        console.error('Delete test user error:', error);
        return c.json({ error: 'Failed to delete test user', details: String(error) }, 500);
    }
});

// API v1 routes
const api = new Hono<{ Bindings: Bindings }>();

// Middleware to check auth - supports both session (web) and API keys (CLI)
const authMiddleware = async (c: any, next: any) => {
    const auth = createAuth(c.env);
    
    // Try to get Authorization header for API key
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify API key with Better Auth
        const verification = await auth.api.verifyApiKey({
            body: {
                key: apiKey,
                permissions: { api: ['read', 'write'] },
            },
        });
        
        if (!verification.valid) {
            return c.json({ error: 'Invalid or expired API key' }, 401);
        }
        
        if (verification.error) {
            return c.json({ error: 'Failed to verify API key' }, 500);
        }
        
        // Set user context from API key (key contains userId)
        // We'll need to fetch user details if needed
        c.set('apiKey', verification.key);
        c.set('userId', verification.key?.userId);
        await next();
        return;
    }
    
    // Otherwise, try session-based auth (for web)
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    c.set('user', session.user);
    c.set('session', session.session);
    await next();
};

// Rate limiting middleware
const rateLimitMiddleware = async (c: any, next: any) => {
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
    const ip = c.req.header('CF-Connecting-IP') || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
        return c.json({ error: 'Too Many Requests' }, 429);
    }
    await next();
};

api.use('*', rateLimitMiddleware);

// Me endpoint
api.get('/me', authMiddleware, async (c) => {
    const user = c.get('user');
    return c.json(user);
});

// Skills endpoints
api.get('/skills', async (c) => {
    const db = drizzle(c.env.DB);
    const query = c.req.query('q');
    const limit = Number(c.req.query('limit') || '20');
    const offset = Number(c.req.query('offset') || '0');

    try {
        let allSkills;
        if (query) {
            // Search by name or description
            allSkills = await db
                .select()
                .from(skills)
                .where(like(skills.name, `%${query}%`))
                .limit(limit)
                .offset(offset);
        } else {
            allSkills = await db
                .select()
                .from(skills)
                .orderBy(desc(skills.createdAt))
                .limit(limit)
                .offset(offset);
        }

        return c.json({
            skills: allSkills,
            total: allSkills.length,
            limit,
            offset
        });
    } catch (error) {
        console.error('Failed to fetch skills:', error);
        return c.json({ error: 'Failed to fetch skills' }, 500);
    }
});

api.get('/skills/:name', async (c) => {
    const name = c.req.param('name');
    const db = drizzle(c.env.DB);

    try {
        const skill = await db
            .select()
            .from(skills)
            .where(eq(skills.name, name))
            .limit(1);

        if (skill.length === 0) {
            return c.json({ error: 'Skill not found' }, 404);
        }

        // Get all versions for this skill
        const skillVersions = await db
            .select()
            .from(versions)
            .where(eq(versions.skillId, skill[0].id))
            .orderBy(desc(versions.createdAt));

        return c.json({
            ...skill[0],
            versions: skillVersions.map(v => ({
                ...v,
                manifest: JSON.parse(v.manifest as string)
            }))
        });
    } catch (error) {
        console.error('Failed to fetch skill:', error);
        return c.json({ error: 'Failed to fetch skill' }, 500);
    }
});

api.get('/skills/:name/:version', async (c) => {
    const { name, version: versionStr } = c.req.param();
    const db = drizzle(c.env.DB);

    try {
        const skill = await db
            .select()
            .from(skills)
            .where(eq(skills.name, name))
            .limit(1);

        if (skill.length === 0) {
            return c.json({ error: 'Skill not found' }, 404);
        }

        const skillVersion = await db
            .select()
            .from(versions)
            .where(and(eq(versions.skillId, skill[0].id), eq(versions.version, versionStr)))
            .limit(1);

        if (skillVersion.length === 0) {
            return c.json({ error: 'Version not found' }, 404);
        }

        return c.json({
            skill: skill[0],
            version: {
                ...skillVersion[0],
                manifest: JSON.parse(skillVersion[0].manifest as string)
            }
        });
    } catch (error) {
        console.error('Failed to fetch skill version:', error);
        return c.json({ error: 'Failed to fetch skill version' }, 500);
    }
});

api.post('/skills', authMiddleware, async (c) => {
    // TODO: Use c.get('user') to get authenticated user
    // const user = c.get('user');

    try {
        const body = await c.req.parseBody();
        const name = body['name'] as string;
        const version = body['version'] as string;
        const tarball = body['tarball'] as File;

        if (!name || !version || !tarball) {
            return c.json({ error: 'Missing required fields' }, 400);
        }

        // Calculate SHA256 integrity
        const tarballBuffer = await tarball.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', tarballBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const integrity = `sha256-${hashHex}`;

        // Store in global map for /tarballs endpoint to pick up
        // This is a HACK for local dev only
        const key = `${name}/${name}-${version}.tgz`;
        (globalThis as any).MOCK_TARBALLS = (globalThis as any).MOCK_TARBALLS || new Map();
        (globalThis as any).MOCK_TARBALLS.set(key, tarballBuffer);

        const db = drizzle(c.env.DB);

        // Check if skill exists
        const skill = await db.select().from(skills).where(eq(skills.name, name)).limit(1);
        let skillId;

        if (skill.length === 0) {
            // Create skill
            const result = await db.insert(skills).values({
                name,
                description: 'Published via CLI',
                author: 'alice', // TODO: Use authenticated user name
                authorId: 'user_1', // TODO: Use authenticated user ID
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning({ id: skills.id });
            skillId = result[0].id;
        } else {
            skillId = skill[0].id;
        }

        // Create version
        await db.insert(versions).values({
            skillId,
            version,
            description: 'Published via CLI',
            tarballUrl: `http://localhost:8787/api/v1/tarballs/${name}/${name}-${version}.tgz`,
            integrity, // Real SHA256
            manifest: JSON.stringify({ name, version }),
            createdAt: new Date()
        });

        return c.json({ success: true, name, version });
    } catch (error) {
        console.error('Publish failed:', error);
        return c.json({ error: 'Publish failed' }, 500);
    }
});

api.delete('/skills/:name/:version', authMiddleware, async (c) => {
    // TODO: Implement unpublish logic
    return c.json({ message: 'Not implemented yet' }, 501);
});

// Users endpoints
api.get('/users/:username', async (c) => {
    // TODO: Update this to search by name or email since username is gone
    // Or assume 'name' is username
    const username = c.req.param('username');
    const db = drizzle(c.env.DB);

    try {
        const foundUser = await db
            .select()
            .from(user)
            .where(eq(user.name, username))
            .limit(1);

        if (foundUser.length === 0) {
            return c.json({ error: 'User not found' }, 404);
        }

        // Get user's skills
        const userSkills = await db
            .select()
            .from(skills)
            .where(eq(skills.authorId, foundUser[0].id));

        return c.json({
            ...foundUser[0],
            skills: userSkills
        });
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return c.json({ error: 'Failed to fetch user' }, 500);
    }
});

// Search endpoint
api.get('/search', async (c) => {
    const query = c.req.query('q');
    const db = drizzle(c.env.DB);

    if (!query) {
        return c.json({ error: 'Query parameter required' }, 400);
    }

    try {
        // Simple search for now (will upgrade to Vectorize later)
        const results = await db
            .select()
            .from(skills)
            .where(like(skills.name, `%${query}%`))
            .limit(20);

        return c.json({
            query,
            results,
            total: results.length
        });
    } catch (error) {
        console.error('Search failed:', error);
        return c.json({ error: 'Search failed' }, 500);
    }
});

// Stats endpoint
api.get('/stats', async (c) => {
    const db = drizzle(c.env.DB);

    try {
        // TODO: Implement proper aggregation
        const totalSkills = await db.select().from(skills);
        const totalUsers = await db.select().from(user);

        return c.json({
            totalSkills: totalSkills.length,
            totalUsers: totalUsers.length,
            totalDownloads: 0 // TODO: Calculate from downloads table
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        return c.json({ error: 'Failed to fetch stats' }, 500);
    }
});

// Tarball download endpoint (mock for local dev)
api.get('/tarballs/:name/:filename', async (c) => {
    const { name, filename } = c.req.param();

    // Check if we have the tarball in memory (from publish)
    const key = `${name}/${filename}`;
    const mockTarballs = (globalThis as any).MOCK_TARBALLS;

    if (mockTarballs && mockTarballs.has(key)) {
        const tarballBuffer = mockTarballs.get(key);
        return c.body(tarballBuffer, 200, {
            'Content-Type': 'application/gzip',
            'Content-Disposition': `attachment; filename="${filename}"`
        });
    }

    // Fallback to dummy tarball for seeded data
    const dummyTarballBase64 = "H4sIAAAAAAAAA+3Uz4rCMBDH8Zx9ioD3dJI2DXj2sqw3n6D4B2SbLjS64D6928OiCMVTKuL3c5lDAjPwY8YUKjv5E7wfqg1ebus/Zb2V4Hzp6kqJlVqc0j7/aEqd0rHptVbHbp/SZvzfo/cXZYr158dqZeI2X48h4LqqxvO39V3+NoSgtOQb6erN85/r5SnGs15/Hdp29uxpMDVTpCH5X3NuYpupx8P9L8u7/XchOPZ/Cl0Tdwu9HW7A7GfXp8N3t9DWiBGOAQAAAAAAAAAAAAAAr+ICj1i4zgAoAAA=";

    const binary = Uint8Array.from(atob(dummyTarballBase64), c => c.charCodeAt(0));

    return c.body(binary.buffer, 200, {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${filename}"`
    });
});

app.route('/api/v1', api);

export default app;
