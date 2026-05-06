import { describe, expect, it } from "vitest";

import {
  canAddProductToCart,
  getAvailableStock,
  getCartQuantity,
  validateCartStock,
} from "@features/products/utils/stock";
import { Product, Presentation } from "@shared/types";

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: overrides._id || "p-1",
    name: overrides.name || "Producto",
    price: overrides.price ?? 100,
    stock: overrides.stock ?? 0,
    ...overrides,
  };
}

function buildPresentation(overrides: Partial<Presentation> = {}): Presentation {
  return {
    _id: overrides._id || "pres-1",
    name: overrides.name || "Bolsa 20kg",
    unitOfMeasure: overrides.unitOfMeasure || "kg",
    price: overrides.price ?? 80,
    equivalentQty: overrides.equivalentQty ?? 20,
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

  describe("getAvailableStock with presentation", () => {
    it("devuelve 5 cuando stock es 100kg y presentacion equivalentQty=20", () => {
      const product = buildProduct({ stock: 100, unitOfMeasure: "kg" });
      const presentation = buildPresentation({ equivalentQty: 20 });

      expect(getAvailableStock(product, presentation)).toBe(5);
    });

    it("devuelve 0 cuando stock es 15kg y presentacion equivalentQty=20", () => {
      const product = buildProduct({ stock: 15, unitOfMeasure: "kg" });
      const presentation = buildPresentation({ equivalentQty: 20 });

      expect(getAvailableStock(product, presentation)).toBe(0);
    });

    it("sin presentacion mantiene comportamiento actual", () => {
      const product = buildProduct({ stock: 42 });

      expect(getAvailableStock(product)).toBe(42);
    });

    it("producto stock negativo devuelve 0", () => {
      const product = buildProduct({ stock: -10 });

      expect(getAvailableStock(product)).toBe(0);
    });

    it("producto stock negativo con presentacion devuelve 0", () => {
      const product = buildProduct({ stock: -10 });
      const presentation = buildPresentation({ equivalentQty: 5 });

      expect(getAvailableStock(product, presentation)).toBe(0);
    });

    it("producto stock 0 con presentacion devuelve 0", () => {
      const product = buildProduct({ stock: 0 });
      const presentation = buildPresentation({ equivalentQty: 10 });

      expect(getAvailableStock(product, presentation)).toBe(0);
    });
  });

  describe("canAddProductToCart with presentation", () => {
    it("permite agregar cuando hay stock suficiente para presentacion", () => {
      const product = buildProduct({ _id: "p-1", stock: 100 });
      const presentation = buildPresentation({ _id: "pres-1", equivalentQty: 20 });

      const canAdd = canAddProductToCart([], product, presentation);
      expect(canAdd).toBe(true);
    });

    it("bloquea cuando se alcanzo el maximo de presentaciones", () => {
      const product = buildProduct({ _id: "p-1", stock: 100 });
      const presentation = buildPresentation({ _id: "pres-1", equivalentQty: 20 });

      const canAdd = canAddProductToCart(
        [{ product, presentation, quantity: 5 }],
        product,
        presentation,
      );
      expect(canAdd).toBe(false);
    });
  });

  describe("validateCartStock with presentation", () => {
    it("detecta item con presentacion que excede stock disponible", () => {
      const product = buildProduct({ _id: "p-1", name: "Arroz", stock: 100 });
      const presentation = buildPresentation({ _id: "pres-1", name: "Bolsa 20kg", equivalentQty: 20 });

      const result = validateCartStock([
        { product, presentation, quantity: 6 },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        productId: "p-1",
        productName: "Arroz (Bolsa 20kg)",
        requested: 6,
        available: 5,
      });
    });
  });
});
