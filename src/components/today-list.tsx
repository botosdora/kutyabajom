"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Ban, Check, CircleDashed, ClipboardList, Clock, ExternalLink, MoreHorizontal, Pill, Undo2, Utensils, X } from "lucide-react";
import { logDose, logMeal, undoDose, undoMeal } from "@/app/(app)/today-actions";
import { setTaskStatus } from "@/app/(app)/naptar/actions";
import { Sheet } from "@/components/sheet";
import { haptic } from "@/lib/haptics";

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

const SWIPE_LIMIT = 72;

function TaskRow({ item, petId, day, hideTime = false }: { item: TodayItem; petId: string; day: string; hideTime?: boolean }) {
  const [open, setOpen] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [time, setTime] = useState(item.time);
  const [pending, startTransition] = useTransition();
  // Azonnal mutatjuk az új állapotot, a szerver válaszáig sem kell várni.
  const [status, setStatus] = useOptimistic<TodayItem["status"]>(item.status);
  const [popped, setPopped] = useState(false);
  const [dx, setDx] = useState(0);
  const swipe = useRef<{ x: number; y: number; active: boolean; moved: boolean } | null>(null);

  const run = (next: TodayItem["status"], fn: () => Promise<void>) => {
    setOpen(false);
    setShowTime(false);
    startTransition(async () => {
      setStatus(next);
      await fn();
    });
  };

  const complete = (actualTime?: string) => {
    haptic();
    setPopped(true);
    run(
      item.kind === "dose" ? "given" : item.kind === "task" ? "done" : "eaten",
      () =>
        item.kind === "dose"
          ? logDose(petId, item.medicationId, item.scheduledFor, "given", actualTime, day)
          : item.kind === "task"
            ? setTaskStatus(item.eventId, "done", day)
            : logMeal(petId, day, item.meal, "eaten"),
    );
  };
  // Kihagyás (balra húzás): nem kapta meg / nem ette meg / elmaradt.
  const skip = () => {
    haptic([10, 40, 10]);
    run(item.kind === "meal" ? "refused" : "missed", () =>
      item.kind === "dose"
        ? logDose(petId, item.medicationId, item.scheduledFor, "missed", undefined, day)
        : item.kind === "task"
          ? setTaskStatus(item.eventId, "missed")
          : logMeal(petId, day, item.meal, "refused"),
    );
  };
  const undo = () =>
    run(null, () =>
      item.kind === "dose"
        ? undoDose(item.logId!)
        : item.kind === "task"
          ? setTaskStatus(item.eventId, "planned")
          : undoMeal(item.logId!),
    );

  const logged = status !== null;
  const done = isDone(status);
  const statusText =
    status === null
      ? null
      : item.kind === "meal" && status === "refused"
        ? MEAL_REFUSED
        : item.kind === "task" && status === "missed"
          ? "Elmaradt"
          : STATUS_TEXT[status];
  const Icon = item.kind === "dose" ? Pill : item.kind === "task" ? ClipboardList : Utensils;
  const doneLabel = item.kind === "dose" ? "Beadva" : item.kind === "meal" ? "Megette" : "Kész";
  const skipLabel = item.kind === "dose" ? "Nem kapta meg" : item.kind === "meal" ? MEAL_REFUSED : "Elmaradt";

  // Húzás: jobbra kész, balra kihagyva. A függőleges görgetést nem zavarja.
  const swipeHandlers = logged
    ? {}
    : {
        onPointerDown: (e: React.PointerEvent) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          swipe.current = { x: e.clientX, y: e.clientY, active: false, moved: false };
        },
        onPointerMove: (e: React.PointerEvent) => {
          const s = swipe.current;
          if (!s) return;
          const mx = e.clientX - s.x;
          const my = e.clientY - s.y;
          if (!s.active) {
            if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) swipe.current = null;
            else if (Math.abs(mx) > 10) {
              s.active = true;
              s.moved = true;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }
            return;
          }
          const next = Math.max(-120, Math.min(120, mx));
          if (Math.abs(next) >= SWIPE_LIMIT && Math.abs(dx) < SWIPE_LIMIT) haptic(6);
          setDx(next);
        },
        onPointerUp: () => {
          const s = swipe.current;
          if (s?.active) {
            if (dx >= SWIPE_LIMIT) complete();
            else if (dx <= -SWIPE_LIMIT) skip();
          }
          setDx(0);
          // A húzás végén ne fusson le a gombok kattintása is.
          if (s?.moved) setTimeout(() => (swipe.current = null), 0);
          else swipe.current = null;
        },
        onPointerCancel: () => {
          swipe.current = null;
          setDx(0);
        },
        onClickCapture: (e: React.MouseEvent) => {
          if (swipe.current?.moved) {
            e.stopPropagation();
            e.preventDefault();
          }
        },
      };

  return (
    <li className={`relative overflow-hidden border-b border-border last:border-b-0 ${pending ? "opacity-80" : ""}`}>
      {dx !== 0 && (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-between text-sm font-semibold text-on-primary">
          <span
            className={`flex h-full flex-1 items-center gap-1.5 pl-4 transition-colors ${dx > 0 ? (dx >= SWIPE_LIMIT ? "bg-success" : "bg-success/60") : ""}`}
          >
            {dx > 0 && (
              <>
                <Check size={18} strokeWidth={3} /> {doneLabel}
              </>
            )}
          </span>
          <span
            className={`flex h-full flex-1 items-center justify-end gap-1.5 pr-4 transition-colors ${dx < 0 ? (dx <= -SWIPE_LIMIT ? "bg-danger" : "bg-danger/60") : ""}`}
          >
            {dx < 0 && (
              <>
                {skipLabel} <X size={18} strokeWidth={3} />
              </>
            )}
          </span>
        </div>
      )}
      <div
        {...swipeHandlers}
        className="relative flex min-h-14 touch-pan-y select-none items-center gap-3 bg-surface py-1.5"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? "none" : "transform 0.2s ease-out" }}
      >
        <button
          type="button"
          onClick={() => (logged ? setOpen(true) : complete())}
          aria-label={logged ? `${item.title}: ${statusText}. Módosítás` : `${item.title} kész`}
          className="flex size-11 shrink-0 items-center justify-center"
        >
          <span
            className={`flex size-6 items-center justify-center rounded-md transition-colors ${
              done
                ? "bg-primary text-on-primary"
                : logged
                  ? "bg-danger text-on-primary"
                  : "border-[1.5px] border-text-muted/60"
            } ${popped && logged ? "animate-pop" : ""}`}
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
            {[!hideTime && item.time, item.detail].filter(Boolean).join(" · ")}
            {statusText && (
              <span className={done ? "text-success" : "text-danger"}>
                {(!hideTime || item.detail) && " · "}
                {statusText}
                {item.status === status && item.doneAt && ` ${item.doneAt}`}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label="További lehetőségek"
          className="mr-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-muted hover:bg-border"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>
      </div>

      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setShowTime(false);
        }}
        title={
          <span className="flex items-center gap-2">
            <Icon size={18} className="shrink-0 text-link" aria-hidden="true" />
            <span className="truncate">{item.title}</span>
          </span>
        }
      >
        <p className="-mt-1 mb-3 text-sm text-text-muted">
          {[item.time === "–" ? "Bármikor" : item.time, item.detail, statusText].filter(Boolean).join(" · ")}
        </p>
        <div className="flex flex-col gap-2">
          {logged ? (
            <SheetButton onClick={undo} icon={Undo2}>
              Visszavonás
            </SheetButton>
          ) : (
            <>
              <SheetButton onClick={() => complete()} icon={Check} primary>
                {doneLabel}
              </SheetButton>
              {item.kind === "dose" && (
                <SheetButton onClick={() => setShowTime((v) => !v)} icon={Clock}>
                  Más időpontban adtam be
                </SheetButton>
              )}
              {showTime && (
                <div className="flex gap-2 rounded-2xl bg-surface-muted p-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    aria-label="Tényleges időpont"
                    className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-3 text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => complete(time)}
                    className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
                  >
                    Mentés
                  </button>
                </div>
              )}
              {item.kind === "meal" && (
                <SheetButton onClick={() => run("partial", () => logMeal(petId, day, item.meal, "partial"))} icon={CircleDashed}>
                  Részben ette meg
                </SheetButton>
              )}
              <SheetButton onClick={skip} icon={X}>
                {skipLabel}
              </SheetButton>
              {item.kind === "dose" && (
                <SheetButton
                  onClick={() => run("refused", () => logDose(petId, item.medicationId, item.scheduledFor, "refused", undefined, day))}
                  icon={Ban}
                >
                  Elutasította
                </SheetButton>
              )}
              {item.kind === "task" && (
                <Link
                  href={`/naptar/${item.eventId}`}
                  className="flex h-12 items-center gap-3 rounded-2xl bg-surface-muted px-4 text-[15px] font-semibold hover:bg-border"
                >
                  <ExternalLink size={18} className="text-text-muted" aria-hidden="true" /> Részletek
                </Link>
              )}
              <p className="mt-1 text-center text-xs text-text-muted">Tipp: a sort jobbra húzva kész, balra húzva kihagyva.</p>
            </>
          )}
        </div>
      </Sheet>
    </li>
  );
}

