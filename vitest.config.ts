import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Vitest config — tests pures sur les libs (scoring, anti-cheat, anti-leak, xp).
// Pas de tests UI/RSC pour l'instant (ça vient avec @testing-library/react).
//
// Run :
//   pnpm test          → 1 run
//   pnpm test:watch    → watch mode
//   pnpm test:ui       → UI vitest (requires --reporter=html or @vitest/ui)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "supabase"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
