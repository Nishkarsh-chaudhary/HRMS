LEAVE MANAGEMENT

Functional Requirements Document


Client-ready specification for product, engineering, QA and implementation teams


Document Control

Value

Version

1.0

Status

Draft for Client Review

Prepared for

Client / HRMS Stakeholders

Document Date

07 August 2026

Classification

Confidential

Technology

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase PostgreSQL, Realtime and RLS



Confidential • Version 1.0	Page 

Leave Management — Functional Requirements


Document Control


Revision History


Version

Date

Owner

Change Summary

Status

0.1

07 Aug 2026

Product Team

Initial consolidated draft

Internal Draft

1.0

07 Aug 2026

Product Team

Client-ready Leave Management FRD

Client Review


Review and Approval


Role

Name

Decision

Date

Comments

Business Sponsor

TBD

Pending

TBD


HR Process Owner

TBD

Pending

TBD


Product Owner

TBD

Pending

TBD


Technology Lead

TBD

Pending

TBD


QA Lead

TBD

Pending

TBD



Table of Contents


Update fields to populate the table of contents.


1. Executive Summary


The Leave Management module will provide a single, policy-controlled system for defining leave schemes, calculating employee entitlements and balances, submitting and approving leave, coordinating team availability, integrating approved leave with attendance and payroll, and maintaining a complete audit trail.


All leave configuration, requests, balances and transactions shall support company_id for multi-company isolation. Access shall be enforced through role-based permissions and Supabase Row Level Security.


1.1 Business Outcomes


•  Standardise leave policy application across companies, locations and employee groups.

•  Give employees accurate real-time balances and transparent request status.

•  Reduce manual balance adjustments and approval follow-up.

•  Help managers plan team availability and prevent critical staffing gaps.

•  Synchronise approved leave with attendance and payroll-ready payable-day calculations.

•  Preserve an immutable entitlement, transaction, approval and audit history.


1.2 Scope


In Scope

Future / Optional

Leave types, policies, schemes and assignments

External government leave portals

Accrual, opening, carry-forward, lapse and adjustment

AI-based leave recommendations

Employee application, approval, cancellation and withdrawal

Travel booking and expense workflows

Team calendar and availability

Advanced workforce forecasting

Compensatory off, unpaid leave and optional encashment

Native mobile application

Attendance and payroll integration

Country-specific statutory packs beyond configured policies

Reports, notifications, audit and version history

WhatsApp and push notifications


2. Purpose, Objectives and Dependencies


2.1 Purpose


This FRD defines functional behaviour, roles, policy rules, workflows, calculations, data controls, interfaces, reports, user experience and acceptance criteria for Leave Management.


2.2 Objectives


•  Maintain authoritative leave entitlements and balances.

•  Support full-day, half-day, hourly and multi-day requests where enabled.

•  Apply eligibility, notice, document, holiday, weekly-off and sandwich rules consistently.

•  Route requests through configurable single or multi-level approvals.

•  Provide team calendars and conflict visibility without exposing sensitive reasons.

•  Reflect approved leave in attendance and payroll.

•  Support multi-company, multi-location and effective-dated policy operation.


2.3 Dependencies and Assumptions


ID

Dependency / Assumption

A-01

Employee master includes company, joining date, status, location, employment type, gender where lawfully used, department and reporting hierarchy.

A-02

Holiday calendars and weekly-off schedules are available.

A-03

Attendance consumes approved leave by employee and date.

A-04

Payroll consumes paid/unpaid leave, payable-day and encashment results through an agreed interface.

A-05

Company time zones and leave-year/cycle boundaries are configured.

A-06

Statutory policy interpretation is confirmed by client HR/legal teams.


3. Roles and Access Control


Role

Capabilities

Restrictions

Super Admin

Cross-permitted-company configuration, override, reports and audit

Explicit company scope only

HR Admin

Leave types, schemes, assignments, adjustments, approvals, reports and period processing

Sensitive/override actions require permission

Manager

Team availability and request decisions within reporting scope

Cannot change policy or balances directly

Employee

Own balances, applications, documents, status, withdrawal and calendar

