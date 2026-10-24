import { useEffect, useRef, useState } from "react";
import type { Building, CityModel } from "@codarch-city/city-model";
import { cityApi } from "./bridge";
import { CityScene, type FrameStats } from "./city/CityScene";
import type { CityStatus } from "../main/preload";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CityScene | null>(null);
  const [city, setCity] = useState<CityModel | null>(null);
  const [source, setSource] = useState<string>("");
  const [selected, setSelected] = useState<Building | null>(null);
  const [status, setStatus] = useState<CityStatus>({ state: "idle" });
  const [stats, setStats] = useState<FrameStats>({
    fps: 0,
    drawCalls: 0,
    triangles: 0,
    lodFar: false
  });
  const [hudVisible, setHudVisible] = useState(true);
  const [gpuLabel, setGpuLabel] = useState("—");
  const [webgl2, setWebgl2] = useState(false);
  const [nvidiaOk, setNvidiaOk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new CityScene(canvas, {
      onPick: (pick) => setSelected(pick?.building ?? null),
      onStats: setStats
    });
    sceneRef.current = scene;
    const g = scene.gpu;
    setWebgl2(g.isWebGL2);
    setNvidiaOk(g.isNvidia);
    setGpuLabel(
      `${g.isNvidia ? "NVIDIA" : g.vendor} · ${g.renderer}${g.angleD3D11 ? " · D3D11" : ""}`
    );

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "F3") {
        event.preventDefault();
        setHudVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const api = window.codarchCity;
    if (!api) return;
    const offLoaded = api.onLoaded(({ city: next, source: src }) => {
      setCity(next);
      setSource(src);
      setSelected(null);
      setStatus({ state: "idle", message: src });
      sceneRef.current?.setCity(next);
    });
    const offStatus = api.onStatus(setStatus);
    return () => {
      offLoaded();
      offStatus();
    };
  }, []);

  const openFolder = () => {
    void cityApi().openFolder(false);
  };
  const openSnapshot = () => {
    void cityApi().openSnapshot();
  };
  const openReference = () => {
    void cityApi().openReference();
  };
  const loadDemo = async () => {
    setStatus({ state: "loading", message: "demo CodeCharta…" });
    try {
      const demo = await cityApi().loadDemo();
      if (!demo) {
        setStatus({
          state: "error",
          message: "No se encontró samples/codecharta_visualization.cc.json.gz"
        });
        return;
      }
      setCity(demo);
      setSource("demo · codecharta_visualization");
      setSelected(null);
      setStatus({ state: "idle", message: "demo cargada" });
      sceneRef.current?.setCity(demo);
    } catch (error) {
      setStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  };

  return (
    <div className="app">
      <div className="viewport">
        <canvas ref={canvasRef} />
        {hudVisible ? (
          <div className="hud">
            <div>
              GPU:{" "}
              <strong className={nvidiaOk ? "ok" : "bad"}>{gpuLabel}</strong>
            </div>
            <div>
              WebGL2:{" "}
              <span className={webgl2 ? "ok" : "bad"}>{webgl2 ? "sí" : "no"}</span>
              {" · "}
              FPS: {stats.fps.toFixed(0)}
              {" · "}
              draws: {stats.drawCalls}
              {" · "}
              tris: {stats.triangles}
              {stats.lodFar ? " · LOD barrios" : ""}
            </div>
            <div>F3 oculta HUD · pixelRatio ≤ 1.5 · InstancedMesh</div>
          </div>
        ) : null}
        <div className="toolbar">
          <button type="button" onClick={openReference}>
            PyTalktoWrite
          </button>
          <button type="button" onClick={openFolder}>
            Abrir carpeta
          </button>
          <button type="button" onClick={openSnapshot}>
            Cargar cc.json
          </button>
          <button type="button" onClick={() => void loadDemo()}>
            Demo CodeCharta
          </button>
        </div>
      </div>

      <aside className="side">
        <h1>Codarch City</h1>
        <p className="empty">
          Ciudad 3D a partir de datos Codarch (<code>.codarch/snapshot.cc.json</code>
          o CLI). Third-party del ecosistema Codarch: aquí visualizamos; el
          análisis vive en Codarch.
        </p>

        <div className={`status${status.state === "error" ? " error" : ""}`}>
          {status.state === "analyzing" && `Analizando… ${status.message ?? ""}`}
          {status.state === "loading" && `Cargando… ${status.message ?? ""}`}
          {status.state === "error" && status.message}
          {status.state === "idle" && (source || "Sin ciudad cargada")}
        </div>

        {city ? (
          <section className="meta">
            <h2>Ciudad</h2>
            <dl>
              <dt>Proyecto</dt>
              <dd>{city.projectName}</dd>
              <dt>Ficheros</dt>
              <dd>{city.fileCount}</dd>
              <dt>Carpetas</dt>
              <dd>{city.folderCount}</dd>
              <dt>Edificios</dt>
              <dd>{city.buildings.length}</dd>
              <dt>Barrios</dt>
              <dd>{city.districts.length}</dd>
              {city.checksum ? (
                <>
                  <dt>Checksum</dt>
                  <dd>{city.checksum.slice(0, 12)}…</dd>
                </>
              ) : null}
            </dl>
          </section>
        ) : null}

        <section className="inspector">
          <h2>Inspector</h2>
          {selected ? (
            <>
              <dl>
                <dt>Nombre</dt>
                <dd>{selected.name}</dd>
                <dt>Ruta</dt>
                <dd>{selected.path}</dd>
                <dt>RLOC</dt>
                <dd>{selected.rloc}</dd>
                <dt>Complejidad</dt>
                <dd>{selected.complexity}</dd>
                <dt>Riesgo</dt>
                <dd>{selected.risk.toFixed(2)}</dd>
                <dt>Altura</dt>
                <dd>{selected.size.y.toFixed(1)}</dd>
              </dl>
              {selected.symbols.length > 0 ? (
                <ul className="symbols">
                  {selected.symbols.slice(0, 40).map((sym) => (
                    <li key={`${sym.kind}:${sym.name}:${sym.line}`}>
                      {sym.kind} {sym.name}
                      {sym.complexity != null ? ` · c${sym.complexity}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">Sin símbolos en el snapshot.</p>
              )}
            </>
          ) : (
            <p className="empty">Haz clic en un edificio para inspeccionarlo.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
