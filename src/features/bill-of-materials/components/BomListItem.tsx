import { ChefHat, AlertCircle, ArrowRight } from "lucide-react";

import { BillOfMaterial } from "@shared/types";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getProductObj, getSupplyObj, calcBomCost } from "./bomHelpers";

interface BomListItemProps {
  bom: BillOfMaterial;
  currency: string;
  onClick: (bom: BillOfMaterial) => void;
}

export function BomListItem({ bom, currency, onClick }: BomListItemProps) {
  const prod = getProductObj(bom.product);
  const anyShortage = bom.ingredients.some((ing) => {
    const p = getProductObj(ing.product);
    if (p) return p.stock < ing.quantity;
    const s = getSupplyObj(ing.supply);
    return s && s.currentStock < ing.quantity;
  });
  const { batchCost, unitCost } = calcBomCost(bom);

  return (
    <button
      className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-content2 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
      type="button"
      onClick={() => onClick(bom)}
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
        <p className="font-bold text-foreground">{bom.name}</p>
        {prod && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-default-400">
            <ArrowRight size={10} />
            {prod.name}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-default-400">
        <span>
          {bom.ingredients.length} ingrediente
          {bom.ingredients.length !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>Rinde {bom.yieldQuantity} ud.</span>
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
