import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";

interface Props {
  url: string;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function STLViewerModal({ url, open, onClose, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const THREE = await import("three");
        const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

        const container = containerRef.current!;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f7);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
        camera.position.set(150, 150, 150);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(1, 1, 1);
        scene.add(dir);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const loader = new STLLoader();
        const buffer = await fetch(url).then((r) => {
          if (!r.ok) throw new Error("Failed to load model");
          return r.arrayBuffer();
        });
        if (cancelled) return;
        const geometry = loader.parse(buffer);
        geometry.computeBoundingBox();
        geometry.center();
        const material = new THREE.MeshStandardMaterial({ color: 0x7a5cff, metalness: 0.1, roughness: 0.6 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const bbox = geometry.boundingBox!;
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const dist = maxDim * 2.2;
        camera.position.set(dist, dist, dist);
        camera.lookAt(0, 0, 0);

        let raf = 0;
        const animate = () => {
          raf = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
        setLoading(false);

        const onResize = () => {
          if (!container) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
          controls.dispose();
          renderer.dispose();
          geometry.dispose();
          material.dispose();
          if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
        };
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Could not preview this file");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [open, url]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-bold text-ink">{title ?? "3D Preview"}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        <div ref={containerRef} className="relative h-[60vh] w-full overflow-hidden rounded-b-2xl bg-secondary">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary text-ink-soft">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading 3D model…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary p-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
        <p className="px-4 pb-4 text-xs text-ink-soft">Drag to rotate · Scroll to zoom · Right-click to pan</p>
      </div>
    </div>
  );
}
