#!/usr/bin/env bash
# Takes an encrypted backup of the database. Run by the systemd timer (see
# deploy/setup-backup.sh) or by hand:
#
#   bash deploy/backup.sh
#
# The backup is encrypted with `age` for a PUBLIC key; the private key is not
# kept on the server, so a stolen backup (or server) cannot be read from here.
# Settings come from /etc/financecockpit-backup.env.
set -euo pipefail

die() { echo "ERROR: $*" >&2; exit 1; }

CONFIG=${BACKUP_CONFIG:-/etc/financecockpit-backup.env}
[ -f "$CONFIG" ] || die "$CONFIG not found. Run deploy/setup-backup.sh first."
# shellcheck disable=SC1090
. "$CONFIG"
: "${AGE_RECIPIENT:?AGE_RECIPIENT missing in $CONFIG}"
BACKUP_DIR=${BACKUP_DIR:-/var/backups/financecockpit}
KEEP_DAILY=${KEEP_DAILY:-14}
KEEP_MONTHLY=${KEEP_MONTHLY:-12}
APP_DIR=${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}

cd "$APP_DIR"
umask 077
mkdir -p "$BACKUP_DIR/monthly"
chmod 700 "$BACKUP_DIR"

stamp=$(date -u +%Y%m%dT%H%M%SZ)
inside=/app/data/.backup-$stamp.db
out=$BACKUP_DIR/fc-$stamp.db.age

cleanup() { docker compose exec -T app rm -f "$inside" >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker compose exec -T app node scripts/backup.mjs "$inside" >/dev/null
docker compose exec -T app cat "$inside" | age -r "$AGE_RECIPIENT" -o "$out.partial"

size=$(stat -c %s "$out.partial")
[ "$size" -gt 1000 ] || { rm -f "$out.partial"; die "Backup is suspiciously small ($size bytes)."; }
mv "$out.partial" "$out"
echo "Backup written: $out ($size bytes)"

# One copy per month is kept longer.
if [ "$(date -u +%d)" = "01" ]; then
  cp "$out" "$BACKUP_DIR/monthly/"
fi

# Retention
ls -1t "$BACKUP_DIR"/fc-*.db.age 2>/dev/null | tail -n +"$((KEEP_DAILY + 1))" | xargs -r rm -f
ls -1t "$BACKUP_DIR"/monthly/fc-*.db.age 2>/dev/null | tail -n +"$((KEEP_MONTHLY + 1))" | xargs -r rm -f

# Second location (e.g. a Hetzner Storage Box), if configured.
if [ -n "${BACKUP_REMOTE:-}" ]; then
  port=${BACKUP_REMOTE_PORT:-23}
  keyopt=()
  [ -n "${BACKUP_REMOTE_KEY:-}" ] && keyopt=(-i "$BACKUP_REMOTE_KEY")
  # shellcheck disable=SC2086
  scp -P "$port" -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${keyopt[@]}" \
    "$out" "$BACKUP_REMOTE:${BACKUP_REMOTE_DIR:-.}/" \
    && echo "Copied to $BACKUP_REMOTE" \
    || { echo "ERROR: copy to $BACKUP_REMOTE failed (local backup is kept)." >&2; exit 2; }
fi
