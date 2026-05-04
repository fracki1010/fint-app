import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Check,
  Copy,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import { useAppToast } from "@/components/AppToast";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

const plans = [
  {
    id: "essential",
    name: "Essential",
    price: 2,
    description: "Para kioscos y negocios pequeños",
    features: ["3 usuarios", "200 productos", "500 ventas/mes", "Soporte email"],
  },
  {
    id: "business",
    name: "Business",
    price: 3,
    description: "Para PyMEs en crecimiento",
    features: ["10 usuarios", "Productos ilimitados", "Ventas ilimitadas", "Centro financiero"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 8,
    description: "Para empresas grandes",
    features: ["Usuarios ilimitados", "Todo ilimitado", "Soporte 24/7", "API access"],
  },
];

export default function TenantCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();

  const [formData, setFormData] = useState({
    businessName: "",
    adminEmail: "",
    adminName: "",
    adminPhone: "",
    plan: "business",
    passwordType: "auto",
    customPassword: "",
    sendWelcomeEmail: false,
    notes: "",
  });

  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    tempPassword?: string;
  } | null>(null);

  const createTenantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post("/superadmin/tenants", {
        businessName: data.businessName,
        adminEmail: data.adminEmail,
        adminName: data.adminName,
        adminPhone: data.adminPhone,
        plan: data.plan,
        passwordType: data.passwordType,
        customPassword: data.passwordType === "custom" ? data.customPassword : undefined,
        sendWelcomeEmail: data.sendWelcomeEmail,
        notes: data.notes,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "analytics"] });
      setCreatedCredentials(data.credentials);
      setShowCredentials(true);
      showToast({ variant: "success", message: "Tenant creado exitosamente" });
    },
    onError: (error: any) => {
      showToast({
        variant: "error",
        message: error.response?.data?.message || "Error al crear tenant",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenantMutation.mutate(formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({ variant: "success", message: "Copiado al portapapeles" });
  };

  if (showCredentials && createdCredentials) {
    return (
      <SuperAdminLayout>
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <Check size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">¡Tenant Creado!</h2>
            <p className="mt-2 text-sm text-gray-400">
              El tenant ha sido creado exitosamente. Guarda estas credenciales:
            </p>

            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-content1 p-4 text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Email</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm font-mono text-white">{createdCredentials.email}</p>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.email)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              {createdCredentials.tempPassword && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Contraseña Temporal</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-mono text-white">{createdCredentials.tempPassword}</p>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.tempPassword!)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowCredentials(false);
                  setCreatedCredentials(null);
                  setFormData({
                    businessName: "",
                    adminEmail: "",
                    adminName: "",
                    adminPhone: "",
                    plan: "business",
                    passwordType: "auto",
                    customPassword: "",
                    sendWelcomeEmail: false,
                    notes: "",
                  });
                }}
                className="flex-1 rounded-xl bg-blue-500 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
              >
                Crear Otro
              </button>
              <button
                onClick={() => navigate("/superadmin/tenants")}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Ver Lista
              </button>
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/superadmin/tenants")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-content1 text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Nuevo Tenant</h1>
            <p className="text-sm text-gray-400">Crea una nueva cuenta de cliente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Info */}
          <div className="rounded-2xl border border-white/10 bg-content1 p-6">
            <h2 className="text-lg font-bold text-white">Información del Negocio</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Nombre del Negocio *
                </label>
                <input
                  required
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Kiosco El Barato"
                />
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="rounded-2xl border border-white/10 bg-content1 p-6">
            <h2 className="text-lg font-bold text-white">Administrador</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Nombre Completo *
                </label>
                <input
                  required
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="admin@negocio.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="+5491123456789"
                />
              </div>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="rounded-2xl border border-white/10 bg-content1 p-6">
            <h2 className="text-lg font-bold text-white">Plan</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, plan: plan.id })}
                  className={`rounded-xl border p-4 text-left transition ${
                    formData.plan === plan.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{plan.name}</span>
                    <span className="text-lg font-bold text-blue-400">${plan.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{plan.description}</p>
                  <ul className="mt-3 space-y-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Check size={12} className="text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="rounded-2xl border border-white/10 bg-content1 p-6">
            <h2 className="text-lg font-bold text-white">Contraseña</h2>
            <div className="mt-4 space-y-3">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, passwordType: "auto" })}
                  className={`flex-1 rounded-xl border p-3 text-center transition ${
                    formData.passwordType === "auto"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">Auto-generar</p>
                  <p className="text-xs text-gray-400">Sistema crea contraseña segura</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, passwordType: "custom" })}
                  className={`flex-1 rounded-xl border p-3 text-center transition ${
                    formData.passwordType === "custom"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <p className="text-sm font-semibold text-white">Personalizada</p>
                  <p className="text-xs text-gray-400">Vos definís la contraseña</p>
                </button>
              </div>

              {formData.passwordType === "custom" && (
                <div>
                  <input
                    type="text"
                    value={formData.customPassword}
                    onChange={(e) => setFormData({ ...formData, customPassword: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                    placeholder="Ingresa la contraseña"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="rounded-2xl border border-white/10 bg-content1 p-6">
            <h2 className="text-lg font-bold text-white">Opciones</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.sendWelcomeEmail}
                  onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                  className="h-5 w-5 rounded border-white/20 bg-background text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Enviar email de bienvenida</p>
                  <p className="text-xs text-gray-400">El cliente recibirá un email con sus credenciales</p>
                </div>
              </label>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Notas Internas
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-background px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Notas para referencia interna..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/superadmin/tenants")}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTenantMutation.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              {createTenantMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Building2 size={18} />
                  Crear Tenant
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
