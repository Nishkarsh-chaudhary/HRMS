import type { Database as BaseDatabase, Json } from "@/types/database";

export type EmployeeFields = {
  employee_code: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  profile_photo_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  blood_group: string | null;
  personal_email: string | null;
  mobile_number: string | null;
  alternate_mobile_number: string | null;
  date_of_joining: string | null;
  employment_type: string | null;
  employment_status: string;
  probation_months: number | null;
  confirmation_date: string | null;
  work_mode: string | null;
  work_location: string | null;
  shift_name: string | null;
  weekly_off_policy: string | null;
  notice_period_days: number | null;
  official_mobile_number: string | null;
  secondary_manager_id: string | null;
  hr_business_partner_id: string | null;
  team_name: string | null;
  cost_centre: string | null;
  grade: string | null;
  employee_level: string | null;
  current_address: Json;
  permanent_address: Json;
  emergency_contact: Json;
  bank_details: Json;
  statutory_details: Json;
  profile_completion: number;
  archived_at: string | null;
  organisation_node_id: string | null;
};

type BaseUsers = BaseDatabase["public"]["Tables"]["users"];
type EmployeeUsers = {
  Row: BaseUsers["Row"] & EmployeeFields;
  Insert: BaseUsers["Insert"] & Partial<EmployeeFields>;
  Update: BaseUsers["Update"] & Partial<EmployeeFields>;
  Relationships: BaseUsers["Relationships"];
};

type AuditLogsTable = {
  Row: { id: string; company_id: string; actor_user_id: string | null; entity_type: string; entity_id: string; action: string; changes: Json; created_at: string };
  Insert: { id?: string; company_id: string; actor_user_id?: string | null; entity_type: string; entity_id: string; action: string; changes?: Json; created_at?: string };
  Update: Partial<AuditLogsTable["Insert"]>;
  Relationships: [];
};

type EmployeeDocumentsTable = {
  Row: { id: string; company_id: string; employee_id: string; document_type: string; file_name: string; storage_path: string; verification_status: string; expiry_date: string | null; notes: string | null; created_by: string | null; created_at: string };
  Insert: { id?: string; company_id: string; employee_id: string; document_type: string; file_name: string; storage_path: string; verification_status?: string; expiry_date?: string | null; notes?: string | null; created_by?: string | null; created_at?: string };
  Update: Partial<EmployeeDocumentsTable["Insert"]>;
  Relationships: [];
};

type OrganisationNode = {
  id: string; company_id: string; parent_id: string | null; node_type: string; name: string; code: string;
  description: string | null; head_user_id: string | null; status: string; sort_order: number;
  created_by: string | null; created_at: string; updated_at: string;
};
type OrganisationNodesTable = {
  Row: OrganisationNode;
  Insert: Partial<Omit<OrganisationNode, "company_id" | "name" | "code" | "node_type">> & Pick<OrganisationNode, "company_id" | "name" | "code" | "node_type">;
  Update: Partial<OrganisationNode>;
  Relationships: [];
};

type BaseDesignations = BaseDatabase["public"]["Tables"]["designations"];
type DesignationFields = { code: string | null; level: number; parent_id: string | null; description: string | null; status: string };
type OrganisationDesignations = {
  Row: BaseDesignations["Row"] & DesignationFields;
  Insert: BaseDesignations["Insert"] & Partial<DesignationFields>;
  Update: BaseDesignations["Update"] & Partial<DesignationFields>;
  Relationships: BaseDesignations["Relationships"];
};

type AttendanceTable<Row, RequiredInsert extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, RequiredInsert> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type AttendanceShiftRow = { id: string; company_id: string; name: string; code: string; start_time: string; end_time: string; timezone: string; grace_minutes: number; full_day_minutes: number; half_day_minutes: number; break_minutes: number; break_mode: "fixed" | "punches"; overtime_after_minutes: number; overtime_method: "effective_hours" | "after_shift_end"; effective_from: string; effective_to: string | null; weekly_offs: number[]; location: string | null; department_id: string | null; overnight: boolean; active: boolean; created_at: string; updated_at: string };
type AttendanceAssignmentRow = { id: string; company_id: string; employee_id: string; shift_id: string; effective_from: string; effective_to: string | null; created_by: string | null; created_at: string };
type OfficeNetworkRow = { id: string; company_id: string; name: string; location: string | null; cidr: string; active: boolean; created_at: string };
type AttendanceRecordRow = { id: string; company_id: string; employee_id: string; shift_id: string | null; attendance_date: string; scheduled_start: string | null; scheduled_end: string | null; first_check_in: string | null; last_check_out: string | null; gross_minutes: number; effective_minutes: number; break_minutes: number; overtime_minutes: number; late_minutes: number; delay_from_start_minutes: number; early_minutes: number; status: string; source: string; locked: boolean; notes: string | null; created_by: string | null; created_at: string; updated_at: string };
type AttendanceBreakRow = { id: string; company_id: string; attendance_record_id: string; employee_id: string; started_at: string; ended_at: string | null; created_at: string };
type AttendancePunchRow = { id: string; company_id: string; attendance_record_id: string; employee_id: string; punch_type: string; punched_at: string; source: string; observed_ip: string | null; user_agent: string | null; latitude: number | null; longitude: number | null; created_by: string | null; created_at: string };
type AttendanceRegularizationRow = { id: string; company_id: string; employee_id: string; attendance_record_id: string | null; attendance_date: string; request_type: string; requested_check_in: string | null; requested_check_out: string | null; reason: string; notes: string | null; attachment_url: string | null; status: string; manager_id: string | null; reviewed_by: string | null; reviewer_comment: string | null; submitted_at: string; reviewed_at: string | null; updated_at: string };
type AttendancePeriodLockRow = { id: string; company_id: string; period_start: string; period_end: string; locked_by: string; locked_at: string; unlocked_by: string | null; unlocked_at: string | null; active: boolean };
type AttendanceAuditRow = { id: string; company_id: string; employee_id: string | null; actor_user_id: string | null; attendance_record_id: string | null; action: string; source: string | null; observed_ip: string | null; user_agent: string | null; result: string; reason: string | null; previous_value: Json | null; new_value: Json | null; created_at: string };

