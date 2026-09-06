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
const POLAR_ADJUST_DEGREES = 0;

const degToRad = (deg: number) => (deg * Math.PI) / 180;

// Frozen camera baseline — captured from the scene as it was authored
// before a later Spline edit nudged the default camera view. Deliberately
// hardcoded (rather than read live from Spline's current default camera
// each load) so future scene edits/republishes can never shift this again;
// only editing these numbers, or ZOOM_FACTOR/POLAR_ADJUST_DEGREES below,
// changes the baseline now.
// As originally captured from the scene:
//   camera { x: 81.698, y: 1449.223, z: 1104.988 }
//   target { x: -6.742, y: 718.736, z: 122.155 }
// Shifts both by the same amount on Y — a pure pan that doesn't touch
// zoom/tilt/angle, just where that fixed framing sits in world space.
// Negative moves the flower up on screen (aims the whole rig lower in
// world space, so the fixed geometry rises in frame). Tune this directly.
const VERTICAL_PAN = -150;
const BASELINE_CAMERA_POSITION = { x: 81.698, y: 1449.223 + VERTICAL_PAN, z: 1104.988 };
const BASELINE_TARGET = { x: -6.742, y: 718.736 + VERTICAL_PAN, z: 122.155 };

/**
 * Locks the Spline camera's zoom (distance) and vertical tilt (polar angle)
 * to the fixed baseline above — disables all native drag/zoom/pan input,
 * and instead drives the camera's horizontal orbit (azimuth) directly from
 * cursor x position, so moving the mouse left/right sweeps the view
 * left/right with no click required.
 *
 * Uses the camera's real `position`/`lookAt` (stable, core three.js API)
 * rather than OrbitControls' own rotate mechanism, which has no public
 * setter for azimuth — OrbitControls is only used here to read the live
 * target and to lock out its own input handling. See getOrbitControls in
 * projection.ts for the one undocumented-internal lookup this depends on.
 *
 * Returns a cleanup function; safe no-op if the scene's control internals
 * don't match the expected shape (fails soft — camera just stays as
 * authored, with native controls still active).
 */
export function attachCursorCameraFollow(app: Application, container: HTMLElement): () => void {
  const controls = getOrbitControls(app);
  if (!controls) return () => {};

  const { object: camera } = controls;

  // Use the frozen baseline's target too, not the scene's live target —
  // keeps the whole framing independent of whatever the Spline file
  // currently authors, not just the camera position.
  const target = BASELINE_TARGET;

  const dx0 = BASELINE_CAMERA_POSITION.x - target.x;
  const dy0 = BASELINE_CAMERA_POSITION.y - target.y;
  const dz0 = BASELINE_CAMERA_POSITION.z - target.z;
  const authoredRadius = Math.sqrt(dx0 * dx0 + dy0 * dy0 + dz0 * dz0);
  const radius = authoredRadius * ZOOM_FACTOR;
  if (radius === 0) return () => {};

  const initialTheta = Math.atan2(dx0, dz0); // azimuth around Y axis
  const authoredPolar = Math.acos(Math.max(-1, Math.min(1, dy0 / authoredRadius))); // polar angle from +Y
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