Cannot view private reasons/documents of others

Payroll User

Read payroll-impacting leave and encashment outputs

No request mutation unless granted

Auditor

Read-only policies, transactions, versions and audit

No operational mutation


3.1 Access Rules


•  Enforce permissions in UI, API and database RLS.

•  Scope every read and mutation by `company_id` and authorised employee/reporting scope.

•  Medical documents and sensitive reasons require restricted permissions.

•  Employees shall not approve their own request, including delegated workflows.

•  Service credentials shall never be exposed to clients.


4. Module Structure


Area

Audience

Purpose

Leave Dashboard

HR, Manager

KPIs, trends and pending actions

My Leave

Employee

Balances, requests and calendar

Apply Leave

Employee/authorised proxy

Validated application

Team Leave

Manager

Availability, conflicts and approvals

Leave Requests

HR, Manager

Search, review and workflow action

Leave Calendar

All by scope

Personal/team/organisation visibility

Leave Types & Policies

HR/Admin

Rules, eligibility and calculations

Leave Schemes

HR/Admin

Bundled policies and assignment

Balance Administration

HR/Admin

Opening, adjustment, accrual and carry-forward

Compensatory Off

Employee, Manager, HR

Earn, approve, consume and expire comp-off

Encashment

Employee/HR/Payroll

Optional request and payroll processing

Reports

Authorised roles

Operational, compliance and payroll reports

Audit & Transactions

Admin/Auditor

Immutable ledger, versions and actions


5. Leave Dashboard


5.1 KPI Cards


KPI

Definition

Employees on Leave Today

Approved leave overlapping today

Pending My Approval

Actionable requests assigned to current approver

Requests Pending HR

Requests awaiting HR-level decision

Upcoming Leave

Approved leave in selected future period

Unplanned Leave

Requests submitted inside configured notice window

Leave Utilisation

Consumed entitlement divided by available entitlement

Low Balance Employees

Employees below configured balance threshold

Negative Balances

Employees with authorised negative balance

Expiring Leave

Balance scheduled to lapse within selected period

Comp-Off Expiring

Approved comp-off credits nearing expiry

Unpaid Leave

Approved LOP days in selected period

Approval SLA Breaches

Pending decisions beyond configured SLA


Each KPI shall include count, percentage where relevant, trend, clickable drill-down and last-updated timestamp.


5.2 Filters and Widgets


Filters: company, location, department, team, manager, employee, employment type, leave type, request status, date range, month and year.


•  Leave-type distribution and monthly application trend.

•  Department/location absence trend.

•  Pending request ageing and approval SLA.

•  Upcoming team absences and staffing conflicts.

•  Leave liability, expiring balances and unpaid-leave trend.


6. Leave Types, Policies and Schemes


6.1 Leave Type Configuration


The company has exactly three leave types for phase one. EL and SL together provide 18 days of ordinary annual leave for a full eligible year. RH is a separate entitlement and is not part of the 18-day ordinary-leave total.


Leave Type

Entitlement

Credit Rule

Usage Rule

Earned Leave (EL)

12 days per full eligible year

1 day for each eligible completed month

Accumulated EL may be used at any time; there is no limit of one EL day per month

Sick Leave (SL)

6 days per full eligible year

0.5 day for each eligible completed month

Accumulated SL may be used at any time; there is no limit of 0.5 SL day per month

Restricted Holiday (RH)

4 days per full year

Separate annual entitlement

May be used only against dates in the published Restricted Holiday calendar


The employee's My Leave page shall show EL, SL and RH separately and shall also show “Total Ordinary Leave Available” as EL available plus SL available. RH shall never be included in that total.


Monthly credit is an entitlement-calculation mechanism, not a monthly usage restriction. Credited leave continues to accumulate in the employee's balance. An employee may request more than one day in a month, subject to available accumulated balance and the applicable approval and sandwich rules.


6.1.1 Joining Date and One-Month Probation


•  Every new employee has a one-month probation/waiting period for leave accrual.

•  The calendar month of joining is treated as the probation month for this calculation.

•  No EL or SL is credited for the joining month.

