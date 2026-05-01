import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Grid } from "./Grid";
import { Blocks } from "./Blocks";
import { useBuildStore } from "../state/buildStore";

export function SceneRoot() {
  const selected = useBuildStore((s) => s.selectedBlock);
  const hasBlock = useBuildStore((s) => s.hasBlock);
  const commitBlockAt = useBuildStore((s) => s.commitBlockAt);

  return (
    <Canvas shadows camera={{ position: [8, 8, 8], fov: 50 }}>
      <color attach="background" args={["#0b1220"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <OrbitControls makeDefault />
      <Grid />
      <Blocks />

      {/* Ground click-catcher: place blocks at y=0, auto-stack if occupied */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          const p = e.point;
          const x = Math.floor(p.x);
          const z = Math.floor(p.z);
          let pos = { x, y: 0, z };
          while (hasBlock(pos)) pos = { ...pos, y: pos.y + 1 };
          commitBlockAt(pos, selected);
        }}
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </Canvas>
  );
}
