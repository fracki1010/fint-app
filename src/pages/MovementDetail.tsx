import { ArrowLeft, Loader2, Package } from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useNavigate, useParams } from "react-router-dom";

import { useSettings } from "@/hooks/useSettings";
import { useStockMovementDetail } from "@/hooks/useStockMovements";
import { formatCompactCurrency } from "@/utils/currency";

export default function MovementDetailPage() {
  const navigate = useNavigate();
  const { movementId } = useParams<{ movementId?: string }>();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";
  const { movement, loading, error } = useStockMovementDetail(movementId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !movement) {
    return (
      <div className="flex flex-col min-h-screen bg-background px-6 py-8">
        <Button
          className="mb-4 w-fit"
          startContent={<ArrowLeft size={16} />}
          variant="flat"
          onClick={() => navigate("/movements")}
        >
          Volver
        </Button>
        <div className="rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          {error || "Movimiento no encontrado."}
        </div>
      </div>
    );
  }

  const order = movement.order;
  const client = order?.client;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-24 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
        <Button
          className="mb-4"
          startContent={<ArrowLeft size={16} />}
          variant="flat"
          onClick={() => navigate("/movements")}
        >
          Volver a movimientos
        </Button>

        <div className="section-kicker">Trazabilidad</div>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
          Movimiento {movement.type}
        </h1>
        <p className="mt-2 text-sm text-default-500">
          ID: {movement._id} · {new Date(movement.createdAt).toLocaleString()}
        </p>
      </header>

      <main className="flex-1 space-y-4 px-6 py-5">
        <Card>
          <CardBody className="space-y-3">
            <p className="section-kicker">Producto</p>
            <p className="text-lg font-semibold text-foreground">
              {movement.product?.name || "Sin producto"}
            </p>
            <p className="text-xs text-default-500">
              SKU: {movement.product?.sku || "Sin SKU"}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-default-500">Costo</p>
                <p>
                  {movement.product?.costPrice != null
                    ? formatCompactCurrency(
                        Number(movement.product.costPrice),
                        currency,
                      )
                    : "N/D"}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-500">Precio</p>
                <p>
                  {movement.product?.price != null
                    ? formatCompactCurrency(
                        Number(movement.product.price),
                        currency,
                      )
                    : "N/D"}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-500">Stock antes</p>
                <p>{movement.stockBefore}</p>
              </div>
              <div>
                <p className="text-xs text-default-500">Stock despues</p>
                <p>{movement.stockAfter}</p>
              </div>
            </div>
            <p className="text-xs text-default-500">
              Razon: {movement.reason || "Sin razon"}
            </p>
            <p className="text-xs text-default-500">
              Origen: {movement.source}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="section-kicker">Cliente y venta</p>
            {order ? (
              <>
                <p className="text-sm text-default-500">
                  Pedido ID: {order._id}
                </p>
                <p className="text-sm text-default-500">
                  Estados: {order.salesStatus || "-"} /{" "}
                  {order.paymentStatus || "-"} / {order.deliveryStatus || "-"}
                </p>
                <p className="text-sm text-default-500">
                  Total:{" "}
                  {order.totalAmount != null
                    ? formatCompactCurrency(Number(order.totalAmount), currency)
                    : "N/D"}
                </p>

                <div className="rounded-xl bg-content2/40 p-3 text-sm">
                  <p className="font-semibold text-foreground">
                    {client?.name || client?.company || "Cliente sin nombre"}
                  </p>
                  <p className="text-default-500">
                    {client?.phone || "Sin telefono"}
                  </p>
                  <p className="text-default-500">
                    {client?.email || "Sin email"}
                  </p>
                  <p className="text-default-500">
                    {client?.taxId || "Sin documento fiscal"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-default-500">
                    Productos de la venta
                  </p>
                  {order.items?.length ? (
                    order.items.map((item, idx) => (
                      <div
                        key={`${item.product}-${idx}`}
                        className="rounded-xl bg-content2/40 p-3 text-sm"
                      >
                        <p className="font-medium text-foreground">
                          {item.product}
                        </p>
                        <p className="text-default-500">
                          Cantidad: {item.quantity} · Precio:{" "}
                          {formatCompactCurrency(
                            Number(item.price || 0),
                            currency,
                          )}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-default-500">
                      Sin items registrados.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-default-500">
                Este movimiento no tiene una venta asociada (puede ser merma,
                ajuste o entrada manual).
              </p>
            )}
          </CardBody>
        </Card>

        <div className="rounded-2xl border border-divider/70 bg-content2/45 p-4">
          <div className="flex items-center gap-2 text-foreground">
            <Package size={15} />
            <span className="text-sm font-semibold">Resumen tecnico</span>
          </div>
          <p className="mt-2 text-xs text-default-500">Tipo: {movement.type}</p>
          <p className="text-xs text-default-500">
            Cantidad: {movement.quantity}
          </p>
          <p className="text-xs text-default-500">
            Actualizado: {new Date(movement.updatedAt).toLocaleString()}
          </p>
        </div>
      </main>
    </div>
  );
}
