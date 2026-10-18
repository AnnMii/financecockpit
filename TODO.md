# TODO – Items to review

Decisions and simplifications from building the profiles, the three new
calculators and the cockpit (as of 2026-10-11). Each item describes what
applies, an example you can recompute and the question you should decide.

The example numbers are for a fresh account with the default values (profile
"Standard" everywhere). With your own values they differ. UI labels are quoted
in German as they appear in the app.

---

## 1. Results differ from the Finanzfluss examples

- [ ] **Checked and fine with me**

**What applies:** The calculators use the global values. Their defaults are not
the defaults of the individual Finanzfluss pages, so the same calculator shows
different numbers here than there.

| Global value | Here | Finanzfluss pension gap | Finanzfluss withdrawal plan | Finanzfluss savings calculator |
| --- | --- | --- | --- | --- |
| Age | 35 | 30 | – | – |
| Payout until age | 85 | 100 | – | – |
| Expected return | 6 % | 5 % | – | 1.5 % |
| Return in retirement | 3 % | 3 % | 5 % | – |
| Existing capital | €0 | €0 | – | €5,000 |

**Example pension gap** (`/calculators/pension-gap`):

| | Capital with consumption | Savings rate | Capital without consumption | Savings rate |
| --- | --- | --- | --- | --- |
| Default values here | €200,002 | €237.50 | €542,659 | €644.39 |
| Age 30, payout until 100, return until retirement 5 % | €309,185 | €327.51 | €542,659 | €574.81 |

The second row is the result of the Finanzfluss page. The pension gap itself is
€1,153 per month in both cases.

**Example withdrawal plan** (`/calculators/withdrawal-plan`): €100,000, 10 years,
monthly → here €963.74 per month (3 %), at Finanzfluss €1,055.24 (5 %).

**Example savings calculator** (`/calculators/savings`): €150 per month until
retirement (32 years) → €174,520 final capital. With a free duration of 7 years
(switch "Laufzeit bis Renteneintritt" off) it is €15,689 (€0 starting capital,
6 %), with the Finanzfluss values (€5,000, 1.5 %) €18,846.

**How to check:** Enter the values of the second table row in the calculator
(applies locally only), compare with the Finanzfluss page, then press
"Zurücksetzen".

**To decide:** Should the defaults of the global values be different, e.g.
"Auszahlung bis Alter" 90 instead of 85? Change it in
`src/lib/settings/schema.ts`; this only affects newly created profiles.

---

## 2. "Auszahlung bis Alter" is a shared value for two calculators

- [ ] **Checked and fine with me**

**What applies:** The AV-Depot calculator ("Auszahlung bis") and the pension gap
calculator ("Lebenserwartung" at Finanzfluss) share this value. The AV-Depot
calculator requires at least 85.

**Example:** If you set "Auszahlung bis Alter" to 80 in the pension gap
calculator and save, the AV-Depot calculator shows the message "Im
Altersvorsorgedepot muss die Auszahlung mindestens bis zum Alter 85 laufen"
instead of results, and the cockpit lacks the AV-Depot pension in the overall
picture.

**To decide:** Is one shared value right, or do you need two separate ones
(payout plan of the AV-Depot and life expectancy for the pension gap)?

---

## 3. Budget global, savings rates local

- [ ] **Checked and fine with me**

**What applies:** Only "Zum Investieren verfügbar pro Monat" is global (default
€300). Each calculator has its own savings rate: Altersvorsorgedepot €150 (the
subsidy limit), savings calculator €150 (your ETF depot), savings account in the
overall plan €0. Together they make up the €300 budget. Below each rate it says
how much of the budget is planned and how much is free; the button "Rest" enters
the free amount.

**Example:** Budget €500, AV-Depot €150, savings calculator €150 → "Verfügbar
500 €, verplant 300 €. Noch frei: 200 €." One click on "Rest" at the savings
calculator makes it €350. With the saving interval "jährlich" the savings
calculator pays in twelve times the amount once a year; when it searches for the
savings rate, it shows it per interval.

