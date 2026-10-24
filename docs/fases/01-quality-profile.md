# Fase 1 — QualityProfile + HUD de límites

**Estado:** pendiente  
**Depende de:** Fase 0

## Objetivo

Que el usuario elija un preset de calidad (o valores manuales) y que el HUD muestre los límites reales de la sesión: no solo FPS, sino cuánto de la ciudad está activa.

## Checklist

- [ ] Tipo `QualityProfile` (preset + overrides) en código compartido
- [ ] Presets: Bajo / Medio / Alto / Ultra (tabla en [rendimiento.md](../rendimiento.md))
- [ ] UI: selector de calidad en el panel lateral
- [ ] Aplicar: pixel ratio, distancias LOD, max edificios, (prep) margen de chunks
- [ ] Persistencia simple (localStorage o prefs Electron)
- [ ] HUD ampliado: edificios totales vs activos, draw calls, tris, preset actual
- [ ] Contador “techo”: aviso si se truncó por `maxBuildings`
- [ ] Documentar valores por defecto elegidos tras una pasada real en RTX

## Criterio de hecho

Cambiar de Bajo → Ultra cambia de forma evidente carga y detalle; el HUD refleja la diferencia sin abrir DevTools.

## Notas de avance

_(vacío hasta empezar)_
