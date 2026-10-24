import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  BoxGeometry,
  type Intersection
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Building, CityModel } from "@codarch-city/city-model";
import { readGpuInfo, type GpuInfo } from "./gpuInfo";

export type CityPick = {
  building: Building;
  instanceId: number;
};

export type FrameStats = {
  fps: number;
  drawCalls: number;
  triangles: number;
  lodFar: boolean;
};

const LOD_DISTANCE = 280;
const MAX_PIXEL_RATIO = 1.5;

export class CityScene {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly gpu: GpuInfo;

  private buildingsMesh: InstancedMesh | null = null;
  private lodMesh: InstancedMesh | null = null;
  private groundMeshes: Mesh[] = [];
  private city: CityModel | null = null;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private highlightedId: number | null = null;
  private readonly highlightColor = new Color(0xfff4a3);
  private readonly tempColor = new Color();
  private frame = 0;
  private lastFpsSample = performance.now();
  private framesInSample = 0;
  private fps = 0;
  private lodFar = false;
  private disposed = false;
  private readonly cityCenter = new Vector3();
  private readonly onPick: (pick: CityPick | null) => void;
  private readonly onStats: (stats: FrameStats) => void;

  constructor(
    canvas: HTMLCanvasElement,
    handlers: {
      onPick: (pick: CityPick | null) => void;
      onStats: (stats: FrameStats) => void;
    }
  ) {
    this.onPick = handlers.onPick;
    this.onStats = handlers.onStats;

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      alpha: false
    });
    this.renderer.setClearColor(new Color(0x1a1f24), 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.shadowMap.enabled = false;

    this.gpu = readGpuInfo(this.renderer);

    this.scene = new Scene();
    this.scene.fog = new Fog(0x1a1f24, 200, 900);

    this.camera = new PerspectiveCamera(50, 1, 0.5, 4000);
    this.camera.position.set(80, 60, 80);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.49;

    this.scene.add(new AmbientLight(0xffffff, 0.35));
    this.scene.add(new HemisphereLight(0xb8c4d4, 0x3a342c, 0.55));
    const sun = new DirectionalLight(0xfff2dd, 0.85);
    sun.position.set(40, 80, 20);
    this.scene.add(sun);

    const ground = new Mesh(
      new PlaneGeometry(4000, 4000),
      new MeshLambertMaterial({ color: 0x243028 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    this.scene.add(ground);

    canvas.addEventListener("pointerdown", this.handlePointer);
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    this.renderer.setAnimationLoop(this.tick);
  }

  get isWebGL2(): boolean {
    return this.gpu.isWebGL2;
  }

  setCity(city: CityModel): void {
    this.clearCity();
    this.city = city;
    this.buildCity(city);
    this.frameCity(city);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.handleResize);
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointer);
    this.clearCity();
    this.controls.dispose();
    this.renderer.dispose();
  }

  private clearCity(): void {
    if (this.buildingsMesh) {
      this.scene.remove(this.buildingsMesh);
      this.buildingsMesh.dispose();
      this.buildingsMesh.geometry.dispose();
      (this.buildingsMesh.material as MeshStandardMaterial).dispose();
      this.buildingsMesh = null;
    }
    if (this.lodMesh) {
      this.scene.remove(this.lodMesh);
      this.lodMesh.dispose();
      this.lodMesh.geometry.dispose();
      (this.lodMesh.material as MeshLambertMaterial).dispose();
      this.lodMesh = null;
    }
    for (const mesh of this.groundMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as MeshLambertMaterial).dispose();
    }
    this.groundMeshes = [];
    this.highlightedId = null;
  }

  private buildCity(city: CityModel): void {
    const count = city.buildings.length;
    if (count > 0) {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshStandardMaterial({
        roughness: 0.72,
        metalness: 0.08,
        vertexColors: false
      });
      const mesh = new InstancedMesh(geometry, material, count);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = true;

      const matrix = new Matrix4();
      const color = new Color();
      for (let i = 0; i < count; i += 1) {
        const b = city.buildings[i]!;
        matrix.makeScale(b.size.x, b.size.y, b.size.z);
        matrix.setPosition(b.position.x, b.position.y, b.position.z);
        mesh.setMatrixAt(i, matrix);
        color.setHex(b.color);
        mesh.setColorAt(i, color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      this.buildingsMesh = mesh;
      this.scene.add(mesh);
    }

    const districtCount = city.districts.length;
    if (districtCount > 0) {
      const lodGeo = new BoxGeometry(1, 1, 1);
      const lodMat = new MeshLambertMaterial({ color: 0x6a7a70, transparent: true, opacity: 0.85 });
      const lod = new InstancedMesh(lodGeo, lodMat, districtCount);
      lod.visible = false;
      const matrix = new Matrix4();
      for (let i = 0; i < districtCount; i += 1) {
        const d = city.districts[i]!;
        matrix.makeScale(d.lodBox.size.x, d.lodBox.size.y, d.lodBox.size.z);
        matrix.setPosition(d.lodBox.position.x, d.lodBox.position.y, d.lodBox.position.z);
        lod.setMatrixAt(i, matrix);
      }
      lod.instanceMatrix.needsUpdate = true;
      this.lodMesh = lod;
      this.scene.add(lod);

      for (const d of city.districts) {
        const plate = new Mesh(
          new PlaneGeometry(d.ground.size.x, d.ground.size.z),
          new MeshLambertMaterial({ color: d.ground.color })
        );
        plate.rotation.x = -Math.PI / 2;
        plate.position.set(d.ground.position.x, 0.02, d.ground.position.z);
        this.scene.add(plate);
        this.groundMeshes.push(plate);
      }
    }
  }

  private frameCity(city: CityModel): void {
    const { minX, maxX, minZ, maxZ, maxY } = city.bounds;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxZ - minZ, 40);
    this.controls.target.set(cx, 0, cz);
    this.camera.position.set(cx + span * 0.7, Math.max(maxY * 2.2, span * 0.45), cz + span * 0.7);
    this.controls.update();
  }

  private readonly handleResize = (): void => {
    const canvas = this.renderer.domElement;
    const parent = canvas.parentElement;
    const width = parent?.clientWidth ?? window.innerWidth;
    const height = parent?.clientHeight ?? window.innerHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private readonly handlePointer = (event: PointerEvent): void => {
    if (!this.buildingsMesh || !this.city || this.lodFar) {
      this.onPick(null);
      return;
    }
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.buildingsMesh, false);
    const hit = hits[0] as Intersection | undefined;
    if (!hit || hit.instanceId === undefined) {
      this.clearHighlight();
      this.onPick(null);
      return;
    }
    const building = this.city.buildings[hit.instanceId];
    if (!building) {
      this.onPick(null);
      return;
    }
    this.setHighlight(hit.instanceId);
    this.onPick({ building, instanceId: hit.instanceId });
  };

  private setHighlight(instanceId: number): void {
    if (!this.buildingsMesh) return;
    this.clearHighlight();
    this.buildingsMesh.setColorAt(instanceId, this.highlightColor);
    if (this.buildingsMesh.instanceColor) {
      this.buildingsMesh.instanceColor.needsUpdate = true;
    }
    this.highlightedId = instanceId;
  }

  private clearHighlight(): void {
    if (this.highlightedId === null || !this.buildingsMesh || !this.city) return;
    const b = this.city.buildings[this.highlightedId];
    if (b) {
      this.tempColor.setHex(b.color);
      this.buildingsMesh.setColorAt(this.highlightedId, this.tempColor);
      if (this.buildingsMesh.instanceColor) {
        this.buildingsMesh.instanceColor.needsUpdate = true;
      }
    }
    this.highlightedId = null;
  }

  private readonly tick = (): void => {
    if (this.disposed) return;
    this.controls.update();
    this.updateLod();
    this.renderer.render(this.scene, this.camera);

    this.framesInSample += 1;
    this.frame += 1;
    const now = performance.now();
    if (now - this.lastFpsSample >= 500) {
      this.fps = (this.framesInSample * 1000) / (now - this.lastFpsSample);
      this.framesInSample = 0;
      this.lastFpsSample = now;
      this.onStats({
        fps: this.fps,
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        lodFar: this.lodFar
      });
    }
  };

  private updateLod(): void {
    if (!this.city) return;
    const { minX, maxX, minZ, maxZ } = this.city.bounds;
    this.cityCenter.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    const far = this.camera.position.distanceTo(this.cityCenter) > LOD_DISTANCE;
    if (far === this.lodFar) return;
    this.lodFar = far;
    if (this.buildingsMesh) this.buildingsMesh.visible = !far;
    if (this.lodMesh) this.lodMesh.visible = far;
  }
}
