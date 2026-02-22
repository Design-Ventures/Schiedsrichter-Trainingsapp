export default function ProtectedLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Title skeleton */}
      <div>
        <div className="h-7 w-48 rounded-[var(--radius-md)] skeleton" />
        <div className="mt-2.5 h-4 w-64 rounded-[var(--radius-md)] skeleton" />
      </div>

      {/* Card skeletons */}
      <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
        <div className="h-36 rounded-[var(--radius-xl)] skeleton" />
        <div className="h-36 rounded-[var(--radius-xl)] skeleton" />
      </div>

      {/* Stats skeleton */}
      <div>
        <div className="h-5 w-32 rounded-[var(--radius-md)] skeleton" />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          <div className="h-20 rounded-[var(--radius-lg)] skeleton" />
          <div className="h-20 rounded-[var(--radius-lg)] skeleton" />
          <div className="h-20 rounded-[var(--radius-lg)] skeleton" />
        </div>
      </div>
    </div>
  );
}
