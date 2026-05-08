#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "[info] Starting PostgreSQL from infra/docker-compose.yml"

if command -v podman-compose >/dev/null 2>&1; then
  echo "[info] Using podman-compose"
  podman-compose up -d
  podman ps
  exit 0
fi

if command -v podman >/dev/null 2>&1; then
  echo "[info] Using podman compose"
  podman compose up -d
  podman ps
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  echo "[info] Using docker compose"
  docker compose up -d
  docker compose ps
  exit 0
fi

echo "[error] No container runtime found."
echo "[error] Install one of: docker, podman-compose, podman."
exit 1
