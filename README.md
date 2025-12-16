# Annabelle.AI

**Kurzbeschreibung**  
Annabelle.AI ist die on‑device RAM‑Spezialistin für das Annabelle‑JOSI System. Ziel ist ein extrem ressourcenschonender, Web‑Worker‑zentrierter Indexer und Retriever, optimiert für Geräte mit ~2 GB RAM.

## Quickstart

### Voraussetzungen
- Node.js 18+ für lokale Dev Server  
- Docker und Docker Compose für Backend Stubs  
- OpenSSL zum Erzeugen von RSA Schlüsseln

### Lokale Einrichtung
```bash
git clone git@github.com:yourorg/annabelle-ai.git
cd annabelle-ai
npm ci
# optional: dev container
docker compose up --build
```

## Architektur

Annabelle.AI nutzt Web Workers für ressourcenschonende Operationen:
- **Indexer Worker**: Verarbeitet und indexiert Daten im Hintergrund
- **Retriever Worker**: Führt effiziente Suchabfragen durch
- **Hauptthread**: Koordiniert die Worker und handhabt die UI-Kommunikation

## Entwicklung

```bash
# Abhängigkeiten installieren
npm ci

# Entwicklungsserver starten
npm run dev

# Build
npm run build

# Tests ausführen
npm test
```

## Lizenz

Ai,Ki,Multi,Gentlify,Hopeful
