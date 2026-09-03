"use client";

import { ShaderGradient, ShaderGradientCanvas } from "shadergradient";
import { LiquidMetal } from "@paper-design/shaders-react";
import type { TextureMarker } from "./markers";

/**
 * Renders one decorative texture box's content. Only `shader-gradient` and
 * `liquid-logo` are implemented (via the `shadergradient` and
 * `@paper-design/shaders-react` packages, matching ruucm/shadergradient and
 * paper-design/liquid-logo). Any other effect (e.g. `ascii`) is left blank
 * for now — the box still tracks the camera, it just renders nothing yet.
 */
export default function TextureEffectBox({ marker }: { marker: TextureMarker }) {
  if (marker.effect === "shader-gradient") {
    return (
      <div className="h-full w-full overflow-hidden">
        <ShaderGradientCanvas style={{ width: "100%", height: "100%" }}>
          <ShaderGradient type="plane" animate="on" color1="#faf6ec" color2="#171717" color3="#6865b5" />
        </ShaderGradientCanvas>
      </div>
    );
  }

  if (marker.effect === "liquid-logo") {
    return (
      <div className="h-full w-full overflow-hidden">
        {/* No logo image wired up yet — falls back to a built-in shape.
            Pass `image="/path/to/logo.png"` once you have a mark to use. */}
        <LiquidMetal
          style={{ width: "100%", height: "100%" }}
          shape="daisy"
          colorBack="#00000000"
          colorTint="#faf6ec"
        />
      </div>
    );
  }

  // Blank placeholder for any other decorative marker (e.g. "ascii") until built.
  return null;
}
