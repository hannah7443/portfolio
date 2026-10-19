"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { LiquidGlass } from "apple-liquid-glass-webgl";
import {
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GlassWindows, { type Artboard } from "./GlassWindows";
import { HoverFigTreeProvider } from "../spline/HoverFigTreeContext";
import {
  HoverPlaygroundClickCatcher,
  HoverPlaygroundLinks,
  HoverPlaygroundVisual,
} from "../spline/HoverPlayground";
import { PlaygroundVideoOverlay } from "../spline/PlaygroundVideoOverlay";
import { HoverAboutClickCatcher, HoverAboutVisual } from "../spline/HoverAbout";
import { isAnther, isPetal, isStemPart, MODEL_URL, prepareLily } from "./lily";
import { FIGMA_ANTHERS, FIGMA_PETALS, NAV_WINDOWS } from "./navWindows";

// The homepage lily in plain three.js (it replaced the Spline scene in
// components/spline/FlowerScene.tsx, which is kept but no longer used).
// Framing, lighting and cursor follow mirror the Spline version. The glass
// nav windows (GlassWindows) float over it, refracting the live scene.
// Also mounted on /lab/flower as a test bed.

// --- Camera: same numbers as cameraFollow.ts, except the zoom ---------------
const MAX_SWEEP_DEGREES = 35;
const FOLLOW_DAMPING = 0.08;
/** Camera distance as a share of the authored one; lower = closer = bigger flower (the old Spline homepage used 0.7). The glass windows scale with it. */
const ZOOM_FACTOR = 0.68;
const VERTICAL_PAN = -150;
const BASELINE_CAMERA = new THREE.Vector3(
  81.698,
  1449.223 + VERTICAL_PAN,
  1104.988,
);
const BASELINE_TARGET = new THREE.Vector3(
  -6.742,
  718.736 + VERTICAL_PAN,
  122.155,
);
/**
 * Where the homepage camera actually points. cameraFollow.ts orbits around
 * BASELINE_TARGET and calls lookAt() on it, but Spline's own OrbitControls
 * re-aims the camera at the scene's authored orbit target every time it
 * renders, so what's on screen looks here instead (read from the live
 * Spline camera). Matching it keeps the flower framed the same.
 */
const RENDERED_LOOK_AT = new THREE.Vector3(5.6, 731.62, 140.05);

// --- Lighting: read from the live Spline scene's three.js objects ----------
// (The GLB's exported light pointed the wrong way — this is what Spline
// actually renders with.) Intensities are three.js units, as Spline uses them.

/** Spline's "ambient" is a hemisphere light: light grey from above, mid grey from below — that's what separates upward faces from side/under faces. */
const HEMI = { sky: "#d3d3d3", ground: "#828282", intensity: 0.75 * Math.PI };
/**
 * The sun: high and slightly front-right, aimed at the world origin, with
 * Spline's shadow box. Spline's own intensity is 0.7π; 0.85π keeps the block
 * tops pure white now that less flat glow is lifting them (see LIT_SHARE).
 */
const SUN = {
  intensity: 0.85 * Math.PI,
  position: new THREE.Vector3(257.888, 1153.215, 272.834),
  target: new THREE.Vector3(0, 0, 0),
  shadow: {
    half: 1000,
    near: 300,
    far: 1350,
    mapSize: 1024,
    bias: 0,
    normalBias: 1,
    radius: 1,
  },
};
/**
 * Tone mapping and overall brightness. Spline's scene file asks for ACES, but
 * its live renderer runs with none — and ACES is what flattened this
 * version (it pulls bright tops down and dark sides up until the blocks blend).
 */
const TONE_MAPPING = THREE.NoToneMapping;
const EXPOSURE = 1;

const degToRad = (d: number) => (d * Math.PI) / 180;

/**
 * The scene's directional light, with Spline's shadow settings. The shadow
 * camera's bounds are set here and its projection explicitly refreshed —
 * three.js doesn't do that on its own, and without it the shadow area stays
 * at its tiny default and almost nothing casts a shadow.
 */
function Sun() {
  const light = useRef<THREE.DirectionalLight>(null);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.copy(SUN.target);
    scene.add(l.target);
    const { half, near, far, mapSize, bias, normalBias, radius } = SUN.shadow;
    const cam = l.shadow.camera;
    Object.assign(cam, {
      left: -half,
      right: half,
      top: half,
      bottom: -half,
      near,
      far,
    });
    cam.updateProjectionMatrix();
    l.shadow.mapSize.set(mapSize, mapSize);
    Object.assign(l.shadow, { bias, normalBias, radius });
    l.shadow.map?.dispose();
    l.shadow.map = null;
    return () => {
      scene.remove(l.target);
    };
  }, [scene]);
  return (
    <directionalLight
      ref={light}
      position={SUN.position.toArray()}
      intensity={SUN.intensity}
      castShadow
    />
  );
}

