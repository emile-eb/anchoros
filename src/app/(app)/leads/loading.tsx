import { Skeleton } from "@/components/ui/skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="hidden h-[520px] rounded-3xl lg:block" />
      <div className="grid gap-4 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-56 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
