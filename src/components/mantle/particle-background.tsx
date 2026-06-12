"use client";

import { useEffect, useRef } from "react";

// Particle-network animation for the Mantle explorer hero. Primary path uses
// Three.js (WebGL); when WebGL is unavailable it falls back to an equivalent
// Canvas 2D renderer. Nodes drift freely and link to nearby neighbours.
//
// Mounting this component also switches the page into the dark theme (adds
// `theme-dark` to <body>) so the fixed full-viewport canvas sits behind the
// gradient background. Both are reverted on unmount.
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext) return;

    document.body.classList.add("theme-dark");

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let teardown: (() => void) | null = null;
    let cancelled = false;

    function webglAvailable(): boolean {
      try {
        const c = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (c.getContext("webgl") || c.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    }

    // ---- shared render loop ----
    function runLoop(frame: (step: number) => void): () => void {
      if (reduce) {
        frame(1);
        return () => {};
      }
      let rafId = 0;
      let last = 0;
      const loop = (now: number) => {
        let step = last ? (now - last) / 16.6667 : 1;
        last = now;
        if (step > 3) step = 3; // clamp after stalls so particles never teleport
        frame(step);
        rafId = requestAnimationFrame(loop);
      };
      const onVisibility = () => {
        if (document.hidden) {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        } else if (!rafId) {
          last = 0; // resync timing on resume
          rafId = requestAnimationFrame(loop);
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      rafId = requestAnimationFrame(loop);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    // ---- Three.js (WebGL) path ----
    async function startWebGL(): Promise<() => void> {
      const THREE = await import("three");

      function circleTexture() {
        const c = document.createElement("canvas");
        c.width = c.height = 64;
        const ctx = c.getContext("2d")!;
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.3, "rgba(208,200,255,0.85)");
        g.addColorStop(1, "rgba(150,135,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      }

      let width = window.innerWidth;
      let height = window.innerHeight;

      const renderer = new THREE.WebGLRenderer({ canvas: canvas!, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearAlpha(0);
      renderer.setSize(width, height, false);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
      camera.position.set(0, 0, 70);

      const BX = 96;
      const BY = 60;
      const BZ = 36;
      const COUNT = window.innerWidth < 760 ? 60 : 130;
      const LINK = 18;

      const positions = new Float32Array(COUNT * 3);
      const vels: number[][] = [];
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() * 2 - 1) * BX;
        positions[i * 3 + 1] = (Math.random() * 2 - 1) * BY;
        positions[i * 3 + 2] = (Math.random() * 2 - 1) * BZ;
        vels.push([
          (Math.random() * 2 - 1) * 0.05,
          (Math.random() * 2 - 1) * 0.05,
          (Math.random() * 2 - 1) * 0.05,
        ]);
      }

      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        size: 2.8,
        map: circleTexture(),
        color: 0xbfb4ff,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(pGeo, pMat);
      scene.add(points);

      const maxV = COUNT * COUNT + COUNT * 4;
      const lPos = new Float32Array(maxV * 3);
      const lCol = new Float32Array(maxV * 3);
      const lGeo = new THREE.BufferGeometry();
      lGeo.setAttribute("position", new THREE.BufferAttribute(lPos, 3));
      lGeo.setAttribute("color", new THREE.BufferAttribute(lCol, 3));
      const lMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const lines = new THREE.LineSegments(lGeo, lMat);
      scene.add(lines);

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      window.addEventListener("resize", resize);
      camera.lookAt(0, 0, 0);

      const frame = (step: number) => {
        for (let i = 0; i < COUNT; i++) {
          const ix = i * 3;
          const iy = ix + 1;
          const iz = ix + 2;
          positions[ix] += vels[i][0] * step;
          positions[iy] += vels[i][1] * step;
          positions[iz] += vels[i][2] * step;
          if (positions[ix] > BX || positions[ix] < -BX) vels[i][0] *= -1;
          if (positions[iy] > BY || positions[iy] < -BY) vels[i][1] *= -1;
          if (positions[iz] > BZ || positions[iz] < -BZ) vels[i][2] *= -1;
        }
        pGeo.attributes.position.needsUpdate = true;

        let v = 0;
        for (let a = 0; a < COUNT; a++) {
          const ax = positions[a * 3];
          const ay = positions[a * 3 + 1];
          const az = positions[a * 3 + 2];
          for (let b = a + 1; b < COUNT; b++) {
            const bx = positions[b * 3];
            const by = positions[b * 3 + 1];
            const bz = positions[b * 3 + 2];
            const ex = ax - bx;
            const ey = ay - by;
            const ez = az - bz;
            const dd = Math.sqrt(ex * ex + ey * ey + ez * ez);
            if (dd < LINK && v < maxV - 2) {
              const t = 1 - dd / LINK;
              lPos[v * 3] = ax;
              lPos[v * 3 + 1] = ay;
              lPos[v * 3 + 2] = az;
              lCol[v * 3] = 0.45 * t;
              lCol[v * 3 + 1] = 0.38 * t;
              lCol[v * 3 + 2] = 0.85 * t;
              v++;
              lPos[v * 3] = bx;
              lPos[v * 3 + 1] = by;
              lPos[v * 3 + 2] = bz;
              lCol[v * 3] = 0.45 * t;
              lCol[v * 3 + 1] = 0.38 * t;
              lCol[v * 3 + 2] = 0.85 * t;
              v++;
            }
          }
        }
        lGeo.setDrawRange(0, v);
        lGeo.attributes.position.needsUpdate = true;
        lGeo.attributes.color.needsUpdate = true;

        renderer.render(scene, camera);
      };

      const stopLoop = runLoop(frame);
      return () => {
        stopLoop();
        window.removeEventListener("resize", resize);
        pGeo.dispose();
        pMat.dispose();
        lGeo.dispose();
        lMat.dispose();
        renderer.dispose();
      };
    }

    // ---- Canvas 2D fallback path ----
    function start2D(): () => void {
      const ctx = canvas!.getContext("2d");
      if (!ctx) return () => {};

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = 0;
      let h = 0;
      const resize = () => {
        w = window.innerWidth;
        h = window.innerHeight;
        canvas!.width = Math.floor(w * dpr);
        canvas!.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize);

      const COUNT = w < 760 ? 55 : 120;
      const LINK = 150;
      const nodes: Array<{ x: number; y: number; vx: number; vy: number }> = [];
      for (let i = 0; i < COUNT; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() * 2 - 1) * 0.35,
          vy: (Math.random() * 2 - 1) * 0.35,
        });
      }

      const frame = (step: number) => {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";

        for (let i = 0; i < COUNT; i++) {
          const n = nodes[i];
          n.x += n.vx * step;
          n.y += n.vy * step;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
          n.x = Math.max(0, Math.min(w, n.x));
          n.y = Math.max(0, Math.min(h, n.y));
        }

        ctx.lineWidth = 1;
        for (let a = 0; a < COUNT; a++) {
          for (let b = a + 1; b < COUNT; b++) {
            const dx = nodes[a].x - nodes[b].x;
            const dy = nodes[a].y - nodes[b].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < LINK) {
              ctx.strokeStyle = `rgba(140,125,225,${((1 - d / LINK) * 0.45).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(nodes[a].x, nodes[a].y);
              ctx.lineTo(nodes[b].x, nodes[b].y);
              ctx.stroke();
            }
          }
        }

        for (let j = 0; j < COUNT; j++) {
          const p = nodes[j];
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4);
          g.addColorStop(0, "rgba(214,206,255,0.95)");
          g.addColorStop(1, "rgba(150,135,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      const stopLoop = runLoop(frame);
      return () => {
        stopLoop();
        window.removeEventListener("resize", resize);
      };
    }

    async function init() {
      if (!webglAvailable()) {
        teardown = start2D();
        return;
      }
      try {
        const stop = await startWebGL();
        if (cancelled) {
          stop();
        } else {
          teardown = stop;
        }
      } catch {
        if (!cancelled) teardown = start2D();
      }
    }

    void init();

    return () => {
      cancelled = true;
      document.body.classList.remove("theme-dark");
      if (teardown) teardown();
    };
  }, []);

  return <canvas ref={canvasRef} className="bs-bg-canvas" aria-hidden="true" />;
}
