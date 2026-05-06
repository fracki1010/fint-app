import { describe, expect, it } from "vitest";
import { buildPurchaseItemsPayload } from "@features/purchases/hooks/usePurchases";

describe("buildPurchaseItemsPayload", () => {
  it("crea payload con productItemId para items de tipo supply (unificado)", () => {
    const items = [
      { itemKind: "supply" as const, supplyId: "s-1", productId: "", presentationId: "", quantity: "5", unitCost: "100" },
    ];

    const payload = buildPurchaseItemsPayload(items);

    expect(payload).toHaveLength(1);
    expect(payload[0].productItemId).toBe("s-1");
    expect(payload[0].quantity).toBe(5);
    expect(payload[0].unitCost).toBe(100);
    expect(payload[0].lineTotal).toBe(500);
  });

  it("crea payload con productItemId para items de tipo product", () => {
    const items = [
      { itemKind: "product" as const, supplyId: "", productId: "p-1", presentationId: "", quantity: "3", unitCost: "25000" },
    ];

    const payload = buildPurchaseItemsPayload(items);

    expect(payload).toHaveLength(1);
    expect(payload[0].productItemId).toBe("p-1");
    expect(payload[0].quantity).toBe(3);
    expect(payload[0].unitCost).toBe(25000);
    expect(payload[0].lineTotal).toBe(75000);
  });

  it("incluye presentationId cuando está presente", () => {
    const items = [
      { itemKind: "product" as const, supplyId: "", productId: "p-1", presentationId: "pres-1", quantity: "3", unitCost: "25000" },
    ];

    const payload = buildPurchaseItemsPayload(items);

    expect(payload).toHaveLength(1);
    expect(payload[0].productItemId).toBe("p-1");
    expect(payload[0].presentationId).toBe("pres-1");
  });

  it("filtra items sin id (supplyId o productId segun tipo)", () => {
    const items = [
      { itemKind: "supply" as const, supplyId: "", productId: "", presentationId: "", quantity: "5", unitCost: "100" },
      { itemKind: "product" as const, supplyId: "", productId: "p-1", presentationId: "", quantity: "2", unitCost: "50" },
    ];

    const payload = buildPurchaseItemsPayload(items);

    expect(payload).toHaveLength(1);
    expect(payload[0].productItemId).toBe("p-1");
  });

  it("filtra items con quantity zero o negativa", () => {
    const items = [
      { itemKind: "supply" as const, supplyId: "s-1", productId: "", presentationId: "", quantity: "0", unitCost: "100" },
      { itemKind: "supply" as const, supplyId: "s-2", productId: "", presentationId: "", quantity: "-1", unitCost: "50" },
      { itemKind: "supply" as const, supplyId: "s-3", productId: "", presentationId: "", quantity: "5", unitCost: "0" },
    ];

    const payload = buildPurchaseItemsPayload(items);

    expect(payload).toHaveLength(1);
    expect(payload[0].productItemId).toBe("s-3");
  });

  it("retorna array vacio si no hay items validos", () => {
    const items = [
      { itemKind: "supply" as const, supplyId: "", productId: "", presentationId: "", quantity: "0", unitCost: "0" },
    ];

    const payload = buildPurchaseItemsPayload(items);

    expect(payload).toHaveLength(0);
  });
});
