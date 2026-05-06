import { ChefHat, AlertCircle, ArrowRight } from "lucide-react";

import { Recipe } from "@shared/types";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getProductObj, getSupplyObj, calcRecipeCost } from "./recipeHelpers";

interface RecipeListItemProps {
  recipe: Recipe;
  currency: string;
  onClick: (recipe: Recipe) => void;
}

export function RecipeListItem({ recipe, currency, onClick }: RecipeListItemProps) {
  const prod = getProductObj(recipe.product);
  const anyShortage = recipe.ingredients.some((ing) => {
    const p = getProductObj(ing.product);
    if (p) return p.stock < ing.quantity;
    const s = getSupplyObj(ing.supply);
    return s && s.currentStock < ing.quantity;
  });
  const { batchCost, unitCost } = calcRecipeCost(recipe);

  return (
    <button
      className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-content2 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
      type="button"
      onClick={() => onClick(recipe)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <ChefHat size={16} className="text-primary" />
        </div>
        {anyShortage && (
          <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
            <AlertCircle size={10} />
            Stock bajo
          </span>
        )}
      </div>

      <div>
        <p className="font-bold text-foreground">{recipe.name}</p>
        {prod && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-default-400">
            <ArrowRight size={10} />
            {prod.name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-default-400">
        <span>
          {recipe.ingredients.length} ingrediente
          {recipe.ingredients.length !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>Rinde {recipe.yieldQuantity} ud.</span>
      </div>

      {batchCost > 0 && (
        <div className="flex items-center justify-between border-t border-white/8 pt-2 text-[11px]">
          <span className="text-default-400">Costo/unidad</span>
          <span className="font-bold text-primary">
            {formatCompactCurrency(unitCost, currency)}
          </span>
        </div>
      )}
    </button>
  );
}
