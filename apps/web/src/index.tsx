import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { skills, versions, tags, ratings, downloads } from '@skillz/db';
import { eq, desc, sql, like } from 'drizzle-orm';
import { Layout } from './components/Layout';
import { html } from 'hono/html';

type Bindings = {
    DB: D1Database;
    BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Homepage
app.get('/', async (c) => {
    const db = drizzle(c.env.DB);

    try {
        // Get latest skills (for now, ordering by created date as "trending")
        // TODO: Add real download tracking and trending algorithm
        const trendingSkills = await db
            .select()
            .from(skills)
            .orderBy(desc(skills.updatedAt))
            .limit(6);

        // Get latest skills
        const latestSkills = await db
            .select()
            .from(skills)
            .orderBy(desc(skills.createdAt))
            .limit(6);

        return c.html(
            <Layout>
                <div class="hero">
                    <div class="container">
                        <h1>Package Manager for Claude Skills</h1>
                        <p>
                            Discover, share, and manage Claude Skills with dependencies,
                            versioning, and a beautiful registry.
                        </p>
                        <div class="search-box">
                            <input
                                type="search"
                                class="search-input"
                                placeholder="Search for skills..."
                                name="q"
                            />
                            <button class="btn">Search</button>
                        </div>
                    </div>
                </div>

                <div class="container">
                    <h2 style="margin: 3rem 0 1.5rem; font-size: 2rem;">🔥 Trending Skills</h2>
                    <div class="grid">
                        {trendingSkills.map((skill) => (
                            <a href={`/skills/${skill.name}`} style="text-decoration: none;">
                                <div class="card">
                                    <h3 class="card-title">{skill.name}</h3>
                                    <div class="card-meta">
                                        <span>by {skill.author}</span>
                                    </div>
                                    <p class="card-description">{skill.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>

                    <h2 style="margin: 3rem 0 1.5rem; font-size: 2rem;">✨ Latest Skills</h2>
                    <div class="grid">
                        {latestSkills.map((skill) => (
                            <a href={`/skills/${skill.name}`} style="text-decoration: none;">
                                <div class="card">
                                    <h3 class="card-title">{skill.name}</h3>
                                    <div class="card-meta">
                                        <span>by {skill.author}</span>
                                    </div>
                                    <p class="card-description">{skill.description}</p>
                                </div>
                            </a>
                        ))}
                    </div>

                    <div style="margin: 4rem 0; padding: 3rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border-radius: 16px; text-align: center;">
                        <h2 style="font-size: 2rem; margin-bottom: 1rem;">Get Started</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.1rem;">
                            Install the Skillz CLI to start using Claude Skills in your projects
                        </p>
                        <pre style="max-width: 600px; margin: 0 auto; text-align: left;">
                            # Install the CLI
                            npm install -g @skillz/cli

                            # Initialize a new skill
                            skillz init

                            # Add a dependency
                            skillz add data-analyzer

                            # Install dependencies
                            skillz install
                        </pre>
                    </div>
                </div>
            </Layout>
        );
    } catch (error) {
        console.error('Homepage error:', error);
        return c.html(<Layout><div class="container"><h1>Error loading skills</h1></div></Layout>, 500);
    }
});

// Browse skills
app.get('/skills', async (c) => {
    const db = drizzle(c.env.DB);
    const query = c.req.query('q');

    try {
        let allSkills;
        if (query) {
            allSkills = await db
                .select()
                .from(skills)
                .where(like(skills.name, `%${query}%`))
                .orderBy(desc(skills.createdAt));
        } else {
            allSkills = await db
                .select()
                .from(skills)
                .orderBy(desc(skills.createdAt));
        }

        return c.html(
            <Layout title={query ? `Search: ${query} - Skillz` : 'Browse Skills - Skillz'}>
                <div class="container">
                    <div style="margin: 3rem 0;">
                        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">
                            {query ? `Search Results for "${query}"` : 'Browse Skills'}
                        </h1>
                        <div class="search-box">
                            <input
                                type="search"
                                class="search-input"
                                placeholder="Search for skills..."
                                name="q"
                                value={query || ''}
                            />
                            <button class="btn" onclick="window.location.href=`/skills?q=${this.previousElementSibling.value}`">
                                Search
                            </button>
                        </div>
                    </div>

                    {allSkills.length === 0 ? (
                        <div style="text-align: center; padding: 4rem 0;">
                            <h2 style="color: var(--text-secondary);">No skills found</h2>
                            <p style="color: var(--text-secondary); margin-top: 1rem;">
                                Try a different search term
                            </p>
                        </div>
                    ) : (
                        <div class="grid">
                            {allSkills.map((skill) => (
                                <a href={`/skills/${skill.name}`} style="text-decoration: none;">
                                    <div class="card">
                                        <h3 class="card-title">{skill.name}</h3>
                                        <div class="card-meta">
                                            <span>by {skill.author}</span>
                                        </div>
                                        <p class="card-description">{skill.description}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </Layout>
        );
    } catch (error) {
        console.error('Browse error:', error);
        return c.html(<Layout><div class="container"><h1>Error loading skills</h1></div></Layout>, 500);
    }
});

// Skill detail page
app.get('/skills/:name', async (c) => {
    const name = c.req.param('name');
    const db = drizzle(c.env.DB);

    try {
        const skill = await db.select().from(skills).where(eq(skills.name, name)).limit(1);

        if (skill.length === 0) {
            return c.html(
                <Layout title="Skill Not Found - Skillz">
                    <div class="container">
                        <div style="text-align: center; padding: 4rem 0;">
                            <h1 style="font-size: 3rem; margin-bottom: 1rem;">404</h1>
                            <p style="font-size: 1.25rem; color: var(--text-secondary);">
                                Skill "{name}" not found
                            </p>
                            <a href="/skills" class="btn" style="display: inline-block; margin-top: 2rem;">
                                Browse Skills
                            </a>
                        </div>
                    </div>
                </Layout>,
                404
            );
        }

        const s = skill[0];

        // Get versions
        const skillVersions = await db
            .select()
            .from(versions)
            .where(eq(versions.skillId, s.id))
            .orderBy(desc(versions.createdAt));

        // Get tags
        const skillTags = await db
            .select()
            .from(tags)
            .where(eq(tags.skillId, s.id));

        // Get ratings
        const skillRatings = await db
            .select()
            .from(ratings)
            .where(eq(ratings.skillId, s.id))
            .orderBy(desc(ratings.createdAt));

        // Calculate average rating
        const avgRating = skillRatings.length > 0
            ? (skillRatings.reduce((sum, r) => sum + r.rating, 0) / skillRatings.length).toFixed(1)
            : 'N/A';

        // Get total downloads
        const totalDownloads = await db
            .select({ total: sql<number>`sum(${downloads.count})` })
            .from(downloads)
            .leftJoin(versions, eq(versions.id, downloads.versionId))
            .where(eq(versions.skillId, s.id));

        const downloadCount = totalDownloads[0]?.total || 0;

        return c.html(
            <Layout title={`${s.name} - Skillz`}>
                <div class="container" style="margin: 3rem auto;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 3rem;">
                        {/* Main content */}
                        <div>
                            <h1 style="font-size: 3rem; margin-bottom: 1rem;">{s.name}</h1>
                            <p style="font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 2rem;">
                                {s.description}
                            </p>

                            <div style="display: flex; gap: 2rem; margin-bottom: 2rem;">
                                <div>
                                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Author</div>
                                    <div style="font-size: 1.1rem; font-weight: 600;">{s.author}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-secondary); font-size: 0.9rem;">License</div>
                                    <div style="font-size: 1.1rem; font-weight: 600;">{s.license}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Downloads</div>
                                    <div style="font-size: 1.1rem; font-weight: 600;">{downloadCount}</div>
                                </div>
                                <div>
                                    <div style="color: var(--text-secondary); font-size: 0.9rem;">Rating</div>
                                    <div style="font-size: 1.1rem; font-weight: 600;">⭐ {avgRating}</div>
                                </div>
                            </div>

                            {skillTags.length > 0 && (
                                <div class="tags" style="margin-bottom: 3rem;">
                                    {skillTags.map((tag) => (
                                        <span class="tag">{tag.tag}</span>
                                    ))}
                                </div>
                            )}

                            <div style="background: var(--surface); padding: 2rem; border-radius: 12px; margin-bottom: 3rem;">
                                <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">Installation</h3>
                                <pre>skillz add {s.name}</pre>
                            </div>

                            {skillVersions.length > 0 && (
                                <div>
                                    <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Versions</h3>
                                    {skillVersions.map((version) => (
                                        <div style="background: var(--surface); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                <div>
                                                    <span style="font-weight: 700; font-size: 1.1rem;">{version.version}</span>
                                                    <span style="color: var(--text-secondary); margin-left: 1rem;">
                                                        {version.createdAt.toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <code>skillz add {s.name}@{version.version}</code>
                                            </div>
                                            {version.description && (
                                                <p style="margin-top: 0.5rem; color: var(--text-secondary);">
                                                    {version.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {skillRatings.length > 0 && (
                                <div style="margin-top: 3rem;">
                                    <h3 style="font-size: 1.5rem; margin-bottom: 1.5rem;">Reviews</h3>
                                    {skillRatings.map((rating) => (
                                        <div style="background: var(--surface); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                                <span>{'⭐'.repeat(rating.rating)}</span>
                                                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                                                    {rating.createdAt.toLocaleDateString()}
                                                </span>
                                            </div>
                                            {rating.review && <p style="color: var(--text-secondary);">{rating.review}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div>
                            <div style="background: var(--surface); padding: 1.5rem; border-radius: 12px; position: sticky; top: 2rem;">
                                <h4 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Links</h4>
                                <div style="display: flex; flex-direction: column; gap: 1rem;">
                                    {s.repository && (
                                        <a href={s.repository} target="_blank" style="color: var(--primary);">
                                            📦 Repository
                                        </a>
                                    )}
                                    {s.homepage && (
                                        <a href={s.homepage} target="_blank" style="color: var(--primary);">
                                            🏠 Homepage
                                        </a>
                                    )}
                                    <a href={`/users/${s.author}`} style="color: var(--primary);">
                                        👤 View author
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    } catch (error) {
        console.error('Skill detail error:', error);
        return c.html(<Layout><div class="container"><h1>Error loading skill</h1></div></Layout>, 500);
    }
});

// Docs page
app.get('/docs', (c) => {
    return c.html(
        <Layout title="Documentation - Skillz">
            <div class="container" style="margin: 3rem auto; max-width: 800px;">
                <h1 style="font-size: 3rem; margin-bottom: 2rem;">Documentation</h1>

                <section style="margin-bottom: 3rem;">
                    <h2 style="font-size: 2rem; margin-bottom: 1rem;">Getting Started</h2>
                    <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                        Skillz is a package manager for Claude Skills that makes it easy to discover,
                        install, and manage skills with dependency management.
                    </p>
                    <pre>
                        # Install the CLI
                        npm install -g @skillz/cli

                        # Or use directly
                        npx @skillz/cli init
                    </pre>
                </section>

                <section style="margin-bottom: 3rem;">
                    <h2 style="font-size: 2rem; margin-bottom: 1rem;">Commands</h2>

                    <div style="background: var(--surface); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;"><code>skillz init</code></h4>
                        <p style="color: var(--text-secondary);">Initialize a new skill project with skillz.yaml</p>
                    </div>

                    <div style="background: var(--surface); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;"><code>skillz add &lt;skill-name&gt;</code></h4>
                        <p style="color: var(--text-secondary);">Add a skill dependency to your project</p>
                    </div>

                    <div style="background: var(--surface); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;"><code>skillz install</code></h4>
                        <p style="color: var(--text-secondary);">Install all dependencies from skillz.yaml</p>
                    </div>

                    <div style="background: var(--surface); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;"><code>skillz list</code></h4>
                        <p style="color: var(--text-secondary);">List all installed skills</p>
                    </div>
                </section>

                <section>
                    <h2 style="font-size: 2rem; margin-bottom: 1rem;">skillz.yaml</h2>
                    <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                        The manifest file that defines your skill and its dependencies.
                    </p>
                    <pre>
                        manifest-version: "1"
                        name: my-skill
                        version: 1.0.0
                        description: My awesome Claude skill

                        skill:
                        main: SKILL.md

                        dependencies:
                        skills:
                        data-analyzer: "^1.0.0"
                        helper-skill:
                        git: https://github.com/user/helper
                    </pre>
                </section>
            </div>
        </Layout>
    );
});

export default app;
