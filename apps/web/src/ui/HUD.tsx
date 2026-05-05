import React, { useEffect, useMemo, useRef, useState } from "react";
import { useBuildStore } from "../state/buildStore";
import { useGameStore } from "../state/gameStore";
import { useTimerStore } from "../state/timerStore";
import { computeProgress } from "../game/evaluators/progress";
import { useEnvironmentStore, getSeason } from "../state/environmentStore";
import { fetchHint } from "../game/hintClient";

function formatTime(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export function HUD() {
  const level   = useGameStore((s) => s.level);
  const blocks  = useBuildStore((s) => s.blocks);
  const { secondsLeft, running, expired, start, reset } = useTimerStore();
  const timeOfDay = useEnvironmentStore((s) => s.timeOfDay);
  const day       = useEnvironmentStore((s) => s.day);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const season  = getSeason(day);
  const isNight = timeOfDay < 6 || timeOfDay > 18;
  const timeStr = `${Math.floor(timeOfDay).toString().padStart(2, "0")}:${Math.floor((timeOfDay % 1) * 60).toString().padStart(2, "0")}`;

  const gameMode = useGameStore((s) => s.gameMode);

  // Start timer whenever a new level loads
  useEffect(() => {
    if (level && gameMode === "challenge") start(level.limits.timeSec);
    else if (level && gameMode === "creative") reset();
  }, [level?.meta.id, gameMode]);

  const progress = useMemo(() => {
    if (!level || gameMode === "creative") return [];
    return computeProgress({ blocks }, level.rules);
  }, [blocks, level, gameMode]);

  const ruleText = useMemo(() => {
    if (!level) return new Map<string, string>();
    return new Map(level.rules.map((r) => [r.id, r.text]));
  }, [level]);

  // Fetch AI hint every 60s while running
  useEffect(() => {
    if (!level || !running || gameMode === "creative") return;
    const fetchAndSchedule = () => {
      const elapsedSec = level.limits.timeSec - secondsLeft;
      const ruleProgress = progress.map((p) => ({
        ruleId: p.ruleId,
        text: ruleText.get(p.ruleId) ?? p.ruleId,
        met: p.met,
        detail: p.detail,
      }));
      fetchHint({
        levelType: level.meta.levelType,
        difficulty: level.meta.difficulty,
        ruleProgress,
        blockCount: Object.keys(blocks).length,
        floatingCount: 0, // could compute here but not critical
        timeSec: level.limits.timeSec,
        elapsedSec,
      }).then((h) => setHint(h));
      hintTimerRef.current = setTimeout(fetchAndSchedule, 60_000);
    };
    // First hint at 10s
    hintTimerRef.current = setTimeout(fetchAndSchedule, 10_000);
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, [level?.meta.id, running, gameMode]);

  if (!level) return null;

  const timerColor = secondsLeft < 30 ? "#ff6b6b" : secondsLeft < 90 ? "#ffd166" : "white";
  const timerPulse = secondsLeft < 30 && running;

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        top: 12,
        zIndex: 20,
        width: 360,
        maxWidth: "calc(100vw - 24px)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Main HUD card */}
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 14,
          padding: 12,
          color: "white",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em" }}>{gameMode === "creative" ? "Creative Mode" : "Level"}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{level.meta.levelName}</div>
            {gameMode === "challenge" && (
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                {level.meta.levelType} · {level.meta.difficulty}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {/* Countdown clock */}
            {gameMode === "challenge" ? (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                  color: timerColor,
                  animation: timerPulse ? "pulse 1s infinite" : undefined,
                  letterSpacing: "-0.02em",
                }}
              >
                {expired ? "⏰ Time's up!" : `⏱ ${formatTime(secondsLeft)}`}
              </div>
            ) : (
              <div style={{ fontSize: 18, fontWeight: 800, color: "#a855f7" }}>✨ Creative</div>
            )}
            <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>
              {isNight ? "🌙" : "☀️"} {timeStr} · {season} · Day {day}
            </div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              Blocks: {Object.keys(blocks).length}
            </div>
          </div>
        </div>

        {gameMode === "challenge" && (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

            {/* Rules progress */}
            <div style={{ display: "grid", gap: 6 }}>
              {progress.map((p) => (
                <div
                  key={p.ruleId}
                  style={{
                    borderRadius: 10,
                    padding: "8px 10px",
                    background: p.met ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                    border: p.met ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: p.met ? "#4ade80" : "white" }}>
                      {p.met ? "✓" : "○"} {ruleText.get(p.ruleId) ?? p.ruleId}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: "nowrap", color: p.met ? "#4ade80" : "#fbbf24" }}>
                      {p.met ? "Done" : "Pending"}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.65, marginTop: 3 }}>{p.detail}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Hint bubble */}
      {hint && (
        <div
          style={{
            background: "rgba(6, 182, 212, 0.12)",
            border: "1px solid rgba(6,182,212,0.35)",
            borderRadius: 12,
            padding: "10px 12px",
            color: "white",
            backdropFilter: "blur(10px)",
            fontSize: 13,
            lineHeight: 1.5,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <span>{hint}</span>
          <button
            onClick={() => setHint(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", flexShrink: 0 }}
          >✕</button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
