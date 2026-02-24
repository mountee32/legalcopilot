"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";

interface Quote {
  id: string;
  leadId: string;
  type: string | null;
  status: string;
  total: number;
  validUntil: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-orange-100 text-orange-700 border-orange-200",
  converted: "bg-purple-100 text-purple-700 border-purple-200",
};

const statusIcons: Record<string, any> = {
  draft: Clock,
  sent: FileText,
  accepted: CheckCircle,
  rejected: XCircle,
  expired: Clock,
  converted: CheckCircle,
};

export default function QuotesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/quotes", { credentials: "include" });

      if (!res.ok) throw new Error("Failed to fetch quotes");

      const data = await res.json();
      setQuotes(data.quotes || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Quotes</h1>
              <p className="text-slate-600 text-lg">Manage fee proposals and estimates</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchQuotes} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => router.push("/quotes/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                New Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Quotes List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </>
          ) : quotes.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No quotes yet</h3>
              <p className="text-slate-600 mb-4">
                Create your first quote to provide fee estimates to leads
              </p>
              <Button onClick={() => router.push("/quotes/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Quote
              </Button>
            </Card>
          ) : (
            quotes.map((quote) => {
              const StatusIcon = statusIcons[quote.status] || FileText;

              return (
                <Card
                  key={quote.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <StatusIcon className="h-5 w-5 text-slate-400" />
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            Quote #{quote.id.slice(0, 8)}
                          </h3>
                          <Badge variant="outline" className={statusColors[quote.status] || ""}>
                            {quote.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          {quote.type && (
                            <div className="capitalize">{quote.type.replace("_", " ")}</div>
                          )}
                          <div>Created {formatDate(quote.createdAt)}</div>
                          {quote.validUntil && (
                            <div>Valid until {formatDate(quote.validUntil)}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                          {formatCurrency(quote.total)}
                        </div>
                        <div className="text-sm text-slate-600">Total</div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
