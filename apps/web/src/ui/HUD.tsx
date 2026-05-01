import React, { useMemo } from "react";
import { useBuildStore } from "../state/buildStore";
import { useGameStore } from "../state/gameStore";
import { computeProgress } from "../game/evaluators/progress";

export function HUD() {
  const level = useGameStore((s) => s.level);
  const blocks = useBuildStore((s) => s.blocks);

  const progress = useMemo(() => {
    if (!level) return [];
    return computeProgress({ blocks }, level.rules);
  }, [blocks, level]);

  const ruleText = useMemo(() => {
    if (!level) return new Map<string, string>();
    return new Map(level.rules.map((r) => [r.id, r.text]));
  }, [level]);

  if (!level) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        top: 12,
        zIndex: 20,
        width: 360,
        maxWidth: "calc(100vw - 24px)",
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 14,
        padding: 12,
        color: "white",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Level</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{level.meta.levelName}</div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.8, alignSelf: "center" }}>
          Blocks: {Object.keys(blocks).length}
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "10px 0" }} />

      <div style={{ display: "grid", gap: 8 }}>
        {progress.map((p) => (
          <div
            key={p.ruleId}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {p.met ? "✓" : "•"} {ruleText.get(p.ruleId) ?? p.ruleId}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, whiteSpace: "nowrap" }}>
                {p.met ? "Met" : "Not yet"}
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>{p.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

