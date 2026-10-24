# Fase 6 — Aceleración nativa / WASM

**Estado:** aplazado  
**Depende de:** evidencia de profiler tras fases 1–3

## Objetivo

Solo si TypeScript + Three.js + streaming **no** llegan: mover cuellos de botella concretos a WASM (Rust) o workers, sin reescribir el producto.

## Checklist (condicional)

- [ ] Perfil: ¿layout CPU? ¿upload de instancias? ¿JS en el tick?
- [ ] Si layout: prototipo `snapshotToCity` en Rust/WASM y comparar tiempos
- [ ] Si tick: worker que prepara matrices; main solo `instanceMatrix`
- [ ] Mantener el contrato `CityModel` estable para no romper el renderer
- [ ] Documentar en [stack.md](../stack.md) la decisión y el benchmark

## No hacer

- Reescribir el renderer en Unreal/Godot “porque sí”.
- Introducir CUDA para dibujar cajas.
- Poliglotía sin métricas antes/después.

## Criterio de hecho

Misma escena, mismo visual, ganancia medible (ms de layout o FPS) documentada.
