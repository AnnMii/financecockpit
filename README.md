# Finanzcockpit

Persönliches Finanzcockpit: mehrere Rechner, die sich Werte wie Alter, Sparrate
und erwartete Rendite teilen, und ein Cockpit, das ihre Ergebnisse zusammenführt.
Alle Werte liegen in Profilen und werden pro Benutzerkonto gespeichert.

| Bereich | Seite |
| --- | --- |
| Cockpit | `/` |
| Gesamtplan | `/plan` |
| Verlauf (Ist-Stände) | `/verlauf` |
| Rentenlücke | `/rechner/rentenluecke` |
| Altersvorsorgedepot | `/rechner/altersvorsorgedepot` |
| Sparrechner | `/rechner/sparrechner` |
| Entnahmeplan | `/rechner/entnahmeplan` |

## Starten

```bash
git submodule update --init   # Finanzfluss-Original für den Vergleichstest
npm install
npm run dev
```

Dann <http://localhost:3000> öffnen und ein Konto anlegen. Die Datenbank
(`data/financecockpit.db`, SQLite) wird beim ersten Start automatisch angelegt.

| Befehl                | Zweck                                             |
| --------------------- | ------------------------------------------------- |
| `npm run dev`         | Entwicklungsserver                                |
| `npm run build`       | Produktions-Build, danach `npm start`             |
| `npm test`            | Tests der Rechenlogik                             |
| `npm run typecheck`   | TypeScript prüfen                                 |
| `npm run lint`        | ESLint                                            |
| `npm run db:generate` | Migration nach einer Änderung am Datenbankschema  |
| `npm run upstream:diff` | Änderungen am Finanzfluss-Original seit dem übernommenen Stand |
| `npm run upstream:check-api` | Prüft, ob die Finanzfluss-Seite für Rentenlücke und Entnahmeplan noch dieselben Ergebnisse liefert |

## Aufbau

```
src/
  app/
    (auth)/            Anmelden, Registrieren
    (app)/             alles hinter dem Login: Cockpit, Rechner, Globale Werte
    actions/           Server Actions (Login, Einstellungen speichern)
  components/          Oberfläche; settings-provider.tsx hält die Einstellungen
  db/                  Datenbankschema und Verbindung (Drizzle + libSQL)
  lib/
    auth/              Passwort-Hashing (scrypt), Sitzungen
    calculators/       Rechenlogik ohne UI, mit Tests
    settings/          Felder, Wertebereiche und Standardwerte der Einstellungen
    i18n/              Wörterbücher (Deutsch, Englisch) und Sprachwahl
    plan/              Gesamtplan: Simulation, Leitplanken, Verlauf
drizzle/               SQL-Migrationen (werden beim Start angewendet); neben
                       Schema-Änderungen auch von Hand geschriebene für
                       gespeicherte Werte, z. B. 0004
test/upstream/         Vergleichstests gegen das Finanzfluss-Original
test/fixtures/         Aufgezeichnete Ergebnisse der Finanzfluss-Seite
vendor/                Finanzfluss-Original als Git-Submodul (nur für Tests)
scripts/               Hilfsskripte
```

### Globale und rechnerspezifische Werte

Werte liegen in Bereichen (`scope`): `shared` enthält die **globalen Werte**,
die mehrere Rechner nutzen; jeder Rechner hat zusätzlich einen eigenen Bereich
für das, was nur er braucht. Felder, Wertebereiche und Standardwerte stehen in
`src/lib/settings/schema.ts`, die Beschriftungen in den Wörterbüchern
(`src/lib/i18n/`).

| Globaler Wert | AV-Depot | Rentenlücke | Sparrechner | Entnahmeplan |
| --- | --- | --- | --- | --- |
| Alter, Renteneintritt | ✓ | ✓ | ✓ Laufzeit (abschaltbar) | |
| Zum Investieren verfügbar pro Monat (Budget) | Hinweis unter der Rate | | Hinweis unter der Rate | |
| Erwartete Rendite | ✓ | ✓ bis zur Rente | ✓ Zinssatz | |
| Rendite im Ruhestand | ✓ | ✓ | | ✓ Zinssatz |
| Auszahlung bis Alter | ✓ (mind. 85) | ✓ | | |
| Vorhandenes Kapital | | ✓ | ✓ Anfangskapital | |
| Inflation | | ✓ | | |
| Kapitalertragsteuer | | ✓ | ✓ | |
| Einkommen, Sparerpauschbetrag, Kinder | ✓ | | | |

