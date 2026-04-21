import { mockCredentials } from "@/app/api/(mock)/users";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from "@/lib/auth/session";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (email !== mockCredentials.email || password !== mockCredentials.password) {
    return new Response(JSON.stringify({ message: "Invalid email or password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  response.headers.append(
    "Set-Cookie",
    `${AUTH_COOKIE_NAME}=${AUTH_COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
  );
  return response;
}
