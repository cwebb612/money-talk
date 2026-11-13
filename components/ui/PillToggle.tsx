"use client";

interface PillToggleOption<T extends string> {
  value: T;
  label: string;
}

interface PillToggleProps<T extends string> {
  value: T;
  options: PillToggleOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export default function PillToggle<T extends string>({ value, options, onChange, ariaLabel }: PillToggleProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: selected ? "var(--color-yellow)" : "var(--color-border)",
              color: selected ? "black" : "var(--color-text)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
