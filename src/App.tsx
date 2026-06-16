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
  }, [active, running, soundOn]);

  // Spacebar / Enter hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "Enter") && !e.repeat) {
        if (e.target instanceof HTMLElement && e.target.tagName === "INPUT") return;
        e.preventDefault();
        handleSwitchTurn();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwitchTurn]);

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
    // Stop the clock and show the summary popup
    setRunning(false);
    setGameOver(true);
  }

  const started = active !== null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur z-20">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-xl shadow-md shadow-amber-500/20">
            ♛
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Chess Clock</div>
            <div className="text-xs text-slate-400 leading-tight">Stopwatch · Per-Move Timing</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn((s) => !s)}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 active:scale-95 transition"
            title="Toggle sound"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            onClick={togglePause}
            disabled={!started}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 active:scale-95 transition disabled:opacity-40"
          >
            {running ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button
            onClick={handleGameOver}
            disabled={!started}
            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white hover:bg-rose-500 active:scale-95 transition disabled:opacity-40 shadow-md shadow-rose-500/30"
            title="End the match and view the summary"
          >
            🏁 Game Over
          </button>
          <button
            onClick={reset}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 active:scale-95 transition"
          >
            ↺ Reset
          </button>
        </div>
      </header>

      {/* Main Playing Area */}
      <main className="flex flex-1 flex-col">
        {/* Black player panel (Top, Flipped 180°) */}
        <PlayerPanel
          player="black"
          state={black}
          isActive={active === "black"}
          isRunning={running}
          flipped
        />

        {/* Big Central Switch Button */}
        <div className="relative flex w-full flex-col items-center justify-center border-y-4 border-slate-950 bg-slate-900 z-10 shadow-2xl">
          <button
            onClick={(e) => {
              e.currentTarget.blur();
              handleSwitchTurn();
            }}
            className={`flex h-auto min-h-[7rem] sm:min-h-[10rem] py-3 w-full cursor-pointer select-none items-center justify-between px-3 sm:px-10 transition-all duration-150 active:scale-[0.99] ${
              !started
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                : running
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 shadow-xl shadow-amber-500/30"
                : "bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600"
            }`}
          >
            {/* Left info */}
            <div className="flex flex-col items-start gap-1 opacity-90 text-left leading-none">
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
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-widest flex items-center gap-2 sm:gap-4 leading-none">
                {!started && (
                  <>
                    <span>▶</span>
                    <span>START</span>
                    <span className="rotate-180">▶</span>
                  </>
                )}
                {started && running && (
                  <>
                    <span className="text-3xl sm:text-5xl">⤡</span>
                    <span>SWITCH</span>
                    <span className="text-3xl sm:text-5xl">⤢</span>
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
            <div className="flex flex-col items-end gap-1 opacity-90 text-right leading-none">
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
