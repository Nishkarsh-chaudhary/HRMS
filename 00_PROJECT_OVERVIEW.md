# HRMS Platform — Project Overview

**Document Version:** 1.0
**Status:** Approved for Development
**Last Updated:** August 2026
**Owner:** Product & Engineering

---

## 1. Product Vision

To build a modern, modular, multi-company Human Resource Management System (HRMS) for small and mid-sized Indian businesses — one that delivers the core experience of category leaders like Keka, without the cost, rigidity, or vendor lock-in that comes with them.

The platform is built architecture-first: every module (Attendance, Payroll, Leave, Biometric Sync, Notifications) is designed as a pluggable component so that new vendors, integrations, and features can be added without re-architecting the core system. The end goal is not a one-off internal tool, but a **white-label-ready, multi-tenant HRMS product** that can eventually be sold or licensed to multiple companies from a single, shared codebase.

The platform is explicitly **inspired by Keka's UI/UX patterns** (dashboard structure, attendance clarity, employee self-service flows) but is not a feature-for-feature clone. Product decisions will diverge wherever they better serve Indian SME workflows, cost constraints, or the specific biometric/payroll ecosystem in India.

---

## 2. Problem Statement

Indian SMEs and growth-stage companies (typically 20–500 employees) face a recurring set of problems with HR operations:

1. **Fragmented tooling** — Attendance is tracked on biometric machines or Excel, leave requests happen over WhatsApp or email, and payroll is run manually or in spreadsheets. There is no single source of truth for employee data.
2. **Expensive, rigid SaaS options** — Platforms like Keka, Zoho People, and Darwinbox are priced per-employee-per-month in a way that becomes expensive at scale, and they are closed systems — customization beyond configuration is not possible.
3. **Poor biometric integration** — Most affordable HR tools either ignore biometric attendance entirely or bolt it on as an afterthought, forcing HR teams to reconcile machine logs manually against a separate system.
4. **No multi-company support** — Businesses that operate multiple legal entities, brands, or franchise units usually need entirely separate HR tool subscriptions, with no consolidated reporting.
5. **Payroll compliance complexity** — Indian payroll (PF, ESI, TDS, professional tax, gratuity) is state- and structure-dependent, and generic global HR tools handle it poorly or not at all.
6. **Vendor lock-in** — Once a company's employee history, attendance logs, and payroll records live inside a closed SaaS platform, migrating away becomes prohibitively expensive, which vendors exploit through pricing.

This platform is built to directly address these six problems with an open, modular, India-first architecture.

---

## 3. Goals

### Primary Goals
- Deliver a **usable, production-grade MVP within 2–3 months** covering Employee Management, Attendance, Leave, and Biometric-ready infrastructure.
- Build an architecture that supports **incremental commercialization** — the same codebase should be able to serve one internal company today and multiple paying tenants later, without a rewrite.
- Achieve **UI/UX quality comparable to Keka** for the modules that are shipped, rather than shipping more modules at lower polish.
- Keep the system **AI-friendly** — consistent naming, documented schemas, and predictable API contracts so that AI coding tools (Claude, Cursor, Copilot) can be used effectively for ongoing development.

### Secondary Goals
- Design the Payroll and Attendance engines to be **provider-agnostic** (any biometric vendor, any payout/bank integration).
- Keep infrastructure cost-efficient by using Supabase (Postgres + Auth + Storage) instead of a heavier custom backend stack.
- Maintain a **single design system** (shadcn/ui + Tailwind tokens) across all modules so that new features inherit consistent UX without additional design effort.

---

## 4. Success Metrics

| Metric | Target |
|---|---|
| MVP (Phase 1) delivery timeline | 2–3 months from development start |
| Core modules live in MVP | Employee Management, Attendance, Leave, Dashboard, Biometric-ready sync |
| Attendance data accuracy (manual vs. reconciled) | 99%+ once biometric sync is connected |
| Page load time (dashboard, employee list) | Under 2 seconds on standard broadband |
| Mobile-responsive coverage | 100% of employee-facing screens |
| Multi-company readiness | Data model supports company_id isolation from day one, even if UI exposes only one company initially |
| Documentation coverage | Every module has FRD, API spec, and DB schema before implementation begins |
| Post-MVP module additions | Payroll + Salary Slips + Payout live within Phase 2 (next 2 months after MVP) |

---

## 5. High-Level Modules