function CameraFollow({
  container,
}: {
  container: React.RefObject<HTMLDivElement | null>;
}) {
  const camera = useThree((s) => s.camera);
  const rig = useMemo(() => {
    const d = BASELINE_CAMERA.clone().sub(BASELINE_TARGET);
    const authored = d.length();
    return {
      radius: authored * ZOOM_FACTOR,
      polar: Math.acos(THREE.MathUtils.clamp(d.y / authored, -1, 1)),
      initialTheta: Math.atan2(d.x, d.z),
    };
  }, []);
  const theta = useRef({ target: rig.initialTheta, current: rig.initialTheta });

  useEffect(() => {
    // With reduced motion the camera holds its default angle instead of following the cursor.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const rect = container.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const x = THREE.MathUtils.clamp(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -1,
        1,
      );
      theta.current.target = rig.initialTheta + x * degToRad(MAX_SWEEP_DEGREES);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [container, rig]);

  useFrame(() => {
    const th = theta.current;
    th.current += (th.target - th.current) * FOLLOW_DAMPING;
    const ring = rig.radius * Math.sin(rig.polar);
    camera.position.set(
      BASELINE_TARGET.x + ring * Math.sin(th.current),
      BASELINE_TARGET.y + rig.radius * Math.cos(rig.polar),
      BASELINE_TARGET.z + ring * Math.cos(th.current),
    );
    camera.lookAt(RENDERED_LOOK_AT);
  });
  return null;
}

/**
 * Renders the scene ourselves (priority 1 takes over R3F's own render) and
 * tells the glass to repaint straight after, while the WebGL canvas still
 * holds this frame — a WebGL canvas is cleared once the frame is shown, so
 * the glass reading it later would see black.
 */
function RenderThenRefreshGlass() {
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    LiquidGlass.refreshAll();
  }, 1);
  return null;
}

/**
 * The "stem in front" window (see NavWindow.stemInFront): glass is a flat
 * layer over the scene, so it can't really sit between petals and stem in
 * depth. Instead, right after the main render (priority 2 runs after 1),
 * this redraws the scene from the same camera into a second, transparent
 * canvas stacked above the glass and clipped to that one window — with every
 * non-stem mesh swapped for an invisible depth-only material, so only the
 * stamens and stem show, still hidden wherever a petal is in front of them.
 * Inside that window: petals frosted behind the glass, stem crisp in front.
 */
function StemInFrontPass({ canvas }: { canvas: React.RefObject<HTMLCanvasElement | null> }) {
  const { gl, scene, size } = useThree();
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const depthOnly = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false }), []);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const r = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
    r.setClearColor(0x000000, 0);
    r.toneMapping = TONE_MAPPING;
    r.toneMappingExposure = EXPOSURE;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    renderer.current = r;
    return () => {
      r.dispose();
      renderer.current = null;
    };
  }, [canvas]);

  useEffect(() => {
    renderer.current?.setPixelRatio(gl.getPixelRatio());
    renderer.current?.setSize(size.width, size.height, false);
  }, [gl, size.width, size.height]);

  useFrame(({ camera }) => {
    const r = renderer.current;
    if (!r) return;
    const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible || isStemPart(mesh)) return;
      swapped.push([mesh, mesh.material]);
      mesh.material = depthOnly;
    });
    r.render(scene, camera);
    for (const [mesh, material] of swapped) mesh.material = material;
  }, 2);
  return null;
}

/** The camera at its default (no cursor) angle — what the glass windows are laid out against. */
function baselineCamera(aspect: number) {
  const cam = new THREE.PerspectiveCamera(45, aspect, 70, 100000);
  cam.position
    .copy(BASELINE_TARGET)
    .addScaledVector(BASELINE_CAMERA.clone().sub(BASELINE_TARGET), ZOOM_FACTOR);
  cam.lookAt(RENDERED_LOOK_AT);
  cam.updateMatrixWorld();
  return cam;
}

function Lily({ onArtboard }: { onArtboard: (a: Artboard) => void }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const scene = useMemo(() => {
    prepareLily(gltf.scene);
    return gltf.scene;
  }, [gltf]);
  const size = useThree((s) => s.size);

  // Map the Figma frame onto the page: project the petals and stamen tips at the default
  // camera angle, take the scale from the petals' width and the position from the tips.
  useEffect(() => {
    if (!size.width || !size.height) return;
    const cam = baselineCamera(size.width / size.height);
    scene.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let tipX = 0;
    let tipY = 0;
    let tips = 0;
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      const petal = isPetal(mesh);
      const anther = isAnther(mesh);
      if (!petal && !anther) return;
      const pos = mesh.geometry.getAttribute("position");
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i)
          .applyMatrix4(mesh.matrixWorld)
          .project(cam);
        const x = ((v.x + 1) / 2) * size.width;
        const y = ((1 - v.y) / 2) * size.height;
        if (petal) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        } else {
          tipX += x;
          tipY += y;
          tips++;
        }
      }
    });
    if (!Number.isFinite(minX) || !tips) return;
    // Horizontal: petal width. Vertical: stamen tips → lowest petal point. The two differ
    // because the Figma flower was captured from a slightly different camera angle.
    const sx = (maxX - minX) / (FIGMA_PETALS.right - FIGMA_PETALS.left);
    const ty = tipY / tips;
    const sy = (maxY - ty) / (FIGMA_PETALS.bottom - FIGMA_ANTHERS.y);
    onArtboard({ left: tipX / tips - FIGMA_ANTHERS.x * sx, top: ty - FIGMA_ANTHERS.y * sy, sx, sy });
  }, [scene, size.width, size.height, onArtboard]);

  return <primitive object={scene} />;
}

