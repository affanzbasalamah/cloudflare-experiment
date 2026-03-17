#!/usr/bin/env bash
# List all DNS records for salamahsystems.com
# Usage: ./list-records.sh [--type A|CNAME|MX|TXT|...]
set -euo pipefail

ZONE="salamahsystems.com"
TYPE="${1:-}"

if [[ -z "$CF_API_TOKEN" ]]; then
  echo "Error: CF_API_TOKEN is not set. Export it first:" >&2
  echo "  export CF_API_TOKEN=\"your-token\"" >&2
  exit 1
fi

if [[ -n "$TYPE" ]]; then
  echo "==> DNS records for $ZONE (type: $TYPE)"
  /Users/Affan/go/bin/flarectl dns list --zone "$ZONE" --type "$TYPE"
else
  echo "==> All DNS records for $ZONE"
  /Users/Affan/go/bin/flarectl dns list --zone "$ZONE"
fi
