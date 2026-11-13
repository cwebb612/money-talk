"use client";

import { ReactNode, useEffect, useId } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ open, onClose, title, children, width = 640 }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="flex items-center justify-center p-4" style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex flex-col rounded-xl"
        style={{
          width: `min(${width}px, 100%)`,
          maxHeight: "calc(100vh - 32px)",
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h3 id={titleId} className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {title}
          </h3>
          <button onClick={onClose} aria-label="Close" style={{ color: "var(--color-muted)" }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
