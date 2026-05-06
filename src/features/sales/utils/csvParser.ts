import Papa from "papaparse";

import {
  CsvRow,
  CsvParseResult,
  ParsedRow,
  ExtractedClientInfo,
} from "@shared/types/bulkImport";

/**
 * Default payment method when not specified in CSV
 */
const DEFAULT_PAYMENT_METHOD = "Efectivo";

/**
 * Parses CSV or TSV text into structured data.
 * Supports quoted fields, newlines within fields, and tab-separated values.
 *
 * @param csvText - The raw CSV or TSV text to parse
 * @returns Parse result with normalized rows and any errors
 *
 * @example
 * ```typescript
 * const result = parseCSV(`fecha,cliente,producto,cantidad
 * 15/01/2024,Juan Pérez,Producto A,5`);
 * ```
 */
export function parseCSV(csvText: string): CsvParseResult {
  const result: CsvParseResult = {
    rows: [],
    errors: [],
    totalRows: 0,
  };

  // Detect if this is TSV (contains tabs but no commas in header)
  const firstLine = csvText.split("\n")[0] || "";
  const delimiter = firstLine.includes("\t") && !firstLine.includes(",") ? "\t" : ",";

  const parseResult = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: (header) => header.trim().toLowerCase(),
    transform: (value) => value.trim(),
  });

  if (parseResult.errors.length > 0) {
    // Map PapaParse errors to our error format
    parseResult.errors.forEach((error) => {
      if (error.row !== undefined) {
        result.errors.push({
          row: error.row + 2, // PapaParse is 0-indexed for data, +1 for header, +1 for human-readable
          message: error.message,
        });
      }
    });
  }

  // Process each row
  parseResult.data.forEach((rawRow, index) => {
    const rowNumber = index + 1;

    try {
      const parsedRow = normalizeRow(rawRow, rowNumber);
      result.rows.push(parsedRow);
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Error desconocido al procesar la fila",
      });
    }
  });

  result.totalRows = parseResult.data.length;

  return result;
}

/**
 * Normalizes a raw CSV row into a structured ParsedRow.
 *
 * @param rawRow - Raw row data from PapaParse
 * @param rowNumber - The row number (1-indexed)
 * @returns Normalized ParsedRow
 * @throws Error if required fields are missing or invalid
 */
function normalizeRow(rawRow: CsvRow, rowNumber: number): ParsedRow {
  // Validate required fields
  if (!rawRow.fecha) {
    throw new Error("Falta el campo obligatorio: fecha");
  }
  if (!rawRow.cliente) {
    throw new Error("Falta el campo obligatorio: cliente");
  }
  if (!rawRow.producto) {
    throw new Error("Falta el campo obligatorio: producto");
  }
  if (!rawRow.cantidad) {
    throw new Error("Falta el campo obligatorio: cantidad");
  }

  // Parse and validate date
  const fecha = parseDate(rawRow.fecha);
  if (!fecha) {
    throw new Error(`Fecha inválida: "${rawRow.fecha}". Use DD/MM/YYYY o YYYY-MM-DD`);
  }

  // Parse and validate quantity
  const cantidad = parseQuantity(rawRow.cantidad);
  if (isNaN(cantidad) || cantidad <= 0) {
    throw new Error(`Cantidad inválida: "${rawRow.cantidad}". Debe ser un número positivo`);
  }

  // Extract client info
  const clientInfo = extractClientInfo(rawRow.cliente);

  // Parse optional unit price
  let precioUnitario: number | undefined;
  if (rawRow.precio_unitario) {
    precioUnitario = parsePrice(rawRow.precio_unitario);
    if (isNaN(precioUnitario) || precioUnitario < 0) {
      throw new Error(`Precio unitario inválido: "${rawRow.precio_unitario}"`);
    }
  }

  return {
    rowNumber,
    fecha,
    clienteName: clientInfo.name,
    clientePhone: clientInfo.phone,
    productoQuery: rawRow.producto.trim(),
    cantidad,
    precioUnitario,
    metodoPago: rawRow.metodo_pago?.trim() || DEFAULT_PAYMENT_METHOD,
    notas: rawRow.notas?.trim() || "",
  };
}

