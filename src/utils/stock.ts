import { Product } from "@/types";

export interface CartStockItem {
  product: Product;
  quantity: number;
}

export interface InvalidStockItem {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

export function getAvailableStock(product: Product) {
  return Math.max(0, Number(product.stock ?? 0));
}

export function getCartQuantity(cart: CartStockItem[], productId: string) {
  return cart
    .filter((item) => item.product._id === productId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function canAddProductToCart(cart: CartStockItem[], product: Product) {
  return getCartQuantity(cart, product._id) < getAvailableStock(product);
}

export function validateCartStock(cart: CartStockItem[]): InvalidStockItem[] {
  return cart
    .map((item) => {
      const available = getAvailableStock(item.product);
      const requested = Math.max(0, item.quantity);

      if (requested <= available) return null;

      return {
        productId: item.product._id,
        productName: item.product.name,
        requested,
        available,
      };
    })
    .filter((item): item is InvalidStockItem => item !== null);
}
