import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSupply,
  createSupplyMovement,
  getSupplies,
  getSupplyMovements,
  updateSupply,
  type SupplyListParams,
  type SupplyMovementPayload,
  type SupplyPayload,
} from "@/api/supplies";

const SUPPLIES_QUERY_KEY = ["supplies"] as const;
const SUPPLY_MOVEMENTS_QUERY_KEY = ["supplyMovements"] as const;

export function useSupplies(params?: SupplyListParams, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...SUPPLIES_QUERY_KEY, params],
    enabled: options?.enabled ?? true,
    queryFn: () => getSupplies(params),
  });

  const createMutation = useMutation({
    mutationFn: (payload: SupplyPayload) => createSupply(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SupplyPayload> }) =>
      updateSupply(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIES_QUERY_KEY });
    },
  });

  return {
    supplies: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    createSupply: createMutation.mutateAsync,
    updateSupply: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export function useSupplyMovements(supplyItemId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...SUPPLY_MOVEMENTS_QUERY_KEY, supplyItemId],
    enabled: Boolean(supplyItemId),
    queryFn: () => getSupplyMovements(supplyItemId as string),
  });

  const createMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SupplyMovementPayload;
    }) => createSupplyMovement(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...SUPPLY_MOVEMENTS_QUERY_KEY, variables.id],
      });
      queryClient.invalidateQueries({ queryKey: SUPPLIES_QUERY_KEY });
    },
  });

  return {
    movements: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    createSupplyMovement: createMutation.mutateAsync,
    isCreatingMovement: createMutation.isPending,
  };
}
