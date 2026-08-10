import {EmployeePayroll} from "@/components/payroll/employee-payroll";import {requireEmployee} from "@/lib/auth/dal";import {getEmployeePayroll} from "@/lib/payroll/data";
export default async function EmployeePayrollPage(){const profile=await requireEmployee();return <EmployeePayroll {...await getEmployeePayroll(profile)}/>}
