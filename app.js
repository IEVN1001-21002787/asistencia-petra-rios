
/* ---------------- Estado y utilidades ---------------- */
const S = { ini: null, vista: 'hoy', lista: null, ficha: null, busq: { q: '', grupo: '', bajas: false } };
const $ = (s) => document.querySelector(s);
const ESTADOS = { P: 'Presente', F: 'Falta', R: 'Retardo', J: 'Justificada', S: 'Salió' };
const MOTIVOS_SALIDA = ['Médico', 'Familiar', 'Enfermedad en la escuela', 'Trámite', 'Otro'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function esc(s) {
  return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
async function api(fn, ...args) {
  let r;
  try {
    r = await fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ accion: fn, args: args, token: SES.token }) });
  } catch (x) {
    const e = new Error('Sin conexión a internet.'); e.red = true; throw e;
  }
  let j;
  try { j = await r.json(); } catch (x) { const e = new Error('El servidor no respondió bien. Intenta de nuevo.'); e.red = true; throw e; }
  if (!j.ok) {
    const e = new Error(j.error || 'Error desconocido'); e.codigo = j.codigo;
    if (j.codigo === 'SESION') sesionExpirada();
    throw e;
  }
  return j.data;
}
let toastT = null;
function toast(msg, tipo) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast' + (tipo === 'err' ? ' err' : '');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), tipo === 'err' ? 6000 : 3500);
}
function error(e) { toast((e && e.message) ? e.message.replace(/^Error:\s*/, '') : String(e), 'err'); }
function puede(p) { return S.ini && S.ini.permisos.indexOf(p) >= 0; }
function fF(f) { if (!f) return ''; const p = f.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function fC(f) { if (!f) return ''; const p = f.split('-'); return p[2] + '/' + p[1]; }
function dia(f) { const p = f.split('-').map(Number); return DIAS[new Date(p[0], p[1] - 1, p[2]).getDay()]; }
function horaAhora() { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
function cargando() { $('#main').innerHTML = '<div class="cargando">Cargando…</div>'; }
function opcionesGrupo(sel, vacio) {
  return (vacio ? '<option value="">' + esc(vacio) + '</option>' : '') +
    S.ini.grupos.map((g) => '<option' + (g === sel ? ' selected' : '') + '>' + esc(g) + '</option>').join('');
}
function badge(v, txt) { return '<span class="badge b-' + esc(v) + '">' + esc(txt || v) + '</span>'; }
function quincena(f, desplaz) {
  const p = f.split('-').map(Number);
  const idx = (p[0] * 12 + (p[1] - 1)) * 2 + (p[2] <= 15 ? 0 : 1) + (desplaz || 0);
  const y = Math.floor(idx / 24), m = Math.floor((idx % 24) / 2), h = idx % 2;
  const n = (x) => String(x).padStart(2, '0');
  const ultimo = new Date(y, m + 1, 0).getDate();
  return h === 0 ? [y + '-' + n(m + 1) + '-01', y + '-' + n(m + 1) + '-15'] : [y + '-' + n(m + 1) + '-16', y + '-' + n(m + 1) + '-' + n(ultimo)];
}
function modal(html) { $('#modalBody').innerHTML = html; $('#modal').classList.remove('hidden'); }
function cerrar() { $('#modal').classList.add('hidden'); $('#modalBody').innerHTML = ''; }
function imprimir(html) { $('#print').innerHTML = html; setTimeout(() => window.print(), 300); }
function encabezadoDoc() {
  const c = S.ini.config;
  return '<div style="text-align:center"><img src="logo.png" alt="" style="width:110px;height:auto;display:block;margin:0 auto 6px"><b style="font-size:15px">' + esc(c.escuela) + '</b><br>' +
    (c.cct ? 'CCT ' + esc(c.cct) + ' · ' : '') + esc(c.municipio) + ' · Ciclo ' + esc(c.ciclo) + '</div>';
}

const ICONOS = {
  hoy: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  lista: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',
  salidas: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  alumnos: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  alertas: 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  reportes: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  mas: 'M12 5v14M5 12h14',
};
function svg(nombre, tam, color) {
  return '<svg width="' + (tam || 20) + '" height="' + (tam || 20) + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') +
    '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICONOS[nombre] + '"/></svg>';
}
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_L = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
function fechaLarga(f) {
  const p = f.split('-').map(Number);
  return DIAS_L[new Date(p[0], p[1] - 1, p[2]).getDay()] + ' ' + p[2] + ' de ' + MESES[p[1] - 1];
}
function cab(sobre, titulo, extra) {
  $('#sobre').textContent = sobre || '';
  $('#titulo').textContent = titulo || '';
  $('#cabExtra').innerHTML = extra || '';
}
function iniciales(nombre) {
  const p = String(nombre || '').trim().split(/\s+/);
  return ((p[0] || '')[0] || '') + ((p[2] || p[1] || '')[0] || '');
}
function menuCuenta() {
  const u = S.ini.usuario;
  modal('<h2>' + esc(u.nombre) + '</h2><div class="tenue">' + esc(SES.email) + ' · ' + esc(u.rol.replace('_', ' ').toLowerCase()) + '</div>' +
    '<div class="tenue" style="margin-top:6px">Ciclo ' + esc(S.ini.config.ciclo) + ' · ' + esc(S.ini.config.escuela) + '</div>' +
    '<div class="acciones"><button onclick="cerrar()">Cerrar</button><button class="peligro" onclick="cerrarSesion()">Cerrar sesión</button></div>');
}

/* ---------------- Cola sin internet ---------------- */
function cola() { try { return JSON.parse(localStorage.getItem('colaAsistencia') || '[]'); } catch (e) { return []; } }
function guardarCola(c) { try { localStorage.setItem('colaAsistencia', JSON.stringify(c)); } catch (e) {} banner(); }
function encolar(fn, args) { const c = cola(); c.push({ fn: fn, args: args, t: Date.now() }); guardarCola(c); }
function banner() {
  const n = cola().length, b = $('#banner');
  if (!navigator.onLine) { b.textContent = 'Sin internet. Lo que guardes se enviará al volver la señal.' + (n ? ' Pendientes: ' + n : ''); b.classList.remove('hidden'); }
  else if (n) { b.textContent = 'Enviando ' + n + ' registro(s) guardados sin internet…'; b.classList.remove('hidden'); }
  else b.classList.add('hidden');
}
async function vaciarCola() {
  const c = cola(); if (!c.length || !navigator.onLine) { banner(); return; }
  const resto = [];
  for (const x of c) {
    try { await api(x.fn, ...x.args); }
    catch (e) { if (e.red || e.codigo === 'SESION') resto.push(x); else toast('No se pudo guardar un registro: ' + e.message, 'err'); }
  }
  guardarCola(resto);
  if (c.length > resto.length) toast('Se enviaron ' + (c.length - resto.length) + ' registro(s) guardados sin internet.');
  if (resto.length) toast('No se pudieron enviar ' + resto.length + ' registro(s). Se reintentará.', 'err');
}
window.addEventListener('online', vaciarCola);
window.addEventListener('offline', banner);

/* ---------------- Navegación ---------------- */
const VISTAS = [
  { id: 'hoy', t: 'Hoy', p: 'ver' }, { id: 'lista', t: 'Lista', p: 'lista' }, { id: 'salidas', t: 'Salidas', p: 'salidas' },
  { id: 'alumnos', t: 'Alumnos', p: 'ver' }, { id: 'alertas', t: 'Alertas', p: 'ver' }, { id: 'reportes', t: 'Reportes', p: 'ver' },
];
function pintarNav() {
  $('#nav').innerHTML = VISTAS.filter((v) => puede(v.p))
    .map((v) => '<button id="nav-' + v.id + '" onclick="ir(\'' + v.id + '\')"><span class="ico">' + svg(v.id) + '</span>' + v.t + '</button>').join('');
}
function ir(v, arg) {
  S.vista = v;
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b.id === 'nav-' + v));
  window.scrollTo(0, 0);
  const t = { hoy: 'Hoy', lista: 'Pasar lista', salidas: 'Salidas', alumnos: 'Alumnos', alertas: 'Alertas', reportes: 'Reportes' };
  cab(fechaLarga(S.ini.hoy), t[v]);
  ({ hoy: vHoy, lista: vLista, salidas: vSalidas, alumnos: vAlumnos, alertas: vAlertas, reportes: vReportes }[v])(arg);
}

