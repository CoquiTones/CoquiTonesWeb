import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  base: "http://127.0.0.1:8080",
  plugins: [react()],
  assetsInclude: ["**/*.WAV"],
  test: {
    globals: true,
    environment: "jsdom",
    // setupFiles: "./src/setupTests.ts",
    css: true,
    reporters: ["verbose"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*"],
      exclude: [],
    },
  },
});
