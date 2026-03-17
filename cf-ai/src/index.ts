interface Env {
  AI: Ai;
}

const ALLOWED_MODELS = [
  "@cf/meta/llama-3-8b-instruct",
  "@cf/mistral/mistral-7b-instruct-v0.1",
  "@cf/google/gemma-7b-it",
] as const;

type AllowedModel = (typeof ALLOWED_MODELS)[number];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // GET / — show usage info
    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        name: "cf-ai",
        description: "Cloudflare Workers AI inference endpoint",
        endpoints: {
          "POST /chat": "Send a prompt, get an AI response",
          "GET /models": "List available models",
        },
        usage: {
          method: "POST",
          path: "/chat",
          body: {
            prompt: "Your question here",
            model: "(optional) model ID — defaults to llama-3-8b-instruct",
            system: "(optional) system prompt",
          },
        },
      });
    }

    // GET /models — list available models
    if (request.method === "GET" && url.pathname === "/models") {
      return Response.json({ models: ALLOWED_MODELS });
    }

    // POST /chat — run inference
    if (request.method === "POST" && url.pathname === "/chat") {
      let body: { prompt?: string; model?: string; system?: string };
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      if (!body.prompt) {
        return Response.json({ error: "Missing required field: prompt" }, { status: 400 });
      }

      const model: AllowedModel = ALLOWED_MODELS.includes(body.model as AllowedModel)
        ? (body.model as AllowedModel)
        : "@cf/meta/llama-3-8b-instruct";

      const messages: RoleScopedChatInput[] = [];
      if (body.system) {
        messages.push({ role: "system", content: body.system });
      }
      messages.push({ role: "user", content: body.prompt });

      try {
        const result = await env.AI.run(model, { messages });
        return Response.json({ model, result });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown AI error";
        return Response.json({ error: message }, { status: 500 });
      }
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
