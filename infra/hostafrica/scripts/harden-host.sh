#!/usr/bin/env bash
# Harden a fresh HostAfrica Ubuntu VPS for the platform stack.
# Run as root after creating an operator user with SSH keys.
set -euo pipefail

OPERATOR_USER="${OPERATOR_USER:?set OPERATOR_USER to the non-root operator account}"
SSH_PORT="${SSH_PORT:-22}"
OPERATOR_CIDR="${OPERATOR_CIDR:?set OPERATOR_CIDR to the operator VPN/IP range}"

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y \
  ufw fail2ban unattended-upgrades apt-listchanges auditd \
  ca-certificates curl gnupg lsb-release jq age rclone \
  postgresql-client

# Automatic security updates
dpkg-reconfigure -plow unattended-upgrades
cat >/etc/apt/apt.conf.d/51stories-auto-upgrades <<'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
EOF

# Firewall: public HTTP/HTTPS only; SSH from operator range.
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow from "$OPERATOR_CIDR" to any port "$SSH_PORT" proto tcp comment 'operator-ssh'
ufw allow 80/tcp comment 'http-acme'
ufw allow 443/tcp comment 'https'
ufw --force enable

# SSH hardening
install -d -m 0755 /etc/ssh/sshd_config.d
cat >/etc/ssh/sshd_config.d/99-stories-hardening.conf <<EOF
Port ${SSH_PORT}
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PubkeyAuthentication yes
AllowUsers ${OPERATOR_USER}
X11Forwarding no
AllowTcpForwarding no
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
systemctl reload ssh || systemctl reload sshd

# fail2ban
systemctl enable --now fail2ban

# Operator docker membership without password elevation for compose.
usermod -aG docker "$OPERATOR_USER" || true

# Kernel/network hardening snippets
cat >/etc/sysctl.d/99-stories-hardening.conf <<'EOF'
net.ipv4.conf.all.rp_filter=1
net.ipv4.conf.default.rp_filter=1
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.all.accept_source_route=0
net.ipv6.conf.all.accept_redirects=0
net.ipv6.conf.all.accept_source_route=0
kernel.kptr_restrict=2
kernel.dmesg_restrict=1
EOF
sysctl --system >/dev/null

printf 'Host hardening complete for operator %s\n' "$OPERATOR_USER"
printf 'Verify: ufw status, ss -tlnp, fail2ban-client status, unattended-upgrade --dry-run\n'
