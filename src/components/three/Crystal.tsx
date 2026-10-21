"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { crystalPointGeometry, tumbleGeometry } from "./geometry";

type MatProps = { color: string; tier: "high" | "low"; opacity?: number };

/** Refractive crystal material. Uses three's shared transmission pass so many crystals stay cheap. */
export function CrystalMaterial({ color, tier, opacity = 1 }: MatProps) {
  const c = new THREE.Color(color);
  const pale = c.getHSL({ h: 0, s: 0, l: 0 }).l > 0.82;
  return (
    <meshPhysicalMaterial
      color={color}
      attenuationColor={color}
      attenuationDistance={pale ? 4 : 1.1}
      transmission={tier === "high" ? 0.92 : 0.6}
      thickness={1.1}
      roughness={0.06}
      metalness={0}
      ior={1.54}
      iridescence={0.5}
      iridescenceIOR={1.3}
      clearcoat={1}
      clearcoatRoughness={0.05}
      envMapIntensity={1.4}
      specularIntensity={1}
      flatShading
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

export function CrystalPoint({ color, tier, scale = 1, ...rest }: MatProps & { scale?: number } & React.ComponentProps<"group">) {
  const geo = useMemo(() => crystalPointGeometry(), []);
  return (
    <group {...rest}>
      <mesh geometry={geo} scale={scale} castShadow>
        <CrystalMaterial color={color} tier={tier} />
      </mesh>
    </group>
  );
}

export function TumbleStone({ color, tier, seed = 1, scale = 1, ...rest }: MatProps & { seed?: number; scale?: number } & React.ComponentProps<"group">) {
  const geo = useMemo(() => tumbleGeometry(seed), [seed]);
  return (
    <group {...rest}>
      <mesh geometry={geo} scale={scale}>
        <meshPhysicalMaterial color={color} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} transmission={tier === "high" ? 0.35 : 0} thickness={0.6} envMapIntensity={1.2} />
      </mesh>
    </group>
  );
}

/** A bracelet: beads on an invisible cord, instanced for performance. */
export function Bracelet({ colors, count = 20, radius = 1, bead = 0.15 }: { colors: string[]; count?: number; radius?: number; bead?: number }) {
  return (
    <group rotation={[Math.PI / 2.6, 0, 0]}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]}>
            <sphereGeometry args={[bead, 32, 32]} />
            <meshPhysicalMaterial color={colors[i % colors.length]} roughness={0.1} clearcoat={1} envMapIntensity={1.3} />
          </mesh>
        );
      })}
    </group>
  );
}
