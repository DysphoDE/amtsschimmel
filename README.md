# Amtsschimmel – Das Verwaltungs-Idle

Ein Idle-/Clicker-Spiel durch 4000 Jahre Verwaltungsgeschichte. Es beginnt mit der Tontafel-Registratur in Ur (2100 v. Chr.), führt über Tabularium, Kanzlei, preußische Aktenordnung, Rohrpost, Durchschlag & Fax, Großrechner, E-Akte und KI-Verwaltung und endet im Weltamt. Ganz oben wartet der Ein-Klick-Antrag, der alle anderen überflüssig macht.

## Spielen

- **Einfach:** `dist/amtsschimmel.html` doppelklicken. Das ist eine einzige Datei, es muss nichts installiert werden.
- **Aus dem Quellcode:** `index.html` direkt öffnen. Das funktioniert auch über `file://`, weil das Spiel keine ES-Module verwendet. Alternativ einen statischen Server starten (`python -m http.server 8080`) und `http://localhost:8080` öffnen.
- **Handy:** Die Seite über einen Webserver ausliefern und „Zum Startbildschirm hinzufügen“ wählen. Das Spiel ist eine PWA mit Service Worker und läuft dann im Vollbild, auch offline.

Der Spielstand liegt im `localStorage`. Er wird alle 15 Sekunden gespeichert, dazu alle 10 Minuten eine von drei rotierenden Sicherungskopien. Unter *Optionen → Spielstand* lässt er sich exportieren, als Datei sichern, importieren und aus einer Sicherungskopie wiederherstellen.

## Spielprinzip

- **Stempeln.** Ein Klick auf die Akte (oder die Leertaste) ist der Eingangsstempel. Ab Rom gibt es **Zuständigkeiten**: Jede Akte gehört zu einem von bis zu sechs Ressorts. Der richtige Ressortstempel (Tasten 1–6) bringt ein Vielfaches und baut **Arbeitsfluss** auf. Der falsche erzeugt einen **Widerspruch**. Er kommt später „doppelt so dick“ zurück, braucht zwei Stempel und zahlt dafür das Dreifache.
- **Sonderfälle.** EILT-Vorgänge haben eine Frist, ab der Kaiserzeit gibt es Mitzeichnungen über drei Ressorts. Jede der zehn Epochen hat eine eigene Aktenoptik: Tontafel, Wachstafel, Pergament mit Siegel, Aktendeckel, Schreibmaschinenformular, Durchschlag, Endlospapier, PDF-Fenster, Hologramm und Sternenpapier.
- **Haushalt.** 18 Generatoren in drei Kategorien (Personal, Sachmittel, Technik). Dazu Stufen-Verbesserungen, Synergien und Sonderverbesserungen für Stempel, Fluss, Fristen, Formulare, Schimmel und Gremien.
- **Gremien und Paragrafen.** Fünf Gremien beschließen **Vorschriften (§)**. Mit ihnen werden 36 Paragrafen in vier Teilen in Kraft gesetzt. Angesammelte Vorschriften steigern die Produktion und vermehren sich selbst (Parkinson-Faktor). Das ergibt eine echte Entscheidung: sparen oder ausgeben.
- **Der Amtsschimmel.** Das Glücksereignis galoppiert über den Bildschirm. Wer ihn fängt, bekommt Kaffeepause, Haushaltsrest, Dienstweg verkürzt, Beförderungswelle, Dezemberfieber oder sehr selten den Schimmelreiter.
- **Bürgeranliegen.** 28 Szenen am Schalter mit mehreren Antworten, teils mit Risiko.
- **Formular-Album.** 67 Formulare in 8 Ordnern mit vier Seltenheiten. Sie bleiben dauerhaft, volle Ordner geben Sonderboni, Dubletten wandern ins Altpapier.
- **Großprojekte.** Der Flughafen Schilda-Süd wird natürlich siebenmal verschoben. Der Ein-Klick-Antrag ist das Finale.
- **Verwaltungsreform (Prestige).** Bringt Dienstjahre (+2 % Produktion je Dienstjahr) und Pensionspunkte. Bei jeder Reform wird ein **Leitbild** für den nächsten Durchgang gewählt, das die Regeln ändert:
  - Kameralistik
  - Zentralismus
  - Föderalismus
  - Bürgernähe
  - New Public Management
  - Entbürokratisierung
  - Digitalisierung zuerst
  - Parkinson pur
  - und ein geheimes
- **Abwechslung lohnt sich.** Ein neu erlebtes Leitbild gibt dauerhaft +5 %. Wer dasselbe Leitbild mehrmals hintereinander wählt, wird reformmüde. Nur Kameralistik ist dagegen immun.
- **Laufbahn.** 23 dauerhafte Stufen vom einfachen bis zum höheren Dienst, darunter Automatik, Bestandsschutz und Offline-Verbesserungen. Danach folgen endlose Erfahrungsstufen, damit Pensionspunkte nie wertlos werden.
- **187 Urkunden**, davon 14 geheim. Jede gibt +1 % Produktion.
- **Ende.** Der Ein-Klick-Antrag schließt das Spiel mit Abspann ab, danach geht es mit dauerhaft ×2 als „Ewige Behörde“ weiter.

