export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center pt-12 sm:pt-20">
      {/* Big number skeleton */}
      <div className="h-[72px] w-32 rounded-[var(--radius-lg)] skeleton" />
      <div className="mt-3 h-4 w-40 rounded-[var(--radius-md)] skeleton" />
      <div className="mt-1 h-3.5 w-48 rounded-[var(--radius-md)] skeleton" />

      {/* CTA skeleton */}
      <div className="mt-10 w-full max-w-sm">
        <div className="h-[52px] w-full rounded-[var(--radius-xl)] skeleton" />
        <div className="mt-4 mx-auto h-[44px] w-36 rounded-[var(--radius-md)] skeleton" />
      </div>

      {/* Context section skeleton */}
      <div className="mt-12 w-full border-t border-border pt-10">
        <div className="h-3 w-28 rounded-[var(--radius-md)] skeleton" />
        <div className="mt-4 space-y-5">
          <div>
            <div className="h-3.5 w-full rounded-[var(--radius-md)] skeleton" />
            <div className="mt-1.5 h-1 w-full rounded-full skeleton" />
          </div>
          <div>
            <div className="h-3.5 w-3/4 rounded-[var(--radius-md)] skeleton" />
            <div className="mt-1.5 h-1 w-full rounded-full skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}
