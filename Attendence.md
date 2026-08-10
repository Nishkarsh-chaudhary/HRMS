Table of Contents


Update fields to populate the table of contents.


1. Executive Summary


The Attendance Management module will provide a single, auditable source of truth for employee attendance across companies, locations, shifts and attendance channels. It supports employee self-service, manager and HR exception handling, accurate working-hour calculations, payroll-ready period closure and secure office-network-based punching.


Every transactional and configuration record shall be scoped by company_id, protected by role permissions and Supabase Row Level Security, and traceable through immutable audit and version history.


1.1 Business Outcomes


•  Reduce manual attendance reconciliation and payroll corrections.

•  Calculate effective hours, lateness, early departure, absence and overtime consistently.

•  Enable governed employee regularization and manager/HR approval.

•  Provide real-time workforce visibility and actionable exception queues.

•  Prevent unauthorised office punches through server-observed IP/CIDR validation.

•  Preserve punches, attempts, changes, approvals and calculation lineage for audit.


1.2 Scope


In Scope

Future / Deferred

Dashboard, daily, monthly and calendar views

Active biometric device administration UI

Responsive web check-in/out

Provider-specific biometric connectors

Manual attendance and regularization

QR and advanced geo-fencing unless approved

Shift and policy management

Native mobile application

Office network whitelist and IP management

WhatsApp and push notifications

History, timeline, versions, attempts and audit

Automated payroll posting beyond agreed interface

Reports, exports and payroll handoff



2. Purpose, Objectives and Dependencies


2.1 Purpose


This FRD defines functional behaviour, user roles, workflows, business rules, data controls, user-interface requirements, integrations, reports and acceptance conditions for the Attendance Management module.


2.2 Objectives


•  Maintain a single source of truth for attendance.

•  Record attendance through controlled web/mobile, manual and integration channels.

•  Calculate hours across multiple punches, breaks and overnight shifts.

•  Track absence, late arrival, early departure, missing punches and overtime.

•  Enable regularization and approval workflows.

•  Prepare approved, locked attendance for payroll.

•  Support multi-company and multi-location operations with strict isolation.

•  Retain a provider-independent future biometric ingestion boundary.


2.3 Assumptions and Dependencies


ID

Assumption / Dependency

A-01

Employee master, department, location, reporting hierarchy and employment status are available.

A-02

Holiday calendars, approved leave and weekly-off schedules are available to calculation.

A-03

Each employee has an effective shift assignment or configured fallback.

A-04

Office locations have stable public IP addresses or known CIDR ranges.

A-05

A trusted reverse proxy supplies the actual client IP to the server.

A-06

Payroll consumes a defined locked-period summary; final mapping is TBD.

A-07

Timestamps are stored in UTC and displayed in the applicable time zone.


3. Roles and Access Control


Role

Capabilities

Restrictions

Super Admin

Permitted-company access; policies; shifts; networks; overrides; lock; reports; audit

No access outside explicitly permitted companies

HR Admin

Permitted employees; attendance operations; approvals; reports; lock

Unlock and override require permission

Manager

Reporting-scope views, summaries, regularization and overtime decisions

Cannot modify locked/final records

Employee

Own punch, history, summary, regularization and export

Cannot view others or directly edit final records

Payroll User

Locked summary and payroll export

Read-only unless separately granted

Auditor

Read-only attendance, versions and audit

No operational mutation


3.1 Authorisation Rules


•  Enforce permissions at UI and API levels; hidden controls are not security.

•  RLS shall use identity, company membership, role and reporting scope.

•  Every query and mutation shall be company scoped.

•  IP, device and location details require explicit permission.

•  Service-role credentials shall never be exposed to clients.


4. Module Structure


Area

Audience

Purpose

Attendance Dashboard

HR, Manager

KPIs, trends and exceptions

Daily Attendance

HR, Manager

Selected-date records and actions

Monthly Attendance

HR, Manager, Payroll

Matrix, summary, locking and payroll

Calendar View

All by scope

Daily, weekly, monthly and yearly exploration

My Attendance

Employee

Punch, summary, calendar and requests

Team Attendance

Manager

Team state and approvals

Employee Attendance History

HR, Manager, Employee self

History, timeline and versions

Regularization

Workflow roles

Request, review and recalculation

Manual Attendance

Authorised HR/Admin

Governed correction

Shift Management

HR/Admin

Shift definitions and assignments

