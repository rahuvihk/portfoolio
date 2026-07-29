// Renders a single project page based on ?id=<id> in the URL.
// CONTENT is defined in content.js (loaded before this file).
const $ = (id) => document.getElementById(id);

// Shared header / footer text
$("mark").textContent = CONTENT.brand;
$("footerLeft").textContent = CONTENT.footerLeft;
$("footerRight").textContent = CONTENT.footerRight;
// Find the requested project — or use an override set by about.html etc.
const id = new URLSearchParams(location.search).get("id");
const project =
  window.__PROJECT_OVERRIDE__ || CONTENT.projects.find((p) => p.id === id);

const paneImg = $("paneImg");

// Turn a paragraph string into HTML, converting {{word|images/x.jpg}} markers
// into hoverable "hotwords" that swap the photo pane. Everything else is left
// as plain text.
function renderParagraph(text) {
  return text.replace(/\{\{([^|]+)\|([^}]+)\}\}/g, (_, word, src) => {
    return `<span class="hotword" data-src="${src.trim()}">${word.trim()}</span>`;
  });
}

if (!project) {
  $("projTitle").textContent = "Projekti ei leitud";
  $("projTag").textContent = "";
} else {
  document.title = `${project.title} — ${CONTENT.brand}`;
  $("projTag").textContent = project.tag || "";
  $("projTitle").textContent = project.title || "";

  // Story text (supports the {{word|image}} markers). Falls back to `body`.
  const paras = project.story || project.body || [];
  $("projStory").innerHTML = paras.map((p) => `<p>${renderParagraph(p)}</p>`).join("");

  if (project.hideStory) {
    document.querySelector(".project__story")?.remove();
  }
  if (project.hidePane) {
    document.querySelector(".project__pane")?.remove();
    document.querySelector(".project__split")?.classList.add("project__split--full");
  }
  if (project.hideStory && project.hidePane) {
    document.querySelector(".project__split")?.remove();
  }
  // The pane starts on the project's cover image and returns to it when no
  // hotword is hovered.
  const defaultSrc = project.coverImg || project.img;
  paneImg.src = defaultSrc;
  paneImg.alt = project.title || "";

  // Preload the hotword images so they appear instantly on hover.
  const hotwords = [...document.querySelectorAll(".hotword")];
  [...new Set(hotwords.map((h) => h.dataset.src))].forEach((src) => {
    const pre = new Image();
    pre.src = src;
  });

  function showImage(src) {
    if (paneImg.src.endsWith(src)) return;
    paneImg.src = src;
    // restart the fade-in animation on each swap
    paneImg.style.animation = "none";
    void paneImg.offsetWidth;
    paneImg.style.animation = "";
  }

  hotwords.forEach((h) => {
    // Show the word's photo on hover and keep it there — it only changes when
    // another word is hovered, so it never flips back to the cover photo.
    h.addEventListener("mouseenter", () => showImage(h.dataset.src));
    // Tap support on touch screens: switch without needing hover.
    h.addEventListener("click", (e) => {
      e.preventDefault();
      showImage(h.dataset.src);
    });
  });

  // Album: a collage of every designated photo, shown after the text.
  // Numbered in the chronological order the words appear in the story.
  let albumSrcs = project.photos && project.photos.length
    ? project.photos
    : [...new Set(hotwords.map((h) => h.dataset.src))];
  if (project.shuffleAlbum) {
    for (let i = albumSrcs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [albumSrcs[i], albumSrcs[j]] = [albumSrcs[j], albumSrcs[i]];
    }
  }
  const album = $("projAlbum");
  const plain = project.plainAlbum;
  if (project.hideAlbum) {
    album.remove();
  } else {
  album.innerHTML = albumSrcs
    .map(
      (src, i) =>
        `<figure class="album-item${plain ? " album-item--plain" : ""}" data-index="${i}">
           ${plain ? "" : `<span class="album-num">${i + 1}</span>`}
           <img src="${src}" alt="${project.title || ""}" loading="lazy" />
         </figure>`
    )
    .join("");

  // --- Lightbox with prev/next ------------------------------------------
  {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Sulge">×</button>
    <button class="lightbox__nav lightbox__nav--prev" aria-label="Eelmine">‹</button>
    <img class="lightbox__img" alt="" />
    <button class="lightbox__nav lightbox__nav--next" aria-label="Järgmine">›</button>
    <span class="lightbox__counter"></span>
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector(".lightbox__img");
  const lbCounter = lightbox.querySelector(".lightbox__counter");
  let lbIdx = 0;

  function showLb(i) {
    lbIdx = (i + albumSrcs.length) % albumSrcs.length;
    lbImg.src = albumSrcs[lbIdx];
    lbCounter.textContent = `${lbIdx + 1} / ${albumSrcs.length}`;
  }
  function openLb(i) {
    showLb(i);
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  album.querySelectorAll(".album-item").forEach((el) => {
    el.addEventListener("click", () => openLb(Number(el.dataset.index)));
  });
  lightbox.querySelector(".lightbox__close").addEventListener("click", closeLb);
  lightbox.querySelector(".lightbox__nav--prev").addEventListener("click", (e) => {
    e.stopPropagation();
    showLb(lbIdx - 1);
  });
  lightbox.querySelector(".lightbox__nav--next").addEventListener("click", (e) => {
    e.stopPropagation();
    showLb(lbIdx + 1);
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLb();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") showLb(lbIdx - 1);
    else if (e.key === "ArrowRight") showLb(lbIdx + 1);
  });
  } // end lightbox block
  } // end else (hideAlbum)
}
