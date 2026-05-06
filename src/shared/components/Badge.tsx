export function Badge({
  children,
  variant = "default",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}) {
  const variantStyles = {
    default: "bg-content2 text-default-600 border-white/10",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-primary/10 text-primary border-primary/20",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
}
