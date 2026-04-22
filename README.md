# equi-panorama

> A tiny, dependency-light equirectangular panorama viewer for the web — a drop-in React component and a zero-build HTML demo.

> LIVE DEMO [https://scuffedepoch.com/equi-panorama/](https://scuffedepoch.com/equi-panorama/)

Tip: Use GPT Image 2 and generate an image which is an "equirectangular panorama" in your prompt.

![Three.js](https://img.shields.io/badge/three.js-r128+-000000?logo=three.js&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## What it is

An **equirectangular panorama** is the kind of 360° photo you get from a Ricoh Theta, an Insta360, a drone stitch, or a 3D render with a spherical camera. It's a single 2:1 image where latitude runs down the vertical axis and longitude runs along the horizontal — a sphere *unrolled* onto a rectangle.

`equi-panorama` **re-rolls the sphere.** It pastes the image onto the inside of a Three.js sphere, puts the camera at the centre, and lets the mouse rotate the view. The result is the familiar click-and-drag 360° viewer you see on Google Street View, Airbnb listings, virtual museum tours, and real-estate walkthroughs — but as a ~150-line component you actually own and can modify.

## Why it exists

Every panorama-viewer library on npm either:

- pulls in 200 kB of UI chrome you don't want,
- hides the Three.js behind an abstraction that fights you the moment you need to do something custom, or
- hasn't been updated since Three.js r95.

This repo ships two files you can read in one sitting and adapt to any project.

## What's in the box

| File | Purpose |
|---|---|
| **`equi-panorama.jsx`** | The reusable React component. Pass a `src`, get a draggable panorama. |
| **`DEMO.html`** | A standalone, no-build, no-npm demonstration page. Double-click to open. |

## Features

- 🖱️ **Mouse & touch drag** to look around (unified pointer events)
- 🔍 **Scroll-wheel zoom** with FOV clamped to 25°–100°
- 🔄 **Optional auto-rotate** when idle
- 📐 **Drag-speed scales with FOV** so zoomed-in panning feels natural
- 🧭 **Latitude clamping** at ±85° to prevent gimbal-flip at the poles
- 📱 **Responsive** — resizes with its container
- 🎯 **Recenter** button to snap back to the default view
- 💡 **Loading state** with graceful texture swap
- 🧹 **Proper cleanup** — no leaked WebGL contexts, textures, or geometry on unmount

---

## Quick start — React

```bash
npm install three
```

```jsx
import EquiPanorama from "./equi-panorama";

export default function App() {
  return (
    <EquiPanorama
      src="/my-panorama.jpg"
      height={560}
      autoRotate={false}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | *(a sample pano)* | URL of your equirectangular (2:1) image. |
| `height` | `number` | `520` | Canvas height in pixels. Width follows container. |
| `initialLon` | `number` | `0` | Starting yaw in degrees. |
| `initialLat` | `number` | `0` | Starting pitch in degrees. |
| `autoRotate` | `boolean` | `false` | Gently rotate the view when the user isn't dragging. |

---

## Quick start — plain HTML

No build step, no dependencies to install. Just open `DEMO.html` in a modern browser.

The demo uses an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) to pull Three.js directly from a CDN, and includes a complete HUD (yaw, pitch, FOV, FPS), a three-scene gallery, auto-rotate toggle, and fullscreen mode — all in a single file you can strip down or build on.

---

## Using your own panorama

Your image must be:

1. **A true equirectangular projection** — a 2:1 aspect ratio (e.g. 4096×2048, 8192×4096).
2. **Served with CORS headers** if it's on a different domain than your page, or the texture will appear black.

Most 360° cameras export directly to this format. For software renders, set your camera type to "panoramic" / "spherical" / "equirectangular" (the name varies by engine).

---

## How it works

The mental model is three lines long:

1. **Build a sphere with its normals flipped inward.** Normally a sphere's surface faces outward; we invert it so the texture sits on the *inside* — where the camera lives.
2. **Paste the panorama onto that sphere as a texture.** `MeshBasicMaterial` means no lighting math — we don't need any, because we're looking at a photograph.
3. **Convert mouse drags into longitude/latitude and aim the camera** at the corresponding point on the sphere's surface using `camera.lookAt()`.

That's it. The rest is polish: FOV-proportional drag speed, pole clamping, wheel zoom, input capture, and cleanup on unmount.

---

## Browser support

Any browser with WebGL and pointer events — so, everything from 2018 onward. Tested in Chrome, Firefox, Safari, and Edge on desktop and mobile.

---

## Common extensions

This is a foundation, not a finished product. Things you might add:

- **Hotspots / annotations** — raycast from pointer into the scene, overlay DOM elements at projected 3D positions.
- **Multiple linked panoramas** — a tour with "portal" hotspots that transition between scenes.
- **Gyroscope control on mobile** — read `DeviceOrientation` events and feed them into lon/lat.
- **VR mode** — Three.js has a `WebXRManager`; with stereo rendering you get a proper headset experience.
- **Tiled / progressive loading** — for ultra-high-resolution panoramas, split the sphere into tiles and load on demand.

---

## License

MIT — do whatever you like, just keep the copyright notice.

## 📚 Citation

### Academic Citation
If you use this codebase in your research or project, please cite:
```bibtex
@software{equi_panorama,
  title = {equi-panorama: A lightweight equirectangular panorama viewer for the web},
  author = {Drift Johnson},
  year = {2025},
  url = {https://github.com/MushroomFleet/equi-panorama-jsx},
  version = {1.0.0}
}
```

### Donate:
[![Ko-Fi](https://cdn.ko-fi.com/cdn/kofi3.png?v=3)](https://ko-fi.com/driftjohnson)
