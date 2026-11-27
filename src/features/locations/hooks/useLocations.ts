import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";
import type {
  CreateLocationInput,
  Location,
  LocationStockRow,
  TransferInput,
} from "@features/locations/types";

const LOCATIONS_KEY = ["locations"] as const;

export function useLocations() {
  return useQuery<Location[]>({
    queryKey: LOCATIONS_KEY,
    queryFn: async () => (await api.get<Location[]>("/locations")).data,
  });
}

export function useLocationStock(locationId: string | null) {
  return useQuery<LocationStockRow[]>({
    queryKey: ["locations", locationId, "stock"],
    enabled: Boolean(locationId),
    queryFn: async () =>
      (await api.get<LocationStockRow[]>(`/locations/${locationId}/stock`)).data,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLocationInput) =>
      (await api.post<Location>("/locations", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LOCATIONS_KEY }),
  });
}

export function useTransferStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransferInput) =>
      (await api.post("/locations/transfers", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations"] }),
  });
}
