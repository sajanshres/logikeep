import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    coverage: {
      provider: "v8",
      include: ["convex/**/*.ts", "src/auth.ts"],
      exclude: ["convex/_generated/**", "convex/seed.ts", "convex/migrate.ts"],
    },
  },
});
