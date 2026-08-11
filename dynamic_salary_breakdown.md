HRMS Dynamic Salary Breakdown Structure — FRD

Module: Payroll and Payout ManagementDocument Type: Functional Requirements DocumentVersion: 1.0Status: Proposed

1. Purpose

The Dynamic Salary Breakdown Structure module allows authorized administrators to create configurable salary components and combine them into salary structures.

Salary components may be calculated using:

A fixed amount.

A percentage of Basic Salary.

A percentage of Gross Salary.

A percentage of CTC.

A percentage of another component.

A formula using multiple salary components.

A statutory formula with minimum or maximum limits.

The configured salary structure can be assigned to individual employees. The applicable earnings, deductions, employer contributions and net salary must appear in payroll calculations and on the employee’s salary slip.

2. Objectives

The module must:

Allow administrators to create salary components dynamically.

Support fixed-value and percentage-based components.

Support earnings, deductions, reimbursements and employer contributions.

Allow reusable salary templates to be created.

Allow salary structures to be assigned to employees.

Allow employee-specific values and permitted overrides.

Maintain effective-dated salary revisions.

Calculate monthly and annual salary values.

Display applicable salary components on salary slips.

Maintain an audit history of salary changes.

Prevent historical payroll from changing after a salary revision.

3. Example Salary Components

The system must support, but not be limited to:

Earnings

Basic Salary.

House Rent Allowance.

Special Allowance.

Conveyance Allowance.

Medical Allowance.

Dearness Allowance.

Performance Allowance.

Other Allowance.

Bonus.

Incentive.

Overtime.

Arrears.

Leave Encashment.

Employee Deductions

Provident Fund.

Employee State Insurance.

Professional Tax.

Income Tax or TDS.

Health Insurance.

Loan Recovery.

Salary Advance Recovery.

Labour Welfare Fund.

Voluntary Provident Fund.

Other Deduction.

Employer Contributions

Employer Provident Fund.

Employer State Insurance.

Employer Health Insurance.

Gratuity Provision.

Employer Pension Contribution.

Employer Labour Welfare Contribution.

Other Employer Contribution.

Reimbursements

Travel Reimbursement.

Fuel Reimbursement.

Telephone Reimbursement.

Meal Reimbursement.

Internet Reimbursement.

Other Reimbursement.

Administrators must be able to create additional components without requiring a software change.

4. Module Structure

The module consists of the following screens:

Salary Component Listing.

Create/Edit Salary Component.

Salary Structure Templates.

Create/Edit Salary Structure.

Assign Salary Structure to Employee.

Employee Salary Breakdown.

Salary Revision History.

Salary-Slip Component Mapping.

Audit Log.

SCREEN 1 — SALARY COMPONENT LISTING

5. Purpose

Provide a central location where administrators can create and manage all earning, deduction, contribution and reimbursement components.

5.1 Summary Cards

Display:

Total Components.

Active Components.

Earnings.

Employee Deductions.

Employer Contributions.

Reimbursements.

Statutory Components.

Draft Components.

Selecting a summary card must filter the listing.

5.2 Filters

Provide the following filters:

Component type.

Calculation type.

Status.

Statutory or non-statutory.

Taxable or non-taxable.

Salary-slip visibility.

Company or legal entity.

Search by component name or code.

5.3 Listing Columns

Component Name.

Component Code.

Component Type.

Calculation Method.

Calculation Basis.

Statutory Status.

Taxability.

Salary-Slip Visibility.

Status.

Effective Date.

Updated By.

Actions.

5.4 Actions

View.

Edit Draft.

Duplicate.

Create New Version.

Activate.

Deactivate.

Archive.

View Usage.

View Version History.

An active component used in a finalized payroll must not be edited directly. Changes must create a new version.

SCREEN 2 — CREATE/EDIT SALARY COMPONENT

6. Basic Information

The administrator must enter:

Component name.

