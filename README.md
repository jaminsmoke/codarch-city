# Codarch City

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Simulación 3D de una **ciudad** generada a partir de la arquitectura de un repo local. Es un **third-party del ecosistema Codarch**: el análisis lo hace el [CLI Codarch](https://www.npmjs.com/package/codarch); aquí consumimos `.codarch/snapshot.cc.json` / `cc.json` y lo dibujamos con Three.js + WebGL2 (ANGLE → Direct3D 11 en Windows).

Más detalle: [`docs/codarch.md`](./docs/codarch.md).

## Documentación / seguimiento

El roadmap y el tracking de tareas están en **[`docs/`](./docs/README.md)**:

- [`docs/roadmap.md`](./docs/roadmap.md) — fases y estado global  
- [`docs/fases/`](./docs/fases/) — checklist por fase  

## Homologías

| Código | Ciudad |
|---|---|
| Proyecto | Ciudad |
| Carpetas de 1er nivel | Barrios |
| Subcarpetas | Urbanizaciones |
| Ficheros | Edificios |
| RLOC / complejidad | Huella y altura |

## Desarrollo

```bash
npm install
npm run dev
```

En la app: **Abrir carpeta** (analiza con CLI Codarch si está disponible), **Cargar cc.json** o **Demo CodeCharta**.

Atajo **F3**: HUD de GPU (debe mostrar NVIDIA + WebGL2).

## Windows / RTX

Ajusta el ejecutable de Electron a **Alto rendimiento** en Configuración → Sistema → Pantalla → Gráficos.
