import type { IronBurrowAsset } from "../src/clients/iron-burrow.js";
import { emptyState, escapeHtml, renderLayout } from "./layout.js";

export function renderMantleDemoPage(input: {
  assets: IronBurrowAsset[];
  error?: string | null;
  currency?: "USD" | "MXN";
}): string {
  const { assets, error, currency } = input;

  const assetTags = assets
    .map(
      (a) =>
        `<a class="bs-asset-tag" href="/mantle/asset/${escapeHtml(a.asset_id)}" title="${escapeHtml(a.name)}">
          <span class="bs-asset-tag-icon">${escapeHtml(a.symbol.slice(0, 2))}</span>
          <span>${escapeHtml(a.symbol)}</span>
        </a>`
    )
    .join("");

  const categoryTags = ["Address", "Token", "Holder", "Liquidity", "Concentration", "Block"]
    .map((t) => `<span class="bs-cat-tag">${t}</span>`)
    .join("");

  const errorBanner = error
    ? `<div class="bs-search-error" role="alert" style="margin-top:12px;padding:10px 14px;border-radius:10px;background:rgba(255,90,90,0.12);color:#ffb1b1;font-size:14px">${escapeHtml(error)}</div>`
    : "";

  const featuredBody = assets.length === 0
    ? emptyState("Featured assets unavailable.", "Could not reach the Iron Burrow asset catalog.", "unavailable")
    : `<div class="bs-asset-tags">${assetTags}</div>`;

  return renderLayout({
    title: "Mantle Explorer",
    active: "mantle",
    bodyClass: "theme-dark",
    bgCanvas: true,
    currency,
    body: `<section class="bs-hero bs-hero-dark">
      <div class="bs-hero-inner">
        <h1 class="bs-title">Mantle intelligence<br/><span class="bs-title-accent">Expand your exploration</span></h1>
        <div class="bs-hero-actions">
          <a class="bs-action-btn primary" href="#search">Search on chain</a>
          <a class="bs-action-btn" href="/docs">Explore API</a>
        </div>
        <form class="bs-search" action="/mantle-demo/search" method="get" id="search">
          <span class="bs-search-icon">&#x1F50D;</span>
          <input name="q" placeholder="Search by token / symbol / name..." aria-label="Search assets" autocomplete="off" />
        </form>
        ${errorBanner}
        <div class="bs-cat-tags">
          <span class="bs-cat-label">Try searching by:</span>
          ${categoryTags}
        </div>
      </div>
    </section>

    <section class="bs-featured">
      <h2 class="bs-section-title">Featured assets</h2>
      <p class="bs-section-sub">Select a token to investigate intelligence signals</p>
      ${featuredBody}
    </section>

    ${chatWidgetMarkup}`,
    script: `${chatWidgetStyle}\n${heroParticleScript}\n${chatWidgetScript}`
  });
}

const chatWidgetMarkup = `<div id="bs-chat" class="bs-chat" data-open="false">
  <button type="button" class="bs-chat-toggle" aria-label="Open chat assistant" aria-expanded="false">
    <span class="bs-chat-toggle-icon">&#x1F4AC;</span>
    <span class="bs-chat-toggle-label">Ask Sentinel</span>
  </button>
  <section class="bs-chat-panel" role="dialog" aria-label="Sentinel assistant" aria-hidden="true">
    <header class="bs-chat-header">
      <div>
        <strong>Sentinel assistant</strong>
        <small>Ask about any of the 20 catalog assets</small>
      </div>
      <button type="button" class="bs-chat-close" aria-label="Close chat">&times;</button>
    </header>
    <div class="bs-chat-log" role="log" aria-live="polite"></div>
    <form class="bs-chat-form" autocomplete="off">
      <input type="text" name="message" maxlength="1000" placeholder="Ask about an asset..." aria-label="Chat message" required />
      <button type="submit">Send</button>
    </form>
  </section>
</div>`;

