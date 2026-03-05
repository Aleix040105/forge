export function FeedSkeleton() {
  return (
    <div className="divide-y divide-border/40">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2 items-center">
                <div className="h-3.5 bg-muted rounded w-24" />
                <div className="h-3 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="flex gap-3 mt-3">
                <div className="h-6 bg-muted rounded w-10" />
                <div className="h-6 bg-muted rounded w-10" />
                <div className="h-6 bg-muted rounded w-10" />
                <div className="h-6 bg-muted rounded w-20 ml-auto" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
