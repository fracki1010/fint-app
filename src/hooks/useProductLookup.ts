import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { Product } from "@/types";

export function useProductSearch(code: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["product-search", code],
    enabled: Boolean(code && code.length >= 2),
    queryFn: async () => {
      const response = await api.get(`/products/lookup/${encodeURIComponent(code!)}`);
      return response.data.products as Product[];
    },
    retry: false,
    staleTime: 500,
  });

  return {
    products: data || [],
    loading: isLoading,
    error: error as Error | null,
  };
}

export function useProductLookupManual() {
  const searchProducts = async (code: string): Promise<Product[]> => {
    try {
      const response = await api.get(`/products/lookup/${encodeURIComponent(code)}`);
      return response.data.products || [];
    } catch {
      return [];
    }
  };

  return { searchProducts };
}
