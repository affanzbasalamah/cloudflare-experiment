-- Blog posts table
CREATE TABLE IF NOT EXISTS posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed with a sample post
INSERT OR IGNORE INTO posts (slug, title, content) VALUES (
  'hello-world',
  'Hello World',
  'Welcome to my Cloudflare-powered blog! This post is stored in D1 (SQLite) and served by a Cloudflare Worker.'
);
