import { Skeleton } from "@/components/ui/skeleton";

export default function ReservationLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-64 h-8" />
        </div>

        <div className="space-y-6">
          {/* Reservation Info Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <Skeleton className="w-40 h-6 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>

          {/* Property Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <Skeleton className="w-40 h-6 mb-4" />
            <Skeleton className="w-full h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
