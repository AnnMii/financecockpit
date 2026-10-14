# Finanzcockpit

Personal finance cockpit: several calculators that share values such as age,
savings rate and expected return, and a cockpit that brings their results
together. All values live in profiles and are stored per user account.

The interface is German by default and also available in English. Its texts
are quoted in German in this documentation, with an English hint where it
helps.

| Area | Page |
| --- | --- |
| Cockpit | `/` |
| Overall plan (Gesamtplan) | `/plan` |
| History (Verlauf, recorded balances) | `/history` |
| Pension gap (Rentenlücke) | `/calculators/pension-gap` |
| Altersvorsorgedepot | `/calculators/av-depot` |
| Savings calculator (Sparrechner) | `/calculators/savings` |
| Withdrawal plan (Entnahmeplan) | `/calculators/withdrawal-plan` |
| Global values (Globale Werte) | `/settings` |

## Getting started

```bash
git submodule update --init   # the Finanzfluss original for the comparison tests
npm install
npm run dev
```

Then open <http://localhost:3000> and create an account. The database
(`data/financecockpit.db`, SQLite) is created automatically on the first start.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build, then `npm start` |
| `npm test` | Tests of the calculation logic |
| `npm run typecheck` | Check TypeScript |
| `npm run lint` | ESLint |
| `npm run db:generate` | Migration after a change to the database schema |
| `npm run upstream:diff` | Changes of the Finanzfluss original since the adopted state |
| `npm run upstream:check-api` | Checks whether the Finanzfluss page still gives the same results for the pension gap and the withdrawal plan |

## Structure

```
src/
  app/
    (auth)/            sign in, register
    (app)/             everything behind the login: cockpit, calculators, global values
    actions/           server actions (login, saving settings)
  components/          interface; settings-provider.tsx holds the settings
  db/                  database schema and connection (Drizzle + libSQL)
  lib/
    auth/              password hashing (scrypt), sessions
    calculators/       calculation logic without UI, with tests
    settings/          fields, value ranges and defaults of the settings
    i18n/              dictionaries (German, English) and language choice
    plan/              overall plan: simulation, guardrails, history
drizzle/               SQL migrations (applied on start); besides schema changes
                       also hand-written ones for stored values, e.g. 0004
test/upstream/         comparison tests against the Finanzfluss original
test/fixtures/         recorded results of the Finanzfluss page
vendor/                the Finanzfluss original as a Git submodule (tests only)
scripts/               helper scripts
```

### Global and calculator-specific values

Values live in scopes: `shared` holds the **global values** that several
calculators use; each calculator also has a scope of its own for what only it
needs. Fields, value ranges and defaults are in `src/lib/settings/schema.ts`,
the labels in the dictionaries (`src/lib/i18n/`).

The stored keys of the settings (e.g. `taxableIncomeSavingsPhase`, `exemptionOrder`) are
part of the stored profiles and plan versions; they are not renamed without a
migration.

| Global value | AV-Depot | Pension gap | Savings calculator | Withdrawal plan |
| --- | --- | --- | --- | --- |
| Age, retirement age | ✓ | ✓ | ✓ duration (can be switched off) | |
| Available to invest per month (budget) | hint under the rate | | hint under the rate | |
| Expected return | ✓ | ✓ until retirement | ✓ interest rate | |
| Return in retirement | ✓ | ✓ | | ✓ interest rate |
| Payout until age | ✓ (at least 85) | ✓ | | |
| Existing capital | | ✓ | ✓ starting capital | |
| Inflation | | ✓ | ✓ (optional) | ✓ (optional) |
| Capital gains tax | | ✓ | ✓ | |
| Income, tax-free allowance, children | ✓ | | | |

The overall plan uses all global values except the switch "Inflation
berücksichtigen" (account for inflation): it always works in today's purchasing
power. The switch only affects the pension gap calculator; the savings
calculator and the withdrawal plan have a switch of their own and show the
global inflation rate for it, the Altersvorsorgedepot is always nominal.

Every field has an "i" next to its label with a short explanation (texts
under `fieldInfo` in the dictionaries). At "Auszahlung bis Alter" (payout
until age) it shows the distribution of the age at death in Germany on the
page "Globale Werte" (`src/lib/data/life-table.ts`, life table 2023/2025 of
the Federal Statistical Office; to be replaced by hand for a new life table).

### Profiles

Every scope has a list of named profiles of its own; one per scope is active.
That way the global profile "Basis" can be combined with the AV-Depot profile
"Mit Einmalauszahlung" (with one-time payout), for example. The choice applies
everywhere: in the cockpit, in the calculators and on the page "Globale Werte".

