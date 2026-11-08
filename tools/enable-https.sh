#!/usr/bin/env bash
# Local HTTPS only. Exports the PUBLIC CA certificate; never copies the CA private key.
set -euo pipefail
cd "$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
if ! grep -Eq '^DASHFOOD_DOMAIN=localhost\r?$' .env; then
  echo 'Этот помощник рассчитан на DASHFOOD_DOMAIN=localhost в .env.' >&2
  exit 1
fi
docker compose --profile https up -d https
mkdir -p .local-certs
for task_attempt in {1..30}; do
  if docker compose cp https:/data/caddy/pki/authorities/local/root.crt .local-certs/root.crt >/dev/null 2>&1; then
    if curl --fail --silent --show-error --max-time 3 --cacert .local-certs/root.crt https://localhost/api/health; then
      printf '\nHTTPS работает: https://localhost\n'
      echo 'Публичный сертификат CA: .local-certs/root.crt. Системное доверие не изменялось.'
      echo 'Для проверки: curl --cacert .local-certs/root.crt https://localhost/api/health'
      echo 'Для браузера: импортируй root.crt в Keychain Access → login → Certificates; проверь издателя Caddy Local Authority и включи доверие SSL.'
      exit 0
    fi
  fi
  sleep 2
done
echo 'HTTPS не подтвердился. Проверь: docker compose logs --tail 40 https' >&2
exit 1
