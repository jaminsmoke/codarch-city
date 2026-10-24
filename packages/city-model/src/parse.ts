import type { CcJson, CcNode } from "./types";

export class CcJsonError extends Error {
  constructor(
    message: string,
    readonly path: string
  ) {
    super(`${path}: ${message}`);
    this.name = "CcJsonError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNode(raw: unknown, path: string): CcNode {
  if (!isRecord(raw)) throw new CcJsonError("se esperaba un objeto nodo", path);
  const id = raw.id;
  const name = raw.name;
  const type = raw.type;
  if (typeof id !== "string" || !id) throw new CcJsonError("id inválido", path);
  if (typeof name !== "string") throw new CcJsonError("name inválido", path);
  if (type !== "File" && type !== "Folder") {
    throw new CcJsonError("type debe ser File o Folder", `${path}.type`);
  }
  const node: CcNode = { id, name, type };
  if (typeof raw.contentHash === "string") node.contentHash = raw.contentHash;
  if (typeof raw.link === "string") node.link = raw.link;
  if (raw.children !== undefined) {
    if (!Array.isArray(raw.children)) {
      throw new CcJsonError("children debe ser array", `${path}.children`);
    }
    node.children = raw.children.map((child, i) =>
      parseNode(child, `${path}.children[${i}]`)
    );
  }
  return node;
}

/**
 * Valida un cc.json 2.x (o payload `{ data }` legacy ligero).
 * No convierte 1.x completo: para eso usa el CLI de Codarch.
 */
export function parseCcJson(input: unknown): CcJson {
  let raw = input;
  if (isRecord(raw) && isRecord(raw.data) && raw.files === undefined) {
    raw = raw.data;
  }
  if (!isRecord(raw)) throw new CcJsonError("raíz inválida", "$");
  if (!isRecord(raw.meta)) throw new CcJsonError("meta requerida", "$.meta");
  const apiVersion = raw.meta.apiVersion;
  if (typeof apiVersion !== "string") {
    throw new CcJsonError("meta.apiVersion requerida", "$.meta.apiVersion");
  }

  let filesRaw = raw.files;
  if (!Array.isArray(filesRaw) && isRecord(filesRaw)) {
    filesRaw = [filesRaw];
  }
  if (!Array.isArray(filesRaw) || filesRaw.length === 0) {
    throw new CcJsonError("files debe ser un array no vacío", "$.files");
  }

  const files = filesRaw.map((n, i) => parseNode(n, `$.files[${i}]`));
  const meta = { ...raw.meta, apiVersion } as CcJson["meta"];
  const lenses = isRecord(raw.lenses) ? (raw.lenses as CcJson["lenses"]) : undefined;

  return { meta, files, lenses };
}
