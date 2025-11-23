import { Layout } from "../components/Layout";
import { Card } from "../components/Card";
import type { User } from "../types";

export function DocsPage({ user }: { user?: User }) {
  return (
    <Layout user={user}>
      <div class="container mx-auto px-4 py-8">
        <div class="flex gap-8">
          {/* Sidebar */}
          <aside class="w-64 flex-shrink-0 sticky top-20 self-start">
            <Card class="p-4">
              <h3 class="font-bold mb-4 pb-2 border-b border-slate-700">CLI Documentation</h3>
              <nav class="flex flex-col gap-2">
                <a
                  href="#installation"
                  class="px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  Installation
                </a>
                <a
                  href="#commands"
                  class="px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  Commands
                </a>
                <a
                  href="#configuration"
                  class="px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  Configuration
                </a>
                <a
                  href="#manifest"
                  class="px-3 py-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  Manifest (skillz.toon)
                </a>
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <main class="flex-1 min-w-0 space-y-12">
            {/* Installation */}
            <section id="installation">
              <h1 class="text-4xl font-bold mb-4">Installation</h1>
              <p class="text-lg text-slate-400 mb-8">
                The Skillz CLI is the primary tool for managing your AI skills and dependencies.
              </p>

              <h2 class="text-2xl font-semibold mb-4">Automated Install (Linux/macOS)</h2>
              <Card class="mb-8">
                <p class="text-slate-400 mb-4">The easiest way to install Skillz is using the installation script.</p>
                <pre class="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                  <code class="text-primary">curl -fsSL https://raw.githubusercontent.com/tnfssc/skillz/refs/heads/develop/install.sh | sh</code>
                </pre>
              </Card>

              <h2 class="text-2xl font-semibold mb-4">From Source</h2>
              <Card class="mb-8">
                <p class="text-slate-400 mb-4">If you have Go installed, you can install directly from the source.</p>
                <pre class="bg-slate-950 p-4 rounded-lg overflow-x-auto">
                  <code class="text-primary">go install github.com/tnfssc/skillz/cli/cmd/skillz@latest</code>
                </pre>
              </Card>

              <h2 class="text-2xl font-semibold mb-4">Prerequisites</h2>
              <ul class="list-disc list-inside text-slate-400 space-y-2">
                <li>Go 1.24.1 or higher (for source install)</li>
                <li>Git (for downloading dependencies)</li>
              </ul>
            </section>

            {/* Commands */}
            <section id="commands">
              <h1 class="text-4xl font-bold mb-4">Commands</h1>
              <p class="text-lg text-slate-400 mb-8">Reference guide for the available CLI commands.</p>

              <div class="space-y-6">
                <CommandCard
                  command="skillz init"
                  description="Initialize a new Skillz project in the current directory. Creates a skillz.toon manifest and a SKILL.md template."
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
                  description="Install all dependencies defined in skillz.toon. Generates skillz.lock."
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
                <CommandCard command="skillz list" description="List all installed skills and their versions." />
                <CommandCard command="skillz search <query>" description="Search the registry for skills." />
                <CommandCard command="skillz info <name>" description="Show detailed information about a skill." />
                <CommandCard command="skillz remove <name>" description="Remove a skill dependency from skillz.toon." />
              </div>
            </section>

            {/* Configuration */}
            <section id="configuration">
              <h1 class="text-4xl font-bold mb-4">Configuration</h1>
              <p class="text-lg text-slate-400 mb-8">The CLI can be configured via environment variables.</p>

              <Card class="overflow-hidden p-0">
                <table class="w-full border-collapse">
                  <thead class="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th class="p-4 text-left font-semibold">Variable</th>
                      <th class="p-4 text-left font-semibold">Description</th>
                      <th class="p-4 text-left font-semibold">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-slate-800">
                      <td class="p-4 font-mono text-sm text-primary">SKILLZ_REGISTRY_URL</td>
                      <td class="p-4 text-slate-400">URL of the Skillz registry API</td>
                      <td class="p-4 font-mono text-sm text-slate-500">https://api.skillz.lat</td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            </section>

            {/* Manifest */}
            <section id="manifest">
              <h1 class="text-4xl font-bold mb-4">Manifest Format</h1>
              <p class="text-lg text-slate-400 mb-8">
                Skillz uses the <strong>TOON</strong> format for configuration in skillz.toon.
              </p>

              <Card>
                <pre class="bg-slate-950 p-6 rounded-lg overflow-x-auto text-sm leading-relaxed">
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
            </section>
          </main>
        </div>
      </div>
    </Layout>
  );
}

function CommandCard({ command, description, usage }: { command: string; description: string; usage?: string }) {
  return (
    <Card>
      <h3 class="text-lg font-mono text-primary mb-2">{command}</h3>
      <p class="text-slate-400 mb-4">{description}</p>
      {usage && (
        <div class="mt-4">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Usage:</span>
          <code class="block bg-slate-950 p-3 rounded text-sm whitespace-pre-wrap">{usage}</code>
        </div>
      )}
    </Card>
  );
}