Attendance Policies

HR/Admin

Calculation and workflow policy

Office Networks & IPs

Authorised Admin

Whitelist administration

Reports

Authorised roles

Operational, audit and payroll outputs

Audit & Attempt Logs

Admin/Auditor

Immutable operational review


Biometric Sync is a future integration capability and shall not appear as active phase-one navigation.


5. Attendance Dashboard


5.1 KPI Catalogue


KPI

Definition

Total Employees

Active scheduled employees in selected scope

Present Today

Final or provisional present status

Absent Today

Scheduled employees absent after precedence rules

On Leave

Employees covered by approved leave

Work From Home

Approved/valid WFH attendance

Field Duty

Approved/valid field attendance

Late Arrivals

First valid in-punch beyond grace/threshold

Early Departures

Last valid out-punch before threshold

Missing Check-In

Required first in-punch missing

Missing Check-Out

Required out-punch missing

Pending Regularization

Requests awaiting a decision

Employees Checked In

Employees with an active session

Employees Checked Out

Most recent valid session closed

Overtime Employees

Employees with calculated/approved overtime

Attendance Percentage

Present-equivalent divided by scheduled headcount


Each KPI shall show an icon, count, percentage, period trend, clickable filter and last-updated timestamp. Filters include date, range, month, year, company, location, department, team, manager, shift, employment type and status.


5.2 Widgets


•  Status distribution and daily/monthly trend.

•  Department/location attendance.

•  Late-arrival and absenteeism trends.

•  Regularization ageing.

•  Currently checked-in and missing-attendance queues.

•  Upcoming shift changes.

•  Network punch-failure and overtime trends.


6. Daily and Monthly Attendance


6.1 Daily Attendance


The screen shall support server-side search, filter, sort, pagination and export. Columns include employee identity, department, designation, location, manager, shift, scheduled times, first check-in, last checkout, session count, effective hours, breaks, overtime, status, late/early duration, source, regularization and lock state.


Statuses: Present, Absent, Half Day, On Leave, Holiday, Weekly Off, Work From Home, Field Duty, Late Arrival, Early Departure, Missing Check-In, Missing Check-Out, Regularization Pending and Not Scheduled.


Actions include details, manual entry/edit, status override, add punch, regularize, activity and lock/unlock. Every manual action requires permission, reason, confirmation, audit and version capture.


6.2 Monthly Attendance


•  Rows represent employees; date cells show P, A, HD, L, WO, H, WFH, FD, MP or RP with accessible text.

•  Summary columns include working, present, absent, leave, half-day, weekly-off, holiday, late, early, overtime and payable-day totals.

•  Use sticky identity columns and virtualised/horizontally scrollable dates.

•  Actions: export, lock/unlock, recalculate, bulk regularization, reminders and payroll submission.


6.3 Period Locking


•  Locking freezes attendance, regularization and payroll summary.

•  Pending requests must be resolved or explicitly handled before lock.

•  Locked records are visibly immutable without unlock permission.

•  Unlock requires a reason and creates audit/version entries.

•  Re-lock shall reconcile changed records before payroll resubmission.


7. Calendar View and Employee History


7.1 Calendar View


View

Behaviour

Daily

Punches, sessions, calculation, exceptions and actions

Weekly

Seven-day status, scheduled/effective hours and exception totals

Monthly

Status calendar, summary and drill-down

Yearly

Twelve-month heatmap/summary and trend drill-down


Filters include employee, department, team, location, date, month, year and status. Colours: green Present, red Absent, yellow Half Day, blue Leave, purple WFH, orange Late, grey Weekly Off and dark grey Holiday. Codes/icons/text shall reinforce colour.


Selecting a day opens punches, working hours, shift, source, regularization, comments, version history and permitted actions. Overnight shifts display under the assigned shift date.


7.2 Employee Attendance History


•  Daily history shows schedule, every punch, source, authorised network/location details, calculation and requests.

•  Weekly, monthly and yearly views show scheduled hours, effective hours, presence equivalents, exceptions, overtime and payable days.

•  Users may compare a period with the preceding equivalent period.

•  Employees see self only; managers and HR remain scope restricted.


7.3 Timeline


The chronological timeline combines shift assignment, punch attempts, accepted punches, calculations, manual changes, regularization, lock/unlock and payroll events. Each event shows trusted time, actor/source, type, outcome and safe summary.


7.4 Version History


Field

