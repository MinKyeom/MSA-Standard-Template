#!/usr/bin/env python3
"""Caveat(가변 TTF)로 부제 문장의 글자별 SVG path → src/data/textSubtitlePaths.json

  pip install fonttools
  curl -sL -o /tmp/Caveat.ttf \
    'https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf'
  python3 scripts/gen-hero-subtitle-paths.py
"""
from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

TEXT = "A personal log across space and time."
FONT_SIZE = 52
BASELINE_Y = FONT_SIZE * 0.72
PAD = FONT_SIZE * 0.2

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "textSubtitlePaths.json"
FONT_CANDIDATES = [
    Path("/tmp/Caveat.ttf"),
    ROOT / "scripts" / "Caveat.ttf",
]


def main() -> None:
    font_path = next((p for p in FONT_CANDIDATES if p.is_file()), None)
    if not font_path:
        print("폰트 없음. 다음 중 하나를 두세요:", file=sys.stderr)
        for p in FONT_CANDIDATES:
            print(f"  {p}", file=sys.stderr)
        sys.exit(1)

    font = TTFont(str(font_path))
    glyph_set = font.getGlyphSet()
    cmap = font["cmap"].getBestCmap()
    hmtx = font["hmtx"].metrics
    upem = font["head"].unitsPerEm
    scale = FONT_SIZE / upem

    x = 0.0
    by_char: list[dict | None] = []
    min_x = min_y = math.inf
    max_x = max_y = -math.inf

    for ch in TEXT:
        gname = cmap.get(ord(ch))
        if not gname:
            by_char.append(None)
            continue

        glyph = glyph_set[gname]
        t = Transform(scale, 0, 0, -scale, x, BASELINE_Y)

        bp = BoundsPen(glyph_set)
        glyph.draw(TransformPen(bp, t))
        if bp.bounds is not None:
            x0, y0, x1, y1 = bp.bounds
            min_x = min(min_x, x0)
            min_y = min(min_y, y0)
            max_x = max(max_x, x1)
            max_y = max(max_y, y1)

        pen = SVGPathPen(glyph_set)
        glyph.draw(TransformPen(pen, t))
        d = pen.getCommands().strip()
        if d:
            by_char.append({"d": d})
        else:
            by_char.append(None)

        adv, _ = hmtx[gname]
        x += adv * scale

    if not math.isfinite(min_x):
        min_x, min_y, max_x, max_y = 0, 0, x, FONT_SIZE

    view_box = f"{min_x - PAD:.2f} {min_y - PAD:.2f} {max_x - min_x + 2 * PAD:.2f} {max_y - min_y + 2 * PAD:.2f}"
    payload = {"viewBox": view_box, "byChar": by_char}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    drawn = sum(1 for c in by_char if c)
    print(f"Wrote {OUT} (chars={len(by_char)}, paths={drawn})")


if __name__ == "__main__":
    main()
