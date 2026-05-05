import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { AdditiveBlending, InstancedMesh, Matrix3, Matrix4, Object3D, Vector3, type Group, type PointLight } from "three";
import { useBuildStore } from "../state/buildStore";
import { BLOCK_META, type BlockType } from "../game/blocks";
import { parseKey } from "../game/grid";
import { useInteractionStore } from "../state/interactionStore";
import { makeBlockMaterial } from "./materials";
import { useWindStore } from "../state/windStore";
import { getSeason, useEnvironmentStore } from "../state/environmentStore";

const tmp = new Object3D();
const tmpMatrix = new Matrix4();
const tmpNormalMatrix = new Matrix3();
const tmpNormal = new Vector3();

const CUSTOM_TYPES = new Set<BlockType>(["TV", "Door", "Lamp", "Stove", "Roof", "Fence", "Torch", "Lantern", "Water", "Leaves", "Plant", "Stairs", "Counter", "Bed", "Chair", "Table", "Sink", "Sand"]);

export function Blocks() {
  const blocks = useBuildStore((s) => s.blocks);
  const day = useEnvironmentStore((s) => s.day);
  const timeOfDay = useEnvironmentStore((s) => s.timeOfDay);
  const season = getSeason(day);
  const surfaceWetness = useMemo(() => {
    const seasonal = season === "Winter" ? 0.95 : season === "Spring" ? 0.7 : season === "Autumn" ? 0.52 : 0.35;
    const isNight = timeOfDay < 6 || timeOfDay > 18;
    return Math.min(1, seasonal + (isNight ? 0.14 : 0));
  }, [season, timeOfDay]);
  const entries = useMemo(() => Object.entries(blocks) as [string, BlockType][], [blocks]);
  const byType = useMemo(() => groupByType(entries), [entries]);

  const lightBlocks = useMemo(
    () => entries.filter(([, t]) => BLOCK_META[t]?.pointLight).map(([key, type]) => ({ ...parseKey(key), type })),
    [entries],
  );

  return (
    <>
      {Object.entries(byType)
        .filter(([type, list]) => list.length > 0 && !CUSTOM_TYPES.has(type as BlockType))
        .map(([type, list]) => (
          <BlocksOfType key={type} type={type as BlockType} keys={list} season={season} surfaceWetness={surfaceWetness} />
        ))}

      {(["TV", "Door", "Lamp", "Stove", "Roof", "Fence", "Torch", "Lantern", "Water", "Leaves", "Plant", "Stairs", "Counter", "Bed", "Chair", "Table", "Sink", "Sand"] as BlockType[]).flatMap((type) =>
        (byType[type] ?? []).map((key) => <CustomPiece key={`${type}:${key}`} type={type} blockKey={key} />),
      )}

      {lightBlocks.map(({ x, y, z, type }, i) => {
        const meta = BLOCK_META[type];
        return (
          <pointLight
            key={`light-${i}`}
            position={[x + 0.5, y + 1.2, z + 0.5]}
            color={meta.emissive ?? "#fff"}
            intensity={8}
            distance={6}
            decay={2}
          />
        );
      })}
    </>
  );
}

