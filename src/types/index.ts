import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Client {
  _id: string;
  name: string;
  phone: string;
  taxId?: string;
  debt?: number;
  email?: string;
  address?: string;
  fiscalAddress?: string;
  company?: string;
  notes?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  category?: string;
  categories?: string[];
  unitOfMeasure?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
