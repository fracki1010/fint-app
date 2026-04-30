import { useMemo, useState } from "react";
import {
  Building2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useSuppliers, CreateSupplierPayload } from "@/hooks/useSuppliers";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { Supplier } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { getErrorMessage } from "@/utils/errors";

// ── Helpers ───────────────────────────────────────────────────────────

function displayName(s: Supplier) {
  return s.company || s.name;
}

function initials(s: Supplier) {
  const n = displayName(s);
  return n.slice(0, 2).toUpperCase();
}

// ── Form ─────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateSupplierPayload = {
  name: "",
  company: "",
  taxId: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

interface SupplierFormProps {
  initial?: Partial<CreateSupplierPayload>;
  onSave: (data: CreateSupplierPayload) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function SupplierForm({ initial = {}, onSave, onCancel, saving }: SupplierFormProps) {
  const [form, setForm] = useState<CreateSupplierPayload>({ ...EMPTY_FORM, ...initial });

  const set = (key: keyof CreateSupplierPayload, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-default-400">
            Nombre de contacto <span className="text-danger">*</span>
          </label>
          <input
            required
            className="mt-1 w-full rounded-xl border border-white/10 bg-default-100 px-3 py-2 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Juan García"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-default-400">Razón social / Empresa</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-default-100 px-3 py-2 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Distribuidora SA"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-default-400">CUIT / RUT</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-default-100 px-3 py-2 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="20-12345678-9"
            value={form.taxId}
            onChange={(e) => set("taxId", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-default-400">Teléfono</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-default-100 px-3 py-2 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="+54 9 11 1234-5678"
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-default-400">Email</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-default-100 px-3 py-2 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="proveedor@empresa.com"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-default-400">Dirección</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-default-100 px-3 py-2 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Av. Corrientes 1234, CABA"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-default-400">Notas</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-white/10 bg-default-100 px-3 py-2 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            placeholder="Condiciones de pago, observaciones..."
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          className="flex-1 rounded-xl border border-white/10 py-2 text-sm font-semibold text-default-400 transition hover:text-foreground"
          type="button"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          disabled={saving}
          type="submit"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ── Card ──────────────────────────────────────────────────────────────

function SupplierCard({
  supplier,
  onClick,
}: {
  supplier: Supplier;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full rounded-2xl border border-white/10 bg-content1 p-4 text-left transition hover:border-primary/30 hover:bg-content2"
      type="button"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-primary">
          {initials(supplier)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{displayName(supplier)}</p>
          {supplier.company && supplier.name !== supplier.company && (
            <p className="truncate text-xs text-default-400">{supplier.name}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {supplier.taxId && (
              <span className="text-xs text-default-400">{supplier.taxId}</span>
            )}
            {supplier.phone && (
              <span className="flex items-center gap-1 text-xs text-default-400">
                <Phone size={10} />
                {supplier.phone}
              </span>
            )}
            {supplier.email && (
              <span className="flex items-center gap-1 text-xs text-default-400 truncate">
                <Mail size={10} />
                {supplier.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────

type DrawerMode = "detail" | "edit" | "create" | "confirmDelete";

interface SupplierDrawerProps {
  supplier: Supplier | null;
  mode: DrawerMode;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => Promise<void>;
  onSaveEdit: (data: CreateSupplierPayload) => Promise<void>;
  saving: boolean;
  deleting: boolean;
}

function SupplierDrawer({
  supplier,
  mode,
  onClose,
  onEdit,
  onDelete,
  onConfirmDelete,
  onSaveEdit,
  saving,
  deleting,
}: SupplierDrawerProps) {
  const isOpen = supplier !== null || mode === "create";

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerContent className="max-h-[90dvh] rounded-t-3xl bg-content1">
        <DrawerBody className="px-4 py-5 overflow-y-auto">
          {mode === "create" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">Nuevo proveedor</h2>
                <button
                  className="rounded-xl p-1.5 text-default-400 hover:bg-content2"
                  type="button"
                  onClick={onClose}
                >
                  <X size={18} />
                </button>
              </div>
              <SupplierForm saving={saving} onCancel={onClose} onSave={onSaveEdit} />
            </>
          )}

          {supplier && mode === "detail" && (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-primary">
                    {initials(supplier)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-foreground">{displayName(supplier)}</p>
                    {supplier.company && supplier.name !== supplier.company && (
                      <p className="text-xs text-default-400">{supplier.name}</p>
                    )}
                  </div>
                </div>
                <button
                  className="shrink-0 rounded-xl p-1.5 text-default-400 hover:bg-content2"
                  type="button"
                  onClick={onClose}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                {supplier.taxId && (
                  <div className="flex items-center gap-2 rounded-xl bg-default-100 px-3 py-2.5">
                    <Building2 size={14} className="text-default-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-default-400">CUIT / RUT</p>
                      <p className="text-sm font-semibold text-foreground">{supplier.taxId}</p>
                    </div>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 rounded-xl bg-default-100 px-3 py-2.5">
                    <Phone size={14} className="text-default-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-default-400">Teléfono</p>
                      <p className="text-sm font-semibold text-foreground">{supplier.phone}</p>
                    </div>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 rounded-xl bg-default-100 px-3 py-2.5">
                    <Mail size={14} className="text-default-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-default-400">Email</p>
                      <p className="text-sm font-semibold text-foreground">{supplier.email}</p>
                    </div>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 rounded-xl bg-default-100 px-3 py-2.5">
                    <MapPin size={14} className="text-default-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-default-400">Dirección</p>
                      <p className="text-sm font-semibold text-foreground">{supplier.address}</p>
                    </div>
                  </div>
                )}
                {supplier.notes && (
                  <div className="rounded-xl bg-default-100 px-3 py-2.5">
                    <p className="text-[10px] text-default-400 mb-0.5">Notas</p>
                    <p className="text-sm text-foreground">{supplier.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-default-400 transition hover:text-foreground"
                  type="button"
                  onClick={onDelete}
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
                  type="button"
                  onClick={onEdit}
                >
                  <Pencil size={14} />
                  Editar
                </button>
              </div>
            </>
          )}

          {supplier && mode === "edit" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">Editar proveedor</h2>
                <button
                  className="rounded-xl p-1.5 text-default-400 hover:bg-content2"
                  type="button"
                  onClick={onClose}
                >
                  <X size={18} />
                </button>
              </div>
              <SupplierForm
                initial={{
                  name: supplier.name,
                  company: supplier.company,
                  taxId: supplier.taxId,
                  phone: supplier.phone,
                  email: supplier.email,
                  address: supplier.address,
                  notes: supplier.notes,
                }}
                saving={saving}
                onCancel={() => onEdit()}
                onSave={onSaveEdit}
              />
            </>
          )}

          {supplier && mode === "confirmDelete" && (
            <div className="py-4 space-y-4">
              <p className="text-center text-base font-bold text-foreground">
                ¿Eliminar proveedor?
              </p>
              <p className="text-center text-sm text-default-400">
                Se eliminará <span className="font-semibold text-foreground">{displayName(supplier)}</span>. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-default-400 transition hover:text-foreground"
                  type="button"
                  onClick={onEdit}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90 disabled:opacity-50"
                  disabled={deleting}
                  type="button"
                  onClick={onConfirmDelete}
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function Suppliers() {
  const { suppliers, loading, createSupplier, isCreating, updateSupplier, isUpdating, deleteSupplier, isDeleting } =
    useSuppliers();
  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const { showToast } = useAppToast();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [mode, setMode] = useState<DrawerMode>("detail");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        displayName(s).toLowerCase().includes(q) ||
        s.taxId?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const openCreate = () => {
    setSelected(null);
    setMode("create");
  };

  const openDetail = (s: Supplier) => {
    setSelected(s);
    setMode("detail");
  };

  const closeDrawer = () => {
    setSelected(null);
    setMode("detail");
  };

  const handleSaveCreate = async (data: CreateSupplierPayload) => {
    try {
      await createSupplier(data);
      showToast({ variant: "success", message: "Proveedor creado" });
      closeDrawer();
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al crear proveedor") });
    }
  };

  const handleSaveEdit = async (data: CreateSupplierPayload) => {
    if (!selected) return;
    try {
      await updateSupplier({ id: selected._id, data });
      showToast({ variant: "success", message: "Proveedor actualizado" });
      closeDrawer();
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al actualizar proveedor") });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selected) return;
    try {
      await deleteSupplier(selected._id);
      showToast({ variant: "success", message: "Proveedor eliminado" });
      closeDrawer();
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al eliminar proveedor") });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 lg:max-w-4xl lg:px-6">
      {/* Header */}
      <div
        className={`flex items-center justify-between transition-all lg:pt-0 ${
          isHeaderCompact ? "pt-1" : "pt-2"
        }`}
      >
        <div>
          <h1
            className={`font-bold text-foreground transition-all ${
              isHeaderCompact ? "text-base" : "text-xl"
            } ${isDesktop ? "!text-xl" : ""}`}
          >
            Proveedores
          </h1>
          <p className="text-xs text-default-400">{suppliers.length} registrados</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
          type="button"
          onClick={openCreate}
        >
          <Plus size={16} />
          {isDesktop && "Nuevo proveedor"}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
          size={16}
        />
        <input
          className="w-full rounded-2xl border border-white/10 bg-content1 py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Buscar por nombre, CUIT, teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-default-400 hover:text-foreground"
            type="button"
            onClick={() => setSearch("")}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-default-400">
          <Building2 size={36} strokeWidth={1.5} />
          <p className="text-sm">
            {search ? "Sin resultados para tu búsqueda" : "Aún no hay proveedores"}
          </p>
          {!search && (
            <button
              className="mt-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={openCreate}
            >
              Agregar el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-2">
          {filtered.map((s) => (
            <SupplierCard key={s._id} supplier={s} onClick={() => openDetail(s)} />
          ))}
        </div>
      )}

      {/* Drawer */}
      <SupplierDrawer
        deleting={isDeleting}
        mode={mode}
        saving={isCreating || isUpdating}
        supplier={selected}
        onClose={closeDrawer}
        onConfirmDelete={handleConfirmDelete}
        onDelete={() => setMode("confirmDelete")}
        onEdit={() => setMode(mode === "edit" ? "detail" : "edit")}
        onSaveEdit={mode === "create" ? handleSaveCreate : handleSaveEdit}
      />
    </div>
  );
}
