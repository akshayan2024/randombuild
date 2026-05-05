import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group } from "three";
import { useEnvironmentStore, getSeason } from "../state/environmentStore";
import { useTimerStore } from "../state/timerStore";
import { useWindStore } from "../state/windStore";

// Season fog config: [color, near, far]
const SEASON_FOG: Record<string, [string, number, number]> = {
  Spring: ["#c8f0d8", 40, 120],
  Summer: ["#e8f4ff", 60, 180],
  Autumn: ["#d4a87a", 20, 80],
  Winter: ["#dce8f0", 10, 60],
};

function makeGroundTexture(baseHex: string, noiseAmount: number, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < size * size * 0.42; i += 1) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const alpha = 0.02 + Math.random() * noiseAmount;
    const shade = 95 + Math.floor(Math.random() * 55);
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.needsUpdate = true;
  return tex;
}

export function GameEnvironment() {
  const advanceTime = useEnvironmentStore((s) => s.advanceTime);
  const timeSpeed = useEnvironmentStore((s) => s.timeSpeed);
  const timeOfDay = useEnvironmentStore((s) => s.timeOfDay);
  const day = useEnvironmentStore((s) => s.day);
  const tick = useTimerStore((s) => s.tick);
  const tickWind = useWindStore((s) => s.tickWind);
  const windStrength = useWindStore((s) => s.windStrength);

  const terrainRef = useRef<Group | null>(null);

  useFrame((_, delta) => {
    advanceTime(delta * timeSpeed);
    tick(delta);
    tickWind(delta);
  });

  useFrame(({ camera }) => {
    if (!terrainRef.current) return;
    // Floating terrain origin: keeps depth precision stable and removes flicker.
    terrainRef.current.position.x = Math.floor(camera.position.x / 100) * 100;
    terrainRef.current.position.z = Math.floor(camera.position.z / 100) * 100;
  });

  const season = getSeason(day);

  // Sun arc: theta 0 = 6am, PI = 6pm
  const theta = (timeOfDay - 6) * (Math.PI / 12);
  const sunDistance = 50;
  const sunX = Math.cos(theta) * sunDistance;
  const sunY = Math.max(Math.sin(theta) * sunDistance, -10);
  const sunZ = Math.sin(theta) * (sunDistance / 2);
  const isNight = timeOfDay < 6 || timeOfDay > 18;

  const lightIntensity = Math.max(0.05, Math.sin(theta)) * 1.5;
  const ambientIntensity = isNight ? 0.12 : 0.38;
  const windFogBoost = windStrength * 12;
  const dewWetness = Math.max(0, 1 - Math.abs(12 - timeOfDay) / 12) * 0.25;
  const seasonalMoisture = season === "Winter" ? 0.6 : season === "Spring" ? 0.45 : season === "Autumn" ? 0.32 : 0.2;
  const soilWetness = Math.min(1, seasonalMoisture + dewWetness);

  const grassColor =
    season === "Winter" ? "#dfe8ee" : season === "Autumn" ? "#b98949" : season === "Spring" ? "#80cc57" : "#4CAF50";

  const soilColor =
    season === "Winter" ? "#6d6f73" : season === "Autumn" ? "#7a4f35" : season === "Spring" ? "#6d4f2e" : "#5d4037";
  const grassAccentColor =
    season === "Winter" ? "#c7d4de" : season === "Autumn" ? "#d7b06d" : season === "Spring" ? "#8fd967" : "#74c45f";
  const grassEdgeTint = season === "Autumn" ? "#8c6a39" : season === "Winter" ? "#b8c6d1" : "#5e9540";

  const [fogColor, fogNear, fogFar] = SEASON_FOG[season];
  // Denser fog at night
  const effectiveFar = isNight ? fogFar * 0.55 : fogFar - windFogBoost;
  const effectiveNear = isNight ? fogNear * 0.5 : fogNear;

  const grassTexture = useMemo(() => makeGroundTexture(grassColor, 0.09), [grassColor]);
  const soilTexture = useMemo(() => makeGroundTexture(soilColor, 0.06), [soilColor]);

  return (
    <>
      {/* Seasonal linear fog applied to the whole scene */}
      <fog attach="fog" args={[fogColor, effectiveNear, effectiveFar]} />

      {/* Sky */}
      <Sky distance={450000} sunPosition={[sunX, sunY, sunZ]} inclination={0} azimuth={0.25} />
      {isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}

      {/* Lighting */}
      <ambientLight intensity={ambientIntensity} />

      {!isNight && (
        <directionalLight
          position={[sunX, sunY, sunZ]}
          intensity={lightIntensity}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
      )}
      {isNight && (
        <directionalLight
          position={[-sunX, Math.max(-sunY, 10), -sunZ]}
          intensity={0.18}
          color="#aaccff"
          castShadow
        />
      )}

      {/* Distant spherical world body to create a planet-horizon feel */}
      <group>
        <mesh position={[0, -120, 0]} receiveShadow>
          <sphereGeometry args={[120, 96, 96]} />
          <meshStandardMaterial color="#2f78b8" roughness={0.94} metalness={0.01} />
        </mesh>
        <mesh position={[0, -120, 0]}>
          <sphereGeometry args={[121.6, 64, 64]} />
          <meshStandardMaterial color="#8dbbf0" transparent opacity={isNight ? 0.06 : 0.16} />
        </mesh>
      </group>

      {/* Camera-following terrain tiles to avoid z-fighting/flicker at huge world scales */}
      <group ref={terrainRef} position={[0, -0.5, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[700, 1, 700]} />
          <meshStandardMaterial
            color={grassColor}
            roughness={0.84}
            metalness={0.03}
            map={grassTexture ?? undefined}
          />
        </mesh>
        <mesh position={[0, 0.012, 0]} receiveShadow>
          <boxGeometry args={[19900, 0.02, 19900]} />
          <meshStandardMaterial color={grassAccentColor} roughness={0.78} metalness={0.03} transparent opacity={0.2} />
        </mesh>
        <mesh position={[0, 0.006, 0]} receiveShadow>
          <ringGeometry args={[9100, 9990, 96]} />
          <meshStandardMaterial color={grassEdgeTint} roughness={0.9} metalness={0} transparent opacity={0.12} />
        </mesh>

        <mesh position={[0, -0.7, 0]} receiveShadow>
          <boxGeometry args={[705, 0.38, 705]} />
          <meshStandardMaterial color="#806246" roughness={0.96} metalness={0} />
        </mesh>

        <mesh position={[0, -2, 0]} receiveShadow>
          <boxGeometry args={[710, 3, 710]} />
          <meshStandardMaterial
            color={soilColor}
            roughness={0.98 - soilWetness * 0.28}
            metalness={0.01 + soilWetness * 0.07}
            map={soilTexture ?? undefined}
          />
        </mesh>
      </group>
    </>
  );
}
