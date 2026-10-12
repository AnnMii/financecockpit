# Geplante Features

Vorhaben, die durchdacht und abgestimmt, aber **noch nicht umgesetzt** sind.
Offene Prüfpunkte zum bestehenden Stand stehen in [TODO.md](TODO.md).

---

## 1. Profile im Browser verschlüsseln und anonyme Statistik ergänzen

**Status:** geplant, nicht begonnen (Stand 11.10.2026)

### Ausgangslage

Alle eingegebenen Werte liegen als Klartext-JSON in der Tabelle `profiles` und
sind über die Benutzer-ID direkt mit der E-Mail verknüpft:

| Tabelle | Inhalt | Schutz heute |
| --- | --- | --- |
| `users` | E-Mail, Passwort, Anlagedatum | Passwort nur als scrypt-Hash, E-Mail im Klartext |
| `sessions` | Anmeldungen | nur ein Hash des Sitzungs-Tokens |
| `profiles` | Profilname und alle Werte als JSON, mit Benutzer-ID | **Klartext** |

Wer die Datenbankdatei lesen kann (Betreiber, Hoster, Angreifer nach einem
Leck), sieht zu jeder E-Mail Alter, Einkommen, Rentenansprüche und Geburtsjahre
der Kinder.

### Ziel

1. **Verschlüsselung im Browser:** Der Server speichert Profile nur noch
   verschlüsselt und kann sie nicht lesen. Das Passwort verlässt den Browser
   nicht mehr.
2. **Anonyme Statistik:** Getrennt davon entstehen gerundete Datensätze ohne
   Konto-Bezug, damit auswertbar bleibt, was Nutzer eingeben.
3. **Wiederherstellungsschlüssel:** Ein vergessenes Passwort führt nicht zum
   Datenverlust, solange der Nutzer diesen Schlüssel aufbewahrt hat.

Das geht ohne Funktionsverlust, weil alle Rechner und das Cockpit bereits im
Browser rechnen; der Server braucht die Werte nie im Klartext.

### Getroffene Entscheidungen

| Frage | Entscheidung | Verworfen |
| --- | --- | --- |
| Schutzmodell | Verschlüsselung im Browser **plus** anonyme Statistik | nur Verschlüsselung (keine Auswertung möglich); Pseudonymisierung (Werte bleiben lesbar, schwächerer Schutz) |
| Genauigkeit der Statistik | ganze Datensätze mit gerundeten Werten, damit Zusammenhänge sichtbar bleiben | Häufigkeiten je Feld (sicherer, aber ohne Zusammenhänge) |
| Passwort vergessen | Wiederherstellungsschlüssel, einmalig bei der Registrierung angezeigt | Daten gelten als verloren |

### Grenzen, die bleiben

- **Der ausgelieferte Code ist die Vertrauensgrenze.** Die Verschlüsselung
  schützt vor Datenbank-Lecks, einem neugierigen Hoster und einem Blick in die
  Datenbank. Sie schützt nicht davor, dass der Betreiber absichtlich Code
  ausliefert, der Daten abgreift.
- **Gerundete Datensätze sind nicht garantiert anonym.** Bei wenigen Nutzern
  kann eine seltene Kombination auf eine Person hindeuten (z. B. Alter 40–44,
  zwei Kinder, Einkommen 74.000 €). Rundung, fehlende Zeitstempel und eine
  Auswertung erst ab einer Mindestanzahl mindern das, heben es aber nicht auf.
  Das war bei der Entscheidung für ganze Datensätze bewusst in Kauf genommen.
- **Sichtbar bleiben:** E-Mail, Anlagedatum des Kontos, welche Rechner ein
  Konto nutzt und wie viele Profile es hat – nicht deren Namen oder Inhalte.
- **Rechtliches:** Bei einem Hosting für andere kommen Datenschutzerklärung und
  DSGVO-Pflichten hinzu. Das ist technisch vorbereitbar, muss aber rechtlich
  gesondert geprüft werden.

### Umsetzung

#### 1. Schlüssel (alles im Browser, WebCrypto)

Neues Modul `src/lib/crypto/`, ohne DOM-Abhängigkeit und damit in Vitest
testbar:

