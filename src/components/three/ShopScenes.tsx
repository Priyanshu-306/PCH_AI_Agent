"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, OrbitControls, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { Bracelet, CrystalMaterial, CrystalPoint, TumbleStone } from "./Crystal";
import { clusterLayout, crystalPointGeometry } from "./geometry";
import { sceneState } from "./store";
import type { Quality } from "./quality";

function Studio({ q }: { q: Quality }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <pointLight position={[-3, -1, 2]} intensity={25} color="#a983e6" />
      <pointLight position={[3, 1, -2]} intensity={18} color="#f2c6d4" />
      <Environment resolution={q.tier === "high" ? 256 : 64} frames={1}>
        <Lightformer form="rect" intensity={5} position={[0, 5, 2]} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={4} color="#e0bf5c" position={[-4, 0, 3]} scale={3} />
        <Lightformer form="rect" intensity={3} color="#a983e6" position={[5, 0, 0]} scale={[2, 8, 1]} />
        <Lightformer form="circle" intensity={3} color="#f2c6d4" position={[0, -5, 2]} scale={4} />
      </Environment>
    </>
  );
}

/** A geode-like cluster of crystal points. */
function Cluster({ color, q }: { color: string; q: Quality }) {
  const geo = useMemo(() => crystalPointGeometry(0.3, 1.5, 0.5), []);
  const layout = useMemo(() => clusterLayout(11, 1.1), []);
  return (
    <group>
      {layout.map(([x, y, z, rx, rz, s], i) => (
        <mesh key={i} geometry={geo} position={[x, y + 0.9 * s, z]} rotation={[rx, i, rz]} scale={s}>
          <CrystalMaterial color={i % 4 === 0 ? "#efe6ff" : color} tier={q.tier} />
        </mesh>
      ))}
      <mesh position={[0, -0.5, 0]} scale={[1.25, 0.28, 0.95]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#1c1230" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function HeroRig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * 0.12;
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -sceneState.pointer.y * 0.15, 2, dt);
    g.current.position.x = THREE.MathUtils.damp(g.current.position.x, sceneState.pointer.x * 0.2, 2, dt);
    // Gentle scroll parallax.
    g.current.position.y = THREE.MathUtils.damp(g.current.position.y, -Math.min(scrollY / innerHeight, 1.2) * 1.4, 4, dt);
  });
  return <group ref={g}>{children}</group>;
}

export function ShopHeroScene({ q, colors }: { q: Quality; colors: string[] }) {
  return (
    <Canvas dpr={q.tier === "high" ? [1, 1.75] : [1, 1.25]} camera={{ position: [0, 0.6, 6.2], fov: 38 }} gl={{ antialias: q.tier === "high", alpha: true }}>
      <Studio q={q} />
      <HeroRig>
        <Float speed={q.reducedMotion ? 0 : 1.2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Cluster color={colors[0] ?? "#9b6ad6"} q={q} />
        </Float>
        {colors.slice(1, 6).map((c, i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <Float key={i} speed={q.reducedMotion ? 0 : 2} rotationIntensity={1.2} floatIntensity={1.4}>
              <TumbleStone color={c} tier={q.tier} seed={i + 1} scale={0.42} position={[Math.cos(a) * 1.9, 0.5 + Math.sin(i * 1.7) * 0.9, Math.sin(a) * 1.2]} />
            </Float>
          );
        })}
      </HeroRig>
      <Sparkles count={q.tier === "high" ? 90 : 35} scale={[9, 5, 4]} size={3} speed={0.35} color="#f2e6ff" />
      {q.tier === "high" && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.7} intensity={0.8} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/** Interactive, illustrative 3D preview on the product page; shape follows the category. */
export function ProductViewerScene({ q, color, colors, category }: { q: Quality; color: string; colors: string[]; category: string }) {
  const c = category.toLowerCase();
  let model: React.ReactNode;
  if (c.includes("bracelet")) model = <Bracelet colors={colors} count={20} radius={1.15} bead={0.17} />;
  else if (c.includes("mala")) model = <Bracelet colors={colors} count={54} radius={1.35} bead={0.075} />;
  else if (c.includes("tumble") || c.includes("kit")) {
    model = (
      <group>
        {colors.slice(0, 5).map((col, i) => (
          <TumbleStone key={i} color={col} tier={q.tier} seed={i + 2} scale={0.75} position={[(i - (Math.min(colors.length, 5) - 1) / 2) * 0.75, Math.sin(i) * 0.15, (i % 2) * 0.3]} />
        ))}
      </group>
    );
  } else if (c.includes("sphere")) {
    model = (
      <mesh>
        <sphereGeometry args={[1.1, 64, 64]} />
        <CrystalMaterial color={color} tier={q.tier} />
      </mesh>
    );
  } else if (c.includes("pyramid")) {
    model = (
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.25, 1.6, 4]} />
        <CrystalMaterial color={color} tier={q.tier} />
      </mesh>
    );
  } else if (c.includes("cluster") || c.includes("geode") || c.includes("raw") || c.includes("tree")) model = <Cluster color={color} q={q} />;
  else model = <CrystalPoint color={color} tier={q.tier} scale={1.25} />;

  return (
    <Canvas dpr={q.tier === "high" ? [1, 2] : [1, 1.5]} camera={{ position: [0, 0.4, 4.6], fov: 40 }} gl={{ antialias: true, alpha: true }}>
      <Studio q={q} />
      <Float speed={q.reducedMotion ? 0 : 1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        {model}
      </Float>
      <OrbitControls enablePan={false} enableZoom={false} autoRotate={!q.reducedMotion} autoRotateSpeed={1.2} />
      <Sparkles count={30} scale={[5, 4, 3]} size={2.5} speed={0.3} color="#fff" />
    </Canvas>
  );
}
