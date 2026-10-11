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
