"use client";

export default function Lighting() {
  return (
    <>
      {/* cool, mostly-neutral moonlight ambient — kept low-saturation so it doesn't
          wash the grass out toward purple */}
      <ambientLight intensity={0.32} color="#7c8ac2" />
      <directionalLight
        position={[-14, 38, -60]}
        intensity={1.1}
        color="#cfd6ff"
      />
      {/* rim fill near the computers only — short falloff so it lights the valley
          floor without tinting the hillsides purple */}
      <pointLight position={[0, 4, 6]} intensity={3} color="#c9a8ff" distance={9} decay={2} />
    </>
  );
}
