import {EmployeePayroll} from "@/components/payroll/employee-payroll";import {requirePortal} from "@/lib/auth/dal";import {getEmployeePayroll} from "@/lib/payroll/data";
export default async function SelfServicePayrollPage(){const profile=await requirePortal();return <EmployeePayroll {...await getEmployeePayroll(profile)}/>}
