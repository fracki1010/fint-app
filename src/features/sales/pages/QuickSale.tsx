import { SkeletonRowList } from "@shared/components/skeleton/primitives";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Loader2,
  User,
  ScanBarcode,
  Search as SearchIcon,
  Tags,
} from "lucide-react";
import { useBarcodeScanner } from "@shared/hooks/useBarcodeScanner";
import { usePlanFeatures } from "@shared/hooks/usePlanFeatures";
import { useProductSearch, useProductLookupManual } from "@features/products/hooks/useProductLookup";
import { useGenericClient } from "@features/clients/hooks/useGenericClient";
import { useQuickSale } from "@features/sales/hooks/useQuickSale";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useSettings } from "@features/settings/hooks/useSettings";
import { useClients } from "@features/clients/hooks/useClients";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";
import { formatCurrency } from "@shared/utils/currency";
import { printTicket } from "@features/sales/utils/ticket";
import { getAvailableStock } from "@features/products/utils/stock";
import { resolveProductPrice } from "@features/products/utils/priceResolver";
import { TierBadge } from "@features/sales/components/TierBadge";
import { CreditLimitAlert } from "@features/clients/components/CreditLimitAlert";
import { VoucherSelector } from "@features/vouchers/components/VoucherSelector";
import { VoucherType } from "@shared/types";
import { getDefaultVoucherTypes } from "@features/vouchers/utils/voucherUtils";

import BarcodeScanner from "@shared/components/scanner/BarcodeScanner";
import { Client, Product, Presentation, PriceTier } from "@shared/types";
import SaleSuccessScreen from "@features/sales/components/SaleSuccessScreen";
import CartItem from "@features/sales/components/CartItem";
import PaymentSummary from "@features/sales/components/PaymentSummary";

/** Calculate item price respecting per-item tier override for presentations */
function calcItemPrice(item: { product: Product; presentation?: Presentation; priceTier?: PriceTier }, globalTier: PriceTier): number {
  const effectiveTier = item.priceTier || globalTier;
  // If item has presentation price, scale it by the tier ratio
  if (item.presentation?.price) {
    const baseRetail = resolveProductPrice(item.product, "retail");
    const tierPrice = resolveProductPrice(item.product, effectiveTier);
    const ratio = baseRetail > 0 ? tierPrice / baseRetail : 1;
    return item.presentation.price * ratio;
  }
  return resolveProductPrice(item.product, effectiveTier);
}

