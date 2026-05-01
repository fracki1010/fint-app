import { useMemo, useState } from "react";
import {
  Loader2,
  Mail,
  Plus,
  Shield,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useTeam, CreateTeamMemberPayload, UpdateTeamMemberPayload } from "@/hooks/useTeam";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { TeamMember, UserRole } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { getErrorMessage } from "@/utils/errors";

// ── Constants ─────────────────────────────────────────────────────────

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrador", description: "Acceso completo a todo el sistema" },
  { value: "ventas", label: "Ventas", description: "Clientes, pedidos y productos" },
  { value: "deposito", label: "Depósito", description: "Insumos, compras y recetas" },
  { value: "contabilidad", label: "Contabilidad", description: "Centro financiero y reportes" },
  { value: "lectura", label: "Solo lectura", description: "Puede ver todo, no modificar" },
];

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-primary/15 text-primary",
  ventas: "bg-success/15 text-success",
  deposito: "bg-warning/15 text-warning",
  contabilidad: "bg-secondary/15 text-secondary",
  lectura: "bg-default/15 text-default-500",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ── Form ──────────────────────────────────────────────────────────────

type FormMode = "create" | "edit";

interface MemberFormProps {
  mode: FormMode;
  initial?: Partial<CreateTeamMemberPayload>;
  saving: boolean;
  onSave: (data: CreateTeamMemberPayload | UpdateTeamMemberPayload) => Promise<void>;
  onCancel: () => void;
}

