import { useMutation } from "@tanstack/react-query";
import api from "@/api/axios";

export interface CreatePreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export function useCreatePaymentPreference() {
  return useMutation({
    mutationFn: async (plan: string) => {
      const response = await api.post("/payments/create-preference", { plan });
      return response.data as CreatePreferenceResponse;
    },
  });
}
