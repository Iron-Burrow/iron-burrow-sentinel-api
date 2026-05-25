import type { MantleAssetSummary, LiquidityDeltaResponse } from "../src/providers/mantle-provider.js";
import { escapeHtml, renderLayout } from "./layout.js";

export function renderMantleDemoPage(input: {
  assets: MantleAssetSummary[];
  liquidity: LiquidityDeltaResponse;
}): string {
  const { assets } = input;

  const assetTags = assets
    .map(
      (a) =>
        `<a class="bs-asset-tag" href="/mantle/asset/${escapeHtml(a.address)}">
          <span class="bs-asset-tag-icon">${escapeHtml(a.symbol.slice(0, 2))}</span>
          <span>${escapeHtml(a.symbol)}</span>
        </a>`
    )
    .join("");

  const categoryTags = ["Address", "Token", "Holder", "Liquidity", "Concentration", "Block"]
    .map((t) => `<span class="bs-cat-tag">${t}</span>`)
    .join("");

  return renderLayout({
    title: "Mantle Explorer",
    active: "mantle",
    bodyClass: "theme-dark",
    bgCanvas: true,
    body: `<section class="bs-hero bs-hero-dark">
      <div class="bs-hero-inner">
        <h1 class="bs-title">Mantle intelligence<br/><span class="bs-title-accent">Expand your exploration</span></h1>
        <div class="bs-hero-actions">
          <a class="bs-action-btn primary" href="#search">Search on chain</a>
          <a class="bs-action-btn" href="/docs">Explore API</a>
        </div>
        <form class="bs-search" action="/search" method="get" id="search">
          <span class="bs-search-icon">&#x1F50D;</span>
          <input name="q" placeholder="Search by address / token / symbol..." aria-label="Search Mantle assets" autocomplete="off" />
        </form>
        <div class="bs-cat-tags">
          <span class="bs-cat-label">Try searching by:</span>
          ${categoryTags}
        </div>
      </div>
    </section>

    <section class="bs-featured">
      <h2 class="bs-section-title">Featured assets</h2>
      <p class="bs-section-sub">Select a token to investigate intelligence signals</p>
      <div class="bs-asset-tags">${assetTags}</div>
    </section>`,
    script: heroParticleScript
  });
}

