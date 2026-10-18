import * as THREE from "three";

// The lily, rebuilt in plain three.js from public/models/lily.glb (exported
// from the homepage's Spline scene). Spline's exporter drops materials and
// shrinks the scene 100×, so this restores both from values read out of the
// live Spline scene data.

export const MODEL_URL = "/models/lily.glb";

/** The six Spline materials. Every one uses the same physical lighting layer: roughness 0.6, metalness 0.2. */
const COLORS = {
  petal: "#eeeeee",
  leaf: "#4b7646",
  stem: "#407240",
  anther: "#f2c877", // stamen tips
  filament: "#755b50", // stamen stalks
} as const;

type Part = keyof typeof COLORS | "marker";

/**
 * Spline's lighting layer sits at 60% opacity over the flat colour, so part
 * of each surface's colour ignores lighting — the soft look of the homepage
 * flower. Reproduced as a lit diffuse share plus an unlit emissive share
 * (emissive ignores lighting). Spline's nominal split is 60/40, but 90/10
 * matched its look by eye: the unlit share lifts every face equally, which
 * washes out the darker side faces that make each block's edges read.
 */
const LIT_SHARE = 0.9;

function materialFor(hex: string) {
  const color = new THREE.Color(hex);
  return new THREE.MeshStandardMaterial({
    color: color.clone().multiplyScalar(LIT_SHARE),
    emissive: color.clone().multiplyScalar(1 - LIT_SHARE),
    roughness: 0.6,
    metalness: 0.2,
  });
}

/** GLTFLoader turns spaces in node names into underscores; compare on the original spelling. */
const nameOf = (o: THREE.Object3D) => o.name.replace(/_/g, " ");

/** True for any mesh in one of the six petals. */
export const isPetal = (mesh: THREE.Object3D) => partOf(mesh) === "petal";
/** True for the three yellow stamen tips. */
export const isAnther = (mesh: THREE.Object3D) => partOf(mesh) === "anther";
/** The stamens (tips and stalks) and the stem — what the "stem in front" glass window draws over its glass. */
export const isStemPart = (mesh: THREE.Object3D) => {
  const part = partOf(mesh);
  return part === "anther" || part === "filament" || part === "stem";
};

function partOf(mesh: THREE.Object3D): Part | null {
  const own = nameOf(mesh);
  for (let o: THREE.Object3D | null = mesh.parent; o; o = o.parent) {
    const n = nameOf(o);
    if (n === "Markers") return "marker";
    if (n.startsWith("leaf-static")) return "leaf";
    if (n.startsWith("stamen")) return own.startsWith("Cube 14") ? "anther" : "filament";
    if (n.startsWith("complicated-petal")) return "petal";
  }
  if (own.startsWith("Cube 10") || own.startsWith("Cube 11")) return "stem";
  return null;
}

/**
 * Prepares the loaded glTF scene in place: undoes the exporter's 0.01 scale
 * (so world units match Spline's, and the homepage's camera numbers carry
 * over unchanged), drops the exported light (lighting is set up in the
 * component instead), hides the marker placeholders (they stay in the scene
 * for screen tracking) and assigns materials and shadows.
 */
/**
 * Leaf edits on top of the exported model, by their names in the Spline/GLB
 * scene. At the homepage camera: "leaf-static-1" is the upper-left leaf,
 * "leaf-static-2" the middle one (on the right), "leaf-static-3" the bottom
 * one (on the left).
 */
const REMOVED_LEAVES = ["leaf-static-2"];
/**
 * Mirrored left-to-right across the stem, so they stay attached to it but
 * grow out the other side.
 */
const MIRRORED_LEAVES = ["leaf-static-3"];
/** Moves leaves up (+) or down (−) the stem, in scene units (about a screen pixel each at the homepage size). */
const RAISED_LEAVES: Record<string, number> = { "leaf-static-3": 40 };
/** Resizes leaves around the point where they join the stem, so they stay attached (1 = original size). */
const SCALED_LEAVES: Record<string, number> = { "leaf-static-1": 0.85, "leaf-static-3": 0.8 };

function editLeaves(scene: THREE.Object3D) {
  const leaves = new Map<string, THREE.Object3D>();
  const stem = new THREE.Box3();
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (nameOf(o).startsWith("leaf-static")) leaves.set(nameOf(o), o);
    if ((o as THREE.Mesh).isMesh && partOf(o) === "stem") stem.expandByObject(o);
  });
  for (const name of REMOVED_LEAVES) leaves.get(name)?.removeFromParent();
  if (stem.isEmpty()) return;

  const stemCentre = stem.getCenter(new THREE.Vector3());
  for (const name of MIRRORED_LEAVES) {
    const leaf = leaves.get(name);
    if (!leaf?.parent) continue;
    // Mirror across the vertical plane through the stem, in the leaf's parent's space
    // (FLOWER-1, which isn't rotated, so its x axis is the world's — left/right on screen).
    const x = leaf.parent.worldToLocal(stemCentre.clone()).x;
    const mirror = new THREE.Matrix4()
      .makeTranslation(x, 0, 0)
      .multiply(new THREE.Matrix4().makeScale(-1, 1, 1))
      .multiply(new THREE.Matrix4().makeTranslation(-x, 0, 0));
    leaf.applyMatrix4(mirror);
  }
  for (const [name, dy] of Object.entries(RAISED_LEAVES)) {
    const leaf = leaves.get(name);
    if (leaf) leaf.position.y += dy;
  }

  scene.updateMatrixWorld(true);
  for (const [name, k] of Object.entries(SCALED_LEAVES)) {
    const leaf = leaves.get(name);
    if (!leaf?.parent) continue;
    // Pivot where the leaf meets the stem: the stem's x, at the leaf's own height and depth.
    const centre = new THREE.Box3().setFromObject(leaf).getCenter(new THREE.Vector3());
    centre.x = stemCentre.x;
    const pivot = leaf.parent.worldToLocal(centre);
    const resize = new THREE.Matrix4()
      .makeTranslation(pivot.x, pivot.y, pivot.z)
      .multiply(new THREE.Matrix4().makeScale(k, k, k))
      .multiply(new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z));
    leaf.applyMatrix4(resize);
  }
}

export function prepareLily(scene: THREE.Object3D) {
  // Once per loaded model: the loader caches it, and React may run the caller twice in
  // development — mirroring a leaf twice would flip it straight back.
  if (scene.userData.lilyPrepared) return;
  scene.userData.lilyPrepared = true;
  for (const child of scene.children) child.scale.setScalar(1);

  const lights: THREE.Object3D[] = [];
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  scene.traverse((o) => {
    if ((o as THREE.Light).isLight) lights.push(o);
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const part = partOf(mesh);
    if (part === "marker") {
      mesh.visible = false;
      return;
    }
    const hex = COLORS[part ?? "petal"];
    if (!materials.has(hex)) materials.set(hex, materialFor(hex));
    mesh.material = materials.get(hex)!;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
  for (const light of lights) light.parent?.remove(light);
  editLeaves(scene);
}

/** The four nav markers the homepage tracks (see components/spline/markers.ts). */
export const NAV_MARKERS = ["about-marker", "playground-marker", "case-study-marker", "full-stack-marker"] as const;
