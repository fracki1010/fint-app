import { describe, expect, it } from "vitest";

import {
  canAddProductToCart,
  getAvailableStock,
  getCartQuantity,
  validateCartStock,
} from "@/utils/stock";
import { Product } from "@/types";

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: overrides._id || "p-1",
    name: overrides.name || "Producto",
    price: overrides.price ?? 100,
    stock: overrides.stock ?? 0,
    ...overrides,
  };
}

describe("stock utils", () => {
  it("normaliza stock a cero cuando es negativo", () => {
    const product = buildProduct({ stock: -4 });

    expect(getAvailableStock(product)).toBe(0);
  });

  it("calcula cantidad existente en carrito", () => {
    const product = buildProduct({ _id: "p-1" });

    const quantity = getCartQuantity(
      [
        { product, quantity: 2 },
        { product, quantity: 1 },
      ],
      "p-1",
    );

    expect(quantity).toBe(3);
  });

  it("bloquea agregar cuando ya se alcanzo el stock maximo", () => {
    const product = buildProduct({ _id: "p-2", stock: 2 });

    const canAdd = canAddProductToCart([{ product, quantity: 2 }], product);

    expect(canAdd).toBe(false);
  });

  it("detecta items del carrito que exceden stock", () => {
    const valid = buildProduct({ _id: "ok", name: "OK", stock: 5 });
    const invalid = buildProduct({ _id: "bad", name: "BAD", stock: 1 });

    const result = validateCartStock([
      { product: valid, quantity: 3 },
      { product: invalid, quantity: 2 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      productId: "bad",
      productName: "BAD",
      requested: 2,
      available: 1,
    });
  });
});
