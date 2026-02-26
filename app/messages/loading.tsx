import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-40 h-8" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4"
            >
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="w-32 h-4 mb-2" />
                <Skeleton className="w-full h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