function BlocksOfType(props: { type: BlockType; keys: string[]; season: ReturnType<typeof getSeason>; surfaceWetness: number }) {
  const removeBlock = useBuildStore((s) => s.removeBlock);
  const selected = useBuildStore((s) => s.selectedBlock);
  const hasBlock = useBuildStore((s) => s.hasBlock);
  const commitBlockAt = useBuildStore((s) => s.commitBlockAt);
  const material = useMemo(() => makeBlockMaterial(props.type, 1, props.season), [props.type, props.season]);
  if (props.type === "Dirt") {
    const wetness = props.surfaceWetness;
    material.roughness = 0.9 - wetness * 0.36;
    material.metalness = 0.01 + wetness * 0.08;
    material.color.set(wetness > 0.62 ? "#4d3526" : "#7a5941");
  }
  const count = props.keys.length;

  return (
    <instancedMesh
      key={count}
      args={[undefined, material, count]}
      castShadow
      receiveShadow
      onContextMenu={(e) => {
        e.nativeEvent.preventDefault();
        const index = e.instanceId ?? -1;
        if (index < 0 || index >= props.keys.length) return;
        e.stopPropagation();
        removeBlock(parseKey(props.keys[index]));
      }}
      onClick={(e) => {
        const index = e.instanceId ?? -1;
        if (index < 0 || index >= props.keys.length) return;
        const pos = parseKey(props.keys[index]);
        e.stopPropagation();
        const faceNormal = e.face?.normal;
        if (!faceNormal) return;
        tmpNormal.copy(faceNormal);
        tmpNormalMatrix.getNormalMatrix(e.object.matrixWorld);
        tmpNormal.applyMatrix3(tmpNormalMatrix);
        const ax = Math.abs(tmpNormal.x);
        const ay = Math.abs(tmpNormal.y);
        const az = Math.abs(tmpNormal.z);
        let dx = 0;
        let dy = 0;
        let dz = 0;
        if (ax >= ay && ax >= az) dx = tmpNormal.x > 0 ? 1 : -1;
        else if (ay >= ax && ay >= az) dy = tmpNormal.y > 0 ? 1 : -1;
        else dz = tmpNormal.z > 0 ? 1 : -1;
        const target = { x: pos.x + dx, y: pos.y + dy, z: pos.z + dz };
        if (hasBlock(target)) return;
        commitBlockAt(target, selected);
      }}
      ref={(mesh) => {
        if (!mesh) return;
        applyInstances(mesh, props.keys);
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
}

function CustomPiece(props: { type: BlockType; blockKey: string }) {
  const removeBlock = useBuildStore((s) => s.removeBlock);
  const blocks = useBuildStore((s) => s.blocks);
  const { x, y, z } = parseKey(props.blockKey);
  const toggleTv = useInteractionStore((s) => s.toggleTv);
  const toggleDoor = useInteractionStore((s) => s.toggleDoor);
  const toggleLamp = useInteractionStore((s) => s.toggleLamp);
  const toggleStove = useInteractionStore((s) => s.toggleStove);
  const toggleBedSleep = useInteractionStore((s) => s.toggleBedSleep);
  const toggleChairSit = useInteractionStore((s) => s.toggleChairSit);
  const toggleSink = useInteractionStore((s) => s.toggleSink);
  const tvByKey = useInteractionStore((s) => s.tvByKey);
  const doorByKey = useInteractionStore((s) => s.doorByKey);
  const lampByKey = useInteractionStore((s) => s.lampByKey);
  const stoveByKey = useInteractionStore((s) => s.stoveByKey);
  const bedByKey = useInteractionStore((s) => s.bedByKey);
  const chairByKey = useInteractionStore((s) => s.chairByKey);
  const sinkByKey = useInteractionStore((s) => s.sinkByKey);
  const tableChairSnapHelpersVisible = useInteractionStore((s) => s.tableChairSnapHelpersVisible);
  const windStrength = useWindStore((s) => s.windStrength);
  const swayRef = useRef<Group | null>(null);
  const modelUrl = BLOCK_META[props.type].modelUrl;
  const modelTransform = BLOCK_META[props.type].modelTransform;
  const gltf = modelUrl ? useGLTF(modelUrl) : null;
  const modelRef = useRef<Group | null>(null);
  const lanternBodyRef = useRef<Group | null>(null);
  const lanternLightRef = useRef<Group | null>(null);
  const lanternPhase = useMemo(() => (x * 12.9898 + z * 78.233) % (Math.PI * 2), [x, z]);

  useFrame((state) => {
    if (!swayRef.current) return;
    const t = state.clock.elapsedTime;
    if (props.type === "Leaves" || props.type === "Plant") {
      swayRef.current.rotation.z = Math.sin(t * 2.2 + x * 0.3 + z * 0.3) * 0.06 * windStrength;
      swayRef.current.rotation.x = Math.cos(t * 1.7 + x * 0.2) * 0.04 * windStrength;
    }
    if (props.type === "Lantern") {
      // Pendulum-like swing with a little phase-jitter so groups don't sync perfectly.
      const gust = Math.sin(t * 0.45 + lanternPhase * 0.7) * 0.25 + Math.sin(t * 1.1 + lanternPhase) * 0.1;
      const sway = windStrength * (0.05 + 0.03 * gust);
      swayRef.current.rotation.z = Math.sin(t * (1.7 + windStrength * 0.6) + lanternPhase) * sway;
      swayRef.current.rotation.x = Math.cos(t * (1.33 + windStrength * 0.4) + lanternPhase * 0.5) * sway * 0.75;
      if (lanternBodyRef.current) {
        lanternBodyRef.current.rotation.y = Math.sin(t * 0.8 + lanternPhase) * 0.03 * (0.6 + windStrength);
      }
      if (lanternLightRef.current) {
        const low = Math.sin(t * 3.4 + lanternPhase) * 0.16;
        const high = Math.sin(t * 18.2 + lanternPhase * 2.1) * 0.07;
        const flicker = 1 + (low + high) * (0.5 + windStrength * 0.45);
        lanternLightRef.current.scale.setScalar(Math.max(0.82, flicker));
      }
    }
    if (modelRef.current) {
      const t = state.clock.elapsedTime;
      if (props.type === "Door") {
        const open = doorByKey[props.blockKey] === "open";
        const targetY = open ? Math.PI / 2.8 : 0;
        modelRef.current.rotation.y += (targetY - modelRef.current.rotation.y) * 0.15;
      }
      if (props.type === "TV" && tvByKey[props.blockKey] === "on") {
        const pulse = 1 + Math.sin(t * 5.5) * 0.03;
        modelRef.current.scale.set(
          (modelTransform?.scale?.[0] ?? 0.5) * pulse,
          (modelTransform?.scale?.[1] ?? 0.5) * pulse,
          (modelTransform?.scale?.[2] ?? 0.5) * pulse,
        );
      }
      if (props.type === "TV" && tvByKey[props.blockKey] !== "on") {
        modelRef.current.scale.set(
          modelTransform?.scale?.[0] ?? 0.5,
          modelTransform?.scale?.[1] ?? 0.5,
          modelTransform?.scale?.[2] ?? 0.5,
        );
      }
    }
  });

  const material = useMemo(() => {
    if (props.type === "TV") return makeBlockMaterial("TV", tvByKey[props.blockKey] === "on" ? 2.5 : 0.2);
    if (props.type === "Lamp") return makeBlockMaterial("Lamp", lampByKey[props.blockKey] === "on" ? 2.2 : 0.35);
    if (props.type === "Stove") return makeBlockMaterial("Stove", stoveByKey[props.blockKey] === "on" ? 1.9 : 0.4);
    if (props.type === "Bed") return makeBlockMaterial("Bed", bedByKey[props.blockKey] === "sleeping" ? 1.2 : 0.35);
    if (props.type === "Chair") return makeBlockMaterial("Chair", chairByKey[props.blockKey] === "sitting" ? 1.1 : 0.3);
    return makeBlockMaterial(props.type);
  }, [props.type, props.blockKey, tvByKey, lampByKey, stoveByKey, bedByKey, chairByKey]);

  const onContextMenu: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (props.type === "TV") toggleTv(props.blockKey);
    else if (props.type === "Door") toggleDoor(props.blockKey);
    else if (props.type === "Lamp") toggleLamp(props.blockKey);
    else if (props.type === "Stove") toggleStove(props.blockKey);
    else if (props.type === "Bed") toggleBedSleep(props.blockKey);
    else if (props.type === "Chair") toggleChairSit(props.blockKey);
    else if (props.type === "Sink") toggleSink(props.blockKey);
  };

  const onDoubleClick: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    removeBlock({ x, y, z });
  };

  const doorOpen = doorByKey[props.blockKey] === "open";
  const bedSleeping = bedByKey[props.blockKey] === "sleeping";
  const chairSitting = chairByKey[props.blockKey] === "sitting";
  const n = neighbors(blocks, x, y, z);
  const cn = typedNeighbors(blocks, x, y, z, "Counter");
  const tableNearChair = props.type === "Chair" && (
    blocks[`${x + 1},${y},${z}`] === "Table" ||
    blocks[`${x - 1},${y},${z}`] === "Table" ||
    blocks[`${x},${y},${z + 1}`] === "Table" ||
    blocks[`${x},${y},${z - 1}`] === "Table"
  );
  const roofRotY = resolveRoofRotation(blocks, x, y, z);
  const chairSnapOffsetX = props.type === "Chair" && blocks[`${x + 1},${y},${z}`] === "Table" ? -0.18 :
    props.type === "Chair" && blocks[`${x - 1},${y},${z}`] === "Table" ? 0.18 : 0;
  const chairSnapOffsetZ = props.type === "Chair" && blocks[`${x},${y},${z + 1}`] === "Table" ? -0.18 :
    props.type === "Chair" && blocks[`${x},${y},${z - 1}`] === "Table" ? 0.18 : 0;
  const chairSnapRotY = props.type === "Chair" && blocks[`${x + 1},${y},${z}`] === "Table" ? -Math.PI / 2 :
    props.type === "Chair" && blocks[`${x - 1},${y},${z}`] === "Table" ? Math.PI / 2 :
    props.type === "Chair" && blocks[`${x},${y},${z + 1}`] === "Table" ? Math.PI : 0;
  const stairRotY = n.xp ? 0 : n.zp ? Math.PI / 2 : n.xm ? Math.PI : -Math.PI / 2;
  return (
    <group ref={swayRef} position={[x + 0.5, y + 0.5, z + 0.5]} onContextMenu={onContextMenu} onDoubleClick={onDoubleClick}>
      {gltf?.scene ? (
        <group
          ref={modelRef}
          position={modelTransform?.position ?? [0, -0.5, 0]}
          rotation={modelTransform?.rotation ?? [0, 0, 0]}
          scale={modelTransform?.scale ?? [0.5, 0.5, 0.5]}
        >
          <primitive object={gltf.scene.clone()} />
        </group>
      ) : (
        <>
      {props.type === "Roof" && (
        <mesh rotation={[0, roofRotY, 0]} material={makeBlockMaterial("Roof")}>
          <coneGeometry args={[0.72, 1, 4]} />
        </mesh>
      )}
      {props.type === "Stairs" && (
        <group rotation={[0, stairRotY, 0]}>
          <mesh position={[0, -0.25, -0.25]} material={makeBlockMaterial("Stairs")}><boxGeometry args={[1, 0.5, 0.5]} /></mesh>
          <mesh position={[0, 0, 0.0]} material={makeBlockMaterial("Stairs")}><boxGeometry args={[1, 0.5, 0.5]} /></mesh>
          <mesh position={[0, 0.25, 0.25]} material={makeBlockMaterial("Stairs")}><boxGeometry args={[1, 0.5, 0.5]} /></mesh>
        </group>
      )}
      {props.type === "Fence" && (
        <group>
          <mesh position={[-0.45, 0, 0]} material={makeBlockMaterial("Fence")}><boxGeometry args={[0.1, 1, 0.1]} /></mesh>
          <mesh position={[0.45, 0, 0]} material={makeBlockMaterial("Fence")}><boxGeometry args={[0.1, 1, 0.1]} /></mesh>
          <mesh position={[0, 0.2, 0]} material={makeBlockMaterial("Fence")}><boxGeometry args={[0.9, 0.1, 0.1]} /></mesh>
          <mesh position={[0, -0.1, 0]} material={makeBlockMaterial("Fence")}><boxGeometry args={[0.9, 0.1, 0.1]} /></mesh>
          {(n.zp || n.zm) && <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0.2, 0]} material={makeBlockMaterial("Fence")}><boxGeometry args={[0.9, 0.1, 0.1]} /></mesh>}
          {(n.zp || n.zm) && <mesh rotation={[0, Math.PI / 2, 0]} position={[0, -0.1, 0]} material={makeBlockMaterial("Fence")}><boxGeometry args={[0.9, 0.1, 0.1]} /></mesh>}
        </group>
      )}
      {props.type === "Water" && (
        <AnimatedWater />
      )}
      {props.type === "Sand" && (
        <SandPatch blockKey={props.blockKey} />
      )}
      {props.type === "Torch" && (
        <TorchBlock />
      )}
      {props.type === "Lantern" && (
        <group>
          <mesh position={[0, 0.31, 0]} material={makeBlockMaterial("Wood")}><boxGeometry args={[0.08, 0.18, 0.08]} /></mesh>
          <group ref={lanternBodyRef} position={[0, -0.02, 0]}>
            <mesh position={[0, 0.12, 0]} material={makeBlockMaterial("Wood")}><boxGeometry args={[0.03, 0.24, 0.03]} /></mesh>
            <mesh position={[0, -0.05, 0]} material={makeBlockMaterial("Lantern")}><boxGeometry args={[0.32, 0.45, 0.32]} /></mesh>
            <mesh ref={lanternLightRef} position={[0, -0.05, 0]} material={makeBlockMaterial("Lantern", 1.85)}><sphereGeometry args={[0.12, 10, 8]} /></mesh>
          </group>
        </group>
      )}
      {props.type === "Leaves" && (
        <mesh material={makeBlockMaterial("Leaves")}><boxGeometry args={[1, 1, 1]} /></mesh>
      )}
      {props.type === "Plant" && (
        <group>
          <mesh position={[0, -0.35, 0]} material={makeBlockMaterial("Dirt")}><cylinderGeometry args={[0.18, 0.22, 0.3, 12]} /></mesh>
          <mesh position={[0, 0.05, 0]} material={makeBlockMaterial("Plant")}><coneGeometry args={[0.3, 0.7, 8]} /></mesh>
        </group>
      )}
      {props.type === "TV" && (
        <>
          <mesh position={[0, -0.35, 0]} material={makeBlockMaterial("Wood")}>
            <boxGeometry args={[0.3, 0.2, 0.3]} />
          </mesh>
          <mesh position={[0, 0.05, 0]} material={material}>
            <boxGeometry args={[0.92, 0.56, 0.18]} />
          </mesh>
          {tvByKey[props.blockKey] === "on" && (
            <>
              <mesh position={[0, 0.05, 0.105]} material={makeBlockMaterial("Water", 1.7)}>
                <boxGeometry args={[0.84, 0.46, 0.02]} />
              </mesh>
              <mesh position={[0, 0.05, 0.118]} material={makeBlockMaterial("Lamp", 2.2)}>
                <boxGeometry args={[0.78, 0.4, 0.008]} />
              </mesh>
            </>
          )}
        </>
      )}
      {props.type === "Door" && (
        <mesh rotation={[0, doorOpen ? Math.PI / 2.8 : 0, 0]} position={[0, 0, -0.43]} material={material}>
          <boxGeometry args={[0.86, 0.96, 0.08]} />
        </mesh>
      )}
      {props.type === "Lamp" && (
        <>
          <mesh position={[0, -0.34, 0]} material={makeBlockMaterial("Wood")}>
            <cylinderGeometry args={[0.08, 0.08, 0.45, 12]} />
          </mesh>
          <mesh position={[0, 0.05, 0]} material={material}>
            <sphereGeometry args={[0.22, 14, 10]} />
          </mesh>
        </>
      )}
      {props.type === "Stove" && (
        <>
          <mesh position={[0, -0.1, 0]} material={material}>
            <boxGeometry args={[0.9, 0.8, 0.9]} />
          </mesh>
          <mesh position={[0, 0.31, 0]} material={makeBlockMaterial("Counter")}>
            <boxGeometry args={[0.9, 0.06, 0.9]} />
          </mesh>
          {stoveByKey[props.blockKey] === "on" && (
            <>
              <mesh position={[-0.22, 0.345, -0.22]} material={makeBlockMaterial("Torch", 1.8)}><sphereGeometry args={[0.065, 10, 8]} /></mesh>
              <mesh position={[0.22, 0.345, -0.22]} material={makeBlockMaterial("Torch", 1.8)}><sphereGeometry args={[0.065, 10, 8]} /></mesh>
              <mesh position={[-0.22, 0.345, 0.22]} material={makeBlockMaterial("Torch", 1.8)}><sphereGeometry args={[0.065, 10, 8]} /></mesh>
              <mesh position={[0.22, 0.345, 0.22]} material={makeBlockMaterial("Torch", 1.8)}><sphereGeometry args={[0.065, 10, 8]} /></mesh>
            </>
          )}
        </>
      )}
      {props.type === "Counter" && (
        <CounterVariant xp={cn.xp} xm={cn.xm} zp={cn.zp} zm={cn.zm} />
      )}
      {props.type === "Bed" && (
        <group position={[0, bedSleeping ? -0.06 : 0, 0]}>
          <mesh position={[0, -0.22, 0]} material={makeBlockMaterial("Wood")}><boxGeometry args={[0.95, 0.2, 0.95]} /></mesh>
          <mesh position={[0, 0.0, 0]} material={material}><boxGeometry args={[0.92, 0.28, 0.92]} /></mesh>
          <mesh position={[0, 0.2, -0.24]} material={makeBlockMaterial("Wall")}><boxGeometry args={[0.92, 0.1, 0.2]} /></mesh>
          {bedSleeping && <mesh position={[0, 0.28, 0.22]} material={makeBlockMaterial("Lamp", 1.8)}><sphereGeometry args={[0.1, 8, 8]} /></mesh>}
        </group>
      )}
      {props.type === "Table" && (
        <group>
          <mesh position={[0, 0.17, 0]} material={makeBlockMaterial("Table")}><boxGeometry args={[0.95, 0.1, 0.95]} /></mesh>
          <mesh position={[-0.32, -0.16, -0.32]} material={makeBlockMaterial("Wood")}><boxGeometry args={[0.1, 0.58, 0.1]} /></mesh>
          <mesh position={[0.32, -0.16, -0.32]} material={makeBlockMaterial("Wood")}><boxGeometry args={[0.1, 0.58, 0.1]} /></mesh>
          <mesh position={[-0.32, -0.16, 0.32]} material={makeBlockMaterial("Wood")}><boxGeometry args={[0.1, 0.58, 0.1]} /></mesh>
          <mesh position={[0.32, -0.16, 0.32]} material={makeBlockMaterial("Wood")}><boxGeometry args={[0.1, 0.58, 0.1]} /></mesh>
        </group>
      )}
      {props.type === "Chair" && (
        <group rotation={[0, chairSitting && tableNearChair ? chairSnapRotY : 0, 0]} position={[chairSitting && tableNearChair ? chairSnapOffsetX : 0, chairSitting ? -0.08 : 0, chairSitting && tableNearChair ? chairSnapOffsetZ : 0]}>
          <mesh position={[0, -0.06, 0]} material={material}><boxGeometry args={[0.52, 0.12, 0.52]} /></mesh>
          <mesh position={[0, 0.22, -0.18]} material={makeBlockMaterial("Wood")}><boxGeometry args={[0.52, 0.45, 0.08]} /></mesh>
          {chairSitting && <mesh position={[0, 0.1, 0]} material={makeBlockMaterial("Lamp", 1.5)}><torusGeometry args={[0.13, 0.02, 8, 18]} /></mesh>}
          {tableChairSnapHelpersVisible && tableNearChair && (
            <mesh position={[0, 0.28, 0]} material={makeBlockMaterial("Lamp", 2.1)}>
              <torusGeometry args={[0.26, 0.02, 8, 20]} />
            </mesh>
          )}
        </group>
      )}
      {props.type === "Sink" && (
        <SinkBlock running={sinkByKey[props.blockKey] === "on"} />
      )}
        </>
      )}
    </group>
  );
}

