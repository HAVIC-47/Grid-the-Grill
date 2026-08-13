"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FREE_POSITIONS, TILES, type Tile } from "@/lib/board";
import { DRIVERS, TEAMS, driverById } from "@/lib/drivers";
import { renderBoardPng } from "@/lib/exportBoard";
import { acceptedFor, isCorrect, rankFor, scoreBoard, type Verdict } from "@/lib/answers";
import DriverCard, { DriverChip } from "@/components/DriverCard";
import Confetti from "@/components/Confetti";
import GridLogo from "@/components/GridLogo";

const STORAGE_KEY = "grid-bingo-v2";
const TRAIT_POSITIONS = TILES.map((_, i) => i).filter((i) => !FREE_POSITIONS.includes(i));

type DropTarget = number | "tray";

type DragState = {
  driverId: number;
  from: DropTarget;
  /** Live pointer position. */
  x: number;
  y: number;
  /** Pointer position where the gesture started, for the tap-vs-drag test. */
  ox: number;
  oy: number;
  /** Grab offset inside the card. */
  dx: number;
  dy: number;
  width: number;
  moved: boolean;
};

const DRAG_THRESHOLD = 6;

type Toast = { id: number; title: string; body: string; tone: "good" | "info" };

const emptyBoard = () => TILES.map(() => null as number | null);

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function BingoGame({ children }: { children?: React.ReactNode }) {
  const [board, setBoard] = useState<(number | null)[]>(emptyBoard);
  const [trayOrder, setTrayOrder] = useState<number[]>(() => DRIVERS.map((d) => d.id));
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hover, setHover] = useState<DropTarget | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [burst, setBurst] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState<"save" | "share" | null>(null);
  const [checked, setChecked] = useState(false);

  const audioRef = useRef<AudioContext | null>(null);
  const toastId = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const placedIds = useMemo(
    () => new Set(board.filter((id): id is number => id !== null)),
    [board],
  );
  const trayDrivers = useMemo(
    () => trayOrder.filter((id) => !placedIds.has(id)).map(driverById),
    [trayOrder, placedIds],
  );
  const placedCount = placedIds.size;
  const complete = placedCount === DRIVERS.length;
  const scorecard = useMemo(() => scoreBoard(board), [board]);
  const running = hydrated && placedCount > 0 && !complete;

  /* ---------- persistence ---------- */

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { board?: (number | null)[]; order?: number[]; elapsed?: number };
        // Rehydrating after mount on purpose: the server render must stay
        // deterministic, so saved progress can only be applied client-side.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(saved.board) && saved.board.length === TILES.length) setBoard(saved.board);
        if (Array.isArray(saved.order) && saved.order.length === DRIVERS.length) setTrayOrder(saved.order);
        if (typeof saved.elapsed === "number") setElapsed(saved.elapsed);
      }
    } catch {
      /* corrupted save — start clean */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ board, order: trayOrder, elapsed }),
      );
    } catch {
      /* storage blocked — game still works in memory */
    }
  }, [board, trayOrder, elapsed, hydrated]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  /* ---------- feedback ---------- */

  const beep = useCallback(
    (freq: number, duration = 0.08) => {
      if (!soundOn) return;
      try {
        audioRef.current ??= new AudioContext();
        const ctx = audioRef.current;
        if (ctx.state === "suspended") void ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration + 0.02);
      } catch {
        /* audio unavailable */
      }
    },
    [soundOn],
  );

  const say = useCallback((title: string, body: string, tone: Toast["tone"] = "info") => {
    toastId.current += 1;
    setToast({ id: toastId.current, title, body, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  /* ---------- placement ---------- */

  const move = useCallback(
    (driverId: number, from: DropTarget, to: DropTarget) => {
      if (from === to) return;

      setChecked(false); // any change invalidates the last scoring pass

      setBoard((prev) => {
        const next = [...prev];
        if (typeof from === "number") next[from] = null;

        if (to === "tray") {
          beep(240, 0.06);
          return next;
        }

        const occupant = prev[to] ?? null;
        next[to] = driverId;
        if (occupant !== null && occupant !== driverId && typeof from === "number") {
          next[from] = occupant; // straight swap between two squares
        }

        const filled = next.filter((v) => v !== null).length;
        if (filled === DRIVERS.length) {
          beep(760, 0.2);
          say("Grid locked in", "Hit Check answers for your final score.", "good");
        } else {
          beep(620, 0.07);
        }
        return next;
      });

      setSelected(null);
    },
    [beep, say],
  );

  /* ---------- pointer drag ---------- */

  const startDrag = useCallback(
    (e: React.PointerEvent, driverId: number, from: DropTarget) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const next: DragState = {
        driverId,
        from,
        x: e.clientX,
        y: e.clientY,
        ox: e.clientX,
        oy: e.clientY,
        dx: e.clientX - rect.left,
        dy: e.clientY - rect.top,
        width: from === "tray" ? rect.width : Math.max(rect.width * 0.85, 88),
        moved: false,
      };
      dragRef.current = next;
      setDrag(next);
    },
    [],
  );

  const dragActive = drag !== null;

  useEffect(() => {
    if (!dragActive) return;

    const targetAt = (x: number, y: number): DropTarget | null => {
      const el = document.elementFromPoint(x, y)?.closest("[data-drop]");
      const value = el?.getAttribute("data-drop");
      if (!value) return null;
      return value === "tray" ? "tray" : Number(value);
    };

    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      e.preventDefault();
      const moved =
        d.moved ||
        Math.abs(e.clientX - d.ox) > DRAG_THRESHOLD ||
        Math.abs(e.clientY - d.oy) > DRAG_THRESHOLD;
      dragRef.current = { ...d, x: e.clientX, y: e.clientY, moved };
      setDrag(dragRef.current);
      setHover(moved ? targetAt(e.clientX, e.clientY) : null);
    };

    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      setHover(null);
      if (!d) return;

      if (d.moved) {
        // A real drag: a click event may still land on the source, so swallow it.
        suppressClick.current = true;
        const to = targetAt(e.clientX, e.clientY);
        if (to !== null) move(d.driverId, d.from, to);
        return;
      }

      // A tap: pick the card up (or put it down again) for tap-to-place.
      setSelected((s) => (s === d.driverId ? null : d.driverId));
      beep(500, 0.05);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragActive, move, beep]);

  /* On a phone the paddock sits well below the board, so bring the board
     back into view as soon as a card is picked up by tap. */
  useEffect(() => {
    if (selected === null || !boardRef.current) return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    boardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);

  /* ---------- click-to-place fallback ---------- */

  const onSquareActivate = useCallback(
    (pos: number) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      if (selected === null) return;
      const at = board.indexOf(selected);
      move(selected, at >= 0 ? at : "tray", pos);
    },
    [board, selected, move],
  );

  const onTrayActivate = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (selected === null) return;
    const at = board.indexOf(selected);
    if (at < 0) return;
    move(selected, at, "tray");
    say("Back to the paddock", `${driverById(selected).last} returned to the tray.`);
  }, [board, selected, move, say]);

  /* ---------- actions ---------- */

  const checkGrid = useCallback(() => {
    if (checked) {
      setChecked(false);
      return;
    }
    if (placedCount === 0) {
      say("Nothing to score", "Place at least one driver first.");
      return;
    }

    setChecked(true);
    const { correct, total } = scorecard;
    if (correct === total) {
      setBurst((b) => b + 1);
      beep(920, 0.5);
    } else if (correct > total / 2) {
      setBurst((b) => b + 1);
      beep(720, 0.25);
    } else {
      beep(340, 0.18);
    }
    say(`${correct}/${total} correct`, rankFor(correct, total), correct > total / 2 ? "good" : "info");
  }, [checked, placedCount, scorecard, beep, say]);

  const clearBoard = useCallback(() => {
    setBoard(emptyBoard());
    setSelected(null);
    setElapsed(0);
    setChecked(false);
    say("Board cleared", "Every driver is back in the paddock.");
  }, [say]);

  const shuffleTray = useCallback(() => {
    setTrayOrder((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setChecked(false);
    beep(420, 0.1);
    say("Paddock shuffled", "Driver cards reordered.");
  }, [beep, say]);

  /* ---------- board snapshot ---------- */

  /** Renders the board to a PNG, reusing the live board's resolved fonts. */
  const buildImage = useCallback(() => {
    const boardEl = boardRef.current;
    const captionEl = boardEl?.querySelector(".tile-caption");
    const fontBody = boardEl ? getComputedStyle(boardEl).fontFamily : "sans-serif";
    const fontDisplay = captionEl ? getComputedStyle(captionEl).fontFamily : fontBody;

    return renderBoardPng({
      board,
      placed: placedCount,
      total: DRIVERS.length,
      time: clock(elapsed),
      score: checked
        ? { correct: scorecard.correct, total: scorecard.total, verdicts: scorecard.verdicts }
        : null,
      fontBody,
      fontDisplay,
    });
  }, [board, placedCount, elapsed, checked, scorecard]);

  const downloadBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "grid-the-grill.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const saveImage = useCallback(async () => {
    setBusy("save");
    try {
      downloadBlob(await buildImage());
      beep(660, 0.12);
      say("Saved", "Board snapshot downloaded as a PNG.", "good");
    } catch (error) {
      say("Export failed", error instanceof Error ? error.message : "Could not render the board.");
    } finally {
      setBusy(null);
    }
  }, [buildImage, downloadBlob, beep, say]);

  const shareImage = useCallback(async () => {
    setBusy("share");
    try {
      const blob = await buildImage();
      const file = new File([blob], "grid-the-grill.png", { type: "image/png" });
      const text = `My 2026 grid — ${placedCount}/${DRIVERS.length} placed.`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Grid the Grill", text });
        say("Shared", "Board handed to the share sheet.", "good");
        return;
      }

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        say("Copied", "Board image is on your clipboard.", "good");
        return;
      }

      downloadBlob(blob);
      say("Downloaded instead", "Sharing isn't available in this browser.");
    } catch (error) {
      // Dismissing the OS share sheet rejects with AbortError — not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      say("Share failed", error instanceof Error ? error.message : "Could not share the board.");
    } finally {
      setBusy(null);
    }
  }, [buildImage, downloadBlob, placedCount, say]);

  const copyResult = useCallback(async () => {
    const lines = TRAIT_POSITIONS.map((pos) => {
      const tile = TILES[pos];
      if (tile.kind !== "fact") return "";
      const id = board[pos];
      const pick = id === null ? "—" : `${driverById(id).first} ${driverById(id).last}`;
      const mark = checked && id !== null ? (isCorrect(pos, id) ? " ✅" : " ❌") : "";
      return `${tile.caption} → ${pick}${mark}`;
    }).filter(Boolean);

    const header = checked
      ? `Score ${scorecard.correct}/${scorecard.total} · ${clock(elapsed)}`
      : `${placedCount}/22 placed · ${clock(elapsed)}`;
    const text = ["GRID THE GRILL — my 2026 grid", header, "", ...lines].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      say("Copied", "Your grid is on the clipboard.", "good");
    } catch {
      say("Copy blocked", "The browser denied clipboard access.");
    }
  }, [board, checked, elapsed, placedCount, scorecard, say]);

  const dragDriver = drag ? driverById(drag.driverId) : null;

  return (
    <div className="flex w-full flex-1 flex-col items-center gap-6 lg:grid lg:min-h-0 lg:grid-cols-2 lg:grid-rows-[auto_minmax(0,1fr)] lg:items-start lg:gap-x-6 lg:gap-y-3">
      <Confetti burst={burst} power={1.5} />

      {/* Masthead + readouts + controls. On lg this is the top of the left column. */}
      <div className="flex w-full max-w-[640px] min-w-0 flex-col items-center gap-4 lg:col-start-1 lg:row-start-1 lg:max-w-none lg:gap-3">
        {children}

        <Stats placedCount={placedCount} elapsed={elapsed} running={running} complete={complete} />

        <Controls
          onCheck={checkGrid}
          checked={checked}
          onShuffle={shuffleTray}
          onClear={clearBoard}
          onCopy={copyResult}
          onSave={saveImage}
          onShare={shareImage}
          busy={busy}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((s) => !s)}
        />
      </div>

      {/* Board sits above the cards on phones, and fills the right column on lg. */}
      <Board
        ref={boardRef}
        board={board}
        hover={hover}
        selected={selected}
        verdicts={checked ? scorecard.verdicts : null}
        onSquarePointerDown={startDrag}
        onSquareActivate={onSquareActivate}
      />

      {checked ? (
        <Results scorecard={scorecard} board={board} onKeepPlaying={() => setChecked(false)} onClear={clearBoard} />
      ) : (
        <Tray
          drivers={trayDrivers}
          selected={selected}
          hover={hover}
          dragging={drag?.moved ? drag.driverId : null}
          onCardPointerDown={startDrag}
          onActivate={onTrayActivate}
        />
      )}

      {dragDriver && drag && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: drag.x - drag.dx,
            top: drag.y - drag.dy,
            width: drag.width,
          }}
        >
          <DriverCard driver={dragDriver} state="ghost" />
        </div>
      )}

      {selected !== null && !drag?.moved && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-lg border border-amber/50 bg-panel/95 py-2 pr-2 pl-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md">
            <div className="w-12 shrink-0">
              <DriverCard driver={driverById(selected)} />
            </div>
            <div className="min-w-0">
              <p className="font-display truncate text-sm leading-none font-bold uppercase">
                {driverById(selected).last}
              </p>
              <p className="mt-1 text-[0.7rem] text-muted">Tap a trait square to place</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-display h-9 cursor-pointer rounded-md border border-white/15 px-3 text-[0.7rem] tracking-[0.1em] uppercase transition-colors duration-200 hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="animate-toast pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4"
        >
          <div
            className={`flex items-center gap-3 rounded-md border px-4 py-3 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.95)] ${
              toast.tone === "good" ? "border-amber/70 bg-[#1a1205]" : "border-white/20 bg-panel"
            }`}
          >
            <span className={`h-8 w-1 rounded-full ${toast.tone === "good" ? "bg-amber" : "bg-white/40"}`} />
            <div>
              <p className="font-display text-sm font-bold tracking-wide uppercase">{toast.title}</p>
              <p className="text-xs text-muted">{toast.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stats({
  placedCount,
  elapsed,
  running,
  complete,
}: {
  placedCount: number;
  elapsed: number;
  running: boolean;
  complete: boolean;
}) {
  const stats = [
    { label: "Placed", value: `${placedCount}/${DRIVERS.length}` },
    { label: "Remaining", value: `${DRIVERS.length - placedCount}` },
    { label: "Race time", value: clock(elapsed) },
  ];

  return (
    <div className="grid w-full max-w-[640px] grid-cols-3 gap-2 sm:gap-3">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="relative overflow-hidden rounded-md border border-white/10 bg-panel/80 px-3 py-2.5 text-center"
        >
          <span
            className={`absolute inset-y-0 left-0 w-[3px] ${
              complete ? "bg-amber" : i === 2 && running ? "bg-speed" : "bg-white/20"
            }`}
          />
          <p className="font-display text-[0.6rem] tracking-[0.16em] text-muted uppercase">{s.label}</p>
          <p className="font-display text-xl leading-none font-bold tabular-nums sm:text-2xl">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function Controls({
  onCheck,
  checked,
  onShuffle,
  onClear,
  onCopy,
  onSave,
  onShare,
  busy,
  soundOn,
  onToggleSound,
}: {
  onCheck: () => void;
  checked: boolean;
  onShuffle: () => void;
  onClear: () => void;
  onCopy: () => void;
  onSave: () => void;
  onShare: () => void;
  busy: "save" | "share" | null;
  soundOn: boolean;
  onToggleSound: () => void;
}) {
  const base =
    "inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border px-3.5 font-display text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-200 disabled:cursor-wait disabled:opacity-60";
  const ghost = `${base} border-white/12 bg-white/[0.04] text-ink hover:bg-white/[0.1]`;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={onCheck}
        aria-pressed={checked}
        className={`${base} ${
          checked
            ? "border-white/12 bg-white/[0.04] text-ink hover:bg-white/[0.1]"
            : "border-[#22c55e]/60 bg-[#22c55e]/15 text-ink hover:bg-[#22c55e]/25"
        }`}
      >
        <IconCheck />
        {checked ? "Hide answers" : "Check answers"}
      </button>
      <button type="button" onClick={onShuffle} className={`${base} border-speed/50 bg-speed/12 text-ink hover:bg-speed/25`}>
        <IconShuffle />
        Shuffle paddock
      </button>
      <button type="button" onClick={onClear} className={ghost}>
        <IconReset />
        Clear board
      </button>
      <button type="button" onClick={onSave} disabled={busy !== null} className={ghost}>
        <IconCamera />
        {busy === "save" ? "Saving…" : "Save PNG"}
      </button>
      <button
        type="button"
        onClick={onShare}
        disabled={busy !== null}
        className={`${base} border-amber/40 bg-amber/10 text-ink hover:bg-amber/20`}
      >
        <IconShareNodes />
        {busy === "share" ? "Sharing…" : "Share"}
      </button>
      <button type="button" onClick={onCopy} className={ghost}>
        <IconShare />
        Copy grid
      </button>
      <button
        type="button"
        onClick={onToggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Mute sound effects" : "Unmute sound effects"}
        className={`${base} w-11 justify-center px-0 border-white/12 bg-white/[0.04] text-ink hover:bg-white/[0.1]`}
      >
        {soundOn ? <IconSoundOn /> : <IconSoundOff />}
      </button>
    </div>
  );
}

function Board({
  ref,
  board,
  hover,
  selected,
  verdicts,
  onSquarePointerDown,
  onSquareActivate,
}: {
  ref: React.Ref<HTMLDivElement>;
  board: (number | null)[];
  hover: number | "tray" | null;
  selected: number | null;
  verdicts: Record<number, Verdict> | null;
  onSquarePointerDown: (e: React.PointerEvent, driverId: number, from: number) => void;
  onSquareActivate: (pos: number) => void;
}) {
  return (
    <div
      ref={ref}
      className="relative w-full max-w-[640px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-[min(100%,calc((100dvh-2rem)/1.55))] lg:max-w-none lg:justify-self-center lg:self-center"
    >
      <div className="pointer-events-none absolute inset-x-2 -bottom-6 h-16 rounded-[50%] bg-speed/25 blur-3xl" />
      <div className="relative rounded-lg bg-gradient-to-b from-[#e6e8ec] via-[#c2c6cd] to-[#8f949c] p-[6px] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)] sm:p-2">
        <div className="rounded-[3px] bg-[#050608] p-1.5 sm:p-2.5">
          <div className="grid grid-cols-4 gap-[2px] bg-white/25">
            {TILES.map((tile, pos) => (
              <Square
                key={pos}
                pos={pos}
                tile={tile}
                driverId={board[pos] ?? null}
                hovered={hover === pos}
                armed={selected !== null}
                verdict={verdicts ? (verdicts[pos] ?? null) : null}
                onPointerDown={onSquarePointerDown}
                onActivate={onSquareActivate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Square({
  pos,
  tile,
  driverId,
  hovered,
  armed,
  verdict,
  onPointerDown,
  onActivate,
}: {
  pos: number;
  tile: Tile;
  driverId: number | null;
  hovered: boolean;
  armed: boolean;
  verdict: Verdict;
  onPointerDown: (e: React.PointerEvent, driverId: number, from: number) => void;
  onActivate: (pos: number) => void;
}) {
  if (tile.kind === "logo") {
    return (
      <div className="tile flex aspect-[1/1.06] flex-col items-center justify-center gap-1 bg-tile-deep">
        <GridLogo className="w-[46%]" />
        <span className="tile-caption text-muted">Free</span>
      </div>
    );
  }

  const driver = driverId === null ? null : driverById(driverId);
  const team = driver ? TEAMS[driver.team] : null;

  return (
    <button
      type="button"
      data-drop={pos}
      style={
        team
          ? ({ "--team": team.primary, "--accent": team.accent } as CSSProperties)
          : undefined
      }
      onClick={() => onActivate(pos)}
      onPointerDown={(e) => {
        if (driverId !== null) onPointerDown(e, driverId, pos);
      }}
      aria-label={
        driver
          ? `${tile.caption}: ${tile.text}. Holding ${driver.first} ${driver.last}. Activate to pick the card up.`
          : `${tile.caption}: ${tile.text}. Empty square.`
      }
      className={`tile relative flex aspect-[1/1.06] cursor-pointer flex-col items-center overflow-hidden px-1 pt-1.5 pb-1 text-center transition-colors duration-200 sm:px-1.5 ${
        driver
          ? "tile-placed touch-none"
          : "bg-gradient-to-b from-tile to-tile-deep hover:from-[#1c2028] hover:to-[#101319]"
      } ${
        verdict === "correct"
          ? "shadow-[inset_0_0_0_2px_#22c55e]"
          : verdict === "wrong"
            ? "shadow-[inset_0_0_0_2px_#ff3b30]"
            : hovered
              ? "shadow-[inset_0_0_0_2px_#ff8a00]"
              : armed && !driver
                ? "shadow-[inset_0_0_0_1px_rgba(255,138,0,0.5)]"
                : ""
      }`}
    >
      <span
        className={`tile-caption relative z-10 w-full truncate ${driver ? "text-white/65" : "text-muted"}`}
        title={tile.caption}
      >
        {tile.caption}
      </span>

      <span
        className={`tile-text relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-hidden font-semibold text-balance text-ink ${
          driver ? "[text-shadow:0_2px_8px_rgba(0,0,0,0.6)]" : ""
        }`}
      >
        {tile.text}
      </span>

      {verdict && (
        <span
          className={`absolute top-1 right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full ${
            verdict === "correct" ? "bg-[#22c55e]" : "bg-[#ff3b30]"
          }`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-2.5 w-2.5">
            <path
              d={verdict === "correct" ? "M4 13l5 5L20 6" : "M6 6l12 12M18 6L6 18"}
              fill="none"
              stroke="#06070a"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      <span className="tile-slot relative z-10 mt-1 flex w-full items-stretch">
        {driver ? <DriverChip driver={driver} /> : <span className="mt-auto h-[2px] w-full rounded-full bg-white/10" />}
      </span>
    </button>
  );
}

function Results({
  scorecard,
  board,
  onKeepPlaying,
  onClear,
}: {
  scorecard: ReturnType<typeof scoreBoard>;
  board: (number | null)[];
  onKeepPlaying: () => void;
  onClear: () => void;
}) {
  const { correct, total, answered, misses } = scorecard;
  const pct = Math.round((correct / total) * 100);
  const perfect = correct === total;

  return (
    <section
      aria-label="Final score"
      className="w-full max-w-[860px] min-h-0 rounded-lg border border-white/12 bg-panel p-4 lg:col-start-1 lg:row-start-2 lg:max-h-full lg:max-w-none lg:overflow-y-auto"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-[0.62rem] tracking-[0.2em] text-muted uppercase">Final score</p>
          <p className="font-display text-4xl leading-none font-bold tabular-nums sm:text-5xl">
            {correct}
            <span className="text-muted">/{total}</span>
          </p>
          <p className={`font-display mt-1 text-xs tracking-wide uppercase ${perfect ? "text-amber" : "text-speed"}`}>
            {rankFor(correct, total)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onKeepPlaying}
            className="inline-flex h-10 cursor-pointer items-center rounded-md border border-white/12 bg-white/[0.04] px-3 font-display text-[0.7rem] font-semibold tracking-[0.12em] uppercase transition-colors duration-200 hover:bg-white/[0.1]"
          >
            Keep playing
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 cursor-pointer items-center rounded-md border border-speed/50 bg-speed/12 px-3 font-display text-[0.7rem] font-semibold tracking-[0.12em] uppercase transition-colors duration-200 hover:bg-speed/25"
          >
            Play again
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${perfect ? "bg-amber" : "bg-[#22c55e]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {answered}/{total} squares filled · {pct}% correct
      </p>

      {misses.length > 0 && (
        <div className="mt-4">
          <p className="font-display text-[0.62rem] tracking-[0.2em] text-muted uppercase">
            Where it went wrong
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {misses.map((pos) => {
              const tile = TILES[pos];
              if (tile.kind !== "fact") return null;
              const picked = board[pos];
              return (
                <li key={pos} className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                  <p className="font-display text-[0.62rem] tracking-[0.14em] text-muted uppercase">
                    {tile.caption}
                  </p>
                  <p className="mt-1 text-[#ff6b63]">
                    You picked {picked === null ? "—" : `${driverById(picked).first} ${driverById(picked).last}`}
                  </p>
                  <p className="text-[#5ddb87]">
                    {acceptedFor(pos)
                      .map((id) => `${driverById(id).first} ${driverById(id).last}`)
                      .join(" · ")}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function Tray({
  drivers,
  selected,
  hover,
  dragging,
  onCardPointerDown,
  onActivate,
}: {
  drivers: ReturnType<typeof driverById>[];
  selected: number | null;
  hover: number | "tray" | null;
  dragging: number | null;
  onCardPointerDown: (e: React.PointerEvent, driverId: number, from: "tray") => void;
  onActivate: () => void;
}) {
  return (
    <section
      data-drop="tray"
      aria-label="Driver paddock"
      onClick={onActivate}
      className={`w-full max-w-[860px] min-h-0 rounded-lg border p-3 transition-colors duration-200 lg:col-start-1 lg:row-start-2 lg:max-h-full lg:max-w-none lg:overflow-y-auto ${
        hover === "tray" ? "border-amber/70 bg-amber/[0.06]" : "border-white/10 bg-panel/50"
      }`}
    >
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h2 className="font-display text-[0.7rem] tracking-[0.18em] text-muted uppercase">
          Paddock · {drivers.length} left
        </h2>
        <p className="text-[0.66rem] text-muted sm:text-[0.7rem]">
          Drag a card onto a trait — or tap a card, then tap a square.
        </p>
      </div>

      {drivers.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Every driver is on the board.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(72px,1fr))] lg:gap-1.5 2xl:grid-cols-[repeat(auto-fill,minmax(88px,1fr))]">
          {drivers.map((driver) => (
            <button
              key={driver.id}
              type="button"
              onPointerDown={(e) => onCardPointerDown(e, driver.id, "tray")}
              aria-pressed={selected === driver.id}
              aria-label={`${driver.first} ${driver.last}, number ${driver.number}`}
              className="cursor-grab touch-none active:cursor-grabbing"
            >
              <DriverCard
                driver={driver}
                state={dragging === driver.id ? "placed" : selected === driver.id ? "selected" : "idle"}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- icons ---------------- */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-4 w-4",
  "aria-hidden": true,
};

function IconShuffle() {
  return (
    <svg {...iconProps}>
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg {...iconProps}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg {...iconProps}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg {...iconProps}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg {...iconProps}>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

function IconShareNodes() {
  return (
    <svg {...iconProps}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function IconSoundOn() {
  return (
    <svg {...iconProps}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function IconSoundOff() {
  return (
    <svg {...iconProps}>
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M22 9l-6 6" />
      <path d="M16 9l6 6" />
    </svg>
  );
}