Unique component code.

Display name.

Description.

Component category.

Component type.

Company or legal entity.

Effective-from date.

Optional effective-to date.

Status.

Display order.

Currency.

Component Categories

Fixed Earning.

Variable Earning.

Employee Deduction.

Employer Contribution.

Reimbursement.

Tax.

Recovery.

Informational Component.

7. Calculation Methods

Each component must support one of the following calculation methods.

7.1 Fixed Amount

The administrator enters a fixed monthly or annual amount.

Example:

Health Insurance Deduction = ₹1,000 per month.

Calculation:

Monthly Component Amount = ₹1,000

7.2 Percentage of Basic Salary

The amount is calculated as a percentage of Basic Salary.

Example:

House Rent Allowance = 40% of Basic Salary.

Calculation:

HRA = Basic Salary × 40%

If Basic Salary is ₹30,000:

HRA = ₹30,000 × 40% = ₹12,000

7.3 Percentage of Gross Salary

The amount is calculated as a percentage of configured Gross Salary.

Example:

Insurance Deduction = 1% of Gross Salary.

Calculation:

Insurance = Gross Salary × 1%

The system must prevent circular calculations when the component itself is included in Gross Salary.

7.4 Percentage of CTC

The amount is calculated as a percentage of the employee’s Cost to Company.

Example:

Basic Salary = 40% of CTC.

If annual CTC is ₹600,000:

Annual Basic = ₹600,000 × 40% = ₹240,000

Monthly Basic = ₹240,000 ÷ 12 = ₹20,000

7.5 Percentage of Another Component

The administrator selects another salary component as the calculation base.

Example:

Provident Fund = 12% of Basic Salary.

Calculation:

Employee PF = Basic Salary × 12%

7.6 Percentage of Multiple Components

The component is calculated on the total of selected components.

Example:

ESI = configured percentage of Basic Salary + HRA + Special Allowance.

Calculation:

ESI = (Basic + HRA + Special Allowance) × Applicable Percentage

7.7 Balancing Component

A balancing component uses the remaining value after other salary components are calculated.

Example:

Special Allowance balances monthly Gross Salary.

Calculation:

Special Allowance = Target Gross Salary − Sum of Other Gross Earnings

The balancing component must not produce a negative value unless the component explicitly permits it.

Only one balancing component should normally be allowed within the same calculation group.

7.8 Formula-Based Component

The administrator may create a formula using approved salary fields and operators.

Supported Formula Inputs

Annual CTC.

Monthly CTC.

Basic Salary.

Gross Earnings.

Payable Gross.

Net Pay.

Selected earning components.

Selected deduction components.

Payable Days.

Calendar Days.

Working Days.

Overtime Hours.

Leave Without Pay Days.

Employee grade.

Employee location.

Employee type.

Supported Operators

Addition.

Subtraction.

Multiplication.

Division.

Percentage.

Minimum.

Maximum.

Round.

Conditional IF/ELSE.

Greater than.

Less than.

Equal to.

AND.

OR.

Formulas must be validated before the component can be activated.

7.9 Manual Value

The component value is entered manually for each employee or payroll period.

Examples:

Performance incentive.

Bonus.

One-time deduction.

Loan recovery.

Overtime payment.

The administrator must specify whether the manual amount is:

Recurring.

One-time.

Valid for a selected date range.

Entered during salary assignment.

Entered during payroll processing.

8. Calculation Configuration

Every salary component must support the following configuration fields where applicable:

Calculation method.

Percentage value.

Calculation base.

Fixed amount.

Monthly or annual input.

Minimum amount.

Maximum amount.

Statutory wage ceiling.

Rounding method.

Decimal precision.

Proration method.

Payable-day applicability.

Taxability.

Employee eligibility.

Effective date.

Calculation priority.

Inclusion in totals.

9. Minimum and Maximum Limits

Administrators may configure limits for percentage or formula-based components.

