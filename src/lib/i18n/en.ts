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

  landing: {
    headline: "Your overview for retirement and wealth building",
    intro:
      "Will my pension be enough? Is an Altersvorsorgedepot worth it? How much do I need to save each month? The Finanzcockpit answers these questions in one place – with the same assumptions for everything.",
    login: "Sign in",
    register: "Create account",
    openCockpit: "Go to the cockpit",
    invitationOnly: "Access is currently by invitation only.",
    whyHeading: "Why everything in one place?",
    why: [
      {
        title: "Enter once, use everywhere",
        text: "You enter age, income, savings rate and return assumptions once. You do not have to retype them into four different calculators.",
      },
      {
        title: "Numbers that fit together",
        text: "Single calculators on the web use their own assumptions for returns, inflation and taxes, so their results easily contradict each other. Here all of them use the same values.",
      },
      {
        title: "See how it plays together",
        text: "The money you have available each month is limited: what goes into the Altersvorsorgedepot is missing from the ETF savings plan. The cockpit shows whether everything is enough together – not just each piece on its own.",
      },
    ],
    screenshotsHeading: "What it looks like",
    screenshotsNote:
      "Example with rounded values, modelled on an average employee in Germany: 40 years old, €42,000 taxable income, €15,000 starting capital, €300 per month to invest, €1,500 statutory pension and a desired pension of €1,900. These are assumptions for illustration, not a forecast.",
    screenshots: {
      plan: {
        title: "Overall plan",
        caption:
          "Is the savings rate enough? The plan shows how likely the desired pension is to be reached, the corridor your wealth moves in, and how much more or less you should save.",
        alt: "Overall plan with the status “On plan”, 86% probability and the chart of wealth until retirement",
      },
      pensionGap: {
        title: "Pension gap",
        caption:
          "What is missing between the expected pension and the desired pension – and which capital and savings rate close the gap.",
        alt: "Pension gap calculator showing a gap of €386 per month and the capital and savings rate needed",
      },
      avDepot: {
        title: "Altersvorsorgedepot",
        caption:
          "The subsidised depot compared with a normal ETF savings plan: final wealth, subsidies and net pension.",
        alt: "Altersvorsorgedepot calculator showing €157,326 final wealth and the chart of the saving phase",
      },
    },
    featuresHeading: "What the website does",
    features: {
      plan: {
        title: "Overall plan: am I saving enough?",
        text: "Calculates with 2,000 simulated market paths instead of a single line. You see a corridor, the probability of reaching your goal, and the savings rate needed for your confidence level.",
      },
      history: {
        title: "History: staying on plan",
        text: "Freeze your plan and enter your balances once a year. You see whether you are inside the corridor – and whether you need to save more or have room to spare.",
      },
      profiles: {
        title: "Profiles to play through",
        text: "Create several variants, such as “Base” or “Part-time from 55”, and compare them without overwriting your values.",
      },
    },
    calculatorsHeading: "Four calculators",
    stepsHeading: "How it works",
    steps: [
      {
        title: "Enter the basics",
        text: "Under “Global values” you enter age, income, money available and return assumptions once.",
      },
      {
        title: "Play through the calculators",
        text: "The calculators take over your values and show results and charts. Changes only apply once you save them.",
      },
      {
        title: "Check and track the plan",
        text: "The overall plan tells you whether your savings rate is enough. The history keeps it in view over the years.",
      },
    ],
    noticeHeading: "Good to know",
    notices: [
      "These are model calculations based on assumptions. They are not investment, tax or legal advice and no guarantee.",
      "Your entries are stored in a database on the operator's server. Passwords are stored only as a hash.",
      "There is no advertising, no tracking and no third-party scripts.",
    ],
  },
  nav: {
    main: "Main navigation",
    cockpit: "Cockpit",
    plan: "Overall plan",
    history: "History",
    planning: "Planning",
    calculators: "Calculators",
    account: "Basics",
    settings: "Global values",
    logout: "Sign out",
    menu: "Menu",
    about: "About the Finanzcockpit",
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
      tooManyAttempts: "Too many attempts. Please wait a few minutes and try again.",
    },
  },

  common: {
    shared: "shared",
    infoAbout: (label) => `Explanation of “${label}”`,
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
    eurosPerMonth: "€ / month",
    eurosPerYear: "€ / year",
    endless: "endless",
    advancedToggle: "Advanced inputs",
    advancedForced: "The advanced inputs are shown because of the error message.",
  },

  fieldInfo: {
    plan: {
      nominalView:
        "The overall plan works in today's purchasing power. With the box checked, the card “Pension from all sources” shows the amounts in euros of the year of retirement, raised by the inflation rate; they then match the nominal results of the AV-Depot and savings calculators. Unchecked, it stays in today's purchasing power.",
      useAvDepot:
        "Unchecked, the overall plan works without an AV-Depot: nothing is paid in, its pension is missing, and the rate in the calculator does not count. It stays saved there.",
      useDepot:
        "Unchecked, the overall plan works without an ETF depot: the savings calculator's rate does not count, and existing capital and any additional savings go to the savings account.",
      cashMonthly:
        "What you put into the savings account per month. It hardly fluctuates but returns less.",
      cashReturn:
        "The interest you expect on the savings account in the long run, per year.",
      depotVolatility:
        "How much the yearly return of the portfolio scatters around the expected value (standard deviation). The higher, the wider the corridor of possible courses. A global equity ETF is at about 15%.",
      cashVolatility:
        "How much the savings account interest changes from year to year. A small value around 1% is usual.",
      confidenceTarget:
        "The probability with which your plan should work out. 85% means: the desired pension is reached in 85 of 100 simulated courses. A higher value requires a higher savings rate.",
      lowerGuardrail:
        "If the probability of success falls below this value, the plan recommends saving more. Between the guardrails nothing changes, even when the portfolio fluctuates.",
      upperGuardrail:
        "If the probability of success rises above this value, you have leeway and could lower the savings rate.",
    },
    shared: {
      age:
        "Your age today. Together with the retirement age it determines how many years you keep saving.",
      retirementAge:
        "The age at which you stop saving and start withdrawing. The standard retirement age in Germany is 67 for those born in 1964 or later.",
      payoutUntilAge:
        "Your assets should last until this age; after that they are used up by calculation. Rather choose it high: many people live longer than average.",
      investableMonthly:
        "The budget you have to invest per month. How you split it over the Altersvorsorgedepot, the ETF account (savings calculator) and the savings account you set there; the overall plan shows whether the sum exceeds or falls short of the budget.",
      currentCapital:
        "Assets you have already invested today, which keep growing at the expected return. In the overall plan they count as the balance of the ETF account until you record an actual balance in the history.",
      expectedReturn:
        "Yearly return at which the invested money grows while saving – after fund costs, before taxes. A global equity ETF returned about 6 to 7% per year nominally in the long run; that is no guarantee.",
      retirementReturn:
        "Yearly return of your assets during the payout. Usually set lower than while saving, because investments are more cautious in retirement.",
      inflationRate:
        "How much prices rise per year. Future amounts are converted into today's purchasing power with it. The European Central Bank aims for 2%.",
      capitalGainsTax:
        "Tax on interest, dividends and capital gains: 25% flat tax plus solidarity surcharge make 26.375%; about 28% with church tax.",
      incomeIntervalSavings:
        "Whether you enter the income while saving per year (as in the income tax assessment) or per month. The calculation uses the yearly amount, i.e. the monthly amount times 12.",
      incomeIntervalRetirement:
        "Whether you enter the income in retirement per month (as the pension insurer states it) or per year. The calculation uses the yearly amount, i.e. the monthly amount times 12.",
      taxableIncomeSavingsPhase:
        "Your taxable income while you save: gross income minus income-related expenses, pension contributions and allowances. It is stated in your income tax assessment and determines how much tax the deposits into the AV-Depot save you.",
      taxableIncomeRetirement:
        "Your taxable income in retirement without the payouts from the AV-Depot, mainly the taxable part of your pensions. It determines the tax rate on the payouts.",
      exemptionOrder:
        "Investment income up to this amount stays tax-free per year: €1,000 for single persons, €2,000 for couples assessed jointly. Enter what is still available for this investment.",
      considerInflation:
        "Applies to the pension gap calculator. Checked, it uses the return after deducting the inflation rate; the results are then in today's purchasing power. Unchecked, they are nominal, i.e. in future euros. The overall plan always uses today's purchasing power, the withdrawal plan has a switch of its own, the other calculators are always nominal.",
    },
    "av-depot": {
      savingsRateMonthly:
        "What you pay into the Altersvorsorgedepot per month. Up to €150 per month (€1,800 per year) is subsidised, up to €1,140 (€13,680 per year) is possible. You invest the rest of your budget in the savings calculator.",
      avDepotCosts:
        "Running costs of the Altersvorsorgedepot per year, on top of the fund costs – such as custody or administration fees. They reduce the return. For the standard depot the effective costs are capped by law at 1.0% per year; the cap does not apply to a freely composed depot. There the TER of the chosen ETFs comes on top of these costs, unless it is already in the expected return.",
      baseRate:
        "The base rate set yearly by the German Federal Ministry of Finance. It yields the Vorabpauschale, the yearly minimum taxation of accumulating funds in a regular portfolio.",
      oneTimePayout:
        "Share of the capital you have paid out at once at retirement, before taxes. Up to 30% is allowed; the rest is paid as a monthly pension.",
      taxSavingsMode:
        "What happens with the tax refund from the deposits: pay it into the AV-Depot as well, invest it in a regular portfolio or spend it. This affects the comparison with the ETF savings plan.",
    },
    "pension-gap": {
      statePension:
        "Your expected monthly state pension, gross. It is stated in the yearly pension information of the Deutsche Rentenversicherung.",
      companyPension:
        "Expected monthly pension from a company pension scheme, gross.",
      privatePension:
        "Expected monthly pension from private pension or life insurance, gross.",
      riesterPension:
        "Expected monthly pension from Riester or Rürup contracts, gross.",
      taxPrediction:
        "Flat tax rate on your pensions above the basic allowance and on interest in retirement. An estimate; the actual rate depends on your total income.",
      yearlyTaxFreeAmount:
        "Income up to this amount stays tax-free per year. The basic allowance is adjusted every year.",
      desiredPension:
        "The amount you want to have available per month in retirement, net. A rule of thumb is about 80% of your last net income.",
    },
    savings: {
      savingsRateMonthly:
        "What you pay into your savings plan, i.e. the ETF account, per month. The value belongs to the profile of the savings calculator and is used as the rate of the ETF account in the overall plan.",
      costs:
        "Running costs per year that reduce the return – such as a custody fee. The fund costs (TER) are already in the interest rate or the expected return. In the overall plan these costs reduce the return of the ETF account.",
      durationYears:
        "How many years you save.",
      endValue:
        "The capital that should be there at the end of the duration – deposits and interest together.",
      partialExemption:
        "The part of the fund income that stays tax-free: 30% for equity funds, 15% for mixed funds.",
      realTerms:
        "Checked, the inflation rate (field below) is deducted from the interest rate; the deposits stay the same in today's purchasing power and the result is in today's euros. The tax is then calculated on the real interest, a simplification. Unchecked, the calculator works nominally, as at Finanzfluss.",
      untilRetirement:
        "Checked, the duration is retirement age minus age and follows the shared values. Unchecked, you enter the duration freely, e.g. for a savings goal before retirement.",
      considerTax:
        "Deducts capital gains tax from the interest. Without this option all results are before taxes.",
      considerPartialExemption:
        "For funds, part of the income stays tax-free. Switch this on if you save in funds or ETFs.",
      output:
        "The figure the calculator derives from the other entries. Its input field disappears.",
      saveInterval:
        "How often you deposit. With “yearly”, twelve times the monthly savings rate is deposited at once.",
      interestInterval:
        "How often returns are credited and then grow themselves (compound interest). The rate is per year and is broken down to the interval; the more often, the more you end up with. For ETFs and funds, distributing and accumulating alike, “monthly” fits, because their value grows continuously. For a savings account the interval of your bank applies, for fixed-term deposits and passbooks usually “yearly”.",
      distributionType:
        "Distributing: income is paid out and taxed every year. Accumulating: income stays in the fund, the tax is only due at the end.",
    },
    "withdrawal-plan": {
      capitalAssets:
        "The assets you withdraw from, at the start of the withdrawals.",
      withdrawalAmount:
        "The amount you withdraw in every interval.",
      periodYears:
        "How many years the withdrawals should run.",
      capitalConsumption:
        "Checked, the assets are used up completely over the period. Unchecked, only the interest is withdrawn, the capital is preserved.",
      considerTax:
        "Checked, the estimated tax deduction of the pension gap profile is deducted from the interest rate, as in the overall plan. Unchecked, it is calculated without taxes, as at Finanzfluss.",
      realTerms:
        "Checked, the inflation rate (field below) is deducted from the return in retirement, before the tax deduction, as in the overall plan; capital and withdrawals are then in today's purchasing power. Unchecked, all amounts are nominal, i.e. in future euros, as at Finanzfluss.",
      output:
        "The figure the calculator derives from the other entries. Its input field disappears.",
      interval:
        "How often you withdraw money.",
    },
  },

  children: {
    info: "Birth years of the children you receive child benefit for. The Altersvorsorgedepot grants an allowance for each child as long as child benefit is paid.",
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
    managedInSettings: "Create, rename and delete under",
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
    savesIn: (profiles) => `Saving writes into the active profiles: ${profiles}.`,
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
      cashMonthly: { label: "Savings rate savings account", unit: "€" },
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
      investableMonthly: {
        label: "Available to invest per month",
        unit: "€",
        hint: "Your budget for all calculators; you set the split there.",
      },
      currentCapital: {
        label: "Existing capital",
        unit: "€",
        hint: "Wealth already invested today.",
      },
      expectedReturn: {
        label: "Expected return while saving",
        unit: "% p.a.",
        hint: "After fund costs (TER), before taxes.",
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
      taxableIncomeSavingsPhase: {
        label: "Income while saving",
        unit: "€ / year",
        hint: "Taxable income.",
      },
      taxableIncomeRetirement: {
        label: "Income in retirement",
        unit: "€ / year",
        hint: "Taxable income, without the payouts.",
      },
      exemptionOrder: {
        label: "Saver's allowance (Sparerpauschbetrag)",
        unit: "€ / year",
        hint: "The part still unused for this investment.",
      },
    },
    "av-depot": {
      savingsRateMonthly: { label: "Savings rate per month", unit: "€" },
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
      savingsRateMonthly: { label: "Savings rate per month", unit: "€" },
      costs: {
        label: "Costs per year",
        unit: "% p.a.",
        hint: "On top of the fund costs, e.g. a custody fee.",
      },
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
    plan: {
      nominalView: { label: "Show amounts in future euros" },
      useAvDepot: { label: "Use an AV-Depot" },
      useDepot: { label: "Use an ETF depot" },
    },
    shared: {
      considerInflation: {
        label: "Account for inflation",
        hint: "The pension gap calculator then uses returns after deducting the inflation rate.",
      },
    },
    "av-depot": {},
    "pension-gap": {},
    savings: {
      untilRetirement: { label: "Duration until retirement" },
      realTerms: {
        label: "Account for inflation (today's purchasing power)",
        hint: "Deducts the inflation rate from the interest rate; deposits and result in today's euros.",
      },
      considerTax: { label: "Include taxes" },
      considerPartialExemption: {
        label: "Apply the partial exemption for funds",
      },
    },
    "withdrawal-plan": {
      capitalConsumption: {
        label: "Use up the capital",
        hint: "Unchecked, only the interest is withdrawn, the capital is preserved.",
      },
      considerTax: {
        label: "Account for tax on the returns",
        hint: "Deducts the estimated tax deduction of the pension gap profile from the return.",
      },
      realTerms: {
        label: "Account for inflation (today's purchasing power)",
        hint: "Deducts the inflation rate from the return; all amounts in today's euros.",
      },
    },
  },

  selects: {
    plan: {},
    shared: {
      incomeIntervalSavings: {
        label: "Enter income while saving",
        options: { yearly: "per year", monthly: "per month" },
      },
      incomeIntervalRetirement: {
        label: "Enter income in retirement",
        options: { monthly: "per month", yearly: "per year" },
      },
    },
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
    avAgeRange: "For the Altersvorsorgedepot the age must be between 18 and 67.",
    avRetirementRange:
      "For the Altersvorsorgedepot retirement must be between age 65 and 70.",
    avPayoutMin85:
      "In the Altersvorsorgedepot the payout must run at least until age 85.",
    avSavingsRateRange:
      "At least €120 per year (€10 per month) must go into the Altersvorsorgedepot, at most €13,680.",
    avReturnsPositive:
      "For the Altersvorsorgedepot the returns must be greater than 0%.",
    avCostsBelowReturns: "The costs of the AV-Depot must be below the returns.",
    taxBelow100: "The tax rates must be below 100%.",
    durationPositive: "The duration must be greater than 0.",
    unreachableStartValue:
      "The final capital cannot be reached with these values.",
    unreachableSavingRate:
      "The final capital cannot be reached with these values.",
    unreachableYearlyInterest:
      "Without starting capital and savings rate no interest rate reaches the final capital.",
    unreachableDuration:
      "The final capital can never be reached with these values: without savings rate and interest the capital does not grow.",
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

  budget: {
    hint: (available, planned) => `Available ${available}, planned ${planned}.`,
    free: (amount) => `Still free: ${amount}.`,
    over: (amount) => `${amount} more planned than available.`,
    exact: "The budget is planned exactly.",
    freeHeadline: (amount) => `${amount} per month still free to invest`,
    overHeadline: (amount) => `${amount} per month more planned than available`,
    exactHeadline: "The budget is planned exactly",
    rest: "Rest",
    restTitle: "Enters what is still free of the budget",
    enough: (budget, left) =>
      `Your budget of ${budget} is enough for the required savings rate; ${left} would be left.`,
    short: (budget, missing) =>
      `Your budget of ${budget} is not enough for the required savings rate: ${missing} are missing.`,
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
      pension: "Pension",
      balances: "Today's balance",
      payout: "Payout",
    },
    payoutNote:
      "Belongs to the profile of the withdrawal plan and applies there too.",
    breakdown: {
      title: "Pension from all sources",
      subtitle: "In the middle course, in today's purchasing power and after taxes.",
      subtitleNominal: (prices) =>
        `In the middle course, in euros at retirement (prices then ${prices} above today's) and after taxes.`,
      wealthTitle: "Wealth at retirement",
      avDepot: "Altersvorsorgedepot",
      free: "Free assets (ETF account and savings account)",
      pensionTitle: "Pension per month",
      statePension: "State and other pensions (net)",
      avPension: "Altersvorsorgedepot (net)",
      freePension: "Withdrawal from the free assets (after taxes)",
      freeTax: (before, tax) =>
        `Before taxes ${before}; the tax on the returns costs ${tax}.`,
      total: "Together",
      desired: "Desired pension",
      surplus: (amount) => `${amount} more than desired`,
      shortfall: (amount) => `${amount} less than desired`,
      consumes: (age) => `The free assets are used up by age ${age}.`,
      keeps: "Only the returns of the free assets are withdrawn; they are kept.",
      taxNote: (rate) =>
        `Tax on the returns in the payout phase: estimated tax deduction of ${rate} (from the pension gap profile). The Altersvorsorgedepot is taxed by its own rules.`,
    },
    rateLabels: {
      av: "Savings rate Altersvorsorgedepot",
      depot: "Savings rate ETF account (savings calculator)",
    },
    ratesNote:
      "The rates for the Altersvorsorgedepot and the ETF account belong to the profiles of those calculators and apply there too.",
    sourcesNote:
      "The details of the AV-Depot (costs, taxes, children) come from its calculator.",
    capitalHint:
      "Counts as the balance of the ETF account until you record an actual balance in the history.",
    capitalHintCash:
      "Counts as the balance of the savings account until you record an actual balance in the history.",
    balancesFrom: (date, av, depot, cash) =>
      `Actual balance of ${date}: AV-Depot ${av}, ETF account ${depot}, savings account ${cash}.`,
    changeInHistory: "Change in the history",
    avErrorHint:
      "Or set the savings rate of the Altersvorsorgedepot to 0; the plan then calculates without it.",
    alsoUses: "The plan also uses",
    pensionNote:
      "These values belong to the profile of the pension gap calculator and apply there too.",
    status: {
      increase: "Save more",
      onTrack: "On plan – change nothing",
      room: "Room to spare",
    },
    statusNote: {
      increase: (amount) =>
        `Raise the savings rate by ${amount} per month to reach your confidence level.`,
      onTrack: "Your savings rate fits your confidence level.",
      room: (amount) =>
        `You could save ${amount} less per month and stay at your confidence level.`,
    },
    probability: "Probability of reaching the desired pension",
    guardrails: (lower, target, upper) =>
      `Guardrails ${lower} and ${upper}, target ${target}`,
    currentRate: "Your savings rate",
    requiredRate: "Required savings rate",
    requiredRateNote: (target) => `for ${target} confidence, with the same split`,
    alternativesTitle: "Other ways back on track",
    lowerPension: (amount) => `Lower the desired pension by ${amount} per month`,
    retireLater: (years) => `Retire ${years} later`,
    retireLaterNotEnough: "Retiring later alone is not enough.",
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
    noSnapshot: (capital) =>
      `No actual balance recorded yet – the plan starts with your existing capital of ${capital} in the ETF account.`,
    staleSnapshot: (date) =>
      `Last actual balance of ${date}. Time for the yearly check.`,
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
      "All amounts in today's purchasing power; the inflation rate is always deducted, regardless of the switch in the global values.",
      "The corridor comes from 2,000 random courses of the return with constant fluctuation; AV-Depot and ETF account move together. Extreme events beyond this assumption are not covered.",
      "Savings rates rise with inflation; the contributions to the AV-Depot stay nominally the same and follow its calculator.",
      "The required savings rate is your total savings rate with the same split over the pots. At most €1,140 per month go into the AV-Depot; what exceeds that goes into the ETF account.",
      "From retirement on, the fixed return in retirement after the estimated tax deduction applies. The free assets are used up by the end of the payout or, if the withdrawal plan profile says so, only their returns are withdrawn.",
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
    title: "Global values",
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
      "The selection also applies in the calculators. You can create and change profiles there and under “Global values”.",
    desiredPension: "Desired pension",
    notCalculable: "Cannot be calculated with the selected profiles:",
    resultsHeading: "Results of the calculators",
    resultsNote:
      "Each calculator works on its own, without fluctuation and in future euros; only the pension gap uses today's purchasing power when “Account for inflation” is on. The overall plan above always uses today's purchasing power and your confidence level – its figures are therefore more cautious.",
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
    taxNote: {
      avDepot: "Final wealth before taxes, pensions after taxes.",
      pensionGap:
        "Net pension after the estimated tax deduction; capital and savings rate calculated with returns after taxes.",
      savingsBefore: "All amounts before taxes.",
      savingsDistributing:
        "All amounts after taxes: distributing, the tax reduces the interest as it is paid.",
      savingsAccumulating:
        "All amounts after taxes: accumulating, the tax on the gain is due at the end.",
      withdrawal: "Calculated without taxes.",
      withdrawalTaxed: "Returns calculated after the estimated tax deduction.",
    },
    currencyNote: {
      nominal: "Without taking inflation into account (nominal, future euros).",
      real: "Taking inflation into account (today's purchasing power).",
    },
    capitalAssets: "Portfolio",
  },

  avDepot: {
    sections: {
      personal: "Personal data",
      income: "Income",
      saving: "Saving phase",
      children: "Children",
      payout: "Payout phase",
    },
    presets: {
      minimum: "Minimum",
      subsidyLimit: "Subsidy limit",
      maximum: "Maximum",
    },
    retirementAgeHint: "Between 65 and 70.",
    savingsRateHint: (perYear) =>
      `${perYear}. Subsidised up to €150 per month, possible up to €1,140.`,
    costsAboveCap: (cap) =>
      `Above the cost cap: for the standard depot the effective costs are capped by law at ${cap} per year. These costs alone, without the fund costs, are already above it. The cap does not apply to a freely composed depot; there the TER of the chosen ETFs comes on top of these costs, unless it is already in the expected return.`,
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
    realNote: "All amounts in today's purchasing power.",
    endValueMinimum: {
      startValue: (amount) => `Even without starting capital you reach ${amount}.`,
      savingRate: (amount) => `Even without a savings rate you reach ${amount}.`,
      yearlyInterest: (amount) =>
        `Even without interest you get to ${amount}: that is what you deposit in total.`,
      duration: (amount) => `${amount} is already there as starting capital.`,
    },
    alreadyReached: {
      startValue: (target, reached) =>
        `You reach your goal of ${target} even without starting capital: savings rate and interest take you to ${reached}.`,
      savingRate: (target, reached) =>
        `You reach your goal of ${target} even without a savings rate: your starting capital grows to ${reached}.`,
      yearlyInterest: (target, reached) =>
        `You reach your goal of ${target} even without interest: your deposits alone add up to ${reached}.`,
      duration: (target, reached) =>
        `Your goal of ${target} is already reached: your starting capital is ${reached}.`,
    },
    durationUntilRetirement: (retirementAge, age) =>
      `Retirement at ${retirementAge} − age ${age}, from the shared values.`,
    chartTitle: "Capital per year",
    chartSubtitle: "Deposits including starting capital and the interest earned on them",
    afterTax: " after taxes",
    chartAria: "Column chart: capital per year, split into deposits and interest",
    totalDeposits: "Total deposits",
    assumptions: [
      "Deposits are made at the beginning of the saving interval; interest is credited in the chosen interest interval and compounds.",
      "Distributing: the tax reduces the interest continuously. Accumulating: the tax on the whole gain is due at the end; the chart shows the balance after taxes, as if you sold at the end of each year.",
      "The partial exemption makes the chosen share of the returns tax-free; a saver's allowance is not included.",
      "With “Account for inflation” the inflation rate is deducted from the interest rate; the deposits stay the same in today's purchasing power, the tax is calculated on the real interest.",
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
    interestAdjusted: (rate, inflation, tax) =>
      `Calculated with ${rate} p. a.: return in retirement${inflation ? ", minus inflation" : ""}${tax ? ", after the estimated tax deduction" : ""}.`,
    realNote: "All amounts in today's purchasing power.",
    fromPlan: {
      button: "From overall plan",
      hint: "Takes over the free assets at retirement (ETF account and savings account, middle course, in today's purchasing power) and the payout period and switches taxes and purchasing power on. The values only apply here until you save them.",
      done: (capital, years) => `Taken over: ${capital} over ${years}.`,
      unavailable:
        "The overall plan cannot be calculated with the selected profiles.",
    },
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
      "By default taxes and inflation are not included, as at Finanzfluss. With the switches “Account for tax on the returns” and “Account for inflation” the calculator works like the overall plan, with small deviations from the calculation conventions (withdrawal at the end of the interval, rate converted to the interval).",
      "Formulas derived from the results of the Finanzfluss calculator. Not tax or investment advice.",
    ],
  },
};
