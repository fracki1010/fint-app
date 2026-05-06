import React from "react";

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  icon: Icon,
  ariaLabel,
  type = "button",
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
}) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
    secondary: "bg-content2 text-foreground hover:bg-content3 border border-white/10",
    danger: "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20",
    ghost: "bg-transparent text-default-600 hover:bg-content2",
    outline: "bg-transparent border border-white/15 text-foreground hover:bg-content2 hover:border-white/25",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-2xl",
    lg: "px-6 py-3 text-sm rounded-2xl",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}
