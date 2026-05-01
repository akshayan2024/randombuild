import React from "react";
import { SceneRoot } from "./scene/SceneRoot";
import { Palette } from "./ui/Palette";
import { FinishPanel } from "./ui/FinishPanel";
import { HUD } from "./ui/HUD";
import { StartMenu } from "./ui/StartMenu";

export function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <StartMenu />
      <HUD />
      <Palette />
      <FinishPanel />
      <SceneRoot />
    </div>
  );
}
