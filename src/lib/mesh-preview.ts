/**
 * Browser-only helpers for loading 3D model files and producing thumbnails.
 * Every three.js import is dynamic so nothing enters the SSR graph.
 */

export const PREVIEWABLE_EXTENSIONS = ["stl", "3mf", "obj", "zip"] as const;

/** Above this we don't attempt in-browser parsing. */
export const MAX_PREVIEW_BYTES = 75 * 1024 * 1024;

export function extensionOf(nameOrUrl: string | null | undefined): string {
  if (!nameOrUrl) return "";
  const clean = nameOrUrl.split("?")[0].split("#")[0];
  return (clean.split(".").pop() ?? "").toLowerCase();
}

export function canPreview(fileTypeOrName: string | null | undefined): boolean {
  const ext = extensionOf(fileTypeOrName) || (fileTypeOrName ?? "").toLowerCase();
  return (PREVIEWABLE_EXTENSIONS as readonly string[]).includes(ext);
}

export interface MeshStats {
  dimX: number;
  dimY: number;
  dimZ: number;
  triangleCount: number;
}

/**
 * Cheap sanity checks on a parsed mesh. Returns human-readable flags —
 * an empty array means the model looks plausible.
 */
export function qualityFlags(stats: MeshStats, fileSizeBytes?: number): string[] {
  const flags: string[] = [];
  const dims = [stats.dimX, stats.dimY, stats.dimZ];
  const maxDim = Math.max(...dims);
  const minDim = Math.min(...dims);

  if (stats.triangleCount <= 0 || maxDim <= 0) {
    flags.push("The model contains no usable geometry.");
    return flags;
  }
  if (stats.triangleCount < 100) {
    flags.push(`Only ${stats.triangleCount} triangles — this looks like an empty or placeholder mesh.`);
  }
  if (maxDim < 1) {
    flags.push("The model is under 1mm across — check the export scale.");
  }
  if (maxDim > 1000) {
    flags.push("The model is over 1000mm across — check the export scale.");
  }
  if (minDim <= 0.001) {
    flags.push("The model is completely flat on one axis.");
  }
  if (fileSizeBytes && fileSizeBytes > 5 * 1024 * 1024 && stats.triangleCount < 5000) {
    flags.push("File size doesn't match the geometry — it may contain junk data.");
  }
  return flags;
}

/**
 * The badge system defined in the Terms of Service.
 * "Print-Tested" is not selectable — it is earned by attaching a photo of the
 * real print, so it lives on `print_verified_at`, not `creation_method`.
 */
export const CREATION_METHODS = [
  {
    value: "digital_sculpt",
    label: "Digital Sculpt — hand-crafted digitally",
    short: "Digital Sculpt",
    help: "Modelled by hand, watertight (manifold), and scaled for slicers. Not yet physically test-printed.",
  },
  {
    value: "ai_assisted",
    label: "AI-Assisted — AI base, refined by hand",
    short: "AI-Assisted",
    help: "Developed with 3D AI tools, then retopologised, repaired and refined manually. Raw, unedited AI exports are not allowed.",
  },
] as const;

/** Legacy values stored before the badge system was aligned to the Terms. */
const LEGACY_METHOD_MAP: Record<string, string> = {
  hand: "digital_sculpt",
  ai_generated: "ai_assisted",
};

/** Normalise any stored value to a current badge value. */
export function normaliseCreationMethod(value: string | null | undefined): string | null {
  if (!value) return null;
  return LEGACY_METHOD_MAP[value] ?? value;
}

/** True when the stored value predates the current badge system. */
export function isLegacyCreationMethod(value: string | null | undefined): boolean {
  return !!value && value in LEGACY_METHOD_MAP;
}

export function creationMethodLabel(value: string | null | undefined): string | null {
  const v = normaliseCreationMethod(value);
  return CREATION_METHODS.find((m) => m.value === v)?.short ?? null;
}

/**
 * The badge shown publicly: a print photo upgrades any file to Print-Tested.
 */
export function fileBadge(file: { creation_method?: string | null; print_verified_at?: string | null }): {
  key: "print_tested" | "digital_sculpt" | "ai_assisted";
  label: string;
} | null {
  if (file.print_verified_at) return { key: "print_tested", label: "Print-Tested" };
  const v = normaliseCreationMethod(file.creation_method);
  if (v === "digital_sculpt") return { key: "digital_sculpt", label: "Digital Sculpt" };
  if (v === "ai_assisted") return { key: "ai_assisted", label: "AI-Assisted" };
  return null;
}

