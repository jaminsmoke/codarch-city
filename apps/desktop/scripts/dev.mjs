import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import electronPath from "electron";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function buildMain() {
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, [path.join(ROOT, "scripts", "build-main.mjs")], {
    cwd: ROOT,
    stdio: "inherit"
  });
}

await buildMain();

const server = await createServer({
  configFile: path.join(ROOT, "vite.config.ts"),
  root: path.join(ROOT, "src/renderer")
});
await server.listen();
const addr = server.resolvedUrls?.local[0] ?? "http://localhost:5175/";
console.log(`vite · ${addr}`);

const child = spawn(String(electronPath), ["."], {
  cwd: ROOT,
  env: {
    ...process.env,
    VITE_DEV_SERVER_URL: addr
  },
  stdio: "inherit"
});

child.on("exit", async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
