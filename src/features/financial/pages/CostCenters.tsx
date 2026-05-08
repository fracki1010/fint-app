import { useState } from "react";
import { Plus, Loader2, TrendingUp, TrendingDown, Minus, Edit2, Trash2, Building2 } from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { useCostCenters, useCostCenterReport } from "../hooks/useCostCenters";
import { formatCurrency } from "@shared/utils/currency";

export default function CostCentersPage() {
  const { centers, loading, createCenter, updateCenter, deleteCenter, isCreating } = useCostCenters();
  const [from, setFrom] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const { data: report, isLoading: reportLoading } = useCostCenterReport(from, to);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const openCreate = () => {
    setEditId(null); setFormName(""); setFormDesc(""); setShowModal(true);
  };

  const openEdit = (c: { _id: string; name: string; description?: string }) => {
    setEditId(c._id); setFormName(c.name); setFormDesc(c.description || ""); setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    if (editId) {
      await updateCenter({ id: editId, name: formName.trim(), description: formDesc.trim() });
    } else {
      await createCenter({ name: formName.trim(), description: formDesc.trim() });
    }
    setShowModal(false);
  };

  const totalRevenue = report?.totals.revenue || 0;
  const totalCosts = report?.totals.costs || 0;
  const totalMargin = report?.totals.margin || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Centros de Costo</h2>
          <p className="text-sm text-default-500">Gestioná centros y resultados por área</p>
        </div>
        <Button onPress={openCreate} color="primary">
          <Plus className="w-4 h-4 mr-1" /> Nuevo Centro
        </Button>
      </div>

      {/* Centers List */}
      <Card>
        <CardHeader><p className="font-semibold">Centros ({centers.length})</p></CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : centers.length === 0 ? (
            <p className="text-default-500 text-center py-8">No hay centros de costo. Creá el primero.</p>
          ) : (
            <div className="space-y-2">
              {centers.map((c) => (
                <div key={c._id} className="flex items-center justify-between rounded-xl bg-content2/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-default-400" />
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      {c.description && <p className="text-xs text-default-500">{c.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat" color={c.isActive ? "success" : "default"}>
                      {c.isActive ? "Activo" : "Inactivo"}
                    </Chip>
                    <button onClick={() => openEdit(c)} className="p-1 text-default-400 hover:text-foreground"><Edit2 size={14} /></button>
                    <button onClick={() => deleteCenter(c._id)} className="p-1 text-default-400 hover:text-danger"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Results Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <p className="font-semibold">Resultados por Centro</p>
            <div className="flex gap-2 items-center">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" size="sm" />
              <span className="text-default-400">a</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {reportLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : !report || report.rows.length === 0 ? (
            <p className="text-default-500 text-center py-8">Sin datos para el período seleccionado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-medium text-default-500">Centro</th>
                    <th className="py-2 px-3 text-right font-medium text-default-500">Ingresos</th>
                    <th className="py-2 px-3 text-right font-medium text-default-500">Costos</th>
                    <th className="py-2 px-3 text-right font-medium text-default-500">Margen</th>
                    <th className="py-2 px-3 text-center font-medium text-default-500">Ventas</th>
                    <th className="py-2 px-3 text-center font-medium text-default-500">Compras</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={row._id || "unassigned"} className="border-b last:border-0 hover:bg-default-50">
                      <td className="py-3 px-3 font-medium text-foreground">{row.name}</td>
                      <td className="py-3 px-3 text-right text-success font-mono">{formatCurrency(row.revenue, "ARS")}</td>
                      <td className="py-3 px-3 text-right text-danger font-mono">{formatCurrency(row.costs, "ARS")}</td>
                      <td className={`py-3 px-3 text-right font-mono font-semibold ${
                        row.margin > 0 ? "text-success" : row.margin < 0 ? "text-danger" : "text-default-400"
                      }`}>
                        <span className="flex items-center justify-end gap-1">
                          {row.margin > 0 ? <TrendingUp size={14} /> : row.margin < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                          {formatCurrency(Math.abs(row.margin), "ARS")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-default-600">{row.orderCount}</td>
                      <td className="py-3 px-3 text-center text-default-600">{row.purchaseCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-default-100 font-semibold">
                  <tr>
                    <td className="py-3 px-3">TOTAL</td>
                    <td className="py-3 px-3 text-right text-success">{formatCurrency(totalRevenue, "ARS")}</td>
                    <td className="py-3 px-3 text-right text-danger">{formatCurrency(totalCosts, "ARS")}</td>
                    <td className={`py-3 px-3 text-right ${
                      totalMargin > 0 ? "text-success" : totalMargin < 0 ? "text-danger" : "text-default-400"
                    }`}>
                      {formatCurrency(Math.abs(totalMargin), "ARS")} {totalMargin > 0 ? "(Ganancia)" : totalMargin < 0 ? "(Pérdida)" : ""}
                    </td>
                    <td className="py-3 px-3 text-center">{report.rows.reduce((s, r) => s + r.orderCount, 0)}</td>
                    <td className="py-3 px-3 text-center">{report.rows.reduce((s, r) => s + r.purchaseCount, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="sm">
        <ModalContent>
          <ModalHeader>{editId ? "Editar Centro" : "Nuevo Centro de Costo"}</ModalHeader>
          <ModalBody className="space-y-3">
            <Input label="Nombre" value={formName} onChange={(e) => setFormName(e.target.value)} isRequired />
            <Input label="Descripción (opcional)" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowModal(false)}>Cancelar</Button>
            <Button color="primary" onPress={handleSave} isDisabled={!formName.trim() || isCreating}>
              {isCreating ? <Loader2 className="animate-spin" size={16} /> : "Guardar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
