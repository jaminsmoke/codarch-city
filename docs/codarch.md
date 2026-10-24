# Relación con Codarch

**Codarch City** es un proyecto **adyacente / third-party** del ecosistema [Codarch](https://github.com/jaminsmoke/codarch):

| Responsabilidad | Dónde |
|---|---|
| Analizar repos → `cc.json` / `.codarch/` | **Codarch** (CLI, parsers, schema) |
| Simulación 3D ciudad a partir del snapshot | **Codarch City** (este repo) |

## Flujo de datos

1. En el repo objetivo: `codarch analyze .` (o la app Codarch) → `.codarch/snapshot.cc.json`
2. En Codarch City: **Abrir carpeta** (lee el snapshot si existe) o **Cargar cc.json**
3. Solo si no hay snapshot: City puede invocar el CLI Codarch como fallback

Usar City como cliente del CLI también sirve para detectar límites o fricciones de Codarch y mejorarlas **en el repo de Codarch**, no aquí.

## Repo de referencia

Durante el MVP usamos **PyTalktoWrite** (tamaño medio, ya con `.codarch/`):

`C:\Users\jaminsmoke\Documents\Proyectos\Programacion\PyTalktoWrite`

Botón **PyTalktoWrite** / menú Archivo → Repo referencia / `Ctrl+R`.
Variable opcional: `CODARCH_CITY_REFERENCE`.
