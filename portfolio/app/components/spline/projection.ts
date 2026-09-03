/**
 * Everything in this file touches undocumented, unversioned internals of
 * @splinetool/runtime (there is no public API for world->screen projection
 * as of runtime@2.0.32). If a runtime upgrade breaks this, this is the only
 * file that should need fixing — nothing else in the app depends on the
 * internal shape, only on the `projectToScreen` / `getCamera` functions below.
 */
import type { Application, SPEObject } from "@splinetool/runtime";

type Mat4 = { elements: number[] };
type Vec3Like = { x: number; y: number; z: number };

export type SplineCameraLike = {
  matrixWorldInverse: Mat4;
  projectionMatrix: Mat4;
  position: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void };
  lookAt: (x: number, y: number, z: number) => void;
};

/** A real three.js OrbitControls instance — only the public, documented
 * members used by cameraFollow.ts are declared here. */
export type SplineOrbitControlsLike = {
  object: SplineCameraLike;
  target: { x: number; y: number; z: number };
  enableZoom: boolean;
  enablePan: boolean;
  enableRotate: boolean;
  minDistance: number;
  maxDistance: number;
  minPolarAngle: number;
  maxPolarAngle: number;
};

/**
 * Reaches into the runtime's internal OrbitControls wrapper. Same
 * undocumented-internal caveat as getCamera below.
 */
export function getOrbitControls(app: Application): SplineOrbitControlsLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controls = (app as any)?._controls?.orbitControls ?? null;
    if (controls?.object && controls?.target) return controls as SplineOrbitControlsLike;
    return null;
  } catch {
    return null;
  }
}

/**
 * Reaches into the runtime's internal OrbitControls wrapper to grab the
 * live three.js camera instance. Returns null if the internal shape has
 * changed (fails soft instead of throwing).
 */
export function getCamera(app: Application): SplineCameraLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyApp = app as any;
    const camera =
      anyApp?._controls?.orbitControls?.object ??
      anyApp?._controls?.object ??
      anyApp?.camera ??
      null;
    if (camera?.matrixWorldInverse && camera?.projectionMatrix) {
      return camera as SplineCameraLike;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Reaches into the internal three.js scene graph to get an object's real
 * matrixWorld — which already bakes in every parent group's position,
 * rotation, and scale. `SPEObject.position`/`.scale` (the public API) are
 * LOCAL to the object's parent (standard three.js semantics), so a marker
 * nested under a group (e.g. this scene's "Markers" group) would otherwise
 * project using the wrong origin/size. Returns null if the internal shape
 * has changed (fails soft).
 */
function getWorldMatrixElements(app: Application, name: string): number[] | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyApp = app as any;
    const scene = anyApp?._scene ?? null;
    const object3d = scene?.getObjectByName?.(name) ?? null;
    const elements: number[] | undefined = object3d?.matrixWorld?.elements;
    return elements ?? null;
  } catch {
    return null;
  }
}

function multiplyMat4Vec4(m: number[], v: [number, number, number, number]) {
  // three.js Matrix4.elements is column-major
  const [x, y, z, w] = v;
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12] * w,
    m[1] * x + m[5] * y + m[9] * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w,
    m[3] * x + m[7] * y + m[11] * z + m[15] * w,
  ];
}

/**
 * Projects a world-space point to normalized device coordinates (-1..1),
 * then to pixel coordinates within a viewport of the given size.
 * Returns null if the point is behind the camera.
 */
export function projectToScreen(
  camera: SplineCameraLike,
  worldPos: Vec3Like,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number; z: number } | null {
  const view = multiplyMat4Vec4(camera.matrixWorldInverse.elements, [
    worldPos.x,
    worldPos.y,
    worldPos.z,
    1,
  ]);
  const clip = multiplyMat4Vec4(camera.projectionMatrix.elements, view as [number, number, number, number]);
  const w = clip[3];
  if (w <= 0) return null; // behind camera
  const ndcX = clip[0] / w;
  const ndcY = clip[1] / w;
  const ndcZ = clip[2] / w;
  return {
    x: ((ndcX + 1) / 2) * viewportWidth,
    y: ((1 - ndcY) / 2) * viewportHeight,
    z: ndcZ,
  };
}

/** Convenience: project an SPEObject's own position. */
export function projectObject(
  app: Application,
  object: SPEObject,
  viewportWidth: number,
  viewportHeight: number
) {
  const camera = getCamera(app);
  if (!camera) return null;
  const world = getWorldMatrixElements(app, object.name);
  const worldPos = world ? { x: world[12], y: world[13], z: world[14] } : object.position;
  return projectToScreen(camera, worldPos, viewportWidth, viewportHeight);
}

/**
 * Projects an object's actual footprint (its position ± half its own
 * scale on X/Y) to a screen-space box, instead of guessing a fixed pixel
 * size — so the overlay box's size tracks the marker's real size and
 * distance from the camera as the camera orbits.
 *
 * Uses the object's real matrixWorld when available, so a marker nested
 * under a transformed parent group projects at its true world position and
 * size (see getWorldMatrixElements above) rather than its raw local
 * position/scale. Falls back to local-only math if the internal isn't
 * found. Ignores the object's own rotation for sizing (assumes it's
 * roughly camera-facing, true for flat marker planes); rotated markers
 * will size slightly off.
 */
export function projectObjectBounds(
  app: Application,
  object: SPEObject,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number; width: number; height: number; z: number } | null {
  const camera = getCamera(app);
  if (!camera) return null;

  const halfX = Math.max(object.scale.x, 0) / 2;
  const halfY = Math.max(object.scale.y, 0) / 2;

  const world = getWorldMatrixElements(app, object.name);

  let centerWorld: Vec3Like;
  let cornerWorld: Vec3Like;

  if (world) {
    centerWorld = { x: world[12], y: world[13], z: world[14] };
    // Transform the local half-extent as a direction (w=0), so it picks up
    // the full parent rotation/scale chain, then offset from the world
    // center — rather than mixing local-space math with a world position.
    const offset = multiplyMat4Vec4(world, [halfX, halfY, 0, 0]);
    cornerWorld = { x: centerWorld.x + offset[0], y: centerWorld.y + offset[1], z: centerWorld.z + offset[2] };
  } else {
    const { x: px, y: py, z: pz } = object.position;
    centerWorld = { x: px, y: py, z: pz };
    cornerWorld = { x: px + halfX, y: py + halfY, z: pz };
  }

  const center = projectToScreen(camera, centerWorld, viewportWidth, viewportHeight);
  const corner = projectToScreen(camera, cornerWorld, viewportWidth, viewportHeight);
  if (!center || !corner) return null;

  const halfWidthPx = Math.abs(corner.x - center.x);
  const halfHeightPx = Math.abs(corner.y - center.y);

  return {
    x: center.x - halfWidthPx,
    y: center.y - halfHeightPx,
    width: halfWidthPx * 2,
    height: halfHeightPx * 2,
    z: center.z,
  };
}
