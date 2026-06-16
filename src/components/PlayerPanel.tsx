import type { Player, PlayerState } from "../types";
import { formatClock, formatDuration } from "../utils/format";

interface Props {
  player: Player;
  state: PlayerState;
  isActive: boolean;
  isRunning: boolean;
  flipped?: boolean;
}

export default function PlayerPanel({
  player,
  state,
  isActive,
  isRunning,
  flipped,
}: Props) {
  const isWhite = player === "white";
  const avgMove = state.moves > 0 ? state.totalThinkMs / state.moves : 0;
  const isThinking = isActive && isRunning;

  const baseBg = isWhite ? "bg-slate-100" : "bg-slate-900";
  const textColor = isWhite ? "text-slate-900" : "text-white";
  const subTextColor = isWhite ? "text-slate-600" : "text-slate-400";
  const statBg = isWhite ? "bg-slate-200/70" : "bg-slate-800/70";

  return (
    <div
      className={`relative flex w-full flex-1 select-none flex-col items-center justify-between overflow-hidden p-6 transition-opacity duration-200 sm:p-10 ${baseBg} ${
        flipped ? "rotate-180" : ""
      }`}
      style={{ minHeight: "38vh" }}
    >
      {/* Active border indicator */}
      {isThinking && (
        <div className="pointer-events-none absolute inset-0 border-4 border-amber-500 sm:border-8" />
      )}

      {/* Header row */}
      <div className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full ${
              isWhite ? "bg-white ring-2 ring-slate-400" : "bg-slate-950 ring-2 ring-slate-500"
            }`}
          />
          <span className={`text-sm font-bold ${textColor}`}>{player}</span>
          {isThinking && (
            <span
              className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold animate-pulse ${
                isWhite ? "bg-emerald-100 text-emerald-700" : "bg-emerald-950 text-emerald-400"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              THINKING
            </span>
          )}
        </div>
        <span className={subTextColor}>Move {state.moves + 1}</span>
      </div>

      {/* Big clock — counting UP */}
      <div
        className={`my-4 font-mono text-7xl font-bold tabular-nums tracking-tight transition-opacity sm:text-8xl md:text-9xl ${textColor} ${
          !isThinking ? "opacity-50" : "opacity-100"
        }`}
      >
        {formatClock(state.currentMoveMs)}
      </div>

      {/* Footer stats */}
      <div
        className={`grid w-full max-w-md grid-cols-3 gap-2 rounded-xl p-3 text-center text-xs transition-opacity ${statBg} ${subTextColor} ${
          !isThinking ? "opacity-50" : "opacity-100"
        }`}
      >
        <div>
          <div className="font-semibold uppercase tracking-wider opacity-75">Last Move</div>
          <div className={`mt-0.5 text-sm font-bold ${textColor}`}>
            {state.lastMoveMs !== null ? formatDuration(state.lastMoveMs) : "—"}
          </div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wider opacity-75">Avg Move</div>
          <div className={`mt-0.5 text-sm font-bold ${textColor}`}>
            {state.moves > 0 ? formatDuration(avgMove) : "—"}
          </div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wider opacity-75">Time Used</div>
          <div className={`mt-0.5 text-sm font-bold ${textColor}`}>
            {formatDuration(state.totalThinkMs)}
          </div>
        </div>
      </div>
    </div>
  );
}
