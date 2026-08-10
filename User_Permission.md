HRMS Payout Module — Roles and Permissions FRD

Module: Payroll and Payout ManagementDocument Type: Functional Requirements DocumentVersion: 1.0Status: Proposed

1. Purpose

This document defines the roles, permissions, access controls, approval responsibilities and audit requirements for the HRMS Payout module.

The module processes confidential employee information, including salary structures, attendance, leave, deductions, bank details, payment status and salary slips. Access must therefore follow:

Role-based access control.

Company and legal-entity boundaries.

Employee and department scope.

Separation of payroll preparation and approval.

Minimum required access.

Complete audit tracking.

Secure salary-slip access.

2. Objectives

The Roles and Permissions functionality must:

Restrict payroll information to authorized users.

Prevent employees from viewing another employee’s salary.

Separate payroll calculation, approval and payment responsibilities.

Allow permissions to be assigned dynamically.

Support organization-, company-, department- and employee-level access.

Protect bank, statutory and salary information.

Control policy creation and activation.

Control salary-slip generation and publication.

Record every sensitive action in the audit log.

Prevent unauthorized changes to approved or locked payroll.

3. Scope

This FRD covers access to:

Payroll dashboard.

Payroll runs.

Employee payout calculations.

Attendance and leave payroll inputs.

Employee salary structures.

Earnings and deductions.

Payout policies.

Sandwich policies.

Payroll approval and locking.

Payment processing.

Salary-slip templates.

Salary-slip generation.

Salary-slip publication.

Payroll reports and exports.

Payroll audit logs.

Employee self-service salary-slip access.

Role and permission administration.

4. Access-Control Model

Access must be determined using the following rule:

Effective Access = Role Permission + Data Scope + Record Condition + Workflow Status

A user may perform an action only when all four conditions permit it.

4.1 Role Permission

Defines what the user can do, such as:

View payroll.

Create a payroll run.

Recalculate salary.

Approve payroll.

Publish salary slips.

Export payroll data.

4.2 Data Scope

Defines which records the user can access:

All organizations.

Selected company or legal entity.

Selected branch or location.

Selected department.

Direct and indirect reportees.

Selected payroll group.

Selected employees.

Self only.

4.3 Record Condition

Access may depend on conditions such as:

Employee belongs to the user’s permitted company.

Employee is assigned to the user’s payroll group.

Manager is the employee’s reporting manager.

Salary slip belongs to the logged-in employee.

4.4 Workflow Status

Some actions depend on payroll status:

Draft payroll can be edited.

Payroll under review can be corrected by permitted users.

Approved payroll cannot be edited.

Locked payroll can be reopened only by authorized users.

Salary slips can be published only after the configured approval stage.

Paid payroll cannot be deleted.

5. Standard Roles

5.1 Super Admin

The Super Admin manages the entire platform and has access across all companies where permitted by the organization.

Permissions

Create, edit and deactivate roles.

Assign roles and data scopes.

View all payroll runs.

View employee salary details.

Create and edit payroll runs.

Recalculate payroll.

Create and activate payout policies.

Configure sandwich policies.

Override payroll calculations.

Approve and lock payroll.

Reopen locked payroll.

Generate and publish salary slips.

Unpublish or replace salary slips.

View and export audit logs.

Configure salary-slip templates.

Manage payroll settings and integrations.

Restrictions

Critical actions must require confirmation.

Reopening payroll must require a reason.

Actions cannot be removed from the audit trail.

Super Admin access must not bypass legal-entity data isolation unless specifically assigned.

5.2 HR Admin

The HR Admin manages employee salary information, payroll inputs, attendance exceptions, leave information and payout policies.

Permissions

View payroll dashboard.

View payroll runs within assigned scope.

Create draft payroll runs.

View employee salary structures.

Create and update salary structures.

Review attendance and leave information.

Resolve payroll input exceptions.

Create draft payout policies.

Configure sandwich-policy rules.

Simulate policy impact.

Recalculate payroll.

Place employees on payout hold.

Release payout hold where authorized.

Preview salary slips.

View payroll reports.

Export non-payment payroll reports.

Restrictions

Cannot approve payroll if separation of duties is enabled.

Cannot mark payroll as paid.

Cannot view unmasked bank information unless separately permitted.

