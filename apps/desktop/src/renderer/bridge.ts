import type { CodarchCityApi } from "../main/preload";

declare global {
  interface Window {
    codarchCity?: CodarchCityApi;
  }
}

export function cityApi(): CodarchCityApi {
  const api = window.codarchCity;
  if (!api) {
    throw new Error("Puente Electron no disponible (codarchCity)");
  }
  return api;
}
