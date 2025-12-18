import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Receipt } from "lucide-react";
import { format } from "date-fns";
import type { Invoice } from "@/lib/hooks/use-portal-invoices";

interface InvoiceCardProps {
  invoice: Invoice;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  viewed: "bg-yellow-500",
  paid: "bg-green-500",
  overdue: "bg-red-500",
  void: "bg-gray-400",
};

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const statusColor = statusColors[invoice.invoice.status] || "bg-blue-500";
  const isOverdue =
    invoice.invoice.status !== "paid" &&
    invoice.invoice.status !== "void" &&
    new Date(invoice.invoice.dueDate) < new Date();

  const actualStatus = isOverdue ? "overdue" : invoice.invoice.status;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Invoice {invoice.invoice.invoiceNumber}</CardTitle>
            <CardDescription className="text-xs">
              {invoice.matter && `${invoice.matter.title} (${invoice.matter.reference})`}
            </CardDescription>
          </div>
          <Badge variant="secondary" className={`${statusColor} text-white capitalize`}>
            {actualStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-lg font-bold">£{invoice.invoice.total}</span>
          </div>

          {parseFloat(invoice.invoice.balanceDue) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance Due</span>
              <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                £{invoice.invoice.balanceDue}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Due {format(new Date(invoice.invoice.dueDate), "dd MMM yyyy")}</span>
            </div>

            {invoice.invoice.paidAt && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Receipt className="h-3 w-3" />
                <span>Paid {format(new Date(invoice.invoice.paidAt), "dd MMM yyyy")}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
