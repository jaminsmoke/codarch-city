import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  type MenuItemConstructorOptions
} from "electron";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  REFERENCE_REPO,
  loadRepoCityData,
  loadSnapshotFromFile
} from "./analyze";
import { snapshotToCity, type CityModel } from "@codarch-city/city-model";

/**
 * GPU: forzar discreta + ANGLE D3D11 en Windows (antes de ready).
 */
app.commandLine.appendSwitch("force_high_performance_gpu");
if (process.platform === "win32") {
  app.commandLine.appendSwitch("use-angle", "d3d11");
}

const DIST = path.join(__dirname);
const PRELOAD = path.join(DIST, "preload.cjs");
const RENDERER = path.join(DIST, "renderer", "index.html");

let window: BrowserWindow | null = null;

function createWindow(): void {
  window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#1a1f24",
    title: "Codarch City",
    show: false,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void window.loadURL(devUrl);
  } else {
    void window.loadFile(RENDERER);
  }

  // DevTools solo a demanda (menú Ver o CODARCH_CITY_DEVTOOLS=1).
  if (process.env.CODARCH_CITY_DEVTOOLS === "1") {
    window.webContents.openDevTools({ mode: "bottom" });
  }

  window.once("ready-to-show", () => window?.show());
}

function buildMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "Archivo",
      submenu: [
        {
          label: "Abrir carpeta…",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            void openFolder(false);
          }
        },
        {
          label: "Abrir carpeta y reanalizar…",
          click: () => {
            void openFolder(true);
          }
        },
        {
          label: "Cargar cc.json…",
          accelerator: "CmdOrCtrl+L",
          click: () => {
            void openSnapshot();
          }
        },
        {
          label: "Repo referencia (PyTalktoWrite)",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            void openReferenceRepo();
          }
        },
        { type: "separator" },
        { role: "quit", label: "Salir" }
      ]
    },
    {
      label: "Ver",
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools", label: "Herramientas de desarrollo" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function publishCity(city: CityModel, source: string): Promise<void> {
  window?.webContents.send("city:loaded", { city, source });
}

async function openFolder(forceAnalyze: boolean): Promise<void> {
  if (!window) return;
  const result = await dialog.showOpenDialog(window, {
    title: forceAnalyze ? "Seleccionar repositorio (reanalizar)" : "Seleccionar repositorio",
    properties: ["openDirectory"]
  });
  if (result.canceled || result.filePaths.length === 0) return;
  const root = result.filePaths[0]!;
  window.webContents.send("city:status", {
    state: forceAnalyze ? "analyzing" : "loading",
    message: root
  });
  try {
    const { snapshot, source, fromCache } = await loadRepoCityData(root, {
      forceAnalyze
    });
    const city = snapshotToCity(snapshot);
    await publishCity(city, fromCache ? `${source} (Codarch cache)` : source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    window.webContents.send("city:status", { state: "error", message });
  }
}

async function openSnapshot(): Promise<void> {
  if (!window) return;
  const result = await dialog.showOpenDialog(window, {
    title: "Cargar snapshot Codarch",
    properties: ["openFile"],
    filters: [
      { name: "Codarch snapshot", extensions: ["json", "gz", "cc.json"] },
      { name: "Todos", extensions: ["*"] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return;
  const filePath = result.filePaths[0]!;
  window.webContents.send("city:status", { state: "loading", message: filePath });
  try {
    const snapshot = await loadSnapshotFromFile(filePath);
    const city = snapshotToCity(snapshot);
    await publishCity(city, filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    window.webContents.send("city:status", { state: "error", message });
  }
}

async function openReferenceRepo(): Promise<void> {
  if (!window) return;
  if (!existsSync(REFERENCE_REPO)) {
    window.webContents.send("city:status", {
      state: "error",
      message: `No existe el repo de referencia:\n${REFERENCE_REPO}`
    });
    return;
  }
  window.webContents.send("city:status", {
    state: "loading",
    message: REFERENCE_REPO
  });
  try {
    const { snapshot, source, fromCache } = await loadRepoCityData(REFERENCE_REPO);
    const city = snapshotToCity(snapshot);
    await publishCity(
      city,
      fromCache ? `PyTalktoWrite · ${source}` : `PyTalktoWrite · ${source}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    window.webContents.send("city:status", { state: "error", message });
  }
}

ipcMain.handle("city:open-folder", async (_e, forceAnalyze?: boolean) => {
  await openFolder(Boolean(forceAnalyze));
});

ipcMain.handle("city:open-snapshot", async () => {
  await openSnapshot();
});

ipcMain.handle("city:open-reference", async () => {
  await openReferenceRepo();
});

ipcMain.handle("city:load-demo", async (): Promise<CityModel | null> => {
  const candidates = [
    path.resolve(process.cwd(), "samples", "codecharta_visualization.cc.json.gz"),
    path.resolve(process.cwd(), "..", "..", "samples", "codecharta_visualization.cc.json.gz"),
    path.resolve(
      process.cwd(),
      "..",
      "Visual Software Architecture",
      "samples",
      "codecharta_visualization.cc.json.gz"
    ),
    "C:\\Users\\jaminsmoke\\Documents\\Proyectos\\Programacion\\Codarch City\\samples\\codecharta_visualization.cc.json.gz",
    "C:\\Users\\jaminsmoke\\Documents\\Proyectos\\Programacion\\Visual Software Architecture\\samples\\codecharta_visualization.cc.json.gz"
  ];
  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    const snapshot = await loadSnapshotFromFile(filePath);
    return snapshotToCity(snapshot);
  }
  return null;
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