function MemberForm({ mode, initial, saving, onSave, onCancel }: MemberFormProps) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "lectura");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      await onSave({ fullName, email, password, role });
    } else {
      const update: UpdateTeamMemberPayload = { fullName, role };
      if (password) update.password = password;
      await onSave(update);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-default-100 px-3 py-2 text-sm text-foreground placeholder:text-default-300 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <label className="text-xs font-semibold text-default-400">
          Nombre completo <span className="text-danger">*</span>
        </label>
        <input
          required
          className={`mt-1 ${inputCls}`}
          placeholder="Juan García"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      {mode === "create" && (
        <div>
          <label className="text-xs font-semibold text-default-400">
            Email <span className="text-danger">*</span>
          </label>
          <input
            required
            className={`mt-1 ${inputCls}`}
            placeholder="juan@empresa.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-default-400">
          {mode === "create" ? "Contraseña" : "Nueva contraseña"}{" "}
          {mode === "create" && <span className="text-danger">*</span>}
          {mode === "edit" && <span className="text-default-300">(dejar vacío para no cambiar)</span>}
        </label>
        <input
          required={mode === "create"}
          className={`mt-1 ${inputCls}`}
          minLength={mode === "create" ? 6 : undefined}
          placeholder={mode === "create" ? "Mínimo 6 caracteres" : "••••••"}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-default-400">Rol</label>
        <div className="mt-2 space-y-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                role === r.value
                  ? "border-primary/40 bg-primary/10"
                  : "border-white/10 hover:border-white/20"
              }`}
              type="button"
              onClick={() => setRole(r.value)}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${role === r.value ? "text-primary" : "text-foreground"}`}>
                  {r.label}
                </span>
                {role === r.value && <Shield size={14} className="text-primary" />}
              </div>
              <p className="mt-0.5 text-xs text-default-400">{r.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-default-400 transition hover:text-foreground"
          type="button"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          disabled={saving}
          type="submit"
        >
          {saving ? "Guardando..." : mode === "create" ? "Crear miembro" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ── Member card ───────────────────────────────────────────────────────

function MemberCard({
  member,
  isSelf,
  canManage,
  onClick,
}: {
  member: TeamMember;
  isSelf: boolean;
  canManage: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`w-full rounded-2xl border border-white/10 bg-content1 p-4 text-left transition ${canManage ? "hover:border-primary/30 hover:bg-content2" : "cursor-default"} ${!member.isActive ? "opacity-50" : ""}`}
      type="button"
      onClick={canManage ? onClick : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-primary">
          {initials(member.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-foreground">{member.fullName}</p>
            {isSelf && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                Vos
              </span>
            )}
            {!member.isActive && (
              <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                Inactivo
              </span>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-default-400">
            <Mail size={10} />
            {member.email}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${ROLE_COLORS[member.role]}`}>
          {member.roleLabel}
        </span>
      </div>
    </button>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────

type DrawerMode = "edit" | "confirmDeactivate";

interface MemberDrawerProps {
  member: TeamMember | null;
  drawerMode: DrawerMode;
  onClose: () => void;
  onSetMode: (m: DrawerMode) => void;
  onSaveEdit: (data: UpdateTeamMemberPayload) => Promise<void>;
  onDeactivate: () => Promise<void>;
  saving: boolean;
  deactivating: boolean;
}

function MemberDrawer({
  member,
  drawerMode,
  onClose,
  onSetMode,
  onSaveEdit,
  onDeactivate,
  saving,
  deactivating,
}: MemberDrawerProps) {
  if (!member) return null;

  return (
    <Drawer isOpen placement="bottom" onClose={onClose}>
      <DrawerContent className="max-h-[92dvh] rounded-t-3xl bg-content1">
        <DrawerBody className="overflow-y-auto px-4 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              {drawerMode === "confirmDeactivate" ? "¿Desactivar usuario?" : "Editar miembro"}
            </h2>
            <button className="rounded-xl p-1.5 text-default-400 hover:bg-content2" type="button" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {drawerMode === "edit" && (
            <>
              <MemberForm
                initial={{ fullName: member.fullName, role: member.role }}
                mode="edit"
                saving={saving}
                onCancel={onClose}
                onSave={onSaveEdit}
              />
              {member.isActive && (
                <button
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10"
                  type="button"
                  onClick={() => onSetMode("confirmDeactivate")}
                >
                  <UserX size={14} />
                  Desactivar usuario
                </button>
              )}
              {!member.isActive && (
                <button
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-success/30 py-2.5 text-sm font-semibold text-success transition hover:bg-success/10"
                  type="button"
                  onClick={() => onSaveEdit({ isActive: true })}
                >
                  <UserCheck size={14} />
                  Reactivar usuario
                </button>
              )}
            </>
          )}

          {drawerMode === "confirmDeactivate" && (
            <div className="space-y-4 py-2">
              <p className="text-center text-sm text-default-400">
                <span className="font-semibold text-foreground">{member.fullName}</span> perderá el acceso al sistema.
                Podés reactivarlo en cualquier momento.
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-default-400 hover:text-foreground"
                  type="button"
                  onClick={() => onSetMode("edit")}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={deactivating}
                  type="button"
                  onClick={onDeactivate}
                >
                  {deactivating ? "Desactivando..." : "Desactivar"}
                </button>
              </div>
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { members, loading, createMember, isCreating, updateMember, isUpdating, deactivateMember, isDeactivating } =
    useTeam();
  const { showToast } = useAppToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("edit");

  const active = useMemo(() => members.filter((m) => m.isActive), [members]);
  const inactive = useMemo(() => members.filter((m) => !m.isActive), [members]);

  const openEdit = (m: TeamMember) => {
    setSelected(m);
    setDrawerMode("edit");
  };

  const closeDrawer = () => setSelected(null);

  const handleCreate = async (data: CreateTeamMemberPayload | UpdateTeamMemberPayload) => {
    try {
      await createMember(data as CreateTeamMemberPayload);
      showToast({ variant: "success", message: "Miembro creado" });
      setCreateOpen(false);
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al crear miembro") });
    }
  };

  const handleEdit = async (data: UpdateTeamMemberPayload) => {
    if (!selected) return;
    try {
      await updateMember({ id: selected._id, data });
      showToast({ variant: "success", message: "Miembro actualizado" });
      closeDrawer();
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al actualizar") });
    }
  };

  const handleDeactivate = async () => {
    if (!selected) return;
    try {
      await deactivateMember(selected._id);
      showToast({ variant: "success", message: "Usuario desactivado" });
      closeDrawer();
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al desactivar") });
    }
  };

  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-2xl space-y-4 px-4 py-4 lg:max-w-3xl lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Equipo</h1>
          <p className="text-xs text-default-400">{active.length} miembro{active.length !== 1 ? "s" : ""} activo{active.length !== 1 ? "s" : ""}</p>
        </div>
        {can.manageTeam && (
          <button
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={16} />
            Invitar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {active.map((m) => (
              <MemberCard
                key={m._id}
                canManage={can.manageTeam && m._id !== user?._id}
                isSelf={m._id === user?._id}
                member={m}
                onClick={() => openEdit(m)}
              />
            ))}
          </div>

          {inactive.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-default-400">
                Inactivos
              </p>
              <div className="space-y-2">
                {inactive.map((m) => (
                  <MemberCard
                    key={m._id}
                    canManage={can.manageTeam}
                    isSelf={false}
                    member={m}
                    onClick={() => openEdit(m)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create drawer */}
      <Drawer isOpen={createOpen} placement="bottom" onClose={() => setCreateOpen(false)}>
        <DrawerContent className="max-h-[92dvh] rounded-t-3xl bg-content1">
          <DrawerBody className="overflow-y-auto px-4 py-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Invitar miembro</h2>
              <button className="rounded-xl p-1.5 text-default-400 hover:bg-content2" type="button" onClick={() => setCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <MemberForm
              mode="create"
              saving={isCreating}
              onCancel={() => setCreateOpen(false)}
              onSave={handleCreate}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Edit drawer */}
      <MemberDrawer
        deactivating={isDeactivating}
        drawerMode={drawerMode}
        member={selected}
        saving={isUpdating}
        onClose={closeDrawer}
        onDeactivate={handleDeactivate}
        onSaveEdit={handleEdit}
        onSetMode={setDrawerMode}
      />
    </div></div>
  );
}
