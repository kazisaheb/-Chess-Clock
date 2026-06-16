import type { Player, PlayerState } from "../types";
import { formatClock, formatDuration } from "../utils/format";

interface Props {
  player: Player;
  state: PlayerState;
  isActive: boolean;
  isRunning: boolean;
  isFlagged: boolean;
  flipped?: boolean;
  lastMoveMs: number | null;
  onTap: () => void;
}

export default function PlayerPanel({
  player,
  state,
  isActive,
  isRunning,
  isFlagged,
  flipped,
  lastMoveMs,
  onTap,
}: Props) {
  const isWhite = player === "white";
  const lowTime = state.timeMs <= 10_000 && state.timeMs > 0;
  const avgMove = state.moves > 0 ? state.totalThinkMs / state.moves : 0;

  const baseBg = isFlagged
    ? "bg-red-950"
    : isActive && isRunning
    ? isWhite
      ? "bg-amber-100"
      : "bg-amber-500"
    : isWhite
    ? "bg-slate-100"
    : "bg-slate-800";

  const textColor = isFlagged
    ? "text-red-300"
    : isActive && isRunning
    ? "text-slate-900"
    : isWhite
    ? "text-slate-900"
    : "text-slate-100";

  const subTextColor = isFlagged
    ? "text-red-400/80"
    : isActive && isRunning
    ? "text-slate-800/70"
    : isWhite
    ? "text-slate-600"
    : "text-slate-400";

  return (
    <button
      onClick={onTap}
      disabled={isFlagged}
      className={`relative flex w-full flex-1 select-none flex-col items-center justify-center overflow-hidden p-6 transition-colors duration-150 sm:p-10 ${baseBg} ${
        isFlagged ? "cursor-not-allowed" : "cursor-pointer active:brightness-95"
      } ${flipped ? "rotate-180" : ""}`}
      style={{ minHeight: "40vh" }}
    >
      {/* Pulse ring when active */}
      {isActive && isRunning && !isFlagged && (
        <div className="pointer-events-none absolute inset-0 ring-4 ring-inset ring-amber-600/40" />
      )}

      {/* Header row */}
      <div className={`flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest ${subTextColor}`}>
        <span className="flex items-center gap-2">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              isWhite ? "bg-white ring-2 ring-slate-400" : "bg-slate-900 ring-2 ring-slate-500"
            }`}
          />
          {player}
        </span>
        <span>Move {state.moves}</span>
      </div>

      {/* Big clock */}
      <div
        className={`my-6 font-mono text-7xl font-bold tabular-nums tracking-tight sm:text-8xl md:text-9xl ${textColor} ${
          lowTime && isActive && isRunning ? "animate-pulse" : ""
        }`}
      >
        {isFlagged ? "FLAG" : formatClock(state.timeMs)}
      </div>

      {/* Footer stats */}
      <div className={`grid w-full max-w-md grid-cols-3 gap-2 text-center text-xs ${subTextColor}`}>
        <div>
          <div className="font-semibold uppercase tracking-wider opacity-75">Last</div>
          <div className={`text-sm font-bold ${textColor}`}>
            {lastMoveMs !== null ? formatDuration(lastMoveMs) : "—"}
          </div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wider opacity-75">Avg</div>
          <div className={`text-sm font-bold ${textColor}`}>
            {state.moves > 0 ? formatDuration(avgMove) : "—"}
          </div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wider opacity-75">Used</div>
          <div className={`text-sm font-bold ${textColor}`}>
            {formatDuration(state.totalThinkMs)}
          </div>
        </div>
      </div>

      {/* Tap hint */}
      {isActive && isRunning && !isFlagged && (
        <div className={`mt-4 text-xs font-medium uppercase tracking-wider ${subTextColor}`}>
          Tap to end your move
        </div>
      )}
      {!isRunning && !isFlagged && state.moves === 0 && (
        <div className={`mt-4 text-xs font-medium uppercase tracking-wider ${subTextColor}`}>
          {isWhite ? "White moves first — tap to start" : "Waiting…"}
        </div>
      )}
    </button>
  );
}
