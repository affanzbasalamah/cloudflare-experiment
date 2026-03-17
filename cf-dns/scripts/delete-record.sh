#!/usr/bin/env bash
# Delete a DNS record from salamahsystems.com by record ID
# Usage: ./delete-record.sh <record-id>
#   Run list-records.sh first to find the ID.
set -euo pipefail

ZONE="salamahsystems.com"
RECORD_ID="${1:-}"

if [[ -z "$CF_API_TOKEN" ]]; then
  echo "Error: CF_API_TOKEN is not set." >&2
  exit 1
fi

if [[ -z "$RECORD_ID" ]]; then
  echo "Usage: $0 <record-id>" >&2
  echo "  Run ./list-records.sh to find record IDs." >&2
  exit 1
fi

echo "==> Deleting DNS record ID: $RECORD_ID from $ZONE"
/Users/Affan/go/bin/flarectl dns delete --zone "$ZONE" --id "$RECORD_ID"
echo "Deleted. Run list-records.sh to verify."
