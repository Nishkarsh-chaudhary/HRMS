import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  Network,
  ScanLine,
  Settings,
  ShieldCheck,
  User,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { ROLES, type Role } from "@/lib/constants";

export type NavigationArea = "admin" | "portal" | "employee";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const adminNavigation: NavigationItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/organization", label: "Organization", icon: Network },
  { href: "/admin/attendance", label: "Attendance", icon: Clock },
  { href: "/admin/leave", label: "Leave", icon: CalendarDays },
  { href: "/admin/payroll", label: "Payroll", icon: WalletCards },
  { href: "/admin/biometric", label: "Biometric", icon: ScanLine },
  { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
  { href: "/admin/settings", label: "Company Settings", icon: Settings },
];

const financeNavigation: NavigationItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/attendance", label: "Attendance", icon: Clock },
  { href: "/admin/payroll", label: "Payroll", icon: WalletCards },
];

const portalNavigation: NavigationItem[] = [
  { href: "/portal", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/self-service/attendance", label: "My Attendance", icon: Clock },
  { href: "/self-service/leave", label: "My Leave", icon: CalendarDays },
  { href: "/self-service/payroll", label: "My Payroll", icon: WalletCards },
  { href: "/self-service/profile", label: "My Profile", icon: User },
];

const employeeNavigation: NavigationItem[] = [
  { href: "/employee", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/employee/attendance", label: "My Attendance", icon: Clock },
  { href: "/employee/leave", label: "My Leave", icon: CalendarDays },
  { href: "/employee/payroll", label: "My Payroll", icon: WalletCards },
  { href: "/employee/profile", label: "My Profile", icon: User },
];

/** Phase 1 navigation, filtered by the approved module/role access map. */
export function getNavigation(role: Role, area: NavigationArea): NavigationItem[] {
  if (area === "admin") {
    return role === ROLES.FINANCE ? financeNavigation : adminNavigation;
  }

  if (area === "employee") return employeeNavigation;

  return role === ROLES.MANAGER
    ? [...portalNavigation, { href: "/self-service/team", label: "My Team", icon: Users }]
    : portalNavigation;
}
