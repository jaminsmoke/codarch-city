import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outfile = path.join(root, "scripts", ".city-model.cjs");

buildSync({
  entryPoints: [path.join(root, "packages/city-model/src/index.ts")],
  outfile,
  bundle: true,
  platform: "node",
  format: "cjs"
});

const require = createRequire(import.meta.url);
const { parseCcJson, snapshotToCity } = require("./.city-model.cjs");

const gz =
  "C:/Users/jaminsmoke/Documents/Proyectos/Programacion/Visual Software Architecture/samples/codecharta_visualization.cc.json.gz";
const raw = JSON.parse(gunzipSync(readFileSync(gz)).toString("utf8"));
const cc = parseCcJson(raw);
const city = snapshotToCity(cc);
console.log(
  JSON.stringify(
    {
      project: city.projectName,
      districts: city.districts.length,
      buildings: city.buildings.length,
      files: city.fileCount,
      folders: city.folderCount,
      bounds: city.bounds,
      sample: city.buildings[0]
        ? {
            name: city.buildings[0].name,
            path: city.buildings[0].path,
            rloc: city.buildings[0].rloc,
            h: city.buildings[0].size.y
          }
        : null
    },
    null,
    2
  )
);
