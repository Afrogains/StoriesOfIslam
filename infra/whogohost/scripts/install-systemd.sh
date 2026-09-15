#!/usr/bin/env bash
# Install backup and health-check systemd units on the WhoGoHost VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UNIT_DIR="${UNIT_DIR:-/etc/systemd/system}"

install -m 0755 "$ROOT/backup.sh" /usr/local/sbin/stories-backup.sh
install -m 0755 "$ROOT/restore-drill.sh" /usr/local/sbin/stories-restore-drill.sh
install -m 0755 "$ROOT/scripts/health-check.sh" /usr/local/sbin/stories-health-check.sh

install -m 0644 "$ROOT/systemd/stories-backup.service" "$UNIT_DIR/stories-backup.service"
install -m 0644 "$ROOT/systemd/stories-backup.timer" "$UNIT_DIR/stories-backup.timer"
install -m 0644 "$ROOT/systemd/stories-health-check.service" "$UNIT_DIR/stories-health-check.service"
install -m 0644 "$ROOT/systemd/stories-health-check.timer" "$UNIT_DIR/stories-health-check.timer"

systemctl daemon-reload
systemctl enable --now stories-backup.timer stories-health-check.timer
systemctl list-timers 'stories-*'
printf 'Installed stories backup and health timers\n'
