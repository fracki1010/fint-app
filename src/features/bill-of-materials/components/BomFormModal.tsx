import { useMemo, useState } from "react";
import { Plus, Loader2, X, ChefHat } from "lucide-react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Select, SelectItem } from "@heroui/select";

import { Product, BillOfMaterial } from "@shared/types";
import { getProductObj, getSupplyObj } from "./bomHelpers";

// ── Types ─────────────────────────────────────────────────────────────

export type IngRow = { productId: string; presentationId: string; quantity: string };

export const emptyRow = (): IngRow => ({ productId: "", presentationId: "", quantity: "" });

export type BomFormState = {
  name: string;
  productId: string;
  presentationId: string;
  yieldQuantity: string;
  notes: string;
  ingredients: IngRow[];
};

export const emptyForm = (): BomFormState => ({
  name: "",
  productId: "",
  presentationId: "",
  yieldQuantity: "1",
  notes: "",
  ingredients: [emptyRow()],
});

export function bomToForm(bom: BillOfMaterial): BomFormState {
  const prod = getProductObj(bom.product);
  return {
    name: bom.name,
    productId: prod?._id || "",
    presentationId: bom.presentationId || "",
    yieldQuantity: String(bom.yieldQuantity),
    notes: bom.notes || "",
    ingredients: bom.ingredients.map((ing) => {
      const p = getProductObj(ing.product);
      if (p) return { productId: p._id, presentationId: ing.presentationId || "", quantity: String(ing.quantity) };
      const s = getSupplyObj(ing.supply);
      return {
        productId: String(s?._id ?? (typeof ing.supply === "string" ? ing.supply : "")),
        presentationId: ing.presentationId || "",
        quantity: String(ing.quantity),
      };
    }),
  };
}

// ── Component ─────────────────────────────────────────────────────────

