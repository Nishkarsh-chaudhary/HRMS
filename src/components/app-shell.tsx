import type { Role } from "@/lib/constants";
import type { NavigationArea } from "@/lib/navigation";
import { UserMenu } from "@/components/user-menu";
import { DesktopSideNavigation, MobileSideNavigation } from "@/components/side-navigation";

export function AppShell({
  profile,
  navigationArea,
  title,
  breadcrumb,
  children,
}: {
  profile: { full_name: string; email: string; role: Role; avatar_url: string | null };
  navigationArea?: NavigationArea;
  /** Kept temporarily so the locked legacy portal layout remains compatible. */
  navItems?: unknown;
  title: string;
  breadcrumb?: string;
  children: React.ReactNode;
}) {
  const resolvedNavigationArea =
    navigationArea ??
    (profile.role === "employee" || profile.role === "manager" ? "portal" : "admin");

  return (
    <div className="min-h-screen">
      <DesktopSideNavigation profile={profile} area={resolvedNavigationArea} />

      {/* Main */}
      <div className="lg:pl-[272px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-border bg-white px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-2.5">
            <MobileSideNavigation profile={profile} area={resolvedNavigationArea} />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {breadcrumb && (
                <p className="text-xs text-muted-foreground">{breadcrumb}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserMenu
              fullName={profile.full_name}
              email={profile.email}
              role={profile.role}
              avatarUrl={profile.avatar_url}
            />
          </div>
        </header>

        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
