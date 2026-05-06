import cloudflare from "@astrojs/cloudflare";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import agents from "agents/vite";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "compile",
    remoteBindings: false,
  }),
  integrations: [svelte()],
  vite: {
    plugins: [agents()],
  },
});
