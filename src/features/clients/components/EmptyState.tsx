import React from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-3xl bg-content2/50 p-6">
        <Icon size={48} className="text-default-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-default-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
