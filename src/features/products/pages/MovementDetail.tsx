import { ArrowLeft, Loader2, Package } from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useNavigate, useParams } from "react-router-dom";

import { useSettings } from "@features/settings/hooks/useSettings";
import { useStockMovementDetail } from "@features/products/hooks/useStockMovements";
import { formatCompactCurrency } from "@shared/utils/currency";

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

  // Resolve presentation by ID or name from product data
  const allPres = (movement.product?.presentations || []) as any[];
  const presentation = movement.presentationId
    ? allPres.find((p: any) => p._id === movement.presentationId)
    : movement.presentationName
      ? allPres.find((p: any) => p.name === movement.presentationName)
      : undefined;

  const presentationName = movement.presentationName || presentation?.name;
  const equivalentQty = presentation?.equivalentQty || 1;
  const presentationPrice = presentation?.price;

  // Calculate presentation values FROM BASE DATA
  const isNegative = movement.type === "SALIDA" || movement.type === "MERMA";

  // Stock in presentation units: floor(base stock / equivalentQty)
  const baseStock = movement.product?.stock ?? 0;
  const presStockActual = Math.floor(baseStock / equivalentQty);

  // How many presentation units this movement represents
  const presUnits = Math.floor(movement.quantity / equivalentQty);

  // Stock before/after in presentation units
  const presStockAfter = presStockActual;
  const presStockBefore = isNegative ? presStockAfter + presUnits : presStockAfter - presUnits;

  // Cost per presentation unit = base costPrice * equivalentQty
  const presCost = movement.product?.costPrice != null
    ? Number(movement.product.costPrice) * equivalentQty
    : null;

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-28 font-sans lg:max-w-none lg:px-6 lg:pb-8">
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
        {/* ── Product Card ── */}
        <Card>
          <CardBody className="space-y-4">
            <p className="section-kicker">Producto</p>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {movement.product?.name || "Sin producto"}
              </p>
              <p className="text-xs text-default-500">
                SKU: {movement.product?.sku || "Sin SKU"}
              </p>
            </div>

            {/* ── Presentation card ── */}
            {presentationName ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Presentación</span>
                  <span className="text-sm font-bold text-foreground ml-1">{presentationName}</span>
                </div>

                {/* KPI grid for presentation */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-content2/40 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-default-400">Costo x presentación</p>
                    <p className="text-sm font-bold text-foreground">
                      {presCost != null ? formatCompactCurrency(presCost, currency) : "—"}
                    </p>
                  </div>
                  <div className="bg-content2/40 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-default-400">Precio de venta</p>
                    <p className="text-sm font-bold text-foreground">
                      {presentationPrice ? formatCompactCurrency(presentationPrice, currency) : "—"}
                    </p>
                  </div>
                  <div className="bg-content2/40 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-default-400">Stock antes</p>
                    <p className="text-sm font-bold text-foreground">{presStockBefore}</p>
                  </div>
                  <div className="bg-content2/40 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-default-400">Stock después</p>
                    <p className={`text-sm font-bold ${isNegative ? "text-danger" : "text-success"}`}>{presStockAfter}</p>
                  </div>
                </div>

                {/* Equivalent qty info */}
                {equivalentQty && (
                  <div className="flex items-center gap-1.5 text-xs text-default-400">
                    <span className="font-medium text-foreground">{presUnits} {presentation?.unitOfMeasure || "unidad(es)"}</span>
                    <span>· {equivalentQty} {movement.product?.unitOfMeasure || "ud"} c/u</span>
                    <span>· Total: {movement.quantity} {movement.product?.unitOfMeasure || "ud"}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs italic text-default-400">Producto base (sin presentación)</p>
            )}

            {/* Base product KPIs (collapsible/always shown) */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-default-400 mb-2">Producto base</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-default-500">Costo</p>
                  <p>
                    {movement.product?.costPrice != null
                      ? formatCompactCurrency(Number(movement.product.costPrice), currency)
                      : "N/D"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-500">Precio</p>
                  <p>
                    {movement.product?.price != null
                      ? formatCompactCurrency(Number(movement.product.price), currency)
                      : "N/D"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-default-500">Stock antes</p>
                  <p>{movement.stockBefore}</p>
                </div>
                <div>
                  <p className="text-xs text-default-500">Stock después</p>
                  <p>{movement.stockAfter}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-divider/20 pt-3 space-y-1 text-xs text-default-500">
              <p>Razón: {movement.reason || "Sin razón"}</p>
              <p>Origen: {movement.source}</p>
            </div>
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
