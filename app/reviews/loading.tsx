import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-40 h-8" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              <Skeleton className="w-full h-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



