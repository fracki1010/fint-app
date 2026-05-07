/**
 * @fileoverview Tests for CreditLimitAlert component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreditLimitAlert, CreditLimitBadge } from "./CreditLimitAlert";
import { CreditStatus } from "@shared/types";

// Mock utility functions
vi.mock("@shared/utils/currency", () => ({
  formatCurrency: (amount: number, currency: string) => `$${amount.toLocaleString()}`,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <span data-testid="icon-warning">⚠</span>,
  AlertCircle: () => <span data-testid="icon-alert">⚠</span>,
  X: () => <span data-testid="icon-close">✕</span>,
  TrendingUp: () => <span data-testid="icon-trend">📈</span>,
  Wallet: () => <span data-testid="icon-wallet">💰</span>,
}));

const mockCreditStatus: CreditStatus = {
  clientId: "client-1",
  clientName: "Test Client",
  creditLimit: 10000,
  currentBalance: 5000,
  remainingCredit: 5000,
  utilizationPercentage: 50,
  status: "ok",
  isNearLimit: false,
  isOverLimit: false,
};

const mockNearLimitStatus: CreditStatus = {
  ...mockCreditStatus,
  currentBalance: 8500,
  remainingCredit: 1500,
  utilizationPercentage: 85,
  status: "near_limit",
  isNearLimit: true,
  isOverLimit: false,
};

const mockOverLimitStatus: CreditStatus = {
  ...mockCreditStatus,
  currentBalance: 12000,
  remainingCredit: 0,
  utilizationPercentage: 120,
  status: "over_limit",
  isNearLimit: false,
  isOverLimit: true,
};

const mockNoLimitStatus: CreditStatus = {
  ...mockCreditStatus,
  creditLimit: 0,
  remainingCredit: null,
  utilizationPercentage: 0,
  status: "no_limit",
  isNearLimit: false,
  isOverLimit: false,
};

describe("CreditLimitAlert", () => {
  describe("Banner Variant", () => {
    it("does not render when status is ok", () => {
      const { container } = render(
        <CreditLimitAlert creditStatus={mockCreditStatus} currency="ARS" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("does not render when no limit is set", () => {
      const { container } = render(
        <CreditLimitAlert creditStatus={mockNoLimitStatus} currency="ARS" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("shows warning alert at 80% threshold (near limit)", () => {
      render(
        <CreditLimitAlert creditStatus={mockNearLimitStatus} currency="ARS" />
      );

      expect(screen.getByText("Cerca del límite de crédito")).toBeInTheDocument();
      expect(screen.getByText(/85%/)).toBeInTheDocument();
      expect(screen.getByTestId("icon-warning")).toBeInTheDocument();
    });

    it("shows danger alert when over limit (100%+)", () => {
      render(
        <CreditLimitAlert creditStatus={mockOverLimitStatus} currency="ARS" />
      );

      expect(screen.getByText("¡Límite de crédito excedido!")).toBeInTheDocument();
      expect(screen.getByText(/120%/)).toBeInTheDocument();
      expect(screen.getByTestId("icon-alert")).toBeInTheDocument();
    });

    it("displays remaining credit in near limit warning", () => {
      render(
        <CreditLimitAlert creditStatus={mockNearLimitStatus} currency="ARS" />
      );

      expect(screen.getByText(/Restante:/)).toBeInTheDocument();
      expect(screen.getByText("$1,500")).toBeInTheDocument();
    });

    it("shows credit limit and current balance in over limit message", () => {
      render(
        <CreditLimitAlert creditStatus={mockOverLimitStatus} currency="ARS" />
      );

      expect(screen.getByText("$10,000")).toBeInTheDocument();
      expect(screen.getByText("$12,000")).toBeInTheDocument();
    });

    it("can be dismissed when showDismiss is true", () => {
      const onDismiss = vi.fn();
      render(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          showDismiss={true}
          onDismiss={onDismiss}
        />
      );

      const closeButton = screen.getByTestId("icon-close").parentElement;
      fireEvent.click(closeButton!);

      expect(onDismiss).toHaveBeenCalled();
    });

    it("does not show dismiss button when showDismiss is false", () => {
      const { container } = render(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          showDismiss={false}
        />
      );

      expect(container.querySelector('[data-testid="icon-close"]')).not.toBeInTheDocument();
    });

    it("returns null after being dismissed", () => {
      const { container, rerender } = render(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          showDismiss={true}
        />
      );

      // Dismiss the alert
      const closeButton = screen.getByTestId("icon-close").parentElement;
      fireEvent.click(closeButton!);

      // Force re-render to trigger state update
      rerender(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          showDismiss={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Compact Variant", () => {
    it("renders compact badge for near limit", () => {
      const { container } = render(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          variant="compact"
        />
      );

      expect(container.textContent).toContain("85%");
      expect(container.textContent).toContain("usado");
    });

    it("renders compact badge for over limit", () => {
      const { container } = render(
        <CreditLimitAlert
          creditStatus={mockOverLimitStatus}
          currency="ARS"
          variant="compact"
        />
      );

      expect(container.textContent).toContain("120%");
      expect(container.textContent).toContain("Excedido");
    });
  });

  describe("Card Variant", () => {
    it("renders detailed card for near limit", () => {
      render(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          variant="card"
        />
      );

      expect(screen.getByText("Estado de Crédito")).toBeInTheDocument();
      expect(screen.getByText("Utilización")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("renders detailed card for over limit", () => {
      render(
        <CreditLimitAlert
          creditStatus={mockOverLimitStatus}
          currency="ARS"
          variant="card"
        />
      );

      expect(screen.getByText("Estado de Crédito")).toBeInTheDocument();
    });

    it("displays credit limit and used amounts", () => {
      render(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          variant="card"
        />
      );

      expect(screen.getByText("Límite")).toBeInTheDocument();
      expect(screen.getByText("$10,000")).toBeInTheDocument();
      expect(screen.getByText("Usado")).toBeInTheDocument();
      expect(screen.getByText("$8,500")).toBeInTheDocument();
    });

    it("shows progress bar with correct width", () => {
      const { container } = render(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          variant="card"
        />
      );

      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("caps progress bar at 100% when over limit", () => {
      const { container } = render(
        <CreditLimitAlert
          creditStatus={mockOverLimitStatus}
          currency="ARS"
          variant="card"
        />
      );

      const progressBar = container.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it("displays available credit when remaining", () => {
      render(
        <CreditLimitAlert
          creditStatus={mockNearLimitStatus}
          currency="ARS"
          variant="card"
        />
      );

      expect(screen.getByText("Crédito disponible")).toBeInTheDocument();
      expect(screen.getByText("$1,500")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("returns null when creditStatus is null", () => {
      const { container } = render(
        <CreditLimitAlert creditStatus={null} currency="ARS" />
      );
      expect(container.firstChild).toBeNull();
    });

    it("handles exactly 80% utilization (threshold boundary)", () => {
      const exact80Status: CreditStatus = {
        ...mockCreditStatus,
        currentBalance: 8000,
        remainingCredit: 2000,
        utilizationPercentage: 80,
        status: "near_limit",
        isNearLimit: true,
      };

      render(<CreditLimitAlert creditStatus={exact80Status} currency="ARS" />);

      expect(screen.getByText("Cerca del límite de crédito")).toBeInTheDocument();
    });

    it("handles exactly 100% utilization", () => {
      const exact100Status: CreditStatus = {
        ...mockCreditStatus,
        currentBalance: 10000,
        remainingCredit: 0,
        utilizationPercentage: 100,
        status: "over_limit",
        isNearLimit: false,
        isOverLimit: true,
      };

      render(<CreditLimitAlert creditStatus={exact100Status} currency="ARS" />);

      expect(screen.getByText("¡Límite de crédito excedido!")).toBeInTheDocument();
    });
  });
});

describe("CreditLimitBadge", () => {
  it("returns null when no credit limit set", () => {
    const { container } = render(
      <CreditLimitBadge creditLimit={0} currentBalance={0} currency="ARS" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("displays utilization percentage", () => {
    render(
      <CreditLimitBadge creditLimit={10000} currentBalance={5000} currency="ARS" />
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("shows success style for low utilization (<80%)", () => {
    const { container } = render(
      <CreditLimitBadge creditLimit={10000} currentBalance={4000} currency="ARS" />
    );

    expect(container.firstChild?.className).toContain("success");
  });

  it("shows warning style for near limit (80-100%)", () => {
    const { container } = render(
      <CreditLimitBadge creditLimit={10000} currentBalance={8500} currency="ARS" />
    );

    expect(container.firstChild?.className).toContain("warning");
  });

  it("shows danger style for over limit (>100%)", () => {
    const { container } = render(
      <CreditLimitBadge creditLimit={10000} currentBalance={12000} currency="ARS" />
    );

    expect(container.firstChild?.className).toContain("danger");
  });

  it("renders in small size by default", () => {
    render(
      <CreditLimitBadge creditLimit={10000} currentBalance={5000} currency="ARS" size="sm" />
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders in medium size when specified", () => {
    render(
      <CreditLimitBadge creditLimit={10000} currentBalance={5000} currency="ARS" size="md" />
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("includes title with limit and balance info", () => {
    render(
      <CreditLimitBadge creditLimit={10000} currentBalance={5000} currency="ARS" />
    );

    const badge = screen.getByText("50%").parentElement;
    expect(badge).toHaveAttribute("title");
    expect(badge?.getAttribute("title")).toContain("Límite");
    expect(badge?.getAttribute("title")).toContain("Usado");
  });
});
