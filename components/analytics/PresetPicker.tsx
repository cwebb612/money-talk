"use client";

import { WindowPreset } from "../../lib/utils/monthWindow";

const PRESETS: WindowPreset[] = ["1M", "6M", "YTD", "1Y", "All"];

interface Props {
  value: WindowPreset;
  onChange: (preset: WindowPreset) => void;
}

export default function PresetPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {PRESETS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: value === p ? "var(--color-yellow)" : "transparent",
            color: value === p ? "black" : "var(--color-muted)",
            fontWeight: value === p ? 600 : 400,
          }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
