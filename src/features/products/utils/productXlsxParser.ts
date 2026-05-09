import * as XLSX from "xlsx";

export interface XlsxProductRow {
  nombre: string;
  sku?: string;
  codigo_barras?: string;
  descripcion?: string;
  precio_base?: number;
  precio_costo?: number;
  stock_actual?: number;
  stock_minimo?: number;
  categoria?: string;
  unidad_medida?: string;
  tipo?: string;
  precio_minorista?: number;
  precio_mayorista?: number;
  precio_distribuidor?: number;
  presentacion_nombre?: string;
  presentacion_precio?: number;
  presentacion_unidades?: number;
  presentacion_sku?: string;
}

export interface XlsxParseResult {
  rows: XlsxProductRow[];
  errors: { row: number; message: string }[];
}

export interface GroupedProduct {
  key: string; // SKU or name
  name: string;
  sku?: string;
  data: XlsxProductRow[];
  presentations: XlsxProductRow[];
  status: "new" | "update" | "error";
  errors: string[];
}

export function parseProductXlsx(file: File): Promise<XlsxParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

        const rows: XlsxProductRow[] = [];
        const errors: { row: number; message: string }[] = [];

        json.forEach((raw: Record<string, string>, i: number) => {
          const rowNum = i + 2; // 1-indexed + header row
          const row: XlsxProductRow = {
            nombre: (raw["nombre"] || "").toString().trim(),
            sku: (raw["sku"] || "").toString().trim() || undefined,
            codigo_barras: (raw["codigo_barras"] || "").toString().trim() || undefined,
            descripcion: (raw["descripcion"] || "").toString().trim() || undefined,
            precio_base: parseFloat(raw["precio_base"]) || undefined,
            precio_costo: parseFloat(raw["precio_costo"]) || undefined,
            stock_actual: parseFloat(raw["stock_actual"]) || undefined,
            stock_minimo: parseFloat(raw["stock_minimo"]) || undefined,
            categoria: (raw["categoria"] || "").toString().trim() || undefined,
            unidad_medida: (raw["unidad_medida"] || "").toString().trim() || undefined,
            tipo: (raw["tipo"] || "").toString().trim() || undefined,
            precio_minorista: parseFloat(raw["precio_minorista"]) || undefined,
            precio_mayorista: parseFloat(raw["precio_mayorista"]) || undefined,
            precio_distribuidor: parseFloat(raw["precio_distribuidor"]) || undefined,
            presentacion_nombre: (raw["presentacion_nombre"] || "").toString().trim() || undefined,
            presentacion_precio: parseFloat(raw["presentacion_precio"]) || undefined,
            presentacion_unidades: parseFloat(raw["presentacion_unidades"]) || undefined,
            presentacion_sku: (raw["presentacion_sku"] || "").toString().trim() || undefined,
          };

          if (!row.nombre) {
            errors.push({ row: rowNum, message: "El nombre del producto es obligatorio" });
            return;
          }
          rows.push(row);
        });

        resolve({ rows, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsArrayBuffer(file);
  });
}

export function groupProductRows(rows: XlsxProductRow[]): GroupedProduct[] {
  const grouped = new Map<string, XlsxProductRow[]>();

  for (const row of rows) {
    const key = row.sku || row.nombre.toLowerCase().trim();
    const existing = grouped.get(key) || [];
    existing.push(row);
    grouped.set(key, existing);
  }

  const result: GroupedProduct[] = [];

  for (const [key, items] of grouped) {
    const base = items[0];
    const presentations = items.filter(r => r.presentacion_nombre);

    result.push({
      key,
      name: base.nombre,
      sku: base.sku,
      data: items,
      presentations,
      status: "new",
      errors: [],
    });
  }

  return result;
}

export function generateProductTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const data = [
    {
      nombre: "Ejemplo Producto",
      sku: "PROD-001",
      codigo_barras: "7791234567890",
      descripcion: "Descripción del producto",
      precio_base: 1200,
      precio_costo: 800,
      stock_actual: 50,
      stock_minimo: 10,
      categoria: "Categoría",
      unidad_medida: "unidad",
      tipo: "terminado",
      precio_minorista: 1200,
      precio_mayorista: 1000,
      precio_distribuidor: 900,
      presentacion_nombre: "Presentación Ejemplo",
      presentacion_precio: 1200,
      presentacion_unidades: 1,
      presentacion_sku: "PROD-001-P1",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  return wb;
}
