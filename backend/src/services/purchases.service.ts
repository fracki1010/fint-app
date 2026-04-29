import type { PaymentCondition, PurchaseStatus } from "../domain/operations";
import { prisma } from "../lib/prisma";
import { genId } from "../store/memory";
import { createSupplierAccountEntry } from "./supplierAccount.service";
import { createSupplyMovement } from "./supplies.service";

function mapPurchase(purchase: {
  id: string;
  supplierId: string;
  date: string;
  status: string;
  paymentCondition: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    supplyItemId: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
}) {
  return {
    _id: purchase.id,
    supplierId: purchase.supplierId,
    date: purchase.date,
    status: purchase.status as PurchaseStatus,
    paymentCondition: purchase.paymentCondition as PaymentCondition,
    subtotal: purchase.subtotal,
    tax: purchase.tax,
    total: purchase.total,
    notes: purchase.notes ?? undefined,
    createdBy: purchase.createdBy ?? undefined,
    createdAt: purchase.createdAt.toISOString(),
    updatedAt: purchase.updatedAt.toISOString(),
    items: purchase.items.map((item) => ({
      _id: item.id,
      supplyItemId: item.supplyItemId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      lineTotal: item.lineTotal,
    })),
  };
}

export async function listPurchases() {
  const purchases = await prisma.purchase.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return purchases.map(mapPurchase);
}

export async function getPurchaseById(id: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!purchase) throw new Error("PURCHASE_NOT_FOUND");

  return mapPurchase(purchase);
}

export async function createPurchase(input: {
  supplierId: string;
  date: string;
  paymentCondition: PaymentCondition;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: Array<{
    supplyItemId: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
  createdBy?: string;
}) {
  const purchaseId = genId("pur");
  const created = await prisma.purchase.create({
    data: {
      id: purchaseId,
      supplierId: input.supplierId,
      date: input.date,
      status: "DRAFT",
      paymentCondition: input.paymentCondition,
      subtotal: input.subtotal,
      tax: input.tax,
      total: input.total,
      notes: input.notes,
      createdBy: input.createdBy,
      items: {
        create: input.items.map((item) => ({
          id: genId("pui"),
          supplyItemId: item.supplyItemId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          lineTotal: item.lineTotal,
        })),
      },
    },
    include: { items: true },
  });

  return mapPurchase(created);
}

async function findPurchaseRecord(id: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!purchase) throw new Error("PURCHASE_NOT_FOUND");

  return purchase;
}

export async function confirmPurchase(id: string) {
  const purchase = await findPurchaseRecord(id);

  if (purchase.status !== "DRAFT") {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  const updated = await prisma.purchase.update({
    where: { id },
    data: { status: "CONFIRMED" },
    include: { items: true },
  });

  return mapPurchase(updated);
}

export async function receivePurchase(id: string, actorId?: string) {
  const purchase = await findPurchaseRecord(id);

  if (purchase.status !== "CONFIRMED") {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  for (const item of purchase.items) {
    await createSupplyMovement({
      supplyItemId: item.supplyItemId,
      type: "IN",
      quantity: item.quantity,
      reason: `Recepcion compra ${purchase.id}`,
      sourceType: "PURCHASE",
      sourceId: purchase.id,
      createdBy: actorId,
    });
  }

  if (purchase.paymentCondition === "CREDIT") {
    await createSupplierAccountEntry({
      supplierId: purchase.supplierId,
      date: purchase.date,
      type: "CHARGE",
      amount: purchase.total,
      purchaseId: purchase.id,
      reference: `Compra ${purchase.id}`,
      notes: "Cargo automatico por compra a credito",
      createdBy: actorId,
    });
  }

  const updated = await prisma.purchase.update({
    where: { id },
    data: { status: "RECEIVED" },
    include: { items: true },
  });

  return mapPurchase(updated);
}

export async function cancelPurchase(id: string) {
  const purchase = await findPurchaseRecord(id);

  if (purchase.status !== "DRAFT" && purchase.status !== "CONFIRMED") {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  const updated = await prisma.purchase.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: { items: true },
  });

  return mapPurchase(updated);
}