- Aus Passwort und einem Salt je Konto entsteht per PBKDF2 (SHA-256, 600.000
  Runden) ein Hauptschlüssel; daraus per HKDF zwei getrennte Schlüssel:
  - **Anmeldeschlüssel** – wird statt des Passworts an den Server geschickt
    und dort wie bisher mit scrypt gehasht (`src/lib/auth/password.ts` bleibt).
  - **Schlüssel-Schlüssel** – verpackt den Datenschlüssel.
- **Datenschlüssel:** zufälliger AES-256-GCM-Schlüssel je Konto. Er
  verschlüsselt Inhalt und Namen jedes Profils, mit eigenem Zufallswert je
  Speichern. Profil-ID und Bereich fließen als gebundene Zusatzdaten ein, damit
  sich Profile nicht vertauschen lassen.
- Der Server speichert den Datenschlüssel nur verpackt: einmal mit dem
  Schlüssel-Schlüssel, einmal mit dem Wiederherstellungsschlüssel.
- Im Browser liegt der Datenschlüssel als **nicht exportierbarer** Schlüssel in
  IndexedDB, damit ein Neuladen ohne Passwort funktioniert. Abmelden löscht ihn.
- **Wiederherstellungsschlüssel:** zufällig, bei der Registrierung einmalig
  angezeigt (Gruppen aus Buchstaben und Ziffern), mit Bestätigung „notiert".

#### 2. Anmeldung

Betroffen: `src/app/actions/auth.ts`, `src/components/auth-form.tsx`.

- Die Formulare rechnen die Schlüssel im Browser und rufen die Server Actions
  direkt auf, statt das Formular mit Passwort abzuschicken.
- Eine neue Action liefert zu einer E-Mail das Salt; für unbekannte E-Mails ein
  stabiles Schein-Salt, damit sich nicht erkennen lässt, ob ein Konto existiert.
  Das Geheimnis dafür liegt in einer kleinen Tabelle `meta` und wird beim
  ersten Start erzeugt.
- **Registrierung:** legt Salt, Hash des Anmeldeschlüssels und beide verpackten
  Datenschlüssel an und zeigt den Wiederherstellungsschlüssel.
- **Anmeldung:** prüft den Anmeldeschlüssel und liefert den verpackten
  Datenschlüssel; der Browser packt ihn aus.
- **Passwort ändern** (neu, Einstellungen-Seite): altes Passwort bestätigen,
  Datenschlüssel neu verpacken. Die Profile selbst bleiben unverändert.
- **Passwort vergessen** (neue Seite `/wiederherstellen`): E-Mail,
  Wiederherstellungsschlüssel, neues Passwort. Der Nachweis läuft über einen aus
  dem Wiederherstellungsschlüssel abgeleiteten Wert, dessen Hash der Server
  kennt; E-Mail-Versand ist nicht nötig. Danach wird ein neuer
  Wiederherstellungsschlüssel ausgegeben.
- Fehlt der Datenschlüssel im Browser trotz gültiger Sitzung (anderes Gerät,
  Browserdaten gelöscht), wird abgemeldet und neu angemeldet.

#### 3. Profile speichern und laden

- `src/db/schema.ts` und Migration: `users` bekommt Salt, verpackte
  Datenschlüssel, Hash für die Wiederherstellung und `stats_opt_in`. In
  `profiles` halten `name` und `data` künftig Chiffrat; der eindeutige Index auf
  dem Namen entfällt, weil der Server Namen nicht mehr vergleichen kann.
- `src/lib/settings/store.ts`, `src/app/actions/settings.ts`: behandeln Inhalt
  und Namen als undurchsichtige Blöcke und prüfen nur noch Zugehörigkeit,
  Format, Größe (etwa 8 KB) und die Höchstzahl von 20 Profilen je Bereich.
  `loadProfiles` legt keine Standard-Profile mehr an.
- `src/components/settings-provider.tsx`: entschlüsselt nach dem Laden im
  Browser (kurzer Ladezustand statt serverseitig gerenderter Werte),
  verschlüsselt vor jedem Speichern und legt fehlende „Standard"-Profile an.
  Die Prüfung der Werte bleibt `parseSettings` aus
  `src/lib/settings/schema.ts`, jetzt nach dem Entschlüsseln. Namensgleichheit
  prüft `src/components/profile-picker.tsx` im Browser.
