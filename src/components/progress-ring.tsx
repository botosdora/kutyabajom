"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PawPrint } from "lucide-react";

// Napi haladás körként, mellette a "3 / 8" számláló. A kör simán telik, és ha
// most lett meg az utolsó teendő is, mancsok hullanak (a betöltéskor nem).
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  const complete = total > 0 && done === total;

  const [shown, setShown] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const wasComplete = useRef<boolean | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setShown(pct), 50);
    return () => clearTimeout(t);
  }, [pct]);

  useEffect(() => {
    if (wasComplete.current === false && complete) {
      const start = setTimeout(() => setCelebrate(true), 0);
      const stop = setTimeout(() => setCelebrate(false), 3200);
      wasComplete.current = complete;
      return () => {
        clearTimeout(start);
        clearTimeout(stop);
      };
    }
    wasComplete.current = complete;
  }, [complete]);

  return (
    <span className="flex items-center gap-2" aria-label={`${done} / ${total} teendő kész`}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" className="-rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--surface-muted)" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={complete ? "var(--success)" : "var(--primary)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.3, 0.9, 0.4, 1), stroke 0.3s" }}
        />
      </svg>
      <span className={`text-sm font-semibold tabular-nums ${complete ? "text-success" : "text-text-muted"}`}>
        {done} / {total}
      </span>
      {celebrate && <PawConfetti />}
    </span>
  );
}

// Rögzített elrendezés (nem véletlen), hogy a renderelés tiszta maradjon.
const PAWS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 7) * 0.12,
  dur: 1.8 + ((i * 13) % 10) / 10,
  size: 16 + ((i * 7) % 4) * 6,
  drift: ((i * 29) % 80) - 40,
  spin: ((i * 53) % 360) - 180,
  color: `var(--series-${(i % 5) + 1})`,
}));

function PawConfetti() {
  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {PAWS.map((p, i) => (
        <span
          key={i}
          className="animate-paw-fall absolute top-0"
          style={
            {
              left: `${p.left}%`,
              color: p.color,
              animationDelay: `${p.delay}s`,
              "--dur": `${p.dur}s`,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        >
          <PawPrint size={p.size} fill="currentColor" strokeWidth={1.5} />
        </span>
      ))}
    </div>,
    document.body,
  );
}
