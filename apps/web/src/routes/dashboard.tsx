import { createFileRoute, redirect } from "@tanstack/react-router";
import * as React from "react";
import { authClient, apiKey } from "../lib/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data?.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardPage,
});

interface ApiKey {
  id: string;
  name: string;
  key?: string; // Only present when first created
  createdAt: Date | string;
}

function DashboardPage() {
  const { data: session } = authClient.useSession();
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [newKey, setNewKey] = React.useState<string | null>(null);
  const [keyName, setKeyName] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const result = await apiKey.list();
      if (result.data) {
        setKeys(result.data as unknown as ApiKey[]);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async () => {
    if (!keyName.trim()) {
      alert("Please enter a name for the API key");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiKey.create({
        name: keyName,
      });

      if (result.data) {
        setNewKey(result.data.key);
        setKeyName("");
        await fetchKeys();
      } else if (result.error) {
        alert(`Failed to generate key: ${result.error.message}`);
      }
    } catch (error) {
      console.error("Failed to generate API key:", error);
      alert("Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }

    try {
      await apiKey.delete({ keyId });
      await fetchKeys();
    } catch (error) {
      console.error("Failed to delete API key:", error);
      alert("Failed to delete API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("API key copied to clipboard!");
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "2rem" }}>Dashboard</h1>

      <section style={{ background: "var(--surface)", padding: "2rem", borderRadius: "12px", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Profile</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Name</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{session?.user?.name || "N/A"}</div>
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Email</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>{session?.user?.email || "N/A"}</div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--surface)", padding: "2rem", borderRadius: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem" }}>API Keys</h2>
        </div>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          API keys are used to authenticate the Skillz CLI. Keep them secure!
        </p>

        {/* Generate New Key Form */}
        <div
          style={{ background: "var(--surface-light)", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}
              >
                Key Name
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., cli-key, ci-cd-key"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "2px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                }}
              />
            </div>
            <button
              onClick={handleGenerateKey}
              disabled={isGenerating || !keyName.trim()}
              style={{
                background: isGenerating || !keyName.trim() ? "var(--border)" : "var(--primary)",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: isGenerating || !keyName.trim() ? "not-allowed" : "pointer",
                fontWeight: "bold",
                opacity: isGenerating || !keyName.trim() ? 0.5 : 1,
              }}
            >
              {isGenerating ? "Generating..." : "Generate Key"}
            </button>
          </div>
        </div>

        {/* New Key Modal */}
        {newKey && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                padding: "2rem",
                borderRadius: "12px",
                maxWidth: "600px",
                width: "90%",
              }}
            >
              <h3 style={{ marginBottom: "1rem" }}>🎉 API Key Generated!</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                ⚠️ <strong>Copy this key now!</strong> It won't be shown again.
              </p>
              <div
                style={{
                  background: "var(--background)",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                }}
              >
                {newKey}
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  style={{
                    flex: 1,
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={() => setNewKey(null)}
                  style={{
                    flex: 1,
                    background: "var(--border)",
                    color: "var(--text)",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys List */}
        {isLoading ? (
          <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
            No API keys yet. Generate one to get started with the CLI.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {keys.map((key) => (
              <div
                key={key.id}
                style={{
                  background: "var(--background)",
                  padding: "1rem",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{key.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  style={{
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
