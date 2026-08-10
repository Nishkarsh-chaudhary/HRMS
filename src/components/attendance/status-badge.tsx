import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Present: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "On Leave": "border-sky-200 bg-sky-50 text-sky-700",
  "Work From Home": "border-violet-200 bg-violet-50 text-violet-700",
  Late: "border-amber-200 bg-amber-50 text-amber-700",
  "Late Arrival": "border-amber-200 bg-amber-50 text-amber-700",
  Absent: "border-rose-200 bg-rose-50 text-rose-700",
  "Missing Check-Out": "border-orange-200 bg-orange-50 text-orange-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

export function AttendanceStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap font-medium", styles[status] ?? "bg-muted text-muted-foreground", className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </Badge>
  );
}
