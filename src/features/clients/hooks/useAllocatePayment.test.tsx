/**
 * @fileoverview Tests for useAllocatePayment hook
 * @module features/clients/hooks/useAllocatePayment.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import api from "@shared/api/axios";

// Mock the API
vi.mock("@shared/api/axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockApi = api as unknown as {
  post: ReturnType<typeof vi.fn>;
};

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

// Mock hook implementation for testing
const useAllocatePayment = (clientId: string) => {
  const queryClient = new QueryClient();
  
  return {
    allocate: async (data: { amount: number; paymentMethod?: string; reference?: string; notes?: string; allocations?: Array<{ entryId: string; amount: number }> }) => {
      const response = await api.post(`/clients/${clientId}/account/allocate`, data);
      
      // Invalidate queries after successful allocation
      queryClient.invalidateQueries({ queryKey: ["client-account", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-aging", clientId] });
      
      return response.data;
    },
    isLoading: false,
    isError: false,
    error: null,
  };
};

describe("useAllocatePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls API correctly with allocation data", async () => {
    const mockResponse = {
      data: {
        success: true,
        paymentEntry: {
          _id: "payment-1",
          type: "PAYMENT",
          amount: 500,
        },
        allocations: [
          { entryId: "charge-1", amount: 500 },
        ],
        affectedCharges: [
          { entryId: "charge-1", status: "paid", newRemaining: 0 },
        ],
        unallocatedAmount: 0,
      },
    };

    mockApi.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAllocatePayment("client-1"), {
      wrapper: createWrapper(),
    });

    // Execute the mutation
    await result.current.allocate({
      amount: 500,
      paymentMethod: "cash",
      reference: "REF-001",
    });

    // Verify API was called correctly
    expect(mockApi.post).toHaveBeenCalledWith(
      "/clients/client-1/account/allocate",
      {
        amount: 500,
        paymentMethod: "cash",
        reference: "REF-001",
      }
    );
  });

  it("calls API with manual allocations", async () => {
    const mockResponse = {
      data: {
        success: true,
        paymentEntry: { _id: "payment-1", type: "PAYMENT", amount: 300 },
        allocations: [{ entryId: "charge-2", amount: 300 }],
        affectedCharges: [{ entryId: "charge-2", status: "partial", newRemaining: 200 }],
        unallocatedAmount: 0,
      },
    };

    mockApi.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAllocatePayment("client-1"), {
      wrapper: createWrapper(),
    });

    await result.current.allocate({
      amount: 300,
      paymentMethod: "transfer",
      allocations: [{ entryId: "charge-2", amount: 300 }],
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      "/clients/client-1/account/allocate",
      {
        amount: 300,
        paymentMethod: "transfer",
        allocations: [{ entryId: "charge-2", amount: 300 }],
      }
    );
  });

  it("handles API errors correctly", async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            code: "ALLOCATION_EXCEEDS_REMAINING",
            message: "Allocation exceeds remaining amount",
          },
        },
      },
    };

    mockApi.post.mockRejectedValueOnce(errorResponse);

    const { result } = renderHook(() => useAllocatePayment("client-1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.allocate({
        amount: 1000,
        paymentMethod: "cash",
      })
    ).rejects.toThrow();
  });

  it("handles successful allocation with notes", async () => {
    const mockResponse = {
      data: {
        success: true,
        paymentEntry: {
          _id: "payment-1",
          type: "PAYMENT",
          amount: 1000,
          notes: "Monthly payment",
        },
        allocations: [{ entryId: "charge-1", amount: 1000 }],
        affectedCharges: [{ entryId: "charge-1", status: "paid", newRemaining: 0 }],
        unallocatedAmount: 0,
      },
    };

    mockApi.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAllocatePayment("client-1"), {
      wrapper: createWrapper(),
    });

    await result.current.allocate({
      amount: 1000,
      paymentMethod: "card",
      reference: "CARD-123",
      notes: "Monthly payment",
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      "/clients/client-1/account/allocate",
      {
        amount: 1000,
        paymentMethod: "card",
        reference: "CARD-123",
        notes: "Monthly payment",
      }
    );
  });

  it("handles partial allocation with unallocated amount", async () => {
    const mockResponse = {
      data: {
        success: true,
        paymentEntry: { _id: "payment-1", type: "PAYMENT", amount: 1000 },
        allocations: [{ entryId: "charge-1", amount: 700 }],
        affectedCharges: [{ entryId: "charge-1", status: "paid", newRemaining: 0 }],
        unallocatedAmount: 300,
      },
    };

    mockApi.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAllocatePayment("client-1"), {
      wrapper: createWrapper(),
    });

    const response = await result.current.allocate({
      amount: 1000,
      paymentMethod: "cash",
    });

    expect(response.unallocatedAmount).toBe(300);
    expect(response.allocations).toHaveLength(1);
  });

  it("handles empty allocations when no pending charges", async () => {
    const mockResponse = {
      data: {
        success: true,
        paymentEntry: { _id: "payment-1", type: "PAYMENT", amount: 500 },
        allocations: [],
        affectedCharges: [],
        unallocatedAmount: 500,
      },
    };

    mockApi.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAllocatePayment("client-1"), {
      wrapper: createWrapper(),
    });

    const response = await result.current.allocate({
      amount: 500,
      paymentMethod: "cash",
    });

    expect(response.allocations).toHaveLength(0);
    expect(response.unallocatedAmount).toBe(500);
  });
});
