import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

import api from "@shared/api/axios";
import { Product, PriceTiers } from "@shared/types";

export interface ProductDetailResponse {
  product: Product;
}

export interface ProductPayload extends Partial<Product> {
  categories?: string[];
  priceTiers?: PriceTiers;
}

export interface PaginatedProductsResponse {
  products: Product[];
  totalPages: number;
  currentPage: number;
  total: number;
  hasNextPage: boolean;
}

function normalizePaginatedProductsResponse(
  data: PaginatedProductsResponse | Product[],
  pageParam: number,
): PaginatedProductsResponse {
  if (Array.isArray(data)) {
    return {
      products: data,
      totalPages: 1,
      currentPage: pageParam,
      total: data.length,
      hasNextPage: false,
    };
  }

  return {
    products: Array.isArray(data.products) ? data.products : [],
    totalPages: data.totalPages ?? 1,
    currentPage: data.currentPage ?? pageParam,
    total: data.total ?? data.products?.length ?? 0,
    hasNextPage: data.hasNextPage ?? false,
  };
}

export function useProducts(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["products"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<Product[]>("/products");

      return response.data;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductPayload) => {
      const response = await api.post<Product>("/products", productData);

      return response.data;
    },
    onSuccess: (newProduct) => {
      queryClient.setQueryData(["products"], (old: Product[] = []) => [
        ...old,
        newProduct,
      ]);
      queryClient.setQueryData(["product", newProduct._id], {
        product: newProduct,
      });
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({
      id,
      productData,
    }: {
      id: string;
      productData: ProductPayload;
    }) => {
      const response = await api.put<Product>(`/products/${id}`, productData);

      return response.data;
    },
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(["products"], (old: Product[] = []) =>
        old.map((p) => (p._id === updatedProduct._id ? updatedProduct : p)),
      );
      queryClient.setQueryData(["product", updatedProduct._id], {
        product: updatedProduct,
      });
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["products"], (old: Product[] = []) =>
        old.filter((p) => p._id !== deletedId),
      );
      queryClient.removeQueries({ queryKey: ["product", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] });
    },
  });

  return {
    products,
    loading,
    error: error?.message || null,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isDeleting: deleteProductMutation.isPending,
  };
}

export function useInfiniteProducts(limit = 20) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["products-infinite", limit],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await api.get<PaginatedProductsResponse | Product[]>(
        "/products",
        {
          params: { page: pageParam, limit },
        },
      );

      return normalizePaginatedProductsResponse(response.data, pageParam);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
  });

  const products = data?.pages.flatMap((page) => page.products) || [];
  const total = data?.pages[0]?.total || 0;

  return {
    products,
    total,
    loading: isLoading,
    error: error?.message || null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}

export function useProductDetail(id?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["product", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<ProductDetailResponse | Product>(
        `/products/${id}`,
      );

      if ("product" in response.data) {
        return response.data;
      }

      return { product: response.data };
    },
  });

  return {
    product: data?.product || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
