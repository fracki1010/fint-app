import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/api/axios";
import { Supplier } from "@/types";

export interface CreateSupplierPayload {
  name: string;
  company?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

export function useSuppliers(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: suppliers = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["suppliers"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<Supplier[]>("/suppliers");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateSupplierPayload) => {
      const response = await api.post<Supplier>("/suppliers", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierPayload }) => {
      const response = await api.patch<Supplier>(`/suppliers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  return {
    suppliers,
    loading,
    error,
    createSupplier: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSupplier: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteSupplier: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
