import { requireAdmin } from "@/lib/auth/dal";
import { AppShell } from "@/components/app-shell";
import type { Role } from "@/lib/constants";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireAdmin();

  return (
    <AppShell
      profile={{
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role as Role,
        avatar_url: null,
      }}
      navigationArea="admin"
      title="Admin"
      breadcrumb="Company workspace"
    >
      {children}
    </AppShell>
  );
}