Der Gesamtplan nutzt alle globalen Werte außer dem Schalter „Inflation
berücksichtigen": Er rechnet immer in heutiger Kaufkraft. Der Schalter wirkt nur
auf den Rentenlücke-Rechner; der Entnahmeplan hat einen eigenen Schalter („In
heutiger Kaufkraft rechnen“) und zeigt dafür die globale Inflationsrate, die
übrigen Rechner rechnen immer nominal.

Jedes Feld hat neben dem Label ein „i" mit einer kurzen Erklärung (Texte unter
`fieldInfo` in den Wörterbüchern). Bei „Auszahlung bis Alter" zeigt es auf der
Seite „Globale Werte" die Verteilung der Sterbealter in Deutschland
(`src/lib/data/life-table.ts`, Sterbetafel 2023/2025 des Statistischen
Bundesamts; bei einer neuen Sterbetafel von Hand zu ersetzen).

### Profile

Jeder Bereich hat eine eigene Liste benannter Profile; je Bereich ist eines
aktiv. So lässt sich etwa das globale Profil „Basis“ mit dem AV-Depot-Profil
„Mit Einmalauszahlung“ kombinieren. Die Auswahl gilt überall: im Cockpit, in den
Rechnern und auf der Seite „Globale Werte".

- **Globale Werte, Rechner und Gesamtplan:** Änderungen gelten zunächst
  nur lokal in der Ansicht
  (`DraftSettings` in `src/components/draft-settings.tsx`). „Zurücksetzen“ oder
  ein Neuladen stellt die gespeicherten Werte wieder her. „Speichern“ im Fenster
  unten rechts schreibt Rechner-Werte ins aktive Profil des Rechners. Für
  geänderte globale Werte fragt das Fenster, in welches globale Profil sie
  sollen: das aktive (Vorgabe), ein anderes oder ein neues. Das gewählte Profil
  wird danach das aktive.
- **Globale Profile verwalten:** Umbenennen und Löschen gehen nur auf der
  Seite „Globale Werte". In den Rechnern lässt sich das aktive globale Profil
  sehen und wechseln; ein neues entsteht dort nur über das Speichern-Fenster.
- **Profile eines Rechners:** „Neu …“ im Rechner legt ein Profil mit den Werten
  an, die gerade zu sehen sind – inklusive ungespeicherter Änderungen.
- Ein Profilwechsel verwirft lokale Änderungen des betroffenen Bereichs. Das
  letzte Profil eines Bereichs lässt sich nicht löschen.

### Cockpit

Die Startseite zeigt für die gewählte Profil-Kombination oben den Gesamtplan
(Status, Korridor) und darunter die Kernzahlen und das Diagramm jedes Rechners
(dieselben Diagramm-Komponenten wie auf den Rechner-Seiten,
`src/components/charts/calculator-charts.tsx`).

**Mehrere Tabs:** Speicherst du ein Profil oder erfasst einen Ist-Stand, holen die
anderen offenen Tabs derselben App die gespeicherten Daten neu
(`src/components/tab-sync.ts`, `BroadcastChannel`); ein Tab holt sie außerdem,
wenn er wieder sichtbar wird oder den Fokus bekommt, das deckt auch Änderungen
aus einem anderen Browser oder Gerät ab. So lässt sich in einem Tab ein Rechner
bearbeiten und im anderen das Cockpit beobachten. Ungespeicherte lokale
Änderungen eines Tabs bleiben dabei unberührt.

### Gesamtplan und Verlauf

Der Gesamtplan (`/plan`, Rechenkern in `src/lib/plan/`) beantwortet „spare ich
genug?" über drei Töpfe: Altersvorsorgedepot, ETF-Depot, Tagesgeld. Alle Beträge
sind in heutiger Kaufkraft.

- **Korridor:** 2.000 zufällige Verläufe der Rendite (fester Startwert, also
  reproduzierbar) ergeben den Bereich der mittleren 80 % und den mittleren
  Verlauf.
- **Sicherheitsniveau und Leitplanken:** einstellbar (Vorgabe 85 %, 75 %,
  95 %). Liegt die Wahrscheinlichkeit, die Wunschrente zu erreichen, unter der
  unteren Leitplanke, lautet der Status „Mehr sparen" mit Betrag; über der
  oberen „Spielraum"; dazwischen „Im Plan".
- **Nötige Sparrate:** die gesamte Sparrate, mit der das Sicherheitsniveau
  erreicht wird, bei gleicher Aufteilung auf die Töpfe. Wer sie als Sparrate
  einträgt, landet genau beim Sicherheitsniveau.
