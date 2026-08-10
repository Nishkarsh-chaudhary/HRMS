export const ROLES = {
  SUPER_ADMIN: "super_admin",
  HR_ADMIN: "hr_admin",
  FINANCE: "finance",
  MANAGER: "manager",
  EMPLOYEE: "employee",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Roles that see the Admin dashboard. */
export const ADMIN_ROLES: readonly Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_ADMIN,
  ROLES.FINANCE,
];

/** Roles allowed to create/invite/manage users. */
export const USER_ADMIN_ROLES: readonly Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_ADMIN,
];

export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as Role);
}

export function isUserAdminRole(role: string | null | undefined): boolean {
  return USER_ADMIN_ROLES.includes(role as Role);
}
