import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  ShieldCheck,
  Landmark,
  Smartphone,
  Boxes,
  LogOut,
  ArrowUpRight,
  X,
  ChartNoAxesCombined,
  Palette,
  Receipt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useSettings, Setting } from "@features/settings/hooks/useSettings";
import { useWhatsApp } from "@features/sales/hooks/useWhatsApp";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";

import SettingsSection from "../components/SettingsSection";
import GeneralSection from "../components/GeneralSection";
import SalesSection from "../components/SalesSection";
import InventorySection from "../components/InventorySection";
import AppearanceSection from "../components/AppearanceSection";
import WhatsAppSection from "../components/WhatsAppSection";
import AdvancedSection from "../components/AdvancedSection";
import VoucherConfigSection from "@features/vouchers/components/VoucherConfigSection";

type SettingsSectionKey =
  | "empresa"
  | "ventas"
  | "inventario"
  | "apariencia"
  | "integraciones"
  | "movimientos"
  | "comprobantes";

export default function SettingsPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
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
  const [savingWhatsAppAccess, setSavingWhatsAppAccess] = useState(false);
  const [formData, setFormData] = useState<Partial<Setting>>({});
  const [activeSection, setActiveSection] = useState<SettingsSectionKey | null>(
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

  const handleSaveWhatsAppAccess = async () => {
    setSavingWhatsAppAccess(true);
    try {
      const payload = {
        whatsappNumberFormat: formData.whatsappNumberFormat || "AR",
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
  const whatsappConnectionStatus = whatsappStatus?.status || "stopped";
  const whatsappStatusLabel =
    whatsappStatusLabelMap[whatsappConnectionStatus] ||
    whatsappConnectionStatus;

  if (loading && !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sectionTitleMap: Record<SettingsSectionKey, string> = {
    empresa: "Empresa",
    ventas: "Ventas",
    inventario: "Inventario",
    apariencia: "Apariencia",
    integraciones: "Integraciones",
    movimientos: "Movimientos",
    comprobantes: "Comprobantes",
  };

  const renderSectionContent = () => {
    if (!activeSection) return null;

    switch (activeSection) {
      case "empresa":
        return (
          <GeneralSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "ventas":
        return (
          <SalesSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "inventario":
        return (
          <InventorySection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "apariencia":
        return (
          <AppearanceSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case "integraciones":
        return (
          <WhatsAppSection
            formData={formData}
            handleInputChange={handleInputChange}
            whatsappStatus={whatsappStatus}
            isStarting={isStarting}
            isStopping={isStopping}
            isRestarting={isRestarting}
            onStartWhatsApp={handleStartWhatsApp}
            onStopWhatsApp={handleStopWhatsApp}
            onRestartWhatsApp={handleRestartWhatsApp}
            onSaveWhatsAppAccess={handleSaveWhatsAppAccess}
            savingWhatsAppAccess={savingWhatsAppAccess}
          />
        );
      case "movimientos":
        return (
          <AdvancedSection
            navigate={navigate}
            onClose={() => setActiveSection(null)}
          />
        );
      case "comprobantes":
        return (
          <VoucherConfigSection
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      default:
        return null;
    }
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
          <SettingsSection
            title="Empresa"
            description="Datos institucionales, contacto y direccion del negocio."
            icon={<Landmark size={18} />}
            onClick={() => setActiveSection("empresa")}
            summary={
              <>
                {formData.storeName || "Sin nombre de empresa"}
                {formData.taxId ? ` · ${formData.taxId}` : ""}
              </>
            }
          />

          <SettingsSection
            title="Ventas"
            description="Moneda, estados por defecto y reglas comerciales."
            icon={<ShieldCheck size={18} />}
            onClick={() => setActiveSection("ventas")}
            summary={`${formData.currency || "USD"} · IVA ${formData.taxRate || 0}%`}
          />

          <SettingsSection
            title="Inventario"
            description="Umbral de stock bajo, unidad por defecto y descuento de stock."
            icon={<Boxes size={18} />}
            onClick={() => setActiveSection("inventario")}
            summary={`Umbral ${formData.lowStockThreshold || 5} · ${formData.defaultUnitOfMeasure || "unidad"}`}
          />

          <SettingsSection
            title="Apariencia"
            description="Tema visual y preferencias de visualizacion."
            icon={<Palette size={18} />}
            onClick={() => setActiveSection("apariencia")}
            summary={`Tema actual: ${formData.theme === "dark" ? "Oscuro" : "Claro"}`}
          />

          <SettingsSection
            title="Integraciones"
            description="WhatsApp y politica de entrega."
            icon={<Smartphone size={18} />}
            onClick={() => setActiveSection("integraciones")}
            summary={`Estado WhatsApp: ${whatsappStatusLabel}`}
          />

          <SettingsSection
            title="Movimientos"
            description="Revisa el historial de movimientos de inventario."
            icon={<ArrowUpRight size={18} />}
            onClick={() => setActiveSection("movimientos")}
            summary="Ir al modulo de movimientos"
          />

          <SettingsSection
            title="Comprobantes"
            description="Configuracion de facturas, remitos y recibos."
            icon={<Receipt size={18} />}
            onClick={() => setActiveSection("comprobantes")}
            summary={`Prefijos: ${formData.invoicePrefix || "F-"}, ${formData.deliveryNotePrefix || "R-"}, ${formData.receiptPrefix || "D-"}`}
          />

          <SettingsSection
            className="lg:col-span-2"
            title="Centro Financiero"
            description="Dashboard ejecutivo, contabilidad, analisis y proyecciones."
            icon={<ChartNoAxesCombined size={18} />}
            onClick={() => navigate("/financial/dashboard")}
            summary="Ir al modulo financiero"
          />
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
