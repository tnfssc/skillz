import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api, type UserProfile } from "../../lib/api";

export const Route = createFileRoute("/users/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    api
      .fetchUser(username)
      .then(setUser)
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user profile");
      })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  if (error || !user) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem", textAlign: "center", color: "red" }}>
        {error || "User not found"}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Profile Header */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        {user.image && (
          <img
            src={user.image}
            alt={user.name}
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "1rem",
              border: "4px solid var(--border)",
            }}
          />
        )}
        {!user.image && (
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "var(--primary)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              border: "4px solid var(--border)",
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{user.name}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>{user.email}</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Published Skills Section */}
      <div>
        <h2 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Published Skills ({user.skills.length})</h2>

        {user.skills.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              color: "var(--text-secondary)",
              background: "var(--surface)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            No skills published yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {user.skills.map((skill) => (
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
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>{skill.name}</h3>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      marginBottom: "1rem",
                      lineHeight: "1.5",
                      minHeight: "3rem",
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
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>{skill.license || "MIT"}</span>
                    <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
