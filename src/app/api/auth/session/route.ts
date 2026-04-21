import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;

  return new Response(JSON.stringify({ isAuthenticated }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
