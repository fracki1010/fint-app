import { useMemo, useState } from "react";

export interface SearchableProduct {
  _id: string;
  name: string;
  sku?: string;
  // Units available in the selected place, when the list is limited to a place's stock.
  available?: number;
  unitOfMeasure?: string;
}

interface ProductSearchSelectProps {
  products: SearchableProduct[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MAX_RESULTS = 20;

// Type-to-search product picker. It only renders the matches, so a long catalog stays cheap.
export default function ProductSearchSelect({
  products,
  value,
  onChange,
  placeholder = "Buscar producto",
  disabled = false,
}: ProductSearchSelectProps) {
  const selected = products.find((p) => p._id === value) ?? null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? products.filter(
          (p) => p.name.toLowerCase().includes(term) || (p.sku ?? "").toLowerCase().includes(term),
        )
      : products;
    return filtered.slice(0, MAX_RESULTS);
  }, [products, query]);

  const pick = (product: SearchableProduct) => {
    onChange(product._id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        className="w-full rounded-xl border border-divider bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
        placeholder={placeholder}
        value={open ? query : selected?.name ?? ""}
        disabled={disabled}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          // Keep Escape here: it closes the list, not the drawer around it.
          if (e.key === "Escape") {
            e.stopPropagation();
            setOpen(false);
          }
        }}
      />

      {open && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-divider bg-content1 shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-default-500">Sin resultados</li>
          ) : (
            matches.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  // mousedown fires before the input's blur, so the pick lands.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(p);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-content2"
                >
                  <span className="truncate text-foreground">{p.name}</span>
                  {p.available !== undefined && (
                    <span className="shrink-0 text-xs text-default-500">
                      {p.available} {p.unitOfMeasure ?? "unidad"}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
          {products.length > MAX_RESULTS && query.trim() === "" && (
            <li className="px-3 py-2 text-xs text-default-400">
              Escribí para buscar entre {products.length} productos
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
