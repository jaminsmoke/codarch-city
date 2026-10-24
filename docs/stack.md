# Stack y lenguaje

## Decisión actual (vigente)

| Capa | Tecnología | Motivo |
|---|---|---|
| Shell | Electron | Disco real, diálogos, mismo ecosistema que Codarch desktop |
| UI overlay | React + Vite | Inspector, presets, HUD |
| Render | Three.js + **WebGL2** | Maduro; en Windows → ANGLE → D3D11 → RTX |
| Modelo ciudad | TypeScript (`@codarch-city/city-model`) | Rápido de iterar; mismo idioma que Codarch |
| Datos | CLI / `cc.json` Codarch | No reanalizar en City |

**No usamos por defecto:** WebGPU, CUDA, Unreal, Godot.

## ¿TS solo o políglota?

**Por ahora: TypeScript de punta a punta** en City (más el CLI Codarch que ya existe).

Razones:

- El análisis ya está en el ecosistema Codarch (TS).
- El cuello de botella esperado es organización de escena (draws, streaming), no “falta de C++”.
- Iterar metáforas visuales en TS es más barato.

### Cuándo sí ser políglotas (fase 6)

Solo con evidencia del profiler:

1. **Layout / empaquetado masivo en Rust → WASM** — si `snapshotToCity` bloquea el main thread en repos enormes.
2. **Workers + buffers compartidos** — prep de matrices de instancias fuera del UI thread (sigue siendo JS/TS).
3. **Addon nativo DX12/Vulkan** — solo si se decide abandonar WebGL; es un cambio de producto.

No empezar en Rust “por si acaso”: retrasa el producto sin FPS garantizado.

## GPU en Windows

- Switches Electron: `force_high_performance_gpu`, `use-angle=d3d11`.
- Three: `powerPreference: 'high-performance'`, pixel ratio con tope.
- Ajuste de usuario: app → Gráficos Windows → Alto rendimiento (RTX).
