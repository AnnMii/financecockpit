import type { Dictionary } from "./de";

/**
 * All English texts of the interface, in the shape of de.ts. German terms
 * without an English counterpart (Altersvorsorgedepot, Riester, Rürup, ...)
 * keep their name, with a short explanation where it helps.
 */
export const en: Dictionary = {
  appName: "Finance Cockpit",
  appDescription: "Personal finance cockpit with key figures and calculators.",
  language: "Language",

  nav: {
    main: "Main navigation",
    cockpit: "Cockpit",
    plan: "Overall plan",
    history: "History",
    planning: "Planning",
    calculators: "Calculators",
    account: "Account",
    settings: "Settings",
    logout: "Sign out",
  },

  saveState: {
    idle: "",
    saving: "Saving …",
    saved: "Saved",
    error: "Saving failed",
  },

  auth: {
    loginTitle: "Sign in",
    registerTitle: "Create account",
    email: "Email address",
    password: "Password",
    passwordHint: "At least 10 characters.",
    passwordRepeat: "Repeat password",
    loginButton: "Sign in",
    registerButton: "Create account",
    noAccount: "No account yet?",
    registerLink: "Register",
    hasAccount: "Already registered?",
    loginLink: "Sign in",
    errors: {
      missingCredentials: "Please enter your email address and password.",
      wrongCredentials: "Email address or password is wrong.",
      registrationClosed: "Registration is disabled.",
      invalidEmail: "Please enter a valid email address.",
      passwordTooShort: "The password needs at least 10 characters.",
      passwordMismatch: "The passwords do not match.",
      emailTaken: "There is already an account for this email address.",
    },
  },

  common: {
    shared: "shared",
    sharedTitle: "Shared value – applies to all calculators",
    changed: "changed",
    changedTitle: "Changed locally – not saved yet",
    numberRange: (integer, min, max) =>
      `Please enter a ${integer ? "whole number" : "value"} between ${min} and ${max}.`,
    cannotCalculate: "These inputs cannot be calculated",
    localChangesHint: "Changes apply only here until you save them.",
    assumptions: "Assumptions",
    yearlyTable: "Yearly values as a table",
    chartKeyboardHint: "Use the arrow keys to move through the years.",
    perYearEquals: (amount) => `= ${amount} per year`,
    age: "Age",
    ageN: (age) => `Age ${age}`,
    year: "Year",
    afterYears: (years) => `After ${years}`,
    overYears: (years) => `over ${years}`,
    capital: "Capital",
    wealth: "Wealth",
    deposits: "Deposits",
    interest: "Interest",
    endValue: "Final capital",
    perMonth: "per month",
    perQuarter: "per quarter",
    perHalfYear: "per half-year",
    perYear: "per year",
    endless: "endless",
    noAdvice: "Not tax or investment advice.",
  },

  children: {
    label: "Children",
    none: "No children entered.",
    birthYear: (n) => `Birth year of child ${n}`,
    remove: "Remove",
    removeAria: (n) => `Remove child ${n}`,
    add: "Add child",
  },

  profiles: {
    heading: "Profiles",
    ownValues: "Values of this calculator",
    managedInSettings: "Create, rename and delete in the",
    create: "New …",
    rename: "Rename",
    delete: "Delete",
    confirmCreate: "Create",
    cancel: "Cancel",
    namePlaceholder: "Profile name",
    newNameAria: "Name of the new profile",
    renameAria: "New name",
    takesVisibleValues: "Takes the values you currently see.",
    confirmDelete: (name) => `Permanently delete profile “${name}”?`,
    errors: {
      signedOut: "Please sign in again.",
      nameLength: "The name needs 1 to 40 characters.",
      tooMany: "More than 20 profiles are not possible.",
      duplicateName: "A profile with this name already exists.",
      notFound: "This profile no longer exists.",
      lastProfile: "The last profile cannot be deleted.",
      failed: "That did not work. Please try again.",
    },
  },

  draft: {
    changes: (count) =>
      count === 1 ? "1 local change" : `${count} local changes`,
    notSaved: "– only in this view, not saved.",
    saveSharedIn: "Save shared values to",
    active: "(active)",
    newProfile: "New profile …",
    newNamePlaceholder: "Name of the new profile",
    newProfileHint:
      "Takes all shared values you currently see and becomes the active profile.",
    otherProfileHint: (name) =>
      `Only the changed values are written to “${name}”; it then becomes the active profile.`,
    save: "Save",
    reset: "Reset",
  },

  calculators: {
    "av-depot": {
      title: "Altersvorsorgedepot",
      pageTitle: "Altersvorsorgedepot calculator",
      description:
        "Subsidised German retirement account (AV-Depot) versus a regular ETF savings plan: final wealth, subsidies and net pension.",
      intro:
        "Compares the state-subsidised Altersvorsorgedepot with a regular ETF savings plan for the same contributions.",
    },
    "pension-gap": {
      title: "Pension gap",
      pageTitle: "Pension gap calculator",
      description:
        "Gap between your expected and your desired pension – and the capital and savings rate that close it.",
      intro:
        "Shows the gap between your expected net pension and your desired pension – and the capital and savings rate that close it.",
    },
    savings: {
      title: "Savings calculator",
      pageTitle: "Savings calculator",
      description:
        "Calculate the final capital, starting capital, interest rate, duration or savings rate of a savings plan, optionally with taxes.",
      intro:
        "Calculates the missing quantity from starting capital, savings rate, interest rate, duration and final capital.",
    },
    "withdrawal-plan": {
      title: "Withdrawal plan",
      pageTitle: "Withdrawal plan",
      description:
        "How much can be withdrawn from a portfolio, how long it lasts or how large it has to be.",
      intro:
        "Calculates how much you can regularly withdraw from a portfolio, how long it lasts or how large it has to be.",
    },
  },

  scopes: {
    plan: "Overall plan",
    shared: "Shared values",
    "av-depot": "Altersvorsorgedepot",
    "pension-gap": "Pension gap",
    savings: "Savings calculator",
    "withdrawal-plan": "Withdrawal plan",
  },

  numbers: {
    plan: {
      avDepotShare: {
        label: "Share Altersvorsorgedepot",
        unit: "%",
        hint: "Of the savings rate; what is left after the savings account goes to the ETF account.",
      },
      cashShare: { label: "Share savings account", unit: "%" },
      cashReturn: { label: "Interest savings account", unit: "% p.a." },
      depotVolatility: {
        label: "Fluctuation ETF account",
        unit: "% p.a.",
        hint: "About 15% for a global equity ETF.",
      },
      cashVolatility: { label: "Fluctuation savings account", unit: "% p.a." },
      confidenceTarget: {
        label: "Confidence level",
        unit: "%",
        hint: "The desired pension should be reached in this many of 100 possible courses.",
      },
      lowerGuardrail: {
        label: "Lower guardrail",
        unit: "%",
        hint: "If the probability falls below: save more.",
      },
      upperGuardrail: {
        label: "Upper guardrail",
        unit: "%",
        hint: "If it rises above: you may reduce.",
      },
    },
    shared: {
      age: { label: "Age", unit: "years" },
      retirementAge: { label: "Retirement at age", unit: "years" },
      payoutUntilAge: {
        label: "Payout until age",
        unit: "years",
        hint: "The money should last until this age.",
      },
      savingsRateMonthly: { label: "Savings rate per month", unit: "€" },
      currentCapital: {
        label: "Existing capital",
        unit: "€",
        hint: "Wealth already invested today.",
      },
      expectedReturn: {
        label: "Expected return MSCI World",
        unit: "% p.a.",
        hint: "While saving, after fund costs (TER), before taxes.",
      },
      retirementReturn: {
        label: "Return in retirement",
        unit: "% p.a.",
        hint: "Expected return during the payout.",
      },
      inflationRate: { label: "Inflation rate", unit: "% p.a." },
      capitalGainsTax: {
        label: "Capital gains tax",
        unit: "%",
        hint: "25% plus solidarity surcharge; higher with church tax.",
      },
      zveSavingsPhase: {
        label: "Income while saving",
        unit: "€ / year",
        hint: "Taxable income per year.",
      },
      zveRetirement: {
        label: "Income in retirement",
        unit: "€ / year",
        hint: "Taxable income per year, without the payouts.",
      },
      exemptionOrder: {
        label: "Saver's allowance (Sparerpauschbetrag)",
        unit: "€ / year",
        hint: "The part still unused for this investment.",
      },
    },
    "av-depot": {
      avDepotCosts: {
        label: "Costs of the AV-Depot",
        unit: "% p.a.",
        hint: "On top of the fund costs, e.g. account fees.",
      },
      baseRate: {
        label: "Base rate (Basiszins)",
        unit: "%",
        hint: "For the advance tax (Vorabpauschale) in the regular account.",
      },
      oneTimePayout: {
        label: "Lump sum at retirement",
        unit: "%",
        hint: "Up to 30% of the capital, before tax.",
      },
    },
    "pension-gap": {
      statePension: {
        label: "State pension",
        unit: "€ / month",
        hint: "As stated in the pension statement of Deutsche Rentenversicherung.",
      },
      companyPension: { label: "Company pension", unit: "€ / month" },
      privatePension: {
        label: "Private pension / life insurance",
        unit: "€ / month",
      },
      riesterPension: { label: "Riester / Rürup pension", unit: "€ / month" },
      taxPrediction: {
        label: "Estimated tax deduction",
        unit: "%",
        hint: "On the pension above the basic allowance and on interest in retirement.",
      },
      yearlyTaxFreeAmount: {
        label: "Basic tax allowance",
        unit: "€ / year",
      },
      desiredPension: {
        label: "Desired monthly pension",
        unit: "€ / month",
        hint: "Net amount you want to have available in retirement.",
      },
    },
    savings: {
      durationYears: { label: "Duration", unit: "years" },
      endValue: { label: "Final capital", unit: "€" },
      partialExemption: {
        label: "Partial exemption rate",
        unit: "%",
        hint: "30% for equity funds, 15% for mixed funds.",
      },
    },
    "withdrawal-plan": {
      capitalAssets: { label: "Portfolio", unit: "€" },
      withdrawalAmount: { label: "Withdrawal amount", unit: "€" },
      periodYears: { label: "Withdrawal period", unit: "years" },
    },
  },

  toggles: {
    plan: {},
    shared: {
      considerInflation: {
        label: "Account for inflation",
        hint: "Calculates with returns after deducting the inflation rate.",
      },
    },
    "av-depot": {},
    "pension-gap": {},
    savings: {
      untilRetirement: { label: "Duration until retirement" },
      considerTax: { label: "Include taxes" },
      considerPartialExemption: {
        label: "Apply the partial exemption for funds",
      },
    },
    "withdrawal-plan": {
      capitalConsumption: {
        label: "Use up the capital",
        hint: "Off: only the interest is withdrawn, the capital is preserved.",
      },
    },
  },

  selects: {
    plan: {},
    shared: {},
    "av-depot": {
      taxSavingsMode: {
        label: "Use of the tax savings",
        options: {
          avDepot: "Pay into the AV-Depot",
          secondaryDepot: "Invest in a separate account",
          consume: "Spend",
        },
      },
    },
    "pension-gap": {},
    savings: {
      output: {
        label: "What do you want to calculate?",
        options: {
          endValue: "Final capital",
          startValue: "Starting capital",
          yearlyInterest: "Interest rate",
          duration: "Duration",
          savingRate: "Savings rate",
        },
      },
      saveInterval: {
        label: "Saving interval",
        options: { monthly: "monthly", yearly: "yearly" },
      },
      interestInterval: {
        label: "Interest interval",
        options: { monthly: "monthly", quarterly: "quarterly", yearly: "yearly" },
      },
      distributionType: {
        label: "Distribution type",
        options: { distributing: "distributing", accumulating: "accumulating" },
      },
    },
    "withdrawal-plan": {
      output: {
        label: "What do you want to calculate?",
        options: {
          amount: "Withdrawal amount",
          period: "Withdrawal period",
          capital: "Portfolio",
        },
      },
      interval: {
        label: "Withdrawal interval",
        options: {
          monthly: "monthly",
          quarterly: "quarterly",
          biannual: "half-yearly",
          yearly: "yearly",
        },
      },
    },
  },

  calcErrors: {
    ageBeforeRetirement: "The age must be below the retirement age.",
    payoutAfterRetirement: "The payout must end after retirement.",
    avAgeRange: "The age must be between 18 and 67.",
    avRetirementRange: "Retirement must be between age 65 and 70.",
    avPayoutMin85:
      "In the Altersvorsorgedepot the payout must run at least until age 85.",
    avSavingsRateRange:
      "The savings rate must be between €120 and €13,680 per year (€10 to €1,140 per month).",
    avReturnsPositive: "The returns must be greater than 0%.",
    avCostsBelowReturns: "The costs of the AV-Depot must be below the returns.",
    taxBelow100: "The tax rates must be below 100%.",
    durationPositive: "The duration must be greater than 0.",
    unreachableStartValue:
      "The final capital is already reached or exceeded without starting capital.",
    unreachableSavingRate:
      "The final capital is already reached or exceeded without a savings rate.",
    unreachableYearlyInterest:
      "With these deposits no interest rate from 0% up reaches the final capital exactly.",
    unreachableDuration:
      "The final capital cannot be reached with these values, or it is already reached.",
    interestAboveMinus100: "The interest rate must be above −100%.",
    capitalPositive: "The portfolio must be greater than 0.",
    amountPositive: "The withdrawal amount must be greater than 0.",
    needsInterest:
      "Without using up the capital a positive interest rate is needed: only the interest is withdrawn.",
    planSharesOver100:
      "The shares for AV-Depot and savings account must not add up to more than 100%.",
    planGuardrailOrder:
      "The lower guardrail must be below, the upper one above the confidence level.",
  },

  plan: {
    pageTitle: "Overall plan",
    intro:
      "One plan across all pots: is your savings rate enough to reach the desired pension with the confidence you want? All amounts in today's purchasing power.",
    historyTitle: "History",
    historyIntro:
      "Once a year, record what is actually in your pots and check it against a frozen plan.",
    pots: { av: "Altersvorsorgedepot", depot: "ETF account", cash: "Savings account" },
    sections: {
      split: "Split of the savings rate",
      returns: "Returns and inflation",
      volatility: "Fluctuation",
      confidence: "Confidence",
      time: "Period",
    },
    splitSummary: (av, depot, cash) =>
      `Per month: AV-Depot ${av}, ETF account ${depot}, savings account ${cash}.`,
    sourcesNote:
      "Pension entitlements and the desired pension come from the pension gap calculator, the details of the AV-Depot from its calculator, today's balances from the history.",
    status: {
      increase: "Save more",
      onTrack: "On plan – change nothing",
      room: "Room to spare",
    },
    statusNote: {
      increase: (amount) =>
        `Raise the savings rate by ${amount} per month to reach your confidence level.`,
      onTrack: "The probability lies between your guardrails.",
      room: (amount) =>
        `You could save ${amount} less per month and stay at your confidence level.`,
    },
    probability: "Probability of reaching the desired pension",
    guardrails: (lower, target, upper) =>
      `Guardrails ${lower} and ${upper}, target ${target}`,
    currentRate: "Your savings rate",
    requiredRate: "Required savings rate",
    requiredRateNote: (target) => `for ${target} confidence`,
    alternativesTitle: "Other ways back on track",
    lowerPension: (amount) => `Lower the desired pension by ${amount} per month`,
    retireLater: (years) => `Retire ${years} later`,
    retireLaterNotEnough:
      "Retiring later alone is not enough, not even five years.",
    corridorTitle: "Wealth until retirement",
    corridorSubtitle:
      "In today's purchasing power. The band shows the middle 80% of possible courses, the line the middle one.",
    corridorAria: "Line chart: possible range of wealth by age until retirement",
    forecast: "Current forecast",
    range: "Range",
    snapshots: "Actual balances",
    snapshotOn: (date) => `Balance of ${date}`,
    frozen: (label) => `Frozen: ${label}`,
    wealthAtRetirement: "Wealth at retirement",
    pensionPerMonth: "Pension per month",
    pessimistic: "Pessimistic",
    expected: "Middle course",
    optimistic: "Optimistic",
    freezeTitle: "Freeze the plan",
    freezeIntro:
      "Freezes all assumptions and this corridor as of today. Later you check your actual balances against it; the frozen plan never changes again.",
    freezeLabel: "Name",
    freezeDefaultLabel: (year) => `Plan ${year}`,
    freezeButton: "Freeze",
    versionsTitle: "Frozen plans",
    noVersions: "No plan frozen yet.",
    compareWith: "Compare with",
    noComparison: "No comparison",
    delete: "Delete",
    saveFailed: "That did not work. Please try again.",
    noSnapshot:
      "No actual balance recorded yet – the plan starts at €0 in all pots.",
    staleSnapshot: (date) =>
      `Last actual balance of ${date}. Time for the yearly check.`,
    balancesFrom: (date) => `Balances of ${date}.`,
    recordSnapshot: "Record balance",
    openPlan: "Open plan",
    openHistory: "Open history",
    thenNow: {
      title: "Planned then and seen from today",
      then: "Then",
      now: "Today",
      wealth: "Wealth at retirement (middle course)",
      pension: "Pension per month (middle course)",
      probability: "Probability",
      requiredRate: "Required savings rate",
    },
    history: {
      formTitle: "Record actual balance",
      date: "Date",
      valuesTitle: "Value of each pot on the date",
      contributionsTitle: "Paid in since the last balance",
      inflation: "Inflation since the last balance",
      inflationHint: "Optional, in % per year. Empty: the plan's assumption applies.",
      note: "Note",
      save: "Save balance",
      listTitle: "Recorded balances",
      empty: "No balances recorded yet.",
      total: "Total",
      contributions: "Paid in",
      analysisTitle: "Deviation from the frozen plan",
      analysisEmpty: "This needs a frozen plan and a later actual balance.",
      analysisFor: (snapshot, plan) =>
        `Balance of ${snapshot} against “${plan}”, in its purchasing power.`,
      planned: "Planned for this date",
      actual: "Actual",
      deviation: "Deviation",
      contributionEffect: "of which contributions",
      marketEffect: "of which market and other",
      actualReturn: "Return earned per year",
      assumedReturn: "Return assumed per year",
      position: {
        below: "Below the corridor",
        inside: "Inside the corridor",
        above: "Above the corridor",
      },
      assumptionsTitle: "Effect of changed assumptions",
      assumptionsNote: (frozen, current) =>
        `Required savings rate from today's balance: ${frozen} with the assumptions of then, ${current} with today's.`,
      rateChartTitle: "Required and actual savings rate by date",
      rateChartAria:
        "Column chart: required savings rate by date with the actual savings rate as a line",
      requiredSeries: "Required savings rate",
      actualSeries: "Actual savings rate",
    },
    assumptions: [
      "All amounts in today's purchasing power; the inflation rate is always deducted, regardless of the switch in the settings.",
      "The corridor comes from 2,000 random courses of the return with constant fluctuation; AV-Depot and ETF account move together. Extreme events beyond this assumption are not covered.",
      "Savings rates rise with inflation; the contributions to the AV-Depot stay nominally the same and follow its calculator.",
      "The required savings rate only changes the share of the ETF account; AV-Depot and savings account stay as set.",
      "From retirement on, the fixed return in retirement applies and the capital is used up by the end of the payout.",
      "The corridor is a model, not a guarantee. Not tax or investment advice.",
    ],
  },

  life: {
    button: "Show life expectancy in Germany",
    title: "How old do people in Germany become?",
    intro: (age) =>
      `For people who have reached age ${age} (your retirement). The curves show what share of them dies at which age.`,
    male: "Men",
    female: "Women",
    expectedAge: "Expected age",
    mostCommonAge: "Most common age at death",
    sigma: "Scatter σ",
    band: (sigmas) => `±${sigmas}σ range (share)`,
    olderThan: (age) => `live beyond ${age}`,
    payoutMarker: (age) => `Payout until ${age}`,
    chartAria: (men, women) =>
      `Chart: share of people who die at a given age. Men die most often at ${men}, women at ${women}; after that the curve drops steeply.`,
    shareAxis: "Share dying in this year of age",
    outliveLegend: (age, men, women) =>
      `Area: live beyond ${age} (men ${men}, women ${women})`,
    hover: (age, men, women) =>
      `${men} of men and ${women} of women live beyond ${age}.`,
    hoverHint: "Move over the chart to read off how many live beyond an age.",
    planning: (age, men, women) =>
      `For your plan: with “payout until ${age}”, ${men} of men and ${women} of women reach this age – their money would be used up while they are still alive.`,
    sigmaTitle: "What does the 3σ range mean – and why does it say little here?",
    sigmaText:
      "σ (sigma) is the standard deviation: it measures how far the individual ages at death scatter around the mean. In a symmetric bell curve (normal distribution) 68.3% of the values lie within ±1σ of the mean, 95.4% within ±2σ and 99.7% within ±3σ.",
    sigmaCaveat:
      "The age at death is not distributed symmetrically, though: the curve rises slowly, peaks only above the mean and then drops steeply. Every σ step is equally wide but holds very different numbers of people – hardly anyone dies in the outermost stretch up to +3σ, and downwards the range ends at the age already reached. The shares in the table are therefore counted from the life table. For planning, the rows “live beyond …” say more than the σ ranges.",
    source: "Source",
    sourceText: (period, published) =>
      `Federal Statistical Office of Germany (Destatis), statistical report “Sterbetafeln ${period}”, published on ${published}.`,
    ownCalculation: "Expected age, scatter and shares are our own calculation from it.",
    periodNote:
      "The table describes today's mortality; if life expectancy keeps rising, younger people will on average live longer than shown here.",
  },

  settingsPage: {
    title: "Settings",
    intro:
      "The calculators share these values. Changes only apply once you save them at the bottom right.",
    profileLabel: "Profile of the shared values",
    personal: "Personal data",
    saving: "Saving and investing",
    inflation: "Inflation",
    incomeAndTax: "Income and taxes",
  },

  dashboard: {
    title: "Cockpit",
    profilesHint:
      "The selection also applies in the calculators. You can create and change profiles there and in the settings.",
    retirementHeading: "Retirement at a glance",
    remainingGap: "Remaining pension gap per month",
    gapCovered: "Pension and Altersvorsorgedepot cover your desired pension.",
    gapAfter: "After the expected pension and the Altersvorsorgedepot.",
    shareBarLabel: "Desired pension per month",
    netPension: "Net pension",
    avDepot: "Altersvorsorgedepot",
    remaining: "Remaining gap",
    desiredPension: "Desired pension",
    capitalForGap: "Capital needed for the gap",
    extraSavingsRate: "Additional savings rate per month",
    noteWithAvDepot: (savingsRate, untilAge) =>
      `The additional savings rate comes on top of the ${savingsRate} per month that go into the Altersvorsorgedepot in this calculation. Its pension runs until age ${untilAge}; the capital for the gap is calculated as being used up.`,
    noteWithoutAvDepot:
      "The Altersvorsorgedepot cannot be calculated with the selected profiles and is not included here.",
    nominal: "All amounts nominal.",
    notCalculable: "Cannot be calculated with the selected profiles:",
    resultsHeading: "Results of the calculators",
    openCalculator: "Open calculator",
    searched: "Calculated",
    searchedFor: (what) => `Calculated: ${what}`,
    avFinalCapital: (age) => `Final wealth at ${age}`,
    netPensionPerMonth: "Net pension per month",
    etfComparison: "For comparison: ETF savings plan per month",
    totalSubsidies: "Total subsidies",
    gapPerMonth: "Pension gap per month",
    netPensionMonthly: "Net pension per month",
    capitalWithConsumption: "Capital needed (using it up)",
    savingsRateNeeded: "Savings rate needed per month",
    duration: "Duration",
    totalDeposits: "Total deposits",
    withdrawalAmount: (perInterval) => `Withdrawal amount ${perInterval}`,
    withdrawalPeriod: "Withdrawal period",
    capitalAssets: "Portfolio",
  },

  avDepot: {
    sections: {
      personal: "Personal data",
      income: "Income",
      saving: "Saving phase",
      children: "Children",
      payout: "Payout phase",
      advanced: "Advanced",
    },
    retirementAgeHint: "Between 65 and 70.",
    savingsRateHint: (perYear) =>
      `${perYear}. Subsidised up to €150 per month, possible up to €1,140.`,
    payoutUntilHint: "In the Altersvorsorgedepot at least until 85.",
    name: "Altersvorsorgedepot",
    etfPlan: "ETF savings plan",
    series: { own: "Contributions", subsidies: "Subsidies", gains: "Growth" },
    heroLabel: (age) => `Final wealth in the Altersvorsorgedepot at age ${age}`,
    heroNote:
      "Including subsidies and returns, after costs, before taxes. An ETF savings plan with the same contributions would reach",
    netPensionPerMonth: "Net pension per month",
    avUntilAge: (age) => `Altersvorsorgedepot, until age ${age}`,
    etfSamePlan: "ETF savings plan, same payout plan",
    totalSubsidies: "Total subsidies",
    subsidiesBreakdown: (allowances, taxSavings) =>
      `${allowances} allowances + ${taxSavings} tax savings`,
    chartTitle: "Wealth in the saving phase",
    chartSubtitle: "At the end of each year by age, in the Altersvorsorgedepot",
    chartSubtitleSecondary: " including the separate account",
    compareToggle: "Compare with an ETF savings plan",
    chartAria:
      "Column chart: wealth in the Altersvorsorgedepot per year, split into contributions, subsidies and growth",
    chartColumnTitle: (age, year) => `Age ${age} · ${year}`,
    allowances: "Allowances",
    investedTaxSavings: "Invested tax savings",
    taxSavings: "Tax savings",
    consumedNote: (amount) =>
      `${amount} of tax savings are not invested and are not part of the wealth.`,
    monthlyTitle: "Monthly net pension",
    monthlySubtitle: (from, until) =>
      `Payout from age ${from} to ${until}, after taxes, from the second year on.`,
    payoutTitle: "Payout in detail",
    payoutSubtitle: "Per year; the 1st year includes the lump sum.",
    payout: "Payout",
    gross: "Gross",
    tax: "Tax",
    net: "Net",
    firstYear: "1st year",
    laterYears: "Later years, each",
    totalYears: (years) => `Total (${years} years)`,
    assumptions: [
      "Contributions are made at the end of the year, withdrawals at the beginning; all amounts are nominal, without inflation.",
      "Contribution years from 2027, income tax according to the 2026 basic tariff including solidarity surcharge, without church tax.",
      "Child allowance until the 18th birthday; allowances only for contributions up to €1,800 per year.",
      "The ETF savings plan runs in a free account with 30% partial exemption and the more favourable of flat tax and personal tax rate.",
      "Calculation follows the documentation of the Finanzfluss calculator. Not tax or investment advice.",
    ],
  },

  pensionGap: {
    sections: {
      entitlements: "Pension entitlements per month",
      tax: "Taxes on the pension",
      desired: "Desired pension",
      retirement: "Retirement",
      saving: "Saving phase",
      inflation: "Inflation",
    },
    returnUntilRetirement: "Return until retirement",
    returnUntilRetirementHint: "Before taxes; capital gains tax is deducted.",
    series: { saving: "Saving", payout: "Withdrawal" },
    heroLabel: "Pension gap per month",
    heroCovered: "Your expected net pension covers the desired pension.",
    heroNote: (net, desired) =>
      `This is missing between ${net} net pension and ${desired} desired pension.`,
    overviewTitle: "Desired pension at a glance",
    overviewAria: "Composition of the desired pension",
    netPension: "Net pension",
    gap: "Pension gap",
    grossNote: (gross, tax) =>
      `Gross pension ${gross}, of which ${tax} taxes per month.`,
    withConsumption: "Using up the capital",
    withConsumptionNote: (age) => `The wealth is used up at age ${age}.`,
    withoutConsumption: "Preserving the capital",
    withoutConsumptionNote:
      "You live on the returns only, the wealth is preserved.",
    capitalAtRetirement: "Capital at retirement",
    savingsRatePerMonth: "Savings rate per month",
    notPossible:
      "Not possible: after taxes and inflation no return is left in retirement to live on.",
    chartTitle: "Wealth over time, using up the capital",
    chartSubtitle: (retirementAge) =>
      `At the end of each year of life: saving until ${retirementAge}, then withdrawing the pension gap every month.`,
    chartAria: "Column chart: wealth per year of life, first saving, then withdrawal",
    phase: "Phase",
    assumptions: [
      "The tax deduction applies to the pension above the basic allowance and to returns in retirement; capital gains tax reduces the return until retirement.",
      "With inflation, returns are reduced by the inflation rate; pension and desired pension stay in today's purchasing power.",
      "Savings are paid at the end of the month, withdrawals at the beginning; interest monthly.",
      "Health and long-term care insurance on the pension are not included.",
      "Formulas derived from the results of the Finanzfluss calculator. Not tax or investment advice.",
    ],
  },

  savings: {
    sections: {
      calculation: "Calculation",
      plan: "Savings plan",
      interest: "Interest",
      tax: "Taxes",
    },
    searchedFieldHint:
      "The field you are looking for is removed from the inputs and appears as the result.",
    startValue: "Starting capital",
    startValueHint: "Your existing capital from the shared values.",
    yearlyDepositHint: (perYear) => `${perYear}, paid in once a year.`,
    interestRate: "Interest rate p.a.",
    interestRateHint: "Your expected return from the shared values.",
    duration: "Duration",
    savingRate: (perInterval) => `Savings rate ${perInterval}`,
    durationMonths: (months) => `That is ${months} months.`,
    durationUntilRetirement: (duration, retirementAge, age) =>
      `Duration: ${duration} (retirement at ${retirementAge} − age ${age}).`,
    chartTitle: "Capital per year",
    chartSubtitle: "Deposits including starting capital and the interest earned on them",
    afterTax: " after taxes",
    chartAria: "Column chart: capital per year, split into deposits and interest",
    totalDeposits: "Total deposits",
    assumptions: [
      "Deposits are made at the beginning of the saving interval; interest is credited in the chosen interest interval and compounds.",
      "Distributing: the tax reduces the interest continuously. Accumulating: the tax on the whole gain is due at the end.",
      "The partial exemption makes the chosen share of the returns tax-free; a saver's allowance is not included.",
      "Calculation follows the Finanzfluss savings calculator. Not tax or investment advice.",
    ],
  },

  withdrawal: {
    sections: {
      calculation: "Calculation",
      withdrawal: "Withdrawal",
      interest: "Interest",
    },
    searchedFieldHint:
      "The field you are looking for is removed from the inputs and appears as the result.",
    interestRate: "Interest rate p.a.",
    interestRateHint: "Your return in retirement from the shared values.",
    amount: (perInterval) => `Withdrawal amount ${perInterval}`,
    period: "Withdrawal period",
    capital: "Portfolio",
    endlessNote:
      "The withdrawal does not exceed the interest; the capital is never used up.",
    keepsCapitalNote: "Only the interest is withdrawn; the capital is preserved.",
    totalWithdrawn: "Total withdrawals",
    ofWhichInterest: (amount) => `of which ${amount} interest`,
    chartTitle: "Capital per year",
    chartSubtitle: "Remaining portfolio at the end of each year",
    chartSubtitleEndless: " (the first 30 years)",
    chartAria: "Column chart: remaining capital at the end of each year",
    assumptions: [
      "Withdrawals are made at the end of each interval; the yearly rate is converted to the interval so that one year yields exactly the interest rate.",
      "Taxes and inflation are not included; enter a correspondingly lower interest rate for them.",
      "Formulas derived from the results of the Finanzfluss calculator. Not tax or investment advice.",
    ],
  },
};
