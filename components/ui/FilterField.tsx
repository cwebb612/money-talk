import { ReactNode } from "react";

interface FilterFieldProps {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export default function FilterField({ label, htmlFor, className = "", children }: FilterFieldProps) {
  const labelClass = "block text-xs mb-1.5";
  const labelStyle = { color: "var(--color-muted)" };
  return (
    <div className={`min-w-0 ${className}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass} style={labelStyle}>
          {label}
        </label>
      ) : (
        <span className={labelClass} style={labelStyle}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
}