**Stored:** The former global "Sparrate pro Monat" no longer exists. Existing
profiles start with the defaults; enter budget and rates once anew.

**To decide:** Is €150 into the AV-Depot (only the subsidised part) the right
default? More is possible up to €1,140, but unsubsidised.

---

## 4. All savings rates together against the budget

- [ ] **Checked and fine with me**

**What applies:** The overall plan adds up the rates of the Altersvorsorgedepot,
the savings calculator and the savings account and compares them with the
budget. The cockpit shows the same line in the plan card. That way the same money
is not counted twice. The cards in the cockpit still calculate each with its own
rate.

**Example:** Budget €500, rates 150 + 350 + 0 → "Das Budget ist genau verplant."
With €20 in the savings account: "520 € verplant, 20 € mehr verplant als
verfügbar." If the budget does not suffice for the required savings rate, it
says e.g. "Dein Budget von 500 € reicht nicht für die nötige Sparrate: Es fehlen
199 €."

**To decide:** Should too much planned money only warn (as now) or slow the
calculation down?

---

## 5. The capital gains tax is global

- [ ] **Checked and fine with me**

**What applies:** Pension gap and savings calculator use the same value (default
26.375 %). This was not explicitly agreed, but it follows the rule "what several
calculators use is global".

**Example:** In the savings calculator switch "Steuern mitberechnen" on, change
the capital gains tax to 27.82 % (with church tax) and save in the profile → in
the pension gap calculator under "Sparphase" it says 27.82 % as well, and its
savings rates rise slightly.

**To decide:** Is that fine, or should the value be separate per calculator?

---

## 6. Simplifications in the cockpit's "Ruhestand" overall picture

- [x] **Done:** This overall picture is gone. The overall plan replaces it and
      calculates throughout in today's purchasing power. The rest of this item
      describes the old state.

**What applied:** Remaining gap = pension gap − net pension from the AV-Depot.

**Example:** Pension gap €1,153 − AV-Depot €989 = €164 remaining gap per month.
Required capital and additional savings rate for these €164 were shown next to
it.

Four simplifications were in there:

1. **Duration:** The AV-Depot pension runs only until "Auszahlung bis Alter".
   Since the pension gap calculator uses the same value, both fit together – whoever
   lives longer has the full gap of €1,153 afterwards.
2. **Additional savings rate:** It came on top of the €150 that flow into the
   AV-Depot in the calculation. The card said so in its hint text.
3. **Existing capital:** It was fully credited against the remaining gap. With
   €12,345 existing capital the cockpit showed e.g. €28,519 required capital but
   €0.00 additional savings rate, because the capital grows that far by itself
   until retirement.
4. **Nominal:** The AV-Depot pension is an amount in euros of the retirement
   year, the desired pension is entered in today's euros. The switch "Inflation
   berücksichtigen" only affected the pension gap calculator, not the AV-Depot
   calculator.

**To decide (then):** Is the overall picture meaningful enough like this? Point 4
was the biggest inaccuracy: €989 in 32 years is worth less than €989 today. One
solution would have been to convert the AV-Depot pension to today's purchasing
power when inflation is switched on.

---

## 7. Pension gap and withdrawal plan cannot be compared automatically

- [ ] **Regular appointment set up for it**

**What applies:** For these two calculators Finanzfluss does not publish source
code. The formulas are derived from 35 recorded results of the Finanzfluss page
(`test/fixtures/`). If Finanzfluss changes the calculation, `npm test` does not
notice.

**How to check:**

```bash
npm run upstream:check-api    # pension gap and withdrawal plan
npm run upstream:diff         # AV-Depot and savings calculator
```

Expected output without changes: "The server still gives the answers stored in
the fixtures." and "No changes in the calculator files." respectively.

**To decide:** How often do you want to run this (e.g. quarterly and at the turn
of the year, when tax values change)? Automatically it would only work with a
scheduled job once the repository is on GitHub.

---

## 8. The savings calculator calculates differently from the original, with the same result

- [ ] **Noted**

**What applies:** The original has its own formula for each searched figure.
Here only the final capital is a formula; starting capital, interest rate,
duration and savings rate are determined by search. The comparison test confirms
identical results.

