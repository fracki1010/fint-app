import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRightLeft, CheckCircle2, Loader2, MapPin, Package, Plus, X } from "lucide-react";
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
import ProductSearchSelect, { type SearchableProduct } from "@features/locations/components/ProductSearchSelect";
import type { LocationKind } from "@features/locations/types";

type ActionKind = "create" | "load" | "transfer";

interface ResultState {
  title: string;
  lines: string[];
}

const KIND_LABELS: Record<LocationKind, string> = {
  deposito: "Depósito",
  sucursal: "Sucursal",
};

const inputClass =
  "w-full rounded-xl border border-divider bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none";

const submitClass =
  "w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50";

const errorMessage = (error: unknown, fallback: string) => {
  const data = (error as { response?: { data?: { error?: { message?: string }; message?: string } } })
    ?.response?.data;
  return data?.error?.message ?? data?.message ?? fallback;
};

// Full-height drawer: a side panel on desktop, a full-screen sheet on phones.
function ActionDrawer({
  title,
  busy,
  busyText,
  onClose,
  children,
}: {
  title: string;
  busy: boolean;
  busyText: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative flex h-full w-full flex-col bg-content1 shadow-2xl lg:max-w-md">
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

        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-content1/80" role="status">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">{busyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Confirmation shown once an action has been saved.
function ResultModal({ result, onClose }: { result: ResultState; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={result.title}>
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-sm space-y-4 rounded-2xl border border-divider bg-content1 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={28} className="text-success" />
          <h2 className="text-base font-bold text-foreground">{result.title}</h2>
        </div>
        <ul className="space-y-1 text-sm text-default-600">
          {result.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <button type="button" onClick={onClose} className={submitClass}>
          Entendido
        </button>
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
  const [result, setResult] = useState<ResultState | null>(null);
  const closeDrawer = () => setDrawer(null);

  const { data: locations = [], isLoading } = useLocations();

  const { products } = useProducts();
  const deposits = locations.filter((l) => l.kind === "deposito");
  const branches = locations.filter((l) => l.kind === "sucursal");

  // Create
  const createLocation = useCreateLocation();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<LocationKind>("sucursal");
  const [newAddress, setNewAddress] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    createLocation.mutate(
      { name, kind: newKind, address: newAddress.trim() },
      {
        onSuccess: () => {
          setResult({ title: "Lugar creado", lines: [`${name} (${KIND_LABELS[newKind]})`] });
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
    const quantity = Number(loadQuantity);
    loadStock.mutate(
      { depositId: loadDepositId, productId: loadProductId, quantity },
      {
        onSuccess: (data: { product: string; location: string; stock: number }) => {
          setResult({
            title: "Stock cargado",
            lines: [
              `${quantity} ${data.product} en ${data.location}`,
              `Stock del depósito ahora: ${data.stock}`,
            ],
          });
          setLoadQuantity("");
          closeDrawer();
        },
        onError: (error) =>
          showToast({ variant: "error", message: errorMessage(error, "No se pudo cargar el stock") }),
      },
    );
  };

  // Transfer: the product list and the quantity limit come from the origin deposit's real stock.
  const transfer = useTransferStock();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const { data: originStock = [], isLoading: originLoading } = useLocationStock(fromId || null);

  const availableProducts: SearchableProduct[] = useMemo(
    () =>
      originStock
        .filter((row) => row.stock > 0)
        .map((row) => ({
          _id: row.productId,
          name: row.name,
          available: row.stock,
          unitOfMeasure: row.unitOfMeasure,
        })),
    [originStock],
  );

  const availableForSelected = originStock.find((row) => row.productId === productId)?.stock ?? 0;
  const requested = Number(quantity);
  const transferError =
    !quantity || requested <= 0
      ? null
      : productId && requested > availableForSelected
        ? `No hay suficiente stock. Disponible en el origen: ${availableForSelected}.`
        : null;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    transfer.mutate(
      { fromLocationId: fromId, toLocationId: toId, productId, quantity: requested },
      {
        onSuccess: (data: {
          product: string;
          from: { location: string; stock: number };
          to: { location: string; stock: number };
        }) => {
          setResult({
            title: "Transferencia realizada",
            lines: [
              `${requested} ${data.product}`,
              `${data.from.location}: ${data.from.stock} (origen)`,
              `${data.to.location}: ${data.to.stock} (destino)`,
            ],
          });
          setQuantity("");
          setProductId("");
          closeDrawer();
        },
        onError: (error) =>
          showToast({ variant: "error", message: errorMessage(error, "No se pudo transferir el stock") }),
      },
    );
  };

  const loadProducts: SearchableProduct[] = products.map((p) => ({ _id: p._id, name: p.name, sku: p.sku }));

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

      {/* Actions: each opens a full-height drawer with its form */}
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
                onClick={() => navigate(`/locations/${loc._id}`)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                  "border-divider hover:border-primary/30 hover:bg-primary/5"
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

      {isAdmin && drawer === "create" && (
        <ActionDrawer title="Nuevo lugar" busy={createLocation.isPending} busyText="Creando lugar..." onClose={closeDrawer}>
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
            <button type="submit" disabled={createLocation.isPending || !newName.trim()} className={submitClass}>
              Crear lugar
            </button>
          </form>
        </ActionDrawer>
      )}

      {isAdmin && drawer === "load" && (
        <ActionDrawer title="Cargar stock en un depósito" busy={loadStock.isPending} busyText="Cargando stock..." onClose={closeDrawer}>
          <form onSubmit={handleLoad} className="space-y-3">
            <select className={inputClass} value={loadDepositId} onChange={(e) => setLoadDepositId(e.target.value)} required>
              <option value="">Depósito</option>
              {deposits.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
            <ProductSearchSelect
              products={loadProducts}
              value={loadProductId}
              onChange={setLoadProductId}
              placeholder="Buscar producto para cargar"
            />
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
              disabled={loadStock.isPending || !loadDepositId || !loadProductId || !(Number(loadQuantity) > 0)}
              className={submitClass}
            >
              Cargar stock
            </button>
          </form>
        </ActionDrawer>
      )}

      {isAdmin && drawer === "transfer" && (
        <ActionDrawer title="Transferir desde un depósito" busy={transfer.isPending} busyText="Transfiriendo stock..." onClose={closeDrawer}>
          <form onSubmit={handleTransfer} className="space-y-3">
            <select
              className={inputClass}
              value={fromId}
              onChange={(e) => {
                setFromId(e.target.value);
                setProductId("");
              }}
              required
            >
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

            {fromId && (
              <p className="text-xs text-default-500">
                {originLoading
                  ? "Calculando stock disponible..."
                  : availableProducts.length === 0
                    ? "Este depósito no tiene stock para transferir."
                    : `${availableProducts.length} productos con stock en el origen.`}
              </p>
            )}

            <ProductSearchSelect
              products={availableProducts}
              value={productId}
              onChange={setProductId}
              placeholder={fromId ? "Buscar producto con stock" : "Elegí primero el depósito de origen"}
              disabled={!fromId}
            />
            <div className="space-y-1">
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
              {transferError && <p className="text-xs font-semibold text-danger">{transferError}</p>}
            </div>
            <button
              type="submit"
              disabled={transfer.isPending || !fromId || !toId || !productId || !(requested > 0) || Boolean(transferError)}
              className={submitClass}
            >
              Transferir
            </button>
          </form>
        </ActionDrawer>
      )}

      {result && <ResultModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
}
