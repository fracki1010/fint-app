import { useState } from "react";
import { Plus, Trash2, Loader2, Wallet } from "lucide-react";
import { Button } from "@heroui/button";
import { formatCurrency } from "@shared/utils/currency";
import { formatDate } from "@shared/utils/date";
import { useAppToast } from "@features/notifications/components/AppToast";
import {
  useCashMovements,
  useCreateCashMovement,
  useDeleteCashMovement,
} from "../hooks/useCashMovements";
import type { CashMovement } from "@shared/types";

export default function CashMovementsPage() {
  const { showToast } = useAppToast();
  const { data, isLoading } = useCashMovements();
  const createMutation = useCreateCashMovement();
  const deleteMutation = useDeleteCashMovement();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "expense" as "income" | "expense",
    category: "",
    amount: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        date: formData.date,
        type: formData.type,
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description,
      });
      showToast({ variant: "success", message: "Movimiento registrado" });
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        category: "",
        amount: "",
        description: "",
      });
    } catch {
      showToast({ variant: "error", message: "Error al registrar" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast({ variant: "success", message: "Movimiento eliminado" });
    } catch {
      showToast({ variant: "error", message: "Error al eliminar" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet size={20} className="text-primary" />
          <h1 className="text-lg font-bold text-foreground">Movimientos de Caja</h1>
        </div>
        <Button
          color="primary"
          size="sm"
          startContent={<Plus size={16} />}
          onPress={() => setShowForm(!showForm)}
        >
          Nuevo
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-default-200 bg-content1 p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="rounded-xl border border-default-200 bg-background px-3 py-2 text-sm"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })}
              className="rounded-xl border border-default-200 bg-background px-3 py-2 text-sm"
            >
              <option value="expense">Egreso</option>
              <option value="income">Ingreso</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Categoría"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full rounded-xl border border-default-200 bg-background px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Monto"
            required
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full rounded-xl border border-default-200 bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-xl border border-default-200 bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" color="primary" size="sm" isLoading={createMutation.isPending}>
              Guardar
            </Button>
            <Button variant="bordered" size="sm" onPress={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data?.movements?.length ? (
        <div className="rounded-2xl border border-default-200 bg-default-50/50 p-8 text-center">
          <p className="text-sm text-default-500">No hay movimientos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.movements.map((m: CashMovement) => (
            <div
              key={m._id}
              className="flex items-center justify-between rounded-xl border border-default-200 bg-content1 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      m.type === "income"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                    }`}
                  >
                    {m.type === "income" ? "Ingreso" : "Egreso"}
                  </span>
                  <span className="text-xs text-default-400">{m.category}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatCurrency(m.amount, "ARS")}
                </p>
                {m.description && (
                  <p className="text-xs text-default-500 truncate">{m.description}</p>
                )}
                <p className="text-[10px] text-default-400">{formatDate(m.date)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(m._id)}
                className="rounded-lg p-2 text-default-400 hover:bg-danger/10 hover:text-danger transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
