/* ====================================================================
   MAIN — content injection, loader, typewriter, cursor, FX, scroll
   ==================================================================== */
import { DATA } from "./data.js";

const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- tiny DOM helpers ---- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function scrollToSection(target) {
  const el = typeof target === "string" ? $(target) : target;
  if (!el) return;
  el.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "start" });
}

function closeNavMenu() {
  const links = $("#navLinks");
  const btn = $("#navToggle");
  if (!links?.classList.contains("open")) return;
  links.classList.remove("open");
  btn?.classList.remove("open");
  btn?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

function syncModalScrollLock() {
  const locked =
    $("#caseModal")?.classList.contains("open") ||
    $("#researchModal")?.classList.contains("open") ||
    $("#termModal")?.classList.contains("open");
  document.body.classList.toggle("modal-open", !!locked);
}

/* ====================================================================
   SFX — ctOS UI sound pack (procedural buffers). Off until AUDIO ON.
   ==================================================================== */
const SFX = (() => {
  let ctx = null, master = null, enabled = false, hum = null, pack = null;
  const CYAN_HZ = 880;
  const ORANGE_HZ = 220;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.58;
      master.connect(ctx.destination);
      pack = buildPack();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function buildPack() {
    const sr = ctx.sampleRate;
    const mk = (dur, fn) => {
      const n = Math.max(1, Math.floor(sr * dur));
      const b = ctx.createBuffer(1, n, sr);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = fn(i / n, i, sr);
      return b;
    };
    return {
      hover: mk(0.04, (t) => Math.sin(t * 120) * Math.exp(-t * 14) * 0.35),
      click: mk(0.07, (t) => (Math.random() * 0.5 + 0.5) * Math.sin(t * 90) * Math.exp(-t * 10) * 0.4),
      type: mk(0.025, (t) => Math.sin(t * 200) * Math.exp(-t * 20) * 0.25),
      modal: mk(0.22, (t) => Math.sin(t * 40 + t * t * 80) * Math.exp(-t * 4) * 0.3),
      unlock: mk(0.35, (t) => Math.sin(t * 24 + t * t * 120) * Math.exp(-t * 3.5) * 0.38),
      glitch: mk(0.14, (t) => (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.22),
    };
  }

  function play(buf, gain = 0.45, rate = 1) {
    if (!enabled || !buf) return;
    ensure();
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    src.playbackRate.value = rate;
    g.gain.value = gain;
    src.connect(g);
    g.connect(master);
    src.start();
  }

  function tone(freq, dur, type = "square", gain = 0.04, bend = 0) {
    if (!enabled) return;
    ensure();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    const t = ctx.currentTime;
    o.frequency.setValueAtTime(freq, t);
    if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + bend), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur = 0.18, gain = 0.05, hp = 850) {
    if (!enabled) return;
    ensure();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = "highpass"; f.frequency.value = hp;
    g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  function startHum() {
    if (!enabled || hum) return;
    ensure();
    const t = ctx.currentTime;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o1.type = "sawtooth"; o1.frequency.value = 42;
    o2.type = "sawtooth"; o2.frequency.value = 43.7;
    f.type = "lowpass"; f.frequency.value = 140;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.016, t + 1.2);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    o1.start(t); o2.start(t);
    hum = { o1, o2, g };
  }

  function stopHum() {
    if (!hum) return;
    const t = ctx?.currentTime || 0;
    try {
      hum.g.gain.cancelScheduledValues(t);
      hum.g.gain.setValueAtTime(hum.g.gain.value, t);
      hum.g.gain.linearRampToValueAtTime(0, t + 0.4);
      setTimeout(() => { try { hum.o1.stop(); hum.o2.stop(); } catch (e) {} }, 450);
    } catch (e) {
      try { hum.o1.stop(); hum.o2.stop(); } catch (e2) {}
    }
    hum = null;
  }

  const throttled = (fn, ms) => {
    let last = 0;
    return (...args) => {
      const n = Date.now();
      if (n - last >= ms) { last = n; fn(...args); }
    };
  };

  return {
    hover: throttled(() => { ensure(); play(pack.hover, 0.46); }, 140),
    click: () => { ensure(); play(pack.click, 0.34); tone(CYAN_HZ, 0.04, "sine", 0.03); },
    type: throttled(() => { ensure(); play(pack.type, 0.38); }, 55),
    modalOpen: () => { ensure(); play(pack.modal, 0.54); tone(ORANGE_HZ, 0.05, "square", 0.03); },
    researchUnlock: () => {
      ensure();
      play(pack.unlock, 0.58);
      setTimeout(() => tone(CYAN_HZ, 0.07, "sine", 0.04), 90);
      setTimeout(() => tone(CYAN_HZ * 1.25, 0.09, "sine", 0.035), 180);
    },
    decrypt: throttled(() => tone(600 + Math.random() * 400, 0.008, "square", 0.014), 130),
    bootStep: throttled(() => tone(320 + Math.random() * 80, 0.04, "square", 0.032), 380),
    hackTick: (p = 0) => tone(280 + p * 520, 0.05, "sawtooth", 0.038, 40),
    hackFail: () => { if (!enabled) return; play(pack.glitch, 0.22); tone(180, 0.1, "square", 0.03, -70); },
    /* Hold-to-hack / Konami — diminished breach (spaced, one finish hit) */
    success: () => {
      ensure();
      const breach = [523, 622, 740]; /* C5 → Eb5 → Gb5 */
      breach.forEach((f, i) => {
        setTimeout(() => tone(f, 0.1, "square", 0.048, i === 2 ? -35 : 0), i * 115);
      });
      setTimeout(() => {
        play(pack.unlock, 0.42, 0.78);
        noise(0.12, 0.028, 600);
      }, 360);
    },
    /* CV extract — quiet confirm, not a breach fanfare */
    extractDone: () => {
      ensure();
      play(pack.click, 0.24);
      tone(CYAN_HZ, 0.055, "sine", 0.028);
    },
    profilerScan: () => {
      if (!enabled) return;
      [0, 1, 2].forEach((i) => setTimeout(() => play(pack.type, 0.38, 0.9 + i * 0.1), i * 85));
      setTimeout(() => play(pack.glitch, 0.12), 250);
    },
    glitch: () => { if (!enabled) return; play(pack.glitch, 0.24); tone(ORANGE_HZ * 1.5, 0.05, "sawtooth", 0.028, -50); },
    powerOn: () => {
      if (!enabled) return;
      tone(220, 0.05, "square", 0.032);
      setTimeout(() => play(pack.modal, 0.5, 0.85), 60);
      setTimeout(() => tone(CYAN_HZ * 1.5, 0.1, "sine", 0.04), 140);
    },
    set(on) {
      enabled = on;
      document.body.classList.toggle("sound-on", on);
      if (on) { ensure(); startHum(); }
      else stopHum();
    },
    get on() { return enabled; },
  };
})();

/* ====================================================================
   POPULATE CONTENT
   ==================================================================== */
function populate() {
  // hero
  $("#heroHandle").textContent = `> ${DATA.handle}`;
  const nameEl = $("#heroName");
  nameEl.textContent = DATA.name;
  nameEl.setAttribute("data-text", DATA.name);
  $("#heroLoc").textContent = DATA.location.toUpperCase();
  $("#navStatus").textContent = DATA.status;
  const tag = $("#heroTagline");
  if (tag && DATA.tagline) tag.textContent = DATA.tagline;

  // about
  $("#aboutHeadline").textContent = DATA.about.headline;
  const paras = $("#aboutParas");
  DATA.about.paragraphs.forEach((p) => {
    const el = document.createElement("p");
    el.textContent = p;
    paras.appendChild(el);
  });
  const stats = $("#statsGrid");
  DATA.about.stats.forEach((s) => {
    const d = document.createElement("div");
    d.className = "stat";
    d.innerHTML = `<div class="stat-val">${s.value}</div><div class="stat-label">${s.label}</div>`;
    stats.appendChild(d);
  });

  // skills → research node-tree
  buildResearchTree();

  // projects
  const pg = $("#projectsGrid");
  DATA.projects.forEach((p) => {
    const el = document.createElement("article");
    el.className = "proj";
    el.innerHTML = `
      <div class="proj-top">
        <span class="proj-id">OP_${p.id}</span>
        <span class="proj-tag">${p.tag}</span>
      </div>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="proj-tech">${p.tech.map((t) => `<span>${t}</span>`).join("")}</div>
      <button type="button" class="proj-intel"><span>◈</span> OPEN INTEL</button>`;
    pg.appendChild(el);
  });

  // footer year
  $("#year").textContent = new Date().getFullYear();
}

/* ====================================================================
   RESEARCH NODE-TREE (skills)
   ==================================================================== */
const SVG_NS = "http://www.w3.org/2000/svg";
const RES_LAYOUT = [
  [50, 9], [25, 31], [75, 31], [13, 56], [38, 56], [62, 56], [87, 56], [50, 82],
];
const RES_EDGES = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[4,7],[5,7]];
let researchRevealed = false;

