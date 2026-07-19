import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClass = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" }[size];
  return (
    <svg
      className={cn("animate-spin text-gray-400", sizeClass, className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="w-8 h-8 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-8 bg-gray-100 rounded w-32 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-20" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="w-8 h-8 bg-gray-100 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-48" />
        <div className="h-2 bg-gray-100 rounded w-32" />
      </div>
      <div className="h-5 bg-gray-100 rounded-full w-16" />
    </div>
  );
}
