import React from "react";
import {
  BLOCK_CATEGORIES,
  BLOCK_META,
  blockColor,
  blocksByCategory,
  isBlockType,
  blockTypes,
  type BlockCategory,
  type BlockType,
} from "../game/blocks";
import { useBuildStore } from "../state/buildStore";
import { useGameStore } from "../state/gameStore";

const CATEGORY_ICONS: Record<BlockCategory, string> = {
  Structural: "🧱",
  Kitchen:    "🍳",
  Furniture:  "🛋️",
  Landscaping:"🌿",
  Lights:     "🔦",
  Variants:   "🪜",
};

export function Palette() {
  const selected = useBuildStore((s) => s.selectedBlock);
  const setSelected = useBuildStore((s) => s.setSelectedBlock);
  const level = useGameStore((s) => s.level);
  const [activeCategory, setActiveCategory] = React.useState<BlockCategory>("Structural");

  const allowed: BlockType[] = React.useMemo(() => {
    const allowedNames = level?.allowedPieces?.blocks ?? [];
    const filtered = allowedNames.filter(isBlockType) as BlockType[];
    return filtered.length ? filtered : blockTypes;
  }, [level]);

  // Categories that have at least one allowed block
  const availableCategories = React.useMemo(
    () => BLOCK_CATEGORIES.filter((cat) => blocksByCategory(cat).some((t) => allowed.includes(t))),
    [allowed]
  );

  // Blocks in the active category that are allowed
  const visibleBlocks = React.useMemo(
    () => blocksByCategory(activeCategory).filter((t) => allowed.includes(t)),
    [activeCategory, allowed]
  );

  React.useEffect(() => {
    if (!allowed.includes(selected)) setSelected(allowed[0]);
  }, [allowed, selected, setSelected]);

  // If selected block isn't in active category, stay on current category
  React.useEffect(() => {
    const selCat = BLOCK_META[selected]?.category;
    if (selCat && availableCategories.includes(selCat)) {
      setActiveCategory(selCat);
    }
  }, [selected]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        zIndex: 20,
        background: "rgba(10, 12, 20, 0.78)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        backdropFilter: "blur(14px)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minWidth: 340,
        maxWidth: "92vw",
        overflow: "hidden",
      }}
    >
      {/* Category tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            title={cat}
            style={{
              flex: "0 0 auto",
              appearance: "none",
              border: "none",
              background: activeCategory === cat ? "rgba(255,255,255,0.1)" : "transparent",
              borderBottom: activeCategory === cat ? "2px solid rgba(255,255,255,0.7)" : "2px solid transparent",
              color: activeCategory === cat ? "white" : "rgba(255,255,255,0.45)",
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* Block buttons */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "10px 12px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {visibleBlocks.map((t) => (
          <PaletteButton key={t} t={t} selected={selected === t} onPick={() => setSelected(t)} />
        ))}
      </div>

      {/* Hint bar */}
      <div
        style={{
          fontSize: 11,
          opacity: 0.45,
          padding: "4px 12px 8px",
          letterSpacing: "0.02em",
        }}
      >
        Click to place · Right-click to remove · Right-drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}

function PaletteButton(props: { t: BlockType; selected: boolean; onPick: () => void }) {
  const meta = BLOCK_META[props.t];
  return (
    <button
      onClick={props.onPick}
      title={props.t}
      style={{
        appearance: "none",
        border: props.selected
          ? "2px solid rgba(255,255,255,0.9)"
          : "1px solid rgba(255,255,255,0.15)",
        background: props.selected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
        borderRadius: 10,
        padding: "7px 10px",
        cursor: "pointer",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        minWidth: 52,
        transition: "all 0.12s",
        transform: props.selected ? "scale(1.08)" : "scale(1)",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background: blockColor(props.t),
          border: "1px solid rgba(0,0,0,0.35)",
          boxShadow: meta.emissive ? `0 0 6px ${meta.emissive}` : undefined,
        }}
      />
      <span style={{ fontSize: 10, whiteSpace: "nowrap", opacity: 0.9 }}>{props.t}</span>
    </button>
  );
}
