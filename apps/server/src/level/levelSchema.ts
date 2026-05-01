import { z } from "zod";
import { evaluatorTypes } from "./evaluatorTypes.js";

export const LevelSchema = z.object({
  meta: z.object({
    id: z.string().min(1),
    levelType: z.enum(["house", "tower", "bridge", "random"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    levelName: z.string().min(1),
  }),
  allowedPieces: z.object({
    blocks: z.array(z.string()),
    furniture: z.array(z.string()),
  }),
  limits: z.object({
    maxBlocks: z.number().int().min(50).max(5000),
    timeSec: z.number().int().min(60).max(7200),
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
      id: z.string().min(1),
      text: z.string().min(1),
      evaluate: z
        .object({
          type: z.enum(evaluatorTypes),
        })
        .passthrough(),
    }),
  ),
  scoring: z.array(
    z.object({
      ruleId: z.string().min(1),
      points: z.number().int(),
      mode: z.enum(["core", "bonus", "penalty"]),
    }),
  ),
});

export type LevelEnvelope = z.infer<typeof LevelSchema>;
