# TODO – Punkte zum Prüfen

Entscheidungen und Vereinfachungen aus dem Bau der Profile, der drei neuen
Rechner und des Cockpits (Stand 11.10.2026). Jeder Punkt beschreibt, was gilt,
ein Beispiel zum Nachrechnen und die Frage, die du entscheiden solltest.

Die Beispielzahlen gelten für ein frisches Konto mit den Standardwerten
(Profil „Standard" überall). Mit deinen eigenen Werten weichen sie ab.

---

## 1. Ergebnisse weichen von den Finanzfluss-Beispielen ab

- [ ] **Geprüft und für mich in Ordnung**

**Was gilt:** Die Rechner nutzen die globalen Werte. Deren Standardwerte sind
nicht die Standardwerte der einzelnen Finanzfluss-Seiten, deshalb zeigt derselbe
Rechner hier andere Zahlen als dort.

| Globaler Wert | Hier | Finanzfluss Rentenlücke | Finanzfluss Entnahmeplan | Finanzfluss Sparrechner |
| --- | --- | --- | --- | --- |
| Alter | 35 | 30 | – | – |
| Auszahlung bis Alter | 85 | 100 | – | – |
| Erwartete Rendite | 6 % | 5 % | – | 1,5 % |
| Rendite im Ruhestand | 3 % | 3 % | 5 % | – |
| Vorhandenes Kapital | 0 € | 0 € | – | 5.000 € |

**Beispiel Rentenlücke** (`/rechner/rentenluecke`):

| | Kapital mit Verzehr | Sparrate | Kapital ohne Verzehr | Sparrate |
| --- | --- | --- | --- | --- |
| Standardwerte hier | 200.002 € | 237,50 € | 542.659 € | 644,39 € |
| Alter 30, Auszahlung bis 100, Rendite bis zur Rente 5 % | 309.185 € | 327,51 € | 542.659 € | 574,81 € |

Die zweite Zeile ist das Ergebnis der Finanzfluss-Seite. Die Rentenlücke selbst
ist in beiden Fällen 1.153 € pro Monat.

**Beispiel Entnahmeplan** (`/rechner/entnahmeplan`): 100.000 €, 10 Jahre,
monatlich → hier 963,74 € pro Monat (3 %), bei Finanzfluss 1.055,24 € (5 %).

**Beispiel Sparrechner** (`/rechner/sparrechner`): 150 € pro Monat bis zum
Renteneintritt (32 Jahre) → 174.520 € Endkapital. Mit freier Laufzeit von
7 Jahren (Schalter „Laufzeit bis Renteneintritt" aus) sind es 15.689 €
(0 € Anfangskapital, 6 %), mit den Finanzfluss-Werten (5.000 €, 1,5 %)
18.846 €.

**So prüfst du es:** Die Werte der zweiten Tabellenzeile im Rechner eintragen
(gilt nur lokal) und mit der Finanzfluss-Seite vergleichen, danach
„Zurücksetzen".

**Zu entscheiden:** Sollen die Standardwerte der globalen Werte anders sein,
z. B. „Auszahlung bis Alter" 90 statt 85? Zu ändern in
`src/lib/settings/schema.ts`; das betrifft nur neu angelegte Profile.

---

## 2. „Auszahlung bis Alter" ist ein gemeinsamer Wert für zwei Rechner

- [ ] **Geprüft und für mich in Ordnung**

**Was gilt:** Der AV-Depot-Rechner („Auszahlung bis") und der
Rentenlückenrechner („Lebenserwartung" bei Finanzfluss) teilen sich diesen Wert.
Der AV-Depot-Rechner verlangt mindestens 85.

**Beispiel:** Stellst du im Rentenlückenrechner „Auszahlung bis Alter" auf 80
und speicherst, zeigt der AV-Depot-Rechner statt Ergebnissen die Meldung „Im
Altersvorsorgedepot muss die Auszahlung mindestens bis zum Alter 85 laufen",
und im Cockpit fehlt die AV-Depot-Rente im Gesamtbild.

**Zu entscheiden:** Ist ein gemeinsamer Wert richtig, oder brauchst du zwei
getrennte (Auszahlplan des AV-Depots und Lebenserwartung für die Rentenlücke)?

---

## 3. Die Sparrate im Sparrechner ist der globale Monatswert

- [ ] **Geprüft und für mich in Ordnung**

**Was gilt:** Der Sparrechner hat kein eigenes Sparraten-Feld, er nutzt die
globale „Sparrate pro Monat". Beim Sparintervall „jährlich" wird das Zwölffache
einmal im Jahr zu Jahresbeginn eingezahlt.

**Beispiel:** Sparrate 150 € pro Monat, Sparintervall „jährlich" → gerechnet
wird mit 1.800 € einmal pro Jahr. Unter dem Feld steht dann „= 1.800 € pro
Jahr, einmal jährlich eingezahlt". Ist die Sparrate das gesuchte Ergebnis,
zeigt der Rechner sie je Intervall: bei Ziel 20.000 €, 5.000 € Anfangskapital,
1,5 %, 7 Jahren freier Laufzeit monatlich sind das 163,02 € pro Monat.

**Zu entscheiden:** Reicht das, oder soll der Sparrechner eine eigene Sparrate
bekommen, weil du dort andere Beträge durchspielen willst als deine
tatsächliche Sparrate? (Lokal ändern geht jetzt schon, ohne zu speichern.)

---

## 4. Dieselbe Sparrate wird in mehreren Rechnern voll angesetzt

- [ ] **Geprüft und für mich in Ordnung**

**Was gilt:** AV-Depot-Rechner und Sparrechner nehmen beide die gesamte globale
Sparrate. Das Cockpit zeigt beide Ergebnisse nebeneinander, als würde das Geld
zweimal angelegt.

**Beispiel:** Sparrate 150 € → AV-Depot-Karte: 228.547 € Endvermögen mit 67;
Sparrechner-Karte: 174.520 € nach 32 Jahren. Beide Karten gehen von denselben
150 € aus; die Ergebnisse dürfen nicht addiert werden.

**Zu entscheiden:** Soll die Sparrate aufgeteilt werden können (z. B. 150 € ins
AV-Depot, Rest in einen ETF-Sparplan)? Das wäre ein eigener globaler Wert je
Verwendung.

**Stand:** Der Gesamtplan (`/plan`) setzt die Sparrate einmal an und teilt sie
auf Töpfe auf. Die einzelnen Rechner und ihre Karten im Cockpit rechnen
weiterhin jeweils mit der vollen Sparrate; der AV-Depot-Rechner nimmt davon
höchstens 1.140 € pro Monat und sagt das unter dem Feld.

---

## 5. Die Kapitalertragsteuer ist global

- [ ] **Geprüft und für mich in Ordnung**

**Was gilt:** Rentenlücke und Sparrechner nutzen denselben Wert (Standard
26,375 %). Das war nicht ausdrücklich abgestimmt, folgt aber der Regel „was
mehrere Rechner nutzen, ist global".

**Beispiel:** Im Sparrechner „Steuern mitberechnen" einschalten, die
Kapitalertragsteuer auf 27,82 % (mit Kirchensteuer) ändern und im Profil
speichern → im Rentenlückenrechner steht unter „Sparphase" ebenfalls 27,82 %,
und dessen Sparraten steigen leicht.

**Zu entscheiden:** Passt das, oder soll der Wert je Rechner getrennt sein?

---

## 6. Vereinfachungen im Gesamtbild „Ruhestand" des Cockpits

- [x] **Erledigt:** Dieses Gesamtbild ist entfallen. Der Gesamtplan ersetzt es
      und rechnet durchgehend in heutiger Kaufkraft. Der Rest dieses Punktes
      beschreibt den alten Stand.

**Was gilt:** Verbleibende Lücke = Rentenlücke − Netto-Rente aus dem AV-Depot.

**Beispiel:** Rentenlücke 1.153 € − AV-Depot 989 € = 164 € verbleibende Lücke
pro Monat. Nötiges Kapital und zusätzliche Sparrate für diese 164 € stehen
daneben.

Vier Vereinfachungen stecken darin:

1. **Laufzeit:** Die AV-Depot-Rente läuft nur bis „Auszahlung bis Alter". Da
   der Rentenlückenrechner denselben Wert nutzt, passen beide zusammen – wer
   länger lebt, hat danach die volle Lücke von 1.153 €.
2. **Zusätzliche Sparrate:** Sie kommt zu den 150 € hinzu, die in der Rechnung
   ins AV-Depot fließen. Die Karte sagt das im Hinweistext.
3. **Vorhandenes Kapital:** Es wird voll auf die verbleibende Lücke
   angerechnet. Mit 12.345 € vorhandenem Kapital zeigt das Cockpit z. B.
   28.519 € nötiges Kapital, aber 0,00 € zusätzliche Sparrate, weil das Kapital
   bis zur Rente von allein so weit wächst.
4. **Nominal:** Die AV-Depot-Rente ist ein Betrag in Euro des Rentenjahres, die
   Wunschrente trägst du in heutigen Euro ein. Der Schalter „Inflation
   berücksichtigen" wirkt nur auf den Rentenlückenrechner, nicht auf den
   AV-Depot-Rechner.

**Zu entscheiden:** Ist das Gesamtbild so aussagekräftig genug? Punkt 4 ist die
größte Ungenauigkeit: 989 € in 32 Jahren sind weniger wert als 989 € heute. Eine
Lösung wäre, die AV-Depot-Rente bei eingeschalteter Inflation auf heutige
Kaufkraft umzurechnen.

---

## 7. Rentenlücke und Entnahmeplan lassen sich nicht automatisch abgleichen

- [ ] **Regelmäßigen Termin dafür eingerichtet**

**Was gilt:** Für diese beiden Rechner veröffentlicht Finanzfluss keinen
Quellcode. Die Formeln sind aus 35 aufgezeichneten Ergebnissen der
Finanzfluss-Seite hergeleitet (`test/fixtures/`). Ändert Finanzfluss die
Berechnung, merkt `npm test` das nicht.

**So prüfst du es:**

```bash
npm run upstream:check-api    # Rentenlücke und Entnahmeplan
npm run upstream:diff         # AV-Depot und Sparrechner
```

Erwartete Ausgabe ohne Änderungen: „The server still gives the answers stored
in the fixtures." bzw. „No changes in the calculator files."

**Zu entscheiden:** Wie oft willst du das ausführen (z. B. vierteljährlich und
zum Jahreswechsel, wenn sich Steuerwerte ändern)? Automatisch ginge es erst mit
einem geplanten Job, sobald das Repository auf GitHub liegt.

---

## 8. Der Sparrechner rechnet anders als das Original, mit gleichem Ergebnis

- [ ] **Zur Kenntnis genommen**

**Was gilt:** Das Original hat je gesuchter Größe eine eigene Formel. Hier ist
nur das Endkapital eine Formel; Anfangskapital, Zinssatz, Laufzeit und Sparrate
werden durch Suche bestimmt. Der Vergleichstest bestätigt gleiche Ergebnisse.

**Beispiel für eine Abweichung:** Bei einzelnen Eingaben bricht die
Zinssatz-Suche des Originals mit einem Fehler ab („Newton's method failed to
converge"). Der Rechner hier liefert dort ein Ergebnis. Der Vergleichstest
überspringt diese Fälle und erlaubt höchstens 20 davon bei 300 Vergleichen.

**Nicht unterstützt:** Negative Ergebnisse. Ist das Ziel schon übertroffen,
ohne dass es die gesuchte Größe braucht (z. B. 5.000 € Anfangskapital, 150 €
pro Monat, 7 Jahre, Ziel 10.000 €, Zinssatz gesucht), lautet das Ergebnis 0
mit dem Hinweis, was ohnehin erreicht wird (hier 17.600 €), statt eines
negativen Zinssatzes.

---

## 9. Das Entnahmeplan-Diagramm weicht bewusst vom Original ab

- [ ] **Zur Kenntnis genommen**

**Was gilt:** Ohne Kapitalverzehr zeigt das Diagramm der Finanzfluss-Seite ein
leicht sinkendes Kapital (100.000 € → 99.987,59 € nach 10 Jahren), weil es die
Zinsen innerhalb des Jahres nur annähert. Hier bleibt das Kapital bei genau
100.000 €. Die Ergebniszahlen (Entnahmebetrag, Zeitraum, Kapital) sind
identisch mit Finanzfluss.

---

## 10. Slider nur dort, wo sie sinnvoll schienen

- [ ] **Geprüft und für mich in Ordnung**

**Was gilt:**

| Rechner | Slider |
| --- | --- |
| Altersvorsorgedepot | Alter, beide Einkommen, Sparrate, Einmalauszahlung (wie bei Finanzfluss) |
| Rentenlücke | Alter, gesetzliche Rente (0–4.000 €), Wunschrente (0–6.000 €) |
| Sparrechner | keine |
| Entnahmeplan | keine |

Die Finanzfluss-Seiten haben für die letzten drei Rechner gar keine Slider; die
drei im Rentenlückenrechner sind meine Ergänzung.

**Zu entscheiden:** Sollen weitere Felder Slider bekommen (z. B. Laufzeit und
Zinssatz im Sparrechner, Entnahmebetrag im Entnahmeplan)?

---

## 11. Offen aus früheren Schritten

- [ ] **Dunkles Farbschema** ist angelegt, aber nie im Browser angesehen.
- [ ] **Profil-Auswahl im Cockpit** erlaubt nur das Wechseln; Anlegen,
      Umbenennen und Löschen gehen nur in den Rechnern und Einstellungen.
- [ ] **Vor einem öffentlichen Betrieb:** Begrenzung von Anmeldeversuchen und
      „Passwort vergessen" fehlen; `ALLOW_REGISTRATION=false` setzen.
- [ ] **Lizenz:** Bei Hosting für andere Nutzer den Quellcode unter AGPL
      offenlegen (siehe README, Abschnitt „Abgleich mit dem
      Finanzfluss-Original").
- [ ] **Sicherung** `data/financecockpit.backup-2026-10-11.db` löschen, sobald
      nach dem Neustart alles stimmt.

---

## 12. Gesamtplan: Annahmen und Vorgaben zum Prüfen

- [ ] **Geprüft und für mich in Ordnung**

**Was gilt:** Der Gesamtplan wurde mit Vorgaben umgesetzt, die du nicht einzeln
bestätigt hast (Liste in `PLANNED_FEATURES.md`, Feature 2, „So umgesetzt").

**Beispiel mit den Standardwerten** (150 € Sparrate ganz ins AV-Depot, Alter
35, Wunschrente 2.200 €): Der Plan zeigt rund 5 % Wahrscheinlichkeit und eine
nötige Sparrate von 813 €. Der Rentenlücke-Rechner zeigt für dieselben
Werte ohne Inflation 237,50 €. Der Unterschied kommt aus drei Dingen: Der Plan
zieht 2 % Inflation ab, verlangt 85 % Sicherheit statt des erwarteten Verlaufs
und rechnet die AV-Depot-Rente in heutiger Kaufkraft.

**So prüfst du es:** Auf `/plan` die nötige Sparrate als „Sparrate pro Monat"
eintragen: Die Wahrscheinlichkeit landet beim Sicherheitsniveau (85 %), der
Status wird „Im Plan". Zum Abgleich mit dem Rentenlücke-Rechner den Anteil des
AV-Depots auf 0 %, das Sicherheitsniveau auf 50 % und die Schwankung auf 0
stellen (Leitplanken z. B. 1 % und 99 %) und dort „Inflation berücksichtigen"
einschalten: Beide nennen dann dieselbe Sparrate.

**Zu entscheiden:**

- Passen 85 % / 75 % / 95 % und 15 % Schwankung zu dir?
- Ist 2.200 € Wunschrente in **heutigen** Euro gemeint? Der Plan liest es so.
- Reichen drei feste Töpfe?
- Die nötige Sparrate behält deine Aufteilung bei. Mit 100 % AV-Depot heißt
  „mehr sparen" also: mehr ins AV-Depot, bis zu dessen Höchstbetrag von 1.140 €
  pro Monat, danach ins ETF-Depot. Ist das die Aufteilung, die du willst?

## 13. Gesamtplan: Alter jährlich mitführen

- [ ] **Zur Kenntnis genommen**

**Was gilt:** Der Plan rechnet ab dem Alter in den globalen Werten. Die App
zählt es nicht selbst hoch.

**Beispiel:** Frierst du 2026 mit Alter 35 ein und erfasst 2027 einen
Ist-Stand, ohne das Alter auf 36 zu ändern, rechnet die neue Prognose mit
einem Jahr zu viel bis zur Rente und sieht zu günstig aus. Der Punkt im
eingefrorenen Korridor sitzt trotzdem richtig, weil er aus den Stichtagen
berechnet wird.

**Zu entscheiden:** Soll statt des Alters das Geburtsjahr gespeichert werden,
damit das Alter automatisch stimmt? Das beträfe alle Rechner.

## 14. Gesamtplan: Kaufkraft beim Vergleich

- [ ] **Zur Kenntnis genommen**

**Was gilt:** Der eingefrorene Korridor steht in der Kaufkraft seines
Stichtags, die aktuelle Prognose in heutiger Kaufkraft. Ist-Stände werden mit
der eingetragenen Inflation (sonst der Annahme des Plans) auf die Kaufkraft des
eingefrorenen Plans umgerechnet.

**Beispiel:** Stand 12.320 € ein Jahr nach dem Einfrieren, ohne eingetragene
Inflation: Im Vergleich erscheinen 12.320 € / 1,02 = 12.078 €.

**Folge:** Im Diagramm liegen eingefrorener Korridor und aktuelle Prognose
nicht in exakt derselben Kaufkraft übereinander; über wenige Jahre ist der
Unterschied klein, über lange Zeit wächst er.

---

## 15. Durchsicht vom 11.10.2026: geändertes Verhalten zum Prüfen

- [ ] **Geprüft und für mich in Ordnung**

**Gespeicherte Werte geändert:** Sparrechner-Profile, die noch die alten
Vorgaben hatten (Endkapital 20.000 €, Laufzeit 7 Jahre) und die Laufzeit nicht
ausdrücklich freigegeben haben, stehen nach dem nächsten Start auf 250.000 € und
30 Jahren (Migration `drizzle/0004_savings_defaults.sql`). Eigene Werte bleiben.

**Vorhandenes Kapital im Gesamtplan:** Solange kein Ist-Stand erfasst ist,
startet der Plan mit dem „Vorhandenen Kapital" der globalen Werte im
ETF-Depot, vorher mit 0 €.

**Beispiel:** 50.000 € vorhandenes Kapital heben das Vermögen bei Renteneintritt
im mittleren Verlauf von rund 99.000 € auf rund 192.000 € (Standardwerte).

**Zu entscheiden:** Sobald du einen Ist-Stand erfasst, zählt nur noch dieser.
Sparrechner und Rentenlücke rechnen weiter mit dem „Vorhandenen Kapital"; beide
Angaben musst du selbst gleich halten. Soll das „Vorhandene Kapital" beim
Erfassen eines Ist-Stands automatisch auf dessen Summe gesetzt werden?
