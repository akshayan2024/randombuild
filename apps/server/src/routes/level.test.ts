import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../server";

describe("POST /api/level/generate", () => {
  it("returns a level envelope", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    const res = await request(createApp())
      .post("/api/level/generate")
      .send({ levelType: "house", difficulty: "easy" });
    expect(res.status).toBe(200);
    expect(res.body?.meta?.id).toBeTruthy();
    expect(Array.isArray(res.body?.rules)).toBe(true);
    expect(Array.isArray(res.body?.scoring)).toBe(true);
  });
});
