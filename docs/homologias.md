# Homologías — código ↔ ciudad

La ciudad es una **proyección espacial** del snapshot Codarch (`cc.json`), no un grafo force-directed ni un treemap 2D.

## Tabla canónica (MVP y siguientes)

| Elemento de código | Elemento de ciudad | Estado |
|---|---|---|
| Proyecto / raíz del snapshot | Ciudad entera | hecho |
| Carpetas de 1er nivel bajo la raíz | Barrios (distritos, suelo coloreado) | hecho |
| Subcarpetas | Urbanizaciones / manzanas | hecho (layout) |
| Ficheros | Edificios (cajas instanciadas) | hecho |
| RLOC / tamaño | Huella en planta | hecho |
| Complejidad | Altura (refuerzo) | hecho |
| Riesgo derivado | Color del edificio | hecho |
| Símbolos (lente) | Datos en inspector; luego “habitantes” | parcial |
| Dependencias (lente) | Calles / tráfico | pendiente (fase 5) |
| Ciclos / hotspots | Zonas degradadas / alarmas urbanas | pendiente |
| Diff entre commits | Obras / cambios en la skyline | aplazado |

## Reglas de diseño

1. **Legibilidad > realismo.** Si no se entiende “dónde hay masa de código” en 10 segundos, falla el diseño.
2. **Determinismo.** El mismo snapshot produce el mismo layout (comparable entre sesiones).
3. **Una metáfora por capa.** No mezclar “edificio = fichero” con “edificio = clase” en el mismo nivel de zoom; los símbolos viven *dentro* del edificio (inspector / zoom futuro).

## Evolución prevista

- **Zoom lejano:** solo barrios (LOD).  
- **Zoom medio:** manzanas + volúmenes.  
- **Zoom cercano:** edificios individuales + selección.  
- **Más adelante:** interiores / símbolos como población, sin romper la metáfora exterior.
