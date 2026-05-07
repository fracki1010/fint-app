import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VoucherList } from "./VoucherList";
import { Voucher, VoucherType, VoucherStatus } from "../types/voucher";

// Mock the hooks
const mockShowToast = vi.fn();
const mockVoidVoucher = vi.fn();
const mockDownloadVoucher = vi.fn();

vi.mock("../hooks/useVouchers", () => ({
  useVoidVoucher: () => ({
    voidVoucher: mockVoidVoucher,
    isVoiding: false,
  }),
  useDownloadVoucher: () => ({
    downloadVoucher: mockDownloadVoucher,
  }),
}));

vi.mock("@features/notifications/components/AppToast", () => ({
  useAppToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock the modal components
vi.mock("@heroui/modal", () => ({
  Modal: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => 
    isOpen ? <div data-testid="modal">{children}</div> : null,
  ModalContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@heroui/button", () => ({
  Button: ({ children, onPress, isDisabled }: any) => (
    <button onClick={onPress} disabled={isDisabled}>{children}</button>
  ),
}));

vi.mock("@heroui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

const createMockVoucher = (overrides: Partial<Voucher> = {}): Voucher => ({
  _id: "voucher-1",
  order: "order-1",
  type: "invoice" as VoucherType,
  number: "F-000042",
  sequentialNumber: 42,
  filePath: "/path/to/file.pdf",
  fileUrl: "/api/vouchers/download/voucher-1",
  status: "active" as VoucherStatus,
  createdBy: "user-1",
  createdAt: "2026-01-15T10:00:00.000Z",
  updatedAt: "2026-01-15T10:00:00.000Z",
  ...overrides,
});

describe("VoucherList", () => {
  beforeEach(() => {
    mockShowToast.mockClear();
    mockVoidVoucher.mockClear();
    mockDownloadVoucher.mockClear();
  });

  it("renders empty state when no vouchers", () => {
    render(<VoucherList vouchers={[]} />);

    expect(screen.getByText("No hay comprobantes generados")).toBeInTheDocument();
  });

  it("renders empty state with order hint when orderId provided", () => {
    render(<VoucherList vouchers={[]} orderId="order-1" />);

    expect(screen.getByText("Los comprobantes aparecerán aquí una vez generados")).toBeInTheDocument();
  });

  it("renders list of vouchers", () => {
    const vouchers = [
      createMockVoucher({ _id: "v1", type: "invoice", number: "F-000001" }),
      createMockVoucher({ _id: "v2", type: "delivery_note", number: "R-000002" }),
    ];

    render(<VoucherList vouchers={vouchers} />);

    expect(screen.getByText("F-000001")).toBeInTheDocument();
    expect(screen.getByText("R-000002")).toBeInTheDocument();
  });

  it("shows correct status badges", () => {
    const vouchers = [
      createMockVoucher({ _id: "v1", status: "active" }),
      createMockVoucher({ _id: "v2", status: "voided", voidReason: "Error" }),
    ];

    render(<VoucherList vouchers={vouchers} />);

    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("Anulado")).toBeInTheDocument();
  });

  it("shows void reason for voided vouchers", () => {
    const vouchers = [
      createMockVoucher({ 
        _id: "v1", 
        status: "voided", 
        voidReason: "Error en datos del cliente" 
      }),
    ];

    render(<VoucherList vouchers={vouchers} />);

    expect(screen.getByText(/Motivo: Error en datos del cliente/)).toBeInTheDocument();
  });

  it("opens void modal when clicking void button", () => {
    const vouchers = [createMockVoucher()];

    render(<VoucherList vouchers={vouchers} />);

    const voidButton = screen.getByTitle("Anular comprobante");
    fireEvent.click(voidButton);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText(/Anular comprobante/)).toBeInTheDocument();
    expect(screen.getByText(/F-000042/)).toBeInTheDocument();
  });

  it("calls download when clicking download button", async () => {
    mockDownloadVoucher.mockResolvedValue(undefined);
    const vouchers = [createMockVoucher()];

    render(<VoucherList vouchers={vouchers} />);

    const downloadButton = screen.getByTitle("Descargar PDF");
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockDownloadVoucher).toHaveBeenCalledWith("voucher-1", "F-000042.pdf");
    });
  });

  it("shows success toast after download", async () => {
    mockDownloadVoucher.mockResolvedValue(undefined);
    const vouchers = [createMockVoucher()];

    render(<VoucherList vouchers={vouchers} />);

    const downloadButton = screen.getByTitle("Descargar PDF");
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        variant: "success",
        message: "Descargando F-000042",
      });
    });
  });

  it("shows error toast when download fails", async () => {
    mockDownloadVoucher.mockRejectedValue(new Error("Network error"));
    const vouchers = [createMockVoucher()];

    render(<VoucherList vouchers={vouchers} />);

    const downloadButton = screen.getByTitle("Descargar PDF");
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        variant: "error",
        message: expect.stringContaining("No se pudo descargar"),
      });
    });
  });

  it("hides void button for already voided vouchers", () => {
    const vouchers = [createMockVoucher({ status: "voided" })];

    render(<VoucherList vouchers={vouchers} />);

    const voidButton = screen.queryByTitle("Anular comprobante");
    expect(voidButton).not.toBeInTheDocument();
  });

  it("displays formatted dates", () => {
    const vouchers = [createMockVoucher({ createdAt: "2026-01-15T10:30:00.000Z" })];

    render(<VoucherList vouchers={vouchers} />);

    // Date should be formatted as DD/MM/YYYY
    expect(screen.getByText(/15\/01\/2026/)).toBeInTheDocument();
  });

  it("calls onVoucherVoided callback after successful void", async () => {
    mockVoidVoucher.mockResolvedValue({ voucher: createMockVoucher({ status: "voided" }) });
    const mockOnVoided = vi.fn();
    const vouchers = [createMockVoucher()];

    render(<VoucherList vouchers={vouchers} onVoucherVoided={mockOnVoided} />);

    // Open void modal
    const voidButton = screen.getByTitle("Anular comprobante");
    fireEvent.click(voidButton);

    // Enter reason
    const reasonInput = screen.getByPlaceholderText(/Ej: Error en datos/);
    fireEvent.change(reasonInput, { target: { value: "Test reason" } });

    // Confirm void
    const confirmButton = screen.getByText("Anular comprobante");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnVoided).toHaveBeenCalled();
    });
  });

  it("sorts vouchers by type (invoice first, then delivery_note, then receipt)", () => {
    const vouchers = [
      createMockVoucher({ _id: "v1", type: "receipt", number: "D-000001" }),
      createMockVoucher({ _id: "v2", type: "invoice", number: "F-000001" }),
      createMockVoucher({ _id: "v3", type: "delivery_note", number: "R-000001" }),
    ];

    render(<VoucherList vouchers={vouchers} />);

    const voucherNumbers = screen.getAllByText(/F-000001|R-000001|D-000001/);
    expect(voucherNumbers[0]).toHaveTextContent("F-000001");
    expect(voucherNumbers[1]).toHaveTextContent("R-000001");
    expect(voucherNumbers[2]).toHaveTextContent("D-000001");
  });

  it("applies custom className", () => {
    const vouchers = [createMockVoucher()];
    const { container } = render(<VoucherList vouchers={vouchers} className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
