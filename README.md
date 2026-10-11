# Finanzcockpit

Persönliches Finanzcockpit: eine Startseite mit Kennzahlen und mehrere Rechner,
die sich Einstellungen wie Alter, Sparrate und erwartete Rendite teilen. Die
Einstellungen werden pro Benutzerkonto gespeichert.

## Starten

```bash
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
```

### Geteilte Einstellungen

Einstellungen liegen je Benutzer in Bereichen (`scope`): `shared` gilt für alle
Rechner, jeder Rechner hat zusätzlich einen eigenen Bereich. Felder,
Wertebereiche und Standardwerte stehen in `src/lib/settings/schema.ts`.
Änderungen in der Oberfläche werden nach kurzer Pause automatisch gespeichert.

### Einen Rechner hinzufügen

1. Rechenlogik als reine Funktion in `src/lib/calculators/` schreiben und testen.
2. Eigene Felder und den Bereich in `src/lib/settings/schema.ts` ergänzen.
3. Rechner in `src/lib/calculators/registry.ts` eintragen (Navigation, Cockpit).
4. Seite unter `src/app/(app)/rechner/<name>/page.tsx` anlegen.

## Altersvorsorgedepot-Rechner

Eigene Umsetzung nach der
[Dokumentation des Finanzfluss-Rechners](https://www.finanzfluss.de/rechner/altersvorsorgedepot/).
Die Tests vergleichen die Ergebnisse mit den veröffentlichten Testwerten der
Referenz-Implementierung ([finanzfluss/calculators](https://github.com/finanzfluss/calculators),
Stand `dcc29a6`). Der Einkommensteuertarif steht in
`src/lib/calculators/income-tax.ts` und muss bei einem neuen Tarif ergänzt werden.

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