Cannot activate a payout policy without approval when maker-checker is enabled.

Cannot reopen locked payroll unless granted a special permission.

Cannot permanently delete finalized payroll records.

5.3 Payroll Executive

The Payroll Executive prepares and reviews payroll calculations.

Permissions

View assigned payroll groups.

Create payroll runs.

Import approved payroll inputs.

Calculate and recalculate payroll.

Review payable days, loss-of-pay days and salary components.

View attendance-to-payroll reconciliation.

Resolve non-critical payroll exceptions.

Add authorized earnings and deductions.

Place payout on hold.

Generate draft salary slips.

Export payroll registers.

Submit payroll for approval.

Restrictions

Cannot approve a payroll run prepared by themselves when maker-checker is enabled.

Cannot activate payout policies.

Cannot change employee master data outside permitted payroll fields.

Cannot mark payment as completed.

Cannot publish final salary slips unless separately authorized.

Cannot reopen locked payroll.

Cannot remove audit entries.

5.4 Payroll Approver

The Payroll Approver reviews and approves payroll prepared by HR or the Payroll Executive.

Permissions

View payroll summaries and employee calculations.

View source reconciliation.

Review policy-generated deductions.

Review sandwich-policy deductions.

Compare payroll with previous periods.

Approve or reject payroll.

Return payroll for correction.

Add approval comments.

Lock approved payroll where authorized.

Approve payout overrides.

View generated salary-slip previews.

Restrictions

Cannot directly modify salary calculations.

Cannot approve their own payroll preparation when maker-checker is enabled.

Cannot change payout-policy conditions during approval.

Cannot mark payroll as paid unless Finance permission is also assigned.

Cannot publish salary slips unless specifically permitted.

5.5 Finance User

The Finance User handles payment preparation, bank files and payment confirmation.

Permissions

View approved payroll totals.

View employee net-pay amounts.

View masked bank details.

View full bank details only with sensitive-data permission.

Export bank-transfer advice.

Generate payment batches.

Enter payment date and payment reference.

Mark a payment batch as processing.

Mark payroll as paid.

Upload or record payment confirmation.

View payment-failure reports.

Retry failed payment records where integration supports it.

View finance-related payroll reports.

Restrictions

Cannot change attendance, leave or payable days.

Cannot edit employee salary structures.

Cannot create or activate payout policies.

Cannot override salary calculations.

Cannot approve payroll unless an additional approver role is assigned.

Cannot view unrelated HR documents.

5.6 HR Manager

The HR Manager supervises payroll activity and policy administration.

Permissions

View payroll across assigned companies or departments.

Review payroll exceptions.

Approve salary-structure changes.

Approve payout-policy activation.

Approve sandwich-policy changes.

Approve payroll overrides.

Approve or reject payroll.

View payroll variance reports.

View salary-slip publication status.

Authorize controlled reopening of payroll where configured.

View audit logs within assigned scope.

Restrictions

Cannot mark payroll as paid unless Finance permission is assigned.

Cannot delete paid payroll.

Cannot edit an active policy version.

Cannot modify employee bank information without specific access.

5.7 Reporting Manager

The Reporting Manager reviews attendance and leave exceptions for their reportees.

Permissions

View attendance summaries for direct and indirect reportees.

View leave status for reportees.

Review missing punches.

Approve or reject attendance regularization.

Approve or reject leave according to leave permissions.

View payroll exceptions requiring manager input.

Add comments before the payroll cut-off.

Restrictions

Cannot view employee salary amounts.

Cannot view net pay.

Cannot view bank or statutory information.

Cannot view salary slips.

Cannot create or approve payroll.

Cannot configure payout policies.

Cannot access employees outside the assigned reporting hierarchy.

5.8 Auditor

The Auditor has read-only access for compliance and verification.

Permissions

View finalized payroll runs.

View payroll calculation history.

View policy versions used in payroll.

View approval and override history.

View salary-slip generation and publication logs.

View payment references where permitted.

View audit logs.

Export authorized audit and compliance reports.

Restrictions

Cannot create, edit, approve, lock or reopen payroll.

Cannot generate or publish salary slips.

Cannot modify policies.

Cannot view full bank details unless separately authorized.

Cannot delete or resolve audit events.

5.9 Employee

The Employee can access only their own payroll information.