export function BomForm({
  mode,
  initial,
  products,
  isDesktop,
  submitting,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: BomFormState;
  products: Product[];
  isDesktop: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (f: BomFormState) => void;
}) {
  const [form, setForm] = useState<BomFormState>(initial ?? emptyForm());

  const rawMaterials = useMemo(() => products.filter((p) => p.type === "raw_material"), [products]);
  const finishedProducts = useMemo(() => products.filter((p) => p.type === "finished" || p.type === "both"), [products]);

  // Presentations for the selected finished product
  const selectedProduct = useMemo(() => products.find((p) => p._id === form.productId), [products, form.productId]);
  const productPres = useMemo(
    () => selectedProduct?.presentations?.filter((p) => p.isActive !== false) || [],
    [selectedProduct],
  );

  // Memoize ingredient products for presentation lookups
  const ingProducts = useMemo(
    () => new Map(form.ingredients.map((ing) => [ing.productId, products.find((p) => p._id === ing.productId)])),
    [form.ingredients, products],
  );

  const set = <K extends keyof BomFormState>(k: K, v: BomFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setIng = (i: number, field: keyof IngRow, val: string) =>
    setForm((p) => {
      const rows = [...p.ingredients];
      rows[i] = { ...rows[i], [field]: val };
      // Reset presentation when product changes
      if (field === "productId") rows[i].presentationId = "";
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
    form.ingredients.every((r) => r.productId && parseFloat(r.quantity) > 0) && (() => {
      // If a finished product with presentations is selected, a presentation must be chosen
      if (form.productId && productPres.length > 0 && !form.presentationId) return false;
      // For ingredients with presentations, a presentation must be chosen
      for (const ing of form.ingredients) {
        const p = ingProducts.get(ing.productId);
        const activePres = p?.presentations?.filter((pr) => pr.isActive !== false) || [];
        if (ing.productId && activePres.length > 0 && !ing.presentationId) return false;
      }
      return true;
    })();

  return (
    <div className={`flex flex-col ${isDesktop ? "w-[520px]" : "h-full"} bg-content1`}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-base font-bold">
            {mode === "create" ? "Nueva Lista de Materiales" : "Editar Lista de Materiales"}
          </p>
          <p className="text-xs text-default-400">
            {mode === "create" ? "Definí los ingredientes" : "Modificá la lista"}
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
            <Autocomplete
              aria-label="Producto final"
              classNames={{ base: "w-full", listboxWrapper: "bg-content1" }}
              defaultItems={finishedProducts}
              inputValue={selectedProduct?.name || ""}
              placeholder="Buscar producto terminado..."
              size="sm"
              variant="bordered"
              onSelectionChange={(key) => {
                set("productId", String(key || ""));
                set("presentationId", "");
              }}
            >
              {(p) => (
                <AutocompleteItem key={p._id} textValue={p.name}>
                  <div className="flex items-center justify-between gap-3">
                    <span>{p.name}</span>
                    <span className="shrink-0 text-[11px] text-default-400">{p.sku ? p.sku : ""}</span>
                  </div>
                </AutocompleteItem>
              )}
            </Autocomplete>
            {productPres.length > 0 && (
              <div className="mt-1.5">
                <Select
                  aria-label="Presentación"
                  placeholder="Seleccionar presentación..."
                  classNames={{
                    base: "w-full",
                    trigger: "min-h-[36px] rounded-lg border-divider/20 bg-content2/40 px-3 text-xs text-foreground",
                    value: "text-foreground font-medium",
                    popoverContent: "bg-content1 text-foreground",
                  }}
                  selectedKeys={form.presentationId ? [form.presentationId] : []}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) => set("presentationId", Array.from(keys)[0] as string || "")}
                >
                  {productPres.map((pr) => (
                    <SelectItem key={pr._id} textValue={pr.name}>
                      <span>{pr.name}</span>
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}
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

          {form.ingredients.map((row, i) => {
            const ingProduct = ingProducts.get(row.productId);
            const ingPres = ingProduct?.presentations?.filter((p) => p.isActive !== false) || [];
            return (
              <div key={i} className="rounded-xl border border-divider/20 bg-content2/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Autocomplete
                      aria-label="Ingrediente"
                      classNames={{ base: "w-full", listboxWrapper: "bg-content1" }}
                      defaultItems={rawMaterials}
                      inputValue={ingProduct?.name || ""}
                      placeholder="Buscar materia prima..."
                      size="sm"
                      variant="bordered"
                      onSelectionChange={(key) => setIng(i, "productId", String(key || ""))}
                    >
                      {(p) => (
                        <AutocompleteItem key={p._id} textValue={p.name}>
                          <div className="flex items-center justify-between gap-3">
                            <span>{p.name}</span>
                            <span className="shrink-0 text-[11px] text-default-400">{p.sku ? p.sku : ""}</span>
                          </div>
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  </div>
                  <input
                    className="w-24 shrink-0 rounded-xl border border-white/10 bg-content2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    min="0" placeholder="Cant." step="0.01" type="number"
                    value={row.quantity}
                    onChange={(e) => setIng(i, "quantity", e.target.value)}
                  />
                  {form.ingredients.length > 1 && (
                    <button
                      className="shrink-0 rounded-lg p-1.5 text-danger/60 transition hover:bg-danger/10 hover:text-danger"
                      type="button" onClick={() => removeRow(i)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {ingPres.length > 0 && (
                  <Select
                    aria-label="Presentación del ingrediente"
                    placeholder="Seleccionar presentación..."
                    classNames={{
                      base: "w-full",
                      trigger: "min-h-[34px] rounded-lg border-divider/20 bg-content2/40 px-3 text-xs text-foreground",
                      value: "text-foreground font-medium",
                      popoverContent: "bg-content1 text-foreground",
                    }}
                    selectedKeys={row.presentationId ? [row.presentationId] : []}
                    size="sm"
                    variant="bordered"
                    onSelectionChange={(keys) => setIng(i, "presentationId", Array.from(keys)[0] as string || "")}
                  >
                    {ingPres.map((pr) => (
                      <SelectItem key={pr._id} textValue={pr.name}>
                        <span>{pr.name}</span>
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>
            );
          })}
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
          {mode === "create" ? "Crear Lista de Materiales" : "Guardar Cambios"}
        </button>
      </form>
    </div>
  );
}
