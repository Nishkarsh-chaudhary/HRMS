Employee Management — Credential Creation Prompt
Create an Employee Creation and Login Credential Management flow within the Employee Management module.
Objective
When a new employee is created, the system should allow the Super Admin or any user with the required permission to create the employee’s login credentials.
The credential creation process should be permission-based and must not be available to unauthorized users.
Create Employee Flow
While creating a new employee, include a dedicated section:
Login & Access Credentials
Fields:
Create Login Account
Toggle: Yes / No

Employee ID
Auto-generated or manually entered
Must be unique within the company

Login Username
Default value can be Employee ID or Official Email
Editable only by authorized users

Login Email
Official employee email
Must be unique

Password Creation Method
Create Manually
Auto-Generate Password
Send Password Setup Link

Password
Visible only when “Create Manually” is selected

Confirm Password

User Role
Employee
Manager
HR Admin
Custom Role

Account Status
Active
Inactive
Invitation Pending

Require Password Change on First Login
Default: Enabled

Send Credentials by Email
Toggle

Send Credentials by SMS
Toggle

Permission-Based Access
Only the following users should be allowed to create or manage employee credentials:
Super Admin
Can:
Create Employee ID
Create or generate password
Assign user role
Activate or deactivate login access
Reset employee password
Resend credentials
Change login email
Lock or unlock an account
Authorized User
A user can perform credential-related actions only when assigned specific permissions.
Required permissions:
employee.create
employee.credentials.create
employee.credentials.view
employee.credentials.reset
employee.credentials.activate
employee.role.assign
The interface must hide or disable actions for users who do not have the required permission.
Permissions must also be validated at the API and database levels.
Credential Creation Rules
Employee ID must be unique within the company.

Login email must be unique across active user accounts.

Password must follow the configured password policy.

Password and Confirm Password must match.

Password fields should never be displayed to unauthorized users.

Existing passwords must never be shown after account creation.

Newly created passwords must be securely hashed before being stored.

Plain-text passwords must not be stored in the database.

The system should require the employee to change the temporary password during the first login.

The employee account should only be created after the employee record is successfully saved.

If employee creation succeeds but login account creation fails, the system should:
Keep the employee record saved
Display the account creation failure
Allow an authorized user to retry credential creation

Deactivating an employee should automatically disable login access.

Reactivating an employee should not automatically restore access unless confirmed by an authorized user.

Archived or terminated employees should not be allowed to log in.

Password Options
Option 1 — Manual Password Creation
The Super Admin or authorized user enters:
Password
Confirm Password
Display:
Password strength indicator
Show or hide password control
Password policy instructions
Option 2 — Auto-Generated Password
The system should generate a secure temporary password.
Actions:
Copy Password
Regenerate Password
Send by Email
Send by SMS
The generated password should only be visible once during account creation.
Option 3 — Password Setup Link
The employee receives a secure link to set their own password.
The setup link should:
Be single-use
Have an expiry time
Become invalid after password creation
Allow the authorized user to resend the link
Display Invitation Pending until completed
This should be the recommended and default option.
Employee Creation Workflow
Authorized user opens Add Employee.

User enters personal and employment details.

User enables Create Login Account.

System checks whether the current user has credential creation permission.

User selects the login email, username, role, and password creation method.

System validates:
Employee ID uniqueness
Email uniqueness
Role permission
Password rules
Company access

User reviews employee and account information.

User clicks Create Employee.

System creates the employee record.

System creates the associated login account.

System assigns the selected role and permissions.

System sends credentials or a setup link, where selected.

System records the complete action in the audit log.

Show a success screen containing:
Employee Name
Employee ID
Login Email
Assigned Role
Account Status
Invitation Status

Employee Profile — Login Access Section
Add a tab or card named:
Login & Access
Display:
Employee ID
Login Username
Login Email
Assigned Role
Account Status
Last Login
Last Password Change
Invitation Status
Failed Login Attempts
Account Created By
Account Created Date
Authorized actions:
Create Login Account
Reset Password
Send Password Setup Link
Resend Invitation
Change Login Email
Change Role
Activate Account
Deactivate Account
Lock Account
Unlock Account
Reset Password Flow
Only the Super Admin or a user with employee.credentials.reset permission can reset a password.
Reset options:
Create Temporary Password
Auto-Generate Password
Send Reset Link
Require:
Confirmation dialog
Reason for reset
Password change on next login
After reset:
Invalidate active sessions
Record the action in the audit log
Notify the employee
Audit Log Requirements
Record all credential-related activities, including:
Login account created
Password generated
Setup link sent
Invitation resent
Password reset
Login email changed
Role changed
Account activated
Account deactivated
Account locked
Account unlocked
Each log should include:
Employee
Action
Performed By
User Role
Date and Time
IP Address
Previous Value
New Value
Reason
Status
Sensitive values such as passwords must never appear in logs.
Validation Messages
Use clear messages such as:
Employee ID already exists.
Login email is already linked to another account.
You do not have permission to create employee credentials.
Password does not meet the security requirements.
Password and confirmation do not match.
The login account could not be created. Please try again.
The invitation link has expired.
This employee account is currently inactive.
A login account already exists for this employee.
UI Requirements
Use a dedicated Login & Access Credentials section in the employee creation flow.
Hide credential fields when Create Login Account is disabled.
Show permission-based controls.
Use a password strength meter.
Mask sensitive information.
Use confirmation dialogs for account activation, deactivation, and password reset.
Use toast notifications for successful actions.
Show invitation and account status with badges.
Make all forms responsive.
Use clear helper text below security-related fields.
Do not expose passwords after employee creation.
Use accessible labels, validation, and keyboard navigation.
Recommended Default Behaviour
Only Super Admin and explicitly authorized users can create credentials.
The default password method should be Send Password Setup Link.
Require password change on first login.
New employee login status should remain Invitation Pending until the employee sets a password.
Credentials should be scoped by company_id.
All actions must follow role-based access control and be recorded in audit logs.