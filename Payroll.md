HRMS Payout & Payroll Module
UX and Functional Requirements Specification
Module: Payroll and Payout Management
Version: 1.0
Document status: Proposed
Primary integrations: Employee Profile, Attendance, Leave, Holiday Calendar, Salary Structure, Finance and Notifications
1. Module Overview
The Payout module calculates and processes each employee’s monthly salary from the assigned salary structure, payable calendar days, attendance, approved leave, holidays, weekly offs and configured payroll policies. Saturday and Sunday are paid calendar days by default. Their treatment may change only through an active, effective-dated policy such as a sandwich policy.
The module must support policy-driven calculations, explain every deduction, generate salary slips, complete approval and payment workflows, and publish approved slips to the employee profile without changing historical payroll results.
2. Objectives
Calculate accurate employee payout for each payroll period.
Count Saturday, Sunday and configured weekly offs as paid days by default.
Combine present days, approved paid leave, holidays and eligible weekly offs into payable days.
Apply unpaid leave, loss of pay, attendance shortage and sandwich-policy deductions transparently.
Allow administrators to create, test, assign, version and activate payout policies dynamically.
Support payroll review, approval, locking, payment marking and controlled reprocessing.
Generate downloadable salary slips and publish them securely to employee profiles.
Maintain complete calculation, approval, policy-version and publication audit history.
3. Roles and Permissions
Super Admin: full configuration, override, reopen and audit access.
HR Admin: manage payroll inputs, policies, exceptions and employee salary structures.
Payroll/Finance: calculate, review, approve, lock, export and mark payouts as paid.
Manager: review attendance or leave exceptions for assigned employees, where permitted.
Employee: view personal payout history and published salary slips only.
Auditor: read-only access to runs, policies, slips and logs.
4. Module Structure
Screen 1 — Payroll Dashboard and Payroll Runs.
Screen 2 — Payroll Run Detail and Employee Calculations.
Screen 3 — Employee Payout Detail.
Screen 4 — Payout Policy Builder.
Screen 5 — Salary Slip Templates and Publishing.
Screen 6 — Reports, Exports and Audit Log.
5. Payroll Dashboard and Run Creation
5.1 Dashboard
Show Total Employees, Gross Payroll, Total Deductions, Net Payroll, Employees on Hold, Exceptions, Draft Runs, Approved Runs and Paid Runs. Filters must include company, legal entity, location, department, employment type, payroll group, month and run status.
5.2 Create Payroll Run
Select company/legal entity, payroll group, month, pay period and payment date.
Display the attendance cut-off, leave cut-off, employee count and currently effective policy versions.
Include active employees whose joining date is on or before period end and whose separation rules permit payout.
Support regular, off-cycle, arrear, full-and-final and correction runs.
Prevent overlapping finalized regular runs for the same employee and pay period.
Create the run as Draft and record the input snapshot time.
5.3 Payroll Run Status
Supported lifecycle: Draft → Calculating → Review Required → Approved → Locked → Payment Processing → Paid → Published. Cancelled and Reopened are controlled exception states. A locked run cannot be changed unless an authorized user reopens it with a mandatory reason.
6. Salary and Payable-Day Calculation
6.1 Required Inputs
Employee salary structure and effective date.
Payroll period start and end dates.
Joining, separation and last-working dates.
Attendance status for every in-scope date.
Approved paid leave, unpaid leave and half-day leave.
Company holiday and employee weekly-off calendar.
Shift, grace, late-coming, early-exit and missing-punch rules.
Active payout and statutory policy versions.
Approved earnings, deductions, reimbursements, incentives, arrears, loans and recoveries.
6.2 Day Classification
Each calendar date must resolve to one final payroll classification: Present, Half Day Present, Paid Leave, Unpaid Leave/LOP, Weekly Off, Holiday, Absent, On Duty, Work From Home, Not Joined, Separated, or Attendance Pending. Conflicting source records must create an exception instead of being silently resolved.
6.3 Paid Weekend Rule
Saturday and Sunday are counted as paid days by default, even when there is no attendance punch. A weekend is unpaid only when a valid policy explicitly converts it to loss of pay—for example, an active sandwich policy—or when it lies outside the employee’s payable employment period.
6.4 Default Formula
Calendar Days = number of dates in the payroll period.
Employment-Eligible Days = dates from the later of period start or joining date through the earlier of period end or payable separation date.
Paid Days = Present + paid fraction of Half Days + Approved Paid Leave + Holidays + Eligible Weekly Offs + other configured paid statuses.
LOP Days = Unapproved Absence + Approved Unpaid Leave + unpaid fraction of Half Days + policy-generated unpaid days.
Payable Days = Employment-Eligible Days − LOP Days, capped between zero and Employment-Eligible Days.
Prorated Fixed Earning = Monthly Fixed Earning × Payable Days ÷ Policy Divisor.
Net Pay = Gross Earnings + Reimbursements + Arrears − Statutory Deductions − Other Deductions − Recoveries.
The Policy Divisor must be configurable as calendar days in the month, fixed 30 days, scheduled working days, or another approved formula. The run must store the divisor and policy version used for each employee.
6.5 Partial Days and Rounding
Support full day, half day and configurable fractions such as 0.25.
Apply day rounding, component rounding and final-net-pay rounding from policy.
Never allow rounding to create negative payable days.
Show unrounded source value and rounded applied value in the calculation trace.
6.6 Joiners, Separations and Holds
Prorate new joiners from joining date, including eligible weekends and holidays within employment.
Prorate separated employees through the payable last-working date.
Support notice pay, leave encashment, gratuity, recoveries and final settlement where configured.
Allow payout hold with reason, owner and release action without removing the employee from the run.
Employees with missing salary structure, unresolved attendance or invalid bank/payment data must be flagged.
7. Dynamic Payout Policy Builder
7.1 Policy Administration
Administrators can create a policy from scratch or duplicate an existing policy. Every policy must contain a name, unique code, category, description, company/legal entity, applicability scope, priority, effective-from date, optional effective-to date, status, evaluation rule and payroll outcome.
7.2 Supported Policy Categories
Sandwich leave and absence policy.
Weekly-off and weekend eligibility.
Holiday eligibility.
Attendance shortage, late-coming and early-exit conversion.
Missing punch treatment.
Paid and unpaid leave mapping.
Half-day and fractional-day rules.
Proration divisor and rounding.
Overtime, incentive, allowance and reimbursement.
Arrears, recovery, loan and advance deduction.
Joining, separation and full-and-final payout.
Minimum payable days, payout hold and exception routing.
7.3 Rule Builder
The rule builder uses conditions and actions. Conditions may reference employee group, location, department, designation, employment type, shift, date type, attendance status, leave type, consecutive days, adjacent dates, holiday/weekend boundaries and approval status. Operators include equals, not equals, in, not in, greater than, less than, between, before, after, AND and OR. Actions may mark a day paid/unpaid, assign a fraction, add earning, add deduction, hold payout, require review or exclude a date.
7.4 Policy Controls
Draft, Active, Inactive and Archived statuses.
Effective dating and immutable published versions.
Scope assignment by company, payroll group, location, department, employee type or selected employees.
Priority and conflict-resolution order.
Preview in plain language before saving.
Simulation against selected employees and periods before activation.
Impact count showing affected employees and dates.
Maker-checker approval for policy activation.
No retroactive recalculation unless an authorized user explicitly starts it.
8. Sandwich Policy
8.1 Definition
A sandwich policy may convert intervening weekly offs or holidays into unpaid days when they fall between qualifying absences or unpaid leave. It is disabled by default unless the organization activates and assigns it.
8.2 Configurable Parameters
Trigger statuses: absent, unpaid leave, unapproved leave or selected combinations.
Boundary rule: both sides required, either side sufficient, or configurable consecutive-day pattern.
Intervening date types: Saturday, Sunday, weekly off, public holiday or optional holiday.
Maximum bridge length.
Whether approved paid leave can trigger or break the sandwich.
Whether half days qualify and at what threshold.
Exempt leave types such as maternity, bereavement, medical or company duty.
Exempt employee groups, locations, shifts and probation/notice-period cases.
Cross-month handling: apply in current month, next month, arrears adjustment or do not bridge periods.
Action: full-day LOP, fractional LOP or review-required exception.
8.3 Examples
Example A: Friday Absent + Saturday/Sunday Weekly Off + Monday Absent. With a both-sides sandwich rule, four LOP days apply. Without that rule, only Friday and Monday are LOP and Saturday/Sunday remain paid.
Example B: Friday Approved Paid Leave + weekend + Monday Present. The weekend remains paid unless the configured policy explicitly treats that leave type and one-sided boundary as a trigger.
Example C: Absence before a public holiday and absence after it. The holiday becomes LOP only when the active policy includes holidays and both boundary conditions match.
8.4 Explainability
Every sandwich result must show the triggering dates, matched conditions, converted dates, applied policy name and version, before/after payable-day count, and override history. Authorized users may override the result only with a reason and approval trail.
9. Payroll Run Detail
The employee calculation grid must support search, filters, sorting, bulk selection, frozen identity columns, export and virtual scrolling. Columns include Employee ID, Name, Department, Payroll Group, Calendar Days, Present, Paid Leave, Weekly Off, Holiday, LOP, Sandwich LOP, Payable Days, Gross, Deductions, Net Pay, Exceptions and Status.
Recalculate selected employees or the full run.
Compare current result with the previous month.
Open employee-level calculation trace.
Bulk approve, hold, release, export or publish where authorized.
Show unresolved exceptions before approval.
Require confirmation and an audit note for material overrides.
10. Employee Payout Detail
Employee and bank/payment summary.
Salary structure and effective version.
Calendar showing date-wise attendance, leave, weekend, holiday and final payroll classification.
Payable-day summary and formula divisor.
Earnings, deductions, reimbursements, arrears and employer contributions.
Policy results and calculation trace.
Exceptions, comments, approvals and override history.
Previous-month comparison.
Actions: Recalculate, Hold, Release, Approve, Download Draft Slip and View Published Slip.
11. Salary Slip Generation
11.1 Slip Content
Company name, registered address, logo and statutory identifiers where configured.
Employee name, ID, department, designation, location, joining date and bank-account mask.
Pay period, payment date, payable days, LOP days and optional attendance summary.
Earnings with current amount and optional year-to-date values.
Deductions with current amount and optional year-to-date values.
Gross earnings, total deductions, reimbursements and net pay.
Net pay in words, payment reference and status.
Template version and generation identifier.
Confidentiality notice and authorized signatory area.
11.2 Template Management
Support multiple salary-slip templates by company, legal entity, country, payroll group and language. Administrators may configure visible fields, component labels, ordering, logo, footer, signatory and whether zero-value components appear. Published template versions are immutable for historical slips.
11.3 Generation Rules
Generate a preview before final publication.
Generate final slips only from an approved or locked run.
Create slips in bulk and individually.
Regeneration after a correction must create a new version and retain the previous version as superseded.
Prevent slip visibility to the employee until publication succeeds.
Provide secure PDF download and browser view.
Mask sensitive bank and identity information.
12. Publish to Employee Profile
After approval, authorized payroll users can publish salary slips to Employee Profile → Compensation/Payroll → Salary Slips. The employee sees only their own published slips, organized by year and month, with view and download actions.
Support immediate or scheduled publication.
Show queued, processing, published, partially failed and failed states.
Send in-app and optional email notification after successful publication.
Retry failed employees without duplicating successful publications.
Allow controlled unpublish only for authorized roles, with reason and audit record.
Replacement publication must label the old slip Superseded and the new slip Current.
Employee access must end or continue after separation according to portal-retention policy.
13. Approval, Locking and Payment
Configurable maker-checker or multi-level approval.
Approval summary must include employee count, gross, deductions, net, exceptions and changes since last calculation.
Approval is blocked while critical exceptions remain, unless an authorized override policy allows it.
Lock the approved input snapshot and calculation results.
Export bank-payment advice or integrate with the payment system.
Mark Paid using payment date, reference and batch identifier.
Salary slip publication may be configured after approval, after lock or after Paid status.
14. Exceptions and Notifications
Missing or overlapping salary structure.
Attendance or leave not finalized by cut-off.
Unresolved attendance conflict or missing punch.
Negative net pay or zero pay requiring review.
Policy conflict or circular rule dependency.
Bank/payment data missing.
Material variance from prior period.
Slip generation or publication failure.
Notify responsible users with severity, employee, reason and recommended action.
15. Audit, Versioning and Data Integrity
Record actor, timestamp, action, employee/run, old value, new value, reason and source.
Snapshot salary structure, attendance totals, leave totals, calendars and policy versions used by the run.
Historical payroll must not change when a policy or employee salary structure is edited later.
Record recalculation, override, approval, reopening, locking, payment, slip generation, publish, unpublish and download events.
Restrict payroll data and salary slips by role, company and employee scope.
Encrypt sensitive data in transit and at rest according to platform standards.
16. Validation Rules
Pay period start must be on or before end.
An employee cannot have two finalized regular payouts for the same period.
Payable days cannot exceed employment-eligible days or fall below zero.
LOP and paid classifications cannot double-count the same day.
Saturday/Sunday cannot become unpaid without a traceable policy result or out-of-employment status.
Policy effective ranges must be valid and non-overlapping where precedence is ambiguous.
Policy conditions and actions are mandatory before activation.
Critical policy conflicts must block activation.
Net pay must equal total payable earnings minus deductions and recoveries.
Published slips must match the locked payout version.
17. Reports and Exports
Payroll register.
Employee payout summary and detailed calculation report.
Attendance-to-payroll reconciliation.
Leave and LOP report.
Sandwich-policy impact report.
Earnings and deduction component report.
Bank transfer advice.
Statutory contribution report where configured.
Salary slip publication status.
Payroll variance and audit report.
Exports must respect active filters, permissions and data-masking rules.
18. Responsive and Accessibility Requirements
Desktop: full payroll grid, filters and side-by-side calculation detail.
Tablet: responsive grid with horizontal scroll and collapsible filters.
Mobile: employee salary-slip view and download; administrative calculations may be read-only.
Status must never be conveyed by color alone.
All controls require keyboard focus, accessible names and meaningful error text.
Drawers and dialogs must trap focus, close on Escape and return focus to the opener.
19. Core User Flows
19.1 Monthly Payroll
Create Run → Freeze input snapshot → Calculate → Review exceptions → Correct source data or override → Recalculate → Approve → Lock → Process payment → Mark Paid → Generate slips → Publish to employee profiles.
19.2 Create and Activate Policy
Create/Duplicate Policy → Define scope and effective dates → Build conditions and actions → Preview rule → Simulate impact → Resolve conflicts → Submit for approval → Activate → Apply only to eligible calculations.
19.3 Correct a Published Payout
Authorized user reopens or creates a correction run → records reason → recalculates affected employee → obtains approval → locks corrected result → generates a new slip version → publishes replacement → old slip becomes Superseded.
20. Acceptance Criteria
AC-PAY-001: A standard monthly run calculates each employee from salary structure, employment dates, attendance, leave, weekly offs, holidays and active policy versions.
AC-PAY-002: Saturday and Sunday are paid by default and appear in the employee calculation trace.
AC-PAY-003: A weekend or holiday becomes LOP only when a configured policy matches, and the UI explains the exact trigger.
AC-PAY-004: Present, paid leave, unpaid leave, holiday, weekly off and fractional days reconcile to the payable-day result without double counting.
AC-PAY-005: Joiners and separations are prorated only within their employment-eligible dates.
AC-PAY-006: Administrators can create, version, scope, simulate, approve and activate payout policies without code changes.
AC-PAY-007: Sandwich-policy settings support boundary statuses, date types, exemptions, bridge length and cross-month handling.
AC-PAY-008: Recalculation uses the latest eligible source snapshot while preserving all prior calculation versions.
AC-PAY-009: Critical exceptions block approval unless a permitted, reasoned override is recorded.
AC-PAY-010: Approved payroll can be locked, paid and audited without later policy changes modifying its results.
AC-PAY-011: Salary slips are generated from the locked payout and show earnings, deductions, payable days, LOP and net pay.
AC-PAY-012: Published salary slips are visible only in the correct employee profile and downloadable securely.
AC-PAY-013: Failed publications can be retried without duplicating successful employee slips.
AC-PAY-014: Corrected slips create a new version and retain the previous slip as Superseded.
AC-PAY-015: All configuration, calculation, override, approval, payment and publication actions are permission-aware and auditable.
21. Open Configuration Decisions
Default salary divisor: actual calendar days, fixed 30 days or scheduled working days.
Default weekend pattern for each payroll group.
Exact sandwich-policy trigger and exemptions.
Attendance and leave cut-off dates.
Statutory deductions and country-specific compliance.
Required approval levels and material-variance threshold.
Whether slips publish after approval, lock or payment.
Employee portal access period after separation.
22. Expected Outcome
The Payout module will provide a transparent, configurable and auditable payroll process in which employee salary is calculated from attendance and leave while Saturday and Sunday remain paid by default. Organizations can define policies such as sandwich rules without development changes, review every policy-generated impact, approve and lock payouts, generate versioned salary slips, and securely publish them to employee profiles.

