import * as React from 'react';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { api, type Skill, type SkillVersion } from '../../lib/api';

export const Route = createFileRoute('/skills/$name')({
  component: SkillDetailsPage,
});

function SkillDetailsPage() {
  const { name } = useParams({ from: '/skills/$name' });
  const [skill, setSkill] = React.useState<(Skill & { versions: SkillVersion[] }) | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'readme' | 'versions' | 'dependencies'>('readme');

  React.useEffect(() => {
    setLoading(true);
    api.fetchSkill(name)
      .then(setSkill)
      .catch((err) => {
        console.error('Failed to fetch skill:', err);
        setError('Failed to load skill details');
      })
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', textAlign: 'center', color: 'red' }}>
        {error || 'Skill not found'}
      </div>
    );
  }

  const latestVersion = skill.versions[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{skill.name}</h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {skill.description}
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
              <span>v{latestVersion?.version}</span>
              <span>•</span>
              <span>by {skill.author}</span>
              <span>•</span>
              <span>{skill.license || 'MIT'}</span>
              <span>•</span>
              <span>{new Date(latestVersion?.createdAt || skill.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          
          {/* Install Card */}
          <div style={{ 
            background: 'var(--surface)', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            border: '1px solid var(--border)',
            minWidth: '300px'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
              Install
            </h3>
            <div style={{ 
              background: '#1e1e1e', 
              color: '#fff', 
              padding: '1rem', 
              borderRadius: '8px', 
              fontFamily: 'monospace',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <span>skillz add {skill.name}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(`skillz add ${skill.name}`)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
            
            {/* Download Button */}
            <a 
              href={latestVersion?.tarballUrl}
              download
              style={{
                display: 'block',
                background: 'var(--primary)',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: 'bold',
                marginBottom: '1rem',
                cursor: 'pointer'
              }}
            >
              ⬇️ Download v{latestVersion?.version}
            </a>
            
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <a href={skill.repository || '#'} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'block', marginBottom: '0.5rem' }}>
                GitHub Repository ↗
              </a>
              <a href={skill.homepage || '#'} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'block' }}>
                Homepage ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {(['readme', 'versions', 'dependencies'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '1rem 0',
                fontSize: '1rem',
                fontWeight: 500,
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'readme' && (
          <div style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {skill.description || 'No README available.'}
            </pre>
          </div>
        )}

        {activeTab === 'versions' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {skill.versions.map((v) => (
              <div key={v.version} style={{ 
                padding: '1rem', 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 'bold', marginRight: '1rem' }}>v{v.version}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <a href={v.tarballUrl} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  Download .tgz
                </a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            No dependencies listed.
          </div>
        )}
      </div>
    </div>
  );
}