function buildResearchTree() {
  const sg = $("#skillsGrid");
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "restree-svg");
  sg.appendChild(svg);

  DATA.skills.forEach((sk, i) => {
    const pos = RES_LAYOUT[i] || [12 + (i % 8) * 11, 96];
    const node = document.createElement("div");
    node.className = "resnode";
    node.dataset.i = i;
    node.style.left = pos[0] + "%";
    node.style.top  = pos[1] + "%";
    node.innerHTML = `
      <div class="resnode-core"><span class="resnode-pct">${sk.level}</span></div>
      <div class="resnode-label">${sk.name}</div>`;
    sg.appendChild(node);
  });
}

function drawResearchLinks() {
  const sg = $("#skillsGrid");
  const svg = sg.querySelector(".restree-svg");
  const nodes = $$(".resnode", sg);
  const W = sg.clientWidth, H = sg.clientHeight;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  svg.innerHTML = "";
  RES_EDGES.forEach(([a, b]) => {
    const na = nodes[a], nb = nodes[b];
    if (!na || !nb) return;
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", na.offsetLeft); line.setAttribute("y1", na.offsetTop);
    line.setAttribute("x2", nb.offsetLeft); line.setAttribute("y2", nb.offsetTop);
    line.setAttribute("class", "reslink");
    const len = Math.hypot(nb.offsetLeft - na.offsetLeft, nb.offsetTop - na.offsetTop);
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = researchRevealed ? 0 : len;
    svg.appendChild(line);
  });
}

function researchReveal() {
  if (researchRevealed) return;
  researchRevealed = true;
  drawResearchLinks();
  const sg = $("#skillsGrid");
  const lines = $$(".reslink", sg);
  requestAnimationFrame(() => lines.forEach((l) => (l.style.strokeDashoffset = 0)));
  $$(".resnode", sg).forEach((n, i) => {
    setTimeout(() => {
      n.classList.add("researched");
      n.querySelector(".resnode-core").style.setProperty("--lvl", DATA.skills[i].level);
    }, 240 + i * 130);
  });
  window.addEventListener("resize", drawResearchLinks);
}

/* ====================================================================
   LOADER — fullscreen DedSec art + ctOS progress bar
   ==================================================================== */
let bootDone = false;
function bootFinish() {
  if (bootDone) return;
  bootDone = true;
  const loader = $("#loader");
  document.documentElement.classList.remove("loader-active");
  document.body.classList.remove("loader-active");
  loader?.classList.add("done");
  startTypewriter();
  triggerReveal($("#hero"));
}

