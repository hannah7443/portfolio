#!/usr/bin/env python3
"""Regenerates ../_lib/figmaLetters.ts from the Figma "Mixed Media Letters" export.

Source: Figma file "Portfolio" (MAeeEAh3liNy9GGgvPD6eK), Group 30 (node 866:6501).

Usage (from the repo root, no dependencies beyond Python 3):
    python3 app/lab/name/_figma/generate_letters.py

To update after changing a letter in Figma:
  - Vector letters: re-export that letter as SVG over the matching file in this
    folder (the Figma MCP "get_design_context" asset, or right-click > Export SVG).
  - ASCII letters (hannah n, shin h) are groups of rects + text, not a single
    vector, so their element geometry is copied into ASCII_N / ASCII_H below.
  - If a letter moves or resizes, update its left/top/width/height in LETTERS.

How each letter becomes a cell grid (rows anchored at the letter's bottom edge):
  - "fill":    sample the filled shape; a cell is on if coverage >= threshold.
  - "mask":    same, but uses the outline letter's <mask> path (its filled
               shape) rather than the stroke drawn around it.
  - "centers": one design element per cell (dots, cross-stitches); a cell is
               on if an element's center falls inside it.
  - "ascii":   like "centers", from the hard-coded rect/text geometry, with
               the cell's design content (L/D block or character) kept too.
"""

import math
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "_lib" / "figmaLetters.ts"

# Group 30's top-left in Figma page coordinates; letter positions are stored relative to it.
GROUP_X, GROUP_Y = 48.7207, 843.1064


# --- SVG geometry -----------------------------------------------------------

def path_polys(d):
    """Absolute M/L/H/V/Z path data -> list of polygons (all the Figma letter paths use only these)."""
    toks = re.findall(r"[MLHVZ]|-?[\d.]+(?:e-?\d+)?", d)
    polys, cur, x, y, i, cmd = [], [], 0.0, 0.0, 0, None
    while i < len(toks):
        t = toks[i]
        if t in "MLHVZ":
            cmd = t
            i += 1
            if t == "Z":
                if cur:
                    polys.append(cur)
                    cur = []
                continue
        if cmd == "M":
            if cur:
                polys.append(cur)
            x, y = float(toks[i]), float(toks[i + 1])
            i += 2
            cur = [(x, y)]
            cmd = "L"
        elif cmd == "L":
            x, y = float(toks[i]), float(toks[i + 1])
            i += 2
            cur.append((x, y))
        elif cmd == "H":
            x = float(toks[i])
            i += 1
            cur.append((x, y))
        elif cmd == "V":
            y = float(toks[i])
            i += 1
            cur.append((x, y))
        else:
            raise ValueError(f"unsupported path command: {t}")
    if cur:
        polys.append(cur)
    return polys


def point_in_polys(polys, px, py):
    """Even-odd fill rule."""
    inside = False
    for poly in polys:
        n = len(poly)
        for k in range(n):
            x1, y1 = poly[k]
            x2, y2 = poly[(k + 1) % n]
            if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
                inside = not inside
    return inside


def svg_size(text):
    w = float(re.search(r'width="([\d.]+)"', text).group(1))
    h = float(re.search(r'height="([\d.]+)"', text).group(1))
    return w, h


def svg_shapes(text, mask_only=False):
    """Hit-test functions for every filled shape in the SVG."""
    if mask_only:
        polys = path_polys(re.search(r'<mask[^>]*>\s*<path d="([^"]+)"', text).group(1))
        return [lambda x, y, p=polys: point_in_polys(p, x, y)]
    shapes = []
    for m in re.finditer(r"<(circle|rect|path)\s([^>]*)/>", text):
        tag, attrs = m.groups()
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', attrs))
        if tag == "circle":
            cx, cy, r = float(a["cx"]), float(a["cy"]), float(a["r"])
            shapes.append(lambda x, y, cx=cx, cy=cy, r=r: (x - cx) ** 2 + (y - cy) ** 2 <= r * r)
        elif tag == "rect":
            rx, ry = float(a.get("x", 0)), float(a.get("y", 0))
            w, h = float(a["width"]), float(a["height"])
            # Figma exports some rects as rotate(-90 x y): they then span x..x+h, y-w..y.
            box = (rx, ry - w, rx + h, ry) if "transform" in a else (rx, ry, rx + w, ry + h)
            shapes.append(lambda x, y, b=box: b[0] <= x <= b[2] and b[1] <= y <= b[3])
        else:
            polys = path_polys(a["d"])
            shapes.append(lambda x, y, p=polys: point_in_polys(p, x, y))
    return shapes


