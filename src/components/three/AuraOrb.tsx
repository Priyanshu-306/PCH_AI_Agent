"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Ashima Arts 3D simplex noise (MIT).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vertex = /* glsl */ `
uniform float uTime; uniform float uAmp;
varying vec3 vNormal; varying vec3 vView; varying float vNoise;
${NOISE}
void main(){
  float n = snoise(normal * 1.1 + vec3(uTime * 0.18));
  float n2 = snoise(normal * 2.6 - vec3(uTime * 0.28)) * 0.3;
  vNoise = n + n2;
  vec3 pos = position + normal * (n * 0.075 + n2 * 0.025) * uAmp;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vView = normalize(-mv.xyz);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

const fragment = /* glsl */ `
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform float uOpacity;
varying vec3 vNormal; varying vec3 vView; varying float vNoise;
void main(){
  float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.6);
  vec3 col = mix(uA, uB, smoothstep(-0.7, 0.9, vNoise));
  col = mix(col, uC, smoothstep(0.35, 1.0, fres) * 0.45);
  col += vec3(1.0, 0.97, 0.94) * pow(fres, 5.0) * 0.35;
  float alpha = mix(0.82, 0.25, smoothstep(0.55, 1.0, fres));
  gl_FragColor = vec4(col, alpha * uOpacity);
}`;

const glowFragment = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
void main(){ float d = distance(vUv, vec2(.5)); float a = smoothstep(.5, .0, d); gl_FragColor = vec4(uColor, a * a * uOpacity); }`;
const glowVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`;

type Props = {
  detail?: number;
  colors?: [string, string, string];
  /** Called every frame; return opacity 0..1. Lets the parent drive visibility from scroll. */
  opacity?: () => number;
  animate?: boolean;
};

/** Breathing, iridescent energy orb with a soft halo. */
export default function AuraOrb({ detail = 48, colors = ["#9b7fd4", "#f2c6d4", "#e0bf5c"], opacity, animate = true }: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const glow = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 1 },
      uOpacity: { value: 1 },
      uA: { value: new THREE.Color(colors[0]) },
      uB: { value: new THREE.Color(colors[1]) },
      uC: { value: new THREE.Color(colors[2]) },
    }),
    [colors],
  );
  const glowUniforms = useMemo(() => ({ uColor: { value: new THREE.Color(colors[0]) }, uOpacity: { value: 0.7 } }), [colors]);

  useFrame((state, dt) => {
    const o = opacity ? opacity() : 1;
    if (mat.current) {
      if (animate) mat.current.uniforms.uTime.value += dt;
      mat.current.uniforms.uOpacity.value = o;
    }
    if (glow.current) glow.current.uniforms.uOpacity.value = 0.7 * o;
    if (mesh.current && animate) mesh.current.rotation.y += dt * 0.08;
    if (mesh.current) mesh.current.visible = o > 0.01;
  });

  return (
    <group>
      <mesh scale={3.6} renderOrder={-1}>
        <planeGeometry />
        <shaderMaterial ref={glow} uniforms={glowUniforms} vertexShader={glowVertex} fragmentShader={glowFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, detail]} />
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}
