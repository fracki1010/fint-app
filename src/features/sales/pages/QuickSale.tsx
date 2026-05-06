import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Loader2,
  User,
  ScanBarcode,
  Search as SearchIcon,
} from "lucide-react";
import { useBarcodeScanner } from "@shared/hooks/useBarcodeScanner";
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

import BarcodeScanner from "@shared/components/scanner/BarcodeScanner";
import { Client, Product, Presentation } from "@shared/types";
import SaleSuccessScreen from "@features/sales/components/SaleSuccessScreen";
import CartItem from "@features/sales/components/CartItem";
import PaymentSummary from "@features/sales/components/PaymentSummary";

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
      await createOrder();
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

  return (
    <div className={`flex min-h-screen flex-col bg-background ${isDesktop ? "lg:overflow-hidden lg:h-screen" : ""}`}>
      {/* ── Mobile layout ── */}
      <div className={`flex min-h-screen flex-col bg-background ${isDesktop ? "lg:hidden" : ""}`}>
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
                const activePresentations = (p.presentations || []).filter((pr) => pr.isActive !== false);
                const hasPresentations = activePresentations.length > 0;

                const baseAvailable = getAvailableStock(p);
                const baseInCart = items
                  .filter((i) => i.product._id === p._id && !i.presentation)
                  .reduce((s, i) => s + i.quantity, 0);
                const baseOutOfStock = baseAvailable <= 0;
                const baseCantAdd = baseInCart >= baseAvailable;

                return (
                  <div key={p._id} className="border-b border-divider/60 last:border-0">
                    {/* Base product header — always visible, always clickable */}
                    <button
                      className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                        baseOutOfStock || baseCantAdd
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-content2/60"
                      }`}
                      disabled={baseOutOfStock || baseCantAdd}
                      onMouseDown={() => {
                        if (!baseOutOfStock && !baseCantAdd) addProductToCart(p);
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-default-400">
                          {p.barcode || p.sku || "Sin código"}
                        </p>
                        {!hasPresentations && (
                          <p className={`mt-0.5 text-[11px] font-semibold ${
                            baseOutOfStock ? "text-danger" : baseAvailable > 0 && baseAvailable <= (p.minStock || 5) ? "text-warning" : "text-success"
                          }`}>
                            {baseOutOfStock ? "Sin stock" : `${baseAvailable} en stock`}
                            {baseInCart > 0 && ` · ${baseInCart} en carrito`}
                          </p>
                        )}
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <p className="text-sm font-bold text-primary">{formatCurrency(p.price, currency)}</p>
                        {!hasPresentations && (
                          <p className="text-[10px] text-default-400">{p.unitOfMeasure || "ud."}</p>
                        )}
                      </div>
                    </button>

                    {/* Presentations — shown as sub-options when any exist */}
                    {hasPresentations && (
                      <div className="space-y-1 px-4 pb-3">
                        {/* Base product as a presentation option */}
                        <button
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                            baseOutOfStock || baseCantAdd ? "cursor-not-allowed opacity-50" : "hover:bg-content2/60 bg-content2/30"
                          }`}
                          disabled={baseOutOfStock || baseCantAdd}
                          onMouseDown={() => {
                            if (!baseOutOfStock && !baseCantAdd) addProductToCart(p);
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-foreground">Base</span>
                            <span className="ml-2 text-default-400">
                              {p.unitOfMeasure || "ud."}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold ${baseOutOfStock ? "text-danger" : baseAvailable <= (p.minStock || 5) ? "text-warning" : "text-success"}`}>
                              {baseOutOfStock ? "Sin stock" : `${baseAvailable} disp.`}
                              {baseInCart > 0 && ` · ${baseInCart} en carrito`}
                            </span>
                            <span className="text-sm font-bold text-primary">{formatCurrency(p.price, currency)}</span>
                          </div>
                        </button>

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
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                                prCantAdd ? "cursor-not-allowed opacity-50" : "hover:bg-content2/60 bg-content2/30"
                              }`}
                              disabled={prCantAdd}
                              onMouseDown={() => {
                                if (!prCantAdd) addProductToCart(p, pr);
                              }}
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-foreground">{pr.name}</span>
                                <span className="ml-2 text-default-400">
                                  {pr.equivalentQty} {pr.unitOfMeasure || p.unitOfMeasure || "u."}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-semibold ${prAvailable <= 0 ? "text-danger" : prLowStock ? "text-warning" : "text-success"}`}>
                                  {prAvailable <= 0 ? "Sin stock" : `${prAvailable} disp.`}
                                  {prInCart > 0 && ` · ${prInCart} en carrito`}
                                </span>
                                <span className="text-sm font-bold text-primary">{formatCurrency(pr.price, currency)}</span>
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

        {/* Quick-select: recent clients */}
        {!showClientSearch && (() => {
          const recentClients = clients
            .filter((c) => c._id !== genericClient?._id)
            .slice(0, 5);
          if (recentClients.length === 0) return null;
          const isGeneric = selectedClient?._id === genericClient?._id;
          return (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {isGeneric && recentClients.map((c) => (
                <button
                  key={c._id}
                  className="rounded-full border border-divider/30 bg-content2/40 px-2.5 py-1 text-[11px] font-semibold text-default-600 transition hover:border-primary/30 hover:text-primary"
                  onClick={() => { setSelectedClient(c); }}
                >
                  {c.name}
                </button>
              ))}
              {!isGeneric && (
                <button
                  className="rounded-full border border-divider/30 bg-content2/40 px-2.5 py-1 text-[11px] font-semibold text-default-500 transition hover:border-primary/30 hover:text-primary"
                  onClick={() => { setSelectedClient(genericClient); }}
                >
                  Consumidor Final
                </button>
              )}
            </div>
          );
        })()}

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
      <div className="flex-1 px-4 py-3">
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
                const available = getAvailableStock(item.product, item.presentation);
                const error = stockErrors.find(
                  (e) =>
                    e.productId === item.product._id &&
                    (item.presentation ? e.productName.includes(item.presentation.name) : true),
                );
                const isWarning = !!error || (available > 0 && available <= (item.product.minStock || 5) && item.quantity >= available * 0.8);
                const itemPrice = item.presentation?.price ?? item.product.price;
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
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Payment + total */}
      <div className="sticky bottom-0 border-t border-divider/60 bg-background/95 px-4 py-4 backdrop-blur-lg space-y-3">
        <PaymentSummary
          paymentMethod={paymentMethod}
          onChangeMethod={setPaymentMethod}
          cashReceived={cashReceived}
          onCashChange={setCashReceived}
          change={change}
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

      </div>

      {/* ── Desktop layout ── */}
      {isDesktop && (
        <div className="hidden lg:flex h-screen overflow-hidden">
          {/* Left panel: Search + Items */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-divider/60 bg-background/80 px-6 py-4 backdrop-blur-lg shrink-0">
              <div className="flex items-center gap-3">
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-default-500 hover:text-foreground"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft size={18} />
                </button>
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
                Escanear
              </button>
            </header>

            {/* Search + Results */}
            <div className="relative border-b border-divider/60 px-6 py-4 shrink-0">
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
                <div className="absolute left-6 right-6 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-divider/70 bg-content1 shadow-xl">
                  {searching ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="animate-spin text-default-400" size={20} />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-default-400">No se encontraron productos</div>
                  ) : (
                    searchResults.map((p) => {
                      const activePresentations = (p.presentations || []).filter((pr) => pr.isActive !== false);
                      const hasPresentations = activePresentations.length > 0;
                      const baseAvailable = getAvailableStock(p);
                      const baseInCart = items.filter((i) => i.product._id === p._id && !i.presentation).reduce((s, i) => s + i.quantity, 0);
                      const baseOutOfStock = baseAvailable <= 0;
                      const baseCantAdd = baseInCart >= baseAvailable;

                      return (
                        <div key={p._id} className="border-b border-divider/60 last:border-0">
                          <button
                            className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${baseOutOfStock || baseCantAdd ? "cursor-not-allowed opacity-50" : "hover:bg-content2/60"}`}
                            disabled={baseOutOfStock || baseCantAdd}
                            onMouseDown={() => { if (!baseOutOfStock && !baseCantAdd) addProductToCart(p); }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                              <p className="text-[11px] text-default-400">{p.barcode || p.sku || "Sin código"}</p>
                              {!hasPresentations && (
                                <p className={`mt-0.5 text-[11px] font-semibold ${baseOutOfStock ? "text-danger" : baseAvailable > 0 && baseAvailable <= (p.minStock || 5) ? "text-warning" : "text-success"}`}>
                                  {baseOutOfStock ? "Sin stock" : `${baseAvailable} en stock`}{baseInCart > 0 && ` · ${baseInCart} en carrito`}
                                </p>
                              )}
                            </div>
                            <div className="ml-3 shrink-0 text-right">
                              <p className="text-sm font-bold text-primary">{formatCurrency(p.price, currency)}</p>
                              {!hasPresentations && <p className="text-[10px] text-default-400">{p.unitOfMeasure || "ud."}</p>}
                            </div>
                          </button>

                          {hasPresentations && (
                            <div className="space-y-1 px-4 pb-3">
                              <button
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${baseOutOfStock || baseCantAdd ? "cursor-not-allowed opacity-50" : "hover:bg-content2/60 bg-content2/30"}`}
                                disabled={baseOutOfStock || baseCantAdd}
                                onMouseDown={() => { if (!baseOutOfStock && !baseCantAdd) addProductToCart(p); }}
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-foreground">Base</span>
                                  <span className="ml-2 text-default-400">{p.unitOfMeasure || "ud."}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] font-semibold ${baseOutOfStock ? "text-danger" : baseAvailable <= (p.minStock || 5) ? "text-warning" : "text-success"}`}>
                                    {baseOutOfStock ? "Sin stock" : `${baseAvailable} disp.`}{baseInCart > 0 && ` · ${baseInCart} en carrito`}
                                  </span>
                                  <span className="text-sm font-bold text-primary">{formatCurrency(p.price, currency)}</span>
                                </div>
                              </button>

                              {activePresentations.map((pr) => {
                                const prAvailable = getAvailableStock(p, pr);
                                const prInCart = items.filter((i) => i.product._id === p._id && i.presentation?._id === pr._id).reduce((s, i) => s + i.quantity, 0);
                                const prCantAdd = prInCart >= prAvailable || prAvailable <= 0;
                                const prLowStock = prAvailable > 0 && prAvailable <= (p.minStock || 5);
                                return (
                                  <button key={pr._id}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${prCantAdd ? "cursor-not-allowed opacity-50" : "hover:bg-content2/60 bg-content2/30"}`}
                                    disabled={prCantAdd}
                                    onMouseDown={() => { if (!prCantAdd) addProductToCart(p, pr); }}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="font-semibold text-foreground">{pr.name}</span>
                                      <span className="ml-2 text-default-400">{pr.equivalentQty} {pr.unitOfMeasure || p.unitOfMeasure || "u."}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[11px] font-semibold ${prAvailable <= 0 ? "text-danger" : prLowStock ? "text-warning" : "text-success"}`}>
                                        {prAvailable <= 0 ? "Sin stock" : `${prAvailable} disp.`}{prInCart > 0 && ` · ${prInCart} en carrito`}
                                      </span>
                                      <span className="text-sm font-bold text-primary">{formatCurrency(pr.price, currency)}</span>
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

            {/* Client selector */}
            <div className="border-b border-divider/60 px-6 py-3 shrink-0">
              <button className="flex w-full items-center gap-2 text-left" onClick={() => setShowClientSearch(!showClientSearch)}>
                <User size={15} className="shrink-0 text-default-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-default-500">Cliente</p>
                  <p className="truncate text-sm font-semibold text-foreground">{selectedClient?.name || "Consumidor Final"}</p>
                </div>
                <span className="text-xs text-primary">Cambiar</span>
              </button>

              {/* Quick-select chips (desktop) */}
              {!showClientSearch && (() => {
                const recentClients = clients.filter((c) => c._id !== genericClient?._id).slice(0, 5);
                if (recentClients.length === 0) return null;
                const isGeneric = selectedClient?._id === genericClient?._id;
                return (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {isGeneric && recentClients.map((c) => (
                      <button key={c._id} className="rounded-full border border-divider/30 bg-content2/40 px-2.5 py-1 text-[11px] font-semibold text-default-600 transition hover:border-primary/30 hover:text-primary" onClick={() => { setSelectedClient(c); }}>
                        {c.name}
                      </button>
                    ))}
                    {!isGeneric && (
                      <button className="rounded-full border border-divider/30 bg-content2/40 px-2.5 py-1 text-[11px] font-semibold text-default-500 transition hover:border-primary/30 hover:text-primary" onClick={() => { setSelectedClient(genericClient); }}>
                        Consumidor Final
                      </button>
                    )}
                  </div>
                );
              })()}

              {showClientSearch && (
                <div className="mt-3">
                  <div className="relative">
                    <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                    <input className="corp-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm" placeholder="Buscar cliente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} autoFocus />
                  </div>
                  {clientSearch && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-divider/70 bg-content1 shadow-lg">
                      {filteredClients.filter((c) => c.name !== "Consumidor Final" || c.phone !== "0000000000").slice(0, 10).map((c) => (
                        <button key={c._id} className="w-full border-b border-divider/60 px-4 py-2.5 text-left text-sm hover:bg-content2/60 last:border-0" onClick={() => { setSelectedClient(c); setShowClientSearch(false); setClientSearch(""); }}>
                          <span className="font-semibold text-foreground">{c.name}</span>
                          <span className="ml-2 text-xs text-default-400">{c.phone}</span>
                        </button>
                      ))}
                      <button className="w-full px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-content2/60" onClick={() => { setSelectedClient(genericClient); setShowClientSearch(false); setClientSearch(""); }}>
                        Usar Consumidor Final
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
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
                      <p className="text-xs font-bold text-danger">Stock insuficiente en {stockErrors.length} producto(s)</p>
                      {stockErrors.map((e) => <p key={e.productId} className="mt-1 text-xs text-danger/80">{e.productName}: pediste {e.requested}, disponible {e.available}</p>)}
                    </div>
                  )}
                  <div className="space-y-2">
                    {items.map((item) => {
                      const available = getAvailableStock(item.product, item.presentation);
                      const error = stockErrors.find((e) => e.productId === item.product._id && (item.presentation ? e.productName.includes(item.presentation.name) : true));
                      const isWarning = !!error || (available > 0 && available <= (item.product.minStock || 5) && item.quantity >= available * 0.8);
                      const itemPrice = item.presentation?.price ?? item.product.price;
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
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right panel: Order summary + Payment */}
          <div className="w-[420px] shrink-0 border-l border-divider/60 bg-content2/20 flex flex-col">
            {/* Order summary */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <h2 className="text-sm font-bold text-foreground mb-4">Resumen del pedido</h2>
              {items.length === 0 ? (
                <p className="text-sm text-default-400 text-center py-8">Agregá productos al carrito</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const itemPrice = item.presentation?.price ?? item.product.price;
                    return (
                      <div key={`sum-${item.product._id}-${item.presentation?._id || "base"}`} className="flex items-center justify-between text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">
                            {item.product.name}
                            {item.presentation && <span className="text-xs font-normal text-default-400"> ({item.presentation.name})</span>}
                          </p>
                          <p className="text-xs text-default-400">{item.quantity} × {formatCurrency(itemPrice, currency)}</p>
                        </div>
                        <p className="ml-3 font-bold text-foreground">{formatCurrency(itemPrice * item.quantity, currency)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment + total */}
            <div className="border-t border-divider/60 px-6 py-5 space-y-4 bg-background/80">
              <PaymentSummary
                paymentMethod={paymentMethod}
                onChangeMethod={setPaymentMethod}
                cashReceived={cashReceived}
                onCashChange={setCashReceived}
                change={change}
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
          </div>
        </div>
      )}

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => { setShowScanner(false); stopCameraScanner(); }}
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
