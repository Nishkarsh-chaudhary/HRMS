import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="space-y-6"><Skeleton className="h-16 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div><Skeleton className="h-[520px] w-full" /></div>;
}