// Particle-network animation for the hero. Primary path uses Three.js (`three`
// is an installed dependency, served from node_modules at /vendor/three.module.js
// and resolved through the import map). When WebGL is unavailable/disabled the
// script falls back to an equivalent Canvas 2D renderer so the animation works
// for every visitor. Nodes drift freely and link to nearby neighbours.
const heroParticleScript = `<script type="importmap">
{ "imports": { "three": "/vendor/three.module.js" } }
</script>
<script type="module">
(async function () {
  var canvas = document.getElementById("bs-hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function webglAvailable() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }

  if (!webglAvailable()) {
    console.info("[hero] WebGL disabled — using Canvas 2D fallback");
    start2D();
    return;
  }

  var THREE;
  try {
    THREE = await import("three");
  } catch (err) {
    console.error("[hero] failed to load three, using 2D fallback:", err);
    start2D();
    return;
  }

  try {
    startWebGL(THREE);
  } catch (err) {
    console.warn("[hero] WebGL init failed, using 2D fallback:", err);
    start2D();
  }

  // ---- Three.js (WebGL) path ----
  function startWebGL(THREE) {
    function circleTexture() {
      var c = document.createElement("canvas");
      c.width = c.height = 64;
      var ctx = c.getContext("2d");
      var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.3, "rgba(208,200,255,0.85)");
      g.addColorStop(1, "rgba(150,135,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }

    var width = window.innerWidth;
    var height = window.innerHeight;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearAlpha(0);
    renderer.setSize(width, height, false);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(0, 0, 70);

    var BX = 96, BY = 60, BZ = 36;
    var COUNT = window.innerWidth < 760 ? 60 : 130;
    var LINK = 18;

    var positions = new Float32Array(COUNT * 3);
    var vels = [];
    for (var i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() * 2 - 1) * BX;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * BY;
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * BZ;
      vels.push([(Math.random() * 2 - 1) * 0.05, (Math.random() * 2 - 1) * 0.05, (Math.random() * 2 - 1) * 0.05]);
    }

    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var pMat = new THREE.PointsMaterial({
      size: 2.8, map: circleTexture(), color: 0xbfb4ff, transparent: true,
      opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    scene.add(new THREE.Points(pGeo, pMat));

    var maxV = COUNT * COUNT + COUNT * 4;
    var lPos = new Float32Array(maxV * 3);
    var lCol = new Float32Array(maxV * 3);
    var lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", new THREE.BufferAttribute(lPos, 3));
    lGeo.setAttribute("color", new THREE.BufferAttribute(lCol, 3));
    var lMat = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.LineSegments(lGeo, lMat));

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    window.addEventListener("resize", resize);

    camera.lookAt(0, 0, 0);

    function frame(step) {
      for (var i = 0; i < COUNT; i++) {
        var ix = i * 3, iy = ix + 1, iz = ix + 2;
        positions[ix] += vels[i][0] * step;
        positions[iy] += vels[i][1] * step;
        positions[iz] += vels[i][2] * step;
        if (positions[ix] > BX || positions[ix] < -BX) vels[i][0] *= -1;
        if (positions[iy] > BY || positions[iy] < -BY) vels[i][1] *= -1;
        if (positions[iz] > BZ || positions[iz] < -BZ) vels[i][2] *= -1;
      }
      pGeo.attributes.position.needsUpdate = true;

      var v = 0;
      for (var a = 0; a < COUNT; a++) {
        var ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
        for (var b = a + 1; b < COUNT; b++) {
          var bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
          var ex = ax - bx, ey = ay - by, ez = az - bz;
          var dd = Math.sqrt(ex * ex + ey * ey + ez * ez);
          if (dd < LINK && v < maxV - 2) {
            var t = 1 - dd / LINK;
            lPos[v * 3] = ax; lPos[v * 3 + 1] = ay; lPos[v * 3 + 2] = az;
            lCol[v * 3] = 0.45 * t; lCol[v * 3 + 1] = 0.38 * t; lCol[v * 3 + 2] = 0.85 * t; v++;
            lPos[v * 3] = bx; lPos[v * 3 + 1] = by; lPos[v * 3 + 2] = bz;
            lCol[v * 3] = 0.45 * t; lCol[v * 3 + 1] = 0.38 * t; lCol[v * 3 + 2] = 0.85 * t; v++;
          }
        }
      }
      lGeo.setDrawRange(0, v);
      lGeo.attributes.position.needsUpdate = true;
      lGeo.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    }

    console.info("[hero] particle field ready (WebGL, " + COUNT + " nodes)");
    runLoop(frame);
  }

  // ---- Canvas 2D fallback path ----
  function start2D() {
    var ctx = canvas.getContext("2d");
    if (!ctx) { console.error("[hero] 2D canvas unavailable"); return; }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    var COUNT = w < 760 ? 55 : 120;
    var LINK = 150;
    var nodes = [];
    for (var i = 0; i < COUNT; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() * 2 - 1) * 0.35, vy: (Math.random() * 2 - 1) * 0.35
      });
    }

    function frame(step) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      for (var i = 0; i < COUNT; i++) {
        var n = nodes[i];
        n.x += n.vx * step; n.y += n.vy * step;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));
      }

      ctx.lineWidth = 1;
      for (var a = 0; a < COUNT; a++) {
        for (var b = a + 1; b < COUNT; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = "rgba(140,125,225," + ((1 - d / LINK) * 0.45).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }

      for (var j = 0; j < COUNT; j++) {
        var p = nodes[j];
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4);
        g.addColorStop(0, "rgba(214,206,255,0.95)");
        g.addColorStop(1, "rgba(150,135,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    console.info("[hero] particle field ready (Canvas 2D, " + COUNT + " nodes)");
    runLoop(frame);
  }

  // ---- shared render loop ----
  // Time-based: each frame advances by "step" = elapsed / 16.67ms, so speed is
  // constant regardless of refresh rate (60Hz, 120Hz/ProMotion). A single
  // cancellable rAF chain guarantees the loop never runs more than once, even
  // across tab switches — that was the cause of the runaway acceleration.
  function runLoop(frame) {
    if (reduce) { frame(1); return; }
    var rafId = 0;
    var last = 0;
    function loop(now) {
      var step = last ? (now - last) / 16.6667 : 1;
      last = now;
      if (step > 3) step = 3; // clamp after stalls so particles never teleport
      frame(step);
      rafId = requestAnimationFrame(loop);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      } else if (!rafId) {
        last = 0; // resync timing on resume
        rafId = requestAnimationFrame(loop);
      }
    });
    rafId = requestAnimationFrame(loop);
  }
})();
</script>`;
