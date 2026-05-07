// ── Bank Account Types ──

export type BankAccountType = 'checking' | 'savings';
export type BankCurrency = 'ARS' | 'USD' | 'EUR';

export interface BankAccount {
  _id: string;
  tenant: string;
  name: string;
  bank: string;
  accountNumber: string;
  type: BankAccountType;
  currency: BankCurrency;
  currentBalance: number;
  lastReconciledAt: string | null;
  lastReconciliationEndDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankAccountRequest {
  name: string;
  bank: string;
  accountNumber: string;
  type?: BankAccountType;
  currency?: BankCurrency;
  currentBalance?: number;
  isActive?: boolean;
}

export interface UpdateBankAccountRequest {
  name?: string;
  bank?: string;
  accountNumber?: string;
  type?: BankAccountType;
  currency?: BankCurrency;
  currentBalance?: number;
  isActive?: boolean;
}

// ── Bank Transaction Types ──

export type TransactionType = 'debit' | 'credit';
export type TransactionStatus = 'pending' | 'cleared' | 'reconciled';
export type MatchedEntryType = 'ClientAccountEntry' | 'SupplierAccountEntry' | 'Order';

export interface BankTransaction {
  _id: string;
  tenant: string;
  bankAccount: string | { _id: string; name: string; bank: string; accountNumber: string };
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  reference: string | null;
  status: TransactionStatus;
  reconciliationDate: string | null;
  matchedEntryType: MatchedEntryType | null;
  matchedEntryId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankTransactionRequest {
  bankAccount: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  reference?: string;
  notes?: string;
}

export interface UpdateBankTransactionRequest {
  date?: string;
  description?: string;
  amount?: number;
  type?: TransactionType;
  reference?: string;
  status?: TransactionStatus;
  notes?: string;
}

// ── Reconciliation Types ──

export interface MatchCandidate {
  id: string;
  type: MatchedEntryType;
  date: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  source?: string;
}

export interface MatchTransactionRequest {
  matchedEntryType: MatchedEntryType;
  matchedEntryId: string;
}

export interface ReconciliationData {
  bankTransactions: BankTransaction[];
  candidates: MatchCandidate[];
  unmatchedTransactions: BankTransaction[];
  unmatchedCandidates: MatchCandidate[];
  balance: {
    current: number;
    unreconciledDebits: number;
    unreconciledCredits: number;
  };
}

export interface ConfirmReconciliationResult {
  lastReconciledAt: string;
  currentBalance: number;
  reconciledCount: number;
  netChange: number;
}

// ── CSV Import Types ──

export interface CsvErrorRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
}

export interface CsvPreviewData {
  totalRows: number;
  validRows: Array<{
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    reference: string | null;
  }>;
  errorRows: CsvErrorRow[];
  detectedBank: string;
}

export interface CsvImportData {
  created: number;
  errors: CsvErrorRow[];
  totalRows: number;
  detectedBank: string;
  message: string;
}

// ── Transaction Filters ──

export interface BankTransactionFilters {
  bankAccount?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: TransactionStatus;
  type?: TransactionType;
}

// ── API Response Types ──

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

export interface ApiMessageResponse {
  success: boolean;
  message: string;
}
