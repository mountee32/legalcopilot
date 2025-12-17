import type { APIRequestContext } from "@playwright/test";

type DemoHealthResponse = {
  status: string;
  services: Record<string, { status: string; message?: string; details?: unknown }>;
  timestamp: string;
};

export async function requireDemoServicesHealthy(
  request: APIRequestContext,
  required: Array<keyof DemoHealthResponse["services"]>
): Promise<void> {
  const res = await request.get("/api/demo/health");
  let body: DemoHealthResponse | null = null;

  try {
    body = (await res.json()) as DemoHealthResponse;
  } catch {
    const text = await res.text();
    throw new Error(
      `Failed to read /api/demo/health response (${res.status()}): ${text.slice(0, 500)}`
    );
  }

  const unhealthy = required.filter((name) => body.services?.[name]?.status !== "healthy");
  if (unhealthy.length > 0) {
    const details = unhealthy
      .map((name) => {
        const svc = body.services[name];
        const message = svc?.message ? `: ${svc.message}` : "";
        return `${String(name)}=${svc?.status ?? "missing"}${message}`;
      })
      .join(", ");

    throw new Error(
      `Required demo services are not healthy (${res.status()} ${body.status}): ${details}`
    );
  }
}
