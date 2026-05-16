import { useState } from "react";
import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { Select, SelectItem } from "@heroui/select";
import { X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { CASH_CATEGORIES } from "@shared/types";

interface CashMovementFormProps {
  isOpen: boolean;
  isDesktop: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    type: "income" | "expense";
    category: string;
    amount: number;
    description?: string;
  }) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  sueldos: "Sueldos",
  servicios: "Servicios (luz, agua, etc.)",
  honorarios: "Honorarios",
  retiro: "Retiro particular",
  impuestos: "Impuestos",
  alquiler: "Alquiler",
  fletes: "Fletes",
  insumos_oficina: "Insumos de oficina",
  varios: "Varios",
  deposito: "Depósito",
  transferencia_entre_cuentas: "Transferencia entre cuentas",
};

export default function CashMovementForm({
  isOpen,
  isDesktop,
  submitting,
  onClose,
  onSubmit,
}: CashMovementFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!category || !amount || Number(amount) <= 0) return;
    onSubmit({ date, type, category, amount: Number(amount), description: description || undefined });
    setDate(today);
    setType("expense");
    setCategory("");
    setAmount("");
    setDescription("");
  };

  const content = (
    <div className="flex h-full flex-col p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-default-400">Tesorería</p>
          <h2 className="mt-1.5 text-xl font-bold tracking-[-0.02em] text-foreground">
            Nuevo movimiento
          </h2>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-divider/20 text-default-400 hover:bg-content2/60 hover:text-foreground transition-colors" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="mt-6 flex-1 space-y-5">
        {/* Tipo: Ingreso / Egreso */}
        <div>
          <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Tipo</span>
          <div className="flex gap-2">
            <button
              className={`flex-1 rounded-xl px-4 py-3 text-left transition-all ${
                type === "expense"
                  ? "bg-danger/10 text-danger ring-1 ring-danger/30 shadow-sm"
                  : "bg-content2/50 text-default-500 hover:bg-content2/80"
              }`}
              type="button"
              onClick={() => setType("expense")}
            >
              <ArrowDownLeft size={16} className="inline mr-1.5" />
              <span className="text-xs font-bold">Egreso</span>
            </button>
            <button
              className={`flex-1 rounded-xl px-4 py-3 text-left transition-all ${
                type === "income"
                  ? "bg-success/10 text-success ring-1 ring-success/30 shadow-sm"
                  : "bg-content2/50 text-default-500 hover:bg-content2/80"
              }`}
              type="button"
              onClick={() => setType("income")}
            >
              <ArrowUpRight size={16} className="inline mr-1.5" />
              <span className="text-xs font-bold">Ingreso</span>
            </button>
          </div>
        </div>

        {/* Fecha */}
        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Fecha</span>
          <input
            className="corp-input w-full rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* Categoría */}
        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Categoría</span>
          <Select
            aria-label="Categoría"
            classNames={{
              base: "w-full",
              trigger: "corp-input min-h-[42px] rounded-xl border-divider/25 bg-content1 px-4 text-sm text-foreground",
              value: "text-foreground",
              popoverContent: "bg-content1 text-foreground",
              listbox: "bg-content1 text-foreground",
            }}
            selectedKeys={category ? [category] : []}
            variant="bordered"
            onSelectionChange={(keys) => setCategory(Array.from(keys)[0] as string || "")}
          >
            {CASH_CATEGORIES.map((cat) => (
              <SelectItem key={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
            ))}
          </Select>
        </label>

        {/* Monto */}
        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Monto</span>
          <input
            className="corp-input w-full rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm font-mono"
            min="1"
            step="0.01"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        {/* Descripción */}
        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Descripción</span>
          <textarea
            className="corp-input min-h-[60px] w-full rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm resize-none"
            placeholder="Ej: Pago de sueldos mayo 2026"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      {/* Footer */}
      <div className="mt-6 flex gap-3 border-t border-divider/10 pt-4">
        <Button className="flex-1" variant="flat" onPress={onClose}>Cancelar</Button>
        <Button
          className="flex-1"
          color={type === "expense" ? "danger" : "success"}
          isLoading={submitting}
          isDisabled={!category || !amount || Number(amount) <= 0}
          onPress={handleSubmit}
        >
          {submitting ? "Guardando..." : type === "expense" ? "Registrar egreso" : "Registrar ingreso"}
        </Button>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]">
        <div className="h-[100dvh] w-full max-w-full overflow-hidden bg-background">{content}</div>
      </div>
    );
  }

  return (
    <Drawer hideCloseButton isOpen={isOpen} backdrop="opaque" placement="right" scrollBehavior="inside" size="md"
      onOpenChange={(open: boolean) => { if (!open) onClose(); }}
    >
      <DrawerContent className="h-[100dvh] w-full max-w-lg overflow-x-hidden rounded-none bg-content1">
        <DrawerBody className="p-0">{content}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
