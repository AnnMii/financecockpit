import type { AuthError } from "@/lib/auth/config";
import type { CalculationError } from "@/lib/calculators/errors";
import type { CalculatorInfo } from "@/lib/calculators/registry";
import type {
  NumberTexts,
  ProfileError,
  ScopeLabels,
  SelectTexts,
  ToggleTexts,
} from "@/lib/settings/labels";

/**
 * All German texts of the interface. en.ts has the same shape; TypeScript
 * reports a text that is missing there. Texts with numbers or names in them
 * are functions, and receive amounts already formatted for the language.
 */

interface CalculatorTexts {
  /** Short name for navigation and cards. */
  title: string;
  /** Heading of the calculator's page. */
  pageTitle: string;
  description: string;
  /** First sentences on the calculator's page. */
  intro: string;
}

const calculators: Record<CalculatorInfo["id"], CalculatorTexts> = {
  "av-depot": {
    title: "Altersvorsorgedepot",
    pageTitle: "Altersvorsorgedepot-Rechner",
    description:
      "Gefördertes AV-Depot gegen einen normalen ETF-Sparplan: Endvermögen, Förderung und Netto-Rente.",
    intro:
      "Vergleicht das staatlich geförderte Altersvorsorgedepot mit einem normalen ETF-Sparplan bei gleichen Einzahlungen.",
  },
  "pension-gap": {
    title: "Rentenlücke",
    pageTitle: "Rentenlückenrechner",
    description:
      "Lücke zwischen erwarteter Rente und Wunschrente – und welches Kapital und welche Sparrate sie schließen.",
    intro:
      "Zeigt die Lücke zwischen deiner erwarteten Nettorente und deiner Wunschrente – und mit welchem Kapital und welcher Sparrate du sie schließt.",
  },
  savings: {
    title: "Sparrechner",
    pageTitle: "Sparrechner",
    description:
      "Endkapital, Anfangskapital, Zinssatz, Laufzeit oder Sparrate eines Sparplans berechnen, auf Wunsch mit Steuern.",
    intro:
      "Berechnet aus Anfangskapital, Sparrate, Zinssatz, Laufzeit und Endkapital die jeweils fehlende Größe.",
  },
  "withdrawal-plan": {
    title: "Entnahmeplan",
    pageTitle: "Entnahmeplan",
    description:
      "Wie viel sich aus einem Vermögen entnehmen lässt, wie lange es reicht oder wie groß es sein muss.",
    intro:
      "Berechnet, wie viel du regelmäßig aus einem Vermögen entnehmen kannst, wie lange es reicht oder wie groß es sein muss.",
  },
};

const scopes: ScopeLabels = {
  plan: "Gesamtplan",
  shared: "Globale Werte",
  "av-depot": "Altersvorsorgedepot",
  "pension-gap": "Rentenlücke",
  savings: "Sparrechner",
  "withdrawal-plan": "Entnahmeplan",
};

