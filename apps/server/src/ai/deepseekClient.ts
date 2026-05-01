type DeepSeekChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekChatRequest = {
  model: string;
  messages: DeepSeekChatMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
};

type DeepSeekChatResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

export type DeepSeekClientOptions = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
};

export async function deepseekGenerateJson(args: {
  prompt: string;
  options: DeepSeekClientOptions;
}): Promise<unknown> {
  const baseUrl = args.options.baseUrl ?? "https://api.deepseek.com";
  const model = args.options.model ?? "deepseek-chat";

  const req: DeepSeekChatRequest = {
    model,
    messages: [
      { role: "system", content: "You are a game level generator. Return JSON only." },
      { role: "user", content: args.prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.options.apiKey}`,
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DeepSeek error (${res.status}): ${text}`);
  }

  const json = (await res.json()) as DeepSeekChatResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek response missing content");

  try {
    return JSON.parse(content);
  } catch {
    // If the provider returned JSON but with leading/trailing whitespace, try trimming.
    try {
      return JSON.parse(content.trim());
    } catch {
      throw new Error("DeepSeek response was not valid JSON");
    }
  }
}

