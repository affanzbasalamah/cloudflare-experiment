# cloudflare-experiment

Hands-on experiments with the Cloudflare developer ecosystem.

## Projects

| Directory | What it does |
|-----------|-------------|
| [`cf-dns/`](./cf-dns/) | Shell scripts to manage DNS records for `salamahsystems.com` via `flarectl` |
| [`cf-ai/`](./cf-ai/) | Cloudflare Worker exposing a REST API for Workers AI inference (Llama, Mistral) |
| [`cf-blog/`](./cf-blog/) | Cloudflare Worker blog with D1 (SQLite) database and R2 object storage |

## Tools Required

| Tool | Install | Purpose |
|------|---------|---------|
| `wrangler` | `npm install -g wrangler` | Deploy Workers, manage D1/R2, local dev |
| `flarectl` | `go install github.com/cloudflare/cloudflare-go/cmd/flarectl@latest` | DNS & account management |

## First-Time Auth

```bash
# Wrangler (OAuth, opens browser)
wrangler login

# flarectl (API token)
export CF_API_TOKEN="your-token"          # from Cloudflare dashboard → API Tokens
export CF_API_EMAIL="affan@salamahsystems.com"

# Add to PATH (flarectl installed via go)
export PATH="$HOME/go/bin:$PATH"
```

## Quick Start

```bash
# DNS
cd cf-dns && ./scripts/list-records.sh

# AI
cd cf-ai && npm install && npm run dev

# Blog
cd cf-blog && npm install && npm run db:create && npm run db:migrate:local && npm run dev
```
