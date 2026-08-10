import { LayoutDashboard, Clock, CalendarDays, User, Users } from "lucide-react";
import { requirePortal } from "@/lib/auth/dal";
import { AppShell } from "@/components/app-shell";
import type { Role } from "@/lib/constants";

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requirePortal();

  const navItems = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard, active: true },
    { href: "/portal/attendance", label: "My Attendance", icon: Clock },
    { href: "/portal/leave", label: "Leave", icon: CalendarDays },
    { href: "/portal/profile", label: "My Profile", icon: User },
    ...(profile.role === "manager"
      ? [{ href: "/portal/team", label: "My Team", icon: Users }]
      : []),
  ];

  return (
    <AppShell
      profile={{
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role as Role,
        avatar_url: null,
      }}
      navItems={navItems}
      title="My Space"
      breadcrumb="Self-service portal"
    >
      {children}
    </AppShell>
  );
}
