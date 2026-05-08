import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";
import type { CostCenter, CostCenterReport } from "@shared/types";

export function useCostCenters() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["cost-centers"],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: CostCenter[] }>("/cost-centers");
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const response = await api.post("/cost-centers", payload);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cost-centers"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string; isActive?: boolean }) => {
      const response = await api.put(`/cost-centers/${id}`, payload);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cost-centers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cost-centers/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cost-centers"] }),
  });

  return {
    centers: data || [],
    loading: isLoading,
    error: error?.message || null,
    createCenter: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCenter: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCenter: deleteMutation.mutateAsync,
  };
}

export function useCostCenterReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ["cost-centers", "report", { from, to }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const response = await api.get<{ success: boolean; data: CostCenterReport }>(
        `/cost-centers/report?${params}`
      );
      return response.data.data;
    },
  });
}
