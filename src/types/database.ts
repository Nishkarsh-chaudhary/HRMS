// Generated-style Supabase types for the HRMS schema.
// Source of truth: supabase/migrations/*.sql.
// Regenerate with: npx supabase gen types typescript --project-id <ref> --db-url <connection>

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CompanyStatus = "pending_verification" | "active" | "suspended";
export type UserRole = "super_admin" | "hr_admin" | "finance" | "manager" | "employee";
export type UserStatus = "invited" | "active" | "suspended" | "deactivated";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          industry: string | null;
          company_size: "1-10" | "11-50" | "51-200" | "201-500" | "500+" | null;
          timezone: string;
          status: CompanyStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          industry?: string | null;
          company_size?: "1-10" | "11-50" | "51-200" | "201-500" | "500+" | null;
          timezone?: string;
          status?: CompanyStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          name: string;
          slug: string;
          industry: string | null;
          company_size: "1-10" | "11-50" | "51-200" | "201-500" | "500+" | null;
          timezone: string;
          status: CompanyStatus;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          company_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          status: UserStatus;
          reporting_manager_id: string | null;
          department_id: string | null;
          designation_id: string | null;
          invited_by: string | null;
          invite_token: string | null;
          invite_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          company_id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          status?: UserStatus;
          reporting_manager_id?: string | null;
          department_id?: string | null;
          designation_id?: string | null;
          invited_by?: string | null;
          invite_token?: string | null;
          invite_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          auth_user_id: string | null;
          company_id: string;
          full_name: string;
          email: string;
          role: UserRole;
          status: UserStatus;
          reporting_manager_id: string | null;
          department_id: string | null;
          designation_id: string | null;
          invited_by: string | null;
          invite_token: string | null;
          invite_expires_at: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "users_auth_user_id_fkey";
            columns: ["auth_user_id"];
            isOneToOne: true;
            referencedRelation: "auth.users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      departments: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          company_id: string;
          name: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      designations: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          company_id: string;
          name: string;
          created_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_invite: {
        Args: { p_token: string; p_auth_user_id: string };
        Returns: Json;
      };
      ensure_unique_slug: {
        Args: { p_slug: string };
        Returns: string;
      };
      get_invite: {
        Args: { p_token: string };
        Returns: Json;
      };
      signup_company: {
        Args: {
          p_company_name: string;
          p_slug: string;
          p_industry: string;
          p_company_size: string;
          p_timezone: string;
          p_auth_user_id: string;
          p_full_name: string;
          p_email: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      company_status: CompanyStatus;
      user_role: UserRole;
      user_status: UserStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