/** How long the flower and its windows take to fade in once `revealed`. */
const REVEAL_FADE = "opacity 900ms ease";
/** With reduced motion they appear at once (beats the inline transition). */
const NO_FADE_IF_REDUCED = "motion-reduce:transition-none!";

/**
 * `background` is drawn behind everything (the flower, the playground
 * screen) — on the homepage, the "hannah shin" name strip.
 *
 * `onReady` fires once the lily has loaded and been measured; until
 * `revealed`, the flower, glass and stem layer stay invisible (still
 * rendering underneath) — the homepage holds them back for its intro.
 */
export default function FlowerThree({
  background,
  onReady,
  revealed = true,
}: {
  background?: ReactNode;
  onReady?: () => void;
  revealed?: boolean;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const [artboard, setArtboard] = useState<Artboard | null>(null);
  const onArtboard = useCallback((a: Artboard) => setArtboard(a), []);
  const stemCanvas = useRef<HTMLCanvasElement | null>(null);
  const [stemClip, setStemClip] = useState<string | null>(null);
  const reveal = { opacity: revealed ? 1 : 0, transition: REVEAL_FADE };

  const ready = artboard !== null;
  useEffect(() => {
    if (ready) onReady?.();
  }, [ready, onReady]);

  // Clip the stem-in-front layer to its window, re-measured whenever the windows move.
  useEffect(() => {
    const node = NAV_WINDOWS.find((w) => w.stemInFront)?.node;
    const box = container.current;
    if (!node || !box || !artboard) return;
    const raf = requestAnimationFrame(() => {
      const el = box.querySelector(`[data-node="${node}"]`);
      if (!el) return;
      const c = box.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setStemClip(`inset(${r.top - c.top}px ${c.right - r.right}px ${c.bottom - r.bottom}px ${r.left - c.left}px)`);
    });
    return () => cancelAnimationFrame(raf);
  }, [artboard]);

  return (
    <HoverFigTreeProvider>
      <div ref={container} className="relative h-full w-full overflow-hidden">
        {background}
        {/* The PLAYGROUND and ABOUT windows' full-screen hover screens, stacked as on the old
          homepage: visuals behind the flower, click-catchers (z-5, click closes) above it, glass
          windows (z-10) above that. */}
        <HoverPlaygroundVisual />
        <HoverAboutVisual />
        <Canvas
          style={reveal}
          className={NO_FADE_IF_REDUCED}
          shadows="percentage"
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            // Renderer properties, not constructor options, so set once it exists.
            gl.toneMapping = TONE_MAPPING;
            gl.toneMappingExposure = EXPOSURE;
          }}
          camera={{
            fov: 45,
            near: 70,
            far: 100000,
            position: BASELINE_CAMERA.toArray(),
          }}
        >
          <hemisphereLight args={[HEMI.sky, HEMI.ground, HEMI.intensity]} />
          <Sun />
          <CameraFollow container={container} />
          <RenderThenRefreshGlass />
          <StemInFrontPass canvas={stemCanvas} />
          <Suspense fallback={null}>
            <Lily onArtboard={onArtboard} />
          </Suspense>
        </Canvas>

        <HoverPlaygroundClickCatcher />
        <HoverAboutClickCatcher />
        <HoverPlaygroundLinks />
        {/* z-10 here too, so the windows keep their place in the stack (see GlassWindows).
          inert until revealed, so the invisible windows can't be hovered, clicked or tabbed to. */}
        <div className={`pointer-events-none absolute inset-0 z-10 ${NO_FADE_IF_REDUCED}`} style={reveal} inert={!revealed}>
          {artboard && <GlassWindows artboard={artboard} />}
        </div>
        {/* Above the glass (z-10), clipped to the stem-in-front window; hidden until measured. */}
        <canvas
          ref={stemCanvas}
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[11] h-full w-full ${NO_FADE_IF_REDUCED}`}
          style={{ ...reveal, clipPath: stemClip ?? "inset(100%)" }}
        />
        <PlaygroundVideoOverlay />
      </div>
    </HoverFigTreeProvider>
  );
}
