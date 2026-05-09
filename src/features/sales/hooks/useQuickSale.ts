import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Product, Presentation, QuickSaleItem, PriceTier, CreditStatus } from "@shared/types";
import api from "@shared/api/axios";
import { useSettings } from "@features/settings/hooks/useSettings";
import { canAddProductToCart, getAvailableStock, validateCartStock } from "@features/products/utils/stock";
import { resolveProductPrice } from "@features/products/utils/priceResolver";
import type { PaymentSplit } from "@features/sales/components/PaymentSummary";

interface UseQuickSaleOptions {
  clientId: string;
  priceTier?: PriceTier;
  checkCreditLimit?: boolean;
}

interface BuildQuickSalePayloadOptions {
  clientId: string;
  items: QuickSaleItem[];
  total: number;
  splits: PaymentSplit[];
  priceTier?: PriceTier;
}

export function buildQuickSalePayload({
  clientId,
  items,
  total,
  splits,
  priceTier = "retail",
}: BuildQuickSalePayloadOptions) {
  const primaryMethod = splits[0]?.method || "cash";
  const totalCash = splits
    .filter((s) => s.method === "cash")
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  return {
    client: clientId,
    items: items.map((item) => ({
      product: item.product.name,
      productId: item.product._id,
      quantity: item.quantity,
      // Use presentation price scaled by tier, or resolve product tier price
      price: item.presentation?.price
        ? item.presentation.price * (resolveProductPrice(item.product, "retail") > 0 ? resolveProductPrice(item.product, item.priceTier || priceTier) / resolveProductPrice(item.product, "retail") : 1)
        : resolveProductPrice(item.product, item.priceTier || priceTier),
      ...(item.presentation ? { presentationId: item.presentation._id } : {}),
    })),
    totalAmount: total,
    status: "Confirmada",
    salesStatus: "Confirmada",
    paymentStatus: "Pagado",
    paymentMethod: primaryMethod,
    paymentSplits: splits,
    deliveryStatus: "Entregada",
    source: "Dashboard",
    notes:
      totalCash > 0
        ? `Pago rápido - Efectivo recibido: $${totalCash}`
        : `Pago rápido - ${primaryMethod}`,
  };
}

export function useQuickSale({ clientId, priceTier = "retail", checkCreditLimit = true }: UseQuickSaleOptions) {
  const [items, setItems] = useState<QuickSaleItem[]>([]);
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  // Fetch credit status if enabled and client is selected
  const { data: creditStatus } = useQuery({
    queryKey: ["quick-sale-credit", clientId],
    enabled: checkCreditLimit && Boolean(clientId) && clientId !== "",
    queryFn: async () => {
      const response = await api.get<CreditStatus>(`/clients/${clientId}/account/credit-status`);
      return response.data;
    },
    staleTime: 30_000,
  });

  const currency = settings?.currency || "USD";
  const taxRate = (settings?.taxRate || 0) / 100;

  const addItem = useCallback((product: Product, presentation?: Presentation, itemTier?: PriceTier): boolean => {
    let added = true;
    const effectiveTier = itemTier || priceTier;
    setItems((current) => {
      if (!canAddProductToCart(current, product, presentation)) {
        added = false;
        return current;
      }
      const existing = current.find(
        (item) =>
          item.product._id === product._id &&
          item.presentation?._id === presentation?._id,
      );
      if (existing) {
        return current.map((item) =>
          item.product._id === product._id &&
          item.presentation?._id === presentation?._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { product, presentation, quantity: 1, priceTier: effectiveTier }];
    });
    return added;
  }, [priceTier]);

  const updateQuantity = useCallback((productId: string, quantity: number, presentationId?: string) => {
    if (quantity <= 0) {
      setItems((current) =>
        current.filter(
          (item) =>
            !(item.product._id === productId && item.presentation?._id === presentationId),
        ),
      );
    } else {
      setItems((current) =>
        current.map((item) => {
          if (
            item.product._id !== productId ||
            item.presentation?._id !== presentationId
          )
            return item;
          const available = getAvailableStock(item.product, item.presentation);
          return { ...item, quantity: Math.min(quantity, available) };
        }),
      );
    }
  }, []);

  const removeItem = useCallback((productId: string, presentationId?: string) => {
    setItems((current) =>
      current.filter(
        (item) =>
          !(item.product._id === productId && item.presentation?._id === presentationId),
      ),
    );
  }, []);

  const updateItemTier = useCallback((productId: string, tier: PriceTier, presentationId?: string) => {
    setItems((current) =>
      current.map((item) => {
        const itemPresId = item.presentation?._id || null;
        const targetPresId = presentationId || null;
        return item.product._id === productId && itemPresId === targetPresId
          ? { ...item, priceTier: tier }
          : item;
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSplits([]);
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + ((item.presentation?.price ?? resolveProductPrice(item.product, item.priceTier || priceTier)) * item.quantity),
        0,
      ),
    [items, priceTier],
  );

  const tax = useMemo(() => subtotal * taxRate, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalSplitAmount = useMemo(
    () => splits.reduce((sum, s) => sum + (s.amount || 0), 0),
    [splits],
  );
  const remaining = total - totalSplitAmount;

  const createOrderMutation = useMutation({
    mutationFn: async (extraData?: { vouchersToGenerate?: import("@shared/types").VoucherType[] }) => {
      const orderData = buildQuickSalePayload({
        clientId,
        items,
        total,
        splits,
        priceTier,
      });
      const response = await api.post("/orders", {
        ...orderData,
        ...extraData,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    },
  });

  const stockErrors = useMemo(() => validateCartStock(items), [items]);

  // Credit limit check
  const creditCheck = useMemo(() => {
    if (!creditStatus || creditStatus.creditLimit <= 0) {
      return { isBlocked: false, isWarning: false, remainingCredit: null };
    }

    const projectedBalance = creditStatus.currentBalance + total;
    const isOverLimit = projectedBalance > creditStatus.creditLimit;
    const isNearLimit = !isOverLimit && creditStatus.utilizationPercentage >= 80;
    const remainingCredit = Math.max(0, creditStatus.creditLimit - projectedBalance);

    return {
      isBlocked: isOverLimit && settings?.blockOverCreditLimit !== false,
      isWarning: isNearLimit || isOverLimit,
      remainingCredit,
      projectedBalance,
      creditStatus,
    };
  }, [creditStatus, total, settings?.blockOverCreditLimit]);

  const canFinalize =
    items.length > 0 &&
    stockErrors.length === 0 &&
    !creditCheck.isBlocked &&
    remaining <= 0 &&
    splits.length > 0;

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    updateItemTier,
    clearCart,
    subtotal,
    tax,
    total,
    itemCount,
    splits,
    setSplits,
    remaining,
    currency,
    stockErrors,
    priceTier,
    creditCheck,
    createOrder: createOrderMutation.mutateAsync,
    orderResult: createOrderMutation.data,
    isCreating: createOrderMutation.isPending,
    canFinalize,
  };
}
