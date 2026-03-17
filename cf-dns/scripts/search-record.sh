#!/usr/bin/env bash
# Search DNS records for salamahsystems.com by name or type
# Usage: ./search-record.sh <keyword>
#   keyword: partial name or type (e.g. "mail", "A", "CNAME")
set -euo pipefail

ZONE="salamahsystems.com"
KEYWORD="${1:-}"

if [[ -z "$CF_API_TOKEN" ]]; then
  echo "Error: CF_API_TOKEN is not set." >&2
  exit 1
fi

if [[ -z "$KEYWORD" ]]; then
  echo "Usage: $0 <keyword>" >&2
  echo "  Example: $0 mail" >&2
  exit 1
fi

echo "==> Searching DNS records for '$KEYWORD' in $ZONE"
/Users/Affan/go/bin/flarectl dns list --zone "$ZONE" | grep -i "$KEYWORD" || echo "No records matched '$KEYWORD'."
