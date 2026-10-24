import { contextBridge, ipcRenderer } from "electron";
import type { CityModel } from "@codarch-city/city-model";

export type CityStatus = {
  state: "idle" | "analyzing" | "loading" | "error";
  message?: string;
};

export type CityLoadedPayload = {
  city: CityModel;
  source: string;
};

const api = {
  openFolder: (forceAnalyze = false): Promise<void> =>
    ipcRenderer.invoke("city:open-folder", forceAnalyze),
  openSnapshot: (): Promise<void> => ipcRenderer.invoke("city:open-snapshot"),
  openReference: (): Promise<void> => ipcRenderer.invoke("city:open-reference"),
  loadDemo: (): Promise<CityModel | null> => ipcRenderer.invoke("city:load-demo"),
  onLoaded: (handler: (payload: CityLoadedPayload) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: CityLoadedPayload) => {
      handler(payload);
    };
    ipcRenderer.on("city:loaded", listener);
    return () => ipcRenderer.removeListener("city:loaded", listener);
  },
  onStatus: (handler: (status: CityStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: CityStatus) => {
      handler(status);
    };
    ipcRenderer.on("city:status", listener);
    return () => ipcRenderer.removeListener("city:status", listener);
  }
};

contextBridge.exposeInMainWorld("codarchCity", api);

export type CodarchCityApi = typeof api;
