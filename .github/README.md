# GitHub Actions CI/CD

This directory contains GitHub Actions workflows for Annabelle.AI.

## Workflows

### Smoke Tests (`smoke-tests.yml`)

Comprehensive testing pipeline that runs on every push and pull request.

**Jobs:**

1. **Smoke Tests (Docker)**
   - Validates Docker Compose setup
   - Generates SSL certificates for HTTPS
   - Tests health endpoints
   - Validates SSL redirect (HTTP → HTTPS)
   - Tests static file serving
   - Captures logs on failure

2. **Security Scan**
   - Runs Trivy vulnerability scanner
   - Scans for CRITICAL and HIGH severity issues
   - Uploads results to GitHub Security tab (SARIF format)

3. **Configuration Validation**
   - Validates docker-compose.yml syntax
   - Validates nginx.conf configuration
   - Validates all JSON config files

**Triggers:**
- Push to `main`, `develop`, or `feat/*` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Environment Variables:**
- `COMPOSE_PROJECT_NAME: josi_ci` - Unique project name for CI

## Local Testing

You can test the CI workflows locally:

```bash
# Validate configurations
docker compose config
docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t
python3 -m json.tool config/*.json

# Run smoke tests manually
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=localhost"

npm run build
docker compose up -d --build

# Wait for services to start
sleep 10

# Test health endpoint
curl -k https://localhost/health

# Test SSL redirect
curl -s -o /dev/null -w "%{http_code}" http://localhost/

# Cleanup
docker compose down --volumes
```

## Security Scanning

The Trivy scanner checks for:
- Known vulnerabilities in dependencies
- Configuration issues
- Exposed secrets
- License compliance

Results are automatically uploaded to the GitHub Security tab for review.

## Troubleshooting

### Health Check Failures

If health checks fail:
1. Check container logs: `docker compose logs`
2. Verify SSL certificates exist in `nginx/certs/`
3. Ensure `dist/` directory has build artifacts
4. Check backend service is running: `docker compose ps`

### SSL Certificate Issues

If SSL fails:
1. Regenerate certificates (see command above)
2. Verify file permissions (readable by nginx container)
3. Check nginx logs: `docker compose logs nginx`

### Configuration Validation Failures

If validation fails:
1. Run local validation commands
2. Check YAML/JSON syntax
3. Verify nginx upstream names match docker-compose services