const numbers: NumberTexts = {
  plan: {
    avDepotShare: {
      label: "Anteil Altersvorsorgedepot",
      unit: "%",
      hint: "Von der Sparrate; der Rest nach Tagesgeld fließt ins ETF-Depot.",
    },
    cashShare: { label: "Anteil Tagesgeld", unit: "%" },
    cashReturn: { label: "Zins Tagesgeld", unit: "% p. a." },
    depotVolatility: {
      label: "Schwankung Depot",
      unit: "% p. a.",
      hint: "Rund 15 % für einen weltweiten Aktien-ETF.",
    },
    cashVolatility: { label: "Schwankung Tagesgeld", unit: "% p. a." },
    confidenceTarget: {
      label: "Sicherheitsniveau",
      unit: "%",
      hint: "In so vielen von 100 möglichen Verläufen soll die Wunschrente erreicht werden.",
    },
    lowerGuardrail: {
      label: "Untere Leitplanke",
      unit: "%",
      hint: "Sinkt die Wahrscheinlichkeit darunter: mehr sparen.",
    },
    upperGuardrail: {
      label: "Obere Leitplanke",
      unit: "%",
      hint: "Steigt sie darüber: Du darfst reduzieren.",
    },
  },
  shared: {
    age: { label: "Alter", unit: "Jahre" },
    retirementAge: { label: "Renteneintritt mit", unit: "Jahren" },
    payoutUntilAge: {
      label: "Auszahlung bis Alter",
      unit: "Jahre",
      hint: "Bis zu diesem Alter soll das Geld reichen.",
    },
    savingsRateMonthly: { label: "Sparrate pro Monat", unit: "€" },
    currentCapital: {
      label: "Vorhandenes Kapital",
      unit: "€",
      hint: "Heute bereits angelegtes Vermögen.",
    },
    expectedReturn: {
      label: "Erwartete Rendite MSCI World",
      unit: "% p. a.",
      hint: "In der Sparphase, nach Fondskosten (TER), vor Steuern.",
    },
    retirementReturn: {
      label: "Rendite im Ruhestand",
      unit: "% p. a.",
      hint: "Erwartete Rendite während der Auszahlung.",
    },
    inflationRate: { label: "Inflationsrate", unit: "% p. a." },
    capitalGainsTax: {
      label: "Kapitalertragsteuer",
      unit: "%",
      hint: "25 % plus Solidaritätszuschlag; mit Kirchensteuer höher.",
    },
    zveSavingsPhase: {
      label: "Einkommen in der Ansparphase",
      unit: "€ / Jahr",
      hint: "Zu versteuerndes Einkommen pro Jahr.",
    },
    zveRetirement: {
      label: "Einkommen im Ruhestand",
      unit: "€ / Jahr",
      hint: "Zu versteuerndes Einkommen pro Jahr, ohne die Auszahlungen.",
    },
    exemptionOrder: {
      label: "Sparerpauschbetrag",
      unit: "€ / Jahr",
      hint: "Der Teil, der für diese Geldanlage noch frei ist.",
    },
  },
  "av-depot": {
    avDepotCosts: {
      label: "Kosten des AV-Depots",
      unit: "% p. a.",
      hint: "Zusätzlich zu den Fondskosten, z. B. Depotgebühr.",
    },
    baseRate: {
      label: "Basiszins",
      unit: "%",
      hint: "Für die Vorabpauschale im normalen Depot.",
    },
    oneTimePayout: {
      label: "Einmalauszahlung bei Renteneintritt",
      unit: "%",
      hint: "Bis zu 30 % des Kapitals, brutto.",
    },
  },
  "pension-gap": {
    statePension: {
      label: "Gesetzliche Rente",
      unit: "€ / Monat",
      hint: "Laut Renteninformation der Deutschen Rentenversicherung.",
    },
    companyPension: { label: "Betriebliche Altersvorsorge", unit: "€ / Monat" },
    privatePension: {
      label: "Private Renten-/Lebensversicherung",
      unit: "€ / Monat",
    },
    riesterPension: { label: "Riester-/Rürup-Rente", unit: "€ / Monat" },
    taxPrediction: {
      label: "Geschätzter Steuerabzug",
      unit: "%",
      hint: "Auf die Rente oberhalb des Grundfreibetrags und auf Zinsen im Ruhestand.",
    },
    yearlyTaxFreeAmount: {
      label: "Steuerlicher Grundfreibetrag",
      unit: "€ / Jahr",
    },
    desiredPension: {
      label: "Monatliche Wunschrente",
      unit: "€ / Monat",
      hint: "Netto, was du im Ruhestand zur Verfügung haben möchtest.",
    },
  },
  savings: {
    durationYears: { label: "Laufzeit", unit: "Jahre" },
    endValue: { label: "Endkapital", unit: "€" },
    partialExemption: {
      label: "Teilfreistellungsquote",
      unit: "%",
      hint: "30 % bei Aktienfonds, 15 % bei Mischfonds.",
    },
  },
  "withdrawal-plan": {
    capitalAssets: { label: "Anlagevermögen", unit: "€" },
    withdrawalAmount: { label: "Entnahmebetrag", unit: "€" },
    periodYears: { label: "Entnahmezeitraum", unit: "Jahre" },
  },
};

const toggles: ToggleTexts = {
  plan: {},
  shared: {
    considerInflation: {
      label: "Inflation berücksichtigen",
      hint: "Rechnet mit Renditen nach Abzug der Inflationsrate.",
    },
  },
  "av-depot": {},
  "pension-gap": {},
  savings: {
    untilRetirement: { label: "Laufzeit bis Renteneintritt" },
    considerTax: { label: "Steuern mitberechnen" },
    considerPartialExemption: {
      label: "Teilfreistellung bei Fonds berücksichtigen",
    },
  },
  "withdrawal-plan": {
    capitalConsumption: {
      label: "Kapitalverzehr",
      hint: "Aus: Es werden nur die Zinsen entnommen, das Kapital bleibt erhalten.",
    },
  },
};

const selects: SelectTexts = {
  plan: {},
  shared: {},
  "av-depot": {
    taxSavingsMode: {
      label: "Verwendung der Steuerersparnis",
      options: {
        avDepot: "Ins AV-Depot einzahlen",
        secondaryDepot: "In einem separaten Depot anlegen",
        consume: "Konsumieren",
      },
    },
  },
  "pension-gap": {},
  savings: {
    output: {
      label: "Was möchtest du berechnen?",
      options: {
        endValue: "Endkapital",
        startValue: "Anfangskapital",
        yearlyInterest: "Zinssatz",
        duration: "Laufzeit",
        savingRate: "Sparrate",
      },
    },
    saveInterval: {
      label: "Sparintervall",
      options: { monthly: "monatlich", yearly: "jährlich" },
    },
    interestInterval: {
      label: "Zinsintervall",
      options: {
        monthly: "monatlich",
        quarterly: "vierteljährlich",
        yearly: "jährlich",
      },
    },
    distributionType: {
      label: "Ausschüttungsart",
      options: { distributing: "ausschüttend", accumulating: "thesaurierend" },
    },
  },
  "withdrawal-plan": {
    output: {
      label: "Was möchtest du berechnen?",
      options: {
        amount: "Entnahmebetrag",
        period: "Entnahmezeitraum",
        capital: "Anlagevermögen",
      },
    },
    interval: {
      label: "Entnahmeintervall",
      options: {
        monthly: "monatlich",
        quarterly: "vierteljährlich",
        biannual: "halbjährlich",
        yearly: "jährlich",
      },
    },
  },
};

