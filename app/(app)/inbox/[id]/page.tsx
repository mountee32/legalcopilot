"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Sparkles, CheckCircle, XCircle, Edit, Mail, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";

interface EmailDetail {
  id: string;
  fromAddress: { email: string; name?: string };
  toAddresses: Array<{ email: string; name?: string }>;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  aiSummary: string | null;
  aiIntent: string | null;
  aiSentiment: string | null;
  aiUrgency: number | null;
  aiSuggestedResponse: string | null;
  aiSuggestedTasks: string[] | null;
  aiMatchConfidence: number | null;
  matterId: string | null;
  createdAt: string;
  status: string;
}

export default function EmailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftResponse, setDraftResponse] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEmail(params.id as string);
    }
  }, [params.id]);

  const fetchEmail = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/emails/${id}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch email");

      const data = await res.json();
      setEmail(data);
      setDraftResponse(data.aiSuggestedResponse || "");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAndSend = async () => {
    if (!email) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/emails/${email.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          response: draftResponse,
        }),
      });

      if (!res.ok) throw new Error("Failed to send email");

      toast({
        title: "Email sent",
        description: "Your response has been sent successfully",
      });

      router.push("/inbox");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-8" />
          <Card className="p-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6 md:p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Email not found</h2>
          <Button onClick={() => router.push("/inbox")}>Back to Inbox</Button>
        </div>
      </div>
    );
  }

  const confidence = email.aiMatchConfidence || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/inbox")} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Inbox
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Original Email */}
          <div>
            <Card className="overflow-hidden">
              <div className="bg-slate-900 text-white p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Mail className="h-5 w-5 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold mb-2">Original Email</h2>
                    <p className="text-slate-300 text-sm">{formatDate(email.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">FROM</div>
                  <div className="text-sm font-medium text-slate-900">
                    {email.fromAddress.name || email.fromAddress.email}
                  </div>
                  <div className="text-xs text-slate-600">{email.fromAddress.email}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">TO</div>
                  {email.toAddresses.map((addr, idx) => (
                    <div key={idx} className="text-sm text-slate-900">
                      {addr.name || addr.email}
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">SUBJECT</div>
                  <div className="text-sm font-semibold text-slate-900">{email.subject}</div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                      {email.bodyText || "No content"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Analysis */}
            {email.aiSummary && (
              <Card className="mt-4 border-blue-200 bg-blue-50/50">
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">AI Analysis</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{email.aiSummary}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {email.aiIntent && (
                      <Badge variant="outline" className="bg-white">
                        Intent: {email.aiIntent.replace("_", " ")}
                      </Badge>
                    )}
                    {email.aiSentiment && (
                      <Badge variant="outline" className="bg-white">
                        Sentiment: {email.aiSentiment}
                      </Badge>
                    )}
                    {confidence >= 70 && (
                      <Badge
                        variant="outline"
                        className={
                          confidence >= 90
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                        }
                      >
                        {confidence}% match confidence
                      </Badge>
                    )}
                  </div>

                  {email.aiSuggestedTasks && email.aiSuggestedTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h4 className="text-xs font-semibold text-slate-700 mb-2">SUGGESTED TASKS</h4>
                      <ul className="space-y-1">
                        {email.aiSuggestedTasks.map((task, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* AI Draft Response */}
          <div>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="h-5 w-5 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold mb-2">AI Draft Response</h2>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-blue-100 text-sm">
                        {isEditing ? "Editing draft" : "Generated by AI"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-white hover:bg-white/20"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? "Done" : "Edit"}
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {isEditing ? (
                  <Textarea
                    value={draftResponse}
                    onChange={(e) => setDraftResponse(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                      {draftResponse || "No draft response available"}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <Button
                  onClick={handleApproveAndSend}
                  disabled={!draftResponse || isSending}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSending ? "Sending..." : "Approve & Send"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/inbox")} className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Discard
                </Button>
              </div>
            </Card>

            {/* Confidence Meter */}
            {confidence > 0 && (
              <Card className="mt-4">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">AI Confidence</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Draft quality</span>
                      <span className="font-bold text-slate-900">{confidence}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          confidence >= 90
                            ? "bg-gradient-to-r from-emerald-500 to-green-500"
                            : confidence >= 70
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                              : "bg-gradient-to-r from-amber-500 to-orange-500"
                        }`}
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {confidence >= 90
                        ? "High confidence - this draft is ready to send with minimal edits"
                        : confidence >= 70
                          ? "Good confidence - review and make any necessary adjustments"
                          : "Lower confidence - review carefully before sending"}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
