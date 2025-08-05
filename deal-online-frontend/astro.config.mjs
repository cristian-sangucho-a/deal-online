// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  output: "server", // Renderizado del lado del servidor
  adapter: node({
    mode: "standalone", // Para Cloud Run
  }),
  // Removed vite.define - let Astro handle environment variables automatically
});
