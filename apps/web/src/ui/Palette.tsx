import React from "react";
import { blockColor, blockTypes, isBlockType, type BlockType } from "../game/blocks";
import { useBuildStore } from "../state/buildStore";
import { useGameStore } from "../state/gameStore";

export function Palette() {
  const selected = useBuildStore((s) => s.selectedBlock);
  const setSelected = useBuildStore((s) => s.setSelectedBlock);
  const level = useGameStore((s) => s.level);

  const allowed = React.useMemo(() => {
    const allowedNames = level?.allowedPieces?.blocks ?? [];
    const filtered = allowedNames.filter(isBlockType);
    return filtered.length ? filtered : blockTypes;
  }, [level]);

  React.useEffect(() => {
    if (!allowed.includes(selected)) setSelected(allowed[0]);
  }, [allowed, selected, setSelected]);

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        bottom: 12,
        zIndex: 20,
        display: "flex",
        gap: 8,
        padding: 10,
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 10,
        backdropFilter: "blur(8px)",
        color: "white",
      }}
    >
      {allowed.map((t) => (
        <PaletteButton key={t} t={t} selected={selected === t} onPick={() => setSelected(t)} />
      ))}
      <div style={{ width: 1, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />
      <div style={{ fontSize: 12, opacity: 0.9, alignSelf: "center" }}>
        Click to place • Right-drag to rotate • Right-click to remove • Scroll to zoom
      </div>
    </div>
  );
}

function PaletteButton(props: { t: BlockType; selected: boolean; onPick: () => void }) {
  return (
    <button
      onClick={props.onPick}
      style={{
        appearance: "none",
        border: props.selected ? "2px solid white" : "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "8px 10px",
        cursor: "pointer",
        color: "white",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
      title={props.t}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: blockColor(props.t),
          border: "1px solid rgba(0,0,0,0.4)",
        }}
      />
      <span style={{ fontSize: 12 }}>{props.t}</span>
    </button>
  );
}
