import * as z from "zod";

export const LoginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
  password: z.string().min(1, { error: "Enter your password." }),
});

export const RecoveryEmailSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
});

export const ResetPasswordSchema = z
  .object({
    email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6,8}$/, { error: "Enter the 6-digit OTP from your email." }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, { error: "Password must contain an uppercase letter." })
      .regex(/[0-9]/, { error: "Password must contain a number." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

export const CompanyDetailsSchema = z.object({
  companyName: z
    .string()
    .min(2, { error: "Company name must be at least 2 characters." })
    .trim(),
  slug: z
    .string()
    .min(2, { error: "Company URL is too short." })
    .max(40, { error: "Company URL is too long." })
    .regex(/^[a-z0-9-]+$/, {
      error: "URL can only contain lowercase letters, numbers and dashes.",
    })
    .trim(),
  industry: z.string().max(80, { error: "Industry is too long." }).optional(),
  companySize: z
    .enum(["1-10", "11-50", "51-200", "201-500", "500+"])
    .optional(),
});

export const AdminAccountSchema = z
  .object({
    fullName: z
      .string()
      .min(2, { error: "Name must be at least 2 characters." })
      .trim(),
    email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, { error: "Password must contain an uppercase letter." })
      .regex(/[0-9]/, { error: "Password must contain a number." }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

export const InviteAcceptSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, { error: "Password must contain an uppercase letter." })
      .regex(/[0-9]/, { error: "Password must contain a number." }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

export const CreateEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(2, { error: "Name must be at least 2 characters." })
    .trim(),
  email: z.email({ error: "Enter a valid email address." }).trim().toLowerCase(),
  role: z.enum(["hr_admin", "finance", "manager", "employee"]),
  departmentId: z.string().min(1, { error: "Select a department." }).nullable(),
  designationId: z.string().min(1, { error: "Select a designation." }).nullable(),
  reportingManagerId: z.string().nullable(),
});

export type AuthFormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      success?: boolean;
      email?: string;
      slug?: string;
      companyName?: string;
      needsVerification?: boolean;
      inviteUrl?: string;
      userId?: string;
      notice?: "verification_required";
    }
  | undefined;
