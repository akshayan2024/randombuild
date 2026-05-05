import React, { useMemo, useState, useEffect } from "react";
import { useBuildStore } from "../state/buildStore";
import { useGameStore } from "../state/gameStore";
import { useTimerStore } from "../state/timerStore";
import { scoreBuild } from "../game/evaluators/evaluate";
import { fetchLevel } from "../game/levelClient";
import { fetchNextLevelSuggestion } from "../game/hintClient";

type LevelType = "house" | "tower" | "bridge" | "random";
type Difficulty = "easy" | "medium" | "hard";

const NEXT_DIFFICULTY: Record<Difficulty, Difficulty> = {
  easy: "medium",
  medium: "hard",
  hard: "hard",
};

export function FinishPanel() {
  const blocks      = useBuildStore((s) => s.blocks);
  const resetBuild  = useBuildStore((s) => s.resetBuild);
  const level       = useGameStore((s) => s.level);
  const setLevel    = useGameStore((s) => s.setLevel);
  const clearLevel  = useGameStore((s) => s.clearLevel);
  const { expired, stop, reset: resetTimer, start } = useTimerStore();
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ suggestedDifficulty: string; message: string } | null>(null);

  const gameMode    = useGameStore((s) => s.gameMode);

  // Auto-open when timer expires
  useEffect(() => {
    if (expired && gameMode === "challenge") { stop(); setOpen(true); }
  }, [expired, gameMode]);

  const score = useMemo(() => {
    if (!level || gameMode === "creative") return null;
    return scoreBuild({ build: { blocks }, rules: level.rules, scoring: level.scoring });
  }, [blocks, level, gameMode]);

  // Fetch AI post-level suggestion when panel opens
  useEffect(() => {
    if (!open || !level || !score || gameMode === "creative") return;
    const totalPossible = level.scoring.reduce((s, i) => s + (i.mode !== "penalty" ? i.points : 0), 0);
    fetchNextLevelSuggestion({
      levelType: level.meta.levelType,
      difficulty: level.meta.difficulty,
      score: score.total,
      totalPossible,
      blocksPlaced: Object.keys(blocks).length,
      floatingBlocks: countFloating(blocks),
      elapsedSec: Math.max(0, level.limits.timeSec - useTimerStore.getState().secondsLeft),
    }).then(setSuggestion);
  }, [open, gameMode]);

  async function handleRetry() {
    if (!level) return;
    setLoading(true);
    resetBuild();
    resetTimer();
    if (gameMode === "challenge") start(level.limits.timeSec);
    setOpen(false);
    setLoading(false);
  }

  async function handleNextLevel(difficultyOverride?: string) {
    if (!level) return;
    setLoading(true);
    try {
      clearLevel();
      resetBuild();
      resetTimer();
      const nextDiff = (difficultyOverride as Difficulty) ?? NEXT_DIFFICULTY[level.meta.difficulty as Difficulty];
      const lvl = await fetchLevel({
        levelType: (suggestion?.suggestedLevelType as LevelType) ?? (level.meta.levelType as LevelType),
        difficulty: nextDiff as Difficulty,
      });
      setLevel(lvl);
      if (gameMode === "challenge") start(lvl.limits.timeSec);
      setOpen(false);
    } catch {
      setLoading(false);
    }
    setLoading(false);
  }

  const btnBase: React.CSSProperties = {
    appearance: "none",
    borderRadius: 10,
    padding: "10px 16px",
    cursor: "pointer",
    color: "white",
    fontSize: 14,
    fontWeight: 600,
    backdropFilter: "blur(8px)",
  };

  return (
    <>
      {/* Finish button */}
      <div style={{ position: "absolute", right: 12, bottom: 12, zIndex: 20 }}>
        <button
          onClick={() => { stop(); setOpen(true); }}
          disabled={!level}
          style={{
            ...btnBase,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            cursor: level ? "pointer" : "not-allowed",
          }}
        >
          {gameMode === "creative" ? "Menu" : "Finish"}
        </button>
      </div>

      {open && level && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.65)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
          onMouseDown={() => setOpen(false)}
        >
          <div
            style={{
              width: "min(680px, 95vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 16,
              padding: 20,
              color: "white",
              fontFamily: "system-ui, sans-serif",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Score header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{gameMode === "creative" ? "Creative Mode" : "Final Score"}</div>
                <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>
                  {gameMode === "creative" ? "Beautiful!" : (score?.total.toLocaleString() ?? "0")}
                </div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                  {level.meta.levelName} {gameMode === "challenge" && `· ${level.meta.difficulty}`}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ ...btnBase, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", padding: "8px 12px" }}
              >✕</button>
            </div>

            {/* AI post-level message */}
            {suggestion && gameMode === "challenge" && (
              <div style={{
                margin: "16px 0 0",
                background: "rgba(6,182,212,0.1)",
                border: "1px solid rgba(6,182,212,0.3)",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                🤖 {suggestion.message}
              </div>
            )}

            <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "16px 0" }} />

            {/* Score breakdown / Stats */}
            <div style={{ display: "grid", gap: 8 }}>
              {gameMode === "challenge" && score?.lines.map((l) => (
                <div
                  key={l.ruleId}
                  style={{
                    borderRadius: 12,
                    padding: "10px 12px",
                    background: l.met ? "rgba(74,222,128,0.07)" : "rgba(255,255,255,0.03)",
                    border: l.met ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: l.met ? "#4ade80" : "rgba(255,255,255,0.75)" }}>
                      {l.met ? "✓" : "○"} {l.text}
                    </div>
                    <div
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                        fontSize: 14,
                        color: l.pointsAwarded > 0 ? "#4ade80" : l.pointsAwarded < 0 ? "#f87171" : "rgba(255,255,255,0.4)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.pointsAwarded >= 0 ? `+${l.pointsAwarded}` : `${l.pointsAwarded}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{l.detail}</div>
                </div>
              ))}

              {gameMode === "creative" && (
                <div style={{ padding: 20, textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
                  <div style={{ fontSize: 32 }}>🏗️</div>
                  <div style={{ marginTop: 10, fontWeight: 600 }}>Total Blocks: {Object.keys(blocks).length}</div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>You are in Creative Mode. There are no rules here!</div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              {gameMode === "challenge" ? (
                <>
                  <button
                    onClick={handleRetry}
                    disabled={loading}
                    style={{ ...btnBase, flex: 1, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)" }}
                  >
                    🔄 Retry
                  </button>
                  <button
                    onClick={() => handleNextLevel(suggestion?.suggestedDifficulty)}
                    disabled={loading}
                    style={{ ...btnBase, flex: 2, border: "1px solid rgba(74,222,128,0.4)", background: "rgba(74,222,128,0.12)" }}
                  >
                    {loading ? "Loading…" : `▶ Next Level${suggestion ? ` (${suggestion.suggestedDifficulty})` : ""}`}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setOpen(false)}
                  style={{ ...btnBase, flex: 1, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.15)" }}
                >
                  ✨ Continue Building
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function countFloating(blocks: Record<string, string>): number {
  let c = 0;
  for (const key of Object.keys(blocks)) {
    const [xs, ys, zs] = key.split(",");
    const x = Number(xs), y = Number(ys), z = Number(zs);
    if (y <= 0) continue;
    if (!(`${x},${y - 1},${z}` in blocks)) c++;
  }
  return c;
}