/* ---------------- Selector de alumno ---------------- */
let buscT = null;
function selectorAlumno(onPick, conBajas) {
  window._onPick = onPick;
  return '<label>Buscar alumno por nombre o apellido</label>' +
    '<input id="selQ" autocomplete="off" placeholder="Ej. garcia lopez" oninput="buscarSel(this.value,' + (conBajas ? 'true' : 'false') + ')">' +
    '<div id="selRes"></div>';
}
function buscarSel(q, bajas) {
  clearTimeout(buscT);
  if (q.trim().length < 2) { $('#selRes').innerHTML = ''; return; }
  buscT = setTimeout(async () => {
    try {
      let r;
      try { r = await api('apiBuscarAlumnos', q, '', bajas); }
      catch (e) { if (!e.red) throw e; r = buscarLocal(q); }
      $('#selRes').innerHTML = r.length ? r.map((a) =>
        '<div class="res" onclick="_onPick(\'' + esc(a.id) + '\',\'' + esc(a.nombre.replace(/['\\]/g, '')) + '\',\'' + esc(a.grupo) + '\')"><b>' +
        esc(a.nombre) + '</b> <span class="tenue">' + esc(a.grupo) + '</span></div>').join('')
        : '<div class="tenue" style="padding:8px">Sin resultados</div>';
    } catch (e) { error(e); }
  }, 300);
}

/* ---------------- Vista: Hoy ---------------- */
async function vHoy() {
  cargando();
  try {
    const d = await api('apiHoy', S.ini.hoy);
    const c = S.ini.config;
    cab(fechaLarga(d.fecha), 'Hoy', '<div class="stats">' +
      '<div class="stat"><b class="mal">' + d.faltas.length + '</b><span>Faltas</span></div>' +
      '<div class="stat"><b class="amb">' + d.retardos.length + '</b><span>Retardos</span></div>' +
      '<div class="stat"><b style="color:var(--azul)">' + d.salidas.length + '</b><span>Salidas</span></div></div>');
    let h = '';
    if (!d.habil) h += '<div class="aviso">Hoy está marcado como día sin clase.</div>';
    if (puede('lista') && d.habil) h += '<button class="oro ancho grande" onclick="formRetardo()">' + svg('reloj', 22) + 'Registrar llegada tarde</button>';
    const conLista = d.grupos.filter((g) => g.pasada).length;
    h += '<div class="seccion"><h3>Grupos</h3><span class="tenue" style="font-weight:600">' + conLista + ' de ' + d.grupos.length + ' con lista</span></div>';
    h += '<div class="grid">' + d.grupos.map((g) =>
      '<div class="grupo' + (g.pasada ? '' : ' pendiente') + '" onclick="' + (puede('lista') ? 'ir(\'lista\',\'' + esc(g.grupo) + '\')' : '') + '">' +
      '<div class="fila"><b class="crece">' + esc(g.grupo) + '</b><span class="marca">' + (g.pasada ? '✓' : '!') + '</span></div>' +
      '<span class="det">' + (g.pasada ? 'F ' + g.F + ' · R ' + g.R + (g.S ? ' · S ' + g.S : '') : 'Sin lista') + '</span></div>').join('') + '</div>';
    h += '<div class="tenue" style="margin-top:10px">Cierre de puerta ' + esc(c.horaCierre) + ' · retardo desde ' + esc(c.horaRetardo) + '</div>';
    const movs = [].concat(
      d.salidas.map((a) => ({ a: a, tipo: 'S', txt: 'Salió ' + a.horaSalida })),
      d.retardos.map((a) => ({ a: a, tipo: 'R', txt: 'Llegó ' + a.hora + (a.comentario ? ' · ' + a.comentario : '') })),
      d.faltas.map((a) => ({ a: a, tipo: 'F', txt: 'Falta' + (a.comentario ? ' · ' + a.comentario : '') })));
    const ico = { S: 'salidas', R: 'reloj', F: 'alertas' };
    h += '<div class="seccion"><h3>Movimientos de hoy</h3></div>';
    h += movs.length ? '<div class="card" style="padding:2px 14px">' + movs.map((m) =>
      '<div class="mov" onclick="vFicha(\'' + esc(m.a.id) + '\')"><span class="circ ' + m.tipo + '">' + svg(ico[m.tipo], 18) + '</span>' +
      '<div class="t"><b>' + esc(m.a.nombre) + ' · ' + esc(m.a.grupo) + '</b><span>' + esc(m.txt) + '</span></div></div>').join('') + '</div>'
      : '<div class="tenue">Todavía no hay faltas, retardos ni salidas hoy.</div>';
    $('#main').innerHTML = h;
  } catch (e) { errVista(e); }
}

function formRetardo() {
  modal('<h2>Llegada tarde</h2><div class="aviso info">Nunca se niega la entrada. Se registra la hora y se agrega una llamada pendiente a los padres.</div>' +
    '<div id="paso">' + selectorAlumno((id, nombre, grupo) => {
      $('#paso').innerHTML = '<div class="card"><b>' + esc(nombre) + '</b> <span class="tenue">' + esc(grupo) + '</span></div>' +
        '<label>Hora de llegada</label><input id="rHora" type="time" value="' + horaAhora() + '">' +
        '<label>Comentario (qué dijo el alumno)</label><textarea id="rCom" rows="2"></textarea>' +
        '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="rBtn" onclick="guardarRetardo(\'' + esc(id) + '\')">Guardar retardo</button></div>';
    }) + '</div>');
  setTimeout(() => $('#selQ') && $('#selQ').focus(), 100);
}
async function guardarRetardo(id) {
  const b = $('#rBtn'); b.disabled = true;
  const hora = $('#rHora').value, com = $('#rCom').value;
  const enCola = () => {
    encolar('apiRetardo', [id, hora, com, { fecha: S.ini.hoy, sinConexion: true }]);
    marcarLocal(id, S.ini.hoy, { estado: 'R', hora: hora });
    cerrar(); toast('Sin internet: el retardo quedó guardado en el celular y se enviará al volver la señal.');
    if (S.vista === 'lista') vLista();
  };
  if (!navigator.onLine) return enCola();
  try {
    const r = await api('apiRetardo', id, hora, com);
    cerrar(); toast('Retardo registrado: ' + r.nombre + ' a las ' + r.hora);
    if (S.vista === 'hoy') vHoy(); else if (S.vista === 'lista') vLista();
  } catch (e) { if (e.red) return enCola(); b.disabled = false; error(e); }
}

/* ---------------- Vista: Lista ---------------- */
async function vLista(grupo) {
  if (grupo) S.listaGrupo = grupo;
  S.listaGrupo = S.listaGrupo || S.ini.grupos[0];
  S.listaFecha = S.listaFecha || S.ini.hoy;
  cargando();
  try {
    let d;
    try { d = await api('apiLista', S.listaGrupo, S.listaFecha); guardarListaLocal(d); }
    catch (e) {
      d = e.red ? (listaLocal(S.listaGrupo, S.listaFecha) || listaDesdeAlumnos(S.listaGrupo, S.listaFecha)) : null;
      if (!d) throw e;
      toast('Sin internet: puedes pasar lista; se enviará al volver la señal.');
    }
    S.lista = d;
    cab('Pasar lista · ' + fechaLarga(d.fecha), 'Grupo ' + d.grupo, '<div class="chips">' + S.ini.grupos.map((g) =>
      '<button class="chip-g' + (g === d.grupo ? ' on' : '') + '" onclick="vLista(\'' + esc(g) + '\')">' + esc(g) + '</button>').join('') + '</div>');
    let h = '';
    if (puede('corregirPasado')) h += '<div class="fila" style="margin-bottom:10px"><label class="crece" style="margin:0">Fecha de la lista</label>' +
      '<input type="date" style="width:auto" value="' + d.fecha + '" max="' + S.ini.hoy + '" onchange="S.listaFecha=this.value;vLista()"></div>';
    if (!d.habil) h += '<div class="aviso">Este día no hay clases' + motivoSinClase(d.fecha) + '.</div>';
    else if (d.pasada) h += '<div class="aviso info">La lista de este día ya está registrada. Puedes corregirla y volver a guardar.</div>';
    if (d.fecha !== S.ini.hoy) h += '<div class="aviso">Estás corrigiendo un día anterior. El cambio queda registrado.</div>';
    if (d.editable && d.habil) h += '<div class="fila" style="margin-bottom:10px"><span class="crece tenue">Todos inician presentes. Toca solo F o R.</span><button class="chico" onclick="todosPresentes()">Todos ✓</button></div>';
    h += '<div class="lista-card">' + d.alumnos.map((a, i) => filaAlumno(a, i, d.editable && d.habil)).join('') + '</div>';
    if (!d.alumnos.length) h += '<div class="tenue">Este grupo no tiene alumnos activos.</div>';
    h += '<div style="height:70px"></div>';
    $('#main').innerHTML = h + '<div class="pie" id="pieLista"></div>';
    pintarPie();
  } catch (e) { errVista(e); }
}
function filaAlumno(a, i, editable) {
  let ctl;
  if (a.estado === 'J') ctl = badge('J', 'Justificada');
  else if (a.estado === 'S') ctl = badge('S', 'Salió');
  else if (!editable) ctl = badge(a.estado, ESTADOS[a.estado]);
  else ctl = '<div class="seg">' + ['P', 'F', 'R'].map((e) =>
    '<button class="' + (a.estado === e ? 'on-' + e : '') + '" aria-label="' + ESTADOS[e] + '" onclick="setEstado(' + i + ',\'' + e + '\')">' + (e === 'P' ? '✓' : e) + '</button>').join('') + '</div>';
  let nota = ESTADOS[a.estado];
  if (a.estado === 'R') nota = 'Llegó ' + (a.hora || 'tarde') + ' · llamar a padres';
  if (a.estado === 'S') nota = 'Salió ' + (a.horaSalida || '');
  if (a.estado === 'J') nota = 'Falta justificada';
  if (a.comentario) nota += ' · ' + a.comentario;
  return '<div class="alumno" id="al-' + i + '"><span class="ini ' + a.estado + '">' + esc(iniciales(a.nombre).toUpperCase()) + '</span>' +
    '<span class="nom"><b>' + esc(a.nombre) + '</b><span class="' + a.estado + '">' + esc(nota) + '</span></span>' +
    (editable && a.estado !== 'J' && a.estado !== 'S' ? '<button class="nota" aria-label="Agregar comentario" onclick="comentar(' + i + ')">✎</button>' : '') + ctl + '</div>';
}
function setEstado(i, e) {
  S.lista.alumnos[i].estado = e;
  $('#al-' + i).outerHTML = filaAlumno(S.lista.alumnos[i], i, true);
  pintarPie();
}
function todosPresentes() {
  S.lista.alumnos.forEach((a) => { if (a.estado !== 'J' && a.estado !== 'S') a.estado = 'P'; });
  vListaRepintar();
}
function vListaRepintar() { S.lista.alumnos.forEach((a, i) => { const el = $('#al-' + i); if (el) el.outerHTML = filaAlumno(a, i, true); }); pintarPie(); }
function comentar(i) {
  const a = S.lista.alumnos[i];
  modal('<h2>Comentario</h2><div class="tenue">' + esc(a.nombre) + '</div><textarea id="cTxt" rows="3">' + esc(a.comentario) + '</textarea>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" onclick="S.lista.alumnos[' + i + '].comentario=$(\'#cTxt\').value;cerrar();vListaRepintar()">Listo</button></div>');
}
function pintarPie() {
  const d = S.lista, t = { P: 0, F: 0, R: 0, J: 0, S: 0 };
  d.alumnos.forEach((a) => t[a.estado]++);
  const puedeGuardar = d.editable && d.habil && d.alumnos.length;
  $('#pieLista').innerHTML = '<div class="fila"><span class="crece cuenta"><span class="ok">✓ ' + t.P + '</span><span class="mal">F ' + t.F +
    '</span><span class="amb">R ' + t.R + '</span>' + (t.J ? '<span style="color:var(--morado)">J ' + t.J + '</span>' : '') + (t.S ? '<span style="color:var(--azul)">S ' + t.S + '</span>' : '') + '</span>' +
    (puedeGuardar ? '<button class="prim grande" id="gBtn" onclick="guardarLista()">Guardar lista</button>' : '') + '</div>';
}
async function guardarLista() {
  const d = S.lista;
  const items = d.alumnos.filter((a) => a.estado !== 'J' && a.estado !== 'S')
    .map((a) => ({ id: a.id, estado: a.estado, comentario: a.comentario, hora: a.hora }));
  if (!navigator.onLine) {
    encolar('apiGuardarLista', [d.grupo, d.fecha, items, { sinConexion: true }]);
    d.pasada = true; guardarListaLocal(d);
    toast('Sin internet: la lista quedó guardada en el celular y se enviará al volver la señal.');
    return;
  }
  const b = $('#gBtn'); b.disabled = true; b.textContent = 'Guardando…';
  try {
    const r = await api('apiGuardarLista', d.grupo, d.fecha, items);
    toast('Lista de ' + d.grupo + ' guardada.' + (r.retardos ? ' ' + r.retardos + ' retardo(s) pasaron a llamadas pendientes.' : ''));
    vLista();
  } catch (e) {
    if (e.red) {
      encolar('apiGuardarLista', [d.grupo, d.fecha, items, { sinConexion: true }]);
      d.pasada = true; guardarListaLocal(d);
      toast('Se perdió la conexión. La lista se enviará al volver la señal.');
    } else error(e);
    b.disabled = false; b.textContent = 'Guardar lista';
  }
}

/* ---------------- Vista: Salidas ---------------- */
async function vSalidas() {
  cargando();
  try {
    const arr = await api('apiSalidas', S.ini.hoy);
    cab(fechaLarga(S.ini.hoy), 'Salidas', '<div class="stats"><div class="stat"><b style="color:var(--azul)">' + arr.filter((x) => x.estatus === 'COMPLETADA').length +
      '</b><span>Completadas</span></div><div class="stat"><b class="amb">' + arr.filter((x) => x.estatus !== 'COMPLETADA').length +
      '</b><span>Por aprobar</span></div><div class="stat"><b>' + arr.length + '</b><span>Total</span></div></div>');
    let h = '';
    if (puede('salidas') && S.ini.habilHoy) h += '<button class="oro ancho grande" style="margin-bottom:14px" onclick="nuevaSalida()">' + svg('mas', 22) + 'Nueva salida</button>';
    h += arr.length ? arr.map(tarjetaSalida).join('') : '<div class="tenue">No hay salidas registradas hoy.</div>';
    $('#main').innerHTML = h;
  } catch (e) { errVista(e); }
}
function tarjetaSalida(s) {
  return '<div class="card"><div class="fila"><span class="ini" style="background:var(--azul-suave);color:var(--azul)">' + esc(s.hora) + '</span><b class="crece">' + esc(s.nombre) + '</b>' +
    badge(s.estatus, s.estatus === 'COMPLETADA' ? 'Completada' : 'Pendiente de aprobación') + '</div>' +
    '<div class="tenue">' + esc(s.grupo) + ' · ' + (s.fecha !== S.ini.hoy ? fF(s.fecha) + ' · ' : '') + 'Recoge: ' + esc(s.recoge) + (s.parentesco ? ' (' + esc(s.parentesco) + ')' : '') +
    (s.autorizado === 'NO' ? ' · <span class="mal">no estaba autorizado</span>' : '') + '</div>' +
    '<div class="tenue">Motivo: ' + esc(s.motivo) + (s.detalle ? ' · ' + esc(s.detalle) : '') + '</div>' +
    '<div class="acciones"><button class="chico" onclick="imprimirComprobante(\'' + esc(s.id) + '\')">Comprobante</button>' +
    (s.estatus === 'PENDIENTE_APROBACION' && puede('aprobarSalida') ? '<button class="chico prim" onclick="aprobarSalida(\'' + esc(s.id) + '\')">Aprobar salida</button>' : '') +
    '</div></div>';
}
function nuevaSalida(pre) {
  if (pre) { modal('<h2>Nueva salida</h2><div id="paso"></div>'); pasoSalida(pre.id, pre.nombre, pre.grupo); return; }
  modal('<h2>Nueva salida</h2><div id="paso">' + selectorAlumno(pasoSalida) + '</div>');
  setTimeout(() => $('#selQ') && $('#selQ').focus(), 100);
}
let FIRMA = null;
async function pasoSalida(id, nombre, grupo) {
  $('#paso').innerHTML = '<div class="cargando">Cargando contactos…</div>';
  try {
    let f;
    try { f = await api('apiAlumno', id); }
    catch (e) {
      if (!e.red) throw e;
      f = { alumno: { id: id, nombre: nombre, grupo: grupo }, contactos: contactosLocal(id) };
      toast('Sin internet: la salida se guardará en el celular y se enviará al volver la señal.');
    }
    const cs = f.contactos.slice().sort((a, b) => (b.autorizado === 'SI') - (a.autorizado === 'SI'));
    const aviso = puede('aprobarSalida') ? 'Esta persona no está autorizada. Al guardar, la salida queda aprobada por ti.'
      : 'Esta persona no está autorizada. La salida quedará pendiente hasta que el director o la subdirectora la aprueben.';
    $('#paso').innerHTML = '<div class="fila" style="background:var(--fondo);border-radius:14px;padding:10px 12px"><span class="ini">' + esc(iniciales(f.alumno.nombre).toUpperCase()) + '</span>' +
      '<span class="crece"><b>' + esc(f.alumno.nombre) + '</b><br><span class="tenue">Grupo ' + esc(f.alumno.grupo) + '</span></span></div>' +
      '<span class="etiq">¿Quién recoge?</span>' +
      cs.map((c) => '<label class="opcion"><input type="radio" name="rec" value="' + esc(c.id) + '" data-aut="' + esc(c.autorizado) + '" onchange="cambioRecoge()">' +
        '<span class="crece"><b>' + esc(c.nombre) + '</b><span class="tenue">' + esc(c.parentesco) + (c.autorizado === 'SI' ? '' : ' · requiere aprobación de dirección') + '</span></span>' +
        (c.autorizado === 'SI' ? badge('SI', 'Autorizado') : badge('F', 'No autorizado')) + '</label>').join('') +
      '<label class="opcion"><input type="radio" name="rec" value="" data-aut="NO" onchange="cambioRecoge()"><span class="crece"><b>Otra persona</b></span></label>' +
      '<div id="otra" class="hidden"><label>Nombre completo</label><input id="sNom"><label>Parentesco</label><input id="sPar" placeholder="Ej. tío, abuela, vecino"></div>' +
      '<div id="sAviso" class="aviso hidden">' + esc(aviso) + '</div>' +
      '<span class="etiq">Motivo</span><input type="hidden" id="sMot" value=""><div class="pastillas">' + MOTIVOS_SALIDA.map((m) =>
        '<button type="button" class="pastilla" onclick="elegirMotivo(this,\'' + m + '\')">' + m + '</button>').join('') + '</div>' +
      '<label>Detalle (opcional)</label><input id="sDet">' +
      '<label>Hora de salida</label><input id="sHora" type="time" value="' + horaAhora() + '">' +
      '<div class="fila"><span class="etiq crece">Firma de quien recoge</span><button class="chico" style="border:0" onclick="FIRMA.limpiar()">Borrar</button></div>' +
      '<canvas class="firma" id="sFirma"></canvas>' +
      '<div class="acciones" style="margin-top:16px"><button onclick="cerrar()">Cancelar</button><button class="prim grande" style="flex:1" id="sBtn" onclick="guardarSalida(\'' + esc(id) + '\')">Guardar salida</button></div>';
    FIRMA = iniciarFirma($('#sFirma'));
  } catch (e) { error(e); cerrar(); }
}
function elegirMotivo(btn, m) {
  document.querySelectorAll('.pastilla').forEach((b) => b.classList.toggle('on', b === btn));
  $('#sMot').value = m;
}
function cambioRecoge() {
  const r = document.querySelector('input[name=rec]:checked');
  $('#otra').classList.toggle('hidden', !(r && r.value === ''));
  $('#sAviso').classList.toggle('hidden', !(r && r.dataset.aut !== 'SI'));
}
function iniciarFirma(cv) {
  const ctx = cv.getContext('2d');
  cv.width = cv.clientWidth || 320; cv.height = cv.clientHeight || 160;
  ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#111';
  let dib = false, vacio = true, ult = null;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  cv.addEventListener('pointerdown', (e) => { dib = true; ult = pos(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
  cv.addEventListener('pointermove', (e) => {
    if (!dib) return; const p = pos(e);
    ctx.beginPath(); ctx.moveTo(ult.x, ult.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ult = p; vacio = false; e.preventDefault();
  });
  ['pointerup', 'pointercancel'].forEach((t) => cv.addEventListener(t, () => { dib = false; }));
  return {
    vacia: () => vacio,
    limpiar: () => { ctx.clearRect(0, 0, cv.width, cv.height); vacio = true; },
    imagen: () => {
      const w = Math.min(cv.width, 480), h = Math.round(cv.height * w / cv.width);
      const c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
      const x = c2.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(cv, 0, 0, w, h);
      let d = c2.toDataURL('image/png');
      if (d.length > 45000) d = c2.toDataURL('image/jpeg', 0.6);
      if (d.length > 45000) d = c2.toDataURL('image/jpeg', 0.35);
      return d;
    },
  };
}
async function guardarSalida(id) {
  const r = document.querySelector('input[name=rec]:checked');
  if (!r) return toast('Selecciona quién recoge.', 'err');
  if (r.value === '' && !$('#sNom').value.trim()) return toast('Escribe el nombre de quien recoge.', 'err');
  if (!$('#sMot').value) return toast('Selecciona el motivo.', 'err');
  if (FIRMA.vacia()) return toast('Falta la firma de quien recoge.', 'err');
  const b = $('#sBtn'); b.disabled = true; b.textContent = 'Guardando…';
  const datos = { idAlumno: id, idContacto: r.value, recoge: r.value ? '' : $('#sNom').value,
    parentesco: r.value ? '' : $('#sPar').value, motivo: $('#sMot').value, detalle: $('#sDet').value, hora: $('#sHora').value, firma: FIRMA.imagen() };
  const enCola = () => {
    encolar('apiRegistrarSalida', [Object.assign({}, datos, { fecha: S.ini.hoy, sinConexion: true })]);
    if (r.dataset.aut === 'SI') marcarLocal(id, S.ini.hoy, { estado: 'S', horaSalida: datos.hora });
    modal('<h2>Salida guardada en el celular</h2><div class="aviso">No hay internet. La salida y la firma se enviarán solas al volver la señal.' +
      (r.dataset.aut === 'SI' ? '' : ' Como quien recoge no está autorizado, dirección deberá aprobarla después.') + '</div>' +
      '<div class="acciones"><button class="prim" onclick="cerrar();refrescar()">Listo</button></div>');
  };
  if (!navigator.onLine) return enCola();
  try {
    const res = await api('apiRegistrarSalida', datos);
    modal('<h2>' + (res.estatus === 'COMPLETADA' ? 'Salida registrada' : 'Salida pendiente de aprobación') + '</h2>' +
      (res.estatus === 'COMPLETADA' ? '<div class="aviso info">La lista del día ya muestra que el alumno salió.</div>' :
        '<div class="aviso">Avisa al director o a la subdirectora para que la aprueben en la pantalla Salidas.</div>') +
      '<div class="acciones"><button onclick="imprimirComprobante(\'' + esc(res.id) + '\')">Imprimir comprobante</button>' +
      '<button class="prim" onclick="cerrar();refrescar()">Listo</button></div>');
  } catch (e) { if (e.red) return enCola(); b.disabled = false; b.textContent = 'Guardar salida'; error(e); }
}
async function aprobarSalida(id) {
  try { await api('apiAprobarSalida', id); toast('Salida aprobada.'); refrescar(); }
  catch (e) { error(e); }
}
function refrescar() {
  if (S.vista === 'alumnos' && S.ficha) vFicha(S.ficha.alumno.id); else ir(S.vista);
}
async function imprimirComprobante(id) {
  try {
    const s = await api('apiComprobante', id);
    imprimir('<div class="doc">' + encabezadoDoc() + '<h3 style="text-align:center;margin:18px 0">Comprobante de salida de alumno</h3>' +
      '<table class="kv"><tr><td><b>Folio</b></td><td>' + esc(s.id) + '</td></tr>' +
      '<tr><td><b>Alumno</b></td><td>' + esc(s.nombre) + '</td></tr><tr><td><b>Grupo</b></td><td>' + esc(s.grupo) + '</td></tr>' +
      '<tr><td><b>Fecha y hora</b></td><td>' + fF(s.fecha) + ', ' + esc(s.hora) + '</td></tr>' +
      '<tr><td><b>Recoge</b></td><td>' + esc(s.recoge) + (s.parentesco ? ' (' + esc(s.parentesco) + ')' : '') + (s.autorizado === 'NO' ? ' · No estaba en la lista de autorizados' : '') + '</td></tr>' +
      '<tr><td><b>Motivo</b></td><td>' + esc(s.motivo) + (s.detalle ? ': ' + esc(s.detalle) : '') + '</td></tr>' +
      '<tr><td><b>Estatus</b></td><td>' + (s.estatus === 'COMPLETADA' ? 'Completada' : 'Pendiente de aprobación') + (s.aprobo ? ' · Aprobó ' + esc(s.aprobo) : '') + '</td></tr>' +
      '<tr><td><b>Registró</b></td><td>' + esc(s.registro) + '</td></tr></table>' +
      '<p style="margin-top:24px">Firma de quien recoge:</p>' + (s.firma ? '<img src="' + s.firma + '" style="max-width:320px;max-height:140px">' : '<p>(sin firma)</p>') +
      '<div style="border-top:1px solid #000;width:320px;padding-top:4px">' + esc(s.recoge) + '</div></div>');
  } catch (e) { error(e); }
}

/* ---------------- Vista: Alumnos ---------------- */
function vAlumnos() {
  const b = S.busq;
  $('#main').innerHTML = '' +
    (puede('alumnos') ? '<button class="prim ancho" onclick="formAlumno()">Nuevo alumno</button><div style="height:10px"></div>' : '') +
    '<input id="aQ" placeholder="Buscar por nombre, apellido o CURP" value="' + esc(b.q) + '" oninput="S.busq.q=this.value;buscarAlumnos()">' +
    '<div class="fila" style="margin-top:8px"><select class="crece" onchange="S.busq.grupo=this.value;buscarAlumnos()">' + opcionesGrupo(b.grupo, 'Todos los grupos') + '</select>' +
    '<label style="margin:0;display:flex;gap:6px;align-items:center;white-space:nowrap"><input type="checkbox" style="width:auto" ' + (b.bajas ? 'checked' : '') +
    ' onchange="S.busq.bajas=this.checked;buscarAlumnos()"> Incluir bajas</label></div><div id="aRes" style="margin-top:10px"></div>';
  buscarAlumnos();
}
function buscarAlumnos() {
  clearTimeout(buscT);
  const b = S.busq;
  if (b.q.trim().length < 2 && !b.grupo) { $('#aRes').innerHTML = '<div class="tenue">Escribe un nombre o elige un grupo.</div>'; return; }
  buscT = setTimeout(async () => {
    try {
      const r = await api('apiBuscarAlumnos', b.q, b.grupo, b.bajas);
      $('#aRes').innerHTML = r.length ? '<div class="card" style="padding:4px 10px">' + r.map((a) =>
        '<div class="res fila" onclick="vFicha(\'' + esc(a.id) + '\')"><span class="crece"><b>' + esc(a.nombre) + '</b> <span class="tenue">' + esc(a.grupo) + '</span></span>' +
        (a.estatus !== 'ACTIVO' ? badge(a.estatus) : '') + '</div>').join('') + '</div>' : '<div class="tenue">Sin resultados.</div>';
    } catch (e) { error(e); }
  }, 300);
}
async function vFicha(id) {
  if (S.vista !== 'alumnos') { S.vista = 'alumnos'; document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b.id === 'nav-alumnos')); }
  cargando(); window.scrollTo(0, 0);
  try {
    const f = await api('apiAlumno', id);
    S.ficha = f;
    const a = f.alumno, act = a.estatus === 'ACTIVO';
    const pre = JSON.stringify({ id: a.id, nombre: a.nombre, grupo: a.grupo }).replace(/"/g, '&quot;');
    cab('Ficha del alumno', a.grupo + ' · ' + a.id);
    let h = '<button class="chico" onclick="cab(fechaLarga(S.ini.hoy),\'Alumnos\');vAlumnos()">← Alumnos</button>' +
      '<h2 style="margin-top:12px">' + esc(a.nombre) + '</h2>' +
      '<div class="fila"><span class="crece tenue">' + esc(a.grupo) + ' · ' + esc(a.id) + (a.curp ? ' · ' + esc(a.curp) : '') + '</span>' + badge(a.estatus) + '</div>' +
      (a.notas ? '<div class="tenue">' + esc(a.notas) + '</div>' : '') + '<div class="acciones">' +
      (act && puede('salidas') && S.ini.habilHoy ? '<button class="chico" onclick="nuevaSalida(' + pre + ')">Salida</button>' : '') +
      (act && puede('lista') && S.ini.habilHoy ? '<button class="chico" onclick="retardoDirecto(' + pre + ')">Llegó tarde</button>' : '') +
      (puede('justificar') ? '<button class="chico" onclick="formJustificar()">Justificar falta</button>' : '') +
      (puede('seguimiento') ? '<button class="chico" onclick="formSeguimiento()">Seguimiento</button><button class="chico" onclick="formCitatorio()">Citatorio</button>' : '') +
      (f.puedeEditar ? '<button class="chico" onclick="formAlumno(true)">Editar datos</button>' +
        (act ? '<button class="chico" onclick="formMover(\'CAMBIO\')">Cambiar de grupo</button><button class="chico peligro" onclick="formMover(\'BAJA\')">Baja</button>'
          : '<button class="chico" onclick="formMover(\'REINGRESO\')">Reingreso</button>') : '') + '</div>';

    h += '<h3>Contactos</h3><div class="card">' + (f.contactos.length ? f.contactos.map((c) =>
      '<div class="fila res" style="cursor:default"><span class="crece"><b>' + esc(c.nombre) + '</b><br><span class="tenue">' + esc(c.parentesco) + '</span> ' +
      (c.autorizado === 'SI' ? badge('SI', 'Puede recoger') : badge('F', 'No autorizado')) + '</span>' +
      (c.telefono ? '<a class="btn chico" href="tel:' + esc(c.telefono) + '">Llamar</a>' : '') +
      (f.puedeEditar ? '<button class="chico" onclick="formContacto(\'' + esc(c.id) + '\')">✎</button>' : '') + '</div>').join('') : '<div class="tenue">Sin contactos.</div>') +
      (f.puedeEditar ? '<button class="chico" style="margin-top:8px" onclick="formContacto()">+ Agregar contacto</button>' : '') + '</div>';

    const r = f.resumen;
    h += '<h3>Asistencia registrada</h3><div class="card" style="font-size:14px"><span class="ok">Presente ' + r.P + '</span> · <span class="mal">Faltas ' + r.F +
      '</span> · <span class="amb">Retardos ' + r.R + '</span> · Justificadas ' + r.J + ' · Salidas ' + r.S + '</div>';
    if (f.incidencias.length) h += '<div class="card" style="padding:4px 10px">' + f.incidencias.map((x) =>
      '<div class="fila" style="padding:6px 0;border-bottom:1px solid var(--gris)"><span class="crece">' + dia(x.fecha) + ' ' + fF(x.fecha) + (x.hora ? ' · ' + esc(x.hora) : '') +
      (x.comentario ? '<br><span class="tenue">' + esc(x.comentario) + '</span>' : '') + '</span>' + badge(x.estado, ESTADOS[x.estado]) + '</div>').join('') + '</div>';

    h += '<h3>Historial de grupos</h3><div class="card">' + (f.historial.length ? f.historial.map((x) =>
      '<div style="padding:5px 0;border-bottom:1px solid var(--gris)"><b>' + esc(x.movimiento.replace('_', ' ')) + '</b> · ' + fF(x.fecha) + ' · ciclo ' + esc(x.ciclo) +
      '<br><span class="tenue">' + (x.anterior ? esc(x.anterior) + ' → ' : '') + esc(x.nuevo || '—') + (x.motivo ? ' · ' + esc(x.motivo) : '') + '</span></div>').join('') : '<div class="tenue">Sin movimientos.</div>') + '</div>';

    if (f.justificaciones.length) h += '<h3>Justificaciones</h3><div class="card">' + f.justificaciones.map((j) =>
      '<div style="padding:5px 0">' + fF(j.inicio) + (j.fin !== j.inicio ? ' al ' + fF(j.fin) : '') + ' · ' + esc(j.tipo) +
      (j.fueraPlazo === 'SI' ? ' ' + badge('R', 'fuera de plazo') : '') + (j.comentario ? '<br><span class="tenue">' + esc(j.comentario) + '</span>' : '') + '</div>').join('') + '</div>';

    if (f.seguimiento.length) h += '<h3>Seguimiento</h3><div class="card">' + f.seguimiento.map((s) =>
      '<div style="padding:5px 0;border-bottom:1px solid var(--gris)"><b>' + esc(s.tipo) + '</b> · ' + fF(s.fecha) + ' ' + badge(s.resultado, s.resultado.replace('_', ' ')) +
      '<br><span class="tenue">' + esc(s.detalle) + '</span></div>').join('') + '</div>';

    if (f.salidas.length) h += '<h3>Salidas</h3>' + f.salidas.map(tarjetaSalida).join('');
    $('#main').innerHTML = h;
  } catch (e) { errVista(e); }
}
function retardoDirecto(pre) {
  modal('<h2>Llegada tarde</h2><div class="card"><b>' + esc(pre.nombre) + '</b> <span class="tenue">' + esc(pre.grupo) + '</span></div>' +
    '<label>Hora de llegada</label><input id="rHora" type="time" value="' + horaAhora() + '">' +
    '<label>Comentario</label><textarea id="rCom" rows="2"></textarea>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="rBtn" onclick="guardarRetardo(\'' + esc(pre.id) + '\').then(()=>vFicha(\'' + esc(pre.id) + '\'))">Guardar retardo</button></div>');
}
function formAlumno(editar) {
  const a = editar ? S.ficha.alumno : {};
  modal('<h2>' + (editar ? 'Editar datos' : 'Nuevo alumno') + '</h2>' +
    '<label>Apellido paterno</label><input id="fPat" value="' + esc(a.paterno) + '">' +
    '<label>Apellido materno</label><input id="fMat" value="' + esc(a.materno) + '">' +
    '<label>Nombre(s)</label><input id="fNom" value="' + esc(a.nombres) + '">' +
    '<label>CURP (opcional)</label><input id="fCurp" maxlength="18" value="' + esc(a.curp) + '">' +
    (editar ? '' : '<label>Grupo</label><select id="fGru">' + opcionesGrupo('', 'Selecciona…') + '</select>') +
    '<label>Notas (opcional)</label><input id="fNotas" value="' + esc(a.notas) + '">' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="fBtn" onclick="guardarAlumno(' + (editar ? '\'' + esc(a.id) + '\'' : '') + ')">Guardar</button></div>');
}
async function guardarAlumno(id) {
  const b = $('#fBtn'); b.disabled = true;
  try {
    const r = await api('apiGuardarAlumno', { id: id || '', paterno: $('#fPat').value, materno: $('#fMat').value, nombres: $('#fNom').value,
      curp: $('#fCurp').value, grupo: id ? '' : $('#fGru').value, notas: $('#fNotas').value });
    cerrar(); toast(id ? 'Datos actualizados.' : 'Alumno dado de alta (' + r.id + '). Agrega sus contactos.'); vFicha(r.id);
  } catch (e) { b.disabled = false; error(e); }
}
function formMover(tipo) {
  const a = S.ficha.alumno;
  const titulos = { CAMBIO: 'Cambiar de grupo', BAJA: 'Dar de baja', REINGRESO: 'Reingreso' };
  modal('<h2>' + titulos[tipo] + '</h2><div class="tenue">' + esc(a.nombre) + ' · grupo actual ' + esc(a.grupo) + '</div>' +
    (tipo !== 'BAJA' ? '<label>Grupo nuevo</label><select id="mGru">' + opcionesGrupo('', 'Selecciona…') + '</select>' : '') +
    '<label>Motivo</label>' + (tipo === 'BAJA' ? '<select id="mMotSel" onchange="$(\'#mMot\').value=this.value"><option value="">Selecciona…</option><option>Cambio de escuela</option><option>Cambio de domicilio</option><option>Deserción</option><option>Otro</option></select>' : '') +
    '<input id="mMot" placeholder="Escribe el motivo">' +
    (tipo === 'BAJA' ? '<div class="aviso" style="margin-top:10px">El alumno sale de las listas, pero su historial se conserva.</div>' : '') +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="mBtn" onclick="guardarMover(\'' + tipo + '\')">Guardar</button></div>');
}
async function guardarMover(tipo) {
  const b = $('#mBtn'); b.disabled = true;
  try {
    await api('apiMoverAlumno', S.ficha.alumno.id, tipo, $('#mGru') ? $('#mGru').value : '', $('#mMot').value);
    cerrar(); toast('Movimiento registrado.'); vFicha(S.ficha.alumno.id);
  } catch (e) { b.disabled = false; error(e); }
}
function formContacto(idc) {
  const c = idc ? S.ficha.contactos.find((x) => x.id === idc) : { autorizado: 'SI' };
  modal('<h2>' + (idc ? 'Editar contacto' : 'Nuevo contacto') + '</h2>' +
    '<label>Nombre completo</label><input id="kNom" value="' + esc(c.nombre) + '">' +
    '<label>Parentesco</label><select id="kPar">' + ['Mamá', 'Papá', 'Tutor(a)', 'Abuelo(a)', 'Tío(a)', 'Hermano(a)', 'Otro familiar']
      .map((p) => '<option' + (p === c.parentesco ? ' selected' : '') + '>' + p + '</option>').join('') + '</select>' +
    '<label>Teléfono (10 dígitos)</label><input id="kTel" type="tel" value="' + esc(c.telefono) + '">' +
    '<label>¿Puede recoger al alumno?</label><select id="kAut"><option value="SI"' + (c.autorizado === 'SI' ? ' selected' : '') + '>Sí, autorizado</option>' +
    '<option value="NO"' + (c.autorizado !== 'SI' ? ' selected' : '') + '>No, solo contacto</option></select>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="kBtn" onclick="guardarContacto(\'' + esc(idc || '') + '\')">Guardar</button></div>');
}
async function guardarContacto(idc) {
  const b = $('#kBtn'); b.disabled = true;
  try {
    await api('apiGuardarContacto', { id: idc, idAlumno: S.ficha.alumno.id, nombre: $('#kNom').value, parentesco: $('#kPar').value,
      telefono: $('#kTel').value, autorizado: $('#kAut').value });
    cerrar(); toast('Contacto guardado.'); vFicha(S.ficha.alumno.id);
  } catch (e) { b.disabled = false; error(e); }
}
function formJustificar() {
  const a = S.ficha.alumno, hoy = S.ini.hoy;
  modal('<h2>Justificar falta</h2><div class="tenue">' + esc(a.nombre) + ' · ' + esc(a.grupo) + '</div>' +
    '<div class="fila"><div class="crece"><label>Desde</label><input id="jIni" type="date" value="' + hoy + '"></div>' +
    '<div class="crece"><label>Hasta</label><input id="jFin" type="date" value="' + hoy + '"></div></div>' +
    '<label>Documento</label><select id="jTipo"><option value="">Selecciona…</option><option>Receta o constancia médica</option><option>Nota del tutor</option><option>Constancia oficial</option><option>Otro</option></select>' +
    '<label>Comentario</label><textarea id="jCom" rows="2"></textarea>' +
    '<div class="tenue">Plazo para justificar: ' + S.ini.config.plazo + ' días hábiles.</div>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="jBtn" onclick="guardarJust()">Justificar</button></div>');
}
async function guardarJust() {
  const b = $('#jBtn'); b.disabled = true;
  try {
    const r = await api('apiJustificar', { idAlumno: S.ficha.alumno.id, inicio: $('#jIni').value, fin: $('#jFin').value, tipo: $('#jTipo').value, comentario: $('#jCom').value });
    cerrar(); toast('Justificación registrada. ' + r.cambiadas + ' falta(s) cambiaron a justificada.' + (r.fueraPlazo ? ' Quedó marcada fuera de plazo.' : ''));
    vFicha(S.ficha.alumno.id);
  } catch (e) { b.disabled = false; error(e); }
}
function formSeguimiento(resuelve, motivo) {
  const f = S.ficha, a = f.alumno;
  modal('<h2>Registrar seguimiento</h2><div class="tenue">' + esc(a.nombre) + ' · ' + esc(a.grupo) + '</div>' +
    (f.contactos.length ? '<div class="acciones">' + f.contactos.filter((c) => c.telefono).map((c) =>
      '<a class="btn chico" href="tel:' + esc(c.telefono) + '">Llamar a ' + esc(c.parentesco || c.nombre) + '</a>').join('') + '</div>' : '') +
    '<label>Tipo</label><select id="gTipo"><option value="LLAMADA">Llamada</option><option value="CITATORIO">Citatorio entregado</option><option value="REUNION">Reunión con padres</option><option value="NOTA">Nota</option></select>' +
    '<label>Motivo</label><select id="gMot"><option value="FALTAS"' + (motivo === 'FALTAS' ? ' selected' : '') + '>Faltas</option><option value="RETARDO"' + (motivo === 'RETARDO' ? ' selected' : '') + '>Retardos</option><option value="OTRO">Otro</option></select>' +
    '<label>Resultado</label><select id="gRes"><option value="CONTESTO">Contestó</option><option value="NO_CONTESTO">No contestó</option><option value="ASISTIO">Asistió</option><option value="NO_ASISTIO">No asistió</option><option value="ACUERDO">Se llegó a un acuerdo</option><option value="REGISTRADO">Otro</option></select>' +
    '<label>Detalle (qué se dijo o acordó)</label><textarea id="gDet" rows="3"></textarea>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="gBtn" onclick="guardarSeg(\'' + esc(resuelve || '') + '\')">Guardar</button></div>');
}
async function guardarSeg(resuelve) {
  const b = $('#gBtn'); b.disabled = true;
  try {
    await api('apiRegistrarSeguimiento', { idAlumno: S.ficha.alumno.id, tipo: $('#gTipo').value, motivo: $('#gMot').value,
      resultado: $('#gRes').value, detalle: $('#gDet').value, resuelve: resuelve });
    cerrar(); toast('Seguimiento registrado.');
    if (S.vista === 'alertas') vAlertas(); else vFicha(S.ficha.alumno.id);
  } catch (e) { b.disabled = false; error(e); }
}
function formCitatorio() {
  const a = S.ficha.alumno;
  modal('<h2>Citatorio</h2><div class="tenue">' + esc(a.nombre) + ' · ' + esc(a.grupo) + '</div>' +
    '<div class="fila"><div class="crece"><label>Fecha de la cita</label><input id="tFec" type="date" value="' + S.ini.hoy + '"></div>' +
    '<div class="crece"><label>Hora</label><input id="tHor" type="time" value="14:30"></div></div>' +
    '<label>Motivo</label><input id="tMot" value="Inasistencias del alumno">' +
    '<label>Dirigido a</label><input id="tA" value="' + esc((S.ficha.contactos[0] || {}).nombre || 'Padre, madre o tutor') + '">' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" onclick="imprimirCitatorio()">Imprimir y registrar</button></div>');
}
async function imprimirCitatorio() {
  const a = S.ficha.alumno, c = S.ini.config;
  const fec = $('#tFec').value, hor = $('#tHor').value, mot = $('#tMot').value, para = $('#tA').value;
  let faltas = [];
  try { const r = await api('apiAlertas', S.ini.hoy); const x = r.alertas.find((y) => y.id === a.id); if (x) faltas = x.fechasF; } catch (e) {}
  imprimir('<div class="doc">' + encabezadoDoc() + '<p style="text-align:right;margin-top:24px">' + esc(c.municipio) + ', a ' + fF(S.ini.hoy) + '</p>' +
    '<h3 style="text-align:center">CITATORIO</h3><p><b>' + esc(para) + '</b><br>Presente</p>' +
    '<p>Por medio del presente se le cita a presentarse en esta escuela el día <b>' + fF(fec) + '</b> a las <b>' + esc(hor) + '</b> horas, ' +
    'para tratar asuntos relacionados con el alumno(a) <b>' + esc(a.nombre) + '</b> del grupo <b>' + esc(a.grupo) + '</b>.</p>' +
    '<p>Motivo: ' + esc(mot) + '.</p>' +
    (faltas.length ? '<p>Faltas sin justificar en los últimos ' + c.ventana + ' días hábiles: ' + faltas.map(fC).join(', ') + '.</p>' : '') +
    '<p>Su presencia es importante para dar seguimiento al desarrollo escolar de su hijo(a).</p><p>Atentamente</p>' +
    '<div class="firmas"><div>Dirección</div><div>Recibí: nombre y firma</div></div></div>');
  cerrar();
  if (puede('seguimiento')) {
    api('apiRegistrarSeguimiento', { idAlumno: a.id, tipo: 'CITATORIO', motivo: 'FALTAS', resultado: 'REGISTRADO',
      detalle: 'Citatorio para el ' + fF(fec) + ' a las ' + hor + '. ' + mot }).then(() => vFicha(a.id)).catch(error);
  }
}

/* ---------------- Vista: Alertas ---------------- */
async function vAlertas() {
  cargando();
  try {
    const r = await api('apiAlertas', S.ini.hoy);
    const u = r.umbrales;
    const rojos = r.alertas.filter((a) => a.nivel === 'ROJO'), amar = r.alertas.filter((a) => a.nivel === 'AMARILLO'),
      ret = r.alertas.filter((a) => a.patron);
    cab('Últimos ' + r.ventana.length + ' días hábiles', 'Alertas', '<div class="contadores">' +
      '<button class="contador rojo" onclick="irA(\'a-rojo\')"><b>' + rojos.length + '</b><span>Rojo</span></button>' +
      '<button class="contador" onclick="irA(\'a-riesgo\')"><b>' + amar.length + '</b><span>En riesgo</span></button>' +
      '<button class="contador" onclick="irA(\'a-ret\')"><b>' + ret.length + '</b><span>Retardos</span></button>' +
      '<button class="contador" onclick="irA(\'a-llam\')"><b>' + r.pendientes.length + '</b><span>Llamadas</span></button></div>');
    let h = '<div class="tenue">Del ' + fF(r.ventana[0]) + ' al ' + fF(r.ventana[r.ventana.length - 1]) + '. Solo cuentan faltas sin justificar.</div>';
    const tira = (a) => '<div class="tira">' + r.ventana.map((f) => {
      const e = a.fechasF.indexOf(f) >= 0 ? 'F' : a.fechasR.indexOf(f) >= 0 ? 'R' : '';
      return '<span class="' + e + '" title="' + fF(f) + '">' + e + '</span>';
    }).join('') + '</div>';
    const tarjeta = (a, tipo) => {
      const nivel = tipo === 'R' ? 'R' : (a.nivel === 'ROJO' ? 'ROJO' : 'AMARILLO');
      const etiqueta = tipo === 'R' ? 'Retardos' : (a.nivel === 'ROJO' ? 'Rojo' : 'En riesgo');
      return '<div class="card"><div class="fila"><span class="ini ' + (nivel === 'ROJO' ? 'F' : 'R') + '">' + esc(iniciales(a.nombre).toUpperCase()) + '</span>' +
        '<span class="crece"><b>' + esc(a.nombre) + '</b><br><span class="tenue">Grupo ' + esc(a.grupo) + ' · ' +
        (a.ultimoSeguimiento ? esc(a.ultimoSeguimiento.tipo.toLowerCase()) + ' el ' + fC(a.ultimoSeguimiento.fecha) : '<span class="mal">sin seguimiento</span>') + '</span></span>' +
        badge(nivel, etiqueta) + '</div>' +
        '<div style="font-size:13px;font-weight:600;margin-top:10px" class="' + (nivel === 'ROJO' ? 'mal' : 'amb') + '">' +
        (tipo === 'R' ? a.retardos + ' retardos' : a.faltas + ' faltas sin justificar') + '</div>' + tira(a) +
        '<div class="acciones3"><button class="prim" onclick="vFicha(\'' + esc(a.id) + '\')">Ficha</button>' +
        (puede('seguimiento') ? '<button onclick="segDesdeAlerta(\'' + esc(a.id) + '\',\'\',\'' + (tipo === 'R' ? 'RETARDO' : 'FALTAS') + '\')">Seguimiento</button>' +
          '<button onclick="citatorioDesdeAlerta(\'' + esc(a.id) + '\')">Citatorio</button>' : '') + '</div></div>';
    };
    h += '<h3 id="a-rojo" class="mal">Alerta roja: ' + u.rojo + ' o más faltas (' + rojos.length + ')</h3>' + (rojos.map((a) => tarjeta(a)).join('') || '<div class="tenue">Ninguno</div>');
    h += '<h3 id="a-riesgo" class="amb">En riesgo: ' + u.amarillo + ' a ' + (u.rojo - 1) + ' faltas (' + amar.length + ')</h3>' + (amar.map((a) => tarjeta(a)).join('') || '<div class="tenue">Ninguno</div>');
    h += '<h3 id="a-ret">Patrón de retardos: ' + u.retardos + ' o más (' + ret.length + ')</h3>' + (ret.map((a) => tarjeta(a, 'R')).join('') || '<div class="tenue">Ninguno</div>');
    h += '<h3 id="a-llam">Llamadas pendientes por retardo (' + r.pendientes.length + ')</h3>' + (r.pendientes.map((p) =>
      '<div class="card"><div class="fila"><b class="crece">' + esc(p.nombre) + '</b><span class="tenue">' + esc(p.grupo) + '</span></div><div class="tenue">' + esc(p.detalle) + '</div>' +
      '<div class="acciones"><button class="chico" onclick="vFicha(\'' + esc(p.id) + '\')">Ver ficha</button>' +
      (puede('seguimiento') ? '<button class="chico prim" onclick="segDesdeAlerta(\'' + esc(p.id) + '\',\'' + esc(p.idSeg) + '\',\'RETARDO\')">Registrar llamada</button>' : '') +
      '</div></div>').join('') || '<div class="tenue">Ninguna</div>');
    $('#main').innerHTML = h;
  } catch (e) { errVista(e); }
}
function irA(id) { const el = document.getElementById(id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 200, behavior: 'smooth' }); }
async function citatorioDesdeAlerta(id) {
  try { S.ficha = await api('apiAlumno', id); formCitatorio(); } catch (e) { error(e); }
}
async function segDesdeAlerta(id, resuelve, motivo) {
  try { S.ficha = await api('apiAlumno', id); formSeguimiento(resuelve, motivo); } catch (e) { error(e); }
}

/* ---------------- Vista: Reportes ---------------- */
function vReportes() {
  const q = S.rep || { grupo: S.ini.grupos[0], ini: quincena(S.ini.hoy)[0], fin: quincena(S.ini.hoy)[1] };
  S.rep = q;
  $('#main').innerHTML = '<div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:14px">' +
    '<button class="grande" style="flex-direction:column;gap:4px;height:auto;padding:14px" onclick="vCalendario()">' + svg('hoy', 24) + 'Calendario escolar</button>' +
    '<button class="grande" style="flex-direction:column;gap:4px;height:auto;padding:14px" onclick="formRespaldo()">' + svg('lista', 24) + 'Listas de respaldo</button></div>' +
    '<h3 style="margin-top:0">Concentrado de asistencia</h3><div class="card"><label>Grupo</label><select id="pGru" onchange="S.rep.grupo=this.value">' + opcionesGrupo(q.grupo) + '</select>' +
    '<div class="fila"><div class="crece"><label>Desde</label><input id="pIni" type="date" value="' + q.ini + '" onchange="S.rep.ini=this.value"></div>' +
    '<div class="crece"><label>Hasta</label><input id="pFin" type="date" value="' + q.fin + '" onchange="S.rep.fin=this.value"></div></div>' +
    '<div class="acciones"><button class="chico" onclick="setQuincena(0)">Quincena actual</button><button class="chico" onclick="setQuincena(-1)">Quincena anterior</button></div>' +
    '<div class="acciones"><button class="prim" onclick="verConcentrado()">Ver concentrado</button><button onclick="imprimirConcentrado()">Imprimir</button>' +
    '<button onclick="imprimirTodos()">Imprimir todos los grupos</button><button onclick="exportar()">Descargar en Excel</button></div></div><div id="pRes"></div>';
}
function setQuincena(d) { const q = quincena(S.ini.hoy, d); S.rep.ini = q[0]; S.rep.fin = q[1]; vReportes(); }
function tablaConcentrado(c, imprimible) {
  return '<table class="tabla"><tr><th>#</th><th class="izq">Alumno</th>' + c.dias.map((f) => '<th>' + dia(f).slice(0, 2) + '<br>' + fC(f) + '</th>').join('') +
    '<th>F</th><th>R</th><th>J</th><th>S</th></tr>' + c.filas.map((f) =>
    '<tr><td>' + f.num + '</td><td class="izq">' + esc(f.nombre) + (f.activo ? '' : ' <i>(ya no está en el grupo)</i>') + '</td>' +
    f.estados.map((e) => '<td class="c-' + e + '">' + (e === 'P' ? (imprimible ? '•' : '✓') : e) + '</td>').join('') +
    '<td class="' + (f.totales.F ? 'c-F' : '') + '">' + f.totales.F + '</td><td>' + f.totales.R + '</td><td>' + f.totales.J + '</td><td>' + f.totales.S + '</td></tr>').join('') + '</table>';
}
async function verConcentrado() {
  $('#pRes').innerHTML = '<div class="cargando">Cargando…</div>';
  try {
    const c = await api('apiConcentrado', S.rep.grupo, S.rep.ini, S.rep.fin);
    $('#pRes').innerHTML = '<h3>' + esc(c.grupo) + ' · ' + fF(c.inicio) + ' al ' + fF(c.fin) + ' (' + c.dias.length + ' días hábiles)</h3>' +
      '<div class="scroll">' + tablaConcentrado(c) + '</div><div class="tenue" style="margin-top:6px">✓ presente · F falta · R retardo · J justificada · S salió temprano · vacío sin registro</div>';
  } catch (e) { $('#pRes').innerHTML = '<div class="aviso err">' + esc(e.message) + '</div>'; }
}
function paginaConcentrado(c) {
  return '<div class="pagina">' + encabezadoDoc() + '<h3 style="text-align:center;margin:8px 0">Concentrado de asistencia · Grupo ' + esc(c.grupo) + ' · ' + fF(c.inicio) + ' al ' + fF(c.fin) + '</h3>' +
    tablaConcentrado(c, true) + '<p style="font-size:10px">• presente · F falta · R retardo · J justificada · S salió temprano</p>' +
    '<div class="firmas"><div>Prefecto(a)</div><div>Dirección</div></div></div>';
}
async function imprimirConcentrado() {
  try { const c = await api('apiConcentrado', S.rep.grupo, S.rep.ini, S.rep.fin); imprimir('<style>@page{size:landscape;margin:10mm}</style>' + paginaConcentrado(c)); }
  catch (e) { error(e); }
}
async function imprimirTodos() {
  toast('Preparando los ' + S.ini.grupos.length + ' grupos…');
  try {
    const todas = await Promise.all(S.ini.grupos.map((g) => api('apiConcentrado', g, S.rep.ini, S.rep.fin)));
    imprimir('<style>@page{size:landscape;margin:10mm}</style>' + todas.map(paginaConcentrado).join(''));
  } catch (e) { error(e); }
}
async function exportar() {
  toast('Generando la hoja…');
  try {
    const r = await api('apiExportarConcentrado', S.rep.grupo, S.rep.ini, S.rep.fin);
    const blob = new Blob(['\ufeff' + r.csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = r.nombre;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Archivo descargado: ' + r.nombre + '. Ábrelo con Excel.');
  } catch (e) { error(e); }
}

/* ---------------- Calendario escolar ---------------- */
const COLOR_TIPO = {
  FESTIVO: ['#1B2559', '#FFFFFF'], SUSPENSION: ['#1B2559', '#FFFFFF'], CTE: ['#CFE0F7', '#173A80'],
  VACACIONES: ['#BFE3F2', '#0B4F6C'], FIESTA_PATRONAL: ['#FDE8E8', '#C8202B'], CAMBIO_ACTIVIDAD: ['#FDEFC8', '#7A4A00'], OTRO: ['#E7E9F2', '#3E4460'],
};
async function vCalendario(mes) {
  S.vista = 'reportes';
  S.calMes = mes || S.calMes || S.ini.hoy.slice(0, 7);
  cab('Ciclo ' + S.ini.config.ciclo, 'Calendario escolar');
  if (!S.cal) {
    cargando();
    try { S.cal = await api('apiCalendario'); }
    catch (e) { if (!(e.red && S.ini.calendario)) return errVista(e); S.cal = S.ini.calendario; }
  }
  pintarCalendario();
}
function actualizarCal(c) {
  S.cal = c; S.ini.calendario = c;
  try { localStorage.setItem('ini', JSON.stringify(S.ini)); } catch (e) {}
  pintarCalendario();
}
function moverMes(n) {
  const p = S.calMes.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1 + n, 1);
  S.calMes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  pintarCalendario();
}
function pintarCalendario() {
  const c = S.cal, mapa = {};
  c.dias.forEach((d) => { mapa[d.fecha] = d; });
  const p = S.calMes.split('-').map(Number), y = p[0], m = p[1];
  const primero = new Date(y, m - 1, 1).getDay(), total = new Date(y, m, 0).getDate();
  const n2 = (x) => String(x).padStart(2, '0');
  const edita = puede('calendario');
  let celdas = '', clases = 0;
  for (let i = 0; i < primero; i++) celdas += '<span></span>';
  for (let dd = 1; dd <= total; dd++) {
    const f = y + '-' + n2(m) + '-' + n2(dd), dsem = (primero + dd - 1) % 7, sc = mapa[f];
    const fuera = (c.inicio && f < c.inicio) || (c.fin && f > c.fin);
    let fondo = '#FFFFFF', color = 'var(--texto)', borde = 'transparent';
    if (dsem === 0 || dsem === 6) { fondo = 'transparent'; color = '#9AA0B5'; }
    else if (sc) { fondo = (COLOR_TIPO[sc.tipo] || COLOR_TIPO.OTRO)[0]; color = (COLOR_TIPO[sc.tipo] || COLOR_TIPO.OTRO)[1]; }
    else if (fuera) { fondo = '#F0F1F5'; color = '#9AA0B5'; }
    else clases++;
    if (f === S.ini.hoy) borde = 'var(--oro)';
    const clic = edita && dsem !== 0 && dsem !== 6 ? ' onclick="diaCal(\'' + f + '\')"' : '';
    celdas += '<button type="button"' + clic + ' aria-label="' + f + (sc ? ', sin clase' : '') + '" style="height:44px;min-height:44px;padding:0;border-radius:10px;font-weight:700;font-size:14px;' +
      'background:' + fondo + ';color:' + color + ';border:2px solid ' + borde + '">' + dd + '</button>';
  }
  const delMes = c.dias.filter((d) => d.fecha.slice(0, 7) === S.calMes);
  const leyenda = Object.keys(c.tipos || {}).filter((t) => t !== 'SUSPENSION').map((t) =>
    '<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--tenue2)"><span style="width:14px;height:14px;border-radius:4px;background:' +
    (COLOR_TIPO[t] || COLOR_TIPO.OTRO)[0] + '"></span>' + esc(t === 'FESTIVO' ? 'Festivo o suspensión' : c.tipos[t]) + '</span>').join('');
  let h = '<button class="chico" onclick="ir(\'reportes\')">← Reportes</button>' +
    '<div class="card" style="margin-top:12px"><div class="fila"><button class="chico" aria-label="Mes anterior" onclick="moverMes(-1)">‹</button>' +
    '<b class="crece" style="text-align:center;font-family:var(--titulos);font-size:18px;text-transform:capitalize">' + MESES[m - 1] + ' ' + y + '</b>' +
    '<button class="chico" aria-label="Mes siguiente" onclick="moverMes(1)">›</button></div>' +
    '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-top:12px;text-align:center">' +
    ['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((x) => '<span class="tenue" style="font-weight:700">' + x + '</span>').join('') + celdas + '</div>' +
    '<div class="tenue" style="margin-top:10px">' + clases + ' días de clase este mes' + (edita ? ' · toca un día para marcarlo o quitarlo' : '') + '</div></div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:10px;margin:4px 0 12px">' + leyenda + '</div>';
  if (delMes.length) h += '<div class="card" style="padding:2px 14px">' + delMes.map((d) =>
    '<div class="mov"' + (edita ? ' onclick="diaCal(\'' + d.fecha + '\')"' : '') + '><span class="circ" style="background:' + (COLOR_TIPO[d.tipo] || COLOR_TIPO.OTRO)[0] + ';color:' +
    (COLOR_TIPO[d.tipo] || COLOR_TIPO.OTRO)[1] + ';font-weight:700;font-size:13px">' + Number(d.fecha.slice(8)) + '</span>' +
    '<div class="t"><b>' + esc(d.descripcion || c.tipos[d.tipo]) + '</b><span>' + esc(dia(d.fecha)) + ' · ' + esc((c.tipos || {})[d.tipo] || d.tipo) + '</span></div></div>').join('') + '</div>';
  h += '<div class="card"><div class="fila"><span class="crece"><b>Ciclo ' + esc(c.ciclo || S.ini.config.ciclo) + '</b><br><span class="tenue">' +
    (c.inicio ? 'Del ' + fF(c.inicio) + ' al ' + fF(c.fin) + ' · ' + diasDeClase(c) + ' días de clase' : 'Sin fechas de inicio y fin') + '</span></span>' +
    (edita ? '<button class="chico" onclick="formCiclo()">Editar</button>' : '') + '</div></div>';
  if (edita) h += '<button class="oro ancho grande" onclick="formSinClase()">' + svg('mas', 22) + 'Marcar varios días sin clase</button>';
  $('#main').innerHTML = h;
}
function diasDeClase(c) {
  if (!c.inicio || !c.fin) return 0;
  const sin = {}; c.dias.forEach((d) => { sin[d.fecha] = true; });
  const p = c.inicio.split('-').map(Number), x = new Date(p[0], p[1] - 1, p[2], 12);
  let n = 0, vueltas = 0;
  while (vueltas++ < 400) {
    const f = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    if (f > c.fin) break;
    if (x.getDay() !== 0 && x.getDay() !== 6 && !sin[f]) n++;
    x.setDate(x.getDate() + 1);
  }
  return n;
}
function opcionesTipo(sel) {
  const t = S.cal.tipos || {};
  return Object.keys(t).map((k) => '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(t[k]) + '</option>').join('');
}
function diaCal(f) {
  const d = S.cal.dias.find((x) => x.fecha === f);
  if (d) {
    modal('<h2>' + esc(fechaLarga(f)) + '</h2><div class="aviso">Sin clase: ' + esc(d.descripcion || S.cal.tipos[d.tipo]) + ' (' + esc(S.cal.tipos[d.tipo] || d.tipo) + ')</div>' +
      '<div class="acciones"><button onclick="cerrar()">Cerrar</button><button onclick="formSinClase(\'' + f + '\')">Cambiar motivo</button>' +
      '<button class="prim" onclick="quitarSinClase(\'' + f + '\')">Sí hay clase</button></div>');
  } else formSinClase(f);
}
function formSinClase(f) {
  const d = f ? S.cal.dias.find((x) => x.fecha === f) : null;
  const ini = f || S.ini.hoy;
  modal('<h2>Día sin clase</h2><div class="tenue">Los sábados y domingos no cuentan; se marcan solo los días de lunes a viernes del rango.</div>' +
    '<div class="fila"><div class="crece"><label>Desde</label><input id="cIni" type="date" value="' + ini + '"></div>' +
    '<div class="crece"><label>Hasta</label><input id="cFin" type="date" value="' + ini + '"></div></div>' +
    '<label>Motivo</label><select id="cTipo">' + opcionesTipo(d ? d.tipo : 'FIESTA_PATRONAL') + '</select>' +
    '<label>Descripción</label><input id="cDesc" maxlength="120" placeholder="Ej. Fiesta patronal de Romita, desfile, jornada deportiva" value="' + esc(d ? d.descripcion : '') + '">' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="cBtn" onclick="guardarSinClase()">Guardar</button></div>');
}
async function guardarSinClase() {
  const b = $('#cBtn'); b.disabled = true;
  try {
    const r = await api('apiMarcarSinClase', { inicio: $('#cIni').value, fin: $('#cFin').value || $('#cIni').value, tipo: $('#cTipo').value, descripcion: $('#cDesc').value });
    cerrar(); actualizarCal(r.calendario);
    toast((r.agregados ? r.agregados + ' día(s) marcados sin clase.' : 'Motivo actualizado.') +
      (r.conRegistros ? ' Ojo: ya había ' + r.conRegistros + ' registros de asistencia esos días; se conservan.' : ''));
  } catch (e) { b.disabled = false; error(e); }
}
async function quitarSinClase(f) {
  try { const r = await api('apiQuitarSinClase', f); cerrar(); actualizarCal(r.calendario); toast('Listo: el ' + fF(f) + ' sí hay clase.'); }
  catch (e) { error(e); }
}
function formCiclo() {
  const c = S.cal;
  modal('<h2>Ciclo escolar</h2><label>Nombre del ciclo</label><input id="yCic" value="' + esc(c.ciclo || S.ini.config.ciclo) + '" placeholder="2026-2027">' +
    '<div class="fila"><div class="crece"><label>Primer día de clases</label><input id="yIni" type="date" value="' + esc(c.inicio) + '"></div>' +
    '<div class="crece"><label>Último día de clases</label><input id="yFin" type="date" value="' + esc(c.fin) + '"></div></div>' +
    '<div class="tenue" style="margin-top:8px">Fuera de estas fechas no se pasa lista ni cuentan faltas.</div>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="yBtn" onclick="guardarCiclo()">Guardar</button></div>');
}
async function guardarCiclo() {
  const b = $('#yBtn'); b.disabled = true;
  try { const r = await api('apiGuardarCiclo', { inicio: $('#yIni').value, fin: $('#yFin').value, ciclo: $('#yCic').value }); cerrar(); actualizarCal(r.calendario); toast('Ciclo actualizado.'); }
  catch (e) { b.disabled = false; error(e); }
}

/* ---------------- Listas de respaldo en papel ---------------- */
function siguientesHabiles(desde, n) {
  const out = [], p = desde.split('-').map(Number), x = new Date(p[0], p[1] - 1, p[2], 12);
  let vueltas = 0;
  while (out.length < n && vueltas++ < 120) {
    const f = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    if (habilLocal(f)) out.push(f);
    x.setDate(x.getDate() + 1);
  }
  return out;
}
function formRespaldo() {
  modal('<h2>Listas de respaldo</h2><div class="aviso info">Imprímelas con anticipación y guárdalas en la prefectura. Si un día no hay luz ni internet, se pasa lista en papel y después se captura en la app.</div>' +
    '<label>A partir del</label><input id="bIni" type="date" value="' + S.ini.hoy + '">' +
    '<label>Días de clase por hoja</label><select id="bDias"><option value="5">5 (una semana)</option><option value="10" selected>10 (dos semanas)</option><option value="15">15 (tres semanas)</option></select>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="bBtn" onclick="imprimirRespaldo()">Imprimir los ' + S.ini.grupos.length + ' grupos</button></div>');
}
async function imprimirRespaldo() {
  const dias = siguientesHabiles($('#bIni').value, Number($('#bDias').value));
  if (!dias.length) return toast('No hay días de clase en ese periodo.', 'err');
  const b = $('#bBtn'); b.disabled = true; b.textContent = 'Preparando…';
  try {
    const todas = await Promise.all(S.ini.grupos.map((g) => api('apiConcentrado', g, dias[0], dias[dias.length - 1])));
    const pag = (c) => '<div class="pagina">' + encabezadoDoc() + '<h3 style="text-align:center;margin:8px 0">Lista de respaldo · Grupo ' + esc(c.grupo) + '</h3>' +
      '<p style="text-align:center;font-size:10px;margin:0 0 6px">Usar solo si no hay luz o internet. Anotar • presente, F falta, R retardo (con hora), S salida (con hora). Capturar en la app al volver.</p>' +
      '<table class="tabla"><tr><th>#</th><th class="izq">Alumno</th>' + dias.map((f) => '<th>' + dia(f).slice(0, 2) + '<br>' + fC(f) + '</th>').join('') + '</tr>' +
      c.filas.filter((f) => f.activo).map((f, i) => '<tr><td>' + (i + 1) + '</td><td class="izq" style="white-space:nowrap">' + esc(f.nombre) + '</td>' +
        dias.map(() => '<td style="width:34px;height:20px"></td>').join('') + '</tr>').join('') + '</table>' +
      '<div class="firmas"><div>Prefecto(a)</div><div>Capturado en la app (fecha y firma)</div></div></div>';
    cerrar();
    imprimir('<style>@page{size:landscape;margin:10mm}</style>' + todas.map(pag).join(''));
  } catch (e) { b.disabled = false; b.textContent = 'Imprimir'; error(e); }
}

/* ---------------- Datos guardados en el celular ---------------- */
function guardarListaLocal(d) { try { localStorage.setItem('lista:' + d.grupo + ':' + d.fecha, JSON.stringify(d)); } catch (e) {} }
function listaLocal(g, f) { try { return JSON.parse(localStorage.getItem('lista:' + g + ':' + f) || 'null'); } catch (e) { return null; } }
function iniLocal() { try { return JSON.parse(localStorage.getItem('ini') || 'null'); } catch (e) { return null; } }
function fechaDispositivo() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
async function precargarListas() {
  if (!puede('lista')) return;
  try {
    const datos = await api('apiDatosSinConexion', S.ini.hoy);
    const todas = datos.listas;
    Object.keys(todas).forEach((g) => {
      guardarListaLocal(todas[g]);
      guardarLocal('alumnos:' + g, todas[g].alumnos.map((a) => ({ id: a.id, nombre: a.nombre })));
    });
    guardarLocal('contactos', datos.contactos);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.indexOf('lista:') === 0 && k.slice(-10) < S.ini.hoy) localStorage.removeItem(k);
    }
  } catch (e) { /* sin internet: se usan las que ya estaban */ }
}
function errVista(e) {
  $('#main').innerHTML = e && e.red
    ? '<div class="aviso"><b>Sin internet.</b> Puedes pasar lista, registrar retardos y salidas: todo se guarda en el celular y se envía solo al volver la señal.</div>' +
      (puede('lista') ? '<button class="prim ancho grande" onclick="ir(\'lista\')">' + svg('lista', 22) + 'Pasar lista</button><div style="height:8px"></div>' +
        '<button class="oro ancho grande" onclick="formRetardo()">' + svg('reloj', 22) + 'Registrar llegada tarde</button>' : '')
    : '<div class="aviso err">' + esc((e && e.message) || e) + '</div>';
}
function guardarLocal(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function leerLocal(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
function contactosLocal(id) { return ((leerLocal('contactos') || {})[id]) || []; }
/** Si no hay internet y no hay lista guardada de ese día, se arma con los alumnos que el celular ya conoce. */
function listaDesdeAlumnos(grupo, fecha) {
  const al = leerLocal('alumnos:' + grupo);
  if (!al) return null;
  return { grupo: grupo, fecha: fecha, habil: habilLocal(fecha), pasada: false, editable: puede('lista'), local: true,
    alumnos: al.map((a) => ({ id: a.id, nombre: a.nombre, estado: 'P', hora: '', horaSalida: '', comentario: '' })) };
}
function buscarLocal(q) {
  const t = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  const out = [];
  S.ini.grupos.forEach((g) => (leerLocal('alumnos:' + g) || []).forEach((a) => {
    const n = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t.every((p) => n.indexOf(p) >= 0)) out.push({ id: a.id, nombre: a.nombre, grupo: g, estatus: 'ACTIVO' });
  }));
  return out.slice(0, 30);
}
/** Refleja en la lista guardada un retardo o salida capturado sin internet. */
function marcarLocal(id, fecha, cambio) {
  S.ini.grupos.forEach((g) => {
    const d = listaLocal(g, fecha) || listaDesdeAlumnos(g, fecha);
    if (!d) return;
    const a = d.alumnos.find((x) => x.id === id);
    if (!a) return;
    Object.assign(a, cambio);
    guardarListaLocal(d);
  });
}
function habilLocal(f) {
  const c = S.ini.calendario || { dias: [] };
  const p = f.split('-').map(Number);
  const dsem = new Date(p[0], p[1] - 1, p[2]).getDay();
  if (dsem === 0 || dsem === 6) return false;
  if (c.inicio && f < c.inicio) return false;
  if (c.fin && f > c.fin) return false;
  return !c.dias.some((d) => d.fecha === f);
}
function motivoSinClase(f) {
  const c = S.ini.calendario || { dias: [], tipos: {} };
  const d = c.dias.find((x) => x.fecha === f);
  if (d) return ': ' + (d.descripcion || (c.tipos || {})[d.tipo] || 'sin clase');
  const p = f.split('-').map(Number), dsem = new Date(p[0], p[1] - 1, p[2]).getDay();
  if (dsem === 0 || dsem === 6) return ' (fin de semana)';
  if (c.inicio && f < c.inicio) return ' (antes del inicio del ciclo)';
  if (c.fin && f > c.fin) return ' (después del fin del ciclo)';
  return '';
}

/* ---------------- Sesión con Google ---------------- */
const SES = { token: null, email: '', exp: 0, clientId: '' };
let gisListo = false;

function leerJwt(t) {
  try {
    const p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const txt = decodeURIComponent(atob(p).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(txt);
  } catch (e) { return null; }
}
function guardarSesion(t) {
  const p = leerJwt(t);
  if (!p || !p.exp) return false;
  SES.token = t; SES.email = p.email || ''; SES.exp = p.exp * 1000;
  try { localStorage.setItem('sesion', t); } catch (e) {}
  return true;
}
function cargarSesion() { try { const t = localStorage.getItem('sesion'); if (t) guardarSesion(t); } catch (e) {} }
function sesionVigente() { return !!SES.token && SES.exp - Date.now() > 60000; }
function cerrarSesion() {
  if (cola().length && !confirm('Hay registros guardados sin internet que aún no se envían. Si sales se perderán. ¿Salir de todos modos?')) return;
  try { ['sesion', 'ini', 'colaAsistencia'].forEach((k) => localStorage.removeItem(k)); } catch (e) {}
  try { google.accounts.id.disableAutoSelect(); } catch (e) {}
  location.reload();
}
function sesionExpirada() {
  SES.token = null;
  try { localStorage.removeItem('sesion'); } catch (e) {}
  mostrarLogin('Tu sesión expiró. Vuelve a entrar; no se pierde lo que estabas haciendo.');
}
function mostrarLogin(msg) {
  $('#login').classList.remove('hidden');
  $('#loginMsg').textContent = msg || '';
  prepararBotonGoogle();
}
function ocultarLogin() { $('#login').classList.add('hidden'); }
function prepararBotonGoogle(intentos) {
  if (!SES.clientId) {
    $('#loginMsg').textContent = navigator.onLine ? 'Falta configurar el inicio de sesión (GOOGLE_CLIENT_ID en la hoja).' : 'Necesitas internet para iniciar sesión la primera vez.';
    return;
  }
  if (!(window.google && google.accounts && google.accounts.id)) {
    if ((intentos || 0) < 40) setTimeout(() => prepararBotonGoogle((intentos || 0) + 1), 250);
    else $('#loginMsg').textContent = 'No se pudo cargar el inicio de sesión de Google. Revisa tu conexión.';
    return;
  }
  if (!gisListo) {
    google.accounts.id.initialize({ client_id: SES.clientId, callback: alIniciarSesion, auto_select: true, cancel_on_tap_outside: false });
    gisListo = true;
  }
  google.accounts.id.renderButton($('#gbtn'), { theme: 'filled_blue', size: 'large', text: 'signin_with', shape: 'pill', locale: 'es' });
  try { google.accounts.id.prompt(); } catch (e) {}
}
function alIniciarSesion(resp) {
  if (!resp || !guardarSesion(resp.credential)) { $('#loginMsg').textContent = 'No se pudo iniciar sesión. Intenta de nuevo.'; return; }
  ocultarLogin();
  if (S.ini) { toast('Sesión renovada.'); vaciarCola(); return; }
  arrancar();
}
async function configPublica() {
  const r = await fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ accion: 'configPublica' }) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error);
  return j.data;
}

/* ---------------- Inicio ---------------- */
async function arrancar() {
  let r = null, local = false;
  try {
    r = await api('apiInicio');
    try { localStorage.setItem('ini', JSON.stringify(r)); } catch (e) {}
  } catch (e) {
    if (e.red && (r = iniLocal())) { local = true; }
    else if (e.codigo === 'SESION') return;
    else { mostrarLogin(e.message + (e.codigo === 'NO_AUTORIZADO' ? ' Si tienes otra cuenta, elígela abajo.' : '')); return; }
  }
  if (local) {
    r.hoy = fechaDispositivo(); r.ahora = horaAhora();
    toast('Sin internet: trabajando con los datos guardados en el celular.');
  }
  S.ini = r;
  ocultarLogin();
  $('#salir').textContent = iniciales(r.usuario.nombre).toUpperCase() || '?';
  $('#salir').classList.remove('hidden');
  pintarNav(); ir('hoy'); vaciarCola(); precargarListas();
}

async function inicio() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (!window.CONFIG || !CONFIG.API_URL || /PEGA/.test(CONFIG.API_URL)) {
    mostrarLogin('Falta poner la dirección del servidor (API_URL) en config.js.'); return;
  }
  cargarSesion();
  try { SES.clientId = localStorage.getItem('clientId') || ''; } catch (e) {}
  try {
    const c = await configPublica();
    SES.clientId = c.clientId;
    try { localStorage.setItem('clientId', c.clientId); } catch (e) {}
  } catch (e) { /* sin internet */ }
  banner();
  if (sesionVigente()) arrancar();
  else if (!navigator.onLine && iniLocal() && SES.token) arrancar();
  else mostrarLogin();
}
inicio();
