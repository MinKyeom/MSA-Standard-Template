/**
 * Caveat TTF로 부제 문장의 글자별 SVG path 생성 → src/data/textSubtitlePaths.json
 * 사용: `npm i -D opentype.js` 후 `node scripts/gen-hero-subtitle-paths.mjs`
 * (CI/Docker는 package-lock 동기화를 위해 npm 스크립트는 Python 생성기만 사용)
 */
import opentype from "opentype.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf";
const TEXT = "A personal log across space and time.";
const OUT = path.join(__dirname, "../src/data/textSubtitlePaths.json");

const fontSize = 52;
const baselineY = fontSize * 0.72;

const res = await fetch(FONT_URL);
if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());
const font = opentype.parse(buf);
const scale = fontSize / font.unitsPerEm;

let x = 0;
let prevGlyph = null;
const byChar = [];
let minX = Infinity;
let minY = Infinity;
let maxX = -Infinity;
let maxY = -Infinity;

function expandBox(bb) {
  if (!bb || bb.x1 === undefined || !Number.isFinite(bb.x1)) return;
  minX = Math.min(minX, bb.x1);
  minY = Math.min(minY, bb.y1);
  maxX = Math.max(maxX, bb.x2);
  maxY = Math.max(maxY, bb.y2);
}

for (let i = 0; i < TEXT.length; i++) {
  const glyph = font.charToGlyph(TEXT[i]);
  if (prevGlyph && glyph) {
    x += font.getKerningValue(prevGlyph, glyph) * scale;
  }
  const gPath = glyph.getPath(x, baselineY, fontSize);
  const d = gPath.toPathData(2);
  if (d && d.trim().length > 2) {
    byChar.push({ d });
    expandBox(gPath.getBoundingBox());
  } else {
    byChar.push(null);
  }
  x += glyph.advanceWidth * scale;
  prevGlyph = glyph;
}

const pad = fontSize * 0.2;
if (!Number.isFinite(minX)) {
  minX = 0;
  minY = 0;
  maxX = x;
  maxY = fontSize;
}
const viewBox = `${(minX - pad).toFixed(2)} ${(minY - pad).toFixed(2)} ${(maxX - minX + 2 * pad).toFixed(2)} ${(maxY - minY + 2 * pad).toFixed(2)}`;

fs.writeFileSync(OUT, JSON.stringify({ viewBox, byChar }, null, 2), "utf8");
console.log("Wrote", OUT, "chars:", byChar.length, "drawable:", byChar.filter(Boolean).length);
