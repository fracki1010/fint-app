import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { usePlanFeatures } from "./usePlanFeatures";

vi.mock("@features/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@features/auth/hooks/useAuth";

function mockAuth(overrides: any = {}) {
  (useAuth as any).mockReturnValue({
    user: {
      tenant: {
        plan: "app_base",
        complements: [],
        enabledFeatures: ["client_account", "supplier_account", "quotes", "banking"],
        limits: { maxUsers: 1, maxProducts: 200, maxOrdersPerMonth: 500 },
        usage: { currentUsers: 1, currentProducts: 50, ordersThisMonth: 100 },
        trialEndsAt: null,
        ...overrides,
      },
    },
  });
}

describe("usePlanFeatures", () => {
  it("returns app_base plan and base features when no complements", () => {
    mockAuth();

    const { result } = renderHook(() => usePlanFeatures());

    expect(result.current.plan).toBe("app_base");
    expect(result.current.complements).toEqual([]);
    expect(result.current.features).toContain("client_account");
    expect(result.current.features).toContain("quotes");
    expect(result.current.hasFeature("client_account")).toBe(true);
    expect(result.current.hasFeature("team_management")).toBe(false);
  });

  it("returns correct features when complements include team_10 and expansion", () => {
    mockAuth({
      complements: ["team_10", "expansion"],
      enabledFeatures: [
        "client_account",
        "supplier_account",
        "quotes",
        "banking",
        "team_management",
        "unlimited_products",
        "unlimited_orders",
      ],
      limits: { maxUsers: 10, maxProducts: -1, maxOrdersPerMonth: -1 },
    });

    const { result } = renderHook(() => usePlanFeatures());

    expect(result.current.complements).toEqual(["team_10", "expansion"]);
    expect(result.current.hasFeature("team_management")).toBe(true);
    expect(result.current.hasFeature("unlimited_products")).toBe(true);
    expect(result.current.hasFeature("api_access")).toBe(false);
  });

  it("computes limit status correctly for within-limit usage", () => {
    mockAuth({
      usage: { currentUsers: 0, currentProducts: 50, ordersThisMonth: 100 },
    });

    const { result } = renderHook(() => usePlanFeatures());

    expect(result.current.limitStatus).not.toBeNull();
    expect(result.current.limitStatus!.users.percentage).toBe(0); // 0/1
    expect(result.current.limitStatus!.products.percentage).toBe(25); // 50/200
    expect(result.current.limitStatus!.orders.percentage).toBe(20); // 100/500
    expect(result.current.anyLimitWarning).toBe(false);
    expect(result.current.anyLimitExceeded).toBe(false);
  });

  it("computes limit status correctly when unlimited", () => {
    mockAuth({
      complements: ["expansion"],
      enabledFeatures: ["client_account", "unlimited_products", "unlimited_orders"],
      limits: { maxUsers: 1, maxProducts: -1, maxOrdersPerMonth: -1 },
    });

    const { result } = renderHook(() => usePlanFeatures());

    expect(result.current.limitStatus!.products.percentage).toBe(0);
    expect(result.current.limitStatus!.orders.percentage).toBe(0);
    expect(result.current.limitStatus!.products.status).toBe("ok");
  });

  it("detects exceeded limit", () => {
    mockAuth({
      usage: { currentUsers: 5, currentProducts: 200, ordersThisMonth: 500 },
    });

    const { result } = renderHook(() => usePlanFeatures());

    expect(result.current.limitStatus!.users.status).toBe("exceeded");
    expect(result.current.anyLimitExceeded).toBe(true);
  });

  it("computes trial status correctly", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    mockAuth({ trialEndsAt: futureDate });

    const { result } = renderHook(() => usePlanFeatures());

    expect(result.current.isTrial).toBe(true);
    expect(result.current.trialDaysLeft).toBe(7);
  });

  it("returns no trial when trialEndsAt is null", () => {
    mockAuth({ trialEndsAt: null });

    const { result } = renderHook(() => usePlanFeatures());

    expect(result.current.isTrial).toBe(false);
    expect(result.current.trialDaysLeft).toBe(0);
  });

  it("does NOT use FEATURE_MATRIX or plan string to determine features", () => {
    mockAuth({
      plan: "business",
      complements: [],
      enabledFeatures: [],
    });

    const { result } = renderHook(() => usePlanFeatures());

    expect(result.current.hasFeature("client_account")).toBe(false);
    expect(result.current.features).toEqual([]);
  });
});
