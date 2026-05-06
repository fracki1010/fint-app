import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Save,
  Loader2,
  Play,
  Square,
  RotateCcw,
  QrCode,
  Wifi,
  X,
} from "lucide-react";
import type { Setting } from "@features/settings/hooks/useSettings";
import type { WhatsAppStatus } from "@features/sales/hooks/useWhatsApp";

interface WhatsAppSectionProps {
  formData: Partial<Setting>;
  handleInputChange: (field: keyof Setting, value: unknown) => void;
  whatsappStatus: WhatsAppStatus | undefined;
  isStarting: boolean;
  isStopping: boolean;
  isRestarting: boolean;
  onStartWhatsApp: () => Promise<void>;
  onStopWhatsApp: () => Promise<void>;
  onRestartWhatsApp: () => Promise<void>;
  onSaveWhatsAppAccess: () => Promise<void>;
  savingWhatsAppAccess: boolean;
}

function normalizePhoneDigits(value: string) {
  return value
    .toString()
    .trim()
    .replace(/[^\d]/g, "");
}

const STATUS_LABEL_MAP: Record<string, string> = {
  stopped: "Detenido",
  starting: "Iniciando",
  stopping: "Deteniendo",
  ready: "Conectado",
  qr_ready: "Esperando escaneo",
  auth_failure: "Error de autenticacion",
  disconnected: "Desconectado",
  error: "Error",
};

const STATUS_CLASS_MAP: Record<string, string> = {
  ready: "bg-success/15 text-success",
  qr_ready: "bg-warning/15 text-warning",
  starting: "bg-primary/15 text-primary",
  stopping: "bg-default-200 text-default-700",
  stopped: "bg-default-200 text-default-700",
  disconnected: "bg-danger/15 text-danger",
  auth_failure: "bg-danger/15 text-danger",
  error: "bg-danger/15 text-danger",
};

export default function WhatsAppSection({
  formData,
  handleInputChange,
  whatsappStatus,
  isStarting,
  isStopping,
  isRestarting,
  onStartWhatsApp,
  onStopWhatsApp,
  onRestartWhatsApp,
  onSaveWhatsAppAccess,
  savingWhatsAppAccess,
}: WhatsAppSectionProps) {
  const [newAuthorizedNumber, setNewAuthorizedNumber] = useState("");

  const whatsappNumberFormat = formData.whatsappNumberFormat || "AR";
  const isBusy = isStarting || isStopping || isRestarting;
  const whatsappConnectionStatus = whatsappStatus?.status || "stopped";
  const statusLabel = STATUS_LABEL_MAP[whatsappConnectionStatus] || whatsappConnectionStatus;
  const statusClass = STATUS_CLASS_MAP[whatsappConnectionStatus] || "bg-default-200 text-default-700";

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

  const handleAddAuthorizedNumber = () => {
    const nextNumber = normalizePhoneDigits(newAuthorizedNumber);
    if (!nextNumber) return;

    const current = Array.isArray(formData.whatsappAuthorizedNumbers)
      ? formData.whatsappAuthorizedNumbers
          .map((value) => normalizePhoneDigits(value.toString()))
          .filter(Boolean)
      : [];

    if (current.includes(nextNumber)) return;

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
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusClass}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {statusLabel}
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
                onClick={onSaveWhatsAppAccess}
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
              onClick={onStartWhatsApp}
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
              onClick={onStopWhatsApp}
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
              onClick={onRestartWhatsApp}
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
