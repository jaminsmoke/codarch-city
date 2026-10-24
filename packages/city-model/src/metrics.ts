import type { CcJson, CcSymbol } from "./types";

const SIZE_KEYS = ["rloc", "loc", "sonar_ncloc", "unary"] as const;
const COMPLEXITY_KEYS = [
  "complexity",
  "sonar_complexity",
  "sonar_cognitive_complexity",
  "logic_complexity"
] as const;

export function metricsOf(cc: CcJson, id: string): Record<string, number> {
  return cc.lenses?.metrics?.attributes?.[id] ?? {};
}

export function symbolsOf(cc: CcJson, id: string): CcSymbol[] {
  return cc.lenses?.symbols?.nodes?.[id] ?? [];
}

export function readSize(metrics: Record<string, number>): number {
  for (const key of SIZE_KEYS) {
    const value = metrics[key];
    if (typeof value === "number" && value > 0) return value;
  }
  return 1;
}

export function readComplexity(metrics: Record<string, number>): number {
  for (const key of COMPLEXITY_KEYS) {
    const value = metrics[key];
    if (typeof value === "number" && value >= 0) return value;
  }
  return 0;
}

/** Score 0..1 a partir de complejidad y tamaño. */
export function readRisk(metrics: Record<string, number>): number {
  const complexity = readComplexity(metrics);
  const size = readSize(metrics);
  const raw = complexity * 0.7 + Math.log10(size + 1) * 0.3;
  return Math.min(1, raw / 40);
}

export function riskColor(risk: number): number {
  // beige → rojo
  const t = Math.max(0, Math.min(1, risk));
  const r = Math.round(0xc8 + (0xe0 - 0xc8) * t);
  const g = Math.round(0xb8 + (0x3a - 0xb8) * t);
  const b = Math.round(0x90 + (0x3a - 0x90) * t);
  return (r << 16) | (g << 8) | b;
}

const DISTRICT_PALETTE = [
  0x3d5a4c, 0x4a5d6e, 0x6b5344, 0x4f5b3a, 0x5a4a62, 0x3f5558, 0x6a4f3b, 0x455a6a
];

export function districtColor(index: number): number {
  return DISTRICT_PALETTE[index % DISTRICT_PALETTE.length]!;
}