const chatWidgetStyle = `<style>
  .bs-chat { position: fixed; right: 20px; bottom: 20px; z-index: 50; font-family: inherit; color: #e8e6f5; }
  .bs-chat-toggle { display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; border: none; border-radius: 999px; background: linear-gradient(135deg,#7a6bff,#b59cff); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 10px 28px rgba(122,107,255,0.45); }
  .bs-chat-toggle-icon { font-size: 16px; }
  .bs-chat[data-open="true"] .bs-chat-toggle { display: none; }
  .bs-chat-panel { display: none; flex-direction: column; width: 360px; height: 460px; background: #14122a; border: 1px solid rgba(150,135,255,0.25); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,0.55); overflow: hidden; }
  .bs-chat[data-open="true"] .bs-chat-panel { display: flex; }
  .bs-chat-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: rgba(122,107,255,0.12); border-bottom: 1px solid rgba(150,135,255,0.2); }
  .bs-chat-header small { display: block; font-size: 11px; opacity: 0.65; margin-top: 2px; }
  .bs-chat-close { background: none; border: none; color: inherit; font-size: 22px; line-height: 1; cursor: pointer; padding: 4px 8px; }
  .bs-chat-log { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 13px; line-height: 1.45; }
  .bs-chat-msg { padding: 8px 12px; border-radius: 12px; max-width: 85%; white-space: pre-wrap; word-wrap: break-word; }
  .bs-chat-msg-user { align-self: flex-end; background: rgba(122,107,255,0.28); }
  .bs-chat-msg-bot { align-self: flex-start; background: rgba(255,255,255,0.06); }
  .bs-chat-msg-error { align-self: flex-start; background: rgba(255,90,90,0.15); color: #ffb1b1; }
  .bs-chat-msg-pending { opacity: 0.6; font-style: italic; }
  .bs-chat-form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid rgba(150,135,255,0.2); background: rgba(0,0,0,0.2); }
  .bs-chat-form input { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(150,135,255,0.25); background: rgba(255,255,255,0.04); color: inherit; font-size: 13px; }
  .bs-chat-form input:focus { outline: none; border-color: rgba(150,135,255,0.6); }
  .bs-chat-form button { padding: 8px 14px; border-radius: 8px; border: none; background: linear-gradient(135deg,#7a6bff,#b59cff); color: #fff; font-weight: 600; cursor: pointer; }
  .bs-chat-form button:disabled { opacity: 0.5; cursor: wait; }
  @media (max-width: 480px) {
    .bs-chat { right: 12px; bottom: 12px; left: 12px; }
    .bs-chat-panel { width: auto; height: 70vh; }
  }
</style>`;

const chatWidgetScript = `<script>
(function () {
  var root = document.getElementById("bs-chat");
  if (!root) return;
  var toggle = root.querySelector(".bs-chat-toggle");
  var closeBtn = root.querySelector(".bs-chat-close");
  var panel = root.querySelector(".bs-chat-panel");
  var log = root.querySelector(".bs-chat-log");
  var form = root.querySelector(".bs-chat-form");
  var input = form.querySelector("input[name=message]");
  var submitBtn = form.querySelector("button[type=submit]");
  var history = [];
  var seeded = false;

  function setOpen(open) {
    root.setAttribute("data-open", open ? "true" : "false");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      if (!seeded) {
        appendMsg("bot", "Hi! Ask me about any asset in the catalog — e.g. \\"tell me about mETH\\" or \\"which stablecoins are listed?\\"");
        seeded = true;
      }
      setTimeout(function () { input.focus(); }, 50);
    }
  }

  function appendMsg(role, text, extraClass) {
    var div = document.createElement("div");
    div.className = "bs-chat-msg bs-chat-msg-" + role + (extraClass ? " " + extraClass : "");
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  toggle.addEventListener("click", function () { setOpen(true); });
  closeBtn.addEventListener("click", function () { setOpen(false); });

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var message = input.value.trim();
    if (!message) return;

    appendMsg("user", message);
    input.value = "";
    submitBtn.disabled = true;
    var pending = appendMsg("bot", "Thinking...", "bs-chat-msg-pending");

    try {
      var res = await fetch("/mantle-demo/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: message, history: history })
      });
      var data = await res.json();
      pending.remove();
      if (!res.ok || !data.ok) {
        appendMsg("bot", data.error || "Sorry, something went wrong.", "bs-chat-msg-error");
      } else {
        appendMsg("bot", data.answer);
        history.push({ role: "user", content: message });
        history.push({ role: "assistant", content: data.answer });
        if (history.length > 20) history = history.slice(-20);
      }
    } catch (err) {
      pending.remove();
      appendMsg("bot", "Network error — try again.", "bs-chat-msg-error");
    } finally {
      submitBtn.disabled = false;
      input.focus();
    }
  });
})();
</script>`;

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