function boot() {
  const fill = $("#loaderFill");
  const text = $("#loaderText");
  const art = $("#loaderArt");
  const msgs = [
    "ESTABLISHING SECURE CONNECTION...",
    "BYPASSING ctOS FIREWALL...",
    "DECRYPTING OPERATIVE PROFILE...",
    "ACCESS GRANTED. WELCOME.",
  ];
  const shortMsgs = [
    "CONNECTING...",
    "BYPASSING FIREWALL...",
    "DECRYPTING...",
    "ACCESS GRANTED.",
  ];
  const statusMsgs = matchMedia("(max-width: 480px)").matches ? shortMsgs : msgs;

  document.documentElement.classList.add("loader-active");
  document.body.classList.add("loader-active");

  if (REDUCED_MOTION) {
    fill.style.width = "100%";
    text.textContent = statusMsgs[statusMsgs.length - 1];
    return setTimeout(bootFinish, 400);
  }

  const runProgress = () => {
    const LOADER_MS = 2800; /* one dedsec-loader.gif loop — keep in sync with --loader-loop */
    fill.classList.remove("run");
    fill.style.width = "0%";
    void fill.offsetWidth;
    fill.classList.add("run");
    text.textContent = statusMsgs[0];

    statusMsgs.forEach((msg, i) => {
      if (i === 0) return;
      setTimeout(() => { text.textContent = msg; }, (LOADER_MS * i) / statusMsgs.length);
    });

    if (SFX.on) {
      [0.25, 0.5, 0.75].forEach((t) => setTimeout(() => SFX.bootStep(), LOADER_MS * t));
    }

    setTimeout(() => {
      text.textContent = statusMsgs[statusMsgs.length - 1];
      setTimeout(bootFinish, 450);
    }, LOADER_MS);
  };

  if (art && !art.complete) {
    art.addEventListener("load", runProgress, { once: true });
    art.addEventListener("error", runProgress, { once: true });
  } else {
    runProgress();
  }
}

/* ====================================================================
   TYPEWRITER (hero roles)
   ==================================================================== */
function startTypewriter() {
  const el = $("#heroRole");
  const roles = DATA.roles;
  if (!el || !roles.length) return;
  if (REDUCED_MOTION) {
    el.textContent = roles[0];
    return;
  }
  let r = 0, c = 0, deleting = false;
  function tick() {
    const word = roles[r];
    if (!deleting) {
      el.textContent = word.slice(0, ++c);
      if (c === word.length) { deleting = true; return setTimeout(tick, 1600); }
    } else {
      el.textContent = word.slice(0, --c);
      if (c === 0) { deleting = false; r = (r + 1) % roles.length; }
    }
    setTimeout(tick, deleting ? 45 : 80);
  }
  tick();
}

/* ====================================================================
   CUSTOM CURSOR — visible over terminal, modals, arsenal & ops cards
   ==================================================================== */
function cursor() {
  const dot = $("#cursorDot");
  const ring = $("#cursorRing");
  if (!dot || !ring || matchMedia("(pointer: coarse)").matches) return;

  document.body.classList.add("custom-cursor");

  const HOVER_SEL =
    "a, button, .btn, .proj, .proj-intel, .social, .resnode, .dock-btn, " +
    ".ctmodal-win, .ctmodal-x, .ctmodal-actions a, .ctmodal-actions button, " +
    ".termmodal, .termmodal-win, .termmodal-x, .termmodal-out, .termmodal-in, " +
    ".hack-btn, .nav-toggle, .vprofiler, .dock-hint-x";

  let dx = 0, dy = 0, rx = 0, ry = 0, wasHover = false;

  const place = (el, x, y) => {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  };

  const onPointerMove = (e) => {
    dx = e.clientX;
    dy = e.clientY;
    place(dot, dx, dy);

    const hover = !!e.target.closest(HOVER_SEL);
    if (hover && !wasHover && SFX.on) SFX.hover();
    wasHover = hover;
    ring.classList.toggle("hovering", hover);
  };

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerdown", () => ring.classList.add("clicking"));
  document.addEventListener("pointerup", () => ring.classList.remove("clicking"));

  (function loop() {
    rx += (dx - rx) * 0.2;
    ry += (dy - ry) * 0.2;
    place(ring, rx, ry);
    requestAnimationFrame(loop);
  })();
}

/* ====================================================================
   SCROLL REVEAL + skill bars + terminal
   ==================================================================== */
function triggerReveal(section) {
  section.classList.add("in");
  const title = section.querySelector(".section-title");
  if (title) scrambleReveal(title, title.dataset.text || title.textContent);
  if (section.id === "about") { const h = $("#aboutHeadline"); if (h) scrambleReveal(h, h.textContent); }
  if (section.id === "skills") researchReveal();
  if (section.id === "contact") runTerminal();
}

/* ---- decrypt-on-reveal: scramble glyphs that resolve into the text ---- */
function scrambleReveal(el, finalText) {
  const glyphs = "01!<>-_\\/[]{}=+*#%ABCDEF";
  let frame = 0;
  let tick = 0;
  clearInterval(el._sc);
  el._sc = setInterval(() => {
    el.textContent = finalText
      .split("")
      .map((ch, i) => (ch === " " ? " " : i < frame ? finalText[i] : glyphs[Math.floor(Math.random() * glyphs.length)]))
      .join("");
    if (frame >= finalText.length) { clearInterval(el._sc); el.textContent = finalText; }
    else if (!REDUCED_MOTION && SFX.on && tick++ % 4 === 0) SFX.decrypt();
    frame += 0.8;
  }, 32);
}

