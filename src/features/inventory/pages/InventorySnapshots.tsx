import { useState } from "react";
import { Loader2, Camera, History, AlertCircle } from "lucide-react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Modal, ModalContent, ModalBody, ModalHeader } from "@heroui/modal";
import {
  useInventorySnapshots,
  useInventorySnapshot,
  useTriggerSnapshot,
} from "../hooks/useInventorySnapshots";
import type { InventorySnapshot } from "@shared/types";
import { PaginationBar } from "@shared/components/PaginationBar";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateTime } from "@shared/utils/date";

export default function InventorySnapshotsPage() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const limit = 15;

  const { data, isLoading, refetch } = useInventorySnapshots(page, limit);
  const { data: snapshotDetail, isLoading: loadingDetail } = useInventorySnapshot(selectedId || "");
  const { mutateAsync: triggerSnapshot, isPending: isTriggering } = useTriggerSnapshot();

  const snapshots = data?.snapshots ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleTrigger = async () => {
    try {
      await triggerSnapshot();
      refetch();
    } catch {
      // error handled by react-query
    }
  };

  const getTriggeredByBadge = (triggeredBy: string) => {
    switch (triggeredBy) {
      case "manual":
        return <Chip color="primary" variant="flat" size="sm">Manual</Chip>;
      case "auto_close":
        return <Chip color="warning" variant="flat" size="sm">Cierre de Caja</Chip>;
      default:
        return <Chip size="sm">{triggeredBy}</Chip>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-content1 border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Inventario — Snapshots
            </h1>
            <p className="text-sm text-default-500 mt-1">
              Registros del estado del inventario en un momento dado
            </p>
          </div>
          <Button
            color="primary"
            onPress={handleTrigger}
            isLoading={isTriggering}
          >
            <Camera className="w-4 h-4 mr-2" />
            Tomar Snapshot
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Snapshots List */}
        <div className="app-panel rounded-[28px] p-5">
          <p className="section-kicker flex items-center gap-2 mb-4">
            <History className="w-4 h-4" />
            Historial de Snapshots
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-default-400" />
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-8 text-default-500">
              <Camera className="w-12 h-12 text-default-300 mx-auto mb-3" />
              <p>No hay snapshots todavía</p>
              <p className="text-sm text-default-400 mt-1">
                Tomá un snapshot para registrar el estado actual del inventario
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-default-700">
                      Fecha
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-default-700">
                      Tipo
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-default-700">
                      Productos
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-default-700">
                      Valor Stock
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-default-700">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snapshot: InventorySnapshot) => (
                    <tr
                      key={snapshot._id}
                      className="border-b last:border-0 hover:bg-default-50 cursor-pointer"
                      onClick={() => setSelectedId(snapshot._id)}
                    >
                      <td className="py-3 px-4 font-medium">
                        {formatDateTime(snapshot.snapshotDate || snapshot.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        {getTriggeredByBadge(snapshot.triggeredBy)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {snapshot.productCount}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(snapshot.stockValue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="light" size="sm">
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {snapshots.length > 0 && (
            <PaginationBar
              from={(page - 1) * limit + 1}
              page={page}
              to={Math.min(page * limit, data?.total ?? 0)}
              total={data?.total ?? 0}
              totalPages={totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              onPage={setPage}
            />
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        size="4xl"
      >
        <ModalContent>
          {loadingDetail ? (
            <ModalBody className="p-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-default-400" />
              </div>
            </ModalBody>
          ) : snapshotDetail ? (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-lg font-bold">
                  Snapshot — {formatDateTime(snapshotDetail.snapshotDate || snapshotDetail.createdAt)}
                </span>
                <span className="text-sm text-default-500 font-normal">
                  {snapshotDetail.productCount} productos · Valor total: {formatCurrency(snapshotDetail.stockValue)}
                  {" · "}
                  {getTriggeredByBadge(snapshotDetail.triggeredBy)}
                </span>
              </ModalHeader>
              <ModalBody className="p-6 pt-0">
                {snapshotDetail.items && snapshotDetail.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-default-700">
                            Producto
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-default-700">
                            SKU
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-default-700">
                            Stock
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-default-700">
                            Costo
                          </th>
                          <th className="text-right py-2 px-3 font-medium text-default-700">
                            Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshotDetail.items.map((item, idx) => (
                          <tr key={item.productId || idx} className="border-b last:border-0 hover:bg-default-50">
                            <td className="py-2 px-3 font-medium">{item.productName}</td>
                            <td className="py-2 px-3 text-default-500">{item.sku || "-"}</td>
                            <td className="py-2 px-3 text-right">{item.stock}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(item.costPrice)}</td>
                            <td className="py-2 px-3 text-right font-medium">{formatCurrency(item.stockValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-default-500">
                    <AlertCircle className="w-12 h-12 text-default-300 mx-auto mb-3" />
                    <p>No hay items en este snapshot</p>
                  </div>
                )}
              </ModalBody>
            </>
          ) : (
            <ModalBody className="p-6">
              <div className="text-center py-12 text-default-500">
                <AlertCircle className="w-12 h-12 text-default-300 mx-auto mb-3" />
                <p>No se pudo cargar el snapshot</p>
              </div>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
