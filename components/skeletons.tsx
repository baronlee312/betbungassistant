function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

export function ScheduleSkeleton() {
  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-48" />
            <SkeletonBlock className="h-12 w-full max-w-xl" />
            <SkeletonBlock className="h-5 w-72" />
          </div>
          <SkeletonBlock className="h-16 w-56" />
        </div>

        <div className="space-y-10">
          {Array.from({ length: 2 }, (_, sectionIndex) => (
            <section key={sectionIndex} className="space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-8 w-48" />
                <SkeletonBlock className="h-7 w-24" />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="min-h-56 rounded-lg border border-slate-800 bg-slate-950/80 p-5"
                  >
                    <div className="flex justify-between">
                      <SkeletonBlock className="h-4 w-28" />
                      <SkeletonBlock className="h-7 w-20" />
                    </div>
                    <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <SkeletonBlock className="h-8 w-full" />
                      <SkeletonBlock className="h-14 w-20" />
                      <SkeletonBlock className="h-8 w-full" />
                    </div>
                    <SkeletonBlock className="mt-10 h-5 w-full" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export function MatchDetailSkeleton() {
  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <SkeletonBlock className="h-10 w-32" />
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
          <SkeletonBlock className="h-4 w-44" />
          <SkeletonBlock className="mt-4 h-14 w-full max-w-3xl" />
          <SkeletonBlock className="mt-4 h-5 w-80" />
          <SkeletonBlock className="mt-6 h-24 w-full" />
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="mt-3 h-8 w-56" />
              <SkeletonBlock className="mt-6 h-24 w-full" />
              <SkeletonBlock className="mt-3 h-11 w-full" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
