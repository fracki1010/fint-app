export type LocationKind = "deposito" | "sucursal";

export interface Location {
  _id: string;
  name: string;
  kind: LocationKind;
  address: string;
  isActive: boolean;
}

export interface LocationStockRow {
  productId: string;
  name: string;
  unitOfMeasure: string;
  stock: number;
}

// One page of a place stock. Totals cover the whole place, not only the page.
export interface LocationStockPage {
  items: LocationStockRow[];
  total: number;
  page: number;
  pages: number;
  totalProducts: number;
  totalUnits: number;
}

export interface CreateLocationInput {
  name: string;
  kind: LocationKind;
  address?: string;
}

export interface TransferInput {
  fromLocationId: string;
  toLocationId: string;
  productId: string;
  quantity: number;
}
