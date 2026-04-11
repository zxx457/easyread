import { BACKEND_BASE_URL } from "@/lib/config/backend";

export async function POST(request: Request) {
  const formData = await request.formData();
  const response = await fetch(new URL("/api/upload", BACKEND_BASE_URL), {
    method: "POST",
    body: formData,
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}
