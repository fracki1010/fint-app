import { useQuery } from "@tanstack/react-query";
import api from "@shared/api/axios";

export interface ComplementItem {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface CatalogData {
  success: boolean;
  appBasePrice: number;
  complements: ComplementItem[];
}

export function useComplementCatalog() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["complement-catalog"],
    queryFn: async () => {
      const response = await api.get("/complements/catalog");
      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    catalog: data as CatalogData | undefined,
    loading: isLoading,
    error: error?.message || null,
  };
}
