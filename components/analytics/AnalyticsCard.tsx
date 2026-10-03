"use client";

import { ReactNode } from "react";
import { CollapsibleHeader, useCollapsible } from "../ui/Collapsible";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function AnalyticsCard({ title, children, defaultOpen = true }: Props) {
  const { expanded, collapsible, toggle } = useCollapsible(defaultOpen);

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: "var(--color-card)" }}>
      <CollapsibleHeader
        expanded={expanded}
        collapsible={collapsible}
        onToggle={toggle}
        label={title}
        className="items-center"
        chevronClassName=""
        chevronSize={18}
      >
        <span className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
          {title}
        </span>
      </CollapsibleHeader>

      {expanded && <div className="mt-4">{children}</div>}
    </div>
  );
}
