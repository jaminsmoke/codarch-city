# Fase 3 — LOD y distancia de render parametrizable

**Estado:** pendiente  
**Depende de:** Fases 1–2

## Objetivo

Detalle por distancia explícito y configurable: el equipo (o el usuario) decide hasta dónde se ven edificios vs solo barrios.

## Checklist

- [ ] Umbrales L1/L2/L3 en `QualityProfile` (metros de ciudad)
- [ ] UI: sliders o campos “distancia edificios” / “distancia barrios”
- [ ] Integrar con streamer (chunk lejos → solo LOD de barrio o nada)
- [ ] Transición sin pop-in agresivo (hysteresis o crossfade simple)
- [ ] Picking desactivado o degradado en LOD lejano (ya parcialmente)
- [ ] Benchmark documentado: mismos ángulos de cámara en Bajo vs Ultra
- [ ] Actualizar tabla de presets en [rendimiento.md](../rendimiento.md) con números reales

## Criterio de hecho

Se puede forzar “solo barrios” subiendo umbrales y recuperar edificios al acercarse, con el preset guardado.

## Notas de avance

_(vacío hasta empezar)_
