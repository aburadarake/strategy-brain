"use client";

import { useEffect, useRef } from "react";

type V3 = [number, number, number];
type F3 = [number, number, number];

const PHI = (1 + Math.sqrt(5)) / 2;

function norm([x, y, z]: V3): V3 {
  const l = Math.sqrt(x * x + y * y + z * z);
  return [x / l, y / l, z / l];
}

// Icosahedron base (unit sphere)
const BASE_VERTS: V3[] = (
  [[-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],
   [0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],
   [PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]]
).map(v => norm(v as V3));

const BASE_FACES: F3[] = [
  [0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],
  [1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
  [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],
  [4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1],
];

function subdivide(verts: V3[], faces: F3[], depth: number): { verts: V3[]; faces: F3[] } {
  if (depth === 0) return { verts, faces };
  const cache = new Map<string, number>();
  const nv: V3[] = [...verts];
  const nf: F3[] = [];

  const mid = (a: number, b: number): number => {
    const key = `${Math.min(a, b)}_${Math.max(a, b)}`;
    if (cache.has(key)) return cache.get(key)!;
    const va = verts[a], vb = verts[b];
    const m = norm([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]);
    const i = nv.length;
    nv.push(m);
    cache.set(key, i);
    return i;
  };

  for (const [a, b, c] of faces) {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
  }
  return subdivide(nv, nf, depth - 1);
}

function ry(v: V3, a: number): V3 {
  return [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
}
function rx(v: V3, a: number): V3 {
  return [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
}
function rz(v: V3, a: number): V3 {
  return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
}
function dot(a: V3, b: V3) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
function cross(a: V3, b: V3): V3 {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
function sub(a: V3, b: V3): V3 { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }

// Precompute geometry once
const GEO = subdivide(BASE_VERTS, BASE_FACES, 3); // 20 * 4^3 = 1280 faces

export default function PolyhedronCanvas({ size = 400 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const { verts, faces } = GEO;
    const light = norm([0.55, 0.85, 0.7]);
    const light2 = norm([-0.7, -0.3, 0.5]); // rim light
    const TILT_X = 0.28;
    const TILT_Z = 0.06;
    const FOV = 3.2;
    const SCALE = size * 0.40;
    const cx = size / 2, cy = size / 2;

    let angle = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Transform all vertices
      const tfm: V3[] = verts.map(v => rz(rx(ry(v, angle), TILT_X), TILT_Z));

      type FD = { ai: number; bi: number; ci: number; depth: number; brightness: number };
      const visible: FD[] = [];

      for (const [ai, bi, ci] of faces) {
        const a = tfm[ai], b = tfm[bi], c = tfm[ci];
        const n = norm(cross(sub(b, a), sub(c, a)));
        if (n[2] < 0) continue; // back-face cull

        const depth = (a[2] + b[2] + c[2]) / 3;

        // Lighting
        const d1 = Math.max(0, dot(n, light));
        const d2 = Math.max(0, dot(n, light2)) * 0.15; // subtle rim
        const ambient = 0.04;
        const diffuse = Math.pow(d1, 1.6) + d2;
        const brightness = ambient + (1 - ambient) * Math.min(1, diffuse);

        visible.push({ ai, bi, ci, depth, brightness });
      }

      // Painter's algorithm
      visible.sort((a, b) => a.depth - b.depth);

      for (const { ai, bi, ci, brightness } of visible) {
        const proj = (v: V3): [number, number] => {
          const z = v[2] + FOV;
          return [cx + (v[0] / z) * SCALE, cy - (v[1] / z) * SCALE];
        };
        const [ax, ay] = proj(tfm[ai]);
        const [bx, by] = proj(tfm[bi]);
        const [cx2, cy2] = proj(tfm[ci]);

        const v = Math.round(brightness * 230);
        ctx.fillStyle = `rgb(${v},${v},${v})`;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx2, cy2);
        ctx.closePath();
        ctx.fill();

        // Crisp edge lines for the crystalline/origami look
        ctx.strokeStyle = `rgba(0,0,0,${0.15 + brightness * 0.1})`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }

      angle += 0.005;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
    />
  );
}
