/**
 * @fileoverview Tests for AgingReportTable component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgingReportTable } from "./AgingReportTable";
import { ClientAgingReport, AllClientsAgingReport } from "@shared/types";

// Mock utility functions
vi.mock("@shared/utils/currency", () => ({
  formatCurrency: (amount: number, currency: string) => `$${amount.toLocaleString()}`,
  formatCompactCurrency: (amount: number, currency: string) => `$${amount}`,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ChevronDown: () => <span data-testid="icon-down">▼</span>,
  ChevronUp: () => <span data-testid="icon-up">▲</span>,
  AlertCircle: () => <span data-testid="icon-alert">⚠</span>,
  Clock: () => <span data-testid="icon-clock">⏰</span>,
  Calendar: () => <span data-testid="icon-calendar">📅</span>,
}));

const mockSingleClientData: ClientAgingReport = {
  clientId: "client-1",
  clientName: "Test Client",
  clientPhone: "5491111111111",
  creditLimit: 10000,
  totalOutstanding: 4100,
  buckets: {
    current: 1000,
    "1-30": 500,
    "31-60": 800,
    "61-90": 600,
    "90+": 1200,
  },
  entries: [
    {
      bucket: "current",
      total: 1000,
      count: 1,
      entries: [
        {
          _id: "entry-1",
          date: "2026-01-01",
          dueDate: "2026-02-01",
          amount: 1000,
          remainingAmount: 1000,
          daysOverdue: -5,
        },
      ],
    },
    {
      bucket: "1-30",
      total: 500,
      count: 1,
      entries: [
        {
          _id: "entry-2",
          date: "2026-01-01",
          dueDate: "2026-01-15",
          amount: 500,
          remainingAmount: 500,
          daysOverdue: 15,
        },
      ],
    },
  ],
  generatedAt: "2026-02-01T00:00:00Z",
};

const mockAllClientsData: AllClientsAgingReport = {
  clients: [
    {
      clientId: "client-1",
      clientName: "Client A",
      clientPhone: "5491111111111",
      creditLimit: 10000,
      totalOutstanding: 4100,
      buckets: {
        current: 1000,
        "1-30": 500,
        "31-60": 800,
        "61-90": 600,
        "90+": 1200,
      },
    },
    {
      clientId: "client-2",
      clientName: "Client B",
      clientPhone: "5492222222222",
      creditLimit: 5000,
      totalOutstanding: 2000,
      buckets: {
        current: 500,
        "1-30": 500,
        "31-60": 500,
        "61-90": 250,
        "90+": 250,
      },
    },
  ],
  totals: {
    current: 1500,
    "1-30": 1000,
    "31-60": 1300,
    "61-90": 850,
    "90+": 1450,
    totalOutstanding: 6100,
  },
  generatedAt: "2026-02-01T00:00:00Z",
};

describe("AgingReportTable", () => {
  describe("Single Client View", () => {
    it("renders client name and total outstanding", () => {
      render(
        <AgingReportTable
          data={mockSingleClientData}
          currency="ARS"
          viewMode="single"
        />
      );

      expect(screen.getByText("Test Client")).toBeInTheDocument();
      expect(screen.getByText(/Total adeudado/)).toBeInTheDocument();
      expect(screen.getByText("$4,100")).toBeInTheDocument();
    });

    it("displays all aging buckets with correct labels", () => {
      render(
        <AgingReportTable
          data={mockSingleClientData}
          currency="ARS"
          viewMode="single"
        />
      );

      expect(screen.getByText("Al día")).toBeInTheDocument();
      expect(screen.getByText("1-30 días")).toBeInTheDocument();
      expect(screen.getByText("31-60 días")).toBeInTheDocument();
      expect(screen.getByText("61-90 días")).toBeInTheDocument();
      expect(screen.getByText("90+ días")).toBeInTheDocument();
    });

    it("displays bucket amounts correctly", () => {
      render(
        <AgingReportTable
          data={mockSingleClientData}
          currency="ARS"
          viewMode="single"
        />
      );

      // Check bucket values are displayed
      const amounts = screen.getAllByText(/\$\d+/);
      expect(amounts.length).toBeGreaterThan(0);
    });

    it("shows warning icon for overdue amounts", () => {
      render(
        <AgingReportTable
          data={mockSingleClientData}
          currency="ARS"
          viewMode="single"
        />
      );

      // Client has overdue amounts, should show alert icon
      expect(screen.getByTestId("icon-alert")).toBeInTheDocument();
    });

    it("shows clock icon for current amounts (no overdue)", () => {
      const noOverdueData = {
        ...mockSingleClientData,
        totalOutstanding: 1000,
        buckets: {
          current: 1000,
          "1-30": 0,
          "31-60": 0,
          "61-90": 0,
          "90+": 0,
        },
      };

      render(
        <AgingReportTable
          data={noOverdueData}
          currency="ARS"
          viewMode="single"
        />
      );

      expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
    });

    it("expands to show invoice details when clicked", () => {
      render(
        <AgingReportTable
          data={mockSingleClientData}
          currency="ARS"
          viewMode="single"
        />
      );

      const expandButton = screen.getByText(/Ver detalle/);
      fireEvent.click(expandButton);

      expect(screen.getByText(/Detalle de facturas/)).toBeInTheDocument();
      expect(screen.getByText(/Vencimiento:/)).toBeInTheDocument();
    });

    it("collapses details when clicked again", () => {
      render(
        <AgingReportTable
          data={mockSingleClientData}
          currency="ARS"
          viewMode="single"
        />
      );

      // Expand
      fireEvent.click(screen.getByText(/Ver detalle/));
      expect(screen.getByText(/Detalle de facturas/)).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText(/Ocultar detalle/));
      expect(screen.queryByText(/Detalle de facturas/)).not.toBeInTheDocument();
    });
  });

  describe("All Clients View", () => {
    it("renders summary section with totals", () => {
      render(
        <AgingReportTable
          data={mockAllClientsData}
          currency="ARS"
          viewMode="all"
        />
      );

      expect(screen.getByText("Resumen General")).toBeInTheDocument();
      expect(screen.getByText(/Total por cobrar/)).toBeInTheDocument();
      expect(screen.getByText("$6,100")).toBeInTheDocument();
    });

    it("displays all client rows", () => {
      render(
        <AgingReportTable
          data={mockAllClientsData}
          currency="ARS"
          viewMode="all"
        />
      );

      expect(screen.getByText("Client A")).toBeInTheDocument();
      expect(screen.getByText("Client B")).toBeInTheDocument();
    });

    it("shows client phone numbers", () => {
      render(
        <AgingReportTable
          data={mockAllClientsData}
          currency="ARS"
          viewMode="all"
        />
      );

      expect(screen.getByText("5491111111111")).toBeInTheDocument();
      expect(screen.getByText("5492222222222")).toBeInTheDocument();
    });

    it("displays credit limit for clients that have one", () => {
      render(
        <AgingReportTable
          data={mockAllClientsData}
          currency="ARS"
          viewMode="all"
        />
      );

      expect(screen.getByText(/Límite:/)).toBeInTheDocument();
    });

    it("shows mini progress bars for each client", () => {
      const { container } = render(
        <AgingReportTable
          data={mockAllClientsData}
          currency="ARS"
          viewMode="all"
        />
      );

      // Check for progress bar elements (divs with percentage-based widths)
      const progressBars = container.querySelectorAll('[style*="width"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe("Color Coding", () => {
    it("applies correct color classes to buckets", () => {
      const { container } = render(
        <AgingReportTable
          data={mockSingleClientData}
          currency="ARS"
          viewMode="single"
        />
      );

      // Check that bucket cells have color styling
      const bucketCells = container.querySelectorAll('[class*="bg-"]');
      expect(bucketCells.length).toBeGreaterThan(0);
    });
  });

  describe("Empty States", () => {
    it("handles client with zero outstanding balance", () => {
      const zeroData: ClientAgingReport = {
        ...mockSingleClientData,
        totalOutstanding: 0,
        buckets: {
          current: 0,
          "1-30": 0,
          "31-60": 0,
          "61-90": 0,
          "90+": 0,
        },
        entries: [],
      };

      render(<AgingReportTable data={zeroData} currency="ARS" viewMode="single" />);

      expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("handles empty clients list in all view", () => {
      const emptyData: AllClientsAgingReport = {
        clients: [],
        totals: {
          current: 0,
          "1-30": 0,
          "31-60": 0,
          "61-90": 0,
          "90+": 0,
          totalOutstanding: 0,
        },
        generatedAt: "2026-02-01T00:00:00Z",
      };

      render(<AgingReportTable data={emptyData} currency="ARS" viewMode="all" />);

      expect(screen.getByText("Resumen General")).toBeInTheDocument();
      expect(screen.getByText("$0")).toBeInTheDocument();
    });
  });
});
