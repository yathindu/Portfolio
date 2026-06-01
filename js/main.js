import { DATA } from "./data.js";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const SVG_NS = "http://www.w3.org/2000/svg";
const RES_LAYOUT = [[50,9],[25,31],[75,31],[13,56],[38,56],[62,56],[87,56],[50,82]];
const RES_EDGES  = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[4,7],[5,7]];
let resRevealed = false;

function populate() {
  $("#heroHandle").textContent = `> ${DATA.handle}`;
  const nameEl = $("#heroName");
  nameEl.textContent = DATA.name;
  nameEl.setAttribute("data-text", DATA.name);
  $("#heroLoc").textContent = DATA.location.toUpperCase();
  $("#navStatus").textContent = DATA.status;
  $("#heroTagline").textContent = DATA.tagline;

  $("#aboutHeadline").textContent = DATA.about.headline;
  DATA.about.paragraphs.forEach(p => {
    const el = document.createElement("p");
    el.textContent = p;
    $("#aboutParas").appendChild(el);
  });
  DATA.about.stats.forEach(s => {
    const d = document.createElement("div");
    d.className = "stat";
    d.innerHTML = `<div class="stat-val">${s.value}</div><div class="stat-label">${s.label}</div>`;
    $("#statsGrid").appendChild(d);
  });

  buildResearchTree();

  DATA.projects.forEach(p => {
    const el = document.createElement("article");
    el.className = "proj";
    el.innerHTML = `
      <div class="proj-top">
        <span class="proj-id">OP_${p.id}</span>
        <span class="proj-tag">${p.tag}</span>
      </div>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="proj-tech">${p.tech.map(t => `<span>${t}</span>`).join("")}</div>
      <div class="proj-links">
        <a href="${p.repo}" target="_blank" rel="noopener"><span>{ }</span> SOURCE</a>
      </div>`;
    $("#projectsGrid").appendChild(el);
  });

  const { email, socials } = DATA.contact;
  const wrap = $("#socials");
  socials.forEach(s => {
    const a = document.createElement("a");
    a.className = "social"; a.href = s.url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = `// ${s.label}`;
    wrap.appendChild(a);
  });

  typeLines([
    { cls: "prompt", text: "$ ./connect --operative" },
    { cls: "out",    text: "→ Channel open. Let's build something dangerous." },
    { cls: "muted",  text: "" },
    { cls: "prompt", text: "$ whoami" },
    { cls: "out",    text: `→ ${DATA.name} // ${DATA.handle}` },
    { cls: "muted",  text: "" },
    { cls: "prompt", text: `$ echo "reach out"` },
    { cls: "out",    html: `→ EMAIL: <a href="mailto:${email}">${email}</a>` },
    { cls: "prompt", text: "$ _" },
  ]);

  $("#year").textContent = new Date().getFullYear();
}

function buildResearchTree() {
  const sg = $("#skillsGrid");
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "restree-svg");
  sg.appendChild(svg);
  DATA.skills.forEach((sk, i) => {
    const pos = RES_LAYOUT[i] || [12 + (i % 8) * 11, 96];
    const node = document.createElement("div");
    node.className = "resnode"; node.dataset.i = i;
    node.style.left = pos[0] + "%"; node.style.top = pos[1] + "%";
    node.innerHTML = `<div class="resnode-core"><span class="resnode-pct">${sk.level}</span></div><div class="resnode-label">${sk.name}</div>`;
    sg.appendChild(node);
  });
}

function drawResearchLinks() {
  const sg = $("#skillsGrid");
  const svg = sg.querySelector(".restree-svg");
  const nodes = $$(".resnode", sg);
  const W = sg.clientWidth, H = sg.clientHeight;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W); svg.setAttribute("height", H);
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
    line.style.strokeDashoffset = resRevealed ? 0 : len;
    svg.appendChild(line);
  });
}

function researchReveal() {
  if (resRevealed) return;
  resRevealed = true;
  drawResearchLinks();
  requestAnimationFrame(() => $$(".reslink", $("#skillsGrid")).forEach(l => l.style.strokeDashoffset = 0));
  $$(".resnode", $("#skillsGrid")).forEach((n, i) => {
    setTimeout(() => {
      n.classList.add("researched");
      n.querySelector(".resnode-core").style.setProperty("--lvl", DATA.skills[i].level);
    }, 240 + i * 130);
  });
  window.addEventListener("resize", drawResearchLinks);
}