Example:

Provident Fund = 12% of Basic Salary, calculated up to a configured PF wage ceiling.

Possible rule:

PF Calculation Base = Minimum of Basic Salary and PF Wage Ceiling

PF Deduction = PF Calculation Base × PF Percentage

The actual PF percentage, wage ceiling and statutory applicability must be maintained as configurable policy values rather than hard-coded values.

Supported Limit Types

No limit.

Minimum amount.

Maximum amount.

Minimum calculation base.

Maximum calculation base.

Statutory ceiling.

Employee-specific limit.

10. Component Behaviour Settings

Each component must contain the following switches:

Include in Gross Earnings.

Include in Net Pay.

Include in CTC.

Include in Taxable Income.

Include in PF Wages.

Include in ESI Wages.

Include in Gratuity Calculation.

Include in Overtime Base.

Include in Leave Encashment.

Prorate by Payable Days.

Applicable during Leave Without Pay.

Applicable during Notice Period.

Applicable during Full-and-Final Settlement.

Allow employee-level override.

Allow payroll-level override.

Show on salary slip.

Show zero value on salary slip.

Show annual amount.

Show year-to-date amount.

Round calculated value.

11. Component Type Behaviour

11.1 Earnings

Earning components increase Gross Earnings and may increase Net Pay.

Examples:

Basic Salary.

HRA.

Special Allowance.

Bonus.

11.2 Employee Deductions

Employee deductions reduce Net Pay.

Examples:

Employee PF.

Health Insurance.

TDS.

Loan Recovery.

11.3 Employer Contributions

Employer contributions form part of CTC where configured but must not reduce employee Net Pay.

Examples:

Employer PF.

Employer Insurance.

Gratuity Provision.

11.4 Reimbursements

Reimbursements may increase the amount payable without becoming part of regular Gross Salary, depending on configuration.

11.5 Informational Components

Informational components appear in the breakdown or salary slip but do not affect Gross or Net Pay.

SCREEN 3 — SALARY STRUCTURE TEMPLATES

12. Purpose

Allow administrators to combine multiple salary components into reusable salary structures.

12.1 Example Templates

Standard Employee Salary Structure.

Management Salary Structure.

Contract Employee Structure.

Trainee Salary Structure.

Sales Incentive Structure.

Location-Specific Structure.

Executive CTC Structure.

12.2 Template Fields

Structure name.

Unique structure code.

Description.

Company or legal entity.

Payroll group.

Employment type.

Grade.

Department.

Location.

Currency.

Salary input type.

Effective-from date.

Effective-to date.

Status.

Approval status.

Salary Input Types

Enter Annual CTC.

Enter Monthly CTC.

Enter Monthly Gross.

Enter Basic Salary.

Enter each component manually.

SCREEN 4 — CREATE/EDIT SALARY STRUCTURE

13. Structure Builder

The administrator can add salary components from the component library.

For each added component, display:

Component name.

Component type.

Calculation method.

Percentage or fixed amount.

Calculation base.

Monthly amount.

Annual amount.

CTC inclusion.

Gross inclusion.

Net-pay impact.

Salary-slip visibility.

Employee override permission.

Display order.

13.1 Component Ordering

Components must be calculated in a controlled order.

Example:

Annual or Monthly CTC.

Basic Salary.

HRA.

Fixed Allowances.

Percentage-Based Allowances.

Balancing Special Allowance.

Gross Earnings.

Employee Deductions.

Employer Contributions.

Reimbursements.

Net Pay.

Total CTC.

The system must automatically detect invalid calculation dependencies.

14. Example Dynamic Salary Structure

Assume:

Monthly CTC: ₹75,000

Component

Type

Calculation

Monthly Amount

Basic Salary

Earning

40% of Monthly CTC

₹30,000

HRA

Earning

40% of Basic

₹12,000

Conveyance Allowance

Earning

Fixed ₹2,000

