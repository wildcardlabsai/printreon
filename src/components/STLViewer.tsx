import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, RotateCcw, X } from "lucide-react";
import { extensionOf, loadModel, MAX_PREVIEW_BYTES, type MeshStats } from "@/lib/mesh-preview";

interface Props {
  url: string;
  open: boolean;
  onClose: () => void;
  title?: string;
  /** file extension hint (stl / 3mf / obj / zip). Falls back to the URL. */
  fileType?: string | null;
}

export function STLViewerModal({ url, open, onClose, title, fileType }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MeshStats | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setStats(null);

        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

        const container = containerRef.current!;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf3f1ec);

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100000);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const key = new THREE.DirectionalLight(0xffffff, 1.3);
        key.position.set(3, 5, 4);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.45);
        fill.position.set(-4, 1, -3);
        scene.add(fill);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.6;
        const stopSpin = () => { controls.autoRotate = false; };
        renderer.domElement.addEventListener("pointerdown", stopSpin);
        renderer.domElement.addEventListener("wheel", stopSpin, { passive: true });

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load model");
        const lengthHeader = Number(res.headers.get("content-length") ?? 0);
        if (lengthHeader > MAX_PREVIEW_BYTES) {
          throw new Error("This file is too large to preview in the browser — download it to view.");
        }
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        const ext = extensionOf(fileType || url) || (fileType ?? "").toLowerCase();
        const model = await loadModel(buffer, ext);
        if (cancelled) { model.dispose(); return; }
        scene.add(model.object);
        setStats(model.stats);

        const maxDim = Math.max(model.stats.dimX, model.stats.dimY, model.stats.dimZ) || 1;
        // Soft ground shadow proxy
        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(maxDim * 0.75, 48),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.07 }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -model.stats.dimY / 2 - maxDim * 0.01;
        scene.add(shadow);

        const resetView = () => {
          const d = maxDim * 1.9;
          camera.position.set(d, d * 0.8, d);
          camera.near = maxDim / 100;
          camera.far = maxDim * 100;
          camera.updateProjectionMatrix();
          controls.target.set(0, 0, 0);
          controls.update();
        };
        resetView();
        resetRef.current = resetView;

        let raf = 0;
        const animate = () => {
          raf = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();
        setLoading(false);

        const onResize = () => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (!w || !h) return;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
          renderer.domElement.removeEventListener("pointerdown", stopSpin);
          renderer.domElement.removeEventListener("wheel", stopSpin);
          controls.dispose();
          model.dispose();
          shadow.geometry.dispose();
          (shadow.material as any).dispose();
          renderer.dispose();
          resetRef.current = null;
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
  }, [open, url, fileType]);

  if (!open) return null;

  const goFullscreen = () => {
    const el = containerRef.current;
    if (el?.requestFullscreen) void el.requestFullscreen();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 border-b border-border p-4">
          <h3 className="truncate font-bold text-ink">{title ?? "3D Preview"}</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => resetRef.current?.()} className="rounded-lg p-2 hover:bg-secondary" title="Reset view">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={goFullscreen} className="rounded-lg p-2 hover:bg-secondary" title="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div ref={containerRef} className="relative h-[60vh] w-full touch-none overflow-hidden bg-secondary">
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
          {stats && !loading && !error && (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-card/85 px-3 py-2 text-[11px] font-medium text-ink-soft backdrop-blur">
              {stats.dimX} × {stats.dimY} × {stats.dimZ} mm · {stats.triangleCount.toLocaleString()} triangles
            </div>
          )}
        </div>
        <p className="rounded-b-2xl px-4 py-3 text-xs text-ink-soft">Drag to rotate · Scroll or pinch to zoom · Right-click to pan</p>
      </div>
    </div>
  );
}
