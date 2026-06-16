import { useCallback, useEffect, useRef, useState } from "react";
import type { Player, PlayerState } from "./types";
import PlayerPanel from "./components/PlayerPanel";
import { playClick } from "./utils/sound";
import { formatDuration } from "./utils/format";

function freshState(): PlayerState {
  return { currentMoveMs: 0, moves: 0, totalThinkMs: 0, lastMoveMs: null };
}

export default function App() {
  const [white, setWhite] = useState<PlayerState>(freshState());
  const [black, setBlack] = useState<PlayerState>(freshState());

  const [active, setActive] = useState<Player | null>(null); // null = not started
  const [running, setRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Refs for the ticking engine
  const tickRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const turnStartRef = useRef<number>(0);

  const reset = useCallback(() => {
    setWhite(freshState());
    setBlack(freshState());
    setActive(null);
    setRunning(false);
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
      }));
      setActive("black");
    } else {
      setBlack((b) => ({
        currentMoveMs: 0,
        moves: b.moves + 1,
        totalThinkMs: b.totalThinkMs + b.currentMoveMs,
        lastMoveMs: b.currentMoveMs,
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
            className={`flex h-20 sm:h-28 w-full cursor-pointer select-none items-center justify-between px-4 sm:px-10 font-bold transition-all duration-150 active:scale-[0.99] ${
              !started
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 shadow-lg shadow-emerald-500/30"
                : running
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400 active:bg-amber-600 shadow-xl shadow-amber-500/30"
                : "bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600"
            }`}
          >
            {/* Left info */}
            <div className="flex flex-col items-start text-[11px] sm:text-sm font-extrabold opacity-85 text-left leading-tight">
              <span>TOTAL MOVES: {white.moves + black.moves}</span>
              <span className="mt-1">TOTAL TIME: {formatDuration(white.totalThinkMs + black.totalThinkMs)}</span>
            </div>

            {/* Center label */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-widest flex items-center gap-2 sm:gap-4">
                {!started && (
                  <>
                    <span>▶</span>
                    <span>START</span>
                    <span className="rotate-180">▶</span>
                  </>
                )}
                {started && running && (
                  <>
                    <span className="text-lg sm:text-3xl">⤡</span>
                    <span>SWITCH</span>
                    <span className="text-lg sm:text-3xl">⤢</span>
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
              <div className="mt-1 text-[9px] sm:text-xs font-black tracking-widest opacity-80 uppercase">
                {!started ? "White Moves First" : running ? "Tap or Press Space" : "Paused"}
              </div>
            </div>

            {/* Right info */}
            <div className="flex flex-col items-end text-[11px] sm:text-sm font-extrabold opacity-85 text-right leading-tight">
              <span>WHITE: {formatDuration(white.totalThinkMs)}</span>
              <span className="mt-1">BLACK: {formatDuration(black.totalThinkMs)}</span>
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
    </div>
  );
}
