import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export function PaginationBar({
  page,
  totalPages,
  from,
  to,
  total,
  loading = false,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-white/8 px-4 py-3">
      <p className="text-xs text-default-400">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-default-400 transition hover:bg-white/8 hover:text-foreground disabled:opacity-30"
          disabled={page <= 1 || loading}
          onClick={onPrev}
        >
          <ChevronLeft size={13} />
        </button>
        <span className="min-w-[3.5rem] px-1 text-center text-xs font-semibold text-foreground">
          {page} / {totalPages}
        </span>
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
