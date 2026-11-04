import "dotenv/config";
import { spawn } from "node:child_process";
import { localPostgres } from "./local-postgres.mjs";
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      env: process.env,
    });
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Setup step failed (${code}).`)),
    );
    child.once("error", reject);
  });
const pg = await localPostgres();
try {
  await run(["node_modules/prisma/build/index.js", "generate"]);
  await run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  await run(["--import", "tsx", "prisma/seed.ts"]);
  await run(["scripts/create-admin.mjs"]);
  console.log(
    "Setup complete. Start with npm start. Private login: .data/admin-login.txt",
  );
} finally {
  await pg.stop();
}
