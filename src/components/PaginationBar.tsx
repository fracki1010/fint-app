import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

function pageWindow(current: number, total: number, size = 3): number[] {
  const half = Math.floor(size / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + size - 1);
  start = Math.max(1, end - size + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export function PaginationBar({
  page,
  totalPages,
  from,
  to,
  total,
  loading = false,
  label,
  onPrev,
  onNext,
  onPage,
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  loading?: boolean;
  label?: string;
  onPrev: () => void;
  onNext: () => void;
  onPage?: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
      <p className="text-xs text-default-400">
        {label ?? `${from}–${to} de ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-default-400 transition hover:bg-white/8 hover:text-foreground disabled:opacity-30"
          disabled={page <= 1 || loading}
          onClick={onPrev}
        >
          <ChevronLeft size={13} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition ${
              p === page
                ? "bg-primary text-primary-foreground"
                : "border border-white/10 bg-white/5 text-default-400 hover:bg-white/8 hover:text-foreground"
            }`}
            onClick={() => onPage?.(p) ?? (p < page ? onPrev() : onNext())}
          >
            {p}
          </button>
        ))}
        {loading ? (
          <div className="flex h-7 w-7 items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={13} />
          </div>
        ) : (
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-default-400 transition hover:bg-white/8 hover:text-foreground disabled:opacity-30"
            disabled={page >= totalPages}
            onClick={onNext}
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
