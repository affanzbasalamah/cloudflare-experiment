interface Env {
  AI: Ai;
}

const ALLOWED_MODELS = [
  "@cf/meta/llama-3-8b-instruct",
  "@cf/mistral/mistral-7b-instruct-v0.1",
  "@cf/google/gemma-7b-it",
] as const;

type AllowedModel = (typeof ALLOWED_MODELS)[number];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function resolveModel(model: unknown): AllowedModel {
  return ALLOWED_MODELS.includes(model as AllowedModel)
    ? (model as AllowedModel)
    : "@cf/meta/llama-3-8b-instruct";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // GET /v1/models — OpenAI-compatible model list
    if (request.method === "GET" && url.pathname === "/v1/models") {
      return Response.json(
        {
          object: "list",
          data: ALLOWED_MODELS.map((id) => ({
            id,
            object: "model",
            created: 1700000000,
            owned_by: "cloudflare",
          })),
        },
        { headers: CORS_HEADERS }
      );
    }

    // POST /v1/chat/completions — OpenAI-compatible chat endpoint
    if (request.method === "POST" && url.pathname === "/v1/chat/completions") {
      let body: {
        messages?: RoleScopedChatInput[];
        model?: string;
        stream?: boolean;
        max_tokens?: number;
      };

      try {
        body = await request.json();
      } catch {
        return Response.json(
          { error: "Invalid JSON body" },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
        return Response.json(
          { error: "Missing required field: messages" },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const model = resolveModel(body.model);
      const stream = body.stream ?? false;
      const max_tokens = body.max_tokens ?? 2048;
      const id = `chatcmpl-${Date.now()}`;

      if (stream) {
        // Streaming: transform Workers AI SSE → OpenAI SSE format
        const aiStream = (await env.AI.run(model, {
          messages: body.messages,
          stream: true,
          max_tokens,
        })) as ReadableStream<Uint8Array>;

        const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // Transform in background
        (async () => {
          const reader = aiStream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = decoder.decode(value, { stream: true });
              for (const line of text.split("\n")) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;

                const data = trimmed.slice(5).trim();
                if (data === "[DONE]") {
                  await writer.write(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data) as { response?: string };
                  const chunk = {
                    id,
                    object: "chat.completion.chunk",
                    model,
                    choices: [
                      {
                        index: 0,
                        delta: { content: parsed.response ?? "" },
                        finish_reason: null,
                      },
                    ],
                  };
                  await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                } catch {
                  // skip malformed chunk
                }
              }
            }
          } finally {
            await writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } else {
        // Non-streaming: return OpenAI-shaped JSON
        try {
          const result = (await env.AI.run(model, { messages: body.messages, max_tokens })) as {
            response?: string;
          };
          return Response.json(
            {
              id,
              object: "chat.completion",
              model,
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: result.response ?? "" },
                  finish_reason: "stop",
                },
              ],
              usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            },
            { headers: CORS_HEADERS }
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown AI error";
          return Response.json({ error: message }, { status: 500, headers: CORS_HEADERS });
        }
      }
    }

    // GET / — show usage info
    if (request.method === "GET" && url.pathname === "/") {
      return Response.json(
        {
          name: "cf-ai",
          description: "Cloudflare Workers AI — OpenAI-compatible API",
          endpoints: {
            "GET /v1/models": "List available models",
            "POST /v1/chat/completions": "OpenAI-compatible chat (supports stream: true)",
          },
          usage: {
            method: "POST",
            path: "/v1/chat/completions",
            body: {
              messages: [{ role: "user", content: "Your question" }],
              model: "(optional) defaults to @cf/meta/llama-3-8b-instruct",
              stream: "(optional) boolean — enables SSE streaming",
            },
          },
          compatible_with: ["openai SDK (base_url override)", "LM Studio", "Ollama", "LangChain"],
        },
        { headers: CORS_HEADERS }
      );
    }

    return Response.json({ error: "Not found" }, { status: 404, headers: CORS_HEADERS });
  },
} satisfies ExportedHandler<Env>;
