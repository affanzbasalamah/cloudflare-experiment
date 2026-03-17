interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Minimal HTML shell for blog pages
function html(title: string, body: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — cf-blog</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    nav a { margin-right: 1rem; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; }
    img { max-width: 100%; }
    .post-meta { color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <nav><a href="/">Home</a><a href="/posts">All Posts</a></nav>
  <hr>
  ${body}
</body>
</html>`,
    { headers: { "Content-Type": "text/html;charset=UTF-8" } }
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // GET / — home page with post list
    if (method === "GET" && pathname === "/") {
      const { results } = await env.DB.prepare(
        "SELECT id, slug, title, created_at FROM posts ORDER BY created_at DESC LIMIT 20"
      ).all<Pick<Post, "id" | "slug" | "title" | "created_at">>();

      const list = results
        .map((p) => `<li><a href="/posts/${p.slug}">${p.title}</a> <span class="post-meta">${p.created_at}</span></li>`)
        .join("\n");

      return html("Home", `<h1>cf-blog</h1><p>A minimal blog powered by Cloudflare Workers + D1 + R2.</p><ul>${list}</ul>`);
    }

    // GET /posts — JSON list of all posts
    if (method === "GET" && pathname === "/posts") {
      const { results } = await env.DB.prepare(
        "SELECT id, slug, title, created_at FROM posts ORDER BY created_at DESC"
      ).all<Pick<Post, "id" | "slug" | "title" | "created_at">>();
      return Response.json({ posts: results });
    }

    // POST /posts — create a new post
    if (method === "POST" && pathname === "/posts") {
      let body: { slug?: string; title?: string; content?: string };
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }

      if (!body.slug || !body.title || !body.content) {
        return Response.json({ error: "Missing required fields: slug, title, content" }, { status: 400 });
      }

      try {
        const result = await env.DB.prepare(
          "INSERT INTO posts (slug, title, content) VALUES (?, ?, ?)"
        )
          .bind(body.slug, body.title, body.content)
          .run();

        return Response.json({ id: result.meta.last_row_id, slug: body.slug, title: body.title }, { status: 201 });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "DB error";
        if (message.includes("UNIQUE")) {
          return Response.json({ error: `Slug '${body.slug}' already exists` }, { status: 409 });
        }
        return Response.json({ error: message }, { status: 500 });
      }
    }

    // GET /posts/:slug — single post page
    const postMatch = pathname.match(/^\/posts\/([^/]+)$/);
    if (method === "GET" && postMatch) {
      const slug = postMatch[1];
      const post = await env.DB.prepare("SELECT * FROM posts WHERE slug = ?").bind(slug).first<Post>();

      if (!post) {
        return html("Not Found", "<h1>404 — Post not found</h1>", );
      }

      // Simple markdown-ish rendering: wrap paragraphs
      const content = post.content
        .split("\n\n")
        .map((p) => `<p>${p}</p>`)
        .join("\n");

      return html(
        post.title,
        `<h1>${post.title}</h1>
         <p class="post-meta">Published: ${post.created_at}</p>
         ${content}
         <p><a href="/">← Back</a></p>`
      );
    }

    // GET /assets/:key — serve file from R2
    const assetMatch = pathname.match(/^\/assets\/(.+)$/);
    if (method === "GET" && assetMatch) {
      const key = assetMatch[1];
      const obj = await env.BUCKET.get(key);

      if (!obj) {
        return Response.json({ error: "Asset not found" }, { status: 404 });
      }

      const contentType = obj.httpMetadata?.contentType ?? "application/octet-stream";
      return new Response(obj.body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          "ETag": obj.etag,
        },
      });
    }

    // PUT /assets/:key — upload a file to R2
    const putAssetMatch = pathname.match(/^\/assets\/(.+)$/);
    if (method === "PUT" && putAssetMatch) {
      const key = putAssetMatch[1];
      const contentType = request.headers.get("Content-Type") ?? "application/octet-stream";

      await env.BUCKET.put(key, request.body, {
        httpMetadata: { contentType },
      });

      return Response.json({ key, url: `/assets/${key}` }, { status: 201 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