₹2,000

Special Allowance

Earning

Balancing Component

Calculated

Health Insurance

Employee Deduction

Fixed ₹1,000

₹1,000

Employee PF

Employee Deduction

Configured % of eligible Basic

Calculated

Employer PF

Employer Contribution

Configured % of eligible Basic

Calculated

Employer Health Insurance

Employer Contribution

Fixed ₹1,500

₹1,500

Illustrative Calculation

Assume:

Basic Salary = ₹30,000.

HRA = ₹12,000.

Conveyance = ₹2,000.

Employee PF = ₹3,600 for illustration.

Employer PF = ₹3,600 for illustration.

Employee Health Insurance = ₹1,000.

Employer Health Insurance = ₹1,500.

Target Monthly CTC = ₹75,000.

If employer contributions are included in CTC:

Special Allowance = Monthly CTC − Basic − HRA − Conveyance − Employer PF − Employer Health Insurance

Special Allowance = ₹75,000 − ₹30,000 − ₹12,000 − ₹2,000 − ₹3,600 − ₹1,500

Special Allowance = ₹25,900

Therefore:

Gross Earnings = Basic + HRA + Conveyance + Special Allowance

Gross Earnings = ₹30,000 + ₹12,000 + ₹2,000 + ₹25,900

Gross Earnings = ₹69,900

Employee Deductions = Employee PF + Employee Health Insurance

Employee Deductions = ₹3,600 + ₹1,000 = ₹4,600

Net Salary before tax and other deductions = ₹69,900 − ₹4,600

Net Salary = ₹65,300

This example is illustrative. Actual PF, tax, insurance and statutory calculations must come from the active organization policy.

15. Salary Structure Preview

Before saving or assigning a structure, show:

Monthly Gross Earnings.

Annual Gross Earnings.

Monthly Employee Deductions.

Annual Employee Deductions.

Monthly Employer Contributions.

Annual Employer Contributions.

Monthly Net Salary.

Annual Net Salary.

Monthly CTC.

Annual CTC.

The preview must show the formula and calculation source for every component.

16. Structure Validation

The system must validate:

Duplicate components.

Missing Basic Salary where another component depends on Basic.

Missing calculation base.

Invalid percentage.

Negative component values.

Circular formula dependencies.

Multiple balancing components.

Gross and CTC mismatch.

Invalid effective dates.

Inactive components.

Overlapping versions.

Missing salary-slip mapping.

Invalid minimum or maximum limits.

Employee deduction incorrectly configured as an employer contribution.

Employer contribution incorrectly reducing Net Pay.

SCREEN 5 — ASSIGN SALARY STRUCTURE TO EMPLOYEE

17. Purpose

Allow an authorized administrator to assign a salary structure to each employee and fill the applicable employee-specific salary details.

17.1 Employee Assignment Fields

Employee name.

Employee ID.

Company.

Department.

Designation.

Grade.

Location.

Employment type.

Payroll group.

Joining date.

Salary structure.

Salary input type.

Annual CTC.

Monthly CTC.

Monthly Gross Salary.

Effective-from date.

Revision reason.

Approval status.

17.2 Employee Component Details

For every component, display:

Component name.

Default calculation method.

Default percentage.

Default fixed value.

Calculation base.

Employee-specific value.

Monthly amount.

Annual amount.

Override status.

Salary-slip visibility.

17.3 Administrator Actions

The administrator can:

Select a salary structure.

Enter employee CTC or Gross Salary.

Enter fixed component values.

Enter employee-specific percentages where permitted.

Enable or disable optional components.

Add employee-specific components.

Enter health-insurance deductions.

Enter voluntary PF or other deductions.

Preview the calculated breakdown.

Save as Draft.

Submit for approval.

Approve salary assignment.

Schedule the effective date.

Download the salary breakdown.

Create a salary revision.

18. Employee-Level Overrides

