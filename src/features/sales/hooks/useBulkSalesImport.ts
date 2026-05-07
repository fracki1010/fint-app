import { useCallback, useMemo } from "react";

import {
  ParsedRow,
  ValidatedRow,
  ValidationError,
  ProductSearchResult,
  ClientMatchResult,
} from "@shared/types/bulkImport";
import {
  useBulkImportStore,
  ImportStatus,
  ImportProgress,
} from "@features/sales/stores/bulkImportStore";
import { validateRowsBatch, ValidationOptions } from "@features/sales/utils/importValidation";
import { createClientMatcher } from "@features/sales/utils/clientMatcher";
import { useOrders, OrderItem } from "@features/sales/hooks/useOrders";
import { useClients } from "@features/clients/hooks/useClients";
import { useProducts } from "@features/products/hooks/useProducts";
import {
  withRetry,
  RetryConfig,
} from "@features/sales/utils/importExport";

export interface UseBulkSalesImportReturn {
  /** Current raw CSV text */
  rawText: string;
  /** Parsed rows from CSV */
  parsedRows: ParsedRow[];
  /** Validated rows with product/client matches */
  validatedRows: ValidatedRow[];
  /** Current status of the import process */
  status: ImportStatus;
  /** Progress tracking during import */
  progress: ImportProgress;
  /** All errors collected during parse/validate/import */
  errors: ValidationError[];
  /** Global error message */
  errorMessage: string | null;
  /** Whether currently processing */
  isProcessing: boolean;
  /** Count of valid rows ready to import */
  validRowCount: number;
  /** Count of invalid rows */
  invalidRowCount: number;
  /** Failed rows after import attempt */
  failedRows: ValidatedRow[];
  /** Set raw CSV text */
  setRawText: (text: string) => void;
  /** Parse CSV text into rows */
  parse: () => { success: boolean; rowCount: number; errors: ValidationError[] };
  /** Validate parsed rows against products/clients */
  validate: () => Promise<{ success: boolean; validCount: number; invalidCount: number }>;
  /** Import validated rows as orders using bulk API */
  importRows: (options?: ImportOptions) => Promise<ImportResult>;
  /** Retry failed rows individually */
  retryFailed: (config?: Partial<RetryConfig>) => Promise<ImportResult>;
  /** Reset the entire import state */
  reset: () => void;
}

