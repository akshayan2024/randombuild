# Random Buildings (Web MVP) — Design Spec
Date: 2026-05-01  
Project: Random Buildings  
Audience: Adyanth + family team

## 1) Goal
Build a web-based, single-player creative building game where players construct “random buildings” in a 3D world using grid-snapped blocks with gravity. The MVP focuses on fun building + clear, score-based level goals. Community/leaderboards are explicitly out of scope for MVP.

## 2) MVP Pillars
- **Creativity-first**: building is the main activity; rules guide but don’t hard-fail.
- **Always-score**: players always get a score; unmet goals simply don’t grant points.
- **3D block building**: grid-aligned placement with gravity/support rules.
- **Progressive challenge**: difficulty increases by adding requirements (not tightening time/blocks).
- **AI “God”**: generates level rules + gives hints (but does not change rules mid-level).

## 3) Core Gameplay Loop
1. Player selects:
   - **Level type**: `House`, `Tower`, `Bridge`, or `Random`
   - **Difficulty**: `Easy`, `Medium`, `Hard`
2. Server requests a level from the AI (“God”) and receives strict JSON.
3. Player builds in 3D until they press **Finish**.
4. Game evaluates the build against rule evaluators and computes a score breakdown.
5. (Optional) Player can retry, or start the next level; AI adapts next level based on prior performance.

## 4) Building System (MVP)
### 4.1 World & Camera
- Flat ground plane (ground counts as the “floor” for room detection).
- Full 3D camera controls (orbit/pan/zoom) suitable for web.

### 4.2 Placement Rules
- **Grid-aligned only**: all blocks snap to a 3D grid.
- **Gravity/support**: blocks should not “float”; unsupported blocks fall (or are prevented, depending on implementation choice).
  - Evaluation will track “floating/unsupported blocks” to enable penalties.

### 4.3 Pieces (MVP)
**Block types**
- `Wall` (brick)
- `Wood`
- `Glass`
- `Roof` (roof validity requires roof to use `Roof` blocks)
- `Paint` / `Color` (visual-only modifier on blocks; not required for goals)
- Optional: `Door` block (since Level 2 accepts door opening *or* a door block)

**Kitchen special blocks**
- `Sink` (special block)
- `Stove` (special block)
- `Counter` (special block)

**Furniture / items (placed like objects)**
- `Bed`, `Table`, `Chair`, `Lamp`, `Plant`
- `TV` (used in later “living room” goals)

## 5) Level Concepts & Progression
### 5.1 Progressive “House” idea (example progression)
- **Easy House**: 1 enclosed room + roof (made of `Roof` blocks).
- **Medium House**: Easy + windows (windows count as `Glass` blocks placed as part of a wall).
  - Initial target: **4 windows**.
- **Hard House**: Medium + living room:
  - `TV` must be inside a room
  - plus **3 other furniture items** (TV does **not** count toward the 3)

These are examples; in the final system the AI generates rules per level within the evaluation allowlist.

### 5.2 “Always-score” philosophy
- No “fail screen” for missing core goals; the player still finishes and gets a score.
- Levels can still include “core” rules (worth big points) and “bonus” rules (extra creativity points) and “penalty” rules (deductions).
- Final score is clamped at a minimum of 0.

## 6) AI “God” System
### 6.1 AI responsibilities
1. **Pre-level generation** (required): generate a strict JSON level spec.
2. **Mid-level hints** (MVP hybrid): provide commentary/hints on certain events, but **does not change level rules**.
3. **Post-level adaptation**: adjust future levels based on how the player performed.

### 6.2 Security requirement
- The web client never calls the AI provider directly.
- The server owns the API key (DeepSeek) and calls the AI.

### 6.3 Level JSON envelope (fixed)
The AI may generate dynamic rules, but must return a fixed envelope so the game can parse safely.

```json
{
  "meta": {
    "id": "string",
    "levelType": "house|tower|bridge|random",
    "difficulty": "easy|medium|hard",
    "levelName": "string"
  },
  "allowedPieces": {
    "blocks": ["string"],
    "furniture": ["string"]
  },
  "limits": {
    "maxBlocks": 250,
    "timeSec": 600
  },
  "spawn": {
    "playerStart": { "x": 0, "y": 1, "z": 0 }
  },
  "rules": [
    {
      "id": "string",
      "text": "string",
      "evaluate": { "type": "string", "…": "payload" }
    }
  ],
  "scoring": [
    { "ruleId": "string", "points": 100, "mode": "core|bonus|penalty" }
  ]
}
```

### 6.4 Evaluator allowlist (MVP)
To keep “dynamic rules” implementable, `rules[i].evaluate.type` must be one of these evaluator types; anything unknown is rejected or replaced server-side:
- `min_height`
- `enclosed_rooms_min`
- `roof_blocks_min`
- `window_glass_blocks_min`
- `door_present` (opening OR door block)
- `furniture_count_min`
- `kitchen_blocks_any2of3` (any 2 of sink/stove/counter)
- `inside_house_min` (count items inside enclosed rooms)
- `block_variety_min`
- `floating_blocks_max`

Notes:
- The allowlist can be expanded later (symmetry, color variety, etc.) once the base game feels fun.

### 6.5 Server-side validation/repair (required)
Because AI output can be malformed or overly creative:
- Validate envelope shape and required fields.
- Validate each `evaluate.type` against allowlist.
- Enforce sane `limits` (e.g., `maxBlocks` and `timeSec` within ranges).
- If invalid: either (a) repair by removing bad rules, or (b) regenerate with a stricter prompt.

### 6.6 Mid-level hinting (hybrid mode)
Rules and scoring remain fixed during a level. The AI may provide hints only.

**Hint triggers (MVP, minimal spam)**
- **Core rule completed**: celebrate + suggest next best step.
- **Close to completion**: e.g., “3/4 windows done”.
- **Common mistake**: lots of floating blocks, no roof progress, no enclosed space forming.

**Hint input**
- Send compact state (no full voxel dump): score progress, rule completion percentages, counts (roof blocks, windows, rooms), floating blocks, time elapsed.

**Hint output**
- Plain text short hint (1–2 sentences), no JSON required.

## 7) Scoring Model
- Compute each rule’s boolean/metric result with its evaluator.
- Map result to points according to `scoring[]`.
  - Simple MVP approach: each scoring item is either awarded (met) or not (unmet).
  - Penalties are applied when the penalty condition triggers (e.g., too many floating blocks).
- Final score = sum of points, clamped to `>= 0`.
- Store a score breakdown for UI (per-rule).

## 8) Out of Scope (MVP)
- Multiplayer, community sharing, leaderboards, moderation.
- AI changing rules mid-level (only hints during the level).
- Complex furniture interactions (animation, sitting, opening doors).
- Economy/currency, unlocks, inventory persistence beyond basic “save build”.

## 9) Open Decisions (next design sections)
These will be designed next before implementation:
- Exact 3D controls and UI (hotbar vs palette, rotate, delete, undo).
- How to implement gravity (simulate falling vs prevent invalid placement).
- Save format (local-only for MVP vs server saves).
- Definition of “enclosed room” detection algorithm (voxel flood-fill heuristic).
- Which level types beyond House are in MVP (`Tower`, `Bridge`, `Random`) and their initial evaluator recipes.