•  The first eligible accrual month starts after completion of the probation month and the immediately following month boundary, consistent with the confirmed June example.

•  Only eligible completed months remaining in the leave year generate EL and SL credits.

•  The system shall calculate the employee's first-year entitlement automatically from joining date and probation completion.

•  HR may correct an exceptional joining/probation case only through a reasoned, audited balance adjustment.


Example — employee joining in June:


Period

Treatment

June

Joining/probation month; no credit

July

Post-probation eligibility transition; no monthly credit under the confirmed rule

August–December

Five eligible completed months

EL available for first year

5 days: 5 × 1 day

SL available for first year

2.5 days: 5 × 0.5 day

RH

Separate entitlement; allocation for a mid-year joiner must follow the RH rule below


6.1.2 Restricted Holiday Rules


•  HR shall publish the Restricted Holiday calendar for each leave year and applicable location.

•  An RH request may be submitted only for a date marked as a Restricted Holiday for the employee's applicable location.

•  RH is maintained in a separate balance and does not reduce EL, SL or the 18-day ordinary-leave entitlement.

•  RH cannot be converted automatically into EL or SL, and unused EL/SL cannot be treated as RH.

•  The mid-year-joiner RH allocation rule remains configurable until the client confirms whether all four days or a prorated quantity is granted.


Field

Requirement

Name/code

Required and unique within company

Category

Paid, unpaid, statutory, compensatory or special

Unit

Day, half-day or hour; enabled combinations are policy controlled

Colour/icon

Used consistently in calendars and badges

Eligibility

Employment type, grade, location, gender where lawful, tenure and employee group

Entitlement

Fixed, prorated or accrual-based quantity

Workflow

Approval levels, HR review and auto-approval conditions

Status/effective dates

Draft, Active, Inactive, Retired and effective period


6.2 Policy Rules


•  Leave year/cycle, joining and exit-year proration.

•  Credit frequency: annual, monthly, quarterly or event-based.

•  Accrual timing: period start, period end or completed-service milestone.

•  Minimum and maximum request duration.

•  Advance notice and backdated application window.

•  Maximum consecutive days and yearly occurrence limits.

•  Half-day first/second half and optional hourly requests.

•  Holiday and weekly-off inclusion/exclusion, including sandwich rules.

•  Negative balance allowance and maximum deficit.

•  Carry-forward limit, expiry/lapse and optional encashment.

•  Probation, notice-period and confirmation eligibility.

•  Mandatory reason, contact address, handover and attachment thresholds.

•  Clubbing restrictions between leave types.

•  Blackout dates, minimum staffing and overlapping request controls.

•  Cancellation, withdrawal and modification windows.


6.3 Leave Schemes and Assignment


A scheme groups applicable leave policies. Schemes may be assigned by employee, company, location, department, grade, employment type or other authorised employee group.


•  Assignments are effective-dated and versioned.

•  Employee-specific assignment takes precedence over group/default assignment.

•  Overlaps must be blocked or resolved through a deterministic priority preview.

•  Changing a scheme shall show balance impact before confirmation.

•  Published historical entitlements shall not be silently rewritten.


7. Leave Balance and Transaction Ledger


7.1 Balance Components


EL and SL shall maintain separate transaction ledgers and balances. For display, the system shall derive the combined ordinary-leave balance as EL available + SL available. A request deducts from the leave type selected by the employee; it shall not silently deduct from the other leave type. RH always remains separate.


Component

Description

Opening

Approved starting balance for a cycle or migration

Accrued/Credited

Policy-generated entitlement

Carried Forward

Eligible prior-cycle balance

Adjusted

HR debit/credit with mandatory reason

Reserved

Submitted/pending request quantity when configured

Consumed

Approved leave quantity

Cancelled/Reversed

Quantity restored after approved cancellation

Encumbered

Approved future leave not yet taken where separately tracked

Encashment

Quantity transferred to payroll for payment

Lapsed

Expired quantity no longer available

Available

Derived balance after applicable transactions/reservations


7.2 Ledger Requirements


