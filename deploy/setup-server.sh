#!/usr/bin/env bash
# One-time hardening of a fresh Ubuntu server (run as root, e.g. Hetzner Cloud
# with the "Docker CE" app image). Safe to run again.
#
#   sudo bash deploy/setup-server.sh
#
# What it does: system updates, automatic security updates, firewall (22, 80,
# 443), fail2ban for SSH, SSH hardening (keys only), 2 GB swap, Docker check.
set -euo pipefail

die() { echo "ERROR: $*" >&2; exit 1; }
say() { echo; echo "==> $*"; }

[ "$(id -u)" -eq 0 ] || die "Run this script as root."
. /etc/os-release
[ "${ID:-}" = "ubuntu" ] || [ "${ID:-}" = "debian" ] || die "Only Ubuntu/Debian is supported (found: ${ID:-unknown})."

export DEBIAN_FRONTEND=noninteractive

# --- Do not lock yourself out ------------------------------------------------
KEYFILE=/root/.ssh/authorized_keys
if [ ! -s "$KEYFILE" ]; then
  die "No SSH key found in $KEYFILE. Add your public key first, or password login would be switched off with no way in."
fi

say "Updating packages"
apt-get update -y
apt-get upgrade -y
apt-get install -y ufw fail2ban unattended-upgrades age curl ca-certificates git

say "Automatic security updates"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

say "Swap (2 GB), helps the Docker build on small servers"
if [ "$(swapon --show --noheadings | wc -l)" -eq 0 ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
  sysctl -p /etc/sysctl.d/99-swappiness.conf >/dev/null
else
  echo "Swap already present, leaving it."
fi

say "Docker"
if command -v docker >/dev/null 2>&1; then
  echo "Docker found: $(docker --version)"
else
  echo "Docker not found, installing with the official script."
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin || die "Docker Compose plugin missing and could not be installed."
fi
systemctl enable --now docker
docker compose version

say "SSH hardening (keys only, no passwords)"
cat > /etc/ssh/sshd_config.d/00-financecockpit.conf <<'EOF'
# Named 00- so it wins over files like 50-cloud-init.conf (first value wins).
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 3
X11Forwarding no
EOF
mkdir -p /run/sshd  # sshd -t needs it; it only exists while the service runs
if ! sshd -t; then
  rm -f /etc/ssh/sshd_config.d/00-financecockpit.conf
  die "SSH configuration is invalid; removed my file, SSH is unchanged."
fi
systemctl reload ssh 2>/dev/null || systemctl reload sshd

say "fail2ban for SSH"
cat > /etc/fail2ban/jail.d/financecockpit.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

say "Firewall (only SSH, HTTP, HTTPS)"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (certificate and redirect)'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 443/udp comment 'HTTP/3'
ufw --force enable
ufw status verbose

say "Done"
cat <<'EOF'

Next steps (as root, in the project directory):
  1. cp .env.example .env && nano .env
       DOMAIN=<your hard-to-guess subdomain>
       ALLOW_REGISTRATION=true        # only until the accounts exist
  2. Point the DNS A record of the domain at this server.
  3. bash deploy/deploy.sh
  4. Open the site, create the accounts, then set ALLOW_REGISTRATION=false in
     .env and run  bash deploy/deploy.sh  again.
  5. bash deploy/setup-backup.sh

Note: ports that Docker publishes (80, 443) are opened by Docker itself; the
firewall rules above still protect everything else, including SSH.
Test SSH from a NEW terminal before closing this one.
EOF