Permissions

View personal payout history.

View monthly salary summary.

View and download published salary slips.

View current and previous salary slips.

View whether a salary slip has been replaced.

Raise a payroll query.

View the status of submitted payroll queries.

Receive salary-slip publication notifications.

Restrictions

Cannot view another employee’s salary.

Cannot view unpublished or draft salary slips.

Cannot view internal calculation notes.

Cannot view payroll policies marked as internal.

Cannot modify salary calculations.

Cannot publish, delete or replace salary slips.

Cannot access payroll reports.

6. Permission Categories

Permissions must use unique permission codes.

6.1 Payroll Dashboard

payroll.dashboard.view

payroll.dashboard.view_totals

payroll.dashboard.view_sensitive_totals

payroll.dashboard.export

6.2 Payroll Runs

payroll.run.view

payroll.run.create

payroll.run.edit

payroll.run.calculate

payroll.run.recalculate

payroll.run.submit

payroll.run.approve

payroll.run.reject

payroll.run.lock

payroll.run.reopen

payroll.run.cancel

payroll.run.delete_draft

6.3 Employee Payout

payroll.employee.view

payroll.employee.view_salary

payroll.employee.view_net_pay

payroll.employee.edit_components

payroll.employee.override

payroll.employee.hold

payroll.employee.release

payroll.employee.recalculate

payroll.employee.view_trace

6.4 Salary Structure

salary.structure.view

salary.structure.create

salary.structure.edit

salary.structure.approve

salary.structure.assign

salary.structure.deactivate

salary.structure.view_history

6.5 Attendance and Leave Inputs

payroll.input.attendance_view

payroll.input.leave_view

payroll.input.regularize

payroll.input.finalize

payroll.input.override

payroll.input.reopen

6.6 Payout Policies

payout.policy.view

payout.policy.create

payout.policy.edit_draft

payout.policy.duplicate

payout.policy.simulate

payout.policy.submit

payout.policy.approve

payout.policy.activate

payout.policy.deactivate

payout.policy.archive

payout.policy.view_history

6.7 Sandwich Policies

sandwich.policy.view

sandwich.policy.create

sandwich.policy.edit_draft

sandwich.policy.simulate

sandwich.policy.approve

sandwich.policy.activate

sandwich.policy.override_result

6.8 Payment Processing

payroll.payment.view

payroll.payment.view_bank_masked

payroll.payment.view_bank_full

payroll.payment.export_bank_file

payroll.payment.create_batch

payroll.payment.mark_processing

payroll.payment.mark_paid

payroll.payment.mark_failed

payroll.payment.retry

payroll.payment.reverse

6.9 Salary Slips

salary_slip.view_preview

salary_slip.generate

salary_slip.regenerate

salary_slip.publish

salary_slip.schedule_publish

salary_slip.unpublish

salary_slip.replace

salary_slip.download

salary_slip.view_history

salary_slip.template_manage

6.10 Reports and Audit

payroll.report.view

payroll.report.export

payroll.report.export_sensitive

payroll.audit.view

payroll.audit.export

payroll.audit.view_sensitive

6.11 Role Administration

role.view

role.create

role.edit

role.clone

role.assign

role.deactivate

role.view_assignment_history

7. Permission Matrix

Function

Super Admin

HR Admin

Payroll Executive

Payroll Approver

Finance

Manager

Auditor

Employee

View payroll dashboard

Yes

Yes

Yes

Yes

Limited

No

Yes

No

Create payroll run

Yes

Yes

Yes

No

No

No

No

No

Calculate payroll

Yes

Yes

Yes

No

No

No

No

No

Edit payroll calculation

Yes

Yes

Yes

No

No

No

No

No

Override calculation

Yes

Conditional

Conditional

Approve only

No

No

No

No

Submit payroll

Yes

Yes

Yes

No

No

No

No

No

Approve payroll

Yes

Conditional

No

Yes

No

No

No

No

Lock payroll

Yes

Conditional

No

Yes

No

No

No

No

Reopen payroll

Yes

Conditional

No

No

No

No

No

No

Create payout policy

Yes

Yes

Conditional

No

No

No

No

No

Activate payout policy

Yes

Conditional

No

Conditional

No

No

No

No

Process payment

Yes

No

No

No

Yes

No

No

No

