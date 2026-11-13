const MARKERS = [25, 50, 75];

interface Props {
  percent: number;
  label: string;
  markers?: boolean;
  height?: number;
  accent?: string;
}

export default function GoalProgressBar({ percent, label, markers = false, height = 10, accent }: Props) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className="relative w-full rounded-full overflow-hidden"
      style={{ height, backgroundColor: "var(--color-border)" }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${percent}%`,
          background: accent ? `linear-gradient(90deg, var(--color-yellow), ${accent})` : "var(--color-yellow)",
        }}
      />
      {markers &&
        MARKERS.map((mark) => (
          <span
            key={mark}
            aria-hidden
            className="absolute top-0 bottom-0"
            style={{ left: `${mark}%`, width: 2, backgroundColor: "var(--color-card)", opacity: 0.8 }}
          />
        ))}
    </div>
  );
}
