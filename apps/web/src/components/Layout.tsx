import { html } from 'hono/html';

interface LayoutProps {
    title?: string;
    children: any;
}

export const Layout = ({ title = 'Skillz - Package Manager for Claude Skills', children }: LayoutProps) => {
    return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --secondary: #8b5cf6;
      --background: #0f172a;
      --surface: #1e293b;
      --surface-light: #334155;
      --text: #f1f5f9;
      --text-secondary: #cbd5e1;
      --border: #475569;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: var(--background);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    /* Header */
    header {
      background: linear-gradient(135deg, var(--surface) 0%, var(--background) 100%);
      border-bottom: 1px solid var(--border);
      padding: 1.5rem 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.8rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    nav {
      display: flex;
      gap: 2rem;
    }

    nav a {
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.3s;
    }

    nav a:hover {
      color: var(--primary);
    }

    /* Search Bar */
    .search-container {
      margin: 3rem 0;
    }

    .search-box {
      display: flex;
      gap: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .search-input {
      flex: 1;
      padding: 1rem 1.5rem;
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      font-size: 1rem;
      transition: all 0.3s;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }

    .btn {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.3s;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
    }

    /* Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
      margin: 3rem 0;
    }

    /* Card */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      opacity: 0;
      transition: opacity 0.3s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
      border-color: var(--primary);
    }

    .card:hover::before {
      opacity: 1;
    }

    .card-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text);
    }

    .card-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .card-description {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tag {
      padding: 0.25rem 0.75rem;
      background: var(--surface-light);
      border-radius: 6px;
      font-size: 0.85rem;
      color: var(--primary);
    }

    .stats {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    /* Hero */
    .hero {
      text-align: center;
      padding: 4rem 0;
    }

    .hero h1 {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero p {
      font-size: 1.25rem;
      color: var(--text-secondary);
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    /* Code */
    code {
      background: var(--surface-light);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
    }

    pre {
      background: var(--surface-light);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
    }

    /* Links */
    a {
      color: var(--primary);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
      
      .hero h1 {
        font-size: 2.5rem;
      }
      
      nav {
        gap: 1rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <div class="logo">📦 Skillz</div>
        <nav>
          <a href="/">Home</a>
          <a href="/skills">Browse</a>
          <a href="/docs">Docs</a>
          <a href="https://github.com/skillz/skillz" target="_blank">GitHub</a>
        </nav>
      </div>
    </div>
  </header>
  <main>
    ${children}
  </main>
</body>
</html>`;
};