- **Global values, calculators and overall plan:** changes first apply only
  locally in the view (`DraftSettings` in `src/components/draft-settings.tsx`).
  "Zurücksetzen" (reset) or a reload brings the saved values back. "Speichern"
  (save) in the panel at the bottom right writes calculator values into the
  active profile of the calculator and names the profiles it writes into. For
  changed global values the panel asks which global profile they go into: the
  active one (default), another one or a new one. The chosen profile then
  becomes the active one.
- **Managing global profiles:** renaming and deleting are only possible on the
  page "Globale Werte". In the calculators the active global profile can be
  seen and switched; a new one only comes into being there through the save
  panel.
- **Profiles of a calculator:** "Neu …" (new) in the calculator creates a
  profile with the values currently shown, including unsaved changes.
- Switching a profile discards the local changes of the scope concerned. The
  last profile of a scope cannot be deleted.

### Cockpit

For the chosen combination of profiles the start page shows the overall plan
(status, corridor) at the top and below it the key figures and the chart of
each calculator (the same chart components as on the calculator pages,
`src/components/charts/calculator-charts.tsx`).

**Several tabs:** when you save a profile or record a balance, the other open
tabs of the app fetch the saved data anew (`src/components/tab-sync.ts`,
`BroadcastChannel`); a tab also fetches it when it becomes visible again or
gets the focus, which also covers changes from another browser or device. That
way a calculator can be edited in one tab while the cockpit is watched in the
other. Unsaved local changes of a tab stay untouched.

### Overall plan and history

The overall plan (`/plan`, calculation core in `src/lib/plan/`) answers "am I
saving enough?" over three pots: Altersvorsorgedepot, ETF depot, savings
account (Tagesgeld). All amounts are in today's purchasing power.

- **Corridor:** 2,000 random courses of the return (fixed seed, hence
  reproducible) give the range of the middle 80 % and the middle course.
- **Confidence level and guardrails:** adjustable (default 85 %, 75 %, 95 %).
  When the probability of reaching the desired pension is below the lower
  guardrail, the status is "Mehr sparen" (save more) with an amount; above the
  upper one "Spielraum" (room to spare); in between "Im Plan" (on plan).
- **Required savings rate:** the total savings rate that reaches the confidence
  level, with the same split over the pots. Whoever enters it as the savings
  rate lands exactly at the confidence level.
- **Budget and savings rates:** the global "Zum Investieren verfügbar pro
  Monat" (available to invest per month) is the budget. The savings rates are
  local: the Altersvorsorgedepot (default 150 €, the subsidy limit; at most
  1,140 €) and the savings calculator (the ETF depot) have their rate in their
  own profile, the savings account in the plan. The plan adds them up and shows
  whether they exceed or fall short of the budget and whether the budget is
  enough for the required savings rate. Next to each rate the button "Rest"
  enters the amount that is still free (`src/lib/calculators/budget.ts`).
  Below 10 € in the AV-Depot the plan calculates without it and puts the money
  into the ETF depot.
- **Payout:** the card "Rente aus allen Quellen" (pension from all sources; plan
  page and cockpit) breaks the middle course down into wealth at retirement and
  pension per month: state pension, AV-Depot, withdrawal from the free assets
  (ETF depot and savings account) after taxes. Whether the free assets are used
  up or only their returns are withdrawn is set in the profile of the
  withdrawal plan (`capitalConsumption`), which the plan reads along. Taxes on
  the returns are the estimated tax deduction of the pension gap profile.
- **Where the values come from:** pension entitlements and the desired pension
  are on the plan page but belong to the active profile of the pension gap
  calculator and apply there too. The details of the AV-Depot come from its
  profile.
- **Today's balance:** the latest recorded balance from the history. As long as
  none is recorded, the "Vorhandenes Kapital" (existing capital) of the global
  values counts as the balance of the ETF depot.

Tracking over time (`/history`):

1. **Freeze the plan** (on the plan page): freezes assumptions and corridor at
   the reference date. The plan version never changes again.
2. **Record a balance** (yearly): value per pot, deposits since the last
   balance, optionally the actual inflation.
3. **Comparison:** balances appear as points in the frozen corridor. The
   deviation is broken down into deposits and market; the effect of changed
   assumptions on the required savings rate is shown separately next to it.
4. **History of the required savings rate:** stored per reference date and
   shown as a chart.

Important: the age in the global values has to be carried on every year; the
plan calculates from the age entered there. Plan versions and recorded
balances are in the table `plan_records`.

