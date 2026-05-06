import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  summary?: ReactNode;
  className?: string;
}

export default function SettingsSection({
  title,
  description,
  icon,
  onClick,
  summary,
  className = "",
}: SettingsSectionProps) {
  return (
    <button
      className={`app-panel h-full w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01] ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-default-500">{description}</p>
          {summary && (
            <p className="mt-2 text-xs text-default-400">{summary}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          {icon}
        </div>
      </div>
    </button>
  );
}
