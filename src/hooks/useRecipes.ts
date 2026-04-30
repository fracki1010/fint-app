import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/api/axios";
import { Recipe, ProduceResult, ProductionLog } from "@/types";

export interface RecipeIngredientPayload {
  supply: string;
  quantity: number;
}

export interface CreateRecipePayload {
  name: string;
  productId?: string | null;
  yieldQuantity?: number;
  ingredients?: RecipeIngredientPayload[];
  notes?: string;
}

export interface UpdateRecipePayload {
  name?: string;
  productId?: string | null;
  yieldQuantity?: number;
  ingredients?: RecipeIngredientPayload[];
  notes?: string;
}

export interface ProducePayload {
  quantity: number;
  notes?: string;
}

export function useProductionLogs(options?: { recipeId?: string; limit?: number; enabled?: boolean }) {
  const { data: logs = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ["production-logs", options?.recipeId, options?.limit],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (options?.recipeId) params.recipeId = options.recipeId;
      if (options?.limit) params.limit = String(options.limit);
      const response = await api.get<ProductionLog[]>("/recipes/production-logs", { params });
      return response.data;
    },
  });
  return { logs, loading, error: error?.message || null, refetch };
}

export function useRecipes(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: recipes = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["recipes"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<Recipe[]>("/recipes");
      return response.data;
    },
  });

  const createRecipeMutation = useMutation({
    mutationFn: async (data: CreateRecipePayload) => {
      const response = await api.post<Recipe>("/recipes", data);
      return response.data;
    },
    onSuccess: (newRecipe) => {
      queryClient.setQueryData(["recipes"], (old: Recipe[] = []) => [
        ...old,
        newRecipe,
      ]);
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecipePayload }) => {
      const response = await api.patch<Recipe>(`/recipes/${id}`, data);
      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["recipes"], (old: Recipe[] = []) =>
        old.map((r) => (r._id === updated._id ? updated : r)),
      );
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recipes/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["recipes"], (old: Recipe[] = []) =>
        old.filter((r) => r._id !== deletedId),
      );
    },
  });

  const produceRecipeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProducePayload }) => {
      const response = await api.post<ProduceResult>(`/recipes/${id}/produce`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["production-logs"] });
    },
  });

  return {
    recipes,
    loading,
    error: error?.message || null,
    createRecipe: createRecipeMutation.mutateAsync,
    updateRecipe: updateRecipeMutation.mutateAsync,
    deleteRecipe: deleteRecipeMutation.mutateAsync,
    produceRecipe: produceRecipeMutation.mutateAsync,
    isCreating: createRecipeMutation.isPending,
    isUpdating: updateRecipeMutation.isPending,
    isDeleting: deleteRecipeMutation.isPending,
    isProducing: produceRecipeMutation.isPending,
  };
}