function SinkBlock(props: { running: boolean }) {
  const dropsRef = useRef<InstancedMesh | null>(null);
  const particles = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ offset: i / 10, spin: i * 0.9 })), []);
  useFrame((state) => {
    if (!dropsRef.current || !props.running) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const life = (t * 1.9 + p.offset) % 1;
      tmp.position.set(Math.sin(t * 3.2 + p.spin) * 0.06, 0.2 - life * 0.65, Math.cos(t * 2.8 + p.spin) * 0.06);
      const s = 0.012 + (1 - life) * 0.012;
      tmp.scale.set(s, s * 1.8, s);
      tmp.updateMatrix();
      dropsRef.current.setMatrixAt(i, tmp.matrix);
    }
    dropsRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh position={[0, -0.1, 0]} material={makeBlockMaterial("Counter")}><boxGeometry args={[0.95, 0.8, 0.95]} /></mesh>
      <mesh position={[0, 0.31, 0]} material={makeBlockMaterial("Sink", props.running ? 1.3 : 0.7)}><boxGeometry args={[0.95, 0.06, 0.95]} /></mesh>
      <mesh position={[0, 0.23, 0]} material={makeBlockMaterial("Water", props.running ? 1.5 : 0.5)}><boxGeometry args={[0.36, 0.06, 0.36]} /></mesh>
      {props.running && (
        <instancedMesh ref={dropsRef} args={[undefined, undefined, particles.length]} frustumCulled={false}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial color={"#7fc8ff"} emissive={"#63b7ff"} emissiveIntensity={0.35} transparent opacity={0.7} depthWrite={false} />
        </instancedMesh>
      )}
    </group>
  );
}

