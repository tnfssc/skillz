import { Layout } from "../components/Layout";
import { Card } from "../components/Card";
import type { Skill, SkillVersion, User } from "../types";
import { Badge } from "../components/Badge";

export function SkillDetailPage({ skill, versions, user }: { skill: Skill; versions: SkillVersion[]; user?: User }) {
  const latestVersion = versions[0];

  return (
    <Layout user={user}>
      <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-4">
            <h1 class="text-4xl font-bold">{skill.name}</h1>
            <Badge variant="secondary">{latestVersion?.version || "N/A"}</Badge>
          </div>
          <p class="text-slate-400 text-lg">
            {skill.description || "No description provided."}
          </p>
          <div class="flex items-center gap-6 mt-4 text-sm text-slate-500">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                {skill.author[0].toUpperCase()}
              </div>
              <span>{skill.author}</span>
            </div>
            <span>Last updated: {new Date(skill.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <Card>
              <h2 class="text-2xl font-semibold mb-4">Installation</h2>
              <pre class="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                <code class="text-primary">skillz add {skill.name}</code>
              </pre>
            </Card>

            {latestVersion?.manifest && (
              <Card>
                <h2 class="text-2xl font-semibold mb-4">Manifest</h2>
                <pre class="bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{JSON.stringify(latestVersion.manifest, null, 2)}</code>
                </pre>
              </Card>
            )}
          </div>

          <div class="space-y-6">
            <Card>
              <h3 class="text-lg font-semibold mb-4">Versions</h3>
              <div class="space-y-2">
                {versions.slice(0, 10).map((version) => (
                  <div class="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <span class="font-mono text-sm">{version.version}</span>
                    <span class="text-xs text-slate-500">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 class="text-lg font-semibold mb-4">Info</h3>
              <dl class="space-y-3 text-sm">
                <div>
                  <dt class="text-slate-500 mb-1">License</dt>
                  <dd class="font-mono">MIT</dd>
                </div>
                <div>
                  <dt class="text-slate-500 mb-1">Created</dt>
                  <dd>{new Date(skill.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
