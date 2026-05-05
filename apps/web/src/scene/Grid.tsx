import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { GridHelper } from "three";

export function Grid() {
  const grid = useMemo(() => new GridHelper(1200, 1200, 0x444444, 0x222222), []);
  const ref = useRef<GridHelper | null>(null);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    // Keep grid centered near camera so the world feels explorable/infinite.
    ref.current.position.x = Math.floor(camera.position.x / 50) * 50;
    ref.current.position.z = Math.floor(camera.position.z / 50) * 50;
  });
  return <primitive ref={ref} object={grid} />;
}

