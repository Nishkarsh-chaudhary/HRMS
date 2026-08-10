import * as z from "zod";

const optionalText = z.string().trim().optional().transform((value) => value || null);
const optionalEmail = z.union([z.literal(""), z.email({ error: "Enter a valid email address." })]).optional().transform((value) => value || null);
const indianMobile = z.string().trim().regex(/^[6-9]\d{9}$/, { error: "Enter a valid 10-digit Indian mobile number." });

export const EmployeeSchema = z.object({
  firstName: z.string().trim().min(1, { error: "First name is required." }),
  middleName: optionalText,
  lastName: z.string().trim().min(1, { error: "Last name is required." }),
  employeeCode: z.string().trim().min(2, { error: "Employee ID is required." }).max(30),
  dateOfBirth: optionalText,
  gender: optionalText,
  maritalStatus: optionalText,
  bloodGroup: optionalText,
  personalEmail: optionalEmail,
  mobileNumber: indianMobile,
  alternateMobileNumber: optionalText,
  dateOfJoining: z.string().min(1, { error: "Joining date is required." }),
  employmentType: z.enum(["permanent", "probation", "contract", "intern", "consultant"]),
  employmentStatus: z.enum(["active", "onboarding", "notice_period", "inactive", "resigned", "terminated", "archived"]),
  probationMonths: z.coerce.number().int().min(0).max(36).optional(),
  confirmationDate: optionalText,
  workMode: z.enum(["office", "hybrid", "remote", "field"]),
  workLocation: z.string().trim().min(1, { error: "Work location is required." }),
  shiftName: optionalText,
  weeklyOffPolicy: optionalText,
  noticePeriodDays: z.coerce.number().int().min(0).max(365).optional(),
  officialEmail: z.email({ error: "Enter a valid official email." }).trim().toLowerCase(),
  officialMobileNumber: optionalText,
  departmentId: z.string().uuid({ error: "Select a department." }),
  designationId: z.string().uuid({ error: "Select a designation." }),
  reportingManagerId: z.union([z.literal(""), z.string().uuid()]).transform((value) => value || null),
  secondaryManagerId: z.union([z.literal(""), z.string().uuid()]).optional().transform((value) => value || null),
  teamName: optionalText,
  costCentre: optionalText,
  grade: optionalText,
  employeeLevel: optionalText,
  currentAddressLine1: optionalText,
  currentAddressLine2: optionalText,
  currentCity: optionalText,
  currentState: optionalText,
  currentPinCode: z.union([z.literal(""), z.string().regex(/^\d{6}$/)]).optional().transform((value) => value || null),
  permanentSameAsCurrent: z.boolean().default(false),
  permanentAddressLine1: optionalText,
  permanentCity: optionalText,
  permanentState: optionalText,
  permanentPinCode: z.union([z.literal(""), z.string().regex(/^\d{6}$/)]).optional().transform((value) => value || null),
  emergencyContactName: optionalText,
  emergencyRelationship: optionalText,
  emergencyMobile: optionalText,
  bankName: optionalText,
  accountHolderName: optionalText,
  accountNumber: optionalText,
  confirmAccountNumber: optionalText,
  ifscCode: z.union([z.literal(""), z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, { error: "Enter a valid IFSC code." })]).optional().transform((value) => value?.toUpperCase() || null),
  panNumber: z.union([z.literal(""), z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, { error: "Enter a valid PAN." })]).optional().transform((value) => value?.toUpperCase() || null),
  aadhaarNumber: z.union([z.literal(""), z.string().regex(/^\d{12}$/, { error: "Enter a valid 12-digit Aadhaar number." })]).optional().transform((value) => value || null),
  uanNumber: optionalText,
  esiNumber: optionalText,
  taxRegime: optionalText,
  createLogin: z.boolean().default(true),
  temporaryPassword: optionalText,
  confirmTemporaryPassword: optionalText,
  role: z.enum(["hr_admin", "finance", "manager", "employee"]),
  sendWelcomeEmail: z.boolean().default(true),
}).refine((data) => !data.accountNumber || data.accountNumber === data.confirmAccountNumber, {
  path: ["confirmAccountNumber"],
  error: "Account numbers do not match.",
}).superRefine((data, context) => {
  if (!data.createLogin) return;
  if (!data.temporaryPassword || data.temporaryPassword.length < 8 || !/[A-Z]/.test(data.temporaryPassword) || !/[a-z]/.test(data.temporaryPassword) || !/\d/.test(data.temporaryPassword)) {
    context.addIssue({ code: "custom", path: ["temporaryPassword"], message: "Use at least 8 characters with uppercase, lowercase, and a number." });
  }
  if (data.temporaryPassword !== data.confirmTemporaryPassword) {
    context.addIssue({ code: "custom", path: ["confirmTemporaryPassword"], message: "Passwords do not match." });
  }
});

export type EmployeeFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  success?: boolean;
} | undefined;
