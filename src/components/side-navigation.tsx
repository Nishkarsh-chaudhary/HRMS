"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Building2, Menu, X } from "lucide-react";
import { getNavigation, type NavigationArea } from "@/lib/navigation";
import type { Role } from "@/lib/constants";
import { UserMenu } from "@/components/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavigationProfile = {
  full_name: string;
  email: string;
  role: Role;
  avatar_url: string | null;
};

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && href !== "/portal" && href !== "/employee" && pathname.startsWith(`${href}/`));
}

function NavigationContent({
  profile,
  area,
  onNavigate,
}: {
  profile: NavigationProfile;
  area: NavigationArea;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = getNavigation(profile.role, area);

  return (
    <>
      <div className="flex h-[72px] items-center gap-3 border-b border-sidebar-border px-7">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/40">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-[17px] font-bold tracking-tight text-foreground">HRMS</span>
          <span className="text-[11px] font-medium text-sidebar-foreground">Human Resources</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/70">
          Menu
        </p>
        <nav aria-label="Main navigation" className="space-y-1">
          {items.map((item) => {
            const active = isCurrentPath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active ? "text-primary" : "text-sidebar-foreground/80 group-hover:text-foreground"
                  )}
                />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <UserMenu
          compact
          fullName={profile.full_name}
          email={profile.email}
          role={profile.role}
          avatarUrl={profile.avatar_url}
        />
      </div>
    </>
  );
}

export function DesktopSideNavigation({
  profile,
  area,
}: {
  profile: NavigationProfile;
  area: NavigationArea;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-sidebar lg:flex">
      <NavigationContent profile={profile} area={area} />
    </aside>
  );
}

export function MobileSideNavigation({
  profile,
  area,
}: {
  profile: NavigationProfile;
  area: NavigationArea;
}) {
  const pathname = usePathname();
  const drawerToggleRef = useRef<HTMLInputElement>(null);
  const openDrawer = () => {
    if (drawerToggleRef.current) drawerToggleRef.current.checked = true;
    document.body.style.overflow = "hidden";
  };
  const closeDrawer = () => {
    if (drawerToggleRef.current) drawerToggleRef.current.checked = false;
    document.body.style.overflow = "";
  };

  useLayoutEffect(() => {
    closeDrawer();
  }, [pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="lg:hidden">
      <input
        ref={drawerToggleRef}
        type="checkbox"
        defaultChecked={false}
        autoComplete="off"
        className="peer sr-only"
        aria-label="Toggle navigation"
        onChange={(event) => {
          document.body.style.overflow = event.currentTarget.checked ? "hidden" : "";
        }}
      />
      <button
        type="button"
        aria-label="Open navigation"
        onClick={openDrawer}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "cursor-pointer bg-accent text-accent-foreground"
        )}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open navigation</span>
      </button>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={closeDrawer}
        className="pointer-events-none fixed inset-0 z-50 cursor-pointer bg-black/30 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 peer-checked:pointer-events-auto peer-checked:opacity-100"
      />
      <aside
        aria-label="Mobile navigation"
        className="fixed inset-y-0 left-0 z-[60] flex w-[min(85vw,320px)] -translate-x-full flex-col border-r border-sidebar-border bg-sidebar shadow-2xl transition-transform duration-200 ease-out peer-checked:translate-x-0"
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeDrawer}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "absolute right-3 top-4 z-10 cursor-pointer")}
        >
          <X className="h-5 w-5" />
        </button>
        <NavigationContent profile={profile} area={area} onNavigate={closeDrawer} />
      </aside>
    </div>
  );
}
