import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { Client } from "@/types";
import { getErrorMessage } from "@/utils/errors";

export function useGenericClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["generic-client"],
    queryFn: async () => {
      const response = await api.get("/clients/generic");
      return response.data.client as Client;
    },
    staleTime: Infinity,
  });

  return {
    genericClient: data || null,
    loading: isLoading,
    error: error ? getErrorMessage(error, "Error al obtener cliente genérico") : null,
  };
}