- **Budget und Sparraten:** Das globale „Zum Investieren verfügbar pro Monat"
  ist das Budget. Die Sparraten sind lokal: Altersvorsorgedepot (Vorgabe 150 €,
  die Fördergrenze; höchstens 1.140 €) und Sparrechner (das ETF-Depot) haben ihre
  Rate im eigenen Profil, das Tagesgeld im Plan. Der Plan addiert sie und
  zeigt, ob sie das Budget über- oder unterschreiten, und ob das Budget für die
  nötige Sparrate reicht. Neben jeder Rate setzt der Knopf „Rest" den noch freien
  Betrag ein (`src/lib/calculators/budget.ts`). Unter 10 € im AV-Depot rechnet
  der Plan ohne es und legt das Geld ins ETF-Depot.
- **Auszahlung:** Die Karte „Rente aus allen Quellen" (Plan-Seite und Cockpit)
  zerlegt den mittleren Verlauf in Vermögen bei Renteneintritt und Rente pro
  Monat: gesetzliche Rente, AV-Depot, Entnahme aus dem freien Vermögen (ETF-Depot
  und Tagesgeld) nach Steuern. Ob das freie Vermögen aufgebraucht wird oder nur
  seine Erträge entnommen werden, steht im Profil des Entnahmeplans
  (`capitalConsumption`), das der Plan mitliest. Steuern auf die Erträge zieht
  der geschätzte Steuerabzug des Rentenlücke-Profils ab.
- **Woher die Werte kommen:** Rentenansprüche und Wunschrente stehen auf der
  Plan-Seite, gehören aber zum aktiven Profil des Rentenlücke-Rechners und
  gelten auch dort. Die Einzelheiten des AV-Depots kommen aus dessen Profil.
- **Heutiger Stand:** der letzte Ist-Stand aus dem Verlauf. Solange keiner
  erfasst ist, gilt das „Vorhandene Kapital" der globalen Werte als Stand im
  ETF-Depot.

Verfolgen über die Zeit (`/verlauf`):

1. **Plan festschreiben** (auf der Plan-Seite): friert Annahmen und Korridor
   zum Stichtag ein. Die Planversion ändert sich nie mehr.
2. **Ist-Stand erfassen** (jährlich): Wert je Topf, Einzahlungen seit dem
   letzten Stand, optional die tatsächliche Inflation.
3. **Vergleich:** Ist-Stände erscheinen als Punkte im eingefrorenen Korridor.
   Die Abweichung wird in Einzahlungen und Markt zerlegt; die Wirkung
   geänderter Annahmen auf die nötige Sparrate steht getrennt daneben.
4. **Verlauf der nötigen Sparrate:** je Stichtag gespeichert und als Diagramm.

Wichtig: Das Alter in den globalen Werten muss jährlich mitgeführt werden; der
Plan rechnet ab dem dort eingetragenen Alter. Planversionen und Ist-Stände
liegen in der Tabelle `plan_records`.

Grenzen des Modells stehen auf der Plan-Seite unter „Annahmen" und im
Kopfkommentar von `src/lib/plan/plan.ts`.

### Entnahmeplan und Gesamtplan

Der Entnahmeplan bleibt ein eigenständiger Rechner und rechnet standardmäßig wie
Finanzfluss: nominal, ohne Steuern. Zwei Schalter lassen ihn wie den Gesamtplan
rechnen: „Steuern auf die Erträge berücksichtigen“ (geschätzter Steuerabzug des
Rentenlücke-Profils) und „Inflation berücksichtigen (heutige Kaufkraft)“ (Inflationsrate der
globalen Werte). Der Zinssatz ist dann (Rendite − Inflation) × (1 − Steuerabzug),
in derselben Reihenfolge wie im Gesamtplan.

Der kleine Knopf „Aus Gesamtplan“ neben dem Anlagevermögen kopiert einmalig das freie Vermögen bei
Renteneintritt (mittlerer Verlauf, in heutiger Kaufkraft) und den
Auszahlungszeitraum und schaltet beide Schalter ein; danach ist der Rechner
wieder unabhängig. Die Monatsrente weicht dann kaum vom Gesamtplan ab (im
Beispiel 0,03 %; ein Test erlaubt höchstens 3 % für Renditen von 2 bis 6 %), weil
die Konventionen leicht verschieden sind: Der Gesamtplan zahlt zu Monatsbeginn
mit Jahreszins ÷ 12, der Entnahmeplan am Ende des Intervalls mit dem
äquivalenten Monatszins.

Umgekehrt zeigt die Karte „Rente aus allen Quellen“ auf Wunsch die Beträge in
künftigen Euro („Beträge in künftigen Euro anzeigen“), um sie neben die
nominalen Ergebnisse von AV-Depot-Rechner und Sparrechner zu legen. Gerechnet
wird weiter in heutiger Kaufkraft. Die Cockpit-Karten nennen in einer Zeile, ob
sie nominal oder in heutiger Kaufkraft rechnen.

