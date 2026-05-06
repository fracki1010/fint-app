import { X, Loader2 } from "lucide-react";
import { Select, SelectItem } from "@heroui/select";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

// ── Constants ─────────────────────────────────────────────────────────────────

export const SUPPLY_UNIT_OPTIONS = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "g", label: "Gramo" },
  { value: "litro", label: "Litro" },
  { value: "ml", label: "Mililitro" },
  { value: "metro", label: "Metro" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
] as const;

// ── Form types ────────────────────────────────────────────────────────────────

export type SupplyFormState = {
  sku: string;
  name: string;
  unit: string;
  currentStock: string;
  minStock: string;
  referenceCost: string;
};

export const emptySupplyForm: SupplyFormState = {
  sku: "",
  name: "",
  unit: "unidad",
  currentStock: "0",
  minStock: "0",
  referenceCost: "0",
};

// ── Supply Form Modal ─────────────────────────────────────────────────────────

export default function SupplyFormModal({
  mode,
  isDesktop,
  formData,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  isDesktop: boolean;
  formData: SupplyFormState;
  onChange: (field: keyof SupplyFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const formLayout = (
    <div className="flex h-full flex-col overflow-x-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{mode === "create" ? "Alta de Insumo" : "Edicion"}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {mode === "create" ? "Nuevo insumo" : "Editar insumo"}
          </h2>
        </div>
        <button className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Nombre *</span>
          <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" placeholder="Ej: Harina 000" value={formData.name} onChange={(e) => onChange("name", e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">SKU</span>
          <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" placeholder="Codigo opcional" value={formData.sku} onChange={(e) => onChange("sku", e.target.value.toUpperCase())} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Unidad de Medida</span>
          <Select
            aria-label="Unidad de medida"
            classNames={{
              base: "w-full",
              trigger: "corp-input min-h-[48px] rounded-2xl px-4 text-sm text-foreground",
              value: "text-foreground",
              popoverContent: "bg-content1 text-foreground",
              listbox: "bg-content1 text-foreground",
            }}
            selectedKeys={[formData.unit]}
            variant="bordered"
            onSelectionChange={(keys) => onChange("unit", Array.from(keys)[0] as string)}
          >
            {SUPPLY_UNIT_OPTIONS.map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>
        </label>

        <div className="grid grid-cols-3 gap-4">
          {mode === "create" && (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Stock Inicial</span>
              <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" type="number" value={formData.currentStock} onChange={(e) => onChange("currentStock", e.target.value)} />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Stock Mínimo</span>
            <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" type="number" value={formData.minStock} onChange={(e) => onChange("minStock", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Costo Ref.</span>
            <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" step="0.01" type="number" value={formData.referenceCost} onChange={(e) => onChange("referenceCost", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="mt-6 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
        <button className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600" onClick={onClose}>Cancelar</button>
        <button className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={submitting} onClick={onSubmit}>
          <span className="flex items-center justify-center gap-2">
            {submitting && <Loader2 className="animate-spin" size={18} />}
            {mode === "create" ? "Crear insumo" : "Guardar cambios"}
          </span>
        </button>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]">
        <div className="h-[100dvh] w-screen overflow-hidden bg-background">{formLayout}</div>
      </div>
    );
  }

  return (
    <Drawer hideCloseButton isOpen backdrop="opaque" placement="right" scrollBehavior="inside" size="xl" onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <DrawerContent className="h-[100dvh] w-full max-w-xl overflow-x-hidden rounded-none bg-content1">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
