import type {
  Purchase,
  SupplierAccountEntry,
  SupplyItem,
  SupplyStockMovement,
} from "../domain/operations";

export const db = {
  supplies: [] as SupplyItem[],
  supplyMovements: [] as SupplyStockMovement[],
  purchases: [] as Purchase[],
  supplierAccountEntries: [] as SupplierAccountEntry[],
};

let seq = 1;

export function genId(prefix: string) {
  seq += 1;

  return `${prefix}_${seq}`;
}

export function nowIso() {
  return new Date().toISOString();
}
