import React, { useMemo, useState } from "react";
import { useBuildStore } from "../state/buildStore";
import { useGameStore } from "../state/gameStore";
import { scoreBuild } from "../game/evaluators/evaluate";

export function FinishPanel() {
  const blocks = useBuildStore((s) => s.blocks);
  const level = useGameStore((s) => s.level);
  const [open, setOpen] = useState(false);

  const score = useMemo(() => {
    if (!level) return null;
    return scoreBuild({
      build: { blocks },
      rules: level.rules,
      scoring: level.scoring,
    });
  }, [blocks, level]);

  return (
    <>
      <div style={{ position: "absolute", right: 12, bottom: 12, zIndex: 20 }}>
        <button
          onClick={() => setOpen(true)}
          disabled={!level}
          style={{
            appearance: "none",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "white",
            borderRadius: 10,
            padding: "10px 14px",
            cursor: level ? "pointer" : "not-allowed",
            backdropFilter: "blur(8px)",
          }}
        >
          Finish
        </button>
      </div>

      {open && score && level ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
          onMouseDown={() => setOpen(false)}
        >
          <div
            style={{
              width: "min(720px, 95vw)",
              maxHeight: "85vh",
              overflow: "auto",
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 14,
              padding: 16,
              color: "white",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Score</div>
                <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{score.total}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{level.meta.levelName}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  appearance: "none",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  borderRadius: 10,
                  padding: "8px 10px",
                  cursor: "pointer",
                  height: 36,
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {score.lines.map((l) => (
                <div
                  key={l.ruleId}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 600 }}>
                      {l.met ? "✓" : "•"} {l.text}
                    </div>
                    <div style={{ fontVariantNumeric: "tabular-nums", opacity: 0.95 }}>
                      {l.pointsAwarded >= 0 ? `+${l.pointsAwarded}` : `${l.pointsAwarded}`}
                    </div>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>{l.detail}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
              Tip: add Roof blocks and try mixing block types for variety.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