•  Every balance movement creates an immutable transaction with employee, leave type, amount, effective date, source, reference, actor and correlation ID.

•  Current balance is derived from/reconciled with the ledger; direct silent overwrite is prohibited.

•  Adjustments require permission, reason, confirmation and optional attachment.

•  Bulk opening or adjustment supports template download, validation preview, partial results and error file.

•  Recalculation is idempotent and creates corrective transactions rather than deleting history.

•  Employees can view understandable transaction history; restricted technical/internal details remain hidden.


8. My Leave and Application


8.1 Employee Summary


Display employee identity, current scheme, cycle, leave cards with available/reserved/consumed/expiring quantities, upcoming leave, pending requests and recent transactions.


8.2 Application Form


Field

Requirement

Leave type

Required; show only eligible active types

From/to date

Required and validated in employee/company time zone

Session/unit

Full day, first/second half or hours when enabled

Calculated quantity

Read-only preview with included/excluded dates

Reason

Required according to policy; privacy classified

Attachment

Conditional by leave type/duration and file rules

Contact/handover

Conditional by policy

Acting approver

Derived from hierarchy/workflow

Notify colleagues

Optional and privacy-safe


Before submission, show balance before/after, unpaid conversion if applicable, holidays/weekends, policy warnings, conflicting requests, approval path and payroll/attendance impact.


For EL and SL, the application screen shall show both the selected leave-type balance and the combined ordinary-leave total. The employee may use all accumulated available days in a single month; monthly accrual values must not be applied as monthly consumption caps.


8.3 Validation


•  Employee is active and eligible on all requested dates.

•  Request is inside permitted advance/backdate windows.

•  Duration and occurrence limits are satisfied.

•  Sufficient balance exists unless negative balance or LOP conversion is allowed.

•  No overlap exists with approved/pending leave, attendance regularization, travel or conflicting work request where integrated.

•  Attachment and handover requirements are satisfied.

•  Locked attendance/payroll periods cannot be changed without authorised reopening.

•  Duplicate submission and retry are protected by idempotency.


9. Approval Workflow


9.1 States


Draft → Submitted → Pending Manager Approval → Pending Second-Level Approval when configured → Pending HR Approval when configured → Approved or Rejected.


Additional states: Sent Back, Withdrawn, Cancellation Pending, Cancelled, Auto-Approved, Expired and Payroll Locked.


9.2 Approver Actions


•  Approve or reject with configured mandatory comment.

•  Send back for correction.

•  View balance, policy result, team calendar and staffing conflicts.

•  View attachments only when authorised.

•  Modify and approve only with elevated permission, reason and employee notification.

•  Delegate/escalate according to effective-dated rules.


9.3 Workflow Rules


•  Approvers derive from reporting hierarchy, role or configured workflow; the requester cannot freely choose them.

•  Self-approval is prohibited.

•  Parallel or sequential levels shall be explicitly configured.

•  Reassignment, delegation and escalation are audited.

•  Approval creates consumption/reservation transactions and attendance integration events atomically or through reliable outbox processing.

•  Rejection releases reservations and preserves the complete request history.

•  Bulk decisions are limited to eligible homogeneous requests and create item-level audit actions.


10. Modification, Withdrawal and Cancellation


•  Draft requests may be edited or deleted by the employee.

•  Submitted requests may be withdrawn before final decision when policy allows.

•  Approved future leave may require a cancellation workflow.

•  Partially used leave may allow cancellation of future dates only.

•  Past approved leave changes require HR permission and unlocked attendance/payroll periods.

•  Approved cancellation reverses balance consumption, updates attendance and payroll, and creates new ledger and audit entries.

•  A date change shall follow cancellation-and-reapply or a versioned modification workflow; history shall remain visible.


11. Team Leave and Calendar


11.1 Team View


Managers shall see direct and permitted indirect reports, current/upcoming leave, pending requests, return dates, leave type where permitted, staffing conflicts and team availability.


11.2 Calendar Views


Daily, weekly, monthly and yearly views shall support filters by company, location, department, team, manager, employee, leave type and status.


•  Personal calendar includes full request details for the employee.

