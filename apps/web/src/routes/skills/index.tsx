import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api, type Skill } from "../../lib/api";

export const Route = createFileRoute("/skills/")({
  component: SkillsPage,
});

function SkillsPage() {
  const [skills, setSkills] = React.useState<Skill[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const loadSkills = async (q?: string) => {
    setLoading(true);
    try {
      const data = await api.fetchSkills({ q });
      setSkills(data.skills);
    } catch (error) {
      console.error("Failed to load skills:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSkills();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSkills(search);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "2rem" }}>Browse Skills</h1>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for skills..."
          style={{
            flex: 1,
            padding: "1rem",
            borderRadius: "12px",
            border: "2px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
          }}
        />
        <button
          type="submit"
          style={{
            background: "var(--primary)",
            color: "white",
            border: "none",
            padding: "1rem 2rem",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Search
        </button>
      </form>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>Loading skills...</div>
      ) : skills.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
          No skills found. Try a different search term.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {skills.map((skill) => (
            <Link
              key={skill.id}
              to="/skills/$name"
              params={{ name: skill.name }}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  background: "var(--surface)",
                  padding: "1.5rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  transition: "transform 0.2s",
                  cursor: "pointer",
                  height: "100%",
                }}
              >
                <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{skill.name}</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  {skill.description || "No description provided."}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>by {skill.author}</span>
                  <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