Requirement

Version

Monotonic per attendance record

Changed at/by

Trusted server time and authenticated actor/service

Reason

Mandatory for edit, override, unlock and void

Previous/new value

Field diff or snapshot with protected sensitive data

Source/correlation

UI, API, request, job or integration lineage

Restore

Correction creates a new version; no destructive restore


8. Check-In, Check-Out and Attempt Logs


8.1 Punch Processing


Step

Server Behaviour

Authenticate

Resolve authenticated employee; prohibit punching for another person

Authorise

Validate company, employment status, role and channel

Resolve

Determine trusted time, time zone, shift and shift date

Network

Match server-observed IP to active company/location CIDR

Sequence

Prevent duplicates, replay and invalid in/out order

Attempt

Persist allowed/denied attempt and correlation ID

Punch

Create immutable raw punch when allowed

Calculate

Rebuild sessions, hours, status, late/early and overtime

Respond

State saved/not saved, timestamp, status and next action

Publish

Create audit/timeline and permitted Realtime update


8.2 Multiple Punches and Effective Hours


Multiple IN/OUT sessions are supported. Effective Working Hours = sum of valid closed session durations minus configured unpaid break deductions. Raw punches remain immutable. Missing checkout does not create final hours unless a policy supplies provisional treatment.


•  Paid/unpaid breaks are policy driven.

•  Invalid, overlapping and duplicate sequences are flagged or rejected.

•  Idempotency keys protect retries.

•  Overtime requires eligibility and threshold completion.

•  Approved correction causes deterministic recalculation.


8.3 Attempt Logs


Field

Requirement

Employee/company

Authenticated subject and tenant

Attempt time

Trusted UTC server time and applicable time zone

Action/source

In/out and web/mobile/API/manual/biometric

Observed IP

Server-observed address after trusted proxy handling

Network match

Matched range/location or denial reason

Device/browser

User agent and safe metadata

Location

Only where permitted and legally supported

Outcome

Allowed, denied, duplicate, rate-limited, error or not saved

Reason code

Machine code and user-safe message

Correlation ID

Links request, punch, calculation and audit


An attempt is recorded even when denied or when persistence fails after validation. Logs are append-only, access controlled, searchable and retained by policy. Employees do not receive internal network details.


9. Office Network Whitelisting and IP Management


9.1 Mandatory Rule


Web and mobile office check-in/out shall be allowed only when the server-observed client IP matches an active authorised network for the employee's permitted office/location. Browsers cannot securely expose Wi-Fi SSIDs. Client-supplied IPs, SSIDs and network flags shall never authorise a punch.


9.2 Network Configuration


Field

Rule

Company/location

Required; location belongs to company

Name/code

Unique within company/location

Public IP/CIDR

Valid canonical IPv4/IPv6 address or CIDR

Effective dates

Optional activation window

Status

Draft, Active, Inactive or Expired

Allowed actions

Check-in, checkout or both

Audit fields

Actor, time, reason and version


9.3 Administration


•  Search/filter by company, location, status, IP/CIDR and date.

•  Create, edit, activate, deactivate and expire; do not hard-delete after use.

•  Validate syntax, reject wildcard representations and flag overlapping ranges.

•  Test an IP against current rules without creating a punch.

•  Bulk import/export with row validation and error report.

•  Show last match/usage only to authorised administrators.

•  Disabling a recently used range requires impact confirmation and reason.


9.4 Security Rules


•  Trust forwarded headers only from configured reverse proxies.

•  Match canonical addresses server-side using proven CIDR logic.

•  Rate-limit and protect endpoints with idempotency.

•  Matching public egress IP is authoritative unless stronger controls are implemented.

•  Manual attendance, approved WFH/field work, biometric and regularization use explicit separate workflows and never silently bypass this rule.


10. Attendance Regularization


The form includes attendance date, existing and requested times/status, request type, reason, attachment, derived approver and notes. Request types include missed in/out, incorrect time, WFH, field visit, device failure, official duty, incorrect shift and Other.


Workflow: Draft → Submitted → Pending Manager → Pending HR when configured → Approved or Rejected. Additional states: Sent Back, Cancelled, Auto-Approved and Expired.


•  Submission captures the current version for concurrency checking.

•  Approvers may approve, reject, send back, comment, view evidence/history or edit-and-approve when permitted.

•  Approval creates a new attendance version and recalculates.

•  Rejection preserves attendance.

