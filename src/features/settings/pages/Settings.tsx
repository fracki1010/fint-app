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
  ChartNoAxesCombined,
  Palette,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useSettings, Setting } from "@features/settings/hooks/useSettings";
import { useWhatsApp } from "@features/sales/hooks/useWhatsApp";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";
import { useThemeStore } from "@shared/stores/themeStore";

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
  | "apariencia"
  | "integraciones"
  | "movimientos";

export default function SettingsPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { settings, loading, error, updateSettings } = useSettings();
  const setTheme = useThemeStore((s) => s.setTheme);
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
  const [savingWhatsAppAccess, setSavingWhatsAppAccess] = useState(false);
  const [newAuthorizedNumber, setNewAuthorizedNumber] = useState("");
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

  const normalizePhoneDigits = (value: string) =>
    value
      .toString()
      .trim()
      .replace(/[^\d]/g, "");

  const whatsappNumberFormat = formData.whatsappNumberFormat || "AR";

  const handleAddAuthorizedNumber = () => {
    const nextNumber = normalizePhoneDigits(newAuthorizedNumber);
    if (!nextNumber) {
      showToast({
        variant: "warning",
        message: "Ingresa un numero valido para agregar.",
      });
      return;
    }

    const current = Array.isArray(formData.whatsappAuthorizedNumbers)
      ? formData.whatsappAuthorizedNumbers
          .map((value) => normalizePhoneDigits(value.toString()))
          .filter(Boolean)
      : [];

    if (current.includes(nextNumber)) {
      showToast({
        variant: "warning",
        message: "Ese numero ya esta en autorizados.",
      });
      return;
    }

    handleInputChange("whatsappAuthorizedNumbers", [...current, nextNumber]);
    setNewAuthorizedNumber("");
  };

  const handleRemoveAuthorizedNumber = (numberToRemove: string) => {
    const current = Array.isArray(formData.whatsappAuthorizedNumbers)
      ? formData.whatsappAuthorizedNumbers
      : [];

    handleInputChange(
      "whatsappAuthorizedNumbers",
      current.filter((value) => value !== numberToRemove),
    );
  };

  const handleSaveWhatsAppAccess = async () => {
    setSavingWhatsAppAccess(true);
    try {
      const payload = {
        whatsappNumberFormat,
        whatsappAdminNumber: normalizePhoneDigits(
          (formData.whatsappAdminNumber || "").toString(),
        ),
        whatsappAuthorizedNumbers: (
          Array.isArray(formData.whatsappAuthorizedNumbers)
            ? formData.whatsappAuthorizedNumbers
            : []
        )
          .map((value) => normalizePhoneDigits(value.toString()))
          .filter(Boolean),
      };

      const updated = await updateSettings(payload);
      setFormData((prev) => ({ ...prev, ...updated }));
      showToast({
        variant: "success",
        message: "Accesos de WhatsApp guardados.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(
          error,
          "No se pudieron guardar los accesos de WhatsApp.",
        ),
      });
    } finally {
      setSavingWhatsAppAccess(false);
    }
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
      const status = await startWhatsApp();

      if (status.status === "error" || status.status === "auth_failure") {
        showToast({
          variant: "error",
          message:
            status.lastError ||
            "WhatsApp no pudo iniciar. Revisa el estado y vuelve a intentar.",
        });
        return;
      }

      const successMessage =
        status.status === "ready"
          ? "WhatsApp conectado correctamente."
          : status.status === "qr_ready"
            ? "WhatsApp iniciado. Escanea el QR para conectar."
            : "Inicio solicitado. Esperando estado de conexion.";

      showToast({
        variant: "success",
        message: successMessage,
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
      const status = await stopWhatsApp();
      showToast({
        variant: status.status === "error" ? "error" : "success",
        message:
          status.status === "error"
            ? status.lastError || "No se pudo detener WhatsApp correctamente."
            : "WhatsApp detenido correctamente.",
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
      const status = await restartWhatsApp();
      if (status.status === "error" || status.status === "auth_failure") {
        showToast({
          variant: "error",
          message:
            status.lastError ||
            "WhatsApp no pudo reiniciarse. Revisa el estado y vuelve a intentar.",
        });
        return;
      }

      showToast({
        variant: "success",
        message:
          status.status === "ready"
            ? "WhatsApp reiniciado y conectado."
            : "WhatsApp reiniciado. Esperando conexion.",
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
  const whatsappAdminNumberDisplay = normalizePhoneDigits(
    (formData.whatsappAdminNumber || "").toString(),
  );
  const whatsappAuthorizedNumbersDisplay = Array.isArray(
    formData.whatsappAuthorizedNumbers,
  )
    ? formData.whatsappAuthorizedNumbers
        .map((value) => normalizePhoneDigits(value.toString()))
        .filter(Boolean)
    : [];

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
    apariencia: "Apariencia",
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

          <div>
            <p className="text-xs font-semibold text-default-500 mb-2">Impresión de ticket</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`rounded-xl py-2.5 text-xs font-bold transition ${
                  formData.autoPrintTicket !== false
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-content2/60 text-default-500"
                }`}
                onClick={() => handleInputChange("autoPrintTicket", true)}
              >
                🖨 Imprimir siempre
              </button>
              <button
                className={`rounded-xl py-2.5 text-xs font-bold transition ${
                  formData.autoPrintTicket === false
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "bg-content2/60 text-default-500"
                }`}
                onClick={() => handleInputChange("autoPrintTicket", false)}
              >
                No imprimir
              </button>
            </div>
          </div>

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

    if (activeSection === "apariencia") {
      const currentTheme = (formData.theme as "light" | "dark") || "dark";
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-default-200/70 bg-content1/60 p-4">
            <p className="text-sm font-semibold text-foreground">
              Tema de la app
            </p>
            <p className="mt-1 text-xs text-default-500">
              Elige como quieres ver toda la interfaz.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                className="justify-start"
                color="primary"
                variant={currentTheme === "light" ? "solid" : "flat"}
                onClick={() => {
                  handleInputChange("theme", "light");
                  setTheme("light");
                }}
              >
                Claro
              </Button>
              <Button
                className="justify-start"
                color="primary"
                variant={currentTheme === "dark" ? "solid" : "flat"}
                onClick={() => {
                  handleInputChange("theme", "dark");
                  setTheme("dark");
                }}
              >
                Oscuro
              </Button>
            </div>
          </div>
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

              <div className="mt-3 grid grid-cols-1 gap-2">
                <Select
                  label="Formato de numero"
                  selectedKeys={[whatsappNumberFormat]}
                  size="sm"
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    handleInputChange(
                      "whatsappNumberFormat",
                      Array.from(keys)[0] as "AR" | "INTL",
                    )
                  }
                >
                  <SelectItem key="AR">
                    Argentina (+54, agrega 9 automaticamente)
                  </SelectItem>
                  <SelectItem key="INTL">Internacional (manual)</SelectItem>
                </Select>
                <Input
                  description={
                    whatsappNumberFormat === "AR"
                      ? "Ingresa numero base (ej: 2622517447). Se guarda como 549..."
                      : "Ingresa numero completo internacional."
                  }
                  label="Numero administrador"
                  placeholder={
                    whatsappNumberFormat === "AR"
                      ? "2622517447"
                      : "5491122334455"
                  }
                  size="sm"
                  value={formData.whatsappAdminNumber || ""}
                  variant="bordered"
                  onChange={(e) =>
                    handleInputChange(
                      "whatsappAdminNumber",
                      normalizePhoneDigits(e.target.value),
                    )
                  }
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    description="Agrega un numero y luego pulsa Agregar."
                    label="Nuevo autorizado"
                    placeholder={
                      whatsappNumberFormat === "AR"
                        ? "2622517447"
                        : "5491122334455"
                    }
                    size="sm"
                    value={newAuthorizedNumber}
                    variant="bordered"
                    onChange={(e) =>
                      setNewAuthorizedNumber(
                        normalizePhoneDigits(e.target.value),
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAuthorizedNumber();
                      }
                    }}
                  />
                  <Button
                    className="self-end"
                    color="primary"
                    size="sm"
                    variant="flat"
                    onClick={handleAddAuthorizedNumber}
                  >
                    Agregar
                  </Button>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-default-200/70 bg-content1/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-default-600">
                  Numeros configurados
                </p>
                <p className="mt-2 text-xs text-default-700">
                  Admin: {whatsappAdminNumberDisplay || "Sin configurar"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {whatsappAuthorizedNumbersDisplay.length > 0 ? (
                    whatsappAuthorizedNumbersDisplay.map((phone) => (
                      <span
                        key={phone}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs text-primary"
                      >
                        {phone}
                        <button
                          aria-label={`Eliminar ${phone}`}
                          className="rounded-full p-0.5 transition hover:bg-primary/20"
                          onClick={() => handleRemoveAuthorizedNumber(phone)}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-default-500">Sin autorizados.</p>
                  )}
                </div>
                <div className="mt-3">
                  <Button
                    color="primary"
                    isLoading={savingWhatsAppAccess}
                    size="sm"
                    startContent={!savingWhatsAppAccess ? <Save size={14} /> : null}
                    variant="solid"
                    onClick={handleSaveWhatsAppAccess}
                  >
                    {savingWhatsAppAccess
                      ? "Guardando accesos..."
                      : "Guardar accesos WhatsApp"}
                  </Button>
                </div>
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
    <div className="relative mx-auto flex h-full w-full max-w-md flex-col bg-background pb-28 font-sans lg:max-w-none lg:px-6 lg:pb-8">
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

        <div className="grid gap-4 lg:grid-cols-2">
          <button
            className="app-panel h-full w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
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
            className="app-panel h-full w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
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
            className="app-panel h-full w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
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
            className="app-panel h-full w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
            onClick={() => setActiveSection("apariencia")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Apariencia
                </p>
                <p className="mt-1 text-xs text-default-500">
                  Tema visual y preferencias de visualizacion.
                </p>
                <p className="mt-2 text-xs text-default-400">
                  Tema actual:{" "}
                  {formData.theme === "dark" ? "Oscuro" : "Claro"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <Palette size={18} />
              </div>
            </div>
          </button>

          <button
            className="app-panel h-full w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
            onClick={() => setActiveSection("integraciones")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Integraciones
                </p>
                <p className="mt-1 text-xs text-default-500">
                  WhatsApp y politica de entrega.
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
            className="app-panel h-full w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01]"
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

          <button
            className="app-panel h-full w-full rounded-[24px] p-5 text-left transition hover:scale-[1.01] lg:col-span-2"
            onClick={() => navigate("/financial/dashboard")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Centro Financiero
                </p>
                <p className="mt-1 text-xs text-default-500">
                  Dashboard ejecutivo, contabilidad, analisis y proyecciones.
                </p>
                <p className="mt-2 text-xs text-default-400">
                  Ir al modulo financiero
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <ChartNoAxesCombined size={18} />
              </div>
            </div>
          </button>
        </div>
      </main>

      <Drawer
        hideCloseButton
        backdrop="opaque"
        isOpen={Boolean(activeSection)}
        placement={isDesktop ? "right" : "bottom"}
        scrollBehavior="inside"
        size={isDesktop ? "xl" : "full"}
        onOpenChange={(open: boolean) => {
          if (!open) setActiveSection(null);
        }}
      >
        <DrawerContent
          className={
            isDesktop
              ? "h-screen w-full max-w-xl overflow-x-hidden rounded-none bg-content1"
              : "h-screen w-screen max-w-none overflow-x-hidden rounded-none bg-content1"
          }
        >
          <DrawerBody className="flex h-full flex-col overflow-x-hidden p-6">
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
