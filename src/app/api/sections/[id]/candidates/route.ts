import { BACKEND_BASE_URL } from "@/lib/config/backend";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await fetch(new URL(`/api/sections/${id}/candidates`, BACKEND_BASE_URL), {
    method: "GET",
    cache: "no-store",
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.text();

  const response = await fetch(new URL(`/api/sections/${id}/candidates`, BACKEND_BASE_URL), {
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