Mark payroll paid

Yes

No

No

No

Yes

No

No

No

Generate salary slips

Yes

Yes

Yes

Preview only

No

No

No

No

Publish salary slips

Yes

Conditional

No

Conditional

Conditional

No

No

No

View own salary slip

Yes

Yes

Yes

Yes

Conditional

Self only

Conditional

Yes

View employee salary

Yes

Yes

Yes

Yes

Net pay only

No

Read-only

Self only

Export sensitive payroll

Yes

Conditional

Conditional

Conditional

Yes

No

Conditional

No

View audit log

Yes

Conditional

Own actions

Yes

Payment actions

No

Yes

No

Manage roles

Yes

No

No

No

No

No

No

No

“Conditional” means the permission depends on configuration, assigned data scope or approval workflow.

8. Dynamic Role Management

Authorized administrators must be able to create custom roles.

Required Role Fields

Role name.

Unique role code.

Description.

Role category.

Applicable company or legal entity.

Data scope.

Selected permissions.

Sensitive-data permissions.

Approval level.

Status.

Effective-from date.

Optional effective-to date.

Supported Actions

Create role.

Clone existing role.

Add or remove permissions.

Assign users.

Assign companies, departments or payroll groups.

Activate or deactivate role.

View assigned users.

View role-change history.

Validation

Role name and code are mandatory.

Role code must be unique.

At least one permission must be selected.

A role cannot approve payroll unless payroll viewing is enabled.

A role cannot mark payroll paid unless payment viewing is enabled.

A role cannot publish slips unless salary-slip generation or preview access is enabled.

A role cannot be deleted while assigned to active users.

System roles may be copied but must not be permanently deleted.

High-risk permission combinations must display a warning.

9. Data Scope Management

Permissions must be combined with one or more data scopes.

Supported Scopes

Global.

Organization.

Legal entity.

Company.

Branch.

Location.

Department.

Team.

Payroll group.

Employment type.

Reporting hierarchy.

Selected employees.

Self only.

Rules

The most restrictive applicable scope must be used.

A user assigned to one company must not access another company’s payroll through search, export or direct URL.

An employee must always have self-only salary access.

A manager’s hierarchy access must update when reporting relationships change.

Historical access must follow the organization’s retention and transfer policy.

Exports must contain only records within the user’s current data scope.

10. Field-Level Security

Sensitive fields require separate permissions.

Field

Default Display

Employee name and ID

Visible within assigned scope

Gross salary

Restricted

Net salary

Restricted

Salary components

Restricted

Bank account number

Masked

IFSC/routing code

Restricted

Tax identifier

Masked

National identity number

Masked

Payment reference

Finance and authorized auditors

Internal calculation comments

Payroll roles only

Override reason

Approvers and auditors

Salary slip

Employee and authorized payroll roles

Masking Requirements

Bank account: show only the final four digits.

Tax and identity number: partially masked.

Full values require explicit sensitive-data permission.

Sensitive values must remain masked in exports unless sensitive-export permission is present.

Search results and notifications must not expose salary or bank data.

11. Separation of Duties

The system must support maker-checker controls.

Required Rules

The creator of a payroll run must not approve the same run when maker-checker is enabled.

The creator of a policy must not approve its activation when policy approval is enabled.

A user applying a salary override must not approve that override when separate approval is required.

Payment initiation and payment confirmation may require different users.

Role administrators must not grant themselves high-risk permissions without secondary approval where configured.

Temporary emergency access must be time-bound and audited.

High-Risk Permission Combinations

The system must warn when one user can:

Prepare and approve payroll.

Approve and reopen payroll.

Create and activate policies.

Edit bank details and mark payments as paid.

Generate, publish and unpublish salary slips.

Assign roles and approve their own role assignment.

12. Payroll Workflow Permissions

Draft

Permitted actions:

Edit inputs.

Calculate and recalculate.

Add or remove eligible employees.

Apply authorized adjustments.

Delete the draft run.

Review Required

Permitted actions:

View exceptions.

Correct source data.

Apply approved overrides.

Recalculate.

Submit for approval.

Approved

Permitted actions:

View.

Reject back for correction before lock.

Lock payroll.

Generate final salary-slip previews.

Editing calculations is not permitted.

Locked

Permitted actions:

Generate payment files.

