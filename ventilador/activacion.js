// ═══════════════════════════════════════════════════════════════
//  activacion.js · Simulador Dräger Evita 4 — MEDISHORT360
//  Un código = un dispositivo. Se pide UNA sola vez; después queda
//  guardado en el dispositivo y la app funciona sin conexión.
//
//  Falla ABIERTO a propósito: si Firebase no carga (sin red, CDN
//  bloqueada, error de configuración) la puerta no se muestra y el
//  estudiante puede seguir estudiando. Es una herramienta educativa,
//  no una caja fuerte: esto ordena el acceso, no lo blinda.
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
//  COLECCIÓN DE CÓDIGOS EN FIRESTORE
//
//  'codigos_evita4'   → códigos propios del simulador (por defecto).
//                       Hay que crear la colección y los códigos.
//  'codigos_maestra'  → reutiliza los códigos que ya usa la app
//                       maestra MS360. Cambia la línea y listo.
// ─────────────────────────────────────────────
const COLECCION = 'codigos_evita4';

// Versión del build; se muestra en la pantalla de inicio
export const VERSION_APP = '4';
window.__evita4Version = VERSION_APP;

const firebaseConfig = {
  apiKey:            "AIzaSyApl919VrDKdV1AdHtZsrVYUC0zym-ZrZs",
  authDomain:        "medishort360-f6f20.firebaseapp.com",
  projectId:         "medishort360-f6f20",
  storageBucket:     "medishort360-f6f20.firebasestorage.app",
  messagingSenderId: "127659670697",
  appId:             "1:127659670697:web:b845e760917ba77e253db8"
};

const LS_KEY      = 'evita4_activado';
const LS_CODE_KEY = 'evita4_codigo';

const $g = id => document.getElementById(id);

/* Almacén utilizable: algunos navegadores bloquean localStorage en modo
   privado. Si ninguno sirve devuelve null y el código se pedirá cada sesión,
   que es preferible a dejar la puerta abierta por un fallo de almacenamiento. */
const ST = (() => {
  for (const s of [
    () => window.localStorage,
    () => window.sessionStorage
  ]) {
    try {
      const st = s();
      st.setItem('__evita4_test', '1');
      st.removeItem('__evita4_test');
      return st;
    } catch (e) { /* siguiente */ }
  }
  return null;
})();

/* ─────────── Desbloquear la aplicación ─────────── */
function abrirApp(inmediato) {
  window.__evita4Activado = true;
  const gate = $g('gate');
  if (gate) {
    if (inmediato) { gate.remove(); }
    else {
      gate.style.opacity = '0';
      gate.style.transition = 'opacity .45s ease';
      setTimeout(() => gate.remove(), 460);
    }
  }
  document.dispatchEvent(new CustomEvent('evita4:activado'));
}

/* ─────────── ¿Hace falta pedir código? ─────────── */
function yaTieneAcceso() {
  // Ya se activó este simulador en este dispositivo
  if (ST && ST.getItem(LS_KEY) === '1') return true;

  // Corriendo dentro del visor de MS360: la app maestra ya filtró la entrada,
  // así que no se pide un segundo código. Si la comprobación falla (iframe de
  // otro origen) NO se concede acceso: la puerta se muestra.
  try { if (window.self !== window.top) return true; } catch (e) { /* mostrar puerta */ }

  return false;
}

/* Permite volver a probar la activación: abre la app con #reset-activacion */
function comprobarReset() {
  if (location.hash !== '#reset-activacion') return;
  try { ST && ST.removeItem(LS_KEY); ST && ST.removeItem(LS_CODE_KEY); } catch (e) {}
  history.replaceState(null, '', location.pathname + location.search);
}

/* ─────────── Identificador estable del dispositivo ─────────── */
function dispositivoId() {
  const datos = [
    navigator.language || '',
    navigator.platform || '',
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    navigator.hardwareConcurrency || '',
    navigator.deviceMemory || ''
  ].join('|');
  let hash = 0;
  for (let i = 0; i < datos.length; i++) {
    hash = ((hash << 5) - hash) + datos.charCodeAt(i);
    hash = hash & hash;
  }
  return 'dev_' + Math.abs(hash).toString(36);
}

