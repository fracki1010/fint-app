import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useExperienceMode } from "./useExperienceMode";

vi.mock("@features/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@features/auth/hooks/useAuth";

function mockAuth(experienceMode?: "simple" | "intermediate" | "full") {
  (useAuth as any).mockReturnValue({
    user: {
      tenant: {
        plan: "app_base",
        experienceMode: experienceMode || "simple",
        enabledFeatures: [],
        limits: { maxUsers: 1, maxProducts: 200, maxOrdersPerMonth: 500 },
      },
    },
  });
}

describe("useExperienceMode", () => {
  it("returns mode='simple', isSimple=true, isIntermediate=false, isFull=false for simple tenant", () => {
    mockAuth("simple");

    const { result } = renderHook(() => useExperienceMode());

    expect(result.current.mode).toBe("simple");
    expect(result.current.isSimple).toBe(true);
    expect(result.current.isIntermediate).toBe(false);
    expect(result.current.isFull).toBe(false);
  });

  it("returns mode='intermediate', isSimple=false, isIntermediate=true, isFull=false", () => {
    mockAuth("intermediate");

    const { result } = renderHook(() => useExperienceMode());

    expect(result.current.mode).toBe("intermediate");
    expect(result.current.isSimple).toBe(false);
    expect(result.current.isIntermediate).toBe(true);
    expect(result.current.isFull).toBe(false);
  });

  it("returns mode='full', isSimple=false, isIntermediate=false, isFull=true", () => {
    mockAuth("full");

    const { result } = renderHook(() => useExperienceMode());

    expect(result.current.mode).toBe("full");
    expect(result.current.isSimple).toBe(false);
    expect(result.current.isIntermediate).toBe(false);
    expect(result.current.isFull).toBe(true);
  });

  it("defaults to 'simple' when experienceMode is undefined in tenant", () => {
    (useAuth as any).mockReturnValue({
      user: {
        tenant: {
          plan: "app_base",
          // experienceMode is intentionally undefined
          enabledFeatures: [],
        },
      },
    });

    const { result } = renderHook(() => useExperienceMode());

    expect(result.current.mode).toBe("simple");
    expect(result.current.isSimple).toBe(true);
    expect(result.current.isIntermediate).toBe(false);
    expect(result.current.isFull).toBe(false);
  });

  it("defaults to 'simple' when tenant is null", () => {
    (useAuth as any).mockReturnValue({
      user: { tenant: null },
    });

    const { result } = renderHook(() => useExperienceMode());

    expect(result.current.mode).toBe("simple");
    expect(result.current.isSimple).toBe(true);
  });
});
