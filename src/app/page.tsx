import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitch } from "@/components/locale-provider";
import { calculators } from "@/lib/calculators/registry";
import { registrationAllowed } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/server";

const button =
  "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 text-sm font-semibold";

export default async function LandingPage() {
  if (await getCurrentUser()) redirect("/cockpit");
  const t = await getDictionary();
  const l = t.landing;
  const registrationOpen = registrationAllowed();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-8">
      <header className="flex items-center justify-between gap-4 py-4">
        <p className="text-lg font-semibold">{t.appName}</p>
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Link
            href="/login"
            className="hidden min-h-11 items-center rounded-md border border-axis px-4 text-sm hover:bg-accent-wash sm:inline-flex"
          >
            {l.login}
          </Link>
        </div>
      </header>

      <main>
        <section className="py-10 sm:py-16">
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            {l.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">
            {l.intro}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/login" className={`${button} bg-accent text-on-accent`}>
              {l.login}
            </Link>
            {registrationOpen ? (
              <Link
                href="/register"
                className={`${button} border border-axis hover:bg-accent-wash`}
              >
                {l.register}
              </Link>
            ) : (
              <p className="text-sm text-ink-2">{l.invitationOnly}</p>
            )}
          </div>
        </section>

        <section aria-labelledby="features" className="py-8">
          <h2 id="features" className="mb-5 text-xl font-semibold">
            {l.featuresHeading}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[l.features.plan, l.features.history, l.features.profiles].map(
              (feature) => (
                <article
                  key={feature.title}
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {feature.text}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        <section aria-labelledby="calculators" className="py-8">
          <h2 id="calculators" className="mb-5 text-xl font-semibold">
            {l.calculatorsHeading}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {calculators.map((calculator) => {
              const texts = t.calculators[calculator.id];
              return (
                <li
                  key={calculator.id}
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <h3 className="font-semibold">{texts.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">
                    {texts.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="steps" className="py-8">
          <h2 id="steps" className="mb-5 text-xl font-semibold">
            {l.stepsHeading}
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {l.steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-wash text-sm font-semibold text-accent"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="notice"
          className="mt-8 rounded-xl border border-line bg-surface p-5"
        >
          <h2 id="notice" className="mb-3 text-lg font-semibold">
            {l.noticeHeading}
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            {l.notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
