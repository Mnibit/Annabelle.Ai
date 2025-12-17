# Annabelle Backend - Lifesync API

Backend service for Annabelle with RSA-signed JWT and SQLite storage.

## Setup

### 1. Generate RSA Keys

**IMPORTANT**: Generate RSA keys before starting the server.

```bash
cd backend

# Generate private key
openssl genrsa -out keys/private.pem 2048

# Generate public key from private key
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Verify keys were created
ls -la keys/
```

**Security Note**: 
- NEVER commit private keys to version control
- The `keys/` directory is in `.gitignore`
- In production, use secure key management (AWS KMS, Vault, etc.)

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server will listen on port 8443 (configurable in `.env`).

## API Endpoints

### POST /api/lifesync

Sync and sign data payload.

**Request:**
```json
{
  "source": "annabelle-frontend",
  "payload": {...},
  "meta": {...}
}
```

**Response:**
```json
{
  "id": "uuid",
  "signedToken": "eyJhbGciOiJSUzI1NiIs...",
  "hash": "sha256_hash",
  "timestamp": 1234567890
}
```

**Rate Limit**: 60 requests per minute per source

### GET /api/verify/:id

Check if a sync entry exists.

**Response:**
```json
{
  "exists": true,
  "id": "uuid",
  "source": "source-name",
  "created": 1234567890
}
```

### POST /api/verify-token

Verify a JWT token signature.

**Request:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response:**
```json
{
  "valid": true,
  "decoded": {...}
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "annabelle-backend",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "syncCount": 42
}
```

### GET /stats

Get sync statistics.

**Response:**
```json
{
  "total": 100,
  "bySource": [
    {"source": "annabelle-frontend", "count": 80},
    {"source": "other-source", "count": 20}
  ],
  "timestamp": 1234567890
}
```

## Configuration

Edit `.env` to configure:

- `PORT` - Server port (default: 8443)
- `NODE_ENV` - Environment (development/production)
- `RATE_LIMIT` - Max requests per window (default: 60)
- `RATE_WINDOW_MS` - Rate limit window in ms (default: 60000)

## Security

### JWT Signing

- Uses RSA-256 algorithm
- Private key for signing
- Public key for verification
- 1 hour expiration

### Rate Limiting

- In-memory rate limiter (PoC)
- Per-source tracking
- For production: use Redis or similar

### Payload Validation

- Non-empty source required
- Payload required
- SHA-256 hash verification

## Docker

The backend is configured to run in Docker via docker-compose.

```bash
# From project root
docker compose up -d backend

# View logs
docker compose logs -f backend
```

## Development

```bash
# Watch mode
npm run dev

# Test endpoints
curl -X POST http://localhost:8443/api/lifesync \
  -H "Content-Type: application/json" \
  -d '{"source":"test","payload":{"data":"test"},"meta":{}}'

# Health check
curl http://localhost:8443/health
```

## Database

SQLite database stored in `./data/lifesync.db`

**Schema:**
```sql
CREATE TABLE sync (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    payloadHash TEXT NOT NULL,
    created INTEGER NOT NULL,
    meta TEXT
);
```

## Troubleshooting

### "Failed to load RSA keys"

Generate keys first:
```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### Port already in use

Change port in `.env`:
```
PORT=3000
```

### Database errors

Ensure `data/` directory exists:
```bash
mkdir -p data
```
