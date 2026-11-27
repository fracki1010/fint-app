import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Package, ArrowRightLeft } from "lucide-react";
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

export default function LocationsPage() {
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const { can } = usePermissions();
  const isAdmin = can.manageSettings;

  const { data: locations = [], isLoading } = useLocations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: stock = [], isLoading: stockLoading } = useLocationStock(selectedId);

  const createLocation = useCreateLocation();
  const transfer = useTransferStock();
  const loadStock = useLoadStock();
  const [loadDepositId, setLoadDepositId] = useState("");
  const [loadProductId, setLoadProductId] = useState("");
  const [loadQuantity, setLoadQuantity] = useState("");

  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<LocationKind>("sucursal");
  const [newAddress, setNewAddress] = useState("");

  const { products } = useProducts();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const deposits = locations.filter((l) => l.kind === "deposito");
  const branches = locations.filter((l) => l.kind === "sucursal");
  const selected = locations.find((l) => l._id === selectedId) ?? null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createLocation.mutate(
      { name: newName.trim(), kind: newKind, address: newAddress.trim() },
      {
        onSuccess: () => {
          showToast({ variant: "success", message: "Lugar creado" });
          setNewName("");
          setNewAddress("");
        },
        onError: (error) =>
          showToast({ variant: "error", message: errorMessage(error, "No se pudo crear el lugar") }),
      },
    );
  };

  const handleLoad = (e: React.FormEvent) => {
    e.preventDefault();
    loadStock.mutate(
      { depositId: loadDepositId, productId: loadProductId, quantity: Number(loadQuantity) },
      {
        onSuccess: () => {
          showToast({ variant: "success", message: "Stock cargado en el depósito" });
          setLoadQuantity("");
        },
        onError: (error) =>
          showToast({ variant: "error", message: errorMessage(error, "No se pudo cargar el stock") }),
      },
    );
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    transfer.mutate(
      { fromLocationId: fromId, toLocationId: toId, productId, quantity: Number(quantity) },
      {
        onSuccess: () => {
          showToast({ variant: "success", message: "Transferencia realizada" });
          setQuantity("");
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

      {isAdmin && (
        <>
          {/* Create location */}
          <section className="rounded-2xl border border-default-200 bg-content1 p-5">
            <h2 className="mb-3 text-sm font-bold text-foreground">Nuevo lugar</h2>
            <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-3">
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
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:col-span-3 sm:justify-self-end"
              >
                Crear lugar
              </button>
            </form>
          </section>

          {/* Owner loads stock received into a deposit */}
          <section className="rounded-2xl border border-default-200 bg-content1 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">Cargar stock en un depósito</h2>
            </div>
            <form onSubmit={handleLoad} className="grid gap-3 sm:grid-cols-2">
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
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:justify-self-end"
              >
                Cargar stock
              </button>
            </form>
          </section>

          {/* Transfer */}
          <section className="rounded-2xl border border-default-200 bg-content1 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">Transferir desde un depósito</h2>
            </div>
            <form onSubmit={handleTransfer} className="grid gap-3 sm:grid-cols-2">
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
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 sm:col-span-2 sm:justify-self-end"
              >
                Transferir
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
