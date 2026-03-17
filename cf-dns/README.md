# cf-dns — DNS Management for salamahsystems.com

Manage Cloudflare DNS records using `flarectl` CLI.

## Setup

1. Create an API token in Cloudflare dashboard:
   - Dashboard → My Profile → API Tokens → Create Token
   - Use **"Edit zone DNS"** template, scoped to `salamahsystems.com`

2. Export the token:
   ```bash
   export CF_API_TOKEN="your-token-here"
   export CF_API_EMAIL="affan@salamahsystems.com"
   ```

   > Add these to `~/.zshrc` (or a local `.env` file you **don't** commit) to persist across sessions.

## Scripts

| Script | Description |
|--------|-------------|
| `./scripts/list-records.sh [TYPE]` | List all records, or filter by type (A, CNAME, MX, TXT…) |
| `./scripts/add-record.sh <name> <ip> [ttl]` | Add an A record |
| `./scripts/search-record.sh <keyword>` | Search records by name or type keyword |
| `./scripts/delete-record.sh <record-id>` | Delete a record by ID |

## Examples

```bash
# List everything
./scripts/list-records.sh

# List only A records
./scripts/list-records.sh A

# Add a test A record: test.salamahsystems.com → 1.2.3.4
./scripts/add-record.sh test 1.2.3.4

# Search for "mail" records
./scripts/search-record.sh mail

# Delete a record (get ID from list output)
./scripts/delete-record.sh abc123def456

# Use flarectl directly for more options
flarectl dns list --zone salamahsystems.com
flarectl help dns
```

## flarectl Location

Installed via `go install` to `~/go/bin/flarectl`.
Add `~/go/bin` to your PATH permanently:
```bash
echo 'export PATH="$HOME/go/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```
