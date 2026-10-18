import Image from "next/image";
import Link from "next/link";
import { LanguageSwitch } from "@/components/locale-provider";
import { calculators } from "@/lib/calculators/registry";
import { registrationAllowed } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/session";
import { getDictionary, getLocale } from "@/lib/i18n/server";

/** Pixel sizes of the screenshots in public/screenshots, per language. */
const SCREENSHOTS = [
  { key: "plan", file: "plan", size: { de: [644, 950], en: [644, 950] } },
  { key: "pensionGap", file: "pension-gap", size: { de: [644, 538], en: [644, 538] } },
  { key: "avDepot", file: "av-depot", size: { de: [644, 896], en: [644, 912] } },
] as const;

const button =
  "inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 text-sm font-semibold";

export default async function LandingPage() {
  const signedIn = (await getCurrentUser()) !== null;
  const t = await getDictionary();
  const locale = await getLocale();
  const l = t.landing;
  const registrationOpen = registrationAllowed();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-8">
      <header className="flex items-center justify-between gap-4 py-4">
        <p className="text-lg font-semibold">{t.appName}</p>
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Link
            href={signedIn ? "/cockpit" : "/login"}
            className="hidden min-h-11 items-center rounded-md border border-axis px-4 text-sm hover:bg-accent-wash sm:inline-flex"
          >
            {signedIn ? l.openCockpit : l.login}
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
            <Link
              href={signedIn ? "/cockpit" : "/login"}
              className={`${button} bg-accent text-on-accent`}
            >
              {signedIn ? l.openCockpit : l.login}
            </Link>
            {signedIn ? null : registrationOpen ? (
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

        <section aria-labelledby="why" className="py-8">
          <h2 id="why" className="mb-5 text-xl font-semibold">
            {l.whyHeading}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {l.why.map((reason) => (
              <li
                key={reason.title}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <h3 className="font-semibold">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  {reason.text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="screenshots" className="py-8">
          <h2 id="screenshots" className="mb-2 text-xl font-semibold">
            {l.screenshotsHeading}
          </h2>
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-ink-2">
            {l.screenshotsNote}
          </p>
          <div className="space-y-10">
            {SCREENSHOTS.map((shot) => {
              const texts = l.screenshots[shot.key];
              const [width, height] = shot.size[locale];
              return (
                <figure
                  key={shot.key}
                  className="grid items-start gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
                >
                  <figcaption className="md:pt-2">
                    <h3 className="text-lg font-semibold">{texts.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">
                      {texts.caption}
                    </p>
                  </figcaption>
                  <Image
                    src={`/screenshots/${shot.file}-${locale}.png`}
                    alt={texts.alt}
                    width={width}
                    height={height}
                    sizes="(min-width: 768px) 480px, 100vw"
                    unoptimized
                    className="h-auto w-full rounded-xl border border-line"
                  />
                </figure>
              );
            })}
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
