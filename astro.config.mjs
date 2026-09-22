import { defineConfig } from "astro/config";

// Static output. The live globe is served by a Pages Function out of
// /functions, which Cloudflare Pages picks up from the repo root alongside the
// build output — so the site needs no SSR adapter and no server to keep warm.
export default defineConfig({
  site: "https://zonesteward.balian.dev",
  output: "static",
  build: { inlineStylesheets: "auto" },
  devToolbar: { enabled: false },
});
