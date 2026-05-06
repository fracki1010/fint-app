import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Package,
  ArrowUp,
  ArrowDown,
  Minus,
  RotateCcw,
  Loader2,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useNavigate } from "react-router-dom";

import { useStockMovements } from "@features/products/hooks/useStockMovements";
import { useProducts } from "@features/products/hooks/useProducts";
import { useSettings } from "@features/settings/hooks/useSettings";
import { formatCompactCurrency } from "@shared/utils/currency";

type DatePreset = "all" | "today" | "7" | "30" | "90";

const DATE_PRESET_OPTIONS: Array<{ key: DatePreset; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "7", label: "Ultimos 7 dias" },
  { key: "30", label: "Ultimos 30 dias" },
  { key: "90", label: "Ultimos 90 dias" },
];

export default function MovementsPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedDatePreset, setSelectedDatePreset] =
    useState<DatePreset>("today");
  const [currentPage, setCurrentPage] = useState(1);

  const [showNewMovement, setShowNewMovement] = useState(false);
  const [newProduct, setNewProduct] = useState<string>("");
  const [newType, setNewType] = useState<
    "ENTRADA" | "SALIDA" | "MERMA" | "AJUSTE"
  >("ENTRADA");
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newReason, setNewReason] = useState("");
  const [newSource, setNewSource] = useState<
    "WhatsApp" | "Dashboard" | "Sistema"
  >("Sistema");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { products } = useProducts();

  const filters = useMemo(
    () => ({
      product: selectedProduct || undefined,
      type: selectedType || undefined,
      source: selectedSource || undefined,
      datePreset: selectedDatePreset === "all" ? undefined : selectedDatePreset,
      page: currentPage,
      limit: 20,
    }),
    [
      selectedProduct,
      selectedType,
      selectedSource,
      selectedDatePreset,
      currentPage,
    ],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProduct, selectedType, selectedSource, selectedDatePreset]);

  const { movements, totalPages, loading, error, createMovement, isCreating } =
    useStockMovements(filters);

  const filteredMovements = useMemo(() => {
    let result = movements;

    if (searchQuery) {
      result = result.filter(
        (m) =>
          m.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m._id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return result;
  }, [movements, searchQuery]);

  const clearFilters = () => {
    setSelectedProduct("");
    setSelectedType("");
    setSelectedSource("");
    setSelectedDatePreset("today");
    setSearchQuery("");
  };

  const handleCreateMovement = async () => {
    if (!newProduct) {
      setStatusMessage({ type: "error", text: "Selecciona un producto." });

      return;
    }

    if (newQuantity <= 0) {
      setStatusMessage({
        type: "error",
        text: "La cantidad debe ser mayor a cero.",
      });

      return;
    }

    try {
      await createMovement({
        product: newProduct,
        type: newType,
        quantity: newQuantity,
        reason: newReason || undefined,
        source: newSource,
      });

      setStatusMessage({
        type: "success",
        text: "Movimiento creado correctamente.",
      });
      setShowNewMovement(false);
      setNewReason("");
      setNewQuantity(1);
      setNewProduct("");
      setNewType("ENTRADA");
      setNewSource("Sistema");
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: (error as Error)?.message || "Error al crear el movimiento.",
      });
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full flex-col overflow-hidden bg-background pb-28 lg:pb-8">
      {/* ── Mobile header ── */}
      <header className="app-topbar px-6 pt-6 pb-5 lg:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="section-kicker">Inventario</div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Movimientos y trazabilidad
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Consulta entradas, salidas, mermas y ajustes.
            </p>
          </div>

          <Button
            className="mt-1"
            radius="full"
            size="sm"
            variant={showNewMovement ? "flat" : "solid"}
            onClick={() => setShowNewMovement((prev) => !prev)}
          >
            {showNewMovement ? "Cerrar" : "Nuevo"}
          </Button>
        </div>

        <div className="mt-4">
          <Input
            placeholder="Buscar por producto, razon o ID..."
            startContent={<Search size={18} />}
            value={searchQuery}
            variant="bordered"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {DATE_PRESET_OPTIONS.map((option) => (
            <button
              key={option.key}
              className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                selectedDatePreset === option.key
                  ? "bg-primary text-primary-foreground"
                  : "app-panel-soft text-default-600"
              }`}
              onClick={() => setSelectedDatePreset(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <Autocomplete
            isClearable
            className="w-full"
            placeholder="Producto"
            selectedKey={selectedProduct || null}
            variant="bordered"
            onSelectionChange={(key) =>
              setSelectedProduct(key ? String(key) : "")
            }
          >
            {products.map((product) => (
              <AutocompleteItem key={product._id}>
                {product.name}
              </AutocompleteItem>
            ))}
          </Autocomplete>

          <Select
            className="w-full"
            placeholder="Tipo de movimiento"
            selectedKeys={selectedType ? [selectedType] : []}
            variant="bordered"
            onSelectionChange={(keys) =>
              setSelectedType(Array.from(keys)[0] as string)
            }
          >
            <SelectItem key="ENTRADA">Entrada</SelectItem>
            <SelectItem key="SALIDA">Salida</SelectItem>
            <SelectItem key="MERMA">Merma</SelectItem>
            <SelectItem key="AJUSTE">Ajuste</SelectItem>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              className="w-full"
              placeholder="Fuente"
              selectedKeys={selectedSource ? [selectedSource] : []}
              variant="bordered"
              onSelectionChange={(keys) =>
                setSelectedSource(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key="WhatsApp">WhatsApp</SelectItem>
              <SelectItem key="Dashboard">Dashboard</SelectItem>
              <SelectItem key="Sistema">Sistema</SelectItem>
            </Select>

            <Button className="h-full" variant="flat" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              statusMessage.type === "success"
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {showNewMovement && (
          <div className="mt-4 rounded-2xl border border-divider/30 bg-content2/40 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select
                className="w-full"
                placeholder="Producto"
                selectedKeys={newProduct ? [newProduct] : []}
                variant="bordered"
                onSelectionChange={(keys) =>
                  setNewProduct(Array.from(keys)[0] as string)
                }
              >
                {products.map((product) => (
                  <SelectItem key={product._id}>{product.name}</SelectItem>
                ))}
              </Select>

              <Select
                className="w-full"
                placeholder="Tipo"
                selectedKeys={[newType]}
                variant="bordered"
                onSelectionChange={(keys) =>
                  setNewType(
                    Array.from(keys)[0] as
                      | "ENTRADA"
                      | "SALIDA"
                      | "MERMA"
                      | "AJUSTE",
                  )
                }
              >
                <SelectItem key="ENTRADA">Entrada</SelectItem>
                <SelectItem key="SALIDA">Salida</SelectItem>
                <SelectItem key="MERMA">Merma</SelectItem>
                <SelectItem key="AJUSTE">Ajuste</SelectItem>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                min={1}
                placeholder="Cantidad"
                type="number"
                value={String(newQuantity)}
                variant="bordered"
                onChange={(e) => setNewQuantity(Number(e.target.value))}
              />
              <Select
                className="w-full"
                placeholder="Fuente"
                selectedKeys={[newSource]}
                variant="bordered"
                onSelectionChange={(keys) =>
                  setNewSource(
                    Array.from(keys)[0] as
                      | "WhatsApp"
                      | "Dashboard"
                      | "Sistema",
                  )
                }
              >
                <SelectItem key="WhatsApp">WhatsApp</SelectItem>
                <SelectItem key="Dashboard">Dashboard</SelectItem>
                <SelectItem key="Sistema">Sistema</SelectItem>
              </Select>
            </div>

            <Input
              placeholder="Razon (opcional)"
              value={newReason}
              variant="bordered"
              onChange={(e) => setNewReason(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewMovement(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={isCreating}
                size="sm"
                onClick={handleCreateMovement}
              >
                {isCreating ? "Guardando..." : "Crear movimiento"}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Desktop header ── */}
      <header className="hidden lg:block px-8 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="section-kicker">Inventario</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Movimientos y trazabilidad
            </h1>
            <p className="text-sm text-default-500">
              Consulta entradas, salidas, mermas y ajustes.
            </p>
          </div>
          <Button
            size="sm"
            variant="solid"
            onClick={() => setShowNewMovement((prev) => !prev)}
          >
            <Plus size={15} />
            Nuevo movimiento
          </Button>
        </div>

        {/* Desktop filters row */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="w-56">
            <Input
              placeholder="Buscar..."
              startContent={<Search size={15} className="text-default-400" />}
              value={searchQuery}
              variant="bordered"
              size="sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              aria-label="Producto"
              className="w-full"
              placeholder="Producto"
              selectedKeys={selectedProduct ? [selectedProduct] : []}
              size="sm"
              variant="bordered"
              onSelectionChange={(key) =>
                setSelectedProduct(Array.from(key)[0] as string)
              }
            >
              {products.map((product) => (
                <SelectItem key={product._id}>{product.name}</SelectItem>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <Select
              aria-label="Tipo"
              className="w-full"
              placeholder="Tipo"
              selectedKeys={selectedType ? [selectedType] : []}
              size="sm"
              variant="bordered"
              onSelectionChange={(keys) =>
                setSelectedType(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key="ENTRADA">Entrada</SelectItem>
              <SelectItem key="SALIDA">Salida</SelectItem>
              <SelectItem key="MERMA">Merma</SelectItem>
              <SelectItem key="AJUSTE">Ajuste</SelectItem>
            </Select>
          </div>
          <div className="w-32">
            <Select
              aria-label="Fuente"
              className="w-full"
              placeholder="Fuente"
              selectedKeys={selectedSource ? [selectedSource] : []}
              size="sm"
              variant="bordered"
              onSelectionChange={(keys) =>
                setSelectedSource(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key="WhatsApp">WhatsApp</SelectItem>
              <SelectItem key="Dashboard">Dashboard</SelectItem>
              <SelectItem key="Sistema">Sistema</SelectItem>
            </Select>
          </div>
          <div className="flex gap-2">
            {DATE_PRESET_OPTIONS.map((option) => (
              <button
                key={option.key}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  selectedDatePreset === option.key
                    ? "bg-primary text-white"
                    : "bg-content2/60 text-default-500 hover:bg-content2"
                }`}
                onClick={() => setSelectedDatePreset(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger/70 hover:text-danger transition"
            onClick={clearFilters}
          >
            Limpiar
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              statusMessage.type === "success"
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {showNewMovement && (
          <div className="mt-4 rounded-2xl border border-divider/30 bg-content2/40 p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Nuevo movimiento</h3>
            <div className="flex gap-3 items-end">
              <div className="w-56">
                <Select
                  aria-label="Producto"
                  className="w-full"
                  placeholder="Producto *"
                  selectedKeys={newProduct ? [newProduct] : []}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setNewProduct(Array.from(keys)[0] as string)
                  }
                >
                  {products.map((product) => (
                    <SelectItem key={product._id}>{product.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="w-32">
                <Select
                  aria-label="Tipo"
                  className="w-full"
                  placeholder="Tipo"
                  selectedKeys={[newType]}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setNewType(
                      Array.from(keys)[0] as
                        | "ENTRADA"
                        | "SALIDA"
                        | "MERMA"
                        | "AJUSTE",
                    )
                  }
                >
                  <SelectItem key="ENTRADA">Entrada</SelectItem>
                  <SelectItem key="SALIDA">Salida</SelectItem>
                  <SelectItem key="MERMA">Merma</SelectItem>
                  <SelectItem key="AJUSTE">Ajuste</SelectItem>
                </Select>
              </div>
              <div className="w-24">
                <Input
                  min={1}
                  placeholder="Cant."
                  type="number"
                  size="sm"
                  variant="bordered"
                  value={String(newQuantity)}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                />
              </div>
              <div className="w-32">
                <Select
                  aria-label="Fuente"
                  className="w-full"
                  placeholder="Fuente"
                  selectedKeys={[newSource]}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    setNewSource(
                      Array.from(keys)[0] as
                        | "WhatsApp"
                        | "Dashboard"
                        | "Sistema",
                    )
                  }
                >
                  <SelectItem key="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem key="Dashboard">Dashboard</SelectItem>
                  <SelectItem key="Sistema">Sistema</SelectItem>
                </Select>
              </div>
              <div className="w-48">
                <Input
                  placeholder="Razon (opcional)"
                  size="sm"
                  variant="bordered"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewMovement(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={isCreating}
                size="sm"
                onClick={handleCreateMovement}
              >
                {isCreating ? "Guardando..." : "Crear"}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1 px-6 py-4 lg:px-8 lg:py-0">
        {error && (
          <div className="mb-4 p-4 bg-danger/10 border border-danger/20 rounded-xl">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-16 h-16 text-default-400 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay movimientos
            </h3>
            <p className="text-default-500 mb-6">
              {searchQuery || selectedProduct || selectedType || selectedSource
                ? "No se encontraron movimientos con los filtros aplicados."
                : "Aun no hay movimientos registrados."}
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <div className="hidden lg:block overflow-hidden rounded-2xl border border-divider/20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-content2/50">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-default-500 w-[200px]">Producto / Presentación</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-default-500 w-[100px]">Tipo</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-default-500 w-[80px]">Cantidad</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-default-500 w-[70px]">Stock</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-default-500">Motivo</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-default-500 w-[100px]">Fuente</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-default-500 w-[120px]">Fecha</th>
                    <th className="px-4 py-3 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider/10">
                  {filteredMovements.map((movement) => {
                    const isNegative = movement.type === "SALIDA" || movement.type === "MERMA";
                    return (
                      <tr key={movement._id} className="transition-colors hover:bg-content2/30 cursor-pointer" onClick={() => navigate(`/movements/${movement._id}`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isNegative ? "bg-danger" : "bg-success"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground leading-tight">{movement.product.name}</p>
                              <p className="text-[10px] text-default-400 leading-tight mt-0.5">{movement.product.sku}</p>
                              {movement.presentationName ? (
                                <div className="mt-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Package size={11} className="text-primary shrink-0" />
                                    <p className="text-xs font-bold text-primary">{movement.presentationName}</p>
                                  </div>
                                  {movement.presentationUnitCost && movement.presentationEquivalentQty && (
                                    <p className="text-[10px] text-default-500 mt-0.5">
                                      {formatCompactCurrency(movement.presentationUnitCost, currency)} c/u · {movement.presentationEquivalentQty} {movement.product.unitOfMeasure || "ud"} c/u
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-[10px] italic text-default-400">Producto base</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            movement.type === "ENTRADA" ? "bg-success/10 text-success" :
                            movement.type === "SALIDA" ? "bg-danger/10 text-danger" :
                            movement.type === "MERMA" ? "bg-warning/10 text-warning" :
                            "bg-primary/10 text-primary"
                          }`}>
                            {movement.type === "ENTRADA" ? <ArrowUp size={10} /> :
                             movement.type === "SALIDA" ? <ArrowDown size={10} /> :
                             movement.type === "MERMA" ? <Minus size={10} /> :
                             <RotateCcw size={10} />}
                            {movement.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold tabular-nums ${isNegative ? "text-danger" : "text-success"}`}>
                            {isNegative ? "−" : "+"}{movement.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-default-400 tabular-nums font-medium">{movement.stockAfter}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-default-500 truncate max-w-[200px]">
                            {movement.reason ? (
                              <span className="text-foreground">{movement.reason}</span>
                            ) : (
                              <span className="italic text-default-400">—</span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-default-500">{movement.source}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-xs text-default-500 whitespace-nowrap">
                            {new Date(movement.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-default-400">
                            {new Date(movement.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight size={14} className="text-default-300" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="space-y-3 lg:hidden">
              {filteredMovements.map((movement) => (
                <div
                  key={movement._id}
                  className="rounded-2xl border border-divider/20 bg-content2/20 p-4 transition-colors hover:bg-content2/40 cursor-pointer"
                  onClick={() => navigate(`/movements/${movement._id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {movement.type === "ENTRADA" ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                          <ArrowUp size={14} />
                        </div>
                      ) : movement.type === "SALIDA" ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                          <ArrowDown size={14} />
                        </div>
                      ) : movement.type === "MERMA" ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                          <Minus size={14} />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <RotateCcw size={14} />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {movement.product.name}
                        </h3>
                        <p className="text-xs text-default-400">
                          {movement.product.sku}
                        </p>
                        {movement.presentationName ? (
                          <div className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-primary/5 border border-primary/20 px-2 py-1">
                            <Package size={10} className="text-primary" />
                            <span className="text-[11px] font-bold text-primary">{movement.presentationName}</span>
                            {movement.presentationUnitCost && (
                              <span className="text-[10px] text-default-500 ml-1">· {formatCompactCurrency(movement.presentationUnitCost, currency)} c/u</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-default-400">Producto base</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-[10px] text-default-400">Cantidad</p>
                      <p className={`text-sm font-bold tabular-nums ${movement.type === "SALIDA" || movement.type === "MERMA" ? "text-danger" : "text-success"}`}>
                        {movement.type === "SALIDA" || movement.type === "MERMA" ? "-" : "+"}{movement.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-default-400">Stock</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">{movement.stockAfter}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-default-400">Fuente</p>
                      <p className="text-sm text-default-500">{movement.source}</p>
                    </div>
                  </div>

                  {movement.reason && (
                    <p className="text-xs text-default-500 mb-2">{movement.reason}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-default-400">
                      {new Date(movement.createdAt).toLocaleString()}
                    </span>
                    <ChevronRight size={14} className="text-default-300" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6 pb-8">
            <Button
              disabled={currentPage === 1}
              size="sm"
              variant="flat"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              Anterior
            </Button>
            <span className="px-3 py-2 text-sm">
              {currentPage} de {totalPages}
            </span>
            <Button
              disabled={currentPage === totalPages}
              size="sm"
              variant="flat"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
            >
              Siguiente
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
