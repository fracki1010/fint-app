import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Loader2,
  User,
  CheckCircle2,
  Printer,
  ScanBarcode,
  Search as SearchIcon,
  DollarSign,
} from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useProductSearch, useProductLookupManual } from "@/hooks/useProductLookup";
import { useGenericClient } from "@/hooks/useGenericClient";
import { useQuickSale } from "@/hooks/useQuickSale";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useSettings } from "@/hooks/useSettings";
import { useClients } from "@/hooks/useClients";
import { useAppToast } from "@/components/AppToast";
import { getErrorMessage } from "@/utils/errors";
import { formatCurrency } from "@/utils/currency";
import { printTicket } from "@/utils/ticket";
import BarcodeScanner from "@/components/scanner/BarcodeScanner";
import { Client, PaymentMethod, Product } from "@/types";

export default function QuickSalePage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { showToast } = useAppToast();
  const { settings } = useSettings();
  const { genericClient } = useGenericClient();
  const { clients } = useClients();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (genericClient && !selectedClient) {
      setSelectedClient(genericClient);
    }
  }, [genericClient, selectedClient]);

  const clientId = selectedClient?._id || genericClient?._id || "";

  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
    itemCount,
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    setCashReceived,
    change,
    currency,
    stockErrors,
    createOrder,
    isCreating,
    canFinalize,
    orderResult,
  } = useQuickSale({ clientId });

  const { searchProducts } = useProductLookupManual();
  const { products: searchResults, loading: searching } = useProductSearch(
    searchQuery.length >= 2 ? searchQuery : null,
  );

  const handleScan = useCallback(
    async (code: string) => {
      const findResults = await searchProducts(code);
      const product = findResults.find(
        (p) =>
          p.barcode?.toUpperCase() === code.toUpperCase() ||
          p.sku?.toUpperCase() === code.toUpperCase(),
      ) || (findResults.length === 1 ? findResults[0] : null);
      if (product) {
        const stock = product.stock ?? 0;
        if (stock <= 0) {
          showToast({ variant: "error", message: `${product.name} sin stock` });
          return;
        }
        const added = addItem(product);
        if (added) {
          showToast({ variant: "success", message: `${product.name} agregado` });
        } else {
          showToast({ variant: "warning", message: `Stock insuficiente para ${product.name}` });
        }
      } else {
        showToast({ variant: "warning", message: `Producto no encontrado: "${code}"` });
      }
    },
    [searchProducts, addItem, showToast],
  );

  const {
    state: scannerState,
    error: scannerError,
    videoRef,
    startCameraScanner,
    stopCameraScanner,
    toggleCameraScanner,
  } = useBarcodeScanner({
    onScan: handleScan,
    onError: (err) => showToast({ variant: "error", message: err.message }),
    isMobile: !isDesktop,
  });

  useEffect(() => {
    if (orderResult) {
      setShowSuccess(true);
      const name = settings?.storeName || settings?.admin?.company?.name || "MI NEGOCIO";
      printTicket({
        order: orderResult,
        settings: {
          businessName: name,
          address: settings?.address,
          phone: settings?.phone,
          taxId: settings?.taxId,
        },
        currency,
      });
    }
  }, [orderResult, settings, currency]);

  const handleFinalize = async () => {
    if (!canFinalize) return;
    try {
      await createOrder();
      showToast({ variant: "success", message: "Venta registrada e impresa" });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo registrar la venta"),
      });
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.phone || "").includes(clientSearch),
  );

  useEffect(() => {
    if (!isDesktop && showScanner) startCameraScanner();
    return () => stopCameraScanner();
  }, [isDesktop, showScanner, startCameraScanner, stopCameraScanner]);

  const addProductToCart = (product: Product) => {
    const stock = product.stock ?? 0;
    if (stock <= 0) {
      showToast({ variant: "error", message: `${product.name} sin stock` });
      return;
    }
    const added = addItem(product);
    if (added) {
      setSearchQuery("");
      setSearchFocused(false);
      showToast({ variant: "success", message: `${product.name} agregado` });
    } else {
      const currentQty = items
        .filter((i) => i.product._id === product._id)
        .reduce((s, i) => s + i.quantity, 0);
      showToast({
        variant: "warning",
        message: `Stock insuficiente para ${product.name}. Disponible: ${stock}, en carrito: ${currentQty}`,
      });
    }
  };

  const newSale = () => {
    clearCart();
    setShowSuccess(false);
    setSelectedClient(genericClient);
  };

  const showDropdown = searchFocused && searchQuery.length >= 2;

  if (showSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 size={44} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Venta registrada</h1>
        <p className="mt-2 text-sm text-default-500">
          {itemCount} producto(s) - {formatCurrency(total, currency)}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25"
            onClick={newSale}
          >
            Nueva venta
          </button>
          <button
            className="rounded-2xl border border-divider px-6 py-3 text-sm font-semibold text-default-600"
            onClick={() => navigate("/")}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-divider/60 bg-background/80 px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          {isDesktop && (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl text-default-500 hover:text-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">Venta Rápida</p>
            <h1 className="text-base font-bold text-foreground">
              {itemCount > 0 ? `${itemCount} producto(s)` : "Escaneá productos"}
            </h1>
          </div>
        </div>
        <button
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary"
          onClick={() => setShowScanner(true)}
        >
          <ScanBarcode size={15} />
          {isDesktop ? "Escanear" : ""}
        </button>
      </header>

      {/* Search input with dropdown */}
      <div className="relative border-b border-divider/60 px-4 py-3">
        <div className="relative">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
          <input
            ref={searchRef}
            className="corp-input w-full rounded-2xl py-3 pl-9 pr-4 text-sm text-foreground placeholder:text-default-400"
            placeholder="Buscá producto por nombre, código o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            autoComplete="off"
          />
        </div>

        {showDropdown && (
          <div className="absolute left-4 right-4 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-divider/70 bg-content1 shadow-xl">
            {searching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="animate-spin text-default-400" size={20} />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-default-400">
                No se encontraron productos
              </div>
            ) : (
              searchResults.map((p) => {
                const available = p.stock ?? 0;
                const inCart = items
                  .filter((i) => i.product._id === p._id)
                  .reduce((s, i) => s + i.quantity, 0);
                const outOfStock = available <= 0;
                const lowStock = available > 0 && available <= (p.minStock || 5);
                const cantAddMore = inCart >= available;
                return (
                  <button
                    key={p._id}
                    className={`flex w-full items-center justify-between border-b border-divider/60 px-4 py-3 text-left transition last:border-0 ${
                      outOfStock || cantAddMore
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-content2/60"
                    }`}
                    disabled={outOfStock || cantAddMore}
                    onMouseDown={(e) => {
                      if (!outOfStock && !cantAddMore) addProductToCart(p);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-[11px] text-default-400">
                        {p.barcode || p.sku || "Sin código"}
                      </p>
                      <p className={`mt-0.5 text-[11px] font-semibold ${
                        outOfStock ? "text-danger" : lowStock ? "text-warning" : "text-success"
                      }`}>
                        {outOfStock ? "Sin stock" : `${available} en stock`}
                        {inCart > 0 && ` · ${inCart} en carrito`}
                      </p>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <p className="text-sm font-bold text-primary">{formatCurrency(p.price, currency)}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Client selector */}
      <div className="border-b border-divider/60 px-4 py-3">
        <button
          className="flex w-full items-center gap-2 text-left"
          onClick={() => setShowClientSearch(!showClientSearch)}
        >
          <User size={15} className="shrink-0 text-default-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-default-500">Cliente</p>
            <p className="truncate text-sm font-semibold text-foreground">
              {selectedClient?.name || "Consumidor Final"}
            </p>
          </div>
          <span className="text-xs text-primary">Cambiar</span>
        </button>

        {showClientSearch && (
          <div className="mt-3">
            <div className="relative">
              <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
              <input
                className="corp-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                autoFocus
              />
            </div>
            {clientSearch && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-divider/70 bg-content1 shadow-lg">
                {filteredClients
                  .filter((c) => c.name !== "Consumidor Final" || c.phone !== "0000000000")
                  .slice(0, 10)
                  .map((c) => (
                    <button
                      key={c._id}
                      className="w-full border-b border-divider/60 px-4 py-2.5 text-left text-sm hover:bg-content2/60 last:border-0"
                      onClick={() => {
                        setSelectedClient(c);
                        setShowClientSearch(false);
                        setClientSearch("");
                      }}
                    >
                      <span className="font-semibold text-foreground">{c.name}</span>
                      <span className="ml-2 text-xs text-default-400">{c.phone}</span>
                    </button>
                  ))}
                <button
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-content2/60"
                  onClick={() => {
                    setSelectedClient(genericClient);
                    setShowClientSearch(false);
                    setClientSearch("");
                  }}
                >
                  Usar Consumidor Final
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-default-400">
            <ShoppingCart size={40} className="mb-3" />
            <p className="text-sm font-semibold text-foreground">Carrito vacío</p>
            <p className="mt-1 text-xs">Buscá productos arriba para comenzar</p>
          </div>
        ) : (
          <>
            {stockErrors.length > 0 && (
              <div className="mb-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3">
                <p className="text-xs font-bold text-danger">
                  Stock insuficiente en {stockErrors.length} producto(s)
                </p>
                {stockErrors.map((e) => (
                  <p key={e.productId} className="mt-1 text-xs text-danger/80">
                    {e.productName}: pediste {e.requested}, disponible {e.available}
                  </p>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {items.map((item) => {
                const available = item.product.stock ?? 0;
                const error = stockErrors.find((e) => e.productId === item.product._id);
                const lowStock = available > 0 && available <= (item.product.minStock || 5);
                const isWarning = error || (lowStock && item.quantity >= available * 0.8);
                return (
                  <div
                    key={item.product._id}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${
                      error
                        ? "border-danger/40 bg-danger/8"
                        : isWarning
                          ? "border-warning/30 bg-warning/8"
                          : "border-divider/60 bg-content2/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{item.product.name}</p>
                      <p className="text-xs text-default-400">{formatCurrency(item.product.price, currency)} c/u</p>
                      <p className={`mt-0.5 text-[11px] font-semibold ${
                        error ? "text-danger" : lowStock ? "text-warning" : "text-default-400"
                      }`}>
                        Stock: {available}
                        {error && ` — ¡solo hay ${error.available}!`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-content2 text-default-500 hover:text-danger"
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className={`flex h-7 w-8 items-center justify-center text-sm font-bold ${
                        error ? "text-danger" : "text-foreground"
                      }`}>
                        {item.quantity}
                      </span>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-content2 text-default-500 hover:text-primary disabled:opacity-30"
                        disabled={item.quantity >= available}
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(item.product.price * item.quantity, currency)}
                      </p>
                    </div>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-default-400 hover:text-danger"
                      onClick={() => removeItem(item.product._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Payment + total */}
      <div className="sticky bottom-0 border-t border-divider/60 bg-background/95 px-4 py-4 backdrop-blur-lg">
        <div className="mb-3 flex gap-2">
          {(["cash", "card", "transfer"] as PaymentMethod[]).map((method) => (
            <button
              key={method}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                paymentMethod === method
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-content2/70 text-default-500"
              }`}
              onClick={() => setPaymentMethod(method)}
            >
              {method === "cash" && <DollarSign size={14} />}
              {method === "card" && "💳"}
              {method === "transfer" && "📱"}
              {method === "cash" ? "Efectivo" : method === "card" ? "Tarjeta" : "Transferencia"}
            </button>
          ))}
        </div>

        {paymentMethod === "cash" && (
          <div className="mb-3 flex items-center gap-3">
            <input
              className="corp-input flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold"
              placeholder="Efectivo recibido..."
              type="number"
              min="0"
              step="0.01"
              value={cashReceived || ""}
              onChange={(e) => setCashReceived(Number(e.target.value))}
            />
            {change > 0 && (
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-default-400">Cambio</p>
                <p className="text-sm font-bold text-success">{formatCurrency(change, currency)}</p>
              </div>
            )}
          </div>
        )}

        <div className="mb-3 space-y-1 text-sm">
          <div className="flex items-center justify-between text-default-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="flex items-center justify-between text-default-500">
            <span>IVA {settings?.taxRate || 0}%</span>
            <span>{formatCurrency(tax, currency)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-divider/60 pt-2 text-base font-bold text-foreground">
            <span>TOTAL</span>
            <span className="text-primary">{formatCurrency(total, currency)}</span>
          </div>
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:opacity-40"
          disabled={!canFinalize || isCreating}
          onClick={handleFinalize}
        >
          {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
          {isCreating ? "Registrando..." : `Cobrar ${formatCurrency(total, currency)}`}
        </button>
      </div>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => { setShowScanner(false); stopCameraScanner(); }}
        onScan={() => {}}
        videoRef={videoRef}
        state={scannerState}
        error={scannerError}
        onToggle={toggleCameraScanner}
      />
    </div>
  );
}