A component may be overridden only when the component configuration allows it.

Override Options

Override percentage.

Override fixed amount.

Override minimum or maximum.

Disable optional component.

Replace formula with an approved employee amount.

Set a one-time earning or deduction.

Set an expiry date.

Override Requirements

Mandatory reason.

Effective-from date.

Optional effective-to date.

Approval where configured.

Display of default and overridden values.

Audit history.

No change to finalized historical payroll.

19. Salary Assignment Workflow

Supported workflow:

Draft → Submitted → Approved → Scheduled → Active → Superseded

Draft

The administrator can edit all permitted fields.

Submitted

The structure is pending approval and cannot be modified without withdrawal or rejection.

Approved

The salary structure is approved for the selected effective date.

Scheduled

The structure is approved but its effective date is in the future.

Active

The structure is used for payroll calculation.

Superseded

A newer salary revision has become active.

20. Bulk Assignment

The system should support bulk salary assignment through:

Excel import.

CSV import.

Salary-template assignment.

Bulk CTC revision.

Bulk percentage increase.

Bulk fixed increment.

Bulk component addition.

Bulk component removal.

Import Flow

Upload File → Map Columns → Preview → Validate → Import → Approval → Result Report

Import Validations

Invalid employee ID.

Duplicate employee.

Missing salary structure.

Invalid component code.

Invalid percentage.

Invalid amount.

CTC mismatch.

Inactive employee.

Invalid effective date.

Unauthorized employee scope.

SCREEN 6 — EMPLOYEE SALARY BREAKDOWN

21. Employee Salary View

The employee salary-breakdown screen must contain:

Employee Information

Employee name.

Employee ID.

Department.

Designation.

Grade.

Location.

Payroll group.

Effective date.

Earnings

Basic Salary.

HRA.

Special Allowance.

Other allowances.

Bonus or variable components.

Employee Deductions

PF.

Health Insurance.

Tax.

Loan or advance recovery.

Other deductions.

Employer Contributions

Employer PF.

Employer Insurance.

Gratuity.

Other employer costs.

Summary

Monthly Gross.

Annual Gross.

Monthly Deductions.

Annual Deductions.

Monthly Employer Contributions.

Annual Employer Contributions.

Monthly Net Salary.

Annual Net Salary.

Monthly CTC.

Annual CTC.

22. Payroll Proration

Components marked as proratable must be adjusted using payable days.

Example

Monthly Basic Salary = ₹30,000Calendar Days = 30Payable Days = 28

Prorated Basic = ₹30,000 × 28 ÷ 30

Prorated Basic = ₹28,000

If HRA is 40% of payable Basic:

Payable HRA = ₹28,000 × 40%

Payable HRA = ₹11,200

Proration Settings

Each component must support:

Prorate using calendar days.

Prorate using fixed 30 days.

Prorate using scheduled working days.

Do not prorate.

Prorate only for joining or separation.

Prorate for leave without pay.

Recalculate percentage on prorated base.

Use full monthly base for statutory calculation where policy requires.

23. Payroll Calculation Order

For every employee, payroll must:

Identify the active salary structure for the pay period.

Resolve applicable salary components.

Apply employee-specific overrides.

Calculate fixed and percentage-based earnings.

Calculate balancing components.

Apply payable-day proration.

Calculate variable earnings.

Calculate employee deductions.

Calculate employer contributions.

Calculate reimbursements.

Calculate Gross Earnings.

Calculate Total Deductions.

Calculate Net Pay.

Calculate Total CTC.

Generate the salary-slip breakdown.

Store the calculation snapshot and component versions.

SALARY-SLIP INTEGRATION

24. Salary-Slip Requirements

Every component marked “Show on Salary Slip” must be included in the generated salary slip.

24.1 Earnings Section

Display:

Component name.

Monthly eligible amount, where enabled.

Current payable amount.

Arrear amount, where applicable.

Year-to-date amount, where enabled.

