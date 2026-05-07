/** Utility functions for importing and exporting sales data */

import { ValidatedRow } from "@shared/types/bulkImport";

/**
 * Generates a CSV string from failed rows for re-import.
 * Only includes rows that failed during import, preserving original data.
 */
export function generateFailedRowsCSV(failedRows: ValidatedRow[]): string {
  if (failedRows.length === 0) {
    return "";
  }

  // CSV Header
  const headers = [
    "fecha",
    "cliente",
    "producto",
    "cantidad",
    "precio_unitario",
    "metodo_pago",
    "notas",
    "error",
  ];

  // Build CSV rows
  const rows = failedRows.map((validatedRow) => {
    const row = validatedRow.row;
    const errorMessage = validatedRow.errors.join("; ") || "Error desconocido";

    // Format client with phone if available
    const cliente = row.clientePhone
      ? `${row.clienteName},${row.clientePhone}`
      : row.clienteName;

    // Format date as DD/MM/YYYY
    const fecha = formatDateToDDMMYYYY(row.fecha);

    // Escape fields that might contain commas or quotes
    const fields = [
      fecha,
      escapeCSVField(cliente),
      escapeCSVField(row.productoQuery),
      row.cantidad.toString(),
      row.precioUnitario?.toString() || "",
      row.metodoPago,
      escapeCSVField(row.notas),
      escapeCSVField(errorMessage),
    ];

    return fields.join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generates a CSV template for bulk import with example data.
 */
export function generateImportTemplate(): string {
  const headers = [
    "fecha",
    "cliente",
    "producto",
    "cantidad",
    "precio_unitario",
    "metodo_pago",
    "notas",
  ];

  const exampleRows = [
    // Example 1: Complete row
    "15/01/2024,Juan Pérez,1234567890123,2,150.00,Efectivo,Venta de ejemplo",
    // Example 2: Without optional price (uses product price)
    "16/01/2024,María García,Producto A,1,,Tarjeta,",
    // Example 3: Client with phone
    "17/01/2024,Carlos López,5555555555555,3,200.50,Transferencia,Nota importante",
  ];

  const comments = [
    "# Plantilla de importación de ventas",
    "#",
    "# Columnas:",
    "# - fecha: DD/MM/AAAA o YYYY-MM-DD (requerido)",
    "# - cliente: Nombre o 'Nombre,Teléfono' (requerido)",
    "# - producto: Nombre, código de barras o SKU (requerido)",
    "# - cantidad: Número entero positivo (requerido)",
    "# - precio_unitario: Precio (opcional, usa precio del producto si no se especifica)",
    "# - metodo_pago: Efectivo, Tarjeta, o Transferencia (opcional, default: Efectivo)",
    "# - notas: Cualquier texto adicional (opcional)",
    "#",
    "# Notas:",
    "# - Las fechas deben ser en el pasado (no futuras)",
    "# - Los clientes nuevos se crearán automáticamente",
    "# - El producto se busca por nombre, código de barras o SKU",
  ];

  return [...comments, headers.join(","), ...exampleRows].join("\n");
}

/**
 * Downloads content as a CSV file.
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Create download link
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports failed rows as a downloadable CSV file.
 */
export function exportFailedRows(
  failedRows: ValidatedRow[],
  filename?: string,
): void {
  const csv = generateFailedRowsCSV(failedRows);

  if (!csv) {
    throw new Error("No hay filas fallidas para exportar");
  }

  const defaultFilename = `ventas_fallidas_${formatDateForFilename(new Date())}.csv`;
  downloadCSV(csv, filename || defaultFilename);
}

/**
 * Downloads the import template.
 */
export function downloadImportTemplate(): void {
  const template = generateImportTemplate();
  const filename = `plantilla_importacion_ventas.csv`;
  downloadCSV(template, filename);
}

/**
 * Formats a Date to DD/MM/YYYY string.
 */
function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formats a date for use in filenames.
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}`;
}

/**
 * Escapes a field for CSV format.
 * Wraps in quotes if contains comma, quote, or newline.
 */
export function escapeCSVField(field: string): string {
  if (!field) return "";

  // Check if we need quotes
  const needsQuotes =
    field.includes(",") ||
    field.includes('"') ||
    field.includes("\n") ||
    field.includes("\r");

  if (!needsQuotes) {
    return field;
  }

  // Escape quotes by doubling them
  const escaped = field.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Retry configuration for failed operations.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelay: number;
  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
}

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
};

/**
 * Executes an async function with retry logic.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: Error) => void,
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < fullConfig.maxRetries) {
        const delay = fullConfig.exponentialBackoff
          ? fullConfig.retryDelay * Math.pow(2, attempt)
          : fullConfig.retryDelay;

        onRetry?.(attempt + 1, lastError);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Retries failed rows individually.
 * Returns results for each row with success/failure status.
 */
export async function retryFailedRows<T>(
  rows: ValidatedRow[],
  importFn: (row: ValidatedRow) => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<{
  succeeded: Array<{ row: ValidatedRow; result: T }>;
  failed: Array<{ row: ValidatedRow; error: Error }>;
}> {
  const results = {
    succeeded: [] as Array<{ row: ValidatedRow; result: T }>,
    failed: [] as Array<{ row: ValidatedRow; error: Error }>,
  };

  for (const row of rows) {
    try {
      const result = await withRetry(() => importFn(row), config);
      results.succeeded.push({ row, result });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      results.failed.push({ row, error: errorObj });
    }
  }

  return results;
}

/**
 * Sleep utility for delays.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parses a CSV file content.
 * Simple parser for file reading scenarios.
 */
export function parseCSVFile(content: string): {
  headers: string[];
  rows: string[][];
} {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseCSVLine(line));

  return { headers, rows };
}

/**
 * Parses a single CSV line respecting quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Validates that a file is a valid CSV/TSV.
 */
export function validateImportFile(
  file: File,
): { valid: boolean; error?: string } {
  const validExtensions = [".csv", ".tsv", ".txt"];
  const maxSizeMB = 5;

  // Check extension
  const hasValidExtension = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Formato de archivo no válido. Use: ${validExtensions.join(", ")}`,
    };
  }

  // Check size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `El archivo es demasiado grande (${sizeMB.toFixed(1)} MB). Máximo: ${maxSizeMB} MB`,
    };
  }

  return { valid: true };
}

/**
 * Reads a file as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };

    reader.readAsText(file);
  });
}
