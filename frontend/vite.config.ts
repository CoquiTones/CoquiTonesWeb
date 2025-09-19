import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";
// https://vitejs.dev/config/
export default defineConfig({
  // base: "/",
  plugins: [react(), basicSsl()],
  assetsInclude: ["**/*.WAV", "**/*.png"],
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
