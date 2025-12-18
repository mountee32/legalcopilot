import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InvoiceCard } from "@/components/portal/invoice-card";
import type { Invoice } from "@/lib/hooks/use-portal-invoices";

const mockInvoice: Invoice = {
  invoice: {
    id: "invoice-1",
    invoiceNumber: "INV-2024-001",
    status: "sent",
    invoiceDate: "2024-01-01T00:00:00Z",
    dueDate: "2024-01-31T00:00:00Z",
    subtotal: "1000.00",
    vatAmount: "200.00",
    vatRate: "20",
    total: "1200.00",
    paidAmount: "0.00",
    balanceDue: "1200.00",
    sentAt: "2024-01-01T00:00:00Z",
    viewedAt: null,
    paidAt: null,
    createdAt: "2024-01-01T00:00:00Z",
  },
  matter: {
    id: "matter-1",
    reference: "CONV-2024-001",
    title: "Property Purchase",
  },
};

describe("InvoiceCard", () => {
  it("renders invoice number", () => {
    render(<InvoiceCard invoice={mockInvoice} />);

    expect(screen.getByText("Invoice INV-2024-001")).toBeInTheDocument();
  });

  it("renders matter reference and title", () => {
    render(<InvoiceCard invoice={mockInvoice} />);

    expect(screen.getByText(/Property Purchase \(CONV-2024-001\)/)).toBeInTheDocument();
  });

  it("renders total amount", () => {
    render(<InvoiceCard invoice={mockInvoice} />);

    expect(screen.getByText("Total Amount")).toBeInTheDocument();
    expect(screen.getAllByText("£1200.00")).toHaveLength(2); // Total and Balance Due
  });

  it("renders balance due when unpaid", () => {
    render(<InvoiceCard invoice={mockInvoice} />);

    expect(screen.getByText("Balance Due")).toBeInTheDocument();
    expect(screen.getAllByText("£1200.00")).toHaveLength(2); // Total and Balance Due
  });

  it("does not render balance due when paid", () => {
    const paidInvoice: Invoice = {
      ...mockInvoice,
      invoice: {
        ...mockInvoice.invoice,
        status: "paid",
        balanceDue: "0.00",
        paidAmount: "1200.00",
        paidAt: "2024-01-15T00:00:00Z",
      },
    };

    render(<InvoiceCard invoice={paidInvoice} />);

    expect(screen.queryByText("Balance Due")).not.toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<InvoiceCard invoice={mockInvoice} />);

    // Mock invoice has past due date, so it shows as overdue
    expect(screen.getByText("overdue")).toBeInTheDocument();
  });

  it("shows overdue status when past due date", () => {
    const overdueInvoice: Invoice = {
      ...mockInvoice,
      invoice: {
        ...mockInvoice.invoice,
        dueDate: "2020-01-01T00:00:00Z", // Past date
      },
    };

    render(<InvoiceCard invoice={overdueInvoice} />);

    expect(screen.getByText("overdue")).toBeInTheDocument();
  });

  it("renders due date", () => {
    render(<InvoiceCard invoice={mockInvoice} />);

    expect(screen.getByText(/Due 31 Jan 2024/)).toBeInTheDocument();
  });

  it("renders paid date when invoice is paid", () => {
    const paidInvoice: Invoice = {
      ...mockInvoice,
      invoice: {
        ...mockInvoice.invoice,
        status: "paid",
        paidAt: "2024-01-15T00:00:00Z",
      },
    };

    render(<InvoiceCard invoice={paidInvoice} />);

    expect(screen.getByText(/Paid/)).toBeInTheDocument();
    expect(screen.getByText(/15 Jan 2024/)).toBeInTheDocument();
  });

  it("handles missing matter gracefully", () => {
    const invoiceWithoutMatter: Invoice = {
      ...mockInvoice,
      matter: null,
    };

    render(<InvoiceCard invoice={invoiceWithoutMatter} />);

    expect(screen.getByText("Invoice INV-2024-001")).toBeInTheDocument();
  });
});
