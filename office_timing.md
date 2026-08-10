Create an Office Timing and Attendance Calculation module for the Attendance Management System.

Admin Configuration

Allow the Admin/HR to configure office timing and attendance rules:

Office start time, e.g., 9:00 AM IST
Office end time, e.g., 6:00 PM IST
Time zone, e.g., Asia/Kolkata (IST)
Grace period for check-in, e.g., 15 minutes
Standard working hours per day
Minimum hours for full-day attendance
Minimum hours for half-day attendance
Standard break duration
Whether breaks are automatically deducted or calculated from break punches
Weekly offs and holidays
Effective date of the office timing policy
Different office timings based on company, location, department, or shift
Attendance Tracking

When an employee checks in or checks out, record:

Check-in time
Check-out time
Break start and end times
Total break duration
Late By
Early Departure
Gross Hours
Effective Hours
Overtime
Attendance status

Display all durations in a readable format such as 1 hr 15 min.

Calculation Formulas
1. Late By
Allowed Check-in Time = Office Start Time + Grace Period

Late By = MAX(0, Actual Check-in Time − Allowed Check-in Time)

Example:

Office Start Time: 9:00 AM
Grace Period: 15 minutes
Actual Check-in: 9:32 AM

Allowed Check-in Time = 9:15 AM
Late By = 17 minutes

Also store the delay from the exact office start time separately if required:

Delay from Office Start = MAX(0, Actual Check-in − Office Start Time)
2. Gross Hours
Gross Hours = Actual Check-out Time − Actual Check-in Time

Example:

Check-in: 9:32 AM
Check-out: 6:15 PM
Gross Hours = 8 hours 43 minutes

Gross Hours must include all break time between check-in and check-out.

3. Total Break Duration
Total Break Duration = SUM(Break End Time − Break Start Time)

If fixed break deduction is enabled:

Total Break Duration = Configured Standard Break Duration
4. Effective Hours
Effective Hours = MAX(0, Gross Hours − Total Break Duration)

Example:

Gross Hours: 8 hours 43 minutes
Total Break Duration: 45 minutes
Effective Hours = 7 hours 58 minutes
5. Early Departure
Early Departure = MAX(0, Office End Time − Actual Check-out Time)

Example:

Office End Time: 6:00 PM
Actual Check-out: 5:30 PM
Early Departure = 30 minutes
6. Overtime
Overtime = MAX(0, Effective Hours − Required Effective Working Hours)

If overtime should begin only after the scheduled office end time, use:

Overtime = MAX(0, Actual Check-out − Office End Time)

Make the overtime calculation method configurable by Admin.

Attendance Status Rules

Determine attendance status using effective working hours:

If Effective Hours >= Full-Day Minimum Hours:
    Status = Present

Else if Effective Hours >= Half-Day Minimum Hours:
    Status = Half Day

Else:
    Status = Absent or Insufficient Hours

Additional statuses:

Late
Present
Half Day
Absent
On Leave
Holiday
Weekly Off
Work From Home
Missing Check-in
Missing Check-out
Regularization Pending

“Late” should be displayed as a flag alongside the main status, for example: Present · Late by 17 min.

Important Business Rules
Store all attendance timestamps in UTC and display them using the configured office time zone.
Apply the policy effective on the attendance date.
Support overnight shifts where the end time is on the following day.
Do not calculate final gross or effective hours until check-out is recorded.
Prevent duplicate check-ins while an active attendance session exists.
Recalculate attendance when HR edits punches, breaks, office timings, or approved regularization.
Preserve the original and modified values in an audit log.
Locked payroll periods must not be recalculated without authorized access.
Existing attendance functionality must remain unaffected.
UI Requirement

Create a clean, responsive enterprise interface using:

Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
Supabase PostgreSQL
Supabase Row Level Security

The Admin configuration screen should include policy forms, validation, effective dates, shift/location assignment, and a live calculation preview. The employee attendance screen should clearly display check-in, check-out, late by, gross hours, break duration, effective hours, early departure, overtime, and attendance status.