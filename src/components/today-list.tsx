"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, ClipboardList, Clock, MoreHorizontal, Pill, Utensils, X } from "lucide-react";
import { logDose, logMeal, undoDose, undoMeal } from "@/app/(app)/today-actions";
import { setTaskStatus } from "@/app/(app)/naptar/actions";

export type TodayItem =
  | {
      kind: "dose";
      key: string;
      time: string;
      title: string;
      detail: string | null;
      medicationId: string;
      scheduledFor: string;
      logId: string | null;
      status: "given" | "missed" | "refused" | null;
      doneAt: string | null;
    }
  | {
      kind: "task";
      key: string;
      time: string;
      title: string;
      detail: string | null;
      eventId: string;
      logId: null;
      status: "done" | "missed" | null;
      doneAt: string | null;
    }
  | {
      kind: "meal";
      key: string;
      time: string;
      title: string;
      detail: string | null;
      meal: "reggeli" | "vacsora";
      logId: string | null;
      status: "eaten" | "partial" | "refused" | null;
      doneAt: string | null;
    };

const STATUS_TEXT: Record<string, string> = {
  given: "Beadva",
  missed: "Nem kapta meg",
  refused: "Elutasította",
  eaten: "Megette",
  partial: "Részben ette meg",
  done: "Kész",
};
const MEAL_REFUSED = "Nem ette meg";

function isDone(status: TodayItem["status"]) {
  return status === "given" || status === "eaten" || status === "partial" || status === "done";
}

function TaskRow({ item, petId, day }: { item: TodayItem; petId: string; day: string }) {
  const [open, setOpen] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [time, setTime] = useState(item.time);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) => {
    setOpen(false);
    setShowTime(false);
    startTransition(fn);
  };

  const complete = (actualTime?: string) =>
    run(() =>
      item.kind === "dose"
        ? logDose(petId, item.medicationId, item.scheduledFor, "given", actualTime, day)
        : item.kind === "task"
          ? setTaskStatus(item.eventId, "done", day)
          : logMeal(petId, day, item.meal, "eaten"),
    );
  const undo = () =>
    run(() =>
      item.kind === "dose"
        ? undoDose(item.logId!)
        : item.kind === "task"
          ? setTaskStatus(item.eventId, "planned")
          : undoMeal(item.logId!),
    );

  const logged = item.status !== null;
  const done = isDone(item.status);
  const statusText =
    item.status === null
      ? null
      : item.kind === "meal" && item.status === "refused"
        ? MEAL_REFUSED
        : item.kind === "task" && item.status === "missed"
          ? "Elmaradt"
          : STATUS_TEXT[item.status];
  const Icon = item.kind === "dose" ? Pill : item.kind === "task" ? ClipboardList : Utensils;

  return (
    <li className={`border-b border-border last:border-b-0 ${pending ? "opacity-60" : ""}`}>
      <div className="flex min-h-14 items-center gap-3 py-1.5">
        <button
          type="button"
          onClick={() => (logged ? setOpen((o) => !o) : complete())}
          aria-label={logged ? `${item.title}: ${statusText}. Módosítás` : `${item.title} kész`}
          className="flex size-11 shrink-0 items-center justify-center"
        >
          <span
            className={`flex size-6 items-center justify-center rounded-md ${
              done
                ? "bg-primary text-on-primary"
                : logged
                  ? "bg-danger text-on-primary"
                  : "border-[1.5px] border-text-muted/60"
            }`}
          >
            {done && <Check size={15} strokeWidth={3} aria-hidden="true" />}
            {logged && !done && <X size={15} strokeWidth={3} aria-hidden="true" />}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[15px] font-semibold ${logged ? "text-text-muted line-through" : ""}`}>
            <Icon size={14} className="mr-1.5 inline -translate-y-px text-text-muted" aria-hidden="true" />
            {item.title}
          </p>
          <p className="truncate text-xs text-text-muted">
            {item.time}
            {item.detail && ` · ${item.detail}`}
            {statusText && (
              <span className={done ? "text-success" : "text-danger"}>
                {" · "}
                {statusText}
                {item.doneAt && ` ${item.doneAt}`}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="További lehetőségek"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted hover:bg-border"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="mb-3 ml-14 flex flex-col gap-2">
          {logged ? (
            <button type="button" onClick={undo} className="h-10 self-start rounded-lg bg-primary-soft px-3 text-sm font-semibold text-link hover:opacity-80">
              Visszavonás
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {item.kind === "dose" ? (
                <>
                  <OptionButton onClick={() => setShowTime((v) => !v)}>
                    <Clock size={15} aria-hidden="true" /> Más időpontban
                  </OptionButton>
                  <OptionButton onClick={() => run(() => logDose(petId, item.medicationId, item.scheduledFor, "missed", undefined, day))}>
                    Nem kapta meg
                  </OptionButton>
                  <OptionButton onClick={() => run(() => logDose(petId, item.medicationId, item.scheduledFor, "refused", undefined, day))}>
                    Elutasította
                  </OptionButton>
                </>
              ) : item.kind === "task" ? (
                <>
                  <OptionButton onClick={() => run(() => setTaskStatus(item.eventId, "missed"))}>Elmaradt</OptionButton>
                  <Link
                    href={`/naptar/${item.eventId}`}
                    className="flex h-10 items-center rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-muted"
                  >
                    Részletek
                  </Link>
                </>
              ) : (
                <>
                  <OptionButton onClick={() => run(() => logMeal(petId, day, item.meal, "partial"))}>
                    Részben ette meg
                  </OptionButton>
                  <OptionButton onClick={() => run(() => logMeal(petId, day, item.meal, "refused"))}>
                    Nem ette meg
                  </OptionButton>
                </>
              )}
            </div>
          )}
          {showTime && (
            <div className="flex gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Tényleges időpont"
                className="h-10 rounded-lg border border-border-strong bg-surface px-3 text-[15px]"
              />
              <button
                type="button"
                onClick={() => complete(time)}
                className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
              >
                Beadva
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function OptionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-muted"
    >
      {children}
    </button>
  );
}

export function TodayList({ items, petId, day }: { items: TodayItem[]; petId: string; day: string }) {
  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-text-muted">Erre a napra nincs teendő.</p>;
  }
  return (
    <ul className="rounded-2xl border border-border bg-surface px-1">
      {items.map((item) => (
        <TaskRow key={item.key} item={item} petId={petId} day={day} />
      ))}
    </ul>
  );
}
