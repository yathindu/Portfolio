import { DATA } from "./data.js";

const $ = (s) => document.querySelector(s);

function populate() {
  $("#heroHandle").textContent = `> ${DATA.handle}`;
  const nameEl = $("#heroName");
  nameEl.textContent = DATA.name;
  nameEl.setAttribute("data-text", DATA.name);
  $("#heroLoc").textContent = DATA.location.toUpperCase();
  $("#navStatus").textContent = DATA.status;
  $("#heroTagline").textContent = DATA.tagline;
  $("#year").textContent = new Date().getFullYear();
}

function boot() {
  const fill = $("#loaderFill"), text = $("#loaderText"), art = $("#loaderArt");
  const msgs = ["ESTABLISHING SECURE CONNECTION...", "BYPASSING ctOS FIREWALL...", "DECRYPTING OPERATIVE PROFILE...", "ACCESS GRANTED."];
  document.documentElement.classList.add("loader-active");
  document.body.classList.add("loader-active");

  const run = () => {
    const start = performance.now();
    const iv = setInterval(() => {
      const p = Math.min(100, ((performance.now() - start) / 2800) * 100);
      fill.style.width = p + "%";
      text.textContent = msgs[Math.min(Math.floor(p / 26), msgs.length - 1)];
      if (p >= 100) {
        clearInterval(iv);
        text.textContent = msgs[msgs.length - 1];
        setTimeout(() => {
          document.documentElement.classList.remove("loader-active");
          document.body.classList.remove("loader-active");
          $("#loader").classList.add("done");
          startTypewriter();
        }, 450);
      }
    }, 40);
  };

  if (art && !art.complete) {
    art.addEventListener("load", run, { once: true });
    art.addEventListener("error", run, { once: true });
  } else run();
}

function startTypewriter() {
  const el = $("#heroRole");
  const roles = DATA.roles;
  let r = 0, c = 0, del = false;
  function tick() {
    const word = roles[r];
    if (!del) {
      el.textContent = word.slice(0, ++c);
      if (c === word.length) { del = true; return setTimeout(tick, 1600); }
    } else {
      el.textContent = word.slice(0, --c);
      if (c === 0) { del = false; r = (r + 1) % roles.length; }
    }
    setTimeout(tick, del ? 45 : 80);
  }
  tick();
}

function cursor() {
  const dot = $("#cursorDot"), ring = $("#cursorRing");
  let rx = 0, ry = 0, dx = 0, dy = 0;
  window.addEventListener("mousemove", (e) => {
    dx = e.clientX; dy = e.clientY;
    dot.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
  });
  (function loop() {
    rx += (dx - rx) * 0.18; ry += (dy - ry) * 0.18;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a,button,.btn")) ring.classList.add("hovering");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a,button,.btn")) ring.classList.remove("hovering");
  });
}

function navToggle() {
  const btn = $("#navToggle"), links = $("#navLinks");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open);
  });
}

populate();
cursor();
navToggle();
boot();
window.addEventListener("error", () => $("#loader")?.classList.add("done"));
