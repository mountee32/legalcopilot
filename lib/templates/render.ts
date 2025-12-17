type RenderResult = {
  content: string;
  missing: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getPath(data: Record<string, unknown>, path: string): { ok: boolean; value?: unknown } {
  if (path === "today") {
    const d = new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return { ok: true, value: `${yyyy}-${mm}-${dd}` };
  }

  const parts = path.split(".").filter(Boolean);
  let cur: unknown = data;
  for (const part of parts) {
    if (!isRecord(cur)) return { ok: false };
    if (!(part in cur)) return { ok: false };
    cur = cur[part];
  }
  return { ok: true, value: cur };
}

function toStringValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function renderTemplate(content: string, data: Record<string, unknown>): RenderResult {
  const missing: string[] = [];
  const seen = new Set<string>();

  const rendered = content.replace(/\{\{\s*([a-zA-Z0-9_.-]{1,100})\s*\}\}/g, (_m, raw) => {
    const key = String(raw);
    const { ok, value } = getPath(data, key);
    if (!ok) {
      if (!seen.has(key)) {
        missing.push(key);
        seen.add(key);
      }
      return `{{${key}}}`;
    }
    return toStringValue(value);
  });

  return { content: rendered, missing };
}
