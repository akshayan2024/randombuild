import React, { useMemo } from "react";
import { GridHelper } from "three";

export function Grid() {
  const grid = useMemo(() => new GridHelper(100, 100, 0x444444, 0x222222), []);
  return <primitive object={grid} />;
}

