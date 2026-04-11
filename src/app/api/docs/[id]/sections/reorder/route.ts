import { BACKEND_BASE_URL } from "@/lib/config/backend";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.text();

  const response = await fetch(new URL(`/api/documents/${id}/sections/reorder`, BACKEND_BASE_URL), {
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
