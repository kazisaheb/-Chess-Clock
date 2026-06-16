import type { Player } from "../types";
import { formatDuration } from "../utils/format";

interface PlayerStats {
  moves: number;
  totalMs: number;
  avgMs: number;
  longestMs: number;
  shortestMs: number;
}

interface Props {
  whiteStats: PlayerStats;
  blackStats: PlayerStats;
  onRestart: () => void;
  onClose: () => void;
}

interface CardInfo {
  player: Player;
  stats: PlayerStats;
  isWinner: boolean;
  winnerReason: string | null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider opacity-75">
        {label}
      </div>
      <div className="mt-1 font-mono font-black text-xl sm:text-3xl leading-none">
        {value}
      </div>
    </div>
  );
}

function WinnerBadge({ player }: { player: Player }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs sm:text-sm font-black uppercase tracking-widest ${
        player === "white"
          ? "bg-white text-slate-900 ring-2 ring-amber-400"
          : "bg-slate-900 text-white ring-2 ring-amber-400"
      }`}
    >
      👑 {player} wins
    </div>
  );
}

export default function GameOverModal({
  whiteStats,
  blackStats,
  onRestart,
  onClose,
}: Props) {
  const totalMoves = whiteStats.moves + blackStats.moves;
  const matchTime = whiteStats.totalMs + blackStats.totalMs;

  // Decide a winner
  let whiteWins = false;
  let blackWins = false;
  let winnerReason: string | null = null;

  if (totalMoves > 0) {
    if (whiteStats.moves < blackStats.moves) {
      whiteWins = true;
      winnerReason = `Fewer moves (${whiteStats.moves} vs ${blackStats.moves})`;
    } else if (blackStats.moves < whiteStats.moves) {
      blackWins = true;
      winnerReason = `Fewer moves (${blackStats.moves} vs ${whiteStats.moves})`;
    } else if (whiteStats.totalMs < blackStats.totalMs) {
      whiteWins = true;
      winnerReason = `Faster total time`;
    } else if (blackStats.totalMs < whiteStats.totalMs) {
      blackWins = true;
      winnerReason = `Faster total time`;
    }
  }

  const cards: CardInfo[] = [
    {
      player: "white",
      stats: whiteStats,
      isWinner: whiteWins,
      winnerReason: whiteWins ? winnerReason : null,
    },
    {
      player: "black",
      stats: blackStats,
      isWinner: blackWins,
      winnerReason: blackWins ? winnerReason : null,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-2 ring-amber-500/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-4 text-slate-900">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏁</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">
                Game Over
              </h2>
              <p className="text-xs sm:text-sm font-bold opacity-80">Final match summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900/10 px-3 py-1.5 text-lg font-black hover:bg-slate-900/20 transition active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Match totals */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-800 bg-slate-950/40 px-6 py-4">
          <div>
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400">
              Total Moves
            </div>
            <div className="mt-1 font-mono font-black text-2xl sm:text-4xl text-white leading-none">
              {totalMoves}
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400">
              Match Time
            </div>
            <div className="mt-1 font-mono font-black text-2xl sm:text-4xl text-white leading-none">
              {formatDuration(matchTime)}
            </div>
          </div>
        </div>

        {/* Player cards */}
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {cards.map(({ player, stats, isWinner, winnerReason }) => (
            <div
              key={player}
              className={`relative flex flex-col rounded-xl p-5 ring-2 transition-all ${
                isWinner
                  ? player === "white"
                    ? "bg-white text-slate-900 ring-amber-500 shadow-lg shadow-amber-500/40"
                    : "bg-slate-900 text-white ring-amber-500 shadow-lg shadow-amber-500/40"
                  : player === "white"
                  ? "bg-slate-100 text-slate-600 ring-slate-200"
                  : "bg-slate-800 text-slate-300 ring-slate-700"
              }`}
            >
              {/* Title row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-5 w-5 rounded-full ${
                      player === "white"
                        ? "bg-white ring-2 ring-slate-400"
                        : "bg-slate-950 ring-2 ring-slate-500"
                    }`}
                  />
                  <span
                    className={`text-lg sm:text-xl font-black uppercase tracking-widest ${
                      isWinner ? "" : "opacity-70"
                    }`}
                  >
                    {player}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${
                      isWinner ? "" : "opacity-60"
                    }`}
                  >
                    {stats.moves} moves
                  </span>
                  {isWinner && <WinnerBadge player={player} />}
                </div>
              </div>

              {/* Stats grid */}
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
                <Stat label="Total Time" value={formatDuration(stats.totalMs)} />
                <Stat label="Avg / Move" value={formatDuration(stats.avgMs)} />
                <Stat label="Longest Move" value={formatDuration(stats.longestMs)} />
                <Stat label="Shortest Move" value={formatDuration(stats.shortestMs)} />
              </div>

              {isWinner && winnerReason && (
                <div
                  className={`mt-5 rounded-lg px-3 py-2 text-center text-xs sm:text-sm font-black uppercase tracking-wider ${
                    player === "white" ? "bg-amber-100 text-amber-900" : "bg-amber-500 text-slate-900"
                  }`}
                >
                  🏆 Won by: {winnerReason}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm font-medium text-slate-400">
            Want to play another match? Reset clears all times.
          </p>
          <div className="flex gap-2 sm:justify-end">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700 active:scale-95 transition"
            >
              Close
            </button>
            <button
              onClick={onRestart}
              className="flex-1 sm:flex-none rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-black text-slate-900 hover:bg-amber-400 active:scale-95 transition shadow-md shadow-amber-500/30"
            >
              ↺ New Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
