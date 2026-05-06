import { describe, expect, it } from "vitest";

import {
  parseCSV,
  parseDate,
  parseQuantity,
  parsePrice,
  extractClientInfo,
  validateParsedRowStructure,
} from "@features/sales/utils/csvParser";

describe("csvParser", () => {
  describe("parseCSV", () => {
    it("parses basic CSV with all required columns", () => {
      const csv = `fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5`;

      const result = parseCSV(csv);

      expect(result.rows).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      expect(result.rows[0].clienteName).toBe("Juan Pérez");
      expect(result.rows[0].cantidad).toBe(5);
    });

    it("parses CSV with optional columns", () => {
      const csv = `fecha,cliente,producto,cantidad,precio_unitario,metodo_pago,notas
15/01/2024,María García,Producto B,10,150.50,Tarjeta,Nota de prueba`;

      const result = parseCSV(csv);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].precioUnitario).toBe(150.5);
      expect(result.rows[0].metodoPago).toBe("Tarjeta");
      expect(result.rows[0].notas).toBe("Nota de prueba");
    });

    it("uses default values for optional columns", () => {
      const csv = `fecha,cliente,producto,cantidad
15/01/2024,Carlos López,Producto C,3`;

      const result = parseCSV(csv);

      expect(result.rows[0].precioUnitario).toBeUndefined();
      expect(result.rows[0].metodoPago).toBe("Efectivo");
      expect(result.rows[0].notas).toBe("");
    });

    it("parses TSV format correctly", () => {
      const tsv = `fecha\tcliente\tproducto\tcantidad
15/01/2024\tJuan Pérez\tProducto A\t5`;

      const result = parseCSV(tsv);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].clienteName).toBe("Juan Pérez");
    });

    it("handles quoted fields with commas", () => {
      const csv = `fecha,cliente,producto,cantidad
15/01/2024,"Pérez, Juan",Producto A,5`;

      const result = parseCSV(csv);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].clienteName).toBe("Pérez, Juan");
    });

    it("handles newlines within quoted fields", () => {
      const csv = `fecha,cliente,producto,cantidad,notas
15/01/2024,Juan Pérez,Producto A,5,"Nota con
varias líneas"`;

      const result = parseCSV(csv);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].notas).toBe("Nota con\nvarias líneas");
    });

    it("skips empty lines", () => {
      const csv = `fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5

20/01/2024,María García,Producto B,3`;

      const result = parseCSV(csv);

      expect(result.rows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("assigns correct row numbers", () => {
      const csv = `fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5
20/01/2024,María García,Producto B,3
25/01/2024,Carlos López,Producto C,7`;

      const result = parseCSV(csv);

      expect(result.rows[0].rowNumber).toBe(1);
      expect(result.rows[1].rowNumber).toBe(2);
      expect(result.rows[2].rowNumber).toBe(3);
    });

    it("reports error for missing required fields", () => {
      const csv = `fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,,5`;

      const result = parseCSV(csv);

      expect(result.rows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("producto");
    });

    it("parses client with phone number", () => {
      const csv = `fecha,cliente,producto,cantidad
15/01/2024,"Juan Pérez,1234567890",Producto A,5`;

      const result = parseCSV(csv);

      expect(result.rows[0].clienteName).toBe("Juan Pérez");
      expect(result.rows[0].clientePhone).toBe("1234567890");
    });

    it("handles multiple rows", () => {
      const csv = `fecha,cliente,producto,cantidad
15/01/2024,Juan Pérez,Producto A,5
16/01/2024,María García,Producto B,3
17/01/2024,Carlos López,Producto C,7`;

      const result = parseCSV(csv);

      expect(result.rows).toHaveLength(3);
      expect(result.totalRows).toBe(3);
    });
  });

  describe("parseDate", () => {
    it("parses DD/MM/YYYY format", () => {
      const result = parseDate("15/01/2024");

      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(15);
      expect(result?.getMonth()).toBe(0); // January is 0
      expect(result?.getFullYear()).toBe(2024);
    });

    it("parses YYYY-MM-DD format", () => {
      const result = parseDate("2024-01-15");

      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(15);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getFullYear()).toBe(2024);
    });

    it("handles single digit day and month", () => {
      const result = parseDate("5/3/2024");

      expect(result).not.toBeNull();
      expect(result?.getDate()).toBe(5);
      expect(result?.getMonth()).toBe(2); // March is 2
    });

    it("returns null for invalid dates", () => {
      expect(parseDate("invalid")).toBeNull();
      expect(parseDate("")).toBeNull();
      expect(parseDate("31/02/2024")).toBeNull(); // February doesn't have 31 days
    });

    it("trims whitespace", () => {
      const result = parseDate("  15/01/2024  ");

      expect(result).not.toBeNull();
    });
  });

  describe("parseQuantity", () => {
    it("parses positive integers", () => {
      expect(parseQuantity("5")).toBe(5);
      expect(parseQuantity("100")).toBe(100);
    });

    it("handles whitespace", () => {
      expect(parseQuantity("  5  ")).toBe(5);
    });

    it("removes commas", () => {
      expect(parseQuantity("1,000")).toBe(1000);
    });

    it("parses zero", () => {
      expect(parseQuantity("0")).toBe(0);
    });

    it("returns NaN for invalid input", () => {
      expect(parseQuantity("abc")).toBeNaN();
      expect(parseQuantity("")).toBeNaN();
    });
  });

  describe("parsePrice", () => {
    it("parses decimal numbers", () => {
      expect(parsePrice("150.50")).toBe(150.5);
      expect(parsePrice("100")).toBe(100);
    });

    it("handles comma as thousands separator", () => {
      expect(parsePrice("1,500.50")).toBe(1500.5);
    });

    it("handles whitespace", () => {
      expect(parsePrice("  150.50  ")).toBe(150.5);
    });

    it("returns NaN for invalid input", () => {
      expect(parsePrice("abc")).toBeNaN();
    });
  });

  describe("extractClientInfo", () => {
    it("extracts name only", () => {
      const result = extractClientInfo("Juan Pérez");

      expect(result.name).toBe("Juan Pérez");
      expect(result.phone).toBeUndefined();
    });

    it("extracts name and phone", () => {
      const result = extractClientInfo("Juan Pérez,1234567890");

      expect(result.name).toBe("Juan Pérez");
      expect(result.phone).toBe("1234567890");
    });

    it("handles phone with formatting", () => {
      const result = extractClientInfo("Juan Pérez,(123) 456-7890");

      expect(result.name).toBe("Juan Pérez");
      expect(result.phone).toBe("1234567890");
    });

    it("handles whitespace around comma", () => {
      const result = extractClientInfo("Juan Pérez , 1234567890");

      expect(result.name).toBe("Juan Pérez");
      expect(result.phone).toBe("1234567890");
    });

    it("handles name with comma but no phone", () => {
      const result = extractClientInfo("Pérez, Juan");

      // This should treat the whole thing as name (no valid phone)
      expect(result.name).toBe("Pérez, Juan");
      expect(result.phone).toBeUndefined();
    });

    it("handles empty string", () => {
      const result = extractClientInfo("");

      expect(result.name).toBe("");
      expect(result.phone).toBeUndefined();
    });
  });

  describe("validateParsedRowStructure", () => {
    it("returns empty array for valid row", () => {
      const row = {
        rowNumber: 1,
        fecha: new Date("2024-01-15"),
        clienteName: "Juan Pérez",
        productoQuery: "Producto A",
        cantidad: 5,
        metodoPago: "Efectivo",
        notas: "",
      };

      const errors = validateParsedRowStructure(row);

      expect(errors).toHaveLength(0);
    });

    it("detects invalid date", () => {
      const row = {
        rowNumber: 1,
        fecha: new Date("invalid"),
        clienteName: "Juan Pérez",
        productoQuery: "Producto A",
        cantidad: 5,
        metodoPago: "Efectivo",
        notas: "",
      };

      const errors = validateParsedRowStructure(row);

      expect(errors).toContain("Fecha inválida");
    });

    it("detects empty client name", () => {
      const row = {
        rowNumber: 1,
        fecha: new Date("2024-01-15"),
        clienteName: "",
        productoQuery: "Producto A",
        cantidad: 5,
        metodoPago: "Efectivo",
        notas: "",
      };

      const errors = validateParsedRowStructure(row);

      expect(errors).toContain("Nombre de cliente requerido");
    });

    it("detects invalid quantity", () => {
      const row = {
        rowNumber: 1,
        fecha: new Date("2024-01-15"),
        clienteName: "Juan Pérez",
        productoQuery: "Producto A",
        cantidad: 0,
        metodoPago: "Efectivo",
        notas: "",
      };

      const errors = validateParsedRowStructure(row);

      expect(errors).toContain("Cantidad debe ser un número positivo");
    });
  });
});