- Rechner, Cockpit, Entwurfsmodus und Felder bleiben unverändert; sie arbeiten
  weiter mit `useSettings()` und `useSettingsEditor()`.

#### 4. Bestehende Konten umstellen

Bestehende Konten haben Klartext-Profile und einen Hash des Passworts selbst.
Beim nächsten Anmelden erkennt die Salt-Abfrage das alte Format. Der Browser
meldet sich einmalig auf dem alten Weg an, erzeugt die Schlüssel, verschlüsselt
alle Profile, lädt sie hoch und zeigt den Wiederherstellungsschlüssel. Danach
ist der alte Weg für das Konto geschlossen.

Vor der Umstellung: Sicherung der Datenbankdatei anlegen und den Ablauf an
einer Kopie testen.

#### 5. Anonyme Statistik

- Neue Tabelle `stats_entries`: Zufalls-ID, Monat (`JJJJ-MM`), Bereich,
  gerundete Werte. **Keine** Benutzer- oder Sitzungs-ID, kein genauer
  Zeitpunkt; als `WITHOUT ROWID` angelegt, damit auch die Reihenfolge der
  Einträge nichts über den Zeitpunkt verrät.
- `src/lib/settings/stats.ts` (mit Tests) rundet im Browser, bevor etwas
  gesendet wird:

  | Art des Werts | Rundung | Beispiel |
  | --- | --- | --- |
  | Alter | 5-Jahres-Gruppen | 41 → 40–44 |
  | Geldbeträge | zwei führende Stellen | 73.500 € → 74.000 € |
  | Prozentwerte | auf 0,5 | 5,8 % → 6,0 % |
  | Kinder | nur die Anzahl | Geburtsjahre 2015, 2019 → 2 |
  | Auswahl- und Schalterfelder | unverändert | „thesaurierend" |
  | Profilnamen | werden nie gesendet | – |

- Gesendet wird höchstens **ein Stand je Bereich und Monat** (Merker im
  Browser), jeweils das aktive Profil. Nicht jede einzelne Änderung, damit
  häufiges Speichern nicht stärker zählt und keine Änderungsfolgen entstehen.
- **Freiwillig:** Kästchen bei der Registrierung und in den Einstellungen,
  standardmäßig aus. Der Server nimmt Einträge nur von angemeldeten Konten mit
  Zustimmung an (Schutz vor Missbrauch), speichert davon aber nichts mit.
- **Auswertung:** `npm run stats` gibt je Bereich Anzahl und Verteilungen aus
  und zeigt Kombinationen erst ab 5 gleichen Einträgen. Keine
  Admin-Oberfläche.

#### 6. Dokumentation

- README: Abschnitt „Datenschutz" (was verschlüsselt ist, was sichtbar bleibt,
  Grenzen, Statistik, Wiederherstellung) und ein Hinweis im Abschnitt „Hosten".
- `TODO.md`: den Punkt „Passwort vergessen fehlt" anpassen und neue Prüfpunkte
  ergänzen (Rundungsregeln, Zustimmung standardmäßig aus, Mindestanzahl 5).

### Noch zu entscheiden

- **Zustimmung zur Statistik standardmäßig aus:** So geplant, weil es bei einem
  Hosting für andere die vorsichtige Wahl ist. Folge: Es kommen nur Daten von
  Nutzern, die das Kästchen aktiv setzen.
- **Rundungsregeln und Mindestanzahl 5:** Vorschläge, nicht abgestimmt.
- **Was genau in die Statistik soll:** geplant ist das aktive Profil je
  Bereich. Alternativ nur die globalen Werte.

### Verifikation nach der Umsetzung