function CounterVariant(n: { xp: boolean; xm: boolean; zp: boolean; zm: boolean }) {
  const m = makeBlockMaterial("Counter");
  const arms = Number(n.xp) + Number(n.xm) + Number(n.zp) + Number(n.zm);
  const hasX = n.xp || n.xm;
  const hasZ = n.zp || n.zm;
  const isStraight = arms === 2 && ((n.xp && n.xm) || (n.zp && n.zm));
  const isCorner = arms === 2 && hasX && hasZ;
  const isCross = arms === 4;
  const isT = arms === 3;
  const topH = 0.1;
  const centerW = 0.62;
  const armW = 0.22;
  const armOffset = 0.2;

  const renderCenterAndArms = (dirs: { xp: boolean; xm: boolean; zp: boolean; zm: boolean }) => (
    <>
      <mesh position={[0, 0, 0]} material={m}>
        <boxGeometry args={[centerW, 0.8, centerW]} />
      </mesh>
      {dirs.xp && <mesh position={[armOffset, 0, 0]} material={m}><boxGeometry args={[armW, 0.8, centerW]} /></mesh>}
      {dirs.xm && <mesh position={[-armOffset, 0, 0]} material={m}><boxGeometry args={[armW, 0.8, centerW]} /></mesh>}
      {dirs.zp && <mesh position={[0, 0, armOffset]} material={m}><boxGeometry args={[centerW, 0.8, armW]} /></mesh>}
      {dirs.zm && <mesh position={[0, 0, -armOffset]} material={m}><boxGeometry args={[centerW, 0.8, armW]} /></mesh>}
    </>
  );

  return (
    <group>
      <mesh position={[0, 0.45, 0]} material={m}>
        <boxGeometry args={[1, topH, 1]} />
      </mesh>

      {(arms === 0 || arms === 1) && (
        <mesh position={[0, 0, 0]} material={m}>
          <boxGeometry args={[0.84, 0.8, 0.84]} />
        </mesh>
      )}

      {isStraight && (
        <mesh position={[0, 0, 0]} material={m}>
          <boxGeometry args={[hasX ? 0.84 : centerW, 0.8, hasZ ? 0.84 : centerW]} />
        </mesh>
      )}

      {isCorner && renderCenterAndArms({ xp: n.xp, xm: n.xm, zp: n.zp, zm: n.zm })}

      {isT && renderCenterAndArms({ xp: n.xp, xm: n.xm, zp: n.zp, zm: n.zm })}

      {isCross && renderCenterAndArms({ xp: true, xm: true, zp: true, zm: true })}
    </group>
  );
}

