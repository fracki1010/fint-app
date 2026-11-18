import type { CSSProperties, ReactNode } from "react";

// Building blocks for loading placeholders. Each one copies the size, padding and
// gutters of the real content it replaces, so the page does not move when data arrives.

interface BlockProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className = "", style }: BlockProps) {
  return <div aria-hidden="true" className={`skeleton-block ${className}`} style={style} />;
}

// Announces the loading area to assistive tech and keeps the layout's own spacing.
export function SkeletonRegion({
  label = "Cargando",
  className = "",
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className={className} role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// A bordered row: leading tile, two text lines, optional trailing value.
// Mirrors the list rows used across the app (rounded-2xl, px-4 py-3.5, bg-content2/40).
export function SkeletonRow({
  leading = "tile",
  lines = 2,
  trailing = true,
  className = "",
}: {
  leading?: "tile" | "circle" | "none";
  lines?: 1 | 2 | 3;
  trailing?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-[color:rgb(var(--warm-border)/0.08)] bg-content2/40 px-4 py-3.5 ${className}`}>
      {leading === "tile" && <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />}
      {leading === "circle" && <Skeleton className="h-10 w-10 shrink-0 rounded-full" />}
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5 rounded-md" />
        {lines >= 2 && <Skeleton className="h-2.5 w-3/5 rounded-md" />}
        {lines >= 3 && <Skeleton className="h-2.5 w-1/3 rounded-md" />}
      </div>
      {trailing && (
        <div className="shrink-0 space-y-2 text-right">
          <Skeleton className="ml-auto h-3.5 w-16 rounded-md" />
        </div>
      )}
    </div>
  );
}

// A stack of rows with the same spacing as the real list (space-y-2).
export function SkeletonRowList({
  rows = 6,
  className = "",
  rowClassName = "",
  ...row
}: { rows?: number; className?: string; rowClassName?: string } & Parameters<typeof SkeletonRow>[0]) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} {...row} className={rowClassName} />
      ))}
    </div>
  );
}

// A KPI tile: small label, big number. Same padding as the stat cards.
export function SkeletonKpi({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-content2/40 p-4 ${className}`}>
      <Skeleton className="h-2.5 w-16 rounded-md" />
      <Skeleton className="mt-3 h-6 w-24 rounded-md" />
    </div>
  );
}

// A panel with a heading and body lines, used by detail screens.
export function SkeletonPanel({
  lines = 3,
  className = "",
  children,
}: {
  lines?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`app-panel rounded-[28px] p-5 ${className}`}>
      <Skeleton className="h-3.5 w-1/3 rounded-md" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={`h-3 rounded-md ${i % 2 ? "w-4/5" : "w-full"}`} />
        ))}
      </div>
      {children}
    </div>
  );
}

// Rectangular placeholder for charts and wide areas, with a fixed height.
export function SkeletonChart({ height = 180, className = "" }: { height?: number; className?: string }) {
  return <Skeleton className={`w-full rounded-2xl ${className}`} style={{ height }} />;
}

// Card with more padding (p-4), used by team and supplier lists.
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-divider/30 bg-content2/30 p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2 rounded-md" />
          <Skeleton className="h-2.5 w-2/5 rounded-md" />
        </div>
        <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
      </div>
    </div>
  );
}
