import React, { useEffect, useMemo, useRef } from "react";
import RAPIER from "@dimforge/rapier3d-compat";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, type Mesh } from "three";
import { useBuildStore } from "../../state/buildStore";
import { usePhysicsStore } from "../../state/physicsStore";
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

  const rapierReady = useRef(false);
  const worldRef = useRef<RAPIER.World | null>(null);
  const fixedBodiesRef = useRef<Map<string, RAPIER.RigidBody>>(new Map());
  const fallingBodiesRef = useRef<Map<string, FallingRuntime>>(new Map());

  useEffect(() => {
    let canceled = false;
    void (async () => {
      await RAPIER.init();
      if (canceled) return;
      rapierReady.current = true;
      worldRef.current = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

      // Ground (y = 0) as a big fixed cuboid slightly below the surface.
      const groundBody = worldRef.current.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
      worldRef.current.createCollider(RAPIER.ColliderDesc.cuboid(200, 0.5, 200), groundBody);
    })();
    return () => {
      canceled = true;
    };
  }, []);

  // Keep fixed colliders in sync with committed blocks (simple rebuild-on-change approach).
  useEffect(() => {
    if (!rapierReady.current || !worldRef.current) return;
    const world = worldRef.current;
    const fixedBodies = fixedBodiesRef.current;

    // Remove fixed bodies that no longer exist.
    for (const [key, body] of fixedBodies.entries()) {
      if (!(key in committedBlocks)) {
        world.removeRigidBody(body);
        fixedBodies.delete(key);
      }
    }

    // Add fixed bodies for new committed blocks.
    for (const [key, type] of Object.entries(committedBlocks)) {
      if (fixedBodies.has(key)) continue;
      const { x, y, z } = parseKey(key);
      const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(x + 0.5, y + 0.5, z + 0.5),
      );
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), body);
      fixedBodies.set(key, body);
    }
  }, [committedBlocks]);

  // Spawn dynamic bodies for falling blocks.
  useEffect(() => {
    if (!rapierReady.current || !worldRef.current) return;
    const world = worldRef.current;
    const runtimes = fallingBodiesRef.current;

    for (const f of falling) {
      if (runtimes.has(f.id)) continue;
      // Spawn just above the target so it feels responsive (still “falls”, but not from the sky).
      const startY = Math.max(2, f.target.y + 3);
      const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(f.target.x + 0.5, startY + 0.5, f.target.z + 0.5)
          .setCanSleep(true),
      );
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5), body);
      runtimes.set(f.id, { id: f.id, type: f.type, body });
    }
  }, [falling]);

  useFrame(() => {
    if (!rapierReady.current || !worldRef.current) return;
    const world = worldRef.current;
    world.timestep = 1 / 60;
    world.step();

    // Check for bodies that have settled; commit them into the grid.
    const runtimes = fallingBodiesRef.current;
    for (const rt of runtimes.values()) {
      const body = rt.body;
      const lv = body.linvel();
      const speed = Math.abs(lv.x) + Math.abs(lv.y) + Math.abs(lv.z);
      if (speed > 0.02) continue;

      const t = body.translation();
      const gx = Math.round(t.x - 0.5);
      const gz = Math.round(t.z - 0.5);
      let gy = Math.round(t.y - 0.5);
      if (gy < 0) gy = 0;

      // Ensure we don't commit into an occupied cell; stack upward if needed.
      let pos = { x: gx, y: gy, z: gz };
      while (hasBlock(pos)) pos = { x: gx, y: pos.y + 1, z: gz };

      // Commit and remove from physics.
      commitBlockAt(pos, rt.type);
      removeFalling(rt.id);
      world.removeRigidBody(body);
      runtimes.delete(rt.id);
      break;
    }
  });

  return (
    <FallingBlocks
      items={Array.from(fallingBodiesRef.current.values()).map((rt) => ({
        id: rt.id,
        type: rt.type,
        body: rt.body,
      }))}
    />
  );
}

function FallingBlocks(props: { items: FallingRuntime[] }) {
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
      {props.items.map((it) => (
        <FallingBlockMesh key={it.id} body={it.body} material={materials.get(it.type)!} />
      ))}
    </>
  );
}

function FallingBlockMesh(props: { body: RAPIER.RigidBody; material: MeshStandardMaterial }) {
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
