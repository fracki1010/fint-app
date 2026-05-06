import React from "react";

export interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}

const iconBg: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  default: "bg-content2 text-default-600",
};

const valueColor: Record<string, string> = {
  danger: "text-danger",
};

export default function KpiCard({
  label,
  value,
  sub,
  icon,
  color = "primary",
}: KpiCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="stat-card-label">{label}</span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg[color] || iconBg.primary}`}
        >
          {icon}
        </div>
      </div>
      <div className={`mt-3 stat-card-value ${valueColor[color] || ""}`}>
        {value}
      </div>
      {sub && <p className="stat-card-sub">{sub}</p>}
    </div>
  );
}
