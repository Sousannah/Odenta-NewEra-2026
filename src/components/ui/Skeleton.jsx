import { cn } from "@/lib/cn";

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-100",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent",
        className
      )}
    />
  );
}

export function CardSkeleton({ className }) {
  return (
    <div className={cn("od-card gap-4 p-5", className)}>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
