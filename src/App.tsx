import { useCallback, useEffect, useRef, useState } from "react";
import type { Player, PlayerState, TimeControl } from "./types";
import PlayerPanel from "./components/PlayerPanel";
import PresetPicker from "./components/PresetPicker";
import CustomTimeModal from "./components/CustomTimeModal";
import { playClick, playFlag, playWarning } from "./utils/sound";

const DEFAULT_TC: TimeControl = {
  id: "blitz-5-3",
  name: "5 | 3",
  baseMinutes: 5,
  incrementSeconds: 3,
  category: "Blitz",
};

function freshState(tc: TimeControl): PlayerState {
  return { timeMs: tc.baseMinutes * 60_000, moves: 0, totalThinkMs: 0 };
}

export default function App() {
  const [tc, setTc] = useState<TimeControl>(DEFAULT_TC);
  const [white, setWhite] = useState<PlayerState>(freshState(DEFAULT_TC));
  const [black, setBlack] = useState<PlayerState>(freshState(DEFAULT_TC));

  const [active, setActive] = useState<Player | null>(null); // null = not started
  const [running, setRunning] = useState(false);
  const [flagged, setFlagged] = useState<Player | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const [lastMoveWhite, setLastMoveWhite] = useState<number | null>(null);
  const [lastMoveBlack, setLastMoveBlack] = useState<number | null>(null);

  // Refs for the ticking engine — avoids re-creating intervals on every state change.
  const tickRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const turnStartRef = useRef<number>(0); // timestamp when current player's turn started
  const warnedRef = useRef<{ white: boolean; black: boolean }>({ white: false, black: false });

  const reset = useCallback(
    (newTc?: TimeControl) => {
      const t = newTc ?? tc;
      setWhite(freshState(t));
      setBlack(freshState(t));
      setActive(null);
      setRunning(false);
      setFlagged(null);
      setLastMoveWhite(null);
      setLastMoveBlack(null);
      warnedRef.current = { white: false, black: false };
    },
    [tc]
  );

  // Apply new time control
  function applyTc(next: TimeControl) {
    setTc(next);
    reset(next);
  }

  // Ticking loop using requestAnimationFrame for smoothness
  useEffect(() => {
    if (!running || !active || flagged) {
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
        setWhite((w) => {
          const nextMs = Math.max(0, w.timeMs - dt);
          if (nextMs <= 10_000 && !warnedRef.current.white && nextMs > 0 && soundOn) {
            warnedRef.current.white = true;
            playWarning();
          }
          if (nextMs === 0) {
            setFlagged("white");
            setRunning(false);
            if (soundOn) playFlag();
          }
          return { ...w, timeMs: nextMs };
        });
      } else {
        setBlack((b) => {
          const nextMs = Math.max(0, b.timeMs - dt);
          if (nextMs <= 10_000 && !warnedRef.current.black && nextMs > 0 && soundOn) {
            warnedRef.current.black = true;
            playWarning();
          }
          if (nextMs === 0) {
            setFlagged("black");
            setRunning(false);
            if (soundOn) playFlag();
          }
          return { ...b, timeMs: nextMs };
        });
      }

      tickRef.current = requestAnimationFrame(tick);
    };

    tickRef.current = requestAnimationFrame(tick);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
    };
  }, [running, active, flagged, soundOn]);

  // Reset warning flag when a player's clock is replenished above threshold (e.g. via increment)
  useEffect(() => {
    if (white.timeMs > 10_000) warnedRef.current.white = false;
  }, [white.timeMs]);
  useEffect(() => {
    if (black.timeMs > 10_000) warnedRef.current.black = false;
  }, [black.timeMs]);

  // Handle a player tapping their clock (ending their move)
  function handleTap(player: Player) {
    if (flagged) return;

    // First tap of the game: only white can start
    if (active === null) {
      if (player !== "white") return; // White must move first
      setActive("white");
      setRunning(true);
      turnStartRef.current = performance.now();
      if (soundOn) playClick();
      return;
    }

    // Only the active player can end their own move
    if (player !== active) return;
    if (!running) return;

    const now = performance.now();
    const thinkMs = now - turnStartRef.current;
    const incMs = tc.incrementSeconds * 1000;

    if (player === "white") {
      setWhite((w) => ({
        timeMs: w.timeMs + incMs,
        moves: w.moves + 1,
        totalThinkMs: w.totalThinkMs + thinkMs,
      }));
      setLastMoveWhite(thinkMs);
      setActive("black");
    } else {
      setBlack((b) => ({
        timeMs: b.timeMs + incMs,
        moves: b.moves + 1,
        totalThinkMs: b.totalThinkMs + thinkMs,
      }));
      setLastMoveBlack(thinkMs);
      setActive("white");
    }

    turnStartRef.current = now;
    if (soundOn) playClick();
  }

  function togglePause() {
    if (flagged || active === null) return;
    if (running) {
      // Pausing — credit elapsed think time to current turn start (just stop, don't bank)
      setRunning(false);
    } else {
      // Resuming
      turnStartRef.current = performance.now();
      setRunning(true);
    }
  }

  const started = active !== null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-xl">
            ♛
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Chess Clock</div>
            <div className="text-xs text-slate-400 leading-tight">
              {tc.name} · {tc.category}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn((s) => !s)}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
            title="Toggle sound"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            onClick={togglePause}
            disabled={!started || !!flagged}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40"
          >
            {running ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button
            onClick={() => reset()}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            ↺ Reset
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            ⚙ {showSettings ? "Hide" : "Settings"}
          </button>
        </div>
      </header>

      {/* Main playing area */}
      <main className="flex flex-1 flex-col">
        {/* Black panel (top, flipped so they can read it from across the table) */}
        <PlayerPanel
          player="black"
          state={black}
          isActive={active === "black"}
          isRunning={running}
          isFlagged={flagged === "black"}
          flipped
          lastMoveMs={lastMoveBlack}
          onTap={() => handleTap("black")}
        />

        {/* Center divider with totals */}
        <div className="flex items-center justify-center gap-4 border-y border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">
          <span>
            Total moves:{" "}
            <span className="font-semibold text-slate-200">{white.moves + black.moves}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>
            Increment:{" "}
            <span className="font-semibold text-slate-200">+{tc.incrementSeconds}s</span>
          </span>
          {flagged && (
            <>
              <span className="text-slate-600">•</span>
              <span className="font-semibold text-red-400">
                {flagged === "white" ? "Black" : "White"} wins on time!
              </span>
            </>
          )}
        </div>

        {/* White panel (bottom) */}
        <PlayerPanel
          player="white"
          state={white}
          isActive={active === "white"}
          isRunning={running}
          isFlagged={flagged === "white"}
          lastMoveMs={lastMoveWhite}
          onTap={() => handleTap("white")}
        />
      </main>

      {/* Settings drawer */}
      {showSettings && (
        <aside className="border-t border-slate-800 bg-slate-900 p-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Time Control</h2>
              {started && (
                <span className="text-xs text-amber-400">
                  Changing presets will reset the game.
                </span>
              )}
            </div>
            <PresetPicker
              current={tc}
              onSelect={applyTc}
              onCustom={() => setShowCustom(true)}
            />
          </div>
        </aside>
      )}

      {showCustom && (
        <CustomTimeModal
          initial={tc}
          onSave={(next) => {
            applyTc(next);
            setShowCustom(false);
          }}
          onClose={() => setShowCustom(false)}
        />
      )}
    </div>
  );
}
