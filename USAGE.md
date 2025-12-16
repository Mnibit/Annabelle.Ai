# Annabelle.AI Nutzungsanleitung

## Installation

```bash
npm install
```

## Entwicklung

### Lokalen Development Server starten

```bash
npm run dev
```

Der Server läuft dann auf http://localhost:5173

### Mit Docker

```bash
docker compose up --build
```

## Verwendung der API

### Initialisierung

```typescript
import { AnnabelleAI } from './core/AnnabelleAI';

const ai = new AnnabelleAI();
await ai.initialize();
```

### Daten hinzufügen

```typescript
// Einzelner Eintrag
await ai.addEntry({
  id: 'doc-1',
  content: 'Dies ist ein Beispieldokument',
  metadata: {
    author: 'Max Mustermann',
    timestamp: Date.now(),
  },
  timestamp: Date.now(),
});

// Mehrere Einträge (Batch)
await ai.addEntries([
  { id: 'doc-1', content: 'Dokument 1', metadata: {}, timestamp: Date.now() },
  { id: 'doc-2', content: 'Dokument 2', metadata: {}, timestamp: Date.now() },
]);
```

### Suchen

```typescript
// Einfache Suche
const results = await ai.search('Suchbegriff', 10);

// Erweiterte Suche mit Retriever
const advancedResults = await ai.advancedSearch(
  {
    query: 'Suchbegriff',
    limit: 20,
    filters: {
      author: 'Max Mustermann',
    },
  },
  dataSource
);
```

### Statistiken abrufen

```typescript
const stats = await ai.getStats();
console.log('Einträge:', stats.totalEntries);
console.log('RAM Nutzung:', stats.memoryUsage, 'MB');
```

### Aufräumen

```typescript
// Index leeren
await ai.clear();

// Cache leeren
await ai.clearCache();

// Workers beenden
ai.terminate();
```

## Architektur

### Web Worker Struktur

Annabelle.AI nutzt zwei spezialisierte Web Workers:

1. **Indexer Worker** (`src/workers/indexer.worker.ts`)
   - Verwaltet den Suchindex
   - Batch-Verarbeitung für effiziente Speichernutzung
   - Automatische Kompaktierung bei hoher Speicherauslastung

2. **Retriever Worker** (`src/workers/retriever.worker.ts`)
   - Führt Suchabfragen aus
   - Integriertes Caching für häufige Anfragen
   - Relevanz-Scoring für bessere Ergebnisse

### Memory Management

Die `MemoryMonitor` Klasse überwacht kontinuierlich die Speichernutzung:

```typescript
import { MemoryMonitor } from './utils/memory';

const monitor = new MemoryMonitor(512, 0.8); // 512MB Limit, 80% Warning

if (monitor.isMemoryCritical()) {
  console.warn('Kritische Speicherauslastung!');
}

const stats = monitor.getStats();
console.log('Verwendet:', stats.used, 'MB');
console.log('Limit:', stats.limit, 'MB');
```

### Batch Processing

Für große Datenmengen bietet die `BatchProcessor` Klasse effiziente Verarbeitung:

```typescript
import { BatchProcessor } from './utils/memory';

const processor = new BatchProcessor(100); // 100 Items pro Batch

for await (const progress of processor.processBatches(items, async (batch) => {
  // Verarbeite Batch
  await processItems(batch);
})) {
  console.log(`Fortschritt: ${progress}/${items.length}`);
}
```

## Performance Optimierungen

### Für 2GB RAM Geräte

- Maximale Worker-Speichernutzung: 768MB (512MB Indexer + 256MB Retriever)
- Batch-Größe: 50-100 Items
- Cache-Größe: 100 Einträge
- Automatische Kompaktierung bei 80% Speicherauslastung

### Best Practices

1. **Batch-Operationen verwenden**: Nutzen Sie `addEntries()` statt mehrerer `addEntry()` Aufrufe
2. **Cache-Management**: Leeren Sie den Cache bei Speicherproblemen mit `clearCache()`
3. **Index-Kompaktierung**: Der Index wird automatisch kompaktiert, aber Sie können auch manuell `clear()` aufrufen
4. **Worker-Termine**: Beenden Sie Worker mit `terminate()` wenn sie nicht mehr benötigt werden

## Testen

```bash
# Alle Tests ausführen
npm test

# Tests mit Coverage
npm run test:ci

# Type-Checking
npm run type-check

# Linting
npm run lint
```

## Build für Produktion

```bash
npm run build
```

Die Build-Artefakte werden im `dist/` Verzeichnis erstellt.

## Backend-Integration

Der mitgelieferte Backend-Stub (`backend-stub/server.js`) kann als Beispiel für die Integration dienen:

```bash
# Backend-Stub starten
cd backend-stub
node server.js
```

Endpunkte:
- `GET /health` - Health Check
- `GET /data` - Alle Daten abrufen
- `POST /data` - Daten hinzufügen
- `DELETE /data/:id` - Daten löschen

## RSA Schlüssel generieren

```bash
# Private Key generieren
openssl genrsa -out private.pem 2048

# Public Key extrahieren
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

## Troubleshooting

### Speicherprobleme

Wenn Sie Speicherprobleme erleben:
1. Reduzieren Sie die Batch-Größe
2. Leeren Sie den Cache häufiger
3. Nutzen Sie die Index-Kompaktierung
4. Überwachen Sie die Speichernutzung mit `getStats()`

### Worker-Fehler

Bei Worker-Fehlern:
1. Prüfen Sie die Browser-Konsole
2. Stellen Sie sicher, dass Worker-Support aktiviert ist
3. Beenden und re-initialisieren Sie die Workers

### Build-Probleme

Bei Build-Problemen:
1. Löschen Sie `node_modules` und `dist`
2. Führen Sie `npm ci` aus
3. Stellen Sie sicher, dass Node.js 18+ installiert ist
