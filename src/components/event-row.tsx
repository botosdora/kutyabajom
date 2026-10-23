import Link from "next/link";
import { ChevronRight, ClipboardList, Stethoscope } from "lucide-react";
import { formatShortDate, shortTime } from "@/lib/format";
import { EVENT_STATUS_LABELS, vetTypeLabel } from "@/lib/calendar";

export type EventRowData = {
  id: string;
  category: string;
  vet_type: string | null;
  title: string;
  event_date: string;
  event_time: string | null;
  status: string;
  task_types?: { name: string } | null;
};

export function EventRow({ event, showDate = true }: { event: EventRowData; showDate?: boolean }) {
  const Icon = event.category === "orvosi" ? Stethoscope : ClipboardList;
  const typeLabel = event.category === "orvosi" ? vetTypeLabel(event.vet_type) : (event.task_types?.name ?? "Feladat");
  const when = [showDate && formatShortDate(event.event_date), event.event_time && shortTime(event.event_time)]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link
        href={`/naptar/${event.id}`}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-muted"
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            event.category === "orvosi" ? "bg-primary-soft text-link" : "bg-surface-muted text-text"
          }`}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-semibold ${event.status !== "planned" ? "text-text-muted" : ""}`}>
            {event.title}
          </span>
          <span className="block truncate text-sm text-text-muted">
            {[when, typeLabel].filter(Boolean).join(" · ")}
          </span>
        </span>
        {event.status !== "planned" && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              event.status === "done" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            }`}
          >
            {EVENT_STATUS_LABELS[event.status]}
          </span>
        )}
        <ChevronRight size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
      </Link>
    </li>
  );
}