•  Team/organisation calendars expose only privacy-safe information according to role and policy.

•  Colour is reinforced by text/icon and an accessible legend.

•  Selecting an entry opens permitted details and workflow actions.

•  Holidays and weekly offs are visually distinct.

•  Export to calendar file may be provided without sensitive reason/attachment data.


11.3 Staffing Controls


•  Warn or block when minimum staffing, maximum simultaneous absence or blackout-date rules are breached.

•  Conflicts display affected dates, team capacity and already approved absences.

•  Overrides require elevated permission, reason and audit.

•  The system shall not disclose another employee's confidential leave reason to resolve a conflict.


12. Compensatory Off


12.1 Earning


Comp-off credit may originate from approved overtime, work on holiday/weekly off or authorised manual grant. Each credit records earned date, quantity, evidence/source, approver, expiry and status.


12.2 Workflow and Consumption


•  Credit states: Draft, Submitted, Pending Approval, Approved, Rejected, Expired and Consumed.

•  Approved credit creates a ledger transaction.

•  Consumption follows configured oldest-expiring-first or explicit credit selection.

•  Expired credits lapse automatically and remain in history.

•  Reversal after cancellation restores credit only if still eligible; otherwise route to HR exception.

•  Prevent double benefit when the same work event has already been paid as overtime unless policy explicitly permits it.


13. Leave Encashment


Where enabled, employees or HR may request encashment within configured windows and limits.


•  Validate leave type, minimum retained balance, maximum encashable quantity, eligibility and payroll period.

•  States: Draft, Submitted, Pending Approval, Approved, Rejected, Sent to Payroll, Paid and Cancelled.

•  Approval reserves/debits balance according to policy and creates payroll output.

•  Payroll acknowledgement and rejection shall reconcile the ledger.

•  Calculation rate and tax treatment are owned by payroll policy/interface and displayed only when authoritative values are available.


14. Attendance and Payroll Integration


14.1 Attendance Integration


•  Approved leave publishes employee, date/session, leave type, paid/unpaid classification and request reference.

•  Attendance shall show On Leave or applicable half-day combination rather than Absent.

•  Cancellation/rejection publishes a reversal and triggers deterministic attendance recalculation.

•  Locked attendance prevents retroactive leave changes unless the period is authorised for reopening.

•  Integration is idempotent and correlated; partial failures appear in an exception queue.


14.2 Payroll Integration


•  Provide paid leave, unpaid leave/LOP, payable-day impact, encashment and recovery adjustments for the payroll period.

•  Payroll data is generated only from approved authoritative requests and ledger state.

•  Submitted/locked payroll periods prevent unauthorised retroactive changes.

•  Corrections require versioned adjustment and resubmission/reconciliation.

•  Interface format, acknowledgement and ownership are implementation decisions to be confirmed.


15. Holiday, Weekly-Off and Sandwich Rules


•  The calculation preview shall identify every calendar date as leave, holiday, weekly off or excluded day.

•  The confirmed sandwich rule applies when an employee takes leave on Friday and the immediately following Monday.

•  In that case, Friday, Saturday, Sunday and Monday are counted, producing a four-day leave deduction.

•  The system shall show all four counted dates before submission and approval.

•  The four days shall be deducted from the selected EL or SL balance according to the request. If mixed leave types are permitted for the request, the date-level breakdown must identify the leave type charged for each day.

•  Cancelling or rejecting either the Friday or Monday leave shall trigger recalculation and remove the sandwich deduction when the condition no longer applies.

•  RH does not form part of the ordinary EL/SL balance. Whether RH on Friday or Monday triggers the sandwich rule remains excluded by default unless HR explicitly enables it.

•  Location-specific holiday calendars apply using effective employee location or approved assignment rule.

•  Overnight shifts and half-day attendance combinations shall use the attendance shift date.

•  Changes to holiday calendars recalculate only eligible unlocked future/current requests and preserve prior versions.


16. Notifications and SLA


Notify submission, approval, rejection, send-back, withdrawal, cancellation, upcoming leave, return date, low/expiring balance, comp-off expiry, delegation, SLA escalation and payroll/attendance integration failure.


