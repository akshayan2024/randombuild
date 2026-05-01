import { LevelSchema, type LevelEnvelope } from "./levelSchema.js";

export function validateOrThrow(input: unknown): LevelEnvelope {
  return LevelSchema.parse(input);
}
