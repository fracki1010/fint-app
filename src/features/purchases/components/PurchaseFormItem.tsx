import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Select, SelectItem } from "@heroui/select";
import { Trash2 } from "lucide-react";
import { formatCompactCurrency, formatCurrency } from "@shared/utils/currency";

export type LineItem = {
  itemKind: "supply" | "product";
  supplyId: string;
  supplyName: string;
  productId: string;
  productName: string;
  presentationId: string;
  presentationName: string;
  purchaseUnit: string;
  purchaseEquivalentQty: string;
  quantity: string;
  unitCost: string;
};

type SupplyItem = {
  _id: string;
  name: string;
  sku?: string | null;
  referenceCost: number;
  unit: string;
};

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
  supplies: SupplyItem[];
  products: ProductItem[];
  currency: string;
  updateItem: (idx: number, field: keyof LineItem, value: string) => void;
  setItemKind: (idx: number, kind: "supply" | "product") => void;
  removeItem: (idx: number) => void;
}

export default function PurchaseFormItem({
  item,
  index: idx,
  itemsLength,
  supplies,
  products,
  currency,
  updateItem,
  setItemKind,
  removeItem,
}: PurchaseFormItemProps) {
  const selectedProduct = item.itemKind === "product" && item.productId
    ? products.find((p) => p._id === item.productId)
    : undefined;
  const activePresentations = selectedProduct?.presentations?.filter((pr) => pr.isActive !== false) || [];

  return (
    <div className="rounded-2xl border border-divider/15 bg-content2/30 p-4 transition-all hover:border-divider/25">
      {/* Tipo selector */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">Tipo</span>
        <div className="flex rounded-xl bg-content3/50 p-0.5">
          <button
            className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
              item.itemKind === "supply"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-default-500 hover:text-foreground"
            }`}
            type="button"
            onClick={() => setItemKind(idx, "supply")}
          >
            Insumo
          </button>
          <button
            className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
              item.itemKind === "product"
                ? "bg-blue-500 text-white shadow-sm"
                : "text-default-500 hover:text-foreground"
            }`}
            type="button"
            onClick={() => setItemKind(idx, "product")}
          >
            Producto
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex-1">
          {item.itemKind === "supply" ? (
            <Autocomplete
              aria-label="Insumo"
              classNames={{
                base: "w-full",
                listboxWrapper: "bg-content1",
              }}
              defaultItems={supplies}
              inputValue={item.supplyName}
              placeholder="Buscar insumo..."
              size="sm"
              variant="bordered"
              onInputChange={(v) => updateItem(idx, "supplyName", v)}
              onSelectionChange={(key) => {
                if (!key) return;
                const s = supplies.find((sp) => sp._id === String(key));
                if (s) {
                  updateItem(idx, "supplyId", s._id);
                  updateItem(idx, "supplyName", s.name);
                  if (!item.unitCost && s.referenceCost) {
                    updateItem(idx, "unitCost", String(s.referenceCost));
                  }
                }
              }}
            >
              {(s) => (
                <AutocompleteItem key={s._id} textValue={s.name}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{s.name}</span>
                    <span className="shrink-0 text-[11px] text-default-400">
                      {s.referenceCost ? formatCompactCurrency(s.referenceCost, currency) : ""}
                      {s.sku ? ` · ${s.sku}` : ""}
                    </span>
                  </div>
                </AutocompleteItem>
              )}
            </Autocomplete>
          ) : (
            <Autocomplete
              aria-label="Producto"
              classNames={{
                base: "w-full",
                listboxWrapper: "bg-content1",
              }}
              defaultItems={products.filter(
                (p) => !p.type || p.type === "raw_material" || p.type === "both",
              )}
              inputValue={item.productName}
              placeholder="Buscar producto..."
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
                  if (!item.unitCost && p.costPrice) {
                    updateItem(idx, "unitCost", String(p.costPrice));
                  }
                }
              }}
            >
              {(p) => (
                <AutocompleteItem key={p._id} textValue={p.name}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-[11px] text-default-400">
                      {p.costPrice ? formatCompactCurrency(p.costPrice, currency) : ""}
                      {p.sku ? ` · ${p.sku}` : ""}
                      {p.barcode ? ` · ${p.barcode}` : ""}
                    </span>
                  </div>
                </AutocompleteItem>
              )}
            </Autocomplete>
          )}
        </div>
        {itemsLength > 1 && (
          <button
            className="mt-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-default-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
            type="button"
            onClick={() => removeItem(idx)}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Presentation selector (when product has presentations) */}
      {item.itemKind === "product" && item.productId && activePresentations.length > 0 && (
        <div className="mt-2">
          <Select
            aria-label="Presentación"
            classNames={{
              base: "w-full",
              trigger: "min-h-[40px] rounded-xl border-divider/25 bg-content2/40 px-3 text-sm text-foreground data-[focus=true]:border-blue-500/50",
              value: "text-foreground",
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
            <>
              <SelectItem key="">Sin presentación (base)</SelectItem>
              {activePresentations.map((pr) => (
                <SelectItem key={pr._id}>{pr.name} ({pr.equivalentQty} {pr.unitOfMeasure})</SelectItem>
              ))}
            </>
          </Select>
        </div>
      )}

      {/* Product info (when product selected) */}
      {item.itemKind === "product" && item.productId && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-blue-500/5 px-3 py-2 text-[11px] text-default-500">
          {item.presentationName && (
            <span>
              <strong>Presentación:</strong> {item.presentationName}
            </span>
          )}
          <span>
            <strong>Unidad de compra:</strong> {item.purchaseUnit || "unidad"}
          </span>
          <span>
            <strong>Equivalencia:</strong> 1 {item.purchaseUnit || "unidad"} ={" "}
            {item.purchaseEquivalentQty || "1"} ud. base
          </span>
          {Number(item.unitCost) > 0 && Number(item.purchaseEquivalentQty) > 0 && (
            <span>
              <strong>Costo x ud. base:</strong>{" "}
              {formatCurrency(Number(item.unitCost) / Number(item.purchaseEquivalentQty), currency)}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">
            {item.itemKind === "product" && item.purchaseUnit
              ? `Cant. (${item.purchaseUnit})`
              : "Cant."}
          </span>
          <input
            className="corp-input w-full rounded-xl px-3 py-2 text-sm font-mono"
            min="0.01"
            step="0.01"
            type="number"
            value={item.quantity}
            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">
            {item.itemKind === "product" && item.presentationName
              ? `Costo x ${item.presentationName}`
              : item.itemKind === "product" && item.purchaseUnit
                ? `Costo x ${item.purchaseUnit}`
                : "Costo Unit."}
          </span>
          <input
            className="corp-input w-full rounded-xl px-3 py-2 text-sm font-mono"
            min="0"
            step="0.01"
            type="number"
            value={item.unitCost}
            onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
          />
          {item.itemKind === "product" && item.presentationName && Number(item.unitCost) > 0 && Number(item.purchaseEquivalentQty) > 0 && (
            <span className="mt-1 block text-[10px] text-default-400">
              = {formatCurrency(Number(item.unitCost) / Number(item.purchaseEquivalentQty), currency)} por {selectedProduct?.unitOfMeasure || "ud. base"}
            </span>
          )}
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
