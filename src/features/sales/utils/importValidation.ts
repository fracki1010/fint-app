import {
  ParsedRow,
  ValidatedRow,
  ValidationError,
  ValidationErrorType,
  ProductSearchResult,
  ClientMatchResult,
} from "@shared/types/bulkImport";

/**
 * Validates a parsed row against business rules.
 * Performs structural validation and checks for data integrity.
 *
 * @param row - The parsed row to validate
 * @param options - Validation options including product/client lookups
 * @returns Validation result with status, errors, and warnings
 *
 * @example
 * ```typescript
 * const result = validateRow(parsedRow, {
 *   findProduct: (query) => productStore.find(q),
 *   findClient: (name, phone) => clientStore.match(name, phone),
 *   today: new Date()
 * });
 * ```
 */
export interface ValidationOptions {
  /** Function to search for a product by name/barcode/SKU */
  findProduct: (query: string) => ProductSearchResult | Promise<ProductSearchResult>;
  /** Function to match a client by name and optional phone */
  findClient: (name: string, phone?: string) => ClientMatchResult | Promise<ClientMatchResult>;
  /** Reference date for validation (defaults to now) */
  today?: Date;
}

/**
 * Validates a single parsed row.
 * This is a synchronous validation that doesn't require async lookups.
 *
 * @param row - The parsed row to validate
 * @param today - Reference date for date validation (defaults to now)
 * @returns Validated row with any structural errors
 */
export function validateRowSync(row: ParsedRow, today: Date = new Date()): ValidatedRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate date is not in the future
  const dateValidation = validateDate(row.fecha, today);
  if (!dateValidation.valid) {
    errors.push(dateValidation.error!);
  }

  // Validate quantity is positive
  if (isNaN(row.cantidad) || row.cantidad <= 0) {
    errors.push("Cantidad debe ser mayor a cero");
  }

  // Validate client name is present
  if (!row.clienteName || row.clienteName.trim().length === 0) {
    errors.push("Nombre de cliente es requerido");
  }

  // Validate product query is present
  if (!row.productoQuery || row.productoQuery.trim().length === 0) {
    errors.push("Nombre de producto es requerido");
  }

  // Check if unit price is valid if provided
  if (row.precioUnitario !== undefined && (isNaN(row.precioUnitario) || row.precioUnitario < 0)) {
    errors.push("Precio unitario inválido");
  }

  const status: ValidatedRow["status"] = errors.length > 0 ? "invalid" : "valid";

  return {
    row,
    status,
    errors,
    warnings,
  };
}

/**
 * Performs async validation including product and client lookups.
 *
 * @param row - The parsed row to validate
 * @param options - Validation options with lookup functions
 * @returns Fully validated row with matched product/client info
 */
export async function validateRowAsync(
  row: ParsedRow,
  options: ValidationOptions,
): Promise<ValidatedRow> {
  const today = options.today || new Date();

  // Start with sync validation
  const validated = validateRowSync(row, today);

  // If already invalid, don't proceed with async lookups
  if (validated.status === "invalid") {
    return validated;
  }

  // Look up product
  const productResult = await options.findProduct(row.productoQuery);
  if (!productResult.found) {
    validated.status = "invalid";
    validated.errors.push("Producto no encontrado");
  } else {
    validated.productId = productResult.productId;
    validated.productName = productResult.productName;

    // Check if we should use product price as fallback
    if (row.precioUnitario === undefined && productResult.price !== undefined) {
      // This is not an error, just using the product's current price
    }
  }

  // Look up client
  const clientResult = await options.findClient(row.clienteName, row.clientePhone);
  if (clientResult.matched && clientResult.clientId) {
    validated.clientId = clientResult.clientId;
    validated.isNewClient = false;
  } else {
    validated.isNewClient = true;
    // Not an error - new clients will be auto-created
  }

  return validated;
}

/**
 * Validates multiple rows in batch.
 *
 * @param rows - Array of parsed rows to validate
 * @param options - Validation options
 * @returns Array of validated rows
 */
export async function validateRowsBatch(
  rows: ParsedRow[],
  options: ValidationOptions,
): Promise<ValidatedRow[]> {
  const promises = rows.map((row) => validateRowAsync(row, options));

  return Promise.all(promises);
}

/**
 * Validates that a date is not in the future.
 *
 * @param date - The date to validate
 * @param today - Reference date (defaults to now)
 * @returns Validation result
 */
