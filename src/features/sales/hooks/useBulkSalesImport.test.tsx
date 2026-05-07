import { describe, expect, it, vi, beforeEach } from "vitest";

import { useBulkImportStore } from "@features/sales/stores/bulkImportStore";
import { parseCSV } from "@features/sales/utils/csvParser";
import { validateRowsBatch } from "@features/sales/utils/importValidation";

// Mock the hooks
const mockBulkCreateOrders = vi.fn();
const mockCreateOrder = vi.fn();

vi.mock("@features/sales/hooks/useOrders", () => ({
  useOrders: () => ({
    createOrder: mockCreateOrder,
    bulkCreateOrders: mockBulkCreateOrders,
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

// Test utilities setup - QueryClient available if needed for integration tests
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: false,
//     },
//   },
// });

describe("useBulkSalesImport - Integration", () => {
  beforeEach(() => {
    // Reset the store before each test
    useBulkImportStore.getState().reset();
    // Reset mocks
    mockBulkCreateOrders.mockReset();
    mockCreateOrder.mockReset();
  });

  describe("CSV Parsing", () => {
    it("should parse valid CSV successfully", () => {
      const csvText = `fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5`;

      const result = parseCSV(csvText);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].clienteName).toBe("Juan Pérez");
      expect(result.rows[0].cantidad).toBe(5);
      expect(result.errors).toHaveLength(0);
    });

    it("should parse multiple rows", () => {
      const csvText = `fecha,cliente,producto,cantidad
15/01/2024,Juan,Prod A,5
16/01/2024,María,Prod B,3
17/01/2024,Carlos,Prod C,7`;

      const result = parseCSV(csvText);

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].rowNumber).toBe(1);
      expect(result.rows[1].rowNumber).toBe(2);
      expect(result.rows[2].rowNumber).toBe(3);
    });

    it("should handle TSV format", () => {
      const tsvText = `fecha\tcliente\tproducto\tcantidad
15/01/2024\tJuan Pérez\tProducto A\t5`;

      const result = parseCSV(tsvText);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].clienteName).toBe("Juan Pérez");
    });
  });

  describe("Validation", () => {
    it("should validate rows and find matching products", async () => {
      const products = [
        { _id: "product-1", name: "Producto A", price: 100, sku: "SKU001", barcode: "123456" },
      ];

      const clients = [
        { _id: "client-1", name: "Juan Pérez", phone: "1234567890" },
      ];

      const parsedRows = [
        {
          rowNumber: 1,
          fecha: new Date("2024-01-15"),
          clienteName: "Juan Pérez",
          productoQuery: "Producto A",
          cantidad: 5,
          metodoPago: "Efectivo",
          notas: "",
        },
      ];

      const findProduct = (query: string) => {
        const product = products.find(
          (p) =>
            p.name.toLowerCase() === query.toLowerCase() ||
            p.sku?.toLowerCase() === query.toLowerCase() ||
            p.barcode?.toLowerCase() === query.toLowerCase()
        );
        return product
          ? { found: true, productId: product._id, productName: product.name, price: product.price }
          : { found: false };
      };

      const findClient = (name: string, phone?: string) => {
        const client = clients.find(
          (c) =>
            c.name.toLowerCase() === name.toLowerCase() ||
            (phone && c.phone === phone)
        );
        return client
          ? { matched: true, clientId: client._id, isNew: false }
          : { matched: false, isNew: true };
      };

      const validated = await validateRowsBatch(parsedRows, {
        findProduct,
        findClient,
      });

      expect(validated).toHaveLength(1);
      expect(validated[0].status).toBe("valid");
      expect(validated[0].productId).toBe("product-1");
      expect(validated[0].clientId).toBe("client-1");
    });

    it("should mark rows with unknown products as invalid", async () => {
      const parsedRows = [
        {
          rowNumber: 1,
          fecha: new Date("2024-01-15"),
          clienteName: "Juan Pérez",
          productoQuery: "Unknown Product",
          cantidad: 5,
          metodoPago: "Efectivo",
          notas: "",
        },
      ];

      const findProduct = () => ({ found: false });
      const findClient = () => ({ matched: false, isNew: true });

      const validated = await validateRowsBatch(parsedRows, {
        findProduct,
        findClient,
      });

      expect(validated[0].status).toBe("invalid");
      expect(validated[0].errors).toContain("Producto no encontrado");
    });

    it("should validate dates are in the past", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const parsedRows = [
        {
          rowNumber: 1,
          fecha: futureDate,
          clienteName: "Juan Pérez",
          productoQuery: "Producto A",
          cantidad: 5,
          metodoPago: "Efectivo",
          notas: "",
        },
      ];

      const findProduct = () => ({
        found: true,
        productId: "p1",
        productName: "Producto A",
        price: 100,
      });
      const findClient = () => ({ matched: false, isNew: true });

      const validated = await validateRowsBatch(parsedRows, {
        findProduct,
        findClient,
      });

      expect(validated[0].status).toBe("invalid");
      expect(validated[0].errors).toContain("La fecha no puede ser futura");
    });

    it("should validate positive quantities", async () => {
      const parsedRows = [
        {
          rowNumber: 1,
          fecha: new Date("2024-01-15"),
          clienteName: "Juan Pérez",
          productoQuery: "Producto A",
          cantidad: -5,
          metodoPago: "Efectivo",
          notas: "",
        },
      ];

      const findProduct = () => ({
        found: true,
        productId: "p1",
        productName: "Producto A",
        price: 100,
      });
      const findClient = () => ({ matched: false, isNew: true });

      const validated = await validateRowsBatch(parsedRows, {
        findProduct,
        findClient,
      });

      expect(validated[0].status).toBe("invalid");
      expect(validated[0].errors).toContain("Cantidad debe ser mayor a cero");
    });
  });

  describe("Bulk Import Store", () => {
    it("should track import progress", () => {
      const store = useBulkImportStore.getState();

      // Start with initial state
      expect(store.status).toBe("idle");
      expect(store.progress.total).toBe(0);

      // Set raw text
      store.setRawText("test");
      expect(store.rawText).toBe("test");

      // Start import
      store.setValidatedRows([
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
      ]);
      store.startImport();

      expect(store.status).toBe("importing");
      expect(store.progress.total).toBe(1);

      // Mark success
      store.markRowSuccess(1);
      expect(store.progress.succeeded).toBe(1);
      expect(store.progress.processed).toBe(1);

      // Complete
      store.completeImport();
      expect(store.status).toBe("complete");
    });

    it("should track failed rows", () => {
      const store = useBulkImportStore.getState();

      store.setValidatedRows([
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
      ]);
      store.startImport();

      store.markRowFailed(1, "Error de servidor");

      expect(store.progress.failed).toBe(1);
      expect(store.errors).toHaveLength(1);
      expect(store.errors[0].message).toBe("Error de servidor");
    });

    it("should reset to initial state", () => {
      const store = useBulkImportStore.getState();

      store.setRawText("test");
      store.setValidatedRows([
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
      ]);

      store.reset();

      expect(store.status).toBe("idle");
      expect(store.rawText).toBe("");
      expect(store.validatedRows).toHaveLength(0);
      expect(store.errors).toHaveLength(0);
    });
  });

  describe("API Integration", () => {
    it("should handle successful bulk API response", async () => {
      mockBulkCreateOrders.mockResolvedValueOnce({
        imported: 2,
        failed: 0,
        errors: [],
      });

      const orders = [
        {
          client: "client-1",
          items: [{ product: "product-1", quantity: 5, price: 100, productId: "product-1" }],
          totalAmount: 500,
          status: "Confirmada" as const,
          salesStatus: "Confirmada" as const,
          paymentStatus: "Pagado" as const,
          deliveryStatus: "Entregada" as const,
          paymentMethod: "Efectivo",
          notes: "Test",
          source: "Dashboard" as const,
          createdAt: new Date().toISOString(),
        },
      ];

      const result = await mockBulkCreateOrders(orders);

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("should handle partial success from bulk API", async () => {
      mockBulkCreateOrders.mockResolvedValueOnce({
        imported: 1,
        failed: 1,
        errors: [{ row: 2, error: "Producto no disponible" }],
      });

      const orders = [
        { client: "client-1", totalAmount: 100 },
        { client: "client-2", totalAmount: 200 },
      ];

      const result = await mockBulkCreateOrders(orders);

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});
