import { AUTH_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const response = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  response.headers.append("Set-Cookie", `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return response;
}
