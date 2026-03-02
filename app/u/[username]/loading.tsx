export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header skeleton */}
      <div className="border-b border-[#3f3f46]">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#27272a] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-7 w-40 bg-[#27272a] rounded animate-pulse" />
              <div className="h-4 w-64 bg-[#27272a] rounded animate-pulse" />
              <div className="flex gap-6 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-6 w-10 bg-[#27272a] rounded animate-pulse" />
                    <div className="h-3 w-14 bg-[#27272a] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-6 w-48 bg-[#27272a] rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#18181b] border border-[#3f3f46] rounded-xl p-4">
              <div className="h-24 bg-[#27272a] rounded animate-pulse" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 bg-[#27272a] rounded animate-pulse" />
                <div className="h-3 w-full bg-[#27272a] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
