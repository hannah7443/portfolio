"use client";

import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BASELINE_CAMERA, EXPOSURE, HEMI, RENDERED_LOOK_AT, Sun, TONE_MAPPING } from "../../components/lily/FlowerThree";
import { isStemOrLeaf, MODEL_URL, prepareLily } from "../../components/lily/lily";

/** Rendered size in px; the icons are trimmed to the head and scaled down from this. */
const SIZE = 1024;

/** The lily without its stem and leaves, framed loosely from the homepage's viewing angle. */
function Head() {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const scene = useMemo(() => {
    prepareLily(gltf.scene);
    gltf.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && isStemOrLeaf(o)) o.visible = false;
    });
    return gltf.scene;
  }, [gltf]);
  const get = useThree((s) => s.get);

  useLayoutEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    // Look at the head from the homepage camera's direction, pulled back until it fits.
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.visible) box.expandByObject(o);
    });
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const dir = BASELINE_CAMERA.clone().sub(RENDERED_LOOK_AT).normalize();
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const distance = sphere.radius / Math.sin(fov / 2);
    camera.position.copy(sphere.center).addScaledVector(dir, distance);
    camera.lookAt(sphere.center);
    camera.near = distance / 10;
    camera.far = distance * 10;
    camera.updateProjectionMatrix();

  }, [scene, get]);

  return <primitive object={scene} />;
}

export default function FaviconLabClient() {
  return (
    <div style={{ width: SIZE, height: SIZE }}>
      <Canvas
        id="favicon-canvas"
        shadows="percentage"
        dpr={1}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = TONE_MAPPING;
          gl.toneMappingExposure = EXPOSURE;
          gl.setClearColor(0x000000, 0);
        }}
        camera={{ fov: 30 }}
      >
        <hemisphereLight args={[HEMI.sky, HEMI.ground, HEMI.intensity]} />
        <Sun />
        <Suspense fallback={null}>
          <Head />
        </Suspense>
      </Canvas>
    </div>
  );
}
