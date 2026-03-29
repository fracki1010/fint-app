import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/api/axios";
import { useThemeStore } from "@/stores/themeStore";

export interface Setting {
  _id: string;
  admin: {
    fullName: string;
    role: string;
    phone: string;
    email: string;
    company?: {
      name: string;
      address: string;
      phone: string;
      email: string;
    };
  };
  storeName: string;
  taxId: string;
  fiscalCondition: string;
  address: string;
  phone: string;
  email: string;
  invoiceTerms?: string;
  taxRate: number;
  currency: string;
  theme: "light" | "dark";
  whatsappEnabled: boolean;
  lowStockThreshold: number;
  orderPrefix: string;
  allowDeliveryWithoutPayment: boolean;
  stockDeductionMoment: "delivery" | "confirmation";
  defaultUnitOfMeasure: string;
  defaultSalesStatus: "Pendiente" | "Confirmada" | "Cancelada";
  defaultPaymentStatus: "Pendiente" | "Parcial" | "Pagado";
  defaultDeliveryStatus: "Pendiente" | "Preparando" | "Entregada";
  createdAt: string;
  updatedAt: string;
}

export function useSettings() {
  const queryClient = useQueryClient();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const {
    data: settings,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await api.get<Setting>("/settings");

      return response.data;
    },
  });

  useEffect(() => {
    if (settings?.theme && settings.theme !== theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme, theme]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updateData: Partial<Setting>) => {
      const response = await api.put<Setting>("/settings", updateData);

      return response.data;
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["settings"], updatedSettings);
      if (updatedSettings.theme) {
        setTheme(updatedSettings.theme);
      }
    },
  });

  return {
    settings,
    loading,
    error: error?.message || null,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  };
}
