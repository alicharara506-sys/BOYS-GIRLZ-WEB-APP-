import "dotenv/config";
import express from "express";
import { createRequestHandler } from "@react-router/express";
import {register}from "tsx/esm/api";
register();
const {supabaseConfig}=await import("../src/server/supabase.server.ts");
supabaseConfig();
process.env.BNG_COMMERCE = "1";
const {startWhatsAppWorker}=await import("../src/server/whatsapp.server.ts");
await startWhatsAppWorker();
const port = Number(process.env.PORT || 5181);
const host = process.env.HOST || "127.0.0.1";
const production = process.argv.includes("--production");
const app = express();
app.disable("x-powered-by");
let vite;
if (!production) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true, hmr: { port: port + 100 } },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else app.use(express.static("build/client", { maxAge: "1h" }));
app.use(
  createRequestHandler({
    build: production
      ? await import("../build/server/index.js")
      : () => vite.ssrLoadModule("virtual:react-router/server-build"),
    mode: production ? "production" : "development",
  }),
);
const server = app.listen(port, host, () =>
  console.log(
    `Boys & Girlz · http://localhost:${port}/admin · Supabase / USD / no tax`,
  ),
);
let closing = false;
const stop = async () => {
  if (closing) return;
  closing = true;
  server.close();
  await vite?.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
