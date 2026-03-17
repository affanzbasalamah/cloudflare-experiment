# cf-ai — Cloudflare Workers AI Endpoint

A Cloudflare Worker that exposes a simple REST API for AI inference using Workers AI.

## Prerequisites

- `wrangler` installed (`npm install -g wrangler`)
- Authenticated: `wrangler login`

## Setup

```bash
cd cf-ai
npm install
```

## Local Development

```bash
npm run dev
# → Worker available at http://localhost:8787
```

## Endpoints

### `GET /`
Returns usage information.

### `GET /models`
Lists available AI models.

### `POST /chat`
Run inference against a model.

**Request body:**
```json
{
  "prompt": "Explain DNS in one sentence.",
  "model": "@cf/meta/llama-3-8b-instruct",
  "system": "(optional) You are a helpful network engineer."
}
```

**Response:**
```json
{
  "model": "@cf/meta/llama-3-8b-instruct",
  "result": { "response": "DNS is a distributed system..." }
}
```

## Test with curl

```bash
# Info
curl http://localhost:8787/

# List models
curl http://localhost:8787/models

# Chat
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is Cloudflare Workers?"}'

# With custom system prompt
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "How does BGP work?",
    "system": "You are a network engineer. Be concise.",
    "model": "@cf/mistral/mistral-7b-instruct-v0.1"
  }'
```

## Deploy

```bash
npm run deploy
# → Deployed to https://cf-ai.<your-subdomain>.workers.dev
```

## Available Models

| Model | Notes |
|-------|-------|
| `@cf/meta/llama-3-8b-instruct` | Default — good general purpose |
| `@cf/mistral/mistral-7b-instruct-v0.1` | Fast, efficient |
| `@cf/google/gemma-7b-it` | Google's instruction-tuned model |

Full list: https://developers.cloudflare.com/workers-ai/models/
