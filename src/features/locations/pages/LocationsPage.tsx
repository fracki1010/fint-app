import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRightLeft, MapPin, Package, Plus, X } from "lucide-react";
import { usePermissions } from "@features/auth/hooks/usePermissions";
import { useAppToast } from "@features/notifications/components/AppToast";
import { useProducts } from "@features/products/hooks/useProducts";
import {
  useCreateLocation,
  useLoadStock,
  useLocationStock,
  useLocations,
  useTransferStock,
} from "@features/locations/hooks/useLocations";
import type { LocationKind } from "@features/locations/types";

type ActionKind = "create" | "load" | "transfer";

const KIND_LABELS: Record<LocationKind, string> = {
  deposito: "Depósito",
  sucursal: "Sucursal",
};

const inputClass =
  "w-full rounded-xl border border-divider bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none";

const errorMessage = (error: unknown, fallback: string) => {
  const data = (error as { response?: { data?: { error?: { message?: string }; message?: string } } })
    ?.response?.data;
  return data?.error?.message ?? data?.message ?? fallback;
};

// Right-hand drawer on desktop, bottom sheet on phones. Closes on Escape and on the backdrop.
function ActionDrawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-divider bg-content1 shadow-2xl lg:h-full lg:max-h-none lg:max-w-md lg:rounded-none lg:rounded-l-3xl">
        <div className="flex items-center justify-between border-b border-divider px-5 py-4">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-default-400 transition hover:bg-content2 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const { can } = usePermissions();
  const isAdmin = can.manageSettings;

  const [drawer, setDrawer] = useState<ActionKind | null>(null);
  const closeDrawer = () => setDrawer(null);

  const { data: locations = [], isLoading } = useLocations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: stock = [], isLoading: stockLoading } = useLocationStock(selectedId);

  const { products } = useProducts();
  const deposits = locations.filter((l) => l.kind === "deposito");
  const branches = locations.filter((l) => l.kind === "sucursal");
  const selected = locations.find((l) => l._id === selectedId) ?? null;

  // Create
  const createLocation = useCreateLocation();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<LocationKind>("sucursal");
  const [newAddress, setNewAddress] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation.mutate(
      { name: newName.trim(), kind: newKind, address: newAddress.trim() },
      {
        onSuccess: () => {
          showToast({ variant: "success", message: "Lugar creado" });
          setNewName("");
          setNewAddress("");
          closeDrawer();
        },
        onError: (error) =>
          showToast({ variant: "error", message: errorMessage(error, "No se pudo crear el lugar") }),
      },
    );
  };

  // Load
  const loadStock = useLoadStock();
  const [loadDepositId, setLoadDepositId] = useState("");
  const [loadProductId, setLoadProductId] = useState("");
  const [loadQuantity, setLoadQuantity] = useState("");

  const handleLoad = (e: React.FormEvent) => {
    e.preventDefault();
    loadStock.mutate(
      { depositId: loadDepositId, productId: loadProductId, quantity: Number(loadQuantity) },
      {
        onSuccess: () => {
          showToast({ variant: "success", message: "Stock cargado en el depósito" });
          setLoadQuantity("");
          closeDrawer();
        },
        onError: (error) =>
          showToast({ variant: "error", message: errorMessage(error, "No se pudo cargar el stock") }),
      },
    );
  };

  // Transfer
  const transfer = useTransferStock();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    transfer.mutate(
      { fromLocationId: fromId, toLocationId: toId, productId, quantity: Number(quantity) },
      {
        onSuccess: () => {
          showToast({ variant: "success", message: "Transferencia realizada" });
          setQuantity("");
          closeDrawer();
        },
        onError: (error) =>
          showToast({ variant: "error", message: errorMessage(error, "No se pudo transferir el stock") }),
      },
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-default-200 text-default-500 transition hover:bg-default-100"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="section-kicker">Stock</p>
          <h1 className="text-xl font-bold text-foreground">Lugares</h1>
        </div>
      </div>

      {/* Actions: each opens a drawer with its form */}
      {isAdmin && (
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setDrawer("create")}
            className="flex items-center gap-3 rounded-2xl border border-default-200 bg-content1 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
          >
            <Plus size={18} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Crear lugar</span>
          </button>
          <button
            type="button"
            onClick={() => setDrawer("load")}
            className="flex items-center gap-3 rounded-2xl border border-default-200 bg-content1 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
          >
            <Package size={18} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Cargar stock</span>
          </button>
          <button
            type="button"
            onClick={() => setDrawer("transfer")}
            className="flex items-center gap-3 rounded-2xl border border-default-200 bg-content1 p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
          >
            <ArrowRightLeft size={18} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Transferir</span>
          </button>
        </div>
      )}

      {/* List */}
      <section className="rounded-2xl border border-default-200 bg-content1 p-5 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Depósitos y sucursales</h2>
        {isLoading ? (
          <p className="text-sm text-default-500">Cargando lugares...</p>
        ) : locations.length === 0 ? (
          <p className="text-sm text-default-500">Todavía no hay lugares cargados.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {locations.map((loc) => (
              <button
                key={loc._id}
                type="button"
                onClick={() => setSelectedId(loc._id)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  selectedId === loc._id
                    ? "border-primary bg-primary/5"
                    : "border-divider hover:border-primary/30"
                }`}
              >
                <MapPin size={18} className="mt-0.5 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{loc.name}</p>
                  <p className="text-xs text-default-500">
                    {KIND_LABELS[loc.kind]}
                    {loc.address ? ` · ${loc.address}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Stock of the selected place */}
      {selected && (
        <section className="rounded-2xl border border-default-200 bg-content1 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Stock en {selected.name}</h2>
          </div>
          {stockLoading ? (
            <p className="text-sm text-default-500">Cargando stock...</p>
          ) : stock.length === 0 ? (
            <p className="text-sm text-default-500">No hay stock en este lugar.</p>
          ) : (
            <ul className="divide-y divide-divider">
              {stock.map((row) => (
                <li key={row.productId} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-foreground">{row.name}</span>
                  <span className="font-semibold text-foreground">
                    {row.stock} {row.unitOfMeasure}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isAdmin && drawer === "create" && (
        <ActionDrawer title="Nuevo lugar" onClose={closeDrawer}>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              className={inputClass}
              placeholder="Nombre"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <select
              className={inputClass}
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as LocationKind)}
            >
              <option value="sucursal">Sucursal</option>
              <option value="deposito">Depósito</option>
            </select>
            <input
              className={inputClass}
              placeholder="Dirección (opcional)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
            <button
              type="submit"
              disabled={createLocation.isPending || !newName.trim()}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              Crear lugar
            </button>
          </form>
        </ActionDrawer>
      )}

      {isAdmin && drawer === "load" && (
        <ActionDrawer title="Cargar stock en un depósito" onClose={closeDrawer}>
          <form onSubmit={handleLoad} className="space-y-3">
            <select className={inputClass} value={loadDepositId} onChange={(e) => setLoadDepositId(e.target.value)} required>
              <option value="">Depósito</option>
              {deposits.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
            <select className={inputClass} value={loadProductId} onChange={(e) => setLoadProductId(e.target.value)} required>
              <option value="">Producto</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="any"
              placeholder="Cantidad recibida"
              value={loadQuantity}
              onChange={(e) => setLoadQuantity(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loadStock.isPending}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              Cargar stock
            </button>
          </form>
        </ActionDrawer>
      )}

      {isAdmin && drawer === "transfer" && (
        <ActionDrawer title="Transferir desde un depósito" onClose={closeDrawer}>
          <form onSubmit={handleTransfer} className="space-y-3">
            <select className={inputClass} value={fromId} onChange={(e) => setFromId(e.target.value)} required>
              <option value="">Depósito de origen</option>
              {deposits.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
            <select className={inputClass} value={toId} onChange={(e) => setToId(e.target.value)} required>
              <option value="">Sucursal de destino</option>
              {branches.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
            <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">Producto</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <input
              className={inputClass}
              type="number"
              min="0"
              step="any"
              placeholder="Cantidad"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={transfer.isPending}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              Transferir
            </button>
          </form>
        </ActionDrawer>
      )}
    </div>
  );
}
