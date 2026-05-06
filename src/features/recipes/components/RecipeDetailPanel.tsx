import { useState } from "react";
import {
  X,
  Pencil,
  Trash2,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { Recipe, Product } from "@shared/types";
import { useRecipes, UpdateRecipePayload } from "@features/recipes/hooks/useRecipes";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";
import { formatCurrency, formatCompactCurrency } from "@shared/utils/currency";
import { getProductObj, getSupplyObj, calcRecipeCost, stockStatusColor } from "./recipeHelpers";
import { RecipeForm, recipeToForm } from "./RecipeFormModal";

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
    const p = getProductObj(ing.product);
    if (p) return p.stock < ing.quantity * qty;
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
                  <span
                    className={`shrink-0 text-xs font-semibold ${stockStatusColor(stock, needed)}`}
                  >
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

export function RecipeDrawer({
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
                    <span className="truncate text-sm font-medium">{name}</span>
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
                        <span
                          className={`text-[11px] font-semibold ${stockOk ? "text-success" : "text-danger"}`}
                        >
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
            <p className="mb-3 text-sm font-semibold text-danger">¿Eliminar esta receta?</p>
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