export function validateDate(
  date: Date,
  today: Date = new Date(),
): { valid: boolean; error?: string } {
  // Reset time components to compare dates only
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (isNaN(dateOnly.getTime())) {
    return { valid: false, error: "Fecha inválida" };
  }

  if (dateOnly > todayOnly) {
    return { valid: false, error: "La fecha no puede ser futura" };
  }

  return { valid: true };
}

/**
 * Validates that a quantity is a positive integer.
 *
 * @param quantity - The quantity to validate
 * @returns Validation result
 */
export function validateQuantity(quantity: number): { valid: boolean; error?: string } {
  if (isNaN(quantity)) {
    return { valid: false, error: "Cantidad debe ser un número" };
  }

  if (quantity <= 0) {
    return { valid: false, error: "Cantidad debe ser mayor a cero" };
  }

  if (!Number.isInteger(quantity)) {
    return { valid: false, error: "Cantidad debe ser un número entero" };
  }

  return { valid: true };
}

/**
 * Validates that a price is non-negative.
 *
 * @param price - The price to validate
 * @returns Validation result
 */
export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (isNaN(price)) {
    return { valid: false, error: "Precio inválido" };
  }

  if (price < 0) {
    return { valid: false, error: "Precio no puede ser negativo" };
  }

  return { valid: true };
}

/**
 * Checks if stock is sufficient for a given date.
 * This is a placeholder for historical stock validation.
 *
 * @param productId - The product ID
 * @param quantity - The requested quantity
 * @param date - The sale date
 * @returns Validation result with warning if stock insufficient
 */
export async function validateHistoricalStock(
  _productId: string,
  _quantity: number,
  _date: Date,
): Promise<{ sufficient: boolean; available?: number; warning?: string }> {
  // This would typically call an API to check historical stock
  // For now, we return a placeholder that allows the import
  // with a warning if needed

  // TODO: Implement actual historical stock check via API
  return {
    sufficient: true,
  };
}

/**
 * Creates a validation error object.
 *
 * @param type - Error type code
 * @param message - Human-readable message
 * @param rowNumber - Row where error occurred
 * @param field - Optional field name
 * @returns Validation error object
 */
export function createValidationError(
  type: ValidationErrorType,
  message: string,
  rowNumber: number,
  field?: string,
): ValidationError {
  return {
    type,
    message,
    rowNumber,
    field,
  };
}

/**
 * Aggregates validation errors from multiple rows.
 *
 * @param validatedRows - Array of validated rows
 * @returns Array of validation errors
 */
export function aggregateValidationErrors(validatedRows: ValidatedRow[]): ValidationError[] {
  const errors: ValidationError[] = [];

  validatedRows.forEach((validatedRow) => {
    if (validatedRow.status === "invalid") {
      validatedRow.errors.forEach((errorMsg) => {
        // Map error messages to error types (simplified mapping)
        let type: ValidationErrorType = "INVALID_DATE";

        if (errorMsg.includes("fecha")) type = "INVALID_DATE";
        else if (errorMsg.includes("futura")) type = "FUTURE_DATE";
        else if (errorMsg.includes("Cantidad")) type = "INVALID_QUANTITY";
        else if (errorMsg.includes("Producto")) type = "PRODUCT_NOT_FOUND";
        else if (errorMsg.includes("cliente")) type = "CLIENT_REQUIRED";
        else if (errorMsg.includes("Stock")) type = "INSUFFICIENT_STOCK";

        errors.push(
          createValidationError(type, errorMsg, validatedRow.row.rowNumber),
        );
      });
    }
  });

  return errors;
}

/**
 * Filters rows by validation status.
 *
 * @param rows - Array of validated rows
 * @param status - Status to filter by
 * @returns Filtered rows
 */
export function filterRowsByStatus(
  rows: ValidatedRow[],
  status: ValidatedRow["status"],
): ValidatedRow[] {
  return rows.filter((row) => row.status === status);
}

/**
 * Counts rows by validation status.
 *
 * @param rows - Array of validated rows
 * @returns Counts for each status
 */
export function countRowsByStatus(rows: ValidatedRow[]): {
  valid: number;
  invalid: number;
  warning: number;
} {
  return rows.reduce(
    (counts, row) => {
      counts[row.status]++;
      return counts;
    },
    { valid: 0, invalid: 0, warning: 0 },
  );
}