Example:

Earnings

Eligible Amount

Current Amount

Basic Salary

₹30,000

₹28,000

HRA

₹12,000

₹11,200

Special Allowance

₹25,900

₹24,173

Conveyance Allowance

₹2,000

₹1,867

Gross Earnings

₹69,900

₹65,240

24.2 Deductions Section

Example:

Deductions

Current Amount

Employee PF

₹3,600

Health Insurance

₹1,000

TDS

₹2,500

Total Deductions

₹7,100

24.3 Employer Contribution Section

Employer contributions may appear in a separate section when enabled.

Example:

Employer Contributions

Amount

Employer PF

₹3,600

Employer Health Insurance

₹1,500

Total Employer Contributions

₹5,100

Employer contributions must not reduce employee Net Pay.

24.4 Salary-Slip Summary

Display:

Gross Earnings.

Total Employee Deductions.

Reimbursements.

Net Pay.

Net Pay in words.

Payable Days.

Loss-of-Pay Days.

Payment date.

Payment status.

Salary structure version.

Salary-slip version.

25. Salary-Slip Display Configuration

For each component, the administrator can configure:

Salary-slip display name.

Section: Earnings, Deductions, Contributions or Reimbursements.

Display order.

Show or hide component.

Show when value is zero.

Show eligible amount.

Show current amount.

Show annual amount.

Show year-to-date value.

Show arrears separately.

Show negative values with a minus sign or deduction format.

The salary slip must use the actual component values stored in the finalized payroll calculation.

26. Salary Revision

An administrator can create a salary revision for:

Increment.

Promotion.

Transfer.

Grade change.

Correction.

Salary restructuring.

Statutory-policy change.

Change in insurance.

Change in voluntary deduction.

Revision Requirements

Previous annual CTC.

Revised annual CTC.

Previous component values.

Revised component values.

Increase amount.

Increase percentage.

Effective date.

Revision reason.

Approval details.

Supporting attachment, where required.

Historical salary structures and salary slips must remain unchanged.

27. Roles and Permissions

Super Admin

Manage all salary components.

Manage templates.

Assign and revise employee salary.

Approve structures.

Manage salary-slip mapping.

View all salary information.

HR Admin

Create components and templates.

Assign salary structures.

Fill employee component values.

Create salary revisions.

Submit assignments for approval.

View salary breakdowns within assigned scope.

Payroll Executive

View approved salary structures.

Use structures in payroll.

Enter payroll-level variable components.

View calculation traces.

Generate salary-slip previews.

Salary Approver/HR Manager

Review and approve salary assignments.

Review salary revisions.

Approve employee-level overrides.

Reject with comments.

Finance User

View approved Gross Salary, deductions, Net Pay and employer contributions.

View financial reports.

Cannot change salary structures unless separately permitted.

Employee

View their own approved salary breakdown where enabled.

View their own published salary slips.

Cannot view formulas marked as internal.

Cannot change salary components.

28. Audit Requirements

Record the following:

Component creation.

Component modification.

Component activation or deactivation.

Formula changes.

Percentage or fixed-value changes.

Template changes.

Employee salary assignment.

Employee-level overrides.

Salary revision.

Approval or rejection.

Effective-date changes.

Salary-slip display changes.

Bulk import.

Payroll calculation usage.

Each audit entry must contain:

User.

Date and time.

Employee, component or structure affected.

Previous value.

New value.

Reason.

Approval status.

Effective date.

Source of change.

29. Validation Rules

Component name and code are mandatory.

Component code must be unique.

Component type is mandatory.

Calculation method is mandatory.

Percentage value must be within the configured permitted range.

Fixed amounts must not be negative unless negative values are explicitly supported.

A calculation base is required for percentage components.

A component cannot depend on itself.

Circular component dependencies are prohibited.

Division by zero must be prevented.

Minimum amount must not exceed maximum amount.