- `npm test`: neue Tests für Schlüsselableitung, Ver- und Entschlüsseln
  (inklusive „falscher Schlüssel schlägt fehl" und „vertauschtes Profil schlägt
  fehl"), das Verpacken des Datenschlüssels und die Rundungsregeln. Alle
  bisherigen Tests bleiben grün.
- Browsertest gegen eine eigene Testdatenbank auf einem anderen Port:
  - Registrieren, Werte ändern, Profil anlegen. Danach in der Datenbankdatei
    nach bekannten Werten und Feldnamen suchen (z. B. `savingsRateMonthly` oder
    dem Profilnamen): **nichts davon darf vorkommen**.
  - Mitgeschnittene Anfragen enthalten das Passwort an keiner Stelle.
  - Neuladen behält die Werte; Abmelden und Anmelden in einem frischen
    Browserprofil ebenfalls.
  - Passwort ändern: Das alte Passwort geht nicht mehr, das neue öffnet die
    Profile.
  - Wiederherstellung mit dem Schlüssel macht die Profile wieder lesbar; ein
    falscher Schlüssel wird abgelehnt.
  - Statistik: ohne Zustimmung kein Eintrag; mit Zustimmung ein Eintrag je
    Bereich, gerundet und ohne Konto-Bezug; ein zweites Speichern im selben
    Monat erzeugt keinen weiteren.
  - Alle vier Rechner und das Cockpit liefern dieselben Zahlen wie vorher
    (z. B. AV-Depot 228.547 €).
- Umstellung an einer Kopie der echten Datenbank: Anmelden mit dem bisherigen
  Passwort, Profile danach verschlüsselt und weiterhin lesbar.
- `npm run typecheck`, `npm run lint`, `npm run build`.

### Geschätzter Umfang

Der größte Umbau seit dem Projektstart: Er berührt Anmeldung, Registrierung,
Datenbankschema, das Speichern der Profile und die Einstellungen-Seite und
bringt zwei neue Seiten (Wiederherstellung, Passwort ändern) sowie ein
Auswertungsskript. Sinnvoll in drei Schritten: erst Verschlüsselung und
Anmeldung, dann Statistik, dann Dokumentation.

---

## 2. Vermögensplan einfrieren und über die Zeit verfolgen

**Status:** Phasen 1 bis 3 umgesetzt (11.10.2026), siehe README, Abschnitt
„Gesamtplan und Verlauf". Offen ist Phase 4 (CSV-Import, Erinnerung per
Nachricht). Der folgende Text ist der ursprüngliche Plan; wie die offenen
Entscheidungen ausgefallen sind, steht direkt darunter.

### So umgesetzt (Abweichungen und getroffene Vorgaben)

- **Töpfe:** drei feste (Altersvorsorgedepot, ETF-Depot, Tagesgeld), keine frei
  benennbaren. Die Sparrate wird per Anteil aufgeteilt.
- **Rentenansprüche und Wunschrente** bleiben im Profil des
  Rentenlücke-Rechners; die Plan-Seite zeigt und ändert sie dort.
- **Rendite** bleibt nominal eingegeben; der Plan zieht die Inflationsrate
  immer ab und rechnet nur in heutiger Kaufkraft. Eine nominale Ansicht gibt
  es nicht.
- **Schwankung:** Vorgabe 15 % (Depot) und 1 % (Tagesgeld), einstellbar.
- **Profile:** Der Gesamtplan hat Profile wie die Rechner.
- **Verschlüsselung (Feature 1)** kam nicht vorher; Planversionen und
  Ist-Stände liegen im Klartext in `plan_records`.
- **Nötige Sparrate** ist die gesamte Sparrate bei gleicher Aufteilung auf die
  Töpfe (anfangs veränderte sie nur den Anteil des ETF-Depots; damit ließ sich
  bei 100 % AV-Depot kein Spielraum erkennen).
- **Heutiger Stand** vor dem ersten Ist-Stand: das „Vorhandene Kapital" der
  globalen Werte, im ETF-Depot.
- **Die Rente aus dem AV-Depot** wird im Verhältnis zu dessen Kapital
  hochgerechnet statt je Verlauf neu versteuert.
- **Das frühere „Ruhestand im Gesamtbild"** im Cockpit ist entfallen; es
  rechnete nominal und widersprach dem Gesamtplan.
- **Erinnerung:** nur ein Hinweis im Cockpit, wenn der letzte Stand älter als
  ein Jahr ist.

### Anliegen

