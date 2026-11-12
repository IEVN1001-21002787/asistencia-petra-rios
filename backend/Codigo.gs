/**
 * Plataforma de Asistencia y Salidas
 * Escuela Secundaria Oficial "Petra Ríos" - Prototipo
 *
 * La base de datos es esta misma hoja de cálculo. Cada pestaña es una tabla.
 * Todo se guarda como texto (fechas yyyy-MM-dd, horas HH:mm) para evitar
 * conversiones automáticas de Google Sheets.
 */

const TZ = 'America/Mexico_City';
const VERSION = '2.2';

const HOJAS = {
  Config: ['Clave', 'Valor', 'Descripcion'],
  Usuarios: ['Correo', 'Nombre', 'Rol', 'Activo'],
  Grupos: ['ID_Grupo', 'Grado', 'Letra', 'Turno', 'Prefecto'],
  Alumnos: ['ID_Alumno', 'Apellido_Paterno', 'Apellido_Materno', 'Nombres', 'CURP', 'Grupo_Actual', 'Estatus', 'Fecha_Alta', 'Notas'],
  Contactos: ['ID_Contacto', 'ID_Alumno', 'Nombre', 'Parentesco', 'Telefono', 'Autorizado'],
  Historial_Grupos: ['Fecha', 'ID_Alumno', 'Ciclo', 'Grupo_Anterior', 'Grupo_Nuevo', 'Movimiento', 'Motivo', 'Registro'],
  Asistencias: ['Fecha', 'ID_Alumno', 'Grupo', 'Estado', 'Hora_Llegada', 'Hora_Salida', 'Comentario', 'Registro', 'Actualizado'],
  Salidas: ['ID_Salida', 'Fecha', 'Hora', 'ID_Alumno', 'Grupo', 'Recoge', 'Parentesco', 'Autorizado', 'Estatus', 'Aprobo', 'Motivo', 'Detalle', 'Registro'],
  Firmas: ['ID_Salida', 'Imagen'],
  Justificaciones: ['ID_Just', 'Fecha_Registro', 'ID_Alumno', 'Fecha_Inicio', 'Fecha_Fin', 'Tipo_Documento', 'Comentario', 'Fuera_Plazo', 'Registro'],
  Seguimiento: ['ID_Seg', 'Fecha', 'ID_Alumno', 'Tipo', 'Motivo', 'Resultado', 'Detalle', 'Registro'],
  Calendario: ['Fecha', 'Tipo', 'Descripcion'],
  Bitacora: ['Fecha_Hora', 'Usuario', 'Accion', 'Detalle'],
};

const IMPORTAR_ENCABEZADOS = ['Apellido_Paterno', 'Apellido_Materno', 'Nombres', 'CURP', 'Grupo',
  'Tutor1_Nombre', 'Tutor1_Parentesco', 'Tutor1_Telefono',
  'Tutor2_Nombre', 'Tutor2_Parentesco', 'Tutor2_Telefono',
  'Tutor3_Nombre', 'Tutor3_Parentesco', 'Tutor3_Telefono', 'Resultado'];

const CONFIG_DEF = [
  ['ESCUELA', 'Escuela Secundaria Oficial "Petra Ríos"', 'Nombre oficial para documentos'],
  ['CCT', '', 'Clave de centro de trabajo'],
  ['MUNICIPIO', 'Romita, Gto.', 'Lugar que aparece en citatorios'],
  ['CICLO', '2026-2027', 'Ciclo escolar actual'],
  ['HORA_ENTRADA', '13:40', 'Abre la entrada'],
  ['HORA_CIERRE', '14:00', 'Se cierra la puerta'],
  ['HORA_RETARDO', '14:10', 'A partir de esta hora es retardo'],
  ['VENTANA_DIAS', '10', 'Días hábiles que revisa la alerta'],
  ['UMBRAL_AMARILLO', '3', 'Faltas injustificadas para nivel amarillo'],
  ['UMBRAL_ROJO', '6', 'Faltas injustificadas para nivel rojo (más de 5)'],
  ['UMBRAL_RETARDOS', '3', 'Retardos en la ventana para marcar patrón'],
  ['PLAZO_JUSTIFICAR', '3', 'Días hábiles para justificar una falta'],
  ['GOOGLE_CLIENT_ID', '', 'ID de cliente OAuth de Google Cloud para iniciar sesión'],
  ['INICIO_CICLO', '', 'Primer día de clases del ciclo (aaaa-mm-dd)'],
  ['FIN_CICLO', '', 'Último día de clases del ciclo (aaaa-mm-dd)'],
  ['DIAS_SIN_CONEXION', '14', 'Días que se aceptan registros capturados sin internet'],
];

const ROLES = ['ADMIN', 'DIRECTOR', 'SUBDIRECTOR', 'PREFECTO', 'TRABAJO_SOCIAL', 'SECRETARIA'];

const PERMISOS = {
  ver: ROLES,
  lista: ['ADMIN', 'DIRECTOR', 'SUBDIRECTOR', 'PREFECTO'],
  corregirPasado: ['ADMIN', 'DIRECTOR', 'SUBDIRECTOR'],
  salidas: ['ADMIN', 'DIRECTOR', 'SUBDIRECTOR', 'PREFECTO'],
  aprobarSalida: ['ADMIN', 'DIRECTOR', 'SUBDIRECTOR'],
  justificar: ['ADMIN', 'TRABAJO_SOCIAL'],
  seguimiento: ['ADMIN', 'DIRECTOR', 'SUBDIRECTOR', 'PREFECTO', 'TRABAJO_SOCIAL'],
  alumnos: ['ADMIN', 'DIRECTOR', 'SUBDIRECTOR', 'SECRETARIA'],
  calendario: ['ADMIN', 'DIRECTOR', 'SUBDIRECTOR', 'SECRETARIA'],
};

const TIPOS_SIN_CLASE = {
  FESTIVO: 'Día festivo', SUSPENSION: 'Suspensión de labores', CTE: 'Consejo Técnico Escolar',
  VACACIONES: 'Vacaciones', FIESTA_PATRONAL: 'Fiesta patronal', CAMBIO_ACTIVIDAD: 'Cambio de actividad', OTRO: 'Otro',
};

const ESTADOS = { P: 'Presente', F: 'Falta', R: 'Retardo', J: 'Falta justificada', S: 'Salió temprano' };

/* ------------------------------------------------------------------ */
/* API para el front                                                   */
/* ------------------------------------------------------------------ */

/** Acciones que el front puede llamar. Cualquier otra función queda fuera. */
const ACCIONES = {
  apiInicio: apiInicio, apiLista: apiLista, apiListasDia: apiListasDia, apiGuardarLista: apiGuardarLista,
  apiRetardo: apiRetardo, apiHoy: apiHoy, apiRegistrarSalida: apiRegistrarSalida, apiAprobarSalida: apiAprobarSalida,
  apiSalidas: apiSalidas, apiComprobante: apiComprobante, apiJustificar: apiJustificar, apiAlertas: apiAlertas,
  apiRegistrarSeguimiento: apiRegistrarSeguimiento, apiBuscarAlumnos: apiBuscarAlumnos, apiAlumno: apiAlumno,
  apiGuardarAlumno: apiGuardarAlumno, apiMoverAlumno: apiMoverAlumno, apiGuardarContacto: apiGuardarContacto,
  apiConcentrado: apiConcentrado, apiExportarConcentrado: apiExportarConcentrado,
  apiCalendario: apiCalendario, apiMarcarSinClase: apiMarcarSinClase, apiQuitarSinClase: apiQuitarSinClase,
  apiGuardarCiclo: apiGuardarCiclo,
  apiDatosSinConexion: apiDatosSinConexion,
};

let _correoActual = null;

function doGet() {
  return json_({ ok: true, servicio: 'Asistencia Petra Ríos', version: VERSION });
}

/** Cuerpo: {accion, args: [], token}. Respuesta: {ok, data} o {ok:false, error, codigo}. */
function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (x) { return json_({ ok: false, error: 'Solicitud no válida.' }); }
  _cache = {};
  _correoActual = null;
  try {
    if (req.accion === 'configPublica') {
      const c = config_();
      return json_({ ok: true, data: { clientId: c.GOOGLE_CLIENT_ID || '', escuela: c.ESCUELA, version: VERSION } });
    }
    const fn = ACCIONES[req.accion];
    if (!fn) throw new Error('Acción no válida.');
    _correoActual = verificarToken_(req.token);
    const data = fn.apply(null, Array.isArray(req.args) ? req.args : []);
    return json_({ ok: true, data: data === undefined ? null : data });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err).replace(/^Error:\s*/, ''), codigo: (err && err.codigo) || '' });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function errorCodigo_(msg, codigo) { const e = new Error(msg); e.codigo = codigo; return e; }

