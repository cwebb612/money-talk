import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
      style={{ backgroundColor: "var(--color-card)" }}
    >
      {children}
    </div>
  );
}
