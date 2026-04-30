import { Skeleton } from "@/components/ui/skeleton";

export default function RouteDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Skeleton className="h-[420px] w-full rounded-3xl lg:h-[620px]" />
        <div className="space-y-4">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
      <div className="grid gap-4">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <Skeleton className="h-36 w-full rounded-3xl" />
        <Skeleton className="h-36 w-full rounded-3xl" />
      </div>
    </div>
  );
}
