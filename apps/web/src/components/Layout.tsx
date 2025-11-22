import { Link, Outlet } from "@tanstack/react-router";
import { useSession, signOut } from "../lib/auth";
import { Button } from "./Button";

export const Layout = () => {
  const { data: session } = useSession();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container" style={{ height: "4rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <img src="/logo.png" alt="Skillz Logo" style={{ height: "32px", width: "32px" }} />
              <span style={{ fontSize: "1.25rem", fontWeight: "bold", background: "linear-gradient(to right, var(--primary-400), var(--secondary-400))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Skillz
              </span>
            </Link>
            <nav style={{ display: "flex", gap: "1.5rem" }}>
              <Link to="/" activeProps={{ style: { color: "var(--primary)" } }} style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                Home
              </Link>
              <Link to="/skills" activeProps={{ style: { color: "var(--primary)" } }} style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                Browse
              </Link>
              <Link to="/docs" activeProps={{ style: { color: "var(--primary)" } }} style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                Docs
              </Link>
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {session?.user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 0", marginTop: "auto", backgroundColor: "var(--surface)" }}>
        <div className="container" style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          <p>&copy; {new Date().getFullYear()} Skillz Registry. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
