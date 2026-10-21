import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** A natural-looking quartz point: slightly tapered hexagonal prism with a faceted tip. */
export function crystalPointGeometry(radius = 0.35, height = 1.6, tip = 0.55) {
  const body = new THREE.CylinderGeometry(radius, radius * 0.86, height, 6, 1, false);
  body.translate(0, height / 2, 0);
  const cap = new THREE.ConeGeometry(radius, tip, 6, 1, false);
  cap.translate(0, height + tip / 2, 0);
  const merged = mergeGeometries([body.toNonIndexed(), cap.toNonIndexed()])!;
  merged.computeVertexNormals();
  merged.translate(0, -(height + tip) / 2, 0);
  return merged;
}

/** Polished tumble stone: an icosphere squashed and warped by a cheap noise. */
export function tumbleGeometry(seed = 1) {
  const g = new THREE.IcosahedronGeometry(0.5, 4);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed * 1.7) * Math.sin(v.z * 3.3 + seed * 0.6);
    v.multiplyScalar(1 + n * 0.12);
    v.y *= 0.7;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Deterministic cluster layout: [x, y, z, rotX, rotZ, scale]. */
export function clusterLayout(count = 9, spread = 0.9) {
  const out: [number, number, number, number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + i * 0.7;
    const r = i === 0 ? 0 : spread * (0.35 + ((i * 37) % 10) / 16);
    const tilt = i === 0 ? 0 : 0.35 + ((i * 13) % 7) / 14;
    out.push([Math.cos(a) * r, -0.4, Math.sin(a) * r * 0.6, Math.sin(a) * tilt, -Math.cos(a) * tilt, i === 0 ? 1.25 : 0.55 + ((i * 29) % 10) / 22]);
  }
  return out;
}
