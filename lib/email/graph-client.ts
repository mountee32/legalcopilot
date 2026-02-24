/**
 * Microsoft Graph Email Client
 *
 * Fetches emails from connected Microsoft accounts via the Graph API.
 * Handles token refresh, pagination, rate limiting, and auth error marking.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailAccounts } from "@/lib/db/schema";
import type { EmailAccount } from "@/lib/db/schema";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const MS_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MAX_RETRIES = 3;
const MAX_MESSAGES_PER_POLL = 50;
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GraphMessage {
  id: string;
  internetMessageId: string;
  conversationId: string;
  from: { emailAddress: { name: string; address: string } };
  subject: string;
  receivedDateTime: string;
  bodyPreview: string;
  body: { contentType: string; content: string };
  hasAttachments: boolean;
  isRead: boolean;
}

export interface GraphAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes: string; // base64
  isInline: boolean;
}

interface TokenPayload {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

/**
 * Refresh OAuth token if expired or about to expire (within 5 minutes).
 * Updates the DB with new tokens. Returns the current access token.
 */
export async function refreshTokenIfNeeded(account: EmailAccount): Promise<string> {
  const tokens = account.tokens as {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  } | null;

  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new AuthError("No tokens available for account");
  }

  // Check if token expires within 5 minutes
  const expiresAt = tokens.expires_at || 0;
  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;

  if (expiresAt > fiveMinutesFromNow) {
    return tokens.access_token;
  }

  // Refresh the token
  const body = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID || "",
    client_secret: process.env.MS_CLIENT_SECRET || "",
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token",
    scope: "https://graph.microsoft.com/.default offline_access",
  });

  const res = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new AuthError(`Token refresh failed: ${res.status} ${errorBody}`);
  }

  const data = (await res.json()) as TokenPayload;

  const newTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  await db
    .update(emailAccounts)
    .set({ tokens: newTokens, updatedAt: new Date() })
    .where(eq(emailAccounts.id, account.id));

  return data.access_token;
}

// ---------------------------------------------------------------------------
// Graph API calls
// ---------------------------------------------------------------------------

/**
 * Fetch new messages since a given date. Handles pagination up to MAX_MESSAGES_PER_POLL.
 */
export async function fetchNewMessages(
  account: EmailAccount,
  since: Date
): Promise<GraphMessage[]> {
  const accessToken = await refreshTokenIfNeeded(account);
  const sinceISO = since.toISOString();

  const messages: GraphMessage[] = [];
  let url: string | null =
    `${GRAPH_BASE}/me/messages?$filter=receivedDateTime ge ${sinceISO}&$orderby=receivedDateTime asc&$top=25&$select=id,internetMessageId,conversationId,from,subject,receivedDateTime,bodyPreview,body,hasAttachments,isRead`;

  while (url && messages.length < MAX_MESSAGES_PER_POLL) {
    const res = await graphFetchWithRetry(url, accessToken, account);
    const data = await res.json();

    const batch = (data.value || []) as GraphMessage[];
    messages.push(...batch);

    url = data["@odata.nextLink"] || null;
  }

  return messages.slice(0, MAX_MESSAGES_PER_POLL);
}

/**
 * Fetch file attachments for a message. Filters out inline and oversized attachments.
 */
export async function fetchAttachments(
  account: EmailAccount,
  messageId: string
): Promise<GraphAttachment[]> {
  const accessToken = await refreshTokenIfNeeded(account);
  const url = `${GRAPH_BASE}/me/messages/${messageId}/attachments?$select=id,name,contentType,size,contentBytes,isInline`;

  const res = await graphFetchWithRetry(url, accessToken, account);
  const data = await res.json();

  return ((data.value || []) as GraphAttachment[]).filter(
    (att) => !att.isInline && att.size <= MAX_ATTACHMENT_SIZE && att.contentBytes
  );
}

/**
 * Mark a message as read.
 */
export async function markAsRead(account: EmailAccount, messageId: string): Promise<void> {
  const accessToken = await refreshTokenIfNeeded(account);
  const url = `${GRAPH_BASE}/me/messages/${messageId}`;

  await graphFetchWithRetry(url, accessToken, account, "PATCH", JSON.stringify({ isRead: true }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function graphFetchWithRetry(
  url: string,
  accessToken: string,
  account: EmailAccount,
  method: string = "GET",
  body?: string
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (res.ok) return res;

    if (res.status === 401) {
      await markAccountError(account.id);
      throw new AuthError(`Graph API 401: account ${account.id} marked as error`);
    }

    if (res.status === 429 || res.status === 503) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "0", 10);
      const delay = Math.max(retryAfter * 1000, 1000 * Math.pow(2, attempt));
      await sleep(delay);
      lastError = new Error(`Graph API ${res.status} (attempt ${attempt + 1})`);
      continue;
    }

    const errorText = await res.text();
    throw new Error(`Graph API error ${res.status}: ${errorText}`);
  }

  throw lastError || new Error("Graph API request failed after retries");
}

async function markAccountError(accountId: string): Promise<void> {
  await db
    .update(emailAccounts)
    .set({ status: "error", updatedAt: new Date() })
    .where(eq(emailAccounts.id, accountId));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Send email via Graph API
// ---------------------------------------------------------------------------

export interface GraphSendMessage {
  subject: string;
  body: { contentType: "HTML" | "Text"; content: string };
  toRecipients: Array<{ emailAddress: { name?: string; address: string } }>;
  ccRecipients?: Array<{ emailAddress: { name?: string; address: string } }>;
  bccRecipients?: Array<{ emailAddress: { name?: string; address: string } }>;
  /** Include the original email's internetMessageId for reply threading. */
  internetMessageId?: string;
}

/**
 * Send an email via Graph API. Returns void — Graph returns 202 Accepted with no body.
 * For replies, set `message.internetMessageId` to the original email's messageId so
 * Graph threads it correctly (sends as In-Reply-To header).
 */
export async function sendEmail(account: EmailAccount, message: GraphSendMessage): Promise<void> {
  const accessToken = await refreshTokenIfNeeded(account);
  const url = `${GRAPH_BASE}/me/sendMail`;

  const graphPayload: Record<string, unknown> = {
    message: {
      subject: message.subject,
      body: message.body,
      toRecipients: message.toRecipients,
      ccRecipients: message.ccRecipients || [],
      bccRecipients: message.bccRecipients || [],
    },
    saveToSentItems: true,
  };

  // For reply threading, set the conversationId / In-Reply-To header
  if (message.internetMessageId) {
    (graphPayload.message as Record<string, unknown>).internetMessageHeaders = [
      { name: "In-Reply-To", value: message.internetMessageId },
    ];
  }

  const res = await graphFetchWithRetry(
    url,
    accessToken,
    account,
    "POST",
    JSON.stringify(graphPayload)
  );

  // Graph sendMail returns 202 Accepted with no body on success
  if (res.status !== 202 && !res.ok) {
    const errorText = await res.text();
    throw new Error(`Graph sendMail failed: ${res.status} ${errorText}`);
  }
}

// ---------------------------------------------------------------------------
// Custom errors
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
