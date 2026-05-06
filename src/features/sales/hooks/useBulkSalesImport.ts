import { useCallback, useMemo } from "react";

import {
  ParsedRow,
  ValidatedRow,
  ValidationError,
  ProductSearchResult,
  ClientMatchResult,
} from "@shared/types/bulkImport";
import { Client, Product } from "@shared/types";
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
  /** Set raw CSV text */
  setRawText: (text: string) => void;
  /** Parse CSV text into rows */
  parse: () => { success: boolean; rowCount: number; errors: ValidationError[] };
  /** Validate parsed rows against products/clients */
  validate: () => Promise<{ success: boolean; validCount: number; invalidCount: number }>;
  /** Import validated rows as orders */
  importRows: () => Promise<{ success: boolean; imported: number; failed: number }>;
  /** Reset the entire import state */
  reset: () => void;
}

/**
 * Hook for managing bulk sales import workflow.
 * Orchestrates the parse → validate → import flow.
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
 *     // Import
 *     const importResult = await importRows();
 *   }
 * }
 * ```
 */
export function useBulkSalesImport(): UseBulkSalesImportReturn {
  const store = useBulkImportStore();
  const { createOrder } = useOrders();
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
   * Import validated rows as orders.
   */
  const importRows = useCallback(async () => {
    const validRows = store.validatedRows.filter((r) => r.status === "valid");

    if (validRows.length === 0) {
      return { success: false, imported: 0, failed: 0 };
    }

    store.startImport();

    let imported = 0;
    let failed = 0;

    // Group rows by client and date for batching
    const groupedRows = groupRowsByClientAndDate(validRows);

    for (const group of groupedRows) {
      try {
        // Build order items from rows in this group
        const items: OrderItem[] = group.rows.map((row) => ({
          product: row.productId!,
          quantity: row.row.cantidad,
          price: row.row.precioUnitario ?? row.productPrice ?? 0,
          productId: row.productId!,
        }));

        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Create the order
        await createOrder({
          client: group.clientId || group.rows[0].row.clienteName, // Use clientId if available, otherwise name
          items,
          totalAmount,
          status: "Confirmada",
          salesStatus: "Confirmada",
          paymentStatus: "Pagado",
          deliveryStatus: "Entregada",
          notes: `Importación masiva - ${group.rows.length} productos`,
          source: "Dashboard",
        });

        // Mark all rows in this group as succeeded
        for (const row of group.rows) {
          store.markRowSuccess(row.row.rowNumber);
          imported++;
        }
      } catch (error) {
        // Mark all rows in this group as failed
        const errorMessage = error instanceof Error ? error.message : "Error al crear orden";

        for (const row of group.rows) {
          store.markRowFailed(row.row.rowNumber, errorMessage);
          failed++;
        }
      }
    }

    store.completeImport();

    return {
      success: failed === 0,
      imported,
      failed,
    };
  }, [store, createOrder]);

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
    setRawText: store.setRawText,
    parse,
    validate,
    importRows,
    reset: store.reset,
  };
}

/**
 * Group validated rows by client and date for efficient order creation.
 * Rows with the same client and date should be combined into a single order.
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
