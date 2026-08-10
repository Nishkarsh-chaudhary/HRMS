# Module-wise Access Map — HRMS Platform

**Document Version:** 1.0
**Status:** Approved for Development
**Last Updated:** August 2026
**Related Documents:** 00_PROJECT_OVERVIEW.md, 08_USER_ROLES.md (detailed permissions)

---

## 1. Purpose

This document maps **which modules each role can access**, and at what level, before detailed permission logic (RBAC rules, RLS policies) is written. It answers one question for every module: *who sees this, and what can they do in it?*

This is the reference used to scope the **Admin Panel** vs the **Employee Portal** during development, and to decide what gets built in Phase 1 vs later phases.

---

## 2. Roles in the System

| Role | Description |
|---|---|
| **Super Admin** | Platform/company owner. Full access across all modules and all companies (in multi-tenant mode). |
| **HR / Admin** | Runs day-to-day HR operations for the company — employees, attendance, leave, payroll. |
| **Finance** | Restricted to payroll, salary slips, payouts, and financial reports. No employee-record editing rights. |
| **Manager** | Access limited to their own team/reportees. No company-wide visibility. |
| **Employee** | Self-service only. Can see and act on their own data, nothing else. |

> Note: In the codebase, "Admin" covers both Super Admin and HR/Admin unless a feature specifically needs to be Super-Admin-only (e.g., company settings, billing, role creation).

---

## 3. Access Levels Used in This Document

| Level | Meaning |
|---|---|
| **Full** | Create, Read, Update, Delete, Approve — unrestricted within the module |
| **Manage** | Create, Read, Update — no delete, or delete restricted to soft-delete |
| **Approve** | Can view and act on requests (approve/reject) but not create records on others' behalf |
| **View** | Read-only access to data beyond their own |
| **Own Data Only** | Can view/act only on records tied to their own employee profile |
| **No Access** | Module not visible in navigation for this role |

---

## 4. Admin Panel — Module Access

These modules exist primarily for **Super Admin, HR/Admin, Finance, and Manager**. Employees do not see the Admin Panel at all.

| Module | Super Admin | HR / Admin | Finance | Manager |
|---|---|---|---|---|
| Company Settings | Full | View | No Access | No Access |
| Roles & Permissions | Full | View | No Access | No Access |
| Employees | Full | Full | View (salary-linked fields only) | View (own team only) |
| Departments & Designations | Full | Manage | No Access | View |
| Attendance | Full | Full | View (for payroll calc) | View + Manage (own team) |
| Biometric Device Management | Full | Manage | No Access | No Access |
| Leave | Full | Full | No Access | Approve (own team) |
| Payroll | Full | View | Full | No Access |
| Salary Slip | Full | View | Full | No Access |
| Payout | Full | No Access | Full | No Access |
| Reports (Attendance/Leave) | Full | Full | View | View (own team) |
| Reports (Payroll/Financial) | Full | No Access | Full | No Access |
| Assets | Full | Manage | No Access | View (own team) |
| Documents | Full | Manage | View (payroll-related docs) | No Access |
| Notifications (system-wide) | Full | Manage | No Access | No Access |
| Audit Logs | Full | View | No Access | No Access |

---

## 5. Employee Portal — Module Access

These modules exist for **all roles**, but every role only sees their **own** data here — this is the self-service layer.

| Module | Employee | Manager (extra) |
|---|---|---|
| My Dashboard | Own Data Only | + Team summary widgets |
| My Attendance (check-in/out, history) | Own Data Only | + Team attendance view |
| My Leave (apply, balance, history) | Own Data Only | + Approve team leave requests |
| My Salary Slip | Own Data Only | Own Data Only |
| My Documents | Own Data Only | Own Data Only |
| My Assets | Own Data Only | Own Data Only |
| Announcements / Notifications | Own Data Only (inbox) | Own Data Only (inbox) |
| My Profile | Manage (own profile) | Manage (own profile) |
| Team Performance *(Phase 3)* | No Access | View (own team) |
| Team Approvals (pending requests) | No Access | Approve |

---

## 6. Module Requirement Summary — By Role

### Super Admin
Requires **every module** in the system, with full access, across all companies in multi-tenant mode. Primary responsibilities: company setup, role/permission configuration, billing (future), system-wide audit visibility.

**Modules:** Company Settings, Roles & Permissions, Employees, Departments & Designations, Attendance, Biometric Device Management, Leave, Payroll, Salary Slip, Payout, Reports (all), Assets, Documents, Notifications, Audit Logs, Settings.

### HR / Admin
Requires all **people-operations** modules with full control, but restricted from company-level configuration (billing, role architecture) and financial payout execution.

**Modules:** Employees, Departments & Designations, Attendance, Biometric Device Management, Leave, Assets, Documents, Notifications, Attendance/Leave Reports. **View-only:** Payroll, Salary Slip, Audit Logs.

### Finance
Requires only the **financial layer** — no visibility into employee personal records, attendance details, or leave beyond what's needed for payroll calculation.

**Modules:** Payroll, Salary Slip, Payout, Financial Reports. **View-only:** Attendance (for payroll input), payroll-linked Documents (Form 16, PF/ESI filings).

### Manager
Requires **team-scoped visibility** only — no company-wide data, no payroll access, no settings access.

**Modules (own team scope):** Team Attendance, Team Leave (approve), Employees (view own team), Assets (view own team), Reports (own team). **Own-data modules (self-service):** same as Employee.

### Employee
Requires only **self-service modules** — the Employee Portal. No admin panel access under any circumstance.

**Modules:** My Dashboard, My Attendance, My Leave, My Salary Slip, My Documents, My Assets, Announcements/Notifications, My Profile.

---

## 7. Phase Mapping — Which Modules Are Needed Per Role in MVP (Phase 1)

| Role | Phase 1 Modules Required |
|---|---|
| Super Admin | Company Settings, Roles & Permissions, Employees, Departments & Designations, Attendance, Biometric Device Management (UI-ready, no live device), Leave, Settings |
| HR / Admin | Employees, Departments & Designations, Attendance, Leave, Dashboard |
| Manager | Team Attendance (view), Team Leave (approve), Manager Dashboard |
| Employee | My Attendance (check-in/out), My Leave (apply + balance), Employee Dashboard, My Profile |

Finance, Payroll, Salary Slip, Payout, Assets, Documents, and Notifications modules are **not required in Phase 1** — they enter scope in Phase 2 as per the Project Overview roadmap.

---

## 8. Notes for Implementation

- Role checks should be enforced at **two layers**: UI navigation (hide modules not applicable to the role) and API/database level via Supabase RLS policies (`company_id` + `role` + `employee_id` scoping). UI hiding alone is not sufficient security.
- Manager's "own team" scope should be driven by a `reporting_manager_id` field on the Employees table — this becomes the basis for all team-scoped queries (attendance, leave, assets, reports).
- Finance role should never receive direct access to non-payroll employee fields (address, personal documents, performance notes) — only fields required for salary computation (bank details, PF/ESI numbers, tax declarations).
- This module map should be treated as the source of truth when writing `08_USER_ROLES.md` (detailed RBAC/permission matrix) later in the documentation sequence.