function resolveRoofRotation(blocks: Record<string, BlockType>, x: number, y: number, z: number) {
  const roofN = typedNeighbors(blocks, x, y, z, "Roof");
  const roofX = Number(roofN.xp) + Number(roofN.xm);
  const roofZ = Number(roofN.zp) + Number(roofN.zm);
  if (roofX > roofZ) return 0;
  if (roofZ > roofX) return Math.PI / 2;

  const anyN = neighbors(blocks, x, y, z);
  const anyX = Number(anyN.xp) + Number(anyN.xm);
  const anyZ = Number(anyN.zp) + Number(anyN.zm);
  if (anyX > anyZ) return 0;
  if (anyZ > anyX) return Math.PI / 2;

  return 0;
}

function AnimatedWater() {
  const ref = useRef<Group | null>(null);
  const topRef = useRef<Group | null>(null);
  const flowRef = useRef<Group | null>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 1.6) * 0.02 - 0.43;
    if (topRef.current) {
      topRef.current.position.y = Math.sin(t * 2.7 + 0.8) * 0.01 + 0.01;
      topRef.current.scale.x = 1 + Math.sin(t * 1.9) * 0.025;
      topRef.current.scale.z = 1 + Math.cos(t * 2.2) * 0.025;
    }
    if (flowRef.current) {
      flowRef.current.position.x = Math.sin(t * 1.8) * 0.08;
      flowRef.current.position.z = Math.cos(t * 2.1) * 0.065;
      flowRef.current.rotation.y = Math.sin(t * 1.4) * 0.2;
    }
  });
  return (
    <group ref={ref}>
      <mesh material={makeBlockMaterial("Water")}><boxGeometry args={[1, 0.14, 1]} /></mesh>
      <mesh ref={topRef} position={[0, 0.08, 0]} material={makeBlockMaterial("Water", 1.12)}>
        <boxGeometry args={[0.95, 0.04, 0.95]} />
      </mesh>
      <mesh ref={flowRef} position={[0, 0.095, 0]} material={makeBlockMaterial("Water", 1.2)}>
        <boxGeometry args={[0.42, 0.015, 0.42]} />
      </mesh>
      <mesh position={[0.16, 0.102, 0.03]} rotation={[0, Math.PI * 0.15, 0]} material={makeBlockMaterial("Water", 1.18)}>
        <boxGeometry args={[0.23, 0.012, 0.08]} />
      </mesh>
      <mesh position={[-0.17, 0.104, -0.07]} rotation={[0, Math.PI * 0.27, 0]} material={makeBlockMaterial("Water", 1.16)}>
        <boxGeometry args={[0.2, 0.011, 0.07]} />
      </mesh>
      <mesh position={[0.01, 0.11, -0.15]} rotation={[0, Math.PI * 0.5, 0]} material={makeBlockMaterial("Water", 1.14)}>
        <torusGeometry args={[0.12, 0.008, 8, 24]} />
      </mesh>
      <mesh position={[-0.1, 0.108, 0.15]} rotation={[-Math.PI / 2, 0, 0]} material={makeBlockMaterial("Water", 1.12)}>
        <ringGeometry args={[0.04, 0.085, 20]} />
      </mesh>
    </group>
  );
}

