# Rendimiento

Objetivo: muchos edificios en escena con FPS estable en GPU discreta (RTX vía WebGL2 → ANGLE → D3D11), y **presets** para medir los límites de la herramienta en cada máquina.

## Pilares

1. **Pocos draw calls** — `InstancedMesh` / batches, nunca un `Mesh` por fichero.
2. **Solo lo necesario** — frustum + chunks; no subir a GPU toda la ciudad si no se ve.
3. **Detalle por distancia (LOD)** — lejos = placas/volúmenes de barrio; cerca = edificios.
4. **Calidad explícita** — el usuario (o un auto-detect suave) elige distancia y densidad.
5. **Medir** — HUD: FPS, draws, tris, chunks activos, edificios activos, GPU.

## QualityProfile (fase 1)

Presets orientativos:

| Preset | pixelRatio max | Distancia edificios | Distancia LOD barrio | Max edificios activos | Margen chunks |
|---|---|---|---|---|---|
| Bajo | 1.0 | corta | corta | bajo | 1 celda |
| Medio | 1.25 | media | media | medio | 1–2 |
| Alto | 1.5 | larga | larga | alto | 2 |
| Ultra | 1.5–2 | muy larga | muy larga | muy alto | 2–3 |

Los números exactos se fijan en código y se ajustan con benchmarks reales.

## Chunks + streaming (fase 2)

```
CityModel
  → SpatialGrid (celdas en XZ)
      → Chunk { buildings[], lodVolume }
          → Streamer (cámara → set de chunks activos)
              → RenderBatches (instancing por chunk o global)
```

- Cargar/activar chunks en vista + margen.
- Desactivar (o no dibujar) chunks lejos.
- El `CityModel` completo puede vivir en CPU; la GPU solo ve lo activo.

## LOD (fase 3)

Niveles típicos:

| Nivel | Condición | Qué se dibuja |
|---|---|---|
| L0 | Muy lejos | Nada o silueta de ciudad |
| L1 | Lejos | Volúmenes de barrio |
| L2 | Medio | Edificios low-poly / instancias |
| L3 | Cerca | Edificios + highlight / picking |

El usuario puede subir/bajar distancias umbral sin recompilar.

## Anti-patrones

- Un mesh por archivo.
- Recrear geometrías cada frame.
- Sombras + postprocess pesado antes de tener streaming.
- WebGPU “porque es nuevo” sin ganar FPS.
- Pasar a Rust/C sin perfilar.

## Criterios de éxito

- Repo ~2k ficheros (demo CodeCharta): fluido en Medio.
- Repo grande (10k+): usable en Bajo/Medio con chunks; Ultra puede degradar a propósito para ver el techo.
- HUD muestra siempre GPU NVIDIA (en máquinas dual-GPU bien configuradas).