The limits of the model are on the plan page under "Annahmen" (assumptions) and
in the header comment of `src/lib/plan/plan.ts`.

### Withdrawal plan and overall plan

The withdrawal plan stays a calculator of its own and by default calculates
like Finanzfluss: nominal, without taxes. Two switches make it calculate like
the overall plan: "Steuern auf die Erträge berücksichtigen" (account for tax on
the returns; the estimated tax deduction of the pension gap profile) and
"Inflation berücksichtigen (heutige Kaufkraft)" (account for inflation; the
inflation rate of the global values). The interest rate is then (return −
inflation) × (1 − tax deduction), in the same order as in the overall plan.

The small button "Aus Gesamtplan" (from the overall plan) next to the
portfolio copies the free assets at retirement (middle course, in today's
purchasing power) and the payout period once and switches both switches on;
afterwards the calculator is independent again. The monthly pension then
hardly deviates from the overall plan (0.03 % in the example; a test allows at
most 3 % for returns from 2 to 6 %) because the conventions differ slightly:
the overall plan pays at the start of the month with the yearly rate ÷ 12, the
withdrawal plan at the end of the interval with the equivalent monthly rate.

Conversely the card "Rente aus allen Quellen" can show the amounts in future
euros ("Beträge in künftigen Euro anzeigen") to put them next to the nominal
results of the AV-Depot calculator and the savings calculator. The calculation
itself stays in today's purchasing power. The cockpit cards state in one line
whether they calculate nominally or in today's purchasing power.

### Savings calculator

The duration follows the global values by default (retirement age minus age);
the switch "Laufzeit bis Renteneintritt" (duration until retirement) releases
it. When the desired final capital is already reached without the searched
figure (e.g. starting capital searched, but savings rate and interest alone
exceed the goal), the result is 0 with a note on what is reached anyway.

Costs per year reduce the interest rate; they also reduce the return of the ETF
depot in the overall plan. With "Inflation berücksichtigen" (account for
inflation) the inflation rate is deducted from the interest rate, the deposits
stay the same in today's purchasing power and the tax is calculated on the real
interest (a simplification); the searched interest rate is named nominally.

Advanced inputs (the intervals, costs, inflation, taxes) are hidden behind a
switch, as in the AV-Depot calculator and the overall plan; an error shows them
anyway.

### Languages

The interface exists in German and English; it is switched at the top right
(DE/EN), also on the sign-in page. The choice is kept in a cookie, so it
applies per browser and survives signing out and reloading.

- **Texts:** `src/lib/i18n/de.ts` is the template, `en.ts` has the same
  structure. When a text is missing there, the type check reports it. Texts
  with numbers or names are functions.
- **Numbers:** `src/lib/format.ts` writes and reads numbers per language
  (228.547 € and 0,5 in German, €228,547 and 0.5 in English). The currency is
  always euro.
- **Error messages:** calculators, sign-in and profile management return codes
  (e.g. `avPayoutMin85`); the texts for them are in the dictionaries.
- **In components:** `useLocale()` returns `t` (texts) and `f` (formats); in
  server components use `getDictionary()` from `src/lib/i18n/server.ts`.
- **Not translated:** German technical terms without an English counterpart
  (Altersvorsorgedepot, Riester, Rürup). Source code and documentation are in
  English; only the German dictionary `de.ts` is German.

Another language: add the code in `src/lib/i18n/locale.ts`, create a
dictionary following the pattern of `en.ts` and register it in `index.ts`, add
the number format in `format.ts`.

### Adding a calculator

1. Write the calculation logic as a pure function in `src/lib/calculators/` and
   test it.
2. Add the scope and fields in `src/lib/settings/schema.ts`, the labels and all
   other texts in both dictionaries (`src/lib/i18n/de.ts`, `en.ts`). What
   another calculator already uses belongs in `shared`.
3. Register the calculator and the mapping of the values onto its inputs in
   `src/lib/calculators/registry.ts`, plus a hook in
   `src/components/use-calculators.ts`.
4. Create the page under `src/app/(app)/calculators/<name>/page.tsx`;
   `CalculatorShell` provides the profile pickers, the form column and the panel
   for local changes.
5. Add a card to the cockpit (`src/components/dashboard.tsx`).

## Origin of the calculation logic

| Calculator | Source | Safeguard |
| --- | --- | --- |
| Altersvorsorgedepot | source code in the submodule | comparison test against the original |
| Savings calculator | source code in the submodule | comparison test against the original |
| Pension gap | not public; the Finanzfluss page calculates on its server | formulas derived from recorded results |
| Withdrawal plan | not public; like the pension gap | formulas derived from recorded results |

