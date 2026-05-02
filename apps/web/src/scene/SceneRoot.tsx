import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MOUSE } from "three";
import { Grid } from "./Grid";
import { Blocks } from "./Blocks";
import { PhysicsWorld } from "./physics/PhysicsWorld";
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
      <OrbitControls
        makeDefault
        mouseButtons={{
          LEFT: MOUSE.PAN,      // left drag = pan (no conflict with click-to-place)
          MIDDLE: MOUSE.DOLLY,  // middle = zoom
          RIGHT: MOUSE.ROTATE,  // right drag = rotate camera
        }}
      />
      <Grid />
      <Blocks />
      <PhysicsWorld />

      {/* Ground click-catcher: place blocks at y=0, auto-stack if occupied.
           Uses onClick (not onPointerDown) so that a drag-to-rotate never
           accidentally places a block — onClick only fires on genuine short clicks. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
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
