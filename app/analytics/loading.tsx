import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-40 h-8" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              <Skeleton className="w-40 h-6 mb-4" />
              <Skeleton className="w-full h-64" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
