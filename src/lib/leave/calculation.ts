import { addDays, eachDayOfInterval, format, getDay, parseISO } from "date-fns";
import type { LeaveCode, LeaveDayPreview } from "@/lib/leave/definitions";

export function calculateLeaveDays(fromDate: string, toDate: string, code: LeaveCode, session: string, restrictedDates: Set<string>): LeaveDayPreview[] {
  const from = parseISO(fromDate);
  const to = parseISO(toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) throw new Error("Choose a valid date range.");
  if (session !== "full_day" && fromDate !== toDate) throw new Error("Half-day leave must be requested for one date.");
  if (code === "RH") {
    if (fromDate !== toDate || !restrictedDates.has(fromDate)) throw new Error("Restricted Holiday leave must match one published RH date.");
    return [{ date: fromDate, quantity: session === "full_day" ? 1 : 0.5, kind: "restricted_holiday" }];
  }
  const range = eachDayOfInterval({ start: from, end: to });
  const weekdays = range.filter((date) => ![0,6].includes(getDay(date)));
  const result: LeaveDayPreview[] = weekdays.map((date) => ({ date: format(date,"yyyy-MM-dd"), quantity: session === "full_day" ? 1 : 0.5, kind: "leave" }));
  if (session === "full_day") {
    for (const friday of weekdays.filter((date) => getDay(date) === 5)) {
      const monday = addDays(friday,3);
      if (monday <= to && weekdays.some((date) => format(date,"yyyy-MM-dd") === format(monday,"yyyy-MM-dd"))) {
        for (const weekend of [addDays(friday,1),addDays(friday,2)]) result.push({ date:format(weekend,"yyyy-MM-dd"),quantity:1,kind:"sandwich" });
      }
    }
  }
  return result.sort((a,b)=>a.date.localeCompare(b.date));
}
