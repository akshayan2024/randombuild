/** Fetch a mid-level hint from the server */
export async function fetchHint(args: {
  levelType: string;
  difficulty: string;
  ruleProgress: { ruleId: string; text: string; met: boolean; detail: string }[];
  blockCount: number;
  floatingCount: number;
  timeSec: number;
  elapsedSec: number;
}): Promise<string> {
  try {
    const res = await fetch("/api/hint", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    const json = await res.json();
    return typeof json.hint === "string" ? json.hint : "Keep building!";
  } catch {
    return "Keep building!";
  }
}

/** Post-level: get suggested next difficulty and motivational message */
export async function fetchNextLevelSuggestion(args: {
  levelType: string;
  difficulty: string;
  score: number;
  totalPossible: number;
  blocksPlaced?: number;
  floatingBlocks?: number;
  elapsedSec?: number;
}): Promise<{ suggestedDifficulty: string; suggestedLevelType?: string; message: string }> {
  try {
    const res = await fetch("/api/hint/next-level", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    return await res.json();
  } catch {
    return { suggestedDifficulty: args.difficulty, suggestedLevelType: args.levelType, message: "Great game! Play again?" };
  }
}
