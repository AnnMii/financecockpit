#!/usr/bin/env bash
# Builds and starts (or updates) the app. Run in the project directory on the
# server, for the first deployment and for every update:
#
#   bash deploy/deploy.sh
#
# Updating takes a backup first (if backups are set up), pulls the new code,
# rebuilds and restarts. Database migrations run automatically on start.
set -euo pipefail

die() { echo "ERROR: $*" >&2; exit 1; }
say() { echo; echo "==> $*"; }

cd "$(dirname "$0")/.."

command -v docker >/dev/null || die "Docker is not installed. Run deploy/setup-server.sh first."
[ -f .env ] || die ".env is missing. Run: cp .env.example .env && nano .env"
grep -Eq '^DOMAIN=.+' .env || die "Set DOMAIN=... in .env (a line starting with # is ignored)."

if [ -d .git ]; then
  if [ -f /etc/financecockpit-backup.env ] && docker compose ps --status running --services 2>/dev/null | grep -qx app; then
    say "Backup before the update"
    bash deploy/backup.sh || echo "WARNING: backup failed, continuing."
  fi
  say "Fetching the latest code"
  git pull --ff-only
fi

say "Building the image (takes a few minutes on a small server)"
docker compose build

say "Starting"
docker compose up -d --remove-orphans

say "Waiting for the app to become healthy"
for i in $(seq 1 30); do
  if docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "App is healthy."
    docker compose ps
    echo
    echo "Open: https://$(grep -E '^DOMAIN=' .env | cut -d= -f2-)"
    exit 0
  fi
  sleep 3
done

echo "The app did not become healthy. Last log lines:" >&2
docker compose logs --tail=40 app >&2
exit 1