function observers() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { triggerReveal(en.target); io.unobserve(en.target); }
    });
  }, { threshold: 0.18 });
  $$(".reveal").forEach((s) => io.observe(s));
}

/* ====================================================================
   CONTACT TERMINAL — typed output, gated behind HOLD TO HACK
   ==================================================================== */
function syncTermHint(container, hintEl) {
  if (!container || !hintEl) return;
  hintEl.hidden = container.childElementCount > 0;
}

function typeLines(lines, cb) {
  const b = $("#termBody");
  const hint = $("#contactTermHint");
  let i = 0;
  (function next() {
    if (i >= lines.length) { cb && cb(); return; }
    const l = lines[i++];
    const div = document.createElement("div");
    div.className = "ln " + l.cls;
    if (l.html) div.innerHTML = l.html;
    else div.textContent = l.text || "\u00a0";
    b.appendChild(div);
    syncTermHint(b, hint);
    setTimeout(next, l.text === "" ? 120 : 300);
  })();
}

let terminalRan = false;
function runTerminal() {
  if (terminalRan) return;
  terminalRan = true;
  typeLines([
    { cls: "prompt", text: "$ ./connect --operative" },
    { cls: "out",    text: "→ Channel open. Let's build something dangerous." },
    { cls: "muted",  text: "" },
    { cls: "prompt", text: "$ whoami" },
    { cls: "out",    text: `→ ${DATA.name} // ${DATA.handle}` },
    { cls: "muted",  text: "" },
    { cls: "prompt", text: "$ cat contact.enc" },
    { cls: "muted",  text: "→ 4f7a·e1b9·8c02·a13d·██████  [ AES-256 ENCRYPTED ]" },
    { cls: "out",    html: `→ HOLD the <b>HACK</b> button below to decrypt.` },
    { cls: "prompt", text: "$ _" },
  ]);
}

/* ---- HOLD TO HACK ---- */
let hacked = false;
function hack() {
  const btn = $("#hackBtn"), fill = $("#hackFill"), label = $("#hackLabel"), status = $("#hackStatus");
  const DURATION = 1400;
  let raf, start = 0, holding = false, lastHackSfx = 0;

  function frame(t) {
    if (!start) start = t;
    const p = Math.min((t - start) / DURATION, 1);
    fill.style.width = (p * 100) + "%";
    if (holding && t - lastHackSfx > 120) { lastHackSfx = t; SFX.hackTick(p); }
    if (p >= 1) return success();
    if (holding) raf = requestAnimationFrame(frame);
  }
  function down(e) {
    if (hacked) return;
    e.preventDefault();
    holding = true; start = 0;
    fill.style.transition = "";
    btn.classList.add("hacking"); btn.classList.remove("fail");
    label.textContent = "HACKING…"; status.textContent = "[ BREACHING ctOS… ]";
    raf = requestAnimationFrame(frame);
  }
  function up() {
    if (hacked || !holding) return;
    holding = false; cancelAnimationFrame(raf);
    btn.classList.remove("hacking");
    if (parseFloat(fill.style.width) < 100) {
      SFX.hackFail();
      btn.classList.add("fail"); label.textContent = "CONNECTION LOST";
      status.textContent = "[ ENCRYPTED ]";
      fill.style.transition = "width .3s"; fill.style.width = "0%";
      setTimeout(() => { if (!hacked) { label.textContent = "HOLD TO HACK"; btn.classList.remove("fail"); } }, 650);
    }
  }
  function success() {
    hacked = true; holding = false; cancelAnimationFrame(raf);
    fill.style.width = "100%";
    btn.classList.remove("hacking"); btn.classList.add("done");
    label.textContent = "ACCESS GRANTED";
    status.textContent = "[ DECRYPTED ]"; status.classList.add("granted");
    SFX.success();
    document.body.classList.add("glitch-active");
    setTimeout(() => document.body.classList.remove("glitch-active"), 300);
    const { email, socials } = DATA.contact;
    typeLines([
      { cls: "muted",  text: "" },
      { cls: "prompt", text: "$ ./decrypt --force" },
      { cls: "out",    text: "→ ACCESS GRANTED. Operative contact decrypted." },
      { cls: "out",    html: `→ EMAIL: <a href="mailto:${email}">${email}</a>` },
      { cls: "out",    text: `→ LINKS: ${socials.map((s) => s.label).join(" / ")}` },
      { cls: "prompt", text: "$ _" },
    ]);
    const wrap = $("#socials");
    wrap.classList.remove("locked");
    socials.forEach((s) => {
      const a = document.createElement("a");
      a.className = "social"; a.href = s.url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = `// ${s.label}`;
      wrap.appendChild(a);
      magnetizeEl(a);
    });
  }

  btn.addEventListener("mousedown", down);
  btn.addEventListener("touchstart", down, { passive: false });
  btn.addEventListener("touchcancel", up);
  window.addEventListener("mouseup", up);
  window.addEventListener("touchend", up);
}

/* ====================================================================
   NAV link glitch on hover (random text scramble)
   ==================================================================== */