### Sparrechner

Die Laufzeit folgt standardmäßig den globalen Werten (Renteneintritt minus
Alter); der Schalter „Laufzeit bis Renteneintritt" gibt sie frei. Ist das
gewünschte Endkapital schon erreicht, ohne dass es die gesuchte Größe braucht
(z. B. Anfangskapital gesucht, aber Sparrate und Zinsen führen allein über das
Ziel), lautet das Ergebnis 0 mit einem Hinweis, was ohnehin erreicht wird.

### Sprachen

Die Oberfläche gibt es auf Deutsch und Englisch; umgeschaltet wird oben rechts
(DE/EN), auch auf der Anmeldeseite. Die Wahl liegt in einem Cookie, gilt also
je Browser, und bleibt über Abmelden und Neuladen erhalten.

- **Texte:** `src/lib/i18n/de.ts` ist die Vorlage, `en.ts` hat dieselbe
  Struktur. Fehlt dort ein Text, meldet die Typprüfung das. Texte mit Zahlen
  oder Namen sind Funktionen.
- **Zahlen:** `src/lib/format.ts` schreibt und liest Zahlen je Sprache
  (228.547 € und 0,5 auf Deutsch, €228,547 und 0.5 auf Englisch). Die Währung
  ist immer Euro.
- **Fehlermeldungen:** Rechner, Anmeldung und Profilverwaltung liefern Codes
  (z. B. `avPayoutMin85`); die Texte dazu stehen in den Wörterbüchern.
- **In Komponenten:** `useLocale()` liefert `t` (Texte) und `f` (Formate); in
  Server Components `getDictionary()` aus `src/lib/i18n/server.ts`.
- **Nicht übersetzt:** die Adressen der Seiten (`/rechner/sparrechner` usw.),
  diese README und deutsche Fachbegriffe ohne englische Entsprechung
  (Altersvorsorgedepot, Riester, Rürup).

Eine weitere Sprache: Kürzel in `src/lib/i18n/locale.ts` ergänzen, ein
Wörterbuch nach dem Muster von `en.ts` anlegen und in `index.ts` eintragen,
Zahlenformat in `format.ts` ergänzen.

### Einen Rechner hinzufügen

1. Rechenlogik als reine Funktion in `src/lib/calculators/` schreiben und testen.
2. Bereich und Felder in `src/lib/settings/schema.ts` ergänzen, Beschriftungen und
   alle weiteren Texte in beiden Wörterbüchern (`src/lib/i18n/de.ts`, `en.ts`).
   Was ein anderer Rechner schon nutzt, gehört in `shared`.
3. Rechner und die Abbildung der Werte auf seine Eingaben in
   `src/lib/calculators/registry.ts` eintragen, dazu einen Hook in
   `src/components/use-calculators.ts`.
4. Seite unter `src/app/(app)/rechner/<name>/page.tsx` anlegen; `CalculatorShell`
   liefert Profil-Auswahl, Formularspalte und das Fenster für lokale Änderungen.
5. Karte im Cockpit (`src/components/dashboard.tsx`) ergänzen.

## Herkunft der Rechenlogik

| Rechner | Quelle | Absicherung |
| --- | --- | --- |
| Altersvorsorgedepot | Quellcode im Submodul | Vergleichstest gegen das Original |
| Sparrechner | Quellcode im Submodul | Vergleichstest gegen das Original |
| Rentenlücke | nicht öffentlich; die Finanzfluss-Seite rechnet auf ihrem Server | Formeln aus aufgezeichneten Ergebnissen hergeleitet |
| Entnahmeplan | nicht öffentlich; wie Rentenlücke | Formeln aus aufgezeichneten Ergebnissen hergeleitet |

### Rentenlücke und Entnahmeplan

Für diese beiden gibt es keinen Quellcode zum Vergleichen. Die Formeln sind aus
den Antworten der Finanzfluss-Seite hergeleitet; die Antworten liegen als
Soll-Werte in `test/fixtures/` und werden von `npm test` geprüft.

```bash
npm run upstream:check-api              # liefert die Seite noch dieselben Ergebnisse?
npm run upstream:check-api -- --record  # aktuelle Ergebnisse als Soll-Werte übernehmen
```

Meldet die Prüfung Abweichungen, hat Finanzfluss die Berechnung geändert: Formeln
in `pension-gap.ts` bzw. `withdrawal-plan.ts` anpassen, dann mit `--record` neu
aufzeichnen. Neue Testfälle kommen als Eintrag mit `name` und `params` in die
Fixture-Datei und werden ebenfalls mit `--record` gefüllt.

