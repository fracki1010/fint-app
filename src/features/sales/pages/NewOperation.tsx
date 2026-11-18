import { useState, useMemo, useRef, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Search,
  UserPlus,
  Package,
  ShoppingCart,
  Loader2,
  Plus,
  Minus,
  ScanBarcode,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useClients } from "@features/clients/hooks/useClients";
import { useProducts } from "@features/products/hooks/useProducts";
import { useOrders } from "@features/sales/hooks/useOrders";
import { useSettings } from "@features/settings/hooks/useSettings";
import { useProductLookupManual } from "@features/products/hooks/useProductLookup";
import { useBarcodeScanner } from "@shared/hooks/useBarcodeScanner";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { Client, Product, Presentation, VoucherType, PaymentMethod } from "@shared/types";
import { useAppToast } from "@features/notifications/components/AppToast";
import BarcodeScanner from "@shared/components/scanner/BarcodeScanner";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getErrorMessage } from "@shared/utils/errors";
import { getPaymentLabel } from "@features/sales/utils/payment";
import {
  canAddProductToCart,
  getAvailableStock,
  validateCartStock,
} from "@features/products/utils/stock";
import { VoucherSelector } from "@features/vouchers/components/VoucherSelector";
import { getDefaultVoucherTypes } from "@features/vouchers/utils/voucherUtils";

interface CartItem {
  product: Product;
  presentation?: Presentation;
  quantity: number;
}

const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "transfer", "mercadopago", "check", "other"];

