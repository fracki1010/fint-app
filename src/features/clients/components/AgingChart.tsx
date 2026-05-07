import { useMemo } from "react";
import { ClientAgingReport, AllClientsAgingReport } from "@shared/types";
import { formatCompactCurrency } from "@shared/utils/currency";

interface AgingChartProps {
  data: ClientAgingReport | AllClientsAgingReport;
  currency: string;
  type?: "bar" | "pie" | "horizontal-bar";
  height?: number;
}

const AGING_BUCKET_LABELS: Record<string, string> = {
  current: "Al día",
  "1-30": "1-30 días",
  "31-60": "31-60 días",
  "61-90": "61-90 días",
  "90+": "90+ días",
};

const AGING_BUCKET_COLORS = {
  current: "#22c55e",      // green-500
  "1-30": "#eab308",       // yellow-500
  "31-60": "#f97316",      // orange-500
  "61-90": "#ef4444",      // red-500
  "90+": "#7f1d1d",        // red-900
};

function BarChart({ buckets, currency }: { buckets: Record<string, number>; currency: string }) {
  const maxValue = useMemo(() => {
    return Math.max(...Object.values(buckets));
  }, [buckets]);

  return (
    <div className="space-y-3">
      {Object.entries(buckets).map(([bucket, value]) => {
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={bucket} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-default-600">
                {AGING_BUCKET_LABELS[bucket]}
              </span>
              <span className="font-bold text-foreground">
                {formatCompactCurrency(value, currency)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-content2">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: AGING_BUCKET_COLORS[bucket as keyof typeof AGING_BUCKET_COLORS],
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarChart({ buckets, currency }: { buckets: Record<string, number>; currency: string }) {
  const total = useMemo(() => {
    return Object.values(buckets).reduce((sum, val) => sum + val, 0);
  }, [buckets]);

  return (
    <div className="space-y-2">
      {Object.entries(buckets)
        .filter(([, value]) => value > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([bucket, value]) => {
          const percentage = total > 0 ? (value / total) * 100 : 0;
          return (
            <div 
              key={bucket}
              className="flex items-center gap-3 rounded-xl bg-content2/50 p-2"
            >
              <div 
                className="h-8 rounded-lg flex items-center justify-end px-2 transition-all duration-500 ease-out"
                style={{
                  width: `${Math.max(percentage, 15)}%`,
                  backgroundColor: AGING_BUCKET_COLORS[bucket as keyof typeof AGING_BUCKET_COLORS],
                  minWidth: "60px",
                }}
              >
                <span className="text-xs font-bold text-white">
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {AGING_BUCKET_LABELS[bucket]}
                </p>
                <p className="text-xs text-default-500">
                  {formatCompactCurrency(value, currency)}
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function PieChart({ buckets, currency }: { buckets: Record<string, number>; currency: string }) {
  const { segments, total } = useMemo(() => {
    const total = Object.values(buckets).reduce((sum, val) => sum + val, 0);
    let currentAngle = 0;
    
    const segments = Object.entries(buckets)
      .filter(([, value]) => value > 0)
      .map(([bucket, value]) => {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;
        
        return {
          bucket,
          value,
          percentage,
          startAngle,
          endAngle: currentAngle,
          color: AGING_BUCKET_COLORS[bucket as keyof typeof AGING_BUCKET_COLORS],
        };
      });
    
    return { segments, total };
  }, [buckets]);

  // Create SVG path for each segment
  const createSegmentPath = (startAngle: number, endAngle: number, radius: number = 50) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pie Chart SVG */}
      <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
        {segments.map((segment) => (
          <path
            key={segment.bucket}
            d={createSegmentPath(segment.startAngle, segment.endAngle)}
            fill={segment.color}
            stroke="white"
            strokeWidth="1"
          />
        ))}
        {/* Center hole for donut effect */}
        <circle cx="50" cy="50" r="30" fill="currentColor" className="text-content1" />
      </svg>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {segments.map((segment) => (
          <div key={segment.bucket} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {AGING_BUCKET_LABELS[segment.bucket]}
              </p>
              <p className="text-[10px] text-default-500">
                {segment.percentage.toFixed(1)}% · {formatCompactCurrency(segment.value, currency)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total */}
      <div className="text-center">
        <p className="text-xs text-default-500">Total</p>
        <p className="text-lg font-bold text-foreground">
          {formatCompactCurrency(total, currency)}
        </p>
      </div>
    </div>
  );
}

export function AgingChart({ data, currency, type = "bar", height = 200 }: AgingChartProps) {
  const buckets = useMemo(() => {
    if ("buckets" in data) {
      return data.buckets;
    }
    return data.totals;
  }, [data]);

  return (
    <div style={{ minHeight: height }}>
      {type === "bar" && <BarChart buckets={buckets} currency={currency} />}
      {type === "horizontal-bar" && <HorizontalBarChart buckets={buckets} currency={currency} />}
      {type === "pie" && <PieChart buckets={buckets} currency={currency} />}
    </div>
  );
}

export default AgingChart;
