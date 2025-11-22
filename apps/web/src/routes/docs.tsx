import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "../components/Card";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});

function DocsPage() {
  const [activeSection, setActiveSection] = useState("installation");

  return (
    <div className="container" style={{ display: "flex", gap: "2rem", padding: "2rem 0", alignItems: "flex-start" }}>
      {/* Sidebar */}
      <aside style={{ width: "250px", position: "sticky", top: "6rem", flexShrink: 0 }}>
        <Card style={{ padding: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
            CLI Documentation
          </h3>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <SidebarButton
              id="installation"
              label="Installation"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
            <SidebarButton
              id="commands"
              label="Commands"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
            <SidebarButton
              id="configuration"
              label="Configuration"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
            <SidebarButton
              id="manifest"
              label="Manifest (skillz.toon)"
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          </nav>
        </Card>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {activeSection === "installation" && <InstallationContent />}
        {activeSection === "commands" && <CommandsContent />}
        {activeSection === "configuration" && <ConfigurationContent />}
        {activeSection === "manifest" && <ManifestContent />}
      </main>
    </div>
  );
}

function SidebarButton({ id, label, activeSection, setActiveSection }: { id: string; label: string; activeSection: string; setActiveSection: (id: string) => void }) {
  return (
    <button
      onClick={() => setActiveSection(id)}
      style={{
        textAlign: "left",
        padding: "0.5rem",
        borderRadius: "6px",
        background: activeSection === id ? "var(--surface-light)" : "transparent",
        color: activeSection === id ? "var(--primary)" : "var(--text-secondary)",
        border: "none",
        cursor: "pointer",
        fontWeight: activeSection === id ? "600" : "400",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

function InstallationContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <section>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Installation</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          The Skillz CLI is the primary tool for managing your AI skills and dependencies.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Automated Install (Linux/macOS)</h2>
        <Card style={{ padding: "1.5rem" }}>
          <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
            The easiest way to install Skillz is using the installation script.
          </p>
          <pre style={{ background: "var(--background)", padding: "1rem", borderRadius: "8px", overflowX: "auto" }}>
            <code>curl -fsSL https://skillz.lat/install.sh | sh</code>
          </pre>
        </Card>
      </section>

      <section>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>From Source</h2>
        <Card style={{ padding: "1.5rem" }}>
          <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
            If you have Go installed, you can install directly from the source.
          </p>
          <pre style={{ background: "var(--background)", padding: "1rem", borderRadius: "8px", overflowX: "auto" }}>
            <code>go install github.com/tnfssc/skillz/cli/cmd/skillz@latest</code>
          </pre>
        </Card>
      </section>

      <section>
        <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Prerequisites</h2>
        <ul style={{ listStyle: "inside", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          <li>Go 1.24.1 or higher (for source install)</li>
          <li>Git (for downloading dependencies)</li>
        </ul>
      </section>
    </div>
  );
}

function CommandsContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <section>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Commands</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          Reference guide for the available CLI commands.
        </p>
      </section>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <CommandCard
          command="skillz init"
          description="Initialize a new Skillz project in the current directory. Creates a `skillz.toon` manifest and a `SKILL.md` template."
        />
        <CommandCard
          command="skillz add <name|git-url>"
          description="Add a skill dependency. Supports registry packages or Git URLs."
          usage={`skillz add browser-use
skillz add https://github.com/user/repo.git
skillz add -D my-dev-skill`}
        />
        <CommandCard
          command="skillz install"
          description="Install all dependencies defined in `skillz.toon`. Generates `skillz.lock`."
        />
        <CommandCard
          command="skillz login"
          description="Authenticate with the registry using an API token."
          usage={`skillz login --token <your-token>
# or interactive mode:
skillz login`}
        />
        <CommandCard
          command="skillz publish"
          description="Publish the current package to the registry. Requires authentication."
        />
        <CommandCard
          command="skillz list"
          description="List all installed skills and their versions."
        />
        <CommandCard
          command="skillz search <query>"
          description="Search the registry for skills."
        />
        <CommandCard
          command="skillz info <name>"
          description="Show detailed information about a skill."
        />
        <CommandCard
          command="skillz remove <name>"
          description="Remove a skill dependency from `skillz.toon`."
        />
      </div>
    </div>
  );
}

function CommandCard({ command, description, usage }: { command: string; description: string; usage?: string }) {
  return (
    <Card style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1.25rem", fontFamily: "monospace", marginBottom: "0.5rem", color: "var(--primary)" }}>{command}</h3>
      <p style={{ color: "var(--text-secondary)", marginBottom: usage ? "1rem" : "0" }}>{description}</p>
      {usage && (
        <div style={{ marginTop: "1rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "var(--text-tertiary)", display: "block", marginBottom: "0.25rem" }}>Usage:</span>
          <code style={{ background: "var(--background)", padding: "0.5rem", borderRadius: "4px", fontSize: "0.9rem", display: "block", whiteSpace: "pre-wrap" }}>{usage}</code>
        </div>
      )}
    </Card>
  );
}

function ConfigurationContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <section>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Configuration</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          The CLI can be configured via environment variables.
        </p>
      </section>

      <Card style={{ padding: "0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--surface-light)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "1rem", fontWeight: "600" }}>Variable</th>
              <th style={{ padding: "1rem", fontWeight: "600" }}>Description</th>
              <th style={{ padding: "1rem", fontWeight: "600" }}>Default</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "1rem", borderBottom: "1px solid var(--border)", fontFamily: "monospace" }}>SKILLZ_REGISTRY_URL</td>
              <td style={{ padding: "1rem", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>URL of the Skillz registry API</td>
              <td style={{ padding: "1rem", borderBottom: "1px solid var(--border)", fontFamily: "monospace", color: "var(--text-tertiary)" }}>https://api.skillz.lat</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ManifestContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <section>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Manifest Format</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
          Skillz uses the <strong>TOON</strong> format for configuration in `skillz.toon`.
        </p>
      </section>

      <Card style={{ padding: "1.5rem" }}>
        <pre style={{ background: "var(--background)", padding: "1rem", borderRadius: "8px", overflowX: "auto", fontSize: "0.9rem", lineHeight: "1.5" }}>
{`manifest-version: 1
name: my-agent
version: 1.0.0
description: A helpful AI agent
author: Jane Doe
license: MIT

skill:
  main: SKILL.md
  requires:
    - python
  exports:
    - analyze

dependencies:
  skills:
    # Registry dependency
    browser-use: ^1.0.0

    # Git dependency
    git-helper:
      git: https://github.com/user/git-helper.git
      ref: main

dev-dependencies:
  skills:
    test-runner: ^0.5.0

scripts:
  test: skillz run test-runner
  start: python agent.py

constraints:
  os:
    - linux
    - darwin`}
        </pre>
      </Card>
    </div>
  );
}
