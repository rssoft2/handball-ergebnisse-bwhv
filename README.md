# Release Notes

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

# Ideen
| Prio | Feature | Status |
|---:|---------|--------|
|  1 | Spielpläne herunterladen und Inhalt in UI anzeigen | Fertig
|  2 | Live-Ergebnisse und Ticker für aktive Spiele | Fertig
|  3 | Auswahl der Spielwoche | Fertig
|  4 | Spieler-Statistik | Fertig
|  5 | Spielwoche auch für Favoriten-Teams | Fertig
|  - | Navigation Tabelle/Team --> Team-Spielplan | Fertig
|  - | Harzverbot anzeigen | Fertig
|  - | Vereins-Logos | Fertig (nur ausgewählte)
|  - | Mannschafts-Statistik (Spieler) | Fertig
|  - | Strafen-Statistik | 
|  - | Hallen-Spielplan | Fertig
|  - | User Login (simple auth) | 
|  - | State pro User persistieren | 
|  - | Backend für caching und refresh der H4All Daten | 
