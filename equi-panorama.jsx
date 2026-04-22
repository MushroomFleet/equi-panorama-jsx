import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

/**
 * EquiPanorama
 * -------------------------------------------------------------
 * Drop an equirectangular (2:1) image in and get a mouse-drag
 * controllable 360° view. Wrap the image as a texture on the
 * INSIDE of a sphere, put the camera at its center, rotate the
 * camera's yaw (lon) and pitch (lat) from pointer input.
 *
 * Props:
 *   src         — URL of the equirectangular panorama
 *   height      — canvas height in px (default 520)
 *   initialLon  — starting yaw in degrees (default 0)
 *   initialLat  — starting pitch in degrees (default 0)
 *   autoRotate  — slow drift when idle (default false)
 */
export default function EquiPanorama({
  src = "https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg",
  height = 520,
  initialLon = 0,
  initialLat = 0,
  autoRotate = false,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    lon: initialLon,
    lat: initialLat,
    isDown: false,
    downX: 0,
    downY: 0,
    downLon: 0,
    downLat: 0,
    fov: 75,
  });
  const [loaded, setLoaded] = useState(false);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const h = height;

    // --- scene / camera / renderer ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(stateRef.current.fov, width / h, 0.1, 1100);
    camera.position.set(0, 0, 0.01); // slight offset so lookAt works

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, h);
    mount.appendChild(renderer.domElement);

    // --- the inverted sphere ---
    const geometry = new THREE.SphereGeometry(500, 64, 40);
    geometry.scale(-1, 1, 1); // flip normals so texture faces the camera inside

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const texture = loader.load(
      src,
      () => setLoaded(true),
      undefined,
      (err) => console.error("Panorama texture failed to load:", err)
    );
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // --- pointer handlers (unified mouse + touch via pointer events) ---
    const el = renderer.domElement;
    el.style.touchAction = "none";
    el.style.cursor = "grab";

    const onDown = (e) => {
      const s = stateRef.current;
      s.isDown = true;
      s.downX = e.clientX;
      s.downY = e.clientY;
      s.downLon = s.lon;
      s.downLat = s.lat;
      el.style.cursor = "grabbing";
      el.setPointerCapture?.(e.pointerId);
      setHint(false);
    };
    const onMove = (e) => {
      const s = stateRef.current;
      if (!s.isDown) return;
      // scale drag by FOV so zoomed-in view feels proportionally slower
      const scale = s.fov / 75 * 0.12;
      s.lon = s.downLon - (e.clientX - s.downX) * scale;
      s.lat = s.downLat + (e.clientY - s.downY) * scale;
      s.lat = Math.max(-85, Math.min(85, s.lat));
    };
    const onUp = (e) => {
      stateRef.current.isDown = false;
      el.style.cursor = "grab";
      el.releasePointerCapture?.(e.pointerId);
    };
    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      s.fov = Math.max(25, Math.min(100, s.fov + e.deltaY * 0.05));
      camera.fov = s.fov;
      camera.updateProjectionMatrix();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    // --- resize ---
    const onResize = () => {
      const w = mount.clientWidth;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // --- render loop ---
    let raf;
    const tick = () => {
      const s = stateRef.current;
      if (autoRotate && !s.isDown) s.lon += 0.03;

      // convert lon/lat → spherical target point
      const phi = THREE.MathUtils.degToRad(90 - s.lat);
      const theta = THREE.MathUtils.degToRad(s.lon);
      const tx = 500 * Math.sin(phi) * Math.cos(theta);
      const ty = 500 * Math.cos(phi);
      const tz = 500 * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(tx, ty, tz);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // --- cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, [src, height, autoRotate]);

  const resetView = useCallback(() => {
    stateRef.current.lon = initialLon;
    stateRef.current.lat = initialLat;
    stateRef.current.fov = 75;
  }, [initialLon, initialLat]);

  return (
    <div className="w-full">
      <div
        ref={mountRef}
        className="relative w-full overflow-hidden rounded-sm bg-stone-950 ring-1 ring-stone-800"
        style={{ height }}
      >
        {/* loading veil */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-950/90 text-stone-400">
            <div className="flex items-center gap-3 font-mono text-xs tracking-[0.25em] uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              Projecting sphere
            </div>
          </div>
        )}

        {/* drag hint */}
        {loaded && hint && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-stone-950/70 px-4 py-1.5 font-mono text-[10px] tracking-[0.3em] uppercase text-stone-300 backdrop-blur-sm ring-1 ring-white/10">
            drag to look · scroll to zoom
          </div>
        )}

        {/* compass / reset */}
        {loaded && (
          <button
            onClick={resetView}
            className="absolute right-3 top-3 rounded-full bg-stone-950/70 px-3 py-1.5 font-mono text-[10px] tracking-[0.25em] uppercase text-stone-300 backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-stone-900 hover:text-amber-300"
          >
            recenter
          </button>
        )}
      </div>
    </div>
  );
}
