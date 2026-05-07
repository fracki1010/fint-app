import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VoucherSelector } from "./VoucherSelector";
import { VoucherType } from "../types/voucher";
import * as voucherUtils from "../utils/voucherUtils";

// Mock the tooltip component
vi.mock("@heroui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("VoucherSelector", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders all three voucher type checkboxes", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pendiente"
      />
    );

    expect(screen.getByText("Factura")).toBeInTheDocument();
    expect(screen.getByText("Remito")).toBeInTheDocument();
    expect(screen.getByText("Recibo")).toBeInTheDocument();
  });

  it("renders with correct labels and descriptions", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pendiente"
      />
    );

    expect(screen.getByText("Generar comprobantes")).toBeInTheDocument();
    expect(screen.getByText("Documento fiscal con datos completos del cliente y negocio")).toBeInTheDocument();
    expect(screen.getByText("Comprobante de entrega con cantidades (sin precios)")).toBeInTheDocument();
    expect(screen.getByText("Comprobante de pago - solo para órdenes pagadas")).toBeInTheDocument();
  });

  it("disables receipt checkbox when order is not paid", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pendiente"
      />
    );

    const receiptElement = screen.getByText("Recibo").closest("[class*='cursor-not-allowed']");
    expect(receiptElement).toBeInTheDocument();
    expect(screen.getByText("Solo disponible para órdenes pagadas")).toBeInTheDocument();
  });

  it("enables receipt checkbox when order is paid", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    const receiptWarning = screen.queryByText("Solo disponible para órdenes pagadas");
    expect(receiptWarning).not.toBeInTheDocument();
  });

  it("calls onChange when clicking on a voucher type", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pendiente"
      />
    );

    const invoiceCheckbox = screen.getByText("Factura").closest("[class*='cursor-pointer']");
    fireEvent.click(invoiceCheckbox!);

    expect(mockOnChange).toHaveBeenCalledWith(["invoice"]);
  });

  it("calls onChange with selected types when toggling", () => {
    const { rerender } = render(
      <VoucherSelector
        selectedTypes={["invoice"]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    // Click on delivery_note to add it
    const deliveryNoteCheckbox = screen.getByText("Remito").closest("[class*='cursor-pointer']");
    fireEvent.click(deliveryNoteCheckbox!);

    expect(mockOnChange).toHaveBeenCalledWith(["invoice", "delivery_note"]);

    // Rerender with updated selection
    rerender(
      <VoucherSelector
        selectedTypes={["invoice", "delivery_note"]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    // Click on invoice to remove it
    mockOnChange.mockClear();
    const invoiceCheckbox = screen.getByText("Factura").closest("[class*='cursor-pointer']");
    fireEvent.click(invoiceCheckbox!);

    expect(mockOnChange).toHaveBeenCalledWith(["delivery_note"]);
  });

  it("does not call onChange when clicking disabled receipt for unpaid order", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pendiente"
      />
    );

    const receiptCheckbox = screen.getByText("Recibo").closest("[class*='cursor-not-allowed']");
    fireEvent.click(receiptCheckbox!);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("disables all checkboxes when disabled prop is true", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
        disabled={true}
      />
    );

    // All checkboxes should have disabled styling
    const checkboxes = screen.getAllByText(/Factura|Remito|Recibo/);
    checkboxes.forEach((checkbox) => {
      const parent = checkbox.closest("[class*='cursor-not-allowed']");
      expect(parent).toBeInTheDocument();
    });
  });

  it("shows selected count in header", () => {
    render(
      <VoucherSelector
        selectedTypes={["invoice", "delivery_note"]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    expect(screen.getByText("2 seleccionado(s)")).toBeInTheDocument();
  });

  it("shows selected badge on selected items", () => {
    render(
      <VoucherSelector
        selectedTypes={["invoice"]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    expect(screen.getByText("Seleccionado")).toBeInTheDocument();
  });

  it("shows empty state message when no vouchers selected", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    expect(screen.getByText("No se generarán comprobantes para esta venta")).toBeInTheDocument();
  });

  it("allows selecting receipt when payment status is Pagado", () => {
    render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    const receiptCheckbox = screen.getByText("Recibo").closest("[class*='cursor-pointer']");
    fireEvent.click(receiptCheckbox!);

    expect(mockOnChange).toHaveBeenCalledWith(["receipt"]);
  });

  it("syncs local state when props change", () => {
    const { rerender } = render(
      <VoucherSelector
        selectedTypes={["invoice"]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    expect(screen.getByText("1 seleccionado(s)")).toBeInTheDocument();

    rerender(
      <VoucherSelector
        selectedTypes={["invoice", "delivery_note", "receipt"]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
      />
    );

    expect(screen.getByText("3 seleccionado(s)")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <VoucherSelector
        selectedTypes={[]}
        onChange={mockOnChange}
        paymentStatus="Pagado"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
