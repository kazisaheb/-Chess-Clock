import { useCallback, useEffect, useRef, useState } from "react";
import type { Player, PlayerState } from "./types";
import PlayerPanel from "./components/PlayerPanel";
import GameOverModal from "./components/GameOverModal";
import { playClick } from "./utils/sound";
import { formatDuration } from "./utils/format";

interface PlayerStats {
  moves: number;
  totalMs: number;
  avgMs: number;
  longestMs: number;
  shortestMs: number;
}

function computeStats(s: PlayerState): PlayerStats {
  if (s.moves === 0) {
    return { moves: 0, totalMs: 0, avgMs: 0, longestMs: 0, shortestMs: 0 };
  }
  let longest = -Infinity;
  let shortest = Infinity;
  for (const m of s.moveHistory) {
    if (m > longest) longest = m;
    if (m < shortest) shortest = m;
  }
  return {
    moves: s.moves,
    totalMs: s.totalThinkMs,
    avgMs: s.totalThinkMs / s.moves,
    longestMs: longest,
    shortestMs: shortest,
  };
}

function freshState(): PlayerState {
  return { currentMoveMs: 0, moves: 0, totalThinkMs: 0, lastMoveMs: null, moveHistory: [] };
}

export default function App() {
  const [white, setWhite] = useState<PlayerState>(freshState());
  const [black, setBlack] = useState<PlayerState>(freshState());

  const [active, setActive] = useState<Player | null>(null); // null = not started
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  // Refs for the ticking engine
  const tickRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const turnStartRef = useRef<number>(0);

  const reset = useCallback(() => {
    setWhite(freshState());
    setBlack(freshState());
    setActive(null);
    setRunning(false);
    setGameOver(false);
  }, []);

  // Ticking loop: counts UP for the active player's current move
  useEffect(() => {
    if (!running || !active) {
      if (tickRef.current) {
        cancelAnimationFrame(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    lastTickRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      if (active === "white") {
        setWhite((w) => ({ ...w, currentMoveMs: w.currentMoveMs + dt }));
      } else {
        setBlack((b) => ({ ...b, currentMoveMs: b.currentMoveMs + dt }));
      }

      tickRef.current = requestAnimationFrame(tick);
    };

    tickRef.current = requestAnimationFrame(tick);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, [running, active]);

  // Main turn switch logic
  const handleSwitchTurn = useCallback(() => {
    if (gameOver) return;

    // First tap: start White
    if (active === null) {
      setActive("white");
      setRunning(true);
      turnStartRef.current = performance.now();
      if (soundOn) playClick();
      return;
    }

    // If paused, resume
    if (!running) {
      turnStartRef.current = performance.now();
      setRunning(true);
      if (soundOn) playClick();
      return;
    }

    // Normal switch: capture this move's elapsed time, reset for next move
    if (active === "white") {
      setWhite((w) => ({
        currentMoveMs: 0,
        moves: w.moves + 1,
        totalThinkMs: w.totalThinkMs + w.currentMoveMs,
        lastMoveMs: w.currentMoveMs,
        moveHistory: [...w.moveHistory, w.currentMoveMs],
      }));
      setActive("black");
    } else {
      setBlack((b) => ({
        currentMoveMs: 0,
        moves: b.moves + 1,
        totalThinkMs: b.totalThinkMs + b.currentMoveMs,
        lastMoveMs: b.currentMoveMs,
        moveHistory: [...b.moveHistory, b.currentMoveMs],
      }));
      setActive("white");
    }

    turnStartRef.current = performance.now();
    if (soundOn) playClick();
  }, [active, running, soundOn, gameOver]);

  // Spacebar / Enter hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if ((e.code === "Space" || e.code === "Enter") && !e.repeat) {
        if (e.target instanceof HTMLElement && e.target.tagName === "INPUT") return;
        e.preventDefault();
        handleSwitchTurn();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwitchTurn, gameOver]);

  function togglePause() {
    if (active === null) return;
    if (running) {
      setRunning(false);
    } else {
      turnStartRef.current = performance.now();
      setRunning(true);
    }
  }

  function handleGameOver() {
    // Stop the clock, include the in-progress move, and show the summary popup.
    setRunning(false);
    if (active === "white") {
      setWhite((w) =>
        w.currentMoveMs > 0
          ? {
              currentMoveMs: 0,
              moves: w.moves + 1,
              totalThinkMs: w.totalThinkMs + w.currentMoveMs,
              lastMoveMs: w.currentMoveMs,
              moveHistory: [...w.moveHistory, w.currentMoveMs],
            }
          : w
      );
    } else if (active === "black") {
      setBlack((b) =>
        b.currentMoveMs > 0
          ? {
              currentMoveMs: 0,
              moves: b.moves + 1,
              totalThinkMs: b.totalThinkMs + b.currentMoveMs,
              lastMoveMs: b.currentMoveMs,
              moveHistory: [...b.moveHistory, b.currentMoveMs],
            }
          : b
      );
    }
    setGameOver(true);
  }

  const started = active !== null;

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-slate-950 text-white">
      {/* Top Header Bar */}
      <header className="z-20 grid h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-hidden border-b border-slate-800 bg-slate-900/90 px-2 sm:px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-xl shadow-md shadow-amber-500/20">
            ♛
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold leading-tight">Chess Clock</div>
            <div className="truncate text-xs text-slate-400 leading-tight">Stopwatch · Per-Move Timing</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={() => setSoundOn((s) => !s)}
            className="h-10 rounded-lg bg-slate-800 px-2 text-sm text-slate-200 transition hover:bg-slate-700 active:bg-slate-700 sm:px-3"
            title="Toggle sound"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            onClick={togglePause}
            disabled={!started}
            className="h-10 rounded-lg bg-slate-800 px-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 active:bg-slate-700 disabled:opacity-40 sm:px-3"
          >
            <span className="sm:hidden">{running ? "⏸" : "▶"}</span>
            <span className="hidden sm:inline">{running ? "⏸ Pause" : "▶ Resume"}</span>
          </button>
          <button
            onClick={handleGameOver}
            disabled={!started}
            className="h-10 rounded-lg bg-rose-600 px-2 text-sm font-bold text-white shadow-md shadow-rose-500/30 transition hover:bg-rose-500 active:bg-rose-700 disabled:opacity-40 sm:px-3"
            title="End the match and view the summary"
          >
            <span className="sm:hidden">🏁</span>
            <span className="hidden sm:inline">🏁 Game Over</span>
          </button>
          <button
            onClick={reset}
            className="h-10 rounded-lg bg-slate-800 px-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 active:bg-slate-700 sm:px-3"
          >
            <span className="sm:hidden">↺</span>
            <span className="hidden sm:inline">↺ Reset</span>
          </button>
        </div>
      </header>

      {/* Main Playing Area */}
      <main
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{ gridTemplateRows: "minmax(0, 1fr) clamp(6rem, 16dvh, 9rem) minmax(0, 1fr)" }}
      >
        {/* Black player panel (Top, Flipped 180°) */}
        <PlayerPanel
          player="black"
          state={black}
          isActive={active === "black"}
          isRunning={running}
          flipped
        />

        {/* Big Central Switch Button */}
        <div className="relative z-10 h-full min-h-0 w-full overflow-hidden border-y-4 border-slate-950 bg-slate-900 shadow-2xl">
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              handleSwitchTurn();
            }}
            className={`grid h-full w-full cursor-pointer select-none grid-cols-1 items-center justify-items-center overflow-hidden px-3 py-2 transition-colors duration-150 active:brightness-95 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:px-8 ${
              !started
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                : running
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 shadow-xl shadow-amber-500/30"
                : "bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600"
            }`}
          >
            {/* Left info */}
            <div className="hidden min-w-0 flex-col items-start gap-1 justify-self-start overflow-hidden opacity-90 text-left leading-none sm:flex">
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-80">Total Moves</div>
              <div className="font-mono font-black text-2xl sm:text-4xl">
                {white.moves + black.moves}
              </div>
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-80 mt-1">Match Time</div>
              <div className="font-mono font-black text-xl sm:text-3xl leading-none">
                {formatDuration(white.totalThinkMs + black.totalThinkMs)}
              </div>
            </div>

            {/* Center label */}
            <div className="flex min-w-0 flex-col items-center justify-center overflow-hidden text-center">
              <div className="flex items-center gap-2 whitespace-nowrap font-black uppercase tracking-widest leading-none text-[clamp(2rem,9vw,4.5rem)] sm:gap-4">
                {!started && (
                  <>
                    <span>▶</span>
                    <span>START</span>
                    <span className="rotate-180">▶</span>
                  </>
                )}
                {started && running && (
                  <>
                    <span className="text-[0.8em]">⤡</span>
                    <span>SWITCH</span>
                    <span className="text-[0.8em]">⤢</span>
                  </>
                )}
                {started && !running && (
                  <>
                    <span>▶</span>
                    <span>RESUME</span>
                    <span>▶</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-[10px] sm:text-sm font-black tracking-widest opacity-80 uppercase">
                {!started ? "White Moves First" : running ? "Tap or Press Space" : "Paused"}
              </div>
            </div>

            {/* Right info */}
            <div className="hidden min-w-0 flex-col items-end gap-1 justify-self-end overflow-hidden opacity-90 text-right leading-none sm:flex">
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-80 flex items-center gap-2 justify-end">
                <span className="inline-block h-3 w-3 rounded-full bg-white ring-2 ring-slate-400" />
                White Total
              </div>
              <div className="font-mono font-black text-xl sm:text-3xl leading-none">
                {formatDuration(white.totalThinkMs)}
              </div>
              <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-80 mt-1 flex items-center gap-2 justify-end">
                <span className="inline-block h-3 w-3 rounded-full bg-slate-950 ring-2 ring-slate-700" />
                Black Total
              </div>
              <div className="font-mono font-black text-xl sm:text-3xl leading-none">
                {formatDuration(black.totalThinkMs)}
              </div>
            </div>
          </button>
        </div>

        {/* White player panel (Bottom) */}
        <PlayerPanel
          player="white"
          state={white}
          isActive={active === "white"}
          isRunning={running}
        />
      </main>

      {/* Game Over Modal */}
      {gameOver && (
        <GameOverModal
          whiteStats={computeStats(white)}
          blackStats={computeStats(black)}
          onRestart={reset}
          onClose={() => setGameOver(false)}
        />
      )}
    </div>
  );
}
