export function BarChart({
  data,
  height = 160,
  color = "#3b82f6",
  formatValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-[3px] h-full" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;

        return (
          <div
            key={i}
            className="relative flex flex-col items-center justify-end flex-1 h-full"
          >
            {d.value > 0 && (
              <span className="mb-1 text-[9px] font-semibold text-gray-400 leading-none">
                {formatValue ? formatValue(d.value) : d.value}
              </span>
            )}
            <div
              className="w-full rounded-t transition-all duration-300"
              style={{
                height: `${Math.max(pct, d.value > 0 ? 4 : 0)}%`,
                background: d.value > 0
                  ? `linear-gradient(to top, ${color}88, ${color})`
                  : "transparent",
                minHeight: d.value > 0 ? 4 : 0,
                borderRadius: 2,
              }}
            />
            <span className="mt-1 text-[8px] text-gray-500 leading-none truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HorizontalBar({
  label,
  value,
  max,
  color = "#3b82f6",
  formatValue,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  formatValue?: (v: number) => string;
  suffix?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-gray-400 truncate text-right">{label}</span>
      <div className="flex-1 h-5 rounded-md bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-md transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }}
        />
      </div>
      <span className="w-20 text-right text-xs font-semibold text-white">
        {formatValue ? formatValue(value) : value}
        {suffix}
      </span>
    </div>
  );
}
