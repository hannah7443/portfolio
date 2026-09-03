"use client";

import type { Application } from "@splinetool/runtime";
import { getOrbitControls } from "./projection";

// How far the camera sweeps left/right from its starting position as the
// cursor crosses the full viewport width, in degrees each direction.
const MAX_SWEEP_DEGREES = 35;
// Higher = snappier follow, lower = more trailing/lag. 0..1 per frame.
const FOLLOW_DAMPING = 0.08;
// Scales the camera's starting distance before locking it as the fixed
// zoom level — below 1 zooms in closer than however the scene was authored
// in Spline, above 1 zooms out. Tune this directly to change zoom.
const ZOOM_FACTOR = 0.7;
// Shifts the locked vertical tilt away from top-down and toward eye-level,
// in degrees. 0 = keep the scene's authored overhead angle as-is; larger
// values tilt further toward looking at the flower from the side (90° would
// be fully level with the target, avoided here to stay clear of gimbal lock).
const POLAR_ADJUST_DEGREES = 10;

const degToRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Locks the Spline camera's zoom (distance) and vertical tilt (polar angle)
 * to whatever they are at the moment this is called — capturing the scene's
 * current "zoomed in, overhead" framing as a fixed baseline — disables all
 * native drag/zoom/pan input, and instead drives the camera's horizontal
 * orbit (azimuth) directly from cursor x position, so moving the mouse
 * left/right sweeps the view left/right with no click required.
 *
 * Uses the camera's real `position`/`lookAt` (stable, core three.js API)
 * rather than OrbitControls' own rotate mechanism, which has no public
 * setter for azimuth — OrbitControls is only used here to read the starting
 * target/distance/angle and to lock out its own input handling. See
 * getOrbitControls in projection.ts for the one undocumented-internal
 * lookup this depends on.
 *
 * Returns a cleanup function; safe no-op if the scene's control internals
 * don't match the expected shape (fails soft — camera just stays as
 * authored, with native controls still active).
 */
export function attachCursorCameraFollow(app: Application, container: HTMLElement): () => void {
  const controls = getOrbitControls(app);
  if (!controls) return () => {};

  const { object: camera, target } = controls;

  const dx0 = camera.position.x - target.x;
  const dy0 = camera.position.y - target.y;
  const dz0 = camera.position.z - target.z;
  const radius = Math.sqrt(dx0 * dx0 + dy0 * dy0 + dz0 * dz0) * ZOOM_FACTOR;
  if (radius === 0) return () => {};

  const initialTheta = Math.atan2(dx0, dz0); // azimuth around Y axis
  const authoredPolar = Math.acos(Math.max(-1, Math.min(1, dy0 / (radius / ZOOM_FACTOR)))); // polar angle from +Y
  const polar = Math.min(authoredPolar + degToRad(POLAR_ADJUST_DEGREES), degToRad(89));

  // Lock zoom and vertical tilt at their current values; disable all native
  // drag/zoom/pan so nothing fights the automatic follow below.
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.minDistance = radius;
  controls.maxDistance = radius;
  controls.minPolarAngle = polar;
  controls.maxPolarAngle = polar;

  const sweep = degToRad(MAX_SWEEP_DEGREES);
  let targetTheta = initialTheta;
  let currentTheta = initialTheta;
  let raf = 0;

  function setThetaFromClientX(clientX: number) {
    const rect = container.getBoundingClientRect();
    const normalizedX = rect.width > 0 ? ((clientX - rect.left) / rect.width) * 2 - 1 : 0;
    const clamped = Math.max(-1, Math.min(1, normalizedX));
    targetTheta = initialTheta + clamped * sweep;
  }

  function handlePointerMove(e: PointerEvent) {
    setThetaFromClientX(e.clientX);
  }

  function tick() {
    currentTheta += (targetTheta - currentTheta) * FOLLOW_DAMPING;

    const sinPolarRadius = radius * Math.sin(polar);
    const x = target.x + sinPolarRadius * Math.sin(currentTheta);
    const y = target.y + radius * Math.cos(polar);
    const z = target.z + sinPolarRadius * Math.cos(currentTheta);

    camera.position.set(x, y, z);
    camera.lookAt(target.x, target.y, target.z);

    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("pointermove", handlePointerMove);
  raf = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    cancelAnimationFrame(raf);
  };
}
