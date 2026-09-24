import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    up: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/30",
    down: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/15 dark:text-rose-300 dark:ring-rose-400/30",
    error: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/30",
    pending: "bg-accent-soft text-muted ring-rule",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize",
        map[status] || map.pending
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          status === "up" && "bg-emerald-500",
          status === "down" && "bg-rose-500",
          status === "error" && "bg-amber-500",
          (status === "pending" || !map[status]) && "bg-muted"
        )}
      />
      {status}
    </span>
  );
}
