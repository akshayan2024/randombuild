import React, { useMemo, useState } from "react";
import { fetchLevel } from "../game/levelClient";
import { useBuildStore } from "../state/buildStore";
import { useGameStore } from "../state/gameStore";

type LevelType = "house" | "tower" | "bridge" | "random";
type Difficulty = "easy" | "medium" | "hard";

export function StartMenu() {
  const level = useGameStore((s) => s.level);
  const setLevel = useGameStore((s) => s.setLevel);
  const clearLevel = useGameStore((s) => s.clearLevel);
  const resetBuild = useBuildStore((s) => s.resetBuild);

  const gameMode = useGameStore((s) => s.gameMode);
  const setGameMode = useGameStore((s) => s.setGameMode);

  const [open, setOpen] = useState(level == null);
  const [levelType, setLevelType] = useState<LevelType>("house");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = !loading;

  const title = useMemo(() => (level ? level.meta.levelName : "Random Buildings"), [level]);

  const handleStart = async () => {
    setError(null);
    setLoading(true);
    try {
      clearLevel();
      resetBuild();
      
      if (gameMode === "creative") {
        const creativeLvl = {
          meta: {
            id: `creative_${Date.now()}`,
            levelType: "random",
            difficulty: "easy",
            levelName: "Creative Playground"
          },
          allowedPieces: {
            blocks: ["Wall", "Wood", "Glass", "Roof", "Door", "Stairs", "Fence", "Sink", "Stove", "Counter", "Bed", "Table", "Chair", "Lamp", "Plant", "TV", "Grass", "Dirt", "Leaves", "Water", "Sand", "Torch", "Lantern"],
            furniture: []
          },
          limits: {
            maxBlocks: 9999,
            timeSec: 99999
          },
          spawn: { playerStart: { x: 0, y: 0, z: 0 } },
          rules: [],
          scoring: []
        };
        // @ts-ignore
        setLevel(creativeLvl);
      } else {
        const lvl = await fetchLevel({ levelType, difficulty });
        setLevel(lvl);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ position: "absolute", right: 12, top: 12, zIndex: 25 }}>
        <button
          onClick={() => setOpen(true)}
          style={buttonStyle()}
          title="Choose level"
        >
          Level
        </button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 55,
            background: "rgba(0,0,0,0.62)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
          onMouseDown={() => {
            if (level) setOpen(false);
          }}
        >
          <div
            style={{
              width: "min(720px, 95vw)",
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 16,
              padding: 18,
              color: "white",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Random Buildings</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{title}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={!level}
                style={buttonStyle(level ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)")}
                title={level ? "Close" : "Start a level first"}
              >
                Close
              </button>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "14px 0" }} />

            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Game Mode">
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setGameMode("challenge")}
                    style={buttonStyle(gameMode === "challenge" ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.04)", gameMode === "challenge" ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.1)")}
                  >
                    Challenge Mode
                  </button>
                  <button
                    onClick={() => setGameMode("creative")}
                    style={buttonStyle(gameMode === "creative" ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.04)", gameMode === "creative" ? "1px solid rgba(168,85,247,0.5)" : "1px solid rgba(255,255,255,0.1)")}
                  >
                    Creative Mode
                  </button>
                </div>
              </Field>

              {gameMode === "challenge" && (
                <>
                  <Field label="Level type">
                    <select
                      value={levelType}
                      onChange={(e) => setLevelType(e.target.value as LevelType)}
                      style={selectStyle()}
                      disabled={loading}
                    >
                      <option value="house">House</option>
                      <option value="tower">Tower</option>
                      <option value="bridge">Bridge</option>
                      <option value="random">Random</option>
                    </select>
                  </Field>

                  <Field label="Difficulty">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      style={selectStyle()}
                      disabled={loading}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </Field>
                </>
              )}

              {gameMode === "creative" && (
                <div style={{ fontSize: 13, padding: 12, background: "rgba(168,85,247,0.1)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.2)" }}>
                  <b>Creative Mode:</b> Infinite blocks, no timer, no rules. Build whatever you want!
                </div>
              )}

              {error ? (
                <div style={{ fontSize: 12, color: "#fecaca" }}>Error: {error}</div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button
                onClick={handleStart}
                disabled={!canStart}
                style={buttonStyle("rgba(34,197,94,0.2)", "1px solid rgba(34,197,94,0.4)")}
              >
                {loading ? "Starting..." : "Start"}
              </button>

              <button
                onClick={() => {
                  resetBuild();
                  setOpen(false);
                }}
                disabled={!level || loading}
                style={buttonStyle()}
                title="Clear blocks and keep same level"
              >
                Reset build
              </button>
            </div>

            <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
              Tip: use <b>Wall</b> blocks on the ground to form a closed loop to make a room.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.85 }}>{props.label}</div>
      {props.children}
    </div>
  );
}

function buttonStyle(
  background = "rgba(255,255,255,0.08)",
  border = "1px solid rgba(255,255,255,0.2)",
): React.CSSProperties {
  return {
    appearance: "none",
    border,
    background,
    color: "white",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    outline: "none",
  };
}

