
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
  personal: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20',
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
  { id: 'alumnos', t: 'Alumnos', p: 'ver' }, { id: 'alertas', t: 'Alertas', p: 'ver' }, { id: 'personal', t: 'Personal', p: 'personal' },
  { id: 'reportes', t: 'Reportes', p: 'ver' },
];
function pintarNav() {
  $('#nav').innerHTML = VISTAS.filter((v) => puede(v.p))
    .map((v) => '<button id="nav-' + v.id + '" onclick="ir(\'' + v.id + '\')"><span class="ico">' + svg(v.id) + '</span>' + v.t + '</button>').join('');
}
function ir(v, arg) {
  S.vista = v;
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b.id === 'nav-' + v));
  window.scrollTo(0, 0);
  const t = { hoy: 'Hoy', lista: 'Pasar lista', salidas: 'Salidas', alumnos: 'Alumnos', alertas: 'Alertas', personal: 'Personal', reportes: 'Reportes' };
  cab(fechaLarga(S.ini.hoy), t[v]);
  ({ hoy: vHoy, lista: vLista, salidas: vSalidas, alumnos: vAlumnos, alertas: vAlertas, personal: vPersonal, reportes: vReportes }[v])(arg);
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
    '<button class="grande" style="flex-direction:column;gap:4px;height:auto;padding:14px" onclick="formRespaldo()">' + svg('lista', 24) + 'Listas de respaldo</button>' +
    (puede('cargaMasiva') ? '<button class="grande" style="flex-direction:column;gap:4px;height:auto;padding:14px" onclick="vCarga()">' + svg('mas', 24) + 'Carga de alumnos (Excel)</button>' : '') +
    (puede('cierreCiclo') ? '<button class="grande" style="flex-direction:column;gap:4px;height:auto;padding:14px" onclick="vCierre()">' + svg('hoy', 24) + 'Cierre de ciclo</button>' : '') +
    (puede('usuarios') ? '<button class="grande" style="flex-direction:column;gap:4px;height:auto;padding:14px;grid-column:1/-1" onclick="vUsuarios()">' + svg('alumnos', 24) + 'Usuarios y accesos</button>' : '') + '</div>' +
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

