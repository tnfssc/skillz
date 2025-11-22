import * as React from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { api, type Skill } from "../lib/api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";

type SkillsSearch = {
  q?: string;
};

export const Route = createFileRoute("/skills")({
  component: SkillsPage,
  validateSearch: (search: Record<string, unknown>): SkillsSearch => {
    return {
      q: (search.q as string) || undefined,
    };
  },
});

function SkillsPage() {
  const search = useSearch({ from: "/skills" });
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState(search.q || "");

  React.useEffect(() => {
    setLoading(true);
    api
      .fetchSkills({ q: search.q })
      .then((data) => {
        setSkills(data.skills);
      })
      .catch((err) => {
        console.error("Failed to fetch skills:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [search.q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search param update would happen via navigation, but for now we just rely on the input
    // In a real app, we'd navigate to update the URL
    window.history.pushState(null, "", query ? `/skills?q=${encodeURIComponent(query)}` : "/skills");
    // Trigger a re-fetch manually or via router invalidation (simplified here)
    setLoading(true);
    api.fetchSkills({ q: query }).then((data) => {
        setSkills(data.skills);
        setLoading(false);
    });
  };

  return (
    <div className="container" style={{ padding: "4rem 1rem" }}>
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <h1 style={{ marginBottom: "1rem" }}>Browse Skills</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          Explore the collection of community-contributed Claude Skills.
        </p>
        
        <form onSubmit={handleSearch} style={{ maxWidth: "500px", margin: "0 auto", display: "flex", gap: "0.5rem" }}>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills..."
            style={{ height: "3rem" }}
          />
          <Button type="submit" style={{ height: "3rem" }}>Search</Button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
          Loading skills...
        </div>
      ) : skills.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
          No skills found matching your search.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {skills.map((skill) => (
            <Link
              key={skill.id}
              to="/skills/$name"
              params={{ name: skill.name }}
              style={{ textDecoration: "none" }}
            >
              <Card
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  e.currentTarget.style.borderColor = "var(--primary-500)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>{skill.name}</h3>
                </div>
                
                <p
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: "1.5rem",
                    flex: 1,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {skill.description || "No description provided."}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.875rem",
                    color: "var(--text-tertiary)",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "1rem",
                  }}
                >
                  <span>by {skill.author}</span>
                  <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