function SandPatch(props: { blockKey: string }) {
  const { x, z } = parseKey(props.blockKey);
  const seed = useMemo(() => Math.abs(Math.sin(x * 17.231 + z * 7.193)), [x, z]);
  const scatter = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const a = seed * 8.2 + i * 1.24;
        const r = 0.16 + (i % 3) * 0.09;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.045 + (i % 2) * 0.025, y: -0.01 + i * 0.002 };
      }),
    [seed],
  );
  return (
    <group>
      <mesh position={[0, -0.02, 0]} material={makeBlockMaterial("Sand")}><boxGeometry args={[1, 0.96, 1]} /></mesh>
      <mesh position={[0.16, 0.48, 0.05]} rotation={[-Math.PI / 2, 0.25, 0]} material={makeBlockMaterial("Sand", 1.02)}>
        <ringGeometry args={[0.06, 0.11, 20]} />
      </mesh>
      <mesh position={[-0.21, 0.48, -0.09]} rotation={[-Math.PI / 2, -0.12, 0]} material={makeBlockMaterial("Sand", 1.01)}>
        <ringGeometry args={[0.04, 0.08, 20]} />
      </mesh>
      {scatter.map((p, i) => (
        <mesh key={i} position={[p.x, 0.47 + p.y, p.z]} material={makeBlockMaterial("Sand", 1.05)}>
          <sphereGeometry args={[p.s, 6, 5]} />
        </mesh>
      ))}
    </group>
  );
}

