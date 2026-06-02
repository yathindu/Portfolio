import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass }     from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";

const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_MOBILE = matchMedia("(max-width: 760px)").matches;
const IS_COARSE = matchMedia("(pointer: coarse)").matches;
const LIGHT_SCENE = REDUCED_MOTION || IS_MOBILE || IS_COARSE;

const canvas = document.getElementById("bg");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LIGHT_SCENE, alpha: true });
renderer.setPixelRatio(
  LIGHT_SCENE ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2)
);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03060a, 0.018);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 42);

/* ---- Colors (authentic ctOS / DedSec palette) ---- */
const CYAN    = new THREE.Color(0x1effd6);  // DedSec teal
const ACCENT  = new THREE.Color(0xff5a1e);  // ctOS hostile orange
const LIME     = new THREE.Color(0xb6ff2a);  // spray-paint lime

/* ====================================================================
   NODE CLOUD — points distributed in a sphere-ish volume
   ==================================================================== */
const NODE_COUNT = REDUCED_MOTION ? 80 : LIGHT_SCENE ? 140 : 260;
const RADIUS = 30;
const nodes = [];
const positions = new Float32Array(NODE_COUNT * 3);
const colors = new Float32Array(NODE_COUNT * 3);

for (let i = 0; i < NODE_COUNT; i++) {
  // random point in sphere
  const r = RADIUS * Math.cbrt(Math.random());
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  nodes.push({
    base: new THREE.Vector3(x, y, z),
    vel: new THREE.Vector3(
      (Math.random() - 0.5) * 0.012,
      (Math.random() - 0.5) * 0.012,
      (Math.random() - 0.5) * 0.012
    ),
  });

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  const roll = Math.random();
  const c = roll > 0.86 ? ACCENT : roll > 0.80 ? LIME : CYAN;
  colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
}

/* ---- Points ---- */
const pointGeo = new THREE.BufferGeometry();
pointGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
pointGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

const sprite = makeDotTexture();
const pointMat = new THREE.PointsMaterial({
  size: 0.9,
  map: sprite,
  vertexColors: true,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const points = new THREE.Points(pointGeo, pointMat);
scene.add(points);

/* ---- Connection lines (rebuilt each frame for near neighbors) ---- */
const MAX_LINKS = NODE_COUNT * 6;
const linkPositions = new Float32Array(MAX_LINKS * 6);
const linkColors = new Float32Array(MAX_LINKS * 6);
const linkGeo = new THREE.BufferGeometry();
linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3).setUsage(THREE.DynamicDrawUsage));
linkGeo.setAttribute("color", new THREE.BufferAttribute(linkColors, 3).setUsage(THREE.DynamicDrawUsage));
const linkMat = new THREE.LineBasicMaterial({
  vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending,
});
const lines = new THREE.LineSegments(linkGeo, linkMat);
scene.add(lines);

const LINK_DIST = 7.5;

/* ====================================================================
   CURSOR "HACK" LINKS — orange tendrils from the mouse to nearby nodes
   (lives in world space, so it ignores the network's rotation)
   ==================================================================== */
const hackPositions = new Float32Array(NODE_COUNT * 6);
const hackColors    = new Float32Array(NODE_COUNT * 6);
const hackGeo = new THREE.BufferGeometry();
hackGeo.setAttribute("position", new THREE.BufferAttribute(hackPositions, 3).setUsage(THREE.DynamicDrawUsage));
hackGeo.setAttribute("color",    new THREE.BufferAttribute(hackColors, 3).setUsage(THREE.DynamicDrawUsage));
const hackMat = new THREE.LineBasicMaterial({
  vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending,
});
const hackLines = new THREE.LineSegments(hackGeo, hackMat);
scene.add(hackLines);

// glowing marker that sits where the cursor intersects the field
const markerGeo = new THREE.BufferGeometry();
markerGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
const marker = new THREE.Points(markerGeo, new THREE.PointsMaterial({
  size: 2.6, map: sprite, color: 0xff5a1e, transparent: true,
  depthWrite: false, blending: THREE.AdditiveBlending,
}));
scene.add(marker);

const raycaster = new THREE.Raycaster();
const hackPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const cursorWorld = new THREE.Vector3();
const nodeWorld = new THREE.Vector3();
const CURSOR_DIST = 17;

/* ====================================================================
   WIREFRAME GRID FLOOR (subtle ctOS map vibe)
   ==================================================================== */
const grid = new THREE.GridHelper(160, LIGHT_SCENE ? 32 : 60, 0x1effd6, 0x0a2e2a);
grid.position.y = -34;
grid.material.transparent = true;
grid.material.opacity = 0.12;
scene.add(grid);

/* ====================================================================
   POSTPROCESSING — bloom
   ==================================================================== */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  LIGHT_SCENE ? 0.55 : 0.9,   // strength
  LIGHT_SCENE ? 0.45 : 0.6,   // radius
  0.15   // threshold
);
composer.addPass(bloom);

/* ====================================================================
   INTERACTION — mouse parallax + scroll
   ==================================================================== */