function navScramble() {
  if (matchMedia("(pointer: coarse)").matches) return;
  const glyphs = "!<>-_\\/[]{}—=+*^?#01";
  $$(".nav-links a").forEach((a) => {
    const original = a.dataset.text;
    let iv;
    a.addEventListener("mouseenter", () => {
      let frame = 0;
      clearInterval(iv);
      iv = setInterval(() => {
        a.textContent = original
          .split("")
          .map((ch, idx) => (idx < frame ? original[idx] : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join("");
        if (frame >= original.length) clearInterval(iv);
        frame += 0.5;
      }, 40);
    });
    a.addEventListener("mouseleave", () => { clearInterval(iv); a.textContent = original; });
  });
}

/* ====================================================================
   ctOS PROFILER — floating scan card (Watch Dogs style)
   ==================================================================== */
function profiler() {
  const card = $("#profiler");
  const nameEl = $("#profName");
  const subEl  = $("#profSub");
  const rowsEl = $("#profRows");
  const noteEl = $("#profNote");
  let active = false;

  function fill(f) {
    nameEl.textContent = f.name;
    subEl.textContent = f.sub;
    rowsEl.innerHTML = f.rows
      .map(([k, v, warn]) => `<div class="row"><span>${k}</span><b class="${warn ? "warn" : ""}">${v}</b></div>`)
      .join("");
    noteEl.textContent = f.note;
  }
  function move(e) {
    const pad = 18;
    let x = e.clientX + 22, y = e.clientY + 22;
    const w = card.offsetWidth, h = card.offsetHeight;
    if (x + w + pad > window.innerWidth)  x = e.clientX - w - 22;
    if (y + h + pad > window.innerHeight) y = window.innerHeight - h - pad;
    card.style.left = x + "px";
    card.style.top  = y + "px";
  }
  function bind(el, getFields) {
    el.addEventListener("mouseenter", (e) => {
      active = true;
      fill(getFields());
      card.classList.remove("show"); void card.offsetWidth; card.classList.add("show");
      move(e);
    });
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", () => { active = false; card.classList.remove("show"); });
  }

  // person profile (hero name)
  const p = DATA.profile;
  const nameTarget = $("#heroName");
  if (nameTarget) {
    bind(nameTarget, () => ({
      name: DATA.name,
      sub: "ALIAS: " + DATA.handle,
      rows: [
        ["OCCUPATION", p.occupation],
        ["DEDSEC FOLLOWERS", p.followers],
        ["EXPECTED INCOME", p.income],
        ["STATUS", DATA.status, true],
        ["THREAT LEVEL", p.threat, true],
      ],
      note: "» " + p.note,
    }));
  }

  // each project becomes a "scan target"
  $$(".proj").forEach((card, i) => {
    const proj = DATA.projects[i];
    if (!proj) return;
    bind(card, () => ({
      name: proj.title,
      sub: "TARGET CLASS: " + proj.tag,
      rows: [
        ["OP ID", "OP_" + proj.id],
        ["STATUS", "COMPROMISED", true],
        ["STACK", proj.tech.slice(0, 3).join(" · ")],
      ],
      note: "» " + proj.description,
    }));
  });
}

/* ====================================================================
   ctOS INTERFERENCE — random signal-loss glitch bursts
   ==================================================================== */
function interference() {
  const layer = $("#interference");
  if (!layer || REDUCED_MOTION) return;
  function burst() {
    layer.classList.remove("active");
    void layer.offsetWidth;
    layer.classList.add("active");
    document.body.classList.add("glitch-active");
    if (SFX.on) SFX.glitch();
    setTimeout(() => document.body.classList.remove("glitch-active"), 300);
    schedule();
  }
  function schedule() {
    setTimeout(burst, 8000 + Math.random() * 9000);
  }
  schedule();
}

/* ====================================================================
   PROJECT CARDS — decode/scramble title on hover + "ACCESS GRANTED"
   ==================================================================== */
function projectFX() {
  if (matchMedia("(pointer: coarse)").matches) return;
  const glyphs = "01!<>-_\\/[]{}=+*ABCDEF#@%";
  $$(".proj").forEach((card) => {
    const title = card.querySelector("h3");
    const original = title.textContent;
    let iv;
    card.addEventListener("mouseenter", () => {
      let frame = 0;
      clearInterval(iv);
      iv = setInterval(() => {
        title.textContent = original
          .split("")
          .map((ch, i) => (ch === " " ? " " : i < frame ? original[i] : glyphs[Math.floor(Math.random() * glyphs.length)]))
          .join("");
        if (frame >= original.length) { clearInterval(iv); title.textContent = original; }
        frame += 0.6;
      }, 35);
      card.querySelector(".proj-tag").dataset.prev = card.querySelector(".proj-tag").textContent;
    });
    card.addEventListener("mouseleave", () => { clearInterval(iv); title.textContent = original; });
  });
}

/* ====================================================================
   MAGNETIC BUTTONS — pull toward the cursor
   ==================================================================== */
function magnetizeEl(el) {
  if (matchMedia("(pointer: coarse)").matches) return;
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  });
  el.addEventListener("mouseleave", () => { el.style.transform = ""; });
}
function magnetic() {
  $$(".btn").forEach(magnetizeEl);
}

/* ====================================================================
   MOBILE NAV TOGGLE
   ==================================================================== */
function navToggle() {
  const btn = $("#navToggle");
  const links = $("#navLinks");
  if (!btn || !links) return;
  const setOpen = (open) => {
    links.classList.toggle("open", open);
    btn.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  };
  btn.addEventListener("click", () => setOpen(!links.classList.contains("open")));
  $$("a", links).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760 && links.classList.contains("open")) setOpen(false);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("open")) setOpen(false);
  });
}

function navAnchors() {
  $$('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const target = $(id);
    if (!target) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      closeNavMenu();
      scrollToSection(target);
    });
  });
}

/* ====================================================================
   SOUND TOGGLE (dock button) + global UI click ticks
   ==================================================================== */
function soundUI() {
  const btn = $("#soundToggle");
  if (!btn) return;
  const label = btn.querySelector(".snd-label");
  const KEY = "dedsec-audio";
  let on = false;
  try { on = localStorage.getItem(KEY) === "1"; } catch (e) {}

  const apply = (playPowerOn = false) => {
    SFX.set(on);
    btn.classList.toggle("off", !on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    if (label) label.textContent = on ? "AUDIO ON" : "AUDIO OFF";
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    if (playPowerOn && on) SFX.powerOn();
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    on = !on;
    apply(true);
    if (on) SFX.click();
  });
  apply(false);

  document.addEventListener("click", (e) => {
    if (!SFX.on || e.target.closest("#soundToggle")) return;
    if (e.target.closest("a, button, .btn, .proj, .proj-intel, .resnode, .social, .dock-btn, .ctmodal-x")) SFX.click();
  });
}

