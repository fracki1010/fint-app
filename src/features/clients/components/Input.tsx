import React from "react";

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  required = false,
  disabled = false,
  className = "",
  icon: Icon,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-default-500">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </span>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-default-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`corp-input w-full ${Icon ? "pl-11" : "px-4"} py-3 text-sm transition-all duration-200 ${
            error ? "border-danger/50 focus:border-danger" : ""
          }`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </label>
  );
}
