import { useMemo, useState } from "react";
import {
  Search,
  Loader2,
  X,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useClients } from "@/hooks/useClients";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { Client } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ClientAccountPage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const isHeaderCompact = useMobileHeaderCompact();
  const { clients, loading } = useClients();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const openAccount = (client: Client) => {
    navigate(`/client-account/${client._id}`);
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
            <p className="text-xs text-default-400">Clientes</p>
          </div>
          <div
            className={`flex items-center gap-2 rounded-xl border border-white/10 bg-content2 px-3 py-2 ${isHeaderCompact ? "flex-1" : "w-full lg:max-w-sm"}`}
          >
            <Search className="shrink-0 text-default-400" size={15} />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
              placeholder="Buscar cliente..."
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
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-default-400" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-default-400">
            <CreditCard size={36} />
            <div>
              <p className="font-semibold">Sin clientes</p>
              <p className="text-xs">
                {search ? "No hay coincidencias" : "Todavía no hay clientes cargados"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((client) => (
              <button
                key={client._id}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/6 bg-content2 px-4 py-3.5 text-left transition hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
                type="button"
                onClick={() => openAccount(client)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {getInitials(client.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{client.name}</p>
                  {client.email && (
                    <p className="truncate text-xs text-default-400">
                      {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="text-[11px] text-default-400">{client.phone}</p>
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
