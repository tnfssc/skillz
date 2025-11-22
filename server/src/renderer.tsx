import { jsxRenderer } from "hono/jsx-renderer";
import type { Child } from "hono/jsx";

declare module "hono" {
  interface ContextRenderer {
    (content: Child | Promise<Child>, props?: { title?: string }): Response | Promise<Response>;
  }
}

export const renderer = jsxRenderer(({ children, title }: {children?: Child; title?: string}) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} - Skillz` : "Skillz - Package Manager for AI Skills"}</title>
        <link rel="stylesheet" href="/static/style.css" />
        <link rel="icon" href="/static/logo.png" />
      </head>
      <body class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
});
