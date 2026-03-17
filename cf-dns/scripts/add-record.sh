#!/usr/bin/env bash
# Add a DNS A record for salamahsystems.com
# Usage: ./add-record.sh <name> <ip> [ttl]
#   name: subdomain (e.g. "test" → test.salamahsystems.com, "@" for root)
#   ip:   IPv4 address
#   ttl:  TTL in seconds (default: 300; use 1 for "automatic")
set -euo pipefail

ZONE="salamahsystems.com"
NAME="${1:-}"
IP="${2:-}"
TTL="${3:-300}"

if [[ -z "$CF_API_TOKEN" ]]; then
  echo "Error: CF_API_TOKEN is not set." >&2
  exit 1
fi

if [[ -z "$NAME" || -z "$IP" ]]; then
  echo "Usage: $0 <name> <ip> [ttl]" >&2
  echo "  Example: $0 test 1.2.3.4" >&2
  exit 1
fi

echo "==> Adding A record: $NAME.$ZONE → $IP (TTL: $TTL)"
/Users/Affan/go/bin/flarectl dns create \
  --zone "$ZONE" \
  --name "$NAME" \
  --type A \
  --content "$IP" \
  --ttl "$TTL"

echo "Done. Run list-records.sh to verify."
