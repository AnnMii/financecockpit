#!/usr/bin/env bash
# Sets up daily encrypted backups with a systemd timer (run as root, once).
#
#   sudo bash deploy/setup-backup.sh
#
# You need an age key pair. Best: create it on YOUR computer (`age-keygen -o
# key.txt`), keep key.txt in your password manager, and paste only the public
# key ("age1...") here. If you have none, the script can create one on the
# server and shows the private key ONCE; you must store it and it is removed
# from the server.
set -euo pipefail

die() { echo "ERROR: $*" >&2; exit 1; }
[ "$(id -u)" -eq 0 ] || die "Run this script as root."
command -v age >/dev/null || apt-get install -y age

APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
CONFIG=/etc/financecockpit-backup.env

read -r -p "age PUBLIC key (age1...), or press Enter to create a new key pair here: " recipient
if [ -z "$recipient" ]; then
  tmp=$(mktemp)
  age-keygen -o "$tmp" 2>/dev/null
  recipient=$(grep -o 'age1[0-9a-z]*' "$tmp" | head -1)
  echo
  echo "================ PRIVATE KEY - STORE IT NOW (password manager + printout) ================"
  cat "$tmp"
  echo "==========================================================================================="
  echo "Without this key your backups cannot be restored. It is NOT kept on the server."
  read -r -p "Type 'saved' once you have stored it: " ok
  [ "$ok" = "saved" ] || { shred -u "$tmp"; die "Aborted, nothing was set up."; }
  shred -u "$tmp"
fi
case "$recipient" in age1*) ;; *) die "That does not look like an age public key.";; esac

remote=""; rport="23"; rdir="."; rkey=""
read -r -p "Second location as user@host (e.g. a Hetzner Storage Box), or Enter to skip: " remote
if [ -n "$remote" ]; then
  read -r -p "SSH port [23 for Hetzner Storage Box]: " p; rport=${p:-23}
  read -r -p "Directory on the remote [backups]: " d; rdir=${d:-backups}
  rkey=/root/.ssh/financecockpit_backup_ed25519
  if [ ! -f "$rkey" ]; then
    ssh-keygen -t ed25519 -N "" -C "financecockpit-backup" -f "$rkey" >/dev/null
  fi
  echo
  echo "Add this public key to the remote (Storage Box: Console > Storage Box > SSH keys):"
  cat "$rkey.pub"
  read -r -p "Press Enter when done..." _
fi

umask 077
cat > "$CONFIG" <<EOF
AGE_RECIPIENT=$recipient
BACKUP_DIR=/var/backups/financecockpit
KEEP_DAILY=14
KEEP_MONTHLY=12
APP_DIR=$APP_DIR
EOF
if [ -n "$remote" ]; then
  cat >> "$CONFIG" <<EOF
BACKUP_REMOTE=$remote
BACKUP_REMOTE_PORT=$rport
BACKUP_REMOTE_DIR=$rdir
BACKUP_REMOTE_KEY=$rkey
EOF
fi
chmod 600 "$CONFIG"

cat > /etc/systemd/system/financecockpit-backup.service <<EOF
[Unit]
Description=Encrypted backup of the Finanzcockpit database
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/env bash $APP_DIR/deploy/backup.sh
EOF
cat > /etc/systemd/system/financecockpit-backup.timer <<'EOF'
[Unit]
Description=Daily backup of the Finanzcockpit database

[Timer]
OnCalendar=*-*-* 03:15:00
RandomizedDelaySec=15min
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now financecockpit-backup.timer

echo
echo "Running a first backup now..."
bash "$APP_DIR/deploy/backup.sh"
echo
systemctl list-timers financecockpit-backup.timer --no-pager
echo
echo "Next: test a restore (deploy/restore.sh) with your private key."