Heute einen Plan aufstellen (z. B. mit 7 % für den MSCI World und einer
Rentenlücke von 0), ihn einfrieren und in einem oder fünf Jahren prüfen, ob du
noch im Plan bist – auch nach einem Börsencrash, starken Anstiegen, geänderter
Inflation oder wenn die Renditeannahme nicht eintritt. Ziel: auf keinen Fall zu
wenig investieren, aber auch nicht unnötig viel.

### Kritisch geprüft: Was davon trägt, was korrigiert werden muss

Das Anliegen ist der Kern professioneller Finanzplanung (eingefrorener
Ausgangsplan, regelmäßiger Soll-Ist-Vergleich). Drei Korrekturen sind nötig,
damit der Vergleich nicht zu falschen Entscheidungen führt:

1. **Der Vergleich „Ist gegen alte Plan-Linie" entscheidet nichts.** Bei rund
   15 % Schwankung pro Jahr liegt ein Aktiendepot nach einem Jahr fast nie auf
   der Linie; ±15–20 % sind Rauschen. „Unter Plan → mehr sparen" nach einem
   Crash und vor allem „über Plan → weniger sparen" nach einem Boom wären
   Fehlschlüsse. Erst ein Korridor macht den Vergleich deutbar.
2. **Entschieden wird über den Blick nach vorn.** Leitkennzahl ist die
   **nötige Sparrate**: Was müsstest du ab dem heutigen Ist-Stand sparen, um das
   Ziel zu erreichen, gegenüber dem, was du tatsächlich sparst? Sie beantwortet
   „nicht zu wenig, nicht zu viel" direkt. Der eingefrorene Plan bleibt Maßstab
   und dient der Ursachenanalyse.
3. **„Auf keinen Fall zu wenig" braucht ein Sicherheitsniveau.** Ein Plan, der
   bei 7 % genau auf Rentenlücke 0 kommt, geht nur in etwa der Hälfte der
   möglichen Verläufe auf. Deshalb: eine Zielwahrscheinlichkeit und
   **Leitplanken**. Unter der unteren wird mehr gespart, über der oberen darf
   reduziert werden, dazwischen ändert sich nichts – auch wenn das Depot
   schwankt.

Außerdem:

- **Real statt nominal.** 7 % für den MSCI World sind nominal. Bei einer
  Wunschrente in heutigen Euro muss die Inflation abgezogen werden, sonst zeigt
  der Plan eine Lücke von 0, wo real eine große ist.
- **Ein schlechtes Jahr widerlegt die Annahme nicht.** Renditeannahmen werden
  bewusst und getrennt geändert, nie automatisch aus dem letzten Jahr.
- **Der Vermögensstand allein reicht nicht.** Ohne die Einzahlungen seit dem
  letzten Stichtag lässt sich der Markt nicht vom Sparverhalten trennen, und
  beides verlangt eine andere Reaktion.
- **Abgleich jährlich.** Häufiger zeigt vor allem Rauschen; aussagekräftig wird
  der Vergleich über mehrere Jahre.

### Getroffene Entscheidungen

| Frage | Entscheidung | Verworfen |
| --- | --- | --- |
| Was wird verfolgt? | Ein neuer, in sich stimmiger **Gesamtplan**; die Rechner bleiben zum Durchspielen | Ergebnisse der einzelnen Rechner verfolgen (Sparrate bliebe doppelt angesetzt, siehe `TODO.md` Punkt 4) |
| Ist-Stand | **Je Topf** (z. B. AV-Depot, ETF-Depot, Tagesgeld) | ein einziger Gesamtwert |
| Unsicherheit | **Korridor aus Schwankung** | drei feste Szenarien; nur eine Linie |
| Sicherheitsniveau | **Selbst einstellbar**, Vorgabe 85 %, Leitplanken 75 % und 95 % | fest 50 %, 85 % oder 95 % |

### Ablauf

1. **Gesamtplan.** Vorhandenes Vermögen je Topf plus Sparrate (einmal
   angesetzt, auf die Töpfe aufgeteilt) → Vermögen bei Renteneintritt → daraus
   die Monatsrente → Rentenlücke.
2. **Korridor.** Aus erwarteter Rendite und Schwankung je Topf entsteht per
   Simulation ein Bereich: pessimistisch (10 %), erwartet (50 %), optimistisch
   (90 %). Der Zufallsgenerator hat einen festen Startwert, damit derselbe Plan
   dieselben Zahlen liefert.
