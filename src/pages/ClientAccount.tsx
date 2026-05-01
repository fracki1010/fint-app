import { useMemo, useState } from "react";
import {
  Search,
  Loader2,
  X,
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { Select, SelectItem } from "@heroui/select";

import { useClients } from "@/hooks/useClients";
import {
  useClientAccount,
  CreateClientPaymentPayload,
  CreateClientEntryPayload,
} from "@/hooks/useClientAccount";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { Client, ClientEntryType, ClientAccountEntry } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCurrency, formatCompactCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";

// ── Constants ─────────────────────────────────────────────────────────

const ENTRY_TYPE_LABELS: Record<ClientEntryType, string> = {
  CHARGE: "Cargo",
  PAYMENT: "Cobro",
  CREDIT_NOTE: "Nota de Crédito",
  DEBIT_NOTE: "Nota de Débito",
};

const ENTRY_TYPE_COLORS: Record<ClientEntryType, string> = {
  CHARGE: "bg-danger/15 text-danger",
  PAYMENT: "bg-success/15 text-success",
  CREDIT_NOTE: "bg-primary/15 text-primary",
  DEBIT_NOTE: "bg-warning/15 text-warning",
};

const ENTRY_TYPES_FOR_FORM: Exclude<ClientEntryType, "PAYMENT">[] = [
  "CHARGE",
  "CREDIT_NOTE",
  "DEBIT_NOTE",
];

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function EntryTypeIcon({ type }: { type: ClientEntryType }) {
  switch (type) {
    case "PAYMENT":
      return <ArrowUpRight size={14} />;
    case "CHARGE":
      return <ArrowDownLeft size={14} />;
    case "CREDIT_NOTE":
      return <FileText size={14} />;
    case "DEBIT_NOTE":
      return <AlertCircle size={14} />;
  }
}

// ── Payment Form ──────────────────────────────────────────────────────

type PaymentFormState = {
  date: string;
  amount: string;
  paymentMethod: string;
  reference: string;
  notes: string;
};

const emptyPaymentForm: PaymentFormState = {
  date: todayISO(),
  amount: "",
  paymentMethod: "",
  reference: "",
  notes: "",
};

function PaymentForm({
  isDesktop,
  onClose,
  onSubmit,
  submitting,
  currency,
}: {
  isDesktop: boolean;
  onClose: () => void;
  onSubmit: (form: PaymentFormState) => void;
  submitting: boolean;
  currency: string;
}) {
  const [form, setForm] = useState<PaymentFormState>(emptyPaymentForm);

  const set = (field: keyof PaymentFormState, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-content2 px-3 py-2 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div
      className={`flex flex-col ${isDesktop ? "w-[420px]" : "h-full"} bg-content1`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <p className="text-base font-bold">Registrar Cobro</p>
        <button
          className="rounded-full p-1 text-default-400 hover:text-foreground transition"
          type="button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <form
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">FECHA</label>
          <input
            required
            className={inputCls}
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">
            MONTO ({currency})
          </label>
          <input
            required
            className={inputCls}
            min="0.01"
            placeholder="0.00"
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">
            MEDIO DE COBRO
          </label>
          <input
            className={inputCls}
            placeholder="Transferencia, efectivo..."
            type="text"
            value={form.paymentMethod}
            onChange={(e) => set("paymentMethod", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">
            REFERENCIA
          </label>
          <input
            className={inputCls}
            placeholder="N° comprobante..."
            type="text"
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">NOTAS</label>
          <textarea
            className={`${inputCls} resize-none`}
            placeholder="Observaciones..."
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
        <button
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-bold text-white transition hover:bg-success/90 disabled:opacity-50"
          disabled={submitting || !form.date || !form.amount}
          type="submit"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <ArrowUpRight size={16} />
          )}
          Confirmar Cobro
        </button>
      </form>
    </div>
  );
}

// ── Entry Form ────────────────────────────────────────────────────────

type EntryFormState = {
  date: string;
  type: Exclude<ClientEntryType, "PAYMENT">;
  amount: string;
  reference: string;
  notes: string;
};

const emptyEntryForm: EntryFormState = {
  date: todayISO(),
  type: "CHARGE",
  amount: "",
  reference: "",
  notes: "",
};

function EntryForm({
  isDesktop,
  onClose,
  onSubmit,
  submitting,
  currency,
}: {
  isDesktop: boolean;
  onClose: () => void;
  onSubmit: (form: EntryFormState) => void;
  submitting: boolean;
  currency: string;
}) {
  const [form, setForm] = useState<EntryFormState>(emptyEntryForm);

  const set = <K extends keyof EntryFormState>(
    field: K,
    value: EntryFormState[K],
  ) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-content2 px-3 py-2 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div
      className={`flex flex-col ${isDesktop ? "w-[420px]" : "h-full"} bg-content1`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <p className="text-base font-bold">Nueva Entrada</p>
        <button
          className="rounded-full p-1 text-default-400 hover:text-foreground transition"
          type="button"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <form
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-5"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">TIPO</label>
          <Select
            classNames={{ trigger: "bg-content2 border border-white/10 rounded-xl" }}
            selectedKeys={[form.type]}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as Exclude<ClientEntryType, "PAYMENT">;
              if (val) set("type", val);
            }}
          >
            {ENTRY_TYPES_FOR_FORM.map((t) => (
              <SelectItem key={t}>{ENTRY_TYPE_LABELS[t]}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">FECHA</label>
          <input
            required
            className={inputCls}
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">
            MONTO ({currency})
          </label>
          <input
            required
            className={inputCls}
            min="0.01"
            placeholder="0.00"
            step="0.01"
            type="number"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">
            REFERENCIA
          </label>
          <input
            className={inputCls}
            placeholder="N° comprobante..."
            type="text"
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-default-500">NOTAS</label>
          <textarea
            className={`${inputCls} resize-none`}
            placeholder="Observaciones..."
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
        <button
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
          disabled={submitting || !form.date || !form.amount}
          type="submit"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Plus size={16} />
          )}
          Guardar Entrada
        </button>
      </form>
    </div>
  );
}

// ── Account Entry Row ─────────────────────────────────────────────────

function EntryRow({
  entry,
  currency,
}: {
  entry: ClientAccountEntry;
  currency: string;
}) {
  const signed = entry.amount * entry.sign;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/6 bg-content2 px-4 py-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ENTRY_TYPE_COLORS[entry.type]}`}
      >
        <EntryTypeIcon type={entry.type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${ENTRY_TYPE_COLORS[entry.type]}`}
          >
            {ENTRY_TYPE_LABELS[entry.type]}
          </span>
          <span
            className={`text-sm font-bold ${signed > 0 ? "text-danger" : "text-success"}`}
          >
            {signed > 0 ? "+" : ""}
            {formatCompactCurrency(signed, currency)}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-default-400">
          <span>{formatDate(entry.date)}</span>
          {entry.order && (
            <span className="rounded-full bg-default-100 px-2 py-0.5 text-[10px] font-semibold text-default-500">
              Venta
            </span>
          )}
          {entry.paymentMethod && (
            <>
              <span>·</span>
              <span>{entry.paymentMethod}</span>
            </>
          )}
          {entry.reference && (
            <>
              <span>·</span>
              <span className="truncate">{entry.reference}</span>
            </>
          )}
        </div>
        {entry.notes && (
          <p className="mt-1 text-[11px] text-default-400 truncate">
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Account Drawer ────────────────────────────────────────────────────

function AccountDrawer({
  client,
  isOpen,
  isDesktop,
  onClose,
  currency,
}: {
  client: Client | null;
  isOpen: boolean;
  isDesktop: boolean;
  onClose: () => void;
  currency: string;
}) {
  const { showToast } = useAppToast();
  const [view, setView] = useState<"account" | "payment" | "entry">("account");

  const {
    entries,
    balance,
    loading,
    createPayment,
    createEntry,
    isCreatingPayment,
    isCreatingEntry,
  } = useClientAccount(client?._id);

  const handlePayment = async (form: PaymentFormState) => {
    try {
      const payload: CreateClientPaymentPayload = {
        date: form.date,
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod || undefined,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      };
      await createPayment(payload);
      showToast({ variant: "success", message: "Cobro registrado" });
      setView("account");
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error inesperado") });
    }
  };

  const handleEntry = async (form: EntryFormState) => {
    try {
      const payload: CreateClientEntryPayload = {
        date: form.date,
        type: form.type,
        amount: parseFloat(form.amount),
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      };
      await createEntry(payload);
      showToast({ variant: "success", message: "Entrada registrada" });
      setView("account");
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error inesperado") });
    }
  };

  const handleClose = () => {
    setView("account");
    onClose();
  };

  const content = (() => {
    if (view === "payment") {
      return (
        <PaymentForm
          currency={currency}
          isDesktop={isDesktop}
          submitting={isCreatingPayment}
          onClose={() => setView("account")}
          onSubmit={handlePayment}
        />
      );
    }
    if (view === "entry") {
      return (
        <EntryForm
          currency={currency}
          isDesktop={isDesktop}
          submitting={isCreatingEntry}
          onClose={() => setView("account")}
          onSubmit={handleEntry}
        />
      );
    }

    return (
      <div
        className={`flex flex-col ${isDesktop ? "w-[480px]" : "h-full"} bg-content1`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-base font-bold">
              {client?.name || "Cliente"}
            </p>
            <p className="text-xs text-default-400">Cuenta Corriente</p>
          </div>
          <button
            className="rounded-full p-1 text-default-400 hover:text-foreground transition"
            type="button"
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Balance card */}
        <div className="px-5 pt-4">
          <div
            className={`rounded-2xl p-4 ${balance > 0 ? "bg-danger/10 border border-danger/20" : "bg-success/10 border border-success/20"}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-default-400">
              Saldo actual
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${balance > 0 ? "text-danger" : "text-success"}`}
            >
              {formatCurrency(Math.abs(balance), currency)}
            </p>
            <p className="mt-0.5 text-xs text-default-400">
              {balance > 0
                ? "El cliente nos debe"
                : balance < 0
                  ? "Tenemos saldo a favor del cliente"
                  : "Sin saldo pendiente"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-5 pt-4">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-success/10 border border-success/20 py-2.5 text-xs font-bold text-success transition hover:bg-success/20"
            type="button"
            onClick={() => setView("payment")}
          >
            <ArrowUpRight size={14} />
            Registrar Cobro
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-content2 border border-white/10 py-2.5 text-xs font-bold text-default-500 transition hover:text-foreground"
            type="button"
            onClick={() => setView("entry")}
          >
            <Plus size={14} />
            Nueva Entrada
          </button>
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-default-400">
            Movimientos ({entries.length})
          </p>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-default-400" size={24} />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-default-400">
              <CreditCard size={28} />
              <p className="text-sm">Sin movimientos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...entries]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || b.date).getTime() -
                    new Date(a.createdAt || a.date).getTime(),
                )
                .map((entry) => (
                  <EntryRow key={entry._id} currency={currency} entry={entry} />
                ))}
            </div>
          )}
        </div>
      </div>
    );
  })();

  if (isDesktop) {
    return (
      <Drawer
        hideCloseButton
        isOpen={isOpen}
        placement="right"
        size="lg"
        onClose={handleClose}
      >
        <DrawerContent>{() => <DrawerBody className="p-0">{content}</DrawerBody>}</DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer
      hideCloseButton
      isOpen={isOpen}
      placement="bottom"
      size="full"
      onClose={handleClose}
    >
      <DrawerContent>{() => <DrawerBody className="p-0">{content}</DrawerBody>}</DrawerContent>
    </Drawer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function ClientAccountPage() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";
  const { clients, loading } = useClients();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const openAccount = (client: Client) => {
    setSelectedClient(client);
    setDrawerOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={`sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-xl transition-all ${isHeaderCompact ? "px-4 py-3" : "px-4 py-5 lg:px-6"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={isHeaderCompact ? "hidden" : ""}>
            <p className="text-lg font-bold lg:text-xl">Cuenta Corriente</p>
            <p className="text-xs text-default-400">Clientes</p>
          </div>
          <div
            className={`flex items-center gap-2 rounded-xl border border-white/10 bg-content2 px-3 py-2 ${isHeaderCompact ? "flex-1" : "w-full lg:max-w-sm"}`}
          >
            <Search className="shrink-0 text-default-400" size={15} />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="text-default-400 hover:text-foreground"
                type="button"
                onClick={() => setSearch("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-default-400" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-default-400">
            <CreditCard size={36} />
            <div>
              <p className="font-semibold">Sin clientes</p>
              <p className="text-xs">
                {search ? "No hay coincidencias" : "Todavía no hay clientes cargados"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((client) => (
              <button
                key={client._id}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/6 bg-content2 px-4 py-3.5 text-left transition hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
                type="button"
                onClick={() => openAccount(client)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {getInitials(client.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{client.name}</p>
                  {client.email && (
                    <p className="truncate text-xs text-default-400">
                      {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="text-[11px] text-default-400">{client.phone}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-default-400">Ver cuenta</span>
                  <CreditCard size={16} className="text-default-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account Drawer */}
      <AccountDrawer
        client={selectedClient}
        currency={currency}
        isDesktop={isDesktop}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
