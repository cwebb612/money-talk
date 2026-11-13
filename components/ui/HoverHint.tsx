"use client";

import { ReactNode, useId, useState } from "react";

interface Props {
  hint: string;
  children: (describedBy: string | undefined) => ReactNode;
}

export default function HoverHint({ hint, children }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children(open ? id : undefined)}
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute right-0 top-full mt-1 z-20 w-max max-w-56 rounded-lg px-2.5 py-1.5 text-xs leading-snug shadow-lg pointer-events-none"
          style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
        >
          {hint}
        </span>
      )}
    </span>
  );
}