3. **Einfrieren.** „Plan festschreiben" hält zu einem Stichtag alle Annahmen,
   die Ergebnisse des Cockpits und den Korridor fest. Diese Planversion ändert
   sich nie mehr, auch wenn Profile später geändert werden.
4. **Jährlicher Abgleich.** Du erfasst den Wert jedes Topfes und die seitdem
   geleisteten Einzahlungen, optional die tatsächliche Inflation. Die Annahmen
   bleiben unverändert, bis du sie bewusst änderst.
5. **Blick nach vorn (entscheidet).** Vom Ist-Stand aus wird neu gerechnet:
   Wahrscheinlichkeit, das Ziel zu erreichen, und nötige Sparrate für das
   eingestellte Sicherheitsniveau, verglichen mit deiner tatsächlichen
   Sparrate. Beide Kennzahlen werden je Stichtag gespeichert und als Verlauf
   gezeigt.
6. **Leitplanken.** Status in drei Stufen: „mehr sparen" (mit Betrag),
   „im Plan – nichts ändern", „Spielraum" (mit dem Betrag, um den du reduzieren
   könntest).
7. **Blick zurück (erklärt).** Ist-Stände als Punkte im eingefrorenen Korridor.
   Die Abweichung wird zerlegt in Markt (tatsächliche statt angenommene
   Rendite), Einzahlungen (mehr oder weniger als geplant) und bewusst geänderte
   Annahmen.
8. **Zurück auf Kurs.** Unter der unteren Leitplanke zeigt die App drei Wege:
   Sparrate um X erhöhen, Y Jahre später in Rente, Wunschrente um Z senken.

Alle Beträge wahlweise in heutiger Kaufkraft (Vorgabe) oder nominal.

**Beispiel:** Plan 2026 mit 150 € Sparrate, Sicherheitsniveau 85 %. 2027 steht
das Depot nach einem Crash 30 % unter dem erwarteten Wert. Der Punkt liegt
unter dem Korridor von 2026; die Wahrscheinlichkeit, das Ziel zu erreichen,
fällt z. B. auf 70 % und damit unter die untere Leitplanke. Status: „mehr
sparen", mit der Sparrate, die wieder auf 85 % führt. Erholt sich der Markt
bis 2028, steigt die Wahrscheinlichkeit wieder; liegt sie über 95 %, lautet der
Status „Spielraum". (Zahlen zur Veranschaulichung, nicht gerechnet.)

### Bausteine

- **Töpfe** (neuer Bereich `plan` in den Einstellungen): Name, Art (AV-Depot,
  Depot, Tagesgeld), Anteil an der Sparrate, erwartete Rendite, Schwankung
  (Vorschlag: 15 % Depot, 1 % Tagesgeld). Das AV-Depot nutzt für Zulagen,
  Steuerersparnis und Auszahlungssteuer die bestehende Logik aus
  `src/lib/calculators/av-depot.ts`.
- **Rechenkern** `src/lib/plan/`: Projektion je Jahr und Topf; Simulation mit
  Perzentilen; Rente aus dem Endvermögen (Formeln aus
  `src/lib/calculators/pension-gap.ts`); Wahrscheinlichkeit, die Wunschrente zu
  erreichen; nötige Sparrate für ein Sicherheitsniveau; Zerlegung der
  Abweichung; tatsächlich erzielte Rendite zwischen zwei Ständen
  (geldgewichtet); „zurück auf Kurs"-Lösungen.
- **Daten:** `plan_versions` (eingefrorene Annahmen, Korridor, Datum,
  Bezeichnung) und `snapshots` (Datum, Wert und Einzahlungen je Topf,
  Inflation, Notiz), je Benutzer als abgeschlossene Datenblöcke. So lassen sie
  sich mit Feature 1 (Verschlüsselung im Browser) ohne Umbau verschlüsseln.
