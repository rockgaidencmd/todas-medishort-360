/* ══════════════════════════════════════════════════════════════
   SIMULADOR DRÄGER EVITA 4 — MEDISHORT360
   Parte 1/4 · Utilidades, apariencia, catálogos clínicos
══════════════════════════════════════════════════════════════ */
'use strict';

/* ─────────── Utilidades ─────────── */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, d) => { const p = Math.pow(10, d || 0); return Math.round(v * p) / p; };
const nz = (v, d) => (isFinite(v) && v !== null ? v : d);
const num = (el, d) => { const v = parseFloat($(el)?.value); return isFinite(v) ? v : d; };
const LS = {
  get(k, d) { try { const v = localStorage.getItem('evita4_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('evita4_' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('evita4_' + k); } catch (e) {} }
};
function mmss(s) {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), q = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(q).padStart(2, '0')}`
               : `${String(m).padStart(2, '0')}:${String(q).padStart(2, '0')}`;
}
function vibrar(ms) { if (CFG.vibrar && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }

/* ─────────── Apariencia / configuración ─────────── */
const FONDOS = [
  { n: 'Noche clínica', c: '#0b0f1a', t: 'dark' },
  { n: 'Grafito',       c: '#14161b', t: 'dark' },
  { n: 'Negro puro',    c: '#000000', t: 'dark' },
  { n: 'Azul UCI',      c: '#0a1626', t: 'dark' },
  { n: 'Verde quirófano', c: '#0a1a17', t: 'dark' },
  { n: 'Vino',          c: '#1a0b10', t: 'dark' },
  { n: 'Marfil',        c: '#f2efe9', t: 'light' },
  { n: 'Nieve',         c: '#eef1f6', t: 'light' },
  { n: 'Menta clara',   c: '#e9f2ee', t: 'light' },
  { n: 'Arena',         c: '#f3ece1', t: 'light' }
];
const ACENTOS = [
  { n: 'Oro',      c: '#d9b44a' },
  { n: 'Rojo',     c: '#e53935' },
  { n: 'Cian',     c: '#29c7d6' },
  { n: 'Verde',    c: '#35c46a' },
  { n: 'Ámbar',    c: '#f0a02a' },
  { n: 'Violeta',  c: '#9b6dff' },
  { n: 'Azul',     c: '#4a90e2' }
];

const CFG = Object.assign({
  tema: 'dark', fondoDark: '#0b0f1a', fondoLight: '#eef1f6',
  acento: '#d9b44a', sonido: true, vibrar: true, velocidad: 5
}, LS.get('cfg', {}));

function temaEfectivo() {
  if (CFG.tema === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return CFG.tema;
}
function aplicarApariencia() {
  const t = temaEfectivo();
  document.documentElement.setAttribute('data-theme', t);
  const bg = t === 'light' ? CFG.fondoLight : CFG.fondoDark;
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--acc', CFG.acento);
  const meta = $('#meta-theme'); if (meta) meta.setAttribute('content', bg);
  LS.set('cfg', CFG);
  pintarSwatches();
}
function pintarSwatches() {
  const t = temaEfectivo();
  const cont = $('#swatches'); if (!cont) return;
  const actual = t === 'light' ? CFG.fondoLight : CFG.fondoDark;
  cont.innerHTML = FONDOS.filter(f => f.t === t).map(f =>
    `<button class="sw ${f.c.toLowerCase() === actual.toLowerCase() ? 'on' : ''}" style="background:${f.c}" data-c="${f.c}" title="${f.n}" aria-label="${f.n}"></button>`
  ).join('');
  const ac = $('#acentos');
  if (ac) ac.innerHTML = ACENTOS.map(a =>
    `<button class="sw ${a.c.toLowerCase() === CFG.acento.toLowerCase() ? 'on' : ''}" style="background:${a.c}" data-a="${a.c}" title="${a.n}" aria-label="${a.n}"></button>`
  ).join('');
  const cc = $('#color-custom'); if (cc) cc.value = actual;
  $$('#seg-tema button').forEach(b => b.classList.toggle('on', b.dataset.tema === CFG.tema));
  $$('#seg-velocidad button').forEach(b => b.classList.toggle('on', +b.dataset.vel === CFG.velocidad));
  const s = $('#cfg-sonido'), v = $('#cfg-vibrar');
  if (s) s.checked = CFG.sonido; if (v) v.checked = CFG.vibrar;
}

/* ══════════════════════════════════════════════════════════════
   CATÁLOGO DE PATOLOGÍAS
   Crs  = distensibilidad estática (mL/cmH2O)
   Raw  = resistencia de la vía aérea (cmH2O/L/s)
   vdvt = espacio muerto fisiológico (fracción)
   shunt= cortocircuito intrapulmonar (fracción)
   recl = reclutabilidad (0-1) · peepOpt = PEEP donde se agota el reclutamiento
   vco2 = factor de producción de CO2 · hco3 = bicarbonato metabólico basal
══════════════════════════════════════════════════════════════ */
const DX = {
  sano: {
    n: 'Postoperatorio / pulmón sano', ico: '🫁', grupo: 'General',
    crs: 65, raw: 8, vdvt: 0.32, shunt: 0.05, recl: 0.15, peepOpt: 6, vco2: 1.0,
    hco3: 24, hr: 78, map: 88, co: 5.2, lac: 1.0,
    desc: 'Pulmón sin patología. Ventilación de soporte hasta la recuperación de la conciencia y de la fuerza muscular.',
    gaso: { ph: 7.40, paco2: 40, pao2: 92, hco3: 24, fio2: 21, sao2: 97, lac: 1.0 },
    meta: 'Ventilación protectora y destete precoz. Vt 6–8 mL/kg PBW, PEEP 5, FiO₂ mínima para SpO₂ 94–98 %.'
  },
  sdra: {
    n: 'SDRA (síndrome de distrés respiratorio agudo)', ico: '🔥', grupo: 'Hipoxémico',
    crs: 30, raw: 11, vdvt: 0.46, shunt: 0.30, recl: 0.50, peepOpt: 14, vco2: 1.15,
    hco3: 22, hr: 104, map: 76, co: 5.6, lac: 2.2,
    desc: 'Pulmón pequeño y heterogéneo ("baby lung"). Muy poco pulmón aireado disponible: los volúmenes normales se convierten en volúmenes lesivos.',
    gaso: { ph: 7.32, paco2: 48, pao2: 58, hco3: 22, fio2: 60, sao2: 88, lac: 2.2 },
    meta: 'Vt 4–6 mL/kg PBW, Pmeseta ≤ 30, driving pressure ≤ 15, PEEP alta según tabla PEEP/FiO₂, hipercapnia permisiva con pH ≥ 7.20.'
  },
  neumonia: {
    n: 'Neumonía grave / consolidación', ico: '🦠', grupo: 'Hipoxémico',
    crs: 40, raw: 12, vdvt: 0.45, shunt: 0.22, recl: 0.32, peepOpt: 10, vco2: 1.2,
    hco3: 23, hr: 108, map: 80, co: 6.2, lac: 1.8,
    desc: 'Consolidación con shunt regional. Reclutable de forma parcial; el exceso de PEEP sobredistiende el pulmón sano vecino.',
    gaso: { ph: 7.36, paco2: 42, pao2: 62, hco3: 23, fio2: 50, sao2: 90, lac: 1.8 },
    meta: 'Vt 6–8 mL/kg PBW, PEEP 8–12, FiO₂ para SpO₂ 92–96 %. Vigilar sobredistensión del pulmón sano.'
  },
  epoc: {
    n: 'EPOC agudizado', ico: '💨', grupo: 'Obstructivo',
    crs: 78, raw: 22, vdvt: 0.48, shunt: 0.10, recl: 0.05, peepOpt: 6, vco2: 1.05,
    hco3: 32, hr: 96, map: 82, co: 4.8, lac: 1.4,
    desc: 'Obstrucción espiratoria con hiperinsuflación dinámica. El aire entra fácil pero sale lento: si no se le da tiempo espiratorio, se atrapa.',
    gaso: { ph: 7.28, paco2: 68, pao2: 55, hco3: 31, fio2: 28, sao2: 87, lac: 1.4 },
    meta: 'FR baja (10–14), Ti corto, I:E ≥ 1:3, PEEP 5–8 (≈80 % del auto-PEEP), SpO₂ objetivo 88–92 %. NO normalizar la PaCO₂.'
  },
  asma: {
    n: 'Estado asmático (crisis asmática grave)', ico: '🌪️', grupo: 'Obstructivo',
    crs: 58, raw: 32, vdvt: 0.45, shunt: 0.08, recl: 0.05, peepOpt: 5, vco2: 1.25,
    hco3: 21, hr: 128, map: 78, co: 5.0, lac: 2.6,
    desc: 'Resistencia extrema. El riesgo principal no es la hipoxemia sino la hiperinsuflación dinámica con colapso hemodinámico.',
    gaso: { ph: 7.24, paco2: 62, pao2: 68, hco3: 21, fio2: 40, sao2: 92, lac: 2.6 },
    meta: 'FR 8–12, Ti muy corto, flujo alto, PEEP baja, hipercapnia permisiva. Vigilar auto-PEEP y presión meseta.'
  },
  edema: {
    n: 'Edema agudo de pulmón / ICC', ico: '💧', grupo: 'Hipoxémico',
    crs: 34, raw: 14, vdvt: 0.42, shunt: 0.26, recl: 0.45, peepOpt: 12, vco2: 1.0,
    hco3: 22, hr: 118, map: 84, co: 3.6, lac: 2.8,
    desc: 'Ocupación alveolar por líquido. La PEEP mejora la oxigenación y además reduce la poscarga del ventrículo izquierdo.',
    gaso: { ph: 7.33, paco2: 38, pao2: 54, hco3: 20, fio2: 60, sao2: 87, lac: 2.8 },
    meta: 'PEEP 8–14 (mejora oxigenación y poscarga del VI), Vt 6–8 mL/kg, FiO₂ ajustada. Tratar la causa cardiaca.'
  },
  tce: {
    n: 'TCE grave / hipertensión intracraneal', ico: '🧠', grupo: 'Neurológico',
    crs: 60, raw: 9, vdvt: 0.33, shunt: 0.07, recl: 0.20, peepOpt: 8, vco2: 1.1,
    hco3: 24, hr: 68, map: 96, co: 5.4, lac: 1.3,
    desc: 'Pulmón sano, cerebro vulnerable. La PaCO₂ regula el calibre de los vasos cerebrales: la hipocapnia excesiva provoca isquemia.',
    gaso: { ph: 7.42, paco2: 37, pao2: 96, hco3: 24, fio2: 40, sao2: 98, lac: 1.3 },
    meta: 'PaCO₂ 35–38 mmHg (nunca < 30 salvo herniación), PaO₂ > 80, evitar PEEP muy alta, cabecera 30°.',
    especial: 'tce'
  },
  neuromuscular: {
    n: 'Enfermedad neuromuscular (Guillain-Barré, miastenia)', ico: '🦴', grupo: 'Bomba',
    crs: 55, raw: 9, vdvt: 0.35, shunt: 0.08, recl: 0.20, peepOpt: 7, vco2: 0.95,
    hco3: 27, hr: 84, map: 86, co: 5.0, lac: 1.1,
    desc: 'Pulmón normal con bomba muscular fallida. El problema es de fuerza, no de intercambio: no se resuelve con FiO₂.',
    gaso: { ph: 7.31, paco2: 58, pao2: 72, hco3: 28, fio2: 21, sao2: 93, lac: 1.1 },
    meta: 'Soporte total inicial, Vt 6–8 mL/kg, PEEP 5, prevenir atelectasias. Destete lento guiado por fuerza (PIM, CV).'
  },
  cad: {
    n: 'Cetoacidosis diabética', ico: '🍬', grupo: 'Metabólico',
    crs: 62, raw: 9, vdvt: 0.33, shunt: 0.06, recl: 0.15, peepOpt: 6, vco2: 1.3,
    hco3: 8, hr: 124, map: 74, co: 6.0, lac: 3.0,
    desc: 'Acidosis metabólica grave con anión gap elevado. El paciente compensa hiperventilando (Kussmaul): si se le baja la ventilación, el pH se desploma.',
    gaso: { ph: 7.10, paco2: 18, pao2: 98, hco3: 6, fio2: 21, sao2: 97, lac: 3.0, glu: 480, k: 5.4, na: 132, cl: 96 },
    meta: 'MANTENER la hiperventilación compensadora (VM alto, PaCO₂ 15–22). Tratar la causa: insulina, líquidos, potasio.',
    especial: 'metabolica'
  },
  renal: {
    n: 'Insuficiencia renal / acidosis metabólica hiperclorémica', ico: '🫘', grupo: 'Metabólico',
    crs: 58, raw: 10, vdvt: 0.36, shunt: 0.10, recl: 0.20, peepOpt: 8, vco2: 1.05,
    hco3: 13, hr: 96, map: 82, co: 5.2, lac: 1.6,
    desc: 'Acidosis metabólica crónica-agudizada. Compensación respiratoria parcial. La sobrecarga hídrica empeora la distensibilidad.',
    gaso: { ph: 7.22, paco2: 30, pao2: 78, hco3: 12, fio2: 30, sao2: 94, lac: 1.6, k: 5.8, cr: 6.2, na: 136, cl: 112 },
    meta: 'Sostener la compensación respiratoria, corregir la causa (diálisis). No normalizar la PaCO₂ bruscamente.',
    especial: 'metabolica'
  },
  vomito: {
    n: 'Alcalosis metabólica (vómitos / SNG / diuréticos)', ico: '🧂', grupo: 'Metabólico',
    crs: 60, raw: 9, vdvt: 0.34, shunt: 0.07, recl: 0.18, peepOpt: 6, vco2: 0.9,
    hco3: 36, hr: 92, map: 80, co: 4.8, lac: 1.2,
    desc: 'Pérdida de ácido y cloro. El paciente compensa hipoventilando; forzar la ventilación empeora la alcalemia.',
    gaso: { ph: 7.52, paco2: 48, pao2: 82, hco3: 38, fio2: 21, sao2: 96, lac: 1.2, k: 3.0, cl: 88, na: 141 },
    meta: 'Reponer cloro y potasio. Permitir la hipoventilación compensadora: no hiperventilar.',
    especial: 'metabolica'
  },
  sepsis: {
    n: 'Shock séptico', ico: '🧫', grupo: 'Hemodinámico',
    crs: 42, raw: 12, vdvt: 0.46, shunt: 0.18, recl: 0.32, peepOpt: 10, vco2: 1.35,
    hco3: 17, hr: 128, map: 62, co: 7.0, lac: 5.2,
    desc: 'Acidosis láctica con alto consumo de O₂ y demanda ventilatoria elevada. Muy sensible a la caída del retorno venoso por presión intratorácica.',
    gaso: { ph: 7.24, paco2: 32, pao2: 66, hco3: 14, fio2: 50, sao2: 91, lac: 5.2 },
    meta: 'Ventilación protectora + soporte hemodinámico. Cuidado: PEEP alta en hipovolemia hunde la presión arterial.',
    especial: 'metabolica'
  },
  intox: {
    n: 'Intoxicación / sobredosis (depresión del centro respiratorio)', ico: '💊', grupo: 'Bomba',
    crs: 62, raw: 9, vdvt: 0.33, shunt: 0.08, recl: 0.15, peepOpt: 6, vco2: 0.85,
    hco3: 26, hr: 62, map: 78, co: 4.6, lac: 1.3,
    desc: 'Acidosis respiratoria pura por hipoventilación central. Pulmón sano: responde de inmediato al soporte ventilatorio.',
    gaso: { ph: 7.19, paco2: 72, pao2: 60, hco3: 27, fio2: 21, sao2: 89, lac: 1.3 },
    meta: 'Normalizar la PaCO₂ de forma progresiva (no brusca), PEEP 5, prevenir broncoaspiración. Antídoto si procede.'
  },
  obesidad: {
    n: 'Síndrome obesidad-hipoventilación', ico: '⚖️', grupo: 'Restrictivo',
    crs: 36, raw: 14, vdvt: 0.40, shunt: 0.16, recl: 0.45, peepOpt: 12, vco2: 1.2,
    hco3: 31, hr: 88, map: 92, co: 6.0, lac: 1.2,
    desc: 'Restricción de la pared torácica. La presión meseta alta se debe en parte al tórax, no al pulmón: exige PEEP más alta de lo habitual.',
    gaso: { ph: 7.33, paco2: 58, pao2: 62, hco3: 30, fio2: 30, sao2: 90, lac: 1.2 },
    meta: 'PEEP 10–15, Vt sobre PBW (no sobre peso real), antiTrendelenburg. Tolerar Pmeseta algo mayor si la presión transpulmonar es segura.'
  },
  tep: {
    n: 'Tromboembolia pulmonar', ico: '🩸', grupo: 'Hemodinámico',
    crs: 55, raw: 11, vdvt: 0.62, shunt: 0.12, recl: 0.15, peepOpt: 6, vco2: 1.1,
    hco3: 21, hr: 122, map: 70, co: 4.0, lac: 3.2,
    desc: 'Espacio muerto enorme: se ventila lo que no se perfunde. La EtCO₂ cae mucho aunque la PaCO₂ suba (gradiente amplio).',
    gaso: { ph: 7.44, paco2: 32, pao2: 58, hco3: 21, fio2: 50, sao2: 89, lac: 3.2 },
    meta: 'Soporte con PEEP baja (el ventrículo derecho no tolera presión), FiO₂ alta, tratar la obstrucción. Vigilar EtCO₂.'
  }
};

/* ══════════════════════════════════════════════════════════════
   MODOS VENTILATORIOS (Dräger Evita 4)
══════════════════════════════════════════════════════════════ */
const MODOS = {
  IPPV: {
    n: 'IPPV / CMV', sub: 'Volumen controlado',
    tipo: 'vc', espont: false,
    params: ['vt', 'freq', 'tinsp', 'flow', 'peep', 'fio2', 'pmax', 'trig'],
    desc: 'Ventilación controlada por volumen. El ventilador entrega un volumen corriente fijo a una frecuencia fija; la presión es la <b>consecuencia</b> de la mecánica del paciente. Garantiza el volumen minuto pero no limita la presión: hay que vigilar la presión meseta.'
  },
  SIMV: {
    n: 'SIMV', sub: 'Mandatoria intermitente sincronizada',
    tipo: 'vc', espont: true,
    params: ['vt', 'freq', 'tinsp', 'flow', 'peep', 'fio2', 'pmax', 'asb', 'trig', 'rampa'],
    desc: 'Combina respiraciones mandatorias sincronizadas con el esfuerzo del paciente y respiraciones espontáneas libres entre ellas. Modo clásico de <b>destete</b>: se baja la frecuencia mandatoria y el paciente asume progresivamente el trabajo. Añade ASB para soportar las espontáneas.'
  },
  BIPAP: {
    n: 'BIPAP', sub: 'Presión controlada bifásica',
    tipo: 'pc', espont: true,
    params: ['pinsp', 'freq', 'tinsp', 'peep', 'fio2', 'asb', 'trig', 'rampa'],
    desc: 'Dos niveles de presión entre los que el paciente puede respirar espontáneamente <b>en cualquier momento</b>. Es el modo estrella del Evita: presión controlada, volumen variable según la mecánica. Muy cómodo y permite pasar de soporte total a destete sin cambiar de modo.'
  },
  CPAP: {
    n: 'CPAP / ASB', sub: 'Espontáneo con soporte',
    tipo: 'sp', espont: true,
    params: ['peep', 'fio2', 'asb', 'trig', 'rampa', 'tapn'],
    desc: 'El paciente respira espontáneamente sobre una presión positiva continua; cada esfuerzo se apoya con una presión de soporte (ASB). Es el modo de <b>prueba de ventilación espontánea</b> antes de extubar. Requiere impulso respiratorio propio y una ventilación de apnea de respaldo.'
  },
  APRV: {
    n: 'APRV', sub: 'Liberación de presión',
    tipo: 'aprv', espont: true,
    params: ['phigh', 'plow', 'thigh', 'tlow', 'fio2', 'trig'],
    desc: 'Presión alta mantenida durante mucho tiempo con liberaciones espiratorias muy breves. Recluta manteniendo la presión media alta y permite respiración espontánea durante toda la fase. Se usa en hipoxemia refractaria; exige vigilar de cerca el volumen liberado y el auto-PEEP.'
  },
  MMV: {
    n: 'MMV', sub: 'Volumen minuto mandatorio',
    tipo: 'vc', espont: true,
    params: ['vt', 'freq', 'tinsp', 'peep', 'fio2', 'asb', 'trig'],
    desc: 'El ventilador garantiza un volumen minuto mínimo: si el paciente ventila lo suficiente por sí mismo, no entrega respiraciones mandatorias; si decae, las repone automáticamente. Destete automatizado con red de seguridad.'
  }
};

/* ══════════════════════════════════════════════════════════════
   PARÁMETROS AJUSTABLES (rangos del Evita 4)
══════════════════════════════════════════════════════════════ */
const PARAMS = {
  vt:    { lab: 'VT', desc: 'Volumen corriente', u: 'mL', min: 100, max: 2000, step: 10, dec: 0, g: 'Volumen y frecuencia', k: 'var(--cian)',
           ayuda: 'Volumen de gas que entra en cada respiración mandatoria. <b>Siempre se calcula sobre el peso predicho por la talla</b> (PBW), no sobre el peso real. Objetivo protector: 6 mL/kg PBW (rango 4–8). En SDRA, 4–6 mL/kg. Un volumen excesivo produce volutrauma aunque la presión parezca aceptable.' },
  freq:  { lab: 'FR', desc: 'Frecuencia respiratoria mandatoria', u: '/min', min: 2, max: 80, step: 1, dec: 0, g: 'Volumen y frecuencia', k: 'var(--cian)',
           ayuda: 'Respiraciones mandatorias por minuto. Junto al VT define el volumen minuto y, por tanto, la <b>PaCO₂</b>. Subirla elimina más CO₂; bajarla la retiene. En obstructivos (EPOC/asma) una frecuencia alta acorta el tiempo espiratorio y provoca atrapamiento aéreo.' },
  tinsp: { lab: 'Tinsp', desc: 'Tiempo inspiratorio', u: 's', min: 0.1, max: 10, step: 0.1, dec: 1, g: 'Tiempos', k: 'var(--oro)',
           ayuda: 'Duración de la inspiración. Con la FR determina la relación I:E. Un Tinsp largo mejora la distribución del gas y la oxigenación, pero acorta la espiración: en obstructivos es la vía directa al auto-PEEP. Habitual: 0.8–1.2 s en obstructivos, 1.0–1.5 s en SDRA.' },
  flow:  { lab: 'Flujo', desc: 'Flujo inspiratorio', u: 'L/min', min: 6, max: 120, step: 1, dec: 0, g: 'Tiempos', k: 'var(--oro)',
           ayuda: 'Velocidad con la que se entrega el volumen en modos controlados por volumen. Un flujo alto acorta el tiempo de insuflación (más tiempo espiratorio, útil en EPOC/asma) pero eleva la presión pico. La presión pico depende del flujo y la resistencia; la <b>meseta</b> depende del volumen y la distensibilidad.' },
  pinsp: { lab: 'Pinsp', desc: 'Presión inspiratoria', u: 'mbar', min: 0, max: 95, step: 1, dec: 0, g: 'Presiones', k: 'var(--rojo)',
           ayuda: 'Presión mantenida durante la inspiración en modos de presión (BIPAP/PCV). En el Evita 4 es una presión <b>absoluta</b>: la presión de distensión (driving pressure) es Pinsp − PEEP. Mantener Pinsp ≤ 30 mbar y driving pressure ≤ 15 mbar. El volumen resultante varía con la mecánica: hay que vigilarlo.' },
  peep:  { lab: 'PEEP', desc: 'Presión positiva al final de la espiración', u: 'mbar', min: 0, max: 35, step: 1, dec: 0, g: 'Presiones', k: 'var(--rojo)',
           ayuda: 'Presión que impide el colapso alveolar al final de la espiración. Mejora la oxigenación reclutando alvéolos, pero al aumentar la presión intratorácica <b>reduce el retorno venoso</b> y puede bajar la presión arterial. Mínimo fisiológico 5. En SDRA se titula con la tabla PEEP/FiO₂; en obstructivos se usa baja (≈80 % del auto-PEEP).' },
  fio2:  { lab: 'FiO₂', desc: 'Fracción inspirada de oxígeno', u: '%', min: 21, max: 100, step: 5, dec: 0, g: 'Oxigenación', k: 'var(--verde)',
           ayuda: 'Porcentaje de oxígeno del gas inspirado. Se ajusta a la <b>mínima</b> que consiga el objetivo de SpO₂ (94–98 % en general, 88–92 % en EPOC retenedor). Por encima de 60 % de forma prolongada produce toxicidad por oxígeno y atelectasias por reabsorción. La FiO₂ alta no corrige el shunt: para eso está la PEEP.' },
  pmax:  { lab: 'Pmax', desc: 'Límite de presión', u: 'mbar', min: 10, max: 100, step: 1, dec: 0, g: 'Presiones', k: 'var(--rojo)',
           ayuda: 'Techo de presión en modos de volumen: cuando se alcanza, el flujo se limita y el volumen programado puede no entregarse por completo. Es una red de seguridad, no un objetivo. Si el equipo lo alcanza continuamente, el problema está en la mecánica del paciente o en el circuito.' },
  asb:   { lab: 'ASB', desc: 'Presión de soporte', u: 'mbar', min: 0, max: 95, step: 1, dec: 0, g: 'Soporte espontáneo', k: 'var(--violeta)',
           ayuda: 'Presión con la que el ventilador ayuda a cada respiración <b>espontánea</b> del paciente (por encima de la PEEP). Demasiado baja: el paciente se agota y respira rápido y superficial. Demasiado alta: sobreasistencia, atrofia diafragmática y alcalosis. Ajuste típico 8–15 mbar; en prueba de ventilación espontánea 5–8.' },
  rampa: { lab: 'Rampa', desc: 'Tiempo de ascenso de presión', u: 's', min: 0, max: 2, step: 0.05, dec: 2, g: 'Soporte espontáneo', k: 'var(--violeta)',
           ayuda: 'Rapidez con la que se alcanza la presión programada. Rampa corta = flujo inicial vigoroso (cómodo en pacientes con demanda alta); rampa larga = ascenso suave (más cómodo en pacientes tranquilos o con vía aérea sensible). Una rampa mal ajustada es causa frecuente de asincronía y de "hambre de aire".' },
  trig:  { lab: 'Trigger', desc: 'Sensibilidad de disparo por flujo', u: 'L/min', min: 0.3, max: 15, step: 0.1, dec: 1, g: 'Soporte espontáneo', k: 'var(--violeta)',
           ayuda: 'Esfuerzo mínimo que debe hacer el paciente para que el ventilador le entregue una respiración. Valor bajo = muy sensible (riesgo de <b>autodisparo</b> por agua en el circuito o latido cardiaco). Valor alto = el paciente se esfuerza en vano (<b>esfuerzos inefectivos</b> y agotamiento). Ajuste habitual: 2–3 L/min.' },
  phigh: { lab: 'P alta', desc: 'Presión alta (APRV)', u: 'mbar', min: 0, max: 95, step: 1, dec: 0, g: 'APRV', k: 'var(--rojo)',
           ayuda: 'Nivel de presión mantenido durante la mayor parte del ciclo en APRV. Determina el reclutamiento y la presión media. Suele fijarse en 20–30 mbar.' },
  plow:  { lab: 'P baja', desc: 'Presión baja (APRV)', u: 'mbar', min: 0, max: 35, step: 1, dec: 0, g: 'APRV', k: 'var(--rojo)',
           ayuda: 'Presión durante la liberación. Habitualmente 0–5 mbar: el auto-PEEP generado por la liberación tan breve es el que evita el colapso.' },
  thigh: { lab: 'T alto', desc: 'Tiempo en presión alta', u: 's', min: 0.5, max: 20, step: 0.1, dec: 1, g: 'APRV', k: 'var(--oro)',
           ayuda: 'Duración de la fase de presión alta (4–6 s habitual). Es donde el paciente respira espontáneamente.' },
  tlow:  { lab: 'T bajo', desc: 'Tiempo de liberación', u: 's', min: 0.1, max: 3, step: 0.05, dec: 2, g: 'APRV', k: 'var(--oro)',
           ayuda: 'Duración de la liberación espiratoria (0.4–0.8 s). Muy corta: no se elimina CO₂. Muy larga: se pierde el reclutamiento. Se titula para que el flujo espiratorio se corte al 75 % de su pico.' },
  tapn:  { lab: 'T apnea', desc: 'Tiempo de alarma de apnea', u: 's', min: 5, max: 60, step: 1, dec: 0, g: 'Seguridad', k: 'var(--ambar)',
           ayuda: 'Segundos sin respiración detectada tras los que el equipo declara apnea y arranca la ventilación de respaldo. Imprescindible en modos espontáneos. Habitual: 15–20 s.' }
};

/* ─────────── Límites de alarma (rangos Evita 4) ─────────── */
const ALARMAS = {
  pawHi: { lab: 'Paw ↑', desc: 'Presión máxima en la vía aérea', u: 'mbar', min: 10, max: 99, step: 1, def: 40,
           ayuda: 'Se dispara con obstrucción, secreciones, mordida del tubo, neumotórax o caída de la distensibilidad. Nunca debe subirse "para que deje de sonar": hay que buscar la causa.' },
  mvHi:  { lab: 'VM ↑', desc: 'Volumen minuto alto', u: 'L/min', min: 1, max: 41, step: 0.5, def: 14 },
  mvLo:  { lab: 'VM ↓', desc: 'Volumen minuto bajo', u: 'L/min', min: 0.5, max: 40, step: 0.5, def: 4,
           ayuda: 'La alarma más importante en modos espontáneos: avisa de desconexión, apnea o agotamiento del paciente.' },
  vtiHi: { lab: 'VTi ↑', desc: 'Volumen corriente inspirado alto', u: 'mL', min: 100, max: 4000, step: 50, def: 800 },
  fspnHi:{ lab: 'f esp ↑', desc: 'Frecuencia espontánea alta', u: '/min', min: 5, max: 120, step: 1, def: 35,
           ayuda: 'Detecta taquipnea: soporte insuficiente, dolor, ansiedad o fracaso del destete.' }
};

/* ══════════════════════════════════════════════════════════════
   ESTADO GLOBAL
══════════════════════════════════════════════════════════════ */
const S = {
  pt: null,          // datos del paciente
  fis: null,         // parámetros fisiológicos vivos
  modo: 'IPPV',
  autoflow: false,
  asbOn: false,
  set: {},           // valores de los parámetros
  al: {},            // límites de alarma
  alOn: {},          // alarma activada/desactivada
  med: {},           // valores medidos
  t: 0,              // tiempo simulado (s)
  corriendo: false,
  congelado: false,
  mute: 0,
  log: [],
  errores: {},       // id -> {n, sev, título}
  aciertos: {},
  disparadas: {},    // cooldown de reglas
  eventos: [],
  trend: [],
  objetivo: null,    // objetivo del caso clínico
  caso: null
};

/* ─────────── Valores iniciales de fábrica ─────────── */
function ajustesFabrica(pbw) {
  const vt = Math.round((pbw * 8) / 10) * 10;
  return {
    vt: clamp(vt, 100, 2000), freq: 14, tinsp: 1.4, flow: 40,
    pinsp: 18, peep: 5, fio2: 50, pmax: 40, asb: 10, rampa: 0.15, trig: 2,
    phigh: 26, plow: 5, thigh: 4.0, tlow: 0.6, tapn: 20
  };
}

/* ══════════════════════════════════════════════════════════════
   Parte 2/4 · MOTOR FISIOLÓGICO
══════════════════════════════════════════════════════════════ */

/** Peso predicho por talla y sexo (fórmula ARDSNet) */
function calcPBW(talla, sexo) {
  const base = sexo === 'F' ? 45.5 : 50;
  return clamp(base + 0.91 * (talla - 152.4), 20, 140);
}

/** Curva de disociación de la hemoglobina (Severinghaus) */
function sat(po2) {
  if (po2 <= 0) return 0;
  const p = Math.pow(po2, 3) + 150 * po2;
  return clamp(1 / (23400 / p + 1), 0, 1);
}
/** Inversa de la curva: PaO2 a partir de la saturación */
function po2DeSat(s) {
  s = clamp(s, 0.001, 0.9999);
  let lo = 1, hi = 700;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (sat(m) < s) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
/** Desplazamiento de la curva por pH y temperatura (efecto Bohr) */
function bohr(po2, ph, temp) {
  const f = Math.pow(10, 0.48 * (7.40 - ph) + 0.024 * (temp - 37));
  return po2 * f;
}
const pH = (hco3, paco2) => 6.1 + Math.log10(Math.max(0.5, hco3) / Math.max(0.05, 0.03 * paco2));
const calcBE = (hco3, ph) => 0.93 * (hco3 - 24.4 + 14.8 * (ph - 7.40));

/** Construye el estado fisiológico inicial a partir del formulario */
function crearFisiologia(pt) {
  const d = DX[pt.dx];
  const gsev = pt.gravedad === 'severo' ? 1 : pt.gravedad === 'leve' ? -1 : 0;
  // La gravedad empeora distensibilidad, shunt y resistencia
  const crs   = clamp(d.crs * (1 - gsev * 0.28), 12, 100);
  const raw   = clamp(d.raw * (1 + gsev * 0.35), 4, 60);
  const shunt = clamp(d.shunt * (1 + gsev * 0.45), 0.02, 0.55);
  const vdvt  = clamp(d.vdvt + gsev * 0.06, 0.25, 0.75);

  // Producción de CO2 y consumo de O2: escalan con la masa magra, no con la
  // grasa, por eso se usa el peso ajustado (PBW + 40 % del exceso) y no el real
  const pesoAj = pt.pbw + 0.4 * Math.max(0, pt.peso - pt.pbw);
  const vco2 = 2.9 * pesoAj * d.vco2 * (1 + 0.12 * (pt.temp - 37));
  const vo2  = 3.5 * pesoAj * d.vco2 * (1 + 0.10 * (pt.temp - 37));

  const hemoK = pt.hemo === 'shock' ? 0.95 : pt.hemo === 'hipovolemico' ? 0.70 : 0.34;
  const coBase = d.co * (pt.hemo === 'shock' ? 0.72 : pt.hemo === 'hipovolemico' ? 0.85 : 1);
  const mapBase = d.map * (pt.hemo === 'shock' ? 0.80 : pt.hemo === 'hipovolemico' ? 0.90 : 1);

  return {
    crs, crs0: crs, raw, raw0: raw, shunt, shunt0: shunt, vdvt, vdvt0: vdvt,
    recl: d.recl, peepOpt: d.peepOpt, vco2, vo2,
    // gases vivos
    paco2: pt.gaso.paco2, paco2Basal: pt.gaso.paco2, pao2: pt.gaso.pao2, hco3met: pt.gaso.hco3,
    hco3: pt.gaso.hco3, ph: pt.gaso.ph, sao2: pt.gaso.sao2 / 100,
    spo2: pt.gaso.sao2, lac: pt.gaso.lac, hb: pt.gaso.hb,
    hr: d.hr, map: mapBase, co: coBase, coBase, mapBase, hemoK,
    // impulso respiratorio
    sedK: pt.sedacion === 'profunda' ? 0.15 : pt.sedacion === 'moderada' ? 0.6 : 1.0,
    bnm: pt.bnm === 'si',
    fatiga: 0, neumotorax: false, secreciones: 0, desconectado: false,
    tiempoFiO2alta: 0, tiempoPplatAlto: 0, tiempoHipox: 0, o2tox: 0
  };
}

/* ─────────── Mecánica respiratoria ─────────── */
function calcMecanica() {
  const f = S.fis, st = S.set, M = MODOS[S.modo];
  const tau = (f.raw * f.crs) / 1000;              // constante de tiempo (s)
  let freq = st.freq, ti = st.tinsp, peep = st.peep;
  let vtSet = st.vt, tipo = M.tipo;

  if (S.modo === 'APRV') {
    freq = 60 / (st.thigh + st.tlow);
    ti = st.thigh; peep = st.plow; tipo = 'pc';
  }

  // ── Impulso respiratorio del paciente ──
  let drive = 0;
  if (!f.bnm) {
    drive = 13
      + 1.05 * (f.paco2 - 40)
      + (f.pao2 < 65 ? (65 - f.pao2) * 0.30 : 0)
      + (f.ph < 7.30 ? (7.30 - f.ph) * 90 : 0)
      - (f.ph > 7.47 ? (f.ph - 7.47) * 110 : 0)
      + f.fatiga * 12
      + (f.lac > 3 ? (f.lac - 3) * 1.2 : 0);
    drive = clamp(drive * f.sedK, 0, 65);
  }
  f.drive = drive;

  let fEsp = 0, vtEsp = 0;
  if (M.espont && drive > 0) fEsp = Math.max(0, drive - (S.modo === 'CPAP' ? 0 : freq * 0.75));
  if (S.modo === 'CPAP' || S.modo === 'APRV') fEsp = drive;

  // Volumen de las respiraciones espontáneas (esfuerzo + ASB)
  if (fEsp > 0) {
    const asb = (S.asbOn || S.modo === 'CPAP') ? st.asb : 0;
    const esfuerzo = clamp(4 + drive * 0.12 - f.fatiga * 3, 1, 9); // cmH2O de presión muscular
    const tiEsp = clamp(60 / Math.max(8, fEsp) * 0.35, 0.4, 1.6);
    vtEsp = (asb + esfuerzo) * f.crs * (1 - Math.exp(-tiEsp / tau));
    // Un trigger insensible hace que muchos esfuerzos no lleguen a disparar
    if (st.trig > 4) { const perd = clamp((st.trig - 4) / 8, 0, 0.6); fEsp *= (1 - perd); f.esfInef = perd; }
    else f.esfInef = 0;
    // Autodisparo con trigger demasiado sensible
    f.autoTrig = st.trig < 0.8 ? clamp((0.8 - st.trig) * 14, 0, 8) : 0;
    fEsp += f.autoTrig;
  } else { f.esfInef = 0; f.autoTrig = 0; }

  const fMand = (S.modo === 'CPAP') ? 0 : freq;
  let fTot = fMand + fEsp;
  if (S.modo === 'MMV') {
    // MMV: sólo repone lo que falta para el volumen minuto objetivo
    const vmObj = freq * vtSet / 1000;
    const vmEsp = fEsp * vtEsp / 1000;
    fTot = fEsp + Math.max(0, (vmObj - vmEsp) / (vtSet / 1000));
  }
  fTot = clamp(fTot, 0, 90);

  // ── Tiempos y atrapamiento aéreo ──
  const tTot = 60 / Math.max(1, fTot);
  const te = Math.max(0.15, tTot - ti);
  const vaciado = 1 - Math.exp(-te / tau);
  let vtMand = 0, ppico = 0, pplat = 0;

  if (tipo === 'vc') {
    vtMand = vtSet;
    const flujoLs = st.flow / 60;
    pplat = peep + vtMand / f.crs;
    ppico = pplat + flujoLs * f.raw;
    // Límite de presión: el equipo reduce el flujo y pasa a ventilación
    // limitada por presión, entregando lo que quepa en el tiempo inspiratorio
    if (!S.autoflow && ppico > st.pmax) {
      const disp = Math.max(0, st.pmax - peep);
      vtMand = clamp(disp * f.crs * (1 - Math.exp(-ti / tau)), 0, vtSet);
      pplat = peep + vtMand / f.crs;
      ppico = st.pmax;
      f.limitado = vtSet - vtMand > 15;
    } else f.limitado = false;
    if (S.autoflow) { ppico = pplat + 1.5; f.limitado = false; }
  } else if (tipo === 'pc') {
    const pIns = (S.modo === 'APRV') ? st.phigh : st.pinsp;
    const dp = Math.max(0, pIns - peep);
    vtMand = dp * f.crs * (1 - Math.exp(-ti / tau));
    pplat = peep + vtMand / f.crs;
    ppico = pIns;
    f.limitado = false;
  } else { // espontáneo puro
    vtMand = 0; ppico = peep + (S.set.asb || 0); pplat = ppico; f.limitado = false;
  }

  // Auto-PEEP: el volumen que no sale en cada ciclo se acumula respiración
  // tras respiración hasta alcanzar un nuevo equilibrio a mayor volumen
  // pulmonar → Vatrapado = VT · r/(1−r), con r = fracción no exhalada
  const vtRef = fMand > 0 ? vtMand : vtEsp;
  const r = clamp(Math.exp(-te / tau), 0, 0.93);
  const atrapado = vtRef * r / (1 - r);
  let autoPeep = atrapado / f.crs;
  autoPeep = clamp(autoPeep, 0, 30);
  if (autoPeep < 0.4) autoPeep = 0;

  const peepTot = peep + autoPeep;
  // Con auto-PEEP la presión meseta real sube
  pplat = pplat + autoPeep;
  ppico = ppico + autoPeep;

  const vm = (fMand * vtMand + fEsp * vtEsp) / 1000;
  const pmedia = peepTot + (ppico - peepTot) * (ti / tTot) * (tipo === 'pc' ? 0.92 : 0.55);
  const ie = te / ti;

  return {
    tau, freq: fMand, fEsp, fTot, ti, te, tTot, vtMand, vtEsp,
    vtEntregado: vtMand || vtEsp, vm, ppico, pplat, pmedia, peepSet: peep,
    autoPeep, peepTot, ie, dp: pplat - peepTot,
    cdin: (ppico - peepTot) > 0 ? vtRef / (ppico - peepTot) : 0,
    cest: (pplat - peepTot) > 0 ? vtRef / (pplat - peepTot) : 0,
    rins: st.flow > 0 ? (ppico - pplat) / (st.flow / 60) : f.raw,
    vaciado
  };
}

/* ─────────── Intercambio gaseoso y hemodinámica ─────────── */
function tickFisiologia(dt) {
  const f = S.fis, m = S.med, pt = S.pt;

  if (f.desconectado) {
    f.paco2 += 3.2 * dt / 60 * 60 * 0.05;
    f.pao2 -= 22 * dt / 5;
  }

  // ── Espacio muerto efectivo: sobredistensión y auto-PEEP lo aumentan ──
  const sobre = Math.max(0, (m.peepTot - (f.peepOpt + 4)) / 10)
              + Math.max(0, (m.pplat - 30) * 0.010);
  // La hiperinsuflación dinámica comprime los capilares alveolares: zonas
  // ventiladas y no perfundidas, es decir, más espacio muerto
  const vdvtEf = clamp(f.vdvt + sobre * 0.18 + m.autoPeep * 0.018
                       + f.secreciones * 0.05, 0.2, 0.85);
  f.vdvtEf = vdvtEf;

  // ── Ventilación alveolar y PaCO2 ──
  // Vd/Vt ya incluye el espacio muerto anatómico y el alveolar
  const vtEf = m.vtEntregado;
  const vAlv = Math.max(0.05, m.fTot * Math.max(0, vtEf * (1 - vdvtEf)) / 1000);
  let paco2Obj = clamp(0.863 * f.vco2 / vAlv, 8, 160);
  if (f.desconectado) paco2Obj = 160;
  f.paco2 += (paco2Obj - f.paco2) * (1 - Math.exp(-dt / 110));
  f.paco2 = clamp(f.paco2, 8, 180);

  // ── Bicarbonato: amortiguación aguda + compensación renal lenta ──
  // La amortiguación tisular se mide sobre el CAMBIO que provocamos nosotros,
  // no sobre 40 mmHg: la gasometría de ingreso ya incorpora la compensación
  // que el paciente traía. Pendiente 1 mEq/10 mmHg por encima de 40 y
  // 2 mEq/10 mmHg por debajo.
  const buf = x => (x > 40 ? (x - 40) / 10 * 1.0 : (x - 40) / 10 * 2.0);
  const bufferAgudo = buf(f.paco2) - buf(f.paco2Basal);
  const dPaco2 = f.paco2 - 40;
  // El componente metabólico depende de la enfermedad de base, no de la
  // ventilación: se mantiene estable durante la sesión (su tratamiento es
  // insulina, líquidos o diálisis, no el ventilador)
  const objMet = DX[pt.dx].hco3;
  // Compensación renal lenta hacia el bicarbonato esperado
  const compRenal = dPaco2 > 0 ? clamp(dPaco2 / 10 * 3.0, 0, 16) : clamp(dPaco2 / 10 * 4.0, -12, 0);
  f.hco3met += ((objMet + compRenal * 0.35) - f.hco3met) * (1 - Math.exp(-dt / 5400));
  f.hco3met = clamp(f.hco3met, 3, 48);
  f.hco3 = clamp(f.hco3met + bufferAgudo, 2, 55);
  f.ph = clamp(pH(f.hco3, f.paco2), 6.60, 7.85);

  // ── Oxigenación ──
  const fio2 = S.set.fio2 / 100;
  const pAlvO2 = fio2 * (760 - 47) - f.paco2 / 0.8;
  // Reclutamiento por PEEP (satura en peepOpt) y sobredistensión por encima
  const rec = clamp((m.peepTot - 2) / Math.max(2, f.peepOpt - 2), 0, 1);
  const penal = Math.max(0, (m.peepTot - (f.peepOpt + 5)) * 0.012);
  let shuntEf = clamp(f.shunt * (1 - f.recl * rec) + penal + f.secreciones * 0.05
                      + (f.neumotorax ? 0.16 : 0), 0.02, 0.7);
  f.shuntEf = shuntEf;

  const co = Math.max(1.2, f.co);
  const ccO2 = 1.34 * f.hb * 1.0 + 0.003 * pAlvO2;
  const caO2 = Math.max(2, ccO2 - shuntEf * (f.vo2 / 10) / Math.max(0.05, (1 - shuntEf) * co));
  let satArt = clamp((caO2 - 0.003 * f.pao2) / (1.34 * f.hb), 0.30, 1);
  let po2Obj = bohr(po2DeSat(satArt), f.ph, pt.temp);
  po2Obj = clamp(Math.min(po2Obj, pAlvO2 - 2), 15, 620);
  f.pao2 += (po2Obj - f.pao2) * (1 - Math.exp(-dt / 40));
  f.pao2 = clamp(f.pao2, 12, 620);
  f.sao2 = clamp(sat(bohr(f.pao2, 7.40, 37) / Math.pow(10, 0.48 * (7.40 - f.ph))), 0.20, 1);
  const spoObj = f.sao2 * 100;
  f.spo2 += (spoObj - f.spo2) * (1 - Math.exp(-dt / 18));

  // ── Hemodinámica: la presión intratorácica frena el retorno venoso ──
  const carga = Math.max(0, m.pmedia - 4);
  let coObj = f.coBase * (1 - f.hemoK * carga / 42);
  if (f.neumotorax) coObj *= 0.62;
  if (f.ph < 7.15) coObj *= (1 - (7.15 - f.ph) * 1.3);
  if (f.pao2 < 45) coObj *= (1 - (45 - f.pao2) * 0.008);
  coObj = clamp(coObj, 0.8, 12);
  f.co += (coObj - f.co) * (1 - Math.exp(-dt / 25));

  let mapObj = f.mapBase * Math.pow(f.co / f.coBase, 0.85);
  if (f.ph < 7.20) mapObj -= (7.20 - f.ph) * 55;
  mapObj = clamp(mapObj, 22, 145);
  f.map += (mapObj - f.map) * (1 - Math.exp(-dt / 22));

  let hrObj = DX[pt.dx].hr
    + (f.spo2 < 92 ? (92 - f.spo2) * 1.9 : 0)
    + (f.map < 70 ? (70 - f.map) * 0.85 : 0)
    + (f.paco2 > 50 ? (f.paco2 - 50) * 0.45 : 0)
    + (f.ph < 7.25 ? (7.25 - f.ph) * 120 : 0)
    + f.fatiga * 18;
  if (f.spo2 < 70) hrObj -= (70 - f.spo2) * 4.2;   // bradicardia hipóxica preterminal
  hrObj = clamp(hrObj, 22, 190);
  f.hr += (hrObj - f.hr) * (1 - Math.exp(-dt / 15));

  // ── Lactato: sube con hipoperfusión e hipoxemia ──
  const lacObj = DX[pt.dx].lac
    + (f.map < 65 ? (65 - f.map) * 0.10 : 0)
    + (f.spo2 < 88 ? (88 - f.spo2) * 0.13 : 0)
    + (f.co < 3.5 ? (3.5 - f.co) * 1.1 : 0);
  f.lac += (lacObj - f.lac) * (1 - Math.exp(-dt / 420));
  f.lac = clamp(f.lac, 0.4, 22);

  // ── Fatiga muscular: trabajo excesivo o soporte insuficiente ──
  const soporteBajo = MODOS[S.modo].espont && m.fEsp > 26 && (S.set.asb < 8 || !S.asbOn) && S.modo !== 'IPPV';
  if (soporteBajo || f.esfInef > 0.25) f.fatiga = clamp(f.fatiga + dt / 900, 0, 1);
  else f.fatiga = clamp(f.fatiga - dt / 1400, 0, 1);

  // ── Lesión acumulada: barotrauma y toxicidad por oxígeno ──
  if (m.pplat > 32) f.tiempoPplatAlto += dt; else f.tiempoPplatAlto = Math.max(0, f.tiempoPplatAlto - dt / 3);
  if (S.set.fio2 > 60) f.tiempoFiO2alta += dt; else f.tiempoFiO2alta = Math.max(0, f.tiempoFiO2alta - dt / 4);
  if (f.tiempoFiO2alta > 3600) {           // toxicidad → cae la distensibilidad
    f.o2tox = clamp(f.o2tox + dt / 36000, 0, 0.3);
    f.crs = f.crs0 * (1 - f.o2tox);
  }
  if (f.spo2 < 85) f.tiempoHipox += dt; else f.tiempoHipox = Math.max(0, f.tiempoHipox - dt / 2);

  // Neumotórax espontáneo por presión meseta sostenida muy alta
  if (!f.neumotorax && m.pplat > 36 && f.tiempoPplatAlto > 150 && Math.random() < dt / 240) {
    provocarNeumotorax(true);
  }
  // Volumen corriente muy alto en pulmón pequeño: volutrauma progresivo
  const vtkg = m.vtEntregado / pt.pbw;
  if (vtkg > 10 && DX[pt.dx].recl > 0.3) f.crs = clamp(f.crs - dt * 0.0016 * (vtkg - 10), f.crs0 * 0.45, f.crs0);
}

/* ─────────── Valores medidos que muestra el equipo ─────────── */
function actualizarMedidos() {
  const f = S.fis, m = S.med;
  Object.assign(m, calcMecanica());
  m.etco2 = clamp(f.paco2 - (3 + f.vdvtEf * 26), 3, 90);
  m.spo2 = f.spo2; m.hr = f.hr; m.map = f.map;
  m.rsbi = m.vtEntregado > 0 ? m.fTot / (m.vtEntregado / 1000) : 999;
  m.vtkg = m.vtEntregado / S.pt.pbw;
  m.pf = f.pao2 / (S.set.fio2 / 100);
}

/* ─────────── Gasometría bajo demanda ─────────── */
function tomarGaso() {
  const f = S.fis, pt = S.pt;
  const ag = pt.na - (pt.cl + f.hco3);
  const agCorr = ag + 2.5 * (4.0 - pt.alb);
  return {
    ph: round(f.ph, 2), paco2: round(f.paco2, 0), pao2: round(f.pao2, 0),
    hco3: round(f.hco3, 1), be: round(calcBE(f.hco3, f.ph), 1),
    sao2: round(f.sao2 * 100, 0), lac: round(f.lac, 1), hb: pt.hb,
    fio2: S.set.fio2, pf: round(f.pao2 / (S.set.fio2 / 100), 0),
    aa: round((S.set.fio2 / 100) * (760 - 47) - f.paco2 / 0.8 - f.pao2, 0),
    ag: round(ag, 1), agCorr: round(agCorr, 1),
    na: pt.na, k: pt.k, cl: pt.cl, glu: pt.glu, cr: pt.cr
  };
}

/** Interpreta un trastorno ácido-base completo (con compensación) */
function interpretarAB(g) {
  const ph = g.ph, pco2 = g.paco2, hco3 = g.hco3;
  const ag = g.agCorr !== undefined ? g.agCorr : 12;
  let prim = '', nom = '', k = 'var(--verde)', det = [];

  const acidemia = ph < 7.35, alcalemia = ph > 7.45;
  if (acidemia) {
    if (hco3 < 22 && pco2 <= 45) { prim = 'metabAc'; nom = 'Acidosis metabólica'; }
    else if (pco2 > 45 && hco3 >= 22) { prim = 'respAc'; nom = 'Acidosis respiratoria'; }
    else if (pco2 > 45 && hco3 < 22) { prim = 'mixtaAc'; nom = 'Acidosis mixta (respiratoria + metabólica)'; }
    else { prim = 'metabAc'; nom = 'Acidosis metabólica'; }
    k = 'var(--rojo)';
  } else if (alcalemia) {
    if (hco3 > 26 && pco2 >= 35) { prim = 'metabAl'; nom = 'Alcalosis metabólica'; }
    else if (pco2 < 35 && hco3 <= 26) { prim = 'respAl'; nom = 'Alcalosis respiratoria'; }
    else if (pco2 < 35 && hco3 > 26) { prim = 'mixtaAl'; nom = 'Alcalosis mixta'; }
    else { prim = 'respAl'; nom = 'Alcalosis respiratoria'; }
    k = 'var(--cian)';
  } else {
    if (Math.abs(pco2 - 40) < 6 && Math.abs(hco3 - 24) < 3) { nom = 'Equilibrio ácido-base normal'; prim = 'normal'; }
    else { nom = 'Trastorno compensado o mixto con pH normal'; prim = 'comp'; k = 'var(--oro)'; }
  }

  // Comprobación de la compensación esperada
  if (prim === 'metabAc') {
    const win = 1.5 * hco3 + 8;
    det.push(`Winter: PaCO₂ esperada ${round(win - 2, 0)}–${round(win + 2, 0)} mmHg (real ${round(pco2, 0)})`);
    if (pco2 > win + 3) det.push('⚠ Compensación respiratoria INSUFICIENTE: hay además una acidosis respiratoria.');
    else if (pco2 < win - 3) det.push('⚠ PaCO₂ menor de lo esperado: alcalosis respiratoria añadida.');
    else det.push('✔ Compensación respiratoria adecuada.');
    det.push(ag > 16 ? `Anión gap ELEVADO (${g.agCorr}): cetoacidosis, lactato, tóxicos, uremia.`
                     : `Anión gap normal (${g.agCorr}): pérdidas digestivas o renales de bicarbonato.`);
  } else if (prim === 'respAc') {
    const agudo = 24 + (pco2 - 40) / 10 * 1;
    const cron  = 24 + (pco2 - 40) / 10 * 3.5;
    det.push(`HCO₃⁻ esperado si es agudo ≈ ${round(agudo, 1)}; si es crónico ≈ ${round(cron, 1)} (real ${round(hco3, 1)}).`);
    det.push(hco3 > cron - 1.5 ? 'Perfil CRÓNICO (retenedor compensado).' :
             hco3 < agudo + 1.5 ? 'Perfil AGUDO: sin tiempo de compensación renal.' : 'Perfil agudo sobre crónico.');
  } else if (prim === 'respAl') {
    const agudo = 24 - (40 - pco2) / 10 * 2;
    det.push(`HCO₃⁻ esperado si es agudo ≈ ${round(agudo, 1)} (real ${round(hco3, 1)}).`);
    det.push('Causas frecuentes en ventilación mecánica: volumen minuto excesivo, dolor, ansiedad, sepsis.');
  } else if (prim === 'metabAl') {
    const esp = 40 + 0.7 * (hco3 - 24);
    det.push(`PaCO₂ compensadora esperada ≈ ${round(esp, 0)} mmHg (real ${round(pco2, 0)}).`);
    det.push('Corregir cloro, potasio y volumen. Hiperventilar empeora la alcalemia.');
  }

  // Oxigenación
  let ox = '';
  if (g.pf < 100) ox = `PaO₂/FiO₂ ${g.pf}: hipoxemia GRAVE (criterio de SDRA severo).`;
  else if (g.pf < 200) ox = `PaO₂/FiO₂ ${g.pf}: hipoxemia moderada (SDRA moderado).`;
  else if (g.pf < 300) ox = `PaO₂/FiO₂ ${g.pf}: hipoxemia leve (SDRA leve).`;
  else ox = `PaO₂/FiO₂ ${g.pf}: oxigenación aceptable.`;
  det.push(ox);

  let sev = 'leve';
  if (ph < 7.20 || ph > 7.55 || g.pf < 100) sev = 'grave';
  else if (ph < 7.30 || ph > 7.50 || g.pf < 200) sev = 'moderado';

  return { nom, k, det, sev, prim };
}

/* ─────────── Eventos clínicos ─────────── */
function provocarNeumotorax(espontaneo) {
  const f = S.fis; if (f.neumotorax) return;
  f.neumotorax = true;
  f.crs = f.crs * 0.48; f.raw = f.raw * 1.25;
  notificar({
    sev: 'crit', ico: '🚨', k: 'var(--crit)',
    title: 'NEUMOTÓRAX A TENSIÓN',
    msg: espontaneo
      ? 'El pulmón se ha roto. La presión meseta llevaba demasiado tiempo por encima de 35 mbar.'
      : 'Se ha producido un neumotórax a tensión.',
    why: 'Al mantener presiones alveolares muy altas se rompen los alvéolos más distendidos. El aire pasa al espacio pleural, colapsa el pulmón y comprime el corazón: la distensibilidad se desploma, la presión pico se dispara y la presión arterial cae.',
    fix: 'Actuación inmediata: descompresión con aguja / drenaje torácico, bajar la presión meseta, reducir el volumen corriente y la PEEP.'
  }, 'neumotorax');
  registrarError('neumotorax', 'crit', 'Neumotórax por presión excesiva');
}

function aplicarEvento(id) {
  const f = S.fis;
  switch (id) {
    case 'secreciones':
      f.secreciones = clamp(f.secreciones + 0.5, 0, 1);
      f.raw = clamp(f.raw * 1.7, 4, 70);
      notificar({ sev: 'warn', ico: '🫧', k: 'var(--warn)', title: 'Secreciones en la vía aérea',
        msg: 'La resistencia ha subido bruscamente. Observa la diferencia entre presión pico y meseta.',
        why: 'La presión pico sube mientras la meseta se mantiene: eso señala un problema de <b>resistencia</b> (secreciones, broncoespasmo, tubo acodado), no de distensibilidad.',
        fix: 'Aspiración de secreciones. Después vuelve a comprobar la presión pico.' }, 'ev_secr');
      break;
    case 'aspirar':
      if (f.secreciones > 0) {
        f.secreciones = 0; f.raw = f.raw0 * (1 + (f.neumotorax ? 0.25 : 0));
        notificar({ sev: 'ok', ico: '✅', k: 'var(--ok)', title: 'Aspiración realizada',
          msg: 'Resistencia de nuevo en rango. La presión pico ha bajado.',
          why: 'Al retirar las secreciones desaparece la resistencia añadida; la presión meseta no cambia porque el parénquima no estaba afectado.', fix: '' }, 'ev_asp');
      } else {
        f.pao2 = clamp(f.pao2 - 14, 20, 600);
        notificar({ sev: 'warn', ico: '⚠️', k: 'var(--warn)', title: 'Aspiración innecesaria',
          msg: 'No había secreciones y has desconectado al paciente: la SpO₂ ha bajado.',
          why: 'Cada aspiración pierde presión positiva y provoca desreclutamiento alveolar, sobre todo en SDRA. Se aspira por indicación, no por rutina.',
          fix: 'Preoxigena antes, usa sistema cerrado y aspira sólo si hay signos de secreciones.' }, 'ev_asp_mal');
        registrarError('aspiracion_rutina', 'warn', 'Aspiración sin indicación');
      }
      break;
    case 'broncoespasmo':
      f.raw = clamp(f.raw * 2.1, 4, 70);
      notificar({ sev: 'crit', ico: '🌪️', k: 'var(--crit)', title: 'Broncoespasmo agudo',
        msg: 'Resistencia muy elevada y espiración prolongada. Vigila el auto-PEEP.',
        why: 'La constante de tiempo espiratoria se alarga: con la frecuencia actual puede no dar tiempo a vaciar el pulmón y aparecer hiperinsuflación dinámica.',
        fix: 'Broncodilatadores, bajar la frecuencia, acortar el Tinsp y aumentar el flujo para alargar la espiración.' }, 'ev_bronco');
      break;
    case 'desconexion':
      f.desconectado = true;
      notificar({ sev: 'crit', ico: '🔌', k: 'var(--crit)', title: 'DESCONEXIÓN DEL CIRCUITO',
        msg: 'El paciente no está recibiendo ventilación.',
        why: 'La alarma de volumen minuto bajo es la que debe detectarlo. Si está desactivada o con el límite demasiado bajo, la desconexión pasa inadvertida: es un error de seguridad potencialmente mortal.',
        fix: 'Reconectar de inmediato y revisar todo el circuito.' }, 'ev_desc');
      break;
    case 'reconectar':
      f.desconectado = false;
      notificar({ sev: 'ok', ico: '🔗', k: 'var(--ok)', title: 'Circuito reconectado', msg: 'Ventilación restablecida.', why: '', fix: '' }, 'ev_rec');
      break;
    case 'fiebre':
      S.pt.temp = clamp(S.pt.temp + 1.5, 34, 42);
      f.vco2 *= 1.22; f.vo2 *= 1.20;
      notificar({ sev: 'warn', ico: '🌡️', k: 'var(--warn)', title: 'Fiebre: 38.9 °C',
        msg: 'Ha aumentado la producción de CO₂ y el consumo de oxígeno.',
        why: 'Por cada grado de temperatura el metabolismo sube ≈ 10–13 %. Con el mismo volumen minuto la PaCO₂ sube y la SpO₂ baja.',
        fix: 'Antitérmicos y, si es necesario, un pequeño aumento del volumen minuto.' }, 'ev_fiebre');
      break;
    case 'reclutamiento': {
      const m = S.med;
      if (m.pplat > 32 || S.fis.map < 65) {
        notificar({ sev: 'crit', ico: '⛔', k: 'var(--crit)', title: 'Maniobra de reclutamiento peligrosa',
          msg: 'Se ha realizado con presión meseta ya alta o con hipotensión.',
          why: 'Una maniobra de reclutamiento aplica presiones de 30–40 cmH₂O durante segundos. Sobre un pulmón ya sobredistendido causa barotrauma, y en un paciente hipotenso hunde el gasto cardiaco.',
          fix: 'Optimiza primero el volumen y la volemia; recluta sólo en pulmón reclutable y con vigilancia hemodinámica.' }, 'ev_rec_mal');
        registrarError('reclutamiento_inseguro', 'crit', 'Reclutamiento con condiciones inseguras');
        f.map = clamp(f.map - 16, 25, 140);
      } else if (f.recl > 0.3) {
        f.shunt = clamp(f.shunt * 0.72, 0.02, 0.7);
        f.map = clamp(f.map - 7, 25, 140);
        notificar({ sev: 'ok', ico: '🎈', k: 'var(--ok)', title: 'Reclutamiento efectivo',
          msg: 'Ha mejorado la oxigenación. Mantén una PEEP suficiente para no perder lo ganado.',
          why: 'Se han abierto alvéolos colapsados y ha disminuido el shunt. Si la PEEP posterior es insuficiente volverán a colapsar en pocos minutos.', fix: '' }, 'ev_recl');
      } else {
        notificar({ sev: 'warn', ico: '🤷', k: 'var(--warn)', title: 'Pulmón no reclutable',
          msg: 'La maniobra no ha mejorado la oxigenación y ha bajado la presión arterial.',
          why: 'En patología obstructiva (EPOC, asma) no hay alvéolos colapsados que abrir: sólo se consigue sobredistensión y caída del retorno venoso.',
          fix: 'Reserva el reclutamiento para el pulmón reclutable (SDRA, edema, atelectasias).' }, 'ev_recl_no');
        f.map = clamp(f.map - 9, 25, 140);
      }
      break;
    }
    case 'sedar':
      f.sedK = clamp(f.sedK - 0.3, 0.05, 1);
      notificar({ sev: 'info', ico: '💤', k: 'var(--cian)', title: 'Sedación profundizada',
        msg: 'Ha disminuido el impulso respiratorio del paciente.',
        why: 'La sedación reduce las respiraciones espontáneas: baja el volumen minuto total y sube la PaCO₂ si no se compensa con la programación.',
        fix: 'Comprueba el volumen minuto y la frecuencia total tras sedar.' }, 'ev_sed');
      break;
    case 'despertar':
      f.sedK = clamp(f.sedK + 0.3, 0.05, 1);
      notificar({ sev: 'info', ico: '☀️', k: 'var(--cian)', title: 'Sedación aligerada',
        msg: 'El paciente recupera impulso respiratorio.',
        why: 'La interrupción diaria de la sedación acorta los días de ventilación mecánica, pero exige un modo que permita respirar (SIMV, BIPAP, CPAP) y un trigger bien ajustado.',
        fix: 'Si el paciente lucha contra el ventilador, revisa el modo, el trigger y el soporte.' }, 'ev_desp');
      break;
    case 'avanzar':
      for (let i = 0; i < 60; i++) { actualizarMedidos(); tickFisiologia(15); S.t += 15; }
      notificar({ sev: 'info', ico: '⏩', k: 'var(--cian)', title: '15 minutos después…',
        msg: 'El paciente ha alcanzado un nuevo estado de equilibrio con la programación actual.',
        why: '', fix: 'Toma una gasometría para valorar el resultado real de tus ajustes.' }, 'ev_avanzar');
      break;
  }
}

/* ══════════════════════════════════════════════════════════════
   Parte 3/4 · REGLAS DE RETROALIMENTACIÓN + CURVAS
   Cada regla explica QUÉ pasó, POR QUÉ pasó y CÓMO se corrige.
══════════════════════════════════════════════════════════════ */

const REGLAS = [
  /* ── Protección pulmonar ── */
  {
    id: 'vt_muy_alto', sev: 'crit', cd: 90, tema: 'Protección pulmonar',
    when: (m, f, p) => m.vtkg > 10 && m.vtMand > 0,
    ico: '💥', title: 'Volumen corriente peligrosamente alto',
    msg: m => `Estás entregando <b>${round(m.vtkg, 1)} mL/kg</b> de peso predicho (${round(m.vtEntregado, 0)} mL). El límite seguro es 8 mL/kg y en pulmón lesionado 6 mL/kg.`,
    why: 'El pulmón enfermo no es rígido de forma uniforme: es <b>pequeño</b>. Todo el volumen entra en las pocas zonas sanas que quedan y las desgarra (volutrauma). Es el mecanismo que más mortalidad añade en ventilación mecánica, y ocurre aunque la presión pico parezca aceptable.',
    fix: p => `Baja el VT a ${Math.round(p.pbw * 6 / 10) * 10}–${Math.round(p.pbw * 8 / 10) * 10} mL (6–8 mL/kg PBW). Si sube la PaCO₂, compensa subiendo la frecuencia, no el volumen.`
  },
  {
    id: 'vt_alto', sev: 'warn', cd: 150, tema: 'Protección pulmonar',
    when: (m, f, p) => m.vtkg > 8 && m.vtkg <= 10 && m.vtMand > 0,
    ico: '⚠️', title: 'Volumen corriente por encima del objetivo protector',
    msg: m => `${round(m.vtkg, 1)} mL/kg PBW. El objetivo es 6–8 mL/kg.`,
    why: 'Por encima de 8 mL/kg aumenta la lesión inducida por el ventilador incluso en pulmones aparentemente sanos.',
    fix: p => `Ajusta el VT a ~${Math.round(p.pbw * 7 / 10) * 10} mL.`
  },
  {
    id: 'vt_bajo', sev: 'warn', cd: 180, tema: 'Ventilación',
    when: (m, f, p) => m.vtkg < 4 && m.vtMand > 0 && m.vm < 5,
    ico: '📉', title: 'Volumen corriente demasiado bajo',
    msg: m => `${round(m.vtkg, 1)} mL/kg PBW con un volumen minuto de ${round(m.vm, 1)} L/min: gran parte de cada respiración se queda en el espacio muerto.`,
    why: 'Si el volumen corriente se acerca al espacio muerto (≈2 mL/kg sólo anatómico), la ventilación alveolar efectiva se hunde y la PaCO₂ sube aunque el volumen minuto parezca razonable.',
    fix: 'Sube el VT a 6 mL/kg PBW, o aumenta la frecuencia si necesitas mantener volúmenes muy bajos.'
  },
  {
    id: 'pplat_alta', sev: 'crit', cd: 100, tema: 'Protección pulmonar',
    when: m => m.pplat > 30,
    ico: '🔺', title: 'Presión meseta por encima de 30 mbar',
    msg: m => `Pmeseta ${round(m.pplat, 0)} mbar (auto-PEEP incluido). Es el mejor reflejo de la presión que soportan los alvéolos.`,
    why: 'La presión meseta es la presión alveolar al final de la inspiración, sin la influencia de la resistencia. Por encima de 30 mbar aumentan el barotrauma, la liberación de mediadores inflamatorios y la mortalidad. Si se mantiene, el pulmón acaba rompiéndose.',
    fix: 'Baja el volumen corriente (o la Pinsp) hasta que la meseta sea ≤ 30. Comprueba también si el auto-PEEP la está inflando.'
  },
  {
    id: 'dp_alta', sev: 'warn', cd: 160, tema: 'Protección pulmonar',
    when: m => m.dp > 15 && m.vtMand > 0,
    ico: '📐', title: 'Presión de distensión (driving pressure) elevada',
    msg: m => `ΔP = ${round(m.dp, 0)} mbar (Pmeseta − PEEP total). El objetivo es ≤ 15 mbar.`,
    why: 'La driving pressure es el volumen corriente normalizado por el tamaño real del pulmón aireado: es la variable que mejor se asocia con la mortalidad. Un ΔP alto indica que ese volumen es demasiado para el pulmón que le queda al paciente.',
    fix: 'Reduce el volumen corriente, o sube la PEEP si eso mejora la distensibilidad (y por tanto baja el ΔP).'
  },
  {
    id: 'pinsp_alta', sev: 'crit', cd: 140, tema: 'Protección pulmonar',
    when: (m, f, p) => MODOS[S.modo].tipo === 'pc' && S.set.pinsp > 35,
    ico: '🔴', title: 'Presión inspiratoria excesiva',
    msg: () => `Pinsp ${S.set.pinsp} mbar. En modos de presión, lo que programas es exactamente lo que recibe el alvéolo.`,
    why: 'Con Pinsp > 35 la sobredistensión es inevitable. Además, si la distensibilidad mejora, el volumen entregado crecerá sin que nadie lo cambie: en presión controlada hay que vigilar el VT resultante.',
    fix: 'Baja la Pinsp hasta obtener 6 mL/kg PBW manteniendo Pinsp ≤ 30 y ΔP ≤ 15.'
  },

  /* ── PEEP y oxigenación ── */
  {
    id: 'zeep', sev: 'warn', cd: 200, tema: 'Oxigenación',
    when: () => S.set.peep < 3 && S.modo !== 'APRV',
    ico: '🕳️', title: 'Ventilación sin PEEP',
    msg: 'Estás ventilando prácticamente sin presión positiva al final de la espiración.',
    why: 'Sin PEEP los alvéolos se colapsan en cada espiración y vuelven a abrirse en cada inspiración: ese ciclo repetido de apertura y cierre (atelectrauma) lesiona el pulmón y empeora la oxigenación. El tubo endotraqueal ya elimina la PEEP fisiológica de la glotis.',
    fix: 'Programa al menos 5 mbar de PEEP salvo indicación expresa en contra.'
  },
  {
    id: 'peep_baja_sdra', sev: 'warn', cd: 200, tema: 'Oxigenación',
    when: (m, f, p) => f.recl > 0.4 && S.set.fio2 >= 60 && m.peepTot < f.peepOpt - 4,
    ico: '🎈', title: 'PEEP insuficiente para la FiO₂ que estás usando',
    msg: (m, f) => `FiO₂ ${S.set.fio2} % con PEEP ${S.set.peep}: este pulmón es reclutable y necesita más PEEP (≈ ${f.peepOpt} mbar).`,
    why: 'Cuando la hipoxemia se debe a shunt (alvéolos colapsados u ocupados), subir la FiO₂ apenas mejora la PaO₂: la sangre sigue pasando por zonas no ventiladas. Lo que corrige el shunt es abrir esos alvéolos con PEEP.',
    fix: 'Sube la PEEP de 2 en 2 según la tabla PEEP/FiO₂ vigilando la presión meseta y la presión arterial; después baja la FiO₂.'
  },
  {
    id: 'peep_excesiva', sev: 'warn', cd: 150, tema: 'Oxigenación',
    when: (m, f) => m.peepTot > f.peepOpt + 6 && m.pplat > 28,
    ico: '🎈', title: 'PEEP excesiva: sobredistensión',
    msg: (m, f) => `PEEP total ${round(m.peepTot, 0)} mbar por encima del punto útil de este pulmón (≈ ${f.peepOpt}).`,
    why: 'Pasado el punto de reclutamiento, más PEEP ya no abre alvéolos: sólo distiende los que ya estaban abiertos, comprime los capilares (aumenta el espacio muerto y la PaCO₂) y reduce el retorno venoso.',
    fix: 'Baja la PEEP mientras la SpO₂ se mantenga; observa si la distensibilidad mejora al bajarla (señal de que sobraba).'
  },
  {
    id: 'fio2_alta', sev: 'warn', cd: 240, tema: 'Oxigenación',
    when: (m, f) => S.set.fio2 > 60 && f.tiempoFiO2alta > 900,
    ico: '☣️', title: 'FiO₂ alta mantenida',
    msg: (m, f) => `Llevas ${Math.round(f.tiempoFiO2alta / 60)} min con FiO₂ > 60 %.`,
    why: 'El oxígeno en concentración alta genera radicales libres, produce atelectasias por reabsorción (al lavar el nitrógeno que mantiene abierto el alvéolo) y con el tiempo daña el epitelio alveolar.',
    fix: 'Sube la PEEP para poder bajar la FiO₂. Objetivo: la FiO₂ más baja que mantenga SpO₂ 94–98 % (88–92 % en el retenedor de CO₂).'
  },
  {
    id: 'hiperoxia', sev: 'info', cd: 300, tema: 'Oxigenación',
    when: (m, f) => f.spo2 >= 99 && S.set.fio2 > 45,
    ico: '💠', title: 'Hiperoxia innecesaria',
    msg: (m, f) => `SpO₂ ${round(f.spo2, 0)} % con FiO₂ ${S.set.fio2} %: estás dando más oxígeno del que el paciente necesita.`,
    why: 'La SpO₂ de 100 % oculta la PaO₂ real (puede ser 100 o 400 mmHg) y la hiperoxia se asocia con vasoconstricción, estrés oxidativo y peor pronóstico neurológico tras la parada cardiaca.',
    fix: 'Baja la FiO₂ de 5 en 5 hasta SpO₂ 94–98 %.'
  },

  /* ── Atrapamiento aéreo ── */
  {
    id: 'autopeep', sev: 'crit', cd: 110, tema: 'Atrapamiento aéreo',
    when: m => m.autoPeep >= 5,
    ico: '🌀', title: 'Auto-PEEP (hiperinsuflación dinámica)',
    msg: m => `Auto-PEEP ${round(m.autoPeep, 1)} mbar. Tiempo espiratorio ${round(m.te, 1)} s frente a una constante de tiempo de ${round(m.tau, 2)} s: el pulmón necesita unos ${round(m.tau * 3, 1)} s para vaciarse.`,
    why: 'El aire que no llega a salir se acumula respiración tras respiración. Sube la presión intratorácica, hunde el retorno venoso (hipotensión), aumenta el trabajo para disparar el ventilador y puede acabar en colapso circulatorio o neumotórax.',
    fix: 'Alarga la espiración: baja la frecuencia, acorta el Tinsp y sube el flujo inspiratorio. Trata el broncoespasmo y aspira secreciones.'
  },
  {
    id: 'fr_alta_obstructivo', sev: 'warn', cd: 180, tema: 'Atrapamiento aéreo',
    when: (m, f, p) => (p.dx === 'epoc' || p.dx === 'asma') && S.set.freq > 16,
    ico: '💨', title: 'Frecuencia alta en paciente obstructivo',
    msg: () => `FR ${S.set.freq}/min en un paciente con obstrucción espiratoria.`,
    why: 'Cada respiración de más roba tiempo espiratorio. En el obstructivo la espiración es lenta: subir la frecuencia para "bajar la PaCO₂" produce el efecto contrario, porque el atrapamiento reduce la ventilación efectiva.',
    fix: 'FR 10–14/min, I:E ≥ 1:3 y tolerar hipercapnia permisiva mientras el pH sea ≥ 7.20.'
  },
  {
    id: 'ie_invertida', sev: 'warn', cd: 200, tema: 'Atrapamiento aéreo',
    when: m => m.ie < 1 && m.fEsp < 5,
    ico: '↔️', title: 'Relación I:E invertida',
    msg: m => `I:E 1:${round(m.ie, 2)} — la inspiración dura más que la espiración.`,
    why: 'La relación invertida sube la presión media y puede mejorar la oxigenación, pero es muy mal tolerada hemodinámicamente y favorece el atrapamiento. Casi nunca es lo que se pretendía: suele ser un Tinsp demasiado largo o una frecuencia demasiado alta.',
    fix: 'Acorta el Tinsp o baja la frecuencia hasta llegar como mínimo a 1:2.'
  },

  /* ── Equilibrio ácido-base ── */
  {
    id: 'acidosis_resp', sev: 'crit', cd: 130, tema: 'Ácido-base',
    when: (m, f) => f.ph < 7.20 && f.paco2 > 55,
    ico: '🧪', title: 'Acidosis respiratoria grave',
    msg: (m, f) => `pH ${round(f.ph, 2)} con PaCO₂ ${round(f.paco2, 0)} mmHg: el paciente está hipoventilado.`,
    why: 'La PaCO₂ depende exclusivamente de la ventilación alveolar. Con pH < 7.20 se deprime la contractilidad cardiaca, aparecen arritmias y disminuye la respuesta a las catecolaminas.',
    fix: 'Aumenta el volumen minuto: sube primero la frecuencia (mantiene el volumen protector) y revisa si hay auto-PEEP o fugas que reduzcan la ventilación efectiva.'
  },
  {
    id: 'alcalosis_resp', sev: 'warn', cd: 140, tema: 'Ácido-base',
    when: (m, f) => f.ph > 7.50 && f.paco2 < 33,
    ico: '🧪', title: 'Alcalosis respiratoria por hiperventilación',
    msg: (m, f) => `pH ${round(f.ph, 2)} con PaCO₂ ${round(f.paco2, 0)} mmHg y VM ${round(m.vm, 1)} L/min.`,
    why: 'La hipocapnia produce vasoconstricción cerebral (riesgo de isquemia), desplaza la curva de la hemoglobina a la izquierda (el O₂ se suelta peor en los tejidos), baja el potasio y el calcio iónico, y favorece arritmias.',
    fix: 'Reduce el volumen minuto bajando la frecuencia. Si el paciente hiperventila por sí mismo, busca la causa: dolor, ansiedad, fiebre, acidosis metabólica o soporte excesivo.'
  },
  {
    id: 'quitar_compensacion', sev: 'crit', cd: 120, tema: 'Ácido-base',
    when: (m, f, p) => DX[p.dx].especial === 'metabolica' && f.hco3 < 16 && f.paco2 > 34,
    ico: '⛔', title: 'Le has quitado la compensación respiratoria',
    msg: (m, f) => `HCO₃⁻ ${round(f.hco3, 1)} mEq/L con PaCO₂ ${round(f.paco2, 0)} mmHg → pH ${round(f.ph, 2)}.`,
    why: 'Este paciente tiene una <b>acidosis metabólica</b> y sobrevive gracias a hiperventilar (respiración de Kussmaul). Si programas una ventilación "normal" de 40 mmHg, eliminas la única compensación que tenía y el pH se desploma. Es un error clásico y potencialmente mortal al intubar a un paciente en cetoacidosis.',
    fix: (p, m, f) => `Iguala o supera su ventilación previa: PaCO₂ objetivo ≈ ${round(1.5 * f.hco3 + 8, 0)} mmHg (fórmula de Winter). Sube el volumen minuto con frecuencia alta y trata la causa metabólica.`
  },
  {
    id: 'hiperventilar_alcalosis', sev: 'warn', cd: 200, tema: 'Ácido-base',
    when: (m, f, p) => p.dx === 'vomito' && f.paco2 < 42 && f.ph > 7.50,
    ico: '🧂', title: 'Hiperventilando una alcalosis metabólica',
    msg: (m, f) => `pH ${round(f.ph, 2)}: la alcalemia empeora porque no dejas que el paciente retenga CO₂.`,
    why: 'En la alcalosis metabólica la compensación fisiológica es hipoventilar. Forzar una PaCO₂ de 40 mmHg suma alcalosis respiratoria a la metabólica.',
    fix: 'Permite PaCO₂ de 45–50 mmHg, repone cloro y potasio, y suspende diuréticos si es posible.'
  },
  {
    id: 'tce_hipocapnia', sev: 'crit', cd: 130, tema: 'Neuroprotección',
    when: (m, f, p) => p.dx === 'tce' && f.paco2 < 30,
    ico: '🧠', title: 'Hipocapnia peligrosa en traumatismo craneal',
    msg: (m, f) => `PaCO₂ ${round(f.paco2, 0)} mmHg. Por debajo de 30 mmHg el riesgo de isquemia cerebral es real.`,
    why: 'La PaCO₂ es el regulador más potente del calibre de los vasos cerebrales. La hipocapnia los contrae: baja la presión intracraneal, sí, pero también el flujo sanguíneo cerebral, y sobre un cerebro ya contusionado eso produce isquemia secundaria.',
    fix: 'Mantén PaCO₂ 35–38 mmHg. La hiperventilación sólo es una medida de rescate transitoria ante signos de herniación.'
  },
  {
    id: 'tce_hipercapnia', sev: 'warn', cd: 150, tema: 'Neuroprotección',
    when: (m, f, p) => p.dx === 'tce' && f.paco2 > 45,
    ico: '🧠', title: 'Hipercapnia en traumatismo craneal',
    msg: (m, f) => `PaCO₂ ${round(f.paco2, 0)} mmHg: vasodilatación cerebral y aumento de la presión intracraneal.`,
    why: 'El CO₂ alto dilata los vasos cerebrales, aumenta el volumen sanguíneo intracraneal y eleva la PIC en un cráneo que ya no tiene margen.',
    fix: 'Sube el volumen minuto hasta PaCO₂ 35–38 mmHg y evita la PEEP muy alta, que dificulta el retorno venoso cerebral.'
  },

  /* ── Oxigenación y hemodinámica ── */
  {
    id: 'hipoxemia_grave', sev: 'crit', cd: 60, tema: 'Oxigenación',
    when: (m, f) => f.spo2 < 85,
    ico: '🩸', title: 'Hipoxemia grave',
    msg: (m, f) => `SpO₂ ${round(f.spo2, 0)} % · PaO₂/FiO₂ ${round(m.pf, 0)}.`,
    why: 'Por debajo de una SpO₂ de 85 % la entrega de oxígeno a los tejidos cae rápidamente: aparece acidosis láctica y, si persiste, bradicardia y parada cardiaca hipóxica.',
    fix: 'Comprueba primero lo reversible (desconexión, secreciones, neumotórax, intubación selectiva). Después sube FiO₂ y optimiza la PEEP.'
  },
  {
    id: 'hipotension_peep', sev: 'crit', cd: 120, tema: 'Hemodinámica',
    when: (m, f) => f.map < 60 && m.pmedia > 13,
    ico: '💔', title: 'Hipotensión por presión intratorácica alta',
    msg: (m, f) => `PAM ${round(f.map, 0)} mmHg con presión media en vía aérea ${round(m.pmedia, 0)} mbar.`,
    why: 'El corazón se llena gracias a un gradiente de presión muy pequeño. Al elevar la presión dentro del tórax (PEEP alta, auto-PEEP, I:E invertida) se comprime la vena cava, baja el retorno venoso y con él el gasto cardiaco. En un paciente hipovolémico el efecto es inmediato.',
    fix: 'Baja la PEEP y el auto-PEEP, reduce la presión media, aporta volumen si hay hipovolemia y valora vasopresores.'
  },
  {
    id: 'shock_peep_alta', sev: 'warn', cd: 200, tema: 'Hemodinámica',
    when: (m, f, p) => (p.hemo === 'shock' || p.hemo === 'hipovolemico') && S.set.peep > 10,
    ico: '🫀', title: 'PEEP alta en paciente hemodinámicamente inestable',
    msg: () => `PEEP ${S.set.peep} mbar en un paciente hipovolémico o en shock.`,
    why: 'La tolerancia a la PEEP depende de la volemia. Con precarga baja, cada mbar de PEEP se traduce directamente en caída del gasto cardiaco.',
    fix: 'Optimiza primero la volemia y los vasopresores; después sube la PEEP en escalones pequeños vigilando la PAM.'
  },

  /* ── Sincronía y destete ── */
  {
    id: 'autodisparo', sev: 'warn', cd: 180, tema: 'Sincronía',
    when: (m, f) => f.autoTrig > 1.5,
    ico: '👻', title: 'Autodisparo del ventilador',
    msg: () => `Trigger ${S.set.trig} L/min: demasiado sensible. El equipo está entregando respiraciones que el paciente no ha pedido.`,
    why: 'Con un trigger excesivamente sensible, el agua condensada del circuito, una fuga o el propio latido cardiaco bastan para disparar una respiración. El resultado es hiperventilación, alcalosis y una frecuencia registrada falsamente alta.',
    fix: 'Sube el trigger a 2–3 L/min y purga el agua del circuito.'
  },
  {
    id: 'esfuerzos_inefectivos', sev: 'warn', cd: 180, tema: 'Sincronía',
    when: (m, f) => f.esfInef > 0.25,
    ico: '😮‍💨', title: 'Esfuerzos inspiratorios inefectivos',
    msg: () => `Trigger ${S.set.trig} L/min: el paciente se esfuerza y el ventilador no responde.`,
    why: 'Un trigger poco sensible obliga al paciente a generar una depresión mucho mayor para abrir la válvula. Se agota, aumenta el consumo de oxígeno y aparece asincronía. El auto-PEEP produce el mismo fenómeno, porque el paciente tiene que vencerlo antes de poder disparar.',
    fix: 'Baja el trigger a 1.5–3 L/min y corrige el auto-PEEP si existe.'
  },
  {
    id: 'asb_insuficiente', sev: 'warn', cd: 200, tema: 'Sincronía',
    when: (m, f) => m.fEsp > 30 && m.rsbi > 105 && MODOS[S.modo].espont,
    ico: '🥵', title: 'Respiración rápida y superficial: soporte insuficiente',
    msg: m => `Frecuencia espontánea ${round(m.fEsp, 0)}/min con VT ${round(m.vtEsp, 0)} mL → índice de respiración rápida superficial ${round(m.rsbi, 0)} (fracaso probable si > 105).`,
    why: 'Cuando el soporte no cubre la demanda, el paciente compensa respirando más deprisa y más superficialmente. Eso aumenta la proporción de espacio muerto, empeora la PaCO₂ y agota el diafragma en pocas horas.',
    fix: 'Sube el ASB en escalones de 2 mbar hasta que la frecuencia espontánea baje de 30 y el VT alcance 6–8 mL/kg. Descarta dolor, fiebre y acidosis.'
  },
  {
    id: 'sobreasistencia', sev: 'info', cd: 260, tema: 'Sincronía',
    when: (m, f) => S.asbOn && S.set.asb > 20 && m.vtkg > 9 && m.fEsp > 2,
    ico: '🛋️', title: 'Sobreasistencia con presión de soporte',
    msg: () => `ASB ${S.set.asb} mbar: el ventilador hace casi todo el trabajo.`,
    why: 'El exceso de soporte produce volúmenes altos, alcalosis respiratoria, apneas centrales y atrofia diafragmática por desuso, que después alarga el destete.',
    fix: 'Baja el ASB progresivamente manteniendo una frecuencia espontánea de 15–25/min y VT de 6–8 mL/kg.'
  },
  {
    id: 'apnea_riesgo', sev: 'crit', cd: 100, tema: 'Seguridad',
    when: (m, f) => S.modo === 'CPAP' && m.fEsp < 5,
    ico: '⏸️', title: 'Modo espontáneo sin impulso respiratorio',
    msg: m => `Frecuencia espontánea ${round(m.fEsp, 0)}/min en CPAP: el paciente prácticamente no respira.`,
    why: 'En CPAP/ASB todas las respiraciones dependen del paciente. Con sedación profunda, relajantes musculares o depresión del centro respiratorio, el paciente entra en apnea y sólo lo detecta la ventilación de respaldo.',
    fix: 'Cambia a un modo con respiraciones mandatorias (BIPAP o SIMV) o aligera la sedación. Comprueba el tiempo de apnea programado.'
  },

  /* ── Alarmas y seguridad ── */
  {
    id: 'alarma_desactivada', sev: 'crit', cd: 240, tema: 'Seguridad',
    when: () => !S.alOn.mvLo || !S.alOn.pawHi,
    ico: '🔕', title: 'Alarma de seguridad desactivada',
    msg: () => 'Has apagado una alarma vital (presión máxima o volumen minuto bajo).',
    why: 'La alarma de volumen minuto bajo es la que detecta una desconexión o una apnea; la de presión máxima detecta obstrucción y neumotórax. Sin ellas el ventilador deja de ser un dispositivo de seguridad. Silenciar temporalmente es aceptable; desactivar, no.',
    fix: 'Vuelve a activarlas ahora mismo y ajusta los límites a un ±30 % de los valores actuales del paciente.'
  },
  {
    id: 'alarma_abierta', sev: 'warn', cd: 240, tema: 'Seguridad',
    when: () => S.alOn.pawHi && S.al.pawHi > 50,
    ico: '🔧', title: 'Límite de presión abierto de más',
    msg: () => `Alarma de presión máxima en ${S.al.pawHi} mbar.`,
    why: 'Subir el límite hasta que la alarma calle es tratar el síntoma y no la causa. La alarma estaba avisando de secreciones, broncoespasmo, un tubo acodado o una caída de la distensibilidad.',
    fix: 'Devuelve el límite a unos 10 mbar por encima de la presión pico habitual del paciente y busca la causa real.'
  },
  {
    id: 'limitando_volumen', sev: 'warn', cd: 150, tema: 'Ventilación',
    when: (m, f) => f.limitado,
    ico: '✂️', title: 'El límite de presión está recortando el volumen',
    msg: m => `El equipo alcanza Pmax antes de entregar el volumen programado: sólo llegan ${round(m.vtEntregado, 0)} mL.`,
    why: 'Pmax limita el flujo cuando se alcanza la presión. El paciente recibe menos volumen del programado, baja el volumen minuto y sube la PaCO₂ sin que el número de la pantalla de ajuste lo refleje.',
    fix: 'Comprueba siempre el VT <b>espirado</b>. Corrige la causa (resistencia o distensibilidad) o considera AutoFlow / modo de presión.'
  },

  /* ── Refuerzo positivo ── */
  {
    id: 'ok_protectora', sev: 'ok', cd: 420, tema: 'Buenas prácticas',
    when: (m, f, p) => m.vtkg >= 5.5 && m.vtkg <= 8 && m.pplat <= 30 && m.dp <= 15 && S.set.peep >= 5 && m.vtMand > 0,
    ico: '🏆', title: 'Ventilación protectora correcta',
    msg: m => `VT ${round(m.vtkg, 1)} mL/kg PBW · Pmeseta ${round(m.pplat, 0)} · ΔP ${round(m.dp, 0)} · PEEP ${S.set.peep}.`,
    why: 'Has cumplido a la vez los tres criterios que reducen la mortalidad: volumen bajo, presión meseta ≤ 30 y driving pressure ≤ 15.',
    fix: 'Mantén esta programación y ajusta la FiO₂ a la mínima necesaria.'
  },
  {
    id: 'ok_oxigenacion', sev: 'ok', cd: 420, tema: 'Buenas prácticas',
    when: (m, f) => f.spo2 >= 92 && f.spo2 <= 97 && S.set.fio2 <= 50 && f.ph >= 7.30 && f.ph <= 7.45,
    ico: '✅', title: 'Objetivos de oxigenación y pH alcanzados',
    msg: (m, f) => `SpO₂ ${round(f.spo2, 0)} % con FiO₂ ${S.set.fio2} % y pH ${round(f.ph, 2)}.`,
    why: 'Estás consiguiendo los objetivos con la mínima agresión posible: ésa es la meta de la ventilación mecánica.',
    fix: 'Valora ya el destete: prueba de ventilación espontánea si la causa está resuelta.'
  },
  {
    id: 'listo_destete', sev: 'ok', cd: 600, tema: 'Destete',
    when: (m, f, p) => m.rsbi < 105 && f.spo2 >= 92 && S.set.fio2 <= 40 && S.set.peep <= 8 && f.ph >= 7.32 && m.fEsp > 6 && f.map > 65,
    ico: '🎓', title: 'El paciente cumple criterios de destete',
    msg: m => `Índice de respiración rápida superficial ${round(m.rsbi, 0)} (< 105), FiO₂ ≤ 40 %, PEEP ≤ 8 y hemodinámica estable.`,
    why: 'Estos son los criterios clásicos para intentar una prueba de ventilación espontánea. Prolongar la ventilación sin necesidad añade neumonía asociada, debilidad y días de UCI.',
    fix: 'Realiza una prueba de ventilación espontánea en CPAP/ASB con 5–8 mbar durante 30 minutos.'
  }
];

/* ─────────── Evaluación de reglas ─────────── */
function evaluarReglas() {
  if (!S.corriendo || !S.fis) return;
  const m = S.med, f = S.fis, p = S.pt;
  for (const r of REGLAS) {
    let activa = false;
    try { activa = !!r.when(m, f, p); } catch (e) { activa = false; }
    const ult = S.disparadas[r.id] || -1e9;
    if (activa && S.t - ult > r.cd) {
      S.disparadas[r.id] = S.t;
      const res = v => (typeof v === 'function' ? v(m, f, p) : v);
      const fixv = typeof r.fix === 'function' ? r.fix(p, m, f) : r.fix;
      notificar({
        sev: r.sev, ico: r.ico, k: colorSev(r.sev),
        title: r.title, msg: res(r.msg), why: r.why, fix: fixv, tema: r.tema
      }, r.id);
      if (r.sev === 'crit' || r.sev === 'warn') registrarError(r.id, r.sev, r.title, r.tema);
      else if (r.sev === 'ok') S.aciertos[r.id] = { n: (S.aciertos[r.id]?.n || 0) + 1, title: r.title };
    }
  }
}
const colorSev = s => s === 'crit' ? 'var(--crit)' : s === 'warn' ? 'var(--warn)' : s === 'ok' ? 'var(--ok)' : 'var(--cian)';

function registrarError(id, sev, title, tema) {
  const e = S.errores[id] || { n: 0, sev, title, tema: tema || 'General' };
  e.n++; e.sev = sev; e.title = title; S.errores[id] = e;
}

/* ══════════════════════════════════════════════════════════════
   CURVAS EN TIEMPO REAL
══════════════════════════════════════════════════════════════ */
const W = {
  N: 300, i: 0, paw: [], flow: [], vol: [],
  fase: 0, ciclo: 0, pvP: [], pvV: [], pvPrev: [[], []],
  fvF: [], fvV: [], fvPrev: [[], []],
  ctx: {}, dpr: 1, ultimo: 0
};
function initCurvas() {
  W.paw = new Array(W.N).fill(null);
  W.flow = new Array(W.N).fill(null);
  W.vol = new Array(W.N).fill(null);
  W.i = 0; W.fase = 0;
  ['cv-paw', 'cv-flow', 'cv-vol', 'cv-pv', 'cv-fv', 'cv-trend'].forEach(id => {
    const c = document.getElementById(id); if (!c) return;
    W.ctx[id] = c.getContext('2d');
  });
  redimensionarCurvas();
}
function redimensionarCurvas() {
  W.dpr = Math.min(2, window.devicePixelRatio || 1);
  Object.keys(W.ctx).forEach(id => {
    const c = document.getElementById(id); if (!c) return;
    const r = c.getBoundingClientRect();
    if (r.width < 2) return;
    c.width = Math.round(r.width * W.dpr);
    c.height = Math.round(r.height * W.dpr);
  });
}

/** Valores instantáneos de presión, flujo y volumen dentro del ciclo */
function muestraCiclo(t) {
  const m = S.med, f = S.fis, st = S.set;
  const M = MODOS[S.modo];
  const peep = m.peepTot;
  const ti = m.ti, tTot = m.tTot, tau = m.tau;
  let paw = peep, flow = 0, vol = 0;

  if (f.desconectado) return { paw: 0, flow: 0, vol: 0 };

  if (M.tipo === 'sp' || (m.freq === 0 && m.fEsp > 0)) {
    // Respiración espontánea con soporte
    const per = 60 / Math.max(6, m.fTot);
    const ph = (t % per) / per;
    const tiE = 0.36;
    if (ph < tiE) {
      const x = ph / tiE;
      paw = peep + (st.asb || 0) * Math.sin(Math.PI * Math.min(1, x * 1.25)) - 1.4 * Math.sin(Math.PI * x);
      flow = (m.vtEsp / 1000) * 60 / (per * tiE) * Math.exp(-x * 1.6) * 1.7;
      vol = m.vtEsp * (1 - Math.exp(-x * 2.6));
    } else {
      const x = (ph - tiE) / (1 - tiE);
      const te = per * (1 - tiE);
      paw = peep + 1.2 * Math.exp(-x * 3);
      vol = m.vtEsp * Math.exp(-x * te / Math.max(0.15, tau));
      flow = -(vol / Math.max(0.05, tau)) / 1000 * 60;
    }
    return { paw, flow, vol };
  }

  const ph = t % tTot;
  if (ph < ti) {
    if (M.tipo === 'vc' && !S.autoflow) {
      const flujoLs = st.flow / 60;
      const tFlujo = Math.min(ti, (m.vtMand / 1000) / Math.max(0.01, flujoLs));
      if (ph < tFlujo) {
        vol = flujoLs * ph * 1000;
        flow = st.flow;
        paw = peep + vol / f.crs + flujoLs * f.raw;
      } else {
        vol = m.vtMand; flow = 0; paw = peep + m.vtMand / f.crs;
      }
    } else {
      const pObj = (S.modo === 'APRV' ? st.phigh : (M.tipo === 'pc' ? st.pinsp : peep + m.vtMand / f.crs));
      const dp = Math.max(0, pObj - peep);
      const ramp = Math.max(0.02, st.rampa || 0.1);
      const subida = Math.min(1, ph / ramp);
      paw = peep + dp * subida;
      vol = dp * f.crs * (1 - Math.exp(-ph / tau)) * subida;
      flow = (dp / f.raw) * Math.exp(-ph / tau) * 60 * subida;
    }
  } else {
    const x = ph - ti;
    const v0 = m.vtEntregado;
    vol = v0 * Math.exp(-x / tau);
    flow = -(vol / 1000 / tau) * 60;
    paw = peep + (v0 / f.crs) * Math.exp(-x / tau) * 0.22;
    if (paw < peep) paw = peep;
  }
  // Esfuerzos espontáneos superpuestos entre ciclos mandatorios
  if (m.fEsp > 1 && M.espont) {
    const osc = Math.sin(t * 2 * Math.PI * (m.fEsp / 60));
    paw -= Math.max(0, osc) * 1.1;
    flow += osc * 2.2;
  }
  return { paw, flow, vol };
}

function pasoCurvas(dtReal) {
  if (S.congelado || !S.corriendo) return;
  const paso = 0.028;                        // s de señal por muestra
  const n = Math.max(1, Math.round(dtReal / paso));
  for (let k = 0; k < n; k++) {
    W.fase += paso;
    const s = muestraCiclo(W.fase);
    const ruido = (Math.random() - 0.5) * 0.35;
    W.paw[W.i] = s.paw + ruido;
    W.flow[W.i] = s.flow + ruido * 1.4;
    W.vol[W.i] = Math.max(0, s.vol);
    W.pvP.push(s.paw); W.pvV.push(Math.max(0, s.vol));
    W.fvF.push(s.flow); W.fvV.push(Math.max(0, s.vol));
    if (W.pvP.length > 400) { W.pvP.shift(); W.pvV.shift(); W.fvF.shift(); W.fvV.shift(); }
    W.i = (W.i + 1) % W.N;
    if (W.i === 0) {
      W.pvPrev = [W.pvP.slice(), W.pvV.slice()];
      W.fvPrev = [W.fvF.slice(), W.fvV.slice()];
      W.pvP = []; W.pvV = []; W.fvF = []; W.fvV = [];
    }
  }
}

function ejeColor() { return getComputedStyle(document.documentElement).getPropertyValue('--scr-grid').trim() || '#16202f'; }
function cssVar(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function dibujarTraza(id, datos, color, etiqueta, min, max, cero) {
  const cv = document.getElementById(id), ctx = W.ctx[id];
  if (!cv || !ctx || cv.width < 4) return;
  const w = cv.width, h = cv.height, d = W.dpr;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = cssVar('--scr-bg'); ctx.fillRect(0, 0, w, h);

  // rejilla
  ctx.strokeStyle = ejeColor(); ctx.lineWidth = 1 * d;
  ctx.beginPath();
  for (let i = 1; i < 5; i++) { const y = h * i / 5; ctx.moveTo(0, y); ctx.lineTo(w, y); }
  for (let i = 1; i < 8; i++) { const x = w * i / 8; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
  ctx.stroke();

  const y = v => h - ((v - min) / (max - min)) * h;
  if (cero !== undefined) {
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1 * d;
    ctx.beginPath(); ctx.moveTo(0, y(cero)); ctx.lineTo(w, y(cero)); ctx.stroke();
  }

  ctx.strokeStyle = color; ctx.lineWidth = 1.9 * d; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  let arr = false;
  for (let i = 0; i < W.N; i++) {
    const v = datos[i];
    const px = (i / (W.N - 1)) * w;
    if (v === null || v === undefined) { arr = false; continue; }
    const py = clamp(y(v), 1, h - 1);
    if (!arr) { ctx.moveTo(px, py); arr = true; } else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // barra de barrido
  const bx = (W.i / (W.N - 1)) * w;
  ctx.fillStyle = cssVar('--scr-bg');
  ctx.fillRect(bx, 0, 10 * d, h);

  // etiqueta
  ctx.fillStyle = color; ctx.font = `${10 * d}px ui-monospace, monospace`;
  ctx.fillText(etiqueta, 6 * d, 13 * d);
  ctx.fillStyle = 'rgba(160,180,200,.55)'; ctx.font = `${8.5 * d}px ui-monospace, monospace`;
  ctx.fillText(String(Math.round(max)), w - 24 * d, 11 * d);
  ctx.fillText(String(Math.round(min)), w - 24 * d, h - 4 * d);
}

function dibujarBucle(id, xs, ys, prevX, prevY, color, ejeX, ejeY, xmin, xmax, ymin, ymax) {
  const cv = document.getElementById(id), ctx = W.ctx[id];
  if (!cv || !ctx || cv.width < 4) return;
  const w = cv.width, h = cv.height, d = W.dpr;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = cssVar('--scr-bg'); ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = ejeColor(); ctx.lineWidth = 1 * d;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) { ctx.moveTo(0, h * i / 4); ctx.lineTo(w, h * i / 4); ctx.moveTo(w * i / 4, 0); ctx.lineTo(w * i / 4, h); }
  ctx.stroke();
  const X = v => ((v - xmin) / (xmax - xmin)) * (w - 26 * d) + 20 * d;
  const Y = v => h - 16 * d - ((v - ymin) / (ymax - ymin)) * (h - 26 * d);
  const traza = (ax, ay, col, lw) => {
    if (!ax || ax.length < 3) return;
    ctx.strokeStyle = col; ctx.lineWidth = lw * d; ctx.beginPath();
    for (let i = 0; i < ax.length; i++) {
      const px = clamp(X(ax[i]), 0, w), py = clamp(Y(ay[i]), 0, h);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  };
  traza(prevX, prevY, 'rgba(140,160,185,.30)', 1.4);
  traza(xs, ys, color, 1.9);
  ctx.fillStyle = 'rgba(170,190,210,.75)'; ctx.font = `${9 * d}px ui-monospace, monospace`;
  ctx.fillText(ejeX, w - 42 * d, h - 4 * d);
  ctx.save(); ctx.translate(9 * d, 16 * d); ctx.rotate(0);
  ctx.fillText(ejeY, 0, 0); ctx.restore();
}

function dibujarTendencia() {
  const id = 'cv-trend', cv = document.getElementById(id), ctx = W.ctx[id];
  if (!cv || !ctx || cv.width < 4) return;
  const w = cv.width, h = cv.height, d = W.dpr;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = cssVar('--scr-bg'); ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = ejeColor(); ctx.lineWidth = 1 * d; ctx.beginPath();
  for (let i = 1; i < 5; i++) { ctx.moveTo(0, h * i / 5); ctx.lineTo(w, h * i / 5); }
  for (let i = 1; i < 7; i++) { ctx.moveTo(w * i / 7, 0); ctx.lineTo(w * i / 7, h); }
  ctx.stroke();
  const T = S.trend; if (T.length < 2) {
    ctx.fillStyle = 'rgba(150,170,195,.6)'; ctx.font = `${11 * d}px system-ui`;
    ctx.fillText('Recogiendo datos de tendencia…', 12 * d, h / 2);
    return;
  }
  const series = [
    { key: 'spo2', c: cssVar('--cian'), min: 60, max: 100 },
    { key: 'paco2', c: cssVar('--oro'), min: 10, max: 100 },
    { key: 'ph10', c: cssVar('--rojo'), min: 68, max: 78 },
    { key: 'pplat', c: cssVar('--verde'), min: 0, max: 50 }
  ];
  series.forEach(s => {
    ctx.strokeStyle = s.c; ctx.lineWidth = 1.8 * d; ctx.beginPath();
    T.forEach((p, i) => {
      const x = (i / Math.max(1, T.length - 1)) * w;
      const y = h - ((clamp(p[s.key], s.min, s.max) - s.min) / (s.max - s.min)) * (h - 8 * d) - 4 * d;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  });
}

function pintarCurvas() {
  // Con la pantalla plegada no hay nada que dibujar: ahorra batería
  const scr = document.getElementById('vent-screen');
  if (scr && scr.classList.contains('closed')) return;
  const vis = id => { const e = document.getElementById(id); return e && !e.hasAttribute('hidden'); };
  if (vis('wave-curvas')) {
    const pmax = Math.max(35, Math.ceil((S.med.ppico + 8) / 10) * 10);
    dibujarTraza('cv-paw', W.paw, cssVar('--oro'), 'Paw  mbar', -5, pmax, 0);
    const fmax = Math.max(40, Math.ceil((S.set.flow + 15) / 10) * 10);
    dibujarTraza('cv-flow', W.flow, cssVar('--cian'), 'Flujo  L/min', -fmax, fmax, 0);
    const vmax = Math.max(300, Math.ceil((S.med.vtEntregado * 1.35) / 100) * 100);
    dibujarTraza('cv-vol', W.vol, cssVar('--verde'), 'Volumen  mL', 0, vmax, 0);
  } else if (vis('wave-bucles')) {
    const pmax = Math.max(35, S.med.ppico + 8);
    const vmax = Math.max(300, S.med.vtEntregado * 1.3);
    dibujarBucle('cv-pv', W.pvP, W.pvV, W.pvPrev[0], W.pvPrev[1], cssVar('--oro'), 'Paw', 'Vol', -3, pmax, 0, vmax);
    dibujarBucle('cv-fv', W.fvV, W.fvF, W.fvPrev[1], W.fvPrev[0], cssVar('--cian'), 'Vol', 'Flujo', 0, vmax, -80, 80);
  } else if (vis('wave-tendencia')) {
    dibujarTendencia();
  }
}

/* ══════════════════════════════════════════════════════════════
   Parte 4/4 · INTERFAZ, CASOS, GUÍA, EVALUACIÓN Y ARRANQUE
══════════════════════════════════════════════════════════════ */

/* ─────────── Notificaciones educativas ─────────── */
let toastSeq = 0;
function notificar(o, id) {
  const cont = $('#toasts'); if (!cont) return;
  const el = document.createElement('div');
  el.className = 'toast'; el.style.setProperty('--k', o.k || colorSev(o.sev));
  el.innerHTML = `
    <div class="t-head">
      <span class="t-ico">${o.ico || 'ℹ️'}</span>
      <span class="t-title">${o.title}</span>
      <button class="t-x" aria-label="Cerrar">✕</button>
    </div>
    <div class="t-body">${o.msg || ''}</div>
    ${o.why ? `<details class="t-why"><summary>¿Por qué ocurre?</summary><p>${o.why}</p></details>` : ''}
    ${o.fix ? `<div class="t-fix">✔ ${o.fix}</div>` : ''}`;
  $('.t-x', el).onclick = () => cerrarToast(el);
  cont.appendChild(el);
  const vivos = $$('.toast:not(.out)', cont);
  if (vivos.length > 2) vivos.slice(0, vivos.length - 2).forEach(cerrarToast);
  const dur = o.sev === 'crit' ? 20000 : o.sev === 'warn' ? 14000 : 9000;
  setTimeout(() => cerrarToast(el), dur);
  if (o.sev === 'crit') { vibrar([90, 60, 90]); pitido(880, 0.18); }
  else if (o.sev === 'warn') { vibrar(60); pitido(600, 0.12); }
  else if (o.sev === 'ok') pitido(1180, 0.10);
  añadirLog(o, id);
}
function cerrarToast(el) {
  if (!el || el.classList.contains('out')) return;
  el.classList.add('out'); setTimeout(() => el.remove(), 300);
}
function añadirLog(o, id) {
  S.log.push({ t: S.t, sev: o.sev, ico: o.ico, title: o.title, msg: o.msg, why: o.why, fix: o.fix, id });
  const b = $('#badge-log');
  if (b) { b.hidden = false; b.textContent = S.log.length; }
  if ($('#pane-registro')?.classList.contains('active')) pintarLog();
}
function pintarLog() {
  const c = $('#log-list'); if (!c) return;
  if (!S.log.length) { c.innerHTML = '<p class="log-empty">Todavía no hay eventos. Empieza a ajustar el ventilador.</p>'; return; }
  c.innerHTML = S.log.slice().reverse().map(l => `
    <div class="log-item" style="--k:${colorSev(l.sev)}">
      <span class="log-t">${mmss(l.t)}</span>
      <div class="log-b">
        <b>${l.ico || ''} ${l.title}</b>
        <p>${l.msg || ''}${l.fix ? `<br><span style="color:var(--ok)">✔ ${l.fix}</span>` : ''}</p>
      </div>
    </div>`).join('');
}

/* ─────────── Sonido ─────────── */
let AC = null;
function pitido(hz, dur) {
  if (!CFG.sonido || S.mute > S.t) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.11, AC.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur + 0.02);
  } catch (e) {}
}

/* ─────────── Navegación entre pantallas ─────────── */
function ir(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = $('#scr-' + id); if (el) el.classList.add('active');
  if (id === 'vent') setTimeout(redimensionarCurvas, 60);
  if (id === 'casos') pintarCasos();
  if (id === 'guia') pintarGuia();
  if (id === 'progreso') pintarProgreso();
  window.scrollTo(0, 0);
}

/* ─────────── Modal genérico ─────────── */
function modal(title, html, okTxt) {
  $('#modal-title').innerHTML = title;
  $('#modal-body').innerHTML = html;
  $('#modal-ok').textContent = okTxt || 'Entendido';
  $('#modal').hidden = false;
}
const cerrarModal = () => { $('#modal').hidden = true; };

/* ══════════════════════════════════════════════════════════════
   PANTALLA DE PACIENTE
══════════════════════════════════════════════════════════════ */
function initFormPaciente() {
  const sel = $('#p-dx');
  const grupos = {};
  Object.entries(DX).forEach(([k, v]) => { (grupos[v.grupo] = grupos[v.grupo] || []).push([k, v]); });
  sel.innerHTML = Object.entries(grupos).map(([g, arr]) =>
    `<optgroup label="${g}">${arr.map(([k, v]) => `<option value="${k}">${v.ico} ${v.n}</option>`).join('')}</optgroup>`
  ).join('');
  sel.value = 'sdra';
  ['p-talla', 'p-sexo', 'p-peso', 'p-edad', 'p-temp'].forEach(i => $('#' + i).addEventListener('input', actualizarPBW));
  sel.addEventListener('change', () => { pintarDxInfo(); cargarGasoDx(); });
  $('#p-gravedad').addEventListener('change', cargarGasoDx);
  $('#btn-gaso-auto').addEventListener('click', () => { cargarGasoDx(); vibrar(30); });
  ['g-ph', 'g-paco2', 'g-hco3', 'g-pao2', 'g-fio2', 'g-na', 'g-cl', 'g-alb'].forEach(i =>
    $('#' + i).addEventListener('input', pintarAcidBase));
  $('#btn-autollenar').addEventListener('click', autollenar);
  actualizarPBW(); pintarDxInfo(); cargarGasoDx();
}
function actualizarPBW() {
  const talla = num('#p-talla', 170), sexo = $('#p-sexo').value;
  const pbw = calcPBW(talla, sexo);
  $('#out-pbw').textContent = round(pbw, 1) + ' kg';
  $('#out-vt6').textContent = Math.round(pbw * 6) + ' mL';
  $('#out-vtrange').textContent = Math.round(pbw * 4) + '–' + Math.round(pbw * 8);
}
function pintarDxInfo() {
  const d = DX[$('#p-dx').value];
  $('#dx-info').innerHTML = `<b>${d.ico} ${d.n}</b><br>${d.desc}
    <div class="kv">
      <span>Crs ${d.crs} mL/cmH₂O</span><span>Raw ${d.raw}</span>
      <span>Shunt ${Math.round(d.shunt * 100)} %</span><span>Vd/Vt ${d.vdvt}</span>
      <span>PEEP útil ≈ ${d.peepOpt}</span>
    </div>
    <div style="margin-top:9px;padding-top:9px;border-top:1px solid var(--line)"><b>Objetivo terapéutico:</b> ${d.meta}</div>`;
}
function cargarGasoDx() {
  const k = $('#p-dx').value, d = DX[k], g = d.gaso;
  const sev = $('#p-gravedad').value;
  const f = sev === 'severo' ? 1 : sev === 'leve' ? -1 : 0;
  const set = (id, v) => { const e = $('#' + id); if (e) e.value = v; };
  const ph = clamp(g.ph - f * 0.05 * (g.ph < 7.4 ? 1 : -1), 6.8, 7.75);
  set('g-ph', round(ph, 2));
  set('g-paco2', round(g.paco2 * (1 + f * (g.paco2 > 40 ? 0.14 : -0.10)), 0));
  set('g-pao2', round(clamp(g.pao2 - f * 12, 25, 500), 0));
  set('g-hco3', round(g.hco3 - f * (g.hco3 < 24 ? 2.5 : -2), 1));
  set('g-sao2', round(clamp(g.sao2 - f * 4, 40, 100), 0));
  set('g-fio2', g.fio2); set('g-lac', round(clamp(g.lac + f * 0.9, 0.4, 18), 1));
  set('g-na', g.na || 140); set('g-k', g.k || 4.0); set('g-cl', g.cl || 103);
  set('g-glu', g.glu || 100); set('g-cr', g.cr || 0.9); set('g-hb', 13.5); set('g-alb', 4.0);
  const be = calcBE(num('#g-hco3', 24), num('#g-ph', 7.4));
  set('g-be', round(be, 1));
  pintarAcidBase();
}
function pintarAcidBase() {
  const g = {
    ph: num('#g-ph', 7.4), paco2: num('#g-paco2', 40), hco3: num('#g-hco3', 24),
    pao2: num('#g-pao2', 90), pf: Math.round(num('#g-pao2', 90) / (num('#g-fio2', 21) / 100)),
    agCorr: round(num('#g-na', 140) - (num('#g-cl', 103) + num('#g-hco3', 24)) + 2.5 * (4 - num('#g-alb', 4)), 1)
  };
  const r = interpretarAB(g);
  $('#acidbase-box').innerHTML = `
    <div class="ab-card" style="--k:${r.k}">
      <h4>🔬 ${r.nom}</h4>
      <p>${r.det.join('<br>')}</p>
      <div class="ab-tags">
        <i>pH ${round(g.ph, 2)}</i><i>PaCO₂ ${round(g.paco2, 0)}</i><i>HCO₃⁻ ${round(g.hco3, 1)}</i>
        <i>EB ${round(calcBE(g.hco3, g.ph), 1)}</i><i>AG corr ${g.agCorr}</i><i>P/F ${g.pf}</i>
      </div>
    </div>`;
}
function autollenar() {
  const nombres = ['Paciente A', 'Paciente B', 'Sr. R. M.', 'Sra. L. T.', 'Paciente cama 4'];
  $('#p-nombre').value = nombres[Math.floor(Math.random() * nombres.length)];
  $('#p-edad').value = 30 + Math.floor(Math.random() * 50);
  $('#p-talla').value = 155 + Math.floor(Math.random() * 35);
  $('#p-peso').value = 55 + Math.floor(Math.random() * 45);
  $('#p-sexo').value = Math.random() < 0.5 ? 'M' : 'F';
  actualizarPBW(); cargarGasoDx();
  notificar({ sev: 'info', ico: '✨', k: 'var(--cian)', title: 'Datos de ejemplo cargados',
    msg: 'Puedes modificar cualquier valor antes de conectar al ventilador.', why: '', fix: '' });
}

/* ─────────── Crear el paciente y arrancar ─────────── */
function iniciarSimulacion(preset) {
  const dx = preset?.dx || $('#p-dx').value;
  const pt = {
    nombre: (preset?.nombre || $('#p-nombre').value || 'Paciente sin nombre'),
    edad: preset?.edad || num('#p-edad', 55), sexo: preset?.sexo || $('#p-sexo').value,
    talla: preset?.talla || num('#p-talla', 170), peso: preset?.peso || num('#p-peso', 75),
    temp: preset?.temp || num('#p-temp', 37), dx,
    gravedad: preset?.gravedad || $('#p-gravedad').value,
    hemo: preset?.hemo || $('#p-hemo').value,
    sedacion: preset?.sedacion || $('#p-sedacion').value,
    bnm: preset?.bnm || $('#p-bnm').value,
    na: num('#g-na', 140), k: num('#g-k', 4), cl: num('#g-cl', 103),
    alb: num('#g-alb', 4), cr: num('#g-cr', 0.9), glu: num('#g-glu', 100), hb: num('#g-hb', 13.5),
    gaso: {
      ph: num('#g-ph', 7.4), paco2: num('#g-paco2', 40), pao2: num('#g-pao2', 90),
      hco3: num('#g-hco3', 24), sao2: num('#g-sao2', 95), lac: num('#g-lac', 1.2), hb: num('#g-hb', 13.5)
    }
  };
  pt.pbw = calcPBW(pt.talla, pt.sexo);
  S.pt = pt;
  S.fis = crearFisiologia(pt);
  S.set = ajustesFabrica(pt.pbw);
  S.al = {}; S.alOn = {};
  Object.entries(ALARMAS).forEach(([k, a]) => { S.al[k] = a.def; S.alOn[k] = true; });
  S.al.pawHi = 40; S.al.vtiHi = Math.round(pt.pbw * 12 / 50) * 50;
  S.modo = 'IPPV'; S.autoflow = false; S.asbOn = false;
  S.t = 0; S.log = []; S.errores = {}; S.aciertos = {}; S.disparadas = {}; S.trend = [];
  S.congelado = false; S.mute = 0; S.corriendo = true;
  S.objetivo = preset?.objetivo || null; S.caso = preset?.caso || null;

  $('#vh-pt').textContent = `${pt.nombre} · ${pt.edad} a · ${pt.sexo === 'F' ? 'F' : 'M'} · PBW ${round(pt.pbw, 0)} kg · ${DX[dx].ico} ${DX[dx].n.split('(')[0].trim()}`;
  $('#badge-log').hidden = true;
  renderModos(); renderParams(); renderAlarmas(); renderManiobras(); pintarLog();
  actualizarMedidos(); initCurvas(); restaurarPlegado();
  ir('vent');
  setTimeout(() => {
    notificar({
      sev: 'info', ico: '🫁', k: 'var(--cian)',
      title: `Paciente conectado: ${DX[dx].n.split('(')[0].trim()}`,
      msg: `Peso predicho <b>${round(pt.pbw, 1)} kg</b> → volumen protector <b>${Math.round(pt.pbw * 6)}–${Math.round(pt.pbw * 8)} mL</b>. El ventilador arranca con los ajustes de fábrica: revísalos.`,
      why: '', fix: S.objetivo || DX[dx].meta
    });
  }, 700);
  arrancarBucle();
}

/* ══════════════════════════════════════════════════════════════
   CONTROLES DEL VENTILADOR
══════════════════════════════════════════════════════════════ */
function renderModos() {
  $('#mode-grid').innerHTML = Object.entries(MODOS).map(([k, m]) =>
    `<button class="mode-btn ${k === S.modo ? 'on' : ''}" data-modo="${k}"><b>${m.n}</b><i>${m.sub}</i></button>`
  ).join('');
  $$('#mode-grid .mode-btn').forEach(b => b.onclick = () => cambiarModo(b.dataset.modo));
  $('#opt-autoflow').checked = S.autoflow;
  $('#opt-asb').checked = S.asbOn;
  $('#mode-info').innerHTML = `<b>${MODOS[S.modo].n} — ${MODOS[S.modo].sub}</b><br>${MODOS[S.modo].desc}`;
}
function cambiarModo(k) {
  if (k === S.modo) return;
  const previo = S.modo; S.modo = k; vibrar(35);
  if (k === 'CPAP' && S.fis.sedK < 0.3) {
    notificar({ sev: 'crit', ico: '⛔', k: 'var(--crit)', title: 'Modo espontáneo con sedación profunda',
      msg: 'Has pasado a CPAP/ASB, donde todas las respiraciones dependen del paciente, pero está profundamente sedado.',
      why: 'Sin impulso respiratorio propio el paciente entra en apnea. Sólo lo salva la ventilación de respaldo por apnea, y con el tiempo de apnea mal ajustado la desaturación es cuestión de segundos.',
      fix: 'Vuelve a un modo con respiraciones mandatorias (BIPAP o SIMV) o aligera primero la sedación.' }, 'modo_cpap_sedado');
    registrarError('cpap_sedado', 'crit', 'Modo espontáneo con paciente sin impulso respiratorio', 'Seguridad');
  }
  if (k === 'CPAP' || k === 'BIPAP' || k === 'SIMV') S.asbOn = true;
  renderModos(); renderParams();
  añadirLog({ sev: 'info', ico: '🔀', title: `Cambio de modo: ${MODOS[previo].n} → ${MODOS[k].n}`, msg: MODOS[k].sub }, 'modo');
}

function renderParams() {
  const lista = MODOS[S.modo].params.slice();
  if ((S.asbOn || S.modo === 'CPAP') && !lista.includes('asb')) lista.push('asb', 'rampa');
  if (S.modo !== 'CPAP' && !lista.includes('tapn')) lista.push('tapn');
  const grupos = {};
  lista.forEach(id => { const p = PARAMS[id]; if (!p) return; (grupos[p.g] = grupos[p.g] || []).push(id); });
  $('#param-list').innerHTML = Object.entries(grupos).map(([g, ids]) =>
    `<div class="pgroup-h">${g}</div>` + ids.map(id => pcardHTML(id)).join('')
  ).join('');
  $$('#param-list .pcard').forEach(card => {
    const id = card.dataset.p, p = PARAMS[id];
    $('.pc-menos', card).onclick = () => setParam(id, S.set[id] - p.step);
    $('.pc-mas', card).onclick = () => setParam(id, S.set[id] + p.step);
    const rg = $('.pc-range', card);
    rg.oninput = () => setParam(id, parseFloat(rg.value), true);
    rg.onchange = () => setParam(id, parseFloat(rg.value));
    $('.pc-help', card).onclick = () => modal(`${p.lab} — ${p.desc}`,
      `<p>${p.ayuda}</p><p style="margin-top:10px"><b>Rango del equipo:</b> ${p.min}–${p.max} ${p.u}</p>`);
  });
  actualizarParamsUI();
}
function pcardHTML(id) {
  const p = PARAMS[id], v = S.set[id];
  return `<div class="pcard" data-p="${id}" style="--k:${p.k}">
    <div class="pc-top">
      <span class="pc-name">${p.lab}<button class="pc-help" aria-label="Ayuda">?</button></span>
      <span><span class="pc-val">${round(v, p.dec).toFixed(p.dec)}</span><span class="pc-unit">${p.u}</span></span>
    </div>
    <div class="pc-ctl">
      <button class="pc-step pc-menos" aria-label="Bajar ${p.lab}">−</button>
      <input class="pc-range" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${v}" aria-label="${p.desc}">
      <button class="pc-step pc-mas" aria-label="Subir ${p.lab}">+</button>
    </div>
    <div class="pc-foot"></div>
  </div>`;
}
function setParam(id, v, silencioso) {
  const p = PARAMS[id];
  v = clamp(round(v, 3), p.min, p.max);
  if (S.set[id] === v) return;
  const antes = S.set[id];
  S.set[id] = v;
  actualizarMedidos();
  actualizarParamsUI();
  if (!silencioso) {
    vibrar(18);
    añadirLog({ sev: 'info', ico: '🎛️', title: `${p.lab}: ${round(antes, p.dec)} → ${round(v, p.dec)} ${p.u}`, msg: p.desc }, 'set_' + id);
    setTimeout(evaluarReglas, 120);
  }
}
/** Colorea cada parámetro según lo seguro que sea el valor actual */
function actualizarParamsUI() {
  const m = S.med, pt = S.pt;
  $$('#param-list .pcard').forEach(card => {
    const id = card.dataset.p, p = PARAMS[id], v = S.set[id];
    const val = $('.pc-val', card), rg = $('.pc-range', card), foot = $('.pc-foot', card);
    if (val) val.textContent = round(v, p.dec).toFixed(p.dec);
    if (rg && document.activeElement !== rg) rg.value = v;
    let cls = '', txt = '';
    switch (id) {
      case 'vt': {
        const kg = v / pt.pbw;
        txt = `${round(kg, 1)} mL/kg PBW · objetivo ${Math.round(pt.pbw * 6)}–${Math.round(pt.pbw * 8)} mL`;
        cls = kg > 10 ? 'danger' : kg > 8 || kg < 4 ? 'risk' : '';
        break; }
      case 'peep':
        txt = `PEEP total ${round(m.peepTot, 1)} mbar (auto-PEEP ${round(m.autoPeep, 1)}) · útil ≈ ${S.fis.peepOpt}`;
        cls = v < 3 ? 'risk' : m.peepTot > S.fis.peepOpt + 6 ? 'risk' : '';
        break;
      case 'freq':
        txt = `FR total ${round(m.fTot, 0)}/min · I:E 1:${round(m.ie, 1)} · Te ${round(m.te, 1)} s (necesita ${round(m.tau * 3, 1)} s)`;
        cls = m.te < m.tau * 2 ? 'danger' : m.ie < 1.5 ? 'risk' : '';
        break;
      case 'tinsp':
        txt = `I:E 1:${round(m.ie, 1)} · Te ${round(m.te, 1)} s`;
        cls = m.ie < 1 ? 'danger' : m.ie < 1.5 ? 'risk' : '';
        break;
      case 'fio2':
        txt = `SpO₂ ${round(S.fis.spo2, 0)} % · PaO₂/FiO₂ ${round(m.pf, 0)}`;
        cls = v > 60 ? 'risk' : '';
        break;
      case 'pinsp':
        txt = `VT resultante ${round(m.vtMand, 0)} mL (${round(m.vtkg, 1)} mL/kg) · ΔP ${round(m.dp, 0)} mbar`;
        cls = m.dp > 15 || v > 35 ? 'danger' : m.vtkg > 8 ? 'risk' : '';
        break;
      case 'flow':
        txt = `Pico ${round(m.ppico, 0)} · meseta ${round(m.pplat, 0)} mbar`;
        cls = m.ppico > 45 ? 'risk' : '';
        break;
      case 'asb':
        txt = `VT espontáneo ${round(m.vtEsp, 0)} mL · f esp ${round(m.fEsp, 0)}/min`;
        cls = v > 22 ? 'risk' : (m.fEsp > 30 ? 'risk' : '');
        break;
      case 'trig':
        txt = v < 0.8 ? 'Riesgo de autodisparo' : v > 4 ? 'Riesgo de esfuerzos inefectivos' : 'Sensibilidad adecuada';
        cls = v < 0.8 || v > 4 ? 'risk' : '';
        break;
      case 'pmax':
        txt = `Presión pico actual ${round(m.ppico, 0)} mbar`;
        cls = S.fis.limitado ? 'risk' : '';
        break;
      default: txt = p.desc;
    }
    card.classList.toggle('risk', cls === 'risk');
    card.classList.toggle('danger', cls === 'danger');
    if (foot) { foot.className = 'pc-foot ' + cls; foot.textContent = txt; }
  });
}

function renderAlarmas() {
  $('#alarm-list').innerHTML = Object.entries(ALARMAS).map(([k, a]) => `
    <div class="acard" data-a="${k}">
      <div class="pc-top">
        <span class="pc-name">${a.lab} <button class="pc-help" aria-label="Ayuda">?</button></span>
        <span><span class="pc-val">${S.al[k]}</span><span class="pc-unit">${a.u}</span></span>
      </div>
      <div class="pc-ctl">
        <button class="pc-step al-menos">−</button>
        <input class="pc-range al-range" type="range" min="${a.min}" max="${a.max}" step="${a.step}" value="${S.al[k]}">
        <button class="pc-step al-mas">+</button>
      </div>
      <div class="pc-ctl" style="margin-top:8px">
        <label class="switch"><input type="checkbox" class="al-on" ${S.alOn[k] ? 'checked' : ''}><span>Alarma activada</span></label>
      </div>
      <div class="pc-foot">${a.desc}</div>
    </div>`).join('');
  $$('#alarm-list .acard').forEach(card => {
    const k = card.dataset.a, a = ALARMAS[k];
    const rg = $('.al-range', card), val = $('.pc-val', card);
    const set = v => { S.al[k] = clamp(round(v, 2), a.min, a.max); val.textContent = S.al[k]; rg.value = S.al[k]; };
    $('.al-menos', card).onclick = () => { set(S.al[k] - a.step); evaluarReglas(); };
    $('.al-mas', card).onclick = () => { set(S.al[k] + a.step); evaluarReglas(); };
    rg.oninput = () => set(parseFloat(rg.value));
    rg.onchange = () => evaluarReglas();
    $('.al-on', card).onchange = e => {
      S.alOn[k] = e.target.checked;
      card.classList.toggle('off', !e.target.checked);
      if (!e.target.checked) {
        notificar({ sev: 'warn', ico: '🔕', k: 'var(--warn)', title: `Alarma ${a.lab} desactivada`,
          msg: 'Has apagado una alarma del ventilador.',
          why: 'Las alarmas son la red de seguridad del paciente. Desactivarlas para no oír el pitido es una de las causas evitables de eventos adversos graves en UCI.',
          fix: 'Silencia temporalmente (campana) en lugar de desactivar, y corrige la causa.' }, 'al_off_' + k);
      }
      evaluarReglas();
    };
    $('.pc-help', card).onclick = () => modal(`${a.lab} — ${a.desc}`,
      `<p>${a.ayuda || 'Límite de alarma del ventilador.'}</p><p style="margin-top:10px"><b>Rango:</b> ${a.min}–${a.max} ${a.u}</p>`);
  });
}

const MANIOBRAS = [
  { id: 'pausaInsp', n: 'Pausa inspiratoria', d: 'Mide la presión meseta real', ico: '⏸️', k: 'var(--oro)' },
  { id: 'pausaEsp', n: 'Pausa espiratoria', d: 'Mide el auto-PEEP', ico: '⏯️', k: 'var(--oro)' },
  { id: 'aspirar', n: 'Aspirar secreciones', d: 'Limpia la vía aérea', ico: '🫧', k: 'var(--cian)' },
  { id: 'reclutamiento', n: 'Reclutamiento alveolar', d: 'Abre alvéolos colapsados', ico: '🎈', k: 'var(--verde)' },
  { id: 'sbt', n: 'Prueba de ventilación espontánea', d: 'Valora si puede extubarse', ico: '🎓', k: 'var(--verde)' },
  { id: 'avanzar', n: 'Avanzar 15 minutos', d: 'Deja que el paciente se equilibre', ico: '⏩', k: 'var(--violeta)' },
  { id: 'sedar', n: 'Profundizar sedación', d: 'Reduce el impulso respiratorio', ico: '💤', k: 'var(--violeta)' },
  { id: 'despertar', n: 'Aligerar sedación', d: 'Recupera respiración espontánea', ico: '☀️', k: 'var(--violeta)' },
  { id: 'secreciones', n: '⚡ Evento: secreciones', d: 'Sube la resistencia', ico: '🌫️', k: 'var(--warn)' },
  { id: 'broncoespasmo', n: '⚡ Evento: broncoespasmo', d: 'Obstrucción aguda', ico: '🌪️', k: 'var(--warn)' },
  { id: 'neumotorax', n: '⚡ Evento: neumotórax', d: 'Colapso pulmonar agudo', ico: '🚨', k: 'var(--crit)' },
  { id: 'desconexion', n: '⚡ Evento: desconexión', d: 'Circuito desconectado', ico: '🔌', k: 'var(--crit)' },
  { id: 'reconectar', n: 'Reconectar circuito', d: 'Restablece la ventilación', ico: '🔗', k: 'var(--ok)' },
  { id: 'fiebre', n: '⚡ Evento: fiebre', d: 'Aumenta la producción de CO₂', ico: '🌡️', k: 'var(--warn)' }
];
function renderManiobras() {
  $('#maniobras').innerHTML = MANIOBRAS.map(m =>
    `<button class="man-btn" data-m="${m.id}" style="--k:${m.k}"><b>${m.ico} ${m.n}</b><i>${m.d}</i></button>`
  ).join('');
  $$('#maniobras .man-btn').forEach(b => b.onclick = () => ejecutarManiobra(b.dataset.m));
}
function ejecutarManiobra(id) {
  vibrar(30);
  const m = S.med, f = S.fis;
  switch (id) {
    case 'pausaInsp':
      modal('⏸️ Pausa inspiratoria', `
        <p>Al ocluir la vía aérea al final de la inspiración, el flujo se detiene y la presión cae desde el pico hasta la <b>meseta</b>: ésa es la presión que realmente soportan los alvéolos.</p>
        <div class="gaso-grid">
          <div class="gaso-cell ${m.ppico > 40 ? 'hi' : 'ok'}"><span>P PICO</span><b>${round(m.ppico, 0)}</b><i>mbar</i></div>
          <div class="gaso-cell ${m.pplat > 30 ? 'hi' : 'ok'}"><span>P MESETA</span><b>${round(m.pplat, 0)}</b><i>mbar</i></div>
          <div class="gaso-cell"><span>ΔP PICO-MESETA</span><b>${round(m.ppico - m.pplat, 0)}</b><i>mbar</i></div>
          <div class="gaso-cell ${m.dp > 15 ? 'hi' : 'ok'}"><span>DRIVING P</span><b>${round(m.dp, 0)}</b><i>mbar</i></div>
          <div class="gaso-cell"><span>C ESTÁTICA</span><b>${round(m.cest, 0)}</b><i>mL/mbar</i></div>
          <div class="gaso-cell"><span>RESISTENCIA</span><b>${round(m.rins, 0)}</b><i>mbar/L/s</i></div>
        </div>
        <p><b>Cómo se lee:</b> una diferencia pico−meseta grande (> 10) indica problema de <b>resistencia</b> (secreciones, broncoespasmo, tubo). Una meseta alta con poca diferencia indica problema de <b>distensibilidad</b> (SDRA, edema, neumotórax, sobredistensión).</p>`);
      break;
    case 'pausaEsp':
      modal('⏯️ Pausa espiratoria', `
        <p>Al ocluir la vía aérea al final de la espiración, la presión del circuito se iguala con la alveolar y aparece el <b>auto-PEEP</b> oculto.</p>
        <div class="gaso-grid">
          <div class="gaso-cell"><span>PEEP AJUSTADA</span><b>${S.set.peep}</b><i>mbar</i></div>
          <div class="gaso-cell ${m.autoPeep >= 5 ? 'hi' : 'ok'}"><span>AUTO-PEEP</span><b>${round(m.autoPeep, 1)}</b><i>mbar</i></div>
          <div class="gaso-cell ${m.peepTot > 15 ? 'hi' : 'ok'}"><span>PEEP TOTAL</span><b>${round(m.peepTot, 1)}</b><i>mbar</i></div>
          <div class="gaso-cell"><span>Te DISPONIBLE</span><b>${round(m.te, 1)}</b><i>s</i></div>
          <div class="gaso-cell"><span>Te NECESARIO (3τ)</span><b>${round(m.tau * 3, 1)}</b><i>s</i></div>
          <div class="gaso-cell"><span>I:E</span><b>1:${round(m.ie, 1)}</b><i></i></div>
        </div>
        <p>${m.autoPeep >= 5
          ? '<b style="color:var(--crit)">Hay atrapamiento aéreo.</b> El tiempo espiratorio disponible es menor que el que este pulmón necesita para vaciarse. Baja la frecuencia, acorta el Tinsp o sube el flujo.'
          : '<b style="color:var(--ok)">Sin atrapamiento significativo.</b> El tiempo espiratorio es suficiente para la constante de tiempo actual.'}</p>`);
      break;
    case 'sbt': hacerSBT(); break;
    case 'neumotorax': provocarNeumotorax(false); break;
    default: aplicarEvento(id);
  }
  actualizarMedidos();
}
function hacerSBT() {
  const m = S.med, f = S.fis;
  const ok = m.rsbi < 105 && f.spo2 >= 92 && S.set.fio2 <= 40 && S.set.peep <= 8 &&
             f.ph >= 7.32 && f.map > 65 && m.fEsp > 5 && f.fatiga < 0.4 && !f.neumotorax;
  if (ok) {
    modal('🎓 Prueba de ventilación espontánea: SUPERADA', `
      <p>El paciente ha tolerado 30 minutos en CPAP/ASB sin signos de fracaso.</p>
      <div class="gaso-grid">
        <div class="gaso-cell ok"><span>RSBI</span><b>${round(m.rsbi, 0)}</b><i>&lt; 105</i></div>
        <div class="gaso-cell ok"><span>SpO₂</span><b>${round(f.spo2, 0)}</b><i>%</i></div>
        <div class="gaso-cell ok"><span>FR esp</span><b>${round(m.fEsp, 0)}</b><i>/min</i></div>
        <div class="gaso-cell ok"><span>pH</span><b>${round(f.ph, 2)}</b><i></i></div>
        <div class="gaso-cell ok"><span>PAM</span><b>${round(f.map, 0)}</b><i>mmHg</i></div>
        <div class="gaso-cell ok"><span>FiO₂</span><b>${S.set.fio2}</b><i>%</i></div>
      </div>
      <p><b>Criterios cumplidos:</b> índice de respiración rápida superficial &lt; 105, oxigenación con FiO₂ ≤ 40 % y PEEP ≤ 8, pH ≥ 7.32, estabilidad hemodinámica y sin signos de fatiga. Es candidato a extubación.</p>`);
    S.aciertos.sbt_ok = { n: (S.aciertos.sbt_ok?.n || 0) + 1, title: 'Prueba de ventilación espontánea superada' };
    notificar({ sev: 'ok', ico: '🎓', k: 'var(--ok)', title: 'Prueba de ventilación espontánea superada',
      msg: 'El paciente cumple criterios de extubación.', why: '', fix: 'Extubar con el paciente despierto, con tos eficaz y vía aérea permeable.' }, 'sbt_ok');
  } else {
    const fallos = [];
    if (m.rsbi >= 105) fallos.push(`RSBI ${round(m.rsbi, 0)} (debe ser < 105): respiración rápida y superficial`);
    if (f.spo2 < 92) fallos.push(`SpO₂ ${round(f.spo2, 0)} % insuficiente`);
    if (S.set.fio2 > 40) fallos.push(`FiO₂ ${S.set.fio2} % todavía alta (debe ser ≤ 40 %)`);
    if (S.set.peep > 8) fallos.push(`PEEP ${S.set.peep} todavía alta (debe ser ≤ 8)`);
    if (f.ph < 7.32) fallos.push(`pH ${round(f.ph, 2)}: acidosis no resuelta`);
    if (f.map <= 65) fallos.push(`PAM ${round(f.map, 0)} mmHg: inestabilidad hemodinámica`);
    if (m.fEsp <= 5) fallos.push('Sin impulso respiratorio suficiente (sedación o relajante)');
    if (f.fatiga >= 0.4) fallos.push('Signos de fatiga muscular');
    if (f.neumotorax) fallos.push('Complicación activa: neumotórax');
    modal('⚠️ Prueba de ventilación espontánea: FRACASO', `
      <p>El paciente <b>no</b> cumple criterios para respirar sin soporte. Extubarlo ahora acabaría en reintubación, que multiplica la mortalidad.</p>
      <ul>${fallos.map(x => `<li>${x}</li>`).join('')}</ul>
      <p><b>Qué hacer:</b> volver a soporte cómodo, corregir cada criterio pendiente (oxigenación, pH, hemodinámica, sedación, fuerza) y repetir la prueba en 24 h.</p>`);
    registrarError('sbt_precoz', 'warn', 'Prueba de destete sin criterios cumplidos', 'Destete');
  }
}

/* ─────────── Gasometría en pantalla ─────────── */
function mostrarGaso() {
  const g = tomarGaso(), r = interpretarAB(g);
  const cel = (lab, val, u, est) => `<div class="gaso-cell ${est || ''}"><span>${lab}</span><b>${val}</b><i>${u}</i></div>`;
  const e = (v, lo, hi) => v < lo ? 'lo' : v > hi ? 'hi' : 'ok';
  modal('🧪 Gasometría arterial', `
    <div class="gaso-grid">
      ${cel('pH', g.ph.toFixed(2), '7.35–7.45', e(g.ph, 7.35, 7.45))}
      ${cel('PaCO₂', g.paco2, '35–45 mmHg', e(g.paco2, 35, 45))}
      ${cel('PaO₂', g.pao2, '80–100 mmHg', e(g.pao2, 80, 100))}
      ${cel('HCO₃⁻', g.hco3, '22–26 mEq/L', e(g.hco3, 22, 26))}
      ${cel('EB', g.be, '−2 a +2', e(g.be, -2, 2))}
      ${cel('SaO₂', g.sao2, '95–100 %', e(g.sao2, 94, 100))}
      ${cel('Lactato', g.lac, '< 2 mmol/L', e(g.lac, 0, 2))}
      ${cel('PaO₂/FiO₂', g.pf, '> 300', e(g.pf, 300, 999))}
      ${cel('Gradiente A-a', g.aa, '< 20 mmHg', e(g.aa, 0, 20))}
      ${cel('Anión gap', g.agCorr, '8–16', e(g.agCorr, 8, 16))}
      ${cel('K⁺', g.k, '3.5–5.0', e(g.k, 3.5, 5))}
      ${cel('FiO₂', g.fio2, '%', '')}
    </div>
    <div class="ab-card" style="--k:${r.k}">
      <h4>🔬 ${r.nom}</h4>
      <p>${r.det.join('<br>')}</p>
    </div>
    <p style="margin-top:12px"><b>Objetivo de este paciente:</b> ${S.objetivo || DX[S.pt.dx].meta}</p>`);
  añadirLog({ sev: 'info', ico: '🧪', title: 'Gasometría arterial', msg: `pH ${g.ph} · PaCO₂ ${g.paco2} · PaO₂ ${g.pao2} · HCO₃⁻ ${g.hco3} → ${r.nom}` }, 'gaso');
}

/* ─────────── Valores medidos y alarmas del equipo ─────────── */
function pintarMedidos() {
  const m = S.med, f = S.fis;
  const cel = (lab, val, u, est) => `<div class="ms-cell ${est || ''}"><span>${lab}</span><b>${val}</b><i>${u}</i></div>`;
  $('#meas-strip').innerHTML =
    cel('P PICO', round(m.ppico, 0), 'mbar', m.ppico > S.al.pawHi ? 'alert' : m.ppico > 40 ? 'warn' : '') +
    cel('P MESETA', round(m.pplat, 0), 'mbar', m.pplat > 30 ? 'alert' : m.pplat > 27 ? 'warn' : 'good') +
    cel('PEEP', round(m.peepTot, 1), 'mbar', m.autoPeep >= 5 ? 'alert' : m.autoPeep > 2 ? 'warn' : '') +
    cel('P MEDIA', round(m.pmedia, 0), 'mbar', m.pmedia > 18 ? 'warn' : '') +
    cel('VTe', round(m.vtEntregado, 0), 'mL', m.vtkg > 10 ? 'alert' : m.vtkg > 8 ? 'warn' : 'good') +
    cel('VM', round(m.vm, 1), 'L/min', (m.vm > S.al.mvHi || m.vm < S.al.mvLo) ? 'alert' : '') +
    cel('FR tot', round(m.fTot, 0), '/min', m.fTot > 35 ? 'warn' : '') +
    cel('f esp', round(m.fEsp, 0), '/min', m.fEsp > S.al.fspnHi ? 'alert' : '') +
    cel('C est', round(m.cest, 0), 'mL/mbar', m.cest < 30 ? 'warn' : '') +
    cel('R', round(m.rins, 0), 'mbar/L/s', m.rins > 20 ? 'warn' : '') +
    cel('I:E', '1:' + round(m.ie, 1), '', m.ie < 1 ? 'alert' : m.ie < 1.5 ? 'warn' : '') +
    cel('FiO₂', S.set.fio2, '%', S.set.fio2 > 60 ? 'warn' : '');

  const set = (id, v, cls) => {
    const e = $('#' + id); if (!e) return;
    e.textContent = v; e.parentElement.classList.toggle('crit', !!cls);
  };
  set('m-spo2', round(f.spo2, 0), f.spo2 < 88);
  set('m-hr', round(f.hr, 0), f.hr > 140 || f.hr < 45);
  set('m-map', round(f.map, 0), f.map < 60);
  set('m-etco2', round(m.etco2, 0), false);

  // Resúmenes que se "asoman" cuando las secciones están plegadas
  const pc = $('#peek-curvas');
  if (pc && $('#vent-screen')?.classList.contains('closed')) {
    pc.textContent = `Ppico ${round(m.ppico, 0)} · Pmes ${round(m.pplat, 0)} · VTe ${round(m.vtEntregado, 0)} · FR ${round(m.fTot, 0)}`;
  }
  const pd = $('#peek-datos');
  if (pd && $('#sec-datos')?.classList.contains('closed')) {
    // Primero las constantes vitales, que es lo que no se puede perder de vista
    pd.textContent = `SpO₂ ${round(f.spo2, 0)} · FC ${round(f.hr, 0)} · PAM ${round(f.map, 0)} · Pmes ${round(m.pplat, 0)} · VTe ${round(m.vtEntregado, 0)} · VM ${round(m.vm, 1)}`;
    pd.style.color = (f.spo2 < 90 || f.map < 65 || m.pplat > 30) ? 'var(--crit)' : '';
  }
}

/* ─────────── Plegado de la pantalla para ganar espacio ─────────── */
function plegar(cual, cerrar) {
  const el = cual === 'curvas' ? $('#vent-screen') : $('#sec-datos');
  if (!el) return;
  const estado = (cerrar === undefined) ? !el.classList.contains('closed') : cerrar;
  el.classList.toggle('closed', estado);
  const h = cual === 'curvas' ? $('#fold-curvas') : $('#fold-datos');
  if (h) h.setAttribute('aria-expanded', String(!estado));
  LS.set('fold_' + cual, estado ? 1 : 0);
  if (!estado && cual === 'curvas') setTimeout(() => { redimensionarCurvas(); pintarCurvas(); }, 60);
  if (S.fis) pintarMedidos();
}
function restaurarPlegado() {
  // En pantallas cortas los datos arrancan plegados: el resumen de la barra
  // sigue mostrando lo esencial y los controles nacen con sitio de sobra
  const porDefecto = window.innerHeight < 820 ? 1 : 0;
  plegar('curvas', !!LS.get('fold_curvas', 0));
  plegar('datos', !!LS.get('fold_datos', porDefecto));
}

function revisarAlarmasEquipo() {
  const m = S.med, f = S.fis, al = S.al, on = S.alOn;
  const lista = [];
  if (on.pawHi && m.ppico > al.pawHi) lista.push(['crit', `Paw ALTA · ${round(m.ppico, 0)} > ${al.pawHi} mbar`]);
  if (on.mvLo && m.vm < al.mvLo) lista.push(['crit', `VOLUMEN MINUTO BAJO · ${round(m.vm, 1)} < ${al.mvLo} L/min`]);
  if (on.mvHi && m.vm > al.mvHi) lista.push(['warn', `VOLUMEN MINUTO ALTO · ${round(m.vm, 1)} > ${al.mvHi} L/min`]);
  if (on.vtiHi && m.vtEntregado > al.vtiHi) lista.push(['warn', `VT ALTO · ${round(m.vtEntregado, 0)} > ${al.vtiHi} mL`]);
  if (on.fspnHi && m.fEsp > al.fspnHi) lista.push(['warn', `FRECUENCIA ESPONTÁNEA ALTA · ${round(m.fEsp, 0)}/min`]);
  if (f.desconectado) lista.unshift(['crit', 'DESCONEXIÓN DEL PACIENTE']);
  if (f.spo2 < 88) lista.unshift(['crit', `SpO₂ BAJA · ${round(f.spo2, 0)} %`]);
  if (m.fTot < 4 && !f.bnm) lista.unshift(['crit', 'APNEA']);
  if (f.map < 60) lista.push(['warn', `HIPOTENSIÓN · PAM ${round(f.map, 0)} mmHg`]);

  const bar = $('#alarm-bar');
  if (!lista.length) { bar.hidden = true; return; }
  const crit = lista.find(x => x[0] === 'crit') || lista[0];
  bar.hidden = false;
  bar.className = 'alarm-bar' + (crit[0] === 'warn' ? ' warn' : '');
  $('#alarm-text').textContent = crit[1];
  $('#alarm-count').textContent = lista.length > 1 ? `+${lista.length - 1}` : '';
  if (crit[0] === 'crit' && S.mute < S.t && Math.random() < 0.02) pitido(1000, 0.12);
}

/* ══════════════════════════════════════════════════════════════
   BUCLE PRINCIPAL
══════════════════════════════════════════════════════════════ */
let rafId = null, ultimoT = 0, acumUI = 0, acumTrend = 0, acumReglas = 0;
function arrancarBucle() {
  if (rafId) cancelAnimationFrame(rafId);
  ultimoT = performance.now();
  const paso = ahora => {
    rafId = requestAnimationFrame(paso);
    const dtReal = Math.min(0.1, (ahora - ultimoT) / 1000);
    ultimoT = ahora;
    if (!S.corriendo) return;
    const dtSim = dtReal * CFG.velocidad;
    S.t += dtSim;
    actualizarMedidos();
    tickFisiologia(dtSim);
    pasoCurvas(dtReal);
    pintarCurvas();
    acumUI += dtReal;
    if (acumUI > 0.28) {
      acumUI = 0;
      pintarMedidos(); revisarAlarmasEquipo(); actualizarParamsUI();
      $('#vh-clock').textContent = mmss(S.t);
    }
    acumReglas += dtSim;
    if (acumReglas > 4) { acumReglas = 0; evaluarReglas(); }
    acumTrend += dtSim;
    if (acumTrend > 20) {
      acumTrend = 0;
      S.trend.push({ spo2: S.fis.spo2, paco2: S.fis.paco2, ph10: S.fis.ph * 10, pplat: S.med.pplat });
      if (S.trend.length > 200) S.trend.shift();
    }
  };
  rafId = requestAnimationFrame(paso);
}

/* ══════════════════════════════════════════════════════════════
   CASOS CLÍNICOS
══════════════════════════════════════════════════════════════ */
const CASOS = [
  { id: 'c1', ico: '🔥', niv: 'BÁSICO', k: 'var(--rojo)', t: 'SDRA por neumonía COVID',
    dx: 'sdra', gravedad: 'moderado', hemo: 'normal', sedacion: 'profunda', bnm: 'si',
    edad: 58, sexo: 'M', talla: 172, peso: 95, temp: 38.2,
    hist: 'Varón de 58 años, 95 kg de peso real y 172 cm de talla. Ingresa por insuficiencia respiratoria hipoxémica con infiltrados bilaterales. PaO₂/FiO₂ de 130 con FiO₂ del 60 %. Está sedado y relajado.',
    obj: 'Programa una ventilación protectora: VT 6 mL/kg de <b>peso predicho</b> (no de los 95 kg reales), Pmeseta ≤ 30, driving pressure ≤ 15 y titula la PEEP para bajar la FiO₂ por debajo del 60 %.' },
  { id: 'c2', ico: '💨', niv: 'INTERMEDIO', k: 'var(--oro)', t: 'EPOC agudizado con atrapamiento',
    dx: 'epoc', gravedad: 'severo', hemo: 'normal', sedacion: 'moderada', bnm: 'no',
    edad: 71, sexo: 'M', talla: 168, peso: 62, temp: 37.4,
    hist: 'Varón de 71 años con EPOC muy evolucionado. Llega con acidosis respiratoria (pH 7.24, PaCO₂ 78) y trabajo respiratorio extremo. Tras intubar, la presión arterial cae y el equipo alarma por presión alta.',
    obj: 'Corrige el atrapamiento aéreo: alarga la espiración (FR baja, Tinsp corto, flujo alto), comprueba el auto-PEEP con la pausa espiratoria y <b>no intentes normalizar la PaCO₂</b>. Objetivo: pH ≥ 7.25 y SpO₂ 88–92 %.' },
  { id: 'c3', ico: '🍬', niv: 'AVANZADO', k: 'var(--crit)', t: 'Cetoacidosis diabética intubada',
    dx: 'cad', gravedad: 'severo', hemo: 'hipovolemico', sedacion: 'profunda', bnm: 'no',
    edad: 24, sexo: 'F', talla: 163, peso: 55, temp: 36.8,
    hist: 'Mujer de 24 años con cetoacidosis diabética grave (pH 7.05, HCO₃⁻ 5, glucemia 520). Llegaba respirando a 38/min (Kussmaul). Ha requerido intubación por deterioro del nivel de conciencia.',
    obj: 'Este es el caso donde más estudiantes matan al paciente. <b>Mantén la hiperventilación compensadora</b>: volumen minuto alto, PaCO₂ objetivo por la fórmula de Winter (≈ 1.5 × HCO₃⁻ + 8). Si programas una PaCO₂ "normal" de 40, el pH se desploma.' },
  { id: 'c4', ico: '🧠', niv: 'INTERMEDIO', k: 'var(--violeta)', t: 'TCE grave con hipertensión intracraneal',
    dx: 'tce', gravedad: 'moderado', hemo: 'normal', sedacion: 'profunda', bnm: 'si',
    edad: 32, sexo: 'M', talla: 178, peso: 80, temp: 37.5,
    hist: 'Varón de 32 años tras accidente de tráfico. Glasgow 6, hematoma subdural evacuado, monitorización de presión intracraneal. Pulmón sin patología.',
    obj: 'Neuroprotección: PaCO₂ entre 35 y 38 mmHg (ni hipocapnia ni hipercapnia), PaO₂ > 80 mmHg, PEEP moderada para no dificultar el retorno venoso cerebral. Ambos extremos de PaCO₂ dañan el cerebro.' },
  { id: 'c5', ico: '🌪️', niv: 'AVANZADO', k: 'var(--crit)', t: 'Estado asmático casi fatal',
    dx: 'asma', gravedad: 'severo', hemo: 'normal', sedacion: 'profunda', bnm: 'si',
    edad: 27, sexo: 'F', talla: 165, peso: 60, temp: 37.0,
    hist: 'Mujer de 27 años con crisis asmática que no responde a broncodilatadores. Intubada por agotamiento. Resistencia de la vía aérea extremadamente alta.',
    obj: 'La amenaza no es la hipoxemia sino la hiperinsuflación: FR 8–12, Tinsp muy corto, flujo alto, PEEP baja. Vigila el auto-PEEP y la presión arterial. Hipercapnia permisiva mientras el pH sea ≥ 7.20.' },
  { id: 'c6', ico: '🎓', niv: 'BÁSICO', k: 'var(--verde)', t: 'Destete tras cirugía abdominal',
    dx: 'sano', gravedad: 'leve', hemo: 'normal', sedacion: 'ligera', bnm: 'no',
    edad: 64, sexo: 'F', talla: 160, peso: 68, temp: 36.9,
    hist: 'Mujer de 64 años en el postoperatorio de una laparotomía. Ya está despierta, hemodinámicamente estable y con buena oxigenación. Sigue conectada al ventilador en modo controlado.',
    obj: 'Conduce el destete: pasa a un modo espontáneo con soporte, ajusta el ASB y el trigger para que respire cómoda, baja FiO₂ y PEEP, y realiza una prueba de ventilación espontánea cuando cumpla criterios.' },
  { id: 'c7', ico: '🧫', niv: 'AVANZADO', k: 'var(--warn)', t: 'Shock séptico con SDRA',
    dx: 'sepsis', gravedad: 'severo', hemo: 'shock', sedacion: 'profunda', bnm: 'no',
    edad: 69, sexo: 'M', talla: 175, peso: 78, temp: 39.1,
    hist: 'Varón de 69 años con shock séptico de origen abdominal, noradrenalina a dosis altas, lactato de 5.2 y acidosis metabólica. Además presenta infiltrados pulmonares bilaterales.',
    obj: 'Equilibrio difícil: necesitas PEEP para oxigenar, pero cada mbar de PEEP baja más la presión arterial de un paciente ya hipovolémico. Ventilación protectora sin hundir la hemodinámica, y respeta la compensación respiratoria de su acidosis metabólica.' },
  { id: 'c8', ico: '💊', niv: 'BÁSICO', k: 'var(--cian)', t: 'Sobredosis con depresión respiratoria',
    dx: 'intox', gravedad: 'moderado', hemo: 'normal', sedacion: 'profunda', bnm: 'no',
    edad: 41, sexo: 'M', talla: 174, peso: 72, temp: 36.4,
    hist: 'Varón de 41 años encontrado inconsciente tras ingesta de benzodiacepinas y opioides. pH 7.19, PaCO₂ 72. Pulmón radiológicamente normal.',
    obj: 'Acidosis respiratoria pura por hipoventilación central: el pulmón está sano y responde rápido. Normaliza la PaCO₂ de forma <b>progresiva</b>, no brusca, y prepara el destete en cuanto recupere el impulso respiratorio.' }
];
function pintarCasos() {
  $('#casos-body').innerHTML = CASOS.map(c => `
    <div class="caso" style="--k:${c.k}">
      <div class="caso-h">
        <span class="caso-ico">${c.ico}</span>
        <div><b>${c.t}</b><i>${c.niv}</i></div>
      </div>
      <p>${c.hist}</p>
      <div class="caso-obj"><b>🎯 Tu objetivo:</b> ${c.obj}</div>
      <button class="btn btn-primary" data-caso="${c.id}">▶ Iniciar este caso</button>
    </div>`).join('') + '<div class="spacer"></div>';
  $$('#casos-body [data-caso]').forEach(b => b.onclick = () => lanzarCaso(b.dataset.caso));
}
function lanzarCaso(id) {
  const c = CASOS.find(x => x.id === id); if (!c) return;
  $('#p-dx').value = c.dx; $('#p-gravedad').value = c.gravedad;
  $('#p-hemo').value = c.hemo; $('#p-sedacion').value = c.sedacion; $('#p-bnm').value = c.bnm;
  $('#p-edad').value = c.edad; $('#p-sexo').value = c.sexo;
  $('#p-talla').value = c.talla; $('#p-peso').value = c.peso; $('#p-temp').value = c.temp;
  $('#p-nombre').value = c.t;
  cargarGasoDx(); actualizarPBW();
  iniciarSimulacion({ nombre: c.t, objetivo: c.obj, caso: c.id, dx: c.dx, gravedad: c.gravedad,
    hemo: c.hemo, sedacion: c.sedacion, bnm: c.bnm, edad: c.edad, sexo: c.sexo,
    talla: c.talla, peso: c.peso, temp: c.temp });
}

/* ══════════════════════════════════════════════════════════════
   GUÍA RÁPIDA
══════════════════════════════════════════════════════════════ */
const GUIA = [
  { t: '🎛️ Los cuatro ajustes que lo deciden todo', b: `
    <ul>
      <li><b>Volumen corriente (VT) y frecuencia (FR)</b> → controlan la <b>PaCO₂</b> (el pH respiratorio).</li>
      <li><b>FiO₂ y PEEP</b> → controlan la <b>PaO₂</b> (la oxigenación).</li>
    </ul>
    <p>Si el pH está mal por CO₂, se toca volumen minuto. Si la oxigenación está mal, se tocan FiO₂ y PEEP. Confundir los dos ejes es el error conceptual más común.</p>` },
  { t: '📏 Peso predicho: el cálculo que salva pulmones', b: `
    <p>El tamaño del pulmón depende de la <b>talla y el sexo</b>, no de la grasa corporal. Un paciente de 120 kg y 165 cm tiene el mismo pulmón que uno de 60 kg y 165 cm.</p>
    <table><tr><th>Fórmula</th><th></th></tr>
      <tr><td>Hombre</td><td>50 + 0.91 × (talla cm − 152.4)</td></tr>
      <tr><td>Mujer</td><td>45.5 + 0.91 × (talla cm − 152.4)</td></tr></table>
    <p>Después: VT objetivo = 6 mL × PBW (rango 4–8).</p>` },
  { t: '🔺 Presión pico, meseta y driving pressure', b: `
    <table>
      <tr><th>Presión</th><th>Qué mide</th></tr>
      <tr><td>Pico</td><td>Resistencia + distensibilidad</td></tr>
      <tr><td>Meseta</td><td>Sólo distensibilidad (alvéolo)</td></tr>
      <tr><td>ΔP = meseta − PEEP</td><td>Estrés real sobre el pulmón</td></tr>
    </table>
    <p><b>Pico alta con meseta normal</b> → problema de resistencia: secreciones, broncoespasmo, tubo acodado o mordido.</p>
    <p><b>Pico y meseta altas</b> → problema de distensibilidad: SDRA, edema, neumotórax, sobredistensión, abdomen a tensión.</p>
    <p>Objetivos: meseta ≤ 30 mbar · ΔP ≤ 15 mbar.</p>` },
  { t: '🌀 Auto-PEEP: el enemigo invisible', b: `
    <p>La constante de tiempo espiratoria es <b>τ = Resistencia × Distensibilidad</b>. El pulmón necesita unos <b>3τ</b> para vaciarse del todo.</p>
    <p>Si el tiempo espiratorio programado es menor que 3τ, queda aire dentro. Ese aire se acumula respiración tras respiración: sube la presión intratorácica, cae la presión arterial y el paciente no consigue disparar el ventilador.</p>
    <p><b>Cómo se detecta:</b> pausa espiratoria (mide el auto-PEEP) y curva de flujo espiratorio que no llega a cero antes del siguiente ciclo.</p>
    <p><b>Cómo se corrige:</b> bajar la FR, acortar el Tinsp, subir el flujo, tratar la obstrucción.</p>` },
  { t: '🎈 PEEP: para qué sirve y qué cuesta', b: `
    <p><b>Beneficio:</b> mantiene abiertos los alvéolos, reduce el shunt, mejora la oxigenación y evita el atelectrauma.</p>
    <p><b>Coste:</b> aumenta la presión intratorácica → baja el retorno venoso → baja el gasto cardiaco y la presión arterial. En exceso, sobredistiende y aumenta el espacio muerto.</p>
    <table><tr><th>Situación</th><th>PEEP</th></tr>
      <tr><td>Pulmón sano</td><td>5</td></tr>
      <tr><td>SDRA / edema</td><td>10–16</td></tr>
      <tr><td>Obesidad</td><td>10–15</td></tr>
      <tr><td>EPOC / asma</td><td>5–8</td></tr>
      <tr><td>TEP / fallo del VD</td><td>baja</td></tr></table>` },
  { t: '🧪 Trastornos ácido-base en 4 pasos', b: `
    <ol style="margin-left:16px">
      <li><b>¿Acidemia o alcalemia?</b> pH &lt; 7.35 o &gt; 7.45.</li>
      <li><b>¿Quién manda?</b> Si la PaCO₂ va en el mismo sentido que el pH alterado → respiratorio. Si es el HCO₃⁻ → metabólico.</li>
      <li><b>¿La compensación es la esperada?</b> Winter (metabólica): PaCO₂ = 1.5 × HCO₃⁻ + 8 ± 2. Si no cuadra, hay un segundo trastorno.</li>
      <li><b>Anión gap</b> (Na − Cl − HCO₃, corregido por albúmina): elevado → cetoacidosis, lactato, tóxicos, uremia.</li>
    </ol>
    <p><b>Regla de oro en el ventilador:</b> nunca elimines la compensación respiratoria de una acidosis metabólica.</p>` },
  { t: '🫁 Modos del Evita 4 de un vistazo', b: `
    <table>
      <tr><th>Modo</th><th>Para qué</th></tr>
      <tr><td>IPPV</td><td>Soporte total, volumen garantizado</td></tr>
      <tr><td>SIMV</td><td>Transición y destete clásico</td></tr>
      <tr><td>BIPAP</td><td>Presión controlada + espontáneas libres</td></tr>
      <tr><td>CPAP/ASB</td><td>Espontáneo puro, prueba de destete</td></tr>
      <tr><td>APRV</td><td>Hipoxemia refractaria</td></tr>
      <tr><td>MMV</td><td>Destete con volumen minuto garantizado</td></tr>
    </table>
    <p><b>AutoFlow®</b> añade a los modos de volumen un flujo desacelerado que entrega el VT programado con la <b>mínima presión posible</b>: reúne la garantía del volumen con la comodidad de la presión.</p>` },
  { t: '🎓 Criterios para retirar el ventilador', b: `
    <ul>
      <li>Causa que motivó la intubación resuelta o en clara mejoría.</li>
      <li>PaO₂/FiO₂ &gt; 200 con FiO₂ ≤ 40 % y PEEP ≤ 8.</li>
      <li>pH ≥ 7.32 y hemodinámica estable sin vasopresores altos.</li>
      <li>Despierto, colaborador, con tos eficaz.</li>
      <li><b>RSBI = FR / VT(L) &lt; 105</b> durante la prueba de ventilación espontánea.</li>
    </ul>
    <p>La prueba se hace en CPAP/ASB 5–8 mbar durante 30 minutos. Si aparece taquipnea, desaturación, taquicardia, hipertensión o sudoración: fracaso, se vuelve a soporte y se busca la causa.</p>` },
  { t: '🚨 Deterioro brusco: regla DOPE', b: `
    <p>Ante una desaturación o una alarma de presión repentina:</p>
    <ul>
      <li><b>D</b> — Desplazamiento del tubo (intubación selectiva o extubación).</li>
      <li><b>O</b> — Obstrucción (secreciones, mordida, acodamiento).</li>
      <li><b>P</b> — Neumotórax (<i>Pneumothorax</i>).</li>
      <li><b>E</b> — Equipo (desconexión, fallo del ventilador).</li>
    </ul>
    <p>Ante la duda: desconectar, ventilar con bolsa y FiO₂ 100 %, y auscultar.</p>` }
];
function pintarGuia() {
  $('#guia-body').innerHTML = '<div class="gsec">' + GUIA.map((g, i) => `
    <div class="gacc" data-i="${i}">
      <button class="gacc-h"><span>${g.t}</span><i>›</i></button>
      <div class="gacc-b">${g.b}</div>
    </div>`).join('') + '</div><div class="spacer"></div>';
  $$('#guia-body .gacc').forEach(a => $('.gacc-h', a).onclick = () => a.classList.toggle('open'));
}

/* ══════════════════════════════════════════════════════════════
   EVALUACIÓN / DEBRIEFING
══════════════════════════════════════════════════════════════ */
function finalizarSesion() {
  S.corriendo = false;
  const errs = Object.entries(S.errores);
  const crits = errs.filter(([, e]) => e.sev === 'crit');
  const warns = errs.filter(([, e]) => e.sev === 'warn');
  const oks = Object.entries(S.aciertos);
  let score = 100 - crits.reduce((a, [, e]) => a + 12 + Math.min(8, (e.n - 1) * 2), 0)
                  - warns.reduce((a, [, e]) => a + 5 + Math.min(4, (e.n - 1)), 0)
                  + oks.length * 5;
  score = clamp(Math.round(score), 0, 100);
  const k = score >= 85 ? 'var(--ok)' : score >= 60 ? 'var(--warn)' : 'var(--crit)';
  const veredicto = score >= 85 ? 'Excelente manejo' : score >= 70 ? 'Buen manejo con detalles a pulir'
                  : score >= 50 ? 'Manejo aceptable: revisa los puntos críticos' : 'Requiere repasar los fundamentos';
  const f = S.fis, m = S.med;

  guardarProgreso(score, crits, warns);

  $('#reporte-body').innerHTML = `
    <div class="rep-score">
      <div class="rep-ring" style="--p:${score};--k:${k}"><div><b>${score}</b><span>PUNTOS</span></div></div>
      <div class="rep-verdict" style="--k:${k}">${veredicto}</div>
      <p class="rep-sub">${S.pt.nombre} · ${DX[S.pt.dx].n} · ${mmss(S.t)} de simulación</p>
      <div class="rep-stats">
        <div><b style="color:var(--crit)">${crits.length}</b><span>ERRORES GRAVES</span></div>
        <div><b style="color:var(--warn)">${warns.length}</b><span>ADVERTENCIAS</span></div>
        <div><b style="color:var(--ok)">${oks.length}</b><span>ACIERTOS</span></div>
      </div>
    </div>

    <div class="rep-sec">
      <h3>📊 Estado final del paciente</h3>
      <div class="gaso-grid">
        <div class="gaso-cell ${f.ph < 7.35 || f.ph > 7.45 ? 'hi' : 'ok'}"><span>pH</span><b>${round(f.ph, 2)}</b><i>7.35–7.45</i></div>
        <div class="gaso-cell ${f.paco2 < 35 || f.paco2 > 45 ? 'hi' : 'ok'}"><span>PaCO₂</span><b>${round(f.paco2, 0)}</b><i>mmHg</i></div>
        <div class="gaso-cell ${f.pao2 < 60 ? 'hi' : 'ok'}"><span>PaO₂</span><b>${round(f.pao2, 0)}</b><i>mmHg</i></div>
        <div class="gaso-cell ${f.spo2 < 90 ? 'hi' : 'ok'}"><span>SpO₂</span><b>${round(f.spo2, 0)}</b><i>%</i></div>
        <div class="gaso-cell ${m.pplat > 30 ? 'hi' : 'ok'}"><span>P MESETA</span><b>${round(m.pplat, 0)}</b><i>mbar</i></div>
        <div class="gaso-cell ${m.vtkg > 8 ? 'hi' : 'ok'}"><span>VT</span><b>${round(m.vtkg, 1)}</b><i>mL/kg PBW</i></div>
        <div class="gaso-cell ${f.map < 65 ? 'hi' : 'ok'}"><span>PAM</span><b>${round(f.map, 0)}</b><i>mmHg</i></div>
        <div class="gaso-cell ${f.lac > 2 ? 'hi' : 'ok'}"><span>LACTATO</span><b>${round(f.lac, 1)}</b><i>mmol/L</i></div>
        <div class="gaso-cell ${f.neumotorax ? 'hi' : 'ok'}"><span>COMPLICACIÓN</span><b>${f.neumotorax ? 'SÍ' : 'NO'}</b><i>${f.neumotorax ? 'neumotórax' : 'ninguna'}</i></div>
      </div>
    </div>

    ${crits.length ? `<div class="rep-sec"><h3>🚨 Errores graves</h3>${crits.map(([id, e]) =>
      `<div class="rep-item" style="--k:var(--crit)"><span class="n">×${e.n}</span><b>${e.title}</b>
       <p>${(REGLAS.find(r => r.id === id)?.why) || 'Revisa este punto en la guía rápida.'}</p></div>`).join('')}</div>` : ''}

    ${warns.length ? `<div class="rep-sec"><h3>⚠️ Aspectos a mejorar</h3>${warns.map(([id, e]) =>
      `<div class="rep-item" style="--k:var(--warn)"><span class="n">×${e.n}</span><b>${e.title}</b>
       <p>${(REGLAS.find(r => r.id === id)?.fix && typeof REGLAS.find(r => r.id === id).fix === 'string' ? REGLAS.find(r => r.id === id).fix : 'Consulta la guía rápida para el ajuste correcto.')}</p></div>`).join('')}</div>` : ''}

    ${oks.length ? `<div class="rep-sec"><h3>✅ Lo que hiciste bien</h3>${oks.map(([, e]) =>
      `<div class="rep-item" style="--k:var(--ok)"><b>${e.title}</b></div>`).join('')}</div>` : ''}

    <div class="rep-sec">
      <h3>🎯 Objetivo del caso</h3>
      <div class="rep-item" style="--k:var(--acc)"><p>${S.objetivo || DX[S.pt.dx].meta}</p></div>
    </div>

    <div class="rep-sec">
      <h3>📝 Bitácora completa (${S.log.length})</h3>
      ${S.log.slice(-40).reverse().map(l => `<div class="rep-item" style="--k:${colorSev(l.sev)}">
        <span class="n">${mmss(l.t)}</span><b>${l.ico || ''} ${l.title}</b>
        ${l.msg ? `<p>${l.msg}</p>` : ''}</div>`).join('')}
    </div>

    <button class="btn btn-primary btn-block big" id="rep-otra">🔄 Nueva simulación</button>
    <div class="spacer"></div>`;
  $('#rep-otra').onclick = () => { S.corriendo = false; ir('inicio'); };
  ir('reporte');
}

function guardarProgreso(score, crits, warns) {
  const p = LS.get('prog', { sesiones: [], errores: {} });
  p.sesiones.push({ f: Date.now(), score, dx: S.pt.dx, caso: S.caso, t: Math.round(S.t) });
  if (p.sesiones.length > 60) p.sesiones = p.sesiones.slice(-60);
  [...crits, ...warns].forEach(([id, e]) => {
    p.errores[id] = { n: (p.errores[id]?.n || 0) + e.n, title: e.title, sev: e.sev };
  });
  LS.set('prog', p);
}
function pintarProgreso() {
  const p = LS.get('prog', { sesiones: [], errores: {} });
  if (!p.sesiones.length) {
    $('#progreso-body').innerHTML = '<p class="log-empty">Todavía no has completado ninguna sesión.<br>Termina una simulación con «Finalizar y evaluar» para ver aquí tu progreso.</p>';
    return;
  }
  const media = Math.round(p.sesiones.reduce((a, s) => a + s.score, 0) / p.sesiones.length);
  const mejor = Math.max(...p.sesiones.map(s => s.score));
  const errs = Object.entries(p.errores).sort((a, b) => b[1].n - a[1].n).slice(0, 10);
  const maxN = errs.length ? errs[0][1].n : 1;
  $('#progreso-body').innerHTML = `
    <div class="prog-hero"><b>${media}</b><span>puntuación media en ${p.sesiones.length} sesión(es) · mejor: ${mejor}</span></div>
    <h3 style="font-size:13px;max-width:620px;margin:16px auto 9px">📉 Tus errores más frecuentes</h3>
    ${errs.map(([id, e]) => `<div class="prog-row" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;gap:8px"><b>${e.sev === 'crit' ? '🚨' : '⚠️'} ${e.title}</b><i>×${e.n}</i></div>
        <div class="prog-bar"><i style="width:${Math.round(e.n / maxN * 100)}%;background:${e.sev === 'crit' ? 'var(--crit)' : 'var(--warn)'}"></i></div>
      </div>`).join('')}
    <h3 style="font-size:13px;max-width:620px;margin:18px auto 9px">🕘 Últimas sesiones</h3>
    ${p.sesiones.slice(-12).reverse().map(s => `<div class="prog-row">
        <b>${DX[s.dx] ? DX[s.dx].ico + ' ' + DX[s.dx].n.split('(')[0].trim() : s.dx}</b>
        <i style="color:${s.score >= 85 ? 'var(--ok)' : s.score >= 60 ? 'var(--warn)' : 'var(--crit)'}">${s.score}</i>
      </div>`).join('')}
    <div class="spacer"></div>`;
}

/* ══════════════════════════════════════════════════════════════
   ARRANQUE Y EVENTOS GLOBALES
══════════════════════════════════════════════════════════════ */
function initEventos() {
  // Navegación
  $$('[data-go]').forEach(b => b.onclick = () => {
    const d = b.dataset.go;
    if (d === 'nuevo') ir('paciente'); else ir(d);
  });
  $$('[data-back]').forEach(b => b.onclick = () => {
    const d = b.dataset.back;
    if (d === 'inicio' && S.corriendo) {
      if (!confirm('¿Salir de la simulación? Se perderá la sesión actual si no la evalúas.')) return;
      S.corriendo = false;
    }
    ir(d);
  });
  $('#btn-iniciar').onclick = () => iniciarSimulacion(null);

  // Apariencia
  const abrir = () => { $('#ajustes').hidden = false; pintarSwatches(); };
  $('#btn-ajustes').onclick = abrir;
  $('#btn-ajustes2').onclick = abrir;
  $('#btn-cerrar-ajustes').onclick = () => { $('#ajustes').hidden = true; };
  $('#ajustes').onclick = e => { if (e.target.id === 'ajustes') $('#ajustes').hidden = true; };
  $('#seg-tema').onclick = e => {
    const b = e.target.closest('[data-tema]'); if (!b) return;
    CFG.tema = b.dataset.tema; aplicarApariencia(); vibrar(20);
  };
  $('#swatches').onclick = e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (temaEfectivo() === 'light') CFG.fondoLight = b.dataset.c; else CFG.fondoDark = b.dataset.c;
    aplicarApariencia(); vibrar(20);
  };
  $('#acentos').onclick = e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    CFG.acento = b.dataset.a; aplicarApariencia(); vibrar(20);
  };
  $('#color-custom').oninput = e => {
    if (temaEfectivo() === 'light') CFG.fondoLight = e.target.value; else CFG.fondoDark = e.target.value;
    aplicarApariencia();
  };
  $('#cfg-sonido').onchange = e => { CFG.sonido = e.target.checked; LS.set('cfg', CFG); };
  $('#cfg-vibrar').onchange = e => { CFG.vibrar = e.target.checked; LS.set('cfg', CFG); };
  $('#seg-velocidad').onclick = e => {
    const b = e.target.closest('[data-vel]'); if (!b) return;
    CFG.velocidad = +b.dataset.vel; aplicarApariencia();
  };
  $('#btn-reset-tema').onclick = () => {
    CFG.tema = 'dark'; CFG.fondoDark = '#0b0f1a'; CFG.fondoLight = '#eef1f6';
    CFG.acento = '#d9b44a'; aplicarApariencia();
  };
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (CFG.tema === 'auto') aplicarApariencia();
  });

  // Ventilador
  $$('.ctab').forEach(t => t.onclick = () => {
    $$('.ctab').forEach(x => x.classList.remove('active'));
    $$('.ctl-pane').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $('#pane-' + t.dataset.tab).classList.add('active');
    if (t.dataset.tab === 'registro') pintarLog();
  });
  $$('.wtab[data-wave]').forEach(t => t.onclick = () => {
    $$('.wtab[data-wave]').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    ['curvas', 'bucles', 'tendencia'].forEach(w => {
      $('#wave-' + w).hidden = (w !== t.dataset.wave);
    });
    setTimeout(() => { redimensionarCurvas(); pintarCurvas(); }, 40);
  });
  $('#btn-freeze').onclick = e => {
    S.congelado = !S.congelado;
    e.currentTarget.classList.toggle('on', S.congelado);
  };

  // Plegar / desplegar para dejar sitio a los controles
  $('#fold-curvas').onclick = () => { plegar('curvas'); vibrar(18); };
  $('#fold-datos').onclick = () => { plegar('datos'); vibrar(18); };
  $('#btn-gaso-mini').onclick = mostrarGaso;
  $('#btn-espacio').onclick = () => {
    const abierto = !$('#vent-screen').classList.contains('closed')
                 || !$('#sec-datos').classList.contains('closed');
    plegar('curvas', abierto); plegar('datos', abierto);
    vibrar(25);
    if (abierto) notificar({
      sev: 'info', ico: '⤢', k: 'var(--cian)', title: 'Modo controles',
      msg: 'Curvas y valores medidos plegados: ahora tienes toda la pantalla para los modos y los parámetros. Los datos clave siguen asomándose en las barras.',
      why: '', fix: 'Vuelve a pulsar ⤢ para desplegarlo todo, o toca cada barra por separado.'
    }, 'modo_controles');
  };
  $('#btn-mute').onclick = e => {
    S.mute = S.mute > S.t ? 0 : S.t + 120;
    e.currentTarget.classList.toggle('muted', S.mute > S.t);
  };
  $('#btn-gaso').onclick = mostrarGaso;
  $('#opt-autoflow').onchange = e => {
    S.autoflow = e.target.checked;
    if (S.autoflow) notificar({ sev: 'info', ico: '🌬️', k: 'var(--cian)', title: 'AutoFlow activado',
      msg: 'El equipo entregará el volumen programado con la mínima presión posible, usando flujo desacelerado.',
      why: 'AutoFlow mide la distensibilidad respiración a respiración y ajusta automáticamente la presión inspiratoria. Baja la presión pico y mejora la sincronía, pero el volumen sigue siendo el que tú programes: no protege por sí solo.',
      fix: 'Sigue vigilando la presión meseta y el volumen por kg de peso predicho.' }, 'autoflow');
    renderParams();
  };
  $('#opt-asb').onchange = e => { S.asbOn = e.target.checked; renderParams(); };
  $('#btn-finalizar').onclick = finalizarSesion;

  // Modal
  $('#modal-x').onclick = cerrarModal;
  $('#modal-ok').onclick = cerrarModal;
  $('#modal').onclick = e => { if (e.target.id === 'modal') cerrarModal(); };

  // Progreso
  $('#btn-borrar-prog').onclick = () => {
    if (confirm('¿Borrar todo tu historial de sesiones?')) { LS.del('prog'); pintarProgreso(); }
  };

  // Compartir informe
  $('#btn-compartir').onclick = async () => {
    const txt = $('#reporte-body').innerText.slice(0, 3000);
    try {
      if (navigator.share) await navigator.share({ title: 'Simulación Evita 4', text: txt });
      else { await navigator.clipboard.writeText(txt); alert('Informe copiado al portapapeles.'); }
    } catch (e) {}
  };

  // Al tocar los controles, las notificaciones antiguas se apartan
  $('.ctl-body').addEventListener('pointerdown', () => {
    const vivos = $$('#toasts .toast:not(.out)');
    vivos.slice(0, -1).forEach(cerrarToast);
  }, true);

  window.addEventListener('resize', () => { redimensionarCurvas(); pintarCurvas(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ultimoT = performance.now(); });
}

/* ─────────── Instalación PWA ─────────── */
let promptInstalar = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); promptInstalar = e;
  const b = $('#btn-instalar'); if (b) b.hidden = false;
});
window.addEventListener('appinstalled', () => {
  const b = $('#btn-instalar'); if (b) b.hidden = true; promptInstalar = null;
});

/* ─────────── Arranque ─────────── */
document.addEventListener('DOMContentLoaded', () => {
  aplicarApariencia();
  initFormPaciente();
  initEventos();

  $('#btn-instalar').onclick = async () => {
    if (!promptInstalar) {
      modal('⬇︎ Instalar la aplicación', `
        <p>Esta aplicación funciona sin conexión y puede instalarse en el móvil como una app normal.</p>
        <h4>Android · Chrome</h4><p>Menú ⋮ → <b>Añadir a pantalla de inicio</b> / <b>Instalar aplicación</b>.</p>
        <h4>iPhone · Safari</h4><p>Botón Compartir ⇪ → <b>Añadir a pantalla de inicio</b>.</p>
        <h4>Escritorio</h4><p>Icono de instalación en la barra de direcciones.</p>`);
      return;
    }
    promptInstalar.prompt(); await promptInstalar.userChoice;
    promptInstalar = null; $('#btn-instalar').hidden = true;
  };

  const chk = $('#chk-disclaimer'), btn = $('#btn-disclaimer');
  chk.onchange = () => { btn.disabled = !chk.checked; };
  btn.onclick = () => { $('#disclaimer').hidden = true; LS.set('aviso', 1); };

  // El aviso legal espera a que se haya superado la puerta de activación,
  // para no apilar dos pantallas encima de la otra en el primer arranque
  const mostrarAviso = () => { if (!LS.get('aviso', 0)) $('#disclaimer').hidden = false; };
  // Si la puerta no llegó a mostrarse (ya activado, dentro de MS360, o
  // activacion.js no cargó) el aviso sale igualmente: nunca se salta.
  const puertaAbierta = () => { const g = $('#gate'); return !g || g.hidden; };
  setTimeout(() => {
    $('#splash').classList.add('gone');
    if (window.__evita4Activado || puertaAbierta()) mostrarAviso();
    else document.addEventListener('evita4:activado', mostrarAviso, { once: true });
  }, 1700);

  // Service worker: al activarse una versión nueva se recarga una sola vez,
  // para que las actualizaciones lleguen al primer intento y no al segundo
  if ('serviceWorker' in navigator) {
    let recargando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recargando) return;
      recargando = true;
      location.reload();
    });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          reg.update();
          setInterval(() => reg.update(), 60 * 60 * 1000);
        })
        .catch(() => {});
    });
  }
});
