"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
      />
      <div
        className="flex flex-col"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 100vw)",
          backgroundColor: "var(--color-card)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.35)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
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