/** Verifica el token de "Iniciar sesión con Google" y devuelve el correo. */
function verificarToken_(token) {
  if (!token) throw errorCodigo_('Inicia sesión con tu cuenta de Google.', 'SESION');
  const clientId = config_().GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Falta GOOGLE_CLIENT_ID en la pestaña Config.');
  const cache = CacheService.getScriptCache();
  const clave = 'tk_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token))).slice(0, 43);
  const guardado = cache.get(clave);
  if (guardado) return guardado;
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw errorCodigo_('Tu sesión expiró. Vuelve a iniciar sesión.', 'SESION');
  const t = JSON.parse(r.getContentText());
  if (t.aud !== clientId) throw errorCodigo_('La sesión no corresponde a esta aplicación.', 'SESION');
  if (['accounts.google.com', 'https://accounts.google.com'].indexOf(t.iss) < 0) throw errorCodigo_('Sesión no válida.', 'SESION');
  if (String(t.email_verified) !== 'true') throw errorCodigo_('Tu correo de Google no está verificado.', 'SESION');
  const restante = parseInt(t.exp, 10) - Math.floor(Date.now() / 1000);
  if (!(restante > 0)) throw errorCodigo_('Tu sesión expiró. Vuelve a iniciar sesión.', 'SESION');
  const correo = String(t.email || '').toLowerCase();
  if (!correo) throw errorCodigo_('No se pudo leer tu correo.', 'SESION');
  cache.put(clave, correo, Math.max(1, Math.min(restante - 30, 3000)));
  return correo;
}

/* ------------------------------------------------------------------ */
/* Utilidades de datos                                                 */
/* ------------------------------------------------------------------ */

let _cache = {};

function ss_() {
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  if (!ss) {
    const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) throw new Error('Abre la hoja y ejecuta Plataforma > Configurar hojas.');
    ss = SpreadsheetApp.openById(id);
  }
  return ss;
}

function sh_(nombre) {
  const s = ss_().getSheetByName(nombre);
  if (!s) throw new Error('Falta la pestaña "' + nombre + '". Ejecuta Plataforma > Configurar hojas.');
  return s;
}

function txt_(v) {
  if (v instanceof Date) {
    return v.getFullYear() < 1900
      ? Utilities.formatDate(v, TZ, 'HH:mm')
      : Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  }
  return v === null || v === undefined ? '' : String(v).trim();
}

function tabla_(nombre) {
  if (_cache[nombre]) return _cache[nombre];
  const s = sh_(nombre);
  const h = HOJAS[nombre];
  const ultima = s.getLastRow();
  const out = [];
  if (ultima >= 2) {
    const valores = s.getRange(2, 1, ultima - 1, h.length).getValues();
    valores.forEach(function (r, i) {
      if (r.every(function (c) { return c === '' || c === null; })) return;
      const o = { _fila: i + 2 };
      h.forEach(function (k, j) { o[k] = txt_(r[j]); });
      out.push(o);
    });
  }
  _cache[nombre] = out;
  return out;
}

function agregar_(nombre, objs) {
  if (!objs.length) return;
  const h = HOJAS[nombre];
  const s = sh_(nombre);
  const filas = objs.map(function (o) {
    return h.map(function (k) { return o[k] === undefined || o[k] === null ? '' : String(o[k]); });
  });
  s.getRange(s.getLastRow() + 1, 1, filas.length, h.length).setNumberFormat('@').setValues(filas);
  delete _cache[nombre];
}

function actualizar_(nombre, fila, obj) {
  const h = HOJAS[nombre];
  const r = sh_(nombre).getRange(fila, 1, 1, h.length);
  const actual = r.getValues()[0].map(txt_);
  h.forEach(function (k, j) { if (obj[k] !== undefined) actual[j] = String(obj[k]); });
  r.setNumberFormat('@').setValues([actual]);
  delete _cache[nombre];
}

function config_() {
  const c = {};
  tabla_('Config').forEach(function (r) { c[r.Clave] = r.Valor; });
  CONFIG_DEF.forEach(function (d) { if (c[d[0]] === undefined || c[d[0]] === '') c[d[0]] = d[1]; });
  return c;
}

function num_(c, k, def) {
  const n = parseInt(c[k], 10);
  return isNaN(n) ? def : n;
}

function hoy_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function ahora_() { return Utilities.formatDate(new Date(), TZ, 'HH:mm'); }
function sello_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }

function parseF_(s) {
  const p = String(s).split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2], 12, 0, 0);
}
function fmtF_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }

function validarFecha_(f, etiqueta) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(f || ''))) throw new Error('Fecha no válida' + (etiqueta ? ' (' + etiqueta + ')' : '') + '.');
  return f;
}

/** Días sin clase de la pestaña Calendario, más el inicio y fin del ciclo (_ini, _fin). */
function diasSinClase_() {
  const s = {};
  tabla_('Calendario').forEach(function (r) { if (r.Fecha) s[r.Fecha] = r.Tipo || 'Sin clase'; });
  const c = config_();
  s._ini = /^\d{4}-\d{2}-\d{2}$/.test(c.INICIO_CICLO || '') ? c.INICIO_CICLO : '';
  s._fin = /^\d{4}-\d{2}-\d{2}$/.test(c.FIN_CICLO || '') ? c.FIN_CICLO : '';
  return s;
}

function esHabil_(f, sin) {
  sin = sin || diasSinClase_();
  const d = parseF_(f).getDay();
  if (sin._ini && f < sin._ini) return false;
  if (sin._fin && f > sin._fin) return false;
  return d !== 0 && d !== 6 && !sin[f];
}

/**
 * Fecha en la que se registra algo. Por defecto hoy. Un día anterior solo lo puede registrar dirección,
 * o cualquier usuario si lo capturó sin internet ese mismo día (hasta DIAS_SIN_CONEXION días después).
 */
function fechaTrabajo_(u, fecha, sinConexion) {
  const hoy = hoy_();
  if (!fecha || fecha === hoy) return hoy;
  validarFecha_(fecha);
  if (fecha > hoy) throw new Error('No se puede registrar una fecha futura.');
  if (tiene_(u, 'corregirPasado')) return fecha;
  const limite = num_(config_(), 'DIAS_SIN_CONEXION', 14);
  const dias = Math.round((parseF_(hoy) - parseF_(fecha)) / 86400000);
  if (sinConexion && dias <= limite) return fecha;
  if (sinConexion) throw new Error('Este registro se capturó sin internet hace ' + dias + ' días; el límite es ' + limite + '. Pide a dirección que lo capture.');
  throw new Error('Solo dirección puede registrar días anteriores.');
}

/** Los últimos n días hábiles que terminan en "fin" (incluido si es hábil). */
function ventana_(fin, n) {
  const sin = diasSinClase_();
  const out = [];
  const d = parseF_(fin);
  let vueltas = 0;
  while (out.length < n && vueltas < 200) {
    const f = fmtF_(d);
    if (esHabil_(f, sin)) out.push(f);
    d.setDate(d.getDate() - 1);
    vueltas++;
  }
  return out.reverse();
}

/** Días hábiles entre ini y fin, ambos incluidos. */
function habilesEntre_(ini, fin) {
  const sin = diasSinClase_();
  const out = [];
  const d = parseF_(ini);
  const f = parseF_(fin);
  let vueltas = 0;
  while (d <= f && vueltas < 400) {
    const s = fmtF_(d);
    if (esHabil_(s, sin)) out.push(s);
    d.setDate(d.getDate() + 1);
    vueltas++;
  }
  return out;
}

function nuevoId_(prefijo) {
  return prefijo + Utilities.formatDate(new Date(), TZ, 'yyMMddHHmmss') + Math.floor(Math.random() * 900 + 100);
}

function nombre_(a) {
  return [a.Apellido_Paterno, a.Apellido_Materno, a.Nombres].filter(String).join(' ');
}

function norm_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function ordenarAlumnos_(lista) {
  return lista.sort(function (a, b) { return nombre_(a).localeCompare(nombre_(b), 'es'); });
}

function alumno_(id) {
  const a = tabla_('Alumnos').find(function (x) { return x.ID_Alumno === id; });
  if (!a) throw new Error('No se encontró el alumno ' + id + '.');
  return a;
}

function mapaAlumnos_() {
  const m = {};
  tabla_('Alumnos').forEach(function (a) { m[a.ID_Alumno] = a; });
  return m;
}

function alumnosGrupo_(grupo) {
  return ordenarAlumnos_(tabla_('Alumnos').filter(function (a) {
    return a.Grupo_Actual === grupo && a.Estatus === 'ACTIVO';
  }));
}