/* ---------------- Vista: Personal (solo prefectura y subdirección) ---------------- */
const TIPO_CIRC = { FALTA: 'F', RETARDO: 'R', SALIDA: 'S', LICENCIA_MEDICA: 'J', PERMISO_ECONOMICO: 'S', PERMISO: 'S', COMISION: 'S', OTRO: 'S' };
const TIPO_CORTO = { FALTA: 'Faltas', RETARDO: 'Retardos', SALIDA: 'Salidas', LICENCIA_MEDICA: 'Licencia', PERMISO_ECONOMICO: 'P. econ.', PERMISO: 'Otro perm.', COMISION: 'Comisión', OTRO: 'Otro' };
function txtInc(i) {
  const fechas = i.fin && i.fin !== i.inicio ? fC(i.inicio) + ' al ' + fC(i.fin) : fC(i.inicio);
  return [fechas, i.hora ? i.hora : '', i.horasClase ? i.horasClase + ' h de clase' : '', i.grupos, i.cubrio ? 'cubrió ' + i.cubrio : '', i.documento]
    .filter(Boolean).join(' · ');
}
const PER_TABS = [['hoy', 'Hoy'], ['ausencias', 'Ausencias'], ['horario', 'Maestros'], ['reporte', 'Reporte'], ['maestros', 'Personal']];
function fG(g) { return String(g).slice(0, 1) + '°' + String(g).slice(1); }
function h12(h) { const p = String(h).split(':'); const n = parseInt(p[0], 10); return (n > 12 ? n - 12 : n) + ':' + p[1]; }
function corto(n) { const p = String(n || '').split(/\s+/); return p.length > 3 ? p.slice(0, 2).join(' ') + ' ' + p.slice(2).join(' ') : n; }
async function vPersonal(tab) {
  S.perTab = tab || S.perTab || 'hoy';
  cargando();
  try {
    let P;
    try { P = await api('apiPersonal'); guardarLocal('personal', P); }
    catch (e) { if (!e.red || !leerLocal('personal')) throw e; P = leerLocal('personal'); toast('Sin internet: se muestra la última información guardada.'); }
    S.per = P;
    S.perRep = S.perRep || { ini: quincena(S.ini.hoy)[0], fin: quincena(S.ini.hoy)[1] };
    const activos = P.personas.filter((p) => p.activo);
    const hoyF = P.hoy.filter((i) => i.tipo !== 'RETARDO' && i.tipo !== 'SALIDA').length;
    cab('Maestros y personal', 'Personal', '<div class="stats">' +
      '<div class="stat"><b class="mal">' + hoyF + '</b><span>Ausentes hoy</span></div>' +
      '<div class="stat"><b class="amb">' + P.hoy.filter((i) => i.tipo === 'RETARDO').length + '</b><span>Retardos hoy</span></div>' +
      '<div class="stat"><b style="color:var(--azul)">' + (P.suplencias || []).length + '</b><span>Suplencias</span></div></div>');
    let h = '<div class="pestanas">' + PER_TABS.map((t) => '<button class="' + (t[0] === S.perTab ? 'on' : '') + '" onclick="vPersonal(\'' + t[0] + '\')">' + t[1] + '</button>').join('') + '</div>';
    h += '<div id="perCuerpo"></div>';
    $('#main').innerHTML = h;
    ({ hoy: perHoy, ausencias: perAusencias, horario: perHorario, reporte: perReporte, maestros: perMaestros }[S.perTab])();
  } catch (e) { errVista(e); }
}
function perHoy() {
  const P = S.per;
  const f = S.perFecha || S.ini.hoy;
  let h = '<button class="oro ancho grande" onclick="formIncidencia()">' + svg('mas', 22) + 'Registrar incidencia</button>';
  h += '<div class="seccion"><h3>Clases del día</h3><input type="date" id="perF" value="' + f + '" style="width:auto" onchange="S.perFecha=this.value;pintarClasesDia()"></div>';
  h += '<div id="clasesDia"><div class="cargando">Cargando…</div></div>';
  h += '<div class="acciones"><button onclick="imprimirFirmasDia()">Imprimir registro de firmas del día</button><button onclick="imprimirFirmasSemana()">Imprimir semana en blanco</button></div>';
  h += '<div class="seccion"><h3>Incidencias de hoy</h3></div>';
  h += P.hoy.length ? '<div class="card" style="padding:2px 14px">' + P.hoy.map((i) =>
    '<div class="mov" onclick="vPersona(\'' + esc(i.idPersona) + '\')"><span class="circ ' + TIPO_CIRC[i.tipo] + '">' + svg(i.tipo === 'RETARDO' ? 'reloj' : 'personal', 18) + '</span>' +
    '<div class="t"><b>' + esc(i.nombre) + '</b><span>' + esc(i.tipoTexto) + ' · ' + esc(txtInc(i)) + '</span></div></div>').join('') + '</div>'
    : '<div class="tenue">Sin faltas, retardos ni licencias registradas hoy.</div>';
  h += '<div class="seccion"><h3>Suplencias vigentes</h3><button class="chico" onclick="formSuplencia()">' + svg('mas', 16) + ' Suplencia</button></div>';
  h += tarjetasSuplencias(P.suplencias || []);
  $('#perCuerpo').innerHTML = h;
  pintarClasesDia();
}
function tarjetasSuplencias(l) {
  return l.length ? l.map((x) => '<div class="card"><div class="fila"><span class="crece"><b>' + esc(x.suplente) + '</b><br>' +
    '<span class="tenue">Suple a ' + esc(x.titular) + ' · desde ' + fC(x.inicio) + (x.fin ? ' hasta ' + fC(x.fin) : ' (hasta nuevo aviso)') + (x.motivo ? ' · ' + esc(x.motivo) : '') + '</span></span>' +
    '<button class="chico" onclick="terminarSuplencia(\'' + esc(x.id) + '\')">Terminar</button></div></div>').join('')
    : '<div class="tenue">Nadie está supliendo a otra persona.</div>';
}
const ESTADO_CLASE = { OK: '', SUPLENTE: 'k-sup', RETARDO: 'k-ret', SALIDA: 'k-sal', SIN_MAESTRO: 'k-sin', CUBIERTA: 'k-cub', SIN_ASIGNAR: 'k-libre' };
function rejillaClases(d, editable) {
  const mapa = {};
  d.clases.forEach((c) => { mapa[c.ini + '|' + c.grupo] = c; });
  let ant = null;
  return '<div class="scroll"><table class="tabla horario"><tr><th class="fija">Hora</th>' + d.grupos.map((g) => '<th>' + fG(g) + '</th>').join('') + '</tr>' +
    d.modulos.map((m) => {
      const receso = ant && ant !== m.ini ? '<tr class="receso"><td class="fija">' + h12(ant) + '</td><td colspan="' + d.grupos.length + '" style="text-align:left;padding-left:12px">Receso ' + h12(ant) + '-' + h12(m.ini) + '</td></tr>' : '';
      ant = m.fin;
      return receso + '<tr><td class="fija"><b>' + h12(m.ini) + '</b><br>' + h12(m.fin) + '</td>' + d.grupos.map((g) => {
        const c = mapa[m.ini + '|' + g];
        const clic = editable ? ' onclick="editarClase(' + editable + ',\'' + m.ini + '\',\'' + esc(g) + '\')"'
          : c && (c.estado === 'SIN_MAESTRO' || c.estado === 'CUBIERTA') ? ' onclick="formCobertura(\'' + m.ini + '\',\'' + esc(g) + '\')"'
          : (c && c.idMaestro ? ' onclick="vPersona(\'' + esc(c.idMaestro) + '\')"' : '');
        if (!c) return '<td class="k-libre"' + clic + '>—</td>';
        if (c.estado === 'SIN_ASIGNAR') return '<td class="k-sin"' + clic + '><b>' + esc(c.asignatura) + '</b><br><i>Sin maestro asignado</i></td>';
        if (c.estado === 'SIN_MAESTRO' || c.estado === 'CUBIERTA') {
          return '<td class="' + ESTADO_CLASE[c.estado] + '"' + clic + '><b>' + esc(c.asignatura) + '</b><br><span class="aus">' + esc(corto(c.maestro)) + '</span> <b class="sigla">' + esc(c.sigla || '') + '</b>' +
            (c.estado === 'CUBIERTA' ? '<br><b>Cubre: ' + esc(corto(c.cubre)) + '</b>' : '<br><b>Sin cubrir</b><br><i>toca para asignar</i>') + '</td>';
        }
        return '<td class="' + (ESTADO_CLASE[c.estado] || '') + '"' + clic + '><b>' + esc(c.asignatura) + '</b><br>' + esc(corto(c.maestro || c.nombre || '')) +
          (c.estado === 'SUPLENTE' ? '<br><i>suple a ' + esc(corto(c.titular)) + '</i>' : '') +
 (c.estado === 'RETARDO' || c.estado === 'SALIDA' ? '<br><i>' + esc((c.incidencias || []).join(', ')) + '</i>' : '') + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</table></div>';
}
async function pintarClasesDia() {
  const el = $('#clasesDia'); if (!el) return;
  el.innerHTML = '<div class="cargando">Cargando…</div>';
  try {
    const f = S.perFecha || S.ini.hoy;
    let d;
    try { d = await api('apiClasesDia', f); guardarLocal('clases:' + f, d); }
    catch (e) { if (!e.red || !leerLocal('clases:' + f)) throw e; d = leerLocal('clases:' + f); }
    S.clasesDia = d;
    if (!d.clases.length) { el.innerHTML = '<div class="aviso">' + (d.dia === 0 || d.dia === 6 ? 'Es fin de semana.' : 'Todavía no hay horario cargado. Ve a la pestaña Horario.') + '</div>'; return; }
    const n = (e) => d.clases.filter((c) => c.estado === e).length;
    el.innerHTML = (d.habil ? '' : '<div class="aviso">Este día está marcado sin clase en el calendario.</div>') +
      '<div class="leyenda"><span class="k-sin">Sin maestro ' + n('SIN_MAESTRO') + '</span><span class="k-cub">Cubiertas ' + n('CUBIERTA') + '</span><span class="k-sup">Con suplente ' + n('SUPLENTE') + '</span>' +
      '<span class="k-ret">Retardo ' + n('RETARDO') + '</span><span>Sin incidencia ' + n('OK') + '</span></div>' + rejillaClases(d, false) +
      (d.ausentes && d.ausentes.length ? '<div class="card" style="margin-top:10px"><b>Personal ausente este día</b>' + d.ausentes.map((a) =>
        '<div class="fila" style="margin-top:6px;font-size:14px"><b class="sigla">' + esc(a.sigla) + '</b><span class="crece">' + esc(a.nombre) + ' <span class="tenue">· ' + esc(a.puesto) + ' · ' +
        (a.inicio === a.fin ? 'solo este día' : 'del ' + fC(a.inicio) + ' al ' + fC(a.fin)) + '</span></span></div>').join('') +
        '<div class="tenue" style="margin-top:8px;font-size:12px">' + Object.keys(d.siglas || {}).map((k) => '<b>' + k + '</b> ' + esc(d.siglas[k].toLowerCase())).join(' · ') + '</div></div>' : '');
  } catch (e) { el.innerHTML = '<div class="aviso err">' + esc(e.message) + '</div>'; }
}
function lunesDe(f) { const p = f.split('-').map(Number); const d = new Date(p[0], p[1] - 1, p[2]); const w = d.getDay() || 7; d.setDate(d.getDate() - w + 1); return d; }
function fISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function paginaFirmas(d, fecha) {
  const mapa = {};
  d.clases.forEach((c) => { mapa[c.ini + '|' + c.grupo] = c; });
  let ant = null;
  const filas = d.modulos.map((m) => {
    const receso = ant && ant !== m.ini ? '<tr><td colspan="' + (d.grupos.length + 2) + '" class="f-receso">R &nbsp; E &nbsp; C &nbsp; E &nbsp; S &nbsp; O</td></tr>' : '';
    ant = m.fin;
    const obs = d.grupos.map((g) => mapa[m.ini + '|' + g]).filter((c) => c && fecha && ['SIN_MAESTRO', 'CUBIERTA', 'RETARDO', 'SALIDA'].indexOf(c.estado) >= 0)
      .map((c) => '<b>' + fG(c.grupo) + '</b> ' + (c.estado === 'SIN_MAESTRO' ? '<b>' + esc(c.sigla) + '</b> sin cubrir'
        : c.estado === 'CUBIERTA' ? '<b>' + esc(c.sigla) + '</b> cubre ' + esc(corto(c.cubre)) : esc((c.incidencias || []).join(', ').toLowerCase()))).join('<br>');
    return receso + '<tr class="f-asig"><td rowspan="2" class="f-hora">' + h12(m.ini) + '-' + h12(m.fin) + '</td>' + d.grupos.map((g) => '<td>' + esc((mapa[m.ini + '|' + g] || {}).asignatura || '') + '</td>').join('') +
      '<td rowspan="2" class="f-obs">' + obs + '</td></tr><tr class="f-nom">' + d.grupos.map((g) => {
        const c = mapa[m.ini + '|' + g] || {};
        if (c.estado === 'SIN_MAESTRO' || c.estado === 'CUBIERTA') {
          return '<td class="f-falta"><span class="f-aus">' + esc(c.maestro) + '</span> <b class="f-sig">' + esc(c.sigla) + '</b><br>' +
            (c.estado === 'CUBIERTA' ? '<b>CUBRE: ' + esc(c.cubre) + '</b>' : '<b class="f-sin">SIN CUBRIR</b>') + '</td>';
        }
        return '<td>' + esc(c.maestro || c.nombre || '') + (c.suplente ? '<br><small>(suple a ' + esc(c.titular) + ')</small>' : '') + '</td>';
      }).join('') + '</tr>';
  }).join('');
  const dias = ['', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
  return '<div class="pagina hoja-firmas"><div class="f-tit">' + esc(S.ini.config.escuela || '').toUpperCase() + '</div>' +
    '<div class="f-cab"><span>TURNO: ' + esc(d.turno || '') + '</span><span>REGISTRO DE FIRMAS</span><span></span></div>' +
    '<div class="f-cab"><span>DÍA: ' + dias[d.dia] + '</span><span></span><span>FECHA: ' + (fecha ? fF(fecha) : '______________________') + '</span></div>' +
    '<table class="f-tabla"><tr><th>HORA/GRUPO</th>' + d.grupos.map((g) => '<th>' + fG(g) + '</th>').join('') + '<th>OBSERVACIONES</th></tr>' + filas + '</table>' +
    (fecha && d.ausentes && d.ausentes.length ? '<div class="f-ausentes"><b>PERSONAL AUSENTE:</b> ' + d.ausentes.map((a) => '<b>' + esc(a.sigla) + '</b> ' + esc(a.nombre) +
      ' (' + esc(a.puesto) + (a.inicio === a.fin ? '' : ', del ' + fC(a.inicio) + ' al ' + fC(a.fin)) + ')').join(' &nbsp;·&nbsp; ') +
      '<br><span class="f-ley">' + Object.keys(d.siglas || {}).map((k) => '<b>' + k + '</b> ' + esc(d.siglas[k].toLowerCase())).join(' · ') + ' · nombre en gris = no atiende el grupo</span></div>' : '') +
    '<div class="firmas"><div>' + esc(d.vobo[0] || '') + '<br>Vo.Bo.</div><div>' + esc(d.vobo[1] || '') + '<br>Vo.Bo.</div></div></div>';
}
const ESTILO_FIRMAS = '<style>@page{size:landscape;margin:8mm}.hoja-firmas .f-tabla{width:100%;border-collapse:collapse;font-size:9px}.f-tabla th,.f-tabla td{border:1px solid #000;padding:2px;text-align:center;vertical-align:bottom}' +
  '.f-tabla th{background:#bbb}.f-asig td{background:#ddd;font-weight:700;vertical-align:middle}.f-nom td{height:44px}.f-hora{font-weight:700;vertical-align:middle!important;white-space:nowrap}' +
  '.f-obs{width:13%;text-align:left!important;vertical-align:top!important;font-size:8px;background:#fff!important;font-weight:400!important}.f-receso{background:#bbb;font-weight:700;letter-spacing:2px}.f-tit{text-align:center;font-weight:700;background:#bbb;font-size:11px}' +
  '.f-falta{background:#f2f2f2}.f-aus{color:#9a9a9a}.f-sig{font-size:10px;color:#000}.f-sin{letter-spacing:.5px}' +
  '.f-ausentes{font-size:8.5px;margin-top:4px;line-height:1.35}.f-ley{color:#444}' +
  '.f-cab{display:flex;justify-content:space-between;font-weight:700;font-size:10px;margin:2px 0}.f-cab span{flex:1}.f-cab span:nth-child(2){text-align:center}.f-cab span:last-child{text-align:right}.hoja-firmas .firmas{margin-top:26px}</style>';
async function imprimirFirmasDia() {
  const f = S.perFecha || S.ini.hoy;
  try {
    const d = S.clasesDia && S.clasesDia.fecha === f ? S.clasesDia : await api('apiClasesDia', f);
    if (!d.clases.length) return toast('Ese día no tiene clases en el horario.', 'err');
    imprimir(ESTILO_FIRMAS + paginaFirmas(d, f));
  } catch (e) { error(e); }
}
async function imprimirFirmasSemana() {
  toast('Preparando la semana…');
  try {
    const H = await api('apiHorario');
    const nombres = {}; H.personas.forEach((p) => { nombres[p.id] = p.nombre; });
    const paginas = [1, 2, 3, 4, 5].map((dia) => paginaFirmas({ dia: dia, modulos: H.modulos, grupos: H.grupos, turno: H.turno, vobo: H.vobo,
      clases: H.clases.filter((c) => c.dia === dia).map((c) => Object.assign({}, c, { maestro: nombres[c.idPersona] || '' })) }, ''));
    imprimir(ESTILO_FIRMAS + paginas.join(''));
  } catch (e) { error(e); }
}
function formCobertura(ini, g) {
  const d = S.clasesDia, c = d.clases.find((x) => x.ini === ini && x.grupo === g);
  if (!c) return;
  const libres = (d.libres || {})[ini] || [], apoyo = (d.apoyo || {})[ini] || [];
  const ids = {}; libres.concat(apoyo).forEach((p) => { ids[p.id] = true; });
  const otros = S.per.personas.filter((p) => p.activo && !ids[p.id] && p.id !== c.idMaestro);
  modal('<h2>' + fG(g) + ' · ' + h12(ini) + '-' + h12(c.fin) + '</h2><div class="tenue">' + esc(c.asignatura) + ' · ' + fF(d.fecha) + '</div>' +
    '<div class="aviso err" style="margin-top:10px"><b>' + esc(c.sigla) + '</b> · ' + esc(c.maestro) + ': ' + esc((c.motivo || '').toLowerCase()) +
      (c.ausDesde && c.ausDesde !== c.ausHasta ? ' del ' + fC(c.ausDesde) + ' al ' + fC(c.ausHasta) : '') + '</div>' +
    '<label>¿Quién cubre este grupo?</label><select id="cCub"><option value="">Selecciona…</option>' +
    (libres.length ? '<optgroup label="Docentes libres a esta hora (sugeridos)">' + libres.map((p) => '<option value="' + esc(p.id) + '"' + (p.id === c.idCubre ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('') + '</optgroup>' : '') +
    (apoyo.length ? '<optgroup label="Prefectura y directivos">' + apoyo.map((p) => '<option value="' + esc(p.id) + '"' + (p.id === c.idCubre ? ' selected' : '') + '>' + esc(p.nombre) + ' · ' + esc(p.puesto) + '</option>').join('') + '</optgroup>' : '') +
    '<optgroup label="Otro personal">' + otros.map((p) => '<option value="' + esc(p.id) + '"' + (p.id === c.idCubre ? ' selected' : '') + '>' + esc(p.nombre) + (p.puesto && p.puesto !== 'Docente' ? ' · ' + esc(p.puesto) : '') + '</option>').join('') + '</optgroup></select>' +
    '<div class="tenue" style="margin-top:6px">' + (libres.length ? libres.length + ' docente(s) no tienen clase a esta hora.' : 'Ningún docente está libre a esta hora.') +
      (apoyo.length ? '' : ' Para que aparezcan prefectos, subdirección o dirección, agrégalos en Personal con ese puesto.') + '</div>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button>' + (c.idCubre ? '<button class="peligro" onclick="guardarCobertura(\'' + ini + '\',\'' + esc(g) + '\',true)">Quitar</button>' : '') +
    '<button class="prim" onclick="guardarCobertura(\'' + ini + '\',\'' + esc(g) + '\')">Guardar</button></div>');
}
async function guardarCobertura(ini, g, quitar) {
  const id = quitar ? '' : $('#cCub').value;
  if (!quitar && !id) return toast('Selecciona quién cubre.', 'err');
  try {
    await api('apiAsignarCobertura', { fecha: S.clasesDia.fecha, ini: ini, grupo: g, idCubre: id });
    cerrar(); toast(quitar ? 'Cobertura quitada.' : 'Cobertura asignada.'); pintarClasesDia();
  } catch (e) { error(e); }
}
async function perAusencias() {
  S.ausDias = S.ausDias || 10;
  $('#perCuerpo').innerHTML = '<div class="cargando">Cargando…</div>';
  try {
    const r = await api('apiAusencias', S.ini.hoy, S.ausDias);
    const dc = r.ausencias.filter((a) => a.docente), ap = r.ausencias.filter((a) => !a.docente);
    const tira = '<div class="dias-aus">' + r.dias.map((d) =>
      '<button class="' + (d.sinMaestro ? 'rojo' : d.ausentes ? 'amb' : '') + '" onclick="S.perFecha=\'' + d.fecha + '\';vPersonal(\'hoy\')">' +
      '<span>' + dia(d.fecha) + '</span><b>' + fC(d.fecha) + '</b><small>' + (d.sinMaestro ? d.sinMaestro + ' sin maestro' : d.ausentes ? d.ausentes + ' ausente' + (d.ausentes > 1 ? 's' : '') : 'Completo') + '</small>' +
      (d.grupos.length ? '<small>' + (d.grupos.length > 4 ? d.grupos.length + ' grupos' : d.grupos.map(fG).join(' ')) + '</small>' : '') + '</button>').join('') + '</div>';
    const tarjeta = (a) => '<div class="card"><div class="fila"><span class="crece"><b>' + esc(a.nombre) + '</b><br><span class="tenue">' + esc(a.puesto) + '</span></span>' +
      (a.enCurso ? badge('F', 'Ausente') : badge('R', 'Próxima')) + '</div>' +
      '<div style="margin-top:8px;font-size:14px">' + (a.inicio === a.fin ? 'El ' + fF(a.inicio) : 'Del ' + fF(a.inicio) + ' al ' + fF(a.fin)) +
      ' · <b>' + a.dias + ' día' + (a.dias === 1 ? '' : 's') + ' hábil' + (a.dias === 1 ? '' : 'es') + '</b></div>' +
      '<div class="tenue">Regresa el ' + dia(a.regresa) + ' ' + fF(a.regresa) + '</div>' +
      (a.docente ? (a.suplente ? '<div style="color:var(--azul);font-weight:600;margin-top:4px">Suplente: ' + esc(a.suplente) + '</div>'
        : a.sinCubrir ? '<div class="mal" style="font-weight:600;margin-top:4px">Sin suplente · ' + a.sinCubrir + ' clase' + (a.sinCubrir === 1 ? '' : 's') + ' sin cubrir' + (a.cubiertas ? ' (' + a.cubiertas + ' ya cubiertas)' : '') + '</div>'
        : '<div style="color:var(--verde);font-weight:600;margin-top:4px">' + (a.cubiertas ? 'Sus ' + a.cubiertas + ' clases ya están cubiertas' : 'No tiene clases esos días') + '</div>') : '') +
      '<div class="acciones"><button class="chico" onclick="vPersona(\'' + esc(a.idPersona) + '\')">Ver</button>' +
      (a.docente && !a.suplente ? '<button class="chico" onclick="formSuplencia(\'' + esc(a.idPersona) + '\')">Asignar suplente</button>' : '') + '</div></div>';
    $('#perCuerpo').innerHTML = '<button class="oro ancho grande" onclick="formIncidencia()">' + svg('mas', 22) + 'Registrar ausencia</button>' +
      '<div class="seccion"><h3>Próximos ' + r.dias.length + ' días de clase</h3><select style="width:auto" onchange="S.ausDias=+this.value;perAusencias()">' +
      [10, 20, 30].map((n) => '<option value="' + n + '"' + (n === S.ausDias ? ' selected' : '') + '>' + n + ' días</option>').join('') + '</select></div>' +
      '<div class="tenue" style="margin-bottom:8px">En rojo, los días con grupos sin maestro. Toca un día para ver sus clases y asignar quién cubre.</div>' + tira +
      '<div class="seccion"><h3>Docentes (' + dc.length + ')</h3></div>' + (dc.map(tarjeta).join('') || '<div class="tenue">Ningún docente tiene ausencias registradas en estos días.</div>') +
      '<div class="seccion"><h3>Personal de apoyo y directivos (' + ap.length + ')</h3></div>' + (ap.map(tarjeta).join('') || '<div class="tenue">Sin ausencias registradas en estos días.</div>');
  } catch (e) { $('#perCuerpo').innerHTML = '<div class="aviso err">' + esc(e.message) + '</div>'; }
}
const DIAS_C = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
async function perHorario() {
  S.horDia = S.horDia || Math.min(Math.max(new Date().getDay(), 1), 5);
  S.horModo = S.horModo || 'maestro';
  $('#perCuerpo').innerHTML = '<div class="cargando">Cargando…</div>';
  try {
    S.hor = await api('apiHorario');
    pintarHorario();
  } catch (e) { $('#perCuerpo').innerHTML = '<div class="aviso err">' + esc(e.message) + '</div>'; }
}
function pintarHorario() {
  const modo = '<div class="modo"><button class="' + (S.horModo === 'maestro' ? 'on' : '') + '" onclick="S.horModo=\'maestro\';S.horSel=null;pintarHorario()">Por maestro</button>' +
    '<button class="' + (S.horModo === 'grupo' ? 'on' : '') + '" onclick="S.horModo=\'grupo\';pintarHorario()">Por grupo</button></div>';
  if (S.horModo === 'maestro') { $('#perCuerpo').innerHTML = modo + '<div id="horM"></div>'; return S.horSel ? pintarMaestro(S.horSel) : listaMaestros(); }
  const H = S.hor, nombres = {};
  H.personas.forEach((p) => { nombres[p.id] = p.nombre; });
  const d = { modulos: H.modulos, grupos: H.grupos, clases: H.clases.filter((c) => c.dia === S.horDia).map((c) => Object.assign({}, c, { maestro: nombres[c.idPersona] || '', estado: c.idPersona ? 'OK' : 'SIN_ASIGNAR' })) };
  $('#perCuerpo').innerHTML = modo + '<div class="chips" style="margin-bottom:10px">' + DIAS_C.slice(1).map((t, i) =>
    '<button class="chip-g' + (S.horDia === i + 1 ? ' on' : '') + '" onclick="S.horDia=' + (i + 1) + ';pintarHorario()">' + t + '</button>').join('') + '</div>' +
    (puede('editarHorario') ? '<div class="tenue" style="margin-bottom:8px">Toca una clase para cambiar la materia o el maestro.</div>' : '') +
    rejillaClases(d, puede('editarHorario') ? S.horDia : 0) + '<div class="acciones"><button onclick="imprimirFirmasSemana()">Imprimir semana en blanco</button></div>';
}
/** Clases de un maestro agrupadas por grupo y materia. */
function bloquesMaestro(id) {
  const B = {};
  S.hor.clases.filter((c) => c.idPersona === id).forEach((c) => {
    const k = c.grupo + '|' + c.asignatura;
    (B[k] = B[k] || { grupo: c.grupo, asignatura: c.asignatura, clases: [] }).clases.push(c);
  });
  return Object.values(B).sort((a, b) => a.grupo.localeCompare(b.grupo) || a.asignatura.localeCompare(b.asignatura))
    .map((b) => { b.clases.sort((x, y) => x.dia - y.dia || x.ini.localeCompare(y.ini)); return b; });
}
function listaMaestros(q) {
  const n = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const H = S.hor;
  const horas = {}; H.clases.forEach((c) => { if (c.idPersona) horas[c.idPersona] = (horas[c.idPersona] || 0) + 1; });
  const sinAsignar = H.clases.filter((c) => !c.idPersona).length;
  const lista = H.personas.filter((p) => p.activo && (p.puesto === 'Docente' || horas[p.id]) && (!q || n(p.nombre).indexOf(n(q)) >= 0));
  const el = $('#horM');
  el.innerHTML = (sinAsignar ? '<div class="aviso">Hay ' + sinAsignar + ' clase(s) sin maestro asignado. Las ves en rojo en "Por grupo".</div>' : '') +
    '<input id="horQ" placeholder="Buscar maestro" value="' + esc(q || '') + '" oninput="listaMaestros(this.value)" style="margin-bottom:8px">' +
    '<div id="horL">' + (lista.map((p) => {
      const bl = bloquesMaestro(p.id);
      return '<div class="card maestro" onclick="pintarMaestro(\'' + esc(p.id) + '\')"><div class="fila"><span class="ini">' + esc(iniciales(p.nombre).toUpperCase()) + '</span>' +
        '<span class="crece"><b>' + esc(p.nombre) + '</b><br><span class="tenue">' + (horas[p.id] || 0) + ' horas por semana</span></span><span class="tenue">›</span></div>' +
        (bl.length ? '<div class="gchips">' + bl.map((b) => '<span>' + fG(b.grupo) + ' <small>' + esc(abrevMat(b.asignatura)) + '</small></span>').join('') + '</div>' : '<div class="tenue" style="margin-top:6px">Sin grupos asignados</div>') + '</div>';
    }).join('') || '<div class="tenue">Sin resultados.</div>') + '</div>';
  if (q !== undefined) { const i = $('#horQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
function abrevMat(m) { const t = String(m || ''); return t.length > 9 ? t.slice(0, 4) + '.' : t; }
function pintarMaestro(id) {
  S.horSel = id;
  if (!$('#horM')) { pintarHorario(); return; }
  const p = S.hor.personas.find((x) => x.id === id) || { nombre: id };
  const bl = bloquesMaestro(id), ed = puede('editarHorario');
  const total = bl.reduce((a, b) => a + b.clases.length, 0);
  $('#horM').innerHTML = '<button class="chico" style="border:0;padding-left:0" onclick="S.horSel=null;pintarHorario()">‹ Todos los maestros</button>' +
    '<div class="card"><b style="font-size:17px">' + esc(p.nombre) + '</b><div class="tenue">' + total + ' horas por semana · ' + bl.length + ' grupo(s)</div>' +
    (ed ? '' : '<div class="tenue" style="margin-top:6px">Solo dirección y subdirección pueden cambiar sus grupos.</div>') + '</div>' +
    bl.map((b, i) => '<div class="card bloque"><div class="fila"><span class="gbadge">' + fG(b.grupo) + '</span><span class="crece"><b>' + esc(b.asignatura) + '</b><br>' +
      '<span class="tenue">' + b.clases.length + ' hora(s) por semana</span></span></div>' +
      '<div class="horas">' + b.clases.map((c) => '<span class="hora">' + DIAS_C[c.dia] + ' ' + h12(c.ini) +
        (ed ? '<button title="Quitar esta hora" onclick="quitarHora(' + c.dia + ',\'' + c.ini + '\',\'' + esc(c.grupo) + '\',\'' + esc(c.asignatura) + '\')">×</button>' : '') + '</span>').join('') + '</div>' +
      (ed ? '<div class="acciones"><button class="chico" onclick="formPasarGrupo(' + i + ')">Pasar a otro maestro</button><button class="chico peligro" onclick="quitarGrupo(' + i + ')">Ya no da este grupo</button></div>' : '') + '</div>').join('') +
    (bl.length ? '' : '<div class="tenue">No tiene grupos asignados.</div>') +
    (ed ? '<button class="prim ancho" style="margin-top:6px" onclick="formAgregarClases()">' + svg('mas', 18) + ' Agregar grupo u hora</button>' : '');
}
async function guardarCambiosHorario(cambios, msg) {
  try {
    await api('apiGuardarClases', cambios);
    cerrar(); toast(msg);
    S.hor = await api('apiHorario'); pintarHorario();
  } catch (e) { error(e); }
}
function quitarHora(dia, ini, g, asig) {
  if (!confirm('¿Quitar ' + DIAS_C[dia] + ' ' + h12(ini) + ' de ' + fG(g) + '? La hora queda sin maestro asignado.')) return;
  guardarCambiosHorario([{ dia: dia, ini: ini, grupo: g, asignatura: asig, idPersona: '' }], 'Hora quitada.');
}
function quitarGrupo(i) {
  const b = bloquesMaestro(S.horSel)[i];
  if (!confirm('¿Ya no da ' + b.asignatura + ' en ' + fG(b.grupo) + '? Sus ' + b.clases.length + ' horas quedan sin maestro asignado.')) return;
  guardarCambiosHorario(b.clases.map((c) => ({ dia: c.dia, ini: c.ini, grupo: c.grupo, asignatura: c.asignatura, idPersona: '' })), 'Grupo quitado. Asígnalo a otro maestro.');
}
/** Horas en que un maestro ya tiene clase: {"dia|ini": grupo} */
function ocupadoMaestro(id) { const o = {}; S.hor.clases.forEach((c) => { if (c.idPersona === id) o[c.dia + '|' + c.ini] = c.grupo; }); return o; }
function formPasarGrupo(i) {
  const b = bloquesMaestro(S.horSel)[i];
  S.pasar = b;
  modal('<h2>Pasar ' + fG(b.grupo) + ' · ' + esc(b.asignatura) + '</h2><div class="tenue">' + b.clases.map((c) => DIAS_C[c.dia] + ' ' + h12(c.ini)).join(', ') + '</div>' +
    '<label>¿Quién lo da ahora?</label><select id="pNuevo" onchange="revisarChoques()"><option value="">Selecciona…</option>' +
    S.hor.personas.filter((p) => p.activo && p.id !== S.horSel && (p.puesto === 'Docente' || !p.puesto)).map((p) => '<option value="' + esc(p.id) + '">' + esc(p.nombre) + '</option>').join('') + '</select>' +
    '<div id="pChoque"></div>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="pBtn" onclick="guardarPasar()">Guardar</button></div>');
}
function revisarChoques() {
  const id = $('#pNuevo').value, o = id ? ocupadoMaestro(id) : {};
  const ch = S.pasar.clases.filter((c) => o[c.dia + '|' + c.ini]);
  $('#pChoque').innerHTML = ch.length ? '<div class="aviso err">Ya tiene clase: ' + ch.map((c) => DIAS_C[c.dia] + ' ' + h12(c.ini) + ' (' + fG(o[c.dia + '|' + c.ini]) + ')').join(', ') +
    '. Esas horas no se pueden pasar.</div>' : (id ? '<div class="aviso info">Está libre en todas esas horas.</div>' : '');
  $('#pBtn').disabled = !!ch.length;
}
function guardarPasar() {
  const id = $('#pNuevo').value;
  if (!id) return toast('Selecciona al maestro.', 'err');
  guardarCambiosHorario(S.pasar.clases.map((c) => ({ dia: c.dia, ini: c.ini, grupo: c.grupo, asignatura: c.asignatura, idPersona: id })), 'Grupo pasado al nuevo maestro.');
}
function formAgregarClases() {
  const H = S.hor;
  const materias = Array.from(new Set(H.clases.map((x) => x.asignatura).filter(Boolean))).sort();
  S.agSel = {};
  modal('<h2>Agregar grupo u hora</h2><label>Grupo</label><select id="aGru" onchange="S.agSel={};pintarHuecos()">' + H.grupos.map((g) => '<option value="' + esc(g) + '">' + fG(g) + '</option>').join('') + '</select>' +
    '<label>Materia</label><input id="aMat" list="aMats" placeholder="Ej. MATEMÁTICAS"><datalist id="aMats">' + materias.map((m) => '<option value="' + esc(m) + '">').join('') + '</datalist>' +
    '<span class="etiq">Toca las horas que dará</span><div id="aHuecos"></div>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" onclick="guardarAgregar()">Guardar</button></div>');
  pintarHuecos();
}
function pintarHuecos() {
  const H = S.hor, g = $('#aGru').value, yo = ocupadoMaestro(S.horSel), nombres = {};
  H.personas.forEach((p) => { nombres[p.id] = p.nombre; });
  const clase = {}; H.clases.forEach((c) => { if (c.grupo === g) clase[c.dia + '|' + c.ini] = c; });
  $('#aHuecos').innerHTML = '<div class="scroll"><table class="tabla huecos"><tr><th></th>' + DIAS_C.slice(1).map((d) => '<th>' + d + '</th>').join('') + '</tr>' +
    H.modulos.map((m) => '<tr><td><b>' + h12(m.ini) + '</b></td>' + [1, 2, 3, 4, 5].map((d) => {
      const k = d + '|' + m.ini, c = clase[k];
      if (yo[k] === g) return '<td class="h-mio">Ya la da</td>';
      if (yo[k]) return '<td class="h-no">Tiene ' + fG(yo[k]) + '</td>';
      if (c && c.idPersona) return '<td class="h-no">' + esc(abrevMat(c.asignatura)) + '<br>' + esc(corto(nombres[c.idPersona] || '').split(' ')[0]) + '</td>';
      return '<td class="h-libre' + (S.agSel[k] ? ' on' : '') + '" onclick="S.agSel[\'' + k + '\']=!S.agSel[\'' + k + '\'];pintarHuecos()">' + (S.agSel[k] ? '✓' : c ? esc(abrevMat(c.asignatura)) + '<br>libre' : 'Libre') + '</td>';
    }).join('') + '</tr>').join('') + '</table></div><div class="tenue" style="margin-top:6px">Solo puedes elegir horas en que el grupo no tiene maestro y el maestro está libre.</div>';
}
function guardarAgregar() {
  const g = $('#aGru').value, mat = $('#aMat').value.trim();
  const ks = Object.keys(S.agSel).filter((k) => S.agSel[k]);
  if (!mat) return toast('Escribe la materia.', 'err');
  if (!ks.length) return toast('Toca al menos una hora.', 'err');
  guardarCambiosHorario(ks.map((k) => ({ dia: +k.split('|')[0], ini: k.split('|')[1], grupo: g, asignatura: mat, idPersona: S.horSel })), ks.length + ' hora(s) agregada(s).');
}
function editarClase(dia, ini, g) {
  const H = S.hor;
  const c = H.clases.find((x) => x.dia === dia && x.ini === ini && x.grupo === g) || {};
  const materias = Array.from(new Set(H.clases.map((x) => x.asignatura).filter(Boolean))).sort();
  modal('<h2>' + ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'][dia] + ' ' + h12(ini) + ' · ' + fG(g) + '</h2>' +
    '<label>Materia</label><input id="hAsi" list="hMat" value="' + esc(c.asignatura || '') + '"><datalist id="hMat">' + materias.map((m) => '<option value="' + esc(m) + '">').join('') + '</datalist>' +
    '<label>Maestro</label><select id="hPer"><option value="">Sin asignar</option>' + H.personas.filter((p) => p.activo || p.id === c.idPersona).map((p) =>
      '<option value="' + esc(p.id) + '"' + (p.id === c.idPersona ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('') + '</select>' +
    '<div class="acciones"><button onclick="guardarClase(' + dia + ',\'' + ini + '\',\'' + esc(g) + '\',true)">Dejar libre</button><button onclick="cerrar()">Cancelar</button>' +
    '<button class="prim" id="hBtn" onclick="guardarClase(' + dia + ',\'' + ini + '\',\'' + esc(g) + '\')">Guardar</button></div>');
}
async function guardarClase(dia, ini, g, libre) {
  try {
    await api('apiGuardarClase', { dia: dia, ini: ini, grupo: g, asignatura: libre ? '' : $('#hAsi').value, idPersona: libre ? '' : $('#hPer').value });
    cerrar(); toast('Horario actualizado.');
    S.hor = await api('apiHorario'); pintarHorario();
  } catch (e) { error(e); }
}
function perReporte() {
  const r = S.perRep;
  $('#perCuerpo').innerHTML = '<div class="card">' +
    '<div class="fila"><div class="crece"><label>Desde</label><input id="qIni" type="date" value="' + r.ini + '" onchange="S.perRep.ini=this.value"></div>' +
    '<div class="crece"><label>Hasta</label><input id="qFin" type="date" value="' + r.fin + '" onchange="S.perRep.fin=this.value"></div></div>' +
    '<div class="acciones"><button class="chico" onclick="perPeriodo(0)">Quincena actual</button><button class="chico" onclick="perPeriodo(-1)">Quincena anterior</button>' +
    '<button class="chico" onclick="perPeriodo(\'mes\')">Este mes</button></div>' +
    '<div class="acciones"><button class="prim" onclick="verRepPersonal()">Ver reporte</button><button onclick="imprimirRepPersonal()">Imprimir</button>' +
    '<button onclick="exportarPersonal()">Descargar en Excel</button></div></div><div id="qRes"></div>';
}
function perMaestros() {
  const activos = S.per.personas.filter((p) => p.activo);
  $('#perCuerpo').innerHTML = '<div class="acciones" style="margin-top:0"><button class="prim" onclick="formPersona()">' + svg('mas', 16) + ' Agregar persona</button>' +
    '<button onclick="formSuplencia()">Registrar suplencia</button></div>' +
    '<div class="seccion"><h3>Personal activo (' + activos.length + ')</h3></div>' +
    '<input id="qQ" placeholder="Buscar por nombre o materia" oninput="filtrarPersonal(this.value)" style="margin-bottom:8px"><div id="qLista"></div>';
  filtrarPersonal('');
}
function opcionesPersonas(sel, excluir) {
  return '<option value="">Selecciona…</option>' + S.per.personas.filter((p) => p.activo && p.id !== excluir).map((p) =>
    '<option value="' + esc(p.id) + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.nombre) + '</option>').join('');
}
function formSuplencia(idTitular) {
  modal('<h2>Registrar suplencia</h2><div class="aviso info">El suplente da las clases del titular en esas fechas. El horario no cambia; al terminar la suplencia regresa el titular.</div>' +
    '<label>¿A quién se suple?</label><select id="uTit">' + opcionesPersonas(idTitular) + '</select>' +
    '<label>Suplente</label><select id="uSup">' + opcionesPersonas() + '</select>' +
    '<div class="tenue">Si el suplente es nuevo, primero agrégalo en Maestros → Agregar persona.</div>' +
    '<div class="fila"><div class="crece"><label>Desde</label><input id="uIni" type="date" value="' + S.ini.hoy + '"></div>' +
    '<div class="crece"><label>Hasta (vacío = hasta nuevo aviso)</label><input id="uFin" type="date"></div></div>' +
    '<label>Motivo</label><select id="uMot"><option>Licencia médica</option><option>Permiso</option><option>Comisión</option><option>Incapacidad</option><option>Interinato</option><option>Otro</option></select>' +
    '<label>Comentario</label><input id="uCom">' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="uBtn" onclick="guardarSuplencia()">Guardar</button></div>');
}
async function guardarSuplencia() {
  const b = $('#uBtn'); b.disabled = true;
  try {
    await api('apiRegistrarSuplencia', { idTitular: $('#uTit').value, idSuplente: $('#uSup').value, inicio: $('#uIni').value, fin: $('#uFin').value, motivo: $('#uMot').value, comentario: $('#uCom').value });
    cerrar(); toast('Suplencia registrada.'); vPersonal();
  } catch (e) { b.disabled = false; error(e); }
}
async function terminarSuplencia(id) {
  const f = prompt('Último día de la suplencia (aaaa-mm-dd):', S.ini.hoy);
  if (!f) return;
  try { await api('apiTerminarSuplencia', id, f.trim()); toast('Suplencia terminada.'); cerrar(); vPersonal(); } catch (e) { error(e); }
}
function formBaja() {
  const p = S.perSel;
  modal('<h2>Dar de baja</h2><div class="tenue">' + esc(p.nombre) + '</div>' +
    '<div class="aviso">Úsalo cuando la persona ya no trabaja en la escuela. Sus registros se conservan. Si solo falta por un tiempo, mejor registra una suplencia.</div>' +
    '<label>¿Quién toma su horario?</label><select id="bPas"><option value="">Nadie por ahora (las clases quedan sin asignar)</option>' + opcionesPersonas('', p.id).replace('<option value="">Selecciona…</option>', '') + '</select>' +
    '<label>Motivo</label><input id="bMot" placeholder="Ej. cambio de adscripción, jubilación">' +
    '<div class="aviso info">Si tenía acceso a la plataforma, quítalo también en Reportes → Usuarios y accesos.</div>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="bBtn" onclick="guardarBaja()">Dar de baja</button></div>');
}
async function guardarBaja() {
  const b = $('#bBtn'); b.disabled = true;
  try {
    const r = await api('apiBajaPersona', S.perSel.id, { pasarA: $('#bPas').value, motivo: $('#bMot').value });
    cerrar(); toast('Baja registrada.' + (r.clases ? ' ' + r.clases + ' clases pasaron al nuevo maestro.' : '')); vPersonal('maestros');
  } catch (e) { b.disabled = false; error(e); }
}
function filtrarPersonal(q) {
  const n = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const t = n(q).trim();
  const l = S.per.personas.filter((p) => !t || n(p.nombre + ' ' + p.asignatura + ' ' + p.puesto).indexOf(t) >= 0);
  $('#qLista').innerHTML = l.length ? '<div class="card" style="padding:4px 10px">' + l.map((p) =>
    '<div class="res fila" onclick="vPersona(\'' + esc(p.id) + '\')"><span class="ini">' + esc(iniciales(p.nombre).toUpperCase()) + '</span><span class="crece"><b>' + esc(p.nombre) + '</b><br>' +
    '<span class="tenue">' + esc([p.puesto, p.asignatura].filter(Boolean).join(' · ')) + '</span></span>' + (p.activo ? '' : badge('BAJA', 'Inactivo')) + '</div>').join('') + '</div>'
    : '<div class="tenue">' + (S.per.personas.length ? 'Sin resultados.' : 'Todavía no hay personal. Toca "Agregar" para dar de alta a los maestros.') + '</div>';
}
function perPeriodo(d) {
  if (d === 'mes') { const m = S.ini.hoy.slice(0, 7); const p = m.split('-').map(Number); S.perRep = { ini: m + '-01', fin: m + '-' + String(new Date(p[0], p[1], 0).getDate()).padStart(2, '0') }; }
  else { const q = quincena(S.ini.hoy, d); S.perRep = { ini: q[0], fin: q[1] }; }
  $('#qIni').value = S.perRep.ini; $('#qFin').value = S.perRep.fin;
  verRepPersonal();
}
const COLS_PER = ['FALTA', 'RETARDO', 'SALIDA', 'LICENCIA_MEDICA', 'PERMISO_ECONOMICO', 'PERMISO', 'COMISION', 'OTRO'];
function tablaPersonal(r, soloCon) {
  const filas = soloCon ? r.filas.filter((f) => f.conIncidencias) : r.filas;
  if (!filas.length) return '<div class="tenue">No hay incidencias en este periodo.</div>';
  return '<table class="tabla"><tr><th>#</th><th class="izq">Nombre</th>' + COLS_PER.map((k) => '<th>' + TIPO_CORTO[k] + '</th>').join('') + '</tr>' +
    filas.map((f, i) => '<tr><td>' + (i + 1) + '</td><td class="izq">' + esc(f.nombre) + (f.asignatura ? '<br><span style="font-size:11px;color:#777">' + esc(f.asignatura) + '</span>' : '') + '</td>' +
      COLS_PER.map((k) => '<td class="' + (f.totales[k] && (k === 'FALTA') ? 'c-F' : f.totales[k] && k === 'RETARDO' ? 'c-R' : '') + '">' + (f.totales[k] || '') + '</td>').join('') + '</tr>').join('') + '</table>';
}
function detallePersonal(r) {
  if (!r.detalle.length) return '';
  return '<table class="tabla"><tr><th class="izq">Fecha</th><th class="izq">Nombre</th><th class="izq">Tipo</th><th>Días</th><th class="izq">Detalle</th></tr>' +
    r.detalle.map((d) => '<tr><td class="izq">' + fC(d.inicio) + (d.fin !== d.inicio ? ' al ' + fC(d.fin) : '') + '</td><td class="izq">' + esc(d.nombre) + '</td><td class="izq">' + esc(d.tipoTexto) + '</td>' +
      '<td>' + (d.tipo === 'RETARDO' || d.tipo === 'SALIDA' ? '' : d.dias) + '</td><td class="izq">' +
      esc([d.hora, d.horasClase ? d.horasClase + ' h de clase' : '', d.grupos, d.cubrio ? 'cubrió ' + d.cubrio : '', d.documento, d.comentario].filter(Boolean).join(' · ')) + '</td></tr>').join('') + '</table>';
}
async function verRepPersonal() {
  $('#qRes').innerHTML = '<div class="cargando">Cargando…</div>';
  try {
    const r = await api('apiReportePersonal', S.perRep.ini, S.perRep.fin);
    $('#qRes').innerHTML = '<h3>' + fF(r.inicio) + ' al ' + fF(r.fin) + ' (' + r.habiles + ' días hábiles)</h3>' +
      '<div class="scroll">' + tablaPersonal(r, true) + '</div>' +
      (r.detalle.length ? '<h3>Detalle</h3><div class="scroll">' + detallePersonal(r) + '</div>' : '') +
      '<div class="tenue" style="margin-top:6px">Faltas, licencias, permisos y comisiones cuentan días hábiles. Retardos y salidas cuentan veces.</div>';
  } catch (e) { $('#qRes').innerHTML = '<div class="aviso err">' + esc(e.message) + '</div>'; }
}
async function imprimirRepPersonal() {
  try {
    const r = await api('apiReportePersonal', S.perRep.ini, S.perRep.fin);
    imprimir('<style>@page{size:landscape;margin:10mm}</style><div class="pagina">' + encabezadoDoc() +
      '<h3 style="text-align:center;margin:8px 0">Reporte de incidencias del personal · ' + fF(r.inicio) + ' al ' + fF(r.fin) + ' (' + r.habiles + ' días hábiles)</h3>' +
      tablaPersonal(r, false) + (r.detalle.length ? '<h4>Detalle</h4>' + detallePersonal(r) : '') +
      '<p style="font-size:10px">Faltas, licencias, permisos y comisiones en días hábiles; retardos y salidas en número de veces.</p>' +
      '<div class="firmas"><div>Prefectura</div><div>Subdirección</div></div></div>');
  } catch (e) { error(e); }
}
async function exportarPersonal() {
  toast('Generando la hoja…');
  try {
    const r = await api('apiExportarPersonal', S.perRep.ini, S.perRep.fin);
    const blob = new Blob(['﻿' + r.csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = r.nombre;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast('Archivo descargado: ' + r.nombre + '. Ábrelo con Excel.');
  } catch (e) { error(e); }
}
function formIncidencia(idPre) {
  const P = S.per, act = P.personas.filter((p) => p.activo);
  if (!act.length) { toast('Primero agrega al personal.', 'err'); formPersona(); return; }
  modal('<h2>Registrar incidencia</h2>' +
    '<label>Persona</label><select id="iPer"><option value="">Selecciona…</option>' + act.map((p) =>
      '<option value="' + esc(p.id) + '"' + (p.id === idPre ? ' selected' : '') + '>' + esc(p.nombre) + (p.asignatura ? ' · ' + esc(p.asignatura) : '') + '</option>').join('') + '</select>' +
    '<span class="etiq">Tipo</span><input type="hidden" id="iTipo" value=""><div class="pastillas">' + Object.keys(P.tipos).map((k) =>
      '<button type="button" class="pastilla" data-k="' + k + '" onclick="elegirTipoInc(\'' + k + '\')">' + esc(P.tipos[k].t) + '</button>').join('') + '</div>' +
    '<div id="iCampos" class="hidden">' +
    '<div class="fila"><div class="crece"><label id="iIniL">Fecha</label><input id="iIni" type="date" value="' + S.ini.hoy + '"></div>' +
    '<div class="crece" id="iFinC"><label>Hasta</label><input id="iFin" type="date" value="' + S.ini.hoy + '"></div>' +
    '<div class="crece hidden" id="iHoraC"><label>Hora</label><input id="iHora" type="time" value="' + horaAhora() + '"></div></div>' +
    '<span class="etiq">Grupos afectados (opcional)</span><div class="chips" style="flex-wrap:wrap">' + S.ini.grupos.map((g) =>
      '<button type="button" class="chip-g sel" onclick="this.classList.toggle(\'on\')" data-g="' + esc(g) + '">' + esc(g) + '</button>').join('') + '</div>' +
    '<div class="fila"><div class="crece"><label>Horas de clase sin atender</label><input id="iHC" type="number" min="0" max="12" inputmode="numeric" placeholder="Ej. 3"></div>' +
    '<div class="crece"><label>¿Quién cubrió?</label><input id="iCub" placeholder="Ej. prefecta"></div></div>' +
    '<label>Documento o folio (opcional)</label><input id="iDoc" placeholder="Ej. folio de licencia, oficio de comisión">' +
    '<label>Comentario</label><textarea id="iCom" rows="2"></textarea>' +
    '<div class="tenue" id="iNota"></div></div>' +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="iBtn" onclick="guardarIncidencia()">Guardar</button></div>');
}
function elegirTipoInc(k) {
  const t = S.per.tipos[k];
  document.querySelectorAll('.pastilla').forEach((b) => b.classList.toggle('on', b.dataset.k === k));
  $('#iTipo').value = k;
  $('#iCampos').classList.remove('hidden');
  $('#iFinC').classList.toggle('hidden', !t.rango);
  $('#iHoraC').classList.toggle('hidden', !t.hora);
  $('#iIniL').textContent = t.rango ? 'Desde' : 'Fecha';
  $('#iNota').textContent = k === 'LICENCIA_MEDICA' ? 'Anota solo el folio y las fechas. No escribas el diagnóstico ni datos médicos.'
    : t.rango ? 'Se cuentan solo los días hábiles del periodo (sin fines de semana ni días sin clase).' : '';
}
async function guardarIncidencia() {
  const tipo = $('#iTipo').value, t = S.per.tipos[tipo];
  const d = { idPersona: $('#iPer').value, tipo: tipo, inicio: $('#iIni').value };
  if (!d.idPersona) return toast('Selecciona a la persona.', 'err');
  if (!t) return toast('Selecciona el tipo de incidencia.', 'err');
  if (t.rango) d.fin = $('#iFin').value || d.inicio;
  if (t.hora) d.hora = $('#iHora').value;
  d.grupos = Array.from(document.querySelectorAll('#iCampos .chip-g.on')).map((b) => b.dataset.g).join(', ');
  d.horasClase = $('#iHC').value; d.cubrio = $('#iCub').value; d.documento = $('#iDoc').value; d.comentario = $('#iCom').value;
  const b = $('#iBtn'); b.disabled = true;
  const enCola = () => { encolar('apiRegistrarIncidencia', [d]); cerrar(); toast('Sin internet: quedó guardado en el celular y se enviará al volver la señal.'); };
  if (!navigator.onLine) return enCola();
  try {
    const r = await api('apiRegistrarIncidencia', d);
    cerrar(); toast(r.repetida ? 'Ese registro ya existía.' : 'Incidencia registrada' + (t.rango && r.dias > 1 ? ' (' + r.dias + ' días hábiles).' : '.'));
    if (S.vista === 'personal') vPersonal();
  } catch (e) { if (e.red) return enCola(); b.disabled = false; error(e); }
}
async function vPersona(id) {
  modal('<div class="cargando">Cargando…</div>');
  try {
    const r = await api('apiHistorialPersona', id);
    const p = r.persona;
    S.perSel = p;
    const res = COLS_PER.filter((k) => r.totales[k]).map((k) => '<div class="stat"><b' + (k === 'FALTA' ? ' class="mal"' : k === 'RETARDO' ? ' class="amb"' : '') + '>' +
      r.totales[k] + '</b><span>' + esc(S.per.tipos[k].t) + (S.per.tipos[k].rango ? ' (días)' : '') + '</span></div>').join('');
    $('#modalBody').innerHTML = '<div class="fila"><span class="ini">' + esc(iniciales(p.nombre).toUpperCase()) + '</span><span class="crece"><b>' + esc(p.nombre) + '</b><br>' +
      '<span class="tenue">' + esc([p.puesto, p.asignatura].filter(Boolean).join(' · ')) + (p.activo ? '' : ' · inactivo') + '</span></span></div>' +
      (res ? '<div class="stats claro" style="margin-top:12px">' + res + '</div>' : '') +
      '<div class="acciones">' + (p.activo ? '<button class="prim" onclick="formIncidencia(\'' + esc(p.id) + '\')">Registrar incidencia</button>' : '') +
      '<button onclick="formPersona(true)">Editar datos</button>' + (p.activo ? '<button onclick="formSuplencia(\'' + esc(p.id) + '\')">Asignar suplente</button>' +
        '<button onclick="formBaja()">Dar de baja</button>' : '') + '</div>' +
      '<h3>Ciclo ' + esc(r.ciclo) + ' (' + r.incidencias.length + ')</h3>' +
      (r.incidencias.length ? r.incidencias.map((i) => '<div class="card"><div class="fila"><span class="circ ' + TIPO_CIRC[i.tipo] + '" style="width:32px;height:32px;border-radius:16px;display:flex;align-items:center;justify-content:center">' +
        svg(i.tipo === 'RETARDO' ? 'reloj' : 'personal', 16) + '</span><span class="crece"><b>' + esc(i.tipoTexto) + '</b>' +
        (i.tipo !== 'RETARDO' && i.tipo !== 'SALIDA' && i.dias > 1 ? ' <span class="tenue">' + i.dias + ' días</span>' : '') + '<br><span class="tenue">' + esc(txtInc(i)) + '</span>' +
        (i.comentario ? '<br><span class="tenue">' + esc(i.comentario) + '</span>' : '') + '</span>' +
        '<button class="chico" style="border:0" onclick="cancelarIncidencia(\'' + esc(i.id) + '\')">Cancelar</button></div></div>').join('')
        : '<div class="tenue">Sin incidencias en este ciclo.</div>') +
      '<div class="acciones"><button onclick="cerrar()">Cerrar</button></div>';
  } catch (e) { cerrar(); error(e); }
}
async function cancelarIncidencia(id) {
  const m = prompt('¿Por qué se cancela este registro? (queda en la bitácora)');
  if (!m || !m.trim()) return;
  try { await api('apiCancelarIncidencia', id, m); toast('Registro cancelado.'); vPersona(S.perSel.id); if (S.vista === 'personal') vPersonal(); }
  catch (e) { error(e); }
}
function formPersona(editar) {
  const p = editar ? S.perSel : { nombre: '', puesto: 'Docente', asignatura: '', activo: true, notas: '' };
  modal('<h2>' + (editar ? 'Editar datos' : 'Agregar persona') + '</h2>' +
    '<label>Nombre completo (como aparece en el horario)</label><input id="eNom" value="' + esc(p.nombre) + '" placeholder="Ej. María López García">' +
    '<label>Puesto</label><select id="ePue">' + (S.per.puestos || ['Docente']).map((x) => '<option' + (x === p.puesto ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select>' +
    '<label>Asignatura o función</label><input id="eAsi" value="' + esc(p.asignatura) + '" placeholder="Ej. Matemáticas">' +
    '<label>Notas</label><input id="eNot" value="' + esc(p.notas) + '">' +
    (editar ? '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="eAct" style="width:auto"' + (p.activo ? ' checked' : '') + '> Activo</label>' : '') +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button><button class="prim" id="eBtn" onclick="guardarPersona(' + (editar ? 'true' : 'false') + ')">Guardar</button></div>');
}
async function guardarPersona(editar) {
  const b = $('#eBtn'); b.disabled = true;
  try {
    await api('apiGuardarPersona', { id: editar ? S.perSel.id : '', nombre: $('#eNom').value, puesto: $('#ePue').value, asignatura: $('#eAsi').value,
      notas: $('#eNot').value, activo: editar ? $('#eAct').checked : true });
    cerrar(); toast('Datos guardados.'); vPersonal('maestros');
  } catch (e) { b.disabled = false; error(e); }
}

/* ---------------- Carga masiva de alumnos ---------------- */
function cargarXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  const cargar = (src) => new Promise((ok, mal) => { const sc = document.createElement('script'); sc.src = src; sc.onload = () => ok(window.XLSX); sc.onerror = mal; document.head.appendChild(sc); });
  return cargar('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js').catch(() => cargar('lib/xlsx.full.min.js'));
}
const PLANTILLA = ['Apellido paterno', 'Apellido materno', 'Nombre(s)', 'CURP', 'Grupo', 'Tutor 1 nombre', 'Tutor 1 parentesco', 'Tutor 1 teléfono',
  'Tutor 2 nombre', 'Tutor 2 parentesco', 'Tutor 2 teléfono', 'Tutor 3 nombre', 'Tutor 3 parentesco', 'Tutor 3 teléfono'];
function vCarga() {
  S.vista = 'reportes';
  S.carga = null;
  cab('Alta de muchos alumnos a la vez', 'Carga de alumnos');
  $('#main').innerHTML = '<div class="card"><h3 style="margin-top:0">1. Descarga la plantilla</h3>' +
    '<div class="tenue">Llénala en Excel: un alumno por renglón. Si ya tienes una lista de la SEG o de control escolar, también sirve: la app reconoce columnas como "Apellido paterno", "Nombre", "CURP", "Grupo" o "Grado" y "Grupo" por separado.</div>' +
    '<div class="acciones"><button onclick="descargarPlantilla()">Descargar plantilla de Excel</button></div></div>' +
    '<div class="card"><h3 style="margin-top:0">2. Sube el archivo</h3><input type="file" id="cArch" accept=".xlsx,.xls,.csv" onchange="leerArchivoCarga(this.files[0])">' +
    '<div class="tenue" style="margin-top:6px">Excel (.xlsx) o CSV. Nada se guarda hasta que confirmes.</div></div><div id="cRes"></div>' +
    '<div class="acciones"><button onclick="ir(\'reportes\')">Volver</button></div>';
}
async function descargarPlantilla() {
  try {
    const X = await cargarXLSX();
    const wb = X.utils.book_new();
    const ws = X.utils.aoa_to_sheet([PLANTILLA, ['LÓPEZ', 'RUIZ', 'ANA SOFÍA', 'LORA100101MGTPZNA1', '1G', 'MARÍA RUIZ', 'Madre', '4771234567', '', '', '', '', '', '']]);
    ws['!cols'] = PLANTILLA.map((h) => ({ wch: Math.max(14, h.length + 2) }));
    X.utils.book_append_sheet(wb, ws, 'Alumnos');
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Instrucciones'], ['Un alumno por renglón. Borra el renglón de ejemplo.'],
      ['Grupo: ' + S.ini.grupos.join(', ') + ' (también acepta 1°G o 1 G).'], ['Teléfono a 10 dígitos.'], ['La CURP evita duplicados; si no la tienes, deja la celda vacía.']]), 'Instrucciones');
    X.writeFile(wb, 'Plantilla_alumnos.xlsx');
  } catch (e) { toast('No se pudo crear la plantilla. Revisa tu conexión.', 'err'); }
}
const nk = (h) => String(h || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
/** Convierte los renglones de la hoja en alumnos, reconociendo los nombres de columna más comunes. */
function mapearFilas(aoa) {
  let hi = aoa.findIndex((r) => r.some((c) => /paterno|nombre|curp|alumno/.test(nk(c))));
  if (hi < 0) return { error: 'No encontré los encabezados. Usa la plantilla o pon una fila con "Apellido paterno", "Nombre(s)", "Grupo".' };
  const H = aoa[hi].map(nk);
  const col = (...ks) => H.findIndex((h) => ks.some((k) => h === k || (k.length > 4 && h.indexOf(k) === 0)));
  const c = { pat: col('apellidopaterno', 'paterno', 'primerapellido'), mat: col('apellidomaterno', 'materno', 'segundoapellido'),
    nom: col('nombres', 'nombre', 'nombredelalumno'), comp: col('nombrecompleto', 'alumno', 'nombredelalumnoa'),
    curp: col('curp'), grupo: col('grupo', 'gradoygrupo', 'gradogrupo'), grado: col('grado') };
  const tut = [1, 2, 3].map((n) => ({ nom: col('tutor' + n + 'nombre', 'tutor' + n), par: col('tutor' + n + 'parentesco', 'parentesco' + n), tel: col('tutor' + n + 'telefono', 'telefono' + n, 'celular' + n) }));
  if (tut[0].nom < 0) tut[0].nom = col('tutor', 'padreotutor', 'nombredeltutor', 'madrepadreotutor');
  if (tut[0].par < 0) tut[0].par = col('parentesco');
  if (tut[0].tel < 0) tut[0].tel = col('telefono', 'celular', 'telefonodeltutor');
  if (c.grupo < 0) return { error: 'No encontré la columna "Grupo".' };
  const v = (r, i) => (i >= 0 && r[i] !== undefined && r[i] !== null ? String(r[i]).trim() : '');
  if (c.pat < 0 && c.comp < 0 && c.nom >= 0) { c.comp = c.nom; c.nom = -1; }
  const aviso = c.pat < 0 && c.comp >= 0 ? 'Se separó el nombre completo como APELLIDO PATERNO, APELLIDO MATERNO y NOMBRE(S). Revísalo en la vista previa.' : '';
  const filas = [];
  aoa.slice(hi + 1).forEach((r, k) => {
    if (!r || !r.some((x) => String(x || '').trim())) return;
    let pat = v(r, c.pat), mat = v(r, c.mat), nom = v(r, c.nom);
    if (!pat && c.comp >= 0) { const t = v(r, c.comp).split(/\s+/); pat = t[0] || ''; mat = t[1] || ''; nom = t.slice(2).join(' '); }
    let grupo = v(r, c.grupo);
    if (c.grado >= 0 && c.grado !== c.grupo && /^[A-Za-z]$/.test(grupo)) grupo = v(r, c.grado).replace(/\D/g, '') + grupo;
    filas.push({ renglon: hi + k + 2, paterno: pat, materno: mat, nombres: nom, curp: v(r, c.curp), grupo: grupo,
      tutores: tut.map((t) => ({ nombre: v(r, t.nom), parentesco: v(r, t.par), telefono: v(r, t.tel) })).filter((t) => t.nombre) });
  });
  return { filas: filas, aviso: aviso };
}
async function leerArchivoCarga(f) {
  if (!f) return;
  $('#cRes').innerHTML = '<div class="cargando">Leyendo ' + esc(f.name) + '…</div>';
  try {
    const X = await cargarXLSX();
    const wb = X.read(await f.arrayBuffer(), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames.find((n) => !/instruc/i.test(n)) || wb.SheetNames[0]];
    const m = mapearFilas(X.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }));
    if (m.error) { $('#cRes').innerHTML = '<div class="aviso err">' + esc(m.error) + '</div>'; return; }
    if (!m.filas.length) { $('#cRes').innerHTML = '<div class="aviso err">El archivo no tiene alumnos.</div>'; return; }
    S.carga = { filas: m.filas, aviso: m.aviso, actualizar: false, nombre: f.name };
    await validarCarga();
  } catch (e) { $('#cRes').innerHTML = '<div class="aviso err">No se pudo leer el archivo: ' + esc(e.message || e) + '</div>'; }
}
async function enLotes(filas, op, alAvanzar) {
  const res = [], tot = { altas: 0, actualizados: 0, contactos: 0 };
  for (let i = 0; i < filas.length; i += 300) {
    const r = await api('apiImportarAlumnos', filas.slice(i, i + 300), op);
    res.push(...r.resultados); tot.altas += r.altas; tot.actualizados += r.actualizados; tot.contactos += r.contactos;
    if (alAvanzar) alAvanzar(Math.min(i + 300, filas.length), filas.length);
  }
  return { resultados: res, tot: tot };
}
async function validarCarga() {
  const C = S.carga;
  $('#cRes').innerHTML = '<div class="cargando">Revisando ' + C.filas.length + ' alumnos…</div>';
  try {
    C.res = (await enLotes(C.filas, { validar: true, actualizar: C.actualizar })).resultados;
    pintarCarga();
  } catch (e) { $('#cRes').innerHTML = '<div class="aviso err">' + esc(e.message) + '</div>'; }
}
const EST_CARGA = { NUEVO: ['Nuevo', 'SI'], ACTUALIZA: ['Se actualiza', 'R'], EXISTE: ['Ya existe', 'BAJA'], ERROR: ['Error', 'F'] };
function pintarCarga(todos) {
  const C = S.carga, n = (e) => C.res.filter((r) => r.estado === e).length;
  const conAviso = C.res.filter((r) => r.avisos && r.avisos.length).length;
  const orden = C.filas.map((f, i) => ({ f: f, r: C.res[i] })).sort((a, b) => ['ERROR', 'ACTUALIZA', 'EXISTE', 'NUEVO'].indexOf(a.r.estado) - ['ERROR', 'ACTUALIZA', 'EXISTE', 'NUEVO'].indexOf(b.r.estado));
  const vis = todos ? orden : orden.slice(0, 60);
  const cargables = n('NUEVO') + n('ACTUALIZA');
  $('#cRes').innerHTML = '<div class="card"><h3 style="margin-top:0">3. Revisa antes de cargar</h3><div class="tenue">' + esc(C.nombre) + ' · ' + C.filas.length + ' renglones</div>' +
    (C.aviso ? '<div class="aviso">' + esc(C.aviso) + '</div>' : '') +
    '<div class="stats claro" style="margin-top:10px"><div class="stat"><b style="color:var(--verde)">' + n('NUEVO') + '</b><span>Nuevos</span></div>' +
    '<div class="stat"><b>' + n('EXISTE') + '</b><span>Ya existen</span></div>' + (n('ACTUALIZA') ? '<div class="stat"><b class="amb">' + n('ACTUALIZA') + '</b><span>Se actualizan</span></div>' : '') +
    '<div class="stat"><b class="mal">' + n('ERROR') + '</b><span>Con error</span></div></div>' +
    (conAviso ? '<div class="tenue" style="margin-top:6px">' + conAviso + ' con avisos (por ejemplo, sin CURP o teléfono incompleto); sí se cargan.</div>' : '') +
    '<label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" style="width:auto"' + (C.actualizar ? ' checked' : '') +
    ' onchange="S.carga.actualizar=this.checked;validarCarga()"> Actualizar a los que ya existen (nombre, CURP, grupo y nuevos teléfonos)</label>' +
    '<div class="scroll" style="margin-top:10px"><table class="tabla"><tr><th>Fila</th><th class="izq">Alumno</th><th>Grupo</th><th class="izq">Resultado</th></tr>' +
    vis.map((x) => '<tr><td>' + x.f.renglon + '</td><td class="izq">' + esc([x.f.paterno, x.f.materno, x.f.nombres].join(' ')) + (x.f.curp ? '<br><span class="tenue" style="font-size:11px">' + esc(x.f.curp) + '</span>' : '') + '</td>' +
      '<td>' + esc(x.f.grupo) + '</td><td class="izq">' + badge(EST_CARGA[x.r.estado][1], EST_CARGA[x.r.estado][0]) + ' ' + esc(x.r.mensaje || '') +
      (x.r.avisos && x.r.avisos.length ? '<br><span class="tenue" style="font-size:12px">' + esc(x.r.avisos.join(' ')) + '</span>' : '') + '</td></tr>').join('') + '</table></div>' +
    (!todos && orden.length > 60 ? '<button class="chico" onclick="pintarCarga(true)">Ver los ' + orden.length + ' renglones</button>' : '') +
    (n('ERROR') ? '<div class="tenue" style="margin-top:8px">Los renglones con error no se cargan. Corrígelos en el Excel y vuelve a subirlo cuando quieras; los que ya se cargaron aparecerán como "Ya existen".</div>' : '') +
    '<div class="acciones"><button class="prim" id="cBtn"' + (cargables ? '' : ' disabled') + ' onclick="aplicarCarga()">Cargar ' + cargables + ' alumno' + (cargables === 1 ? '' : 's') + '</button></div></div>';
}
async function aplicarCarga() {
  const C = S.carga, b = $('#cBtn');
  const filas = C.filas.filter((f, i) => C.res[i].estado === 'NUEVO' || C.res[i].estado === 'ACTUALIZA');
  if (!confirm('¿Cargar ' + filas.length + ' alumnos?')) return;
  b.disabled = true;
  try {
    const r = await enLotes(filas, { actualizar: C.actualizar }, (a, t) => { b.textContent = 'Cargando ' + a + ' de ' + t + '…'; });
    $('#cRes').innerHTML = '<div class="aviso ok"><b>Listo.</b> ' + r.tot.altas + ' alumnos dados de alta' + (r.tot.actualizados ? ', ' + r.tot.actualizados + ' actualizados' : '') +
      ' y ' + r.tot.contactos + ' contactos de tutores guardados.</div><div class="acciones"><button onclick="ir(\'alumnos\')">Ver alumnos</button><button onclick="vCarga()">Cargar otro archivo</button></div>';
    toast('Carga terminada.');
  } catch (e) { b.disabled = false; b.textContent = 'Reintentar'; error(e); }
}

/* ---------------- Cierre del ciclo escolar ---------------- */
const RES_CIERRE = { PROMOVIDO: 'Pasa', REPITE: 'Repite', EGRESA: 'Egresa', BAJA: 'Baja' };
async function vCierre() {
  S.vista = 'reportes';
  cab('Promoción, repetición y egreso', 'Cierre de ciclo');
  cargando();
  try {
    S.cie = await api('apiCierre');
    S.cieGrupo = S.cieGrupo && S.cie.grupos.indexOf(S.cieGrupo) >= 0 ? S.cieGrupo : S.cie.grupos[0];
    pintarCierre();
  } catch (e) { errVista(e); }
}
function resumenCierre() {
  const t = { PROMOVIDO: 0, REPITE: 0, EGRESA: 0, BAJA: 0 };
  S.cie.alumnos.forEach((a) => { t[a.resultado]++; });
  return t;
}
function pintarCierre() {
  const C = S.cie, t = resumenCierre();
  const lista = C.alumnos.filter((a) => a.grupo === S.cieGrupo);
  const grado = parseInt(S.cieGrupo, 10);
  const gruposDe = (gr) => C.grupos.filter((g) => parseInt(g, 10) === gr);
  $('#main').innerHTML = '<div class="aviso info">Ciclo <b>' + esc(C.ciclo) + '</b> → <b>' + esc(C.siguiente) + '</b>. De entrada, 1° y 2° pasan de año y 3° egresa. ' +
    'Solo marca a quien <b>repite</b> o se da de <b>baja</b>. Nada se mueve hasta que toques "Aplicar cierre".</div>' +
    '<div class="stats claro"><div class="stat"><b style="color:var(--verde)">' + t.PROMOVIDO + '</b><span>Pasan de año</span></div><div class="stat"><b class="amb">' + t.REPITE + '</b><span>Repiten</span></div>' +
    '<div class="stat"><b style="color:var(--azul)">' + t.EGRESA + '</b><span>Egresan</span></div><div class="stat"><b class="mal">' + t.BAJA + '</b><span>Bajas</span></div></div>' +
    '<div class="chips" style="margin:12px 0 8px">' + C.grupos.map((g) => {
      const r = C.alumnos.filter((a) => a.grupo === g && (a.resultado === 'REPITE' || a.resultado === 'BAJA')).length;
      return '<button class="chip-g' + (g === S.cieGrupo ? ' on' : '') + '" onclick="S.cieGrupo=\'' + g + '\';pintarCierre()">' + fG(g) + (r ? ' · ' + r : '') + '</button>';
    }).join('') + '</div>' +
    '<div class="card" style="padding:4px 12px">' + (lista.map((a) => {
      const ops = grado >= 3 ? ['EGRESA', 'REPITE', 'BAJA'] : ['PROMOVIDO', 'REPITE', 'BAJA'];
      const destino = a.resultado === 'PROMOVIDO' ? gruposDe(grado + 1) : a.resultado === 'REPITE' ? gruposDe(grado) : [];
      return '<div class="cierre-fila"><div class="crece"><b>' + esc(a.nombre) + '</b>' +
        (destino.length ? '<div class="tenue" style="font-size:12px">' + (a.resultado === 'PROMOVIDO' ? 'Pasa a ' : 'Repite en ') +
          '<select class="mini" onchange="marcarCierre(\'' + a.id + '\',\'' + a.resultado + '\',this.value)">' + (a.grupoSiguiente ? '' : '<option value="">Elige…</option>') +
          destino.map((g) => '<option value="' + g + '"' + (g === a.grupoSiguiente ? ' selected' : '') + '>' + fG(g) + '</option>').join('') + '</select></div>' : '') + '</div>' +
        '<div class="seg-cierre">' + ops.map((o) => '<button class="' + (a.resultado === o ? 'on r-' + o : '') + '" onclick="marcarCierre(\'' + a.id + '\',\'' + o + '\')">' +
          (o === 'PROMOVIDO' ? 'Pasa a ' + (grado + 1) + '°' : RES_CIERRE[o]) + '</button>').join('') + '</div></div>';
    }).join('') || '<div class="tenue" style="padding:10px 0">Sin alumnos activos en este grupo.</div>') + '</div>' +
    '<div class="acciones"><button onclick="imprimirCierre()">Imprimir resultados</button></div>' +
    '<div class="card" style="margin-top:16px;border:1.5px solid var(--rojo-suave)"><h3 style="margin-top:0">Aplicar cierre del ciclo</h3>' +
    '<div class="tenue">Al aplicarlo: los que pasan cambian de grupo, los que repiten se quedan en su grado, los de 3° quedan como egresados (su historial se conserva) y empieza el ciclo ' + esc(C.siguiente) + '. ' +
    'Después podrás cargar a los alumnos nuevos de 1° desde "Carga de alumnos".</div>' +
    (C.finCiclo && S.ini.hoy < C.finCiclo ? '<div class="aviso">El ciclo actual termina el ' + fF(C.finCiclo) + '. Puedes ir marcando desde ahora y aplicar al final.</div>' : '') +
    '<div class="fila"><div class="crece"><label>Inicio del ciclo ' + esc(C.siguiente) + '</label><input type="date" id="zIni"></div><div class="crece"><label>Fin</label><input type="date" id="zFin"></div></div>' +
    '<label>Escribe CERRAR para confirmar</label><input id="zConf" autocomplete="off" placeholder="CERRAR">' +
    '<div class="acciones"><button class="peligro" onclick="aplicarCierre()">Aplicar cierre</button></div></div>' +
    '<div class="acciones"><button onclick="ir(\'reportes\')">Volver</button></div>';
}
async function marcarCierre(id, resultado, grupo) {
  const a = S.cie.alumnos.find((x) => x.id === id), grado = parseInt(a.grupo, 10), letra = a.grupo.replace(/^\d+/, '');
  const antes = Object.assign({}, a);
  if (grupo === undefined) {
    const meta = resultado === 'PROMOVIDO' ? grado + 1 : grado;
    grupo = resultado === 'PROMOVIDO' || resultado === 'REPITE' ? (S.cie.grupos.indexOf(meta + letra) >= 0 ? meta + letra : '') : '';
  }
  Object.assign(a, { resultado: resultado, grupoSiguiente: grupo, marcado: true });
  pintarCierre();
  if ((resultado === 'PROMOVIDO' || resultado === 'REPITE') && !grupo) return toast('Elige el grupo del próximo ciclo.', 'err');
  try { await api('apiGuardarCierre', [{ id: id, resultado: resultado, grupoSiguiente: grupo }]); }
  catch (e) { Object.assign(a, antes); pintarCierre(); error(e); }
}
async function aplicarCierre() {
  const C = S.cie, t = resumenCierre();
  const d = { confirmacion: $('#zConf').value, inicio: $('#zIni').value, fin: $('#zFin').value };
  if (!d.inicio || !d.fin) return toast('Escribe las fechas de inicio y fin del nuevo ciclo.', 'err');
  if (String(d.confirmacion).trim().toUpperCase() !== 'CERRAR') return toast('Escribe CERRAR para confirmar.', 'err');
  if (!confirm('Se aplicará el cierre: ' + t.PROMOVIDO + ' pasan, ' + t.REPITE + ' repiten, ' + t.EGRESA + ' egresan y ' + t.BAJA + ' bajas. Esto no se puede deshacer desde la app. ¿Continuar?')) return;
  try {
    const r = await api('apiAplicarCierre', d);
    S.ini.ciclo = r.ciclo;
    $('#main').innerHTML = '<div class="aviso ok"><b>Ciclo ' + esc(r.ciclo) + ' iniciado.</b> ' + r.cuenta.PROMOVIDO + ' pasaron de año, ' + r.cuenta.REPITE + ' repiten, ' +
      r.cuenta.EGRESA + ' egresaron y ' + r.cuenta.BAJA + ' bajas.</div><div class="tenue">Siguiente paso: carga a los alumnos de nuevo ingreso y revisa el calendario del nuevo ciclo.</div>' +
      '<div class="acciones"><button class="prim" onclick="vCarga()">Cargar alumnos nuevos</button><button onclick="vCalendario()">Calendario</button></div>';
  } catch (e) { error(e); }
}
function imprimirCierre() {
  const C = S.cie;
  imprimir('<div class="pagina">' + encabezadoDoc() + '<h3 style="text-align:center">Resultados del ciclo ' + esc(C.ciclo) + '</h3>' + C.grupos.map((g) => {
    const l = C.alumnos.filter((a) => a.grupo === g);
    if (!l.length) return '';
    return '<h4>' + fG(g) + '</h4><table class="tabla"><tr><th>#</th><th class="izq">Alumno</th><th>Resultado</th><th>Grupo ' + esc(C.siguiente) + '</th></tr>' +
      l.map((a, i) => '<tr><td>' + (i + 1) + '</td><td class="izq">' + esc(a.nombre) + '</td><td>' + (a.resultado === 'PROMOVIDO' ? 'Pasa' : RES_CIERRE[a.resultado]) + '</td><td>' + (a.grupoSiguiente ? fG(a.grupoSiguiente) : '—') + '</td></tr>').join('') + '</table>';
  }).join('') + '</div>');
}

/* ---------------- Usuarios y accesos ---------------- */
const ROL_TXT = { ADMIN: 'Administración', DIRECTOR: 'Dirección', SUBDIRECTOR: 'Subdirección', SECRETARIA: 'Secretaría', PREFECTO: 'Prefectura', TRABAJO_SOCIAL: 'Trabajo social' };
const ROL_DESC = {
  ADMIN: 'Todo, incluido asignar este rol.',
  DIRECTOR: 'Acceso completo: alumnos, maestros, calendario, aprobar salidas, justificar y dar o quitar accesos.',
  SUBDIRECTOR: 'Acceso completo: alumnos, maestros, calendario, aprobar salidas, justificar y dar o quitar accesos.',
  SECRETARIA: 'Acceso completo: alumnos, maestros, calendario, aprobar salidas, justificar y dar o quitar accesos.',
  PREFECTO: 'Lista, retardos, salidas, alumnos, seguimiento y maestros. No aprueba salidas, no cambia el calendario ni los accesos.',
  TRABAJO_SOCIAL: 'Solo alumnos: consultar, justificar faltas y seguimiento. No ve nada de maestros.',
};
async function vUsuarios() {
  S.vista = 'reportes';
  cab('Quién puede entrar a la plataforma', 'Usuarios y accesos');
  cargando();
  try {
    const r = await api('apiUsuarios');
    S.usu = r;
    const act = r.usuarios.filter((u) => u.activo), ina = r.usuarios.filter((u) => !u.activo);
    const tarjeta = (u) => '<div class="res fila" onclick="formUsuario(\'' + esc(u.correo) + '\')"><span class="ini">' + esc(iniciales(u.nombre).toUpperCase()) + '</span>' +
      '<span class="crece"><b>' + esc(u.nombre) + '</b><br><span class="tenue">' + esc(u.correo) + '</span></span>' +
      (u.activo ? badge('SI', ROL_TXT[u.rol] || u.rol) : badge('BAJA', 'Sin acceso')) + '</div>';
    $('#main').innerHTML = '<button class="prim ancho" onclick="formUsuario()">' + svg('mas', 18) + ' Dar acceso a alguien</button>' +
      '<div class="aviso info" style="margin-top:12px">Cada persona entra con su cuenta de Google. Si alguien deja la escuela, ábrelo y toca "Quitar acceso": desde su siguiente acción ya no puede ver nada.</div>' +
      '<div class="seccion"><h3>Con acceso (' + act.length + ')</h3></div><div class="card" style="padding:4px 10px">' + (act.map(tarjeta).join('') || '<div class="tenue">Nadie</div>') + '</div>' +
      (ina.length ? '<div class="seccion"><h3>Sin acceso (' + ina.length + ')</h3></div><div class="card" style="padding:4px 10px">' + ina.map(tarjeta).join('') + '</div>' : '') +
      '<div class="seccion"><h3>Qué puede hacer cada rol</h3></div><div class="card">' + Object.keys(ROL_DESC).filter((k) => k !== 'ADMIN').map((k) =>
        '<p style="margin:6px 0"><b>' + ROL_TXT[k] + ':</b> <span class="tenue">' + ROL_DESC[k] + '</span></p>').join('') + '</div>' +
      '<div class="acciones"><button onclick="ir(\'reportes\')">Volver</button></div>';
  } catch (e) { errVista(e); }
}
function formUsuario(correo) {
  const u = correo ? S.usu.usuarios.find((x) => x.correo === correo) : { correo: '', nombre: '', rol: 'PREFECTO', activo: true };
  const yo = correo === S.usu.yo;
  const roles = S.usu.roles.indexOf(u.rol) < 0 ? S.usu.roles.concat([u.rol]) : S.usu.roles;
  modal('<h2>' + (correo ? esc(u.nombre) : 'Dar acceso') + '</h2>' +
    '<label>Correo de Google</label><input id="zCor" type="email" autocomplete="off" value="' + esc(u.correo) + '"' + (correo ? ' disabled' : '') + ' placeholder="nombre@gmail.com">' +
    '<label>Nombre</label><input id="zNom" value="' + esc(u.nombre) + '">' +
    '<label>Rol</label><select id="zRol" onchange="$(\'#zDesc\').textContent=ROL_DESC[this.value]||\'\'"' + (yo ? ' disabled' : '') + '>' + roles.map((r) =>
      '<option value="' + r + '"' + (r === u.rol ? ' selected' : '') + '>' + (ROL_TXT[r] || r) + '</option>').join('') + '</select>' +
    '<div class="tenue" id="zDesc" style="margin-top:6px">' + (ROL_DESC[u.rol] || '') + '</div>' +
    (yo ? '<div class="aviso info">Es tu cuenta: tu rol y tu acceso solo los puede cambiar otra persona con acceso completo.</div>' : '') +
    '<div class="acciones"><button onclick="cerrar()">Cancelar</button>' +
    (correo && !yo ? (u.activo ? '<button class="peligro" onclick="guardarUsuario(false)">Quitar acceso</button>' : '<button onclick="guardarUsuario(true)">Devolver acceso</button>') : '') +
    '<button class="prim" id="zBtn" onclick="guardarUsuario(' + (u.activo ? 'true' : 'false') + ')">Guardar</button></div>');
}
async function guardarUsuario(activo) {
  if (!activo && !confirm('¿Quitar el acceso a ' + $('#zNom').value + '? Ya no podrá entrar a la plataforma.')) return;
  try {
    await api('apiGuardarUsuario', { correo: $('#zCor').value, nombre: $('#zNom').value, rol: $('#zRol').value, activo: activo });
    cerrar(); toast(activo ? 'Acceso guardado.' : 'Acceso quitado.'); vUsuarios();
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
