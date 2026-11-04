#!/usr/bin/env bash
set -euo pipefail
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

# macOS / Linux. Uses the same Compose services and .env as setup.ps1.
if ! command -v docker >/dev/null 2>&1; then
  if [ -x /Applications/Docker.app/Contents/Resources/bin/docker ]; then
    export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
  else
    echo 'Docker не найден. Установи и открой Docker Desktop.' >&2
    exit 1
  fi
fi
if ! docker info >/dev/null 2>&1; then
  echo 'Docker Desktop не запущен. Открой его, дождись запуска и повтори: bash setup.sh' >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo 'Не найден Docker Compose. Проверь установку Docker Desktop.' >&2
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo 'Для проверки запуска нужен curl.' >&2
  exit 1
fi

if [ ! -f .env ]; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo 'Для создания паролей нужен openssl.' >&2
    exit 1
  fi
  (
    umask 077
    task_env=$(mktemp .env.setup.XXXXXX)
    trap 'rm -f "$task_env"' EXIT
    {
      printf 'DB_PASSWORD=%s\n' "$(openssl rand -hex 16)"
      printf 'JWT_SECRET=%s\n' "$(openssl rand -hex 32)"
      printf 'ADMIN_PASSWORD=Dash-%s\n' "$(openssl rand -hex 6)"
      printf 'DASHFOOD_DOMAIN=localhost\n'
    } > "$task_env"
    mv "$task_env" .env
  )
  echo 'Создан .env с паролями проекта. Повторный запуск его не меняет.'
fi

if ! docker compose up --build -d; then
  echo 'Запуск не завершён. Диагностика: docker compose logs --tail 40 app db' >&2
  exit 1
fi
echo 'Проверяю сайт и подключение к PostgreSQL…'
for task_attempt in {1..60}; do
  if task_health=$(curl --fail --silent --max-time 2 http://localhost:4000/api/health); then
    if printf '%s' "$task_health" | grep -Eq '"database"[[:space:]]*:[[:space:]]*"connected"'; then
      printf '\nГотово: http://localhost:4000\nЛогин сотрудника: admin\n'
      awk '/^ADMIN_PASSWORD=/{sub(/^ADMIN_PASSWORD=/, ""); sub(/\r$/, ""); print "Пароль сотрудника: " $0}' .env
      echo 'Остановка без удаления данных: docker compose stop'
      exit 0
    fi
  fi
  sleep 2
done
echo 'Сайт не подтвердил подключение к БД. Проверь: docker compose ps' >&2
docker compose logs --tail 40 app db
exit 1
