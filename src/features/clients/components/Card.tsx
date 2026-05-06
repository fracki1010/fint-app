import React from "react";

export function Card({
  children,
  className = "",
  hover = false,
  padding = "normal",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "small" | "normal" | "large";
}) {
  const paddingStyles = {
    none: "",
    small: "p-3",
    normal: "p-4",
    large: "p-6",
  };

  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-content1/60 backdrop-blur-sm ${paddingStyles[padding]} ${
        hover
          ? "transition-all duration-200 hover:border-primary/20 hover:bg-content1/80 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
