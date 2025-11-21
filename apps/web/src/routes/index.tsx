import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { api, type Skill } from '../lib/api';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [trendingSkills, setTrendingSkills] = React.useState<Skill[]>([]);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    api.fetchSkills({ limit: 6 }).then((data) => {
      setTrendingSkills(data.skills);
    }).catch((err) => {
      console.error('Failed to fetch trending skills:', err);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate({ to: '/skills', search: { q: search } });
    } else {
      navigate({ to: '/skills' });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Package Manager for Claude Skills
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Discover, share, and manage Claude Skills with dependencies, versioning, and a beautiful registry.
        </p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for skills..."
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '12px',
              border: '2px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Search
          </button>
        </form>
      </div>

      <section>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>🔥 Trending Skills</h2>
        {trendingSkills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: '12px' }}>
            No skills found yet. Be the first to publish one!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {trendingSkills.map((skill) => (
              <div
                key={skill.id}
                style={{
                  background: 'var(--surface)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{skill.name}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>by {skill.author}</span>
                  <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                  {skill.description || 'No description provided.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: '4rem', padding: '3rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', borderRadius: '16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Get Started</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Install the Skillz CLI to start using Claude Skills in your projects
        </p>
        <pre style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left', background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px' }}>
{`# Install the CLI
npm install -g @skillz/cli

# Initialize a new skill
skillz init

# Add a dependency
skillz add data-analyzer

# Install dependencies
skillz install`}
        </pre>
      </section>
    </div>
  );
}
