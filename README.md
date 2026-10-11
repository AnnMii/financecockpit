# Finanzcockpit

Persönliches Finanzcockpit: eine Startseite mit Kennzahlen und mehrere Rechner,
die sich Einstellungen wie Alter, Sparrate und erwartete Rendite teilen. Die
Einstellungen werden pro Benutzerkonto gespeichert.

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
drizzle/               SQL-Migrationen (werden beim Start angewendet)
test/upstream/         Vergleichstest gegen das Finanzfluss-Original
vendor/                Finanzfluss-Original als Git-Submodul (nur für Tests)
scripts/               Hilfsskripte
```

### Geteilte Einstellungen

Einstellungen liegen je Benutzer in Bereichen (`scope`): `shared` gilt für alle
Rechner, jeder Rechner hat zusätzlich einen eigenen Bereich. Felder,
Wertebereiche und Standardwerte stehen in `src/lib/settings/schema.ts`.

- **Einstellungen-Seite:** Änderungen werden nach kurzer Pause automatisch
  gespeichert.
- **Rechner:** Änderungen gelten nur lokal in der Ansicht (`DraftSettings` in
  `src/components/draft-settings.tsx`). Erst „In Einstellungen speichern“
  schreibt sie ins Konto; „Zurücksetzen“ oder ein Neuladen stellt die
  gespeicherten Werte wieder her.

### Einen Rechner hinzufügen

1. Rechenlogik als reine Funktion in `src/lib/calculators/` schreiben und testen.
2. Eigene Felder und den Bereich in `src/lib/settings/schema.ts` ergänzen.
3. Rechner in `src/lib/calculators/registry.ts` eintragen (Navigation, Cockpit).
4. Seite unter `src/app/(app)/rechner/<name>/page.tsx` anlegen.

## Altersvorsorgedepot-Rechner

Die Rechenlogik (`src/lib/calculators/av-depot.ts`, `income-tax.ts`) ist eine
eigene Umsetzung, die dem
[Finanzfluss-Rechner](https://www.finanzfluss.de/rechner/altersvorsorgedepot/)
und dessen Quellcode ([finanzfluss/calculators](https://github.com/finanzfluss/calculators))
folgt. Eigen ist sie, weil das Original nur formatierten Text liefert und die
Aufschlüsselung nach Zulagen, Steuerersparnis und Wertzuwachs nicht ausgibt,
die Diagramm und Kennzahlen brauchen.

### Abgleich mit dem Finanzfluss-Original

Damit Korrekturen am Original hier nicht unbemerkt fehlen, ist dessen
Repository als Git-Submodul unter `vendor/finanzfluss-calculators` eingebunden.
Die App importiert nichts daraus; es dient nur als Referenz:

- **Übernommener Stand:** Der Commit, auf dem das Submodul steht, ist der Stand,
  dem die eigene Logik entspricht. Er ist Teil der Git-Historie dieses Repos
  (`git submodule status` zeigt ihn an).
- **Vergleichstest:** `test/upstream/av-depot.parity.test.ts` rechnet dieselben
  Eingaben mit dem Original und mit der eigenen Umsetzung und vergleicht
  Endkapital, Auszahlungen und das Kapital jedes Jahres. Er läuft mit `npm test`.
  Ist das Submodul nicht ausgecheckt, wird er übersprungen.

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

4. `av-depot.ts` bzw. `income-tax.ts` anpassen, bis alle Tests grün sind. Ein
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
