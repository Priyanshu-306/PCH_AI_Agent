"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import AuraOrb from "./AuraOrb";
import { CrystalPoint } from "./Crystal";
import { sceneState } from "./store";
import type { Quality } from "./quality";
import { CHAKRAS } from "@/lib/crystal-colors";

/* ------------------------------------------------------------------ Section choreography */

type Look = {
  bg: [string, string];
  dark?: number;
  orb?: { x: number; y: number; s: number; o: number };
  chakra?: number;
  crystals?: number;
};

// x/y are fractions of the visible viewport; the scene blends between the looks of the
// sections currently on screen, weighted by how centred each section is.
const LOOKS: Record<string, Look> = {
  default: { bg: ["#efe6fa", "#fbf7f0"], orb: { x: 0.34, y: 0.26, s: 0.55, o: 0.45 } },
  page: { bg: ["#ece2f8", "#fbf6ee"], orb: { x: 0.32, y: 0.12, s: 0.6, o: 0.85 } },
  hero: { bg: ["#ebe0f8", "#fbf5ec"], orb: { x: 0.27, y: 0.02, s: 0.95, o: 1 } },
  intro: { bg: ["#f6efe4", "#ede3f8"], orb: { x: -0.27, y: 0.02, s: 0.75, o: 0.9 } },
  services: { bg: ["#f3edfa", "#fcf9f4"], orb: { x: 0.4, y: 0.3, s: 0.45, o: 0.5 } },
  chakra: { bg: ["#120a22", "#2b1b47"], dark: 1, orb: { x: 0, y: 0, s: 0.3, o: 0 }, chakra: 1 },
  space: { bg: ["#2b1b47", "#432c6b"], dark: 1, orb: { x: 0.4, y: -0.3, s: 0.4, o: 0 } },
  founder: { bg: ["#fcf9f4", "#efe6fa"], orb: { x: -0.36, y: 0.22, s: 0.6, o: 0.7 } },
  learn: { bg: ["#f3edfa", "#f6efe4"], orb: { x: 0.38, y: -0.2, s: 0.5, o: 0.5 } },
  testimonials: { bg: ["#ede3f8", "#f6efe4"], orb: { x: 0, y: 0, s: 1.7, o: 0.22 } },
  crystals: { bg: ["#1a1030", "#432c6b"], dark: 1, orb: { x: 0, y: 0, s: 0.3, o: 0 }, crystals: 1 },
  cta: { bg: ["#ebe0f8", "#fcf9f4"], orb: { x: 0, y: 0.04, s: 0.9, o: 0.85 } },
};

function useBlend() {
  const tmp = useMemo(
    () => ({ top: new THREE.Color(), bot: new THREE.Color(), c: new THREE.Color() }),
    [],
  );
  return () => {
    const entries = Object.entries(sceneState.weights).filter(([k, w]) => w > 0.001 && LOOKS[k]);
    let total = entries.reduce((s, [, w]) => s + w, 0);
    if (total < 0.001) {
      entries.push(["default", 1]);
      total = 1;
    }
    tmp.top.setRGB(0, 0, 0);
    tmp.bot.setRGB(0, 0, 0);
    const out = { x: 0, y: 0, s: 0, o: 0, dark: 0, chakra: 0, crystals: 0 };
    for (const [k, w0] of entries) {
      const w = w0 / total;
      const L = LOOKS[k];
      tmp.top.add(tmp.c.set(L.bg[0]).multiplyScalar(w));
      tmp.bot.add(tmp.c.set(L.bg[1]).multiplyScalar(w));
      const orb = L.orb ?? LOOKS.default.orb!;
      out.x += orb.x * w;
      out.y += orb.y * w;
      out.s += orb.s * w;
      out.o += orb.o * w;
      out.dark += (L.dark ?? 0) * w;
      out.chakra += (L.chakra ?? 0) * w0;
      out.crystals += (L.crystals ?? 0) * w0;
    }
    return { ...out, top: tmp.top, bot: tmp.bot };
  };
}

/* ------------------------------------------------------------------ Background */

const bgVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.999, 1.0); }`;
const bgFragment = /* glsl */ `
uniform vec3 uTop; uniform vec3 uBot; uniform float uTime; uniform vec2 uPointer; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  vec3 col = mix(uBot, uTop, smoothstep(0.0, 1.0, vUv.y));
  vec2 c = vec2(0.5 + uPointer.x * 0.06 + sin(uTime*0.07)*0.05, 0.62 + uPointer.y * 0.04);
  float glow = smoothstep(0.75, 0.0, distance(vUv, c));
  col += glow * 0.07;
  col += (hash(vUv * 900.0 + uTime) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}`;

function Background({ blend }: { blend: ReturnType<typeof useBlend> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTop: { value: new THREE.Color("#ebe0f8") }, uBot: { value: new THREE.Color("#fbf5ec") }, uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() } }),
    [],
  );
  useFrame((_, dt) => {
    const b = blend();
    const k = 1 - Math.pow(0.02, dt);
    uniforms.uTop.value.lerp(b.top, k);
    uniforms.uBot.value.lerp(b.bot, k);
    uniforms.uTime.value += dt;
    uniforms.uPointer.value.lerp(new THREE.Vector2(sceneState.pointer.x, sceneState.pointer.y), k);
  });
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={bgVertex} fragmentShader={bgFragment} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ Stardust */

const dustVertex = /* glsl */ `
attribute float aSize; attribute float aSeed; uniform float uTime; uniform float uPixel;
varying float vSeed;
void main(){
  vec3 p = position;
  p.y += mod(uTime * (0.05 + aSeed * 0.08) + aSeed * 10.0, 12.0) - 6.0;
  p.x += sin(uTime * 0.3 + aSeed * 6.28) * 0.15;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * uPixel * (6.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
  vSeed = aSeed;
}`;
const dustFragment = /* glsl */ `
uniform float uDark; uniform float uTime; varying float vSeed;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  float twinkle = 0.6 + 0.4 * sin(uTime * (1.0 + vSeed * 2.0) + vSeed * 30.0);
  vec3 light = mix(vec3(0.62, 0.5, 0.83), vec3(0.79, 0.64, 0.15), step(0.6, vSeed));
  vec3 dark = mix(vec3(1.0, 0.93, 0.75), vec3(0.85, 0.78, 1.0), step(0.5, vSeed));
  gl_FragColor = vec4(mix(light, dark, uDark), a * twinkle * mix(0.55, 0.95, uDark));
}`;

function Stardust({ count, blend }: { count: number; blend: ReturnType<typeof useBlend> }) {
  const group = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const [geo, uniforms] = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = -Math.random() * 8 + 1.5;
      size[i] = 1.5 + Math.random() * 4;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return [g, { uTime: { value: 0 }, uDark: { value: 0 }, uPixel: { value: Math.min(gl.getPixelRatio(), 2) } }];
  }, [count, gl]);
  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    uniforms.uDark.value = THREE.MathUtils.damp(uniforms.uDark.value, blend().dark, 3, dt);
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, sceneState.pointer.x * 0.12, 2, dt);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -sceneState.pointer.y * 0.06, 2, dt);
    }
  });
  return (
    <group ref={group}>
      <points geometry={geo} frustumCulled={false}>
        <shaderMaterial uniforms={uniforms} vertexShader={dustVertex} fragmentShader={dustFragment} transparent depthWrite={false} />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ Orb + chakras + crystals */

function Orb({ blend, q }: { blend: ReturnType<typeof useBlend>; q: Quality }) {
  const ref = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const opacity = useRef(1);
  useFrame((_, dt) => {
    const b = blend();
    const narrow = viewport.aspect < 0.85;
    const x = (narrow ? b.x * 0.3 : b.x) * viewport.width;
    const heroLift = narrow ? (sceneState.weights.hero ?? 0) * 0.27 : 0;
    const y = (b.y + heroLift) * viewport.height;
    const s = b.s * Math.min(viewport.width, viewport.height) * (narrow ? 0.27 : 0.3);
    const g = ref.current!;
    g.position.x = THREE.MathUtils.damp(g.position.x, x + sceneState.pointer.x * 0.15, 2.4, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, y + sceneState.pointer.y * 0.1, 2.4, dt);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, Math.max(s, 0.01), 2.4, dt));
    // On narrow screens the orb sits behind text, so keep it faint outside the hero and closing sections.
    const focus = narrow ? Math.max(sceneState.weights.hero ?? 0, sceneState.weights.cta ?? 0, 0.35) : 1;
    opacity.current = THREE.MathUtils.damp(opacity.current, b.o * focus, 3, dt);
  });
  return (
    <group ref={ref}>
      <AuraOrb detail={q.tier === "high" ? 48 : 20} opacity={() => opacity.current} animate={!q.reducedMotion} />
    </group>
  );
}

function ChakraColumn({ blend }: { blend: ReturnType<typeof useBlend> }) {
  const group = useRef<THREE.Group>(null);
  const orbs = useRef<(THREE.Mesh | null)[]>([]);
  const glows = useRef<(THREE.Mesh | null)[]>([]);
  const { viewport } = useThree();
  const vis = useRef(0);
  useFrame((state, dt) => {
    const b = blend();
    vis.current = THREE.MathUtils.damp(vis.current, Math.min(1, b.chakra * 1.4), 4, dt);
    const g = group.current!;
    g.visible = vis.current > 0.01;
    if (!g.visible) return;
    const narrow = viewport.aspect < 0.85;
    g.position.x = narrow ? 0 : viewport.width * 0.22;
    const spacing = viewport.height * (narrow ? 0.1 : 0.115);
    const active = sceneState.chakra;
    CHAKRAS.forEach((_, i) => {
      const m = orbs.current[i];
      const gl = glows.current[i];
      if (!m || !gl) return;
      const near = Math.max(0, 1 - Math.abs(active - i - 0.5));
      m.position.y = gl.position.y = (i - 3) * spacing;
      const s = (0.16 + near * 0.16) * Math.min(1.2, viewport.height / 5) * (1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.03);
      m.scale.setScalar(s);
      gl.scale.setScalar(s * (6 + near * 6));
      (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + near * 2.4;
      (m.material as THREE.MeshStandardMaterial).opacity = vis.current * (narrow ? 0.55 : 1);
      (gl.material as THREE.MeshBasicMaterial).opacity = vis.current * (0.18 + near * 0.5) * (narrow ? 0.6 : 1);
    });
  });
  return (
    <group ref={group}>
      {CHAKRAS.map((c, i) => (
        <group key={c.key}>
          <mesh ref={(el) => void (glows.current[i] = el)}>
            <planeGeometry />
            <meshBasicMaterial color={c.color} transparent depthWrite={false} blending={THREE.AdditiveBlending} alphaMap={glowTexture()} />
          </mesh>
          <mesh ref={(el) => void (orbs.current[i] = el)}>
            <sphereGeometry args={[1, 48, 48]} />
            <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={1} roughness={0.25} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
}

let _glow: THREE.Texture | null = null;
function glowTexture() {
  if (_glow) return _glow;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.25, "#bbb");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  _glow = new THREE.CanvasTexture(c);
  return _glow;
}

function CrystalRing({ blend, colors, q }: { blend: ReturnType<typeof useBlend>; colors: string[]; q: Quality }) {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const vis = useRef(0);
  useFrame((_, dt) => {
    const b = blend();
    vis.current = THREE.MathUtils.damp(vis.current, THREE.MathUtils.smoothstep(b.crystals, 0.35, 0.8), 3, dt);
    const g = group.current!;
    g.visible = vis.current > 0.01;
    if (!g.visible) return;
    const narrow = viewport.aspect < 0.85;
    const base = Math.min(viewport.width, viewport.height) * (narrow ? 0.17 : 0.14);
    g.scale.setScalar(base * (0.6 + vis.current * 0.4));
    g.position.set(narrow ? 0 : viewport.width * 0.22, narrow ? viewport.height * 0.24 : viewport.height * 0.06, 0);
    if (!q.reducedMotion) g.rotation.y += dt * 0.25;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.25 - sceneState.pointer.y * 0.2, 2, dt);
  });
  const n = Math.max(colors.length, 5);
  return (
    <group ref={group}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <Float key={i} speed={q.reducedMotion ? 0 : 1.4} rotationIntensity={0.6} floatIntensity={0.8}>
            <CrystalPoint color={colors[i % colors.length]} tier={q.tier} position={[Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5]} rotation={[0.2, a, 0.15]} scale={0.75 + (i % 3) * 0.12} />
          </Float>
        );
      })}
      <CrystalPoint color="#f4eefe" tier={q.tier} scale={1.25} />
    </group>
  );
}

/* ------------------------------------------------------------------ Canvas */

function Scene({ q, crystalColors }: { q: Quality; crystalColors: string[] }) {
  const blend = useBlend();
  return (
    <>
      <Background blend={blend} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color="#fff4e6" />
      <pointLight position={[-4, -2, 3]} intensity={18} color="#b39ae0" />
      <Environment resolution={q.tier === "high" ? 256 : 64} frames={1}>
        <Lightformer form="rect" intensity={4} color="#fff" position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer form="ring" intensity={3} color="#e0bf5c" position={[-4, 1, 2]} scale={2.5} />
        <Lightformer form="rect" intensity={2.5} color="#b39ae0" position={[4, -1, 1]} scale={[3, 6, 1]} />
        <Lightformer form="circle" intensity={2} color="#f2c6d4" position={[0, -4, 3]} scale={3} />
      </Environment>
      <Stardust count={q.tier === "high" ? 1400 : 450} blend={blend} />
      <Orb blend={blend} q={q} />
      <ChakraColumn blend={blend} />
      <CrystalRing blend={blend} colors={crystalColors} q={q} />
      {q.tier === "high" && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={0.7} />
        </EffectComposer>
      )}
    </>
  );
}

export default function HealingScene({ q, crystalColors }: { q: Quality; crystalColors: string[] }) {
  return (
    <Canvas
      dpr={q.tier === "high" ? [1, 1.75] : [1, 1.25]}
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: q.tier === "high", powerPreference: "high-performance", alpha: false }}
      onCreated={({ gl }) => gl.setClearColor("#f3edfa")}
    >
      <Scene q={q} crystalColors={crystalColors} />
    </Canvas>
  );
}
