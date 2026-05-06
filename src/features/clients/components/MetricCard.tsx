import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./Card";

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  color = "primary",
}: {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  color?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const colorStyles = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    danger: "from-danger/20 to-danger/5 text-danger",
    info: "from-primary/20 to-primary/5 text-primary",
  };

  return (
    <Card className="group relative overflow-hidden" hover>
      <div
        className={`absolute top-0 right-0 p-4 opacity-50 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
      >
        <div className={`rounded-2xl bg-gradient-to-br ${colorStyles[color]} p-3`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-default-400">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {subValue && (
          <div className="mt-1 flex items-center gap-1.5">
            {trend && (
              <>
                {trend === "up" && <TrendingUp size={12} className="text-success" />}
                {trend === "down" && <TrendingDown size={12} className="text-danger" />}
                {trend === "neutral" && <div className="h-3 w-3 rounded-full bg-default-400" />}
              </>
            )}
            <p className="text-xs text-default-500">{subValue}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