export interface ImportOptions {
  /** Batch size for bulk API (default: 100) */
  batchSize?: number;
  /** Retry configuration */
  retryConfig?: Partial<RetryConfig>;
  /** Whether to use bulk API or individual orders */
  useBulkAPI?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

/** Default import options */
const DEFAULT_IMPORT_OPTIONS: Required<ImportOptions> = {
  batchSize: 100,
  retryConfig: {
    maxRetries: 2,
    retryDelay: 1000,
    exponentialBackoff: true,
  },
  useBulkAPI: true,
};

/**
 * Hook for managing bulk sales import workflow.
 * Orchestrates the parse → validate → import flow with bulk API integration.
 *
 * @example
 * ```typescript
 * const {
 *   rawText,
 *   setRawText,
 *   parse,
 *   validate,
 *   importRows,
 *   status,
 *   progress,
 *   validRowCount,
 * } = useBulkSalesImport();
 *
 * // Parse CSV
 * const parseResult = parse();
 * if (parseResult.success) {
 *   // Validate against products/clients
 *   const validateResult = await validate();
 *   if (validateResult.validCount > 0) {
 *     // Import with bulk API
 *     const importResult = await importRows();
 *     if (importResult.failed > 0) {
 *       // Retry failed rows
 *       await retryFailed();
 *     }
 *   }
 * }
 * ```
 */
export function useBulkSalesImport(): UseBulkSalesImportReturn {
  const store = useBulkImportStore();
  const { createOrder, bulkCreateOrders } = useOrders();
  const { clients } = useClients();
  const { products } = useProducts();

  // Memoize counts
  const validRowCount = useMemo(
    () => store.validatedRows.filter((r) => r.status === "valid").length,
    [store.validatedRows],
  );

  const invalidRowCount = useMemo(
    () => store.validatedRows.filter((r) => r.status === "invalid").length,
    [store.validatedRows],
  );

  const failedRows = useMemo(
    () =>
      store.validatedRows.filter(
        (r) => r.status === "valid" && store.errors.some((e) => e.rowNumber === r.row.rowNumber),
      ),
    [store.validatedRows, store.errors],
  );

  const isProcessing = useMemo(
    () => store.status === "parsing" || store.status === "validating" || store.status === "importing",
    [store.status],
  );

  /**
   * Search for a product by name, SKU, or barcode.
   */
  const findProduct = useCallback(
    (query: string): ProductSearchResult => {
      const normalizedQuery = query.toLowerCase().trim();

      // Try exact match on name first
      const exactMatch = products.find(
        (p) => p.name.toLowerCase() === normalizedQuery,
      );

      if (exactMatch) {
        return {
          found: true,
          productId: exactMatch._id,
          productName: exactMatch.name,
          price: exactMatch.price,
        };
      }

      // Try SKU match
      const skuMatch = products.find(
        (p) => p.sku?.toLowerCase() === normalizedQuery,
      );

      if (skuMatch) {
        return {
          found: true,
          productId: skuMatch._id,
          productName: skuMatch.name,
          price: skuMatch.price,
        };
      }

      // Try barcode match
      const barcodeMatch = products.find(
        (p) => p.barcode?.toLowerCase() === normalizedQuery,
      );

      if (barcodeMatch) {
        return {
          found: true,
          productId: barcodeMatch._id,
          productName: barcodeMatch.name,
          price: barcodeMatch.price,
        };
      }

      // Try partial name match
      const partialMatch = products.find((p) =>
        p.name.toLowerCase().includes(normalizedQuery),
      );

      if (partialMatch) {
        return {
          found: true,
          productId: partialMatch._id,
          productName: partialMatch.name,
          price: partialMatch.price,
        };
      }

      return { found: false };
    },
    [products],
  );

  /**
   * Match client by name and phone using the clientMatcher utility.
   */
  const findClient = useCallback(
    (name: string, phone?: string): ClientMatchResult => {
      const matcher = createClientMatcher(clients);

      return matcher(name, phone);
    },
    [clients],
  );

  /**
   * Parse CSV text into structured rows.
   */
  const parse = useCallback(() => {
    const result = store.parseCSV();

    return {
      success: result.errors.length === 0 || result.rows.length > 0,
      rowCount: result.rows.length,
      errors: result.errors.map((err) => ({
        type: "INVALID_DATE" as const,
        message: err.message,
        rowNumber: err.row,
      })),
    };
  }, [store]);

  /**
   * Validate parsed rows against products and clients.
   */
  const validate = useCallback(async () => {
    if (store.parsedRows.length === 0) {
      return { success: false, validCount: 0, invalidCount: 0 };
    }

    store.setStatus("validating");
    store.setValidatedRows([]);

    const validationOptions: ValidationOptions = {
      findProduct,
      findClient,
    };

    try {
      const validated = await validateRowsBatch(store.parsedRows, validationOptions);

      store.setValidatedRows(validated);

      const validCount = validated.filter((r) => r.status === "valid").length;
      const invalidCount = validated.filter((r) => r.status === "invalid").length;

      store.setStatus(validCount > 0 ? "ready" : "error");

      return {
        success: validCount > 0,
        validCount,
        invalidCount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error de validación";

      store.setError(message);

      return { success: false, validCount: 0, invalidCount: store.parsedRows.length };
    }
  }, [store, findProduct, findClient]);

  /**
   * Convert validated rows to order format for API.
   */
  const convertToOrderFormat = useCallback(
    (rows: ValidatedRow[]): Array<{
      client: string;
      clientName?: string;
      clientPhone?: string;
      items: OrderItem[];
      totalAmount: number;
      status: "Confirmada";
      salesStatus: "Confirmada";
      paymentStatus: "Pagado";
      deliveryStatus: "Entregada";
      paymentMethod: string;
      notes: string;
      source: "Dashboard";
      createdAt: string;
    }> => {
      // Group rows by client and date
      const groups = groupRowsByClientAndDate(rows);

      return groups.map((group) => {
        const items: OrderItem[] = group.rows.map((row) => ({
          product: row.productId!,
          quantity: row.row.cantidad,
          price: row.row.precioUnitario ?? row.productPrice ?? 0,
          productId: row.productId!,
        }));

        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Get the date from the first row (all rows in group have same date)
        const dateStr = group.rows[0].row.fecha.toISOString();

        return {
          client: group.clientId || group.clientName,
          clientName: group.clientName,
          clientPhone: group.rows[0].row.clientePhone,
          items,
          totalAmount,
          status: "Confirmada",
          salesStatus: "Confirmada",
          paymentStatus: "Pagado",
          deliveryStatus: "Entregada",
          paymentMethod: group.rows[0].row.metodoPago,
          notes: `Importación masiva - ${group.rows.length} producto(s)`,
          source: "Dashboard" as const,
          createdAt: dateStr,
        };
      });
    },
    [],
  );

  /**
   * Import validated rows as orders using bulk API.
   */
  const importRows = useCallback(
    async (options: ImportOptions = {}): Promise<ImportResult> => {
      const opts = { ...DEFAULT_IMPORT_OPTIONS, ...options };
      const validRows = store.validatedRows.filter((r) => r.status === "valid");

      if (validRows.length === 0) {
        return { success: false, imported: 0, failed: 0, errors: [] };
      }

      store.startImport();

      try {
        let imported = 0;
        let failed = 0;
        const errors: Array<{ row: number; error: string }> = [];

        if (opts.useBulkAPI && bulkCreateOrders) {
          // Use bulk API with batching
          const orders = convertToOrderFormat(validRows);

          // Process in batches
          for (let i = 0; i < orders.length; i += opts.batchSize) {
            const batch = orders.slice(i, i + opts.batchSize);

            try {
              const result = await withRetry(
                () => bulkCreateOrders(batch),
                opts.retryConfig,
                (attempt, error) => {
                  console.warn(`Retry attempt ${attempt} for batch ${i / opts.batchSize + 1}:`, error.message);
                },
              );

              imported += result.imported;
              failed += result.failed;

              if (result.errors) {
                errors.push(...result.errors.map((e) => ({ row: e.row, error: e.error })));
              }

              // Update progress
              const processedCount = Math.min(i + batch.length, orders.length);
              store.updateProgress({
                processed: processedCount,
                succeeded: imported,
                failed,
              });

              // Mark individual rows
              for (let j = 0; j < batch.length; j++) {
                const batchIndex = i + j;
                if (batchIndex < validRows.length) {
                  // Approximate success/failure based on proportion
                  const successRate = result.imported / (result.imported + result.failed);
                  const expectedSuccesses = Math.round(batch.length * successRate);

                  if (j < expectedSuccesses) {
                    store.markRowSuccess(validRows[batchIndex].row.rowNumber);
                  } else {
                    store.markRowFailed(
                      validRows[batchIndex].row.rowNumber,
                      "Error al crear la orden",
                    );
                  }
                }
              }
            } catch (error) {
              // Batch completely failed
              const errorMessage = error instanceof Error ? error.message : "Error desconocido";
              failed += batch.length;

              for (let j = 0; j < batch.length; j++) {
                const batchIndex = i + j;
                if (batchIndex < validRows.length) {
                  store.markRowFailed(validRows[batchIndex].row.rowNumber, errorMessage);
                  errors.push({
                    row: validRows[batchIndex].row.rowNumber,
                    error: errorMessage,
                  });
                }
              }

              store.updateProgress({
                processed: i + batch.length,
                succeeded: imported,
                failed,
              });
            }
          }
        } else {
          // Fallback to individual order creation
          for (let i = 0; i < validRows.length; i++) {
            const row = validRows[i];

            try {
              const orderData = convertToOrderFormat([row])[0];

              await withRetry(
                () => createOrder(orderData),
                opts.retryConfig,
              );

              store.markRowSuccess(row.row.rowNumber);
              imported++;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Error al crear orden";
              store.markRowFailed(row.row.rowNumber, errorMessage);
              failed++;
              errors.push({ row: row.row.rowNumber, error: errorMessage });
            }

            store.updateProgress({
              processed: i + 1,
              succeeded: imported,
              failed,
            });
          }
        }

        store.completeImport();

        return {
          success: failed === 0,
          imported,
          failed,
          errors,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error de importación";
        store.setError(message);

        return {
          success: false,
          imported: 0,
          failed: validRows.length,
          errors: validRows.map((r) => ({ row: r.row.rowNumber, error: message })),
        };
      }
    },
    [store, convertToOrderFormat, bulkCreateOrders, createOrder],
  );

  /**
   * Retry failed rows individually.
   */
  const retryFailed = useCallback(
    async (config: Partial<RetryConfig> = {}): Promise<ImportResult> => {
      const currentFailed = store.validatedRows.filter(
        (r) =>
          r.status === "valid" &&
          store.errors.some((e) => e.rowNumber === r.row.rowNumber),
      );

      if (currentFailed.length === 0) {
        return { success: true, imported: 0, failed: 0, errors: [] };
      }

      const orders = convertToOrderFormat(currentFailed);
      let imported = 0;
      let failed = 0;
      const errors: Array<{ row: number; error: string }> = [];

      for (let i = 0; i < orders.length; i++) {
        try {
          await withRetry(
            () => createOrder(orders[i]),
            { maxRetries: 3, retryDelay: 1000, exponentialBackoff: true, ...config },
          );

          // Remove from errors on success
          const errorIndex = store.errors.findIndex(
            (e) => e.rowNumber === currentFailed[i].row.rowNumber,
          );
          if (errorIndex >= 0) {
            store.errors.splice(errorIndex, 1);
          }

          imported++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Error al reintentar";
          failed++;
          errors.push({ row: currentFailed[i].row.rowNumber, error: errorMessage });
        }
      }

      return { success: failed === 0, imported, failed, errors };
    },
    [store, convertToOrderFormat, createOrder],
  );

  return {
    rawText: store.rawText,
    parsedRows: store.parsedRows,
    validatedRows: store.validatedRows,
    status: store.status,
    progress: store.progress,
    errors: store.errors,
    errorMessage: store.errorMessage,
    isProcessing,
    validRowCount,
    invalidRowCount,
    failedRows,
    setRawText: store.setRawText,
    parse,
    validate,
    importRows,
    retryFailed,
    reset: store.reset,
  };
}

/**
 * Group validated rows by client and date for efficient order creation.
 */
interface RowGroup {
  clientId: string | undefined;
  clientName: string;
  date: string;
  rows: ValidatedRow[];
  productPrice?: number;
}

function groupRowsByClientAndDate(rows: ValidatedRow[]): RowGroup[] {
  const groups = new Map<string, RowGroup>();

  for (const row of rows) {
    const dateKey = row.row.fecha.toISOString().split("T")[0];
    const clientKey = row.clientId || row.row.clienteName;
    const groupKey = `${clientKey}-${dateKey}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        clientId: row.clientId,
        clientName: row.row.clienteName,
        date: dateKey,
        rows: [],
        productPrice: row.row.precioUnitario,
      });
    }

    groups.get(groupKey)!.rows.push(row);
  }

  return Array.from(groups.values());
}
