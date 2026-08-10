# Organisation Management Module --- Development Prompt

## Technology Stack

Create a modern, production-ready **Organisation Management module**
using:

-   Next.js (App Router)
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   Lucide Icons
-   React Flow
-   React DnD
-   TanStack Table

------------------------------------------------------------------------

# Module Objective

Develop an Organisation Management module that supports:

-   Multi-company
-   Business Units
-   Locations
-   Departments
-   Sub Departments
-   Teams
-   Designations
-   Reporting Structure
-   Employee Mapping
-   Drag & Drop Hierarchy
-   Organization Chart
-   Role-based Permissions

------------------------------------------------------------------------

# Module Structure

``` text
Organisation Management
│
├── Dashboard
├── Organisation Tree
│   ├── Company
│   ├── Business Unit
│   ├── Location
│   ├── Department
│   ├── Sub Department
│   └── Team
├── Designations
├── Organisation Chart
├── Employee Mapping
└── Activity Logs
```

# Screen 1 --- Dashboard

## KPI Cards

-   Total Companies
-   Business Units
-   Locations
-   Departments
-   Teams
-   Active Employees
-   Department Heads
-   Vacant Positions

Each KPI should include: - Icon - Value - Trend - Clickable Filter

# Screen 2 --- Organisation Tree

Create a full-height tree hierarchy with:

-   Expand / Collapse
-   Expand All / Collapse All
-   Search
-   Filters
-   Drag & Drop
-   Node Details Drawer

Node Actions: - View - Edit - Add Child - Move - Duplicate - Archive -
Delete

# Screen 3 --- Designation Management

Features: - Designation Listing - Create Designation - Edit/Delete -
Designation Hierarchy - Search & Filters

# Screen 4 --- Organisation Chart

Features: - Interactive Org Chart - Search - Zoom - Fit Screen - Export
PNG/PDF - Employee Cards

# Screen 5 --- Employee Mapping

Assign: - Company - Business Unit - Location - Department - Team -
Designation - Reporting Manager - Secondary Manager - Cost Centre -
Grade - Level

Support Bulk Assignment.

# Screen 6 --- Activity Logs

-   Search
-   Filters
-   Export
-   Audit Trail

# Validations

-   Unique Node Code
-   Company Mandatory
-   Active Department Head
-   No Circular Hierarchy
-   No Self Reporting
-   No Reporting Loops
-   Cannot Delete Department with Employees

# Permissions

## HR Admin

-   Full Access

## Manager

-   Limited Editing

## Employee

-   Read Only

# Responsive

Desktop: - Full Tree

Tablet: - Responsive Tree

Mobile: - Accordion Tree - Card Layout

# UI Requirements

-   Modern Enterprise UI
-   React Flow
-   Drag & Drop
-   Sticky Toolbar
-   Breadcrumbs
-   Skeleton Loading
-   Toast Notifications
-   Confirmation Dialogs
-   Dark Mode
-   Multi-company Ready
