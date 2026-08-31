# STL / 3MF preview: recommendations

Today `STLViewerModal` only parses `.stl`, fetches the raw file URL directly, and is only wired into the public creator page. Thumbnails (`preview_images`) exist in the schema but are only populated by the demo seeder — real creator uploads get a grey file icon everywhere.

Recommended approach, in priority order.

## 1. Auto-generate a thumbnail at upload (highest impact)

When a creator picks a file in `/dashboard/files`, render it in an offscreen Three.js canvas in the browser, snapshot 1-3 angles to WebP, upload to the public `previews` bucket, and save the URLs into `preview_images`. Also capture and store mesh metadata while it's parsed: bounding box in mm, triangle count, file volume.

Why client-side: the Worker runtime can't run native mesh tooling, and the file is already in memory in the browser. Creators can still upload their own images to override.

## 2. Support the formats creators actually upload

Extend the viewer beyond STL:
- `.3mf` — `ThreeMFLoader`
- `.obj` — `OBJLoader`
- `.zip` — parse the archive client-side and preview the first mesh inside
- `.step/.stp/.gcode/.ctb` — no viewer; show an icon + metadata card instead

Choose the loader from `file_type` and fall back to a clean "no preview available" state.

## 3. Don't hand the full mesh to non-subscribers

The viewer currently fetches the file URL directly. For paid/locked files that means the geometry is downloadable from the preview. Fix by:
- Locked file → show only the generated thumbnails, no 3D viewer
- Unlocked file → fetch through a short-lived signed URL from a server function (same gating as `getFileDownloadUrl`), not a public URL
- Optionally store a decimated low-poly preview mesh at upload for locked files, so there is still a spin-able teaser without shipping the printable asset

## 4. Viewer quality-of-life

- Auto-rotate until first interaction, then stop
- Ground shadow + soft studio lighting instead of the flat grey box
- Overlay: dimensions (X/Y/Z mm), triangle count, file size
- Reset-view button, fullscreen, and pinch/drag on touch
- Size guard: skip in-browser parsing above ~75MB and show the thumbnail with a "too large to preview" note

## 5. Show previews everywhere

Wire thumbnails and the viewer into `/explore`, `/dashboard/files`, `/me/downloads`, and file cards on the creator page — with a small "3D" badge on cards that can be spun.

## Technical notes

- Thumbnail capture: reuse the dynamic-import pattern from `STLViewer.tsx`; render in a detached canvas, `toBlob('image/webp')`, upload to `previews/{creator_id}/{file_id}-{n}.webp`.
- New columns on `creator_files`: `dim_x`, `dim_y`, `dim_z`, `triangle_count` (with grants + RLS unchanged).
- Signed preview URL: new server fn alongside `getFileDownloadUrl` that runs the same access checks but returns a 5-minute URL and does not write a `downloads` row.
- Three.js loaders stay behind `await import(...)` so nothing enters the SSR graph.

## Suggested build order

1. Auto-thumbnails + metadata on upload (covers every surface at once)
2. 3MF/OBJ/ZIP loader support
3. Gated signed-URL viewer for locked files
4. Viewer polish and placement across the app
