"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { calculators } from "@/lib/calculators/registry";
import { useLocale } from "./locale-provider";
import { useSettings } from "./settings-provider";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-accent-wash font-semibold text-accent"
          : "text-ink-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="hidden px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-muted lg:block">
      {children}
    </p>
  );
}

export function AppNav() {
  const { t } = useLocale();
  return (
    <nav
      aria-label={t.nav.main}
      className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      <NavLink href="/">{t.nav.cockpit}</NavLink>
      <GroupLabel>{t.nav.calculators}</GroupLabel>
      {calculators.map((calculator) => (
        <NavLink key={calculator.id} href={calculator.href}>
          {t.calculators[calculator.id].title}
        </NavLink>
      ))}
      <GroupLabel>{t.nav.account}</GroupLabel>
      <NavLink href="/einstellungen">{t.nav.settings}</NavLink>
    </nav>
  );
}

export function SaveIndicator() {
  const { t } = useLocale();
  const { saveState } = useSettings();
  return (
    <span
      aria-live="polite"
      className={`text-xs ${saveState === "error" ? "text-critical" : "text-ink-2"}`}
    >
      {t.saveState[saveState]}
    </span>
  );
}