def svg_vector(text):
    """Every filled primitive, for the Morph style: circles, rects (rotations baked in) and polygons."""
    shapes = []
    for m in re.finditer(r"<(circle|rect|path)\s([^>]*)/>", text):
        tag, attrs = m.groups()
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', attrs))
        if tag == "circle":
            shapes.append(dict(kind="circle", cx=float(a["cx"]), cy=float(a["cy"]), r=float(a["r"])))
        elif tag == "rect":
            rx, ry = float(a.get("x", 0)), float(a.get("y", 0))
            w, h = float(a["width"]), float(a["height"])
            if "transform" in a:  # rotate(-90 x y)
                rx, ry, w, h = rx, ry - w, h, w
            shapes.append(dict(kind="rect", x=rx, y=ry, w=w, h=h))
        else:
            for poly in path_polys(a["d"]):
                shapes.append(dict(kind="poly", points=[v for pt in poly for v in pt]))
    return shapes


def svg_element_centers(text):
    """Center of every circle and every path's bounding box."""
    pts = [(float(m.group(1)), float(m.group(2))) for m in re.finditer(r'<circle[^>]*cx="([\d.]+)" cy="([\d.]+)"', text)]
    for m in re.finditer(r'<path[^>]* d="([^"]+)"', text):
        poly = path_polys(m.group(1))[0]
        xs, ys = [p[0] for p in poly], [p[1] for p in poly]
        pts.append(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2))
    return pts


# --- Cell grids ---------------------------------------------------------------

def grid_dims(w, h, px, py):
    rows = math.ceil(h / py - 0.05)
    cols = math.ceil(w / px - 0.05)
    return rows, cols, h - rows * py  # top offset, so rows are anchored at the bottom edge


def raster(shapes, w, h, pitch, threshold, ss=6):
    rows, cols, top = grid_dims(w, h, pitch, pitch)
    out = []
    for r in range(rows):
        row = []
        for c in range(cols):
            hits = 0
            for i in range(ss):
                for j in range(ss):
                    x = c * pitch + (j + 0.5) * pitch / ss
                    y = top + r * pitch + (i + 0.5) * pitch / ss
                    if any(s(x, y) for s in shapes):
                        hits += 1
            row.append(hits / (ss * ss) >= threshold)
        out.append(row)
    return out