function typeLines(lines, cb) {
  const b = $("#termBody"); let i = 0;
  (function next() {
    if (i >= lines.length) { cb && cb(); return; }
    const l = lines[i++];
    const div = document.createElement("div");
    div.className = "ln " + l.cls;
    if (l.html) div.innerHTML = l.html; else div.textContent = l.text || " ";
    b.appendChild(div);
    setTimeout(next, l.text === "" ? 120 : 300);
  })();
}

function scrambleReveal(el, finalText) {
  const glyphs = "01!<>-_\\/[]{}=+*#%ABCDEF";
  let frame = 0;
  clearInterval(el._sc);
  el._sc = setInterval(() => {
    el.textContent = finalText.split("").map((ch, i) =>
      ch === " " ? " " : i < frame ? finalText[i] : glyphs[Math.floor(Math.random() * glyphs.length)]
    ).join("");
    if (frame >= finalText.length) { clearInterval(el._sc); el.textContent = finalText; }
    frame += 0.8;
  }, 28);
}

function triggerReveal(section) {
  section.classList.add("in");
  const title = section.querySelector(".section-title");
  if (title) scrambleReveal(title, title.dataset.text || title.textContent);
  if (section.id === "about") { const h = $("#aboutHeadline"); if (h) scrambleReveal(h, h.textContent); }
  if (section.id === "skills") researchReveal();
}

function observers() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { triggerReveal(en.target); io.unobserve(en.target); } });
  }, { threshold: 0.18 });
  $$(".reveal").forEach(s => io.observe(s));
}

function profiler() {
  const card = $("#profiler");
  function fill(f) {
    $("#profName").textContent = f.name;
    $("#profSub").textContent = f.sub;
    $("#profRows").innerHTML = f.rows.map(([k,v,w]) =>
      `<div class="row"><span>${k}</span><b class="${w?"warn":""}">${v}</b></div>`
    ).join("");
    $("#profNote").textContent = f.note;
  }
  function move(e) {
    const pad = 18;
    let x = e.clientX + 22, y = e.clientY + 22;
    if (x + card.offsetWidth + pad > window.innerWidth) x = e.clientX - card.offsetWidth - 22;
    if (y + card.offsetHeight + pad > window.innerHeight) y = window.innerHeight - card.offsetHeight - pad;
    card.style.left = x + "px"; card.style.top = y + "px";
  }
  function bind(el, getFields) {
    el.addEventListener("mouseenter", e => {
      fill(getFields());
      card.classList.remove("show"); void card.offsetWidth; card.classList.add("show"); move(e);
    });
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", () => card.classList.remove("show"));
  }
  const p = DATA.profile;
  const nameTarget = $("#heroName");
  if (nameTarget) {
    bind(nameTarget, () => ({
      name: DATA.name, sub: "ALIAS: " + DATA.handle,
      rows: [["OCCUPATION",p.occupation],["DEDSEC FOLLOWERS",p.followers],["EXPECTED INCOME",p.income],["STATUS",DATA.status,true],["THREAT LEVEL",p.threat,true]],
      note: "» " + p.note,
    }));
  }
  $$(".proj").forEach((card, i) => {
    const proj = DATA.projects[i]; if (!proj) return;
    bind(card, () => ({
      name: proj.title, sub: "TARGET CLASS: " + proj.tag,
      rows: [["OP ID","OP_"+proj.id],["STATUS","COMPROMISED",true],["STACK",proj.tech.slice(0,3).join(" · ")]],
      note: "» " + proj.description,
    }));
  });
}

function projectFX() {
  const glyphs = "01!<>-_\\/[]{}=+*ABCDEF#@%";
  $$(".proj").forEach(card => {
    const title = card.querySelector("h3"), original = title.textContent; let iv;
    card.addEventListener("mouseenter", () => {
      let frame = 0; clearInterval(iv);
      iv = setInterval(() => {
        title.textContent = original.split("").map((ch, i) =>
          ch === " " ? " " : i < frame ? original[i] : glyphs[Math.floor(Math.random() * glyphs.length)]
        ).join("");
        if (frame >= original.length) { clearInterval(iv); title.textContent = original; }
        frame += 0.6;
      }, 35);
    });
    card.addEventListener("mouseleave", () => { clearInterval(iv); title.textContent = original; });
  });
}

