import type { WebGLRenderer } from "three";

export type GpuInfo = {
  vendor: string;
  renderer: string;
  isWebGL2: boolean;
  isNvidia: boolean;
  angleD3D11: boolean;
};

export function readGpuInfo(renderer: WebGLRenderer): GpuInfo {
  const gl = renderer.getContext();
  let vendor = "unknown";
  let rendererName = "unknown";

  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  if (debug) {
    vendor = String(gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) ?? vendor);
    rendererName = String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) ?? rendererName);
  }

  const combined = `${vendor} ${rendererName}`.toLowerCase();
  return {
    vendor,
    renderer: rendererName,
    isWebGL2: renderer.capabilities.isWebGL2,
    isNvidia: combined.includes("nvidia") || combined.includes("geforce"),
    angleD3D11: combined.includes("direct3d11") || combined.includes("d3d11")
  };
}
