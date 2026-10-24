# Documentación — Codarch City

Simulación 3D de una **ciudad** generada a partir de la arquitectura de un repositorio local (snapshots Codarch / `cc.json`).

## Índice

| Doc | Para qué |
|---|---|
| [roadmap.md](./roadmap.md) | **Seguimiento principal**: fases, estado, qué queda |
| [codarch.md](./codarch.md) | Relación third-party con Codarch + repo referencia |
| [homologias.md](./homologias.md) | Analogías código ↔ ciudad |
| [rendimiento.md](./rendimiento.md) | LOD, chunks, calidad, límites del hardware |
| [stack.md](./stack.md) | Electron, Three.js/WebGL2, TS vs Rust/WASM |
| [fases/](./fases/) | Checklist por fase (una tarea = un archivo) |

## Cómo trackear

1. El estado global vive en [roadmap.md](./roadmap.md).
2. Al trabajar una fase, abre su archivo en `fases/` y marca checkboxes.
3. Cuando una fase termina: `Estado: hecho` en su archivo y actualiza la tabla del roadmap.
4. No borrar fases hechas: quedan como historial.

**Estados:** `pendiente` · `en curso` · `hecho` · `aplazado`
