import { LevelSchema, type LevelEnvelope } from "./types";

export async function fetchLevel(args: {
  levelType: "house" | "tower" | "bridge" | "random";
  difficulty: "easy" | "medium" | "hard";
}): Promise<LevelEnvelope> {
  const res = await fetch("/api/level/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const body = text.trim();
    if (!body) {
      throw new Error(
        `Level request failed (${res.status}). Is the backend running on http://127.0.0.1:8002 ?`,
      );
    }
    throw new Error(`Level request failed (${res.status}): ${body}`);
  }
  const json = await res.json();
  return LevelSchema.parse(json);
}