/* ─────────── Verificación contra Firestore ─────────── */
let db = null;
async function conectar() {
  if (db) return db;
  const [{ initializeApp }, fs] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
  ]);
  const app = initializeApp(firebaseConfig, 'evita4-sim');
  db = { fs, ref: fs.getFirestore(app) };
  return db;
}

async function verificarCodigo(codigo) {
  const limpio = codigo.trim().toUpperCase();
  const dev = dispositivoId();
  let d;
  try { d = await conectar(); } catch (e) { return { valido: false, razon: 'error_red' }; }
  const { fs, ref } = d;

  let snap;
  try {
    snap = await fs.getDoc(fs.doc(ref, COLECCION, limpio));
  } catch (e) {
    return { valido: false, razon: 'error_red' };
  }

  if (!snap.exists()) return { valido: false, razon: 'no_encontrado' };

  const data = snap.data();
  if (data.estado === 'DESACTIVADO' || data.activo === false) {
    return { valido: false, razon: 'inactivo' };
  }

  const guardado = data.dispositivo_id || '';

  // Código libre → se asigna a este dispositivo
  if ((data.estado === 'DISPONIBLE' || data.estado === undefined) && guardado === '') {
    try {
      await fs.updateDoc(fs.doc(ref, COLECCION, limpio), {
        estado: 'USADO',
        dispositivo_id: dev,
        fecha_activacion: new Date().toISOString()
      });
      return { valido: true };
    } catch (e) { return { valido: false, razon: 'error_escritura' }; }
  }

  // Mismo dispositivo (reinstalación) → se permite
  if (guardado === dev) return { valido: true };

  return { valido: false, razon: 'otro_dispositivo' };
}

/* ─────────── Interfaz de la puerta ─────────── */
function mostrarError(msg) {
  const err = $g('gate-error'), inp = $g('gate-input');
  if (err) { err.textContent = msg; err.classList.add('visible'); }
  if (inp) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); }
}

async function intentarActivar() {
  const inp = $g('gate-input'), btn = $g('gate-btn'), err = $g('gate-error');
  const codigo = inp ? inp.value.trim() : '';
  if (!codigo) { mostrarError('Escribe tu código de activación.'); return; }

  btn.disabled = true;
  btn.textContent = 'Verificando…';
  if (err) { err.textContent = ''; err.classList.remove('visible'); }

  const resultado = await verificarCodigo(codigo);

  if (resultado.valido) {
    try {
      if (ST) { ST.setItem(LS_KEY, '1'); ST.setItem(LS_CODE_KEY, codigo.toUpperCase()); }
    } catch (e) {}
    btn.textContent = '✅ ¡Activado!';
    setTimeout(() => abrirApp(false), 650);
    return;
  }

  const mensajes = {
    no_encontrado:    'Código no válido. Revísalo e inténtalo otra vez.',
    inactivo:         'Este código ha sido desactivado.',
    otro_dispositivo: 'Este código ya está en uso en otro dispositivo.',
    error_red:        'Sin conexión. La activación necesita internet una única vez.',
    error_escritura:  'No se pudo completar la activación. Inténtalo de nuevo.'
  };
  mostrarError(mensajes[resultado.razon] || 'Código no válido.');
  btn.disabled = false;
  btn.textContent = 'Activar';
}

/* ─────────── Arranque ─────────── */
function iniciar() {
  comprobarReset();
  if (yaTieneAcceso()) { abrirApp(true); return; }

  const gate = $g('gate');
  if (!gate) { abrirApp(true); return; }
  gate.hidden = false;

  const btn = $g('gate-btn'), inp = $g('gate-input');
  if (btn) btn.addEventListener('click', intentarActivar);
  if (inp) {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') intentarActivar(); });
    inp.addEventListener('input', e => {
      const pos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(pos, pos);
    });
  }
  // Precalienta Firebase para que la primera verificación sea rápida
  conectar().catch(() => {});
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
