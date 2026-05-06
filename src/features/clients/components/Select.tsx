import React from "react";

export function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ComponentType<{ size?: number | string }> }[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-default-500">{label}</span>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="corp-input w-full appearance-none px-4 py-3 pr-10 text-sm bg-content1/70 cursor-pointer hover:bg-content1/90 transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
