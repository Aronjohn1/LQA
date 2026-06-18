import React from "react";

export function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

export function PageSkeleton({ rows = 3 }) {
  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 md:p-8">
      <div className="mb-8 space-y-3">
        <SkeletonBlock className="h-9 w-72 max-w-full" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-[0_4px_6px_rgba(0,0,0,0.07)]">
        <div className="mb-6 flex flex-wrap gap-3">
          <SkeletonBlock className="h-11 w-36" />
          <SkeletonBlock className="h-11 w-36" />
          <SkeletonBlock className="h-11 w-52" />
        </div>
        <TableSkeleton rows={rows} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white">
      <div className="grid gap-3 bg-slate-50 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(80px, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBlock key={`head-${index}`} className="h-4" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={`row-${row}`} className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(80px, 1fr))` }}>
            {Array.from({ length: columns }).map((_, col) => (
              <SkeletonBlock key={`${row}-${col}`} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <SkeletonBlock className="mb-4 h-4 w-28" />
          <SkeletonBlock className="mb-5 h-8 w-20" />
          <SkeletonBlock className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,_#f5f7fa_0%,_#c3cfe2_100%)] p-5">
      <div className="w-full max-w-[450px] rounded-3xl bg-[#0b7a3a] p-8 pt-20 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="mx-auto mb-5 h-32 w-32 animate-pulse rounded-full bg-white/35" />
        <div className="space-y-3">
          <SkeletonBlock className="mx-auto h-6 w-44 bg-white/45" />
          <SkeletonBlock className="mx-auto h-4 w-56 bg-white/35" />
          <SkeletonBlock className="mx-auto h-4 w-40 bg-white/35" />
        </div>
        <div className="mx-auto my-6 h-48 w-48 animate-pulse rounded-xl bg-white/30" />
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonBlock className="h-11 bg-white/35" />
          <SkeletonBlock className="h-11 bg-white/35" />
        </div>
      </div>
    </div>
  );
}

export function ButtonSkeleton({ label = "Loading" }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <span className="h-3 w-24 animate-pulse rounded-full bg-white/70" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
