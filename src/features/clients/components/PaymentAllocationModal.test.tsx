/**
 * @fileoverview Tests for PaymentAllocationModal component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PaymentAllocationModal } from "./PaymentAllocationModal";
import { ClientAccountEntry } from "@shared/types";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Wallet: () => <span data-testid="icon-wallet">Wallet</span>,
  AlertCircle: () => <span data-testid="icon-alert">Alert</span>,
  Check: () => <span data-testid="icon-check">Check</span>,
  DollarSign: () => <span data-testid="icon-dollar">$</span>,
  CreditCard: () => <span data-testid="icon-card">Card</span>,
  FileText: () => <span data-testid="icon-file">File</span>,
  Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
  ArrowRight: () => <span data-testid="icon-arrow">Arrow</span>,
  Loader2: () => <span data-testid="icon-loader">Loading</span>,
}));

// Mock utility functions
vi.mock("@shared/utils/currency", () => ({
  formatCurrency: (amount: number, currency: string) => `$${amount.toFixed(2)}`,
}));

vi.mock("@shared/utils/date", () => ({
  formatDateTime: (date: string) => date,
}));

const mockPendingCharges = [
  {
    _id: "charge-1",
    client: "client-1",
    date: "2026-01-01",
    type: "CHARGE" as const,
    amount: 1000,
    sign: 1 as const,
    paymentMethod: "",
    reference: "",
    notes: "",
    remainingAmount: 1000,
    allocatedAmount: 0,
    dueDate: "2026-02-01",
    status: "pending" as const,
  },
  {
    _id: "charge-2",
    client: "client-1",
    date: "2026-01-15",
    type: "CHARGE" as const,
    amount: 500,
    sign: 1 as const,
    paymentMethod: "",
    reference: "",
    notes: "",
    remainingAmount: 500,
    allocatedAmount: 0,
    dueDate: "2026-02-15",
    status: "pending" as const,
    order: "order-1",
  },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  clientId: "client-1",
  clientName: "Test Client",
  pendingCharges: mockPendingCharges,
  currency: "ARS",
  onAllocate: vi.fn().mockResolvedValue(undefined),
  isLoading: false,
};

describe("PaymentAllocationModal", () => {
  it("renders modal when isOpen is true", () => {
    render(<PaymentAllocationModal {...defaultProps} />);

    expect(screen.getByText("Registrar Cobro")).toBeInTheDocument();
    expect(screen.getByText("Test Client")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(<PaymentAllocationModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText("Registrar Cobro")).not.toBeInTheDocument();
  });

  it("renders pending charges list", () => {
    render(<PaymentAllocationModal {...defaultProps} />);

    expect(screen.getByText("Cargos Pendientes")).toBeInTheDocument();
    expect(screen.getByText(/2.*Total/)).toBeInTheDocument();
  });

  it("displays individual charge details", () => {
    render(<PaymentAllocationModal {...defaultProps} />);

    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
    expect(screen.getByText("$1000.00")).toBeInTheDocument();
    expect(screen.getByText("Venta #order-1")).toBeInTheDocument();
  });

  it("calculates FIFO allocation automatically", async () => {
    render(<PaymentAllocationModal {...defaultProps} />);

    // Enter payment amount
    const amountInput = screen.getByLabelText("Monto a pagar");
    fireEvent.change(amountInput, { target: { value: "700" } });

    // Should show allocation summary
    await waitFor(() => {
      expect(screen.getByText("Asignar: $500.00")).toBeInTheDocument();
      expect(screen.getByText("Asignar: $200.00")).toBeInTheDocument();
    });
  });

  it("allows switching to manual allocation mode", () => {
    render(<PaymentAllocationModal {...defaultProps} />);

    const manualButton = screen.getByText("Manual");
    fireEvent.click(manualButton);

    // Should show checkboxes for charge selection
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("calculates manual allocation correctly", async () => {
    render(<PaymentAllocationModal {...defaultProps} />);

    // Switch to manual mode
    fireEvent.click(screen.getByText("Manual"));

    // Enter payment amount
    const amountInput = screen.getByLabelText("Monto a pagar");
    fireEvent.change(amountInput, { target: { value: "1000" } });

    // Select first charge
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Should show allocation input for selected charge
    await waitFor(() => {
      const allocationInput = screen.getByPlaceholderText("Monto a asignar");
      expect(allocationInput).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid payment amount", async () => {
    const onAllocate = vi.fn();
    render(
      <PaymentAllocationModal {...defaultProps} onAllocate={onAllocate} />
    );

    // Enter invalid amount
    const amountInput = screen.getByLabelText("Monto a pagar");
    fireEvent.change(amountInput, { target: { value: "0" } });

    // Click confirm
    fireEvent.click(screen.getByText("Confirmar Pago"));

    await waitFor(() => {
      expect(screen.getByText("El monto del pago debe ser mayor a cero")).toBeInTheDocument();
    });

    expect(onAllocate).not.toHaveBeenCalled();
  });

  it("shows validation error when no charges selected in manual mode", async () => {
    const onAllocate = vi.fn();
    render(
      <PaymentAllocationModal {...defaultProps} onAllocate={onAllocate} />
    );

    // Switch to manual mode
    fireEvent.click(screen.getByText("Manual"));

    // Enter payment amount
    const amountInput = screen.getByLabelText("Monto a pagar");
    fireEvent.change(amountInput, { target: { value: "500" } });

    // Click confirm without selecting any charges
    fireEvent.click(screen.getByText("Confirmar Pago"));

    await waitFor(() => {
      expect(screen.getByText("Selecciona al menos un cargo para asignar el pago")).toBeInTheDocument();
    });

    expect(onAllocate).not.toHaveBeenCalled();
  });

  it("calls onAllocate with correct data on submit", async () => {
    const onAllocate = vi.fn().mockResolvedValue(undefined);
    render(
      <PaymentAllocationModal {...defaultProps} onAllocate={onAllocate} />
    );

    // Enter payment details
    const amountInput = screen.getByLabelText("Monto a pagar");
    fireEvent.change(amountInput, { target: { value: "1000" } });

    // Select payment method
    const methodSelect = screen.getByDisplayValue("Efectivo");
    fireEvent.change(methodSelect, { target: { value: "transfer" } });

    // Enter reference
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "REF-123" } });

    // Click confirm
    fireEvent.click(screen.getByText("Confirmar Pago"));

    await waitFor(() => {
      expect(onAllocate).toHaveBeenCalledWith({
        amount: 1000,
        paymentMethod: "transfer",
        reference: "REF-123",
        notes: undefined,
        allocations: [
          { entryId: "charge-1", amount: 1000 },
        ],
      });
    });
  });

  it("shows loading state during submission", () => {
    render(<PaymentAllocationModal {...defaultProps} isLoading={true} />);

    expect(screen.getByText("Procesando...")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeDisabled();
  });

  it("closes modal on cancel click", () => {
    const onClose = vi.fn();
    render(<PaymentAllocationModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("Cancelar"));
    expect(onClose).toHaveBeenCalled();
  });

  it("displays summary section when payment amount entered", async () => {
    render(<PaymentAllocationModal {...defaultProps} />);

    const amountInput = screen.getByLabelText("Monto a pagar");
    fireEvent.change(amountInput, { target: { value: "1500" } });

    await waitFor(() => {
      expect(screen.getByText("Resumen")).toBeInTheDocument();
      expect(screen.getByText("Monto del pago:")).toBeInTheDocument();
      expect(screen.getByText("Asignado a cargos:")).toBeInTheDocument();
      expect(screen.getByText("Sin asignar:")).toBeInTheDocument();
    });
  });

  it("shows empty state when no pending charges", () => {
    render(
      <PaymentAllocationModal {...defaultProps} pendingCharges={[]} />
    );

    expect(screen.getByText("No hay cargos pendientes")).toBeInTheDocument();
  });

  it("handles manual allocation exceeding remaining amount validation", async () => {
    render(<PaymentAllocationModal {...defaultProps} />);

    // Switch to manual mode
    fireEvent.click(screen.getByText("Manual"));

    // Enter payment amount
    const amountInput = screen.getByLabelText("Monto a pagar");
    fireEvent.change(amountInput, { target: { value: "2000" } });

    // Select first charge
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Wait for allocation input and enter excessive amount
    await waitFor(() => {
      const allocationInput = screen.getByPlaceholderText("Monto a asignar");
      fireEvent.change(allocationInput, { target: { value: "1500" } });
    });

    // Click confirm - should show validation error
    fireEvent.click(screen.getByText("Confirmar Pago"));

    await waitFor(() => {
      expect(screen.getByText(/excede el saldo pendiente/)).toBeInTheDocument();
    });
  });

  it("resets state when modal reopens", () => {
    const { rerender } = render(
      <PaymentAllocationModal {...defaultProps} isOpen={false} />
    );

    // Reopen modal
    rerender(<PaymentAllocationModal {...defaultProps} isOpen={true} />);

    // Form should be reset
    const amountInput = screen.getByLabelText("Monto a pagar") as HTMLInputElement;
    expect(amountInput.value).toBe("");
  });
});
