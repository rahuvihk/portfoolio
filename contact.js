// Renders the Kontakt page from CONTENT.contact.
const $ = (id) => document.getElementById(id);

$("mark").textContent = CONTENT.brand;
$("footerLeft").textContent = CONTENT.footerLeft;
$("footerRight").textContent = CONTENT.footerRight;

const c = CONTENT.contact || {};
document.title = `${c.title || "Kontakt"} — ${CONTENT.brand}`;
$("cTag").textContent = c.tag || "";
$("cTitle").textContent = c.title || "";
$("cBody").innerHTML = (c.body || []).map((p) => `<p>${p}</p>`).join("");
if (c.img) {
  const img = $("cImg");
  img.src = c.img;
  img.alt = c.title || "";
}