function grupos_() {
  return tabla_('Grupos').map(function (g) { return g.ID_Grupo; }).sort();
}

/* ------------------------------------------------------------------ */
/* Usuarios y permisos                                                 */
/* ------------------------------------------------------------------ */

function me_() {
  const correo = _correoActual;
  if (!correo) throw errorCodigo_('Inicia sesión con tu cuenta de Google.', 'SESION');
  const u = tabla_('Usuarios').find(function (x) {
    return x.Correo.toLowerCase() === correo && x.Activo.toUpperCase() !== 'NO';
  });
  if (!u) throw errorCodigo_('La cuenta ' + correo + ' no está autorizada. Pide a la dirección que te dé de alta.', 'NO_AUTORIZADO');
  return { email: correo, nombre: u.Nombre || correo, rol: u.Rol.toUpperCase() };
}

function tiene_(u, permiso) {
  return (PERMISOS[permiso] || []).indexOf(u.rol) >= 0;
}

function requiere_(permiso) {
  const u = me_();
  if (!tiene_(u, permiso)) throw new Error('Tu rol (' + u.rol + ') no tiene permiso para esta acción.');
  return u;
}

function log_(u, accion, detalle) {
  agregar_('Bitacora', [{ Fecha_Hora: sello_(), Usuario: u.email, Accion: accion, Detalle: detalle }]);
}

/* ------------------------------------------------------------------ */
/* API: inicio                                                         */
/* ------------------------------------------------------------------ */

function apiInicio() {
  const u = me_();
  const c = config_();
  return {
    usuario: u,
    permisos: Object.keys(PERMISOS).filter(function (p) { return tiene_(u, p); }),
    config: {
      escuela: c.ESCUELA, cct: c.CCT, municipio: c.MUNICIPIO, ciclo: c.CICLO,
      horaCierre: c.HORA_CIERRE, horaRetardo: c.HORA_RETARDO,
      ventana: num_(c, 'VENTANA_DIAS', 10), plazo: num_(c, 'PLAZO_JUSTIFICAR', 3),
    },
    grupos: grupos_(),
    hoy: hoy_(),
    ahora: ahora_(),
    habilHoy: esHabil_(hoy_()),
    calendario: calendario_(),
  };
}

/* ------------------------------------------------------------------ */
/* API: calendario escolar                                             */
/* ------------------------------------------------------------------ */

function calendario_() {
  const c = config_();
  return {
    ciclo: c.CICLO, inicio: c.INICIO_CICLO || '', fin: c.FIN_CICLO || '', tipos: TIPOS_SIN_CLASE,
    dias: tabla_('Calendario').filter(function (r) { return r.Fecha; })
      .map(function (r) { return { fecha: r.Fecha, tipo: r.Tipo || 'OTRO', descripcion: r.Descripcion }; })
      .sort(function (a, b) { return a.fecha.localeCompare(b.fecha); }),
  };
}

function apiCalendario() {
  requiere_('ver');
  return calendario_();
}

/** d: {inicio, fin, tipo, descripcion}. Marca sin clase cada día de lunes a viernes del rango. */
function apiMarcarSinClase(d) {
  const u = requiere_('calendario');
  const ini = validarFecha_(d.inicio, 'inicio');
  const fin = validarFecha_(d.fin || d.inicio, 'fin');
  if (fin < ini) throw new Error('La fecha final no puede ser antes de la inicial.');
  const tipo = TIPOS_SIN_CLASE[d.tipo] ? d.tipo : 'OTRO';
  const desc = String(d.descripcion || '').trim().slice(0, 120) || TIPOS_SIN_CLASE[tipo];
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    _cache = {};
    const ya = {};
    tabla_('Calendario').forEach(function (r) { ya[r.Fecha] = r; });
    const nuevos = [];
    const x = parseF_(ini), f = parseF_(fin);
    let vueltas = 0;
    while (x <= f && vueltas < 400) {
      const s = fmtF_(x);
      const dia = x.getDay();
      if (dia !== 0 && dia !== 6) {
        if (ya[s]) actualizar_('Calendario', ya[s]._fila, { Tipo: tipo, Descripcion: desc });
        else nuevos.push({ Fecha: s, Tipo: tipo, Descripcion: desc });
      }
      x.setDate(x.getDate() + 1);
      vueltas++;
    }
    agregar_('Calendario', nuevos);
    const fechas = {};
    nuevos.forEach(function (n) { fechas[n.Fecha] = true; });
    const conRegistros = tabla_('Asistencias').filter(function (r) { return fechas[r.Fecha]; }).length;
    log_(u, 'CALENDARIO', 'Sin clase ' + ini + ' a ' + fin + ' (' + tipo + ')');
    return { agregados: nuevos.length, conRegistros: conRegistros, calendario: calendario_() };
  } finally {
    lock.releaseLock();
  }
}

/** Vuelve a ser día de clase. */
function apiQuitarSinClase(fecha) {
  const u = requiere_('calendario');
  validarFecha_(fecha);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    _cache = {};
    const filas = tabla_('Calendario').filter(function (r) { return r.Fecha === fecha; })
      .map(function (r) { return r._fila; }).sort(function (a, b) { return b - a; });
    if (!filas.length) throw new Error('Ese día no estaba marcado sin clase.');
    const s = sh_('Calendario');
    filas.forEach(function (f) { s.deleteRow(f); });
    _cache = {};
    log_(u, 'CALENDARIO', 'Hay clase el ' + fecha);
    return { calendario: calendario_() };
  } finally {
    lock.releaseLock();
  }
}

/** d: {inicio, fin, ciclo?} */
function apiGuardarCiclo(d) {
  const u = requiere_('calendario');
  const ini = validarFecha_(d.inicio, 'inicio');
  const fin = validarFecha_(d.fin, 'fin');
  if (fin <= ini) throw new Error('El fin del ciclo debe ser después del inicio.');
  const valores = { INICIO_CICLO: ini, FIN_CICLO: fin };
  if (d.ciclo && /^\d{4}-\d{4}$/.test(d.ciclo)) valores.CICLO = d.ciclo;
  _cache = {};
  const filas = {};
  tabla_('Config').forEach(function (r) { filas[r.Clave] = r._fila; });
  const nuevos = [];
  Object.keys(valores).forEach(function (k) {
    if (filas[k]) actualizar_('Config', filas[k], { Valor: valores[k] });
    else {
      const def = CONFIG_DEF.find(function (x) { return x[0] === k; });
      nuevos.push({ Clave: k, Valor: valores[k], Descripcion: def ? def[2] : '' });
    }
  });
  agregar_('Config', nuevos);
  _cache = {};
  log_(u, 'CICLO', ini + ' a ' + fin);
  return { calendario: calendario_() };
}

/* ------------------------------------------------------------------ */
/* API: lista diaria y retardos                                        */
/* ------------------------------------------------------------------ */

function registrosDia_(fecha) {
  const m = {};
  tabla_('Asistencias').forEach(function (r) { if (r.Fecha === fecha) m[r.ID_Alumno] = r; });
  return m;
}

function apiLista(grupo, fecha) {
  const u = requiere_('ver');
  fecha = validarFecha_(fecha || hoy_());
  const reg = registrosDia_(fecha);
  const alumnos = alumnosGrupo_(grupo);
  const pasada = alumnos.some(function (a) { return reg[a.ID_Alumno]; });
  return {
    grupo: grupo,
    fecha: fecha,
    habil: esHabil_(fecha),
    pasada: pasada,
    editable: tiene_(u, 'lista') && (fecha === hoy_() || tiene_(u, 'corregirPasado')) && fecha <= hoy_(),
    alumnos: alumnos.map(function (a) {
      const r = reg[a.ID_Alumno];
      return {
        id: a.ID_Alumno,
        nombre: nombre_(a),
        estado: r ? r.Estado : 'P',
        hora: r ? r.Hora_Llegada : '',
        horaSalida: r ? r.Hora_Salida : '',
        comentario: r ? r.Comentario : '',
      };
    }),
  };
}

/** Listas de todos los grupos de un día, para guardarlas en el celular y trabajar sin internet. */
function apiListasDia(fecha) {
  requiere_('ver');
  const out = {};
  grupos_().forEach(function (g) { out[g] = apiLista(g, fecha); });
  return out;
}

/** Lo que el celular guarda para trabajar sin internet: listas del día y quién puede recoger a cada alumno (sin teléfonos). */
function apiDatosSinConexion(fecha) {
  requiere_('ver');
  const listas = apiListasDia(fecha);
  const activos = {};
  tabla_('Alumnos').forEach(function (a) { if (a.Estatus === 'ACTIVO') activos[a.ID_Alumno] = true; });
  const contactos = {};
  tabla_('Contactos').forEach(function (c) {
    if (!activos[c.ID_Alumno]) return;
    (contactos[c.ID_Alumno] = contactos[c.ID_Alumno] || []).push({ id: c.ID_Contacto, nombre: c.Nombre, parentesco: c.Parentesco, autorizado: c.Autorizado });
  });
  return { listas: listas, contactos: contactos };
}