•  Phase-one channels: in-app and email; push/WhatsApp are future.

•  Messages state dates, quantity, status and required action without unnecessary medical/private detail.

•  Configurable reminders and escalation shall not create duplicate notifications.

•  Mandatory workflow messages cannot be disabled where business control requires them.


17. Reports and Analytics


Category

Reports

Operational

Daily leave, employees on leave, upcoming leave and pending approvals

Balance

Employee balance, transaction ledger, low/negative and expiring balance

Utilisation

Leave-type, department, location, manager and trend analysis

Exceptions

SLA breach, overlap, staffing override, backdated and policy override

Compliance

Statutory leave utilisation, attachment compliance and audit

Comp-Off

Earned, pending, consumed, expired and double-benefit exceptions

Payroll

Paid/unpaid leave, LOP, payable-day impact and encashment reconciliation

Configuration

Policy, scheme assignment and version history


•  Filters: company, cycle/date range, employee, location, department, team, manager, employment type, leave type, status and scheme.

•  Export to Excel, CSV and PDF with permission-controlled sensitive fields.

•  Large reports run asynchronously with secure expiring download.

•  Exports include generation time, filters, company scope and data-as-of timestamp.

•  Totals reconcile to filtered screens, ledger and payroll output.


18. UI, Responsive and Accessibility Requirements


18.1 UI Standards


•  Use Next.js App Router, TypeScript, Tailwind CSS and shadcn/ui conventions.

•  Consistent headers, breadcrumbs, filters, saved views, status badges and data-as-of indicators.

•  Balance cards clearly distinguish available, reserved, consumed and expiring quantities.

•  Application preview shows counted dates and policy reasoning before submission.

•  Drawers/modals preserve context; high-impact actions show impact and confirmation.

•  Provide skeleton, empty, error, partial, stale-data and permission-denied states.


18.2 Responsive Behaviour


Viewport

Requirement

Desktop

Full dashboard, balances, tables, calendars, bulk actions and policy forms

Tablet

Responsive grids, horizontal tables, compact filters and touch drawers

Mobile

Employee-first balance, apply, request status and calendar; manager approval cards


18.3 Accessibility and Messages


•  Target WCAG 2.1 AA for supported critical journeys.

•  Keyboard-operable forms, calendars, dialogs and approval actions.

•  Status and leave type are not communicated by colour alone.

•  Inputs have labels, instructions and associated errors.

•  Validation identifies affected dates and corrective action.

•  Submission outcomes explicitly state whether the request was saved.


19. Data and Technical Requirements


Entity

Purpose

leave_types / policy_versions

Effective leave definitions and rules

leave_schemes / assignments

Bundled policy assignment

leave_requests / request_days

Request header and calculated date/session breakdown

leave_approval_actions

Immutable workflow transitions

leave_balance_transactions

Authoritative credit/debit ledger

leave_balance_snapshots

Performance snapshot reconciled to ledger

comp_off_credits

Earned entitlement and expiry

leave_encashments

Optional encashment workflow

leave_calendar_events

Privacy-safe calendar projection

leave_integration_events

Attendance/payroll outbox and status

leave_policy_simulations

Optional impact-preview result

audit_logs / versions

Immutable action and change history


19.1 Data Rules


•  Tenant entities include `company_id`; foreign keys must not cross companies.

•  Requests store date-level calculation breakdown and policy version used.

•  Quantities use fixed-precision numeric units; floating-point storage is prohibited.

•  Timestamps use UTC with applicable company/location time zone for dates.

•  Approved requests, ledger transactions and audit records are not hard-deleted.

•  Attachments use private storage with signed expiring access and malware controls where available.

•  Balance snapshots are rebuildable and regularly reconciled to the ledger.


19.2 Realtime and Background Jobs


•  Supabase Realtime may update approval queues, balances and calendars subject to RLS.

•  Accrual, lapse, carry-forward, notification, reports and integrations use idempotent background jobs.

•  Jobs expose status, retries, correlation, failure reason and dead-letter handling.

•  Concurrent approval/cancellation uses optimistic concurrency or transactional locking.


