/** Tipos compatibles con cc.json 2.x de Codarch (subset que usa City). */

export type CcNodeType = "File" | "Folder";

export interface CcNode {
  id: string;
  name: string;
  type: CcNodeType;
  children?: CcNode[];
  contentHash?: string;
  link?: string;
}

export interface CcMeta {
  projectName?: string;
  apiVersion: string;
  checksum?: string;
  commitHash?: string;
  [key: string]: unknown;
}

export interface CcMetricsLens {
  attributes: Record<string, Record<string, number>>;
  attributeDescriptors?: Record<string, unknown>;
  attributeTypes?: Record<string, string>;
}

export interface CcSymbol {
  name: string;
  kind: "function" | "class" | "interface" | "type" | "enum" | "variable";
  line: number;
  lines?: number;
  complexity?: number;
  hash?: string;
}

export interface CcSymbolsLens {
  nodes: Record<string, CcSymbol[]>;
  summary?: {
    symbols: number;
    functions?: number;
    classes?: number;
  };
}

export interface CcLenses {
  metrics?: CcMetricsLens;
  symbols?: CcSymbolsLens;
  dependency?: unknown;
  [name: string]: unknown;
}

export interface CcJson {
  meta: CcMeta;
  files: CcNode[];
  lenses?: CcLenses;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Building {
  kind: "building";
  nodeId: string;
  name: string;
  path: string;
  /** Posición del centro de la base. */
  position: Vec3;
  /** Ancho (X), alto (Y), profundidad (Z). */
  size: Vec3;
  rloc: number;
  complexity: number;
  risk: number;
  color: number;
  symbols: CcSymbol[];
  metrics: Record<string, number>;
}

export interface Block {
  kind: "block";
  nodeId: string;
  name: string;
  path: string;
  /** Suelo de la urbanización (placa). */
  ground: { position: Vec3; size: { x: number; z: number } };
  buildings: Building[];
  blocks: Block[];
}

export interface District {
  kind: "district";
  nodeId: string;
  name: string;
  path: string;
  ground: { position: Vec3; size: { x: number; z: number }; color: number };
  /** Volumen LOD cuando la cámara está lejos. */
  lodBox: { position: Vec3; size: Vec3 };
  blocks: Block[];
  buildings: Building[];
}

export interface CityModel {
  projectName: string;
  checksum?: string;
  rootPath: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxY: number };
  districts: District[];
  /** Todos los edificios en orden estable (índice = instanceId). */
  buildings: Building[];
  fileCount: number;
  folderCount: number;
}

export interface CityMapperOptions {
  /** Agrupar ficheros con rloc bajo este umbral en un edificio sintético por carpeta. */
  minBuildingRloc?: number;
  /** Máximo de edificios emitidos (el resto se agrupa). */
  maxBuildings?: number;
  gap?: number;
  street?: number;
}