Only one balancing component should apply within a salary calculation group.

Employer contributions must not reduce Net Pay.

Employee deductions must reduce Net Pay unless configured as informational.

Salary components included in CTC must reconcile to the target CTC.

Employee salary assignments require an effective date.

Overlapping active salary versions are not allowed.

Inactive components cannot be assigned.

Salary-slip components must be mapped to a valid section.

Finalized historical payroll cannot be recalculated automatically after a structure change.

Employee-level overrides require permission and a reason.

Structure approval is required before payroll usage where approval is enabled.

30. Error Messages

Examples:

“Component Name is required.”

“Component Code already exists.”

“Please select a Calculation Method.”

“Calculation Base is required for a percentage-based component.”

“The formula contains a circular dependency.”

“The component cannot be calculated because its base component is missing.”

“Special Allowance cannot be negative.”

“The salary breakdown does not match the entered CTC.”

“An active salary structure already exists for this effective period.”

“You do not have permission to override this component.”

“A reason is required for an employee-specific override.”

“This component is already used in finalized payroll and cannot be edited. Create a new version.”

“Employer contribution cannot be configured to reduce employee Net Pay.”

31. Reports

The module must provide:

Employee Salary Breakdown Report.

Salary Structure Assignment Report.

Component-Wise Salary Report.

Monthly and Annual CTC Report.

Gross-to-Net Report.

Employee Deduction Report.

Employer Contribution Report.

PF and Statutory Wage Report.

Health Insurance Deduction Report.

Salary Revision Report.

Salary Structure Version Report.

Salary-Slip Component Report.

Salary Override Audit Report.

Reports must respect role permissions and employee-data scope.

32. Acceptance Criteria

AC-SAL-001: An administrator can create salary components dynamically without a software change.

AC-SAL-002: A component can be configured as a fixed amount or percentage-based value.

AC-SAL-003: A percentage component can use Basic, Gross, CTC, another component or selected components as its calculation base.

AC-SAL-004: Basic Salary, HRA, Special Allowance, Health Insurance and PF can be configured independently.

AC-SAL-005: Administrators can configure minimum amounts, maximum amounts and statutory calculation ceilings.

AC-SAL-006: A Special Allowance component can balance the salary structure against Gross Salary or CTC.

AC-SAL-007: The system prevents circular formulas and invalid component dependencies.

AC-SAL-008: Administrators can combine components into reusable salary-structure templates.

AC-SAL-009: A salary structure can be assigned to an individual employee with an effective date.

AC-SAL-010: Authorized administrators can enter employee-specific percentages or fixed values.

AC-SAL-011: Employee-specific overrides require permission, reason and audit history.

AC-SAL-012: The system calculates monthly and annual earnings, deductions, contributions, Gross Salary, Net Salary and CTC.

AC-SAL-013: Proratable components are recalculated according to payable days and the active proration policy.

AC-SAL-014: Employee deductions reduce Net Pay.

AC-SAL-015: Employer contributions may form part of CTC but do not reduce employee Net Pay.

AC-SAL-016: Components configured for salary-slip visibility appear in the correct salary-slip section.

AC-SAL-017: Salary-slip values match the finalized payroll calculation.

AC-SAL-018: Salary revisions create new effective-dated versions without modifying historical payroll.

AC-SAL-019: Active components used in payroll cannot be directly edited; a new version is required.

AC-SAL-020: All component, template, assignment, override, approval and revision actions are auditable.

33. Expected Outcome

The Dynamic Salary Breakdown Structure module will allow administrators to define earnings, deductions, reimbursements and employer contributions using fixed amounts, percentages or formulas. These components can be combined into reusable salary structures, assigned to individual employees, customized where permitted and used automatically during payroll calculation.

Basic Salary, HRA, Special Allowance, Health Insurance, PF and other dynamically created components will be calculated transparently and displayed in the appropriate sections of the employee’s salary slip.