/* ====================================================================
   ctOS VISITOR PROFILER — scans the recruiter on arrival
   ==================================================================== */
function visitorProfiler() {
  const card = $("#vprofiler");
  if (!card) return;
  const ua = navigator.userAgent;
  const browser = /edg/i.test(ua) ? "Edge" : /opr|opera/i.test(ua) ? "Opera"
    : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox"
    : /safari/i.test(ua) ? "Safari" : "Unknown";
  const os = /windows/i.test(ua) ? "Windows" : /mac os|macintosh/i.test(ua) ? "macOS"
    : /android/i.test(ua) ? "Android" : /iphone|ipad|ipod/i.test(ua) ? "iOS"
    : /linux/i.test(ua) ? "Linux" : "Unknown";
  let city = "UNKNOWN";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    city = (tz.split("/").pop() || "").replace(/_/g, " ").toUpperCase() || "UNKNOWN";
  } catch (e) {}
  const lang = (navigator.language || "??").toUpperCase();
  const display = `${screen.width}×${screen.height}`;
  const touch = matchMedia("(pointer: coarse)").matches ? "MOBILE NODE" : "WORKSTATION";

  const nameEl = $("#vpName"), subEl = $("#vpSub"), rowsEl = $("#vpRows"), noteEl = $("#vpNote");

  function reveal() {
    card.classList.add("show");
    card.setAttribute("aria-hidden", "false");
    SFX.profilerScan();
    scrambleReveal(nameEl, "VISITOR IDENTIFIED");
    setTimeout(() => {
      subEl.textContent = `SIGNATURE: ${browser} / ${os}`;
      const rows = [
        ["DEVICE", touch],
        ["LOCATION", city, true],
        ["LOCALE", lang],
        ["DISPLAY", display],
        ["INTENT", "TALENT ACQUISITION", true],
        ["THREAT", "ABOUT TO HIRE", true],
      ];
      rowsEl.innerHTML = rows
        .map(([k, v, w]) => `<div class="row"><span>${k}</span><b class="${w ? "warn" : ""}">${v}</b></div>`)
        .join("");
      noteEl.textContent = "» You're being profiled too. Fair's fair — let's talk.";
    }, 700);
  }
  function dismiss() { card.classList.remove("show"); card.setAttribute("aria-hidden", "true"); }
  $("#vpClose")?.addEventListener("click", dismiss);

  // appear shortly after the boot loader clears, auto-dismiss later
  setTimeout(reveal, 1500);
  setTimeout(dismiss, 13000);
}

/* ====================================================================
   INTERACTIVE ctOS TERMINAL
   ==================================================================== */
