export type LeaveCode = "EL" | "SL" | "RH";

export type LeaveBalanceView = {
  id: string;
  code: LeaveCode;
  name: string;
  colour: string;
  annualEntitlement: number;
  available: number;
  reserved: number;
  consumed: number;
};

export type LeaveRequestView = {
  id: string;
  employeeName: string;
  employeeCode: string;
  leaveCode: LeaveCode;
  leaveName: string;
  fromDate: string;
  toDate: string;
  quantity: number;
  reason: string;
  status: string;
  submittedAt: string;
  reviewerComment: string | null;
};

export type LeaveDayPreview = { date: string; quantity: number; kind: "leave" | "sandwich" | "restricted_holiday" };

export type EmployeeLeaveData = {
  employeeName: string;
  balances: LeaveBalanceView[];
  requests: LeaveRequestView[];
  restrictedHolidays: { date: string; name: string; location: string }[];
};

export type AdminLeaveData = {
  kpis: { onLeaveToday: number; pending: number; upcoming: number; unpaid: number };
  requests: LeaveRequestView[];
  leaveTypes: LeaveBalanceView[];
  employeeCount: number;
  canReview: boolean;
  initialCalendar: LeaveCalendarMonth;
};

export type LeaveCalendarEvent = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  team: string;
  manager: string;
  location: string;
  leaveCode: LeaveCode;
  leaveName: string;
  fromDate: string;
  toDate: string;
  session: string;
  quantity: number;
  reason: string;
  status: string;
  requestedAt: string;
  approvedBy: string;
  dates: string[];
};

export type LeaveCalendarMonth = {
  month: string;
  events: LeaveCalendarEvent[];
  holidays: { date: string; name: string }[];
  employeeCount: number;
  departments: string[];
  locations: string[];
};
