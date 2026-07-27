// ===========================================================================
//  Homepage machinery. Edit your text in content.js, not here.
// ===========================================================================
// CONTENT is defined in content.js (loaded before this file).
(function () {
  const gate = document.getElementById("mobileGate");
  if (gate && !sessionStorage.getItem("mobileGateSeen")) {
    gate.hidden = false;
    document.getElementById("mobileGateOk").addEventListener("click", () => {
      gate.hidden = true;
      sessionStorage.setItem("mobileGateSeen", "1");
    });
  }
})();

const PROJECTS = CONTENT.projects;
const ROTATE_MS = (CONTENT.rotateSeconds || 5) * 1000;

// --- Fill in the fixed text -------------------------------------------------
const $ = (id) => document.getElementById(id);
$("mark").textContent = CONTENT.brand;
$("introTitle").textContent = CONTENT.introTitle;
$("introSub").textContent = CONTENT.introSub;
$("footerLeft").textContent = CONTENT.footerLeft;
$("footerRight").textContent = CONTENT.footerRight;
const gallery = document.querySelector(".gallery");

// --- Build panels ----------------------------------------------------------
const panels = PROJECTS.map((p, i) => {
  const a = document.createElement("a");
  a.className = "panel";
  a.href = `project.html?id=${encodeURIComponent(p.id)}`;
  a.setAttribute("aria-label", `${p.title} — ${p.tag}`);
  a.innerHTML = `
    <img class="panel__img" src="${p.img}" alt="${p.title}" loading="lazy" />
    <div class="panel__meta">
      <div class="panel__index">${String(i + 1).padStart(2, "0")} / ${String(
    PROJECTS.length
  ).padStart(2, "0")}</div>
      <div class="panel__title">${p.title}</div>
      <div class="panel__tag">${p.tag}</div>
    </div>`;
  gallery.appendChild(a);
  return a;
});

// --- Rotation --------------------------------------------------------------
let current = 0;
let timer = null;

function setActive(index) {
  current = (index + panels.length) % panels.length;
  panels.forEach((panel, i) => panel.classList.toggle("is-active", i === current));
}

function next() {
  setActive(current + 1);
}

function start() {
  stop();
  timer = setInterval(next, ROTATE_MS);
}

function stop() {
  clearInterval(timer);
  timer = null;
}

// Pause the auto-rotation while the pointer is inside the gallery so hover
// wins; resume from the hovered panel when the pointer leaves.
gallery.addEventListener("mouseenter", () => {
  stop();
});

gallery.addEventListener("mouseleave", () => {
  start();
});

panels.forEach((panel, i) => {
  panel.addEventListener("mouseenter", () => {
    current = i; // so leaving the gallery continues from where you looked
  });
});

// Pause when the tab is hidden to save the animation loop.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
  else if (!timer) start();
});

// --- Go --------------------------------------------------------------------
setActive(0);
start();
