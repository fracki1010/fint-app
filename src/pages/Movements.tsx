import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Package,
  ArrowUp,
  ArrowDown,
  Minus,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { useNavigate } from "react-router-dom";

import { useStockMovements } from "@/hooks/useStockMovements";
import { useProducts } from "@/hooks/useProducts";

type DatePreset = "all" | "today" | "7" | "30" | "90";

const DATE_PRESET_OPTIONS: Array<{ key: DatePreset; label: string }> = [
  { key: "today", label: "Hoy" },
  { key: "7", label: "Ultimos 7 dias" },
  { key: "30", label: "Ultimos 30 dias" },
  { key: "90", label: "Ultimos 90 dias" },
];

export default function MovementsPage() {
  const navigate = useNavigate();
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

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "ENTRADA":
        return <ArrowUp className="w-4 h-4 text-success" />;
      case "SALIDA":
        return <ArrowDown className="w-4 h-4 text-danger" />;
      case "MERMA":
        return <Minus className="w-4 h-4 text-warning" />;
      case "AJUSTE":
        return <RotateCcw className="w-4 h-4 text-primary" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "ENTRADA":
        return "success";
      case "SALIDA":
        return "danger";
      case "MERMA":
        return "warning";
      case "AJUSTE":
        return "primary";
      default:
        return "default";
    }
  };

  const getSignedQuantity = (
    type: "ENTRADA" | "SALIDA" | "MERMA" | "AJUSTE",
    quantity: number,
  ) =>
    type === "SALIDA" || type === "MERMA" ? `-${quantity}` : `+${quantity}`;

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
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-28 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
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
          <Card className="mt-4 w-full">
            <CardBody className="space-y-3">
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
            </CardBody>
          </Card>
        )}
      </header>

      <main className="flex-1 px-6 py-4">
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
          <div className="space-y-4">
            {filteredMovements.map((movement) => (
              <Card key={movement._id} className="w-full">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.type)}
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {movement.product.name}
                        </h3>
                        <p className="text-sm text-default-500">
                          {movement.product.sku}
                        </p>
                      </div>
                    </div>
                    <Chip
                      color={getMovementColor(movement.type) as any}
                      size="sm"
                      variant="flat"
                    >
                      {movement.type}
                    </Chip>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-default-500">Cantidad</p>
                      <p className="font-medium">
                        {getSignedQuantity(movement.type, movement.quantity)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Stock Inicial</p>
                      <p className="font-medium">{movement.stockBefore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Stock Final</p>
                      <p className="font-medium">{movement.stockAfter}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Variacion</p>
                      <p className="font-medium">
                        {movement.stockAfter - movement.stockBefore > 0
                          ? `+${movement.stockAfter - movement.stockBefore}`
                          : movement.stockAfter - movement.stockBefore}
                      </p>
                    </div>
                  </div>

                  {movement.reason && (
                    <div className="mb-3">
                      <p className="text-xs text-default-500">Razon</p>
                      <p className="text-sm">{movement.reason}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-default-500">
                    <span>{movement.source}</span>
                    <span>{new Date(movement.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="mt-3">
                    <Button
                      className="w-full"
                      size="sm"
                      variant="flat"
                      onClick={() => navigate(`/movements/${movement._id}`)}
                    >
                      Ver detalle completo
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
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