type LeaveTypeRow = { id:string; company_id:string; code:"EL"|"SL"|"RH"; name:string; annual_entitlement:number; monthly_credit:number; colour:string; requires_restricted_holiday:boolean; sandwich_enabled:boolean; active:boolean; effective_from:string; effective_to:string|null; created_at:string; updated_at:string };
type RestrictedHolidayRow = { id:string; company_id:string; holiday_date:string; name:string; location:string; active:boolean; created_by:string|null; created_at:string };
type LeaveTransactionRow = { id:string; company_id:string; employee_id:string; leave_type_id:string; kind:string; quantity:number; effective_date:string; reference_type:string; reference_id:string|null; reason:string|null; actor_user_id:string|null; correlation_id:string; created_at:string };
type LeaveRequestRow = { id:string; company_id:string; employee_id:string; leave_type_id:string; from_date:string; to_date:string; quantity:number; session:string; reason:string; status:string; manager_id:string|null; reviewer_id:string|null; reviewer_comment:string|null; submitted_at:string; reviewed_at:string|null; updated_at:string; version:number };
type LeaveRequestDayRow = { id:string; company_id:string; request_id:string; leave_date:string; quantity:number; day_kind:string; created_at:string };
type LeaveApprovalRow = { id:string; company_id:string; request_id:string; actor_user_id:string; action:string; from_status:string|null; to_status:string; comment:string|null; created_at:string };
type PayrollSalaryRow = { id:string; company_id:string; employee_id:string; name:string; version:number; monthly_fixed:number; earnings:Json; deductions:Json; employer_contributions:Json; effective_from:string; effective_to:string|null; active:boolean; created_by:string|null; created_at:string; updated_at:string };
type PayrollPolicyRow = { id:string; company_id:string; name:string; code:string; category:string; description:string|null; version:number; status:string; priority:number; effective_from:string; effective_to:string|null; scope:Json; conditions:Json; actions:Json; divisor_method:string; rounding_scale:number; sandwich_enabled:boolean; approved_by:string|null; approved_at:string|null; created_by:string|null; created_at:string; updated_at:string };
type PayrollRunRow = { id:string; company_id:string; run_number:string; run_type:string; status:string; period_start:string; period_end:string; payment_date:string; attendance_cutoff:string; leave_cutoff:string; payroll_group:string; input_snapshot_at:string; employee_count:number; gross_total:number; deduction_total:number; net_total:number; exception_count:number; policy_snapshot:Json; created_by:string; approved_by:string|null; approved_at:string|null; locked_by:string|null; locked_at:string|null; paid_at:string|null; payment_reference:string|null; published_at:string|null; reopened_reason:string|null; created_at:string; updated_at:string };
type PayrollResultRow = { id:string; company_id:string; run_id:string; employee_id:string; salary_structure_id:string|null; salary_structure_version:number|null; calendar_days:number; eligible_days:number; present_days:number; paid_leave_days:number; weekly_off_days:number; holiday_days:number; lop_days:number; sandwich_lop_days:number; payable_days:number; divisor:number; fixed_earnings:number; other_earnings:number; reimbursements:number; arrears:number; statutory_deductions:number; other_deductions:number; recoveries:number; gross_pay:number; total_deductions:number; net_pay:number; status:string; on_hold:boolean; hold_reason:string|null; exceptions:Json; input_snapshot:Json; calculation_trace:Json; version:number; calculated_at:string };
type PayrollDayRow = { id:string; company_id:string; result_id:string; employee_id:string; payroll_date:string; source_classification:string; final_classification:string; paid_fraction:number; attendance_record_id:string|null; leave_request_id:string|null; policy_result:Json };
type PayrollSlipRow = { id:string; company_id:string; run_id:string; result_id:string; employee_id:string; version:number; status:string; template_version:number; generation_id:string; storage_path:string|null; snapshot:Json; published_at:string|null; published_by:string|null; created_at:string };
type PayrollAuditRow = { id:string; company_id:string; run_id:string|null; result_id:string|null; employee_id:string|null; actor_user_id:string|null; action:string; previous_value:Json|null; new_value:Json|null; reason:string|null; created_at:string };


