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

## Docker-Deployment

### SSL-Zertifikate generieren (für Development)

```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=localhost"
```

### Container starten

```bash
# Build und start
npm run build
docker compose up -d --build

# Logs anzeigen
docker compose logs -f

# Health check
curl -k https://localhost/health

# Container stoppen
docker compose down
```

## CI/CD

Das Projekt verwendet GitHub Actions für automatisierte Tests:

- **Smoke Tests**: Validiert Docker-Setup, SSL, und Health-Endpoints
- **Security Scan**: Trivy-Scanner für Vulnerabilities  
- **Config Validation**: Prüft docker-compose.yml, nginx.conf, und JSON-Configs

Workflows befinden sich in `.github/workflows/`.

## Lizenz

Ai,Ki,Multi,Gentlify,Hopeful
