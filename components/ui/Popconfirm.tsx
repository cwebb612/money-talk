"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface PopconfirmProps {
  title: string;
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function Popconfirm({
  title,
  onConfirm,
  children,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: PopconfirmProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div onClick={() => setOpen((o) => !o)}>{children}</div>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 0,
            width: 220,
            backgroundColor: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            padding: 12,
            zIndex: 200,
          }}
        >
          <p className="text-sm mb-3" style={{ color: "var(--color-text)" }}>
            {title}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-3 py-1 rounded-lg"
              style={{ color: "var(--color-muted)" }}
              disabled={busy}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="text-xs px-3 py-1 rounded-lg font-medium"
              style={{ backgroundColor: "#dc2626", color: "#ffffff", opacity: busy ? 0.6 : 1 }}
              disabled={busy}
            >
              {busy ? "…" : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
