# Fase 2 — Chunks espaciales + streaming por cámara

**Estado:** pendiente  
**Depende de:** Fase 1 (al menos el profile con margen de chunks)

## Objetivo

No renderizar (ni mantener activos en GPU) todos los edificios a la vez: dividir la ciudad en celdas y activar solo las visibles + margen.

## Checklist

- [ ] `SpatialGrid` / partición XZ del `CityModel` en chunks
- [ ] Cada chunk: lista de edificios + bounds + volumen LOD opcional
- [ ] `Streamer`: a partir de cámara/frustum → set de chunk ids activos
- [ ] Activar/desactivar batches al cruzar celdas (hysteresis para no parpadear)
- [ ] Margen configurable desde `QualityProfile`
- [ ] HUD: chunks totales / activos / en cola
- [ ] Smoke: demo 2k edificios con menos instancias GPU que el total cuando se mira un rincón
- [ ] Evitar realloc constante (reusar `InstancedMesh` o pools)

## Criterio de hecho

Orbitar un borde de la ciudad mantiene FPS y el HUD muestra solo un subconjunto de chunks activos.

## Notas de avance

_(vacío hasta empezar)_
