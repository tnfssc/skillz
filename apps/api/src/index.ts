import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { drizzle } from 'drizzle-orm/d1';
import { skills, versions, users } from '@skillz/db';
import { eq, like, desc, and } from 'drizzle-orm';

type Bindings = {
    DB: D1Database;
    BUCKET: R2Bucket;
    VECTORIZE: VectorizeIndex;
    AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', (c) => {
    return c.json({
        name: 'skillz-api',
        version: '0.1.0',
        status: 'ok'
    });
});

// API v1 routes
const api = new Hono<{ Bindings: Bindings }>();

// Auth endpoints
const auth = new Hono<{ Bindings: Bindings }>();

auth.post('/login', async (c) => {
    const { username, password } = await c.req.json();
    const db = drizzle(c.env.DB);

    try {
        const user = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        if (user.length === 0) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        // TODO: Implement real password verification (bcrypt)
        // For now, accept any password for seeded users

        // Generate a simple token (mock)
        const token = `skillz_token_${user[0].username}_${Date.now()}`;

        return c.json({
            token,
            user: {
                username: user[0].username
            }
        });
    } catch (error) {
        console.error('Login failed:', error);
        return c.json({ error: 'Login failed' }, 500);
    }
});

app.route('/api/v1/auth', auth);

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

api.post('/skills', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer skillz_token_')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const body = await c.req.parseBody();
        const name = body['name'] as string;
        const version = body['version'] as string;
        const tarball = body['tarball'] as File;

        if (!name || !version || !tarball) {
            return c.json({ error: 'Missing required fields' }, 400);
        }

        // Save tarball (mock storage)
        // In a real app, we'd upload to R2
        // Here we just acknowledge receipt because we can't easily write to disk in Worker environment
        // BUT since we are running locally with `wrangler dev`, we can't write to disk easily either without node compat.
        // So for this "mock", we will just update the DB and point the URL to the /tarballs endpoint
        // assuming the user will "upload" it there manually or we just mock the download too.

        // Wait, if I don't save it, `install` won't work for the new package unless I mock the download route 
        // to return this specific file.
        // I can store the file in memory or D1? No, D1 is for data.
        // I can store it in a global Map for the session? Yes!

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
                author: 'alice', // Mock author
                authorId: 1,
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

api.delete('/skills/:name/:version', async (c) => {
    // TODO: Implement authentication
    // TODO: Implement unpublish logic
    return c.json({ message: 'Not implemented yet' }, 501);
});

// Users endpoints
api.get('/users/:username', async (c) => {
    const username = c.req.param('username');
    const db = drizzle(c.env.DB);

    try {
        const user = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                createdAt: users.createdAt
            })
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        if (user.length === 0) {
            return c.json({ error: 'User not found' }, 404);
        }

        // Get user's skills
        const userSkills = await db
            .select()
            .from(skills)
            .where(eq(skills.authorId, user[0].id));

        return c.json({
            ...user[0],
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
        const totalUsers = await db.select().from(users);

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
