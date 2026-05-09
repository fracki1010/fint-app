import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";
import type { InventorySnapshot, InventorySnapshotListResponse } from "@shared/types";

export function useInventorySnapshots(page = 1, limit = 20) {
  return useQuery<InventorySnapshotListResponse>({
    queryKey: ["inventory-snapshots", page, limit],
    queryFn: () =>
      api.get("/inventory-snapshots", { params: { page, limit } }).then((r) => r.data.data),
  });
}

export function useInventorySnapshot(id: string) {
  return useQuery<InventorySnapshot>({
    queryKey: ["inventory-snapshot", id],
    queryFn: () =>
      api.get(`/inventory-snapshots/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useTriggerSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/inventory-snapshots/trigger"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-snapshots"] });
    },
  });
}
