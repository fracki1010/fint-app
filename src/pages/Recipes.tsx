import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Loader2,
  X,
  ChefHat,
  Pencil,
  Trash2,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRight,
  History,
  ClipboardList,
} from "lucide-react";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useRecipes, useProductionLogs, CreateRecipePayload, UpdateRecipePayload } from "@/hooks/useRecipes";
import { useProducts } from "@/hooks/useProducts";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { Recipe, Product, ProductionLog } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { getErrorMessage } from "@/utils/errors";
import { formatCurrency, formatCompactCurrency } from "@/utils/currency";

// ── Helpers ───────────────────────────────────────────────────────────

function getSupplyObj(s: unknown): { _id: string; name: string; unit?: string; currentStock: number; minStock: number; referenceCost: number } | null {
  if (s && typeof s === "object" && "_id" in (s as Record<string, unknown>)) return s as { _id: string; name: string; unit?: string; currentStock: number; minStock: number; referenceCost: number };
  return null;
}

function getProductObj(p: Product | string | null | undefined): Product | null {
  if (p && typeof p === "object") return p as Product;
  return null;
}

function calcRecipeCost(recipe: Recipe) {
  const batchCost = recipe.ingredients.reduce((acc, ing) => {
    // Try product first (new)
    const p = getProductObj(ing.product);
    if (p && p.costPrice) {
      return acc + ing.quantity * p.costPrice;
    }
    // Legacy fallback
    const s = getSupplyObj(ing.supply);
    if (s && s.referenceCost) {
      return acc + ing.quantity * s.referenceCost;
    }
    return acc;
  }, 0);
  const unitCost = recipe.yieldQuantity > 0 ? batchCost / recipe.yieldQuantity : 0;
  return { batchCost, unitCost };
}

function stockStatusColor(available: number, needed: number) {
  if (available >= needed) return "text-success";
  if (available > 0) return "text-warning";
  return "text-danger";
}

// ── Ingredient row in the form ────────────────────────────────────────

type IngRow = { productId: string; quantity: string };

const emptyRow = (): IngRow => ({ productId: "", quantity: "" });

// ── Recipe form ───────────────────────────────────────────────────────

type RecipeFormState = {
  name: string;
  productId: string;
  yieldQuantity: string;
  notes: string;
  ingredients: IngRow[];
};

const emptyForm = (): RecipeFormState => ({
  name: "",
  productId: "",
  yieldQuantity: "1",
  notes: "",
  ingredients: [emptyRow()],
});

function recipeToForm(r: Recipe): RecipeFormState {
  const prod = getProductObj(r.product);
  return {
    name: r.name,
    productId: prod?._id || "",
    yieldQuantity: String(r.yieldQuantity),
    notes: r.notes || "",
    ingredients: r.ingredients.map((ing) => {
      // Try product first (new)
      const p = getProductObj(ing.product);
      if (p) return { productId: p._id, quantity: String(ing.quantity) };
      // Legacy fallback
      const s = getSupplyObj(ing.supply);
      return { productId: String(s?._id ?? (typeof ing.supply === "string" ? ing.supply : "")), quantity: String(ing.quantity) };
    }),
  };
}

