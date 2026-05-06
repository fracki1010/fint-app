const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  Confirmada: { dot: "bg-primary", bg: "bg-primary/10", text: "text-primary" },
  Cancelada:  { dot: "bg-danger",  bg: "bg-danger/10",  text: "text-danger"  },
  Pendiente:  { dot: "bg-default-400", bg: "bg-default/20", text: "text-default-600" },
  Pagado:     { dot: "bg-success", bg: "bg-success/10", text: "text-success" },
  Parcial:    { dot: "bg-warning", bg: "bg-warning/10", text: "text-warning" },
  Entregada:  { dot: "bg-success", bg: "bg-success/10", text: "text-success" },
  Preparando: { dot: "bg-primary", bg: "bg-primary/10", text: "text-primary" },
};

export function StatusBadge({ label }: { label: string }) {
  const style = STATUS_STYLES[label] ?? STATUS_STYLES.Pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}
