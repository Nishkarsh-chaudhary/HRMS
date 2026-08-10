import { requirePortal } from "@/lib/auth/dal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PortalHomePage() {
  const profile = await requirePortal();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Hi {profile.full_name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.role === "manager"
            ? "Manage your team and your own workday from here."
            : "Your workday at a glance."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[15px] font-semibold text-foreground">
              Attendance
              <Badge variant="secondary">Not checked in</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Check-in/check-out will appear here once the attendance module is live.
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[15px] font-semibold text-foreground">
              Leave balance
            </CardTitle>
            <CardDescription className="text-[13px]">Current period</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Leave balances will appear here once the leave module is live.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