### Pension gap and withdrawal plan

There is no source code to compare with for these two. The formulas are derived
from the answers of the Finanzfluss page; the answers are in `test/fixtures/` as
expected values and are checked by `npm test`.

```bash
npm run upstream:check-api              # does the page still give the same results?
npm run upstream:check-api -- --record  # take the current results as the expected values
```

When the check reports deviations, Finanzfluss has changed the calculation:
adapt the formulas in `pension-gap.ts` or `withdrawal-plan.ts`, then record
again with `--record`. New test cases go into the fixture file as an entry with
`name` and `params` and are likewise filled with `--record`.

Deviation from the original: in the withdrawal plan the chart of the Finanzfluss
page shows a slightly falling capital without using the capital up (an
approximation of the interest within the year). Here it stays constant; only
the result figures are compared.

### Altersvorsorgedepot and savings calculator

The calculation logic (`src/lib/calculators/av-depot.ts`, `income-tax.ts`,
`savings.ts`) is an own implementation that follows the
[Finanzfluss calculator](https://www.finanzfluss.de/rechner/altersvorsorgedepot/)
and its source code ([finanzfluss/calculators](https://github.com/finanzfluss/calculators)).
It is our own because the original only returns formatted text and does not
output the breakdown into allowances, tax savings and growth that the chart and
the key figures need.

#### Syncing with the Finanzfluss original

So that corrections to the original do not go missing here unnoticed, its
repository is included as a Git submodule under `vendor/finanzfluss-calculators`.
The app imports nothing from it; it only serves as a reference:

- **Adopted state:** the commit the submodule points to is the state our own
  logic corresponds to. It is part of the Git history of this repository
  (`git submodule status` shows it).
- **Comparison tests:** `test/upstream/av-depot.parity.test.ts` and
  `savings.parity.test.ts` calculate the same inputs with the original and with
  our own implementation and compare the results. They run with `npm test`. When
  the submodule is not checked out, they are skipped.

After a fresh clone fetch the submodule once:

```bash
git submodule update --init
```

**Adopting changes of the original:**

1. See what has changed in the calculator files:

   ```bash
   npm run upstream:diff
   ```

   When the script reports no changes, there is nothing to do.

2. Set the submodule to the new state:

   ```bash
   git -C vendor/finanzfluss-calculators checkout origin/main
   ```

3. Run `npm test`. The comparison test fails where our implementation deviates
   from the original and names the input, our value and the original value.

4. Adapt `av-depot.ts`, `income-tax.ts` or `savings.ts` until all tests are
   green. A new income tax tariff is added in `income-tax.ts` as one more entry.

5. Commit the submodule state and the adaptations together:

   ```bash
   git add vendor/finanzfluss-calculators src
   git commit
   ```

The fixed expected values in `src/lib/calculators/av-depot.test.ts` also come
from the original; when results change there, they are adapted in the same step.

The yearly values of the savings calculator chart are our own and not part of
the original, which only gives the end result; the parity test ties the last
chart column to the end value of the original.

**License:** the original is under AGPL-3.0. It is not shipped here, but our own
implementation follows it closely. For private use that does not matter. When
the app is hosted for other users, the source code of this project should be
published under the AGPL.

## Hosting

The full checklist is in [HOSTING.md](HOSTING.md). In short, the app is a normal
Next.js application with a Node server.

- **Own server / Docker (recommended):** `docker compose up -d` starts the app
  behind Caddy, which handles HTTPS (set `DOMAIN` in `.env`). The database
  lives in the volume `app-data`; back it up (see HOSTING.md).
- **Without Docker:** `npm run build && npm start`. The directory `data/` has to
  be kept and backed up.
- **Serverless (e.g. Vercel):** there is no persistent file system there. Set
  `DATABASE_URL` to a hosted libSQL database (Turso), plus `DATABASE_AUTH_TOKEN`.
  The code does not change. Not recommended before feature 1 (encryption in the
  browser), because the data is stored in plain text.

Built in for operation: sign-in and registration are rate limited, security
headers (CSP, HSTS, ...) are set, `/api/health` serves monitoring, and
`node scripts/account.mjs list | export <email> | delete <email>` handles
accounts.

Before hosting:

- Operate it over HTTPS only (the session cookie is `Secure` in production mode).
- Set `ALLOW_REGISTRATION=false` once all accounts exist.
- There is no "forgot password" yet (planned with feature 1); add it before a
  public operation.

Environment variables: see `.env.example`.
