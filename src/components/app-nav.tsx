"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { calculators } from "@/lib/calculators/registry";
import { useLocale } from "./locale-provider";
import { useSettings } from "./settings-provider";

function NavLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`block whitespace-nowrap rounded-md px-3 py-3 text-sm lg:py-2 ${
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
    <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted lg:pt-5">
      {children}
    </p>
  );
}

/** All links of the app; the same list in the sidebar and in the phone menu. */
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLocale();
  return (
    <>
      <NavLink href="/cockpit" onNavigate={onNavigate}>
        {t.nav.cockpit}
      </NavLink>
      <GroupLabel>{t.nav.planning}</GroupLabel>
      <NavLink href="/plan" onNavigate={onNavigate}>
        {t.nav.plan}
      </NavLink>
      <NavLink href="/history" onNavigate={onNavigate}>
        {t.nav.history}
      </NavLink>
      <GroupLabel>{t.nav.calculators}</GroupLabel>
      {calculators.map((calculator) => (
        <NavLink key={calculator.id} href={calculator.href} onNavigate={onNavigate}>
          {t.calculators[calculator.id].title}
        </NavLink>
      ))}
      <GroupLabel>{t.nav.account}</GroupLabel>
      <NavLink href="/settings" onNavigate={onNavigate}>
        {t.nav.settings}
      </NavLink>
      <NavLink href="/" onNavigate={onNavigate}>
        {t.nav.about}
      </NavLink>
    </>
  );
}

/** Sidebar on large screens, a burger menu on phones and tablets. */
export function AppNav() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav aria-label={t.nav.main} className="hidden flex-col gap-1 lg:flex">
        <NavLinks />
      </nav>

      <div className="lg:hidden">
        <button
          type="button"
          aria-label={t.nav.menu}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex size-11 items-center justify-center rounded-md border border-axis text-ink hover:bg-accent-wash"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <path d="M4 4l12 12M16 4L4 16" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" />
            )}
          </svg>
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-20 bg-black/30"
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />
            <nav
              id="mobile-menu"
              aria-label={t.nav.main}
              className="absolute inset-x-0 top-full z-30 max-h-[calc(100vh-4.5rem)] overflow-y-auto border-b border-line bg-plane px-4 pb-4 shadow-lg"
            >
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
          </>
        )}
      </div>
    </>
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
