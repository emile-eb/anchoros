import { Skeleton } from "@/components/ui/skeleton";

export default function LeadDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-56 rounded-3xl" />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-3xl" />
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
