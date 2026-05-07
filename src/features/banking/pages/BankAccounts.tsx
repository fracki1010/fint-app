import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Loader2,
  AlertCircle,
  Building2,
  CreditCard,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Landmark,
  ArrowRight,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/modal';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { useBankAccounts, useCreateBankAccount, useUpdateBankAccount, useToggleBankAccount } from '../hooks/useBanking';
import { BankAccountForm } from '../components/BankAccountForm';
import { formatCurrency } from '@shared/utils/currency';
import type { BankAccount, CreateBankAccountRequest, UpdateBankAccountRequest } from '../types/banking';

export default function BankAccountsPage() {
  const navigate = useNavigate();

  // Hooks
  const { data: accounts, isLoading, error, refetch } = useBankAccounts();
  const { mutateAsync: createAccount, isPending: isCreating } = useCreateBankAccount();
  const { mutateAsync: updateAccount, isPending: isUpdating } = useUpdateBankAccount();
  const { mutateAsync: toggleAccount, isPending: isToggling } = useToggleBankAccount();

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const isSubmitting = isCreating || isUpdating;

  // Handlers
  const handleOpenCreate = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (data: CreateBankAccountRequest | UpdateBankAccountRequest) => {
    if (editingAccount) {
      await updateAccount({ accountId: editingAccount._id, data });
    } else {
      await createAccount(data as CreateBankAccountRequest);
    }
    handleCloseModal();
  };

  const handleToggle = async (accountId: string) => {
    await toggleAccount(accountId);
  };

  const getAccountTypeLabel = (type: string) => {
    return type === 'checking' ? 'Cuenta Corriente' : 'Caja de Ahorro';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-content1 border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cuentas Bancarias</h1>
            <p className="text-sm text-default-500 mt-1">
              Gestiona tus cuentas bancarias para conciliaciones
            </p>
          </div>
          <Button color="primary" onPress={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cuenta
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-default-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-danger mb-3" />
            <p className="text-danger font-medium">Error al cargar cuentas bancarias</p>
            <Button className="mt-4" variant="flat" onPress={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Landmark className="w-16 h-16 text-default-300 mb-4" />
            <p className="text-lg font-medium text-default-500">No hay cuentas bancarias</p>
            <p className="text-sm text-default-400 mt-1 mb-4">
              Agregá una cuenta bancaria para comenzar a conciliar movimientos
            </p>
            <Button color="primary" onPress={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cuenta
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Card
                key={account._id}
                className={`relative ${!account.isActive ? 'opacity-60' : ''}`}
              >
                <CardHeader className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{account.name}</p>
                      <p className="text-sm text-default-500">{account.bank}</p>
                    </div>
                  </div>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="light" size="sm" isIconOnly>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem
                        key="transactions"
                        startContent={<ArrowRight className="w-4 h-4" />}
                        onPress={() => navigate(`/banking/${account._id}/transactions`)}
                      >
                        Ver Movimientos
                      </DropdownItem>
                      <DropdownItem
                        key="reconciliation"
                        startContent={<ArrowRightLeft className="w-4 h-4" />}
                        onPress={() => navigate(`/banking/${account._id}/reconciliation`)}
                      >
                        Conciliar
                      </DropdownItem>
                      <DropdownItem
                        key="edit"
                        startContent={<Pencil className="w-4 h-4" />}
                        onPress={() => handleOpenEdit(account)}
                      >
                        Editar
                      </DropdownItem>
                      <DropdownItem
                        key="toggle"
                        startContent={
                          account.isActive ? (
                            <ToggleLeft className="w-4 h-4" />
                          ) : (
                            <ToggleRight className="w-4 h-4" />
                          )
                        }
                        onPress={() => handleToggle(account._id)}
                        isDisabled={isToggling}
                      >
                        {account.isActive ? 'Desactivar' : 'Activar'}
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-default-400" />
                      <span className="text-default-600">{account.accountNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Chip size="sm" variant="flat">
                        {getAccountTypeLabel(account.type)}
                      </Chip>
                      <Chip size="sm" variant="flat" color="primary">
                        {account.currency}
                      </Chip>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-default-500">Saldo Actual</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(account.currentBalance)}
                      </p>
                    </div>
                    {!account.isActive && (
                      <Chip size="sm" color="danger" variant="flat">
                        Inactiva
                      </Chip>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {editingAccount ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
          </ModalHeader>
          <ModalBody className="pb-6">
            <BankAccountForm
              account={editingAccount}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
              isSubmitting={isSubmitting}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
