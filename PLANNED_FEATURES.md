# Planned features

Plans that are thought through and agreed, but **not yet implemented**. Open
review items for the existing state are in [TODO.md](TODO.md).

---

## 1. Encrypt profiles in the browser and add anonymous statistics

**Status:** planned, not started (as of 2026-10-11)

### Starting point

All entered values are stored as plain-text JSON in the table `profiles` and are
directly linked to the e-mail via the user ID:

| Table | Content | Protection today |
| --- | --- | --- |
| `users` | e-mail, password, creation date | password only as scrypt hash, e-mail in plain text |
| `sessions` | sign-ins | only a hash of the session token |
| `profiles` | profile name and all values as JSON, with user ID | **plain text** |

Whoever can read the database file (operator, host, attacker after a leak) sees
age, income, pension entitlements and the children's years of birth for every
e-mail.

### Goal

1. **Encryption in the browser:** The server stores profiles only encrypted and
   cannot read them. The password no longer leaves the browser.
2. **Anonymous statistics:** Separately, rounded records without a link to the
   account arise, so that what users enter stays analysable.
3. **Recovery key:** A forgotten password does not lead to data loss as long as
   the user has kept this key.

This works without loss of function, because all calculators and the cockpit
already calculate in the browser; the server never needs the values in plain
text.

### Decisions made

| Question | Decision | Rejected |
| --- | --- | --- |
| Protection model | encryption in the browser **plus** anonymous statistics | encryption only (no analysis possible); pseudonymisation (values stay readable, weaker protection) |
| Precision of the statistics | whole records with rounded values, so that correlations stay visible | frequencies per field (safer, but without correlations) |
| Forgotten password | recovery key, shown once at registration | data counts as lost |

### Limits that remain

- **The delivered code is the trust boundary.** The encryption protects against
  database leaks, a curious host and a look into the database. It does not
  protect against the operator deliberately delivering code that skims data.
- **Rounded records are not guaranteed anonymous.** With few users a rare
  combination can point to a person (e.g. age 40–44, two children, income
  €74,000). Rounding, missing timestamps and an analysis only above a minimum
  count reduce this, but do not remove it. This was knowingly accepted when
  deciding for whole records.
- **Remaining visible:** e-mail, creation date of the account, which calculators
  an account uses and how many profiles it has – not their names or contents.
- **Legal:** When hosting for others, a privacy policy and GDPR obligations come
  on top. That can be prepared technically, but has to be checked legally
  separately.

### Implementation

#### 1. Keys (all in the browser, WebCrypto)

New module `src/lib/crypto/`, without DOM dependency and thus testable in
Vitest:

- From the password and a salt per account, PBKDF2 (SHA-256, 600,000 rounds)
  produces a master key; from it HKDF derives two separate keys:
  - **Login key** – is sent to the server instead of the password and hashed
    there with scrypt as before (`src/lib/auth/password.ts` stays).
  - **Key-wrapping key** – wraps the data key.
- **Data key:** a random AES-256-GCM key per account. It encrypts content and
  names of every profile, with its own random value for each save. Profile ID and
  scope go in as bound additional data, so that profiles cannot be swapped.
- The server stores the data key only wrapped: once with the key-wrapping key,
  once with the recovery key.
- In the browser the data key sits as a **non-exportable** key in IndexedDB, so
  that a reload works without the password. Signing out deletes it.
- **Recovery key:** random, shown once at registration (groups of letters and
  digits), with a confirmation "written down".

#### 2. Sign-in

Affected: `src/app/actions/auth.ts`, `src/components/auth-form.tsx`.

- The forms compute the keys in the browser and call the server actions
  directly, instead of submitting the form with the password.
- A new action returns the salt for an e-mail; for unknown e-mails a stable fake
  salt, so that it cannot be seen whether an account exists. The secret for it
  lives in a small table `meta` and is generated on the first start.
- **Registration:** creates salt, hash of the login key and both wrapped data
  keys and shows the recovery key.
- **Sign-in:** checks the login key and returns the wrapped data key; the
  browser unwraps it.
- **Change password** (new, settings page): confirm the old password, wrap the
  data key anew. The profiles themselves stay unchanged.
- **Forgot password** (new page `/recovery`): e-mail, recovery key, new
  password. The proof runs over a value derived from the recovery key, whose hash
  the server knows; no e-mail sending is needed. Afterwards a new recovery key is
  issued.
- If the data key is missing in the browser despite a valid session (another
  device, browser data deleted), the user is signed out and has to sign in again.

#### 3. Saving and loading profiles

- `src/db/schema.ts` and migration: `users` gets salt, wrapped data keys, hash
  for the recovery and `stats_opt_in`. In `profiles`, `name` and `data` hold
  ciphertext from now on; the unique index on the name goes away, because the
  server can no longer compare names.