Abweichung vom Original: Im Entnahmeplan zeigt das Diagramm der Finanzfluss-Seite
ohne Kapitalverzehr ein leicht sinkendes Kapital (Näherung der unterjährigen
Zinsen). Hier bleibt es konstant; verglichen werden nur die Ergebniszahlen.

### Altersvorsorgedepot und Sparrechner

Die Rechenlogik (`src/lib/calculators/av-depot.ts`, `income-tax.ts`, `savings.ts`)
ist eine eigene Umsetzung, die dem
[Finanzfluss-Rechner](https://www.finanzfluss.de/rechner/altersvorsorgedepot/)
und dessen Quellcode ([finanzfluss/calculators](https://github.com/finanzfluss/calculators))
folgt. Eigen ist sie, weil das Original nur formatierten Text liefert und die
Aufschlüsselung nach Zulagen, Steuerersparnis und Wertzuwachs nicht ausgibt,
die Diagramm und Kennzahlen brauchen.

#### Abgleich mit dem Finanzfluss-Original

Damit Korrekturen am Original hier nicht unbemerkt fehlen, ist dessen
Repository als Git-Submodul unter `vendor/finanzfluss-calculators` eingebunden.
Die App importiert nichts daraus; es dient nur als Referenz:

- **Übernommener Stand:** Der Commit, auf dem das Submodul steht, ist der Stand,
  dem die eigene Logik entspricht. Er ist Teil der Git-Historie dieses Repos
  (`git submodule status` zeigt ihn an).
- **Vergleichstests:** `test/upstream/av-depot.parity.test.ts` und
  `savings.parity.test.ts` rechnen dieselben Eingaben mit dem Original und mit
  der eigenen Umsetzung und vergleichen die Ergebnisse. Sie laufen mit
  `npm test`. Ist das Submodul nicht ausgecheckt, werden sie übersprungen.

Nach einem frischen Klon das Submodul einmal holen:

```bash
git submodule update --init
```

**Änderungen des Originals übernehmen:**

1. Ansehen, was sich an den Rechner-Dateien geändert hat:

   ```bash
   npm run upstream:diff
   ```

   Meldet das Skript keine Änderungen, ist nichts zu tun.

2. Das Submodul auf den neuen Stand setzen:

   ```bash
   git -C vendor/finanzfluss-calculators checkout origin/main
   ```

3. `npm test` ausführen. Der Vergleichstest schlägt dort fehl, wo die eigene
   Umsetzung vom Original abweicht, und nennt Eingabe, eigenen Wert und
   Original-Wert.

4. `av-depot.ts`, `income-tax.ts` bzw. `savings.ts` anpassen, bis alle Tests grün sind. Ein
   neuer Einkommensteuertarif wird in `income-tax.ts` als weiterer Eintrag
   ergänzt.

5. Submodul-Stand und Anpassungen zusammen committen:

   ```bash
   git add vendor/finanzfluss-calculators src
   git commit
   ```

Die festen Soll-Werte in `src/lib/calculators/av-depot.test.ts` stammen ebenfalls
aus dem Original; ändern sich dort Ergebnisse, werden sie im selben Schritt
angepasst.

**Lizenz:** Das Original steht unter AGPL-3.0. Es wird hier nicht ausgeliefert,
die eigene Umsetzung folgt ihm aber eng. Für die private Nutzung ist das ohne
Belang. Wird die App für andere Nutzer gehostet, sollte der Quellcode dieses
Projekts unter AGPL offengelegt werden.

## Hosten

Die App ist eine normale Next.js-Anwendung mit Node-Server.

- **Eigener Server / Docker:** `npm run build && npm start`. Das Verzeichnis
  `data/` muss erhalten bleiben (Volume) und gesichert werden.
- **Serverless (z. B. Vercel):** dort gibt es kein dauerhaftes Dateisystem.
  `DATABASE_URL` auf eine gehostete libSQL-Datenbank (Turso) setzen, dazu
  `DATABASE_AUTH_TOKEN`. Am Code ändert sich nichts.

Vor dem Hosten:

- Nur über HTTPS betreiben (das Sitzungs-Cookie ist im Produktionsmodus `Secure`).
- `ALLOW_REGISTRATION=false` setzen, sobald alle Konten existieren.
- Es gibt noch keine Begrenzung von Anmeldeversuchen und kein
  „Passwort vergessen“ – beides vor einem öffentlichen Betrieb ergänzen.

Umgebungsvariablen: siehe `.env.example`.
