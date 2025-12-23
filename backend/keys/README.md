# RSA Keys Directory

This directory stores RSA key pairs for JWT signing.

## Generate Keys

Run these commands from the `backend/` directory:

```bash
# Generate 2048-bit private key
openssl genrsa -out keys/private.pem 2048

# Extract public key from private key
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Set appropriate permissions (Unix/Linux)
chmod 600 keys/private.pem
chmod 644 keys/public.pem
```

## Security

- **NEVER** commit private keys to version control
- Private keys are included in `.gitignore`
- For production: use secure key management systems (AWS KMS, HashiCorp Vault, etc.)
- Rotate keys periodically
- Store keys in encrypted volumes in Docker

## Docker Setup

When running in Docker, mount keys as read-only volumes:

```yaml
volumes:
  - ./backend/keys:/app/keys:ro
```

## Verification

Verify keys were generated correctly:

```bash
# Check private key
openssl rsa -in keys/private.pem -check -noout

# View public key
openssl rsa -in keys/private.pem -pubout -text -noout

# Verify key pair match
diff <(openssl rsa -in keys/private.pem -pubout) keys/public.pem
```