export interface LoadedModel {
  /** three.js Object3D containing the mesh(es), centred at the origin. */
  object: any;
  stats: MeshStats;
  /** call to free GPU/CPU memory */
  dispose: () => void;
}

async function extractFromZip(buffer: ArrayBuffer): Promise<{ buffer: ArrayBuffer; ext: string }> {
  const { unzipSync } = await import("fflate");
  const entries = unzipSync(new Uint8Array(buffer));
  const candidate = Object.keys(entries).find((name) => {
    const ext = extensionOf(name);
    return ext === "stl" || ext === "3mf" || ext === "obj";
  });
  if (!candidate) throw new Error("No previewable model found inside this archive");
  const data = entries[candidate];
  return {
    buffer: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
    ext: extensionOf(candidate),
  };
}

/** Parse an arraybuffer of a supported model format into a centred three.js object. */
export async function loadModel(buffer: ArrayBuffer, extension: string): Promise<LoadedModel> {
  const THREE = await import("three");
  let ext = extension.toLowerCase();
  let data = buffer;

  if (ext === "zip") {
    const inner = await extractFromZip(buffer);
    data = inner.buffer;
    ext = inner.ext;
  }

  const material = new THREE.MeshStandardMaterial({
    color: 0x9aa2ad,
    metalness: 0.15,
    roughness: 0.55,
    flatShading: false,
  });

  let object: any;

  if (ext === "stl") {
    const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
    const geometry = new STLLoader().parse(data);
    geometry.computeVertexNormals();
    object = new THREE.Mesh(geometry, material);
  } else if (ext === "3mf") {
    const { ThreeMFLoader } = await import("three/examples/jsm/loaders/3MFLoader.js");
    object = new ThreeMFLoader().parse(data);
    object.traverse((child: any) => {
      if (child.isMesh) child.material = material;
    });
  } else if (ext === "obj") {
    const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader.js");
    const text = new TextDecoder().decode(data);
    object = new OBJLoader().parse(text);
    object.traverse((child: any) => {
      if (child.isMesh) child.material = material;
    });
  } else {
    throw new Error("This file type can't be previewed in 3D");
  }

  // Count triangles and centre the model at the origin.
  let triangleCount = 0;
  object.traverse((child: any) => {
    if (!child.isMesh || !child.geometry) return;
    const g = child.geometry;
    triangleCount += g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3;
  });

  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const centre = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(centre);
  object.position.sub(centre);

  const dispose = () => {
    object.traverse((child: any) => {
      if (child.isMesh) {
        child.geometry?.dispose?.();
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose?.());
        else child.material?.dispose?.();
      }
    });
  };

  return {
    object,
    stats: {
      dimX: Number(size.x.toFixed(2)),
      dimY: Number(size.y.toFixed(2)),
      dimZ: Number(size.z.toFixed(2)),
      triangleCount: Math.round(triangleCount),
    },
    dispose,
  };
}

const THUMB_ANGLES: Array<[number, number, number]> = [
  [1, 0.8, 1],
  [-1, 0.6, 1],
  [0, 1.4, 0.001],
];

/**
 * Render `count` thumbnails of a model file entirely in the browser.
 * Returns WebP blobs plus the measured mesh stats.
 */
export async function renderThumbnails(
  file: File,
  count = 3,
  size = 800,
): Promise<{ blobs: Blob[]; stats: MeshStats }> {
  if (file.size > MAX_PREVIEW_BYTES) throw new Error("File too large to render previews");
  const THREE = await import("three");
  const buffer = await file.arrayBuffer();
  const { object, stats, dispose } = await loadModel(buffer, extensionOf(file.name));

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f1ec);
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-4, 1, -3);
  scene.add(fill);
  scene.add(object);

  const maxDim = Math.max(stats.dimX, stats.dimY, stats.dimZ) || 1;
  const camera = new THREE.PerspectiveCamera(38, 1, maxDim / 100, maxDim * 100);

  const blobs: Blob[] = [];
  for (let i = 0; i < Math.min(count, THUMB_ANGLES.length); i++) {
    const [x, y, z] = THUMB_ANGLES[i];
    const dist = maxDim * 1.9;
    const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(dist);
    camera.position.copy(v);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (blob) blobs.push(blob);
  }

  dispose();
  renderer.dispose();

  return { blobs, stats };
}
