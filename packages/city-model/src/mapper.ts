import {
  districtColor,
  metricsOf,
  readComplexity,
  readRisk,
  readSize,
  riskColor,
  symbolsOf
} from "./metrics";
import { footprintFromRloc, heightFromMetrics, packShelf } from "./layout";
import type {
  Block,
  Building,
  CcJson,
  CcNode,
  CityMapperOptions,
  CityModel,
  District
} from "./types";

interface FileLeaf {
  node: CcNode;
  path: string;
  rloc: number;
  complexity: number;
  risk: number;
  metrics: Record<string, number>;
}

const DEFAULTS: Required<CityMapperOptions> = {
  minBuildingRloc: 0,
  maxBuildings: 12_000,
  gap: 1.2,
  street: 6
};

function joinPath(parent: string, name: string): string {
  return parent ? `${parent}/${name}` : name;
}

function countNodes(node: CcNode): { files: number; folders: number } {
  let files = 0;
  let folders = 0;
  const walk = (n: CcNode): void => {
    if (n.type === "File") files += 1;
    else {
      folders += 1;
      for (const c of n.children ?? []) walk(c);
    }
  };
  walk(node);
  return { files, folders };
}

function collectFiles(
  cc: CcJson,
  node: CcNode,
  parentPath: string,
  out: FileLeaf[]
): void {
  const path = joinPath(parentPath, node.name);
  if (node.type === "File") {
    const metrics = metricsOf(cc, node.id);
    out.push({
      node,
      path,
      rloc: readSize(metrics),
      complexity: readComplexity(metrics),
      risk: readRisk(metrics),
      metrics
    });
    return;
  }
  for (const child of node.children ?? []) {
    collectFiles(cc, child, path === node.name && !parentPath ? "" : path, out);
  }
}

function makeBuilding(
  cc: CcJson,
  leaf: FileLeaf,
  x: number,
  z: number,
  w: number,
  d: number
): Building {
  const h = heightFromMetrics(leaf.rloc, leaf.complexity);
  return {
    kind: "building",
    nodeId: leaf.node.id,
    name: leaf.node.name,
    path: leaf.path,
    position: { x: x + w / 2, y: h / 2, z: z + d / 2 },
    size: { x: w * 0.85, y: h, z: d * 0.85 },
    rloc: leaf.rloc,
    complexity: leaf.complexity,
    risk: leaf.risk,
    color: riskColor(leaf.risk),
    symbols: symbolsOf(cc, leaf.node.id),
    metrics: leaf.metrics
  };
}

function layoutFolderContent(
  cc: CcJson,
  folder: CcNode,
  folderPath: string,
  originX: number,
  originZ: number,
  options: Required<CityMapperOptions>,
  buildingBudget: { left: number }
): { block: Block; width: number; depth: number; maxY: number } {
  const children = folder.children ?? [];
  const subFolders = children.filter((c) => c.type === "Folder");
  const files = children.filter((c) => c.type === "File");

  const nestedBlocks: Block[] = [];
  const buildings: Building[] = [];
  const packItems: { item: { kind: "block" | "file"; node: CcNode }; footprint: { w: number; d: number }; pre?: Block; leaf?: FileLeaf }[] = [];

  for (const sub of subFolders) {
    const nested = layoutFolderContent(
      cc,
      sub,
      joinPath(folderPath, sub.name),
      0,
      0,
      options,
      buildingBudget
    );
    nestedBlocks.push(nested.block);
    packItems.push({
      item: { kind: "block", node: sub },
      footprint: {
        w: Math.max(4, nested.width + options.gap),
        d: Math.max(4, nested.depth + options.gap)
      },
      pre: nested.block
    });
  }

  const fileLeaves: FileLeaf[] = [];
  for (const file of files) {
    if (buildingBudget.left <= 0) break;
    const metrics = metricsOf(cc, file.id);
    const rloc = readSize(metrics);
    if (rloc < options.minBuildingRloc && files.length > 8) continue;
    const leaf: FileLeaf = {
      node: file,
      path: joinPath(folderPath, file.name),
      rloc,
      complexity: readComplexity(metrics),
      risk: readRisk(metrics),
      metrics
    };
    fileLeaves.push(leaf);
    const fp = footprintFromRloc(leaf.rloc);
    packItems.push({
      item: { kind: "file", node: file },
      footprint: fp,
      leaf
    });
    buildingBudget.left -= 1;
  }

  const packed = packShelf(
    packItems.map((p) => ({ item: p, footprint: p.footprint })),
    options.gap
  );

  let maxY = 2;
  for (const slot of packed.placed) {
    const entry = slot.item;
    if (entry.item.kind === "file" && entry.leaf) {
      const b = makeBuilding(cc, entry.leaf, originX + slot.x, originZ + slot.z, slot.w, slot.d);
      buildings.push(b);
      maxY = Math.max(maxY, b.size.y);
    } else if (entry.pre) {
      const dx = originX + slot.x - entry.pre.ground.position.x + slot.w / 2;
      const dz = originZ + slot.z - entry.pre.ground.position.z + slot.d / 2;
      shiftBlock(entry.pre, dx, dz);
      maxY = Math.max(maxY, maxBuildingY(entry.pre));
    }
  }

  // Re-collect nested blocks after shift (same references)
  const width = Math.max(packed.width, 4);
  const depth = Math.max(packed.depth, 4);

  const block: Block = {
    kind: "block",
    nodeId: folder.id,
    name: folder.name,
    path: folderPath,
    ground: {
      position: { x: originX + width / 2, y: 0.05, z: originZ + depth / 2 },
      size: { x: width + 1, z: depth + 1 }
    },
    buildings,
    blocks: nestedBlocks
  };

  return { block, width, depth, maxY };
}

