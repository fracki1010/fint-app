/** Represents a raw CSV row before parsing */
export interface CsvRow {
  fecha: string;
  cliente: string;
  producto: string;
  cantidad: string;
  precio_unitario?: string;
  metodo_pago?: string;
  notas?: string;
}

/** Represents a parsed and normalized row with typed values */
export interface ParsedRow {
  /** Original row number in the CSV (1-indexed) */
  rowNumber: number;
  /** Parsed date */
  fecha: Date;
  /** Client name (extracted from cliente column) */
  clienteName: string;
  /** Client phone (extracted from cliente column if present) */
  clientePhone?: string;
  /** Product query string (name, barcode, or SKU) */
  productoQuery: string;
  /** Quantity as a positive integer */
  cantidad: number;
  /** Unit price (optional, falls back to product price) */
  precioUnitario?: number;
  /** Payment method (defaults to "Efectivo") */
  metodoPago: string;
  /** Additional notes */
  notas: string;
}

/** Represents the result of validating a parsed row */
export interface ValidatedRow {
  /** The parsed row data */
  row: ParsedRow;
  /** Validation status */
  status: "valid" | "invalid" | "warning";
  /** Error messages for invalid rows */
  errors: string[];
  /** Warning messages for rows with issues */
  warnings: string[];
  /** Matched product ID (if found) */
  productId?: string;
  /** Matched product name (if found) */
  productName?: string;
  /** Matched client ID (if found) */
  clientId?: string;
  /** Whether this is a new client that will be created */
  isNewClient?: boolean;
  /** Stock available on the sale date */
  stockAtDate?: number;
}

/** Represents the overall state of a bulk import operation */
export interface BulkImportState {
  /** Current stage of the import process */
  stage: "input" | "preview" | "importing" | "complete";
  /** All validated rows */
  rows: ValidatedRow[];
  /** Progress tracking for import phase */
  progress: { current: number; total: number };
  /** Final results after import */
  results: {
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  };
}

/** Client information extracted from CSV */
export interface ExtractedClientInfo {
  /** Client name */
  name: string;
  /** Optional phone number */
  phone?: string;
}

/** Result of matching a client */
export interface ClientMatchResult {
  /** Whether a match was found */
  matched: boolean;
  /** The matched client ID (if found) */
  clientId?: string;
  /** Whether this would be a new client */
  isNew: boolean;
  /** Confidence score for fuzzy matches (0-1) */
  confidence?: number;
}

/** Payment method options */
export type ImportPaymentMethod = "cash" | "card" | "transfer" | "Efectivo";

/** Product search result */
export interface ProductSearchResult {
  /** Whether product was found */
  found: boolean;
  /** Product ID (if found) */
  productId?: string;
  /** Product name (if found) */
  productName?: string;
  /** Current product price */
  price?: number;
}

/** CSV parse result */
export interface CsvParseResult {
  /** Successfully parsed rows */
  rows: ParsedRow[];
  /** Parse errors by row number */
  errors: Array<{ row: number; message: string }>;
  /** Total rows processed */
  totalRows: number;
}

/** Validation error types */
export type ValidationErrorType =
  | "INVALID_DATE"
  | "FUTURE_DATE"
  | "INVALID_QUANTITY"
  | "PRODUCT_NOT_FOUND"
  | "CLIENT_REQUIRED"
  | "INSUFFICIENT_STOCK";

/** Validation error with context */
export interface ValidationError {
  /** Error type code */
  type: ValidationErrorType;
  /** Human-readable error message */
  message: string;
  /** Row number where error occurred */
  rowNumber: number;
  /** Field that caused the error */
  field?: string;
}
