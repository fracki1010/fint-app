import { useMemo, useState } from "react";
import { ArrowLeft, BadgeDollarSign, Plus, Wallet } from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useNavigate, useParams } from "react-router-dom";

import { useAppToast } from "@/components/AppToast";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useClientDetail } from "@/hooks/useClients";
import { usePermissions } from "@/hooks/usePermissions";
import { useSupplierAccount, useSupplierStatement } from "@/hooks/useSupplierAccount";
import type { SupplierAccountEntryType } from "@/types";
import { formatCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";

export default function SupplierAccountPage() {
  const navigate = useNavigate();
  const { supplierId } = useParams<{ supplierId?: string }>();
  const { showToast } = useAppToast();
  const { canManageSupplierAccount } = usePermissions();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<
    | { type: "payment"; amount: number }
    | { type: "entry"; amount: number; entryType: SupplierAccountEntryType }
    | null
  >(null);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("TRANSFERENCIA");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [entryType, setEntryType] = useState<SupplierAccountEntryType>("DEBIT_NOTE");
  const [entryAmount, setEntryAmount] = useState("0");
  const [entryReference, setEntryReference] = useState("");
  const [entryNotes, setEntryNotes] = useState("");

  const { client: supplier } = useClientDetail(supplierId);
  const { entries, balance, loading, createSupplierPayment, createSupplierAccountEntry, isCreatingPayment, isCreatingEntry } =
    useSupplierAccount(supplierId);

  const statementParams = useMemo(
    () => ({ from: from || undefined, to: to || undefined }),
    [from, to],
  );

  const { entries: statementEntries, balance: statementBalance, loading: loadingStatement } =
    useSupplierStatement(supplierId, statementParams, { enabled: Boolean(from || to) });

  const displayedEntries = from || to ? statementEntries : entries;
  const displayedBalance = from || to ? statementBalance : balance;

  const handleCreatePayment = async () => {
    if (!canManageSupplierAccount) {
      showToast({ title: "Sin permisos", message: "No tienes permisos para registrar pagos.", variant: "warning" });
      return;
    }
    if (!supplierId) return;

    const amount = Number(paymentAmount);

    if (amount <= 0) {
      showToast({ title: "Monto invalido", message: "El pago debe ser mayor a 0.", variant: "warning" });

      return;
    }

    setPendingConfirmation({ type: "payment", amount });
  };

  const confirmCreatePayment = async () => {
    if (!supplierId) return;
    const amount = Number(paymentAmount);

    try {
      await createSupplierPayment({
        id: supplierId,
        payload: {
          date: paymentDate,
          amount,
          paymentMethod,
          reference: paymentReference.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        },
      });

      showToast({ title: "Pago registrado", message: "La cuenta corriente fue actualizada.", variant: "success" });
      setShowPaymentForm(false);
      setPendingConfirmation(null);
    } catch (error) {
      showToast({
        title: "No se pudo registrar",
        message: getErrorMessage(error, "Error al registrar el pago."),
        variant: "error",
      });
    }
  };

  const handleCreateEntry = async () => {
    if (!canManageSupplierAccount) {
      showToast({ title: "Sin permisos", message: "No tienes permisos para registrar asientos.", variant: "warning" });
      return;
    }
    if (!supplierId) return;

    const amount = Number(entryAmount);

    if (amount <= 0) {
      showToast({ title: "Monto invalido", message: "El importe debe ser mayor a 0.", variant: "warning" });

      return;
    }

    setPendingConfirmation({ type: "entry", amount, entryType });
  };

  const confirmCreateEntry = async () => {
    if (!supplierId) return;
    const amount = Number(entryAmount);

    try {
      await createSupplierAccountEntry({
        id: supplierId,
        payload: {
          date: entryDate,
          type: entryType,
          amount,
          reference: entryReference.trim() || undefined,
          notes: entryNotes.trim() || undefined,
        },
      });

      showToast({ title: "Asiento registrado", message: "Movimiento agregado a cuenta corriente.", variant: "success" });
      setShowEntryForm(false);
      setPendingConfirmation(null);
    } catch (error) {
      showToast({
        title: "No se pudo registrar",
        message: getErrorMessage(error, "Error al registrar asiento."),
        variant: "error",
      });
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-24 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
        <button className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-default-500" onClick={() => navigate("/clients")}> 
          <ArrowLeft size={14} /> Volver
        </button>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Proveedores</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">Cuenta corriente</h1>
            <p className="mt-2 text-sm text-default-500">{supplier?.name || "Proveedor"}</p>
          </div>
          <div className="flex gap-2">
            <Button isDisabled={!canManageSupplierAccount} size="sm" startContent={<Wallet size={14} />} variant="flat" onClick={() => setShowPaymentForm(true)}>
              Pago
            </Button>
            <Button isDisabled={!canManageSupplierAccount} size="sm" startContent={<Plus size={14} />} variant="flat" onClick={() => setShowEntryForm(true)}>
              Asiento
            </Button>
          </div>
        </div>
      </header>

      <section className="space-y-3 px-4 pb-8 lg:px-0">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Saldo actual</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{formatCurrency(displayedBalance)}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="grid grid-cols-2 gap-2">
            <Input label="Desde" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <Input label="Hasta" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </CardBody>
        </Card>

        {loading || loadingStatement ? (
          <Card><CardBody>Cargando movimientos...</CardBody></Card>
        ) : displayedEntries.length === 0 ? (
          <Card><CardBody>Sin movimientos para el filtro seleccionado.</CardBody></Card>
        ) : (
          displayedEntries.map((entry) => (
            <Card key={entry._id}>
              <CardBody className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{entry.type}</p>
                    <p className="text-xs text-default-500">{entry.date} {entry.reference ? `· ${entry.reference}` : ""}</p>
                    {(entry.createdAt || entry.createdBy) && (
                      <p className="text-[11px] text-default-500">
                        {entry.createdAt
                          ? `Creado: ${new Date(entry.createdAt).toLocaleString()}`
                          : "Creado"}
                        {entry.createdBy ? ` · Usuario: ${entry.createdBy}` : ""}
                      </p>
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${entry.sign > 0 ? "text-danger" : "text-success"}`}>
                    {entry.sign > 0 ? "+" : "-"}{formatCurrency(entry.amount)}
                  </p>
                </div>
                {entry.notes && <p className="text-xs text-default-500">{entry.notes}</p>}
              </CardBody>
            </Card>
          ))
        )}
      </section>

      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2 lg:items-center lg:justify-center">
          <Card className="w-full max-w-xl">
            <CardBody className="space-y-3">
              <h2 className="text-lg font-semibold">Registrar pago</h2>
              <Input label="Fecha" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
              <Input label="Monto" type="number" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
              <Input label="Metodo" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
              <Input label="Referencia" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
              <Input label="Notas" value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="light" onClick={() => setShowPaymentForm(false)}>Cancelar</Button>
                <Button isLoading={isCreatingPayment} startContent={<BadgeDollarSign size={14} />} onClick={handleCreatePayment}>Guardar pago</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {showEntryForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2 lg:items-center lg:justify-center">
          <Card className="w-full max-w-xl">
            <CardBody className="space-y-3">
              <h2 className="text-lg font-semibold">Registrar asiento</h2>
              <Input label="Fecha" type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} />
              <Select
                label="Tipo"
                selectedKeys={[entryType]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as SupplierAccountEntryType;

                  if (value) setEntryType(value);
                }}
              >
                <SelectItem key="DEBIT_NOTE">Nota de debito</SelectItem>
                <SelectItem key="CREDIT_NOTE">Nota de credito</SelectItem>
                <SelectItem key="CHARGE">Cargo</SelectItem>
              </Select>
              <Input label="Monto" type="number" value={entryAmount} onChange={(event) => setEntryAmount(event.target.value)} />
              <Input label="Referencia" value={entryReference} onChange={(event) => setEntryReference(event.target.value)} />
              <Input label="Notas" value={entryNotes} onChange={(event) => setEntryNotes(event.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="light" onClick={() => setShowEntryForm(false)}>Cancelar</Button>
                <Button isLoading={isCreatingEntry} onClick={handleCreateEntry}>Guardar asiento</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <ConfirmActionDialog
        confirmColor={pendingConfirmation?.type === "entry" ? "warning" : "primary"}
        confirmLabel={pendingConfirmation?.type === "entry" ? "Registrar asiento" : "Registrar pago"}
        isLoading={isCreatingPayment || isCreatingEntry}
        isOpen={Boolean(pendingConfirmation)}
        message={
          pendingConfirmation?.type === "entry"
            ? `Se registrará ${pendingConfirmation.entryType} por ${formatCurrency(
                pendingConfirmation.amount,
              )}.`
            : pendingConfirmation?.type === "payment"
              ? `Se registrará pago por ${formatCurrency(pendingConfirmation.amount)}.`
              : ""
        }
        title="Confirmar operación"
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={() => {
          if (pendingConfirmation?.type === "entry") {
            void confirmCreateEntry();
            return;
          }
          void confirmCreatePayment();
        }}
      />
    </div>
  );
}