def center_grid(points, w, h, px, py):
    """Cells as characters: '.' empty, otherwise whatever was placed there ('+' where two elements share a cell)."""
    rows, cols, top = grid_dims(w, h, px, py)
    out = [["."] * cols for _ in range(rows)]
    for x, y, ch in points:
        r, c = int((y - top) // py), int(x // px)
        if 0 <= r < rows and 0 <= c < cols:
            out[r][c] = ch if out[r][c] == "." else "+"
    return out


# --- ASCII letters: element geometry from get_design_context ----------------
# Page coordinates. Rects: (left, top, w, h, tone) with L = #d9d9d9, D = #888.
# Texts: (centerX, centerY, char), IBM Plex Mono 15px, white.

ASCII_N = dict(  # hannah n, node 866:6593
    rects=[
        (439.37, 948.84, 15.982, 18.441, "L"), (455.35, 966.05, 15.982, 18.441, "L"), (502.07, 948.84, 15.982, 18.441, "L"),
        (518.05, 930.39, 17.212, 18.441, "L"), (535.26, 967.28, 15.982, 18.441, "L"), (551.25, 1044.73, 15.982, 18.441, "L"),
        (518.05, 985.72, 17.212, 18.441, "L"), (502.07, 1015.22, 15.982, 18.441, "L"), (502.07, 1052.11, 15.982, 18.441, "L"),
        (487.32, 1070.55, 14.753, 18.441, "L"), (518.05, 1070.55, 17.212, 18.441, "L"), (439.37, 1002.93, 15.982, 18.441, "L"),
        (407.4, 1028.75, 15.982, 18.441, "L"), (407.4, 1070.55, 15.982, 18.441, "L"),
        (471.33, 966.05, 15.982, 18.441, "D"), (486.09, 948.84, 15.982, 18.441, "D"), (535.26, 948.84, 15.982, 18.441, "D"),
        (518.05, 967.28, 17.212, 18.441, "D"), (518.05, 1004.16, 17.212, 18.441, "D"), (502.07, 1033.67, 15.982, 18.441, "D"),
        (502.07, 1070.55, 15.982, 18.441, "D"), (535.26, 1060.71, 15.982, 18.441, "D"), (439.37, 984.49, 15.982, 18.441, "D"),
        (423.39, 1010.31, 15.982, 18.441, "D"), (423.39, 1048.42, 15.982, 18.441, "D"), (391.42, 1070.55, 15.982, 18.441, "D"),
    ],
    texts=[
        (463.34, 958.06, "N"), (526.04, 958.06, "N"), (431.38, 1037.97, "N"), (447.36, 975.27, "1"), (543.25, 994.94, "1"),
        (463.34, 993.71, "A"), (414.17, 1056.41, "A"), (494.08, 1057.64, "A"), (431.38, 1001.09, "6"), (526.04, 1031.82, "6"),
    ],
)

ASCII_H = dict(  # shin h, node 875:7943
    rects=[
        (1383, 1061, 17.4, 18.64, "L"), (1348, 1071, 18, 19, "L"), (1330.67, 1052.83, 17.4, 18.64, "L"),
        (1348.07, 1027.97, 17.4, 18.64, "L"), (1365.47, 991.93, 17.4, 18.64, "L"), (1382.87, 968.58, 17.4, 18.64, "L"),
        (1365.47, 932.27, 17.4, 18.64, "L"), (1351, 951, 17.4, 18.64, "L"), (1317, 949, 17, 24, "L"),
        (1282.2, 993.17, 17.4, 18.64, "L"), (1282.2, 955.89, 17.4, 18.64, "L"), (1264.8, 974.53, 17.4, 18.64, "L"),
        (1264.8, 1052.83, 17.4, 18.64, "L"), (1230, 1071.47, 17.4, 18.64, "L"), (1247.4, 1029.21, 17.4, 18.64, "L"),
        (1299.6, 926.06, 17.4, 18.64, "L"), (1317, 881.31, 17.4, 18.64, "L"), (1317, 918.6, 17.4, 18.64, "L"),
        (1299.6, 863.91, 17.4, 18.64, "L"), (1334.4, 863.91, 17.4, 18.64, "L"),
        (1300, 944, 17, 36, "D"), (1317, 932, 17, 19, "D"), (1334, 946, 17, 24, "D"), (1300, 880, 17, 24, "D"),
        (1265, 993, 17, 19, "D"), (1248, 1011, 17, 19, "D"), (1265, 1034, 17, 19, "D"), (1247, 1071, 18, 19, "D"),
        (1317, 900, 17, 19, "D"), (1334, 900, 17, 19, "D"), (1366, 951, 17, 19, "D"), (1383, 932, 17, 19, "D"),
        (1383, 987, 17, 19, "D"), (1348, 1009, 17, 19, "D"), (1331, 1034, 17, 19, "D"), (1331, 1071, 17, 19, "D"),
        (1366, 1068, 17, 19, "D"),
    ],
    texts=[
        (1357.39, 1058.42, "A"), (1374.79, 1019.89, "4"), (1373.55, 980.12, "P"), (1357.81, 941.75, "A"),
        (1290.28, 982.61, "A"), (1343.72, 891.88, "A"), (1255.48, 1058.42, "A"), (1274.12, 1022.38, "7"),
        (1326.32, 870.75, "7"), (1391.81, 958.75, "3"), (1307.68, 914.25, "3"),
    ],
)

# --- The ten letters, in order -----------------------------------------------
# (node, char, ownStyle, page left, page top, width, height, pitchX, pitchY, how, source, threshold)
# ownStyle follows the Figma — e.g. shin's h is ASCII there (the spec's first draft said Cross-stitch).

LETTERS = [
    ("890:68", "h", "solid", 48.7209, 863.0001, 160, 224, 16, 16, "fill", "h1-solid.svg", 0.5),
    ("866:7371", "a", "dots", 214.3848, 929.165, 170.8889, 164.742, 16, 16, "centers", "a1-dots.svg", None),
    ("866:6593", "n", "ascii", 391.4205, 930.3947, 175.8086, 158.5945, 16, 18.44, "ascii", ASCII_N, None),
    ("866:6630", "n", "outline", 559.8497, 930.3947, 175.8076, 159.8242, 15.9824, 15.9824, "mask", "n2-outline.svg", 0.5),
    ("866:6646", "a", "crossStitch", 735.6563, 930.3948, 158.6095, 159.8529, 15.9824, 15.9824, "centers", "a2-stitch.svg", None),
    ("866:6779", "h", "morph", 886.8751, 843.1062, 185.6411, 250.8003, 16, 16, "fill", "h2-morph.svg", 0.25),
    ("890:69", "s", "solid", 1113.6272, 931, 128, 160, 16, 16, "fill", "s1-solid.svg", 0.5),
    ("875:7943", "h", "ascii", 1230, 849, 173.6141, 241.1124, 17.4, 18.64, "ascii", ASCII_H, None),
    ("880:39", "i", "morph", 1410, 882, 94.6636, 209.8008, 16, 16, "fill", "i1-morph.svg", 0.25),
    ("880:22", "n", "outline", 1505, 930, 175.8076, 159.8242, 15.9824, 15.9824, "mask", "n2-outline.svg", 0.5),
]
WORD_BREAK = 6  # "hannah" | "shin"


def build(letter):
    node, char, style, left, top, w, h, px, py, how, source, threshold = letter
    ascii_rows = None
    vector = None
    if how in ("fill", "mask"):
        svg = (HERE / source).read_text()
        cells = raster(svg_shapes(svg, mask_only=how == "mask"), *svg_size(svg), px, threshold)
        if style == "morph":
            sw, sh = svg_size(svg)
            vector = dict(width=sw, height=sh, shapes=svg_vector(svg))
    elif how == "centers":
        svg = (HERE / source).read_text()
        pts = [(x, y, "#") for x, y in svg_element_centers(svg)]
        cells = [[c != "." for c in row] for row in center_grid(pts, *svg_size(svg), px, py)]
    else:  # ascii
        pts = [(x + rw / 2 - left, y + rh / 2 - top, tone) for x, y, rw, rh, tone in source["rects"]]
        pts += [(x - left, y - top, ch) for x, y, ch in source["texts"]]
        grid = center_grid(pts, w, h, px, py)
        cells = [[c != "." for c in row] for row in grid]
        ascii_rows = ["".join(row) for row in grid]
    return dict(
        node=node, char=char, ownStyle=style,
        left=round(left - GROUP_X, 2), bottom=round(top + h - GROUP_Y, 2),
        pitchX=px, pitchY=py,
        rows=["".join("#" if v else "." for v in row) for row in cells],
        ascii=ascii_rows,
        vector=vector,
    )


HEADER = """\
// GENERATED by _figma/generate_letters.py from the Figma "Portfolio" file,
// Mixed Media Letters (node 866:6501), by sampling each letter's exported
// geometry onto its cell grid. Regenerate rather than hand-editing where
// possible: "#" = filled cell, "." = empty, rows top to bottom.
//
// left/bottom are in Figma px relative to the group's top-left; each mask is
// anchored at its bottom-left corner. pitchX/pitchY are the letter's cell size
// in Figma px: most letters sit on a 16px grid, but the two ASCII letters were
// drawn with taller (and, for shin's h, wider) cells. `ascii` keeps the
// ASCII letters' design content per cell: L = light block (#d9d9d9),
// D = dark block (#888), + = two elements in one cell, otherwise the character itself.
// `vector` (Morph letters only) is the Figma primitives in the letter's own px.
import type { StyleId, VectorArt } from "./types";

export type FigmaLetter = {
  node: string;
  char: string;
  ownStyle: StyleId;
  left: number;
  bottom: number;
  pitchX: number;
  pitchY: number;
  rows: string[];
  ascii?: string[];
  vector?: VectorArt;
};

/** One array per word: "hannah", "shin". */
export const FIGMA_WORDS: FigmaLetter[][] = ["""


def num(v):
    return f"{v:.1f}" if float(v).is_integer() and isinstance(v, float) else str(v)


def emit(l):
    lines = [
        "    {",
        f'      node: "{l["node"]}",',
        f'      char: "{l["char"]}",',
        f'      ownStyle: "{l["ownStyle"]}",',
        f'      left: {num(l["left"])},',
        f'      bottom: {num(l["bottom"])},',
        f'      pitchX: {l["pitchX"]},',
        f'      pitchY: {l["pitchY"]},',
        "      rows: [",
        *[f'        "{r}",' for r in l["rows"]],
        "      ],",
    ]
    if l["ascii"]:
        lines += ["      ascii: [", *[f'        "{r}",' for r in l["ascii"]], "      ],"]
    if l["vector"]:
        v = l["vector"]
        r2 = lambda x: round(x, 2)
        lines += ["      vector: {", f"        width: {r2(v['width'])},", f"        height: {r2(v['height'])},", "        shapes: ["]
        for sh in v["shapes"]:
            if sh["kind"] == "circle":
                lines.append(f'          {{ kind: "circle", cx: {r2(sh["cx"])}, cy: {r2(sh["cy"])}, r: {r2(sh["r"])} }},')
            elif sh["kind"] == "rect":
                lines.append(f'          {{ kind: "rect", x: {r2(sh["x"])}, y: {r2(sh["y"])}, w: {r2(sh["w"])}, h: {r2(sh["h"])} }},')
            else:
                pts = ", ".join(str(r2(x)) for x in sh["points"])
                lines.append(f'          {{ kind: "poly", points: [{pts}] }},')
        lines += ["        ],", "      },"]
    lines.append("    },")
    return lines


def main():
    letters = [build(l) for l in LETTERS]
    out = [HEADER]
    for word in (letters[:WORD_BREAK], letters[WORD_BREAK:]):
        out.append("  [")
        for l in word:
            out.extend(emit(l))
        out.append("  ],")
    out.append("];")
    OUT.write_text("\n".join(out) + "\n")
    print(f"wrote {OUT.relative_to(Path.cwd()) if OUT.is_relative_to(Path.cwd()) else OUT}")


if __name__ == "__main__":
    main()
