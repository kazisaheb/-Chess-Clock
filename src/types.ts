export type Player = "white" | "black";

export interface TimeControl {
  id: string;
  name: string;
  baseMinutes: number;
  incrementSeconds: number;
  category: "Bullet" | "Blitz" | "Rapid" | "Classical" | "Custom";
}

export interface PlayerState {
  timeMs: number;
  moves: number;
  totalThinkMs: number; // total time spent thinking (across all moves)
}
