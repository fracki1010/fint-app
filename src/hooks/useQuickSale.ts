import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product, PaymentMethod, QuickSaleItem } from "@/types";
import api from "@/api/axios";
import { useSettings } from "./useSettings";
import { canAddProductToCart, getAvailableStock, validateCartStock } from "@/utils/stock";

interface UseQuickSaleOptions {
  clientId: string;
}

export function useQuickSale({ clientId }: UseQuickSaleOptions) {
  const [items, setItems] = useState<QuickSaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const currency = settings?.currency || "USD";
  const taxRate = (settings?.taxRate || 0) / 100;

  const addItem = useCallback((product: Product): boolean => {
    let added = true;
    setItems((current) => {
      if (!canAddProductToCart(current, product)) {
        added = false;
        return current;
      }
      const existing = current.find(
        (item) => item.product._id === product._id,
      );
      if (existing) {
        return current.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
    return added;
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) =>
        current.filter((item) => item.product._id !== productId),
      );
    } else {
      setItems((current) =>
        current.map((item) => {
          if (item.product._id !== productId) return item;
          const available = getAvailableStock(item.product);
          return { ...item, quantity: Math.min(quantity, available) };
        }),
      );
    }
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) =>
      current.filter((item) => item.product._id !== productId),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCashReceived(0);
    setPaymentMethod("cash");
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0,
      ),
    [items],
  );

  const tax = useMemo(() => subtotal * taxRate, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const change = useMemo(
    () => (paymentMethod === "cash" ? Math.max(0, cashReceived - total) : 0),
    [paymentMethod, cashReceived, total],
  );

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        client: clientId,
        items: items.map((item) => ({
          product: item.product.name,
          productId: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount: total,
        status: "Confirmada",
        salesStatus: "Confirmada",
        paymentStatus: "Pagado",
        deliveryStatus: "Entregada",
        source: "Dashboard",
        notes:
          paymentMethod === "cash" && cashReceived > 0
            ? `Pago rápido - Efectivo recibido: $${cashReceived}`
            : `Pago rápido - ${paymentMethod}`,
      };
      const response = await api.post("/orders", orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
      clearCart();
    },
  });

  const stockErrors = useMemo(() => validateCartStock(items), [items]);

  const canFinalize =
    items.length > 0 &&
    stockErrors.length === 0 &&
    (paymentMethod !== "cash" || cashReceived >= total);

  return {
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
    createOrder: createOrderMutation.mutateAsync,
    orderResult: createOrderMutation.data,
    isCreating: createOrderMutation.isPending,
    canFinalize,
  };
}
