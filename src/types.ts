export type Player = "white" | "black";

export interface PlayerState {
  currentMoveMs: number; // elapsed time of the current move (counts up)
  moves: number; // completed moves
  totalThinkMs: number; // total time across all completed moves
  lastMoveMs: number | null; // duration of the most recently completed move
}
