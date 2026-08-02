/* ====================================================
   MS360 Enfermería — Menú maestro
   Navegación entre calculadoras (iframe aislado)
   ==================================================== */

/* ---- Disclaimer de primer arranque ---- */
(function initDisclaimer() {
  const YA_ACEPTO = "ms360_disclaimer_v1";
  const overlay = document.getElementById("disclaimer");
  const check = document.getElementById("disclaimer-accept-check");
  const btn = document.getElementById("disclaimer-btn");
  if (!overlay) return;

  let aceptado = false;
  try { aceptado = localStorage.getItem(YA_ACEPTO) === "1"; } catch (e) {}

  if (!aceptado) {
    overlay.hidden = false;
    if (check && btn) {
      check.addEventListener("change", () => { btn.disabled = !check.checked; });
      btn.addEventListener("click", () => {
        try { localStorage.setItem(YA_ACEPTO, "1"); } catch (e) {}
        overlay.hidden = true;
      });
    }
  }
})();

const APPS = {
  porcentaje: { url: "./porcentaje/index.html", title: "Conversión de %" },
  dosisflujo: { url: "./dosisflujo/index.html", title: "Dosis y Goteo" },
  aspa:       { url: "./aspa/index.html",       title: "Regla del Aspa" },
  uci:        { url: "./uci/index.html",        title: "UCI: Balance + Antropometría" },
};

const menu        = document.getElementById("menu");
const viewer      = document.getElementById("viewer");
const viewerFrame = document.getElementById("viewer-frame");
const viewerTitle = document.getElementById("viewer-title");
const backBtn     = document.getElementById("back-btn");

function abrirApp(key) {
  const app = APPS[key];
  if (!app) return;

  viewerFrame.src = app.url;
  viewerTitle.textContent = app.title;
  viewer.hidden = false;
  menu.style.display = "none";
  window.scrollTo(0, 0);
}

function volverAlMenu() {
  viewer.hidden = true;
  viewerFrame.src = "about:blank"; // libera la calculadora (reinicia estado)
  menu.style.display = "flex";
}

/* ---- Eventos ---- */
document.querySelectorAll(".tool").forEach(btn => {
  btn.addEventListener("click", () => abrirApp(btn.dataset.app));
});

backBtn.addEventListener("click", volverAlMenu);

/* El botón físico "atrás" de Android cierra la calculadora abierta en vez de
   salir de la app. Lo consulta MainActivity: devuelve true si hubo algo que
   cerrar, false si ya estamos en el menú y toca salir. */
window.MS360_volverAtras = function () {
  if (!viewer.hidden) { volverAlMenu(); return true; }
  const disclaimer = document.getElementById("disclaimer");
  if (disclaimer && !disclaimer.hidden) return true; // no saltarse el aviso
  return false;
};

// Mismo comportamiento en el navegador (PWA instalada)
window.addEventListener("popstate", () => {
  if (!viewer.hidden) volverAlMenu();
});

/* Los textos legales se abren en el mismo visor: así funcionan igual en el
   navegador y dentro del WebView de la app (donde "_blank" no abre nada). */
function abrirPagina(url, titulo) {
  viewerFrame.src = url;
  viewerTitle.textContent = titulo;
  viewer.hidden = false;
  menu.style.display = "none";
  window.scrollTo(0, 0);
}

document.getElementById("open-privacy").addEventListener("click", () => {
  abrirPagina("./privacidad/index.html", "Política de privacidad");
});
document.getElementById("open-terms").addEventListener("click", () => {
  abrirPagina("./terminos/index.html", "Términos");
});
document.getElementById("open-about").addEventListener("click", () => {
  alert("MS360 Enfermería\nCalculadoras clínicas de MEDISHORT360.\n\nHerramienta de apoyo educativo.");
});

/* ---- Service Worker (PWA) ---- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