**Example of a deviation:** For some inputs the interest rate search of the
original aborts with an error ("Newton's method failed to converge"). The
calculator here returns a result there. The comparison test skips these cases and
allows at most 20 of them in 300 comparisons.

**Goal already exceeded:** If the goal is already reached without the searched
figure being needed (e.g. €5,000 starting capital, €150 per month, 7 years, goal
€10,000, interest rate searched), the result is 0 with a note on what is reached
anyway (here €17,600). Only the **starting capital** goes negative instead, as
at Finanzfluss (e.g. −€2,965.08 for €150 per month, 7 years, 1.5 %, goal
€10,000): the amount that brings the end value down to the goal. The parity test
covers this case; with accumulating tax the original gives up there, ours still
returns a value.

---

## 9. The withdrawal plan chart deviates from the original on purpose

- [ ] **Noted**

**What applies:** Without capital consumption the chart of the Finanzfluss page
shows a slightly falling capital (€100,000 → €99,987.59 after 10 years), because
it only approximates the interest within the year. Here the capital stays at
exactly €100,000. The result figures (withdrawal amount, period, capital) are
identical to Finanzfluss.

---

## 10. Sliders only where they seemed useful

- [ ] **Checked and fine with me**

**What applies:**

| Calculator | Sliders |
| --- | --- |
| Altersvorsorgedepot | all sliders as at Finanzfluss: age, retirement age, both incomes, savings rate (monthly instead of yearly), return, costs, saver's allowance, base interest rate, one-time payout, payout until, return in retirement; the advanced inputs are collapsed |
| Pension gap | age, statutory pension (0–4,000 €), desired pension (0–6,000 €) |
| Savings calculator | none |
| Withdrawal plan | none |

The Finanzfluss pages have no sliders at all for the last three calculators; the
three in the pension gap calculator are my addition.

**To decide:** Should more fields get sliders (e.g. duration and interest rate in
the savings calculator, withdrawal amount in the withdrawal plan)?

---

## 11. Open from earlier steps

- [ ] **Dark colour scheme** is set up but never looked at in the browser.
- [ ] **Profile picker in the cockpit** only allows switching; creating, renaming
      and deleting only work in the calculators and under "Globale Werte".
- [ ] **Before public operation:** "forgot password" is missing (sign-in rate
      limiting is done); set `ALLOW_REGISTRATION=false`.
- [ ] **License:** When hosting for other users, publish the source code under
      the AGPL (see README, section "Syncing with the Finanzfluss original").
- [ ] **Backup** `data/financecockpit.backup-2026-10-11.db`: delete it once
      everything is right after the restart.

---

## 12. Overall plan: assumptions and defaults to review

- [ ] **Checked and fine with me**

**What applies:** The overall plan was implemented with defaults you did not
confirm one by one (list in `PLANNED_FEATURES.md`, feature 2, "As implemented").

**Example** (age 35, desired pension €2,200, €150 into the AV-Depot, nothing
else, existing capital €0): The plan shows about 5 % probability and a required
savings rate of €813. The pension gap calculator shows €237.50 for the same
values without inflation. The difference comes from three things: the plan
deducts 2 % inflation, demands 85 % confidence instead of the expected course and
calculates the AV-Depot pension in today's purchasing power.

**How to check:** On `/plan` enter the required savings rate as the savings rate
of the Altersvorsorgedepot (up to €1,140): the probability lands at the
confidence level (85 %), the status becomes "Im Plan". To compare with the
pension gap calculator, set the AV-Depot rate to 0 and the savings calculator's
rate to the required savings rate, set the confidence level to 50 % and the
volatility to 0 (guardrails e.g. 1 % and 99 %) and switch "Inflation
berücksichtigen" on there: both then name the same savings rate.

**To decide:**

- Do 85 % / 75 % / 95 % and 15 % volatility suit you?
- Is the €2,200 desired pension meant in **today's** euros? The plan reads it so.
- Are three fixed pots enough?
- The required savings rate keeps the ratio of your rates. If it is €150 into the
  AV-Depot and €150 into the ETF depot, it rises by half each, the AV-Depot up to
  its maximum of €1,140. Is that the split you want?

