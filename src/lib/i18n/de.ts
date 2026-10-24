import type { AuthError } from "@/lib/auth/config";
import type { CalculationError } from "@/lib/calculators/errors";
import type { CalculatorInfo } from "@/lib/calculators/registry";
import type {
  FieldInfoTexts,
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
    cashMonthly: { label: "Sparrate Tagesgeld", unit: "€" },
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
    investableMonthly: {
      label: "Zum Investieren verfügbar pro Monat",
      unit: "€",
      hint: "Dein Budget für alle Rechner; die Verteilung stellst du dort ein.",
    },
    currentCapital: {
      label: "Vorhandenes Kapital",
      unit: "€",
      hint: "Heute bereits angelegtes Vermögen.",
    },
    expectedReturn: {
      label: "Erwartete Rendite in der Sparphase",
      unit: "% p. a.",
      hint: "Vor Kosten und Steuern; die Fondskosten (TER) gehören ins Feld „Kosten“.",
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
    taxableIncomeSavingsPhase: {
      label: "Einkommen in der Ansparphase",
      unit: "€ / Jahr",
      hint: "Zu versteuerndes Einkommen.",
    },
    taxableIncomeRetirement: {
      label: "Einkommen im Ruhestand",
      unit: "€ / Jahr",
      hint: "Zu versteuerndes Einkommen in heutiger Kaufkraft, ohne die Auszahlungen.",
    },
    exemptionOrder: {
      label: "Sparerpauschbetrag",
      unit: "€ / Jahr",
      hint: "Der Teil, der für diese Geldanlage noch frei ist.",
    },
  },
  "av-depot": {
    savingsRateMonthly: { label: "Sparrate pro Monat", unit: "€" },
    avDepotCosts: {
      label: "Kosten des AV-Depots",
      unit: "% p. a.",
      hint: "Fondskosten (TER) und Gebühren zusammen.",
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
      label: "Monatliche Wunschrente (netto)",
      unit: "€ / Monat",
      hint: "Netto, in heutiger Kaufkraft, was du im Ruhestand zur Verfügung haben möchtest.",
    },
  },
  savings: {
    savingsRateMonthly: { label: "Sparrate pro Monat", unit: "€" },
    costs: {
      label: "Kosten pro Jahr",
      unit: "% p. a.",
      hint: "Fondskosten (TER) und Depotgebühr zusammen.",
    },
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
  plan: {
    nominalView: { label: "Beträge in künftigen Euro anzeigen" },
    useAvDepot: { label: "Altersvorsorgedepot nutzen" },
    useDepot: { label: "ETF-Depot nutzen" },
  },
  shared: {
    considerInflation: {
      label: "Inflation berücksichtigen",
      hint: "Rentenlücke-Rechner: Die Wunschrente zählt in heutiger Kaufkraft, die Renditen sinken um die Inflationsrate. AV-Depot-Rechner: Einkommen im Ruhestand auf den Renteneintritt hochgerechnet.",
    },
  },
  "av-depot": {},
  "pension-gap": {
    savingsLikeCalculator: { label: "Sparphase wie im Sparrechner rechnen" },
  },
  savings: {
    untilRetirement: { label: "Laufzeit bis Renteneintritt" },
    realTerms: {
      label: "Inflation berücksichtigen (heutige Kaufkraft)",
      hint: "Zieht die Inflationsrate vom Zinssatz ab; Einzahlungen und Ergebnis in heutigen Euro.",
    },
    considerTax: {
      label: "Steuern mitberechnen",
      hint: "Ergebnis nach Steuern: ausschüttend fällt sie jedes Jahr an, thesaurierend beim Verkauf am Ende.",
    },
    considerPartialExemption: {
      label: "Teilfreistellung bei Fonds berücksichtigen",
    },
  },
  "withdrawal-plan": {
    capitalConsumption: {
      label: "Kapitalverzehr",
      hint: "Ohne Haken werden nur die Zinsen entnommen, das Kapital bleibt erhalten.",
    },
    considerTax: {
      label: "Steuern auf die Erträge berücksichtigen",
      hint: "Zieht den geschätzten Steuerabzug aus dem Rentenlücke-Profil von der Rendite ab.",
    },
    realTerms: {
      label: "Inflation berücksichtigen (heutige Kaufkraft)",
      hint: "Zieht die Inflationsrate von der Rendite ab; alle Beträge in heutigen Euro.",
    },
  },
};

const selects: SelectTexts = {
  plan: {},
  shared: {
    incomeIntervalSavings: {
      label: "Einkommen in der Ansparphase eingeben",
      options: { yearly: "jährlich", monthly: "monatlich" },
    },
    incomeIntervalRetirement: {
      label: "Einkommen im Ruhestand eingeben",
      options: { monthly: "monatlich", yearly: "jährlich" },
    },
  },
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
        startValue: "Anfangskapital [beta]",
        yearlyInterest: "Zinssatz [beta]",
        duration: "Laufzeit [beta]",
        savingRate: "Sparrate [beta]",
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
        period: "Entnahmezeitraum [beta]",
        capital: "Anlagevermögen [beta]",
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

const fieldInfo: FieldInfoTexts = {
  plan: {
    nominalView:
      "Der Gesamtplan rechnet in heutiger Kaufkraft. Mit Haken zeigt die Karte „Rente aus allen Quellen“ die Beträge in Euro des Renteneintrittsjahres, mit der Inflationsrate hochgerechnet; so passen sie zu den nominalen Ergebnissen von AV-Depot-Rechner und Sparrechner. Ohne Haken bleibt sie bei heutiger Kaufkraft.",
    useAvDepot:
      "Ohne Haken rechnet der Gesamtplan ohne Altersvorsorgedepot: Es fließt nichts hinein, seine Rente fehlt, und die Rate im Rechner zählt nicht mit. Sie bleibt dort gespeichert.",
    useDepot:
      "Ohne Haken rechnet der Gesamtplan ohne ETF-Depot: Die Rate des Sparrechners zählt nicht mit, und vorhandenes Kapital sowie zusätzliche Sparrate gehen aufs Tagesgeld.",
    cashMonthly:
      "Was du pro Monat aufs Tagesgeld legst. Tagesgeld schwankt kaum, bringt aber weniger Rendite.",
    cashReturn:
      "Der Zins, den du langfristig aufs Tagesgeld erwartest, pro Jahr.",
    depotVolatility:
      "Wie stark die Jahresrendite des Depots um den erwarteten Wert schwankt (Standardabweichung). Je höher, desto breiter der Korridor möglicher Verläufe. Ein weltweiter Aktien-ETF liegt bei rund 15 %.",
    cashVolatility:
      "Wie stark der Tagesgeldzins von Jahr zu Jahr schwankt. Üblich ist ein kleiner Wert um 1 %.",
    confidenceTarget:
      "Mit welcher Wahrscheinlichkeit dein Plan aufgehen soll. 85 % heißt: In 85 von 100 simulierten Verläufen wird die Wunschrente erreicht. Ein höherer Wert verlangt eine höhere Sparrate.",
    lowerGuardrail:
      "Fällt die Erfolgswahrscheinlichkeit unter diesen Wert, empfiehlt der Plan, mehr zu sparen. Zwischen den Leitplanken ändert sich nichts, auch wenn das Depot schwankt.",
    upperGuardrail:
      "Steigt die Erfolgswahrscheinlichkeit über diesen Wert, hast du Spielraum und könntest die Sparrate senken.",
  },
  shared: {
    age:
      "Dein heutiges Alter. Zusammen mit dem Renteneintritt bestimmt es, wie viele Jahre du noch sparst.",
    retirementAge:
      "Das Alter, in dem du aufhörst zu sparen und mit der Entnahme beginnst. Die Regelaltersgrenze liegt für Jahrgänge ab 1964 bei 67.",
    payoutUntilAge:
      "Bis zu diesem Alter soll dein Vermögen reichen; danach ist es rechnerisch aufgebraucht. Wähle es eher hoch: Viele werden älter als der Durchschnitt.",
    investableMonthly:
      "Das Budget, das du pro Monat zum Investieren hast. Wie du es auf Altersvorsorgedepot, ETF-Depot (Sparrechner) und Tagesgeld verteilst, stellst du dort ein; der Gesamtplan zeigt, ob die Summe das Budget übersteigt oder unterschreitet.",
    currentCapital:
      "Vermögen, das du heute schon angelegt hast und das mit der erwarteten Rendite weiterwächst. Im Gesamtplan gilt es als Stand im ETF-Depot, bis du im Verlauf einen Ist-Stand erfasst.",
    expectedReturn:
      "Jährliche Rendite, mit der das angelegte Geld in der Sparphase wächst – vor Kosten und Steuern. Die Fondskosten (TER) und Gebühren trägst du im Sparrechner und im AV-Depot-Rechner bei „Kosten“ ein; sie werden von dieser Rendite abgezogen. Rentenlücke-Rechner und Entnahmeplan haben kein Kostenfeld und rechnen mit der Rendite, wie du sie einträgst. Ein weltweiter Aktien-ETF lag langfristig nominal bei etwa 6 bis 7 % pro Jahr; das ist keine Garantie.",
    retirementReturn:
      "Jährliche Rendite deines Vermögens während der Auszahlung. Meist niedriger angesetzt als in der Sparphase, weil im Ruhestand vorsichtiger angelegt wird.",
    inflationRate:
      "Wie stark die Preise pro Jahr steigen. Damit werden künftige Beträge in heutige Kaufkraft umgerechnet. Die Europäische Zentralbank strebt 2 % an.",
    capitalGainsTax:
      "Steuer auf Zinsen, Dividenden und Kursgewinne: 25 % Abgeltungsteuer plus Solidaritätszuschlag ergeben 26,375 %; mit Kirchensteuer rund 28 %.",
    incomeIntervalSavings:
      "Ob du das Einkommen in der Ansparphase pro Jahr (wie im Einkommensteuerbescheid) oder pro Monat eingibst. Gerechnet wird mit dem Jahreswert, also Monatsbetrag mal 12.",
    incomeIntervalRetirement:
      "Ob du das Einkommen im Ruhestand pro Monat (wie die Rentenversicherung es nennt) oder pro Jahr eingibst. Gerechnet wird mit dem Jahreswert, also Monatsbetrag mal 12.",
    taxableIncomeSavingsPhase:
      "Dein zu versteuerndes Einkommen, solange du sparst: Brutto abzüglich Werbungskosten, Vorsorgeaufwendungen und Freibeträgen. Es steht im Einkommensteuerbescheid und bestimmt, wie viel Steuer dir die Einzahlungen ins AV-Depot sparen.",
    taxableIncomeRetirement:
      "Dein zu versteuerndes Einkommen im Ruhestand ohne die Auszahlungen aus dem AV-Depot, vor allem der steuerpflichtige Teil deiner Renten. Trag es in heutiger Kaufkraft ein, so als würdest du heute in Rente gehen. Es bestimmt den Steuersatz auf die Auszahlungen. Mit „Inflation berücksichtigen“ wird der Betrag mit der Inflationsrate auf das Jahr des Renteneintritts hochgerechnet, bevor die Steuer berechnet wird; ohne den Haken gilt der Betrag unverändert. Der Gesamtplan rechnet immer mit dem hochgerechneten Betrag.",
    exemptionOrder:
      "Kapitalerträge bis zu diesem Betrag bleiben pro Jahr steuerfrei: 1.000 € für Einzelpersonen, 2.000 € für zusammen Veranlagte. Trage ein, was davon für diese Geldanlage noch frei ist.",
    considerInflation:
      "Mit Haken wird die Inflationsrate dort berücksichtigt, wo die globalen Werte eine Rolle spielen. Rentenlücke-Rechner: Die Wunschrente und die Rentenansprüche sind Beträge von heute. Mit Haken rechnet der Rechner deshalb in heutiger Kaufkraft: mit der Rendite nach Abzug der Inflationsrate, sodass auch nötiges Kapital und Sparrate in heutiger Kaufkraft stehen. Ohne Haken würde die Wunschrente wie ein Betrag im Jahr des Renteneintritts behandelt und der Bedarf unterschätzt. AV-Depot-Rechner: Das Einkommen im Ruhestand (in heutiger Kaufkraft eingetragen) wird auf das Jahr des Renteneintritts hochgerechnet, bevor die Steuer auf die Auszahlungen berechnet wird; Endvermögen und Renten bleiben nominal, also in künftigen Euro. Ohne Haken sind beide nominal und das Einkommen gilt unverändert. Unabhängig vom Haken rechnet der Gesamtplan immer in heutiger Kaufkraft, Sparrechner und Entnahmeplan haben einen eigenen Schalter und nutzen dann die hier eingestellte Inflationsrate.",
  },
  "av-depot": {
    savingsRateMonthly:
      "Was du pro Monat ins Altersvorsorgedepot einzahlst. Gefördert werden bis zu 150 € im Monat (1.800 € im Jahr), möglich sind bis zu 1.140 € (13.680 € im Jahr). Den Rest deines Budgets legst du im Sparrechner an.",
    avDepotCosts:
      "Laufende Kosten des Altersvorsorgedepots pro Jahr: die Fondskosten (TER) und Gebühren wie eine Depot- oder Verwaltungsgebühr zusammen. Sie mindern die Rendite. Für das Standarddepot sind die Effektivkosten gesetzlich auf 1,0 % pro Jahr begrenzt; im frei zusammengestellten Depot gilt der Deckel nicht. Dort trägst du die TER der gewählten ETFs zusätzlich zur Gebühr des Depots hier ein.",
    baseRate:
      "Der Basiszins, den das Bundesfinanzministerium jährlich festlegt. Aus ihm ergibt sich die Vorabpauschale, also die jährliche Mindestbesteuerung thesaurierender Fonds im normalen Depot.",
    oneTimePayout:
      "Anteil des Kapitals, den du dir zum Renteneintritt auf einmal auszahlen lässt, vor Steuern. Erlaubt sind bis zu 30 %; der Rest wird als monatliche Rente ausgezahlt.",
    taxSavingsMode:
      "Was mit der Steuererstattung aus den Einzahlungen passiert: zusätzlich ins AV-Depot einzahlen, in einem normalen Depot anlegen oder ausgeben. Das beeinflusst den Vergleich mit dem ETF-Sparplan.",
  },
  "pension-gap": {
    savingsLikeCalculator:
      "Mit Haken wird die Sparphase mit den Einstellungen des aktiven Sparrechner-Profils gerechnet: Steuern (ausschüttend oder thesaurierend, mit Teilfreistellung), Kosten pro Jahr und Zinsintervall; die Einzahlung erfolgt zu Beginn des Monats. Das Feld „Kapitalertragsteuer“ entfällt, es gilt der Satz aus den globalen Werten – aber nur, wenn im Sparrechner „Steuern mitberechnen“ an ist, sonst rechnet die Sparphase ohne Steuern. Die Inflation steuerst du hier mit „Inflation berücksichtigen“. Ohne Haken rechnet der Rechner wie Finanzfluss: Rendite nach Kapitalertragsteuer, Einzahlung am Monatsende.",
    statePension:
      "Deine erwartete gesetzliche Monatsrente, brutto. Sie steht in der jährlichen Renteninformation der Deutschen Rentenversicherung.",
    companyPension:
      "Erwartete Monatsrente aus betrieblicher Altersvorsorge, brutto – etwa Direktversicherung oder Pensionskasse.",
    privatePension:
      "Erwartete Monatsrente aus privaten Renten- oder Lebensversicherungen, brutto.",
    riesterPension:
      "Erwartete Monatsrente aus Riester- oder Rürup-Verträgen, brutto.",
    taxPrediction:
      "Pauschaler Steuersatz auf deine Renten oberhalb des Grundfreibetrags und auf die Zinsen im Ruhestand. Eine Schätzung; der tatsächliche Satz hängt von deinem gesamten Einkommen ab.",
    yearlyTaxFreeAmount:
      "Einkommen bis zu diesem Betrag bleibt pro Jahr steuerfrei. Der Grundfreibetrag wird jedes Jahr angepasst.",
    desiredPension:
      "Der Betrag, den du im Ruhestand monatlich netto zur Verfügung haben möchtest, in heutiger Kaufkraft. Mit „Inflation berücksichtigen“ rechnet der Rentenlücke-Rechner damit; ohne den Haken würde der Betrag wie ein Betrag im Jahr des Renteneintritts behandelt. Als Faustregel gelten etwa 80 % des letzten Nettoeinkommens.",
  },
  savings: {
    savingsRateMonthly:
      "Was du pro Monat in deinen Sparplan, also das ETF-Depot, einzahlst. Der Wert gehört zum Profil des Sparrechners und wird im Gesamtplan als Rate des ETF-Depots genutzt.",
    costs:
      "Laufende Kosten pro Jahr, die die Rendite mindern: die Fondskosten (TER) und, falls vorhanden, eine Depotgebühr. Trag sie hier ein; der Zinssatz bzw. die erwartete Rendite gilt vor diesen Kosten. Im Gesamtplan mindern diese Kosten die Rendite des ETF-Depots.",
    durationYears:
      "Wie viele Jahre du sparst.",
    endValue:
      "Das Kapital, das am Ende der Laufzeit vorhanden sein soll – Einzahlungen und Zinsen zusammen.",
    partialExemption:
      "Der Teil der Fondserträge, der steuerfrei bleibt: 30 % bei Aktienfonds, 15 % bei Mischfonds.",
    realTerms:
      "Mit Haken wird die Inflationsrate (Feld darunter) vom Zinssatz abgezogen; die Einzahlungen bleiben in heutiger Kaufkraft gleich und das Ergebnis steht in heutigen Euro. Die Steuer wird dann auf den realen Zins gerechnet, eine Vereinfachung. Ohne Haken rechnet der Rechner nominal, wie Finanzfluss.",
    untilRetirement:
      "Mit Haken ist die Laufzeit Renteneintritt minus Alter und folgt den globalen Werten. Ohne Haken gibst du die Laufzeit frei ein, etwa für ein Sparziel vor der Rente.",
    considerTax:
      "Zieht die Kapitalertragsteuer ab; das Ergebnis ist dann nach Steuern. Ausschüttend fällt die Steuer jedes Jahr auf die Zinsen an. Thesaurierend fällt sie erst beim Verkauf am Ende an, einmal auf den gesamten Gewinn: Das Endkapital ist dann das, was nach dem Verkauf übrig bliebe. Während der Sparzeit zahlst du keine Steuer; die Vorabpauschale und der Sparerpauschbetrag sind nicht berücksichtigt. Ohne diese Option sind alle Ergebnisse vor Steuern.",
    considerPartialExemption:
      "Bei Fonds bleibt ein Teil der Erträge steuerfrei. Schalte das an, wenn du in Fonds oder ETFs sparst.",
    output:
      "Die Größe, die der Rechner aus den übrigen Angaben ermittelt. Ihr Eingabefeld entfällt.",
    saveInterval:
      "Wie oft du einzahlst. Bei „jährlich“ wird das Zwölffache der monatlichen Sparrate auf einmal eingezahlt.",
    interestInterval:
      "Wie oft Erträge gutgeschrieben werden und danach selbst mitwachsen (Zinseszins). Der Zinssatz gilt pro Jahr und wird auf das Intervall heruntergerechnet; je häufiger, desto mehr kommt am Ende heraus. Für ETFs und Fonds, ausschüttend wie thesaurierend, passt „monatlich“, weil ihr Wert laufend wächst. Bei Tagesgeld gilt das Intervall deiner Bank, bei Festgeld und Sparbuch meist „jährlich“.",
    distributionType:
      "Ausschüttend: Erträge werden jedes Jahr ausgezahlt und versteuert. Thesaurierend: Erträge bleiben im Fonds, die Steuer fällt erst am Ende an.",
  },
  "withdrawal-plan": {
    capitalAssets:
      "Das Vermögen, aus dem du entnimmst, zu Beginn der Entnahme.",
    withdrawalAmount:
      "Der Betrag, den du in jedem Intervall entnimmst.",
    periodYears:
      "Wie viele Jahre die Entnahme laufen soll.",
    capitalConsumption:
      "Mit Haken wird das Vermögen über den Zeitraum vollständig aufgebraucht. Ohne Haken werden nur die Zinsen entnommen, das Kapital bleibt erhalten.",
    considerTax:
      "Mit Haken wird vom Zinssatz der geschätzte Steuerabzug des Rentenlücke-Profils abgezogen, wie im Gesamtplan. Ohne Haken wird ohne Steuern gerechnet, wie bei Finanzfluss.",
    realTerms:
      "Mit Haken wird die Inflationsrate (Feld darunter) von der Rendite im Ruhestand abgezogen, vor dem Steuerabzug, wie im Gesamtplan; Kapital und Entnahmen stehen dann in heutiger Kaufkraft. Ohne Haken sind alle Beträge nominal, also in künftigen Euro, wie bei Finanzfluss.",
    output:
      "Die Größe, die der Rechner aus den übrigen Angaben ermittelt. Ihr Eingabefeld entfällt.",
    interval:
      "Wie oft du Geld entnimmst.",
  },
};

const calcErrors: Record<CalculationError, string> = {
  ageBeforeRetirement: "Das Alter muss unter dem Renteneintrittsalter liegen.",
  payoutAfterRetirement: "Die Auszahlung muss nach dem Renteneintritt enden.",
  avAgeRange:
    "Für das Altersvorsorgedepot muss das Alter zwischen 18 und 67 Jahren liegen.",
  avRetirementRange:
    "Für das Altersvorsorgedepot muss der Renteneintritt zwischen 65 und 70 Jahren liegen.",
  avPayoutMin85:
    "Im Altersvorsorgedepot muss die Auszahlung mindestens bis zum Alter 85 laufen.",
  avSavingsRateRange:
    "Ins Altersvorsorgedepot müssen mindestens 120 € pro Jahr fließen (10 € pro Monat), höchstens 13.680 €.",
  avReturnsPositive:
    "Für das Altersvorsorgedepot müssen die Renditen größer als 0 % sein.",
  avCostsBelowReturns: "Die Kosten des AV-Depots müssen unter den Renditen liegen.",
  taxBelow100: "Die Steuersätze müssen unter 100 % liegen.",
  durationPositive: "Die Laufzeit muss größer als 0 sein.",
  unreachableStartValue:
    "Das Endkapital lässt sich mit diesen Werten nicht erreichen.",
  unreachableSavingRate:
    "Das Endkapital lässt sich mit diesen Werten nicht erreichen.",
  unreachableYearlyInterest:
    "Ohne Anfangskapital und Sparrate lässt sich das Endkapital mit keinem Zinssatz erreichen.",
  unreachableDuration:
    "Das Endkapital lässt sich mit diesen Werten nie erreichen: Ohne Sparrate und Zinsen wächst das Kapital nicht.",
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
  tooManyAttempts: "Zu viele Versuche. Bitte warte einige Minuten und versuche es dann erneut.",
};

export const de = {
  appName: "Finanzcockpit",
  appDescription: "Persönliches Finanzcockpit mit Kennzahlen und Rechnern.",
  language: "Sprache",

  landing: {
    headline: "Dein Überblick für Altersvorsorge und Vermögensaufbau",
    intro:
      "Reicht meine Rente? Lohnt sich ein Altersvorsorgedepot? Wie viel muss ich monatlich sparen? Das Finanzcockpit beantwortet diese Fragen an einem Ort – mit denselben Annahmen für alles.",
    login: "Anmelden",
    register: "Konto anlegen",
    openCockpit: "Zum Cockpit",
    invitationOnly: "Der Zugang ist derzeit nur für eingeladene Nutzer.",
    whyHeading: "Warum alles an einem Ort?",
    why: [
      {
        title: "Einmal eingeben, überall nutzen",
        text: "Alter, Einkommen, Sparrate und Renditeannahmen trägst du einmal ein. Du musst sie nicht in vier verschiedene Rechner abtippen.",
      },
      {
        title: "Zahlen, die zusammenpassen",
        text: "Einzelne Rechner im Netz arbeiten mit eigenen Annahmen zu Rendite, Inflation und Steuern, deshalb widersprechen sich ihre Ergebnisse leicht. Hier rechnen alle mit denselben Werten.",
      },
      {
        title: "Das Zusammenspiel sehen",
        text: "Dein monatlich verfügbares Geld ist begrenzt: Was ins Altersvorsorgedepot fließt, fehlt beim ETF-Sparplan. Das Cockpit zeigt, ob alles zusammen reicht – nicht nur jeder Baustein für sich.",
      },
    ],
    screenshotsHeading: "So sieht es aus",
    screenshotsNote:
      "Beispiel mit gerundeten Werten, angelehnt an einen durchschnittlichen Arbeitnehmer in Deutschland: 40 Jahre alt, 42.000 € zu versteuerndes Einkommen, 15.000 € Startkapital, 300 € pro Monat zum Investieren, 1.500 € gesetzliche Rente und 1.850 € Wunschrente. Das sind Annahmen zur Veranschaulichung, keine Prognose.",
    screenshots: {
      plan: {
        title: "Gesamtplan",
        caption:
          "Reicht die Sparrate? Der Plan zeigt, mit welcher Wahrscheinlichkeit die Wunschrente erreicht wird, welchen Korridor dein Vermögen durchläuft und wie viel mehr oder weniger du sparen solltest.",
        alt: "Gesamtplan mit Status „Im Plan“, 91 % Wahrscheinlichkeit und dem Diagramm des Vermögens bis zum Renteneintritt",
      },
      pensionGap: {
        title: "Rentenlücke",
        caption:
          "Was zwischen erwarteter Rente und Wunschrente fehlt – und welches Kapital und welche Sparrate die Lücke schließen.",
        alt: "Rentenlückenrechner mit 336 € Lücke pro Monat sowie nötigem Kapital und nötiger Sparrate",
      },
      avDepot: {
        title: "Altersvorsorgedepot",
        caption:
          "Das geförderte Depot im Vergleich zu einem normalen ETF-Sparplan: Endvermögen, Förderung und Netto-Rente.",
        alt: "Altersvorsorgedepot-Rechner mit 157.326 € Endvermögen und dem Diagramm der Ansparphase",
      },
    },
    featuresHeading: "Was die Website macht",
    features: {
      plan: {
        title: "Gesamtplan: spare ich genug?",
        text: "Rechnet mit 2.000 simulierten Börsenverläufen statt einer einzelnen Linie. Du siehst einen Korridor, die Wahrscheinlichkeit, dein Ziel zu erreichen, und die Sparrate, die für dein Sicherheitsniveau nötig ist.",
      },
      history: {
        title: "Verlauf: im Plan bleiben",
        text: "Friere deinen Plan ein und trage einmal im Jahr deine Kontostände ein. Du siehst, ob du im Korridor liegst – und ob du mehr sparen musst oder Spielraum hast.",
      },
      profiles: {
        title: "Profile zum Durchspielen",
        text: "Lege mehrere Varianten an, etwa „Basis“ oder „Teilzeit ab 55“, und vergleiche sie, ohne deine Werte zu überschreiben.",
      },
    },
    calculatorsHeading: "Vier Rechner",
    stepsHeading: "So geht es",
    steps: [
      {
        title: "Grundlagen eintragen",
        text: "Unter „Globale Werte“ gibst du Alter, Einkommen, verfügbares Geld und Renditeannahmen einmal ein.",
      },
      {
        title: "Rechner durchspielen",
        text: "Die Rechner übernehmen deine Werte und zeigen Ergebnisse und Diagramme. Änderungen gelten erst, wenn du sie speicherst.",
      },
      {
        title: "Plan prüfen und verfolgen",
        text: "Der Gesamtplan sagt dir, ob deine Sparrate reicht. Im Verlauf behältst du es über die Jahre im Blick.",
      },
    ],
    noticeHeading: "Gut zu wissen",
    notices: [
      "Das sind Modellrechnungen mit Annahmen. Sie sind keine Anlage-, Steuer- oder Rechtsberatung und keine Garantie.",
      "Deine Eingaben werden in einer Datenbank auf dem Server des Betreibers gespeichert. Passwörter liegen nur als Hash vor.",
      "Es gibt keine Werbung, kein Tracking und keine Skripte von Drittanbietern.",
    ],
  },
  nav: {
    main: "Hauptnavigation",
    cockpit: "Cockpit",
    plan: "Gesamtplan",
    history: "Verlauf",
    planning: "Planung",
    calculators: "Rechner",
    account: "Grundlagen",
    settings: "Globale Werte",
    logout: "Abmelden",
    menu: "Menü",
    admin: "Admin",
    about: "Über das Finanzcockpit",
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
    infoAbout: (label: string) => `Erklärung zu „${label}“`,
    sharedTitle: "Geteilte Einstellung – gilt für alle Rechner",
    changed: "geändert",
    changedTitle: "Lokal geändert – noch nicht gespeichert",
    numberRange: (integer: boolean, min: string, max: string) =>
      `Bitte ${integer ? "eine ganze Zahl" : "einen Wert"} zwischen ${min} und ${max} eingeben.`,
    cannotCalculate: "Mit diesen Eingaben kann nicht gerechnet werden",
    localChangesHint: "Änderungen gelten nur hier, bis du sie speicherst.",
    assumptions: "Annahmen",
    yearlyTable: "Jahreswerte als Tabelle",
    noAdvice: "Keine Steuer- oder Anlageberatung.",
    chartKeyboardHint: "Mit den Pfeiltasten durch die Jahre blättern.",
    perYearEquals: (amount: string) => `= ${amount} pro Jahr`,
    inflatedIncome: (amount: string) =>
      `Mit Inflation auf den Renteneintritt hochgerechnet: ${amount} pro Jahr.`,
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
    eurosPerMonth: "€ / Monat",
    eurosPerYear: "€ / Jahr",
    endless: "endlos",
    advancedToggle: "Erweiterte Eingaben",
    advancedForced:
      "Wegen der Fehlermeldung sind die erweiterten Eingaben eingeblendet.",
  },

  children: {
    info: "Geburtsjahre deiner Kinder, für die du Kindergeld bekommst. Im Altersvorsorgedepot gibt es für jedes Kind eine Zulage, solange Kindergeld gezahlt wird.",
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
    managedInSettings: "Anlegen, umbenennen und löschen unter",
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
    savesIn: (profiles: string) =>
      `Speichern schreibt in die aktiven Profile: ${profiles}.`,
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
  fieldInfo,
  calcErrors,

  budget: {
    hint: (available: string, planned: string) =>
      `Verfügbar ${available}, verplant ${planned}.`,
    free: (amount: string) => `Noch frei: ${amount}.`,
    over: (amount: string) => `${amount} mehr verplant als verfügbar.`,
    exact: "Das Budget ist genau verplant.",
    freeHeadline: (amount: string) => `Noch ${amount} pro Monat zum Investieren frei`,
    overHeadline: (amount: string) =>
      `${amount} pro Monat mehr verplant als verfügbar`,
    exactHeadline: "Das Budget ist genau verplant",
    rest: "Rest",
    restTitle: "Setzt den noch freien Betrag des Budgets ein",
    enough: (budget: string, left: string) =>
      `Dein Budget von ${budget} reicht für die nötige Sparrate; ${left} blieben übrig.`,
    short: (budget: string, missing: string) =>
      `Dein Budget von ${budget} reicht nicht für die nötige Sparrate: Es fehlen ${missing}.`,
  },

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
      pension: "Rente",
      balances: "Heutiger Stand",
      payout: "Auszahlung",
    },
    payoutNote:
      "Gehört zum Profil des Entnahmeplans und gilt auch dort.",
    breakdown: {
      title: "Rente aus allen Quellen",
      subtitle: "Im mittleren Verlauf, in heutiger Kaufkraft und nach Steuern.",
      subtitleNominal: (prices: string) =>
        `Im mittleren Verlauf, in Euro zum Renteneintritt (Preise dann ${prices} über heute) und nach Steuern.`,
      wealthTitle: "Vermögen bei Renteneintritt",
      avDepot: "Altersvorsorgedepot",
      free: "Freies Vermögen (ETF-Depot und Tagesgeld)",
      pensionTitle: "Rente pro Monat",
      statePension: "Gesetzliche und weitere Renten (netto)",
      avPension: "Altersvorsorgedepot (netto)",
      freePension: "Entnahme aus dem freien Vermögen (nach Steuern)",
      freeTax: (before: string, tax: string) =>
        `Vor Steuern ${before}; die Steuer auf die Erträge kostet ${tax}.`,
      total: "Zusammen",
      desired: "Wunschrente",
      surplus: (amount: string) => `${amount} mehr als gewünscht`,
      shortfall: (amount: string) => `${amount} weniger als gewünscht`,
      consumes: (age: number) =>
        `Das freie Vermögen wird bis Alter ${age} aufgebraucht.`,
      keeps: "Vom freien Vermögen werden nur die Erträge entnommen; es bleibt erhalten.",
      taxNote: (rate: string) =>
        `Steuern auf die Erträge in der Auszahlphase: geschätzter Steuerabzug von ${rate} (aus dem Rentenlücke-Profil). Das Altersvorsorgedepot versteuert nach seinen eigenen Regeln.`,
    },
    rateLabels: {
      av: "Sparrate Altersvorsorgedepot",
      depot: "Sparrate ETF-Depot (Sparrechner)",
    },
    ratesNote:
      "Die Raten für Altersvorsorgedepot und ETF-Depot gehören zu den Profilen dieser Rechner und gelten auch dort.",
    sourcesNote:
      "Die Einzelheiten des AV-Depots (Kosten, Steuern, Kinder) kommen aus dessen Rechner.",
    capitalHint:
      "Gilt als Stand im ETF-Depot, bis du im Verlauf einen Ist-Stand erfasst.",
    capitalHintCash:
      "Gilt als Stand auf dem Tagesgeld, bis du im Verlauf einen Ist-Stand erfasst.",
    balancesFrom: (date: string, av: string, depot: string, cash: string) =>
      `Ist-Stand vom ${date}: AV-Depot ${av}, ETF-Depot ${depot}, Tagesgeld ${cash}.`,
    changeInHistory: "Im Verlauf ändern",
    avErrorHint:
      "Oder setze die Sparrate des Altersvorsorgedepots auf 0; dann rechnet der Plan ohne es.",
    alsoUses: "Der Plan nutzt außerdem",
    pensionNote:
      "Diese Werte gehören zum Profil des Rentenlücke-Rechners und gelten auch dort.",
    status: {
      increase: "Mehr sparen",
      onTrack: "Im Plan – nichts ändern",
      room: "Spielraum",
    },
    statusNote: {
      increase: (amount: string) =>
        `Erhöhe die Sparrate um ${amount} pro Monat, um dein Sicherheitsniveau zu erreichen.`,
      onTrack: "Deine Sparrate passt zu deinem Sicherheitsniveau.",
      room: (amount: string) =>
        `Du könntest ${amount} pro Monat weniger sparen und bliebest auf deinem Sicherheitsniveau.`,
    },
    probability: "Wahrscheinlichkeit, die Wunschrente zu erreichen",
    guardrails: (lower: string, target: string, upper: string) =>
      `Leitplanken ${lower} und ${upper}, Ziel ${target}`,
    currentRate: "Deine Sparrate",
    requiredRate: "Nötige Sparrate",
    requiredRateNote: (target: string) =>
      `für ${target} Sicherheit, bei gleicher Aufteilung`,
    alternativesTitle: "Andere Wege zurück auf Kurs",
    lowerPension: (amount: string) =>
      `Wunschrente um ${amount} pro Monat senken`,
    retireLater: (years: string) => `${years} später in Rente gehen`,
    retireLaterNotEnough: "Später in Rente gehen reicht allein nicht.",
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
    noSnapshot: (capital: string) =>
      `Noch kein Ist-Stand erfasst – der Plan startet mit deinem vorhandenen Kapital von ${capital} im ETF-Depot.`,
    staleSnapshot: (date: string) =>
      `Letzter Ist-Stand vom ${date}. Zeit für den jährlichen Abgleich.`,
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
      "Alle Beträge in heutiger Kaufkraft; die Inflationsrate wird immer abgezogen, unabhängig vom Schalter in den globalen Werten.",
      "Der Korridor entsteht aus 2.000 zufälligen Verläufen der Rendite mit gleichbleibender Schwankung; AV-Depot und ETF-Depot bewegen sich gemeinsam. Extremereignisse jenseits dieser Annahme sind nicht abgebildet.",
      "Sparraten steigen mit der Inflation; die Einzahlungen ins AV-Depot bleiben nominal gleich und folgen dessen Rechner.",
      "Die nötige Sparrate ist deine gesamte Sparrate bei gleicher Aufteilung auf die Töpfe. Ins AV-Depot fließen höchstens 1.140 € pro Monat; was darüber liegt, geht ins ETF-Depot.",
      "Ab Renteneintritt wird mit der festen Rendite im Ruhestand nach dem geschätzten Steuerabzug gerechnet. Das freie Vermögen wird bis zum Ende der Auszahlung aufgebraucht oder, wenn das im Entnahmeplan-Profil so steht, nur auf seine Erträge hin entnommen.",
      "Der Korridor ist ein Modell, keine Garantie.",
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
    title: "Globale Werte",
    intro:
      "Diese Werte teilen sich die Rechner. Änderungen gelten erst, wenn du sie unten rechts speicherst.",
    profileLabel: "Profil der globalen Werte",
    personal: "Persönliche Daten",
    saving: "Sparen und Anlegen",
    inflation: "Inflation",
    incomeAndTax: "Einkommen und Steuern",
  },

  admin: {
    title: "Admin",
    intro:
      "Nur für Administratoren sichtbar. Hier vergibst du Rollen, schaltest den Beta-Zugang frei und siehst, wie die Seite genutzt wird.",
    usersHeading: "Nutzer",
    columns: {
      email: "E-Mail",
      registered: "Registriert",
      role: "Rolle",
      beta: "Beta",
      profiles: "Profile",
      lastActive: "Zuletzt aktiv",
    },
    roles: { user: "Nutzer", admin: "Admin" },
    betaImplied: "Admins haben Beta-Zugang",
    betaTitle: "Beta-Zugang für diesen Nutzer",
    never: "nie",
    you: "du",
    saved: "Gespeichert",
    errors: {
      forbidden: "Dafür fehlt dir die Berechtigung.",
      notFound: "Nutzer nicht gefunden.",
      self: "Du kannst deine eigene Rolle nicht ändern.",
      lastAdmin: "Der letzte Admin kann nicht herabgestuft werden.",
      invalid: "Ungültige Eingabe.",
      failed: "Speichern fehlgeschlagen.",
    },
    statsHeading: "Nutzung",
    statsNote:
      "Ausgewertet aus den gespeicherten Daten der Konten. Es wird nichts zusätzlich erfasst.",
    totals: {
      users: "Registrierte Nutzer",
      admins: "Admins",
      beta: "Beta-Nutzer",
      active30: "Aktiv in den letzten 30 Tagen",
      withPlanRecords: "Mit Plan-Einträgen",
      advancedInputs: "Mit „Erweiterte Eingaben“",
    },
    active30Hint: "Aktiv heißt: ein Profil wurde gespeichert.",
    signupsHeading: "Neue Konten pro Monat",
    scopesHeading: "Nutzung je Bereich",
    scopeColumns: {
      scope: "Bereich",
      profiles: "Profile",
      customised: "Nutzer mit eigenen Werten",
    },
    changesHeading: "Letzte Änderungen",
    changeKinds: { role: "Rolle", beta: "Beta" },
    noChanges: "Noch keine Änderungen.",
  },
  dashboard: {
    title: "Cockpit",
    profilesHint:
      "Die Auswahl gilt auch in den Rechnern. Profile anlegen und ändern kannst du dort und unter „Globale Werte“.",
    desiredPension: "Wunschrente",
    notCalculable: "Mit den gewählten Profilen nicht berechenbar:",
    resultsHeading: "Ergebnisse der Rechner",
    resultsNote:
      "Jeder Rechner rechnet für sich, ohne Schwankung und in künftigen Euro; nur die Rentenlücke rechnet mit „Inflation berücksichtigen“ in heutiger Kaufkraft. Der Gesamtplan oben rechnet immer in heutiger Kaufkraft und mit deinem Sicherheitsniveau – seine Zahlen fallen deshalb vorsichtiger aus.",
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
    taxNote: {
      avDepot: "Endvermögen vor Steuern, Renten nach Steuern.",
      pensionGap:
        "Nettorente nach geschätztem Steuerabzug; Kapital und Sparrate mit Renditen nach Steuern gerechnet.",
      savingsBefore: "Alle Beträge vor Steuern.",
      savingsDistributing:
        "Alle Beträge nach Steuern: ausschüttend, die Steuer mindert die Zinsen laufend.",
      savingsAccumulating:
        "Alle Beträge nach Steuern: thesaurierend, die Steuer auf den Gewinn fällt am Ende an.",
      withdrawal: "Ohne Steuern gerechnet.",
      withdrawalTaxed: "Erträge nach geschätztem Steuerabzug gerechnet.",
    },
    currencyNote: {
      nominal: "Ohne Berücksichtigung der Inflation (nominal, künftige Euro).",
      real: "Unter Berücksichtigung der Inflation (heutige Kaufkraft).",
    },
    capitalAssets: "Anlagevermögen",
  },

  avDepot: {
    sections: {
      personal: "Persönliche Daten",
      income: "Einkommen",
      saving: "Ansparphase",
      children: "Kinder",
      payout: "Auszahlphase",
    },
    presets: {
      minimum: "Minimum",
      subsidyLimit: "Fördergrenze",
      maximum: "Maximum",
    },
    retirementAgeHint: "Zwischen 65 und 70 Jahren.",
    savingsRateHint: (perYear: string) =>
      `${perYear}. Gefördert bis 150 € pro Monat, möglich bis 1.140 €.`,
    costsAboveCap: (cap: string) =>
      `Über dem Kostendeckel: Für das Standarddepot sind die Effektivkosten gesetzlich auf ${cap} pro Jahr begrenzt. Diese Kosten liegen darüber. Im frei zusammengestellten Depot gilt der Deckel nicht; dort trägst du die TER der gewählten ETFs zusätzlich zur Gebühr des Depots ein.`,
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
      "Rechenweg nach der Dokumentation des Finanzfluss-Rechners.",
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
    inflationOn: (rate: string) =>
      `Mit Inflation gerechnet (${rate} pro Jahr): Die Wunschrente gilt in heutiger Kaufkraft, und alle Beträge stehen in heutiger Kaufkraft.`,
    inflationOff:
      "Ohne Inflation gerechnet: Die Wunschrente wird wie ein Betrag im Jahr des Renteneintritts behandelt, alle Beträge sind nominal.",
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
    capitalAtRetirement: "Benötigtes Kapital bei Renteneintritt",
    onPlanTitle: "Du liegst im Plan",
    onPlanTitleClear: "Du liegst deutlich im Plan",
    onPlanText: (
      atRetirement: string,
      needed: string,
      buffer: string,
      percent: string,
      untilAge: number,
      remaining: string,
    ) =>
      `Mit deinem vorhandenen Kapital brauchst du keine zusätzliche Sparrate. Es wächst bis zum Renteneintritt auf ${atRetirement}; nötig wären nur ${needed}. Das sind ${buffer} (${percent}) Puffer. Selbst wenn du das Kapital über die ganze Entnahme verbrauchst, bleiben mit ${untilAge} Jahren noch ${remaining} übrig.`,
    budgetFits: (budget: string) =>
      `Im Plan: Die Sparrate passt in dein Budget (${budget} pro Monat zum Investieren).`,
    budgetExceeded: (budget: string, missing: string) =>
      `Nicht im Plan: Die nötige Sparrate liegt ${missing} über deinem Budget „Zum Investieren verfügbar pro Monat“ (${budget}).`,
    chartViews: { with: "Mit Kapitalverzehr", without: "Ohne Kapitalverzehr" },
    chartViewLabel: "Verlauf anzeigen",
    chartTitleWithout: "Vermögensverlauf ohne Kapitalverzehr",
    chartSubtitleWithout: (retirementAge: number) =>
      `Stand am Ende jedes Lebensjahres: Ansparen bis ${retirementAge}, danach lebst du von den Erträgen und das Vermögen bleibt erhalten.`,
    savingsRatePerMonth: "Sparrate pro Monat",
    notPossible:
      "Nicht möglich: Nach Steuern und Inflation bleibt im Ruhestand keine Rendite, von der sich leben ließe.",
    chartTitle: "Vermögensverlauf mit Kapitalverzehr",
    savingsLikeNote: (tax: string) =>
      `Die Sparphase wird wie im aktiven Sparrechner-Profil gerechnet (${tax}), mit dessen Kosten und Zinsintervall.`,
    savingsLikeTax: { off: "ohne Steuern", distributing: "Steuern ausschüttend", accumulating: "Steuern thesaurierend" },
    chartSubtitle: (retirementAge: number) =>
      `Stand am Ende jedes Lebensjahres: Ansparen bis ${retirementAge}, danach monatliche Entnahme der Rentenlücke.`,
    chartAria:
      "Säulendiagramm: Vermögen pro Lebensjahr, erst Ansparen, dann Entnahme",
    phase: "Phase",
    assumptions: [
      "Der Steuerabzug gilt für die Rente oberhalb des Grundfreibetrags und für die Erträge im Ruhestand; die Kapitalertragsteuer mindert die Rendite bis zur Rente.",
      "Mit „Inflation berücksichtigen“ gilt die Wunschrente als Betrag in heutiger Kaufkraft: Es wird mit Renditen nach Abzug der Inflationsrate gerechnet, und Kapital, Sparrate und Rentenlücke stehen in heutiger Kaufkraft. Ohne den Haken würde die Wunschrente wie ein Betrag im Jahr des Renteneintritts behandelt.",
      "Sparraten fließen am Monatsende, Entnahmen am Monatsanfang; Zinsen monatlich.",
      "Kranken- und Pflegeversicherung auf die Rente sind nicht berücksichtigt.",
      "Formeln aus den Ergebnissen des Finanzfluss-Rechners hergeleitet.",
    ],
  },

  savings: {
    sections: {
      calculation: "Berechnung",
      plan: "Sparplan",
      interest: "Zinsen",
      tax: "Steuern",
    },
    betaNote:
      "Berechnet wird das Endkapital. Die Berechnung von Anfangskapital, Sparrate, Zinssatz und Laufzeit ist im Beta-Test und für dich noch nicht freigeschaltet.",
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
    realNote: "Alle Beträge in heutiger Kaufkraft.",
    endValueMinimum: {
      startValue: (amount: string) =>
        `Schon ohne Anfangskapital erreichst du ${amount}.`,
      savingRate: (amount: string) =>
        `Schon ohne Sparrate erreichst du ${amount}.`,
      yearlyInterest: (amount: string) =>
        `Schon ohne Zinsen kommst du auf ${amount}: So viel zahlst du insgesamt ein.`,
      duration: (amount: string) =>
        `${amount} sind schon als Anfangskapital vorhanden.`,
    },
    alreadyReached: {
      startValue: (target: string, reached: string) =>
        `Mit Sparrate und Zinsen allein erreichst du schon ${reached} und damit mehr als dein Ziel von ${target}. Das negative Anfangskapital zeigt, wie viel du zu Beginn weniger bräuchtest, damit du das Ziel genau erreichst.`,
      savingRate: (target: string, reached: string) =>
        `Dein Ziel von ${target} erreichst du schon ohne Sparrate: Dein Anfangskapital wächst auf ${reached}.`,
      yearlyInterest: (target: string, reached: string) =>
        `Dein Ziel von ${target} erreichst du schon ohne Zinsen: Allein deine Einzahlungen ergeben ${reached}.`,
      duration: (target: string, reached: string) =>
        `Dein Ziel von ${target} ist schon erreicht: Dein Anfangskapital beträgt ${reached}.`,
    },
    durationUntilRetirement: (retirementAge: number, age: number) =>
      `Renteneintritt ${retirementAge} − Alter ${age}, aus den globalen Werten.`,
    chartTitle: "Kapital pro Jahr",
    chartSubtitle:
      "Einzahlungen inklusive Anfangskapital und die darauf aufgelaufenen Zinsen",
    afterTax: " nach Steuern",
    afterTaxSale: " nach Steuern bei Verkauf",
    endValueBeforeTax: "Endkapital vor Steuern",
    taxTotal: "Steuern gesamt",
    chartViewLabel: "Ansicht",
    chartViews: { before: "Vor Steuern", after: "Nach Steuern", afterSale: "Nach Steuern bei Verkauf" },
    chartAria:
      "Säulendiagramm: Kapital pro Jahr, aufgeteilt in Einzahlungen und Zinsen",
    totalDeposits: "Einzahlungen gesamt",
    assumptions: [
      "Einzahlungen erfolgen zu Beginn des Sparintervalls; Zinsen werden im gewählten Zinsintervall gutgeschrieben und mitverzinst.",
      "Mit „Inflation berücksichtigen“ wird die Inflationsrate vom Zinssatz abgezogen; die Einzahlungen bleiben in heutiger Kaufkraft gleich, die Steuer wird auf den realen Zins gerechnet.",
      "Rechenweg nach dem Finanzfluss-Sparrechner.",
    ],
    /** Which of these show depends on the tax switches. */
    taxAssumptions: {
      off: "Ohne „Steuern mitberechnen“ sind alle Beträge vor Steuern.",
      distributing:
        "Ausschüttend: Die Steuer mindert die Zinsen laufend; alle Beträge sind nach Steuern.",
      accumulating:
        "Thesaurierend: Die Steuer auf den gesamten Gewinn fällt am Ende an. Das Diagramm zeigt den Stand nach Steuern, als würdest du am Ende des jeweiligen Jahres verkaufen.",
      exemption: "Die Teilfreistellung stellt den gewählten Anteil der Erträge steuerfrei.",
      allowance: "Ein Sparerpauschbetrag ist nicht berücksichtigt.",
    },
  },

  withdrawal: {
    sections: {
      calculation: "Berechnung",
      withdrawal: "Entnahme",
      interest: "Zinsen",
    },
    betaNote:
      "Berechnet wird der Entnahmebetrag. Die Berechnung von Entnahmezeitraum und Anlagevermögen ist im Beta-Test und für dich noch nicht freigeschaltet.",
    searchedFieldHint:
      "Das gesuchte Feld entfällt bei den Eingaben und erscheint als Ergebnis.",
    interestRate: "Zinssatz p. a.",
    interestRateHint: "Deine Rendite im Ruhestand aus den globalen Werten.",
    interestAdjusted: (rate: string, inflation: boolean, tax: boolean) =>
      `Gerechnet wird mit ${rate} p. a.: Rendite im Ruhestand${inflation ? ", abzüglich Inflation" : ""}${tax ? ", nach geschätztem Steuerabzug" : ""}.`,
    realNote: "Alle Beträge in heutiger Kaufkraft.",
    fromPlan: {
      button: "Aus Gesamtplan",
      hint: "Übernimmt das freie Vermögen bei Renteneintritt (ETF-Depot und Tagesgeld, mittlerer Verlauf, in heutiger Kaufkraft) und den Auszahlungszeitraum und schaltet Steuern und Kaufkraft ein. Die Werte gelten zunächst nur hier, bis du sie speicherst.",
      done: (capital: string, years: string) =>
        `Übernommen: ${capital} über ${years}.`,
      unavailable:
        "Der Gesamtplan lässt sich mit den gewählten Profilen nicht berechnen.",
    },
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
      "Standardmäßig sind Steuern und Inflation nicht berücksichtigt, wie bei Finanzfluss. Mit den Schaltern „Steuern auf die Erträge berücksichtigen“ und „Inflation berücksichtigen“ rechnet der Rechner wie der Gesamtplan, mit kleinen Abweichungen durch die Rechenkonventionen (Entnahme am Ende des Intervalls, Zins auf das Intervall umgerechnet).",
      "Formeln aus den Ergebnissen des Finanzfluss-Rechners hergeleitet.",
    ],
  },
};

export type Dictionary = typeof de;
