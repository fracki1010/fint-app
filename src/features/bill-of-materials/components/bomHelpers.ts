import { Product, BillOfMaterial } from "@shared/types";

export function getSupplyObj(
  s: unknown,
): {
  _id: string;
  name: string;
  unit?: string;
  currentStock: number;
  minStock: number;
  referenceCost: number;
} | null {
  if (s && typeof s === "object" && "_id" in (s as Record<string, unknown>))
    return s as {
      _id: string;
      name: string;
      unit?: string;
      currentStock: number;
      minStock: number;
      referenceCost: number;
    };
  return null;
}

export function getProductObj(p: Product | string | null | undefined): Product | null {
  if (p && typeof p === "object") return p as Product;
  return null;
}

export function calcBomCost(bom: BillOfMaterial) {
  const batchCost = bom.ingredients.reduce((acc, ing) => {
    const p = getProductObj(ing.product);
    if (p) {
      const pres = ing.presentationId ? p.presentations?.find((pr) => pr._id === ing.presentationId) : undefined;
      // Use presentation's own cost if available, otherwise base costPrice
      const effectiveCost = pres?.cost ?? p.costPrice ?? 0;
      return acc + ing.quantity * effectiveCost;
    }
    return acc;
  }, 0);
  const unitCost = bom.yieldQuantity > 0 ? batchCost / bom.yieldQuantity : 0;
  return { batchCost, unitCost };
}

export function stockStatusColor(available: number, needed: number) {
  if (available >= needed) return "text-success";
  if (available > 0) return "text-warning";
  return "text-danger";
}
