import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Select, SelectItem } from "@heroui/select";
import { Trash2 } from "lucide-react";
import { formatCurrency } from "@shared/utils/currency";

export type LineItem = {
  productId: string;
  productName: string;
  presentationId: string;
  presentationName: string;
  purchaseUnit: string;
  purchaseEquivalentQty: string;
  quantity: string;
  unitCost: string;
};

export const emptyLineItem = (): LineItem => ({
  productId: "",
  productName: "",
  presentationId: "",
  presentationName: "",
  purchaseUnit: "",
  purchaseEquivalentQty: "1",
  quantity: "",
  unitCost: "",
});

type Presentation = {
  _id: string;
  name: string;
  unitOfMeasure: string;
  equivalentQty: number;
  price: number;
  isActive?: boolean;
};

type ProductItem = {
  _id: string;
  name: string;
  sku?: string;
  barcode?: string;
  type?: string;
  costPrice?: number;
  stock?: number;
  purchaseUnit?: string;
  purchaseEquivalentQty?: number;
  unitOfMeasure?: string;
  presentations?: Presentation[];
};

interface PurchaseFormItemProps {
  item: LineItem;
  index: number;
  itemsLength: number;
  products: ProductItem[];
  currency: string;
  updateItem: (idx: number, field: keyof LineItem, value: string) => void;
  removeItem: (idx: number) => void;
}

export default function PurchaseFormItem({
  item,
  index: idx,
  itemsLength,
  products,
  currency,
  updateItem,
  removeItem,
}: PurchaseFormItemProps) {
  const selectedProduct = item.productId
    ? products.find((p) => p._id === item.productId)
    : undefined;
  const activePresentations = selectedProduct?.presentations?.filter((pr) => pr.isActive !== false) || [];

  return (
    <div className="rounded-2xl border border-divider/15 bg-content2/30 p-4 transition-all hover:border-divider/25">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <Autocomplete
            aria-label="Producto"
            classNames={{ base: "w-full", listboxWrapper: "bg-content1" }}
            defaultItems={products}
            inputValue={item.productName}
            placeholder="Buscar producto o materia prima..."
            size="sm"
            variant="bordered"
            onInputChange={(v) => updateItem(idx, "productName", v)}
            onSelectionChange={(key) => {
              if (!key) return;
              const p = products.find((pr) => pr._id === String(key));
              if (p) {
                updateItem(idx, "productId", p._id);
                updateItem(idx, "productName", p.name);
                updateItem(idx, "purchaseUnit", p.purchaseUnit || "");
                updateItem(idx, "purchaseEquivalentQty", String(p.purchaseEquivalentQty ?? 1));
                if (!item.unitCost && p.costPrice) updateItem(idx, "unitCost", String(p.costPrice));
              }
            }}
          >
            {(p) => (
              <AutocompleteItem key={p._id} textValue={p.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-[11px] text-default-400">
                    {p.sku ? ` · ${p.sku}` : ""}{p.type === "raw_material" ? " · MP" : ""}
                  </span>
                </div>
              </AutocompleteItem>
            )}
          </Autocomplete>
        </div>
        {itemsLength > 1 && (
          <button className="mt-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-default-400 hover:bg-red-500/10 hover:text-red-500 transition-colors" type="button" onClick={() => removeItem(idx)}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {item.productId && activePresentations.length > 0 && (
        <div className="mt-2">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">Presentación</label>
          <Select
            aria-label="Presentación"
            placeholder="Seleccionar presentación..."
            classNames={{
              base: "w-full",
              trigger: "min-h-[40px] rounded-xl border-divider/25 bg-content2/40 px-3 text-sm text-foreground data-[focus=true]:border-blue-500/50",
              value: "text-foreground font-medium",
              popoverContent: "bg-content1 text-foreground",
            }}
            selectedKeys={item.presentationId ? [item.presentationId] : []}
            size="sm"
            variant="bordered"
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0];
              if (!key) {
                updateItem(idx, "presentationId", "");
                updateItem(idx, "presentationName", "");
                updateItem(idx, "purchaseUnit", selectedProduct?.purchaseUnit || "");
                updateItem(idx, "purchaseEquivalentQty", String(selectedProduct?.purchaseEquivalentQty ?? 1));
                return;
              }
              const pr = activePresentations.find((p) => p._id === String(key));
              if (pr) {
                updateItem(idx, "presentationId", pr._id);
                updateItem(idx, "presentationName", pr.name);
                updateItem(idx, "purchaseUnit", pr.unitOfMeasure);
                updateItem(idx, "purchaseEquivalentQty", String(pr.equivalentQty));
              }
            }}
          >
            {[
              <SelectItem key="" textValue="Sin presentación (base)">
                <div className="flex flex-col"><span>Sin presentación (base)</span><span className="text-xs text-default-400">Usar unidad base del producto</span></div>
              </SelectItem>,
              ...activePresentations.map((pr) => (
                <SelectItem key={pr._id} textValue={`${pr.name} (${pr.equivalentQty} ${pr.unitOfMeasure})`}>
                  <div className="flex flex-col"><span className="font-medium">{pr.name}</span><span className="text-xs text-default-400">{pr.equivalentQty} {pr.unitOfMeasure}</span></div>
                </SelectItem>
              ))
            ]}
          </Select>
        </div>
      )}

      {item.productId && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-blue-500/5 px-3 py-2 text-[11px] text-default-500">
          {item.presentationName && <span><strong>Presentación:</strong> {item.presentationName}</span>}
          <span><strong>Unidad de compra:</strong> {item.presentationName || item.purchaseUnit || "unidad"}</span>
          <span><strong>Equivalencia:</strong> 1 {item.presentationName || item.purchaseUnit || "unidad"} = {item.purchaseEquivalentQty || "1"} ud. base</span>
          {Number(item.unitCost) > 0 && Number(item.purchaseEquivalentQty) > 0 && (
            <span><strong>Costo x ud. base:</strong> {formatCurrency(Number(item.unitCost) / Number(item.purchaseEquivalentQty), currency)}</span>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">
            {item.presentationName || item.purchaseUnit ? `Cant. (${item.presentationName || item.purchaseUnit})` : "Cant."}
          </span>
          <input className="corp-input w-full rounded-xl px-3 py-2 text-sm font-mono" min="0.01" step="0.01" type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">
            {item.presentationName ? `Costo x ${item.presentationName}` : item.purchaseUnit ? `Costo x ${item.purchaseUnit}` : "Costo Unit."}
          </span>
          <input className="corp-input w-full rounded-xl px-3 py-2 text-sm font-mono" min="0" step="0.01" type="number" value={item.unitCost} onChange={(e) => updateItem(idx, "unitCost", e.target.value)} />
        </label>
        <div>
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">Subtotal</span>
          <p className="rounded-xl bg-blue-500/5 px-3 py-2 text-sm font-mono font-semibold text-foreground">
            {formatCurrency(Number(item.quantity || 0) * Number(item.unitCost || 0), currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
