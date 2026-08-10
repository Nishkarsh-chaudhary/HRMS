"use client";

import { useFormStatus } from "react-dom";
import { LogOut, ChevronsUpDown, Loader2 } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants";

export function UserMenu({
  fullName,
  email,
  role,
  avatarUrl,
  compact,
}: {
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  compact?: boolean;
}) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <details className={cn("group/profile relative", compact && "w-full")}>
      <summary
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 cursor-pointer list-none gap-2 px-2 [&::-webkit-details-marker]:hidden",
          compact && "h-auto w-full justify-start px-2 py-2"
        )}
      >
        <Avatar className="h-8 w-8 ring-2 ring-sidebar-border">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={fullName} />
          ) : null}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="hidden min-w-0 flex-1 text-left sm:block">
          <p className={cn("truncate text-sm font-medium leading-tight", compact ? "text-foreground" : "")}>
            {fullName}
          </p>
          <p className={cn("truncate text-xs capitalize leading-tight", compact ? "text-sidebar-foreground" : "text-muted-foreground")}>
            {role}
          </p>
        </div>
        <ChevronsUpDown className={cn("h-4 w-4 shrink-0 transition-transform group-open/profile:rotate-180", compact ? "text-sidebar-foreground" : "text-muted-foreground")} />
      </summary>
        <div
          role="menu"
          aria-label="User profile"
          className={cn(
            "absolute z-[100] w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl",
            compact ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"
          )}
        >
          <div className="px-2 py-2">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
          </div>
          <div className="-mx-1 my-1 h-px bg-border" />
        <form action={logout} className="w-full">
          <LogoutButton />
        </form>
        </div>
    </details>
  );
}

function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      role="menuitem"
      variant="ghost"
      disabled={pending}
      className="h-8 w-full justify-start px-1.5 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      {pending ? "Logging out…" : "Logout"}
    </Button>
  );
}