function RecipeForm({
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
            <label className="text-xs font-semibold text-default-500">
              INGREDIENTES *
            </label>
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

// ── Produce form ──────────────────────────────────────────────────────

function ProduceView({
  recipe,
  isDesktop,
  submitting,
  onBack,
  onProduce,
}: {
  recipe: Recipe;
  isDesktop: boolean;
  submitting: boolean;
  onBack: () => void;
  onProduce: (batches: number, notes: string) => void;
}) {
  const [batches, setBatches] = useState("1");
  const [notes, setNotes] = useState("");

  const qty = Math.max(1, parseInt(batches) || 1);

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-content2 px-3 py-2 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40";

  const hasShortage = recipe.ingredients.some((ing) => {
    // Try product first (new)
    const p = getProductObj(ing.product);
    if (p) return p.stock < ing.quantity * qty;
    // Legacy fallback
    const s = getSupplyObj(ing.supply);
    if (!s) return false;
    return s.currentStock < ing.quantity * qty;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProduce(qty, notes);
  };

  return (
    <div className={`flex flex-col ${isDesktop ? "w-[480px]" : "h-full"} bg-content1`}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <button
            className="mb-0.5 text-xs text-default-400 hover:text-foreground transition"
            type="button"
            onClick={onBack}
          >
            ← Volver
          </button>
          <p className="text-base font-bold">Producir</p>
          <p className="text-xs text-default-400">{recipe.name}</p>
        </div>
        <button
          className="rounded-full p-1 text-default-400 hover:text-foreground transition"
          type="button"
          onClick={onBack}
        >
          <X size={18} />
        </button>
      </div>

      <form className="flex flex-1 flex-col gap-5 overflow-y-auto p-5" onSubmit={handleSubmit}>
        {/* Batch quantity */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">CANTIDAD DE LOTES</label>
          <input
            className={inputCls}
            min="1"
            step="1"
            type="number"
            value={batches}
            onChange={(e) => setBatches(e.target.value)}
          />
          <p className="text-[11px] text-default-400">
            Producirá {(recipe.yieldQuantity * qty).toLocaleString("es-AR")} unidad
            {recipe.yieldQuantity * qty !== 1 ? "es" : ""}
          </p>
        </div>

        {/* Stock check */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-default-500">VERIFICACIÓN DE STOCK</p>
          <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-content2 p-3">
            {recipe.ingredients.map((ing, i) => {
              // Try product first (new)
              const p = getProductObj(ing.product);
              const s = getSupplyObj(ing.supply);
              const name = p?.name || s?.name || "Insumo";
              const stock = p?.stock ?? s?.currentStock ?? 0;
              const unit = p?.unitOfMeasure || s?.unit || "unidad";
              if (!p && !s) return null;
              const needed = ing.quantity * qty;
              const ok = stock >= needed;
              return (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    {ok ? (
                      <CheckCircle2 className="shrink-0 text-success" size={14} />
                    ) : (
                      <AlertCircle className="shrink-0 text-danger" size={14} />
                    )}
                    <span className="truncate text-foreground">{name}</span>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${stockStatusColor(stock, needed)}`}>
                    {stock.toLocaleString("es-AR")} / {needed.toLocaleString("es-AR")} {unit}
                  </span>
                </div>
              );
            })}
          </div>
          {hasShortage && (
            <p className="flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={12} />
              Stock insuficiente para algunos ingredientes
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">NOTAS (opcional)</label>
          <input
            className={inputCls}
            placeholder="Observaciones de esta producción..."
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-bold text-white transition hover:bg-success/90 disabled:opacity-50"
          disabled={submitting || hasShortage}
          type="submit"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <FlaskConical size={16} />
          )}
          Confirmar Producción
        </button>
      </form>
    </div>
  );
}

// ── Recipe detail drawer ──────────────────────────────────────────────

type DetailView = "detail" | "produce" | "edit";

function RecipeDrawer({
  recipe,
  products,
  isOpen,
  isDesktop,
  currency,
  onClose,
  onDeleted,
  onUpdated,
}: {
  recipe: Recipe | null;
  products: Product[];
  isOpen: boolean;
  isDesktop: boolean;
  currency: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onUpdated: (r: Recipe) => void;
}) {
  const { showToast } = useAppToast();
  const { updateRecipe, deleteRecipe, produceRecipe, isUpdating, isDeleting, isProducing } =
    useRecipes({ enabled: false });
  const [view, setView] = useState<DetailView>("detail");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!recipe) return null;

  const linkedProduct = getProductObj(recipe.product);

  const handleProduce = async (batches: number, notes: string) => {
    try {
      const result = await produceRecipe({ id: recipe._id, data: { quantity: batches, notes } });
      showToast({
        variant: "success",
        message: `Producción confirmada: ${result.unitsProduced} unidad${result.unitsProduced !== 1 ? "es" : ""}`,
      });
      setView("detail");
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Error al producir");
      showToast({ variant: "error", message: msg });
    }
  };

  const handleUpdate = async (form: ReturnType<typeof recipeToForm>) => {
    try {
      const payload: UpdateRecipePayload = {
        name: form.name.trim(),
        productId: form.productId || null,
        yieldQuantity: parseFloat(form.yieldQuantity) || 1,
        notes: form.notes,
        ingredients: form.ingredients
          .filter((r) => r.productId && parseFloat(r.quantity) > 0)
          .map((r) => ({ product: r.productId, quantity: parseFloat(r.quantity) })),
      };
      const updated = await updateRecipe({ id: recipe._id, data: payload });
      showToast({ variant: "success", message: "Receta actualizada" });
      onUpdated(updated);
      setView("detail");
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al actualizar") });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRecipe(recipe._id);
      showToast({ variant: "success", message: "Receta eliminada" });
      onDeleted(recipe._id);
      onClose();
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al eliminar") });
    }
  };

  const handleClose = () => {
    setView("detail");
    setConfirmDelete(false);
    onClose();
  };

  const content = (() => {
    if (view === "produce") {
      return (
        <ProduceView
          isDesktop={isDesktop}
          recipe={recipe}
          submitting={isProducing}
          onBack={() => setView("detail")}
          onProduce={handleProduce}
        />
      );
    }

    if (view === "edit") {
      return (
        <RecipeForm
          isDesktop={isDesktop}
          initial={recipeToForm(recipe)}
          mode="edit"
          products={products}
          submitting={isUpdating}
          onClose={() => setView("detail")}
          onSubmit={handleUpdate}
        />
      );
    }

    // Detail view
    const { batchCost, unitCost } = calcRecipeCost(recipe);

    return (
      <div className={`flex flex-col ${isDesktop ? "w-[480px]" : "h-full"} bg-content1`}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-base font-bold">{recipe.name}</p>
            {linkedProduct && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-default-400">
                <ArrowRight size={10} />
                <span>{linkedProduct.name}</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  rinde {recipe.yieldQuantity}
                </span>
              </div>
            )}
          </div>
          <button
            className="rounded-full p-1 text-default-400 hover:text-foreground transition"
            type="button"
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 border-b border-white/10 px-5 py-3">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-success/10 border border-success/20 py-2.5 text-xs font-bold text-success transition hover:bg-success/20"
            type="button"
            onClick={() => setView("produce")}
          >
            <FlaskConical size={14} />
            Producir
          </button>
          <button
            className="flex items-center justify-center gap-1.5 rounded-xl bg-content2 border border-white/10 px-4 py-2.5 text-xs font-bold text-default-500 transition hover:text-foreground"
            type="button"
            onClick={() => setView("edit")}
          >
            <Pencil size={14} />
            Editar
          </button>
          <button
            className="flex items-center justify-center gap-1.5 rounded-xl bg-danger/10 border border-danger/20 px-3 py-2.5 text-danger transition hover:bg-danger/20"
            type="button"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Ingredients */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-default-400">
            Ingredientes ({recipe.ingredients.length})
          </p>
          <div className="flex flex-col gap-2">
            {recipe.ingredients.map((ing, i) => {
              const p = getProductObj(ing.product);
              const s = getSupplyObj(ing.supply);
              const name = p?.name || s?.name || "Insumo";
              const stock = p?.stock ?? s?.currentStock ?? 0;
              const unit = p?.unitOfMeasure || s?.unit || "";
              const cost = p?.costPrice ?? s?.referenceCost ?? 0;
              const stockOk = stock >= ing.quantity;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-content2 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Package size={14} className="shrink-0 text-default-400" />
                    <span className="truncate text-sm font-medium">
                      {name}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-sm font-bold text-foreground">
                      {ing.quantity} {unit}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {cost > 0 ? (
                        <span className="text-[11px] text-default-400">
                          {formatCompactCurrency(ing.quantity * cost, currency)}
                        </span>
                      ) : null}
                      {(p || s) && (
                        <span className={`text-[11px] font-semibold ${stockOk ? "text-success" : "text-danger"}`}>
                          ({stock} disp.)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cost summary */}
          {batchCost > 0 && (
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-default-400">
                Costo estimado
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-default-400">Por lote</span>
                <span className="font-semibold">{formatCurrency(batchCost, currency)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-default-400">Por unidad</span>
                <span className="font-bold text-primary">{formatCurrency(unitCost, currency)}</span>
              </div>
            </div>
          )}

          {recipe.notes && (
            <div className="mt-3 rounded-xl border border-white/6 bg-content2 px-4 py-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-default-400">
                Notas
              </p>
              <p className="text-sm text-default-400">{recipe.notes}</p>
            </div>
          )}
        </div>

        {/* Delete confirm */}
        {confirmDelete && (
          <div className="border-t border-white/10 bg-danger/5 px-5 py-4">
            <p className="mb-3 text-sm font-semibold text-danger">
              ¿Eliminar esta receta?
            </p>
            <div className="flex gap-2">
              <button
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-danger py-2.5 text-xs font-bold text-white transition hover:bg-danger/90 disabled:opacity-50"
                disabled={isDeleting}
                type="button"
                onClick={handleDelete}
              >
                {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                Eliminar
              </button>
              <button
                className="flex flex-1 items-center justify-center rounded-xl bg-content2 py-2.5 text-xs font-bold text-default-500 transition hover:text-foreground"
                type="button"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  })();

  if (isDesktop) {
    return (
      <Drawer hideCloseButton isOpen={isOpen} placement="right" size="lg" onClose={handleClose}>
        <DrawerContent>{() => <DrawerBody className="p-0">{content}</DrawerBody>}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer hideCloseButton isOpen={isOpen} placement="bottom" size="full" onClose={handleClose}>
      <DrawerContent>{() => <DrawerBody className="p-0">{content}</DrawerBody>}</DrawerContent>
    </Drawer>
  );
}

// ── Production log helpers ────────────────────────────────────────────

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProductionLogRow({ log }: { log: ProductionLog }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/6 bg-content2 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15">
        <FlaskConical size={14} className="text-success" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{log.recipeName}</span>
          <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
            {log.unitsProduced} ud.
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-default-400">
          <span>{formatDateTime(log.createdAt)}</span>
          <span>·</span>
          <span>{log.batchesProduced} lote{log.batchesProduced !== 1 ? "s" : ""}</span>
          {log.notes && (
            <>
              <span>·</span>
              <span className="truncate">{log.notes}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pageView, setPageView] = useState<"recipes" | "history">("recipes");

  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

  const { showToast } = useAppToast();
  const { recipes, loading, createRecipe, isCreating } = useRecipes();
  const { logs, loading: logsLoading } = useProductionLogs();
  const { products } = useProducts();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, search]);

  const handleCreate = async (form: ReturnType<typeof emptyForm>) => {
    try {
      const payload: CreateRecipePayload = {
        name: form.name.trim(),
        productId: form.productId || null,
        yieldQuantity: parseFloat(form.yieldQuantity) || 1,
        notes: form.notes,
        ingredients: form.ingredients
          .filter((r) => r.productId && parseFloat(r.quantity) > 0)
          .map((r) => ({ product: r.productId, quantity: parseFloat(r.quantity) })),
      };
      await createRecipe(payload);
      showToast({ variant: "success", message: "Receta creada" });
      setCreateOpen(false);
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al crear receta") });
    }
  };

  const handleDeleted = (id: string) => {
    if (selected?._id === id) setSelected(null);
    setDrawerOpen(false);
  };

  const handleUpdated = (updated: Recipe) => {
    if (selected?._id === updated._id) setSelected(updated);
  };

  const createDrawerContent = (
    <RecipeForm
      isDesktop={isDesktop}
      mode="create"
      products={products}
      submitting={isCreating}
      onClose={() => setCreateOpen(false)}
      onSubmit={handleCreate}
    />
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={`sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all ${isHeaderCompact ? "px-4 py-3" : "px-4 py-5 lg:px-6"}`}
      >
        <div className="flex items-center gap-3">
          <div className={`min-w-0 flex-1 ${isHeaderCompact ? "hidden" : "block"}`}>
            <p className="text-lg font-bold lg:text-xl">Recetas</p>
            <p className="text-xs text-default-400">
              {pageView === "recipes"
                ? `${recipes.length} receta${recipes.length !== 1 ? "s" : ""}`
                : `${logs.length} produccion${logs.length !== 1 ? "es" : ""}`}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex shrink-0 rounded-xl border border-white/10 bg-content2 p-1">
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${pageView === "recipes" ? "bg-primary text-white" : "text-default-400 hover:text-foreground"}`}
              type="button"
              onClick={() => setPageView("recipes")}
            >
              <ClipboardList size={13} />
              <span className="hidden sm:inline">Recetas</span>
            </button>
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${pageView === "history" ? "bg-primary text-white" : "text-default-400 hover:text-foreground"}`}
              type="button"
              onClick={() => setPageView("history")}
            >
              <History size={13} />
              <span className="hidden sm:inline">Historial</span>
            </button>
          </div>

          {pageView === "recipes" && (
            <>
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-content2 px-3 py-2">
                <Search className="shrink-0 text-default-400" size={15} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
                  placeholder="Buscar receta..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="text-default-400 hover:text-foreground" type="button" onClick={() => setSearch("")}>
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white transition hover:bg-primary/90"
                type="button"
                onClick={() => setCreateOpen(true)}
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nueva</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* History view */}
      {pageView === "history" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
          {logsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-default-400" size={28} />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-default-400">
              <History size={40} />
              <div>
                <p className="font-semibold">Sin producciones</p>
                <p className="text-xs">Todavía no se registró ninguna producción</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.map((log) => (
                <ProductionLogRow key={log._id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recipes list */}
      {pageView === "recipes" && <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-default-400" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-default-400">
            <ChefHat size={40} />
            <div>
              <p className="font-semibold">Sin recetas</p>
              <p className="text-xs">
                {search ? "No hay coincidencias" : 'Creá la primera con el botón "Nueva"'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipe) => {
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
                  key={recipe._id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-content2 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
                  type="button"
                  onClick={() => {
                    setSelected(recipe);
                    setDrawerOpen(true);
                  }}
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
                    <span>{recipe.ingredients.length} ingrediente{recipe.ingredients.length !== 1 ? "s" : ""}</span>
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
            })}
          </div>
        )}
      </div>}

      {/* Detail / Produce / Edit drawer */}
      <RecipeDrawer
        currency={currency}
        isDesktop={isDesktop}
        isOpen={drawerOpen}
        products={products}
        recipe={selected}
        onClose={() => setDrawerOpen(false)}
        onDeleted={handleDeleted}
        onUpdated={handleUpdated}
      />

      {/* Create drawer */}
      {isDesktop ? (
        <Drawer hideCloseButton isOpen={createOpen} placement="right" size="lg" onClose={() => setCreateOpen(false)}>
          <DrawerContent>{() => <DrawerBody className="p-0">{createDrawerContent}</DrawerBody>}</DrawerContent>
        </Drawer>
      ) : (
        <Drawer hideCloseButton isOpen={createOpen} placement="bottom" size="full" onClose={() => setCreateOpen(false)}>
          <DrawerContent>{() => <DrawerBody className="p-0">{createDrawerContent}</DrawerBody>}</DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