Process payment.

Generate final salary slips.

Publish salary slips according to configuration.

Reopening requires special permission and a reason.

Paid

Permitted actions:

View payment details.

Generate or publish salary slips.

Create a correction or reversal workflow.

Export reports.

Direct modification or deletion is prohibited.

Published

Permitted actions:

View publication status.

Retry failed publications.

Replace an incorrect slip through versioned correction.

Unpublish only with special permission and reason.

13. Payout-Policy Permissions

Policy Creator

Can:

Create a draft policy.

Define conditions and outcomes.

Configure sandwich rules.

Assign proposed scope.

Run simulations.

Submit for approval.

Cannot:

Activate the policy when maker-checker is enabled.

Modify active policy versions.

Policy Approver

Can:

Review policy logic.

Review employee-impact simulation.

Approve or reject activation.

Add approval comments.

Cannot:

Directly edit the submitted policy. It must be returned to Draft.

Policy Administrator

Can:

Activate an approved policy.

Schedule effective dates.

Deactivate a policy.

Create a new version.

Archive expired versions.

Policy Version Rules

Active versions are immutable.

Editing an active policy creates a new draft version.

Previous payroll runs retain the policy version originally used.

Retroactive application requires explicit recalculation permission.

Policy overrides require reason and audit history.

14. Salary-Slip Permissions

Payroll Team

May:

View a draft preview.

Generate slips from approved or locked payroll.

Review generation errors.

Publisher

May:

Publish immediately.

Schedule publication.

Retry failed publication.

View publication status.

Authorized Administrator

May:

Unpublish a slip.

Replace a published slip.

Regenerate after an approved correction.

Employee

May:

View only published slips belonging to them.

Download the current slip.

View previous superseded versions only if company policy allows.

Raise a query against a salary slip.

Rules

Draft slips must never appear in the employee profile.

An employee must not access another employee’s slip by changing a URL or request identifier.

A replaced slip must be marked “Superseded.”

The latest valid slip must be marked “Current.”

Publication and download events must be audited.

Salary-slip links must be authenticated and must not be publicly accessible.

15. Approval Configuration

The system must allow approval workflows by:

Company.

Legal entity.

Payroll group.

Payroll amount.

Employee count.

Variance threshold.

Off-cycle payroll type.

Full-and-final settlement.

Policy category.

Override amount or number of affected days.

Approval Levels

Example:

Payroll Executive submits.

HR Manager reviews.

Payroll Approver approves.

Finance processes payment.

Authorized Publisher publishes salary slips.

Approval Rules

Approval comments may be mandatory.

Rejection must require a reason.

Any recalculation after approval must invalidate the approval.

Any material change after submission must restart the applicable approval flow.

Approvers must see a summary of changes made since the previous submission.

Delegated approval must have start and end dates.

16. Audit Requirements

The system must record:

User ID and name.

User role.

Date and time.

Company and legal entity.

Target record.

Payroll period.

Action performed.

Previous value.

New value.

Reason or comments.

IP address or session identifier where available.

Approval status.

Policy version.

Salary-slip version.

Exported report type.

Success or failure result.

Audited Actions

Role creation and permission changes.

User-role assignment.

Salary-structure changes.

Payroll calculation and recalculation.

Payable-day overrides.

Sandwich-policy overrides.

Payroll approval and rejection.

Payroll locking and reopening.

Bank-file export.

Payment status changes.

Salary-slip generation.

Salary-slip publication and unpublishing.

Sensitive-data access.

Payroll report export.

Audit records must be read-only and must not be editable through the user interface.

17. UI Requirements

17.1 Roles Listing

Display:

Role name.

Role code.

Role type.

Assigned users.

Data scope.

Status.

Last updated date.

Updated by.

Actions.

Actions:

View.

Edit.

Clone.

Assign users.

Deactivate.

View history.

17.2 Create/Edit Role

Sections:

Basic information.

Data scope.

Module permissions.

Sensitive-data access.

Approval permissions.

Assigned users.

Effective dates.

Permission summary.

Permissions must be grouped by module and support:

Select all.

Clear all.

Expand or collapse.

Search permission.

Read/write/approve distinction.

High-risk warning.

Effective-access preview.

17.3 Permission Preview

Before saving, show a plain-language summary, for example:

This role can create and calculate payroll for Company A and Company B. It can view employee salary and masked bank details but cannot approve payroll, activate policies or mark payments as paid.

17.4 User Role Assignment

Display:

User.

Current roles.

New role.

Data scope.

Effective-from date.

Expiry date.

Assignment reason.

Approver, where required.

18. Notifications

Notify affected users when:

A role is assigned or removed.

A high-risk permission is granted.

Temporary access is about to expire.

Payroll is submitted for approval.

Payroll is approved or rejected.

A payroll run is reopened.

A payout policy is submitted or activated.

Payment processing is ready.

Salary slips are ready for publication.

Salary-slip publication fails.

A published salary slip is replaced.

Notifications must not display salary amounts or bank details unless sent through a secured in-app surface.

19. Validation Rules

Users without payroll.run.view cannot open payroll-run URLs.

Edit permission must not automatically grant approval permission.

Approval permission must not automatically grant edit permission.

Self-service access must always be restricted to the logged-in employee.

Full bank details require an explicit sensitive-data permission.

Exports must follow the same data scope as the visible screen.

A role cannot be activated without at least one permission.

Expired role assignments must stop working automatically.

Deactivated users must immediately lose payroll access.

Locked payroll cannot be edited without reopening.

Reopening requires authorized permission and a mandatory reason.

Active policies cannot be edited in place.

Draft salary slips cannot be published to employee profiles.

Paid payroll cannot be deleted.

Audit logs cannot be edited or deleted from the application.

Users cannot approve their own work when maker-checker is enabled.

Direct API access must enforce the same permissions as the user interface.

Unauthorized records must not appear in search results, counts or exports.

20. Error Messages

Examples:

“You do not have permission to view this payroll run.”

“Your role does not permit payroll approval.”

“You cannot approve a payroll run created by you.”

“This payroll run is locked and cannot be modified.”

“Permission to reopen payroll is required.”

“A reason is required to reopen this payroll run.”

“You can view only salary slips assigned to your employee profile.”

“Permission to view full bank details is required.”

“This payout policy is active. Create a new version to make changes.”

“Salary slips cannot be published before payroll approval.”

“Your temporary payroll access has expired.”

“The selected employee is outside your assigned data scope.”

21. Acceptance Criteria

AC-RBAC-001: Users can access only modules and actions permitted by their assigned roles.

AC-RBAC-002: Data is restricted by company, legal entity, department, payroll group, reporting hierarchy or self-only scope.

AC-RBAC-003: Employees can view and download only their own published salary slips.

AC-RBAC-004: Reporting managers cannot view employee salary, net pay, bank details or salary slips.

AC-RBAC-005: Payroll preparers cannot approve their own runs when maker-checker is enabled.

AC-RBAC-006: Users without sensitive-data permission see masked bank and statutory information.

AC-RBAC-007: Payroll approval, locking, reopening and payment actions require separate permissions.

AC-RBAC-008: Locked payroll cannot be edited until an authorized user reopens it with a reason.

AC-RBAC-009: Policy creators cannot activate their own policies when policy maker-checker is enabled.

AC-RBAC-010: Active payout policies are immutable and changes create a new version.

AC-RBAC-011: Salary slips cannot be published before reaching the configured payroll status.

AC-RBAC-012: Unpublishing or replacing a salary slip requires special permission and an audit reason.

AC-RBAC-013: Report exports contain only records within the user’s assigned scope.

AC-RBAC-014: Sensitive exports require a separate permission.

AC-RBAC-015: Expired or deactivated role assignments stop providing access automatically.

AC-RBAC-016: Permission checks apply equally to screens, APIs, searches, counts, downloads and exports.

AC-RBAC-017: All sensitive actions create a read-only audit record.

AC-RBAC-018: Recalculation after approval invalidates the previous approval when payroll results change.

AC-RBAC-019: The system displays a warning for conflicting or high-risk permission combinations.

AC-RBAC-020: Unauthorized users receive an access-denied response without exposure of restricted payroll information.

22. Expected Outcome

The Roles and Permissions functionality will provide secure and flexible access to the Payout module. It will protect employee salary and payment information, separate payroll preparation from approval and payment, restrict users to their assigned organization scope, secure salary-slip publication and maintain a complete audit trail of every sensitive payroll action.