function SheetButton({
  onClick,
  icon: Icon,
  primary = false,
  children,
}: {
  onClick: () => void;
  icon: typeof Check;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center gap-3 rounded-2xl px-4 text-left text-[15px] font-semibold ${
        primary ? "bg-primary text-on-primary hover:bg-primary-hover" : "bg-surface-muted hover:bg-border"
      }`}
    >
      <Icon size={18} className={primary ? "" : "text-text-muted"} aria-hidden="true" />
      {children}
    </button>
  );
}

// Az aktuális budapesti idő "HH:MM" formában (a "Most" jelölőhöz).
function nowTime() {
  return new Intl.DateTimeFormat("hu-HU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Budapest" }).format(new Date());
}

// Idővonal: időpontonként egy csoport, az azonos időpontú teendők egy kártyában.
// A mai napon a "Most" jelölő mutatja, hol tartunk.
export function TodayList({
  items,
  petId,
  day,
  isToday = false,
}: {
  items: TodayItem[];
  petId: string;
  day: string;
  isToday?: boolean;
}) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    if (!isToday) return;
    // Az órát csak a böngészőben olvassuk (a szerveren renderelt idő elavulhat).
    const tick = () => setNow(nowTime());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [isToday]);

  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-text-muted">Erre a napra nincs teendő.</p>;
  }

  const groups: { time: string; items: TodayItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.time === item.time) last.items.push(item);
    else groups.push({ time: item.time, items: [item] });
  }
  // A "Most" jelölő az első még hátralévő időpont elé kerül.
  const nowIndex = now ? groups.findIndex((g) => g.time !== "–" && g.time > now) : -1;

  return (
    <ol className="relative">
      <span aria-hidden="true" className="absolute bottom-3 left-[63px] top-3 w-0.5 rounded-full bg-border" />
      {groups.map((g, i) => {
        const allDone = g.items.every((it) => it.status !== null);
        const past = now !== null && g.time !== "–" && g.time <= now;
        return (
          <li key={`${g.time}-${i}`} className="relative">
            {i === nowIndex && <NowMarker time={now!} />}
            <div className="flex gap-2 pb-3">
              <div className="w-12 shrink-0 pt-4 text-right">
                <span
                  className={`text-sm font-semibold tabular-nums ${past && !allDone ? "text-danger" : allDone ? "text-text-muted" : ""} ${
                    g.time === "–" ? "text-xs" : ""
                  }`}
                >
                  {g.time === "–" ? "Bármikor" : g.time}
                </span>
              </div>
              <div className="relative w-4 shrink-0" aria-hidden="true">
                <span
                  className={`absolute left-[2px] top-[1.15rem] size-3 rounded-full ring-4 ring-bg ${
                    allDone ? "bg-success" : past ? "bg-danger" : "bg-primary"
                  }`}
                />
              </div>
              <ul className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-1">
                {g.items.map((item) => (
                  <TaskRow key={item.key} item={item} petId={petId} day={day} hideTime />
                ))}
              </ul>
            </div>
          </li>
        );
      })}
      {now && nowIndex === -1 && <NowMarker time={now} />}
    </ol>
  );
}

function NowMarker({ time }: { time: string }) {
  return (
    <div className="relative mb-3 flex items-center gap-2" aria-label={`Most: ${time}`}>
      <span className="w-12 shrink-0 text-right text-xs font-bold text-link">Most</span>
      <span className="relative flex w-4 shrink-0 justify-center" aria-hidden="true">
        <span className="size-3 rounded-full bg-primary ring-4 ring-primary-soft" />
      </span>
      <span aria-hidden="true" className="h-0.5 flex-1 rounded-full bg-primary" />
      <span className="text-xs font-semibold tabular-nums text-link">{time}</span>
    </div>
  );
}
