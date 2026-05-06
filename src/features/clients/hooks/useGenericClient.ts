import { useQuery } from "@tanstack/react-query";
import api from "@shared/api/axios";
import { Client } from "@shared/types";
import { getErrorMessage } from "@shared/utils/errors";

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
