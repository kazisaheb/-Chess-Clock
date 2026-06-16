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
      className={`relative grid h-full min-h-0 w-full select-none grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden px-3 py-3 sm:px-6 sm:py-5 ${baseBg} ${
        flipped ? "rotate-180" : ""
      }`}
    >
      {/* Active border indicator */}
      {isThinking && (
        <div className="pointer-events-none absolute inset-0 border-4 border-amber-500 sm:border-8" />
      )}

      {/* Header row */}
      <div className="flex min-h-0 w-full items-center justify-between gap-2 font-bold uppercase tracking-widest">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-block h-4 w-4 rounded-full sm:h-5 sm:w-5 ${
              isWhite ? "bg-white ring-2 ring-slate-400" : "bg-slate-950 ring-2 ring-slate-500"
            }`}
          />
          <span className={`truncate text-base sm:text-xl font-black ${textColor}`}>{player}</span>
          {isThinking && (
            <span
              className={`ml-1 hidden items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] sm:inline-flex sm:text-sm font-black ${
                isWhite ? "bg-emerald-100 text-emerald-700" : "bg-emerald-950 text-emerald-400"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              THINKING
            </span>
          )}
        </div>
        <span className={`shrink-0 text-base sm:text-2xl font-black ${subTextColor}`}>
          Move {state.moves + 1}
        </span>
      </div>

      {/* Big clock — counting UP */}
      <div
        className={`flex min-h-0 w-full items-center justify-center overflow-hidden font-mono font-black tabular-nums tracking-tight leading-none text-[clamp(3.25rem,14vw,10rem)] ${textColor} ${
          !isThinking ? "opacity-50" : "opacity-100"
        }`}
      >
        <span className="block w-[8ch] max-w-full text-center whitespace-nowrap">
          {formatClock(state.currentMoveMs)}
        </span>
      </div>

      {/* Footer stats */}
      <div
        className={`grid min-h-0 w-full grid-cols-3 gap-1 sm:gap-3 rounded-xl p-2 sm:p-4 text-center ${statBg} ${
          !isThinking ? "opacity-50" : "opacity-100"
        }`}
      >
        <div className="min-w-0 overflow-hidden">
          <div className={`font-black uppercase tracking-wider ${subTextColor} text-[10px] sm:text-sm`}>Last Move</div>
          <div className={`mt-1 truncate font-mono font-black ${textColor} text-[clamp(1.15rem,5vw,2.5rem)] leading-none`}>
            {state.lastMoveMs !== null ? formatDuration(state.lastMoveMs) : "—"}
          </div>
        </div>
        <div className="min-w-0 overflow-hidden">
          <div className={`font-black uppercase tracking-wider ${subTextColor} text-[10px] sm:text-sm`}>Avg Move</div>
          <div className={`mt-1 truncate font-mono font-black ${textColor} text-[clamp(1.15rem,5vw,2.5rem)] leading-none`}>
            {state.moves > 0 ? formatDuration(avgMove) : "—"}
          </div>
        </div>
        <div className="min-w-0 overflow-hidden">
          <div className={`font-black uppercase tracking-wider ${subTextColor} text-[10px] sm:text-sm`}>Time Used</div>
          <div className={`mt-1 truncate font-mono font-black ${textColor} text-[clamp(1.15rem,5vw,2.5rem)] leading-none`}>
            {formatDuration(state.totalThinkMs)}
          </div>
        </div>
      </div>
    </div>
  );
}
