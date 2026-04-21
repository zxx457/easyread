import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Header from "@/components/app/dashboard-header";
import Sidebar from "@/components/app/dashboard-sidebar";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE } from "@/lib/auth/session";

export default async function ({ children, breadcrumbs }: { children: React.ReactNode; breadcrumbs: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;
  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <div className="flex h-screen items-stretch overflow-hidden max-md:contents">
      <Sidebar />
      <div className="flex-1 overflow-y-auto max-md:contents">
        <header className="bg-background text-foreground sticky top-0 z-10 h-[var(--header-height)] border-b">
          <Header breadcrumbs={breadcrumbs} />
        </header>
        {children}
      </div>
    </div>
  );
}
