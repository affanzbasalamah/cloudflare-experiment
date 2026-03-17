# cf-blog — Cloudflare Workers Blog

A minimal blog backed by:
- **Cloudflare Workers** — serverless edge compute
- **D1** — SQLite database (posts storage)
- **R2** — object storage (images & assets)

## First-Time Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create D1 database
```bash
npm run db:create
# → Copy the database_id from output
```

Edit `wrangler.toml` and replace `REPLACE_WITH_DATABASE_ID` with the real ID.

### 3. Create R2 bucket
```bash
npm run bucket:create
```

### 4. Apply database schema
```bash
# For local dev:
npm run db:migrate:local

# For production:
npm run db:migrate
```

### 5. Start local dev server
```bash
npm run dev
# → http://localhost:8787
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Blog home page (HTML) |
| `GET` | `/posts` | List all posts (JSON) |
| `POST` | `/posts` | Create a new post (JSON) |
| `GET` | `/posts/:slug` | View single post (HTML) |
| `GET` | `/assets/:key` | Serve file from R2 |
| `PUT` | `/assets/:key` | Upload file to R2 |

## Test with curl

```bash
# View home page
curl http://localhost:8787/

# List posts (JSON)
curl http://localhost:8787/posts

# Create a post
curl -X POST http://localhost:8787/posts \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-first-post",
    "title": "My First Post",
    "content": "Hello from Cloudflare Workers!\n\nThis is paragraph two."
  }'

# View the post
curl http://localhost:8787/posts/my-first-post

# Upload an image to R2
curl -X PUT http://localhost:8787/assets/logo.png \
  -H "Content-Type: image/png" \
  --data-binary @/path/to/logo.png

# Serve the image
curl http://localhost:8787/assets/logo.png --output logo-downloaded.png
```

## D1 Direct Queries

```bash
# Run arbitrary SQL against local DB
wrangler d1 execute cf-blog-db --local --command "SELECT * FROM posts;"

# Run against production DB
wrangler d1 execute cf-blog-db --command "SELECT * FROM posts;"
```

## R2 Direct Operations

```bash
# List objects
wrangler r2 object list cf-blog-assets

# Upload directly via wrangler
wrangler r2 object put cf-blog-assets/banner.jpg --file ./banner.jpg

# Download
wrangler r2 object get cf-blog-assets/banner.jpg --file ./banner-dl.jpg

# Delete
wrangler r2 object delete cf-blog-assets/banner.jpg
```

## Deploy to Production

```bash
npm run deploy
# → https://cf-blog.<your-subdomain>.workers.dev
```
