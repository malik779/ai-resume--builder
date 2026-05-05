import { Skeleton } from "@/components/ui/skeleton";

export default function ResumeEditorLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -mt-6 overflow-hidden">
      {/* Left editor panel */}
      <div className="w-[380px] shrink-0 border-r bg-white flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b gap-2">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-md" />
          ))}
        </div>

        {/* Form fields */}
        <div className="flex-1 overflow-auto p-4 space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Right preview panel */}
      <div className="flex-1 bg-gray-100 flex items-start justify-center overflow-auto py-8">
        <div className="w-[595px] min-h-[842px] bg-white shadow-xl rounded-sm p-10 space-y-4">
          {/* Name */}
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-3.5 w-56 mx-auto" />

          <div className="border-t border-gray-200 my-5" />

          {/* Section heading */}
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className={`h-3 ${i === 0 ? "w-full" : i === 1 ? "w-5/6" : "w-3/4"}`} />
          ))}

          <div className="border-t border-gray-200 my-5" />

          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5 mb-3">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}

          <div className="border-t border-gray-200 my-5" />

          <Skeleton className="h-4 w-28" />
          <div className="flex flex-wrap gap-2 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
