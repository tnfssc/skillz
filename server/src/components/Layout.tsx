import { PropsWithChildren } from "hono/jsx";
import type { User } from "../types";

export function Layout({ children, user }: PropsWithChildren<{ user?: User }>) {
  return (
    <>
      <header class="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-8">
            <a
              href="/"
              class="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity"
            >
              <img src="/static/logo.png" alt="Skillz" class="w-8 h-8" />
              <span>Skillz</span>
            </a>
            <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="/skills" class="text-slate-400 hover:text-white transition-colors">
                Explore
              </a>
              <a href="/docs" class="text-slate-400 hover:text-white transition-colors">
                Documentation
              </a>
            </nav>
          </div>

          <div class="flex items-center gap-4">
            {user ? (
              <div class="flex items-center gap-4">
                <span class="text-sm text-slate-400 hidden sm:inline-block">{user.email}</span>
                <a href="/dashboard" class="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Dashboard
                </a>
              </div>
            ) : (
              <div class="flex items-center gap-4">
                <a href="/login" class="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Sign In
                </a>
                <a
                  href="/docs"
                  class="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
                >
                  Get Started
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main class="flex-1">{children}</main>

      <footer class="border-t border-slate-800 bg-slate-950 py-12 mt-20">
        <div class="container mx-auto px-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="col-span-1 md:col-span-2">
              <a href="/" class="flex items-center gap-2 font-bold text-xl tracking-tight mb-4">
                <img src="/static/logo.png" alt="Skillz" class="w-6 h-6 grayscale opacity-50" />
                <span class="text-slate-400">Skillz</span>
              </a>
              <p class="text-slate-500 text-sm max-w-xs leading-relaxed">
                The package manager for AI skills. Discover, install, and manage capabilities for your agents.
              </p>
            </div>
            <div>
              <h4 class="font-semibold text-slate-300 mb-4">Resources</h4>
              <ul class="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="/docs" class="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="/skills" class="hover:text-white transition-colors">
                    Registry
                  </a>
                </li>
                <li>
                  <a href="/docs#cli" class="hover:text-white transition-colors">
                    CLI Reference
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 class="font-semibold text-slate-300 mb-4">Community</h4>
              <ul class="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="https://github.com/tnfssc/skillz" target="_blank" class="hover:text-white transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" class="hover:text-white transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" class="hover:text-white transition-colors">
                    Twitter
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div class="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <p>© 2025 Skillz. All rights reserved.</p>
            <div class="flex gap-6">
              <a href="#" class="hover:text-slate-400">
                Privacy Policy
              </a>
              <a href="#" class="hover:text-slate-400">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
