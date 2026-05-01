import { z } from "zod";

export const LevelSchema = z.object({
  meta: z.object({
    id: z.string(),
    levelType: z.enum(["house", "tower", "bridge", "random"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    levelName: z.string(),
  }),
  allowedPieces: z.object({
    blocks: z.array(z.string()),
    furniture: z.array(z.string()),
  }),
  limits: z.object({
    maxBlocks: z.number(),
    timeSec: z.number(),
  }),
  spawn: z.object({
    playerStart: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
  }),
  rules: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      evaluate: z.object({ type: z.string() }).passthrough(),
    }),
  ),
  scoring: z.array(
    z.object({
      ruleId: z.string(),
      points: z.number(),
      mode: z.enum(["core", "bonus", "penalty"]),
    }),
  ),
});

export type LevelEnvelope = z.infer<typeof LevelSchema>;