function justificadas_() {
  const m = {};
  tabla_('Justificaciones').forEach(function (j) {
    (m[j.ID_Alumno] = m[j.ID_Alumno] || []).push([j.Fecha_Inicio, j.Fecha_Fin || j.Fecha_Inicio]);
  });
  return m;
}

function cubierta_(rangos, f) {
  return (rangos || []).some(function (r) { return f >= r[0] && f <= r[1]; });
}

function pendienteRetardo_(u, idAlumno, fecha, hora) {
  return {
    ID_Seg: nuevoId_('G'), Fecha: fecha, ID_Alumno: idAlumno, Tipo: 'LLAMADA', Motivo: 'RETARDO',
    Resultado: 'PENDIENTE', Detalle: 'Retardo del ' + fecha + ' (' + hora + '). Llamar a los padres para conocer el motivo.',
    Registro: u.email,
  };
}

/**
 * items: [{id, estado: P|F|R, comentario}]
 * Los estados J (justificada) y S (salió) no se cambian desde la lista.
 */
function apiGuardarLista(grupo, fecha, items, opciones) {
  const u = requiere_('lista');
  const sinConexion = !!(opciones && opciones.sinConexion);
  fecha = fechaTrabajo_(u, fecha, sinConexion);
  if (!esHabil_(fecha)) throw new Error('El ' + fecha + ' está marcado como día sin clase.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    _cache = {};
    const just = justificadas_();
    const reg = registrosDia_(fecha);
    const validos = {};
    alumnosGrupo_(grupo).forEach(function (a) { validos[a.ID_Alumno] = true; });
    const nuevos = [];
    const seg = [];
    let cambios = 0;
    const hora = ahora_();

    (items || []).forEach(function (it) {
      if (!validos[it.id]) return;
      const prev = reg[it.id];
      if (prev && (prev.Estado === 'S' || prev.Estado === 'J')) return;
      let estado = ['P', 'F', 'R'].indexOf(it.estado) >= 0 ? it.estado : 'P';
      if (estado === 'F' && cubierta_(just[it.id], fecha)) estado = 'J';
      const horaLlegada = estado === 'R' ? ((prev && prev.Hora_Llegada) || it.hora || hora) : '';
      const comentario = String(it.comentario || '').slice(0, 300);
      if (!prev) {
        nuevos.push({ Fecha: fecha, ID_Alumno: it.id, Grupo: grupo, Estado: estado, Hora_Llegada: horaLlegada,
          Hora_Salida: '', Comentario: comentario, Registro: u.email, Actualizado: sello_() });
      } else if (prev.Estado !== estado || prev.Comentario !== comentario || prev.Hora_Llegada !== horaLlegada) {
        actualizar_('Asistencias', prev._fila, { Estado: estado, Hora_Llegada: horaLlegada, Comentario: comentario,
          Registro: u.email, Actualizado: sello_() });
        cambios++;
      }
      if (estado === 'R' && (!prev || prev.Estado !== 'R')) seg.push(pendienteRetardo_(u, it.id, fecha, horaLlegada));
    });

    agregar_('Asistencias', nuevos);
    agregar_('Seguimiento', seg);
    log_(u, 'LISTA', grupo + ' ' + fecha + ': ' + nuevos.length + ' nuevos, ' + cambios + ' cambios' + (sinConexion ? ' (capturada sin internet)' : ''));
    return { ok: true, nuevos: nuevos.length, cambios: cambios, retardos: seg.length };
  } finally {
    lock.releaseLock();
  }
}

/** Alumno que llega tarde después de pasar lista (o antes). Nunca se le niega la entrada. */
function apiRetardo(idAlumno, hora, comentario, opciones) {
  const u = requiere_('lista');
  const a = alumno_(idAlumno);
  const fecha = fechaTrabajo_(u, opciones && opciones.fecha, !!(opciones && opciones.sinConexion));
  if (!esHabil_(fecha)) throw new Error('Ese día está marcado como día sin clase.');
  hora = /^\d{1,2}:\d{2}$/.test(String(hora || '')) ? hora : ahora_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    _cache = {};
    const prev = registrosDia_(fecha)[idAlumno];
    if (prev && prev.Estado === 'S') throw new Error('Este alumno ya tiene registrada su salida ese día.');
    if (prev) {
      actualizar_('Asistencias', prev._fila, { Estado: 'R', Hora_Llegada: hora, Comentario: comentario || prev.Comentario,
        Registro: u.email, Actualizado: sello_() });
    } else {
      agregar_('Asistencias', [{ Fecha: fecha, ID_Alumno: idAlumno, Grupo: a.Grupo_Actual, Estado: 'R', Hora_Llegada: hora,
        Hora_Salida: '', Comentario: comentario || '', Registro: u.email, Actualizado: sello_() }]);
    }
    if (!prev || prev.Estado !== 'R') agregar_('Seguimiento', [pendienteRetardo_(u, idAlumno, fecha, hora)]);
    log_(u, 'RETARDO', idAlumno + ' ' + hora);
    return { ok: true, nombre: nombre_(a), hora: hora };
  } finally {
    lock.releaseLock();
  }
}

/** Resumen del día para dirección y prefectos. */
function apiHoy(fecha) {
  requiere_('ver');
  fecha = validarFecha_(fecha || hoy_());
  const reg = registrosDia_(fecha);
  const al = mapaAlumnos_();
  const porGrupo = {};
  grupos_().forEach(function (g) {
    porGrupo[g] = { grupo: g, total: alumnosGrupo_(g).length, pasada: false, F: 0, R: 0, J: 0, S: 0 };
  });
  const faltas = [], retardos = [], salidas = [];
  Object.keys(reg).forEach(function (id) {
    const r = reg[id];
    const g = porGrupo[r.Grupo];
    if (g) { g.pasada = true; if (g[r.Estado] !== undefined) g[r.Estado]++; }
    const a = al[id];
    const fila = { id: id, nombre: a ? nombre_(a) : id, grupo: r.Grupo, hora: r.Hora_Llegada, horaSalida: r.Hora_Salida, comentario: r.Comentario };
    if (r.Estado === 'F') faltas.push(fila);
    if (r.Estado === 'R' || (r.Estado === 'S' && r.Hora_Llegada)) retardos.push(fila);
    if (r.Estado === 'S') salidas.push(fila);
  });
  const orden = function (a, b) { return (a.grupo + a.nombre).localeCompare(b.grupo + b.nombre, 'es'); };
  return {
    fecha: fecha,
    habil: esHabil_(fecha),
    grupos: Object.keys(porGrupo).sort().map(function (k) { return porGrupo[k]; }),
    faltas: faltas.sort(orden), retardos: retardos.sort(orden), salidas: salidas.sort(orden),
  };
}

/* ------------------------------------------------------------------ */
/* API: salidas                                                        */
/* ------------------------------------------------------------------ */

function marcarSalida_(u, a, fecha, hora) {
  _cache = {};
  const prev = registrosDia_(fecha)[a.ID_Alumno];
  if (prev) {
    actualizar_('Asistencias', prev._fila, { Estado: 'S', Hora_Salida: hora, Registro: u.email, Actualizado: sello_() });
  } else {
    agregar_('Asistencias', [{ Fecha: fecha, ID_Alumno: a.ID_Alumno, Grupo: a.Grupo_Actual, Estado: 'S', Hora_Llegada: '',
      Hora_Salida: hora, Comentario: '', Registro: u.email, Actualizado: sello_() }]);
  }
}

/**
 * d: {idAlumno, idContacto | (recoge, parentesco), motivo, detalle, hora, firma (data URL)}
 */
