import React from "react";
import { Activity } from "lucide-react";

export type Tone = "primary" | "success" | "danger" | "default";

export interface ActivityEntry {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  createdAt: string;
  icon: React.ComponentType<{ size?: number | string }>;
  tone: Tone;
}

function relativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD}d`;
  return new Date(date).toLocaleDateString();
}

function iconBg(tone: Tone): string {
  switch (tone) {
    case "primary":
      return "bg-primary/12 text-primary";
    case "success":
      return "bg-success/12 text-success";
    case "danger":
      return "bg-danger/12 text-danger";
    default:
      return "bg-content2 text-default-600";
  }
}

interface RecentActivityProps {
  entries: ActivityEntry[];
}

export default function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <section className="lg:col-span-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-kicker">Actividad Reciente</h2>
        <Activity className="text-primary" size={18} />
      </div>

      <div className="space-y-2">
        {entries.length > 0 ? (
          entries.map((entry) => {
            const Icon = entry.icon;
            return (
              <div
                key={entry.id}
                className="app-panel rounded-2xl p-3.5 transition-colors hover:bg-content2/70"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg(entry.tone)}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {entry.title}
                    </p>
                    <p className="truncate text-xs text-default-500">
                      {entry.subtitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {entry.amount}
                    </p>
                    <p className="text-[10px] text-default-400">
                      {relativeTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="app-panel rounded-2xl p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              Todavia no hay actividad operativa registrada
            </p>
            <p className="mt-2 text-xs text-default-500">
              Cuando empieces a vender y mover stock, el tablero se completa
              solo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
