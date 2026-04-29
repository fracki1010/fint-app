export type SupplierAccountEntryType =
  | "CHARGE"
  | "PAYMENT"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE";

export interface SupplierAccountEntry {
  _id: string;
  supplierId: string;
  date: string;
  type: SupplierAccountEntryType;
  amount: number;
  sign: 1 | -1;
  purchaseId?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface SupplierBalance {
  supplierId: string;
  balance: number;
  updatedAt?: string;
}