const LABEL_CLASS = "mb-2 block text-sm font-semibold text-foreground";
const SECTION_HEADING_CLASS = "mb-4 flex items-center gap-3 border-b border-divider/60 pb-3";
const SECTION_TITLE_CLASS = "text-[15px] font-semibold tracking-tight text-foreground";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [selectedVoucherTypes, setSelectedVoucherTypes] = useState<VoucherType[]>([]);
  const { searchProducts } = useProductLookupManual();
  const scanHandlerRef = useRef<(code: string) => void>(() => {});

  // Initialize default voucher types from settings
  useEffect(() => {
    if (settings) {
      const paymentStatus = settings?.defaultPaymentStatus || "Pendiente";
      const defaults = getDefaultVoucherTypes(settings, paymentStatus);
      setSelectedVoucherTypes(defaults);
    }
  }, [settings]);

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
        (acc, item) => acc + ((item.presentation?.price ?? item.product.price ?? 0) * item.quantity),
        0,
      ),
    [cart],
  );

  const currency = settings?.currency || "USD";
  const taxRate = (settings?.taxRate || 0) / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const voucherPaymentStatus =
    paymentMethod === "cash" ? "Pagado" : settings?.defaultPaymentStatus || "Pendiente";

  const blockedReason = !selectedClient
    ? "Elegí un cliente para registrar la venta."
    : cart.length === 0
      ? "Agregá al menos un producto."
      : null;
  const canRegister = !isCreating && blockedReason === null;

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
      const orderPayload: Record<string, unknown> = {
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
        paymentStatus: paymentMethod === "cash" ? "Pagado" : (settings?.defaultPaymentStatus || "Pendiente"),
        paymentMethod,
        paymentSplits: [{ method: paymentMethod, amount: total }],
        deliveryStatus: settings?.defaultDeliveryStatus || "Pendiente",
        notes: notes || undefined,
        source: "Dashboard",
        vouchersToGenerate: selectedVoucherTypes,
      };
      await createOrder(orderPayload as Parameters<typeof createOrder>[0]);
      showToast({
        variant: "success",
        message: selectedVoucherTypes.length > 0
          ? `Venta registrada con ${selectedVoucherTypes.length} comprobante(s).`
          : "Venta registrada correctamente.",
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

  const paymentMethodPicker = (
    <div>
      <span className={LABEL_CLASS}>Método de pago</span>
      <div className="flex flex-wrap gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m}
            aria-pressed={paymentMethod === m}
            className={`min-h-9 rounded-xl px-3.5 text-xs font-semibold transition ${
              paymentMethod === m
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-content2/60 text-default-500 hover:bg-content2 hover:text-foreground"
            }`}
            onClick={() => setPaymentMethod(m)}
            type="button"
          >
            {getPaymentLabel(m)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-36 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar sticky top-0 z-10 px-6 pt-6 pb-5">
        <div className="flex items-center gap-4">
          <Link
            aria-label="Volver"
            className="app-panel-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-default-600 transition hover:text-foreground"
            to="/"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-foreground">Nueva venta</h1>
            <p className="mt-1 text-sm text-default-500">Elegí el cliente, sumá productos y cobrá.</p>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-4 py-5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6 lg:space-y-0 lg:px-0">
        <div className="space-y-5 lg:col-span-8">
          <section className="app-panel rounded-[28px] p-5">
            <div className={SECTION_HEADING_CLASS}>
              <User className="text-primary" size={20} strokeWidth={2.4} />
              <h2 className={SECTION_TITLE_CLASS}>Cliente</h2>
            </div>

            {!selectedClient ? (
              <div className="relative">
                <label className={LABEL_CLASS} htmlFor="client-search">
                  Buscar cliente
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
                    size={18}
                  />
                  <input
                    autoComplete="off"
                    className="corp-input w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-foreground"
                    id="client-search"
                    inputMode="search"
                    placeholder="Nombre o teléfono"
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>

                {filteredClients.length > 0 && (
                  <div className="absolute z-[70] mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-divider/70 bg-content1 shadow-xl">
                    {filteredClients.map((c) => (
                      <button
                        key={c._id}
                        className="w-full border-b border-divider/60 px-4 py-3 text-left transition hover:bg-content2/60 last:border-0"
                        onClick={() => {
                          setSelectedClient(c);
                          setClientSearch("");
                        }}
                        type="button"
                      >
                        <span className="block text-sm font-semibold text-foreground">{c.name}</span>
                        <span className="block pt-0.5 text-xs text-default-500">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}

                <Link
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
                  to="/clients"
                >
                  <UserPlus size={18} strokeWidth={2.4} />
                  Nuevo cliente
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-content2/60 p-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{selectedClient.name}</p>
                  <p className="mt-0.5 text-sm text-default-500">{selectedClient.phone}</p>
                </div>
                <button
                  aria-label="Quitar cliente"
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-danger transition hover:bg-danger/10"
                  onClick={() => setSelectedClient(null)}
                  type="button"
                >
                  <X size={14} />
                  Cambiar
                </button>
              </div>
            )}
          </section>

          <section className="app-panel rounded-[28px] p-5">
            <div className={SECTION_HEADING_CLASS}>
              <Package className="text-primary" size={20} strokeWidth={2.4} />
              <h2 className={SECTION_TITLE_CLASS}>Productos</h2>
              <span className="ml-auto text-xs text-default-500">
                {itemCount} {itemCount === 1 ? "unidad" : "unidades"}
              </span>
            </div>

            <div className="relative">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
                    size={18}
                  />
                  <input
                    autoComplete="off"
                    className="corp-input w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-foreground"
                    placeholder="Buscar por nombre o SKU"
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <button
                  aria-label="Escanear código"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition hover:bg-primary/20"
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
                <div className="absolute z-[70] mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-divider/70 bg-content1 shadow-xl">
                  {filteredProducts.map((p) => {
                    const activePresentations = (p.presentations || []).filter((pr) => pr.isActive !== false);
                    const singlePresentation = activePresentations.length === 1 ? activePresentations[0] : null;
                    const hasMultiplePresentations = activePresentations.length > 1;
                    const singleAvailable = getAvailableStock(p, singlePresentation ?? undefined);

                    return (
                      <div key={p._id} className="border-b border-divider/60 last:border-0">
                        <button
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                            hasMultiplePresentations
                              ? ""
                              : singleAvailable <= 0
                                ? "cursor-not-allowed opacity-60"
                                : "hover:bg-content2/60"
                          }`}
                          disabled={!hasMultiplePresentations && singleAvailable <= 0}
                          onClick={() => {
                            if (hasMultiplePresentations) return;
                            if (singlePresentation) addToCart(p, singlePresentation);
                            else addToCart(p);
                          }}
                          type="button"
                        >
                          <div className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-foreground">{p.name}</span>
                            <span className="block pt-0.5 text-xs text-default-500">
                              SKU {p.sku || "no definido"}
                              {!hasMultiplePresentations && ` · Stock ${singleAvailable}`}
                            </span>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-primary">
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
                                  className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl bg-content2/30 px-3 py-2 text-left text-xs transition ${
                                    prCantAdd ? "cursor-not-allowed opacity-50" : "hover:bg-content2/60"
                                  }`}
                                  disabled={prCantAdd}
                                  onClick={() => {
                                    if (!prCantAdd) addToCart(p, pr);
                                  }}
                                  type="button"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="font-semibold text-foreground">{pr.name}</span>
                                    <span className="ml-2 text-default-500">
                                      {pr.equivalentQty} {pr.unitOfMeasure || p.unitOfMeasure || "u."}
                                    </span>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <span className={`text-[11px] font-semibold ${prCantAdd ? "text-danger" : "text-success"}`}>
                                      {prCantAdd ? "Sin stock" : `${prAvailable} disp.`}
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
              {cart.length > 0 ? (
                <div className="divide-y divide-divider/70">
                  {cart.map((item) => {
                    const itemPrice = item.presentation?.price ?? item.product.price;
                    const available = getAvailableStock(item.product, item.presentation);

                    return (
                      <div
                        key={`${item.product._id}-${item.presentation?._id || "base"}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-3 p-4"
                      >
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-foreground">
                            {item.product.name}
                            {item.presentation && (
                              <span className="ml-1.5 text-xs font-normal text-default-500">({item.presentation.name})</span>
                            )}
                          </h4>
                          <p className="pt-0.5 text-xs text-default-500">
                            {formatCompactCurrency(itemPrice, currency)} c/u · {available} {available === 1 ? "disponible" : "disponibles"}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 rounded-xl border border-divider/60 bg-content2/60 p-1">
                          <button
                            aria-label={`Quitar una unidad de ${item.product.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-default-500 transition hover:bg-content1 hover:text-danger"
                            onClick={() => updateQuantity(item.product._id, -1, item.presentation?._id)}
                            type="button"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                          <button
                            aria-label={`Agregar una unidad de ${item.product.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-default-500 transition hover:bg-content1 hover:text-primary"
                            onClick={() => updateQuantity(item.product._id, 1, item.presentation?._id)}
                            type="button"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <p className="col-span-2 -mt-1 text-right text-sm font-semibold tabular-nums text-foreground">
                          {formatCompactCurrency(itemPrice * item.quantity, currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-default-500">Todavía no agregaste productos.</p>
              )}
            </div>
          </section>

          <section className="app-panel rounded-[28px] p-5">
            <label className={LABEL_CLASS} htmlFor="operation-notes">
              Notas
            </label>
            <textarea
              className="corp-input min-h-24 w-full resize-none rounded-2xl p-4 text-sm text-foreground"
              id="operation-notes"
              placeholder="Entrega, garantía o acuerdo comercial (opcional)"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <section className="app-panel rounded-[28px] p-5 space-y-5">
            {cart.length > 0 ? (
              <>
                {paymentMethodPicker}
                <div className="border-t border-divider/70 pt-5">
                  <VoucherSelector
                    selectedTypes={selectedVoucherTypes}
                    onChange={setSelectedVoucherTypes}
                    paymentStatus={voucherPaymentStatus}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-default-500">Agregá productos para elegir el pago y los comprobantes.</p>
            )}

            <div className="space-y-2 border-t border-divider/70 pt-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-default-500">Subtotal</span>
                <span className="font-medium tabular-nums text-foreground">{formatCompactCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-default-500">IVA {settings?.taxRate ?? 0}%</span>
                <span className="font-medium tabular-nums text-foreground">{formatCompactCurrency(tax, currency)}</span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 border-t border-divider/70 pt-4">
              <span className="text-base font-semibold text-foreground">Total</span>
              <span className="text-3xl font-semibold tracking-[-0.04em] tabular-nums text-primary">
                {formatCompactCurrency(total, currency)}
              </span>
            </div>

            <div className="hidden space-y-2 lg:block">
              {blockedReason && <p className="text-xs text-default-500">{blockedReason}</p>}
              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_34px_rgba(217,119,6,0.35)] transition hover:opacity-90 disabled:opacity-50"
                disabled={!canRegister}
                onClick={handleRegisterSale}
                type="button"
              >
                {isCreating ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} strokeWidth={2.4} />}
                {isCreating ? "Registrando..." : "Registrar venta"}
              </button>
            </div>
          </section>
        </aside>
      </div>

      <div className="mobile-chrome bottom-sheet-surface fixed bottom-[4.5rem] left-1/2 z-20 w-full max-w-md -translate-x-1/2 p-4 lg:hidden">
        {blockedReason && <p className="mb-2 text-center text-xs text-default-500">{blockedReason}</p>}
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-default-500">Total</p>
            <p className="truncate text-xl font-semibold tabular-nums text-foreground">
              {formatCompactCurrency(total, currency)}
            </p>
          </div>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_34px_rgba(217,119,6,0.35)] transition hover:opacity-90 disabled:opacity-50"
            disabled={!canRegister}
            onClick={handleRegisterSale}
            type="button"
          >
            {isCreating ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} strokeWidth={2.4} />}
            {isCreating ? "Registrando..." : "Registrar venta"}
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
