"use client";

import { ReactNode, useId, useState } from "react";
import { formatNumeric, parseNumeric } from "../../../lib/utils/money";

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  integer?: boolean;
  inline?: boolean;
  slider?: { min: number; max: number; step: number };
  info?: ReactNode;
}

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

export default function NumberField(props: Props) {
  const { label, value, onChange, prefix, suffix, min, max, integer, inline, slider, info } = props;
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  function commit(text: string) {
    const parsed = parseNumeric(text);
    onChange(clamp(integer ? Math.round(parsed) : parsed, min, max));
  }

  const box = (
    <div
      className={`flex items-center gap-1 rounded-lg px-2.5 h-9 focus-within:ring-2 ${inline ? "w-32" : ""}`}
      style={{
        backgroundColor: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        ["--tw-ring-color" as string]: "var(--color-blue)",
      }}
    >
      {prefix && <span className="text-sm" style={{ color: "var(--color-muted)" }}>{prefix}</span>}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={draft ?? (value === 0 ? "0" : formatNumeric(value))}
        onFocus={(e) => {
          setDraft(e.target.value);
          e.target.select();
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        onBlur={(e) => {
          commit(e.target.value);
          setDraft(null);
        }}
        className={`flex-1 min-w-0 bg-transparent outline-none text-sm tabular-nums ${inline ? "text-right" : ""}`}
        style={{ color: "var(--color-text)" }}
      />
      {suffix && <span className="text-sm" style={{ color: "var(--color-muted)" }}>{suffix}</span>}
    </div>
  );

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className={inline ? "flex items-center justify-between gap-3" : "flex flex-col gap-1"}>
        <span className="flex items-center gap-1">
          <label htmlFor={id} className="text-xs" style={{ color: "var(--color-muted)" }}>
            {label}
          </label>
          {info}
        </span>
        {box}
      </div>
      {slider && (
        <input
          type="range"
          aria-label={label}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={clamp(value, slider.min, slider.max)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-5"
          style={{ accentColor: "var(--color-yellow)" }}
        />
      )}
    </div>
  );
}