- `src/lib/settings/store.ts`, `src/app/actions/settings.ts`: treat content and
  names as opaque blocks and only check ownership, format, size (about 8 KB) and
  the maximum of 20 profiles per scope. `loadProfiles` no longer creates default
  profiles.
- `src/components/settings-provider.tsx`: decrypts in the browser after loading
  (a short loading state instead of server-rendered values), encrypts before
  every save and creates missing "Standard" profiles. The validation of the
  values stays `parseSettings` from `src/lib/settings/schema.ts`, now after
  decrypting. Name uniqueness is checked by `src/components/profile-picker.tsx`
  in the browser.
- Calculators, cockpit, draft mode and fields stay unchanged; they keep working
  with `useSettings()` and `useSettingsEditor()`.

#### 4. Migrating existing accounts

Existing accounts have plain-text profiles and a hash of the password itself. On
the next sign-in the salt query recognises the old format. The browser signs in
once the old way, generates the keys, encrypts all profiles, uploads them and
shows the recovery key. After that the old way is closed for the account.

Before the migration: make a backup of the database file and test the procedure
on a copy.

#### 5. Anonymous statistics

- New table `stats_entries`: random ID, month (`YYYY-MM`), scope, rounded
  values. **No** user or session ID, no exact time; created as `WITHOUT ROWID`,
  so that not even the order of the entries reveals anything about the time.
- `src/lib/settings/stats.ts` (with tests) rounds in the browser before anything
  is sent:

  | Kind of value | Rounding | Example |
  | --- | --- | --- |
  | Age | 5-year groups | 41 → 40–44 |
  | Money amounts | two leading digits | €73,500 → €74,000 |
  | Percentages | to 0.5 | 5.8 % → 6.0 % |
  | Children | only the number | years of birth 2015, 2019 → 2 |
  | Choice and switch fields | unchanged | "thesaurierend" |
  | Profile names | never sent | – |

- At most **one state per scope and month** is sent (marker in the browser),
  each time the active profile. Not every single change, so that frequent saving
  does not count more and no change sequences arise.
- **Voluntary:** checkbox at registration and in the settings, off by default.
  The server only accepts entries from signed-in accounts with consent (protection
  against abuse), but stores nothing about them.
- **Analysis:** `npm run stats` prints count and distributions per scope and
  shows combinations only from 5 identical entries. No admin interface.

#### 6. Documentation

- README: section "Privacy" (what is encrypted, what stays visible, limits,
  statistics, recovery) and a note in the section "Hosting".
- `TODO.md`: adapt the item "forgot password is missing" and add new review items
  (rounding rules, consent off by default, minimum count 5).

### Still to decide

- **Consent to statistics off by default:** Planned so, because it is the
  cautious choice when hosting for others. Consequence: only data from users who
  actively tick the box arrives.
- **Rounding rules and minimum count 5:** proposals, not agreed.
- **What exactly goes into the statistics:** planned is the active profile per
  scope. Alternatively only the global values.

### Verification after the implementation

- `npm test`: new tests for key derivation, encrypting and decrypting (including
  "wrong key fails" and "swapped profile fails"), the wrapping of the data key and
  the rounding rules. All existing tests stay green.
- Browser test against a throwaway database on another port:
  - Register, change values, create a profile. Then search the database file for
    known values and field names (e.g. `savingsRateMonthly` or the profile name):
    **none of them may appear**.
  - Recorded requests contain the password nowhere.
  - Reloading keeps the values; signing out and in again in a fresh browser
    profile too.
  - Change password: the old password no longer works, the new one opens the
    profiles.
  - Recovery with the key makes the profiles readable again; a wrong key is
    rejected.
  - Statistics: without consent no entry; with consent one entry per scope,
    rounded and without account link; a second save in the same month creates no
    further one.
  - All four calculators and the cockpit give the same numbers as before (e.g.
    AV-Depot €228,547).
- Migration on a copy of the real database: sign in with the previous password,
  profiles afterwards encrypted and still readable.
- `npm run typecheck`, `npm run lint`, `npm run build`.

### Estimated scope

The biggest rebuild since the start of the project: it touches sign-in,
registration, database schema, saving of profiles and the settings page, and
brings two new pages (recovery, change password) as well as an analysis script.
Sensible in three steps: first encryption and sign-in, then statistics, then
documentation.

---

## 2. Freeze the wealth plan and track it over time

**Status:** phases 1 to 3 implemented (2026-10-11), see README, section "Overall
plan and history". Phase 4 is open (CSV import, reminder by message). The text
below is the original plan; how the open decisions turned out is stated directly
under this.

### As implemented (deviations and defaults chosen)

- **Pots:** three fixed ones (Altersvorsorgedepot, ETF depot, savings account),
  not freely nameable. The savings rates come from the profiles of the
  Altersvorsorgedepot and the savings calculator and from the plan; the global
  budget is checked against them.