## 13. Overall plan: carrying the age forward every year

- [ ] **Noted**

**What applies:** The plan calculates from the age in the global values. The app
does not count it up itself.

**Example:** If you freeze in 2026 with age 35 and record a balance in 2027
without changing the age to 36, the new forecast calculates with one year too
many until retirement and looks too favourable. The point in the frozen corridor
is still right, because it is calculated from the reference dates.

**To decide:** Should the year of birth be stored instead of the age, so that the
age is automatically right? That would affect all calculators.

## 14. Overall plan: purchasing power in the comparison

- [ ] **Noted**

**What applies:** The frozen corridor is in the purchasing power of its reference
date, the current forecast in today's purchasing power. Recorded balances are
converted to the purchasing power of the frozen plan with the entered inflation
(otherwise the plan's assumption).

**Example:** Balance €12,320 one year after freezing, without entered inflation:
the comparison shows €12,320 / 1.02 = €12,078.

**Consequence:** In the chart the frozen corridor and the current forecast do not
lie on top of each other in exactly the same purchasing power; over a few years
the difference is small, over a long time it grows.

---

## 15. Review of 2026-10-11: changed behaviour to check

- [ ] **Checked and fine with me**

**Stored values changed:** Savings calculator profiles that still had the old
defaults (final capital €20,000, duration 7 years) and did not explicitly release
the duration are at €250,000 and 30 years after the next start (migration
`drizzle/0004_savings_defaults.sql`). Your own values stay.

**Existing capital in the overall plan:** As long as no balance is recorded, the
plan starts with the "Vorhandenes Kapital" of the global values in the ETF depot,
before that with €0.

**Example:** €50,000 existing capital raise the wealth at retirement in the
middle course from about €99,000 to about €192,000 (default values).

**To decide:** As soon as you record a balance, only that counts. Savings
calculator and pension gap continue to calculate with the "Vorhandenes Kapital";
you have to keep both figures equal yourself. Should the "Vorhandenes Kapital"
automatically be set to the sum of a balance when you record it?

---

## 16. Several savings calculators instead of the savings account

- [ ] **Decide whether and how this gets built** (not implemented yet)

**Idea:** Today the overall plan has three fixed pots: Altersvorsorgedepot, ETF
depot (savings calculator) and savings account. Instead of the savings account
there should be any number of investments (ETF, gold, bitcoin, bonds, savings
account, …), each with its own savings rate, return, volatility and costs. The
plan takes all of them into account and compares the sum of the rates with the
budget.

**What it would take:**

- **Return and volatility per investment:** Today the savings calculator uses the
  global "Erwartete Rendite" and the plan two fixed volatilities (depot, savings
  account).
- **Correlation:** The courses of the investments are not independent. The plan
  would need an assumption for this, otherwise the corridor becomes too narrow or
  too wide.
- **Recorded balances and frozen plans:** They store exactly three pots today and
  would have to become dynamic; old entries must stay readable.
- **Profiles:** Only one profile per calculator is active. Several savings
  calculators means either several active profiles ("include" per profile) or a
  list of investments of its own in the plan (name, savings rate, return,
  volatility, costs, starting amount). The savings calculator would remain the
  tool for playing through one investment.

**Effort:** large, about three to four rounds including migration of the stored
data.

**To decide beforehand:**

- Is a flat assumption for the correlation enough (all risky investments run
  largely together), or should it be adjustable per pair?
- Record balances per investment? Then old balances (AV, ETF, savings account)
  have to be mapped onto the new investments.
- Does the Altersvorsorgedepot stay a fixed pot, because it has subsidy and tax
  rules of its own?

**Small preparations that remained open:** Shorten "Sparrate ETF-Depot
(Sparrechner)" on the plan page to "Sparrate ETF-Depot"; make the budget "Zum
Investieren verfügbar pro Monat" editable in the AV-Depot and savings calculator
as well (there it is only a hint under the savings rate so far).