const calcErrors: Record<CalculationError, string> = {
  ageBeforeRetirement: "Das Alter muss unter dem Renteneintrittsalter liegen.",
  payoutAfterRetirement: "Die Auszahlung muss nach dem Renteneintritt enden.",
  avAgeRange: "Das Alter muss zwischen 18 und 67 Jahren liegen.",
  avRetirementRange: "Der Renteneintritt muss zwischen 65 und 70 Jahren liegen.",
  avPayoutMin85:
    "Im Altersvorsorgedepot muss die Auszahlung mindestens bis zum Alter 85 laufen.",
  avSavingsRateRange:
    "Die Sparrate muss zwischen 120 € und 13.680 € pro Jahr liegen (10 € bis 1.140 € pro Monat).",
  avReturnsPositive: "Die Renditen müssen größer als 0 % sein.",
  avCostsBelowReturns: "Die Kosten des AV-Depots müssen unter den Renditen liegen.",
  taxBelow100: "Die Steuersätze müssen unter 100 % liegen.",
  durationPositive: "Die Laufzeit muss größer als 0 sein.",
  unreachableStartValue:
    "Das Endkapital wird schon ohne Anfangskapital erreicht oder übertroffen.",
  unreachableSavingRate:
    "Das Endkapital wird schon ohne Sparrate erreicht oder übertroffen.",
  unreachableYearlyInterest:
    "Mit diesen Einzahlungen lässt sich das Endkapital mit keinem Zinssatz ab 0 % genau erreichen.",
  unreachableDuration:
    "Das Endkapital lässt sich mit diesen Werten nicht erreichen, oder es ist schon erreicht.",
  interestAboveMinus100: "Der Zinssatz muss über −100 % liegen.",
  capitalPositive: "Das Anlagevermögen muss größer als 0 sein.",
  amountPositive: "Der Entnahmebetrag muss größer als 0 sein.",
  needsInterest:
    "Ohne Kapitalverzehr braucht es einen positiven Zinssatz: Entnommen werden nur die Zinsen.",
  planSharesOver100:
    "Die Anteile für AV-Depot und Tagesgeld dürfen zusammen höchstens 100 % ergeben.",
  planGuardrailOrder:
    "Die untere Leitplanke muss unter, die obere über dem Sicherheitsniveau liegen.",
};

const profileErrors: Record<ProfileError, string> = {
  signedOut: "Bitte neu anmelden.",
  nameLength: "Der Name braucht 1 bis 40 Zeichen.",
  tooMany: "Mehr als 20 Profile sind nicht möglich.",
  duplicateName: "Ein Profil mit diesem Namen gibt es schon.",
  notFound: "Das Profil gibt es nicht mehr.",
  lastProfile: "Das letzte Profil kann nicht gelöscht werden.",
  failed: "Das hat nicht geklappt. Bitte noch einmal versuchen.",
};

const authErrors: Record<AuthError, string> = {
  missingCredentials: "Bitte E-Mail-Adresse und Passwort eingeben.",
  wrongCredentials: "E-Mail-Adresse oder Passwort ist falsch.",
  registrationClosed: "Die Registrierung ist deaktiviert.",
  invalidEmail: "Bitte eine gültige E-Mail-Adresse eingeben.",
  passwordTooShort: "Das Passwort braucht mindestens 10 Zeichen.",
  passwordMismatch: "Die Passwörter stimmen nicht überein.",
  emailTaken: "Für diese E-Mail-Adresse gibt es schon ein Konto.",
};

