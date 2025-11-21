import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useSession, signOut } from "../lib/auth";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { data: session } = useSession();

  return (
    <>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link to="/" style={{ fontSize: "1.5rem", fontWeight: "bold", textDecoration: "none", color: "var(--text)" }}>
            📦 Skillz
          </Link>
          <Link to="/" style={{ textDecoration: "none", color: "var(--text)" }}>
            Home
          </Link>
          <Link to="/skills" style={{ textDecoration: "none", color: "var(--text)" }}>
            Browse
          </Link>
          <Link to="/docs" style={{ textDecoration: "none", color: "var(--text)" }}>
            Docs
          </Link>
        </div>
        <div>
          {session?.user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Link to="/dashboard" style={{ textDecoration: "none", color: "var(--text)" }}>
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                style={{
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                background: "var(--primary)",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
