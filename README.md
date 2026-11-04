# Handball-Ergebnisse BWHV

Mobile-first Web-App für Handball-Ergebnisse, Spielpläne und Statistiken im Badischen Handball-Verband (BWHV) und im Bezirk Schwarzwald-Rhein. Kein Backend – die App lädt die öffentlichen Daten direkt von handball4all.

## Features

- Ligen, Tabellen, Spielpläne und Live-Ticker
- Spielberichte mit Spielerstatistik und Spielverlauf
- Spielwoche der favorisierten Vereine und Mannschaften
- Hallen-Spielplan und Torschützenlisten
- Favoriten pro Gerät, Vereine für die Spielwoche sortierbar
- Dark-/Light-Theme und PWA-Unterstützung

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server (im LAN erreichbar)
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
npx vitest run   # Tests
```

## Stack

React 19, Vite 8, Tailwind CSS v4, Plain JavaScript/JSX. Kein Router – Navigation über React-State und `?cl=<ligaId>`.

## Daten

- Ergebnisse, Tabellen, Spielpläne und Live-Ticker: öffentliche handball4all-JSON-API
- Spielberichte: Text-Abruf über r.jina.ai (CORS-freundlich)

## Deployment

GitHub Pages: https://rssoft2.github.io/handball-ergebnisse-bwhv/

## Weiteres

- [CHANGELOG.md](CHANGELOG.md) – Release Notes
- [REQUESTS.md](REQUESTS.md) – Ideen und geplante Features

Inoffizielle Ansicht ohne Gewähr.