- **Pension entitlements and desired pension** stay in the profile of the pension
  gap calculator; the plan page shows and changes them there.
- **Return** stays entered nominally; the plan always deducts the inflation rate
  and only calculates in today's purchasing power. There is no nominal view.
- **Volatility:** default 15 % (depot) and 1 % (savings account), adjustable.
- **Profiles:** The overall plan has profiles like the calculators.
- **Encryption (feature 1)** did not come first; plan versions and recorded
  balances are stored in plain text in `plan_records`.
- **Required savings rate** is the total savings rate with the same split over
  the pots (initially it only changed the share of the ETF depot; that made it
  impossible to see room to spare at 100 % AV-Depot).
- **Today's balance** before the first recorded balance: the "Vorhandenes
  Kapital" of the global values, in the ETF depot.
- **The pension from the AV-Depot** is extrapolated in proportion to its capital
  instead of being taxed anew per course.
- **The former "Ruhestand im Gesamtbild"** in the cockpit is gone; it calculated
  nominally and contradicted the overall plan.
- **Reminder:** only a hint in the cockpit when the latest balance is older than
  one year.

### Concern

Set up a plan today (e.g. with 7 % for the MSCI World and a pension gap of 0),
freeze it and check in one or five years whether you are still on plan – also
after a stock market crash, strong rises, changed inflation or when the return
assumption does not materialise. Goal: under no circumstances invest too little,
but also not unnecessarily much.

### Critically examined: what holds up, what has to be corrected

The concern is the core of professional financial planning (frozen starting
plan, regular target-actual comparison). Three corrections are needed so that the
comparison does not lead to wrong decisions:

1. **The comparison "actual against old plan line" decides nothing.** With about
   15 % volatility per year, an equity depot almost never lies on the line after
   a year; ±15–20 % is noise. "Below plan → save more" after a crash and above all
   "above plan → save less" after a boom would be wrong conclusions. Only a
   corridor makes the comparison interpretable.
2. **Decisions are made by looking forward.** The key figure is the **required
   savings rate**: what would you have to save from today's balance to reach the
   goal, compared with what you actually save? It answers "not too little, not too
   much" directly. The frozen plan remains the yardstick and serves for root-cause
   analysis.
3. **"Under no circumstances too little" needs a confidence level.** A plan that
   reaches a pension gap of exactly 0 at 7 % only works out in about half of the
   possible courses. Hence: a target probability and **guardrails**. Below the
   lower one more is saved, above the upper one you may reduce, in between nothing
   changes – even when the depot fluctuates.

In addition:

- **Real instead of nominal.** 7 % for the MSCI World is nominal. With a desired
  pension in today's euros the inflation has to be deducted, otherwise the plan
  shows a gap of 0 where in real terms there is a large one.
- **One bad year does not refute the assumption.** Return assumptions are changed
  deliberately and separately, never automatically from the last year.
- **The wealth balance alone is not enough.** Without the deposits since the last
  reference date, the market cannot be separated from saving behaviour, and the
  two demand a different reaction.
- **Compare yearly.** More often mostly shows noise; the comparison becomes
  meaningful over several years.

### Decisions made

| Question | Decision | Rejected |
| --- | --- | --- |
| What is tracked? | A new, self-consistent **overall plan**; the calculators stay for playing through | Tracking the results of the individual calculators (the savings rate would stay counted twice, see `TODO.md` item 4) |
| Actual balance | **Per pot** (e.g. AV-Depot, ETF depot, savings account) | a single total value |
| Uncertainty | **Corridor from volatility** | three fixed scenarios; a single line |
| Confidence level | **Adjustable**, default 85 %, guardrails 75 % and 95 % | fixed 50 %, 85 % or 95 % |

### Procedure

1. **Overall plan.** Existing wealth per pot plus savings rate (counted once,
   split over the pots) → wealth at retirement → from it the monthly pension →
   pension gap.
2. **Corridor.** From expected return and volatility per pot, a simulation
   produces a range: pessimistic (10 %), expected (50 %), optimistic (90 %). The
   random number generator has a fixed seed, so that the same plan gives the same
   numbers.
3. **Freezing.** "Plan festschreiben" holds all assumptions, the results of the
   cockpit and the corridor at a reference date. This plan version never changes
   again, even when profiles are changed later.
4. **Yearly comparison.** You record the value of each pot and the deposits made
   since, optionally the actual inflation. The assumptions stay unchanged until
   you change them deliberately.
5. **Looking forward (decides).** From the actual balance it is recalculated:
   probability of reaching the goal and required savings rate for the set
   confidence level, compared with your actual savings rate. Both key figures are
   stored per reference date and shown as a history.
6. **Guardrails.** Status in three levels: "mehr sparen" (with amount), "im Plan
   – nichts ändern", "Spielraum" (with the amount by which you could reduce).
