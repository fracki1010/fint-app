import { Product, Presentation } from "@/types";

export interface CartStockItem {
  product: Product;
  presentation?: Presentation;
  quantity: number;
}

export interface InvalidStockItem {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

export function getAvailableStock(product: Product, presentation?: Presentation): number {
  const baseStock = Math.max(0, Number(product.stock ?? 0));
  if (!presentation) return baseStock;
  return Math.floor(baseStock / presentation.equivalentQty);
}

export function getCartQuantity(cart: CartStockItem[], productId: string, presentationId?: string) {
  return cart
    .filter((item) => {
      if (item.product._id !== productId) return false;
      if (presentationId === undefined) return !item.presentation;
      return item.presentation?._id === presentationId;
    })
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function canAddProductToCart(cart: CartStockItem[], product: Product, presentation?: Presentation) {
  const available = getAvailableStock(product, presentation);
  const inCart = getCartQuantity(cart, product._id, presentation?._id);
  return inCart < available;
}

export function validateCartStock(cart: CartStockItem[]): InvalidStockItem[] {
  return cart
    .map((item) => {
      const available = getAvailableStock(item.product, item.presentation);
      const requested = Math.max(0, item.quantity);

      if (requested <= available) return null;

      return {
        productId: item.product._id,
        productName: item.presentation
          ? `${item.product.name} (${item.presentation.name})`
          : item.product.name,
        requested,
        available,
      };
    })
    .filter((item): item is InvalidStockItem => item !== null);
}
