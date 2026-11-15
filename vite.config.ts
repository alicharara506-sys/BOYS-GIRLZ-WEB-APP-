import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
export default defineConfig({
  plugins: [reactRouter()],
  server: { fs: { deny: ["**/.data/**", "**/.git/**", "**/.env*", "**/*.{crt,pem}"] } },
});
