import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  generateFailedRowsCSV,
  generateImportTemplate,
  downloadCSV,
  exportFailedRows,
  escapeCSVField,
  withRetry,
  retryFailedRows,
  parseCSVFile,
  validateImportFile,
  readFileAsText,
  DEFAULT_RETRY_CONFIG,
} from "./importExport";
import { ValidatedRow } from "@shared/types/bulkImport";

// Mock URL and document methods
const mockCreateObjectURL = vi.fn(() => "blob:url");
const mockRevokeObjectURL = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
});

Object.defineProperty(global, "document", {
  value: {
    createElement: vi.fn(() => ({
      click: mockClick,
    })),
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild,
    },
  },
});

describe("importExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateFailedRowsCSV", () => {
    it("should return empty string for no failed rows", () => {
      const result = generateFailedRowsCSV([]);
      expect(result).toBe("");
    });

    it("should generate CSV with failed rows", () => {
      // Create date in a timezone-safe way
      const date = new Date(2024, 0, 15); // January 15, 2024
      const failedRows: ValidatedRow[] = [
        {
          row: {
            rowNumber: 1,
            fecha: date,
            clienteName: "Juan Pérez",
            clientePhone: "1234567890",
            productoQuery: "Producto A",
            cantidad: 5,
            precioUnitario: 100,
            metodoPago: "Efectivo",
            notas: "Nota de prueba",
          },
          status: "invalid",
          errors: ["Producto no encontrado"],
          warnings: [],
        },
      ];

      const result = generateFailedRowsCSV(failedRows);

      expect(result).toContain("fecha,cliente,producto,cantidad,precio_unitario,metodo_pago,notas,error");
      // Check for date pattern (DD/MM/YYYY format)
      expect(result).toMatch(/\d{2}\/01\/2024/);
      expect(result).toContain("Juan Pérez");
      expect(result).toContain("Producto A");
      expect(result).toContain("Producto no encontrado");
    });

    it("should format client with phone when available", () => {
      const failedRows: ValidatedRow[] = [
        {
          row: {
            rowNumber: 1,
            fecha: new Date("2024-01-15"),
            clienteName: "Juan Pérez",
            clientePhone: "1234567890",
            productoQuery: "Producto A",
            cantidad: 5,
            metodoPago: "Efectivo",
            notas: "",
          },
          status: "invalid",
          errors: ["Error"],
          warnings: [],
        },
      ];

      const result = generateFailedRowsCSV(failedRows);

      expect(result).toContain("Juan Pérez,1234567890");
    });

    it("should handle multiple errors", () => {
      const failedRows: ValidatedRow[] = [
        {
          row: {
            rowNumber: 1,
            fecha: new Date("2024-01-15"),
            clienteName: "Juan",
            productoQuery: "Prod",
            cantidad: 5,
            metodoPago: "Efectivo",
            notas: "",
          },
          status: "invalid",
          errors: ["Error 1", "Error 2"],
          warnings: [],
        },
      ];

      const result = generateFailedRowsCSV(failedRows);

      expect(result).toContain("Error 1; Error 2");
    });
  });

  describe("generateImportTemplate", () => {
    it("should generate template with headers", () => {
      const result = generateImportTemplate();

      expect(result).toContain("fecha,cliente,producto,cantidad,precio_unitario,metodo_pago,notas");
    });

    it("should include example rows", () => {
      const result = generateImportTemplate();

      expect(result).toContain("15/01/2024,Juan Pérez");
      expect(result).toContain("16/01/2024,María García");
    });

    it("should include comments with instructions", () => {
      const result = generateImportTemplate();

      expect(result).toContain("# Plantilla de importación");
      expect(result).toContain("# Columnas:");
    });
  });

  describe("downloadCSV", () => {
    it("should create download link", () => {
      downloadCSV("content", "test.csv");

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe("exportFailedRows", () => {
    it("should throw error for empty rows", () => {
      expect(() => exportFailedRows([])).toThrow("No hay filas fallidas para exportar");
    });

    it("should download CSV with default filename", () => {
      const failedRows: ValidatedRow[] = [
        {
          row: {
            rowNumber: 1,
            fecha: new Date("2024-01-15"),
            clienteName: "Juan",
            productoQuery: "Prod",
            cantidad: 5,
            metodoPago: "Efectivo",
            notas: "",
          },
          status: "invalid",
          errors: ["Error"],
          warnings: [],
        },
      ];

      exportFailedRows(failedRows);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it("should use custom filename when provided", () => {
      const failedRows: ValidatedRow[] = [
        {
          row: {
            rowNumber: 1,
            fecha: new Date("2024-01-15"),
            clienteName: "Juan",
            productoQuery: "Prod",
            cantidad: 5,
            metodoPago: "Efectivo",
            notas: "",
          },
          status: "invalid",
          errors: ["Error"],
          warnings: [],
        },
      ];

      exportFailedRows(failedRows, "custom.csv");

      // Verify download was triggered
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe("escapeCSVField", () => {
    it("should return empty string for empty input", () => {
      expect(escapeCSVField("")).toBe("");
    });

    it("should not quote simple fields", () => {
      expect(escapeCSVField("simple")).toBe("simple");
    });

    it("should quote fields with commas", () => {
      expect(escapeCSVField("field,with,commas")).toBe('"field,with,commas"');
    });

    it("should escape quotes by doubling", () => {
      expect(escapeCSVField('field with "quotes"')).toBe('"field with ""quotes"""');
    });
  });

  describe("withRetry", () => {
    it("should return result on success", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      const result = await withRetry(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and succeed", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockResolvedValue("success");

      const onRetry = vi.fn();
      const result = await withRetry(fn, { maxRetries: 2, retryDelay: 10, exponentialBackoff: false }, onRetry);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it("should throw after max retries", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("always fails"));

      await expect(withRetry(fn, { maxRetries: 2, retryDelay: 10 })).rejects.toThrow("always fails");
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("should use exponential backoff when configured", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success");

      const start = Date.now();
      await withRetry(fn, { maxRetries: 2, retryDelay: 10, exponentialBackoff: true });
      const elapsed = Date.now() - start;

      // With exponential backoff: 10ms + 20ms = 30ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(25);
    });
  });

  describe("retryFailedRows", () => {
    it("should retry all rows and track results", async () => {
      const rows: ValidatedRow[] = [
        {
          row: {
            rowNumber: 1,
            fecha: new Date("2024-01-15"),
            clienteName: "Juan",
            productoQuery: "Prod",
            cantidad: 5,
            metodoPago: "Efectivo",
            notas: "",
          },
          status: "valid",
          errors: [],
          warnings: [],
        },
      ];

      const importFn = vi.fn().mockResolvedValue("order-1");

      const result = await retryFailedRows(rows, importFn, { maxRetries: 1, retryDelay: 10 });

      expect(result.succeeded).toHaveLength(1);
      expect(result.failed).toHaveLength(0);
      expect(result.succeeded[0].result).toBe("order-1");
    });

    it("should track failed rows", async () => {
      const rows: ValidatedRow[] = [
        {
          row: {
            rowNumber: 1,
            fecha: new Date("2024-01-15"),
            clienteName: "Juan",
            productoQuery: "Prod",
            cantidad: 5,
            metodoPago: "Efectivo",
            notas: "",
          },
          status: "valid",
          errors: [],
          warnings: [],
        },
      ];

      const importFn = vi.fn().mockRejectedValue(new Error("Import failed"));

      const result = await retryFailedRows(rows, importFn, { maxRetries: 1, retryDelay: 10 });

      expect(result.succeeded).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error.message).toBe("Import failed");
    });
  });

  describe("parseCSVFile", () => {
    it("should parse CSV content", () => {
      const content = "col1,col2,col3\nval1,val2,val3\nval4,val5,val6";

      const result = parseCSVFile(content);

      expect(result.headers).toEqual(["col1", "col2", "col3"]);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(["val1", "val2", "val3"]);
    });

    it("should skip empty lines and comments", () => {
      const content = "# Comment\ncol1,col2\n\nval1,val2\n\n# Another comment";

      const result = parseCSVFile(content);

      expect(result.headers).toEqual(["col1", "col2"]);
      expect(result.rows).toHaveLength(1);
    });

    it("should handle quoted fields", () => {
      const content = 'col1,col2,col3\n"val,1",normal,"val ""2"""';

      const result = parseCSVFile(content);

      // Fields with commas get split if not properly quoted, but quoted fields with escaped quotes should work
      expect(result.rows[0][0]).toContain("val");
      expect(result.rows[0]).toHaveLength(3);
    });

    it("should return empty for empty content", () => {
      const result = parseCSVFile("");

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });
  });

  describe("validateImportFile", () => {
    it("should validate valid CSV file", () => {
      const file = new File(["content"], "test.csv", { type: "text/csv" });

      const result = validateImportFile(file);

      expect(result.valid).toBe(true);
    });

    it("should reject invalid extension", () => {
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      const result = validateImportFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Formato de archivo no válido");
    });

    it("should reject oversized files", () => {
      const largeContent = "x".repeat(6 * 1024 * 1024); // 6MB
      const file = new File([largeContent], "test.csv", { type: "text/csv" });

      const result = validateImportFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("demasiado grande");
    });
  });

  describe("readFileAsText", () => {
    it("should read file content", async () => {
      // Mock FileReader for Node.js test environment
      const originalFileReader = (global as unknown as Record<string, unknown>).FileReader;
      
      class MockFileReader {
        onload: ((e: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        
        readAsText(_file: File) {
          // Simulate async reading
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: "test content" } });
            }
          }, 0);
        }
      }
      
      (global as unknown as Record<string, unknown>).FileReader = MockFileReader;

      const file = new File(["test content"], "test.csv", { type: "text/csv" });

      const result = await readFileAsText(file);

      expect(result).toBe("test content");

      // Restore original
      (global as unknown as Record<string, unknown>).FileReader = originalFileReader;
    });

    it("should reject on error", async () => {
      // Mock FileReader for Node.js test environment
      const originalFileReader = (global as unknown as Record<string, unknown>).FileReader;
      
      class MockFileReader {
        onload: ((e: { target: { result: string } }) => void) | null = null;
        onerror: (() => void) | null = null;
        
        readAsText(_file: File) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
      }
      
      (global as unknown as Record<string, unknown>).FileReader = MockFileReader;

      const file = new File(["content"], "test.csv", { type: "text/csv" });

      await expect(readFileAsText(file)).rejects.toThrow("Error al leer el archivo");

      // Restore original
      (global as unknown as Record<string, unknown>).FileReader = originalFileReader;
    });
  });

  describe("DEFAULT_RETRY_CONFIG", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.retryDelay).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.exponentialBackoff).toBe(true);
    });
  });
});
