import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const CITY_MODEL = path.resolve(ROOT, "../../packages/city-model/src/index.ts");

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

const shared = {
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  sourcemap: false,
  minify: false,
  external: ["electron"],
  alias: {
    "@codarch-city/city-model": CITY_MODEL
  }
};

await build({
  ...shared,
  entryPoints: [path.join(ROOT, "src", "main", "main.ts")],
  outfile: path.join(DIST, "main.cjs")
});

await build({
  ...shared,
  entryPoints: [path.join(ROOT, "src", "main", "preload.ts")],
  outfile: path.join(DIST, "preload.cjs")
});

console.log("ok · main + preload");
