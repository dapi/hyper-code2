#!/usr/bin/env bash
#
# hyper-code2 checkout bootstrap.

set -euo pipefail

has_command() {
  command -v "$1" >/dev/null 2>&1
}

if [[ -f mise.toml || -f .mise.toml || -f .tool-versions ]]; then
  if ! has_command mise; then
    echo "mise is required by this checkout but is not installed." >&2
    exit 1
  fi

  mise trust
  mise install
fi

if [[ -f .gitmodules ]]; then
  git submodule update --init --recursive
fi

if ! has_command bun; then
  echo "Bun is required by this checkout but is not installed." >&2
  exit 1
fi

bun install --frozen-lockfile

cat <<'EOF'
hyper-code2 dependencies are installed.

Start the server with: bun src/$main.ts
Run checks with:      bunx tsc --noEmit && bun test --timeout 5000
EOF
