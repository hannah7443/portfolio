"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Terrain, { heightAt } from "./Terrain";
import Sky from "./Sky";
import Lighting from "./Lighting";
import RetroComputer from "./RetroComputer";
import ScreenOverlay from "./ScreenOverlay";
import ArtworkScreen from "./ArtworkScreen";
import LogoScreen from "./LogoScreen";
import FlowerField from "./FlowerField";
import GrassBlades from "./GrassBlades";
import PostFX from "./PostFX";
import IntroReveal from "./IntroReveal";
import { CursorParallax, GlowCursorDot } from "./GlowCursor";

// Establishing camera position: wide 3/4 view looking down into the valley.
// IntroReveal (added later) will animate from here to the settled front-on view.
const CAMERA_START: [number, number, number] = [16, 14, 26];

// Valley-floor computer placement, close to the camera-facing edge of the terrain.
const COMPUTER_A_X = -1.1;
const COMPUTER_B_X = 1.1;
const COMPUTER_Z = 8;

export default function Scene() {
  const [settled, setSettled] = useState(false);

  return (
    <div className="fixed inset-0 -z-10" style={{ cursor: settled ? "none" : "auto" }}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: CAMERA_START, fov: 52, near: 0.1, far: 300 }}
      >
        <fogExp2 attach="fog" args={["#160f2e", 0.016]} />
        <Sky />
        <Lighting />
        <Terrain />
        <GrassBlades />
        <FlowerField />

        <IntroReveal onComplete={() => setSettled(true)} />
        <CursorParallax active={settled} />

        <RetroComputer
          position={[COMPUTER_A_X, heightAt(COMPUTER_A_X, COMPUTER_Z) + 1.25, COMPUTER_Z]}
          rotationY={0.18}
          screenColor="#0c0818"
        >
          <ScreenOverlay>
            <ArtworkScreen />
          </ScreenOverlay>
        </RetroComputer>
        <RetroComputer
          position={[COMPUTER_B_X, heightAt(COMPUTER_B_X, COMPUTER_Z) + 1.25, COMPUTER_Z]}
          rotationY={-0.18}
          bodyColor="#d9d4ec"
          screenColor="#1a1450"
        >
          <ScreenOverlay>
            <LogoScreen />
          </ScreenOverlay>
        </RetroComputer>

        <PostFX />
      </Canvas>
      <GlowCursorDot active={settled} />
    </div>
  );
}
