export const PERMISSION_GROUPS = {
  "Payroll Dashboard": ["payroll.dashboard.view","payroll.dashboard.view_totals","payroll.dashboard.view_sensitive_totals","payroll.dashboard.export"],
  "Payroll Runs": ["payroll.run.view","payroll.run.create","payroll.run.edit","payroll.run.calculate","payroll.run.recalculate","payroll.run.submit","payroll.run.approve","payroll.run.reject","payroll.run.lock","payroll.run.reopen","payroll.run.cancel","payroll.run.delete_draft"],
  "Employee Payout": ["payroll.employee.view","payroll.employee.view_salary","payroll.employee.view_net_pay","payroll.employee.edit_components","payroll.employee.override","payroll.employee.hold","payroll.employee.release","payroll.employee.recalculate","payroll.employee.view_trace"],
  "Salary Structure": ["salary.structure.view","salary.structure.create","salary.structure.edit","salary.structure.approve","salary.structure.assign","salary.structure.deactivate","salary.structure.view_history"],
  "Payroll Inputs": ["payroll.input.attendance_view","payroll.input.leave_view","payroll.input.regularize","payroll.input.finalize","payroll.input.override","payroll.input.reopen"],
  "Payout Policies": ["payout.policy.view","payout.policy.create","payout.policy.edit_draft","payout.policy.duplicate","payout.policy.simulate","payout.policy.submit","payout.policy.approve","payout.policy.activate","payout.policy.deactivate","payout.policy.archive","payout.policy.view_history"],
  "Sandwich Policies": ["sandwich.policy.view","sandwich.policy.create","sandwich.policy.edit_draft","sandwich.policy.simulate","sandwich.policy.approve","sandwich.policy.activate","sandwich.policy.override_result"],
  "Payment Processing": ["payroll.payment.view","payroll.payment.view_bank_masked","payroll.payment.view_bank_full","payroll.payment.export_bank_file","payroll.payment.create_batch","payroll.payment.mark_processing","payroll.payment.mark_paid","payroll.payment.mark_failed","payroll.payment.retry","payroll.payment.reverse"],
  "Salary Slips": ["salary_slip.view_preview","salary_slip.generate","salary_slip.regenerate","salary_slip.publish","salary_slip.schedule_publish","salary_slip.unpublish","salary_slip.replace","salary_slip.download","salary_slip.view_history","salary_slip.template_manage"],
  "Reports & Audit": ["payroll.report.view","payroll.report.export","payroll.report.export_sensitive","payroll.audit.view","payroll.audit.export","payroll.audit.view_sensitive"],
  "Role Administration": ["role.view","role.create","role.edit","role.clone","role.assign","role.deactivate","role.view_assignment_history"],
} as const;

export type PermissionCode = (typeof PERMISSION_GROUPS)[keyof typeof PERMISSION_GROUPS][number];
export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat() as PermissionCode[];

/** Plain-language action shown to administrators; the stable code remains the stored value. */
export function permissionLabel(code:string) {
  const parts=code.split(".");
  const action=(parts[0]==="salary_slip"?parts.slice(1):parts.slice(2)).join("_")||parts.at(-1)||code;
  const nouns:Record<string,string>={"payroll.dashboard":"payroll dashboard","payroll.run":"payroll run","payroll.employee":"employee payout","salary.structure":"salary structure","payroll.input":"payroll input","payout.policy":"payout policy","sandwich.policy":"sandwich policy","payroll.payment":"payment","payroll.report":"payroll report","payroll.audit":"payroll audit log","role.view":"role","role.create":"role","role.edit":"role","role.clone":"role","role.assign":"role"};
  const simpleActions=new Set(["view","create","edit","calculate","recalculate","submit","approve","reject","lock","reopen","cancel","generate","publish","download","assign","deactivate","clone","export"]);
  const phrase=simpleActions.has(action)?`${action} ${nouns[`${parts[0]}.${parts[1]}`]??(parts[0]==="salary_slip"?"salary slip":"record")}`:action.replaceAll("_"," ");
  return phrase.replace(/^\w/,letter=>letter.toUpperCase());
}

export const HIGH_RISK_PAIRS: [PermissionCode,PermissionCode,string][] = [
  ["payroll.run.create","payroll.run.approve","Can prepare and approve payroll"],
  ["payroll.run.approve","payroll.run.reopen","Can approve and reopen payroll"],
  ["payout.policy.create","payout.policy.activate","Can create and activate policies"],
  ["salary_slip.publish","salary_slip.unpublish","Can publish and unpublish salary slips"],
  ["role.assign","role.edit","Can assign and modify roles"],
];

const payrollTeam = ALL_PERMISSIONS.filter(code=>!code.startsWith("role.")&&!code.includes("view_bank_full"));
export const LEGACY_ROLE_PERMISSIONS: Record<string,readonly PermissionCode[]> = {
  super_admin: ALL_PERMISSIONS,
  hr_admin: payrollTeam,
  finance: ALL_PERMISSIONS.filter(code=>code.startsWith("payroll.run.")||code.startsWith("payroll.dashboard.")||code.startsWith("payroll.employee.")||code==="salary.structure.view"||code.startsWith("payroll.payment.")||code.startsWith("salary_slip.")||code.startsWith("payroll.report.")),
  manager: ["payroll.input.attendance_view","payroll.input.leave_view","payroll.input.regularize"],
  employee: ["salary_slip.download","salary_slip.view_history"],
};
