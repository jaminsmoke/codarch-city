export interface Footprint {
  w: number;
  d: number;
}

export interface Placed<T> {
  item: T;
  x: number;
  z: number;
  w: number;
  d: number;
}

/**
 * Empaqueta rectángulos en filas (shelf packing). Determinista y barato.
 * Origen en la esquina min; el contenido crece en +X / +Z.
 */
export function packShelf<T>(
  items: readonly { item: T; footprint: Footprint }[],
  gap: number
): { placed: Placed<T>[]; width: number; depth: number } {
  if (items.length === 0) return { placed: [], width: 0, depth: 0 };

  const sorted = [...items].sort(
    (a, b) => b.footprint.d * b.footprint.w - a.footprint.d * a.footprint.w
  );

  const totalArea = sorted.reduce((s, it) => s + it.footprint.w * it.footprint.d, 0);
  const targetWidth = Math.max(
    sorted[0]!.footprint.w,
    Math.sqrt(totalArea) * 1.15
  );

  const placed: Placed<T>[] = [];
  let cursorX = 0;
  let cursorZ = 0;
  let rowHeight = 0;
  let maxX = 0;

  for (const entry of sorted) {
    const { w, d } = entry.footprint;
    if (cursorX > 0 && cursorX + w > targetWidth) {
      cursorX = 0;
      cursorZ += rowHeight + gap;
      rowHeight = 0;
    }
    placed.push({ item: entry.item, x: cursorX, z: cursorZ, w, d });
    cursorX += w + gap;
    rowHeight = Math.max(rowHeight, d);
    maxX = Math.max(maxX, cursorX - gap);
  }

  const depth = cursorZ + rowHeight;
  return { placed, width: maxX, depth };
}

/** Huella en planta a partir de rloc (aprox. metros de ciudad). */
export function footprintFromRloc(rloc: number): Footprint {
  const area = Math.max(4, Math.sqrt(rloc) * 0.9);
  const side = Math.sqrt(area);
  return { w: Math.max(2, side), d: Math.max(2, side * 0.85) };
}

export function heightFromMetrics(rloc: number, complexity: number): number {
  const base = Math.max(1.5, Math.log2(rloc + 2) * 1.4);
  const boost = Math.min(12, complexity * 0.15);
  return base + boost;
}
