// Shared nav renderer used by index.html, project.html and category.html.
// Understands one special href value: "__categories__" turns that nav item
// into a hover/click dropdown listing every entry in CONTENT.categories.
(function () {
  const navEl = document.getElementById("nav");
  if (!navEl || typeof CONTENT === "undefined") return;

  const parts = CONTENT.nav.map(([label, href]) => {
    if (href === "__categories__") {
      const items = (CONTENT.categories || [])
        .map((c) => {
          const ids = c.projectIds || (c.projectId ? [c.projectId] : []);
          const subs = ids
            .map(
              (id) => `<a class="nav-drop__sub" href="project.html?id=${encodeURIComponent(id)}">${id}</a>`
            )
            .join("");
          return `
            <li class="nav-drop__group">
              <a class="nav-drop__cat" href="category.html?name=${encodeURIComponent(c.name)}">${c.name}</a>
              ${subs}
            </li>`;
        })
        .join("");
      return `
        <div class="nav-drop">
          <button type="button" class="nav-drop__toggle" aria-haspopup="true" aria-expanded="false">${label}</button>
          <ul class="nav-drop__menu" role="menu">${items}</ul>
        </div>`;
    }
    return `<a href="${href}">${label}</a>`;
  });

  navEl.innerHTML = parts.join("");

  // Toggle behaviour: click opens/closes, outside click closes, hover opens.
  const drop = navEl.querySelector(".nav-drop");
  if (!drop) return;
  const toggle = drop.querySelector(".nav-drop__toggle");
  const open = () => {
    drop.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    drop.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    drop.classList.contains("is-open") ? close() : open();
  });
  drop.addEventListener("mouseenter", open);
  drop.addEventListener("mouseleave", close);
  document.addEventListener("click", (e) => {
    if (!drop.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();
