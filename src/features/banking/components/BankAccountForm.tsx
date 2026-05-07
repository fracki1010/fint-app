import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import type { BankAccount, CreateBankAccountRequest, UpdateBankAccountRequest } from '../types/banking';

interface BankAccountFormProps {
  account?: BankAccount | null;
  onSubmit: (data: CreateBankAccountRequest | UpdateBankAccountRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Cuenta Corriente' },
  { value: 'savings', label: 'Caja de Ahorro' },
];

const CURRENCIES = [
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'USD', label: 'USD - Dólar' },
  { value: 'EUR', label: 'EUR - Euro' },
];

export function BankAccountForm({ account, onSubmit, onCancel, isSubmitting }: BankAccountFormProps) {
  const isEditing = !!account;
  const [name, setName] = useState(account?.name || '');
  const [bank, setBank] = useState(account?.bank || '');
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber || '');
  const [type, setType] = useState<'checking' | 'savings'>(account?.type || 'checking');
  const [currency, setCurrency] = useState<'ARS' | 'USD' | 'EUR'>(account?.currency || 'ARS');
  const [currentBalance, setCurrentBalance] = useState(String(account?.currentBalance ?? '0'));

  const handleSubmit = async () => {
    const data = {
      name: name.trim(),
      bank: bank.trim(),
      accountNumber: accountNumber.trim(),
      type,
      currency,
      currentBalance: Number(currentBalance),
    };

    await onSubmit(data);
  };

  const isFormValid = name.trim() && bank.trim() && accountNumber.trim();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre de la Cuenta"
          placeholder="Ej: Cuenta Corriente Principal"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          isRequired
          isDisabled={isSubmitting}
        />
        <Input
          label="Banco"
          placeholder="Ej: BBVA"
          value={bank}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBank(e.target.value)}
          isRequired
          isDisabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Número de Cuenta"
          placeholder="Ej: 001-123456-7"
          value={accountNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountNumber(e.target.value)}
          isRequired
          isDisabled={isSubmitting}
        />
        <Select
          label="Tipo de Cuenta"
          selectedKeys={[type]}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as 'checking' | 'savings';
            if (val) setType(val);
          }}
          isDisabled={isSubmitting}
        >
          {ACCOUNT_TYPES.map((t) => (
            <SelectItem key={t.value}>{t.label}</SelectItem>
          ))}
        </Select>
        <Select
          label="Moneda"
          selectedKeys={[currency]}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as 'ARS' | 'USD' | 'EUR';
            if (val) setCurrency(val);
          }}
          isDisabled={isSubmitting}
        >
          {CURRENCIES.map((c) => (
            <SelectItem key={c.value}>{c.label}</SelectItem>
          ))}
        </Select>
      </div>

      {!isEditing && (
        <Input
          label="Saldo Inicial"
          placeholder="0.00"
          type="number"
          min="0"
          value={currentBalance}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentBalance(e.target.value)}
          isDisabled={isSubmitting}
        />
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="flat" onPress={onCancel} isDisabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          color="primary"
          onPress={handleSubmit}
          isDisabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>{isEditing ? 'Actualizar Cuenta' : 'Crear Cuenta'}</>
          )}
        </Button>
      </div>
    </div>
  );
}
