"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "ai/react";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare, Plus, Send, Loader2, Sparkles } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  title: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: unknown;
  createdAt: string;
}

interface CaseChatPanelProps {
  matterId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

async function fetchConversations(matterId: string): Promise<Conversation[]> {
  const res = await fetch(`/api/matters/${matterId}/ai/chat/history`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations || [];
}

async function fetchConversationMessages(
  matterId: string,
  conversationId: string
): Promise<StoredMessage[]> {
  const res = await fetch(`/api/matters/${matterId}/ai/chat/${conversationId}`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages || [];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CaseChatPanel({ matterId, open, onOpenChange }: CaseChatPanelProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "chat">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversation list
  const {
    data: conversations,
    isLoading: listLoading,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["case-chat-conversations", matterId],
    queryFn: () => fetchConversations(matterId),
    enabled: open,
    staleTime: 10_000,
  });

  // Fetch messages for active conversation
  const { data: storedMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["case-chat-messages", matterId, activeConversationId],
    queryFn: () => fetchConversationMessages(matterId, activeConversationId!),
    enabled: !!activeConversationId && view === "chat",
    staleTime: 5_000,
  });

  // Vercel AI SDK useChat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isStreaming,
    setMessages,
  } = useChat({
    api: `/api/matters/${matterId}/ai/chat`,
    body: { conversationId: activeConversationId },
    onResponse: (response) => {
      // Capture conversationId from new conversation
      const newConvId = response.headers.get("X-Conversation-Id");
      if (newConvId && !activeConversationId) {
        setActiveConversationId(newConvId);
      }
    },
    onFinish: () => {
      refetchConversations();
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load stored messages when opening a conversation
  useEffect(() => {
    if (storedMessages && storedMessages.length > 0) {
      setMessages(
        storedMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      );
    }
  }, [storedMessages, setMessages]);

  // Focus input when entering chat view
  useEffect(() => {
    if (view === "chat" && open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [view, open]);

  // Reset view when closing
  useEffect(() => {
    if (!open) {
      // Delay reset to allow close animation
      const timer = setTimeout(() => {
        setView("list");
        setActiveConversationId(null);
        setMessages([]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, setMessages]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setView("chat");
  }, [setMessages]);

  const handleOpenConversation = useCallback((conv: Conversation) => {
    setActiveConversationId(conv.id);
    setView("chat");
  }, []);

  const handleBackToList = useCallback(() => {
    setView("list");
    setActiveConversationId(null);
    setMessages([]);
    refetchConversations();
  }, [setMessages, refetchConversations]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 flex flex-col">
        {view === "list" ? (
          <>
            <SheetHeader className="p-4 pb-2 border-b">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Case Chat
              </SheetTitle>
              <SheetDescription>
                Ask questions about this case. AI will use documents, findings, and case data to
                answer.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <Button
                onClick={handleNewConversation}
                className="w-full justify-start"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                New conversation
              </Button>

              {listLoading ? (
                <div className="space-y-2 mt-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Previous conversations
                  </p>
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleOpenConversation(conv)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {conv.title || "Untitled conversation"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {conv.messageCount} messages
                        {conv.lastMessageAt &&
                          ` \u00b7 ${new Date(conv.lastMessageAt).toLocaleDateString()}`}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-8 text-center text-sm text-slate-500">
                  <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p>No conversations yet.</p>
                  <p>Start a new one to ask AI about this case.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Chat view header */}
            <div className="flex items-center gap-2 p-4 border-b">
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {activeConversationId
                    ? conversations?.find((c) => c.id === activeConversationId)?.title ||
                      "Conversation"
                    : "New conversation"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-slate-500">AI</span>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-3/4" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-10 w-10 text-blue-200 mb-3" />
                  <p className="text-sm font-medium text-slate-700">
                    Ask me anything about this case
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                    I can reference documents, findings, timeline events, and case details to help
                    you.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  </div>
                ))
              )}

              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about this case..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 max-h-32"
                  style={{ minHeight: "40px" }}
                  disabled={isStreaming}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isStreaming}
                  className="h-10 w-10 p-0 shrink-0"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
