import { spawn } from "node:child_process";
import { createReadStream, existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { createGunzip } from "node:zlib";
import { parseCcJson, type CcJson } from "@codarch-city/city-model";

/** Repo de referencia local para desarrollo / demos de tamaño medio. */
export const REFERENCE_REPO =
  process.env.CODARCH_CITY_REFERENCE ??
  "C:\\Users\\jaminsmoke\\Documents\\Proyectos\\Programacion\\PyTalktoWrite";

/**
 * Rutas candidatas al monorepo Codarch local (hermano de Codarch City).
 */
function localCodarchRoots(): string[] {
  const fromEnv = process.env.CODARCH_ROOT;
  const siblings = [
    fromEnv,
    path.resolve(process.cwd(), "..", "Visual Software Architecture"),
    path.resolve(process.cwd(), "..", "..", "Visual Software Architecture"),
    "C:\\Users\\jaminsmoke\\Documents\\Proyectos\\Programacion\\Visual Software Architecture"
  ].filter((p): p is string => Boolean(p));
  return [...new Set(siblings)];
}

async function readJsonFile(filePath: string): Promise<unknown> {
  if (filePath.endsWith(".gz")) {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      createReadStream(filePath)
        .pipe(createGunzip())
        .on("data", (c: Buffer) => chunks.push(c))
        .on("end", () => resolve())
        .on("error", reject);
    });
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  }
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
}

export async function loadSnapshotFromFile(filePath: string): Promise<CcJson> {
  const raw = await readJsonFile(filePath);
  return parseCcJson(raw);
}

/** Busca un snapshot Codarch ya generado en el repo (no reanaliza). */
export function findExistingSnapshot(root: string): string | null {
  const candidates = [
    path.join(root, ".codarch", "snapshot.cc.json"),
    path.join(root, ".codarch", "snapshot.cc.json.gz"),
    path.join(root, ".codarch", "latest.cc.json"),
    path.join(root, "snapshot.cc.json")
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Carga datos Codarch de un repo: prioriza `.codarch/snapshot.cc.json`.
 * Solo invoca el CLI si no hay snapshot (o si `forceAnalyze`).
 */
export async function loadRepoCityData(
  root: string,
  options: { forceAnalyze?: boolean } = {}
): Promise<{ snapshot: CcJson; source: string; fromCache: boolean }> {
  if (!options.forceAnalyze) {
    const existing = findExistingSnapshot(root);
    if (existing) {
      return {
        snapshot: await loadSnapshotFromFile(existing),
        source: existing,
        fromCache: true
      };
    }
  }

  const snapshot = await analyzeFolder(root);
  const written = findExistingSnapshot(root);
  return {
    snapshot,
    source: written ?? root,
    fromCache: false
  };
}

function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      env: process.env
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

/**
 * Analiza una carpeta con el CLI Codarch y lee el snapshot generado.
 */
export async function analyzeFolder(root: string): Promise<CcJson> {
  const outDir = path.join(root, ".codarch");
  const snapshotPath = path.join(outDir, "snapshot.cc.json");

  let analyzed = false;
  let lastError = "";

  for (const codarchRoot of localCodarchRoots()) {
    const cliEntry = path.join(codarchRoot, "apps", "cli", "src", "index.ts");
    if (!existsSync(cliEntry)) continue;
    const result = await runCommand(
      "npx",
      ["tsx", cliEntry, "analyze", root, "-o", outDir, "--title", path.basename(root)],
      codarchRoot
    );
    if (result.code === 0) {
      analyzed = true;
      break;
    }
    lastError = result.stderr || result.stdout;
  }

  if (!analyzed) {
    const result = await runCommand(
      "npx",
      ["--yes", "codarch@next", "analyze", root, "-o", outDir, "--title", path.basename(root)],
      root
    );
    if (result.code === 0) analyzed = true;
    else lastError = result.stderr || result.stdout || lastError;
  }

  const existing = findExistingSnapshot(root);
  if (existing) return loadSnapshotFromFile(existing);

  if (existsSync(snapshotPath)) return loadSnapshotFromFile(snapshotPath);

  if (!analyzed) {
    throw new Error(
      `No se pudo analizar el repo. Instala el CLI Codarch o apunta CODARCH_ROOT.\n${lastError}`
    );
  }

  throw new Error("El análisis terminó pero no se encontró snapshot.cc.json");
}