•  Duplicate active requests are prevented.

•  Windows and period locks are enforced.

•  Every transition is timestamped and audited.


11. Manual Attendance and Overrides


•  Authorised users may add/correct employee, date, shift, times, status, break, reason, attachment and comment.

•  Reason is mandatory; source is visibly Manual.

•  Raw/biometric punches are never silently overwritten.

•  Warn on existing attendance, lock, leave conflict, duplicate time and invalid sequence.

•  Bulk entry provides preview, row validation, partial-failure results and error download.

•  Voiding replaces deletion and requires elevated permission and reason.


12. Team Attendance


•  Managers see permitted direct and indirect reports only.

•  Summary covers present, absent, leave, late, not checked in, missing checkout, WFH/field, overtime and pending requests.

•  Actions: decide requests, mark official duty if permitted, view history, remind and export.

•  Delegation is effective-dated and audited if supported.

•  Bulk approval is limited to eligible homogeneous items and creates item-level decisions.


13. Shift Management


Shift definition includes name/code, start/end, time zone, grace, thresholds, full/half-day minimums, breaks, overtime, weekly-off pattern, overnight/flexible flags and status.


•  Codes are company-unique; used shifts are effective-dated/versioned.

•  Overnight punches associate with configured shift date.

•  Assign by employee, department, team, location or employment type.

•  Support permanent, range, rotational, temporary and bulk assignments.

•  Employee-specific assignment takes precedence; ties resolve deterministically.

•  Overlaps are blocked or explicitly resolved in preview.

•  Changes recalculate affected unlocked dates only and are audited.


14. Attendance Policies


Area

Configuration

Cycle/lock

Boundaries, lock date and reopen authority

Late/early

Grace, thresholds, count limits and conversion rules

Day status

Full/half-day minimums, absence, missing punch and precedence

Breaks

Paid/unpaid, fixed/actual and minimum/maximum treatment

Overtime

Eligibility, threshold, rounding, caps, approval and payroll mapping

WFH/field

Eligibility, approval, network exemption route and evidence

Regularization

Window, request limits, approvers and attachments

Network

Channels requiring CIDR and permitted locations

Calculation

Rounding, overnight windows, sessions and triggers


Policies are company-scoped, effective-dated and versioned. Published policies are not silently changed retroactively. A preview should show impact. Applicable-policy conflicts resolve by explicit priority and appear in calculation lineage.


15. Overtime Management


•  Calculate from eligible effective hours against shift and policy.

•  States: Not Applicable, Calculated, Pending Approval, Approved, Rejected and Sent to Payroll.

•  Managers/HR may decide or adjust with reason/comment within scope.

•  Rounding, caps and rest-day/holiday treatment are policy driven.

•  Locked/submitted overtime requires governed reopening.


16. Enhanced Reports


Category

Reports

Operational

Daily, checked-in, missing punches, attempts and exceptions

Period

Monthly matrix, employee summary, weekly/yearly and payable days

Exceptions

Late, early, absence, invalid sequence, network denial and ageing

Work mode

WFH, field duty and office attendance by location

Overtime

Calculated, pending, approved and payroll submitted

Audit/configuration

Shift, policy, network/IP, attendance audit and versions

Integration/payroll

Future sync status, payroll summary and reconciliation


•  Filters: company, date range, employee, department, location, team, manager, shift, status, source and employment type.

•  Export to Excel, CSV and PDF; sensitive columns depend on permission.

•  Large reports run asynchronously with progress, secure expiring download and failure detail.

•  Exports show generation time, filters, tenant scope and data-as-of time.

•  Totals reconcile with filtered screens and locked payroll summaries.


17. Notifications


Notify successful and denied punches, missing punches, late/early exceptions, regularization transitions, shift changes, period lock/unlock, overtime decisions and integration failures. Phase-one channels are in-app and email. Messages shall state whether attendance was saved and avoid unnecessary sensitive/internal details.


18. UI, Responsive and Accessibility


18.1 UI Standards


•  Use the specified Next.js, TypeScript, Tailwind and shadcn/ui stack.

•  Consistent headers, breadcrumbs, filters, saved views, primary actions and data-as-of indicators.

•  Drawers/modals preserve page context.

•  Provide loading, empty, error, partial and permission states.

•  High-impact actions show confirmation and impact.

•  Tables support keyboard access, sorting, pagination/virtualisation, column visibility and export.


