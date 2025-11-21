import { getAssetFromKV, type Options } from "@cloudflare/kv-asset-handler";
// @ts-expect-error __STATIC_CONTENT_MANIFEST is not a valid import
import manifestJSON from "__STATIC_CONTENT_MANIFEST";

interface Env {
  __STATIC_CONTENT: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(request.url);

      // Debug: Check if env vars exist
      if (!env.__STATIC_CONTENT) {
        return new Response("Error: __STATIC_CONTENT is missing from env", { status: 500 });
      }

      const manifest = JSON.parse(manifestJSON);

      const options: Partial<Options> = {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: manifest,
      };

      try {
        return await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          options,
        );
      } catch (e) {
        // Fallback for SPA
        if (!url.pathname.includes(".")) {
          try {
            const indexRequest = new Request(new URL("/", request.url), request);
            return await getAssetFromKV(
              {
                request: indexRequest,
                waitUntil: ctx.waitUntil.bind(ctx),
              },
              options,
            );
          } catch (e2: unknown) {
            const errorMessage = e2 instanceof Error ? e2.message : String(e2);
            const keys = Object.keys(manifest).join(", ");
            return new Response(
              `App not found - index.html missing. Error: ${errorMessage}. Available assets: ${keys}`,
              { status: 404 },
            );
          }
        }
        throw e;
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      const stack = e instanceof Error ? e.stack : "";
      return new Response(`Worker Error: ${errorMessage}\nStack: ${stack}`, { status: 500 });
    }
  },
};
