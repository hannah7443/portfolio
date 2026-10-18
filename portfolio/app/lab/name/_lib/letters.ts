import { FIGMA_WORDS } from "./figmaLetters";
import { MASK_PAD, padMask, prepare } from "./grid";
import { BASE_SEED, hashSeed, mulberry32 } from "./random";
import { prepareMorph } from "./renderers/morph";
import type { Letter, Mask } from "./types";

// Letters come from the Figma "Mixed Media Letters" frame (node 866:6501),
// pre-sampled to cell grids in figmaLetters.ts (regenerate it with
// _figma/generate_letters.py). Letter assignments follow the Figma, which
// spec §2 now matches.

const parseRows = (rows: string[]): Mask => rows.map((row) => [...row].map((ch) => ch === "#"));

/** Builds every letter (masks, seeds, placement) and precomputes its derived data. */
export function buildWords(): Letter[][] {
  const random = mulberry32(hashSeed(BASE_SEED, 1));
  const words = FIGMA_WORDS.map((word) =>
    word.map((f): Letter => ({
      char: f.char,
      ownStyle: f.ownStyle,
      vector: f.vector,
      mask: padMask(parseRows(f.rows), MASK_PAD),
      seed: random() * 1000,
      // Padding grows the mask on every side, so its bottom-left corner moves out by one cell.
      place: {
        left: f.left - MASK_PAD * f.pitchX,
        bottom: f.bottom + MASK_PAD * f.pitchY,
        pitchX: f.pitchX,
        pitchY: f.pitchY,
      },
    })),
  );
  prepare(words.flat());
  prepareMorph(words.flat());
  return words;
}
