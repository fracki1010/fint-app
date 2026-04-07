import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";
import { Client, Product } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import {
  canAddProductToCart,
  getAvailableStock,
  validateCartStock,
} from "@/utils/stock";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function NewOperationPage() {
  const navigate = useNavigate();
  const { clients } = useClients();
  const { products } = useProducts();
  const { createOrder, isCreating } = useOrders();
  const { settings } = useSettings();
  const { showToast } = useAppToast();

  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");

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

  const addToCart = (product: Product) => {
    if (!canAddProductToCart(cart, product)) {
      showToast({
        variant: "warning",
        message: `Stock insuficiente para ${product.name}.`,
      });

      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);

      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch("");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((item) => {
          if (item.product._id !== productId) return item;

          const available = getAvailableStock(item.product);
          const proposed = item.quantity + delta;
          const quantity = Math.max(0, Math.min(proposed, available));

          if (delta > 0 && proposed > available) {
            showToast({
              variant: "warning",
              message: `No puedes superar el stock disponible de ${item.product.name}.`,
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
          price: item.product.price,
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

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-28 font-sans lg:max-w-none lg:px-6 lg:pb-8">
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
            <div className="relative">
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

            {filteredProducts.length > 0 && (
              <div className="absolute z-[70] mt-2 max-h-48 w-full overflow-y-auto rounded-2xl border border-divider/70 bg-content1 shadow-xl">
                {filteredProducts.map((p) => (
                  <button
                    key={p._id}
                    className="flex w-full items-center justify-between border-b border-divider/60 px-4 py-3 text-left transition hover:bg-content2/60 last:border-0 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={getAvailableStock(p) <= 0}
                    onClick={() => addToCart(p)}
                  >
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {p.name}
                      </span>
                      <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-default-400">
                        SKU {p.sku || "No definido"}
                      </p>
                      <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-default-400">
                        Stock {getAvailableStock(p)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatCompactCurrency(p.price ?? 0, currency)}
                    </span>
                  </button>
                ))}
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
                cart.map((item) => (
                  <div
                    key={item.product._id}
                    className="grid grid-cols-[3fr_1.4fr_1.5fr] items-center gap-2 p-3"
                  >
                    <div>
                      <h4 className="text-[13px] font-semibold text-foreground">
                        {item.product.name}
                      </h4>
                      <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-default-400">
                        SKU {item.product.sku || "N/A"}
                      </p>
                      <p className="pt-1 text-[10px] uppercase tracking-[0.16em] text-default-400">
                        Disponible {getAvailableStock(item.product)}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-1 rounded-xl bg-content2/70 py-1 border border-divider/60">
                      <button
                        className="text-default-400 hover:text-danger"
                        onClick={() => updateQuantity(item.product._id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-[13px] font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        className="text-default-400 hover:text-primary"
                        onClick={() => updateQuantity(item.product._id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right text-[14px] font-semibold text-foreground">
                      {formatCompactCurrency(
                        (item.product.price ?? 0) * item.quantity,
                        currency,
                      )}
                    </div>
                  </div>
                ))
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
              className="flex-1 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)] transition hover:opacity-90 disabled:opacity-50"
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
            className="flex-1 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)] transition hover:opacity-90 disabled:opacity-50"
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
    </div>
  );
}
