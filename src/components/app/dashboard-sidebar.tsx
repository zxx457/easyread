"use client";

import { useAtom, useAtomValue } from "jotai";
import { FileTextIcon, ImagesIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import Logo from "@/components/app/app-logo";
import Transition from "@/components/common/transition";
import { fetchCurrentUser, logout } from "@/lib/api/users";
import { useFetchedState } from "@/lib/hooks/fetch";
import { isMaxMdScreenAtom } from "@/stores/responsive";
import { isMobileSidebarOpenAtom } from "@/stores/sidebar";

export default function () {
  const router = useRouter();
  const isMobileMode = useAtomValue(isMaxMdScreenAtom);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useAtom(isMobileSidebarOpenAtom);

  useEffect(() => {
    // Prevent body scroll when mobile sidebar is shown
    const isLocked = isMobileMode && isMobileSidebarOpen;
    const scrollLockTarget = document.body;
    const classList = scrollLockTarget.classList;
    classList.toggle("!overflow-hidden", isLocked);
  }, [isMobileMode, isMobileSidebarOpen]);

  const [user, _] = useFetchedState(undefined, fetchCurrentUser, []);
  const onNavLinkClick = () => isMobileMode && setIsMobileSidebarOpen(false);

  return (
    <>
      <Transition
        show={isMobileSidebarOpen}
        className="fixed inset-0 z-20 md:hidden"
        type="transition-[background-color]"
        before="hidden"
        start="bg-transparent"
        end="bg-black/75"
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      <Transition
        show={isMobileSidebarOpen}
        className="fixed inset-y-0 left-0 z-20 overflow-hidden md:contents [&>*]:h-full"
        type="transition-[width]"
        before="hidden"
        start="w-0"
        end="w-[var(--sidebar-width)]"
      >
        <aside className="bg-sidebar text-sidebar-foreground flex w-[var(--sidebar-width)] flex-col overflow-hidden">
          <div className="border-sidebar-border grid h-[var(--header-height)] place-items-center border-b">
            <Logo className="-ml-4" />
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <nav className="flex flex-col">
              <label className="px-4 text-sm/12">Main</label>
              <Button
                variant="ghost"
                size="lg"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 justify-start gap-3 text-base"
                asChild
              >
                <Link href="/docs" onClick={onNavLinkClick}>
                  <FileTextIcon />
                  <span>Documents</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 justify-start gap-3 text-base"
                asChild
              >
                <Link href="/library" onClick={onNavLinkClick}>
                  <ImagesIcon />
                  <span>Library</span>
                </Link>
              </Button>
            </nav>
            <nav className="flex flex-col">
              <label className="px-4 text-sm/12">Account</label>
              <Button
                variant="ghost"
                size="lg"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 justify-start gap-3 text-base"
                asChild
              >
                <Link href="/settings" onClick={onNavLinkClick}>
                  <SettingsIcon />
                  <span>Settings</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 justify-start gap-3 text-base"
                onClick={async () => {
                  try {
                    await logout();
                    onNavLinkClick();
                    router.push("/");
                    router.refresh();
                  } catch {
                    toast.error("Failed to logout");
                  }
                }}
              >
                <LogOutIcon />
                <span>Logout</span>
              </Button>
            </nav>
          </div>
          <div className="border-sidebar-border flex h-16 items-center gap-4 border-t pr-4 pl-6">
            {user && (
              <>
                <img src={user.avatar} className="size-9.5 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5 overflow-hidden text-left">
                  <span className="truncate text-[calc(4rem/5)]/none">{user.displayName}</span>
                  <span className="truncate text-[calc(2rem/3)]/none">{user.email}</span>
                </div>
              </>
            )}
          </div>
        </aside>
      </Transition>
    </>
  );
}