20. Business and Validation Rules


ID

Rule

BR-01

Only active eligible employees may submit leave.

BR-02

Every record and policy is scoped by company_id.

BR-03

Applicable policy and scheme are resolved by effective date.

BR-04

Overlapping active requests for the same date/session are prohibited.

BR-05

Balance cannot fall below the configured negative limit.

BR-06

Holiday/weekly-off inclusion follows the applicable policy.

BR-07

Half-day combinations cannot exceed one full day.

BR-08

Self-approval is prohibited.

BR-09

Approval, rejection, override and adjustment are audited.

BR-10

Balance changes occur only through ledger transactions.

BR-11

Approved leave updates attendance; cancellation reverses it.

BR-12

Unpaid leave and encashment are reconciled with payroll.

BR-13

Locked attendance/payroll periods prevent unauthorised retroactive changes.

BR-14

Attachments and reasons follow privacy permissions and retention.

BR-15

Policy changes do not silently rewrite approved history.

BR-16

Duplicate/retried submissions are idempotent.

BR-17

Comp-off cannot be consumed after expiry.

BR-18

The same work event cannot produce duplicate overtime and comp-off benefit unless explicitly allowed.

BR-19

Staffing-rule overrides require authority and reason.

BR-20

Calendar views shall not expose confidential leave details to unauthorised users.

BR-21

Full-year ordinary entitlement is 12 EL plus 6 SL; RH is a separate four-day entitlement.

BR-22

EL credits at 1 day and SL at 0.5 day for each eligible completed month and accumulated balances have no monthly usage cap.

BR-23

For the confirmed June-joining example, first-year entitlement is 5 EL and 2.5 SL after the one-month probation treatment.

BR-24

Friday and immediately following Monday leave counts Friday through Monday as four leave days.


21. Audit, Version History and Privacy


•  Audit policy/scheme changes, assignments, applications, workflow decisions, delegations, balance transactions, adjustments, cancellations, overrides, exports and integrations.

•  Include actor, subject, company, trusted timestamp, action, previous/new value, reason, source, status and correlation ID.

•  Maintain version history for policies, schemes and requests; corrections create new versions.

•  Medical certificates and sensitive leave categories use restricted access and appropriate retention.

•  Audit and ledger records are append-only and protected from ordinary mutation.

•  Data retention and subject-access/export handling require client privacy/legal confirmation.


22. Non-Functional Requirements


Category

Requirement

Performance

Dashboard and balance view within 2 seconds under agreed load; request preview responsive; pagination/virtualisation for large data

Reliability

Idempotent accrual, approval, reversal and integration; safe retry and reconciliation

Security

Least privilege, RLS, private files, rate limiting, secrets protection and anti-malware controls where available

Scalability

Indexed tenant/cycle queries and asynchronous bulk/report processing

Observability

Correlated logs, metrics and alerts for balance mismatch, job failure and integration backlog

Accessibility

WCAG 2.1 AA target for employee and approval flows

Maintainability

Versioned policies, typed domain interfaces, migrations and tested calculation engine

Localisation

Locale-aware dates/numbers, time zones and translatable text


23. Primary Workflows


23.1 Apply and Approve Leave


Open My Leave → choose eligible leave type → enter dates/session → server calculates included days and balance → validate policy/conflicts → show impact and approval path → submit idempotently → reserve balance if configured → manager/HR decision → consume balance → publish attendance event → notify and audit.


23.2 Cancellation


Open approved request → select eligible future dates → show balance/attendance/payroll impact → submit cancellation → approval if required → reverse ledger transaction → publish attendance/payroll reversal → notify → retain full history.


23.3 Accrual and Carry-Forward


Scheduled job resolves active assignments/policies → calculate eligible credit/proration → create idempotent ledger transactions → reconcile snapshots → at cycle close calculate carry-forward, lapse and encashable quantity → publish results → expose exceptions for HR review.


23.4 HR Balance Adjustment


Select employee/type/cycle → inspect ledger → enter debit/credit, effective date, reason and attachment → preview balance impact → confirm → create immutable transaction → update snapshot → notify employee if configured → audit.


