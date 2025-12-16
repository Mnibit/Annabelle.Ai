# Contributing zu Annabelle.AI

Vielen Dank für Ihr Interesse an der Weiterentwicklung von Annabelle.AI!

## Development Setup

1. Repository klonen
```bash
git clone git@github.com:yourorg/annabelle-ai.git
cd annabelle-ai
```

2. Abhängigkeiten installieren
```bash
npm ci
```

3. Development Server starten
```bash
npm run dev
```

## Code-Qualität

Vor dem Commit bitte sicherstellen:

```bash
# Type-Checking
npm run type-check

# Linting
npm run lint

# Tests
npm test

# Build
npm run build
```

## Code Style

- TypeScript für Type-Safety
- ESLint für Code-Qualität
- Funktionale und objektorientierte Patterns
- Kommentare auf Deutsch für Dokumentation
- Klare Variablen- und Funktionsnamen

## Testing

- Tests mit Vitest
- Mindestens Unit-Tests für neue Features
- Integration-Tests wo sinnvoll

## Pull Requests

1. Feature-Branch erstellen: `git checkout -b feature/mein-feature`
2. Änderungen commiten: `git commit -m "Add: Mein Feature"`
3. Push: `git push origin feature/mein-feature`
4. Pull Request erstellen

## Commit-Nachrichten

Format: `<Typ>: <Kurzbeschreibung>`

Typen:
- `Add:` Neue Features
- `Fix:` Bugfixes
- `Update:` Änderungen an bestehendem Code
- `Remove:` Entfernung von Code
- `Docs:` Dokumentation
- `Test:` Tests

## Fragen?

Bei Fragen gerne ein Issue erstellen oder die Maintainer kontaktieren.
