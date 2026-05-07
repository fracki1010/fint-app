// Cash Closing / Cierre de Caja types

export type CashClosingStatus = 'open' | 'closed' | 'reopened';

export interface CashClosing {
  _id: string;
  closingNumber: string;
  openedAt: string;
  closedAt?: string;
  status: CashClosingStatus;
  openedBy: UserInfo;
  closedBy?: UserInfo;

  // Expected amounts
  expectedCash: number;
  expectedCard: number;
  expectedTransfer: number;
  expectedCheck: number;
  expectedOther: number;
  expectedTotal: number;

  // Actual amounts
  actualCash?: number;
  actualCard?: number;
  actualTransfer?: number;
  actualCheck?: number;
  actualOther?: number;
  actualTotal?: number;

  // Discrepancies
  discrepancyCash?: number;
  discrepancyTotal?: number;

  // Summary stats
  orderCount: number;
  totalSales: number;
  totalRefunds: number;
  netSales: number;

  // Reopening
  reopenedAt?: string;
  reopenedBy?: UserInfo;
  reopenReason?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  _id: string;
  fullName: string;
  email: string;
}

export interface PaymentMethodBreakdown {
  cash: { count: number; amount: number };
  card: { count: number; amount: number };
  transfer: { count: number; amount: number };
  check: { count: number; amount: number };
  other: { count: number; amount: number };
}

export interface HourlyBreakdown {
  hour: string;
  orders: number;
  amount: number;
}

export interface ZReportOrder {
  _id: string;
  orderNumber?: string;
  client?: {
    name?: string;
    phone?: string;
  };
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export interface ZReport {
  closing: CashClosing;
  orders: ZReportOrder[];
  paymentBreakdown: PaymentMethodBreakdown;
  hourlyBreakdown: HourlyBreakdown[];
  summary: {
    totalOrders: number;
    totalSales: number;
    netSales: number;
    expectedTotal: number;
    actualTotal: number;
    discrepancy: number;
  };
}

// API Request/Response types
export interface OpenClosingRequest {
  notes?: string;
}

export interface OpenClosingResponse {
  success: boolean;
  message: string;
  data: CashClosing;
}

export interface CloseClosingRequest {
  actualAmounts: {
    cash: number;
    card: number;
    transfer: number;
    check: number;
    other: number;
  };
  notes?: string;
}

export interface CloseClosingResponse {
  success: boolean;
  message: string;
  data: CashClosing;
}

export interface ReopenClosingRequest {
  reason: string;
}

export interface ReopenClosingResponse {
  success: boolean;
  message: string;
  data: CashClosing;
}

export interface ListClosingsResponse {
  success: boolean;
  data: CashClosing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetZReportResponse {
  success: boolean;
  data: ZReport;
}