23.5 Attendance and Payroll Handoff


Approved request creates integration event → attendance applies date/session status → payroll receives paid/unpaid/encashment impact for open period → acknowledgements update status → failures enter retry/exception queue → locked-period corrections follow governed reopening.


24. Acceptance Criteria and Definition of Done


24.1 Functional Acceptance


ID

Acceptance Criterion

AC-01

Roles see only permitted company, self, team or administrative scope.

AC-02

Eligible leave types, balances and policies resolve correctly by effective date.

AC-03

Application preview correctly counts leave, holidays, weekly offs, half-days and sandwich rules.

AC-04

Invalid overlaps, limits, insufficient balance and missing documents are blocked with guidance.

AC-05

Single/multi-level approval, delegation, escalation and self-approval prevention work.

AC-06

Approval, rejection, withdrawal and cancellation create correct ledger transactions and history.

AC-07

Accrual, proration, carry-forward, lapse and adjustment are idempotent and reconcilable.

AC-08

Team calendar and staffing conflicts are accurate and privacy safe.

AC-09

Approved/cancelled leave synchronises reliably with attendance.

AC-10

Paid/unpaid leave and encashment reconcile with payroll outputs.

AC-11

Reports reconcile with requests, balance ledger and filtered UI.

AC-12

Mobile employee and manager journeys are usable and accessible.


24.2 Engineering and Quality Completion


•  Requirements trace to approved stories, UX states and tests.

•  Database migrations, fixed-precision quantities, constraints, indexes and `company_id` coverage are reviewed.

•  RLS tests prove tenant, self, manager, HR, payroll and auditor isolation.

•  Unit tests cover eligibility, proration, accrual, balance, sandwich, half-day, carry-forward, lapse and comp-off.

•  Integration tests cover approval, reservation, cancellation, attendance, payroll, notification and report jobs.

•  End-to-end tests cover employee, manager and HR happy/error/concurrency paths.

•  Security/privacy review covers attachments, sensitive reasons, exports, privilege escalation and logs.

•  Accessibility and representative-load performance tests pass.

•  Ledger-to-snapshot reconciliation and failure recovery are verified.

•  Monitoring, alerts, retry/dead-letter handling, user help and support runbooks are ready.

•  Product, HR, Technology and QA sign off the release and documented deviations.


24.3 Release Exit Conditions


•  No open critical/high defect without explicit risk acceptance.

•  Production leave types, policies, schemes, cycles, holidays, hierarchy and integrations are configured.

•  Opening balances/migration reconcile to approved source totals.

•  Accrual and cycle-close jobs pass rehearsal with rollback/recovery procedures.

•  Support ownership, monitoring and escalation are active.


25. Traceability Summary


Requirement Area

Section

Dashboard and KPIs

5

Leave types, policies and schemes

6

Balances, accrual and ledger

7

Employee application

8

Approvals, cancellation and withdrawal

9–10

Team calendar and staffing

11

Comp-off and encashment

12–13

Attendance and payroll

14

Holidays and sandwich rules

15

Reports, UI and data requirements

17–19

Business rules and workflows

20 and 23

Definition of Done

24


Appendix A. Open Decisions


ID

Decision

Owner

OD-01

Carry-forward and lapse rules for unused EL and SL

HR / Legal

OD-02

Leave-clubbing, blackout-date and minimum-staffing rules

HR Process Owner

OD-03

Balance reservation point: submission or approval

HR / Product

OD-04

Payroll interface, acknowledgement and locked-period correction

Payroll / Technology

OD-05

Encashment calculation, tax and payment lifecycle

Payroll / Finance

OD-06

Sensitive attachment retention and permitted viewers

Legal / Security / HR

OD-07

Performance test workforce and concurrency figures

Product / Technology

OD-08

Comp-off relationship with overtime payment

HR / Payroll

OD-09

Whether mid-year joiners receive all four RH days or a prorated RH allocation

HR Process Owner

OD-10

Whether RH on Friday/Monday participates in the sandwich rule; default is no

HR Process Owner

Confidential • Version 1.0	Page 