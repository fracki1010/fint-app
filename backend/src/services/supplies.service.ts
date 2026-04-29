import type { SupplyMovementType } from "../domain/operations";
import { prisma } from "../lib/prisma";
import { genId } from "../store/memory";

export async function listSupplies() {
  const supplies = await prisma.supply.findMany({ orderBy: { createdAt: "desc" } });

  return supplies.map((item) => ({
    _id: item.id,
    name: item.name,
    sku: item.sku ?? undefined,
    unit: item.unit,
    currentStock: item.currentStock,
    minStock: item.minStock,
    referenceCost: item.referenceCost ?? undefined,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function createSupply(input: {
  name: string;
  sku?: string;
  unit: string;
  currentStock?: number;
  minStock?: number;
  referenceCost?: number;
  isActive?: boolean;
}) {
  const created = await prisma.supply.create({
    data: {
      id: genId("sup"),
      name: input.name,
      sku: input.sku,
      unit: input.unit,
      currentStock: input.currentStock ?? 0,
      minStock: input.minStock ?? 0,
      referenceCost: input.referenceCost,
      isActive: input.isActive ?? true,
    },
  });

  return {
    _id: created.id,
    name: created.name,
    sku: created.sku ?? undefined,
    unit: created.unit,
    currentStock: created.currentStock,
    minStock: created.minStock,
    referenceCost: created.referenceCost ?? undefined,
    isActive: created.isActive,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function createSupplyMovement(input: {
  supplyItemId: string;
  type: SupplyMovementType;
  quantity: number;
  reason: string;
  sourceType?: string;
  sourceId?: string;
  createdBy?: string;
}) {
  if (input.quantity <= 0) {
    throw new Error("INVALID_QUANTITY");
  }

  const supply = await prisma.supply.findUnique({ where: { id: input.supplyItemId } });

  if (!supply) {
    throw new Error("SUPPLY_NOT_FOUND");
  }

  const delta = input.type === "OUT" ? -input.quantity : input.quantity;
  const nextStock = supply.currentStock + delta;

  if (nextStock < 0) {
    throw new Error("NEGATIVE_STOCK");
  }

  const movementId = genId("smv");

  await prisma.$transaction([
    prisma.supply.update({
      where: { id: supply.id },
      data: { currentStock: nextStock },
    }),
    prisma.supplyMovement.create({
      data: {
        id: movementId,
        supplyItemId: input.supplyItemId,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        createdBy: input.createdBy,
      },
    }),
  ]);

  const created = await prisma.supplyMovement.findUniqueOrThrow({ where: { id: movementId } });

  return {
    _id: created.id,
    supplyItemId: created.supplyItemId,
    type: created.type as SupplyMovementType,
    quantity: created.quantity,
    reason: created.reason,
    sourceType: created.sourceType ?? undefined,
    sourceId: created.sourceId ?? undefined,
    createdBy: created.createdBy ?? undefined,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function getSupplyMovements(supplyItemId: string) {
  const movements = await prisma.supplyMovement.findMany({
    where: { supplyItemId },
    orderBy: { createdAt: "desc" },
  });

  return movements.map((item) => ({
    _id: item.id,
    supplyItemId: item.supplyItemId,
    type: item.type,
    quantity: item.quantity,
    reason: item.reason,
    sourceType: item.sourceType ?? undefined,
    sourceId: item.sourceId ?? undefined,
    createdBy: item.createdBy ?? undefined,
    createdAt: item.createdAt.toISOString(),
  }));
}
