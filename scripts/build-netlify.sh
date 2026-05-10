#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEBAPP_DIR="$ROOT_DIR/webapp"
ADMIN_DIR="$ROOT_DIR/admin-webapp"
DIST_DIR="$ROOT_DIR/dist"

install_if_needed() {
  local app_dir="$1"
  if [ ! -d "$app_dir/node_modules" ]; then
    npm --prefix "$app_dir" install
  fi
}

install_if_needed "$WEBAPP_DIR"
install_if_needed "$ADMIN_DIR"

npm --prefix "$WEBAPP_DIR" run build
npm --prefix "$ADMIN_DIR" run build

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/admin"
cp -R "$WEBAPP_DIR/dist/." "$DIST_DIR/"
cp -R "$ADMIN_DIR/dist/." "$DIST_DIR/admin/"
