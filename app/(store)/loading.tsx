export default function StoreLoading() {
  return (
    <div className="space-y-4">
      <div className="h-20 w-full animate-pulse rounded-3xl bg-red-100/70 dark:bg-zinc-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-3xl bg-red-100/60 dark:bg-zinc-800"
          />
        ))}
      </div>
    </div>
  );
}
