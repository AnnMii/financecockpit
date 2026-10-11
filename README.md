# Finanzcockpit

Persönliches Finanzcockpit: mehrere Rechner, die sich Werte wie Alter, Sparrate
und erwartete Rendite teilen, und ein Cockpit, das ihre Ergebnisse zusammenführt.
Alle Werte liegen in Profilen und werden pro Benutzerkonto gespeichert.

| Rechner | Seite |
| --- | --- |
| Altersvorsorgedepot | `/rechner/altersvorsorgedepot` |
| Rentenlücke | `/rechner/rentenluecke` |
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
    (app)/             alles hinter dem Login: Cockpit, Rechner, Einstellungen
    actions/           Server Actions (Login, Einstellungen speichern)
  components/          Oberfläche; settings-provider.tsx hält die Einstellungen
  db/                  Datenbankschema und Verbindung (Drizzle + libSQL)
  lib/
    auth/              Passwort-Hashing (scrypt), Sitzungen
    calculators/       Rechenlogik ohne UI, mit Tests
    settings/          Felder, Wertebereiche und Standardwerte der Einstellungen
    i18n/              Wörterbücher (Deutsch, Englisch) und Sprachwahl
drizzle/               SQL-Migrationen (werden beim Start angewendet)
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
| Alter, Renteneintritt | ✓ | ✓ | | |
| Sparrate pro Monat | ✓ | | ✓ | |
| Erwartete Rendite | ✓ | ✓ bis zur Rente | ✓ Zinssatz | |
| Rendite im Ruhestand | ✓ | ✓ | | ✓ Zinssatz |
| Auszahlung bis Alter | ✓ (mind. 85) | ✓ | | |
| Vorhandenes Kapital | | ✓ | ✓ Anfangskapital | |
| Inflation | | ✓ | | |
| Kapitalertragsteuer | | ✓ | ✓ | |
| Einkommen, Sparerpauschbetrag, Kinder | ✓ | | | |

### Profile

Jeder Bereich hat eine eigene Liste benannter Profile; je Bereich ist eines
aktiv. So lässt sich etwa das globale Profil „Basis“ mit dem AV-Depot-Profil
„Mit Einmalauszahlung“ kombinieren. Die Auswahl gilt überall: im Cockpit, in den
Rechnern und in den Einstellungen.

- **Einstellungen-Seite:** Änderungen an den globalen Werten werden nach kurzer
  Pause automatisch im aktiven Profil gespeichert.
- **Rechner:** Änderungen gelten zunächst nur lokal in der Ansicht
  (`DraftSettings` in `src/components/draft-settings.tsx`). „Zurücksetzen“ oder
  ein Neuladen stellt die gespeicherten Werte wieder her. „Speichern“ im Fenster
  unten rechts schreibt Rechner-Werte ins aktive Profil des Rechners. Für
  geänderte globale Werte fragt das Fenster, in welches globale Profil sie
  sollen: das aktive (Vorgabe), ein anderes oder ein neues. Das gewählte Profil
  wird danach das aktive.
- **Globale Profile verwalten:** Umbenennen und Löschen gehen nur auf der
  Einstellungen-Seite. In den Rechnern lässt sich das aktive globale Profil
  sehen und wechseln; ein neues entsteht dort nur über das Speichern-Fenster.
- **Profile eines Rechners:** „Neu …“ im Rechner legt ein Profil mit den Werten
  an, die gerade zu sehen sind – inklusive ungespeicherter Änderungen.
- Ein Profilwechsel verwirft lokale Änderungen des betroffenen Bereichs. Das
  letzte Profil eines Bereichs lässt sich nicht löschen.

### Cockpit

Die Startseite zeigt für die gewählte Profil-Kombination die Kernzahlen und das
Diagramm jedes Rechners (dieselben Diagramm-Komponenten wie auf den
Rechner-Seiten, `src/components/charts/calculator-charts.tsx`) und ein
Gesamtbild zum Ruhestand: Wunschrente gegenüber Nettorente
(Rentenlücke-Rechner) plus Netto-Rente aus dem Altersvorsorgedepot, die
verbleibende Lücke sowie Kapital und zusätzliche Sparrate, die sie schließen
(`src/lib/calculators/retirement-overview.ts`).

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