function terminal() {
  const modal = $("#termModal"), out = $("#termOut"), input = $("#termIn");
  const hint = $("#termHint");
  if (!modal || !input) return;
  const history = []; let hidx = -1;

  const line = (cls, content) => {
    const d = document.createElement("div");
    d.className = "tl-" + cls;
    if (typeof content === "string") d.innerHTML = content;
    else d.appendChild(content);
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
    syncTermHint(out, hint);
  };
  const print = (rows) => rows.forEach(([c, t]) => line(c, t));

  function banner() {
    return [
      ["ok",   "ctOS_shell v2.0 — connection established."],
      ["muted","Type 'help' for available commands. ESC closes."],
      ["muted","\u00a0"],
    ];
  }

  const COMMANDS = {
    help: () => print([
      ["out", "AVAILABLE COMMANDS:"],
      ["muted", "&nbsp;&nbsp;whoami&nbsp;&nbsp;&nbsp;&nbsp;— operative identity"],
      ["muted", "&nbsp;&nbsp;about&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— mission profile"],
      ["muted", "&nbsp;&nbsp;skills&nbsp;&nbsp;&nbsp;&nbsp;— arsenal / proficiencies"],
      ["muted", "&nbsp;&nbsp;ops&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— list operations (projects)"],
      ["muted", "&nbsp;&nbsp;contact&nbsp;&nbsp;&nbsp;— uplink details"],
      ["muted", "&nbsp;&nbsp;resume&nbsp;&nbsp;&nbsp;&nbsp;— extract CV file"],
      ["muted", "&nbsp;&nbsp;hire&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— why you should"],
      ["muted", "&nbsp;&nbsp;goto&nbsp;[id]&nbsp;&nbsp;— jump to a section"],
      ["muted", "&nbsp;&nbsp;clear&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;— wipe the console"],
      ["muted", "&nbsp;&nbsp;sudo&nbsp;hire&nbsp;me — try it"],
    ]),
    whoami: () => print([
      ["out", `${DATA.name} // ${DATA.handle}`],
      ["muted", `${DATA.roles.join(" · ")}`],
      ["muted", `LOCATION: ${DATA.location} · STATUS: ${DATA.status}`],
    ]),
    about: () => print([["out", DATA.about.headline], ...DATA.about.paragraphs.map((p) => ["muted", p])]),
    skills: () => print(DATA.skills.map((s) => ["muted", `${String(s.level).padStart(3)}%  ${s.name}`])),
    ops: () => print(DATA.projects.map((p) => ["out", `OP_${p.id}  [${p.tag}]  ${p.title}`])),
    projects: () => COMMANDS.ops(),
    contact: () => print([
      ["out", `EMAIL: <a href="mailto:${DATA.contact.email}">${DATA.contact.email}</a>`],
      ...DATA.contact.socials.map((s) => ["muted", `${s.label}: <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a>`]),
    ]),
    resume: () => { line("ok", "→ extracting operative file…"); doExtract(); },
    cv: () => COMMANDS.resume(),
    hire: () => print([
      ["ok", "→ REASONS TO HIRE:"],
      ["muted", "&nbsp;&nbsp;• Hard worker — follows through on real projects, not just demos."],
      ["muted", "&nbsp;&nbsp;• Strong team player — clear communication, reliable under deadlines."],
      ["muted", "&nbsp;&nbsp;• Learns new stacks fast and owns problems end-to-end."],
      ["out", "→ run 'contact' to start the uplink."],
    ]),
    "sudo": (args) => {
      if (args.join(" ").includes("hire")) return print([["ok", "→ Permission granted. Excellent choice. Opening uplink…"], ["muted", "redirecting to #contact"]]), goto("contact");
      print([["err", "sudo: this incident will be reported to DedSec."]]);
    },
    goto: (args) => goto(args[0]),
    clear: () => { out.innerHTML = ""; syncTermHint(out, hint); },
    hack: () => print([["ok", "→ Nice try. The planet is already hacked. (try the Konami code)"]]),
  };

  function goto(id) {
    const map = { about: "#about", skills: "#skills", ops: "#projects", projects: "#projects", contact: "#contact", hero: "#hero", top: "#hero" };
    const sel = map[id];
    if (!sel) return print([["err", `goto: unknown section '${id || ""}'`]]);
    close();
    scrollToSection(sel);
  }

  function run(raw) {
    const cmd = raw.trim();
    line("ps", `<span class="tl-ps">y4thindu@ctos:~$</span> <span class="tl-cmd">${cmd.replace(/</g, "&lt;")}</span>`);
    if (!cmd) return;
    history.unshift(cmd); hidx = -1;
    const [name, ...args] = cmd.split(/\s+/);
    const fn = COMMANDS[name.toLowerCase()];
    if (fn) fn(args);
    else print([["err", `command not found: ${name} — type 'help'`]]);
  }

  function open() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    syncModalScrollLock();
    if (!out.dataset.greeted) {
      out.dataset.greeted = "1";
      print(banner());
    }
    syncTermHint(out, hint);
    SFX.modalOpen();
    setTimeout(() => input.focus(), 60);
  }
  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    syncModalScrollLock();
  }

  $("#termOpen")?.addEventListener("click", open);
  $("#termClose")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { run(input.value); input.value = ""; }
    else if (e.key === "Escape") { close(); }
    else if (e.key === "ArrowUp") { if (history.length) { hidx = Math.min(hidx + 1, history.length - 1); input.value = history[hidx]; e.preventDefault(); } }
    else if (e.key === "ArrowDown") { hidx = Math.max(hidx - 1, -1); input.value = hidx === -1 ? "" : history[hidx]; e.preventDefault(); }
    else SFX.type();
  });

  // global toggle: backtick / tilde (when not already typing in the terminal)
  window.addEventListener("keydown", (e) => {
    if ((e.key === "`" || e.key === "~") && e.target !== input) {
      e.preventDefault();
      modal.classList.contains("open") ? close() : open();
    } else if (e.key === "Escape" && modal.classList.contains("open")) {
      close();
    }
  });
}

/* ====================================================================
   RESUME EXTRACTION — download with a hacker progress animation
   ==================================================================== */
function doExtract() {
  const url = DATA.resume;
  if (!url) return;
  const a = document.createElement("a");
  a.href = url; a.download = url.split("/").pop();
  document.body.appendChild(a); a.click(); a.remove();
}
function extractCV() {
  const btn = $("#cvBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (btn.dataset.busy) return;
    btn.dataset.busy = "1";
    const orig = btn.textContent;
    const setLabel = (t) => { btn.textContent = t; btn.setAttribute("data-text", t); };
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 20 + 9; if (p >= 100) p = 100;
      setLabel(`EXTRACTING ${Math.floor(p)}%`);
      if (p >= 100) {
        clearInterval(iv);
        setLabel("FILE EXTRACTED ✓");
        SFX.extractDone();
        doExtract();
        setTimeout(() => { setLabel(orig); delete btn.dataset.busy; }, 1900);
      }
    }, 170);
  });
}

/* ====================================================================
   KONAMI CODE — HACK THE PLANET
   ==================================================================== */
function konami() {
  const seq = ["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
  let idx = 0;
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === seq[idx]) { idx++; if (idx === seq.length) { idx = 0; hackThePlanet(); } }
    else idx = (k === seq[0]) ? 1 : 0;
  });
}
function hackThePlanet() {
  const layer = $("#htp"), canvas = $("#htpCanvas");
  if (!layer || !canvas || layer.classList.contains("on")) return;
  layer.classList.add("on");
  document.body.classList.add("glitch-active");
  SFX.success();
  const ctx = canvas.getContext("2d");
  canvas.width = innerWidth; canvas.height = innerHeight;
  const step = 14, cols = Math.floor(canvas.width / step);
  const drops = Array(cols).fill(0).map(() => Math.random() * -40);
  const chars = "01ABCDEF<>/\\#@01ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜ";
  let raf, t0 = performance.now();
  (function draw(now) {
    ctx.fillStyle = "rgba(0,0,0,0.09)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "14px monospace";
    for (let i = 0; i < cols; i++) {
      ctx.fillStyle = Math.random() > 0.9 ? "#b6ff2a" : "#1effd6";
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * step, drops[i] * step);
      if (drops[i] * step > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    if (now - t0 < 3400) raf = requestAnimationFrame(draw);
    else { cancelAnimationFrame(raf); layer.classList.remove("on"); document.body.classList.remove("glitch-active"); }
  })(t0);
}

/* ====================================================================
   SESSION HUD — live clock + time-on-grid + reveal dock
   ==================================================================== */
function sessionHud() {
  const hud = $("#sysHud"), dock = $("#sysDock");
  const clock = $("#hudClock"), sess = $("#hudSession");
  const start = Date.now();
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const d = new Date();
    if (clock) clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const s = Math.floor((Date.now() - start) / 1000);
    if (sess) sess.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  }
  tick(); setInterval(tick, 1000);
  setTimeout(() => {
    hud?.classList.add("show"); hud?.setAttribute("aria-hidden", "false");
    dock?.classList.add("show"); dock?.setAttribute("aria-hidden", "false");
  }, 1300);
}

