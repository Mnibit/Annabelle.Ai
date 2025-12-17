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
- **Indexer Worker**: Verarbeitet und indexiert Daten im Hintergrund mit TF-Vektorisierung
- **Retriever Worker**: Führt effiziente Suchabfragen durch
- **Hauptthread**: Koordiniert die Worker und handhabt die UI-Kommunikation
- **Backend Lifesync**: Express-Server mit RSA-signiertem JWT und SQLite

### Komponenten

#### Frontend (`frontend/`)
- `frontend_index.html` - SPA mit IndexedDB Core und Worker-Bridge
- `worker_indexer.js` - Batch-Indexierung mit TF/IDF-Vektorisierung
- `worker_learner.js` - Placeholder für zukünftige ML-Features
- `transport.js` - Worker-Transport-Helfer mit Timeout & Kompression

#### Backend (`backend/`)
- `backend_index.js` - Express Lifesync API mit JWT-Signierung
- `keys/` - RSA-Schlüssel für JWT (nicht im Repo)
- `data/` - SQLite-Datenbank für Sync-Einträge

#### Existing TypeScript Implementation (`src/`)
- Modern TypeScript/Vite-basierte Implementierung
- Vollständige Tests und Type-Safety
- Läuft parallel zur neuen PoC-Implementierung

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

## Docker Deployment

### 1. Backend RSA-Keys generieren

**WICHTIG**: Vor dem ersten Start müssen RSA-Keys für JWT-Signierung generiert werden:

```bash
cd backend

# Private Key generieren
openssl genrsa -out keys/private.pem 2048

# Public Key extrahieren
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Verifizieren
ls -la keys/
```

**Sicherheitshinweis**: Keys werden NICHT ins Repo committed (`.gitignore`).

### 2. SSL-Zertifikate generieren (für Development)

```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=localhost"
```

### 3. Container starten

```bash
# Build und start
npm run build
docker compose up -d --build

# Logs anzeigen
docker compose logs -f

# Health check
curl -k https://localhost/health

# Test Lifesync API
curl -k -X POST https://localhost/api/lifesync \
  -H "Content-Type: application/json" \
  -d '{"source":"test","payload":{"data":"test"},"meta":{}}'

# Container stoppen
docker compose down
```

### 4. Zugriff auf Services

- **Frontend (Vite)**: https://localhost/
- **Frontend (PoC)**: https://localhost/frontend/frontend_index.html
- **Backend Health**: https://localhost/health
- **Lifesync API**: https://localhost/api/lifesync
- **Stats**: https://localhost/stats

## CI/CD

Das Projekt verwendet GitHub Actions für automatisierte Tests:

- **Smoke Tests**: Validiert Docker-Setup, SSL, und Health-Endpoints
- **Security Scan**: Trivy-Scanner für Vulnerabilities  
- **Config Validation**: Prüft docker-compose.yml, nginx.conf, und JSON-Configs

Workflows befinden sich in `.github/workflows/`.

## Lizenz

Ai,Ki,Multi,Gentlify,Hopeful