/**
 * Parses a date string in DD/MM/YYYY or YYYY-MM-DD format.
 *
 * @param dateStr - Date string to parse
 * @returns Date object or null if invalid
 *
 * @example
 * ```typescript
 * parseDate("15/01/2024"); // Returns Date object
 * parseDate("2024-01-15"); // Returns Date object
 * parseDate("invalid");    // Returns null
 * ```
 */
export function parseDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();

  // Try DD/MM/YYYY format
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const date = new Date(year, month, day);

    // Validate the date is valid (e.g., not 31/02/2024)
    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
      return date;
    }
  }

  // Try YYYY-MM-DD format
  const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1;
    const day = parseInt(yyyymmddMatch[3], 10);
    const date = new Date(year, month, day);

    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
      return date;
    }
  }

  return null;
}

/**
 * Parses a quantity string into a positive integer.
 *
 * @param quantityStr - Quantity string to parse
 * @returns Parsed quantity as integer
 */
export function parseQuantity(quantityStr: string): number {
  const cleaned = quantityStr.trim().replace(/,/g, "");
  const parsed = parseInt(cleaned, 10);

  return parsed;
}

/**
 * Parses a price string into a number.
 * Handles both comma and dot as decimal separators.
 *
 * @param priceStr - Price string to parse
 * @returns Parsed price as number
 */
export function parsePrice(priceStr: string): number {
  const cleaned = priceStr.trim().replace(/,/g, "");
  const parsed = parseFloat(cleaned);

  return parsed;
}

/**
 * Extracts client name and optional phone from the cliente column.
 * Expected format: "Name" or "Name,Phone"
 *
 * @param clienteStr - Raw client string from CSV
 * @returns Extracted client information
 *
 * @example
 * ```typescript
 * extractClientInfo("Juan Pérez");
 * // Returns: { name: "Juan Pérez" }
 *
 * extractClientInfo("Juan Pérez,1234567890");
 * // Returns: { name: "Juan Pérez", phone: "1234567890" }
 * ```
 */
export function extractClientInfo(clienteStr: string): ExtractedClientInfo {
  const trimmed = clienteStr.trim();

  // Check if there's a comma indicating phone number
  const lastCommaIndex = trimmed.lastIndexOf(",");

  if (lastCommaIndex === -1) {
    // No comma, just name
    return { name: trimmed };
  }

  const name = trimmed.substring(0, lastCommaIndex).trim();
  const phone = trimmed.substring(lastCommaIndex + 1).trim();

  // Validate phone looks like a phone number (at least 7 digits)
  const phoneDigits = phone.replace(/\D/g, "");

  if (phoneDigits.length >= 7) {
    return { name, phone: phoneDigits };
  }

  // If it doesn't look like a phone, treat the whole thing as name
  return { name: trimmed };
}

/**
 * Validates if a parsed row has all required fields.
 * This is a lightweight validation for structural integrity.
 *
 * @param row - The parsed row to validate
 * @returns Array of error messages, empty if valid
 */
export function validateParsedRowStructure(row: ParsedRow): string[] {
  const errors: string[] = [];

  if (!row.fecha || isNaN(row.fecha.getTime())) {
    errors.push("Fecha inválida");
  }

  if (!row.clienteName || row.clienteName.trim().length === 0) {
    errors.push("Nombre de cliente requerido");
  }

  if (!row.productoQuery || row.productoQuery.trim().length === 0) {
    errors.push("Nombre de producto requerido");
  }

  if (isNaN(row.cantidad) || row.cantidad <= 0) {
    errors.push("Cantidad debe ser un número positivo");
  }

  return errors;
}
