import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// A single flower is built from three local-space parts — stem, petal cup,
// glowing core — sharing one local coordinate frame (stem base at the
// origin, everything else offset up by STEM_HEIGHT). FlowerField renders
// each part as its own <Instances> layer (they need different materials:
// green matte stem, purple glowing petals, bright glowing core) but drives
// all three with the *same* per-flower position/rotation/scale, so they
// recombine into one rigid flower per instance at render time.
export const STEM_HEIGHT = 0.55;

export function createFlowerStemGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.006, 0.012, STEM_HEIGHT, 5);
  // Cylinder is centered on its own origin by default — shift so its base
  // sits at local y=0 and its tip reaches STEM_HEIGHT.
  geo.translate(0, STEM_HEIGHT / 2, 0);
  return geo;
}

// A single flower's petal cluster, built once and merged into one static
// geometry so each flower instance still costs a single draw call via
// drei's <Instances>. Petals are flattened, elongated ellipsoid lobes
// arranged radially and tilted up-and-out into a cup, matching the
// bulbous-petal reference model rather than a single blurry glow sphere.
export function createFlowerPetalsGeometry(petalCount = 6): THREE.BufferGeometry {
  const petals: THREE.BufferGeometry[] = [];

  const template = new THREE.SphereGeometry(0.075, 8, 6);
  // Flatten into a rounded petal lobe: narrow, elongated, thin.
  // Half-extent along Y is 0.075*1.6 = 0.12.
  template.scale(0.6, 1.6, 0.4);
  // Shift by the FULL half-length so the petal's base sits at the local
  // origin and the whole lobe extends only in +Y (none of it dips below the
  // attachment point). Rotating around the origin then swings the petal
  // outward from its base like a hinge, instead of swinging a chunk of the
  // lobe through the opposite side and cutting across the core sphere.
  template.translate(0, 0.12, 0);

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = template.clone();
    // Tilt the lobe up and outward (cup shape) before sweeping it around.
    petal.rotateX(-Math.PI / 2.6);
    petal.rotateY(angle);
    petal.translate(0, STEM_HEIGHT, 0); // sit atop the stem
    petals.push(petal);
  }

  const merged = mergeGeometries(petals, false);
  template.dispose();
  petals.forEach((p) => p.dispose());
  return merged!;
}

export function createFlowerCoreGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.045, 10, 8);
  geo.translate(0, STEM_HEIGHT, 0); // nested at the same height as the petal cup
  return geo;
}
