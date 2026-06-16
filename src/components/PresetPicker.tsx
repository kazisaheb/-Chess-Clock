import type { TimeControl } from "../types";

const PRESETS: TimeControl[] = [
  { id: "bullet-1-0", name: "1 | 0", baseMinutes: 1, incrementSeconds: 0, category: "Bullet" },
  { id: "bullet-2-1", name: "2 | 1", baseMinutes: 2, incrementSeconds: 1, category: "Bullet" },
  { id: "blitz-3-0", name: "3 | 0", baseMinutes: 3, incrementSeconds: 0, category: "Blitz" },
  { id: "blitz-3-2", name: "3 | 2", baseMinutes: 3, incrementSeconds: 2, category: "Blitz" },
  { id: "blitz-5-0", name: "5 | 0", baseMinutes: 5, incrementSeconds: 0, category: "Blitz" },
  { id: "blitz-5-3", name: "5 | 3", baseMinutes: 5, incrementSeconds: 3, category: "Blitz" },
  { id: "rapid-10-0", name: "10 | 0", baseMinutes: 10, incrementSeconds: 0, category: "Rapid" },
  { id: "rapid-15-10", name: "15 | 10", baseMinutes: 15, incrementSeconds: 10, category: "Rapid" },
  { id: "classical-30-0", name: "30 | 0", baseMinutes: 30, incrementSeconds: 0, category: "Classical" },
  { id: "classical-60-30", name: "60 | 30", baseMinutes: 60, incrementSeconds: 30, category: "Classical" },
];

interface Props {
  current: TimeControl;
  onSelect: (tc: TimeControl) => void;
  onCustom: () => void;
}

export default function PresetPicker({ current, onSelect, onCustom }: Props) {
  const categories: TimeControl["category"][] = ["Bullet", "Blitz", "Rapid", "Classical"];

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {cat}
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => p.category === cat).map((p) => {
              const active = current.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/30"
                      : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Custom
        </div>
        <button
          onClick={onCustom}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            current.category === "Custom"
              ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/30"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {current.category === "Custom"
            ? `${current.baseMinutes} | ${current.incrementSeconds}`
            : "Set custom…"}
        </button>
      </div>
    </div>
  );
}
