import { Product, Recipe } from "@shared/types";

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

export function calcRecipeCost(recipe: Recipe) {
  const batchCost = recipe.ingredients.reduce((acc, ing) => {
    const p = getProductObj(ing.product);
    if (p && p.costPrice) {
      return acc + ing.quantity * p.costPrice;
    }
    const s = getSupplyObj(ing.supply);
    if (s && s.referenceCost) {
      return acc + ing.quantity * s.referenceCost;
    }
    return acc;
  }, 0);
  const unitCost = recipe.yieldQuantity > 0 ? batchCost / recipe.yieldQuantity : 0;
  return { batchCost, unitCost };
}

export function stockStatusColor(available: number, needed: number) {
  if (available >= needed) return "text-success";
  if (available > 0) return "text-warning";
  return "text-danger";
}
