import { describe, expect, it } from "vitest";

import { buildQuickSalePayload } from "@features/sales/hooks/useQuickSale";
import { Product, Presentation, QuickSaleItem, PriceTiers } from "@shared/types";

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

describe("buildQuickSalePayload", () => {
  it("incluye presentationId en el payload cuando el item tiene presentacion", () => {
    const product = buildProduct({ _id: "p-1", name: "Alimento", price: 10 });
    const presentation = buildPresentation({ _id: "pres-1", price: 100 });
    const items: QuickSaleItem[] = [
      { product, presentation, quantity: 3 },
    ];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 300,
      paymentMethod: "cash",
      cashReceived: 300,
    });

    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].presentationId).toBe("pres-1");
    expect(payload.items[0].price).toBe(100);
    expect(payload.items[0].quantity).toBe(3);
  });

  it("no incluye presentationId cuando el item no tiene presentacion", () => {
    const product = buildProduct({ _id: "p-1", name: "Simple", price: 50 });
    const items: QuickSaleItem[] = [{ product, quantity: 2 }];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 100,
      paymentMethod: "cash",
      cashReceived: 100,
    });

    expect(payload.items[0]).not.toHaveProperty("presentationId");
    expect(payload.items[0].price).toBe(50);
  });

  it("usa precio de producto como fallback cuando no hay presentacion", () => {
    const product = buildProduct({ _id: "p-2", name: "Otro", price: 75 });
    const items: QuickSaleItem[] = [{ product, quantity: 1 }];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 75,
      paymentMethod: "transfer",
      cashReceived: 0,
    });

    expect(payload.items[0].price).toBe(75);
    expect(payload.notes).toBe("Pago rápido - transfer");
  });

  it("genera nota de efectivo cuando hay pago en cash", () => {
    const product = buildProduct({ _id: "p-1", name: "Alimento", price: 10 });
    const items: QuickSaleItem[] = [{ product, quantity: 1 }];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 10,
      paymentMethod: "cash",
      cashReceived: 20,
    });

    expect(payload.notes).toBe("Pago rápido - Efectivo recibido: $20");
  });

  it("incluye multiples items con y sin presentacion", () => {
    const productA = buildProduct({ _id: "p-a", name: "A", price: 10 });
    const productB = buildProduct({ _id: "p-b", name: "B", price: 20 });
    const presB = buildPresentation({ _id: "pres-b", price: 180 });
    const items: QuickSaleItem[] = [
      { product: productA, quantity: 1 },
      { product: productB, presentation: presB, quantity: 2 },
    ];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 370,
      paymentMethod: "cash",
      cashReceived: 400,
    });

    expect(payload.items).toHaveLength(2);
    expect(payload.items[0]).not.toHaveProperty("presentationId");
    expect(payload.items[1].presentationId).toBe("pres-b");
  });

  it("usa precio de tier mayorista cuando se especifica", () => {
    const priceTiers: PriceTiers = {
      retail: 100,
      wholesale: 80,
      distributor: 60,
    };
    const product = buildProduct({ _id: "p-1", name: "Producto", price: 100, priceTiers });
    const items: QuickSaleItem[] = [{ product, quantity: 2 }];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 160,
      paymentMethod: "cash",
      cashReceived: 200,
      priceTier: "wholesale",
    });

    expect(payload.items[0].price).toBe(80);
  });

  it("usa precio de tier distribuidor cuando se especifica", () => {
    const priceTiers: PriceTiers = {
      retail: 100,
      wholesale: 80,
      distributor: 60,
    };
    const product = buildProduct({ _id: "p-1", name: "Producto", price: 100, priceTiers });
    const items: QuickSaleItem[] = [{ product, quantity: 1 }];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 60,
      paymentMethod: "transfer",
      cashReceived: 0,
      priceTier: "distributor",
    });

    expect(payload.items[0].price).toBe(60);
  });

  it("hace fallback a retail cuando el tier solicitado no existe", () => {
    const priceTiers: PriceTiers = {
      retail: 100,
    };
    const product = buildProduct({ _id: "p-1", name: "Producto", price: 100, priceTiers });
    const items: QuickSaleItem[] = [{ product, quantity: 1 }];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 100,
      paymentMethod: "cash",
      cashReceived: 100,
      priceTier: "wholesale", // Tier not available
    });

    expect(payload.items[0].price).toBe(100); // Falls back to retail
  });

  it("hace fallback a legacy price cuando no hay tiers definidos", () => {
    const product = buildProduct({ _id: "p-1", name: "Producto", price: 150 });
    const items: QuickSaleItem[] = [{ product, quantity: 1 }];

    const payload = buildQuickSalePayload({
      clientId: "client-1",
      items,
      total: 150,
      paymentMethod: "cash",
      cashReceived: 150,
      priceTier: "wholesale",
    });

    expect(payload.items[0].price).toBe(150); // Uses legacy price
  });
});