function TorchBlock() {
  const flameRef = useRef<Group | null>(null);
  const smokeRef = useRef<InstancedMesh | null>(null);
  const torchLightRef = useRef<PointLight | null>(null);
  const smokeParticles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        angle: i * 2.13,
        speed: 0.24 + (i % 5) * 0.05,
        height: (i / 10) * 0.65,
        drift: 0.8 + (i % 3) * 0.25,
      })),
    [],
  );
  const baseI = 5.2;
  useFrame((state) => {
    if (!flameRef.current) return;
    const t = state.clock.elapsedTime;
    const low = Math.sin(t * 6.3) * 0.08;
    const high = Math.sin(t * 17.4 + 0.9) * 0.04;
    const flutter = Math.sin(t * 30.0 + Math.sin(t * 2.0) * 0.45) * 0.018;
    const flicker = 1 + low + high + flutter;
    flameRef.current.scale.set(0.95 + flicker * 0.1, 0.9 + flicker * 0.2, 0.95 + flicker * 0.1);
    flameRef.current.position.y = 0.2 + Math.sin(t * 12.4) * 0.01;
    if (torchLightRef.current) {
      torchLightRef.current.intensity = Math.max(3.8, baseI + (low + high + flutter) * 7.5);
      torchLightRef.current.distance = 5.3 + Math.sin(t * 4.1) * 0.2;
    }
    if (smokeRef.current) {
      for (let i = 0; i < smokeParticles.length; i++) {
        const p = smokeParticles[i];
        const rise = (t * p.speed + p.height) % 1;
        const swirl = p.angle + t * (0.5 + p.drift * 0.35);
        const spiral = 0.028 + rise * 0.09;
        tmp.position.set(
          Math.cos(swirl) * spiral + Math.sin(t * 0.7 + i) * 0.008,
          0.24 + rise * 1.02,
          Math.sin(swirl) * spiral + Math.cos(t * 0.55 + i * 0.5) * 0.008,
        );
        const s = 0.045 + rise * 0.1;
        tmp.scale.set(s, s, s);
        tmp.rotation.set(rise * 0.4, swirl * 0.35, Math.sin(swirl) * 0.2);
        tmp.updateMatrix();
        smokeRef.current.setMatrixAt(i, tmp.matrix);
      }
      smokeRef.current.instanceMatrix.needsUpdate = true;
    }
  });
  return (
    <group>
      <mesh position={[0, -0.2, 0]} material={makeBlockMaterial("Wood")}><cylinderGeometry args={[0.06, 0.06, 0.6, 10]} /></mesh>
      <mesh ref={flameRef} position={[0, 0.2, 0]} material={makeBlockMaterial("Torch", 2.2)}><sphereGeometry args={[0.12, 10, 8]} /></mesh>
      <instancedMesh ref={smokeRef} args={[undefined, undefined, smokeParticles.length]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color={"#b9b4af"}
          transparent
          opacity={0.16}
          roughness={1}
          metalness={0}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </instancedMesh>
      <pointLight ref={torchLightRef} position={[0, 0.22, 0]} intensity={baseI} distance={5.3} color={"#ff7a33"} />
    </group>
  );
}

