import React, { useEffect, useMemo, useRef, useState } from "react";
import RAPIER from "@dimforge/rapier3d-compat";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, type Mesh } from "three";
import { useBuildStore } from "../../state/buildStore";
import { usePhysicsStore, type FallingBlock } from "../../state/physicsStore";
import { blockColor, type BlockType } from "../../game/blocks";
import { parseKey } from "../../game/grid";

type FallingRuntime = {
  id: string;
  type: BlockType;
  body: RAPIER.RigidBody;
};

export function PhysicsWorld() {
  const falling = usePhysicsStore((s) => s.falling);
  const removeFalling = usePhysicsStore((s) => s.removeFalling);
  const committedBlocks = useBuildStore((s) => s.blocks);
  const hasBlock = useBuildStore((s) => s.hasBlock);
  const commitBlockAt = useBuildStore((s) => s.commitBlockAt);

  // FIX 2: useState instead of useRef so dependent effects re-trigger after async RAPIER.init()
  const [rapierReady, setRapierReady] = useState(false);
  const worldRef = useRef<RAPIER.World | null>(null);
  const fixedBodiesRef = useRef<Map<string, RAPIER.RigidBody>>(new Map());
  const fallingBodiesRef = useRef<Map<string, FallingRuntime>>(new Map());

  useEffect(() => {
    let canceled = false;
    void (async () => {
      await RAPIER.init();
      if (canceled) return;
      worldRef.current = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
      const groundBody = worldRef.current.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0),
      );
      worldRef.current.createCollider(
        RAPIER.ColliderDesc.cuboid(200, 0.5, 200),
        groundBody,
      );
      // Triggers re-render → dependent effects re-run with rapierReady=true
      setRapierReady(true);
    })();
    return () => {
      canceled = true;
    };
  }, []);

  // FIX 2: rapierReady added as dep — this effect now safely re-runs after RAPIER inits.
  useEffect(() => {
    if (!rapierReady || !worldRef.current) return;
    const world = worldRef.current;
    const fixedBodies = fixedBodiesRef.current;

    for (const [key, body] of fixedBodies.entries()) {
      if (!(key in committedBlocks)) {
        world.removeRigidBody(body);
        fixedBodies.delete(key);
      }
    }
    for (const [key] of Object.entries(committedBlocks)) {
      if (fixedBodies.has(key)) continue;
      const { x, y, z } = parseKey(key);
      const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(x + 0.5, y + 0.5, z + 0.5),
      );
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), body);
      fixedBodies.set(key, body);
    }
  }, [committedBlocks, rapierReady]);

  // FIX 2: rapierReady added as dep — spawns dynamic bodies only after RAPIER is ready.
  useEffect(() => {
    if (!rapierReady || !worldRef.current) return;
    const world = worldRef.current;
    const runtimes = fallingBodiesRef.current;

    for (const f of falling) {
      if (runtimes.has(f.id)) continue;
      const startY = Math.max(2, f.target.y + 3);
      const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(f.target.x + 0.5, startY + 0.5, f.target.z + 0.5)
          .setCanSleep(true),
      );
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), body);
      runtimes.set(f.id, { id: f.id, type: f.type, body });
    }
  }, [falling, rapierReady]);

  useFrame(() => {
    // FIX 2: rapierReady is now a closure-captured state value (correct after re-render)
    if (!rapierReady || !worldRef.current) return;
    const world = worldRef.current;
    world.timestep = 1 / 60;
    world.step();

    const runtimes = fallingBodiesRef.current;
    for (const rt of runtimes.values()) {
      const lv = rt.body.linvel();
      const speed = Math.abs(lv.x) + Math.abs(lv.y) + Math.abs(lv.z);
      if (speed > 0.02) continue;

      const t = rt.body.translation();
      const gx = Math.round(t.x - 0.5);
      const gz = Math.round(t.z - 0.5);
      let gy = Math.round(t.y - 0.5);
      if (gy < 0) gy = 0;

      let pos = { x: gx, y: gy, z: gz };
      while (hasBlock(pos)) pos = { x: gx, y: pos.y + 1, z: gz };

      commitBlockAt(pos, rt.type);
      // FIX 3: removeFalling updates physicsStore (React state) → triggers re-render of
      // FallingBlocks. The body is cleaned up from the ref BEFORE the state update so
      // the re-render won't find it and correctly omits the mesh.
      world.removeRigidBody(rt.body);
      runtimes.delete(rt.id);
      removeFalling(rt.id);
      break;
    }
  });

  // FIX 3: Pass `falling` (React state from physicsStore) as the driver for rendering.
  // FallingBlocks re-renders whenever physicsStore.falling changes, not on ref mutations.
  return <FallingBlocks falling={falling} bodiesRef={fallingBodiesRef} />;
}

// FIX 3: Render is driven by physicsStore.falling (React state), body looked up from ref.
// When removeFalling() is called in useFrame, the store updates → re-render → item gone.
function FallingBlocks(props: {
  falling: FallingBlock[];
  bodiesRef: React.MutableRefObject<Map<string, FallingRuntime>>;
}) {
  const materials = useMemo(() => {
    const m = new Map<BlockType, MeshStandardMaterial>();
    const types: BlockType[] = ["Wall", "Wood", "Glass", "Roof"];
    for (const t of types) {
      m.set(
        t,
        new MeshStandardMaterial({
          color: blockColor(t),
          roughness: 0.85,
          metalness: 0.0,
          transparent: t === "Glass",
          opacity: t === "Glass" ? 0.5 : 1,
        }),
      );
    }
    return m;
  }, []);

  return (
    <>
      {props.falling.map((f) => {
        const rt = props.bodiesRef.current.get(f.id);
        if (!rt) return null;
        return (
          <FallingBlockMesh
            key={f.id}
            body={rt.body}
            material={materials.get(rt.type)!}
          />
        );
      })}
    </>
  );
}

function FallingBlockMesh(props: {
  body: RAPIER.RigidBody;
  material: MeshStandardMaterial;
}) {
  const ref = useRef<Mesh | null>(null);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = props.body.translation();
    mesh.position.set(t.x, t.y, t.z);
  });

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={props.material} attach="material" />
    </mesh>
  );
}
