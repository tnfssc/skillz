import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import type { Skill, User } from "../types";
import { Input } from "../components/Input";

export function HomePage({ skills, user }: { skills: Skill[]; user?: User }) {
  return (
    <Layout user={user}>
      {/* Hero Section */}
      <section class="py-24 px-4 text-center bg-gradient-to-b from-primary/10 via-transparent to-transparent">
        <div class="container mx-auto max-w-5xl">
          <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            The Package Manager for <br />
            Skillz
          </h1>
          <p class="text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover, share, and manage Skillz with dependencies, versioning, and a beautiful registry.
          </p>

          <form action="/skills" method="get" class="max-w-xl mx-auto mb-8">
            <div class="relative">
              <Input
                type="search"
                name="q"
                placeholder="Search for skills..."
                class="h-14 pl-6 pr-32 text-base rounded-full shadow-2xl border-slate-700/50"
              />
              <Button type="submit" class="absolute right-2 top-2 h-10 rounded-full">
                Search
              </Button>
            </div>
          </form>

          <div class="flex flex-wrap gap-4 justify-center">
            <a href="/docs">
              <Button variant="outline">Read Documentation</Button>
            </a>
            <a href="/skills">
              <Button variant="ghost">Browse All Skills →</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section class="container mx-auto px-4 py-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold">🔥 Trending Skills</h2>
          <a href="/skills">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </a>
        </div>

        {skills.length === 0 ? (
          <Card class="text-center py-16">
            <p class="text-slate-400 mb-4">No skills found yet. Be the first to publish one!</p>
            <a href="/docs">
              <Button variant="outline">Learn How to Publish</Button>
            </a>
          </Card>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <a href={`/skills/${skill.name}`} class="block group">
                <Card class="h-full flex flex-col transition-all hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1">
                  <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-semibold group-hover:text-primary transition-colors">{skill.name}</h3>
                  </div>

                  <p class="text-slate-400 mb-6 flex-1 line-clamp-3">
                    {skill.description || "No description provided."}
                  </p>

                  <div class="flex justify-between items-center pt-4 border-t border-slate-700/50 text-sm text-slate-500">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                        {skill.author[0].toUpperCase()}
                      </div>
                      <span>{skill.author}</span>
                    </div>
                    <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section class="container mx-auto px-4 py-16">
        <div class="bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-2xl p-12 text-center">
          <h2 class="text-3xl font-bold mb-4">Ready to Build?</h2>
          <p class="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Install the Skillz CLI and start publishing your own intelligence packages today.
          </p>

          <div class="inline-block bg-slate-950 border border-slate-800 rounded-lg p-6 shadow-2xl">
            <code class="text-primary font-mono">curl -fsSL https://skillz.lat/install.sh | sh</code>
          </div>
        </div>
      </section>
    </Layout>
  );
}