18.2 Responsive Behaviour


Viewport

Requirement

Desktop

Full dashboards, dense tables, matrix, bulk actions and filters

Tablet

Horizontal scrolling, compact filters, drawers and touch controls

Mobile

Employee-first punch, calendar, summary, regularization and approval cards; matrix becomes day cards


18.3 Accessibility and Messages


•  Target WCAG 2.1 AA for supported flows.

•  Keyboard-operable controls with visible focus.

•  Status is not communicated by colour alone.

•  Inputs have labels, instructions and associated errors.

•  Outcomes use appropriate live announcements.

•  Every error explains what happened, whether data saved and the next action.

•  Retry is safe/idempotent where offered.


19. Data, Integration and Technical Requirements


Entity

Purpose

attendance_records

Calculated record per employee and shift date

attendance_punches

Immutable raw IN/OUT event

attendance_sessions

Derived paired sessions and duration

attendance_attempt_logs

Allowed/denied/error attempts

attendance_versions

Immutable record snapshots/diffs

attendance_timeline_events

Unified chronological events

regularization_requests/actions

Correction and approval history

shifts/versions/assignments

Effective schedules

attendance_policies/versions

Effective calculation rules

office_networks

Company/location IP/CIDR whitelist

period_locks

Lock and payroll handoff state

audit_logs

Security/business audit trail

report_jobs

Asynchronous export lifecycle


19.1 Constraints and Processing


•  Tenant records include `company_id` and validated foreign keys.

•  One final record per employee/shift date; many raw punches allowed.

•  Store timestamps in UTC; resolve/display in applicable time zone.

•  Do not hard-delete attendance, punch, attempt, version or audit records.

•  Attachments use private storage and expiring access.

•  Realtime subscriptions obey RLS.

•  Recalculation, reports, notifications and future ingestion use idempotent retryable jobs.


19.2 Future Biometric Boundary


Maintain adapters for eSSL, ZKTeco, generic API, CSV and middleware. Store raw logs separately; deduplicate; map users; retain unmapped/error queues; support replay. Keep the active phase-one UI behind a disabled feature flag.


20. Business and Validation Rules


ID

Rule

BR-01

Checkout cannot precede check-in except valid overnight sequencing.

BR-02

Duplicate/replayed events do not create duplicate punches.

BR-03

Employees punch only for authenticated self.

BR-04

Inactive/terminated employees cannot punch.

BR-05

Calculation uses the effective shift and policy.

BR-06

Holidays and weekly offs are not automatically absent.

BR-07

Approved leave overrides absence; WFH/field remain distinct.

BR-08

Missing punches remain explicit until governed resolution.

BR-09

Manual changes, overrides, voids and unlocks require reason.

BR-10

Every material change creates audit and version history.

BR-11

One final status exists per employee and shift date.

BR-12

Effective changes do not silently rewrite locked history.

BR-13

Every operation is scoped by company_id.

BR-14

Sensitive location, IP and device data are permission controlled.

BR-15

Attendance and raw punches are not hard-deleted.

BR-16

Locked attendance is immutable without authorised unlock.

BR-17

Office web/mobile punches require server-side network match.

BR-18

Client IP, SSID and network claims are never trusted.

BR-19

Regularization respects windows and period locks.

BR-20

Approved corrections recalculate and create a new version.

BR-21

Payroll submission requires a reconciled locked period.

BR-22

Rounding and time-zone rules are deterministic and visible.


21. Audit, Security and Privacy


•  Audit punches, denied attempts, manual changes, requests, shift/policy/network changes, lock/unlock, overtime, exports and payroll submission.

•  Include actor, subject, company, server time, permitted IP/device, previous/new value, reason, source, status and correlation ID.

•  Audit/version data are append-only and access controlled.

•  Test RLS for tenant isolation, manager scope, employee self and privileged service paths.

•  Never log credentials, tokens or unnecessary personal data.

•  Retention and export follow client privacy/legal policy.


22. Non-Functional Requirements


Category

Requirement

Performance

Dashboard within 2 seconds under agreed standard load; immediate authoritative punch response; virtualisation for large data

Reliability

Idempotent punches, jobs and recalculation; safe retries and dead-letter visibility

Scalability

Indexed tenant-safe period queries and asynchronous reports

Security

Least privilege, RLS, trusted proxy/IP, secrets protection and rate limiting

Observability

