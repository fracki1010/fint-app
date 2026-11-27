import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";
import type {
  CreateLocationInput,
  Location,
  LocationStockPage,
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

export function useLocationStockPage(
  locationId: string | null,
  { q, page, limit }: { q: string; page: number; limit: number },
) {
  return useQuery<LocationStockPage>({
    queryKey: ["locations", locationId, "stock-page", q, page, limit],
    enabled: Boolean(locationId),
    placeholderData: (previous) => previous,
    queryFn: async () =>
      (
        await api.get<LocationStockPage>(`/locations/${locationId}/stock`, {
          params: { q: q || undefined, page, limit },
        })
      ).data,
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

export function useLoadStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ depositId, productId, quantity }: { depositId: string; productId: string; quantity: number }) =>
      (await api.post(`/locations/${depositId}/stock-load`, { productId, quantity })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["locations"] }),
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