7. **Looking back (explained).** Actual balances as points in the frozen
   corridor. The deviation is broken down into market (actual instead of assumed
   return), deposits (more or less than planned) and deliberately changed
   assumptions.
8. **Back on course.** Below the lower guardrail the app shows three ways:
   raise the savings rate by X, retire Y years later, lower the desired pension by
   Z.

All amounts optionally in today's purchasing power (default) or nominal.

**Example:** Plan 2026 with a €150 savings rate, confidence level 85 %. In 2027
the depot stands 30 % below the expected value after a crash. The point lies below
the 2026 corridor; the probability of reaching the goal falls to e.g. 70 % and
thus below the lower guardrail. Status: "mehr sparen", with the savings rate that
leads back to 85 %. If the market recovers by 2028, the probability rises again;
if it lies above 95 %, the status is "Spielraum". (Numbers for illustration, not
calculated.)

### Building blocks

- **Pots** (new scope `plan` in the settings): name, kind (AV-Depot, depot,
  savings account), share of the savings rate, expected return, volatility
  (proposal: 15 % depot, 1 % savings account). The AV-Depot uses the existing
  logic from `src/lib/calculators/av-depot.ts` for allowances, tax savings and
  payout tax.
- **Calculation core** `src/lib/plan/`: projection per year and pot; simulation
  with percentiles; pension from the final wealth (formulas from
  `src/lib/calculators/pension-gap.ts`); probability of reaching the desired
  pension; required savings rate for a confidence level; breakdown of the
  deviation; actually achieved return between two balances (money-weighted);
  "back on course" solutions.
- **Data:** `plan_versions` (frozen assumptions, corridor, date, label) and
  `snapshots` (date, value and deposits per pot, inflation, note), per user as
  closed blocks of data. That way they can be encrypted with feature 1
  (encryption in the browser) without a rebuild.
- **Interface:**
  - Cockpit at the top: status of the guardrails, required against actual savings
    rate, success probability. Below it the corridor chart with actual points and
    new forecast, the history of the required savings rate over the reference
    dates and the key figures "planned then" next to "from today's view".
  - Page "Plan": edit pots and split, set confidence level and guardrails, with a
    direct display of how the required savings rate reacts; freeze the plan.
  - Page "Verlauf": record and view actual balances, deviation analysis between
    two balances.
  - Hint in the cockpit when the latest balance is older than one year.

### Order

| Phase | Content | Result |
| --- | --- | --- |
| 1 | Pots, overall plan in today's purchasing power, corridor, confidence level, required savings rate, chart in the cockpit | A consistent plan with a range and the answer to "am I saving enough?", still without history |
| 2 | Freeze plan, yearly actual balances, new forecast from the actual balance, guardrail status, history of the required savings rate | The plan can be tracked over time and says whether something should change |
| 3 | Deviation analysis (market, deposits, assumptions), actual inflation, "back on course" | Deviations are explained and answered |
| 4 | Optional: read depot values from CSV, reminder for the comparison | Less manual work |

### Limits

- The corridor is a model: constant volatility, no extreme events beyond the
  assumption, all equity pots move together. It is no guarantee and no investment
  advice.
- Without recorded deposits the market and deposit effects can only be estimated
  (planned savings rate × months).
- You enter the actual inflation yourself (consumer price index of the Federal
  Statistical Office); an automatic retrieval is not planned.

### Still to decide (before the start)

- Which pots you actually have and how the savings rate is split.
- Where pension entitlements and desired pension should live: today in the
  pension gap calculator, for the overall plan they would be better as global
  values.
- Whether the expected return is entered in real terms (after inflation) in the
  future or stays nominal with deduction of the inflation rate. This also affects
  the existing calculators.
- Which volatility should apply per pot.
- Whether the overall plan gets profiles like the calculators (e.g. "Basis",
  "Teilzeit ab 55").
- Order relative to feature 1: recorded balances are particularly sensitive data;
  when hosting for others, the encryption should come before or at the same time.

### Verification after the implementation (per phase)

- Calculation core tests:
  - Without volatility the simulation gives the same values as the savings
    calculator and the pension gap calculator.
  - Percentiles are ordered; the same plan gives the same numbers.
  - A higher confidence level never gives a lower required savings rate; at 50 %
    it equals the calculation with the expected course.
  - The breakdown of the deviation adds up to the total deviation; the
    money-weighted return matches hand examples.
- Browser test against a throwaway database:
  - Freeze the plan; record a balance with −30 % → point below the corridor,
    required savings rate rises, status depending on the guardrail.
  - Balance with +40 % → status "Spielraum" with amount.
  - The frozen plan stays unchanged, even when profiles are changed.
  - A changed return assumption appears in the deviation analysis separately from
    the market.
