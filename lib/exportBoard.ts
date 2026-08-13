import { COLS, FREE_POSITIONS, TILES } from "@/lib/board";
import { TEAMS, driverById } from "@/lib/drivers";

export type ExportOptions = {
  board: (number | null)[];
  placed: number;
  total: number;
  time: string;
  /** Computed font-family strings pulled off the live board so the PNG matches the UI. */
  fontBody: string;
  fontDisplay: string;
};

const W = 1000;
const PAD = 40;
const GAP = 5;
const HEADER = 152;
const FOOTER = 78;
const SCALE = 2;

const INK = "#f3f4f6";
const MUTED = "#8b919c";
const SPEED = "#e10600";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrinks the font until the wrapped block fits the box, then draws it centred. */
function drawTrait(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  maxHeight: number,
  font: string,
) {
  let size = 17;
  let lines: string[] = [];
  let lineHeight = 0;

  while (size >= 11) {
    ctx.font = `600 ${size}px ${font}`;
    lines = wrap(ctx, text, maxWidth);
    lineHeight = size * 1.22;
    if (lines.length * lineHeight <= maxHeight) break;
    size -= 1;
  }

  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight));
}

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const h = w * 0.62;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#ffb020");
  grad.addColorStop(1, "#ff6a00");
  ctx.fillStyle = grad;

  const bars: [number, number, number][] = [
    [0.19, 0.05, 0.72],
    [0.31, 0.4, 0.6],
    [0.44, 0.75, 0.47],
  ];
  for (const [inset, top, width] of bars) {
    const bh = h * 0.2;
    const by = y + h * top;
    ctx.beginPath();
    ctx.moveTo(x + w * inset, by);
    ctx.lineTo(x + w * (inset + width), by);
    ctx.lineTo(x + w * (inset + width - 0.12), by + bh);
    ctx.lineTo(x + w * (inset - 0.12), by + bh);
    ctx.closePath();
    ctx.fill();
  }
}

export async function renderBoardPng(o: ExportOptions): Promise<Blob> {
  const cellW = (W - PAD * 2 - GAP * (COLS - 1)) / COLS;
  const cellH = cellW * 1.06;
  const rows = TILES.length / COLS;
  const boardH = rows * cellH + GAP * (rows - 1);
  const H = HEADER + boardH + FOOTER;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.scale(SCALE, SCALE);

  try {
    await document.fonts.ready;
  } catch {
    /* fonts API unavailable — fall back to whatever is loaded */
  }

  /* ---- background ---- */
  ctx.fillStyle = "#06070a";
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, -60, 0, W / 2, -60, W * 0.9);
  glow.addColorStop(0, "rgba(225,6,0,0.35)");
  glow.addColorStop(1, "rgba(225,6,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  /* ---- header ---- */
  drawMark(ctx, PAD, 34, 56);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `700 56px ${o.fontDisplay}`;
  const a = "GRID THE ";
  const b = "GRILL";
  const titleY = 106;
  ctx.fillStyle = INK;
  ctx.fillText(a, PAD, titleY);
  ctx.fillStyle = SPEED;
  ctx.fillText(b, PAD + ctx.measureText(a).width, titleY);

  ctx.font = `600 15px ${o.fontDisplay}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.fillText(`${o.placed}/${o.total} PLACED`, W - PAD, titleY - 26);
  ctx.fillStyle = INK;
  ctx.font = `700 26px ${o.fontDisplay}`;
  ctx.fillText(o.time, W - PAD, titleY);

  /* ---- board frame ---- */
  const boardX = PAD;
  const boardY = HEADER;
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  roundRect(ctx, boardX - GAP, boardY - GAP, W - PAD * 2 + GAP * 2, boardH + GAP * 2, 6);
  ctx.fill();

  TILES.forEach((tile, pos) => {
    const col = pos % COLS;
    const row = Math.floor(pos / COLS);
    const x = boardX + col * (cellW + GAP);
    const y = boardY + row * (cellH + GAP);

    if (FREE_POSITIONS.includes(pos) || tile.kind === "logo") {
      ctx.fillStyle = "#0b0d11";
      ctx.fillRect(x, y, cellW, cellH);
      drawMark(ctx, x + cellW * 0.27, y + cellH * 0.34, cellW * 0.46);
      ctx.font = `600 10px ${o.fontDisplay}`;
      ctx.fillStyle = MUTED;
      ctx.textAlign = "center";
      ctx.fillText("FREE", x + cellW / 2, y + cellH * 0.72);
      return;
    }

    const cell = ctx.createLinearGradient(x, y, x, y + cellH);
    cell.addColorStop(0, "#15181e");
    cell.addColorStop(1, "#0b0d11");
    ctx.fillStyle = cell;
    ctx.fillRect(x, y, cellW, cellH);

    // caption
    ctx.font = `600 10px ${o.fontDisplay}`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    let caption = tile.caption.toUpperCase();
    while (ctx.measureText(caption).width > cellW - 14 && caption.length > 4) {
      caption = `${caption.slice(0, -2).trim()}…`;
    }
    ctx.fillText(caption, x + cellW / 2, y + 10);

    const driverId = o.board[pos] ?? null;
    const chipH = driverId === null ? 0 : 26;

    drawTrait(
      ctx,
      tile.text,
      x + cellW / 2,
      y + 26 + (cellH - 36 - chipH) / 2,
      cellW - 18,
      cellH - 46 - chipH,
      o.fontBody,
    );

    if (driverId !== null) {
      const driver = driverById(driverId);
      const team = TEAMS[driver.team];
      const chipY = y + cellH - chipH - 8;
      ctx.fillStyle = team.primary;
      roundRect(ctx, x + 8, chipY, cellW - 16, chipH, 5);
      ctx.fill();

      ctx.fillStyle = team.accent;
      ctx.fillRect(x + 8, chipY + chipH - 3, cellW - 16, 3);

      ctx.fillStyle = team.ink;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `700 13px ${o.fontDisplay}`;
      ctx.fillText(driver.last.toUpperCase(), x + 16, chipY + chipH / 2);
      ctx.textAlign = "right";
      ctx.font = `700 12px ${o.fontDisplay}`;
      ctx.globalAlpha = 0.75;
      ctx.fillText(String(driver.number), x + cellW - 16, chipY + chipH / 2);
      ctx.globalAlpha = 1;
    }
  });

  /* ---- footer ---- */
  ctx.textBaseline = "middle";
  ctx.font = `600 13px ${o.fontDisplay}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.fillText("FAN-MADE · NOT AFFILIATED WITH FORMULA 1", PAD, H - FOOTER / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = "#b9bec7";
  ctx.fillText("GRID THE GRILL", W - PAD, H - FOOTER / 2);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image"))),
      "image/png",
    );
  });
}