## Balance

Die Simulation (`node tools/sim.mjs <Stunden> <Profil>`) steuert ein Bot-Spieler. Bis zum Finale braucht er ungefähr so lange:

| Profil | Verhalten | Weltamt | Finale |
|---|---|---|---|
| `active` | sortiert dauerhaft 1,4 Akten/s, 95 % richtig | ca. 7 h | ca. 12–13 h |
| `casual` | 10 Min. aktiv, 20 Min. weg | ca. 15 h | ca. 26 h |
| `clicker` | nur Eingangsstempel, 4/s | ca. 12 h | ca. 21 h |
| `idle` | 5 Min. alle 3 Stunden | – | ca. 13 Tage |

Aktives, richtiges Sortieren bringt im Spätspiel etwa das 2- bis 3-Fache der reinen Produktion. Gelegenheitsspieler werden über die Vertretung (automatisches Stempeln in Pausen), Automatik-Laufbahnstufen und den Offline-Ertrag mitgenommen.

`node tools/sim.mjs lb` vergleicht alle Leitbilder aus einem mittleren Spielstand. Sie liegen etwa innerhalb von Faktor 2,5 zueinander, jedes hat seine Stärken in einer anderen Spielweise oder Phase.

## Technik

- Vanilla JavaScript ohne Abhängigkeiten. Die Spiellogik (`js/core.js`) arbeitet ohne DOM und läuft in Node (Simulation, Tests).
- Alle Grafiken sind Inline-SVG (`js/icons.js`). Alle Klänge und die generative „Warteschleifenmusik“ werden per WebAudio erzeugt (`js/audio.js`), sie wechselt mit der Epoche. Es gibt keine externen Schriften und keine externen Anfragen.
- **Spielstand:**
  - Versionsfeld mit Migrationskette (`C.MIGRATIONS`) und Typprüfung jedes Feldes beim Laden.
  - Ein beschädigter Stand wird gesichert und aus der jüngsten Sicherungskopie wiederhergestellt.
  - Ein Stand aus einer neueren Version wird nicht überschrieben.
  - Der Export enthält eine Prüfsumme.
- **Layouts:** Drei Spalten auf dem Desktop, zwei auf dem Tablet, eine mit unterer Navigation auf dem Handy.
- **Barrierefreiheit:**
  - Tastatur: Leertaste, 1–6, B (alle Verbesserungen), M (Ton), Esc.
  - Fokus-Rahmen und ARIA-Live-Ansagen für Ereignisse.
  - „Wenig Bewegung“ und `prefers-reduced-motion` werden beachtet.
  - Kein Zoom-Verbot.

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/util.js` | Zahlenformat (deutsche lange Skala, höchstens 2 Nachkommastellen), Zeit, Zufall, Ereignis-Bus |
| `js/data.js` | Epochen, Ressorts, Generatoren, Gremien, Verbesserungen, Großprojekte |
| `js/systems.js` | Paragrafen, Leitbilder, Laufbahn, Formulare, Amtsschimmel-Effekte |
| `js/content.js` | Bürgeranliegen, Aktentitel, Absender, Amtsblatt, Tipps |
| `js/achievements.js` | Urkunden |
| `js/core.js` | Spiellogik ohne DOM: Effekte, Produktion, Eingangskorb, Ereignisse, Reform, Offline, Speichern |
| `js/icons.js` | SVG-Grafiken inklusive Amtsschimmel |
| `js/audio.js` | Soundeffekte und generative Musik |
| `js/desk.js` | Schreibtisch: Akte, Stempel, Fluss, Anliegen, Schimmel, Maskottchen |
| `js/ui.js` | Reiter, Haushalt, Dialoge, Meldungen, Optionen, Finale |
| `js/main.js` | Start, Schleifen, Speichern, Tastatur, Service Worker |
| `sw.js`, `manifest.webmanifest`, `icon*.png`, `icon.svg` | PWA |

## Werkzeuge

```bash
node tools/test.mjs          # 18 Tests: Zahlenformat, Datenintegrität, Mechanik, Reform, Spielstand, Langlauf
node tools/sim.mjs 24 casual # Balance-Simulation (Profile: active, casual, clicker, idle)
node tools/sim.mjs lb        # Leitbild-Vergleich
node tools/build.mjs         # baut dist/amtsschimmel.html und setzt die Service-Worker-Version
node tools/make-icon.mjs     # erzeugt icon.svg aus dem Schimmelkopf
```

Alle Personen, Orte und Behörden sind frei erfunden. Ähnlichkeiten mit real existierenden Verwaltungsvorgängen sind unvermeidlich.