const mouse = new THREE.Vector2(0, 0);
const target = new THREE.Vector2(0, 0);
window.addEventListener("mousemove", (e) => {
  target.x = (e.clientX / window.innerWidth) * 2 - 1;
  target.y = -((e.clientY / window.innerHeight) * 2 - 1);
});
window.addEventListener("touchmove", (e) => {
  if (!e.touches[0]) return;
  target.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
  target.y = -((e.touches[0].clientY / window.innerHeight) * 2 - 1);
}, { passive: true });

let scrollY = 0;
window.addEventListener("scroll", () => { scrollY = window.scrollY; });

/* ====================================================================
   ANIMATE
   ==================================================================== */
const clock = new THREE.Clock();
const pos = pointGeo.attributes.position.array;

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // drift nodes
  for (let i = 0; i < NODE_COUNT; i++) {
    const n = nodes[i];
    n.base.add(n.vel);
    // keep within radius
    if (n.base.length() > RADIUS) n.vel.multiplyScalar(-1);
    pos[i * 3]     = n.base.x + Math.sin(t * 0.5 + i) * 0.3;
    pos[i * 3 + 1] = n.base.y + Math.cos(t * 0.4 + i) * 0.3;
    pos[i * 3 + 2] = n.base.z;
  }
  pointGeo.attributes.position.needsUpdate = true;

  // rebuild links between near neighbors
  let li = 0;
  for (let i = 0; i < NODE_COUNT && li < MAX_LINKS; i++) {
    const ax = pos[i*3], ay = pos[i*3+1], az = pos[i*3+2];
    for (let j = i + 1; j < NODE_COUNT && li < MAX_LINKS; j++) {
      const dx = ax - pos[j*3], dy = ay - pos[j*3+1], dz = az - pos[j*3+2];
      const d2 = dx*dx + dy*dy + dz*dz;
      if (d2 < LINK_DIST * LINK_DIST) {
        const a = 1 - Math.sqrt(d2) / LINK_DIST;
        const o = li * 6;
        linkPositions[o]   = ax; linkPositions[o+1] = ay; linkPositions[o+2] = az;
        linkPositions[o+3] = pos[j*3]; linkPositions[o+4] = pos[j*3+1]; linkPositions[o+5] = pos[j*3+2];
        // color blend by distance (teal core, lime tips)
        linkColors[o]   = CYAN.r * a; linkColors[o+1] = CYAN.g * a; linkColors[o+2] = CYAN.b * a;
        linkColors[o+3] = LIME.r * a; linkColors[o+4] = LIME.g * a; linkColors[o+5] = LIME.b * a;
        li++;
      }
    }
  }
  linkGeo.setDrawRange(0, li * 2);
  linkGeo.attributes.position.needsUpdate = true;
  linkGeo.attributes.color.needsUpdate = true;

  // smooth mouse parallax
  mouse.x += (target.x - mouse.x) * 0.04;
  mouse.y += (target.y - mouse.y) * 0.04;

  // rotate the network
  points.rotation.y = lines.rotation.y = t * 0.04 + mouse.x * 0.4;
  points.rotation.x = lines.rotation.x = mouse.y * 0.3;
  points.updateMatrixWorld(true);

  // ---- cursor hacking links (world space) ----
  raycaster.setFromCamera({ x: mouse.x, y: mouse.y }, camera);
  let hi = 0;
  if (raycaster.ray.intersectPlane(hackPlane, cursorWorld)) {
    marker.position.copy(cursorWorld);
    marker.visible = true;
    for (let i = 0; i < NODE_COUNT; i++) {
      nodeWorld.set(pos[i*3], pos[i*3+1], pos[i*3+2]).applyMatrix4(points.matrixWorld);
      const d = nodeWorld.distanceTo(cursorWorld);
      if (d < CURSOR_DIST) {
        const a = 1 - d / CURSOR_DIST;
        const o = hi * 6;
        hackPositions[o]   = cursorWorld.x; hackPositions[o+1] = cursorWorld.y; hackPositions[o+2] = cursorWorld.z;
        hackPositions[o+3] = nodeWorld.x;   hackPositions[o+4] = nodeWorld.y;   hackPositions[o+5] = nodeWorld.z;
        // orange near the cursor, fading to lime at the node
        hackColors[o]   = ACCENT.r * a; hackColors[o+1] = ACCENT.g * a; hackColors[o+2] = ACCENT.b * a;
        hackColors[o+3] = LIME.r * a * 0.7; hackColors[o+4] = LIME.g * a * 0.7; hackColors[o+5] = LIME.b * a * 0.7;
        hi++;
      }
    }
  } else {
    marker.visible = false;
  }
  hackGeo.setDrawRange(0, hi * 2);
  hackGeo.attributes.position.needsUpdate = true;
  hackGeo.attributes.color.needsUpdate = true;

  // camera dolly on scroll
  camera.position.z = 42 - Math.min(scrollY, 2400) * 0.004;
  camera.position.y = mouse.y * 3;
  camera.lookAt(0, 0, 0);

  composer.render();
}

if (REDUCED_MOTION) {
  composer.render();
} else {
  animate();
}

/* ====================================================================
   RESIZE
   ==================================================================== */
window.addEventListener("resize", () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(
    LIGHT_SCENE ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2)
  );
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

/* ---- signal main.js that webgl booted ---- */
window.dispatchEvent(new Event("scene-ready"));

/* ====================================================================
   HELPERS
   ==================================================================== */
function makeDotTexture() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}
