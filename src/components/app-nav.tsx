"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { calculators } from "@/lib/calculators/registry";
import { type SaveState, useSettings } from "./settings-provider";

const saveStateText: Record<SaveState, string> = {
  idle: "",
  saving: "Speichert …",
  saved: "Gespeichert",
  error: "Speichern fehlgeschlagen",
};

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

export function AppNav() {
  return (
    <nav
      aria-label="Hauptnavigation"
      className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
    >
      <NavLink href="/">Cockpit</NavLink>
      <p className="hidden px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-muted lg:block">
        Rechner
      </p>
      {calculators.map((calculator) => (
        <NavLink key={calculator.id} href={calculator.href}>
          {calculator.title}
        </NavLink>
      ))}
      <p className="hidden px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-muted lg:block">
        Konto
      </p>
      <NavLink href="/einstellungen">Einstellungen</NavLink>
    </nav>
  );
}

export function SaveIndicator() {
  const { saveState } = useSettings();
  return (
    <span
      aria-live="polite"
      className={`text-xs ${saveState === "error" ? "text-critical" : "text-ink-2"}`}
    >
      {saveStateText[saveState]}
    </span>
  );
}