Correlated logs, metrics, traces and alerts for punch/job/calculation failures

Compatibility

Agreed current evergreen browsers and responsive sizes

Maintainability

Typed interfaces, migrations, tested calculation engine and adapters

Accessibility

WCAG 2.1 AA target for critical journeys

Localisation

Locale-aware formats, time zones and externalised text


23. Primary Workflows


23.1 Office Punch


Authenticate → resolve employee/company/shift → validate employment/channel → derive server-observed IP → match active location network → log attempt → validate sequence/idempotency → save raw punch → calculate → audit/timeline → explicit saved response → Realtime update.


23.2 Denied Network Punch


Authenticate → observe IP → no match → write denied attempt → create no punch → return “attendance not saved” and next action → optionally route to regularization or approved work-mode process.


23.3 Regularization


Select date → display current record/history → submit correction/evidence → manager review → optional HR review → decide/send back → on approval create new version and recalculate → notify → audit/timeline.


23.4 Monthly Closure


Select period → recalculate → resolve exceptions → reconcile → lock → create payroll summary → submit/export → record acknowledgement. Correction requires unlock, new versions, re-lock and resubmission.


23.5 Network Administration


Select company/location → enter CIDR/effective dates → validate and check overlaps → test → save draft → activate → match eligible punches → deactivate/expire with impact and reason.


24. Definition of Done


24.1 Functional Acceptance


ID

Acceptance Criterion

AC-01

Role-appropriate navigation and actions work within scope.

AC-02

Office punches succeed only on active authorised server-observed CIDR and create attempts.

AC-03

Denied punches create no punch and clearly state not saved.

AC-04

Sessions, overnight shifts, status and overtime calculate correctly.

AC-05

Daily, monthly, calendar and history views reconcile.

AC-06

Regularization follows approvals, windows and locks.

AC-07

Manual changes and unlocks require reason/version/audit.

AC-08

IP administration validates CIDR and is tenant/location scoped.

AC-09

Dashboard drill-down matches KPI filters.

AC-10

Reports reconcile with UI and locked payroll summary.

AC-11

Mobile punch/calendar/request flows are usable.

AC-12

Empty, loading, error and permission states are safe and clear.


24.2 Engineering and Quality Completion


•  Requirements trace to approved stories and tests.

•  Migrations, constraints, indexes, effective dating and company scope are reviewed.

•  RLS tests prove tenant, self, manager and admin isolation.

•  Unit tests cover calculation, CIDR, shift date, precedence and rounding.

•  Integration tests cover idempotency, attempts, requests, lock, Realtime and reports.

•  End-to-end tests cover employee, manager and HR paths and denials/errors.

•  Security review covers proxy spoofing, escalation, rate limiting and sensitive logs.

•  Accessibility and representative-load performance tests pass.

•  Audit/version/timeline are verified for all material mutations.

•  Monitoring, alerts, retry/dead-letter handling and runbooks are ready.

•  Product, HR, Technology and QA sign off deviations and release.


24.3 Release Exit Conditions


•  No open critical/high defects without explicit acceptance.

•  Production companies, locations, time zones, shifts, policies, calendars and networks are configured.

•  Migration/reconciliation and rollback rehearsals pass where applicable.

•  Support ownership and monitoring are active.

•  Deferred biometric/optional channels remain disabled until approved.


25. Traceability Summary


Requested Enhancement

Section

Updated KPI dashboard

5

Daily/monthly attendance

6

Calendar and daily/weekly/monthly/yearly history

7

Timeline and version history

7.3–7.4

Attempt logs

8.3

Office Network Whitelisting and IP Management

9

Regularization/manual attendance

10–11

Shift, policy and overtime

13–15

Enhanced reports

16

UI and responsive requirements

18

Business rules and workflows

20 and 23

Definition of Done

24


Appendix A. Open Decisions


ID

Decision

Owner

OD-01

Payroll interface and acknowledgement

Payroll / Technology

OD-02

Retention for IP, device and location data

Legal / Security / HR

OD-03

Load figures for performance test

Product / Technology

OD-04

HR review rules after manager approval

HR Process Owner

OD-05

Overtime rounding/caps/holiday treatment

HR / Payroll

OD-06

VPN/proxy policy and egress topology

Security / IT

OD-07

Browser, locale and conformance statement

Product / QA

OD-08

Biometric activation and provider priority

Product / IT

Confidential • Version 1.0	Page 