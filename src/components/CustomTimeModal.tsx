import { useState } from "react";
import type { TimeControl } from "../types";

interface Props {
  initial: TimeControl;
  onSave: (tc: TimeControl) => void;
  onClose: () => void;
}

export default function CustomTimeModal({ initial, onSave, onClose }: Props) {
  const [minutes, setMinutes] = useState(initial.baseMinutes);
  const [increment, setIncrement] = useState(initial.incrementSeconds);

  function save() {
    const m = Math.max(0, Math.min(180, Number(minutes) || 0));
    const i = Math.max(0, Math.min(120, Number(increment) || 0));
    if (m === 0 && i === 0) return;
    onSave({
      id: `custom-${m}-${i}`,
      name: `${m} | ${i}`,
      baseMinutes: m,
      incrementSeconds: i,
      category: "Custom",
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-white">Custom Time Control</h3>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-slate-400">Base time (minutes)</span>
          <input
            type="number"
            min={0}
            max={180}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-white outline-none ring-1 ring-slate-700 focus:ring-amber-500"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block text-sm text-slate-400">Increment (seconds/move)</span>
          <input
            type="number"
            min={0}
            max={120}
            value={increment}
            onChange={(e) => setIncrement(Number(e.target.value))}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-white outline-none ring-1 ring-slate-700 focus:ring-amber-500"
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
