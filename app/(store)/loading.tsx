export default function StoreLoading() {
  return (
    <div className="space-y-6">
      <div className="premium-card skeleton-shimmer h-32 w-full rounded-[1.8rem]" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="premium-card overflow-hidden rounded-3xl">
            <div className="skeleton-shimmer h-44 w-full" />
            <div className="space-y-3 p-4">
              <div className="skeleton-shimmer h-4 w-4/5 rounded-lg" />
              <div className="skeleton-shimmer h-3 w-2/5 rounded-lg" />
              <div className="skeleton-shimmer h-5 w-1/3 rounded-lg" />
              <div className="skeleton-shimmer h-9 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
