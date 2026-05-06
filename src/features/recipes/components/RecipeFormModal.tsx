import { useMemo, useState } from "react";
import { Plus, Loader2, X, ChefHat } from "lucide-react";

import { Product, Recipe } from "@shared/types";
import { getProductObj, getSupplyObj } from "./recipeHelpers";

// ── Types ─────────────────────────────────────────────────────────────

export type IngRow = { productId: string; quantity: string };

export const emptyRow = (): IngRow => ({ productId: "", quantity: "" });

export type RecipeFormState = {
  name: string;
  productId: string;
  yieldQuantity: string;
  notes: string;
  ingredients: IngRow[];
};

export const emptyForm = (): RecipeFormState => ({
  name: "",
  productId: "",
  yieldQuantity: "1",
  notes: "",
  ingredients: [emptyRow()],
});

export function recipeToForm(r: Recipe): RecipeFormState {
  const prod = getProductObj(r.product);
  return {
    name: r.name,
    productId: prod?._id || "",
    yieldQuantity: String(r.yieldQuantity),
    notes: r.notes || "",
    ingredients: r.ingredients.map((ing) => {
      const p = getProductObj(ing.product);
      if (p) return { productId: p._id, quantity: String(ing.quantity) };
      const s = getSupplyObj(ing.supply);
      return {
        productId: String(s?._id ?? (typeof ing.supply === "string" ? ing.supply : "")),
        quantity: String(ing.quantity),
      };
    }),
  };
}

// ── Component ─────────────────────────────────────────────────────────

export function RecipeForm({
  mode,
  initial,
  products,
  isDesktop,
  submitting,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: RecipeFormState;
  products: Product[];
  isDesktop: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (f: RecipeFormState) => void;
}) {
  const [form, setForm] = useState<RecipeFormState>(initial ?? emptyForm());

  const rawMaterials = useMemo(() => products.filter((p) => p.type === "raw_material"), [products]);

  const set = <K extends keyof RecipeFormState>(k: K, v: RecipeFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setIng = (i: number, field: keyof IngRow, val: string) =>
    setForm((p) => {
      const rows = [...p.ingredients];
      rows[i] = { ...rows[i], [field]: val };
      return { ...p, ingredients: rows };
    });

  const addRow = () => setForm((p) => ({ ...p, ingredients: [...p.ingredients, emptyRow()] }));

  const removeRow = (i: number) =>
    setForm((p) => ({ ...p, ingredients: p.ingredients.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-content2 px-3 py-2 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40";

  const isValid =
    form.name.trim() &&
    form.ingredients.length > 0 &&
    form.ingredients.every((r) => r.productId && parseFloat(r.quantity) > 0);

  return (
    <div className={`flex flex-col ${isDesktop ? "w-[520px]" : "h-full"} bg-content1`}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-base font-bold">
            {mode === "create" ? "Nueva Receta" : "Editar Receta"}
          </p>
          <p className="text-xs text-default-400">
            {mode === "create" ? "Definí los ingredientes" : "Modificá la receta"}
          </p>
        </div>
        <button
          className="rounded-full p-1 text-default-400 hover:text-foreground transition"
          type="button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <form className="flex flex-1 flex-col gap-5 overflow-y-auto p-5" onSubmit={handleSubmit}>
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">NOMBRE *</label>
          <input
            required
            className={inputCls}
            placeholder="Ej: Torta de chocolate"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        {/* Product + Yield */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-default-500">PRODUCTO FINAL</label>
            <select
              className={inputCls}
              value={form.productId}
              onChange={(e) => set("productId", e.target.value)}
            >
              <option value="">Sin vincular</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-default-500">RINDE (unidades)</label>
            <input
              className={inputCls}
              min="0"
              step="0.01"
              type="number"
              value={form.yieldQuantity}
              onChange={(e) => set("yieldQuantity", e.target.value)}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-default-500">INGREDIENTES *</label>
            <button
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary transition hover:bg-primary/20"
              type="button"
              onClick={addRow}
            >
              <Plus size={12} />
              Agregar
            </button>
          </div>

          {form.ingredients.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                className={`${inputCls} flex-1`}
                value={row.productId}
                onChange={(e) => setIng(i, "productId", e.target.value)}
              >
                <option value="">Seleccionar insumo...</option>
                {rawMaterials.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.unitOfMeasure || "unidad"})
                  </option>
                ))}
              </select>
              <input
                className="w-24 shrink-0 rounded-xl border border-white/10 bg-content2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                min="0"
                placeholder="Cant."
                step="0.01"
                type="number"
                value={row.quantity}
                onChange={(e) => setIng(i, "quantity", e.target.value)}
              />
              {form.ingredients.length > 1 && (
                <button
                  className="shrink-0 rounded-lg p-1.5 text-danger/60 transition hover:bg-danger/10 hover:text-danger"
                  type="button"
                  onClick={() => removeRow(i)}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">NOTAS</label>
          <textarea
            className={`${inputCls} resize-none`}
            placeholder="Instrucciones, temperatura, tiempo..."
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <button
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
          disabled={submitting || !isValid}
          type="submit"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <ChefHat size={16} />}
          {mode === "create" ? "Crear Receta" : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}
