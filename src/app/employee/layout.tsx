import { requireEmployee } from "@/lib/auth/dal";
import { AppShell } from "@/components/app-shell";
import type { Role } from "@/lib/constants";

export default async function EmployeeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireEmployee();

  return (
    <AppShell
      profile={{
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role as Role,
        avatar_url: null,
      }}
      navigationArea="employee"
      title="My Space"
      breadcrumb="Employee self-service"
    >
      {children}
    </AppShell>
  );
}
