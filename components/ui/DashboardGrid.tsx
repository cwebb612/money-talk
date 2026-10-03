import { ReactNode } from "react";

// Single stacked column below `lg` (mobile); 12-column grid at `lg` and up (desktop).

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`max-w-2xl lg:max-w-7xl mx-auto px-4 lg:px-8 py-8 ${className}`}>
      {children}
    </div>
  );
}

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className = "" }: DashboardGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${className}`}>
      {children}
    </div>
  );
}

export type ModuleSpan = "full" | "main" | "side" | "half";

const SPAN_CLASSES: Record<ModuleSpan, string> = {
  full: "lg:col-span-12",
  main: "lg:col-span-7 xl:col-span-8",
  side: "lg:col-span-5 xl:col-span-4",
  half: "lg:col-span-6",
};

interface GridModuleProps {
  children: ReactNode;
  span?: ModuleSpan;
  stretch?: boolean;
}

// `min-w-0` lets charts shrink inside the grid track instead of overflowing it.
export function GridModule({ children, span = "full", stretch = false }: GridModuleProps) {
  const stretchClasses = stretch ? "lg:self-stretch lg:*:flex-1" : "";
  return (
    <div className={`flex flex-col gap-6 min-w-0 ${SPAN_CLASSES[span]} ${stretchClasses}`}>
      {children}
    </div>
  );
}
