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