function neighbors(blocks: Record<string, BlockType>, x: number, y: number, z: number) {
  return {
    xp: !!blocks[`${x + 1},${y},${z}`],
    xm: !!blocks[`${x - 1},${y},${z}`],
    zp: !!blocks[`${x},${y},${z + 1}`],
    zm: !!blocks[`${x},${y},${z - 1}`],
  };
}

function typedNeighbors(blocks: Record<string, BlockType>, x: number, y: number, z: number, type: BlockType) {
  return {
    xp: blocks[`${x + 1},${y},${z}`] === type,
    xm: blocks[`${x - 1},${y},${z}`] === type,
    zp: blocks[`${x},${y},${z + 1}`] === type,
    zm: blocks[`${x},${y},${z - 1}`] === type,
  };
}

function applyInstances(mesh: InstancedMesh, keys: string[]) {
  for (let i = 0; i < keys.length; i++) {
    const { x, y, z } = parseKey(keys[i]);
    tmp.position.set(x + 0.5, y + 0.5, z + 0.5);
    tmp.rotation.set(0, 0, 0);
    tmp.scale.set(1, 1, 1);
    tmp.updateMatrix();
    tmpMatrix.copy(tmp.matrix);
    mesh.setMatrixAt(i, tmpMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

function groupByType(entries: [string, BlockType][]) {
  const out = {} as Record<BlockType, string[]>;
  for (const [key, type] of entries) {
    if (!out[type]) out[type] = [];
    out[type].push(key);
  }
  return out;
}
