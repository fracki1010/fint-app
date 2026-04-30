import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/api/axios";
import { TeamMember, UserRole } from "@/types";

export interface CreateTeamMemberPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateTeamMemberPayload {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export function useTeam(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["team"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<TeamMember[]>("/team");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateTeamMemberPayload) => {
      const response = await api.post<TeamMember>("/team", payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTeamMemberPayload }) => {
      const response = await api.patch<TeamMember>(`/team/${id}`, data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/team/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });

  return {
    members,
    loading,
    error,
    createMember: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMember: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deactivateMember: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,
  };
}
