import { useMutation } from "@tanstack/react-query";
import api from "@shared/api/axios";

interface ImportPayload {
  products: Record<string, unknown>[];
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export function useProductImport() {
  return useMutation<ImportResult, Error, ImportPayload>({
    mutationFn: async (payload) => {
      const response = await api.post<ImportResult>("/products/import", payload);
      return response.data;
    },
  });
}