function apiRegistrarSalida(d) {
  const u = requiere_('salidas');
  const a = alumno_(d.idAlumno);
  if (a.Estatus !== 'ACTIVO') throw new Error('El alumno no está activo.');
  let recoge, parentesco, autorizado;
  if (d.idContacto) {
    const c = tabla_('Contactos').find(function (x) { return x.ID_Contacto === d.idContacto && x.ID_Alumno === a.ID_Alumno; });
    if (!c) throw new Error('El contacto no pertenece a este alumno.');
    recoge = c.Nombre; parentesco = c.Parentesco; autorizado = c.Autorizado.toUpperCase() === 'SI';
  } else {
    recoge = String(d.recoge || '').trim(); parentesco = String(d.parentesco || '').trim(); autorizado = false;
  }
  if (!recoge) throw new Error('Indica quién recoge al alumno.');
  if (!d.motivo) throw new Error('Selecciona el motivo de la salida.');
  const firma = String(d.firma || '');
  if (firma.indexOf('data:image/') !== 0) throw new Error('Falta la firma de quien recoge.');
  if (firma.length > 49000) throw new Error('La firma es demasiado grande. Bórrala y firma de nuevo.');

  const fecha = fechaTrabajo_(u, d.fecha, !!d.sinConexion);
  if (!esHabil_(fecha)) throw new Error('Ese día está marcado como día sin clase.');
  const hora = /^\d{1,2}:\d{2}$/.test(String(d.hora || '')) ? d.hora : ahora_();
  const puedeAprobar = tiene_(u, 'aprobarSalida');
  const estatus = (autorizado || puedeAprobar) ? 'COMPLETADA' : 'PENDIENTE_APROBACION';
  const id = nuevoId_('S');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    agregar_('Salidas', [{ ID_Salida: id, Fecha: fecha, Hora: hora, ID_Alumno: a.ID_Alumno, Grupo: a.Grupo_Actual,
      Recoge: recoge, Parentesco: parentesco, Autorizado: autorizado ? 'SI' : 'NO', Estatus: estatus,
      Aprobo: (!autorizado && puedeAprobar) ? u.email : '', Motivo: d.motivo, Detalle: String(d.detalle || '').slice(0, 300),
      Registro: u.email }]);
    agregar_('Firmas', [{ ID_Salida: id, Imagen: firma }]);
    if (estatus === 'COMPLETADA') marcarSalida_(u, a, fecha, hora);
    log_(u, 'SALIDA', id + ' ' + a.ID_Alumno + ' ' + estatus);
  } finally {
    lock.releaseLock();
  }
  return { id: id, estatus: estatus };
}

function apiAprobarSalida(id) {
  const u = requiere_('aprobarSalida');
  const s = tabla_('Salidas').find(function (x) { return x.ID_Salida === id; });
  if (!s) throw new Error('No se encontró la salida.');
  if (s.Estatus !== 'PENDIENTE_APROBACION') throw new Error('Esta salida ya no está pendiente.');
  actualizar_('Salidas', s._fila, { Estatus: 'COMPLETADA', Aprobo: u.email });
  marcarSalida_(u, alumno_(s.ID_Alumno), s.Fecha, s.Hora);
  log_(u, 'APROBAR_SALIDA', id);
  return { ok: true };
}

function salidaPublica_(s, al) {
  const a = al[s.ID_Alumno];
  return { id: s.ID_Salida, fecha: s.Fecha, hora: s.Hora, idAlumno: s.ID_Alumno, nombre: a ? nombre_(a) : s.ID_Alumno,
    grupo: s.Grupo, recoge: s.Recoge, parentesco: s.Parentesco, autorizado: s.Autorizado, estatus: s.Estatus,
    aprobo: s.Aprobo, motivo: s.Motivo, detalle: s.Detalle, registro: s.Registro };
}

function apiSalidas(fecha) {
  requiere_('ver');
  fecha = validarFecha_(fecha || hoy_());
  const al = mapaAlumnos_();
  return tabla_('Salidas').filter(function (s) { return s.Fecha === fecha; })
    .map(function (s) { return salidaPublica_(s, al); })
    .sort(function (a, b) { return b.hora.localeCompare(a.hora); });
}

/** Datos completos para imprimir el comprobante, con la firma. */
function apiComprobante(id) {
  requiere_('ver');
  const s = tabla_('Salidas').find(function (x) { return x.ID_Salida === id; });
  if (!s) throw new Error('No se encontró la salida.');
  const f = tabla_('Firmas').find(function (x) { return x.ID_Salida === id; });
  const out = salidaPublica_(s, mapaAlumnos_());
  out.firma = f ? f.Imagen : '';
  return out;
}

/* ------------------------------------------------------------------ */
/* API: justificaciones                                                */
/* ------------------------------------------------------------------ */

