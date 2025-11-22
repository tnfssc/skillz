import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { api, type Skill } from "../lib/api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [trendingSkills, setTrendingSkills] = React.useState<Skill[]>([]);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    api
      .fetchSkills({ limit: 6 })
      .then((data) => {
        setTrendingSkills(data.skills);
      })
      .catch((err) => {
        console.error("Failed to fetch trending skills:", err);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate({ to: "/skills", search: { q: search } });
    } else {
      navigate({ to: "/skills" });
    }
  };

  return (
    <div style={{ paddingBottom: "4rem" }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "6rem 0",
          textAlign: "center",
          background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)",
        }}
      >
        <div className="container">
          <h1 style={{ marginBottom: "1.5rem", maxWidth: "800px", margin: "0 auto 1.5rem" }}>
            The Package Manager for <br /> Claude Skills
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              color: "var(--text-secondary)",
              maxWidth: "600px",
              margin: "0 auto 3rem",
              lineHeight: 1.6,
            }}
          >
            Discover, share, and manage Claude Skills with dependencies, versioning, and a beautiful registry.
          </p>

          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              gap: "0.5rem",
              maxWidth: "500px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for skills..."
              style={{
                height: "3.5rem",
                paddingLeft: "1.5rem",
                fontSize: "1rem",
                borderRadius: "var(--radius-full)",
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--border-hover)",
              }}
            />
            <Button
              type="submit"
              size="lg"
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "0.5rem",
                height: "2.5rem",
                borderRadius: "var(--radius-full)",
                padding: "0 1.5rem",
              }}
            >
              Search
            </Button>
          </form>

          <div style={{ marginTop: "3rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link to="/docs">
              <Button variant="outline">Read Documentation</Button>
            </Link>
            <Link to="/skills">
              <Button variant="ghost">Browse All Skills →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="container" style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2rem" }}>🔥 Trending Skills</h2>
          <Link to="/skills">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {trendingSkills.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
            <p>No skills found yet. Be the first to publish one!</p>
            <Link to="/docs">
              <Button variant="outline" style={{ marginTop: "1rem" }}>Learn How to Publish</Button>
            </Link>
          </Card>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "2rem",
            }}
          >
            {trendingSkills.map((skill) => (
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
                    e.currentTarget.style.boxShadow = "var(--shadow-xl)";
                    e.currentTarget.style.borderColor = "var(--primary-500)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--primary-400), var(--secondary-400))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                        }}
                      >
                        {skill.author[0].toUpperCase()}
                      </div>
                      <span>{skill.author}</span>
                    </div>
                    <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container" style={{ marginTop: "6rem" }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
            borderRadius: "var(--radius-xl)",
            padding: "4rem 2rem",
            textAlign: "center",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <h2 style={{ marginBottom: "1rem" }}>Ready to Build?</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
            Install the Skillz CLI and start publishing your own Claude Skills today.
          </p>
          
          <div
            style={{
              background: "var(--slate-900)",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              display: "inline-block",
              textAlign: "left",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <code style={{ color: "var(--primary-300)", fontFamily: "var(--font-mono)" }}>
              curl -fsSL https://skillz.lat/install.sh | sh
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
