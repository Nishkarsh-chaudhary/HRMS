import { Badge } from "@/components/ui/badge";

export function LeaveStatusBadge({status}:{status:string}){
  const tone=status==="Approved"?"bg-emerald-50 text-emerald-700 border-emerald-200":status==="Rejected"||status==="Cancelled"?"bg-rose-50 text-rose-700 border-rose-200":status==="Withdrawn"?"bg-slate-50 text-slate-600 border-slate-200":"bg-amber-50 text-amber-700 border-amber-200";
  return <Badge variant="outline" className={tone}>{status}</Badge>;
}
