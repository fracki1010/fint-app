import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Loader2,
  X,
  ChefHat,
  FlaskConical,
  History,
  ClipboardList,
} from "lucide-react";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useRecipes, useProductionLogs, CreateRecipePayload } from "@features/recipes/hooks/useRecipes";
import { useProducts } from "@features/products/hooks/useProducts";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@shared/hooks/useMobileHeaderCompact";
import { useSettings } from "@features/settings/hooks/useSettings";
import { Recipe, ProductionLog } from "@shared/types";
import { useAppToast } from "@features/notifications/components/AppToast";
import { formatDateTime } from "@shared/utils/date";
import { getErrorMessage } from "@shared/utils/errors";

import { RecipeForm, emptyForm } from "../components/RecipeFormModal";
import { RecipeDrawer } from "../components/RecipeDetailPanel";
import { RecipeListItem } from "../components/RecipeListItem";

// ── Production log row ─────────────────────────────────────────────────


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
            {filtered.map((recipe) => (
              <RecipeListItem
                key={recipe._id}
                recipe={recipe}
                currency={currency}
                onClick={(r) => {
                  setSelected(r);
                  setDrawerOpen(true);
                }}
              />
            ))}
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