function shiftBlock(block: Block, dx: number, dz: number): void {
  block.ground.position.x += dx;
  block.ground.position.z += dz;
  for (const b of block.buildings) {
    b.position.x += dx;
    b.position.z += dz;
  }
  for (const child of block.blocks) shiftBlock(child, dx, dz);
}

function maxBuildingY(block: Block): number {
  let max = 0;
  for (const b of block.buildings) max = Math.max(max, b.size.y);
  for (const child of block.blocks) max = Math.max(max, maxBuildingY(child));
  return max;
}

function flattenBuildings(block: Block, out: Building[]): void {
  out.push(...block.buildings);
  for (const child of block.blocks) flattenBuildings(child, out);
}

/**
 * Convierte un snapshot Codarch en un CityModel con layout determinista.
 */
export function snapshotToCity(
  cc: CcJson,
  options: CityMapperOptions = {}
): CityModel {
  const opts: Required<CityMapperOptions> = { ...DEFAULTS, ...options };
  const roots = cc.files;
  const root = roots.length === 1 ? roots[0]! : syntheticRoot(roots);
  const rootPath = root.name || "root";

  const topChildren = root.children ?? [];
  const districtNodes = topChildren.filter((c) => c.type === "Folder");
  const rootFiles = topChildren.filter((c) => c.type === "File");

  // Si no hay carpetas top-level, toda la raíz es un barrio.
  const sources: CcNode[] =
    districtNodes.length > 0
      ? districtNodes
      : [{ ...root, children: topChildren }];

  const buildingBudget = { left: opts.maxBuildings };
  const districtPack: {
    item: { node: CcNode; block: Block; maxY: number; width: number; depth: number };
    footprint: { w: number; d: number };
  }[] = [];

  for (const node of sources) {
    const path = node === root && districtNodes.length === 0 ? rootPath : joinPath(rootPath, node.name);
    const laid = layoutFolderContent(cc, node, path, 0, 0, opts, buildingBudget);
    districtPack.push({
      item: { node, block: laid.block, maxY: laid.maxY, width: laid.width, depth: laid.depth },
      footprint: {
        w: laid.width + opts.street,
        d: laid.depth + opts.street
      }
    });
  }

  // Ficheros sueltos en la raíz → barrio "_root"
  if (districtNodes.length > 0 && rootFiles.length > 0 && buildingBudget.left > 0) {
    const synthetic: CcNode = {
      id: `${root.id}:root-files`,
      name: "(raíz)",
      type: "Folder",
      children: rootFiles
    };
    const laid = layoutFolderContent(
      cc,
      synthetic,
      rootPath,
      0,
      0,
      opts,
      buildingBudget
    );
    districtPack.push({
      item: {
        node: synthetic,
        block: laid.block,
        maxY: laid.maxY,
        width: laid.width,
        depth: laid.depth
      },
      footprint: {
        w: laid.width + opts.street,
        d: laid.depth + opts.street
      }
    });
  }

  const packed = packShelf(districtPack, opts.street);
  const districts: District[] = [];
  const allBuildings: Building[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let maxY = 1;

  packed.placed.forEach((slot, index) => {
    const { node, block, maxY: dy, width, depth } = slot.item;
    const dx = slot.x - block.ground.position.x + width / 2;
    const dz = slot.z - block.ground.position.z + depth / 2;
    shiftBlock(block, dx, dz);

    const buildings: Building[] = [];
    flattenBuildings(block, buildings);
    allBuildings.push(...buildings);

    const gw = width + opts.street * 0.5;
    const gd = depth + opts.street * 0.5;
    const cx = slot.x + slot.w / 2;
    const cz = slot.z + slot.d / 2;

    const district: District = {
      kind: "district",
      nodeId: node.id,
      name: node.name,
      path: block.path,
      ground: {
        position: { x: cx, y: 0, z: cz },
        size: { x: gw, z: gd },
        color: districtColor(index)
      },
      lodBox: {
        position: { x: cx, y: Math.max(2, dy) / 2, z: cz },
        size: { x: Math.max(4, width * 0.9), y: Math.max(2, dy), z: Math.max(4, depth * 0.9) }
      },
      blocks: block.blocks,
      buildings
    };
    districts.push(district);

    minX = Math.min(minX, cx - gw / 2);
    maxX = Math.max(maxX, cx + gw / 2);
    minZ = Math.min(minZ, cz - gd / 2);
    maxZ = Math.max(maxZ, cz + gd / 2);
    maxY = Math.max(maxY, dy);
  });

  if (!Number.isFinite(minX)) {
    minX = -10;
    maxX = 10;
    minZ = -10;
    maxZ = 10;
  }

  const counts = countNodes(root);

  return {
    projectName: cc.meta.projectName || root.name || "ciudad",
    checksum: typeof cc.meta.checksum === "string" ? cc.meta.checksum : undefined,
    rootPath,
    bounds: { minX, maxX, minZ, maxZ, maxY },
    districts,
    buildings: allBuildings,
    fileCount: counts.files,
    folderCount: counts.folders
  };
}

function syntheticRoot(roots: CcNode[]): CcNode {
  return {
    id: "city-synthetic-root",
    name: "root",
    type: "Folder",
    children: roots
  };
}
