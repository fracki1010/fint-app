import React, { KeyboardEvent, ChangeEvent } from "react";
import { Search } from "lucide-react";

interface BarcodeInputProps {
  onScan: (code: string) => void;
  isActive: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function BarcodeInput({
  onScan,
  isActive,
  inputRef,
}: BarcodeInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length >= 2) {
      onScan(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = (e.target as HTMLInputElement).value.trim();
      if (value.length >= 2) {
        onScan(value);
        (e.target as HTMLInputElement).value = "";
      }
    }
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <Search size={16} className="text-default-400" />
      </div>
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        className="corp-input w-full rounded-2xl py-3 pl-9 pr-4 text-sm text-foreground placeholder:text-default-400"
        placeholder={
          isActive
            ? "Escanéa o escribí código/nombre..."
            : "Escribí código, SKU o nombre..."
        }
        autoComplete="off"
        autoFocus={isActive}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {isActive && (
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
        </div>
      )}
    </div>
  );
}