/* ====================================================================
   ONE-TIME DISCOVERY HINT (points at terminal + reveals Konami code)
   ==================================================================== */
function discoveryHint() {
  const hint = $("#dockHint");
  if (!hint) return;
  let hideTimer;
  const dismiss = () => {
    hint.classList.remove("show");
    hint.setAttribute("aria-hidden", "true");
    clearTimeout(hideTimer);
  };
  $("#dockHintX")?.addEventListener("click", dismiss);
  // vanish for good the moment they actually open the terminal
  const modal = $("#termModal");
  if (modal) {
    new MutationObserver(() => { if (modal.classList.contains("open")) dismiss(); })
      .observe(modal, { attributes: true, attributeFilter: ["class"] });
  }
  // appear after the visitor profiler has had its moment
  setTimeout(() => {
    hint.classList.add("show");
    hint.setAttribute("aria-hidden", "false");
    SFX.type();
    hideTimer = setTimeout(dismiss, 12000);
  }, 4200);
}

/* ====================================================================
   ctOS MODALS — case study + research unlock
   ==================================================================== */
let ctModalBound = false;

function bindCtModalClose() {
  if (ctModalBound) return;
  ctModalBound = true;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeCaseModal(); closeResearchModal(); }
  });
  $$("[data-close]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.close === "case") closeCaseModal();
      if (el.dataset.close === "research") closeResearchModal();
    });
  });
}

function closeCaseModal() {
  const m = $("#caseModal");
  if (!m) return;
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  syncModalScrollLock();
}

function closeResearchModal() {
  const m = $("#researchModal");
  if (!m) return;
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  syncModalScrollLock();
}

function openCaseModal(proj) {
  if (!proj?.caseStudy) return;
  bindCtModalClose();
  const cs = proj.caseStudy;
  $("#caseId").textContent = `OP_${proj.id}`;
  $("#caseTag").textContent = proj.tag;
  $("#caseTitle").textContent = proj.title;
  $("#caseProblem").textContent = cs.problem;
  $("#caseOutcome").textContent = cs.outcome;
  $("#caseRole").textContent = cs.role;
  $("#caseTech").innerHTML = proj.tech.map((t) => `<span>${t}</span>`).join("");
  const actions = $("#caseActions");
  actions.innerHTML = "";
  if (proj.repo && proj.repo !== "#") {
    const a = document.createElement("a");
    a.href = proj.repo; a.target = "_blank"; a.rel = "noopener";
    a.textContent = "{ } SOURCE";
    actions.appendChild(a);
  }
  if (proj.link && proj.link !== "#") {
    const a = document.createElement("a");
    a.href = proj.link; a.target = "_blank"; a.rel = "noopener";
    a.textContent = "▶ LIVE DEMO";
    actions.appendChild(a);
  }
  const m = $("#caseModal");
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  syncModalScrollLock();
  SFX.modalOpen();
}

function openResearchModal(skill, node) {
  const r = skill.research;
  if (!r) return;
  bindCtModalClose();
  node?.classList.add("unlocked");
  $("#researchSkillName").textContent = skill.name;
  $("#researchLevel").textContent = `${skill.level}% CHARGED`;
  $("#researchProject").textContent = `${r.project} (OP_${r.opId})`;
  $("#researchProof").textContent = r.proof;
  const actions = $("#researchActions");
  actions.innerHTML = "";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = `◈ VIEW OP_${r.opId} INTEL`;
  btn.addEventListener("click", () => {
    const proj = DATA.projects.find((p) => p.id === r.opId);
    closeResearchModal();
    if (proj) openCaseModal(proj);
  });
  actions.appendChild(btn);
  const m = $("#researchModal");
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  syncModalScrollLock();
  SFX.researchUnlock();
}

function caseStudyModals() {
  $$(".proj").forEach((card, i) => {
    const proj = DATA.projects[i];
    if (!proj) return;
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      openCaseModal(proj);
    });
    card.querySelector(".proj-intel")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openCaseModal(proj);
    });
  });
}

function researchUnlock() {
  $$(".resnode").forEach((node) => {
    const i = +node.dataset.i;
    const sk = DATA.skills[i];
    if (!sk?.research) return;
    node.setAttribute("role", "button");
    node.setAttribute("tabindex", "0");
    node.setAttribute("aria-label", `Research unlock: ${sk.name}`);
    const open = () => openResearchModal(sk, node);
    node.addEventListener("click", (e) => { e.stopPropagation(); open(); });
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
}

/* ====================================================================
   INIT
   ==================================================================== */
populate();
cursor();
observers();
navScramble();
navToggle();
navAnchors();
projectFX();
caseStudyModals();
researchUnlock();
magnetic();
profiler();
hack();
interference();
soundUI();
visitorProfiler();
terminal();
extractCV();
konami();
sessionHud();
discoveryHint();
boot();

/* if scene.js never loads, don't trap user on loader forever */
setTimeout(() => {
  if (document.body.classList.contains("loader-active")) bootFinish();
}, 12000);