function navScramble() {
  const glyphs = "!<>-_\\/[]{}—=+*^?#01";
  $$(".nav-links a").forEach(a => {
    const original = a.dataset.text; let iv;
    a.addEventListener("mouseenter", () => {
      let frame = 0; clearInterval(iv);
      iv = setInterval(() => {
        a.textContent = original.split("").map((ch, idx) =>
          idx < frame ? original[idx] : glyphs[Math.floor(Math.random() * glyphs.length)]
        ).join("");
        if (frame >= original.length) clearInterval(iv);
        frame += 0.5;
      }, 40);
    });
    a.addEventListener("mouseleave", () => { clearInterval(iv); a.textContent = original; });
  });
}

function magnetizeEl(el) {
  el.addEventListener("mousemove", e => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX-(r.left+r.width/2))*0.25}px,${(e.clientY-(r.top+r.height/2))*0.35}px)`;
  });
  el.addEventListener("mouseleave", () => el.style.transform = "");
}

function boot() {
  const fill = $("#loaderFill"), text = $("#loaderText"), art = $("#loaderArt");
  const msgs = ["ESTABLISHING SECURE CONNECTION...","BYPASSING ctOS FIREWALL...","DECRYPTING OPERATIVE PROFILE...","ACCESS GRANTED."];
  document.documentElement.classList.add("loader-active");
  document.body.classList.add("loader-active");
  const run = () => {
    const start = performance.now();
    const iv = setInterval(() => {
      const p = Math.min(100, ((performance.now() - start) / 2800) * 100);
      fill.style.width = p + "%";
      text.textContent = msgs[Math.min(Math.floor(p / 26), msgs.length - 1)];
      if (p >= 100) {
        clearInterval(iv); text.textContent = msgs[msgs.length - 1];
        setTimeout(() => {
          document.documentElement.classList.remove("loader-active");
          document.body.classList.remove("loader-active");
          $("#loader").classList.add("done");
          startTypewriter();
          triggerReveal($("#hero"));
        }, 450);
      }
    }, 40);
  };
  if (art && !art.complete) { art.addEventListener("load", run, { once: true }); art.addEventListener("error", run, { once: true }); }
  else run();
}

function startTypewriter() {
  const el = $("#heroRole"), roles = DATA.roles;
  let r = 0, c = 0, del = false;
  function tick() {
    const word = roles[r];
    if (!del) { el.textContent = word.slice(0, ++c); if (c === word.length) { del = true; return setTimeout(tick, 1600); } }
    else { el.textContent = word.slice(0, --c); if (c === 0) { del = false; r = (r + 1) % roles.length; } }
    setTimeout(tick, del ? 45 : 80);
  }
  tick();
}

function cursor() {
  const dot = $("#cursorDot"), ring = $("#cursorRing");
  let rx = 0, ry = 0, dx = 0, dy = 0;
  window.addEventListener("mousemove", e => { dx = e.clientX; dy = e.clientY; dot.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`; });
  (function loop() { rx += (dx-rx)*0.18; ry += (dy-ry)*0.18; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  const hov = "a,button,.btn,.proj,.resnode";
  document.addEventListener("mouseover", e => { if (e.target.closest(hov)) ring.classList.add("hovering"); });
  document.addEventListener("mouseout",  e => { if (e.target.closest(hov)) ring.classList.remove("hovering"); });
}

function navToggle() {
  const btn = $("#navToggle"), links = $("#navLinks"); if (!btn) return;
  btn.addEventListener("click", () => { const o = links.classList.toggle("open"); btn.classList.toggle("open",o); btn.setAttribute("aria-expanded",o); });
  $$("a", links).forEach(a => a.addEventListener("click", () => { links.classList.remove("open"); btn.classList.remove("open"); btn.setAttribute("aria-expanded","false"); }));
}

function extractCV() {
  const btn = $("#cvBtn"); if (!btn) return;
  btn.addEventListener("click", () => {
    if (btn.dataset.busy) return; btn.dataset.busy = "1";
    const orig = btn.textContent;
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 20 + 9; if (p >= 100) p = 100;
      btn.textContent = `EXTRACTING ${Math.floor(p)}%`;
      if (p >= 100) {
        clearInterval(iv); btn.textContent = "FILE EXTRACTED ✓";
        const a = document.createElement("a"); a.href = DATA.resume; a.download = DATA.resume.split("/").pop();
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => { btn.textContent = orig; delete btn.dataset.busy; }, 1900);
      }
    }, 170);
  });
}

populate();
cursor();
observers();
navScramble();
navToggle();
projectFX();
$$(".btn").forEach(magnetizeEl);
profiler();
extractCV();
boot();
window.addEventListener("error", () => $("#loader")?.classList.add("done"));
