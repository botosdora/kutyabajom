"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, HeartPulse, House, Menu, NotebookPen } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Főoldal", icon: House },
  { href: "/naptar", label: "Naptár", icon: CalendarDays },
  { href: "/naplo", label: "Napló", icon: NotebookPen },
  { href: "/egeszseg", label: "Egészség", icon: HeartPulse },
  { href: "/tobb", label: "Több", icon: Menu },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Fő menü"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] ${
              active ? "font-semibold text-primary" : "font-medium text-text-muted"
            }`}
          >
            <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Fő menü" className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] ${
              active
                ? "bg-primary-soft font-semibold text-primary"
                : "font-medium text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