export type EmployeeDatabase = {
  public: {
    Tables: Omit<BaseDatabase["public"]["Tables"], "users" | "designations"> & {
      users: EmployeeUsers;
      designations: OrganisationDesignations;
      organisation_nodes: OrganisationNodesTable;
      audit_logs: AuditLogsTable;
      employee_documents: EmployeeDocumentsTable;
      attendance_shifts: AttendanceTable<AttendanceShiftRow, "company_id" | "name" | "code" | "start_time" | "end_time">;
      attendance_shift_assignments: AttendanceTable<AttendanceAssignmentRow, "company_id" | "employee_id" | "shift_id" | "effective_from">;
      office_networks: AttendanceTable<OfficeNetworkRow, "company_id" | "name" | "cidr">;
      attendance_records: AttendanceTable<AttendanceRecordRow, "company_id" | "employee_id" | "attendance_date">;
      attendance_punches: AttendanceTable<AttendancePunchRow, "company_id" | "attendance_record_id" | "employee_id" | "punch_type">;
      attendance_breaks: AttendanceTable<AttendanceBreakRow, "company_id" | "attendance_record_id" | "employee_id" | "started_at">;
      attendance_regularizations: AttendanceTable<AttendanceRegularizationRow, "company_id" | "employee_id" | "attendance_date" | "request_type" | "reason">;
      attendance_period_locks: AttendanceTable<AttendancePeriodLockRow, "company_id" | "period_start" | "period_end" | "locked_by">;
      attendance_audit_events: AttendanceTable<AttendanceAuditRow, "company_id" | "action">;
      leave_types: AttendanceTable<LeaveTypeRow, "company_id" | "code" | "name" | "annual_entitlement" | "colour">;
      restricted_holidays: AttendanceTable<RestrictedHolidayRow, "company_id" | "holiday_date" | "name">;
      leave_balance_transactions: AttendanceTable<LeaveTransactionRow, "company_id" | "employee_id" | "leave_type_id" | "kind" | "quantity" | "effective_date" | "reference_type">;
      leave_requests: AttendanceTable<LeaveRequestRow, "company_id" | "employee_id" | "leave_type_id" | "from_date" | "to_date" | "quantity" | "reason" | "status">;
      leave_request_days: AttendanceTable<LeaveRequestDayRow, "company_id" | "request_id" | "leave_date" | "quantity" | "day_kind">;
      leave_approval_actions: AttendanceTable<LeaveApprovalRow, "company_id" | "request_id" | "actor_user_id" | "action" | "to_status">;
      payroll_salary_structures: AttendanceTable<PayrollSalaryRow, "company_id" | "employee_id" | "monthly_fixed" | "effective_from">;
      payroll_policies: AttendanceTable<PayrollPolicyRow, "company_id" | "name" | "code" | "category" | "effective_from">;
      payroll_runs: AttendanceTable<PayrollRunRow, "company_id" | "run_number" | "period_start" | "period_end" | "payment_date" | "attendance_cutoff" | "leave_cutoff" | "created_by">;
      payroll_results: AttendanceTable<PayrollResultRow, "company_id" | "run_id" | "employee_id" | "calendar_days" | "eligible_days" | "divisor">;
      payroll_day_results: AttendanceTable<PayrollDayRow, "company_id" | "result_id" | "employee_id" | "payroll_date" | "source_classification" | "final_classification" | "paid_fraction">;
      payroll_slips: AttendanceTable<PayrollSlipRow, "company_id" | "run_id" | "result_id" | "employee_id" | "snapshot">;
      payroll_audit_events: AttendanceTable<PayrollAuditRow, "company_id" | "action">;
    };
    Views: BaseDatabase["public"]["Views"];
    Functions: BaseDatabase["public"]["Functions"] & {
      record_attendance_punch: { Args: { p_type: "in" | "out"; p_observed_ip?: string | null; p_user_agent?: string | null }; Returns: AttendanceRecordRow };
      recalculate_attendance_record: { Args: { p_record_id: string }; Returns: AttendanceRecordRow };
      assign_payroll_salary_structure: { Args: { p_employee_id:string; p_name:string; p_monthly_fixed:number; p_effective_from:string; p_earnings?:Json; p_deductions?:Json }; Returns: PayrollSalaryRow };
      accrue_leave_entitlements: { Args: { p_employee_id?: string | null }; Returns: number };
    };
    Enums: BaseDatabase["public"]["Enums"];
    CompositeTypes: BaseDatabase["public"]["CompositeTypes"];
  };
};