| Module | Phase | Description |
|---|---|---|
| Authentication | 1 | Email/password login via Supabase Auth, role-based session handling |
| Dashboard | 1 | Role-specific dashboards for HR, Manager, and Employee |
| Employees | 1 | Employee records, onboarding, profile management |
| Departments & Designations | 1 | Org structure setup, hierarchy mapping |
| Attendance | 1 | Check-in/out, effective hours, late arrival tracking |
| Biometric Integration | 1 (architecture) / 2 (live device) | Adapter-based sync layer for biometric devices |
| Leave | 1 | Leave application, approval workflow, balance tracking |
| Payroll | 2 | Salary structure, compliance components (PF/ESI/TDS/PT) |
| Salary Slip | 2 | Auto-generated, downloadable salary slips |
| Payout | 2 | Bank/UPI payout processing and status tracking |
| Reports | 2 | Attendance, payroll, and leave reporting/exports |
| Assets | 2 | Asset assignment and tracking per employee |
| Documents | 2 | Employee document storage and verification |
| Notifications | 2 | Email/WhatsApp/in-app notification engine |
| Settings | 1–2 | Company settings, roles, device management |
| Audit Logs | 2 | System-wide activity and change tracking |
| Performance | 3 | Reviews, goal tracking |
| Recruitment | 3 | Applicant tracking |
| AI Assistant | 3 | AI-powered HR query and automation assistant |
| Mobile App | 3 | Native/PWA mobile experience |
| Advanced Analytics | 3 | Predictive attendance/attrition analytics |

---

## 6. Tech Stack

### Frontend
- **Next.js** (App Router) — server components, routing, SSR/ISR where relevant
- **TypeScript** — strict typing across the codebase
- **Tailwind CSS** — utility-first styling, tokenized design system
- **shadcn/ui** — accessible, composable component primitives

### Backend
- **Supabase**
  - PostgreSQL as the primary relational database
  - Supabase Auth for authentication (email/password)
  - Row Level Security (RLS) for multi-company data isolation
  - Supabase Storage for documents, profile photos, assets
  - Realtime subscriptions for live dashboard updates (attendance status, approvals)

### Future Integration Layer
- Biometric Sync Service — connector pattern supporting eSSL, ZKTeco, and generic device APIs
- Email delivery (transactional)
- WhatsApp Business API (notifications, approvals)
- Payroll/bank payout exports
- Calendar integration (leave, holidays)

---

## 7. Development Phases

### Phase 1 — MVP (Target: 2–3 months)
**Goal:** A usable, internally deployable HRMS core.
- Authentication (email/password, role-based access)
- Employee Management (CRUD, onboarding, org structure)
- Attendance (manual + web check-in, effective hours calculation)
- Biometric-ready architecture (adapter layer built, no live device required)
- Leave Management (application, approval, balance)
- HR / Manager / Employee Dashboards
- Core Settings (company profile, roles, device management placeholder)

### Phase 2 — Payroll & Operations (Target: +2 months after MVP)
**Goal:** Convert the MVP into a commercially viable HR + Payroll platform.
- Payroll engine (salary structures, statutory compliance components)
- Salary Slip generation
- Payout processing and tracking
- Reports (attendance, payroll, leave)
- Assets module
- Documents module
- Notifications engine (email/WhatsApp/in-app)
- Audit Logs

### Phase 3 — Scale & Intelligence (Target: post-commercial validation)
**Goal:** Differentiate from basic HR tools and move toward a full platform.
- Performance management & reviews
- Recruitment / Applicant Tracking
- AI Assistant (natural-language HR queries, automation)
- Mobile App (native or PWA)
- Advanced Analytics (attrition prediction, workforce insights)

---

## 8. Guiding Principles

1. **Inspired, not cloned.** Keka's UI patterns inform layout and information hierarchy decisions, but every screen is designed independently for this product's own users and constraints.
2. **Architecture before features.** Every module is built with a clear separation between core logic and vendor-specific integrations (biometric, payroll, notifications), so new providers can be added without breaking existing functionality.
3. **Multi-company from day one.** Even though Phase 1 may only be used by a single company, all database schemas and RLS policies are designed with `company_id` scoping from the start.
4. **Documentation-first development.** No module enters implementation without a corresponding FRD, database schema, and API specification already written.
5. **India-first compliance.** Payroll, tax, and statutory logic are designed around Indian regulatory requirements (PF, ESI, TDS, Professional Tax) rather than adapted from a global template.
6. **AI-friendly codebase.** Consistent naming conventions, typed contracts, and structured documentation are maintained throughout so AI coding tools can be used reliably across the project lifecycle.
