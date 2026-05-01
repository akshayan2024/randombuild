import React, { useMemo } from "react";
import { InstancedMesh, Matrix3, Matrix4, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { useBuildStore } from "../state/buildStore";
import { blockColor, type BlockType } from "../game/blocks";
import { parseKey } from "../game/grid";

const tmp = new Object3D();
const tmpMatrix = new Matrix4();
const tmpNormalMatrix = new Matrix3();
const tmpNormal = new Vector3();

export function Blocks() {
  const blocks = useBuildStore((s) => s.blocks);

  const entries = useMemo(() => Object.entries(blocks), [blocks]);
  const byType = useMemo(() => groupByType(entries), [entries]);

  return (
    <>
      {Object.entries(byType).map(([type, list]) => (
        <BlocksOfType key={type} type={type as BlockType} keys={list} />
      ))}
    </>
  );
}

function BlocksOfType(props: { type: BlockType; keys: string[] }) {
  const removeBlock = useBuildStore((s) => s.removeBlock);
  const selected = useBuildStore((s) => s.selectedBlock);
  const hasBlock = useBuildStore((s) => s.hasBlock);
  const commitBlockAt = useBuildStore((s) => s.commitBlockAt);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: blockColor(props.type),
        roughness: 0.85,
        metalness: 0.0,
        transparent: props.type === "Glass",
        opacity: props.type === "Glass" ? 0.5 : 1,
      }),
    [props.type],
  );

  const count = props.keys.length;

  return (
    <instancedMesh
      args={[undefined, material, count]}
      castShadow
      receiveShadow
      onContextMenu={(e) => e.nativeEvent.preventDefault()}
      onPointerDown={(e) => {
        const index = e.instanceId ?? -1;
        if (index < 0 || index >= props.keys.length) return;
        const pos = parseKey(props.keys[index]);

        // Right click: remove
        if (e.button === 2) {
          e.stopPropagation();
          removeBlock(pos);
          return;
        }

        // Left click: place adjacent on the clicked face
        if (e.button === 0) {
          e.stopPropagation();
          const faceNormal = e.face?.normal;
          if (!faceNormal) return;

          // face normal is in local space; convert to world-ish axis direction
          // (our cubes are axis-aligned, so this becomes a clean +/- axis)
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
        }
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
  const out: Record<BlockType, string[]> = {
    Wall: [],
    Wood: [],
    Glass: [],
    Roof: [],
  };
  for (const [key, type] of entries) out[type].push(key);
  return out;
}
