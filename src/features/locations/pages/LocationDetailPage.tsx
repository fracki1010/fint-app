import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Package, Search } from "lucide-react";
import { useLocationStockPage, useLocations } from "@features/locations/hooks/useLocations";

const PAGE_SIZE = 25;
const SEARCH_DELAY_MS = 300;

const KIND_LABELS = { deposito: "Depósito", sucursal: "Sucursal" } as const;

// Stock of one place. Search and paging run on the server, so large catalogs stay light.
export default function LocationDetailPage() {
  const { locationId = "" } = useParams();
  const navigate = useNavigate();

  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const location = locations.find((l) => l._id === locationId) ?? null;

  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);

  // Wait for a pause in typing before asking the server again.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(query.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { data, isLoading: stockLoading, isError, isFetching } = useLocationStockPage(locationId || null, {
    q: term,
    page,
    limit: PAGE_SIZE,
  });

  const rows = data?.items ?? [];
  const currentPage = data?.page ?? page;
  const pageCount = data?.pages ?? 1;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/locations")}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-default-200 text-default-500 transition hover:bg-default-100"
          aria-label="Volver a lugares"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <p className="section-kicker">Stock por lugar</p>
          <h1 className="truncate text-xl font-bold text-foreground">
            {location?.name ?? (locationsLoading ? "Cargando..." : "Lugar no encontrado")}
          </h1>
        </div>
      </div>

      {location && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-default-500">
          <MapPin size={14} className="text-primary" />
          <span>{KIND_LABELS[location.kind]}</span>
          {location.address && <span>· {location.address}</span>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-default-200 bg-content1 p-4">
          <p className="text-xs text-default-500">Productos con stock</p>
          <p className="text-2xl font-bold text-foreground">{data?.totalProducts ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-default-200 bg-content1 p-4">
          <p className="text-xs text-default-500">Unidades totales</p>
          <p className="text-2xl font-bold text-foreground">{data?.totalUnits ?? 0}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-default-200 bg-content1 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-primary" />
          <h2 className="text-sm font-bold text-foreground">Productos</h2>
        </div>

        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
          <input
            className="w-full rounded-xl border border-divider bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none"
            placeholder="Buscar producto por nombre"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {isError ? (
          <p className="text-sm text-danger">No se pudo cargar el stock de este lugar.</p>
        ) : stockLoading ? (
          <p className="text-sm text-default-500">Cargando stock...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-default-500">
            {term ? "Ningún producto coincide con la búsqueda." : "No hay stock en este lugar."}
          </p>
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <ul className="divide-y divide-divider">
              {rows.map((row) => (
                <li key={row.productId} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 truncate text-foreground">{row.name}</span>
                  <span className="shrink-0 font-semibold text-foreground">
                    {row.stock} {row.unitOfMeasure}
                  </span>
                </li>
              ))}
            </ul>

            {pageCount > 1 && (
              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="rounded-xl border border-divider px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-content2 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-xs text-default-500">
                  Página {currentPage} de {pageCount} · {data?.total ?? 0} productos
                </span>
                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className="rounded-xl border border-divider px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-content2 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
