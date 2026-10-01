/**
 * Plain loading placeholders (route loading.tsx files) shaped like each page, so a click shows
 * the new page's frame at once while its data loads. Grey blocks only, no motifs.
 */
const bar = "animate-pulse bg-rule/50";

function Lines({ widths }: { widths: string[] }) {
  return (
    <div className="space-y-3">
      {widths.map((w, i) => (
        <div key={i} className={`h-4 ${w} ${bar}`} />
      ))}
    </div>
  );
}

function Card({ className = "h-40" }: { className?: string }) {
  return <div className={`border border-rule bg-surface ${className} animate-pulse`} />;
}

function Status() {
  return <span className="sr-only">Loading…</span>;
}

/** Title + subtitle, as on the dashboard, plan and profile pages. */
function AppHeading({ actions = false }: { actions?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className={`h-8 w-56 ${bar}`} />
        <div className={`mt-2 h-4 w-44 ${bar}`} />
      </div>
      {actions && (
        <div className="flex gap-3">
          <div className={`h-9 w-28 ${bar}`} />
          <div className={`h-9 w-36 ${bar}`} />
        </div>
      )}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <Status />
      <AppHeading actions />
      <div className="mt-8 space-y-5">
        <Card />
        <Card className="h-72" />
      </div>
    </div>
  );
}

export function SiteSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <Status />
      <div className={`mb-6 h-4 w-24 ${bar}`} />
      <div className="space-y-5">
        <Card />
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-24" />
          ))}
        </div>
        <Card className="h-72" />
      </div>
    </div>
  );
}

export function PlanSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <Status />
      <AppHeading />
      <div className="mt-6 space-y-5">
        <Card className="h-48" />
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="h-56" />
          <Card className="h-56" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <Status />
      <AppHeading />
      <div className="mt-8 max-w-lg space-y-5">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className={`h-4 w-20 ${bar}`} />
            <div className={`mt-2 h-10 w-full ${bar}`} />
          </div>
        ))}
        <div className={`h-9 w-32 ${bar}`} />
      </div>
    </div>
  );
}

export function ContactSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" role="status" aria-busy="true">
      <Status />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <div className={`h-3 w-16 ${bar}`} />
          <div className={`mt-4 h-10 w-64 ${bar}`} />
          <div className="mt-4 max-w-md">
            <Lines widths={["w-full", "w-11/12", "w-2/3"]} />
          </div>
        </div>
        <Card className="h-[28rem]" />
      </div>
    </div>
  );
}

/** Terms and privacy: a long document. */
export function DocSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6" role="status" aria-busy="true">
      <Status />
      <div className={`h-9 w-64 ${bar}`} />
      <div className={`mt-3 h-4 w-40 ${bar}`} />
      <div className="mt-8 space-y-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <div className={`h-6 w-48 ${bar}`} />
            <Lines widths={["w-full", "w-full", "w-5/6", "w-3/4"]} />
          </div>
        ))}
      </div>
    </div>
  );
}
