export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-64 animate-pulse rounded-md bg-surface-2" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-surface-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-kpi border border-border-soft bg-surface-2" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card border border-border-soft bg-surface-2" />
    </div>
  );
}
