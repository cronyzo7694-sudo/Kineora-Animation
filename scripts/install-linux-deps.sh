#!/usr/bin/env bash
# Kineora Animation — install ALL desktop-shell system dependencies at once
# (one command, idempotent: already-installed packages are skipped fast).
#
# Tauri v2 Linux prerequisites (Debian/Ubuntu/Mint · Fedora · Arch), + a
# verification step at the end. Run:  bash scripts/install-linux-deps.sh
set -euo pipefail

echo "━━━ Kineora Animation — installing desktop dependencies ━━━"

if command -v apt-get >/dev/null 2>&1; then
  # Debian / Ubuntu / Linux Mint
  sudo apt-get update
  sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    pkg-config

elif command -v dnf >/dev/null 2>&1; then
  # Fedora / RHEL-family
  sudo dnf check-update || true
  sudo dnf group install -y "C Development Tools and Libraries"
  sudo dnf install -y \
    webkit2gtk4.1-devel \
    openssl-devel \
    curl wget file \
    libappindicator-gtk3-devel \
    librsvg2-devel \
    pkg-config

elif command -v pacman >/dev/null 2>&1; then
  # Arch / Manjaro
  sudo pacman -Syu --noconfirm
  sudo pacman -S --needed --noconfirm \
    webkit2gtk-4.1 \
    base-devel \
    curl wget file \
    openssl \
    gtk3 \
    libappindicator-gtk3 \
    librsvg \
    pkg-config

else
  echo "✗ Unsupported package manager (expected apt / dnf / pacman)." >&2
  echo "  Install these manually for Tauri v2: webkit2gtk-4.1 (dev), gtk3 (dev),"
  echo "  build-essential, libayatana-appindicator3, librsvg2, libssl, pkg-config." >&2
  exit 1
fi

echo
echo "━━━ Verification ━━━"
if pkg-config --exists webkit2gtk-4.1; then
  echo "✓ webkit2gtk-4.1   $(pkg-config --modversion webkit2gtk-4.1)"
else
  echo "✗ webkit2gtk-4.1 still not found — your distro release may be too old." >&2
  echo "  Linux Mint 21.x / Ubuntu 22.04 do NOT ship webkit2gtk-4.1 (Tauri v2 needs it)." >&2
  echo "  Fix: upgrade to Linux Mint 22 (Ubuntu 24.04 base), or paste the output of:" >&2
  echo "      cat /etc/os-release" >&2
  exit 1
fi
if pkg-config --exists gtk+-3.0; then
  echo "✓ gtk+-3.0         $(pkg-config --modversion gtk+-3.0)"
fi

echo
echo "✅ All desktop dependencies ready. Now run:  bash scripts/dev-desktop.sh"
