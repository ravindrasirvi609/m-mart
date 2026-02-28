export default function StoreLoading() {
  return (
    <div className="space-y-6">
      <div className="premium-card skeleton-shimmer h-28 w-full rounded-2xl sm:h-32 sm:rounded-[1.8rem]" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="premium-card overflow-hidden rounded-2xl">
            <div className="skeleton-shimmer aspect-square w-full" />
            <div className="space-y-2 p-3">
              <div className="skeleton-shimmer h-3 w-4/5 rounded-lg" />
              <div className="skeleton-shimmer h-3 w-2/5 rounded-lg" />
              <div className="skeleton-shimmer h-4 w-1/3 rounded-lg" />
              <div className="skeleton-shimmer h-8 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
