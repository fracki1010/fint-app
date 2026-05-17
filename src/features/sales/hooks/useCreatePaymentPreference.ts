import { useMutation } from "@tanstack/react-query";
import api from "@shared/api/axios";

export interface CreatePreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export function useCreatePaymentPreference() {
  return useMutation({
    mutationFn: async (complements: string[]) => {
      const response = await api.post("/payments/create-preference", { complements });
      // The backend wraps data in { success: true, data: { ... } }
      return (response.data?.data || response.data) as CreatePreferenceResponse;
    },
  });
}