function apiJustificar(d) {
  const u = requiere_('justificar');
  const a = alumno_(d.idAlumno);
  const ini = validarFecha_(d.inicio, 'inicio');
  const fin = validarFecha_(d.fin || d.inicio, 'fin');
  if (fin < ini) throw new Error('La fecha final no puede ser antes de la inicial.');
  if (!d.tipo) throw new Error('Selecciona el tipo de documento.');
  const plazo = num_(config_(), 'PLAZO_JUSTIFICAR', 3);
  const transcurridos = ini <= hoy_() ? habilesEntre_(ini, hoy_()).length - 1 : 0;
  const fuera = transcurridos > plazo;

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    _cache = {};
    agregar_('Justificaciones', [{ ID_Just: nuevoId_('J'), Fecha_Registro: sello_(), ID_Alumno: a.ID_Alumno,
      Fecha_Inicio: ini, Fecha_Fin: fin, Tipo_Documento: d.tipo, Comentario: String(d.comentario || '').slice(0, 300),
      Fuera_Plazo: fuera ? 'SI' : 'NO', Registro: u.email }]);
    let cambiadas = 0;
    tabla_('Asistencias').forEach(function (r) {
      if (r.ID_Alumno === a.ID_Alumno && r.Fecha >= ini && r.Fecha <= fin && r.Estado === 'F') {
        actualizar_('Asistencias', r._fila, { Estado: 'J', Registro: u.email, Actualizado: sello_() });
        cambiadas++;
      }
    });
    log_(u, 'JUSTIFICAR', a.ID_Alumno + ' ' + ini + ' a ' + fin + ' (' + cambiadas + ')');
    return { ok: true, cambiadas: cambiadas, fueraPlazo: fuera, plazo: plazo };
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ */
/* API: alertas y seguimiento                                          */
/* ------------------------------------------------------------------ */

function calcularAlertas_(fecha) {
  const c = config_();
  const n = num_(c, 'VENTANA_DIAS', 10);
  const am = num_(c, 'UMBRAL_AMARILLO', 3);
  const ro = num_(c, 'UMBRAL_ROJO', 6);
  const ur = num_(c, 'UMBRAL_RETARDOS', 3);
  const dias = ventana_(fecha, n);
  const enVentana = {};
  dias.forEach(function (f) { enVentana[f] = true; });

  const cuenta = {};
  tabla_('Asistencias').forEach(function (r) {
    if (!enVentana[r.Fecha]) return;
    const o = cuenta[r.ID_Alumno] = cuenta[r.ID_Alumno] || { F: 0, R: 0, fechasF: [], fechasR: [] };
    if (r.Estado === 'F') { o.F++; o.fechasF.push(r.Fecha); }
    if (r.Estado === 'R' || (r.Estado === 'S' && r.Hora_Llegada)) { o.R++; o.fechasR.push(r.Fecha); }
  });

  const ultimoSeg = {};
  tabla_('Seguimiento').forEach(function (s) {
    if (!ultimoSeg[s.ID_Alumno] || s.Fecha >= ultimoSeg[s.ID_Alumno].fecha) {
      ultimoSeg[s.ID_Alumno] = { fecha: s.Fecha, tipo: s.Tipo, resultado: s.Resultado };
    }
  });

  const al = mapaAlumnos_();
  const alertas = [];
  Object.keys(cuenta).forEach(function (id) {
    const a = al[id];
    if (!a || a.Estatus !== 'ACTIVO') return;
    const o = cuenta[id];
    const nivel = o.F >= ro ? 'ROJO' : (o.F >= am ? 'AMARILLO' : '');
    const patron = o.R >= ur;
    if (!nivel && !patron) return;
    alertas.push({ id: id, nombre: nombre_(a), grupo: a.Grupo_Actual, faltas: o.F, retardos: o.R,
      fechasF: o.fechasF.sort(), fechasR: o.fechasR.sort(), nivel: nivel, patron: patron,
      ultimoSeguimiento: ultimoSeg[id] || null });
  });
  const peso = { ROJO: 2, AMARILLO: 1, '': 0 };
  alertas.sort(function (x, y) { return (peso[y.nivel] - peso[x.nivel]) || (y.faltas - x.faltas) || (y.retardos - x.retardos); });
  return { fecha: fecha, ventana: dias, umbrales: { amarillo: am, rojo: ro, retardos: ur }, alertas: alertas };
}

function apiAlertas(fecha) {
  requiere_('ver');
  const r = calcularAlertas_(validarFecha_(fecha || hoy_()));
  const al = mapaAlumnos_();
  r.pendientes = tabla_('Seguimiento').filter(function (s) { return s.Resultado === 'PENDIENTE'; })
    .map(function (s) {
      const a = al[s.ID_Alumno];
      return { idSeg: s.ID_Seg, id: s.ID_Alumno, nombre: a ? nombre_(a) : s.ID_Alumno, grupo: a ? a.Grupo_Actual : '',
        fecha: s.Fecha, motivo: s.Motivo, detalle: s.Detalle };
    })
    .sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
  return r;
}

/** d: {idAlumno, tipo, motivo, resultado, detalle, resuelve (ID_Seg pendiente, opcional)} */
function apiRegistrarSeguimiento(d) {
  const u = requiere_('seguimiento');
  const a = alumno_(d.idAlumno);
  if (!d.tipo) throw new Error('Selecciona el tipo de seguimiento.');
  agregar_('Seguimiento', [{ ID_Seg: nuevoId_('G'), Fecha: hoy_(), ID_Alumno: a.ID_Alumno, Tipo: d.tipo,
    Motivo: d.motivo || 'OTRO', Resultado: d.resultado || 'REGISTRADO', Detalle: String(d.detalle || '').slice(0, 500),
    Registro: u.email }]);
  if (d.resuelve) {
    const p = tabla_('Seguimiento').find(function (s) { return s.ID_Seg === d.resuelve; });
    if (p && p.Resultado === 'PENDIENTE') actualizar_('Seguimiento', p._fila, { Resultado: 'ATENDIDO' });
  }
  log_(u, 'SEGUIMIENTO', a.ID_Alumno + ' ' + d.tipo);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* API: alumnos                                                        */
/* ------------------------------------------------------------------ */

function apiBuscarAlumnos(q, grupo, incluirBajas) {
  requiere_('ver');
  const t = norm_(q).trim();
  let lista = tabla_('Alumnos').filter(function (a) {
    if (!incluirBajas && a.Estatus !== 'ACTIVO') return false;
    if (grupo && a.Grupo_Actual !== grupo) return false;
    if (!t) return !!grupo;
    const n = norm_(nombre_(a) + ' ' + a.Nombres + ' ' + a.CURP + ' ' + a.ID_Alumno);
    return t.split(/\s+/).every(function (p) { return n.indexOf(p) >= 0; });
  });
  lista = ordenarAlumnos_(lista).slice(0, 60);
  return lista.map(function (a) { return { id: a.ID_Alumno, nombre: nombre_(a), grupo: a.Grupo_Actual, estatus: a.Estatus }; });
}

function apiAlumno(id) {
  const u = requiere_('ver');
  const a = alumno_(id);
  const resumen = { P: 0, F: 0, R: 0, J: 0, S: 0 };
  const ultimas = [];
  tabla_('Asistencias').forEach(function (r) {
    if (r.ID_Alumno !== id) return;
    if (resumen[r.Estado] !== undefined) resumen[r.Estado]++;
    if (r.Estado !== 'P') ultimas.push({ fecha: r.Fecha, estado: r.Estado, hora: r.Hora_Llegada || r.Hora_Salida, comentario: r.Comentario });
  });
  const al = mapaAlumnos_();
  return {
    puedeEditar: tiene_(u, 'alumnos'),
    alumno: { id: a.ID_Alumno, paterno: a.Apellido_Paterno, materno: a.Apellido_Materno, nombres: a.Nombres, nombre: nombre_(a),
      curp: a.CURP, grupo: a.Grupo_Actual, estatus: a.Estatus, alta: a.Fecha_Alta, notas: a.Notas },
    contactos: tabla_('Contactos').filter(function (c) { return c.ID_Alumno === id; })
      .map(function (c) { return { id: c.ID_Contacto, nombre: c.Nombre, parentesco: c.Parentesco, telefono: c.Telefono, autorizado: c.Autorizado }; }),
    historial: tabla_('Historial_Grupos').filter(function (h) { return h.ID_Alumno === id; })
      .map(function (h) { return { fecha: h.Fecha, ciclo: h.Ciclo, anterior: h.Grupo_Anterior, nuevo: h.Grupo_Nuevo, movimiento: h.Movimiento, motivo: h.Motivo }; })
      .sort(function (x, y) { return y.fecha.localeCompare(x.fecha); }),
    resumen: resumen,
    incidencias: ultimas.sort(function (x, y) { return y.fecha.localeCompare(x.fecha); }).slice(0, 30),
    salidas: tabla_('Salidas').filter(function (s) { return s.ID_Alumno === id; }).map(function (s) { return salidaPublica_(s, al); })
      .sort(function (x, y) { return (y.fecha + y.hora).localeCompare(x.fecha + x.hora); }).slice(0, 15),
    justificaciones: tabla_('Justificaciones').filter(function (j) { return j.ID_Alumno === id; })
      .map(function (j) { return { inicio: j.Fecha_Inicio, fin: j.Fecha_Fin, tipo: j.Tipo_Documento, comentario: j.Comentario, fueraPlazo: j.Fuera_Plazo }; })
      .sort(function (x, y) { return y.inicio.localeCompare(x.inicio); }),
    seguimiento: tabla_('Seguimiento').filter(function (s) { return s.ID_Alumno === id; })
      .map(function (s) { return { id: s.ID_Seg, fecha: s.Fecha, tipo: s.Tipo, motivo: s.Motivo, resultado: s.Resultado, detalle: s.Detalle, registro: s.Registro }; })
      .sort(function (x, y) { return y.fecha.localeCompare(x.fecha); }),
  };
}

function siguienteIdAlumno_() {
  let max = 0;
  tabla_('Alumnos').forEach(function (a) {
    const n = parseInt(String(a.ID_Alumno).replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return 'A' + ('0000' + (max + 1)).slice(-4);
}

function historial_(u, idAlumno, anterior, nuevo, movimiento, motivo, fecha) {
  return { Fecha: fecha || hoy_(), ID_Alumno: idAlumno, Ciclo: config_().CICLO, Grupo_Anterior: anterior || '',
    Grupo_Nuevo: nuevo || '', Movimiento: movimiento, Motivo: motivo || '', Registro: u.email };
}

/** Alta (sin id) o edición de datos personales (con id). El grupo se cambia con apiMoverAlumno. */
function apiGuardarAlumno(d) {
  const u = requiere_('alumnos');
  const paterno = String(d.paterno || '').trim().toUpperCase();
  const materno = String(d.materno || '').trim().toUpperCase();
  const nombres = String(d.nombres || '').trim().toUpperCase();
  const curp = String(d.curp || '').trim().toUpperCase();
  if (!paterno || !nombres) throw new Error('Escribe al menos apellido paterno y nombre(s).');
  if (curp && !/^[A-Z0-9]{18}$/.test(curp)) throw new Error('La CURP debe tener 18 letras y números.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    _cache = {};
    if (curp) {
      const dup = tabla_('Alumnos').find(function (a) { return a.CURP === curp && a.ID_Alumno !== d.id; });
      if (dup) throw new Error('Ya existe un alumno con esa CURP (' + dup.ID_Alumno + ').');
    }
    if (d.id) {
      const a = alumno_(d.id);
      actualizar_('Alumnos', a._fila, { Apellido_Paterno: paterno, Apellido_Materno: materno, Nombres: nombres, CURP: curp, Notas: String(d.notas || '') });
      log_(u, 'EDITAR_ALUMNO', d.id);
      return { id: d.id };
    }
    if (grupos_().indexOf(d.grupo) < 0) throw new Error('Selecciona un grupo válido.');
    const id = siguienteIdAlumno_();
    agregar_('Alumnos', [{ ID_Alumno: id, Apellido_Paterno: paterno, Apellido_Materno: materno, Nombres: nombres, CURP: curp,
      Grupo_Actual: d.grupo, Estatus: 'ACTIVO', Fecha_Alta: hoy_(), Notas: String(d.notas || '') }]);
    agregar_('Historial_Grupos', [historial_(u, id, '', d.grupo, 'ALTA', d.motivo || 'Inscripción')]);
    log_(u, 'ALTA_ALUMNO', id);
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}

/** tipo: CAMBIO | BAJA | REINGRESO */
function apiMoverAlumno(id, tipo, grupoNuevo, motivo) {
  const u = requiere_('alumnos');
  const a = alumno_(id);
  motivo = String(motivo || '').trim();
  if (!motivo) throw new Error('Escribe el motivo del movimiento.');
  if (tipo === 'CAMBIO') {
    if (a.Estatus !== 'ACTIVO') throw new Error('Solo se puede cambiar de grupo a un alumno activo.');
    if (grupos_().indexOf(grupoNuevo) < 0) throw new Error('Selecciona el grupo nuevo.');
    if (grupoNuevo === a.Grupo_Actual) throw new Error('El alumno ya está en ese grupo.');
    actualizar_('Alumnos', a._fila, { Grupo_Actual: grupoNuevo });
    agregar_('Historial_Grupos', [historial_(u, id, a.Grupo_Actual, grupoNuevo, 'CAMBIO_GRUPO', motivo)]);
  } else if (tipo === 'BAJA') {
    if (a.Estatus !== 'ACTIVO') throw new Error('El alumno ya no está activo.');
    actualizar_('Alumnos', a._fila, { Estatus: 'BAJA' });
    agregar_('Historial_Grupos', [historial_(u, id, a.Grupo_Actual, '', 'BAJA', motivo)]);
  } else if (tipo === 'REINGRESO') {
    if (a.Estatus === 'ACTIVO') throw new Error('El alumno ya está activo.');
    if (grupos_().indexOf(grupoNuevo) < 0) throw new Error('Selecciona el grupo de reingreso.');
    actualizar_('Alumnos', a._fila, { Estatus: 'ACTIVO', Grupo_Actual: grupoNuevo });
    agregar_('Historial_Grupos', [historial_(u, id, a.Grupo_Actual, grupoNuevo, 'REINGRESO', motivo)]);
  } else {
    throw new Error('Movimiento no válido.');
  }
  log_(u, 'MOVIMIENTO', id + ' ' + tipo + ' ' + (grupoNuevo || ''));
  return { ok: true };
}

function apiGuardarContacto(d) {
  const u = requiere_('alumnos');
  alumno_(d.idAlumno);
  const nombre = String(d.nombre || '').trim();
  const tel = String(d.telefono || '').replace(/[^\d+]/g, '');
  if (!nombre) throw new Error('Escribe el nombre del contacto.');
  if (tel && tel.replace(/\D/g, '').length < 10) throw new Error('El teléfono debe tener 10 dígitos.');
  const obj = { ID_Alumno: d.idAlumno, Nombre: nombre.toUpperCase(), Parentesco: String(d.parentesco || '').trim(),
    Telefono: tel, Autorizado: d.autorizado === 'SI' ? 'SI' : 'NO' };
  if (d.id) {
    const c = tabla_('Contactos').find(function (x) { return x.ID_Contacto === d.id; });
    if (!c) throw new Error('No se encontró el contacto.');
    actualizar_('Contactos', c._fila, obj);
  } else {
    obj.ID_Contacto = nuevoId_('C');
    agregar_('Contactos', [obj]);
  }
  log_(u, 'CONTACTO', d.idAlumno + ' ' + obj.Nombre);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* API: reportes                                                       */
/* ------------------------------------------------------------------ */

function quincena_(f) {
  const d = parseF_(f);
  const y = d.getFullYear(), m = d.getMonth();
  if (d.getDate() <= 15) return [fmtF_(new Date(y, m, 1, 12)), fmtF_(new Date(y, m, 15, 12))];
  return [fmtF_(new Date(y, m, 16, 12)), fmtF_(new Date(y, m + 1, 0, 12))];
}

function apiConcentrado(grupo, ini, fin) {
  requiere_('ver');
  if (!ini || !fin) { const q = quincena_(hoy_()); ini = q[0]; fin = q[1]; }
  validarFecha_(ini); validarFecha_(fin);
  if (fin < ini) throw new Error('La fecha final no puede ser antes de la inicial.');
  const dias = habilesEntre_(ini, fin);
  const enRango = {};
  dias.forEach(function (f) { enRango[f] = true; });
  const al = mapaAlumnos_();
  const grid = {};
  tabla_('Asistencias').forEach(function (r) {
    if (!enRango[r.Fecha] || r.Grupo !== grupo) return;
    (grid[r.ID_Alumno] = grid[r.ID_Alumno] || {})[r.Fecha] = r.Estado;
  });
  const ids = {};
  alumnosGrupo_(grupo).forEach(function (a) { ids[a.ID_Alumno] = true; });
  Object.keys(grid).forEach(function (id) { ids[id] = true; });
  const filas = ordenarAlumnos_(Object.keys(ids).map(function (id) { return al[id]; }).filter(Boolean)).map(function (a, i) {
    const g = grid[a.ID_Alumno] || {};
    const t = { P: 0, F: 0, R: 0, J: 0, S: 0 };
    const estados = dias.map(function (f) { const e = g[f] || ''; if (t[e] !== undefined) t[e]++; return e; });
    return { num: i + 1, id: a.ID_Alumno, nombre: nombre_(a), activo: a.Estatus === 'ACTIVO' && a.Grupo_Actual === grupo,
      estados: estados, totales: t };
  });
  return { grupo: grupo, inicio: ini, fin: fin, dias: dias, filas: filas, ciclo: config_().CICLO };
}

/** Concentrado en CSV (se abre en Excel). */
function apiExportarConcentrado(grupo, ini, fin) {
  const c = apiConcentrado(grupo, ini, fin);
  const celda = function (v) { const t = String(v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const enc = ['#', 'Alumno'].concat(c.dias.map(function (f) { return f.slice(8) + '/' + f.slice(5, 7); }))
    .concat(['Faltas', 'Retardos', 'Justificadas', 'Salidas']);
  const filas = c.filas.map(function (f) {
    return [f.num, f.nombre].concat(f.estados).concat([f.totales.F, f.totales.R, f.totales.J, f.totales.S]);
  });
  const lineas = [['Concentrado de asistencia ' + grupo + ' del ' + c.inicio + ' al ' + c.fin]]
    .concat([enc]).concat(filas).concat([[''], ['P presente · F falta · R retardo · J justificada · S salió temprano']]);
  return {
    nombre: 'Concentrado_' + grupo + '_' + c.inicio + '_a_' + c.fin + '.csv',
    csv: lineas.map(function (l) { return l.map(celda).join(','); }).join('\r\n'),
  };
}

/* ------------------------------------------------------------------ */
/* Menú de la hoja (lo usa quien administra)                           */
/* ------------------------------------------------------------------ */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Plataforma')
    .addItem('1. Configurar hojas', 'configurarHojas')
    .addItem('2. Generar historial de prueba', 'generarHistorialPrueba')
    .addSeparator()
    .addItem('Importar alumnos (pestaña Importar)', 'importarAlumnos')
    .addItem('Cambio de ciclo escolar', 'cambioDeCiclo')
    .addItem('Activar aviso diario por correo', 'activarAvisoDiario')
    .addToUi();
}

function configurarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  const todas = Object.assign({}, HOJAS, { Importar: IMPORTAR_ENCABEZADOS });
  Object.keys(todas).forEach(function (n) {
    let s = ss.getSheetByName(n);
    if (!s) s = ss.insertSheet(n);
    const h = todas[n];
    s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#1F3864').setFontColor('#FFFFFF');
    s.setFrozenRows(1);
    s.getRange(1, 1, Math.max(s.getMaxRows(), 2), h.length).setNumberFormat('@');
  });
  const hoja1 = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja1');
  if (hoja1 && ss.getSheets().length > 1 && hoja1.getLastRow() === 0) ss.deleteSheet(hoja1);

  _cache = {};
  const claves = tabla_('Config').map(function (r) { return r.Clave; });
  agregar_('Config', CONFIG_DEF.filter(function (d) { return claves.indexOf(d[0]) < 0; })
    .map(function (d) { return { Clave: d[0], Valor: d[1], Descripcion: d[2] }; }));

  if (!tabla_('Usuarios').length) {
    const correo = Session.getActiveUser().getEmail();
    if (correo) agregar_('Usuarios', [{ Correo: correo, Nombre: 'Administrador', Rol: 'ADMIN', Activo: 'SI' }]);
  }
  SpreadsheetApp.getUi().alert('Listo. Las pestañas están configuradas.');
}

/** Llena los últimos 10 días hábiles (sin contar hoy) con asistencias de prueba. */
function generarHistorialPrueba() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Esto agrega asistencias inventadas de los últimos 10 días hábiles. Úsalo solo con alumnos de prueba. ¿Continuar?',
    ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  _cache = {};
  const ayer = parseF_(hoy_()); ayer.setDate(ayer.getDate() - 1);
  const dias = ventana_(fmtF_(ayer), 10);
  const existentes = {};
  tabla_('Asistencias').forEach(function (r) { existentes[r.Fecha + '|' + r.ID_Alumno] = true; });
  const filas = [];
  const seg = [];
  const correo = Session.getActiveUser().getEmail() || 'prueba';
  grupos_().forEach(function (g, gi) {
    alumnosGrupo_(g).forEach(function (a, ai) {
      dias.forEach(function (f, di) {
        if (existentes[f + '|' + a.ID_Alumno]) return;
        let e = 'P';
        const x = Math.random();
        if (x < 0.06) e = 'F'; else if (x < 0.1) e = 'R';
        if (gi === 0 && ai === 0) e = di >= dias.length - 6 ? 'F' : 'P';   // alerta roja
        if (gi === 4 && ai === 1) e = di % 3 === 1 ? 'F' : 'P';           // alerta amarilla
        if (gi === 8 && ai === 2) e = di % 3 === 1 ? 'R' : 'P';           // patrón de retardos
        const hora = e === 'R' ? '14:1' + (di % 9 + 1) : '';
        filas.push({ Fecha: f, ID_Alumno: a.ID_Alumno, Grupo: g, Estado: e, Hora_Llegada: hora, Hora_Salida: '',
          Comentario: '', Registro: correo, Actualizado: sello_() });
        if (e === 'R' && di === dias.length - 1) seg.push(pendienteRetardo_({ email: correo }, a.ID_Alumno, f, hora));
      });
    });
  });
  agregar_('Asistencias', filas);
  agregar_('Seguimiento', seg);
  ui.alert('Se agregaron ' + filas.length + ' registros de prueba.');
}

function importarAlumnos() {
  const ui = SpreadsheetApp.getUi();
  const s = sh_('Importar');
  const ultima = s.getLastRow();
  if (ultima < 2) { ui.alert('La pestaña Importar está vacía. Pega los alumnos debajo de los encabezados.'); return; }
  _cache = {};
  const valores = s.getRange(2, 1, ultima - 1, IMPORTAR_ENCABEZADOS.length).getValues().map(function (r) { return r.map(txt_); });
  const grupos = grupos_();
  const u = { email: Session.getActiveUser().getEmail() || 'importacion' };
  const curps = {};
  tabla_('Alumnos').forEach(function (a) { if (a.CURP) curps[a.CURP] = a.ID_Alumno; });
  let max = parseInt(siguienteIdAlumno_().slice(1), 10) - 1;
  const alumnos = [], contactos = [], hist = [];
  const resultados = valores.map(function (r) {
    if (r[14]) return [r[14]];
    const paterno = r[0].toUpperCase(), materno = r[1].toUpperCase(), nombres = r[2].toUpperCase(), curp = r[3].toUpperCase();
    const grupo = r[4].toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (!paterno && !nombres) return [''];
    if (!paterno || !nombres) return ['Error: falta apellido o nombre'];
    if (grupos.indexOf(grupo) < 0) return ['Error: grupo "' + r[4] + '" no existe'];
    if (curp && curps[curp]) return ['Ya existe (' + curps[curp] + ')'];
    max++;
    const id = 'A' + ('0000' + max).slice(-4);
    if (curp) curps[curp] = id;
    alumnos.push({ ID_Alumno: id, Apellido_Paterno: paterno, Apellido_Materno: materno, Nombres: nombres, CURP: curp,
      Grupo_Actual: grupo, Estatus: 'ACTIVO', Fecha_Alta: hoy_(), Notas: '' });
    hist.push(historial_(u, id, '', grupo, 'ALTA', 'Importación'));
    [5, 8, 11].forEach(function (k) {
      if (!r[k]) return;
      contactos.push({ ID_Contacto: nuevoId_('C') + k, ID_Alumno: id, Nombre: r[k].toUpperCase(), Parentesco: r[k + 1],
        Telefono: r[k + 2].replace(/[^\d+]/g, ''), Autorizado: 'SI' });
    });
    return ['Importado ' + id];
  });
  agregar_('Alumnos', alumnos);
  agregar_('Contactos', contactos);
  agregar_('Historial_Grupos', hist);
  s.getRange(2, 15, resultados.length, 1).setValues(resultados);
  ui.alert('Importados: ' + alumnos.length + ' alumnos y ' + contactos.length + ' contactos. Revisa la columna Resultado.');
}

/** Pasa 1° a 2° y 2° a 3° (misma letra) y marca a 3° como egresado. */
function cambioDeCiclo() {
  const ui = SpreadsheetApp.getUi();
  const c = config_();
  const p = String(c.CICLO).split('-').map(Number);
  const nuevo = (p[0] + 1) + '-' + (p[1] + 1);
  const r = ui.prompt('Cambio de ciclo', 'Se pasará del ciclo ' + c.CICLO + ' al ' + nuevo +
    '. Los de 3° quedarán como egresados. Escribe CONFIRMAR para continuar.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK || r.getResponseText().trim().toUpperCase() !== 'CONFIRMAR') return;
  _cache = {};
  const u = { email: Session.getActiveUser().getEmail() || 'cambio de ciclo' };
  const grupos = grupos_();
  const hist = [];
  let promovidos = 0, egresados = 0;
  tabla_('Alumnos').forEach(function (a) {
    if (a.Estatus !== 'ACTIVO') return;
    const grado = parseInt(a.Grupo_Actual, 10);
    const letra = a.Grupo_Actual.replace(/^\d+/, '');
    if (grado >= 3) {
      actualizar_('Alumnos', a._fila, { Estatus: 'EGRESADO' });
      hist.push(Object.assign(historial_(u, a.ID_Alumno, a.Grupo_Actual, '', 'EGRESO', 'Fin de ciclo ' + c.CICLO), { Ciclo: c.CICLO }));
      egresados++;
    } else {
      const sig = (grado + 1) + letra;
      if (grupos.indexOf(sig) < 0) return;
      actualizar_('Alumnos', a._fila, { Grupo_Actual: sig });
      hist.push(Object.assign(historial_(u, a.ID_Alumno, a.Grupo_Actual, sig, 'PROMOCION', 'Ciclo ' + nuevo), { Ciclo: nuevo }));
      promovidos++;
    }
  });
  agregar_('Historial_Grupos', hist);
  const fila = tabla_('Config').find(function (x) { return x.Clave === 'CICLO'; });
  if (fila) actualizar_('Config', fila._fila, { Valor: nuevo });
  ui.alert('Ciclo ' + nuevo + ': ' + promovidos + ' promovidos y ' + egresados + ' egresados.');
}

/* ------------------------------------------------------------------ */
/* Aviso diario por correo                                             */
/* ------------------------------------------------------------------ */

function activarAvisoDiario() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'enviarAvisoDiario') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('enviarAvisoDiario').timeBased().everyDays(1).atHour(19).inTimezone(TZ).create();
  SpreadsheetApp.getUi().alert('Listo. Cada día hábil a las 7 pm se enviará un correo con las alertas.');
}

function enviarAvisoDiario() {
  _cache = {};
  const fecha = hoy_();
  if (!esHabil_(fecha)) return;
  const r = calcularAlertas_(fecha);
  if (!r.alertas.length) return;
  const usuarios = tabla_('Usuarios').filter(function (x) { return x.Activo.toUpperCase() !== 'NO'; });
  const correos = function (roles) {
    return usuarios.filter(function (x) { return roles.indexOf(x.Rol.toUpperCase()) >= 0; }).map(function (x) { return x.Correo; });
  };
  const fila = function (a) {
    return '<tr><td>' + a.grupo + '</td><td>' + a.nombre + '</td><td style="text-align:center">' + a.faltas +
      '</td><td style="text-align:center">' + a.retardos + '</td><td>' + (a.nivel || 'Retardos') + '</td></tr>';
  };
  const tabla = function (lista) {
    return '<table border="1" cellpadding="6" style="border-collapse:collapse;font-family:Arial;font-size:13px">' +
      '<tr><th>Grupo</th><th>Alumno</th><th>Faltas</th><th>Retardos</th><th>Nivel</th></tr>' + lista.map(fila).join('') + '</table>';
  };
  const rojos = r.alertas.filter(function (a) { return a.nivel === 'ROJO'; });
  const pie = '<p style="font-family:Arial;font-size:12px;color:#666">Últimos ' + r.ventana.length + ' días hábiles (' +
    r.ventana[0] + ' al ' + r.ventana[r.ventana.length - 1] + '). Faltas injustificadas.</p>';
  const dir = correos(['ADMIN', 'DIRECTOR', 'SUBDIRECTOR', 'TRABAJO_SOCIAL']);
  if (rojos.length && dir.length) {
    MailApp.sendEmail({ to: dir.join(','), subject: 'Alerta de faltas: ' + rojos.length + ' alumno(s) en rojo (' + fecha + ')',
      htmlBody: '<p style="font-family:Arial">Alumnos con más de 5 faltas injustificadas:</p>' + tabla(rojos) + pie });
  }
  const pref = correos(['PREFECTO']);
  if (pref.length) {
    MailApp.sendEmail({ to: pref.join(','), subject: 'Resumen de alertas de asistencia (' + fecha + ')',
      htmlBody: '<p style="font-family:Arial">Alumnos en riesgo o con patrón de retardos:</p>' + tabla(r.alertas) + pie });
  }
}