- **Oberfläche:**
  - Cockpit oben: Status der Leitplanken, nötige gegenüber tatsächlicher
    Sparrate, Erfolgswahrscheinlichkeit. Darunter das Korridor-Diagramm mit
    Ist-Punkten und neuer Prognose, der Verlauf der nötigen Sparrate über die
    Stichtage und die Kennzahlen „damals geplant" neben „aus heutiger Sicht".
  - Seite „Plan": Töpfe und Aufteilung bearbeiten, Sicherheitsniveau und
    Leitplanken einstellen, mit direkter Anzeige, wie die nötige Sparrate
    darauf reagiert; Plan festschreiben.
  - Seite „Verlauf": Ist-Stände erfassen und ansehen, Abweichungsanalyse
    zwischen zwei Ständen.
  - Hinweis im Cockpit, wenn der letzte Stand älter als ein Jahr ist.

### Reihenfolge

| Phase | Inhalt | Ergebnis |
| --- | --- | --- |
| 1 | Töpfe, Gesamtplan in heutiger Kaufkraft, Korridor, Sicherheitsniveau, nötige Sparrate, Diagramm im Cockpit | Stimmiger Plan mit Bandbreite und der Antwort „spare ich genug?", noch ohne Verlauf |
| 2 | Plan festschreiben, jährliche Ist-Stände, neue Prognose ab Ist-Stand, Leitplanken-Status, Verlauf der nötigen Sparrate | Der Plan lässt sich über die Zeit verfolgen und sagt, ob etwas zu ändern ist |
| 3 | Abweichungsanalyse (Markt, Einzahlungen, Annahmen), tatsächliche Inflation, „zurück auf Kurs" | Abweichungen werden erklärt und beantwortet |
| 4 | Optional: Depotwerte aus CSV einlesen, Erinnerung an den Abgleich | Weniger Handarbeit |

### Grenzen

- Der Korridor ist ein Modell: gleichbleibende Schwankung, keine
  Extremereignisse über die Annahme hinaus, alle Aktien-Töpfe bewegen sich
  gemeinsam. Er ist keine Garantie und keine Anlageberatung.
- Ohne erfasste Einzahlungen lassen sich Markt- und Einzahlungseffekt nur
  schätzen (geplante Sparrate × Monate).
- Die tatsächliche Inflation trägst du selbst ein (Verbraucherpreisindex des
  Statistischen Bundesamts); ein automatischer Abruf ist nicht geplant.

### Noch zu entscheiden (vor dem Start)

- Welche Töpfe du tatsächlich hast und wie die Sparrate aufgeteilt ist.
- Wo Rentenansprüche und Wunschrente leben sollen: heute im Rentenlücke-Rechner,
  für den Gesamtplan wären sie besser globale Werte.
- Ob die erwartete Rendite künftig real (nach Inflation) eingegeben wird oder
  weiter nominal mit Abzug der Inflationsrate. Das betrifft auch die
  bestehenden Rechner.
- Welche Schwankung je Topf gelten soll.
- Ob der Gesamtplan Profile bekommt wie die Rechner (z. B. „Basis",
  „Teilzeit ab 55").
- Reihenfolge gegenüber Feature 1: Ist-Stände sind besonders sensible Daten;
  bei einem Hosting für andere sollte die Verschlüsselung vorher oder
  gleichzeitig kommen.

### Verifikation nach der Umsetzung (je Phase)

- Rechenkern-Tests:
  - Ohne Schwankung liefert die Simulation dieselben Werte wie Sparrechner und
    Rentenlücke-Rechner.
  - Perzentile sind geordnet; derselbe Plan gibt dieselben Zahlen.
  - Ein höheres Sicherheitsniveau ergibt nie eine niedrigere nötige Sparrate;
    bei 50 % entspricht sie der Rechnung mit dem erwarteten Verlauf.
  - Die Zerlegung der Abweichung summiert sich zur Gesamtabweichung; die
    geldgewichtete Rendite stimmt an Handbeispielen.
- Browsertest gegen eine eigene Testdatenbank:
  - Plan festschreiben; Stand mit −30 % erfassen → Punkt unter dem Korridor,
    nötige Sparrate steigt, Status je nach Leitplanke.
  - Stand mit +40 % → Status „Spielraum" mit Betrag.
  - Der eingefrorene Plan bleibt unverändert, auch wenn Profile geändert werden.
  - Eine geänderte Renditeannahme erscheint in der Abweichungsanalyse getrennt
    vom Markt.
