import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

import {
  useVouchers,
  useGenerateVouchers,
  useVoidVoucher,
  useDownloadVoucher,
  useNextVoucherNumber,
} from "./useVouchers";
import api from "@shared/api/axios";

// Mock the API
vi.mock("@shared/api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock URL and link creation for download
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(window, "URL", {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockVoucher = {
  _id: "voucher-1",
  order: "order-1",
  type: "invoice" as const,
  number: "F-000042",
  sequentialNumber: 42,
  filePath: "/path/to/file.pdf",
  fileUrl: "/api/vouchers/download/voucher-1",
  status: "active" as const,
  createdBy: "user-1",
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
};

describe("useVouchers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useVouchers hook", () => {
    it("fetches vouchers for an order", async () => {
      (api.get as any).mockResolvedValueOnce({
        data: { vouchers: [mockVoucher] },
      });

      const { result } = renderHook(() => useVouchers("order-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith("/orders/order-1/vouchers");
      expect(result.current.vouchers).toHaveLength(1);
      expect(result.current.vouchers[0].number).toBe("F-000042");
    });

    it("does not fetch when orderId is not provided", () => {
      const { result } = renderHook(() => useVouchers(undefined), {
        wrapper: createWrapper(),
      });

      expect(api.get).not.toHaveBeenCalled();
      expect(result.current.vouchers).toEqual([]);
    });

    it("returns error state on API failure", async () => {
      (api.get as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useVouchers("order-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useGenerateVouchers hook", () => {
    it("generates vouchers successfully", async () => {
      (api.post as any).mockResolvedValueOnce({
        data: {
          vouchers: [mockVoucher],
          generatedAt: "2026-01-15T10:00:00.000Z",
        },
      });

      const { result } = renderHook(() => useGenerateVouchers(), {
        wrapper: createWrapper(),
      });

      const generateResult = await result.current.generateVouchers({
        orderId: "order-1",
        data: { types: ["invoice"] },
      });

      expect(api.post).toHaveBeenCalledWith("/orders/order-1/vouchers", {
        types: ["invoice"],
      });
      expect(generateResult.vouchers).toHaveLength(1);
      expect(result.current.isGenerating).toBe(false);
    });

    it("returns error state on generation failure", async () => {
      (api.post as any).mockRejectedValueOnce({
        response: { data: { message: "Invalid voucher type" } },
      });

      const { result } = renderHook(() => useGenerateVouchers(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.generateVouchers({
          orderId: "order-1",
          data: { types: ["invalid"] },
        });
      } catch (e) {
        // Expected to throw
      }

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useVoidVoucher hook", () => {
    it("voids voucher with reason", async () => {
      (api.post as any).mockResolvedValueOnce({
        data: {
          voucher: { ...mockVoucher, status: "voided", voidReason: "Test reason" },
          message: "Voucher voided successfully",
        },
      });

      const { result } = renderHook(() => useVoidVoucher(), {
        wrapper: createWrapper(),
      });

      const voidResult = await result.current.voidVoucher({
        voucherId: "voucher-1",
        reason: "Test reason",
      });

      expect(api.post).toHaveBeenCalledWith("/vouchers/voucher-1/void", {
        reason: "Test reason",
      });
      expect(voidResult.voucher.status).toBe("voided");
      expect(result.current.isVoiding).toBe(false);
    });

    it("handles void error", async () => {
      (api.post as any).mockRejectedValueOnce({
        response: { data: { message: "Already voided" } },
      });

      const { result } = renderHook(() => useVoidVoucher(), {
        wrapper: createWrapper(),
      });

      try {
        await result.current.voidVoucher({
          voucherId: "voucher-1",
          reason: "Test",
        });
      } catch (e) {
        // Expected to throw
      }

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("useDownloadVoucher hook", () => {
    it("downloads voucher PDF", async () => {
      const mockBlob = new Blob(["PDF content"], { type: "application/pdf" });
      (api.get as any).mockResolvedValueOnce({ data: mockBlob });
      mockCreateObjectURL.mockReturnValueOnce("blob:mock-url");

      const { result } = renderHook(() => useDownloadVoucher());

      await result.current.downloadVoucher("voucher-1", "F-000042.pdf");

      expect(api.get).toHaveBeenCalledWith("/vouchers/voucher-1/download", {
        responseType: "blob",
      });
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it("uses default filename when not provided", async () => {
      const mockBlob = new Blob(["PDF content"], { type: "application/pdf" });
      (api.get as any).mockResolvedValueOnce({ data: mockBlob });
      mockCreateObjectURL.mockReturnValueOnce("blob:mock-url");

      const { result } = renderHook(() => useDownloadVoucher());

      await result.current.downloadVoucher("voucher-1");

      // Should use default filename format
      expect(api.get).toHaveBeenCalledWith("/vouchers/voucher-1/download", {
        responseType: "blob",
      });
    });

    it("handles download error", async () => {
      (api.get as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useDownloadVoucher());

      await expect(
        result.current.downloadVoucher("voucher-1", "test.pdf")
      ).rejects.toThrow("Network error");
    });
  });

  describe("useNextVoucherNumber hook", () => {
    it("fetches next number for voucher type", async () => {
      (api.get as any).mockResolvedValueOnce({
        data: {
          nextNumber: "F-000043",
          sequentialNumber: 43,
        },
      });

      const { result } = renderHook(() => useNextVoucherNumber("invoice"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith("/vouchers/next-number", {
        params: { type: "invoice" },
      });
      expect(result.current.nextNumber).toBe("F-000043");
      expect(result.current.sequentialNumber).toBe(43);
    });

    it("returns null values while loading", () => {
      (api.get as any).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useNextVoucherNumber("invoice"), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.nextNumber).toBeNull();
    });

    it("handles API error", async () => {
      (api.get as any).mockRejectedValueOnce(new Error("API Error"));

      const { result } = renderHook(() => useNextVoucherNumber("invoice"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});
