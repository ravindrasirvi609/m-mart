export default function AdminLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-44 animate-pulse rounded-2xl bg-[#1f2130]" />
      ))}
    </div>
  );
}
