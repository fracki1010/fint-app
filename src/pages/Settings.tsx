import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  ShieldCheck,
  Landmark,
  Smartphone,
  Boxes,
  Play,
  Square,
  RotateCcw,
  QrCode,
  Wifi,
  LogOut,
  ArrowUpRight,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useSettings, Setting } from "@/hooks/useSettings";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useAuth } from "@/hooks/useAuth";
import { useAppToast } from "@/components/AppToast";
import { getErrorMessage } from "@/utils/errors";

const UNIT_OPTIONS = [
  { key: "unidad", label: "Unidad" },
  { key: "caja", label: "Caja" },
  { key: "paquete", label: "Paquete" },
  { key: "bolsa", label: "Bolsa" },
  { key: "botella", label: "Botella" },
  { key: "kg", label: "Kilogramo" },
  { key: "g", label: "Gramo" },
  { key: "litro", label: "Litro" },
  { key: "ml", label: "Mililitro" },
  { key: "metro", label: "Metro" },
];

type SettingsSection =
  | "empresa"
  | "ventas"
  | "inventario"
  | "integraciones"
  | "movimientos";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, loading, error, updateSettings } = useSettings();
  const { logout } = useAuth();
  const { showToast } = useAppToast();
  const {
    whatsappStatus,
    startWhatsApp,
    stopWhatsApp,
    restartWhatsApp,
    isStarting,
    isStopping,
    isRestarting,
  } = useWhatsApp();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Setting>>({});
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(
    null,
  );

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (field: keyof Setting, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.taxId?.trim() || !formData.fiscalCondition?.trim()) {
      showToast({
        variant: "warning",
        message:
          "Completa CUIT/NIT y condicion fiscal en Empresa para poder emitir facturas.",
      });

      return;
    }

    setSaving(true);
    try {
      await updateSettings(formData);
      showToast({
        variant: "success",
        message: "Configuracion guardada exitosamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "Error al guardar configuracion."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartWhatsApp = async () => {
    try {
      await startWhatsApp();
      showToast({
        variant: "success",
        message: "WhatsApp iniciado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo iniciar WhatsApp."),
      });
    }
  };

  const handleStopWhatsApp = async () => {
    try {
      await stopWhatsApp();
      showToast({
        variant: "success",
        message: "WhatsApp detenido correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo detener WhatsApp."),
      });
    }
  };

  const handleRestartWhatsApp = async () => {
    try {
      await restartWhatsApp();
      showToast({
        variant: "success",
        message: "WhatsApp reiniciado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo reiniciar WhatsApp."),
      });
    }
  };

  const isBusy = isStarting || isStopping || isRestarting;
  const whatsappConnectionStatus = whatsappStatus?.status || "stopped";
  const whatsappStatusLabelMap: Record<string, string> = {
    stopped: "Detenido",
    starting: "Iniciando",
    stopping: "Deteniendo",
    ready: "Conectado",
    qr_ready: "Esperando escaneo",
    auth_failure: "Error de autenticacion",
    disconnected: "Desconectado",
    error: "Error",
  };
  const whatsappStatusClassMap: Record<string, string> = {
    ready: "bg-success/15 text-success",
    qr_ready: "bg-warning/15 text-warning",
    starting: "bg-primary/15 text-primary",
    stopping: "bg-default-200 text-default-700",
    stopped: "bg-default-200 text-default-700",
    disconnected: "bg-danger/15 text-danger",
    auth_failure: "bg-danger/15 text-danger",
    error: "bg-danger/15 text-danger",
  };
  const whatsappStatusLabel =
    whatsappStatusLabelMap[whatsappConnectionStatus] ||
    whatsappConnectionStatus;
  const whatsappStatusClass =
    whatsappStatusClassMap[whatsappConnectionStatus] ||
    "bg-default-200 text-default-700";

  if (loading && !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sectionTitleMap: Record<SettingsSection, string> = {
    empresa: "Empresa",
    ventas: "Ventas",
    inventario: "Inventario",
    integraciones: "Integraciones",
    movimientos: "Movimientos",
  };

  const renderSectionContent = () => {
    if (!activeSection) return null;

    if (activeSection === "empresa") {
      return (
        <div className="space-y-4">
          <Input
            label="Nombre de la empresa"
            value={formData.storeName || ""}
            variant="bordered"
            onChange={(e) => handleInputChange("storeName", e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              isRequired
              label="CUIT / NIT / RUC"
              value={formData.taxId || ""}
              variant="bordered"
              onChange={(e) => handleInputChange("taxId", e.target.value)}
            />
            <Input
              isRequired
              label="Condicion fiscal"
              value={formData.fiscalCondition || ""}
              variant="bordered"
              onChange={(e) =>
                handleInputChange("fiscalCondition", e.target.value)
              }
            />
          </div>
          <Input
            label="Direccion"
            value={formData.address || ""}
            variant="bordered"
            onChange={(e) => handleInputChange("address", e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Telefono"
              value={formData.phone || ""}
              variant="bordered"
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || ""}
              variant="bordered"
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>
        </div>
      );
    }

    if (activeSection === "ventas") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Prefijo de pedido"
              value={formData.orderPrefix || "VTA"}
              variant="bordered"
              onChange={(e) =>
                handleInputChange("orderPrefix", e.target.value.toUpperCase())
              }
            />
            <Input
              label="Tasa de IVA (%)"
              min="0"
              step="0.01"
              type="number"
              value={formData.taxRate?.toString() || "0"}
              variant="bordered"
              onChange={(e) =>
                handleInputChange("taxRate", parseFloat(e.target.value) || 0)
              }
            />
          </div>

          <Select
            label="Moneda"
            selectedKeys={[formData.currency || "USD"]}
            variant="bordered"
            onSelectionChange={(keys) =>
              handleInputChange("currency", Array.from(keys)[0] as string)
            }
          >
            <SelectItem key="USD">USD</SelectItem>
            <SelectItem key="EUR">EUR</SelectItem>
            <SelectItem key="MXN">MXN</SelectItem>
            <SelectItem key="COP">COP</SelectItem>
            <SelectItem key="ARS">Peso argentino (ARS)</SelectItem>
          </Select>

          <Input
            label="Condiciones de factura"
            placeholder="Ej: Pago a 15 dias, transferencia bancaria..."
            value={formData.invoiceTerms || ""}
            variant="bordered"
            onChange={(e) => handleInputChange("invoiceTerms", e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Estado venta"
              selectedKeys={[formData.defaultSalesStatus || "Pendiente"]}
              variant="bordered"
              onSelectionChange={(keys) =>
                handleInputChange(
                  "defaultSalesStatus",
                  Array.from(keys)[0] as Setting["defaultSalesStatus"],
                )
              }
            >
              <SelectItem key="Pendiente">Pendiente</SelectItem>
              <SelectItem key="Confirmada">Confirmada</SelectItem>
              <SelectItem key="Cancelada">Cancelada</SelectItem>
            </Select>

            <Select
              label="Estado pago"
              selectedKeys={[formData.defaultPaymentStatus || "Pendiente"]}
              variant="bordered"
              onSelectionChange={(keys) =>
                handleInputChange(
                  "defaultPaymentStatus",
                  Array.from(keys)[0] as Setting["defaultPaymentStatus"],
                )
              }
            >
              <SelectItem key="Pendiente">Pendiente</SelectItem>
              <SelectItem key="Parcial">Parcial</SelectItem>
              <SelectItem key="Pagado">Pagado</SelectItem>
            </Select>

            <Select
              label="Estado entrega"
              selectedKeys={[formData.defaultDeliveryStatus || "Pendiente"]}
              variant="bordered"
              onSelectionChange={(keys) =>
                handleInputChange(
                  "defaultDeliveryStatus",
                  Array.from(keys)[0] as Setting["defaultDeliveryStatus"],
                )
              }
            >
              <SelectItem key="Pendiente">Pendiente</SelectItem>
              <SelectItem key="Preparando">Preparando</SelectItem>
              <SelectItem key="Entregada">Entregada</SelectItem>
            </Select>
          </div>
        </div>
      );
    }

    if (activeSection === "inventario") {
      return (
        <div className="space-y-4">
          <Input
            label="Umbral de Stock Bajo"
            min="0"
            type="number"
            value={formData.lowStockThreshold?.toString() || "5"}
            variant="bordered"
            onChange={(e) =>
              handleInputChange(
                "lowStockThreshold",
                parseInt(e.target.value) || 5,
              )
            }
          />

          <Select
            label="Unidad por defecto"
            selectedKeys={[formData.defaultUnitOfMeasure || "unidad"]}
            variant="bordered"
            onSelectionChange={(keys) =>
              handleInputChange(
                "defaultUnitOfMeasure",
                Array.from(keys)[0] as string,
              )
            }
          >
            {UNIT_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>

          <Select
            label="Momento de descuento de stock"
            selectedKeys={[formData.stockDeductionMoment || "delivery"]}
            variant="bordered"
            onSelectionChange={(keys) =>
              handleInputChange(
                "stockDeductionMoment",
                Array.from(keys)[0] as Setting["stockDeductionMoment"],
              )
            }
          >
            <SelectItem key="delivery">Al entregar</SelectItem>
            <SelectItem key="confirmation">Al confirmar</SelectItem>
          </Select>
        </div>
      );
    }

    if (activeSection === "integraciones") {
      return (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-content1 to-success/10 p-5">
            <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-28 w-28 rounded-full bg-success/20 blur-2xl" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Conexion de WhatsApp
                </p>
                <p className="mt-1 text-xs text-default-500">
                  Gestion completa desde la app, sin depender de la terminal.
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${whatsappStatusClass}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {whatsappStatusLabel}
              </div>
            </div>

            <div className="relative mt-4 rounded-2xl border border-default-200/70 bg-background/85 p-3 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-default-600">
                  <Wifi size={14} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">
                    Sesion
                  </span>
                </div>
                <span className="text-xs text-default-500">
                  {whatsappStatus?.lastEventAt
                    ? new Date(whatsappStatus.lastEventAt).toLocaleTimeString()
                    : "--:--"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  color="primary"
                  isDisabled={isBusy || whatsappConnectionStatus === "ready"}
                  size="sm"
                  startContent={
                    isStarting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play size={14} />
                    )
                  }
                  variant="solid"
                  onClick={handleStartWhatsApp}
                >
                  Iniciar
                </Button>
                <Button
                  color="danger"
                  isDisabled={isBusy || whatsappConnectionStatus === "stopped"}
                  size="sm"
                  startContent={
                    isStopping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Square size={14} />
                    )
                  }
                  variant="flat"
                  onClick={handleStopWhatsApp}
                >
                  Detener
                </Button>
                <Button
                  isDisabled={isBusy}
                  size="sm"
                  startContent={
                    isRestarting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )
                  }
                  variant="bordered"
                  onClick={handleRestartWhatsApp}
                >
                  Reiniciar
                </Button>
              </div>
            </div>

            {whatsappStatus?.lastError && (
              <p className="relative mt-3 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
                {whatsappStatus.lastError}
              </p>
            )}

            {whatsappStatus?.qrCodeDataUrl ? (
              <div className="relative mt-4 rounded-2xl border border-default-200/70 bg-background/90 p-4 text-center backdrop-blur">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-content2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-default-700">
                  <QrCode size={13} />
                  Escanear QR
                </div>
                <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-lg shadow-primary/10">
                  <img
                    alt="QR de WhatsApp"
                    className="h-56 w-56 rounded-xl"
                    src={whatsappStatus.qrCodeDataUrl}
                  />
                </div>
                <p className="mt-3 text-xs text-default-500">
                  Abri WhatsApp en tu telefono y vincula este dispositivo.
                </p>
              </div>
            ) : (
              <div className="relative mt-4 rounded-2xl border border-dashed border-default-300 bg-background/70 px-4 py-5 text-center">
                <p className="text-xs font-medium text-default-600">
                  No hay QR activo.
                </p>
                <p className="mt-1 text-xs text-default-500">
                  Presiona Iniciar para generar uno nuevo.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-default-200/70 bg-content1/60 p-4">
            <p className="text-sm font-semibold text-foreground">
              Politica de entrega
            </p>
            <p className="mt-1 text-xs text-default-500">
              Define si se puede marcar como entregada una venta con saldo
              pendiente.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                className="justify-start"
                color="primary"
                variant={
                  formData.allowDeliveryWithoutPayment ? "flat" : "solid"
                }
                onClick={() =>
                  handleInputChange("allowDeliveryWithoutPayment", false)
                }
              >
                Exigir pago total
              </Button>
              <Button
                className="justify-start"
                color="warning"
                variant={
                  formData.allowDeliveryWithoutPayment ? "solid" : "flat"
                }
                onClick={() =>
                  handleInputChange("allowDeliveryWithoutPayment", true)
                }
              >
                Permitir entrega con pendiente
              </Button>
            </div>
          </div>

          <Select
            label="Tema visual"
            selectedKeys={[formData.theme || "light"]}
            variant="bordered"
            onSelectionChange={(keys) =>
              handleInputChange(
                "theme",
                Array.from(keys)[0] as "light" | "dark",
              )
            }
          >
            <SelectItem key="light">Claro</SelectItem>
            <SelectItem key="dark">Oscuro</SelectItem>
          </Select>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-default-200/70 bg-content1/60 p-4">
          <p className="text-sm font-semibold text-foreground">
            Historial de movimientos
          </p>
          <p className="mt-1 text-xs text-default-500">
            Consulta el historial operativo de inventario: entradas, salidas,
            mermas y ajustes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button
            className="h-12 justify-between rounded-2xl"
            color="primary"
            endContent={<ArrowUpRight size={16} />}
            onClick={() => {
              setActiveSection(null);
              navigate("/movements");
            }}
          >
            Ir a Movimientos
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-sans max-w-md mx-auto relative overflow-hidden">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start">
            <div>
              <div className="section-kicker">Configuracion</div>
              <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
                Panel de Gobierno
              </h1>
              <p className="mt-2 text-sm text-default-500">
                Reglas del negocio, inventario, ventas e integraciones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              color="danger"
              radius="full"
              size="sm"
              startContent={<LogOut size={16} />}
              variant="flat"
              onClick={logout}
            >
              Cerrar sesion
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button
            className="app-panel w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
            onClick={() => setActiveSection("empresa")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Empresa</p>
                <p className="mt-1 text-xs text-default-500">
                  Datos institucionales, contacto y direccion del negocio.
                </p>
                <p className="mt-2 text-xs text-default-400">
                  {formData.storeName || "Sin nombre de empresa"}
                  {formData.taxId ? ` · ${formData.taxId}` : ""}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <Landmark size={18} />
              </div>
            </div>
          </button>

          <button
            className="app-panel w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
            onClick={() => setActiveSection("ventas")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Ventas</p>
                <p className="mt-1 text-xs text-default-500">
                  Moneda, estados por defecto y reglas comerciales.
                </p>
                <p className="mt-2 text-xs text-default-400">
                  {formData.currency || "USD"} · IVA {formData.taxRate || 0}%
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <ShieldCheck size={18} />
              </div>
            </div>
          </button>

          <button
            className="app-panel w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
            onClick={() => setActiveSection("inventario")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Inventario
                </p>
                <p className="mt-1 text-xs text-default-500">
                  Umbral de stock bajo, unidad por defecto y descuento de stock.
                </p>
                <p className="mt-2 text-xs text-default-400">
                  Umbral {formData.lowStockThreshold || 5} ·{" "}
                  {formData.defaultUnitOfMeasure || "unidad"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <Boxes size={18} />
              </div>
            </div>
          </button>

          <button
            className="app-panel w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
            onClick={() => setActiveSection("integraciones")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Integraciones
                </p>
                <p className="mt-1 text-xs text-default-500">
                  WhatsApp, politica de entrega y tema visual.
                </p>
                <p className="mt-2 text-xs text-default-400">
                  Estado WhatsApp: {whatsappStatusLabel}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <Smartphone size={18} />
              </div>
            </div>
          </button>

          <button
            className="app-panel w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
            onClick={() => setActiveSection("movimientos")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Movimientos
                </p>
                <p className="mt-1 text-xs text-default-500">
                  Revisa el historial de movimientos de inventario.
                </p>
                <p className="mt-2 text-xs text-default-400">
                  Ir al modulo de movimientos
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <ArrowUpRight size={18} />
              </div>
            </div>
          </button>
        </div>
      </main>

      <Drawer
        hideCloseButton
        backdrop="opaque"
        isOpen={Boolean(activeSection)}
        placement="bottom"
        scrollBehavior="inside"
        size="full"
        onOpenChange={(open: boolean) => {
          if (!open) setActiveSection(null);
        }}
      >
        <DrawerContent className="h-screen w-screen max-w-none rounded-none">
          <DrawerBody className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-kicker">Ajustes</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {activeSection
                    ? sectionTitleMap[activeSection]
                    : "Configuracion"}
                </h2>
              </div>
              <button
                className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500"
                onClick={() => setActiveSection(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pr-1">
              {renderSectionContent()}
            </div>

            {activeSection !== "movimientos" && (
              <div className="mt-6">
                <Button
                  fullWidth
                  className="h-14 rounded-2xl font-semibold"
                  color="primary"
                  isDisabled={saving}
                  size="lg"
                  startContent={
                    saving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save size={20} />
                    )
                  }
                  onClick={handleSave}
                >
                  {saving ? "Guardando..." : "Guardar Configuracion"}
                </Button>
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
