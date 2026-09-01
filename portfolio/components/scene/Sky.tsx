"use client";

import { useMemo } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  varying vec3 vWorldPosition;
  uniform vec3 colorTop;
  uniform vec3 colorBottom;
  void main() {
    float h = normalize(vWorldPosition).y;
    float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(mix(colorBottom, colorTop, pow(t, 0.65)), 1.0);
  }
`;

function Moon({ position, size }: { position: [number, number, number]; size: number }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshBasicMaterial color="#f5f3ff" toneMapped={false} />
      </mesh>
      {/* offset darker sphere to fake a crescent without CSG */}
      <mesh position={[size * 0.45, size * 0.1, size * 0.3]}>
        <sphereGeometry args={[size * 0.92, 24, 24]} />
        <meshBasicMaterial color="#140a24" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Sky() {
  const uniforms = useMemo(
    () => ({
      colorTop: { value: new THREE.Color("#241a5e") },
      colorBottom: { value: new THREE.Color("#160f2e") },
    }),
    []
  );

  return (
    <group>
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[200, 32, 32]} />
        <shaderMaterial
          side={THREE.BackSide}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          depthWrite={false}
        />
      </mesh>
      <Moon position={[-14, 38, -70]} size={2.2} />
      <Moon position={[-9, 41, -72]} size={1.1} />
    </group>
  );
}
