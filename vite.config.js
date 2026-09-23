import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";

/**
 * The vendored odontogram (`src/odontogram/lib`) stamps the generating version
 * into its PDF report footer through a build-time constant. Kept here rather
 * than in the module so the module folder stays a verbatim drop-in.
 */
const pkg = JSON.parse(readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));

/** Where /api goes. Named so the proxy's error message can quote it. */
const API_TARGET = process.env.VITE_API_PROXY ?? "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  server: {
    port: 5180,
    open: true,

    /**
     * The API, same-origin.
     *
     * Not a convenience. The session is an access token held in memory plus an
     * httpOnly refresh cookie, and a reload throws the token away and rebuilds
     * the session from the cookie. Pointed straight at `http://localhost:8080`
     * that cookie is cross-site, so the browser will only send it on
     * `SameSite=None; Secure` — which it refuses over plain http. The result is
     * a dev setup where signing in works and reloading the page signs you out.
     *
     * Behind this proxy the browser sees one origin, the cookie is first-party,
     * and CORS never enters into it — which is also how the app is deployed,
     * with a CDN in front of both. Override the target with VITE_API_PROXY.
     */
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: false,

        /**
         * Say what actually went wrong when the API is not running.
         *
         * Without this, a dev server with no backend behind it prints
         * `AggregateError [ECONNREFUSED]` and a Node stack frame in
         * `internalConnectMultiple`, once per request — and the browser shows a
         * failed sign-in, which reads as a credential problem rather than as a
         * missing process. That is a genuinely misleading five minutes, and it
         * has cost them at least once.
         *
         * The reply is a real 503 with a JSON body in the shape `api/errors.js`
         * already understands, so the screen shows a sentence instead of
         * hanging on a socket error.
         */
        configure: (proxy) => {
          let warned = false;

          proxy.on("error", (error, req, res) => {
            const down = error.code === "ECONNREFUSED" || error.code === "ECONNRESET";

            /* Once per run, not once per request — a page load makes several
               and three identical stack traces are not three times as useful. */
            if (down && !warned) {
              warned = true;
              console.error(
                `\n  The API is not answering on ${API_TARGET}.\n` +
                  "  Start it with:  npm start   (in odenta-newera-2026-backend)\n" +
                  "  Or point this proxy elsewhere with VITE_API_PROXY.\n"
              );
            }
            if (!down) console.error(`  [proxy] ${req?.url ?? ""} — ${error.message}`);

            if (res && !res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(503, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: down
                    ? "The API is not running. Start the backend and try again."
                    : "The API could not be reached.",
                  code: "api_unreachable",
                })
              );
            } else if (res?.destroy) {
              /* A websocket or an already-streaming response: nothing useful
                 left to say over the wire, so close it rather than hang. */
              res.destroy();
            }
          });

          /* The happy path, printed once, so it is obvious which backend this
             dev server is actually talking to. */
          proxy.on("proxyRes", () => {
            warned = false;
          });
        },
      },
    },
  },
});
