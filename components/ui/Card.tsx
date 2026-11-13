import { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function Card({ children, className = "", style }: CardProps) {
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
      style={{ backgroundColor: "var(--color-card)", ...style }}
    >
      {children}
    </div>
  );
}
