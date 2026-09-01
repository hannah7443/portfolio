import * as THREE from "three";

/**
 * A single tapered, gently-bent grass blade: a thin vertical strip that
 * narrows to a point at the tip, colored as a three-stop gradient — a near-
 * black cool-green base (faking an AO/contact shadow where the blade meets
 * the ground), through a cool mid-green shaded body, up to a warm
 * light-catching tip — so instanced blades read as real individual strands
 * with depth, not a flat texture or a uniform color wash.
 */
export function createGrassBladeGeometry(height = 0.42, segments = 4, bend = 0.05): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Contact-shadow dark, cool (slightly blue) at the very base.
  const rootColor = new THREE.Color("#08160c");
  // Shaded mid-body, cool green.
  const shadeColor = new THREE.Color("#254d2a");
  // Warm, light-catching tip — pulled toward yellow/gold rather than a
  // cooler bright green, like sunlight/moonlight skimming the blade edge.
  const tipColor = new THREE.Color("#d9cf7c");

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 at base, 1 at tip
    const width = THREE.MathUtils.lerp(0.034, 0.002, t);
    const y = t * height;
    const bendX = bend * t * t; // quadratic lean, more pronounced near the tip

    // AO pinch: bias the ramp so the bottom ~15% of the blade darkens fast
    // (contact shadow) before blending on through the lit body to the tip.
    const aoT = Math.pow(t, 0.6);
    const c =
      aoT < 0.35
        ? rootColor.clone().lerp(shadeColor, aoT / 0.35)
        : shadeColor.clone().lerp(tipColor, (aoT - 0.35) / 0.65);

    positions.push(-width / 2 + bendX, y, 0, width / 2 + bendX, y, 0);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, b, c, b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
