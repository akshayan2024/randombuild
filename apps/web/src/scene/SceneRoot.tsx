import React, { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MOUSE } from "three";
import { Grid } from "./Grid";
import { Blocks } from "./Blocks";
import { PhysicsWorld } from "./physics/PhysicsWorld";
import { useBuildStore } from "../state/buildStore";
import { GameEnvironment } from "./GameEnvironment";
import { useFrame } from "@react-three/fiber";
import { Euler, Vector3 } from "three";

function CameraConstraints() {
  useFrame(({ camera }) => {
    if (camera.position.y < 0.5) {
      camera.position.y = 0.5;
    }
  });
  return null;
}

function FirstPersonController() {
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(-0.2);
  const move = useRef(new Vector3());
  const euler = useRef(new Euler(0, 0, 0, "YXZ"));

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement == null) return;
      yaw.current -= e.movementX * 0.0022;
      pitch.current -= e.movementY * 0.0018;
      const maxPitch = Math.PI / 2 - 0.05;
      if (pitch.current > maxPitch) pitch.current = maxPitch;
      if (pitch.current < -maxPitch) pitch.current = -maxPitch;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    euler.current.set(pitch.current, yaw.current, 0);
    camera.quaternion.setFromEuler(euler.current);

    const speed = (keys.current["ShiftLeft"] || keys.current["ShiftRight"]) ? 25 : 14;
    const upDownSpeed = 10;
    move.current.set(0, 0, 0);

    if (keys.current["KeyW"] || keys.current["ArrowUp"]) move.current.z -= 1;
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) move.current.z += 1;
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) move.current.x -= 1;
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) move.current.x += 1;
    if (keys.current["Space"]) move.current.y += 1;
    if (keys.current["ControlLeft"] || keys.current["ControlRight"]) move.current.y -= 1;

    if (move.current.lengthSq() > 0) move.current.normalize();
    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();

    camera.position.addScaledVector(forward, move.current.z * speed * delta);
    camera.position.addScaledVector(right, move.current.x * speed * delta);
    camera.position.y += move.current.y * upDownSpeed * delta;
    if (camera.position.y < 1.2) camera.position.y = 1.2;
  });

  return null;
}

export function SceneRoot() {
  const selected = useBuildStore((s) => s.selectedBlock);
  const hasBlock = useBuildStore((s) => s.hasBlock);
  const commitBlockAt = useBuildStore((s) => s.commitBlockAt);

  return (
    <Canvas shadows camera={{ position: [8, 8, 8], fov: 50 }}>
      <GameEnvironment />
      <OrbitControls
        makeDefault
        minDistance={2}
        maxDistance={500}
        maxPolarAngle={Math.PI / 2.1} // Prevents camera from going beneath ground level
        mouseButtons={{
          LEFT: MOUSE.PAN,      // left drag = pan (no conflict with click-to-place)
          MIDDLE: MOUSE.DOLLY,  // middle = zoom
          RIGHT: MOUSE.ROTATE,  // right drag = rotate camera
        }}
      />
      <FirstPersonController />
      <CameraConstraints />
      <Grid />
      <Blocks />
      <PhysicsWorld />

      {/* Ground click-catcher: place blocks at y=0, auto-stack if occupied.
           Uses onClick (not onPointerDown) so that a drag-to-rotate never
           accidentally places a block — onClick only fires on genuine short clicks. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={(e) => {
          if (document.pointerLockElement == null) {
            e.currentTarget.ownerDocument.body.requestPointerLock();
          }
        }}
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
        <planeGeometry args={[20000, 20000]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </Canvas>
  );
}
