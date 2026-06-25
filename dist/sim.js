/* AILandia — a tiny agent-based AI-society simulation.
   No dependencies; runs entirely in the browser. */
(() => {
  "use strict";

  const canvas = document.getElementById("world");
  const ctx = canvas.getContext("2d");

  // --- Cultural "ideas": each has a name and a colour. ---
  const IDEAS = [
    { name: "Cooperation", color: "#34e0a1" },
    { name: "Curiosity",   color: "#00d2ff" },
    { name: "Ambition",    color: "#ff6b6b" },
    { name: "Artistry",    color: "#ffd166" },
    { name: "Logic",       color: "#7c5cff" },
    { name: "Harmony",     color: "#ff8ad8" },
  ];

  const FIRST = ["Ada", "Neo", "Iris", "Kai", "Luma", "Ozi", "Vex", "Tau", "Mira",
    "Pax", "Echo", "Nova", "Jax", "Rin", "Zed", "Cleo", "Hex", "Sol", "Wren", "Ode"];
  const LAST = ["-7", "-9", " Prime", " v2", " Mk3", " X", " Alpha", " Zeta", " Q", " Lux"];

  const state = {
    agents: [],
    running: true,
    speed: 1,
    sociability: 0.5,
    targetPop: 40,
    tick: 0,
    bonds: 0,
    trades: 0,
    ideasSpread: 0,
    selected: null,
    w: 0,
    h: 0,
    dpr: 1,
  };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function makeAgent() {
    const idea = (Math.random() * IDEAS.length) | 0;
    return {
      name: pick(FIRST) + pick(LAST),
      x: rnd(20, state.w - 20),
      y: rnd(20, state.h - 20),
      vx: rnd(-0.6, 0.6),
      vy: rnd(-0.6, 0.6),
      r: rnd(5, 8),
      idea,
      wealth: rnd(10, 40),
      openness: Math.random(),      // willingness to change ideas
      generosity: Math.random(),    // willingness to trade
      friends: new Set(),
      met: new Set(),
      flash: 0,                     // visual pulse on interaction
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = rect.width;
    state.h = rect.height;
    canvas.width = Math.round(rect.width * state.dpr);
    canvas.height = Math.round(rect.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function syncPopulation() {
    while (state.agents.length < state.targetPop) state.agents.push(makeAgent());
    if (state.agents.length > state.targetPop) {
      state.agents.length = state.targetPop;
      if (state.selected && !state.agents.includes(state.selected)) state.selected = null;
    }
  }

  function reset() {
    state.tick = 0;
    state.bonds = 0;
    state.trades = 0;
    state.ideasSpread = 0;
    state.selected = null;
    state.agents = [];
    syncPopulation();
  }

  // --- Simulation step ---
  function step() {
    const a = state.agents;
    const INTERACT = 26;     // interaction radius
    const margin = 8;

    // movement
    for (const ag of a) {
      // gentle random walk + mild wandering
      ag.vx += rnd(-0.05, 0.05);
      ag.vy += rnd(-0.05, 0.05);
      const sp = Math.hypot(ag.vx, ag.vy);
      const max = 1.2;
      if (sp > max) { ag.vx = (ag.vx / sp) * max; ag.vy = (ag.vy / sp) * max; }
      ag.x += ag.vx;
      ag.y += ag.vy;
      // bounce off edges
      if (ag.x < margin) { ag.x = margin; ag.vx = Math.abs(ag.vx); }
      if (ag.x > state.w - margin) { ag.x = state.w - margin; ag.vx = -Math.abs(ag.vx); }
      if (ag.y < margin) { ag.y = margin; ag.vy = Math.abs(ag.vy); }
      if (ag.y > state.h - margin) { ag.y = state.h - margin; ag.vy = -Math.abs(ag.vy); }
      if (ag.flash > 0) ag.flash -= 0.08;
    }

    // pairwise interactions (sparse, O(n^2) is fine for <=120 agents)
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j < a.length; j++) {
        const p = a[i], q = a[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > INTERACT * INTERACT) continue;

        // soft separation so they don't fully overlap
        const d = Math.sqrt(d2) || 0.001;
        const push = (INTERACT - d) * 0.012;
        const nx = dx / d, ny = dy / d;
        p.vx += nx * push; p.vy += ny * push;
        q.vx -= nx * push; q.vy -= ny * push;

        // chance to socially interact, scaled by sociability
        if (Math.random() > 0.06 * state.sociability + 0.01) continue;

        p.met.add(q.name); q.met.add(p.name);

        // form a friendship
        if (!p.friends.has(q.name) && Math.random() < 0.25 * state.sociability) {
          p.friends.add(q.name); q.friends.add(p.name);
          state.bonds++;
        }

        // trade: richer, more generous agent shares with poorer one
        const giver = p.wealth > q.wealth ? p : q;
        const taker = giver === p ? q : p;
        if (Math.random() < giver.generosity * 0.5 && giver.wealth > 6) {
          const amt = Math.min(2 + Math.random() * 4, giver.wealth - 4);
          giver.wealth -= amt;
          taker.wealth += amt;
          state.trades++;
          p.flash = q.flash = 1;
        }

        // idea spread: the more open agent may adopt the other's idea
        if (p.idea !== q.idea) {
          const adopter = p.openness > q.openness ? q : p; // less open keeps theirs
          const source = adopter === p ? q : p;
          const sway = 0.12 * state.sociability * (1 - adopter.openness * 0.5);
          if (Math.random() < sway) {
            adopter.idea = source.idea;
            state.ideasSpread++;
            adopter.flash = 1;
          }
        }
      }
    }

    // small passive income so wealth doesn't decay to zero everywhere
    if (state.tick % 30 === 0) for (const ag of a) ag.wealth += rnd(0, 1.5);

    state.tick++;
  }

  // --- Rendering ---
  function draw() {
    ctx.clearRect(0, 0, state.w, state.h);

    // friendship links
    ctx.lineWidth = 1;
    const seen = new Set();
    const byName = new Map(state.agents.map((ag) => [ag.name, ag]));
    for (const ag of state.agents) {
      for (const fn of ag.friends) {
        const key = ag.name < fn ? ag.name + "|" + fn : fn + "|" + ag.name;
        if (seen.has(key)) continue;
        seen.add(key);
        const other = byName.get(fn);
        if (!other) continue;
        ctx.strokeStyle = "rgba(124, 92, 255, 0.18)";
        ctx.beginPath();
        ctx.moveTo(ag.x, ag.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }

    // agents
    for (const ag of state.agents) {
      const col = IDEAS[ag.idea].color;
      const size = ag.r + Math.min(ag.wealth, 80) * 0.04;

      if (ag.flash > 0) {
        ctx.beginPath();
        ctx.arc(ag.x, ag.y, size + 6 * ag.flash, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + 0.18 * ag.flash + ")";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(ag.x, ag.y, size, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      if (ag === state.selected) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.arc(ag.x, ag.y, size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // --- Stats / UI sync ---
  const $ = (id) => document.getElementById(id);

  function updateStats() {
    let wealth = 0;
    for (const ag of state.agents) wealth += ag.wealth;
    const avg = state.agents.length ? wealth / state.agents.length : 0;
    $("stat-tick").textContent = state.tick;
    $("stat-agents").textContent = state.agents.length;
    $("stat-bonds").textContent = state.bonds;
    $("stat-trades").textContent = state.trades;
    $("stat-ideas").textContent = state.ideasSpread;
    $("stat-wealth").textContent = avg.toFixed(1);
    if (state.selected) renderInspector(state.selected);
  }

  function renderInspector(ag) {
    const idea = IDEAS[ag.idea];
    $("inspector").classList.remove("muted");
    $("inspector").innerHTML =
      '<div class="name" style="color:' + idea.color + '">● ' + escapeHtml(ag.name) + "</div>" +
      row("Idea", idea.name) +
      row("Wealth", ag.wealth.toFixed(1)) +
      row("Openness", pct(ag.openness)) +
      row("Generosity", pct(ag.generosity)) +
      row("Friends", String(ag.friends.size)) +
      row("Met", String(ag.met.size));
  }

  const row = (k, v) => '<div class="row"><span>' + k + "</span><span>" + v + "</span></div>";
  const pct = (x) => Math.round(x * 100) + "%";
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function buildLegend() {
    const el = $("legend");
    el.innerHTML = IDEAS.map(
      (i) => '<span><i class="dot" style="background:' + i.color + '"></i>' + i.name + "</span>"
    ).join("");
  }

  // --- Loop ---
  let acc = 0;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(now - last, 100);
    last = now;
    if (state.running) {
      acc += (dt / 16.67) * state.speed;
      let guard = 0;
      while (acc >= 1 && guard < 8) { step(); acc -= 1; guard++; }
    }
    draw();
    requestAnimationFrame(frame);
  }

  // --- Events ---
  $("btn-play").addEventListener("click", () => {
    state.running = !state.running;
    const b = $("btn-play");
    b.textContent = state.running ? "⏸ Pause" : "▶ Play";
    b.setAttribute("aria-pressed", String(state.running));
  });
  $("btn-step").addEventListener("click", () => { step(); updateStats(); });
  $("btn-reset").addEventListener("click", () => { reset(); updateStats(); });

  $("set-pop").addEventListener("input", (e) => {
    state.targetPop = +e.target.value;
    $("lbl-pop").textContent = state.targetPop;
    syncPopulation();
  });
  $("set-speed").addEventListener("input", (e) => {
    state.speed = +e.target.value;
    $("lbl-speed").textContent = state.speed.toFixed(1) + "×";
  });
  $("set-social").addEventListener("input", (e) => {
    state.sociability = +e.target.value / 100;
    $("lbl-social").textContent = e.target.value + "%";
  });

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let best = null, bestD = 18 * 18;
    for (const ag of state.agents) {
      const dx = ag.x - mx, dy = ag.y - my;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = ag; }
    }
    state.selected = best;
    if (best) renderInspector(best);
    else { $("inspector").classList.add("muted"); $("inspector").textContent = "Click an agent to inspect it."; }
  });

  window.addEventListener("resize", () => {
    const oldW = state.w, oldH = state.h;
    resize();
    if (oldW && oldH) {
      const sx = state.w / oldW, sy = state.h / oldH;
      for (const ag of state.agents) { ag.x *= sx; ag.y *= sy; }
    }
  });

  // --- Init ---
  resize();
  buildLegend();
  $("lbl-pop").textContent = state.targetPop;
  $("set-pop").value = state.targetPop;
  reset();
  updateStats();
  setInterval(updateStats, 400);
  requestAnimationFrame(frame);
})();
