#!/usr/bin/env bash
# Restores the database from an encrypted backup. This REPLACES the current
# database (a safety copy stays in the data volume as pre-restore-*.db).
#
#   bash deploy/restore.sh /var/backups/financecockpit/fc-<time>.db.age /path/to/age-private-key.txt
#
# Copy the private key to the server temporarily (scp) and delete it afterwards:
#   shred -u /path/to/age-private-key.txt
set -euo pipefail

die() { echo "ERROR: $*" >&2; exit 1; }

backup=${1:-}; key=${2:-}
[ -f "$backup" ] && [ -f "$key" ] || die "Usage: bash deploy/restore.sh <backup.db.age> <age-private-key.txt>"
command -v age >/dev/null || die "age is not installed (apt-get install age)."

cd "$(dirname "$0")/.."
umask 077

plain=$(mktemp)
trap 'shred -u "$plain" 2>/dev/null || rm -f "$plain"' EXIT
age -d -i "$key" -o "$plain" "$backup" || die "Decryption failed (wrong key or damaged file)."
head -c 16 "$plain" | grep -q "SQLite format 3" || die "The decrypted file is not an SQLite database."

echo "This replaces the current database with: $backup"
read -r -p "Type 'restore' to continue: " ok
[ "$ok" = "restore" ] || die "Aborted."

stamp=$(date -u +%Y%m%dT%H%M%SZ)
echo "==> Stopping the app"
docker compose stop app

echo "==> Keeping a safety copy of the current database"
docker compose run --rm --no-deps -T app node scripts/backup.mjs "/app/data/pre-restore-$stamp.db" || echo "(no current database to keep)"

echo "==> Writing the restored database"
docker compose run --rm --no-deps -T app sh -c 'cat > /app/data/restore.tmp' < "$plain"
docker compose run --rm --no-deps -T app node -e "
const fs = require('fs');
for (const s of ['', '-wal', '-shm', '-journal']) fs.rmSync('/app/data/financecockpit.db' + s, { force: true });
fs.renameSync('/app/data/restore.tmp', '/app/data/financecockpit.db');
"

echo "==> Starting the app"
docker compose up -d
echo "Restored. Check the site and sign in. Safety copy: pre-restore-$stamp.db (in the data volume)."
