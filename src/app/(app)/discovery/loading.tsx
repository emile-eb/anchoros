import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoveryLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-4 h-10 w-full rounded-xl" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
