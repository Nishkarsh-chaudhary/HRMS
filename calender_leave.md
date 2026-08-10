Develop an Admin Leave Calendar module for the Attendance/Leave Management system.

Objective:
Provide administrators with a calendar-based interface where they can select any month and quickly see which employees are on leave on each date.

Use the attached Google Calendar screenshot only as a UI/interaction reference. The final UI should follow our application's existing design system and must not affect any existing attendance or leave functionality.

TECH STACK
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Responsive design

==================================================
1. CALENDAR HEADER
==================================================

Create a clean calendar header containing:

- Title: "Leave Calendar"
- Today button
- Previous Month button
- Next Month button
- Current selected month/year
  Example: August 2026
- Month/Year picker
- View selector:
  - Month (default)
  - Week (optional if supported)
- Search employee
- Filter button

When changing the month, load leave data for the selected month.

==================================================
2. MONTH CALENDAR VIEW
==================================================

Default view should be a full monthly calendar.

Display columns:

MON | TUE | WED | THU | FRI | SAT | SUN

Each date cell should contain:
- Date number
- Employees who are on approved leave
- Employee avatar/initials
- Employee name
- Leave type/status indicator

Example:

12

[Avatar] Anish
Annual Leave

[Avatar] Vishal
Sick Leave

If more employees are on leave than can comfortably fit inside the date:

[Avatar] Anish
[Avatar] Vishal
+4 more

Clicking "+4 more" should open a popover/drawer showing all employees on leave for that date.

Clearly highlight:
- Today's date
- Weekends
- Company holidays
- Selected date

Do not overcrowd calendar cells.

==================================================
3. LEAVE STATUS & TYPE
==================================================

Use visually distinct badges/colors for:

- Annual Leave
- Sick Leave
- Casual Leave
- Unpaid Leave
- Work From Home
- Half Day
- Other

Only Approved leave should appear by default.

Provide an option in filters to additionally show:
- Pending
- Rejected (optional)

Pending leave must be visually distinguishable from approved leave.

==================================================
4. MULTI-DAY LEAVE
==================================================

If an employee has leave across multiple consecutive dates, display it as a continuous calendar event where practical.

Example:

Anish — Annual Leave
10 Aug → 14 Aug

Do not create visually disconnected information that makes multi-day leave difficult to understand.

==================================================
5. LEAVE DETAIL INTERACTION
==================================================

When Admin clicks an employee's leave entry, open a side drawer or modal showing:

Employee
- Avatar
- Employee Name
- Employee ID
- Department
- Designation

Leave Details
- Leave Type
- From Date
- To Date
- Full Day / Half Day
- Total Leave Days
- Reason
- Approval Status
- Requested Date
- Approved By

If the leave is Pending and the Admin has permission, provide:

- Approve
- Reject

Do not allow modifications when the attendance/leave period is locked unless existing permissions allow it.

==================================================
6. FILTERS
==================================================

Provide filters for:

- Employee
- Department
- Team
- Manager
- Leave Type
- Leave Status
- Location
- Company

Filters should update the calendar without requiring a page reload.

Include:
- Apply Filters
- Clear All

==================================================
7. DATE DETAIL
==================================================

Clicking an empty area of a date should open a date-detail drawer.

Example:

August 12, 2026

On Leave: 6
Pending Requests: 2
Working: 42

Employees on Leave:
------------------------------------------------
Employee      Department      Leave Type
Anish         Development     Annual Leave
Vishal        QA              Sick Leave
------------------------------------------------

This provides Admin with a quick workforce availability overview.

==================================================
8. MONTHLY SUMMARY
==================================================

Above the calendar, show compact summary cards:

- Employees on Leave Today
- Approved Leaves This Month
- Pending Requests
- Upcoming Leaves

Keep these compact so that the calendar remains the main focus of the screen.

==================================================
9. SEARCH
==================================================

Provide an employee search field.

When Admin searches for an employee:
- Highlight their leave entries in the calendar.
- Dim unrelated leave entries where appropriate.

==================================================
10. DATA & BACKEND BEHAVIOR
==================================================

Retrieve leave records dynamically from the existing Leave Management data.

Do not duplicate leave records specifically for the calendar.

Calendar should be a visualization of the existing leave data.

Each record should support/use existing fields such as:

- employee_id
- company_id
- leave_type
- start_date
- end_date
- duration / half_day
- reason
- status
- approved_by
- created_at

Respect:
- company_id data isolation
- existing Supabase RLS
- role permissions

Admin should only see employees from companies/locations they are authorized to access.

==================================================
11. PERFORMANCE
==================================================

The module should work efficiently even when there are hundreds of employees.

- Fetch only the required date range.
- Do not load the complete historical leave dataset.
- Refresh data when month/filter changes.
- Avoid unnecessary API calls.
- Use appropriate database indexes for date/company/employee/status queries.

==================================================
12. RESPONSIVE BEHAVIOR
==================================================

Desktop:
Full monthly calendar with employee names.

Tablet:
Compact employee entries.

Mobile:
Do not squeeze the desktop calendar into the screen.

Instead provide:
- Month selector
- Compact calendar
- Selected-date employee leave list underneath

==================================================
13. UX REQUIREMENTS
==================================================

The interface should feel similar to Google Calendar in terms of calendar navigation and clarity, while using our application's existing styles.

Priorities:
1. Admin can immediately identify who is on leave.
2. Admin can easily move between months.
3. Multiple employees on the same date remain readable.
4. Multi-day leave is easy to understand.
5. Leave details are accessible without leaving the calendar.
6. Calendar should not feel cluttered even with many leave records.

IMPORTANT:
- Integrate this into the existing Leave/Attendance Management module.
- Reuse existing leave APIs, database tables, permissions, and business logic wherever possible.
- Do not change or break any existing functionality.
- Do not create duplicate leave-management logic only for this calendar.
- Follow the existing project's components, coding standards, folder structure, and design system.