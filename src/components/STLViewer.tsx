import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, RotateCcw, X } from "lucide-react";
import { extensionOf, loadModel, MAX_PREVIEW_BYTES, type MeshStats } from "@/lib/mesh-preview";

export interface PrintSettings {
  print_time_minutes?: number | null;
  material?: string | null;
  supports_required?: boolean | null;
  layer_height_mm?: number | string | null;
  infill_percent?: number | null;
  recommended_printer?: string | null;
}

interface Props {
  url: string;
  open: boolean;
  onClose: () => void;
  title?: string;
  /** file extension hint (stl / 3mf / obj / zip). Falls back to the URL. */
  fileType?: string | null;
  /** optional creator-supplied recommended print settings */
  settings?: PrintSettings | null;
}

export function PrintSettingsChips({ settings, className = "" }: { settings?: PrintSettings | null; className?: string }) {
  if (!settings) return null;
  const chips: string[] = [];
  if (settings.material) chips.push(settings.material);
  if (settings.layer_height_mm != null && settings.layer_height_mm !== "") chips.push(`${settings.layer_height_mm}mm layers`);
  if (settings.infill_percent != null) chips.push(`${settings.infill_percent}% infill`);
  if (settings.supports_required != null) chips.push(settings.supports_required ? "Supports needed" : "No supports");
  if (settings.print_time_minutes) {
    const m = Number(settings.print_time_minutes);
    chips.push(m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m ` : ""}print` : `${m}m print`);
  }
  if (settings.recommended_printer) chips.push(settings.recommended_printer);
  if (chips.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {chips.map((c) => (
        <span key={c} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-ink-soft">{c}</span>
      ))}
    </div>
  );
}

export function STLViewerModal({ url, open, onClose, title, fileType, settings }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MeshStats | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setStats(null);

        // 1. Fetch + parse the model BEFORE touching the DOM, so an aborted
        //    run never leaves an empty canvas behind in the container.
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

        const container = containerRef.current;
        if (!container) { model.dispose(); return; }

        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        if (cancelled) { model.dispose(); return; }

        // Remove any canvas left over from a previous run.
        container.querySelectorAll("canvas").forEach((c) => c.remove());

        const width = container.clientWidth || 640;
        const height = container.clientHeight || 420;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf3f1ec);
        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100000);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.inset = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
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

        scene.add(model.object);
        setStats(model.stats);

        // Frame on the real world-space bounds (3MF groups can carry transforms).
        const bounds = new THREE.Box3().setFromObject(model.object);
        const centre = bounds.getCenter(new THREE.Vector3());
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        const radius = sphere.radius || 1;

        const shadow = new THREE.Mesh(
          new THREE.CircleGeometry(radius * 1.1, 48),
          new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.07 }),
        );
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(centre.x, bounds.min.y - radius * 0.02, centre.z);
        scene.add(shadow);

        const resetView = () => {
          const fitDist = (radius / Math.sin((camera.fov * Math.PI) / 360)) * 1.15;
          camera.position.set(
            centre.x + fitDist * 0.62,
            centre.y + fitDist * 0.5,
            centre.z + fitDist * 0.62,
          );
          camera.near = radius / 100;
          camera.far = radius * 100;
          camera.updateProjectionMatrix();
          controls.target.copy(centre);
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
        const ro = new ResizeObserver(onResize);
        ro.observe(container);

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
          ro.disconnect();
          renderer.domElement.removeEventListener("pointerdown", stopSpin);
          renderer.domElement.removeEventListener("wheel", stopSpin);
          controls.dispose();
          model.dispose();
          shadow.geometry.dispose();
          (shadow.material as any).dispose();
          renderer.dispose();
          resetRef.current = null;
          renderer.domElement.remove();
        };

        // If the effect was torn down while three.js was still importing.
        if (cancelled) cleanup();
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
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary text-ink-soft">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading 3D model…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-secondary p-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}
          {stats && !loading && !error && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg bg-card/85 px-3 py-2 text-[11px] font-medium text-ink-soft backdrop-blur">
              {stats.dimX} × {stats.dimY} × {stats.dimZ} mm · {stats.triangleCount.toLocaleString()} triangles
            </div>
          )}
        </div>
        <div className="rounded-b-2xl px-4 py-3">
          <PrintSettingsChips settings={settings} className="mb-2" />
          <p className="text-xs text-ink-soft">Drag to rotate · Scroll or pinch to zoom · Right-click to pan</p>
        </div>
      </div>
    </div>
  );
}
