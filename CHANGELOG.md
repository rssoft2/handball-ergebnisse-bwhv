# CHANGELOG

## v1.22.2
- **40. Tor**: Wird jetzt für beide Mannschaften erkannt und in Spielbericht, Live-Ticker und Aufstellung hervorgehoben.

## v1.22.1
- **Team-Spielplan**: Kalender-Export: Titel trägt das Liga-Kürzel voran (z. B. `[mb-BL-SR]`).

## v1.22.0
- **Team-Spielplan**: Kalender-Export als `.ics` für iPhone und Android. Der Export enthält alle Spiele (auch vergangene) ohne Ergebnisse, mit 90 Minuten Dauer, Ort, Liga sowie Heim- und Gastteam. Der Titel trägt das Liga-Kürzel voran (z. B. `[mb-BL-SR]`). Einmaliger Import, keine Kalender-Subscription.
- **Liga-/Team-Statistik**: Torschützen-Tabelle um die Spalte **T/Sp** („Tore pro Spiel“, eine Nachkommastelle) ergänzt.

## v1.21.2
- **Liga-/Team-Statistik**: Gewichtung und Sortierung der Strafen-Statistik: Gesamt-Anzahl Strafen ↓, dann 2-Min ↓, dann Rot ↓, dann Gelb ↓, dann Name. Direkte Rote Karten werden doppelt gewertet.

## v1.21.1
- **Spielbericht-Cache**: Geparste Spielberichte werden dauerhaft in IndexedDB gespeichert, inklusive Rohtext und Parser-Version. Einmal geladene Berichte werden nicht erneut heruntergeladen; bestehende localStorage-Berichte werden migriert. Bei künftigen Parser-Änderungen wird aus dem Rohtext neu geparst.

## v1.21.0
- **Liga-/Team-Statistik**: Die Statistik hat den neuen Tabs „Strafen“. Die Strafen-Tabelle zählt Gelb, 2 Minuten, Rot und Blau; direkte rote Karten zählen in Rot und Gesamt doppelt, indirekte rote Karten aus der 3. Zeitstrafe einfach.

## v1.20.0
- **Favoriten‑Sortierung**: Vereine lassen sich im Favoriten‑Tab über einen eigenen Sortier‑Modus mit Hoch-/Runter‑Pfeilen neu anordnen. Die gewählte Reihenfolge gilt für die Spielwoche; neue Vereine werden am Ende einsortiert.

## v1.19.0
- **Hallen‑Spielplan**: Hallensuche im zentralen Suchfeld (Gruppe „Hallen“) sowie ein Hallen‑Button neben dem Spielort in der MatchCard. Öffnet alle Spiele der Halle in einer Kalenderwoche (Mo–So), gruppiert nach Tag, mit Wochen‑Navigation.
- **Vereins‑Logos**: Logo von HSG Hardt hinzugefügt.

## v1.18.0
- **Team‑Statistik**: Im Team‑Spielplan erscheint ein Button „Torschützenliste“. Darin wird die Torschützenliste nur für das gewählte Team angezeigt. Header zeigt Teamname + Wappen und Untertitel „Torschützen · <Liga>“. Zurück führt zum Team‑Spielplan.

## v1.17.0
- **Vereins‑Logos**: In MatchCard, StandingsTable, Header und FavoritesView werden Logos von HSG Ettlingen, SG Pforzheim/Eutingen, TV Malsch und TSV Rintheim gezeigt.
- **Favoriten‑Speicher**: Bei vollem localStorage werden zuerst API‑Caches geleert; Favoriten, Theme und Zugangsschlüssel bleiben erhalten.

## v1.16.0
- **Haft‑Regel pro Halle**: Als Tropfen‑Icon (grün/amber/rot) neben dem Hallennamen im MatchCard und im ReportHeader. Klick/Hover zeigt Tooltip mit Status und Originaltext.

## v1.15.0
- **Team‑Spielplan**: Klick auf einen Team‑Namen in der Tabelle öffnet `TeamScheduleScreen` mit Header‑Teamname und Zurück‑Button. Dort werden „Kommende Spiele“ (live + upcoming) und „Ergebnisse“ angezeigt.

## v1.14.3 – v1.14.0
- **Spieler‑Statistik**: 7m‑Treffer werden nun als „Versuche/verwandelte“ (z. B. 6/5) angezeigt. Feld‑Spalte berechnet sich als Tore − 7m. Sortierung: Tore ↓ / Feld ↓ / Name.
- **Report‑Header / Report‑Stats‑Screen**: Karten‑Visualisierung (Gelb/Rot/Blau), 2‑Min‑Strafe als invertiertes Rechteck mit „2“, 40. Tor‑Meilenstein‑Anzeige in Statistik und Verlauf.

## v1.13.0
- **Spielwoche**: Kalenderwoche (Mo–So) mit auf-/zuklappbaren Vereinen, gruppiert nach Tag. Wochen‑Navigation per Dropdown (Optionen aus API).
- **Favoriten‑Tab**: Listet Ligen / Vereine (aufklappbar → lazy Laden von Mannschaft‑Seiten) und Mannschaften.

## v1.12
- **Live‑Tab (Startseite)**: Listet alle laufenden Spiele landesweit + Bereich 246. Aktualisierung alle 30 s, nur wenn Tab sichtbar ist.

## v1.10 – v1.9
- **Live‑Ticker‑Screen**: Zeigt Ticker‑Nachrichten, Spielstand‑ und Uhr‑Meldungen; Karten‑Markierung.
- **PWA‑Manifest & iOS‑Metas**: Grundlegende PWA‑Einrichtung.
- **Dark/Light‑Toggle**: Im Header (`data-theme`), flackerfreies Init‑Script.

## v1.5 – v1.4
- **Favoriten‑Persistenz**: In `localStorage` unter `h4a:favorites:v1` gespeichert, pro Gerät, nicht geräteübergreifend. Stern‑Toggle an Ligen, Vereine und Mannschaften.
- **Key‑Gate**: Zugang nur mit `?k=<secret>` (Hash im Code), Freigabe wird gemerkt.

## v1.3 – v1.0
- **Initialer Release**: Liga‑Listen, Detail‑Ansicht, Tabelle, Live‑Ticker, Spielpläne, Favoriten (pro Gerät), Theme‑Toggle, PWA‑Grundsetup.