export const de = {
  appName: "Finanzcockpit",
  appDescription: "Persönliches Finanzcockpit mit Kennzahlen und Rechnern.",
  language: "Sprache",

  nav: {
    main: "Hauptnavigation",
    cockpit: "Cockpit",
    plan: "Gesamtplan",
    history: "Verlauf",
    planning: "Planung",
    calculators: "Rechner",
    account: "Konto",
    settings: "Einstellungen",
    logout: "Abmelden",
  },

  saveState: {
    idle: "",
    saving: "Speichert …",
    saved: "Gespeichert",
    error: "Speichern fehlgeschlagen",
  },

  auth: {
    loginTitle: "Anmelden",
    registerTitle: "Konto anlegen",
    email: "E-Mail-Adresse",
    password: "Passwort",
    passwordHint: "Mindestens 10 Zeichen.",
    passwordRepeat: "Passwort wiederholen",
    loginButton: "Anmelden",
    registerButton: "Konto anlegen",
    noAccount: "Noch kein Konto?",
    registerLink: "Registrieren",
    hasAccount: "Schon registriert?",
    loginLink: "Anmelden",
    errors: authErrors,
  },

  common: {
    shared: "geteilt",
    sharedTitle: "Geteilte Einstellung – gilt für alle Rechner",
    changed: "geändert",
    changedTitle: "Lokal geändert – noch nicht gespeichert",
    numberRange: (integer: boolean, min: string, max: string) =>
      `Bitte ${integer ? "eine ganze Zahl" : "einen Wert"} zwischen ${min} und ${max} eingeben.`,
    cannotCalculate: "Mit diesen Eingaben kann nicht gerechnet werden",
    localChangesHint: "Änderungen gelten nur hier, bis du sie speicherst.",
    assumptions: "Annahmen",
    yearlyTable: "Jahreswerte als Tabelle",
    chartKeyboardHint: "Mit den Pfeiltasten durch die Jahre blättern.",
    perYearEquals: (amount: string) => `= ${amount} pro Jahr`,
    age: "Alter",
    ageN: (age: number) => `Alter ${age}`,
    year: "Jahr",
    afterYears: (years: string) => `Nach ${years}`,
    overYears: (years: string) => `über ${years}`,
    capital: "Kapital",
    wealth: "Vermögen",
    deposits: "Einzahlungen",
    interest: "Zinsen",
    endValue: "Endkapital",
    perMonth: "pro Monat",
    perQuarter: "pro Quartal",
    perHalfYear: "pro Halbjahr",
    perYear: "pro Jahr",
    endless: "endlos",
    noAdvice: "Keine Steuer- oder Anlageberatung.",
  },

  children: {
    label: "Kinder",
    none: "Keine Kinder eingetragen.",
    birthYear: (n: number) => `Geburtsjahr Kind ${n}`,
    remove: "Entfernen",
    removeAria: (n: number) => `Kind ${n} entfernen`,
    add: "Kind hinzufügen",
  },

  profiles: {
    heading: "Profile",
    ownValues: "Werte dieses Rechners",
    managedInSettings: "Anlegen, umbenennen und löschen in den",
    create: "Neu …",
    rename: "Umbenennen",
    delete: "Löschen",
    confirmCreate: "Anlegen",
    cancel: "Abbrechen",
    namePlaceholder: "Name des Profils",
    newNameAria: "Name des neuen Profils",
    renameAria: "Neuer Name",
    takesVisibleValues: "Übernimmt die Werte, die du gerade siehst.",
    confirmDelete: (name: string) => `Profil „${name}“ endgültig löschen?`,
    errors: profileErrors,
  },

  draft: {
    changes: (count: number) =>
      count === 1 ? "1 lokale Änderung" : `${count} lokale Änderungen`,
    notSaved: "– nur in dieser Ansicht, nicht gespeichert.",
    saveSharedIn: "Globale Werte speichern in",
    active: "(aktiv)",
    newProfile: "Neues Profil …",
    newNamePlaceholder: "Name des neuen Profils",
    newProfileHint:
      "Übernimmt alle globalen Werte, die du gerade siehst, und wird das aktive Profil.",
    otherProfileHint: (name: string) =>
      `Nur die geänderten Werte werden in „${name}“ geschrieben; es wird danach das aktive Profil.`,
    save: "Speichern",
    reset: "Zurücksetzen",
  },

  calculators,
  scopes,
  numbers,
  toggles,
  selects,
  calcErrors,

  plan: {
    pageTitle: "Gesamtplan",
    intro:
      "Ein Plan über alle Töpfe: Reicht deine Sparrate, um die Wunschrente mit der gewünschten Sicherheit zu erreichen? Alle Beträge in heutiger Kaufkraft.",
    historyTitle: "Verlauf",
    historyIntro:
      "Erfasse einmal im Jahr, was tatsächlich in deinen Töpfen liegt, und prüfe es gegen einen eingefrorenen Plan.",
    pots: { av: "Altersvorsorgedepot", depot: "ETF-Depot", cash: "Tagesgeld" },
    sections: {
      split: "Aufteilung der Sparrate",
      returns: "Renditen und Inflation",
      volatility: "Schwankung",
      confidence: "Sicherheit",
      time: "Zeitraum",
    },
    splitSummary: (av: string, depot: string, cash: string) =>
      `Pro Monat: AV-Depot ${av}, ETF-Depot ${depot}, Tagesgeld ${cash}.`,
    sourcesNote:
      "Rentenansprüche und Wunschrente kommen aus dem Rentenlücke-Rechner, die Details des AV-Depots aus dessen Rechner, die heutigen Stände aus dem Verlauf.",
    status: {
      increase: "Mehr sparen",
      onTrack: "Im Plan – nichts ändern",
      room: "Spielraum",
    },
    statusNote: {
      increase: (amount: string) =>
        `Erhöhe die Sparrate um ${amount} pro Monat, um dein Sicherheitsniveau zu erreichen.`,
      onTrack: "Die Wahrscheinlichkeit liegt zwischen deinen Leitplanken.",
      room: (amount: string) =>
        `Du könntest ${amount} pro Monat weniger sparen und bliebest auf deinem Sicherheitsniveau.`,
    },
    probability: "Wahrscheinlichkeit, die Wunschrente zu erreichen",
    guardrails: (lower: string, target: string, upper: string) =>
      `Leitplanken ${lower} und ${upper}, Ziel ${target}`,
    currentRate: "Deine Sparrate",
    requiredRate: "Nötige Sparrate",
    requiredRateNote: (target: string) => `für ${target} Sicherheit`,
    alternativesTitle: "Andere Wege zurück auf Kurs",
    lowerPension: (amount: string) =>
      `Wunschrente um ${amount} pro Monat senken`,
    retireLater: (years: string) => `${years} später in Rente gehen`,
    retireLaterNotEnough:
      "Später in Rente gehen reicht allein nicht, auch nicht fünf Jahre.",
    corridorTitle: "Vermögen bis zum Renteneintritt",
    corridorSubtitle:
      "In heutiger Kaufkraft. Der Bereich zeigt die mittleren 80 % der möglichen Verläufe, die Linie den mittleren.",
    corridorAria:
      "Liniendiagramm: möglicher Bereich des Vermögens je Alter bis zum Renteneintritt",
    forecast: "Aktuelle Prognose",
    range: "Bereich",
    snapshots: "Ist-Stände",
    snapshotOn: (date: string) => `Stand vom ${date}`,
    frozen: (label: string) => `Eingefroren: ${label}`,
    wealthAtRetirement: "Vermögen bei Renteneintritt",
    pensionPerMonth: "Rente pro Monat",
    pessimistic: "Pessimistisch",
    expected: "Mittlerer Verlauf",
    optimistic: "Optimistisch",
    freezeTitle: "Plan festschreiben",
    freezeIntro:
      "Friert alle Annahmen und diesen Korridor zum heutigen Tag ein. Später prüfst du deine Ist-Stände dagegen; der eingefrorene Plan ändert sich nie mehr.",
    freezeLabel: "Bezeichnung",
    freezeDefaultLabel: (year: number) => `Plan ${year}`,
    freezeButton: "Festschreiben",
    versionsTitle: "Eingefrorene Pläne",
    noVersions: "Noch kein Plan eingefroren.",
    compareWith: "Vergleichen mit",
    noComparison: "Kein Vergleich",
    delete: "Löschen",
    saveFailed: "Das hat nicht geklappt. Bitte noch einmal versuchen.",
    noSnapshot:
      "Noch kein Ist-Stand erfasst – der Plan startet bei 0 € in allen Töpfen.",
    staleSnapshot: (date: string) =>
      `Letzter Ist-Stand vom ${date}. Zeit für den jährlichen Abgleich.`,
    balancesFrom: (date: string) => `Stände vom ${date}.`,
    recordSnapshot: "Stand erfassen",
    openPlan: "Zum Plan",
    openHistory: "Zum Verlauf",
    thenNow: {
      title: "Damals geplant und aus heutiger Sicht",
      then: "Damals",
      now: "Heute",
      wealth: "Vermögen bei Renteneintritt (mittlerer Verlauf)",
      pension: "Rente pro Monat (mittlerer Verlauf)",
      probability: "Wahrscheinlichkeit",
      requiredRate: "Nötige Sparrate",
    },
    history: {
      formTitle: "Ist-Stand erfassen",
      date: "Stichtag",
      valuesTitle: "Wert je Topf am Stichtag",
      contributionsTitle: "Eingezahlt seit dem letzten Stand",
      inflation: "Inflation seit dem letzten Stand",
      inflationHint:
        "Optional, in % pro Jahr. Leer: Es gilt die Annahme des Plans.",
      note: "Notiz",
      save: "Stand speichern",
      listTitle: "Erfasste Stände",
      empty: "Noch keine Stände erfasst.",
      total: "Gesamt",
      contributions: "Eingezahlt",
      analysisTitle: "Abweichung vom eingefrorenen Plan",
      analysisEmpty:
        "Dafür brauchst du einen eingefrorenen Plan und einen späteren Ist-Stand.",
      analysisFor: (snapshot: string, plan: string) =>
        `Stand vom ${snapshot} gegenüber „${plan}“, in dessen Kaufkraft.`,
      planned: "Geplant für diesen Stichtag",
      actual: "Tatsächlich",
      deviation: "Abweichung",
      contributionEffect: "davon Einzahlungen",
      marketEffect: "davon Markt und Sonstiges",
      actualReturn: "Erzielte Rendite pro Jahr",
      assumedReturn: "Angenommene Rendite pro Jahr",
      position: {
        below: "Unter dem Korridor",
        inside: "Im Korridor",
        above: "Über dem Korridor",
      },
      assumptionsTitle: "Wirkung geänderter Annahmen",
      assumptionsNote: (frozen: string, current: string) =>
        `Nötige Sparrate ab dem heutigen Stand: mit den Annahmen von damals ${frozen}, mit den heutigen ${current}.`,
      rateChartTitle: "Nötige und tatsächliche Sparrate je Stichtag",
      rateChartAria:
        "Säulendiagramm: nötige Sparrate je Stichtag mit der tatsächlichen Sparrate als Linie",
      requiredSeries: "Nötige Sparrate",
      actualSeries: "Tatsächliche Sparrate",
    },
    assumptions: [
      "Alle Beträge in heutiger Kaufkraft; die Inflationsrate wird immer abgezogen, unabhängig vom Schalter in den Einstellungen.",
      "Der Korridor entsteht aus 2.000 zufälligen Verläufen der Rendite mit gleichbleibender Schwankung; AV-Depot und ETF-Depot bewegen sich gemeinsam. Extremereignisse jenseits dieser Annahme sind nicht abgebildet.",
      "Sparraten steigen mit der Inflation; die Einzahlungen ins AV-Depot bleiben nominal gleich und folgen dessen Rechner.",
      "Die nötige Sparrate verändert nur den Anteil des ETF-Depots; AV-Depot und Tagesgeld bleiben wie eingestellt.",
      "Ab Renteneintritt wird mit der festen Rendite im Ruhestand gerechnet und das Kapital bis zum Ende der Auszahlung aufgebraucht.",
      "Der Korridor ist ein Modell, keine Garantie. Keine Steuer- oder Anlageberatung.",
    ],
  },

  life: {
    button: "Lebenserwartung in Deutschland anzeigen",
    title: "Wie alt werden Menschen in Deutschland?",
    intro: (age: number) =>
      `Für Menschen, die ${age} Jahre alt geworden sind (dein Renteneintritt). Die Kurven zeigen, welcher Anteil von ihnen in welchem Alter stirbt.`,
    male: "Männer",
    female: "Frauen",
    expectedAge: "Erwartetes Alter",
    mostCommonAge: "Häufigstes Sterbealter",
    sigma: "Streuung σ",
    band: (sigmas: number) => `±${sigmas}σ-Bereich (Anteil)`,
    olderThan: (age: number) => `werden älter als ${age}`,
    payoutMarker: (age: number) => `Auszahlung bis ${age}`,
    chartAria: (men: number, women: number) =>
      `Grafik: Anteil der Menschen, die in einem bestimmten Alter sterben. Am häufigsten sterben Männer mit ${men} und Frauen mit ${women} Jahren; danach fällt die Kurve steil ab.`,
    shareAxis: "Anteil, der in diesem Lebensjahr stirbt",
    outliveLegend: (age: number, men: string, women: string) =>
      `Fläche: leben länger als ${age} (Männer ${men}, Frauen ${women})`,
    hover: (age: number, men: string, women: string) =>
      `${men} der Männer und ${women} der Frauen werden älter als ${age}.`,
    hoverHint: "Fahre über die Grafik, um abzulesen, wie viele ein Alter überleben.",
    planning: (age: number, men: string, women: string) =>
      `Für deinen Plan: Mit „Auszahlung bis ${age}“ erleben ${men} der Männer und ${women} der Frauen dieses Alter – ihr Geld wäre dann aufgebraucht, während sie noch leben.`,
    sigmaTitle: "Was bedeutet die 3σ-Umgebung – und warum sagt sie hier wenig?",
    sigmaText:
      "σ (Sigma) ist die Standardabweichung: Sie misst, wie weit die einzelnen Sterbealter um den Mittelwert streuen. Bei einer symmetrischen Glockenkurve (Normalverteilung) liegen 68,3 % der Werte innerhalb von ±1σ um den Mittelwert, 95,4 % innerhalb von ±2σ und 99,7 % innerhalb von ±3σ.",
    sigmaCaveat:
      "Das Sterbealter ist aber nicht symmetrisch verteilt: Die Kurve steigt langsam an, hat ihren Gipfel erst oberhalb des Mittelwerts und fällt danach steil ab. Jede σ-Stufe ist gleich breit, enthält aber sehr unterschiedlich viele Menschen – im äußersten Abschnitt bis +3σ stirbt kaum noch jemand, und nach unten endet der Bereich beim bereits erreichten Alter. Die Anteile in der Tabelle sind deshalb aus der Sterbetafel gezählt. Für die Planung sagen die Zeilen „werden älter als …“ mehr als die σ-Bereiche.",
    source: "Quelle",
    sourceText: (period: string, published: string) =>
      `Statistisches Bundesamt (Destatis), Statistischer Bericht „Sterbetafeln ${period}“, erschienen am ${published}.`,
    ownCalculation:
      "Erwartetes Alter, Streuung und Anteile sind daraus selbst berechnet.",
    periodNote:
      "Die Tafel beschreibt die heutige Sterblichkeit; steigt die Lebenserwartung weiter, werden Jüngere im Mittel älter als hier gezeigt.",
  },

  settingsPage: {
    title: "Einstellungen",
    intro:
      "Diese Werte teilen sich die Rechner. Änderungen gelten erst, wenn du sie unten rechts speicherst.",
    profileLabel: "Profil der globalen Werte",
    personal: "Persönliche Daten",
    saving: "Sparen und Anlegen",
    inflation: "Inflation",
    incomeAndTax: "Einkommen und Steuern",
  },

  dashboard: {
    title: "Cockpit",
    profilesHint:
      "Die Auswahl gilt auch in den Rechnern. Profile anlegen und ändern kannst du dort und in den Einstellungen.",
    retirementHeading: "Ruhestand im Gesamtbild",
    remainingGap: "Verbleibende Rentenlücke pro Monat",
    gapCovered: "Rente und Altersvorsorgedepot decken deine Wunschrente.",
    gapAfter: "Nach erwarteter Rente und Altersvorsorgedepot.",
    shareBarLabel: "Wunschrente pro Monat",
    netPension: "Nettorente",
    avDepot: "Altersvorsorgedepot",
    remaining: "Verbleibende Lücke",
    desiredPension: "Wunschrente",
    capitalForGap: "Nötiges Kapital für die Lücke",
    extraSavingsRate: "Zusätzliche Sparrate pro Monat",
    noteWithAvDepot: (savingsRate: string, untilAge: number) =>
      `Die zusätzliche Sparrate kommt zu den ${savingsRate} pro Monat hinzu, die in dieser Rechnung ins Altersvorsorgedepot fließen. Dessen Rente läuft bis Alter ${untilAge}; das Kapital für die Lücke ist mit Kapitalverzehr gerechnet.`,
    noteWithoutAvDepot:
      "Das Altersvorsorgedepot ist mit den gewählten Profilen nicht berechenbar und hier nicht eingerechnet.",
    nominal: "Alle Beträge nominal.",
    notCalculable: "Mit den gewählten Profilen nicht berechenbar:",
    resultsHeading: "Ergebnisse der Rechner",
    openCalculator: "Zum Rechner",
    searched: "Gesucht",
    searchedFor: (what: string) => `Gesucht: ${what}`,
    avFinalCapital: (age: number) => `Endvermögen mit ${age}`,
    netPensionPerMonth: "Netto-Rente pro Monat",
    etfComparison: "Zum Vergleich: ETF-Sparplan pro Monat",
    totalSubsidies: "Förderung gesamt",
    gapPerMonth: "Rentenlücke pro Monat",
    netPensionMonthly: "Nettorente pro Monat",
    capitalWithConsumption: "Nötiges Kapital (mit Kapitalverzehr)",
    savingsRateNeeded: "Nötige Sparrate pro Monat",
    duration: "Laufzeit",
    totalDeposits: "Einzahlungen gesamt",
    withdrawalAmount: (perInterval: string) => `Entnahmebetrag ${perInterval}`,
    withdrawalPeriod: "Entnahmezeitraum",
    capitalAssets: "Anlagevermögen",
  },

  avDepot: {
    sections: {
      personal: "Persönliche Daten",
      income: "Einkommen",
      saving: "Ansparphase",
      children: "Kinder",
      payout: "Auszahlphase",
      advanced: "Erweitert",
    },
    retirementAgeHint: "Zwischen 65 und 70 Jahren.",
    savingsRateHint: (perYear: string) =>
      `${perYear}. Gefördert bis 150 € pro Monat, möglich bis 1.140 €.`,
    payoutUntilHint: "Im Altersvorsorgedepot mindestens bis 85.",
    name: "Altersvorsorgedepot",
    etfPlan: "ETF-Sparplan",
    series: { own: "Einzahlungen", subsidies: "Förderung", gains: "Wertzuwachs" },
    heroLabel: (age: number) =>
      `Endvermögen im Altersvorsorgedepot mit ${age} Jahren`,
    heroNote:
      "Inklusive Förderung und Rendite, nach Kosten, vor Steuern. Ein ETF-Sparplan mit denselben Einzahlungen käme auf",
    netPensionPerMonth: "Netto-Rente pro Monat",
    avUntilAge: (age: number) => `Altersvorsorgedepot, bis Alter ${age}`,
    etfSamePlan: "ETF-Sparplan, gleicher Auszahlplan",
    totalSubsidies: "Förderung gesamt",
    subsidiesBreakdown: (allowances: string, taxSavings: string) =>
      `${allowances} Zulagen + ${taxSavings} Steuerersparnis`,
    chartTitle: "Vermögen in der Ansparphase",
    chartSubtitle: "Stand am Jahresende nach Alter, im Altersvorsorgedepot",
    chartSubtitleSecondary: " inklusive separatem Depot",
    compareToggle: "Mit ETF-Sparplan vergleichen",
    chartAria:
      "Säulendiagramm: Vermögen im Altersvorsorgedepot pro Jahr, aufgeteilt in Einzahlungen, Förderung und Wertzuwachs",
    chartColumnTitle: (age: number, year: number) => `Alter ${age} · ${year}`,
    allowances: "Zulagen",
    investedTaxSavings: "Investierte Steuerersparnis",
    taxSavings: "Steuerersparnis",
    consumedNote: (amount: string) =>
      `${amount} Steuerersparnis werden nicht investiert und sind im Vermögen nicht enthalten.`,
    monthlyTitle: "Monatliche Netto-Rente",
    monthlySubtitle: (from: number, until: number) =>
      `Auszahlung von ${from} bis ${until}, nach Steuern, ab dem zweiten Jahr.`,
    payoutTitle: "Auszahlung im Detail",
    payoutSubtitle: "Pro Jahr; das 1. Jahr enthält die Einmalauszahlung.",
    payout: "Auszahlung",
    gross: "Brutto",
    tax: "Steuer",
    net: "Netto",
    firstYear: "1. Jahr",
    laterYears: "Folgejahre, je Jahr",
    totalYears: (years: number) => `Summe (${years} Jahre)`,
    assumptions: [
      "Einzahlungen erfolgen am Jahresende, Entnahmen zu Jahresbeginn; alle Beträge sind nominal, ohne Inflation.",
      "Beitragsjahre ab 2027, Einkommensteuer nach Grundtarif 2026 inklusive Solidaritätszuschlag, ohne Kirchensteuer.",
      "Kinderzulage bis zum 18. Geburtstag; Zulagen nur für Einzahlungen bis 1.800 € pro Jahr.",
      "Der ETF-Sparplan läuft in einem kostenlosen Depot mit 30 % Teilfreistellung und Günstigerprüfung.",
      "Rechenweg nach der Dokumentation des Finanzfluss-Rechners. Keine Steuer- oder Anlageberatung.",
    ],
  },

  pensionGap: {
    sections: {
      entitlements: "Rentenansprüche pro Monat",
      tax: "Steuern auf die Rente",
      desired: "Wunschrente",
      retirement: "Ruhestand",
      saving: "Sparphase",
      inflation: "Inflation",
    },
    returnUntilRetirement: "Rendite bis zur Rente",
    returnUntilRetirementHint:
      "Vor Steuern; die Kapitalertragsteuer wird abgezogen.",
    series: { saving: "Ansparen", payout: "Entnahme" },
    heroLabel: "Rentenlücke pro Monat",
    heroCovered: "Deine erwartete Nettorente deckt die Wunschrente.",
    heroNote: (net: string, desired: string) =>
      `So viel fehlt zwischen ${net} Nettorente und ${desired} Wunschrente.`,
    overviewTitle: "Wunschrente im Überblick",
    overviewAria: "Zusammensetzung der Wunschrente",
    netPension: "Nettorente",
    gap: "Rentenlücke",
    grossNote: (gross: string, tax: string) =>
      `Bruttorente ${gross}, davon ${tax} Steuern pro Monat.`,
    withConsumption: "Mit Kapitalverzehr",
    withConsumptionNote: (age: number) =>
      `Das Vermögen ist mit ${age} Jahren aufgebraucht.`,
    withoutConsumption: "Ohne Kapitalverzehr",
    withoutConsumptionNote:
      "Du lebst nur von den Erträgen, das Vermögen bleibt erhalten.",
    capitalAtRetirement: "Kapital bei Renteneintritt",
    savingsRatePerMonth: "Sparrate pro Monat",
    notPossible:
      "Nicht möglich: Nach Steuern und Inflation bleibt im Ruhestand keine Rendite, von der sich leben ließe.",
    chartTitle: "Vermögensverlauf mit Kapitalverzehr",
    chartSubtitle: (retirementAge: number) =>
      `Stand am Ende jedes Lebensjahres: Ansparen bis ${retirementAge}, danach monatliche Entnahme der Rentenlücke.`,
    chartAria:
      "Säulendiagramm: Vermögen pro Lebensjahr, erst Ansparen, dann Entnahme",
    phase: "Phase",
    assumptions: [
      "Der Steuerabzug gilt für die Rente oberhalb des Grundfreibetrags und für die Erträge im Ruhestand; die Kapitalertragsteuer mindert die Rendite bis zur Rente.",
      "Mit Inflation wird mit Renditen nach Abzug der Inflationsrate gerechnet; Rente und Wunschrente bleiben in heutiger Kaufkraft.",
      "Sparraten fließen am Monatsende, Entnahmen am Monatsanfang; Zinsen monatlich.",
      "Kranken- und Pflegeversicherung auf die Rente sind nicht berücksichtigt.",
      "Formeln aus den Ergebnissen des Finanzfluss-Rechners hergeleitet. Keine Steuer- oder Anlageberatung.",
    ],
  },

  savings: {
    sections: {
      calculation: "Berechnung",
      plan: "Sparplan",
      interest: "Zinsen",
      tax: "Steuern",
    },
    searchedFieldHint:
      "Das gesuchte Feld entfällt bei den Eingaben und erscheint als Ergebnis.",
    startValue: "Anfangskapital",
    startValueHint: "Dein vorhandenes Kapital aus den globalen Werten.",
    yearlyDepositHint: (perYear: string) =>
      `${perYear}, einmal jährlich eingezahlt.`,
    interestRate: "Zinssatz p. a.",
    interestRateHint: "Deine erwartete Rendite aus den globalen Werten.",
    duration: "Laufzeit",
    savingRate: (perInterval: string) => `Sparrate ${perInterval}`,
    durationMonths: (months: number) => `Das sind ${months} Monate.`,
    durationUntilRetirement: (duration: string, retirementAge: number, age: number) =>
      `Laufzeit: ${duration} (Renteneintritt ${retirementAge} − Alter ${age}).`,
    chartTitle: "Kapital pro Jahr",
    chartSubtitle:
      "Einzahlungen inklusive Anfangskapital und die darauf aufgelaufenen Zinsen",
    afterTax: " nach Steuern",
    chartAria:
      "Säulendiagramm: Kapital pro Jahr, aufgeteilt in Einzahlungen und Zinsen",
    totalDeposits: "Einzahlungen gesamt",
    assumptions: [
      "Einzahlungen erfolgen zu Beginn des Sparintervalls; Zinsen werden im gewählten Zinsintervall gutgeschrieben und mitverzinst.",
      "Ausschüttend: Die Steuer mindert die Zinsen laufend. Thesaurierend: Die Steuer auf den gesamten Gewinn fällt am Ende an.",
      "Die Teilfreistellung stellt den gewählten Anteil der Erträge steuerfrei; ein Sparerpauschbetrag ist nicht berücksichtigt.",
      "Rechenweg nach dem Finanzfluss-Sparrechner. Keine Steuer- oder Anlageberatung.",
    ],
  },

  withdrawal: {
    sections: {
      calculation: "Berechnung",
      withdrawal: "Entnahme",
      interest: "Zinsen",
    },
    searchedFieldHint:
      "Das gesuchte Feld entfällt bei den Eingaben und erscheint als Ergebnis.",
    interestRate: "Zinssatz p. a.",
    interestRateHint: "Deine Rendite im Ruhestand aus den globalen Werten.",
    amount: (perInterval: string) => `Entnahmebetrag ${perInterval}`,
    period: "Entnahmezeitraum",
    capital: "Anlagevermögen",
    endlessNote:
      "Die Entnahme übersteigt die Zinsen nicht; das Kapital wird nie aufgebraucht.",
    keepsCapitalNote:
      "Entnommen werden nur die Zinsen; das Kapital bleibt erhalten.",
    totalWithdrawn: "Summe der Entnahmen",
    ofWhichInterest: (amount: string) => `davon ${amount} Zinsen`,
    chartTitle: "Kapital pro Jahr",
    chartSubtitle: "Verbleibendes Anlagevermögen am Ende jedes Jahres",
    chartSubtitleEndless: " (die ersten 30 Jahre)",
    chartAria: "Säulendiagramm: verbleibendes Kapital am Ende jedes Jahres",
    assumptions: [
      "Entnahmen erfolgen am Ende jedes Intervalls; der Jahreszins wird auf das Intervall umgerechnet, sodass sich über ein Jahr genau der Zinssatz ergibt.",
      "Steuern und Inflation sind nicht berücksichtigt; trage dafür einen entsprechend niedrigeren Zinssatz ein.",
      "Formeln aus den Ergebnissen des Finanzfluss-Rechners hergeleitet. Keine Steuer- oder Anlageberatung.",
    ],
  },
};

export type Dictionary = typeof de;
