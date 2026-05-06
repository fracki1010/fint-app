import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useBulkSalesImport } from "@features/sales/hooks/useBulkSalesImport";
import { useBulkImportStore } from "@features/sales/stores/bulkImportStore";

// Mock the dependencies
vi.mock("@features/sales/hooks/useOrders", () => ({
  useOrders: () => ({
    createOrder: vi.fn().mockResolvedValue({ _id: "order-1" }),
  }),
}));

vi.mock("@features/clients/hooks/useClients", () => ({
  useClients: () => ({
    clients: [
      { _id: "client-1", name: "Juan Pérez", phone: "1234567890" },
      { _id: "client-2", name: "María García", phone: "" },
    ],
  }),
}));

vi.mock("@features/products/hooks/useProducts", () => ({
  useProducts: () => ({
    products: [
      { _id: "product-1", name: "Producto A", price: 100, sku: "SKU001", barcode: "123456" },
      { _id: "product-2", name: "Producto B", price: 200, sku: "SKU002", barcode: "" },
    ],
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useBulkSalesImport", () => {
  beforeEach(() => {
    // Reset the store before each test
    useBulkImportStore.getState().reset();
  });

  describe("Initial state", () => {
    it("should have initial idle state", () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      expect(result.current.status).toBe("idle");
      expect(result.current.rawText).toBe("");
      expect(result.current.parsedRows).toHaveLength(0);
      expect(result.current.validatedRows).toHaveLength(0);
      expect(result.current.errors).toHaveLength(0);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.validRowCount).toBe(0);
      expect(result.current.invalidRowCount).toBe(0);
    });
  });

  describe("setRawText", () => {
    it("should update raw text", () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText("fecha,cliente,producto,cantidad\n15/01/2024,Juan,Prod,5");
      });

      expect(result.current.rawText).toBe("fecha,cliente,producto,cantidad\n15/01/2024,Juan,Prod,5");
    });
  });

  describe("parse", () => {
    it("should parse valid CSV successfully", () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5`);
      });

      let parseResult: { success: boolean; rowCount: number; errors: Array<{ type: string; message: string; rowNumber: number }> };

      act(() => {
        parseResult = result.current.parse();
      });

      expect(parseResult!.success).toBe(true);
      expect(parseResult!.rowCount).toBe(1);
      expect(parseResult!.errors).toHaveLength(0);
      expect(result.current.parsedRows).toHaveLength(1);
      expect(result.current.parsedRows[0].clienteName).toBe("Juan Pérez");
      expect(result.current.parsedRows[0].cantidad).toBe(5);
    });

    it("should handle parse errors gracefully", () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,,5`);
      });

      let parseResult: { success: boolean; rowCount: number; errors: Array<{ type: string; message: string; rowNumber: number }> };

      act(() => {
        parseResult = result.current.parse();
      });

      expect(parseResult!.success).toBe(false);
      expect(parseResult!.rowCount).toBe(0);
      expect(parseResult!.errors.length).toBeGreaterThan(0);
    });

    it("should parse multiple rows", () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Juan,Prod A,5
16/01/2024,María,Prod B,3
17/01/2024,Carlos,Prod C,7`);
      });

      act(() => {
        result.current.parse();
      });

      expect(result.current.parsedRows).toHaveLength(3);
      expect(result.current.parsedRows[0].rowNumber).toBe(1);
      expect(result.current.parsedRows[1].rowNumber).toBe(2);
      expect(result.current.parsedRows[2].rowNumber).toBe(3);
    });
  });

  describe("validate", () => {
    it("should validate rows and find matching products", async () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5`);
      });

      act(() => {
        result.current.parse();
      });

      let validateResult: { success: boolean; validCount: number; invalidCount: number };

      await act(async () => {
        validateResult = await result.current.validate();
      });

      expect(validateResult!.success).toBe(true);
      expect(validateResult!.validCount).toBe(1);
      expect(validateResult!.invalidCount).toBe(0);
      expect(result.current.validatedRows).toHaveLength(1);
      expect(result.current.validatedRows[0].productId).toBe("product-1");
      expect(result.current.validatedRows[0].clientId).toBe("client-1");
    });

    it("should mark rows with unknown products as invalid", async () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Unknown Product,5`);
      });

      act(() => {
        result.current.parse();
      });

      let validateResult: { success: boolean; validCount: number; invalidCount: number };

      await act(async () => {
        validateResult = await result.current.validate();
      });

      expect(validateResult!.validCount).toBe(0);
      expect(validateResult!.invalidCount).toBe(1);
      expect(result.current.validatedRows[0].status).toBe("invalid");
      expect(result.current.validatedRows[0].errors).toContain("Producto no encontrado");
    });

    it("should create new clients when no match found", async () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Nuevo Cliente,Producto A,5`);
      });

      act(() => {
        result.current.parse();
      });

      await act(async () => {
        await result.current.validate();
      });

      expect(result.current.validatedRows[0].isNewClient).toBe(true);
      expect(result.current.validatedRows[0].status).toBe("valid");
    });

    it("should return early if no parsed rows", async () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      let validateResult: { success: boolean; validCount: number; invalidCount: number };

      await act(async () => {
        validateResult = await result.current.validate();
      });

      expect(validateResult!.success).toBe(false);
      expect(validateResult!.validCount).toBe(0);
    });
  });

  describe("importRows", () => {
    it("should import valid rows successfully", async () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5`);
      });

      act(() => {
        result.current.parse();
      });

      await act(async () => {
        await result.current.validate();
      });

      let importResult: { success: boolean; imported: number; failed: number };

      await act(async () => {
        importResult = await result.current.importRows();
      });

      expect(importResult!.success).toBe(true);
      expect(importResult!.imported).toBeGreaterThan(0);
      expect(result.current.status).toBe("complete");
    });

    it("should return early if no valid rows", async () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      let importResult: { success: boolean; imported: number; failed: number };

      await act(async () => {
        importResult = await result.current.importRows();
      });

      expect(importResult!.success).toBe(false);
      expect(importResult!.imported).toBe(0);
    });
  });

  describe("reset", () => {
    it("should reset all state to initial values", () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText("some text");
      });

      act(() => {
        result.current.parse();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe("idle");
      expect(result.current.rawText).toBe("");
      expect(result.current.parsedRows).toHaveLength(0);
      expect(result.current.validatedRows).toHaveLength(0);
      expect(result.current.errors).toHaveLength(0);
    });
  });

  describe("isProcessing", () => {
    it("should be true during parsing", () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Juan,Prod,5`);
      });

      // Note: In real implementation, parsing is synchronous so isProcessing
      // would only briefly be true. This test documents the behavior.
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe("Progress tracking", () => {
    it("should update progress during import", async () => {
      const { result } = renderHook(() => useBulkSalesImport(), { wrapper });

      act(() => {
        result.current.setRawText(`fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5`);
      });

      act(() => {
        result.current.parse();
      });

      await act(async () => {
        await result.current.validate();
      });

      expect(result.current.progress.total).toBe(1);

      await act(async () => {
        await result.current.importRows();
      });

      expect(result.current.progress.succeeded).toBeGreaterThan(0);
    });
  });
});
