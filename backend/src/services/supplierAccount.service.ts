import type { SupplierAccountEntryType } from "../domain/operations";
import { prisma } from "../lib/prisma";
import { genId } from "../store/memory";

function signByType(type: SupplierAccountEntryType): 1 | -1 {
  if (type === "CHARGE" || type === "DEBIT_NOTE") return 1;

  return -1;
}

export async function createSupplierAccountEntry(input: {
  supplierId: string;
  date: string;
  type: SupplierAccountEntryType;
  amount: number;
  purchaseId?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
}) {
  const created = await prisma.supplierAccountEntry.create({
    data: {
      id: genId("sae"),
      supplierId: input.supplierId,
      date: input.date,
      type: input.type,
      amount: input.amount,
      sign: signByType(input.type),
      purchaseId: input.purchaseId,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      notes: input.notes,
      createdBy: input.createdBy,
    },
  });

  return {
    _id: created.id,
    supplierId: created.supplierId,
    date: created.date,
    type: created.type,
    amount: created.amount,
    sign: created.sign as 1 | -1,
    purchaseId: created.purchaseId ?? undefined,
    paymentMethod: created.paymentMethod ?? undefined,
    reference: created.reference ?? undefined,
    notes: created.notes ?? undefined,
    createdBy: created.createdBy ?? undefined,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function getSupplierAccount(supplierId: string) {
  const entries = await prisma.supplierAccountEntry.findMany({
    where: { supplierId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const mapped = entries.map((entry) => ({
    _id: entry.id,
    supplierId: entry.supplierId,
    date: entry.date,
    type: entry.type,
    amount: entry.amount,
    sign: entry.sign as 1 | -1,
    purchaseId: entry.purchaseId ?? undefined,
    paymentMethod: entry.paymentMethod ?? undefined,
    reference: entry.reference ?? undefined,
    notes: entry.notes ?? undefined,
    createdBy: entry.createdBy ?? undefined,
    createdAt: entry.createdAt.toISOString(),
  }));

  const balance = mapped.reduce((acc, entry) => acc + entry.amount * entry.sign, 0);

  return { entries: mapped, balance };
}

export async function getSupplierStatement(supplierId: string, from?: string, to?: string) {
  const where: { supplierId: string; date?: { gte?: string; lte?: string } } = { supplierId };

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  const entries = await prisma.supplierAccountEntry.findMany({
    where,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const mapped = entries.map((entry) => ({
    _id: entry.id,
    supplierId: entry.supplierId,
    date: entry.date,
    type: entry.type,
    amount: entry.amount,
    sign: entry.sign as 1 | -1,
    purchaseId: entry.purchaseId ?? undefined,
    paymentMethod: entry.paymentMethod ?? undefined,
    reference: entry.reference ?? undefined,
    notes: entry.notes ?? undefined,
    createdBy: entry.createdBy ?? undefined,
    createdAt: entry.createdAt.toISOString(),
  }));

  const balance = mapped.reduce((acc, entry) => acc + entry.amount * entry.sign, 0);

  return { entries: mapped, balance };
}