export default function QuickSalePage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { showToast } = useAppToast();
  const { hasFeature } = usePlanFeatures();
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
  const [selectedVoucherTypes, setSelectedVoucherTypes] = useState<VoucherType[]>([]);

  // Initialize default voucher types from settings
  useEffect(() => {
    if (settings) {
      const defaults = getDefaultVoucherTypes(settings, "Pagado");
      setSelectedVoucherTypes(defaults);
    }
  }, [settings]);

  useEffect(() => {
    if (genericClient && !selectedClient) {
      setSelectedClient(genericClient);
    }
  }, [genericClient, selectedClient]);

  const clientId = selectedClient?._id || genericClient?._id || "";
  const [overrideTier, setOverrideTier] = useState<PriceTier | null>(null);
  const [showTierMenu, setShowTierMenu] = useState(false);
  const clientPriceTier = selectedClient?.priceList || "retail";
  const effectivePriceTier = overrideTier || clientPriceTier;
  const tierOverridden = overrideTier !== null && overrideTier !== clientPriceTier;

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
    splits,
    setSplits,
    currency,
    stockErrors,
    priceTier,
    updateItemTier,
    creditCheck,
    createOrder,
    isCreating,
    canFinalize,
    orderResult,
  } = useQuickSale({ clientId, priceTier: effectivePriceTier });

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
        const presentation = product.matchedPresentation;
        const available = presentation
          ? getAvailableStock(product, presentation)
          : getAvailableStock(product);
        if (available <= 0) {
          showToast({ variant: "error", message: `${product.name}${presentation ? ` (${presentation.name})` : ""} sin stock` });
          setShowScanner(false);
          return;
        }
        const added = addItem(product, presentation);
        if (added) {
          showToast({ variant: "success", message: `${product.name}${presentation ? ` (${presentation.name})` : ""} agregado` });
          setShowScanner(false);
        } else {
          showToast({ variant: "warning", message: `Stock insuficiente para ${product.name}${presentation ? ` (${presentation.name})` : ""}` });
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
    setVideoContainer,
    startCameraScanner,
    stopCameraScanner,
    toggleCameraScanner,
    zoomSupported,
    zoomRange,
    zoomValue,
    applyZoom,
  } = useBarcodeScanner({
    onScan: handleScan,
    onError: (err) => showToast({ variant: "error", message: err.message }),
  });

  useEffect(() => {
    if (orderResult) {
      setShowSuccess(true);
      const autoPrint = settings?.autoPrintTicket !== false;
      if (autoPrint) {
        try {
          const name = settings?.storeName || settings?.admin?.company?.name || "MI NEGOCIO";
          printTicket({
            order: orderResult,
            settings: {
              businessName: name,
              address: settings?.address,
              phone: settings?.phone,
              taxId: settings?.taxId,
              taxRate: settings?.taxRate,
            },
            currency,
          });
        } catch (err) {
          console.warn("No se pudo imprimir el ticket:", err);
        }
      }
    }
  }, [orderResult, settings, currency]);

  const handleFinalize = async () => {
    if (!canFinalize) return;
    try {
      // Create order with voucher generation request
      const orderData = {
        vouchersToGenerate: selectedVoucherTypes,
      };
      await createOrder(orderData);
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
    return () => { stopCameraScanner(); };
  }, [isDesktop, showScanner, startCameraScanner, stopCameraScanner]);

  const addProductToCart = (product: Product, presentation?: Presentation) => {
    const available = presentation
      ? getAvailableStock(product, presentation)
      : getAvailableStock(product);
    if (available <= 0) {
      showToast({ variant: "error", message: `${product.name}${presentation ? ` (${presentation.name})` : ""} sin stock` });
      return;
    }
    const added = addItem(product, presentation);
    if (added) {
      setSearchQuery("");
      setSearchFocused(false);
      showToast({ variant: "success", message: `${product.name}${presentation ? ` (${presentation.name})` : ""} agregado` });
    } else {
      const currentQty = items
        .filter((i) => i.product._id === product._id && i.presentation?._id === presentation?._id)
        .reduce((s, i) => s + i.quantity, 0);
      showToast({
        variant: "warning",
        message: `Stock insuficiente para ${product.name}${presentation ? ` (${presentation.name})` : ""}. Disponible: ${available}, en carrito: ${currentQty}`,
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
      <SaleSuccessScreen
        orderResult={orderResult}
        itemCount={itemCount}
        total={total}
        currency={currency}
        onNewSale={newSale}
        onGoHome={() => navigate("/")}
      />
    );
  }


  const tierOptions: PriceTier[] = ["retail", "wholesale", "distributor", "premium", "especial"];
  const tierLabel = (tier: PriceTier) =>
    tier === "retail" ? "Minorista" : tier === "wholesale" ? "Mayorista" : tier === "distributor" ? "Distribuidor" : tier;
  const tierShort = (tier: PriceTier) =>
    ({ retail: "R", wholesale: "W", distributor: "D", premium: "P", especial: "E" }[tier] ?? tier.charAt(0).toUpperCase());

  const recentClients = clients.filter((c) => c._id !== genericClient?._id).slice(0, 5);
  const isGenericClient = selectedClient?._id === genericClient?._id;

  return (
    <div className="relative flex min-h-dvh flex-col bg-background lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_420px] lg:overflow-hidden">
      {isCreating && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="mb-4 animate-spin text-primary" size={48} />
          <p className="text-sm font-semibold text-foreground">Procesando venta...</p>
          <p className="mt-1 text-xs text-default-500">Generando comprobantes y actualizando stock</p>
        </div>
      )}

      {/* Left column (mobile: first in flow; desktop: left grid column) */}
      <div className="flex min-w-0 flex-col lg:min-h-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-divider/60 bg-background/80 px-4 py-3 backdrop-blur-lg lg:static lg:px-6 lg:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Volver"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-default-500 hover:text-foreground lg:flex"
              onClick={() => navigate("/")}
              type="button"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground">Venta rápida</h1>
              <p className="text-xs text-default-500">
                {itemCount > 0 ? `${itemCount} producto(s) en el carrito` : "Escaneá o buscá productos"}
              </p>
            </div>
          </div>
          <button
            aria-label="Escanear código"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/20"
            onClick={() => setShowScanner(true)}
            type="button"
          >
            <ScanBarcode size={15} />
            <span className="hidden lg:inline">Escanear</span>
          </button>
        </header>

        {/* Search with dropdown */}
        <div className="relative border-b border-divider/60 px-4 py-3 lg:px-6 lg:py-4">
          <div className="relative">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
            <input
              ref={searchRef}
              autoComplete="off"
              className="corp-input w-full rounded-2xl py-3 pl-9 pr-4 text-sm text-foreground placeholder:text-default-400"
              placeholder="Buscá producto por nombre, código o SKU..."
              value={searchQuery}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
            />
          </div>

          {showDropdown && (
            <div className="absolute left-4 right-4 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-divider/70 bg-content1 shadow-xl lg:left-6 lg:right-6">
              {searching ? (
                <div className="p-2">
                  <SkeletonRowList rows={3} lines={2} leading="tile" trailing={false} />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-default-500">No se encontraron productos</div>
              ) : (
                searchResults.map((p) => {
                  const activePresentations = (p.presentations || []).filter((pr) => pr.isActive !== false);
                  const hasPresentations = activePresentations.length > 0;
                  const baseAvailable = getAvailableStock(p);
                  const baseInCart = items
                    .filter((i) => i.product._id === p._id && !i.presentation)
                    .reduce((s, i) => s + i.quantity, 0);
                  const baseOutOfStock = baseAvailable <= 0;

                  return (
                    <div key={p._id} className="border-b border-divider/60 last:border-0">
                      <div className="pointer-events-none flex w-full items-center justify-between px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                          <p className="text-xs text-default-500">{p.barcode || p.sku || "Sin código"}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                            {tierOptions.map((tier) => {
                              const tierPrice = resolveProductPrice(p, tier);
                              const isActive = tier === priceTier;
                              if (!isActive && tierPrice <= 0) return null;
                              return (
                                <span
                                  key={tier}
                                  className={`rounded px-1.5 py-0.5 font-semibold tabular-nums ${
                                    isActive ? "bg-primary/10 text-primary" : "bg-default-100 text-default-500"
                                  }`}
                                >
                                  {tierShort(tier)} {formatCurrency(tierPrice, currency)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        {!hasPresentations && (
                          <div className="ml-3 shrink-0 text-right">
                            <p className="text-sm font-bold tabular-nums text-primary">
                              {formatCurrency(resolveProductPrice(p, priceTier), currency)}
                            </p>
                            <p
                              className={`mt-0.5 text-[11px] font-semibold ${
                                baseOutOfStock
                                  ? "text-danger"
                                  : baseAvailable <= (p.minStock || 5)
                                    ? "text-warning"
                                    : "text-success"
                              }`}
                            >
                              {baseOutOfStock ? "Sin stock" : `${baseAvailable} en stock`}
                              {baseInCart > 0 && ` · ${baseInCart} en carrito`}
                            </p>
                          </div>
                        )}
                      </div>

                      {hasPresentations && (
                        <div className="space-y-1 px-4 pb-3">
                          {activePresentations.map((pr) => {
                            const prAvailable = getAvailableStock(p, pr);
                            const prInCart = items
                              .filter((i) => i.product._id === p._id && i.presentation?._id === pr._id)
                              .reduce((s, i) => s + i.quantity, 0);
                            const prCantAdd = prInCart >= prAvailable || prAvailable <= 0;
                            const prLowStock = prAvailable > 0 && prAvailable <= (p.minStock || 5);

                            return (
                              <button
                                key={pr._id}
                                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition ${
                                  prCantAdd ? "cursor-not-allowed opacity-50" : "bg-content2/30 hover:bg-content2/60"
                                }`}
                                disabled={prCantAdd}
                                onMouseDown={() => {
                                  if (!prCantAdd) addProductToCart(p, pr);
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
                                  <span
                                    className={`text-[11px] font-semibold ${
                                      prAvailable <= 0 ? "text-danger" : prLowStock ? "text-warning" : "text-success"
                                    }`}
                                  >
                                    {prAvailable <= 0 ? "Sin stock" : `${prAvailable} disp.`}
                                    {prInCart > 0 && ` · ${prInCart} en carrito`}
                                  </span>
                                  <span className="text-sm font-bold tabular-nums text-primary">
                                    {formatCurrency(pr.price, currency)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Client */}
        <div className="border-b border-divider/60 px-4 py-3 lg:px-6">
          <button
            className="flex w-full items-center gap-2 text-left"
            onClick={() => setShowClientSearch(!showClientSearch)}
            type="button"
          >
            <User size={15} className="shrink-0 text-default-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-default-500">Cliente</p>
                <TierBadge tier={priceTier} size="sm" tierConfig={settings?.priceTierConfig} />
                <div className="relative">
                  <button
                    aria-label="Cambiar lista de precios"
                    className={`min-h-6 px-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      tierOverridden ? "text-warning" : "text-default-400 hover:text-primary"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTierMenu(!showTierMenu);
                    }}
                    type="button"
                  >
                    ▼
                  </button>
                  {showTierMenu && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-divider/20 bg-content1 py-1 shadow-xl">
                      {tierOptions.map((tier) => {
                        const active = (overrideTier || clientPriceTier) === tier;
                        return (
                          <button
                            key={tier}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                              active ? "bg-primary/10 text-primary" : "text-default-500 hover:bg-content2/60"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOverrideTier(tier);
                              setShowTierMenu(false);
                            }}
                            type="button"
                          >
                            <Tags size={12} />
                            <span>{tierLabel(tier)}</span>
                            {active && <span className="ml-auto text-primary">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <p className="truncate text-sm font-semibold text-foreground">
                {selectedClient?.name || "Consumidor Final"}
                {tierOverridden && (
                  <span className="ml-2 text-[11px] font-medium text-warning">({tierLabel(priceTier)})</span>
                )}
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">Cambiar</span>
          </button>

          {!showClientSearch && recentClients.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {isGenericClient
                ? recentClients.map((c) => (
                    <button
                      key={c._id}
                      className="rounded-full border border-divider/30 bg-content2/40 px-2.5 py-1 text-[11px] font-semibold text-default-600 transition hover:border-primary/30 hover:text-primary"
                      onClick={() => setSelectedClient(c)}
                      type="button"
                    >
                      {c.name}
                    </button>
                  ))
                : (
                    <button
                      className="rounded-full border border-divider/30 bg-content2/40 px-2.5 py-1 text-[11px] font-semibold text-default-500 transition hover:border-primary/30 hover:text-primary"
                      onClick={() => setSelectedClient(genericClient)}
                      type="button"
                    >
                      Consumidor Final
                    </button>
                  )}
            </div>
          )}

          {showClientSearch && (
            <div className="mt-3">
              <div className="relative">
                <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                <input
                  autoFocus
                  className="corp-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm"
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
              {clientSearch && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-divider/70 bg-content1 shadow-lg">
                  {filteredClients
                    .filter((c) => c.name !== "Consumidor Final" || c.phone !== "0000000000")
                    .slice(0, 10)
                    .map((c) => (
                      <button
                        key={c._id}
                        className="w-full border-b border-divider/60 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-content2/60"
                        onClick={() => {
                          setSelectedClient(c);
                          setShowClientSearch(false);
                          setClientSearch("");
                        }}
                        type="button"
                      >
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <span className="ml-2 text-xs text-default-500">{c.phone}</span>
                      </button>
                    ))}
                  <button
                    className="w-full px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-content2/60"
                    onClick={() => {
                      setSelectedClient(genericClient);
                      setShowClientSearch(false);
                      setClientSearch("");
                    }}
                    type="button"
                  >
                    Usar Consumidor Final
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="flex-1 px-4 py-3 lg:min-h-0 lg:overflow-y-auto lg:px-6 lg:py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-default-500">
              <ShoppingCart size={40} className="mb-3" />
              <p className="text-sm font-semibold text-foreground">Carrito vacío</p>
              <p className="mt-1 text-xs">Buscá productos arriba para comenzar</p>
            </div>
          ) : (
            <>
              {stockErrors.length > 0 && (
                <div className="mb-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3">
                  <p className="text-xs font-bold text-danger">Stock insuficiente en {stockErrors.length} producto(s)</p>
                  {stockErrors.map((e) => (
                    <p key={e.productId} className="mt-1 text-xs text-danger/80">
                      {e.productName}: pediste {e.requested}, disponible {e.available}
                    </p>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                {items.map((item) => {
                  const available = getAvailableStock(item.product, item.presentation);
                  const error = stockErrors.find(
                    (e) =>
                      e.productId === item.product._id &&
                      (item.presentation ? e.productName.includes(item.presentation.name) : true),
                  );
                  const isWarning =
                    !!error ||
                    (available > 0 && available <= (item.product.minStock || 5) && item.quantity >= available * 0.8);
                  const itemPrice = calcItemPrice(item, priceTier);
                  return (
                    <CartItem
                      key={`${item.product._id}-${item.presentation?._id || "base"}`}
                      item={item}
                      currency={currency}
                      available={available}
                      error={error}
                      isWarning={isWarning}
                      itemPrice={itemPrice}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                      onTierChange={updateItemTier}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right column (mobile: after the cart; desktop: summary column) */}
      <aside className="flex flex-col border-t border-divider/60 bg-content2/20 lg:min-h-0 lg:border-l lg:border-t-0">
        <div className="hidden flex-1 overflow-y-auto px-6 py-6 lg:block">
          <h2 className="mb-4 text-sm font-bold text-foreground">Resumen del pedido</h2>
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-default-500">Agregá productos al carrito</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const itemPrice = calcItemPrice(item, priceTier);
                return (
                  <div
                    key={`sum-${item.product._id}-${item.presentation?._id || "base"}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {item.product.name}
                        {item.presentation && (
                          <span className="text-xs font-normal text-default-500"> ({item.presentation.name})</span>
                        )}
                      </p>
                      <p className="text-xs text-default-500">
                        {item.quantity} × {formatCurrency(itemPrice, currency)}
                      </p>
                    </div>
                    <p className="ml-3 font-bold tabular-nums text-foreground">
                      {formatCurrency(itemPrice * item.quantity, currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {creditCheck.isWarning && creditCheck.creditStatus && (
          <div className="px-4 pt-2 lg:px-6 lg:pt-4">
            <CreditLimitAlert
              creditStatus={creditCheck.creditStatus}
              currency={currency}
              showDismiss={false}
              variant="banner"
            />
          </div>
        )}

        {items.length > 0 && hasFeature("accounting") && (
          <div className="border-t border-divider/60 px-4 py-3 lg:px-6 lg:py-4">
            <VoucherSelector
              selectedTypes={selectedVoucherTypes}
              onChange={setSelectedVoucherTypes}
              paymentStatus="Pagado"
            />
          </div>
        )}

        <div className="sticky bottom-[4.5rem] z-10 space-y-3 border-t border-divider/60 bg-background/95 px-4 py-4 backdrop-blur-lg lg:static lg:bottom-auto lg:space-y-4 lg:bg-background/80 lg:px-6 lg:py-5 lg:backdrop-blur-none">
          <PaymentSummary
            splits={splits}
            onSplitsChange={setSplits}
            subtotal={subtotal}
            tax={tax}
            total={total}
            currency={currency}
            settings={settings}
            onCheckout={handleFinalize}
            isCreating={isCreating}
            canFinalize={canFinalize}
          />
        </div>
      </aside>

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
