import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

// Egyszerű, közös felületi elemek. Szándékosan kevés változat.

const buttonBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:opacity-60";
const buttonVariants = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-border-strong bg-surface text-text hover:bg-surface-muted",
  ghost: "text-text-muted hover:bg-surface-muted hover:text-text",
  danger: "text-danger hover:bg-surface-muted",
};
export type ButtonVariant = keyof typeof buttonVariants;

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  return `${buttonBase} ${buttonVariants[variant]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

const inputClass =
  "h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-[15px] text-text placeholder:text-text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export function Field({
  label,
  name,
  hint,
  ...props
}: ComponentProps<"input"> & { label: string; name: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input name={name} className={inputClass} {...props} />
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  ...props
}: ComponentProps<"textarea"> & { label: string; name: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <textarea name={name} rows={3} className={`${inputClass} h-auto py-2`} {...props} />
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  ...props
}: ComponentProps<"select"> & {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <select name={name} className={inputClass} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-2xl border border-border bg-surface p-4 ${className}`} {...props} />;
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      {back && (
        <Link href={back.href} className="mb-1 text-sm font-medium text-link hover:opacity-80">
          ← {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div>
          {subtitle && <p className="text-sm font-medium text-text-muted">{subtitle}</p>}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {action}
      </div>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="text-[15px] font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-text-muted">
      {children}
    </p>
  );
}

const alertStyles = {
  error: { box: "bg-danger-soft text-danger", icon: AlertCircle },
  success: { box: "bg-success-soft text-success", icon: CheckCircle2 },
  info: { box: "bg-primary-soft text-link", icon: Info },
};

export function Alert({ kind = "info", children }: { kind?: keyof typeof alertStyles; children: ReactNode }) {
  const { box, icon: Icon } = alertStyles[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm font-medium ${box}`}>
      <Icon size={18} className="mt-px shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
