# Fase 0 — MVP ciudad estática + GPU

**Estado:** en revisión (ajustes post-feedback)  
**Cerrada (impl):** 2026-10-24  
**Revisión usuario:** en curso

## Objetivo

App de escritorio que carga un snapshot Codarch y muestra una ciudad 3D estática con edificios instanciados, HUD GPU e inspector.

## Checklist implementación

- [x] Scaffold Electron + Vite + React + TypeScript
- [x] Three.js `WebGLRenderer` (WebGL2), sin WebGPU
- [x] Switches GPU: `force_high_performance_gpu`, `use-angle=d3d11`
- [x] `powerPreference: high-performance`, pixel ratio ≤ 1.5
- [x] HUD F3: nombre GPU, WebGL2, FPS, draw calls
- [x] Paquete `@codarch-city/city-model` (parse + mapper)
- [x] Homologías: barrio / manzana / edificio
- [x] Render con un `InstancedMesh` (no un mesh por fichero)
- [x] LOD lejano básico (volúmenes de barrio)
- [x] IPC: abrir carpeta / cargar cc.json / demo
- [x] Inspector: clic → ruta, métricas, símbolos
- [x] Docs: carpeta `docs/` + roadmap
- [x] `npm run dev` tolera puerto 5175 ocupado

## Cómo revisar (tú)

```bash
cd "C:\Users\jaminsmoke\Documents\Proyectos\Programacion\Codarch City"
npm run dev
```

1. [ ] Arranca sin error y se abre la ventana.
2. [ ] Pulsar **Demo CodeCharta** → aparece una ciudad (miles de edificios).
3. [ ] HUD (F3): dice **NVIDIA** (o tu RTX) + **WebGL2: sí** + FPS razonable.
4. [ ] Orbitar con el ratón; alejarse mucho → se ven bloques de barrio (LOD).
5. [ ] Clic en un edificio → inspector con ruta / RLOC / complejidad.
6. [ ] Opcional: **Cargar cc.json** con un snapshot propio o **Abrir carpeta**.

Si algo falla o quieres ajuste: anótalo abajo y pasamos a correcciones antes de la Fase 1.

## Resultado esperado

- Demo CodeCharta (~2003 edificios) mapeable.
- Bridge al CLI Codarch local o `npx codarch@next`.

## Feedback de revisión

- [x] DevTools ya no se abre solo en ventana aparte (solo menú Ver o `CODARCH_CITY_DEVTOOLS=1`)
- [x] Prioridad a datos Codarch existentes (`.codarch/snapshot.cc.json`) antes de reanalizar
- [x] Repo referencia PyTalktoWrite (botón + Ctrl+R)
- [x] Repo público GitHub MIT `codarch-city`
- [ ] OK final del usuario para cerrar Fase 0

## Notas

Tras OK de revisión → marcar **Estado: hecho** en este archivo y en [roadmap.md](../roadmap.md), luego [01-quality-profile.md](./01-quality-profile.md).

Ver también [codarch.md](../codarch.md).
