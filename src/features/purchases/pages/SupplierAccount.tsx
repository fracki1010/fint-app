import { useMemo, useState } from "react";
import {
  Search,
  Loader2,
  X,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useSuppliers } from "@features/suppliers/hooks/useSuppliers";
import { useMobileHeaderCompact } from "@shared/hooks/useMobileHeaderCompact";
import { Supplier } from "@shared/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SupplierAccountPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const isHeaderCompact = useMobileHeaderCompact();
  const { suppliers, loading } = useSuppliers();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.company?.toLowerCase().includes(q) ||
        s.taxId?.toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const openAccount = (supplier: Supplier) => {
    navigate(`/supplier-account/${supplier._id}`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={`sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all ${isHeaderCompact ? "px-4 py-3" : "px-4 py-5 lg:px-6"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={isHeaderCompact ? "hidden" : ""}>
            <p className="text-lg font-bold lg:text-xl">Cuenta Corriente</p>
            <p className="text-xs text-default-400">Proveedores</p>
          </div>
          <div
            className={`flex items-center gap-2 rounded-xl border border-white/10 bg-content2 px-3 py-2 ${isHeaderCompact ? "flex-1" : "w-full lg:max-w-sm"}`}
          >
            <Search className="shrink-0 text-default-400" size={15} />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
              placeholder="Buscar proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="text-default-400 hover:text-foreground"
                type="button"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-4 lg:px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-default-400" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-default-400">
            <CreditCard size={36} />
            <div>
              <p className="font-semibold">Sin proveedores</p>
              <p className="text-xs">
                {search ? "No hay coincidencias" : "Todavía no hay proveedores cargados"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((supplier) => (
              <button
                key={supplier._id}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/6 bg-content2 px-4 py-3.5 text-left transition hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
                type="button"
                onClick={() => openAccount(supplier)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {getInitials(supplier.company || supplier.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {supplier.company || supplier.name}
                  </p>
                  {supplier.company && (
                    <p className="truncate text-xs text-default-400">
                      {supplier.name}
                    </p>
                  )}
                  {supplier.taxId && (
                    <p className="text-[11px] text-default-400">
                      CUIT {supplier.taxId}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-default-400">Ver cuenta</span>
                  <CreditCard size={16} className="text-default-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
