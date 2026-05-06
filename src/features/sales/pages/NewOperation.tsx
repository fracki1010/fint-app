import { useState, useMemo, useRef } from "react";
import {
  ArrowLeft,
  User,
  Search,
  UserPlus,
  Package,
  FileText,
  ShoppingCart,
  Loader2,
  Plus,
  Minus,
  Receipt,
  ScanBarcode,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useClients } from "@features/clients/hooks/useClients";
import { useProducts } from "@features/products/hooks/useProducts";
import { useOrders } from "@features/sales/hooks/useOrders";
import { useSettings } from "@features/settings/hooks/useSettings";
import { useProductLookupManual } from "@features/products/hooks/useProductLookup";
import { useBarcodeScanner } from "@shared/hooks/useBarcodeScanner";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { Client, Product, Presentation } from "@shared/types";
import { useAppToast } from "@features/notifications/components/AppToast";
import BarcodeScanner from "@shared/components/scanner/BarcodeScanner";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getErrorMessage } from "@shared/utils/errors";
import {
  canAddProductToCart,
  getAvailableStock,
  validateCartStock,
} from "@features/products/utils/stock";

interface CartItem {
  product: Product;
  presentation?: Presentation;
  quantity: number;
}

export default function NewOperationPage() {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { products } = useProducts();
  const { createOrder, isCreating } = useOrders();
  const { settings } = useSettings();
  const { showToast } = useAppToast();

  const isDesktop = useIsDesktop();
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const { searchProducts } = useProductLookupManual();
  const scanHandlerRef = useRef<(code: string) => void>(() => {});

  const {
    state: scannerState,
    error: scannerError,
    setVideoContainer,
    startCameraScanner,
    stopCameraScanner,
    toggleCameraScanner,
    zoomSupported,
    zoomRange,
    zoomValue,
    applyZoom,
  } = useBarcodeScanner({
    onScan: (code) => scanHandlerRef.current(code),
    onError: (err) => showToast({ variant: "error", message: err.message }),
  });

  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];

    return clients.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.phone || "").includes(clientSearch),
    );
  }, [clients, clientSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];

    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(productSearch.toLowerCase()),
    );
  }, [products, productSearch]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + (item.product.price ?? 0) * item.quantity,
        0,
      ),
    [cart],
  );

  const currency = settings?.currency || "USD";
  const taxRate = (settings?.taxRate || 0) / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const addToCart = (product: Product, presentation?: Presentation) => {
    if (!canAddProductToCart(cart, product, presentation)) {
      showToast({
        variant: "warning",
        message: `Stock insuficiente para ${product.name}${presentation ? ` (${presentation.name})` : ""}.`,
      });

      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product._id === product._id &&
          item.presentation?._id === presentation?._id,
      );

      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id &&
          item.presentation?._id === presentation?._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prev, { product, presentation, quantity: 1 }];
    });
    setProductSearch("");
  };

  const updateQuantity = (productId: string, delta: number, presentationId?: string) => {
    setCart((prev) => {
      const next = prev
        .map((item) => {
          if (item.product._id !== productId || item.presentation?._id !== presentationId) return item;

          const available = getAvailableStock(item.product, item.presentation);
          const proposed = item.quantity + delta;
          const quantity = Math.max(0, Math.min(proposed, available));

          if (delta > 0 && proposed > available) {
            showToast({
              variant: "warning",
              message: `No puedes superar el stock disponible de ${item.product.name}${item.presentation ? ` (${item.presentation.name})` : ""}.`,
            });
          }

          return { ...item, quantity };
        })
        .filter((item) => item.quantity > 0);

      return next;
    });
  };

  const handleRegisterSale = async () => {
    if (!selectedClient) {
      showToast({
        variant: "warning",
        message: "Por favor selecciona un cliente.",
      });

      return;
    }

    if (cart.length === 0) {
      showToast({
        variant: "warning",
        message: "El carrito esta vacio.",
      });

      return;
    }

    const invalidStockItems = validateCartStock(cart);

    if (invalidStockItems.length > 0) {
      const first = invalidStockItems[0];

      showToast({
        variant: "error",
        message: `Stock invalido en ${first.productName}: pediste ${first.requested}, disponible ${first.available}.`,
      });

      return;
    }

    try {
      await createOrder({
        client: selectedClient._id,
        items: cart.map((item) => ({
          product: item.product.name,
          productId: item.product._id,
          quantity: item.quantity,
          price: item.presentation?.price ?? item.product.price,
          ...(item.presentation ? { presentationId: item.presentation._id } : {}),
        })),
        totalAmount: total,
        status: settings?.defaultSalesStatus || "Pendiente",
        salesStatus: settings?.defaultSalesStatus || "Pendiente",
        paymentStatus: settings?.defaultPaymentStatus || "Pendiente",
        deliveryStatus: settings?.defaultDeliveryStatus || "Pendiente",
        notes: notes || undefined,
        source: "Dashboard",
      });
      showToast({
        variant: "success",
        message: "Venta registrada correctamente.",
      });
      navigate("/");
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No pudimos registrar la venta."),
      });
    }
  };

  scanHandlerRef.current = async (code: string) => {
    const results = await searchProducts(code);
    const exact = results.find(
      (p) =>
        p.barcode?.toUpperCase() === code.toUpperCase() ||
        p.sku?.toUpperCase() === code.toUpperCase(),
    );
    const product = exact || results[0];
    if (product) {
      const presentation = product.matchedPresentation;
      addToCart(product, presentation);
      showToast({ variant: "success", message: `${product.name}${presentation ? ` (${presentation.name})` : ""} agregado` });
      setShowScanner(false);
    } else {
      showToast({ variant: "warning", message: `Producto no encontrado: "${code}"` });
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-28 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar sticky top-0 z-10 px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              className="app-panel-soft flex h-11 w-11 items-center justify-center rounded-2xl text-default-600 transition hover:text-foreground"
              to="/"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="section-kicker">Operacion Comercial</div>
              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
                Nueva Venta
              </h1>
              <p className="mt-2 text-sm text-default-500">
                Construye el pedido, asocia cliente y confirma el importe.
              </p>
            </div>
          </div>

          <div className="app-panel-soft flex h-11 w-11 items-center justify-center rounded-2xl text-primary">
            <Receipt size={20} />
          </div>
        </div>
      </header>

      <div className="space-y-5 px-4 py-5 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:px-0">
        <section className="app-panel rounded-[28px] p-5 lg:col-span-4 lg:self-start">
          <div className="mb-4 flex items-center gap-3 border-b border-divider/60 pb-3">
            <User className="text-primary" size={20} strokeWidth={2.4} />
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              Cliente
            </h2>
          </div>

          {!selectedClient ? (
            <div className="relative">
              <label
                className="section-kicker block pb-2"
                htmlFor="client-search"
              >
                Seleccionar
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
                  size={18}
                />
                <input
                  className="corp-input w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-foreground"
                  id="client-search"
                  placeholder="Buscar por nombre o telefono..."
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>

              {filteredClients.length > 0 && (
                <div className="absolute z-[70] mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-divider/70 bg-content1 shadow-xl">
                  {filteredClients.map((c) => (
                    <button
                      key={c._id}
                      className="w-full border-b border-divider/60 px-4 py-3 text-left transition hover:bg-content2/60 last:border-0"
                      onClick={() => {
                        setSelectedClient(c);
                        setClientSearch("");
                      }}
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {c.name}
                      </span>
                      <span className="block pt-1 text-xs text-default-400">
                        {c.phone}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[24px] border border-primary/20 bg-primary/8 p-4">
              <p className="section-kicker">Cliente Asignado</p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {selectedClient.name}
              </p>
              <p className="mt-1 text-sm text-default-500">
                {selectedClient.phone}
              </p>
              <button
                className="mt-3 text-xs font-semibold text-danger"
                onClick={() => setSelectedClient(null)}
              >
                Cambiar cliente
              </button>
            </div>
          )}

          <Link
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
            to="/clients"
          >
            <UserPlus size={18} strokeWidth={2.4} />
            Nuevo Cliente
          </Link>
        </section>

        <section className="app-panel rounded-[28px] p-5 lg:col-span-8 lg:row-span-2">
          <div className="mb-4 flex items-center gap-3 border-b border-divider/60 pb-3">
            <Package className="text-primary" size={20} strokeWidth={2.4} />
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              Productos
            </h2>
          </div>

          <div className="relative">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
                  size={18}
                />
                <input
                  className="corp-input w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-foreground"
                  placeholder="Buscar producto..."
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              <button
                className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition hover:bg-primary/20"
                onClick={() => {
                  setShowScanner(true);
                  if (!isDesktop) setTimeout(() => startCameraScanner(), 100);
                }}
                type="button"
              >
                <ScanBarcode size={20} />
              </button>
            </div>

            {filteredProducts.length > 0 && (
              <div className="absolute z-[70] mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-divider/70 bg-content1 shadow-xl">
                {filteredProducts.map((p) => {
                  const activePresentations = (p.presentations || []).filter((pr) => pr.isActive !== false);
                  const singlePresentation = activePresentations.length === 1 ? activePresentations[0] : null;
                  const hasMultiplePresentations = activePresentations.length > 1;

                  return (
                    <div key={p._id} className="border-b border-divider/60 last:border-0">
                      <button
                        className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                          hasMultiplePresentations
                            ? ""
                            : getAvailableStock(p, singlePresentation ?? undefined) <= 0
                              ? "cursor-not-allowed opacity-60"
                              : "hover:bg-content2/60"
                        }`}
                        disabled={!hasMultiplePresentations && getAvailableStock(p, singlePresentation ?? undefined) <= 0}
                        onClick={() => {
                          if (hasMultiplePresentations) return;
                          if (singlePresentation) addToCart(p, singlePresentation);
                          else addToCart(p);
                        }}
                      >
                        <div>
                          <span className="text-sm font-semibold text-foreground">
                            {p.name}
                          </span>
                          <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-default-400">
                            SKU {p.sku || "No definido"}
                          </p>
                          {!hasMultiplePresentations && (
                            <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-default-400">
                              Stock {getAvailableStock(p, singlePresentation ?? undefined)}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {formatCompactCurrency(singlePresentation ? singlePresentation.price : (p.price ?? 0), currency)}
                        </span>
                      </button>

                      {hasMultiplePresentations && (
                        <div className="space-y-1 px-4 pb-3">
                          {activePresentations.map((pr) => {
                            const prAvailable = getAvailableStock(p, pr);
                            const prCantAdd = prAvailable <= 0;

                            return (
                              <button
                                key={pr._id}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                                  prCantAdd ? "cursor-not-allowed opacity-50" : "hover:bg-content2/60 bg-content2/30"
                                }`}
                                disabled={prCantAdd}
                                onClick={() => {
                                  if (!prCantAdd) addToCart(p, pr);
                                }}
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-foreground">{pr.name}</span>
                                  <span className="ml-2 text-default-400">
                                    {pr.equivalentQty} {pr.unitOfMeasure || p.unitOfMeasure || "u."}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-semibold ${prAvailable <= 0 ? "text-danger" : "text-success"}`}>
                                    {prAvailable <= 0 ? "Sin stock" : `${prAvailable} disp.`}
                                  </span>
                                  <span className="text-sm font-bold text-primary">{formatCompactCurrency(pr.price, currency)}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-divider/70">
            <div className="grid grid-cols-[3fr_1.4fr_1.5fr] bg-content2/60 p-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-default-500">
              <span>Producto</span>
              <span className="text-center">Cant.</span>
              <span className="text-right">Total</span>
            </div>

            <div className="divide-y divide-divider/70">
              {cart.length > 0 ? (
                cart.map((item) => {
                  const itemPrice = item.presentation?.price ?? item.product.price;
                  return (
                    <div
                      key={`${item.product._id}-${item.presentation?._id || "base"}`}
                      className="grid grid-cols-[3fr_1.4fr_1.5fr] items-center gap-2 p-3"
                    >
                      <div>
                        <h4 className="text-[13px] font-semibold text-foreground">
                          {item.product.name}
                          {item.presentation && (
                            <span className="ml-1 text-[10px] font-normal text-default-400">({item.presentation.name})</span>
                          )}
                        </h4>
                        <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-default-400">
                          SKU {item.product.sku || "N/A"}
                        </p>
                        <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-default-400">
                          Disponible {getAvailableStock(item.product, item.presentation)}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-1 rounded-xl bg-content2/70 py-1 border border-divider/60">
                        <button
                          className="text-default-400 hover:text-danger"
                          onClick={() => updateQuantity(item.product._id, -1, item.presentation?._id)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-[13px] font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="text-default-400 hover:text-primary"
                          onClick={() => updateQuantity(item.product._id, 1, item.presentation?._id)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right text-[14px] font-semibold text-foreground">
                        {formatCompactCurrency(
                          itemPrice * item.quantity,
                          currency,
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-sm italic text-default-400">
                  No hay productos agregados
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="app-panel rounded-[28px] p-5 lg:col-span-4 lg:self-start">
          <label
            className="section-kicker block pb-3"
            htmlFor="operation-notes"
          >
            Notas Comerciales
          </label>
          <textarea
            className="corp-input min-h-28 w-full resize-none rounded-2xl p-4 text-sm text-foreground"
            id="operation-notes"
            placeholder="Añadir observaciones de entrega, garantia o acuerdo comercial..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        <section className="app-panel rounded-[28px] p-5 lg:col-span-4 lg:self-start lg:sticky lg:top-24">
          <div className="flex items-center justify-between text-sm">
            <span className="text-default-500">Subtotal</span>
            <span className="font-medium text-foreground">
              {formatCompactCurrency(subtotal, currency)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-default-500">
              IVA {settings?.taxRate ?? 0}%
            </span>
            <span className="font-medium text-foreground">
              {formatCompactCurrency(tax, currency)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-divider/70 pt-4">
            <span className="text-base font-semibold text-foreground">
              Total a cobrar
            </span>
            <span className="text-2xl font-semibold tracking-[-0.04em] text-primary">
              {formatCompactCurrency(total, currency)}
            </span>
          </div>

          <div className="mt-5 hidden gap-3 lg:flex">
            <button className="app-panel-soft flex w-28 flex-col items-center justify-center gap-1 rounded-2xl text-default-500">
              <FileText size={18} />
              <span className="text-[10px] font-semibold">Borrador</span>
            </button>
            <button
              className="flex-1 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_34px_rgba(217,119,6,0.35)] transition hover:opacity-90 disabled:opacity-50"
              disabled={isCreating || cart.length === 0 || !selectedClient}
              onClick={handleRegisterSale}
            >
              <span className="flex items-center justify-center gap-2">
                {isCreating ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <ShoppingCart size={20} strokeWidth={2.4} />
                )}
                {isCreating ? "Registrando..." : "Registrar Venta"}
              </span>
            </button>
          </div>
        </section>
      </div>

      <div className="bottom-sheet-surface fixed bottom-0 w-full max-w-md p-4 lg:hidden">
        <div className="flex gap-3">
          <button className="app-panel-soft flex w-24 flex-col items-center justify-center gap-1 rounded-2xl text-default-500">
            <FileText size={18} />
            <span className="text-[10px] font-semibold">Borrador</span>
          </button>
          <button
            className="flex-1 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_34px_rgba(217,119,6,0.35)] transition hover:opacity-90 disabled:opacity-50"
            disabled={isCreating || cart.length === 0 || !selectedClient}
            onClick={handleRegisterSale}
          >
            <span className="flex items-center justify-center gap-2">
              {isCreating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ShoppingCart size={20} strokeWidth={2.4} />
              )}
              {isCreating ? "Registrando..." : "Registrar Venta"}
            </span>
          </button>
        </div>
      </div>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => {
          setShowScanner(false);
          stopCameraScanner();
        }}
        onScan={() => {}}
        setVideoContainer={setVideoContainer}
        state={scannerState}
        error={scannerError}
        onToggle={toggleCameraScanner}
        zoomSupported={zoomSupported}
        zoomRange={zoomRange}
        zoomValue={zoomValue}
        onZoomChange={applyZoom}
      />
    </div>
  );
}
