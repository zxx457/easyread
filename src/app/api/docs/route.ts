import { BACKEND_BASE_URL } from "@/lib/config/backend";

export async function GET(request: Request) {
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL("/api/documents", BACKEND_BASE_URL);

  for (const [key, value] of incomingUrl.searchParams.entries()) {
    targetUrl.searchParams.append(key, value);
  }

  const response = await fetch(targetUrl, { method: "GET", cache: "no-store" });
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function POST(request: Request) {
  const payload = await request.text();
  const response = await fetch(new URL("/api/documents", BACKEND_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}
