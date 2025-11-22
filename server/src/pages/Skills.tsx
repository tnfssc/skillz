import { Layout } from "../components/Layout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import type { Skill, User } from "../types";

export function SkillsPage({ skills, query, user }: { skills: Skill[]; query?: string; user?: User }) {
  return (
    <Layout user={user}>
      <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-4">Explore Skills</h1>
          <p class="text-slate-400 text-lg mb-6">
            Discover AI skills and capabilities to enhance your agents.
          </p>

          <form action="/skills" method="get" class="max-w-2xl">
            <div class="relative">
              <Input
                type="search"
                name="q"
                value={query || ""}
                placeholder="Search skills..."
                class="h-12 pl-4 pr-24"
              />
              <Button
                type="submit"
                size="sm"
                class="absolute right-2 top-2 h-8"
              >
                Search
              </Button>
            </div>
          </form>
        </div>

        {skills.length === 0 ? (
          <Card class="text-center py-16">
            <p class="text-slate-400 mb-4">No skills found.</p>
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
                    <h3 class="text-xl font-semibold group-hover:text-primary transition-colors">
                      {skill.name}
                    </h3>
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
      </div>
    </Layout>
  );
}
