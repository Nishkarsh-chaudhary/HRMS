import { AppShell } from "@/components/app-shell";
import { requirePortal } from "@/lib/auth/dal";
import type { Role } from "@/lib/constants";

export default async function SelfServiceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requirePortal();

  return (
    <AppShell
      profile={{
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role as Role,
        avatar_url: null,
      }}
      navigationArea="portal"
      title="My Space"
      breadcrumb="Self-service portal"
    >
      {children}
    </AppShell>
  );
}
