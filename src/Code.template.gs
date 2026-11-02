/**
 * ARQUEO LA BARRA — servidor (Google Apps Script)
 * Guarda todo en las hojas de esta misma hoja de cálculo.
 * Primera vez: ejecuta la función  instalar  una sola vez (ver instrucciones).
 */
var TZ = 'America/Santo_Domingo';
var TOKEN_DIAS = 60;

var H = {
  Usuarios: ['email', 'nombre', 'rol', 'estado', 'negocios', 'creado', 'aprobadoPor', 'ultimoAcceso', 'telefono', 'turnos'],
  Productos: ['id', 'nombre', 'cat', 'unidad', 'factor', 'tol', 'costo', 'critico', 'negocios', 'orden', 'activo'],
  Conteos: ['id', 'fecha', 'negocio', 'turno', 'resp', 'email', 'ts', 'estado', 'items', 'ventas', 'res', 'resumen', 'sin', 'ventasPor', 'ventasTs', 'rect', 'nota', 'cierre'],
  Entradas: ['id', 'fecha', 'negocio', 'resp', 'email', 'ts', 'nota', 'items', 'anulada', 'origen'],
  Movimientos: ['id', 'fecha', 'tipo', 'negocio', 'destino', 'motivo', 'detalle', 'resp', 'email', 'ts', 'items', 'estado', 'recPor', 'recTs', 'recItems', 'anulada'],
  Notificaciones: ['id', 'ts', 'para', 'tipo', 'titulo', 'texto', 'negocio', 'ref', 'leidoPor'],
  Bitacora: ['ts', 'email', 'accion', 'detalle'],
  Equivalencias: ['clave', 'pid', 'original'],
  Config: ['key', 'value']
};
var JSONC = { Usuarios: ['negocios', 'turnos'], Productos: ['negocios'], Conteos: ['items', 'ventas', 'res', 'resumen', 'sin', 'cierre'], Entradas: ['items'], Movimientos: ['items', 'recItems'], Notificaciones: ['leidoPor'] };
var NUMC = ['factor', 'tol', 'costo', 'critico', 'orden', 'activo', 'ts', 'rect', 'anulada', 'ventasTs', 'recTs'];
var TEXTC = ['id', 'fecha', 'email', 'turno', 'negocio', 'clave', 'pid', 'nombre', 'resp', 'ref'];

var SEED_PRODUCTOS = /*__SEED_PRODUCTOS__*/[];
var SEED_ALIAS = /*__SEED_ALIAS__*/[];

/* Negocios que cuentan «Había» (apertura) y «Quedan» (cierre) a mano. En los demás, «Había» es lo que dejó el conteo anterior. */
var DOBLE = ['Zona Presidente'];
/* Negocios sin POS: se controla el consumo por conteo, sin ventas */
var INSUMOS = ['Car Wash'];
var INSUMOS_PRODUCTOS = [
  { id: 'cw-001', nombre: 'Shampoo (libras)', u: 'lb' },
  { id: 'cw-002', nombre: 'Desengrasante (libras)', u: 'lb' },
  { id: 'cw-003', nombre: 'Amorol (libras)', u: 'lb' },
  { id: 'cw-004', nombre: 'Lanilla', u: 'unid' },
  { id: 'cw-005', nombre: 'Esponja', u: 'unid' },
  { id: 'cw-006', nombre: 'Cera', u: 'unid' },
  { id: 'cw-007', nombre: 'Hidratante (galones)', u: 'gal' },
  { id: 'cw-008', nombre: 'Lija 2000', u: 'unid' },
  { id: 'cw-009', nombre: 'Lija 3000', u: 'unid' },
  { id: 'cw-010', nombre: 'Hidratante de motor', u: 'gal' },
  { id: 'cw-011', nombre: 'Hidratante de interior', u: 'gal' },
  { id: 'cw-012', nombre: 'Shampoo encerado', u: 'lb' }
];

var CONFIG_DEF = {
  negocios: ['La Barra Atala', 'La Barra Atalaya', 'La Barra Miraflores', 'Food Shop', 'Zona Presidente', 'Car Wash'],
  turnos: {
    'La Barra Atala': ['Turno 1 (7AM-3PM)', 'Turno 2 (3PM-11PM)', 'Turno 3 (11PM-7AM)'],
    'La Barra Atalaya': ['Turno 1 (7AM-3PM)', 'Turno 2 (3PM-11PM)'],
    'La Barra Miraflores': ['Turno 1 (7AM-3PM)', 'Turno 2 (3PM-11PM)', 'Turno 3 (11PM-7AM)'],
    'Food Shop': ['Turno 1 (7AM-3PM)', 'Turno 2 (3PM-11PM)'],
    'Zona Presidente': ['Turno único (3PM-11PM)'],
    'Car Wash': []
  },
  /* El turno 3 (11PM-7AM) se cuenta al terminar, a las 7AM, y lleva la fecha de ese día */
  limites: {
    'La Barra Atala|Turno 1 (7AM-3PM)': '15:30', 'La Barra Atala|Turno 2 (3PM-11PM)': '23:30', 'La Barra Atala|Turno 3 (11PM-7AM)': '07:30',
    'La Barra Atalaya|Turno 1 (7AM-3PM)': '15:30', 'La Barra Atalaya|Turno 2 (3PM-11PM)': '23:30',
    'La Barra Miraflores|Turno 1 (7AM-3PM)': '15:30', 'La Barra Miraflores|Turno 2 (3PM-11PM)': '23:30', 'La Barra Miraflores|Turno 3 (11PM-7AM)': '07:30',
    'Food Shop|Turno 1 (7AM-3PM)': '15:30', 'Food Shop|Turno 2 (3PM-11PM)': '23:30',
    'Zona Presidente|Turno único (3PM-11PM)': '23:30'
  },
  calendario: {},
  /* Categorías que no se cuentan todos los días: {negocio: {categoría: [días 0=dom…6=sáb]}} */
  catDias: { 'La Barra Atala': { 'Cervezas': [1] }, 'La Barra Atalaya': { 'Cervezas': [1] }, 'La Barra Miraflores': { 'Cervezas': [1] } },
  avisos: { acceso: true, pendiente: true, critico: true, falta: true }
};

/* ============================ utilidades ============================ */
function fail(code, msg) { var e = new Error(msg || code); e.code = code; throw e; }
function props() { return PropertiesService.getScriptProperties(); }
function ssb() {
  var id = props().getProperty('SSID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function sheet(name) {
  var ss = ssb(), s = ss.getSheetByName(name);
  if (!s && H[name]) {   // hoja nueva de una versión posterior: se crea sola
    s = ss.insertSheet(name);
    s.getRange(1, 1, 1, H[name].length).setValues([H[name]]).setFontWeight('bold');
    s.setFrozenRows(1);
  }
  if (!s) fail('setup', 'Falta la hoja ' + name + '. Ejecuta la función instalar.');
  return s;
}
function now() { return new Date().getTime(); }
function hoy() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function fechaMas(f, d) {
  var p = f.split('-'); var dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + d));
  return dt.getUTCFullYear() + '-' + ('0' + (dt.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + dt.getUTCDate()).slice(-2);
}
function normEmail(e) {
  e = String(e || '').trim().toLowerCase();
  return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(e) ? e : '';
}
function normClave(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function r2(x, d) { var m = Math.pow(10, d || 2); return Math.round(x * m) / m; }
function num(v) { var n = Number(v); return isFinite(n) ? n : null; }
function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function sha(str) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return b.map(function (x) { return ('0' + (x < 0 ? x + 256 : x).toString(16)).slice(-2); }).join('');
}
function secret() {
  var s = props().getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props().setProperty('SECRET', s); }
  return s;
}
function appUrl() { try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; } }

/* ============================ tablas ============================ */
function headers(name) { return H[name]; }
function colIdx(name, col) { return H[name].indexOf(col); }
function parseJ(v, def) {
  if (v === '' || v == null) return def;
  try { return JSON.parse(v); } catch (e) { return def; }
}
function fromRow(name, row) {
  var h = H[name], o = {}, jc = JSONC[name] || [];
  for (var i = 0; i < h.length; i++) {
    var c = h[i], v = row[i];
    if (jc.indexOf(c) > -1) {
      var def = (c === 'ventas' || c === 'resumen') ? {} : [];
      o[c] = parseJ(v, def);
    } else if (NUMC.indexOf(c) > -1) { o[c] = v === '' || v == null ? 0 : Number(v); }
    else if (c === 'fecha') { o[c] = (v instanceof Date) ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v == null ? '' : v); }
    else { o[c] = v == null ? '' : (typeof v === 'string' ? v : String(v)); }
  }
  return o;
}
function toRow(name, o) {
  var h = H[name], jc = JSONC[name] || [], row = [];
  for (var i = 0; i < h.length; i++) {
    var c = h[i], v = o[c];
    if (jc.indexOf(c) > -1) {
      var s = JSON.stringify(v == null ? ((c === 'ventas' || c === 'resumen') ? {} : []) : v);
      if (s.length > 49000) fail('grande', 'Hay demasiados datos en un solo registro (' + c + ').');
      row.push(s);
    } else if (typeof v === 'string' && /^[=+\-@]/.test(v)) row.push(' ' + v);   // evita fórmulas inyectadas desde las hojas
    else row.push(v == null ? '' : v);
  }
  return row;
}
function readAll(name) {
  var s = sheet(name), last = s.getLastRow();
  if (last < 2) return [];
  var vals = s.getRange(2, 1, last - 1, H[name].length).getValues();
  return vals.map(function (r, i) { var o = fromRow(name, r); o._row = i + 2; return o; });
}
function appendObj(name, o) { sheet(name).appendRow(toRow(name, o)); }
function writeRow(name, rowIdx, o) {
  sheet(name).getRange(rowIdx, 1, 1, H[name].length).setValues([toRow(name, o)]);
}
function findRowById(name, id) {
  var s = sheet(name), last = s.getLastRow();
  if (last < 2) return 0;
  var ids = s.getRange(2, 1, last - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}
function readRowObj(name, rowIdx) {
  var r = sheet(name).getRange(rowIdx, 1, 1, H[name].length).getValues()[0];
  var o = fromRow(name, r); o._row = rowIdx; return o;
}
function bit(email, accion, detalle) {
  try { appendObj('Bitacora', { ts: now(), email: email, accion: accion, detalle: String(detalle || '').slice(0, 900) }); } catch (e) { }
}

/* ============================ config ============================ */
function cacheGet(k) {
  try { var v = CacheService.getScriptCache().get(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function cachePut(k, v, sec) {
  try { var s = JSON.stringify(v); if (s.length < 90000) CacheService.getScriptCache().put(k, s, sec); } catch (e) { }
}
function cacheDrop() {
  try { CacheService.getScriptCache().removeAll(['k_cfg', 'k_prods', 'k_users']); } catch (e) { }
}
function getConfig() {
  var hit = cacheGet('k_cfg');
  if (hit) return hit;
  var rows = readAll('Config'), c = {};
  rows.forEach(function (r) { try { c[r.key] = JSON.parse(r.value); } catch (e) { } });
  Object.keys(CONFIG_DEF).forEach(function (k) { if (c[k] == null) c[k] = JSON.parse(JSON.stringify(CONFIG_DEF[k])); });
  cachePut('k_cfg', c, 300);
  return c;
}
function getProductos() {
  var hit = cacheGet('k_prods');
  if (hit) return hit;
  var rows = readAll('Productos');
  cachePut('k_prods', rows, 300);
  return rows;
}
function setConfigKey(key, val) {
  var rows = readAll('Config'), row = 0;
  rows.forEach(function (r) { if (r.key === key) row = r._row; });
  var vals = [[key, JSON.stringify(val)]];
  if (row) sheet('Config').getRange(row, 1, 1, 2).setValues(vals);
  else sheet('Config').appendRow(vals[0]);
  cacheDrop();
}

/* ============================ instalación ============================ */
function instalar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  props().setProperty('SSID', ss.getId());
  props().setProperty('OWNER', Session.getEffectiveUser().getEmail().toLowerCase());
  secret();
  Object.keys(H).forEach(function (name) {
    var s = ss.getSheetByName(name);
    if (!s) s = ss.insertSheet(name);
    if (s.getLastRow() < 1) {
      s.getRange(1, 1, 1, H[name].length).setValues([H[name]]).setFontWeight('bold');
      s.setFrozenRows(1);
    }
    H[name].forEach(function (c, i) {
      if (TEXTC.indexOf(c) > -1) s.getRange(2, i + 1, Math.max(s.getMaxRows() - 1, 1), 1).setNumberFormat('@');
    });
  });
  var def = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja1');
  if (def && ss.getSheets().length > 1) { try { ss.deleteSheet(def); } catch (e) { } }
  // dueño = administrador
  var owner = props().getProperty('OWNER');
  if (!userByEmail(owner, true)) {
    appendObj('Usuarios', { email: owner, nombre: 'Administrador', rol: 'admin', estado: 'aprobado', negocios: [], creado: now(), aprobadoPor: 'sistema', ultimoAcceso: 0 });
  }
  // catálogo inicial
  if (readAll('Productos').length === 0) {
    var rows = SEED_PRODUCTOS.map(function (p) {
      return toRow('Productos', { id: p.id, nombre: p.n, cat: p.c, unidad: p.u, factor: p.f, tol: p.t, costo: p.k || 0, critico: p.cr ? 1 : 0, negocios: p.ng, orden: p.o, activo: 1 });
    });
    if (rows.length) sheet('Productos').getRange(2, 1, rows.length, H.Productos.length).setValues(rows);
  }
  if (readAll('Equivalencias').length === 0 && SEED_ALIAS.length) {
    var ar = SEED_ALIAS.map(function (a) { return [a[0], a[1], a[2]]; });
    sheet('Equivalencias').getRange(2, 1, ar.length, 3).setValues(ar);
  }
  if (readAll('Config').length === 0) {
    Object.keys(CONFIG_DEF).forEach(function (k) { setConfigKey(k, CONFIG_DEF[k]); });
  }
  // revisión automática cada hora (conteos que faltan, ventas pendientes)
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'revisarPendientes') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('revisarPendientes').timeBased().everyHours(1).create();
  cacheDrop();
  Logger.log('Listo. Administrador: ' + owner + ' · Productos: ' + readAll('Productos').length);
  return 'Instalado. Ahora publica la app como aplicación web.';
}

/* ============================ web ============================ */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Arqueo La Barra')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* Entrada para la pantalla alojada fuera de Google (GitHub Pages): mismo api(), por POST de texto plano. */
function doPost(e) {
  var body = (e && e.postData && e.postData.contents) || '{}';
  return ContentService.createTextOutput(api(body)).setMimeType(ContentService.MimeType.TEXT);
}
function api(json) {
  var out;
  try {
    var r = JSON.parse(json);
    out = { ok: true, data: dispatch(r.a, r.p || {}, r.t || '') };
  } catch (e) {
    out = { ok: false, error: (e && e.code) || 'error', msg: String((e && e.message) || e) };
  }
  return JSON.stringify(out);
}

/* ============================ sesión ============================ */
function userByEmail(email, fresh) {
  var rows = fresh ? null : cacheGet('k_users');
  if (!rows) { rows = readAll('Usuarios'); cachePut('k_users', rows, 60); }
  for (var i = 0; i < rows.length; i++) if (rows[i].email === email) return rows[i];
  return null;
}
function makeToken(email) {
  var payload = Utilities.base64EncodeWebSafe(email + '|' + (now() + TOKEN_DIAS * 86400000));
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret()));
  return payload + '.' + sig;
}
function readToken(tok) {
  var parts = String(tok || '').split('.');
  if (parts.length !== 2) return '';
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret()));
  if (sig !== parts[1]) return '';
  var dec = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString().split('|');
  if (dec.length !== 2 || Number(dec[1]) < now()) return '';
  return dec[0];
}
function publicMe(u) { return { email: u.email, nombre: u.nombre, rol: u.rol, estado: u.estado, negocios: u.negocios || [] }; }
function usersWithRole(role) {
  return readAll('Usuarios').filter(function (u) { return u.estado === 'aprobado' && u.rol === role; });
}

function reqCode(p) {
  var email = normEmail(p.email);
  if (!email) fail('email', 'Escribe tu correo de Gmail completo.');
  var cache = CacheService.getScriptCache();
  var k = 'rc_' + email, n = Number(cache.get(k)) || 0;
  if (n >= 3) fail('limite', 'Ya pediste varios códigos. Espera unos minutos y revisa también la carpeta de spam.');
  var cuota = MailApp.getRemainingDailyQuota();
  if (cuota < 8) fail('cuota', 'Hoy se agotó el envío de correos. Intenta mañana o avisa al administrador.');
  var code = ('000000' + Math.floor(Math.random() * 1000000)).slice(-6);
  cache.put('cd_' + email, sha(code + email + secret()), 600);
  cache.put('at_' + email, '0', 600);
  cache.put(k, String(n + 1), 3600);
  MailApp.sendEmail({
    to: email,
    subject: 'Tu código de acceso: ' + code,
    name: 'Arqueo La Barra',
    body: 'Tu código para entrar a Arqueo La Barra es:\n\n    ' + code + '\n\nVale por 10 minutos. Si no lo pediste, ignora este correo.'
  });
  return { enviado: true, nuevo: !userByEmail(email) };
}

function verifyCode(p) {
  var email = normEmail(p.email), code = String(p.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) fail('codigo', 'Escribe el código de 6 números.');
  var cache = CacheService.getScriptCache();
  var h = cache.get('cd_' + email), at = Number(cache.get('at_' + email)) || 0;
  if (!h) fail('codigo', 'El código venció. Pide uno nuevo.');
  if (at >= 5) { cache.remove('cd_' + email); fail('codigo', 'Demasiados intentos. Pide un código nuevo.'); }
  if (sha(code + email + secret()) !== h) { cache.put('at_' + email, String(at + 1), 600); fail('codigo', 'Ese código no es correcto.'); }
  return withLock(function () {
    var u = userByEmail(email, true);
    if (!u) {
      var nombre = String(p.nombre || '').trim().slice(0, 60);
      if (nombre.length < 2) fail('nombre', 'Escribe tu nombre para pedir acceso.');
      cache.remove('cd_' + email);
      var owner = props().getProperty('OWNER');
      u = { email: email, nombre: nombre, rol: email === owner ? 'admin' : 'colaborador', estado: email === owner ? 'aprobado' : 'pendiente', negocios: [], creado: now(), aprobadoPor: '', ultimoAcceso: now() };
      appendObj('Usuarios', u);
      cacheDrop();
      if (u.estado === 'pendiente') {
        notify('acceso', 'Nuevo acceso solicitado', nombre + ' (' + email + ') pidió entrar. Asigna su rol en Equipo.', { para: 'admin', email: true });
      }
    } else {
      cache.remove('cd_' + email);
      u.ultimoAcceso = now();
      writeRow('Usuarios', u._row, u);
    }
    cacheDrop();
    return { token: makeToken(email), me: publicMe(u) };
  });
}

function auth(tok) {
  var email = readToken(tok);
  if (!email) fail('sesion', 'Tu sesión venció. Entra de nuevo.');
  var u = userByEmail(email);
  if (!u) fail('sesion', 'Tu sesión venció. Entra de nuevo.');
  return u;
}
function need(me, roles) {
  if (me.estado !== 'aprobado') fail('permiso', 'Tu acceso aún no está aprobado.');
  if (roles.indexOf(me.rol) < 0) fail('permiso', 'No tienes permiso para esto.');
}
/* Roles: admin, supervisor (sub-administración: valida/completa conteos de todos los negocios y todo queda en la bitácora), gerencia, lider (cuenta + revisa/registra ventas de SUS negocios), colaborador (solo cuenta y registra movimientos de SUS negocios) */
function conFreezer(neg) { return neg === 'Food Shop'; }
function conCafe(neg) { return /^La Barra/.test(neg) || neg === 'Food Shop'; }
function scoped(me) { return me.rol === 'lider' || me.rol === 'colaborador'; }
function negOk(me, neg) {
  if (me.rol === 'admin' || me.rol === 'gerencia' || me.rol === 'supervisor') return true;
  return (me.negocios || []).indexOf(neg) > -1;
}

/* ============================ despacho ============================ */
function dispatch(a, p, t) {
  if (a === 'reqCode') return reqCode(p);
  if (a === 'verifyCode') return verifyCode(p);
  var me = auth(t);
  if (a === 'me') return publicMe(me);
  if (me.estado === 'bloqueado') fail('bloqueado', 'Tu acceso está bloqueado.');
  if (me.estado !== 'aprobado') fail('permiso', 'Tu acceso aún no está aprobado.');
  switch (a) {
    case 'sync': return sync(me);
    case 'startCount': return startCount(me, p);
    case 'saveConteo': return saveConteo(me, p);
    case 'addEntrada': return addEntrada(me, p);
    case 'delEntrada': need(me, ['admin']); return delEntrada(me, p);
    case 'addMerma': return addMerma(me, p);
    case 'addTraspaso': return addTraspaso(me, p);
    case 'recibirTraspaso': return recibirTraspaso(me, p);
    case 'anularMov': need(me, ['admin']); return anularMov(me, p);
    case 'getConteo': return getConteo(me, p);
    case 'saveVentas': need(me, ['admin', 'supervisor', 'lider']); return saveVentas(me, p);
    case 'rectificar': need(me, ['admin', 'supervisor']); return rectificar(me, p);
    case 'anular': need(me, ['admin']); return anular(me, p);
    case 'saveProducto': need(me, ['admin']); return saveProducto(me, p);
    case 'delProducto': need(me, ['admin']); return delProducto(me, p);
    case 'saveConfig': need(me, ['admin']); return saveConfig(me, p);
    case 'listUsers': need(me, ['admin']); return listUsers();
    case 'setUser': need(me, ['admin']); return setUser(me, p);
    case 'aliases': need(me, ['admin', 'supervisor', 'lider']); return getAliases();
    case 'saveAliases': need(me, ['admin', 'supervisor', 'lider']); return saveAliases(me, p);
    case 'dash': need(me, ['admin', 'gerencia']); return dash(p);
    case 'contactos': need(me, ['admin', 'supervisor']); return contactos();
    case 'markRead': return markRead(me, p);
  }
  fail('accion', 'Acción desconocida');
}

/* ============================ sync ============================ */
function productoOut(r) {
  return { id: r.id, nombre: r.nombre, cat: r.cat, unidad: r.unidad, factor: r.factor, tol: r.tol, costo: r.costo, critico: !!r.critico, negocios: r.negocios || [], orden: r.orden };
}
function visibleNegocios(me, cfg) {
  return scoped(me) ? cfg.negocios.filter(function (n) { return (me.negocios || []).indexOf(n) > -1; }) : cfg.negocios;
}
function readRecentConteos(dias) {
  var s = sheet('Conteos'), last = s.getLastRow();
  if (last < 2) return [];
  var desde = fechaMas(hoy(), -dias), out = [];
  var from = Math.max(2, last - 599), n = last - from + 1;
  var A = s.getRange(from, 1, n, 8).getValues();            // id..estado
  var R = s.getRange(from, colIdx('Conteos', 'resumen') + 1, n, 1).getValues();
  var X = s.getRange(from, colIdx('Conteos', 'rect') + 1, n, 1).getValues();
  for (var i = 0; i < n; i++) {
    var f = A[i][1] instanceof Date ? Utilities.formatDate(A[i][1], TZ, 'yyyy-MM-dd') : String(A[i][1]);
    if (f < desde) continue;
    out.push({ id: String(A[i][0]), fecha: f, negocio: String(A[i][2]), turno: String(A[i][3]), resp: String(A[i][4]), email: String(A[i][5]), ts: Number(A[i][6]), estado: String(A[i][7]), resumen: parseJ(R[i][0], {}), rect: Number(X[i][0]) || 0 });
  }
  out.sort(function (a, b) { return b.ts - a.ts; });
  return out;
}
function readRecentEntradas(dias) {
  var s = sheet('Entradas'), last = s.getLastRow();
  if (last < 2) return [];
  var desde = fechaMas(hoy(), -dias), from = Math.max(2, last - 299), n = last - from + 1;
  var vals = s.getRange(from, 1, n, H.Entradas.length).getValues(), out = [];
  vals.forEach(function (r) {
    var o = fromRow('Entradas', r);
    if (o.fecha >= desde && !o.anulada) out.push(o);
  });
  out.sort(function (a, b) { return b.ts - a.ts; });
  return out;
}
function notifsFor(me) {
  var s = sheet('Notificaciones'), last = s.getLastRow();
  if (last < 2) return [];
  var from = Math.max(2, last - 199), n = last - from + 1;
  var vals = s.getRange(from, 1, n, H.Notificaciones.length).getValues(), out = [];
  vals.forEach(function (r) {
    var o = fromRow('Notificaciones', r), toks = String(o.para).split(',');
    var mine = toks.indexOf(me.rol) > -1 || toks.indexOf('u:' + me.email) > -1 || toks.indexOf('todos') > -1 || (me.rol === 'supervisor' && toks.indexOf('admin') > -1 && o.tipo !== 'acceso');
    if (!mine && scoped(me)) (me.negocios || []).forEach(function (ng) { if (toks.indexOf('n:' + ng) > -1 || (me.rol === 'lider' && toks.indexOf('nl:' + ng) > -1)) mine = true; });
    if (mine) out.push({ id: o.id, ts: o.ts, tipo: o.tipo, titulo: o.titulo, texto: o.texto, negocio: o.negocio, ref: o.ref, leido: (o.leidoPor || []).indexOf(me.email) > -1 });
  });
  out.sort(function (a, b) { return b.ts - a.ts; });
  return out.slice(0, 50);
}
function sync(me) {
  migrarInsumos();
  migrarLaBarra();
  migrarFoodShopT3();
  var cfg = getConfig(), negs = visibleNegocios(me, cfg);
  var prods = getProductos().filter(function (r) { return r.activo; }).map(productoOut);
  if (scoped(me)) {
    prods = prods.filter(function (p) { return !p.negocios.length || p.negocios.some(function (n) { return negs.indexOf(n) > -1; }); });
  }
  var conteos = readRecentConteos(scoped(me) ? 14 : 45);
  if (scoped(me)) conteos = conteos.filter(function (c) { return negs.indexOf(c.negocio) > -1; });
  var entradas = readRecentEntradas(14);
  if (scoped(me)) entradas = entradas.filter(function (e) { return negs.indexOf(e.negocio) > -1; });
  var pend = [];
  if (me.rol !== 'colaborador') {
    pend = conteos.filter(function (c) { return c.estado === 'contado'; });
  }
  var movs = readMovs(14).filter(function (m) { return !m.anulada; });
  if (scoped(me)) movs = movs.filter(function (m) { return negs.indexOf(m.negocio) > -1 || negs.indexOf(m.destino) > -1; });
  movs = movs.map(function (m) { return { id: m.id, fecha: m.fecha, tipo: m.tipo, negocio: m.negocio, destino: m.destino, motivo: m.motivo, detalle: m.detalle, resp: m.resp, ts: m.ts, items: m.items, estado: m.estado, recPor: m.recPor, recTs: m.recTs, recItems: m.recItems }; });
  return {
    me: publicMe(me), hoy: hoy(), ahora: now(),
    config: { negocios: negs, turnos: cfg.turnos, limites: cfg.limites, calendario: cfg.calendario, catDias: cfg.catDias || {}, avisos: cfg.avisos, todosNegocios: cfg.negocios },
    productos: prods, conteos: conteos, entradas: entradas.map(function (e) { return { id: e.id, fecha: e.fecha, negocio: e.negocio, resp: e.resp, ts: e.ts, nota: e.nota, items: e.items, origen: e.origen || 'Proveedor' }; }), movs: movs, motivos: MOTIVOS,
    notifs: notifsFor(me), pendientes: pend.length
  };
}

/* ============================ conteos ============================ */
function startCount(me, p) {
  var neg = String(p.negocio || '');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  var s = sheet('Conteos'), last = s.getLastRow(), ult = {}, scanned = 0, minTs = now();
  while (last > 1 && scanned < 150) {
    var from = Math.max(2, last - 29), n = last - from + 1;
    var vals = s.getRange(from, 1, n, 9).getValues();
    for (var i = n - 1; i >= 0; i--) {
      scanned++;
      var r = vals[i];
      if (String(r[2]) !== neg || String(r[7]) === 'anulado') continue;
      var items = parseJ(r[8], []), fecha = r[1] instanceof Date ? Utilities.formatDate(r[1], TZ, 'yyyy-MM-dd') : String(r[1]);
      items.forEach(function (it) { if (!ult[it[0]]) ult[it[0]] = [it[3], fecha, Number(r[6]), String(r[0]), String(r[3])]; });
    }
    last = from - 1;
  }
  Object.keys(ult).forEach(function (k) { if (ult[k][2] < minTs) minTs = ult[k][2]; });
  var ents = [], es = sheet('Entradas'), el = es.getLastRow();
  var cut = Math.max(minTs, now() - 90 * 86400000);
  if (el > 1) {
    var ef = Math.max(2, el - 299), ev = es.getRange(ef, 1, el - ef + 1, H.Entradas.length).getValues();
    ev.forEach(function (r) {
      var o = fromRow('Entradas', r);
      if (o.negocio === neg && !o.anulada && o.ts > cut) ents.push({ ts: o.ts, items: o.items });
    });
  }
  var sals = [], enTransito = [];
  readMovs(90).forEach(function (m) {
    if (m.anulada) return;
    if (m.tipo === 'traspaso' && m.destino === neg) {
      if (m.estado === 'recibido' && m.recTs > cut) ents.push({ ts: m.recTs, items: m.recItems });
      if (m.estado === 'enviado') enTransito.push({ id: m.id, de: m.negocio, ts: m.ts });
    }
    if (m.negocio === neg && m.ts > cut) sals.push({ ts: m.ts, tipo: m.tipo, motivo: m.motivo, destino: m.destino, items: m.items });
  });
  return { ultimos: ult, entradas: ents, salidas: sals, enTransito: enTransito };
}

function saveConteo(me, p) {
  need(me, ['admin', 'supervisor', 'lider', 'colaborador']);
  var neg = String(p.negocio || ''), turno = String(p.turno || ''), fecha = String(p.fecha || '');
  var cfg = getConfig();
  if (cfg.negocios.indexOf(neg) < 0) fail('datos', 'Negocio desconocido.');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  var tl = (cfg.turnos || {})[neg] || [];
  if (tl.length && tl.indexOf(turno) < 0) fail('datos', neg + ' no tiene ese turno.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) fail('datos', 'Fecha inválida.');
  var h = hoy();
  if (fecha > fechaMas(h, 1)) fail('datos', 'La fecha no puede ser futura.');
  if (scoped(me) && fecha < fechaMas(h, -2)) fail('datos', 'Solo puedes guardar conteos de hoy. Pide ayuda a administración.');
  var id = String(p.id || '');
  if (!/^c_[A-Za-z0-9]{6,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  if (!turno) fail('datos', 'Falta el turno.');
  var items = (p.items || []).map(function (it) {
    var ini = num(it.ini), ent = num(it.ent), fin = num(it.fin);
    if (ini == null || fin == null || ini < 0 || fin < 0) fail('datos', 'Hay cantidades inválidas.');
    if (ent == null || ent < 0) ent = 0;
    return [String(it.pid), r2(ini, 3), r2(ent, 3), r2(fin, 3), String(it.src || '')];
  });
  if (!items.length) fail('datos', 'No hay productos contados.');
  /* «Había» es lo que dejó el turno anterior: el personal no lo puede cambiar. Se toma del conteo de origen. */
  if (me.rol !== 'admin' && DOBLE.indexOf(neg) < 0) {
    var srcCache = {};
    items.forEach(function (it) {
      var sid = it[4];
      if (!sid) return;
      if (!srcCache[sid]) {
        var sr = findRowById('Conteos', sid), m = {};
        if (sr) {
          var so = readRowObj('Conteos', sr);
          if (so.negocio !== neg) fail('datos', 'El conteo de origen no es de este negocio.');
          so.items.forEach(function (x) { m[x[0]] = x[3]; });
        }
        srcCache[sid] = m;
      }
      if (srcCache[sid][it[0]] != null) it[1] = r2(srcCache[sid][it[0]], 3);
    });
  }
  var inicial = items.every(function (it) { return !it[4]; });   // ningún producto tiene conteo previo: es el punto de partida
  return withLock(function () {
    if (findRowById('Conteos', id)) return { id: id, repetido: true };
    var dup = readRecentConteos(4).filter(function (c) { return c.negocio === neg && c.turno === turno && c.fecha === fecha && c.estado !== 'anulado'; });
    if (dup.length) fail('duplicado', 'Ya hay un conteo de ' + neg + ' · ' + turno + ' del ' + fecha + '. Si hubo un error, pide a administración que lo anule o rectifique.');
    var o = {
      id: id, fecha: fecha, negocio: neg, turno: turno, resp: me.nombre, email: me.email, ts: now(), estado: inicial ? 'inicial' : (INSUMOS.indexOf(neg) > -1 ? 'arqueado' : 'contado'),
      items: items, ventas: {}, res: [], resumen: {}, sin: (p.sin || []).slice(0, 200).map(String), ventasPor: '', ventasTs: 0, rect: 0, nota: String(p.nota || '').slice(0, 300), cierre: null
    };
    if (INSUMOS.indexOf(neg) < 0) {
      var ck = p.cierre;
      if (!ck || !ck.chk || ck.chk.length !== 6 || ck.chk.some(function (x) { return x !== true; })) fail('datos', 'Completa el cierre del turno.');
      if (ck.nov !== 'si' && ck.nov !== 'no') fail('datos', 'Indica si hubo novedad.');
      var ctxt = String(ck.txt || '').trim().slice(0, 400);
      if (ck.nov === 'si' && ctxt.length < 3) fail('datos', 'Cuenta qué novedad hubo.');
      o.cierre = { ok: 1, nov: ck.nov, txt: ck.nov === 'si' ? ctxt : '' };
      if (conFreezer(neg)) {
        var fz = ck.fz || {};
        if (['si', 'no'].indexOf(fz.ok) < 0) fail('datos', 'Confirma si los freezers funcionan.');
        var fzt = String(fz.txt || '').trim().slice(0, 300);
        if (fz.ok === 'no' && fzt.length < 3) fail('datos', 'Cuenta qué pasó con los freezers.');
        o.cierre.fz = { ok: fz.ok, txt: fz.ok === 'no' ? fzt : '' };
      }
      if (conCafe(neg)) {
        var cf = ck.cafe || {};
        if (['si', 'no'].indexOf(cf.rell) < 0 || ['si', 'no'].indexOf(cf.func) < 0) fail('datos', 'Responde lo de las máquinas de café.');
        var cft = String(cf.txt || '').trim().slice(0, 300);
        if ((cf.rell === 'no' || cf.func === 'no') && cft.length < 3) fail('datos', 'Cuenta qué pasó con las máquinas de café.');
        o.cierre.cafe = { rell: cf.rell, func: cf.func, txt: (cf.rell === 'no' || cf.func === 'no') ? cft : '' };
      }
    }
    ensureHeaders('Conteos');
    if (!inicial && INSUMOS.indexOf(neg) > -1) {
      var cons = consumoDe(o, productMap());
      o.res = cons.res; o.resumen = cons.resumen; o.ventasPor = 'Sin ventas (consumo)'; o.ventasTs = now();
    }
    appendObj('Conteos', o);
    if (o.cierre && o.cierre.cafe && (o.cierre.cafe.rell === 'no' || o.cierre.cafe.func === 'no')) notify('cafetera', 'Máquinas de café: ' + neg, me.nombre + ' · ' + turno + ': ' + (o.cierre.cafe.rell === 'no' ? 'NO rellenadas. ' : '') + (o.cierre.cafe.func === 'no' ? 'NO funcionan bien. ' : '') + o.cierre.cafe.txt, { para: 'admin,gerencia', negocio: neg, ref: 'conteo|' + id, email: true });
    if (o.cierre && o.cierre.fz && o.cierre.fz.ok === 'no') notify('freezer', 'Freezers con problema: ' + neg, me.nombre + ' · ' + turno + ': ' + o.cierre.fz.txt, { para: 'admin,gerencia', negocio: neg, ref: 'conteo|' + id, email: true });
    if (o.cierre && o.cierre.nov === 'si') notify('novedad', 'Novedad en el cierre: ' + neg, me.nombre + ' · ' + turno + ': ' + o.cierre.txt, { para: 'admin,gerencia', negocio: neg, ref: 'conteo|' + id, email: true });
    if (inicial) return { id: id, inicial: true };
    if (INSUMOS.indexOf(neg) > -1) {
      if (o.nota) notify('faltan-insumos', 'Insumos que hacen falta: ' + neg, me.nombre + ': ' + o.nota, { para: 'admin,gerencia', negocio: neg, ref: 'conteo|' + id, email: true });
      return { id: id, consumo: true };
    }
    notify('pendiente', 'Conteo listo para registrar ventas', neg + ' · ' + turno + ' · ' + fecha + ' (contó ' + me.nombre + '). Falta registrar las ventas.', { para: 'admin,nl:' + neg, negocio: neg, ref: 'conteo|' + id, email: true });
    return { id: id };
  });
}

function productMap() {
  var m = {};
  getProductos().forEach(function (r) { m[r.id] = r; });
  return m;
}
function expandItems(items, pm) {
  return items.map(function (it) {
    var pr = pm[it[0]] || { nombre: it[0], unidad: '' };
    return { pid: it[0], nombre: pr.nombre, unidad: pr.unidad, cat: pr.cat || '', ini: it[1], ent: it[2], fin: it[3], src: it[4] || '' };
  });
}
function getConteo(me, p) {
  var row = findRowById('Conteos', p.id);
  if (!row) fail('datos', 'No encontré ese conteo.');
  var c = readRowObj('Conteos', row);
  if (!negOk(me, c.negocio)) fail('permiso', 'No tienes acceso a ese conteo.');
  var pm = productMap(), srcInfo = {};
  c.items.forEach(function (it) {
    var sid = it[4];
    if (sid && !srcInfo[sid]) {
      var sr = findRowById('Conteos', sid);
      if (sr) { var so = readRowObj('Conteos', sr); srcInfo[sid] = { fecha: so.fecha, turno: so.turno, ts: so.ts }; }
    }
  });
  var out = {
    id: c.id, fecha: c.fecha, negocio: c.negocio, turno: c.turno, resp: c.resp, ts: c.ts, estado: c.estado, nota: c.nota, rect: c.rect, sin: c.sin, cierre: c.cierre,
    items: expandItems(c.items, pm), srcInfo: srcInfo, ventasPor: c.ventasPor, ventasTs: c.ventasTs
  };
  if (me.rol !== 'colaborador') { var sm = salidasDe(c), so2 = {}; Object.keys(sm).forEach(function (k) { so2[k] = { q: r2(sm[k].q, 3), det: sm[k].det.join(', ') }; }); out.sal = so2; }
  if (me.rol !== 'colaborador') out.hist = histDe(c.id);
  if (me.rol !== 'colaborador') { out.ventas = c.ventas; out.res = c.res; out.resumen = c.resumen; }
  else if (c.estado === 'arqueado') { out.resumen = { ok: c.resumen.ok, rev: c.resumen.rev, crit: c.resumen.crit }; }
  return out;
}

function calcItem(pr, ini, ent, fin, ven, sal) {
  sal = sal || 0;
  var real = ini + ent - fin, esp = ven * pr.factor + sal, dif = real - esp;
  var pct = esp === 0 ? (Math.abs(dif) < 1e-9 ? 0 : 1) : dif / esp;
  var tol = pr.tol;
  var estado = Math.abs(pct) <= tol + 1e-9 ? 'OK' : (Math.abs(pct) <= 2 * tol + 1e-9 ? 'REVISAR' : 'CRÍTICO');
  if (real < 0 && estado === 'OK') estado = 'REVISAR';
  return { real: r2(real), esp: r2(esp), dif: r2(dif), pct: r2(pct, 4), estado: estado, valor: r2(dif * (pr.costo || 0)) };
}
function computeArqueo(c, pm) {
  var res = [], rs = { ok: 0, rev: 0, crit: 0, faltante: 0, sobrante: 0, decl: 0 };
  var sals = salidasDe(c);
  c.items.forEach(function (it) {
    var pr = pm[it[0]];
    if (!pr || !it[4]) return;   // sin conteo previo: queda como inventario inicial, no se arquea
    var ven = Number(c.ventas[it[0]]) || 0, sal = (sals[it[0]] && sals[it[0]].q) || 0;
    var k = calcItem(pr, it[1], it[2], it[3], ven, sal);
    res.push([it[0], pr.nombre, pr.unidad, it[1], it[2], it[3], ven, k.real, k.esp, k.dif, k.pct, k.estado, k.valor, r2(sal, 3)]);
    rs.decl += sal * (pr.costo || 0);
    if (k.estado === 'OK') rs.ok++; else if (k.estado === 'REVISAR') rs.rev++; else rs.crit++;
    if (k.valor > 0) rs.faltante += k.valor; else rs.sobrante += -k.valor;
  });
  rs.faltante = r2(rs.faltante); rs.sobrante = r2(rs.sobrante); rs.decl = r2(rs.decl);
  return { res: res, resumen: rs };
}
/* Consumo de insumos (sin POS): lo que salió = había + entró − quedan */
function consumoDe(c, pm) {
  var res = [], tot = 0;
  c.items.forEach(function (it) {
    var pr = pm[it[0]];
    if (!pr || !it[4]) return;
    var real = r2(it[1] + it[2] - it[3], 3);
    res.push([it[0], pr.nombre, pr.unidad, it[1], it[2], it[3], 0, real, 0, 0, 0, 'OK', 0, 0]);
    tot += real;
  });
  return { res: res, resumen: { ok: res.length, rev: 0, crit: 0, faltante: 0, sobrante: 0, decl: 0, consumo: true, total: r2(tot, 3) } };
}
/* Una sola vez: La Barra 1/2/3 pasan a llamarse Atala/Atalaya/Miraflores y estrenan sus turnos */
var RENOMBRES = { 'La Barra 1': 'La Barra Atala', 'La Barra 2': 'La Barra Atalaya', 'La Barra 3': 'La Barra Miraflores' };
function migrarLaBarra() {
  if (props().getProperty('MIG_LABARRA_V1')) return;
  withLock(function () {
    if (props().getProperty('MIG_LABARRA_V1')) return;
    var cols = { Productos: ['negocios'], Usuarios: ['negocios'], Conteos: ['negocio'], Entradas: ['negocio'], Movimientos: ['negocio', 'destino'], Notificaciones: ['negocio'], Config: ['value'] };
    Object.keys(cols).forEach(function (name) {
      var s = sheet(name), last = s.getLastRow();
      if (last < 2) return;
      cols[name].forEach(function (c) {
        var ix = H[name].indexOf(c) + 1, rg = s.getRange(2, ix, last - 1, 1), v = rg.getValues(), ch = false;
        v.forEach(function (r) {
          var t = String(r[0]), n = t;
          Object.keys(RENOMBRES).forEach(function (k) { n = n.split(k).join(RENOMBRES[k]); });
          if (n !== t) { r[0] = n; ch = true; }
        });
        if (ch) rg.setValues(v);
      });
    });
    var cfg = getConfig(), t = cfg.turnos || {}, l = cfg.limites || {};
    Object.keys(CONFIG_DEF.turnos).forEach(function (n) { if (/^La Barra/.test(n)) t[n] = CONFIG_DEF.turnos[n]; });
    Object.keys(CONFIG_DEF.limites).forEach(function (k) { if (/^La Barra/.test(k)) l[k] = CONFIG_DEF.limites[k]; });
    Object.keys(l).forEach(function (k) { if (/Día completo/.test(k)) delete l[k]; });
    setConfigKey('turnos', t); setConfigKey('limites', l);
    props().setProperty('MIG_LABARRA_V1', '1');
    cacheDrop();
  });
}
/* Una sola vez: el Food Shop cuenta solo 2 turnos (cada colaboradora cuenta al final de su turno) */
function migrarFoodShopT3() {
  if (props().getProperty('MIG_FSDOS_V1')) return;
  withLock(function () {
    if (props().getProperty('MIG_FSDOS_V1')) return;
    var cfg = getConfig(), t = cfg.turnos || {}, l = cfg.limites || {};
    t['Food Shop'] = CONFIG_DEF.turnos['Food Shop'];
    delete l['Food Shop|Turno 3 (11PM-7AM)'];
    setConfigKey('turnos', t); setConfigKey('limites', l);
    props().setProperty('MIG_FSDOS_V1', '1');
    cacheDrop();
  });
}
/* Una sola vez: productos del Car Wash y su conteo semanal */
function migrarInsumos() {
  if (props().getProperty('MIG_INSUMOS_V2')) return;
  withLock(function () {
    if (props().getProperty('MIG_INSUMOS_V2')) return;
    INSUMOS_PRODUCTOS.forEach(function (p, i) {
      if (findRowById('Productos', p.id)) return;
      appendObj('Productos', { id: p.id, nombre: p.nombre, cat: 'Insumos', unidad: p.u, factor: 1, tol: 1, costo: 0, critico: 0, negocios: ['Car Wash'], orden: i + 1, activo: 1 });
    });
    var cfg = getConfig(), t = cfg.turnos || {}, l = cfg.limites || {}, cal = cfg.calendario || {};
    if (!(t['Car Wash'] && t['Car Wash'].length)) { t['Car Wash'] = ['Semanal']; setConfigKey('turnos', t); }
    if (!l['Car Wash|Semanal']) { l['Car Wash|Semanal'] = '23:30'; setConfigKey('limites', l); }
    if (!Array.isArray(cal['Car Wash'])) { cal['Car Wash'] = [0]; setConfigKey('calendario', cal); }
    props().setProperty('MIG_INSUMOS_V2', '1');
    cacheDrop();
  });
}
function avisarArqueo(c, rs) {
  if (rs.crit > 0) {
    notify('critico', 'Diferencias críticas: ' + c.negocio, c.negocio + ' · ' + c.turno + ' · ' + c.fecha + ': ' + rs.crit + ' productos críticos, ' + rs.rev + ' por revisar. Faltante estimado RD$ ' + Math.round(rs.faltante) + '.', { para: 'admin,gerencia', negocio: c.negocio, ref: 'conteo|' + c.id, email: true });
  }
  notify('arqueado', 'Arqueo listo', c.negocio + ' · ' + c.turno + ' · ' + c.fecha + ': ' + rs.ok + ' OK, ' + rs.rev + ' por revisar, ' + rs.crit + ' críticos.', { para: 'gerencia,n:' + c.negocio, negocio: c.negocio, ref: 'conteo|' + c.id, email: false });
}
function saveVentas(me, p) {
  return withLock(function () {
    var row = findRowById('Conteos', p.id);
    if (!row) fail('datos', 'No encontré ese conteo.');
    var c = readRowObj('Conteos', row);
    if (!negOk(me, c.negocio)) fail('permiso', 'No tienes acceso a ese negocio.');
    if (c.estado === 'anulado') fail('datos', 'Ese conteo está anulado.');
    var ventas = {};
    Object.keys(p.ventas || {}).forEach(function (k) {
      var v = num(p.ventas[k]);
      if (v == null || v < 0) fail('datos', 'Hay ventas con valores inválidos.');
      ventas[k] = r2(v, 3);
    });
    var antesV = c.ventas || {}, difV = [];
    Object.keys(ventas).forEach(function (k) { if (Object.keys(antesV).length && num(antesV[k]) !== ventas[k]) difV.push(k + ':' + (antesV[k] == null ? '-' : antesV[k]) + '→' + ventas[k]); });
    c.ventas = ventas;
    var pm = productMap(), r = computeArqueo(c, pm);
    var primera = c.estado !== 'arqueado';
    c.res = r.res; c.resumen = r.resumen; c.estado = 'arqueado'; c.ventasPor = me.nombre; c.ventasTs = now();
    writeRow('Conteos', row, c);
    bit(me.email, difV.length ? 'ventas-cambio' : 'ventas', c.id + ' ' + c.negocio + ' ' + c.turno + ' ' + c.fecha + (difV.length ? ' · cambios: ' + difV.slice(0, 40).join('; ') : ''));
    if (primera) avisarArqueo(c, r.resumen);
    return { resumen: r.resumen };
  });
}
/* Historial de cambios de un conteo (quién, cuándo y qué) leído de la bitácora */
function histDe(id) {
  var s = sheet('Bitacora'), last = s.getLastRow();
  if (last < 2) return [];
  var from = Math.max(2, last - 799), vals = s.getRange(from, 1, last - from + 1, 4).getValues(), nm = {}, out = [];
  readAll('Usuarios').forEach(function (u) { nm[u.email] = u.nombre + ' (' + u.rol + ')'; });
  vals.forEach(function (r) {
    var d = String(r[3]);
    if (d.indexOf(id) === 0 && ['ventas', 'ventas-cambio', 'rectificar', 'anular'].indexOf(String(r[2])) > -1)
      out.push({ ts: Number(r[0]) || 0, quien: nm[String(r[1])] || String(r[1]), accion: String(r[2]), detalle: d.slice(id.length + 1) });
  });
  return out.reverse().slice(0, 30);
}
function rectificar(me, p) {
  return withLock(function () {
    var row = findRowById('Conteos', p.id);
    if (!row) fail('datos', 'No encontré ese conteo.');
    var c = readRowObj('Conteos', row);
    var motivo = String(p.motivo || '').trim();
    if (motivo.length < 3) fail('datos', 'Escribe el motivo de la rectificación.');
    var ch = p.cambios || {}, antes = [];
    c.items = c.items.map(function (it) {
      var n = ch[it[0]];
      if (!n) return it;
      var ini = num(n.ini), ent = num(n.ent), fin = num(n.fin);
      if (ini == null || ent == null || fin == null || ini < 0 || ent < 0 || fin < 0) fail('datos', 'Hay cantidades inválidas.');
      antes.push(it[0] + ':' + it[1] + '/' + it[2] + '/' + it[3] + '→' + ini + '/' + ent + '/' + fin);
      return [it[0], r2(ini, 3), r2(ent, 3), r2(fin, 3), it[4]];
    });
    if (!antes.length) fail('datos', 'No hay cambios.');
    c.rect = 1;
    if (c.estado === 'arqueado') { var r = computeArqueo(c, productMap()); c.res = r.res; c.resumen = r.resumen; }
    writeRow('Conteos', row, c);
    bit(me.email, 'rectificar', c.id + ' · ' + motivo + ' · ' + antes.join('; '));
    return { resumen: c.resumen };
  });
}
function anular(me, p) {
  return withLock(function () {
    var row = findRowById('Conteos', p.id);
    if (!row) fail('datos', 'No encontré ese conteo.');
    var c = readRowObj('Conteos', row), motivo = String(p.motivo || '').trim();
    if (motivo.length < 3) fail('datos', 'Escribe el motivo.');
    c.estado = 'anulado'; c.nota = (c.nota ? c.nota + ' | ' : '') + 'Anulado: ' + motivo;
    writeRow('Conteos', row, c);
    bit(me.email, 'anular', c.id + ' ' + c.negocio + ' ' + c.turno + ' ' + c.fecha + ' · ' + motivo);
    return { ok: true };
  });
}

/* ============================ mermas y traspasos ============================ */
var MOTIVOS = ['Rotura', 'Vencimiento', 'Cortesía', 'Consumo del personal', 'Se dañó', 'Otros'];
function readMovs(dias) {
  var s = sheet('Movimientos'), last = s.getLastRow();
  if (last < 2) return [];
  var desde = fechaMas(hoy(), -dias), from = Math.max(2, last - 499), n = last - from + 1;
  var vals = s.getRange(from, 1, n, H.Movimientos.length).getValues(), out = [];
  vals.forEach(function (r, i) {
    var o = fromRow('Movimientos', r); o._row = from + i;
    if (o.fecha >= desde) out.push(o);
  });
  out.sort(function (a, b) { return b.ts - a.ts; });
  return out;
}
function movItems(p) {
  var pm = productMap(), seen = {};
  var items = (p.items || []).map(function (i) {
    var q = num(i.qty), pid = String(i.pid);
    if (q == null || q <= 0) fail('datos', 'Cantidad inválida.');
    if (!pm[pid]) fail('datos', 'Producto desconocido.');
    if (seen[pid]) fail('datos', 'Hay un producto repetido.');
    seen[pid] = 1;
    return { pid: pid, qty: r2(q, 3) };
  });
  if (!items.length) fail('datos', 'No hay productos.');
  return items;
}
function itemsTexto(items) {
  var pm = productMap();
  return (items || []).map(function (i) { return (pm[i.pid] ? pm[i.pid].nombre : i.pid) + ' ' + i.qty; }).join(', ');
}
function movBase(me, p, tipo) {
  need(me, ['admin', 'lider', 'colaborador']);
  var neg = String(p.negocio || ''), cfg = getConfig();
  if (cfg.negocios.indexOf(neg) < 0) fail('datos', 'Negocio desconocido.');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  var id = String(p.id || '');
  if (!/^m_[A-Za-z0-9]{6,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  return { id: id, neg: neg, cfg: cfg };
}
function addMerma(me, p) {
  var b = movBase(me, p, 'merma');
  var motivo = String(p.motivo || ''), detalle = String(p.detalle || '').trim().slice(0, 300);
  if (MOTIVOS.indexOf(motivo) < 0) fail('datos', 'Elige el motivo.');
  if ((motivo === 'Se dañó' || motivo === 'Otros') && detalle.length < 5) {
    fail('datos', motivo === 'Se dañó' ? 'Explica por qué se dañó.' : 'Explica el motivo.');
  }
  var items = movItems(p);
  return withLock(function () {
    if (findRowById('Movimientos', b.id)) return { id: b.id, repetido: true };
    appendObj('Movimientos', { id: b.id, fecha: hoy(), tipo: 'merma', negocio: b.neg, destino: '', motivo: motivo, detalle: detalle, resp: me.nombre, email: me.email, ts: now(), items: items, estado: 'registrada', recPor: '', recTs: 0, recItems: [], anulada: 0 });
    bit(me.email, 'merma', b.neg + ' · ' + motivo + ' · ' + itemsTexto(items));
    if (motivo === 'Se dañó' || motivo === 'Otros') {
      notify('merma', 'Merma: ' + motivo + ' en ' + b.neg, me.nombre + ': ' + itemsTexto(items) + '. ' + detalle, { para: 'admin,gerencia', negocio: b.neg, ref: 'mov|' + b.id, email: false });
    }
    return { id: b.id };
  });
}
// el mismo producto tiene un código distinto en cada negocio: se empareja por nombre
function equivEn(pm, pid, destino) {
  var key = normClave(pm[pid].nombre), hit = '';
  Object.keys(pm).forEach(function (k) {
    var q = pm[k];
    if (hit || k === pid || !q.activo || normClave(q.nombre) !== key) return;
    if (!q.negocios.length || q.negocios.indexOf(destino) > -1) hit = k;
  });
  if (!hit && (!pm[pid].negocios.length || pm[pid].negocios.indexOf(destino) > -1)) hit = pid;
  return hit;
}
function addTraspaso(me, p) {
  var b = movBase(me, p, 'traspaso');
  var dest = String(p.destino || '');
  if (b.cfg.negocios.indexOf(dest) < 0 || dest === b.neg) fail('datos', 'Elige el negocio que recibe.');
  var items = movItems(p), pm0 = productMap();
  items.forEach(function (i) {
    i.dpid = equivEn(pm0, i.pid, dest);
    if (!i.dpid) fail('datos', 'El producto «' + pm0[i.pid].nombre + '» no está en el catálogo de ' + dest + '. Pídele a administración que lo agregue.');
  });
  return withLock(function () {
    if (findRowById('Movimientos', b.id)) return { id: b.id, repetido: true };
    appendObj('Movimientos', { id: b.id, fecha: hoy(), tipo: 'traspaso', negocio: b.neg, destino: dest, motivo: '', detalle: String(p.detalle || '').trim().slice(0, 300), resp: me.nombre, email: me.email, ts: now(), items: items, estado: 'enviado', recPor: '', recTs: 0, recItems: [], anulada: 0 });
    bit(me.email, 'traspaso', b.neg + ' → ' + dest + ' · ' + itemsTexto(items));
    notify('traspaso', 'Traspaso por recibir en ' + dest, 'Desde ' + b.neg + ': ' + itemsTexto(items) + '. Confírmalo cuando llegue.', { para: 'n:' + dest + ',admin', negocio: dest, ref: 'mov|' + b.id, email: false });
    return { id: b.id };
  });
}
function recibirTraspaso(me, p) {
  need(me, ['admin', 'lider', 'colaborador']);
  return withLock(function () {
    var row = findRowById('Movimientos', p.id);
    if (!row) fail('datos', 'No encontré ese traspaso.');
    var m = readRowObj('Movimientos', row);
    if (m.tipo !== 'traspaso' || m.anulada) fail('datos', 'Ese traspaso no está disponible.');
    if (!negOk(me, m.destino)) fail('permiso', 'Ese traspaso no es para tu negocio.');
    if (m.estado === 'recibido') return { id: m.id, repetido: true };
    var sent = {}, dmap = {}; m.items.forEach(function (i) { sent[i.pid] = i.qty; dmap[i.pid] = i.dpid || i.pid; });
    var rec = [], dif = [];
    (p.items || []).forEach(function (i) {
      var pid = String(i.pid), q = num(i.qty);
      if (sent[pid] == null) fail('datos', 'Producto que no venía en el traspaso.');
      if (q == null || q < 0) fail('datos', 'Cantidad inválida.');
      rec.push({ pid: pid, dpid: dmap[pid], qty: r2(q, 3) });
    });
    if (!rec.length) fail('datos', 'Confirma las cantidades recibidas.');
    var pm = productMap();
    m.items.forEach(function (i) {
      var r = rec.filter(function (x) { return x.pid === i.pid; })[0];
      var q = r ? r.qty : 0;
      if (Math.abs(q - i.qty) > 1e-9) dif.push((pm[i.pid] ? pm[i.pid].nombre : i.pid) + ': salió ' + i.qty + ', llegó ' + q);
    });
    m.estado = 'recibido'; m.recPor = me.nombre; m.recTs = now();
    m.recItems = rec.filter(function (x) { return x.qty > 0; }).map(function (x) { return { pid: x.dpid, qty: x.qty }; });
    writeRow('Movimientos', row, m);
    bit(me.email, 'recibir-traspaso', m.id + ' ' + m.negocio + ' → ' + m.destino + (dif.length ? ' · DIFERENCIA ' + dif.join('; ') : ''));
    if (dif.length) {
      notify('traspaso-dif', 'Diferencia en traspaso a ' + m.destino, 'Desde ' + m.negocio + ' hacia ' + m.destino + ': ' + dif.join('; ') + '.', { para: 'admin,gerencia', negocio: m.destino, ref: 'mov|' + m.id, email: true });
    }
    return { id: m.id, diferencias: dif.length };
  });
}
function anularMov(me, p) {
  return withLock(function () {
    var row = findRowById('Movimientos', p.id);
    if (!row) fail('datos', 'No encontré ese movimiento.');
    var m = readRowObj('Movimientos', row);
    m.anulada = 1; writeRow('Movimientos', row, m);
    bit(me.email, 'anular-mov', m.id + ' ' + m.tipo + ' ' + m.negocio + (m.destino ? ' → ' + m.destino : ''));
    return { ok: true };
  });
}
function countTs(id) {
  var row = findRowById('Conteos', id);
  if (!row) return 0;
  return Number(sheet('Conteos').getRange(row, colIdx('Conteos', 'ts') + 1).getValues()[0][0]) || 0;
}
// salidas declaradas (mermas y traspasos enviados) de un negocio entre el conteo anterior y este
function salidasDe(c) {
  var movs = readMovs(60).filter(function (m) { return m.negocio === c.negocio && !m.anulada; });
  var out = {}, tsCache = {};
  if (!movs.length) return out;
  c.items.forEach(function (it) {
    if (!it[4]) return;
    if (tsCache[it[4]] == null) tsCache[it[4]] = countTs(it[4]);
    var from = tsCache[it[4]], to = Number(c.ts) || now();
    movs.forEach(function (m) {
      if (m.ts <= from || m.ts > to) return;
      m.items.forEach(function (x) {
        if (x.pid !== it[0]) return;
        var o = out[x.pid] || (out[x.pid] = { q: 0, det: [] });
        o.q += x.qty;
        o.det.push(m.tipo === 'traspaso' ? 'traspaso a ' + m.destino : m.motivo.toLowerCase());
      });
    });
  });
  return out;
}

/* ============================ entradas ============================ */
function addEntrada(me, p) {
  need(me, ['admin', 'lider', 'colaborador']);
  var neg = String(p.negocio || '');
  if (getConfig().negocios.indexOf(neg) < 0) fail('datos', 'Negocio desconocido.');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  var id = String(p.id || '');
  if (!/^e_[A-Za-z0-9]{6,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  var items = (p.items || []).map(function (i) {
    var q = num(i.qty);
    if (q == null || q <= 0) fail('datos', 'Cantidad inválida.');
    return { pid: String(i.pid), qty: r2(q, 3) };
  });
  if (!items.length) fail('datos', 'No hay productos.');
  return withLock(function () {
    if (findRowById('Entradas', id)) return { id: id, repetido: true };
    var origen = ['Cocina', 'Principal', 'Cuarto frío'].indexOf(p.origen) > -1 ? p.origen : 'Proveedor';
    appendObj('Entradas', { id: id, fecha: hoy(), negocio: neg, resp: me.nombre, email: me.email, ts: now(), nota: String(p.nota || '').slice(0, 200), items: items, anulada: 0, origen: origen });
    return { id: id };
  });
}
function delEntrada(me, p) {
  return withLock(function () {
    var row = findRowById('Entradas', p.id);
    if (!row) fail('datos', 'No encontré esa entrada.');
    var o = readRowObj('Entradas', row); o.anulada = 1; writeRow('Entradas', row, o);
    bit(me.email, 'anular-entrada', o.id + ' ' + o.negocio);
    return { ok: true };
  });
}

/* ============================ catálogo y configuración ============================ */
function saveProducto(me, p) {
  var id = String(p.id || '');
  if (!/^[A-Za-z0-9_\-]{2,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  var nombre = String(p.nombre || '').trim();
  if (!nombre) fail('datos', 'Escribe el nombre.');
  var f = num(p.factor), t = num(p.tol), k = num(p.costo);
  if (f == null || f <= 0) fail('datos', 'El factor debe ser mayor que 0.');
  if (t == null || t < 0 || t > 1) fail('datos', 'Tolerancia inválida.');
  if (k == null || k < 0) k = 0;
  return withLock(function () {
    var row = findRowById('Productos', id), o = row ? readRowObj('Productos', row) : { orden: num(p.orden) || now() };
    o.id = id; o.nombre = nombre; o.cat = String(p.cat || '').trim(); o.unidad = String(p.unidad || 'unid').trim(); o.factor = f; o.tol = t; o.costo = k;
    o.critico = p.critico ? 1 : 0; o.negocios = (p.negocios || []).map(String); o.activo = 1;
    if (row) writeRow('Productos', row, o); else appendObj('Productos', o);
    cacheDrop();
    bit(me.email, 'producto', id + ' ' + nombre);
    return { ok: true };
  });
}
function delProducto(me, p) {
  return withLock(function () {
    var row = findRowById('Productos', p.id);
    if (!row) return { ok: true };
    var o = readRowObj('Productos', row); o.activo = 0; writeRow('Productos', row, o);
    cacheDrop();
    bit(me.email, 'producto-baja', o.id + ' ' + o.nombre);
    return { ok: true };
  });
}
function saveConfig(me, p) {
  var ok = ['negocios', 'turnos', 'limites', 'calendario', 'catDias', 'avisos'];
  return withLock(function () {
    Object.keys(p.cfg || {}).forEach(function (k) {
      if (ok.indexOf(k) < 0) return;
      var v = p.cfg[k];
      if (k === 'negocios' && (!Array.isArray(v) || !v.length)) fail('datos', 'Deja al menos un negocio.');
      setConfigKey(k, v);
    });
    bit(me.email, 'config', Object.keys(p.cfg || {}).join(','));
    return { ok: true };
  });
}
function getAliases() {
  var m = {};
  readAll('Equivalencias').forEach(function (r) { m[r.clave] = r.pid; });
  return m;
}
function saveAliases(me, p) {
  return withLock(function () {
    var rows = readAll('Equivalencias'), ex = {};
    rows.forEach(function (r) { ex[r.clave] = r; });
    var m = p.map || {};
    Object.keys(m).forEach(function (clave) {
      var v = m[clave], pid = String(v.pid || ''), orig = String(v.original || '').slice(0, 120);
      if (!pid) return;
      if (ex[clave]) sheet('Equivalencias').getRange(ex[clave]._row, 1, 1, 3).setValues([[clave, pid, orig]]);
      else sheet('Equivalencias').appendRow([clave, pid, orig]);
    });
    return { ok: true };
  });
}

/* ============================ equipo ============================ */
function listUsers() {
  return readAll('Usuarios').map(function (u) { return { email: u.email, nombre: u.nombre, rol: u.rol, estado: u.estado, negocios: u.negocios || [], creado: u.creado, ultimoAcceso: u.ultimoAcceso, telefono: u.telefono || '', turnos: u.turnos || [] }; });
}
/* Personas con acceso y su teléfono, para recordatorios por WhatsApp */
function contactos() {
  return readAll('Usuarios').filter(function (u) { return u.estado === 'aprobado' && u.telefono; }).map(function (u) { return { nombre: u.nombre, rol: u.rol, negocios: u.negocios || [], telefono: String(u.telefono), turnos: u.turnos || [] }; });
}
/* Agrega al encabezado las columnas nuevas de versiones posteriores */
function ensureHeaders(name) {
  var s = sheet(name), h = H[name], r = s.getRange(1, 1, 1, h.length), cur = r.getValues()[0], ch = false;
  for (var i = 0; i < h.length; i++) if (!cur[i]) { cur[i] = h[i]; ch = true; }
  if (ch) r.setValues([cur]).setFontWeight('bold');
}
function setUser(me, p) {
  var email = normEmail(p.email);
  return withLock(function () {
    var u = userByEmail(email, true);
    if (!u) fail('datos', 'No existe ese usuario.');
    var owner = props().getProperty('OWNER');
    if (email === owner && (p.rol !== 'admin' || p.estado !== 'aprobado')) fail('datos', 'El dueño de la app siempre es administrador.');
    if (['colaborador', 'lider', 'supervisor', 'admin', 'gerencia'].indexOf(p.rol) < 0) fail('datos', 'Rol inválido.');
    if (['aprobado', 'pendiente', 'bloqueado'].indexOf(p.estado) < 0) fail('datos', 'Estado inválido.');
    var nuevo = u.estado !== 'aprobado' && p.estado === 'aprobado';
    u.rol = p.rol; u.estado = p.estado; u.negocios = (p.negocios || []).map(String);
    if (p.nombre) u.nombre = String(p.nombre).trim().slice(0, 60);
    if (p.turnos !== undefined) u.turnos = (p.turnos || []).map(String).filter(function (x) { return /^[1-3]$/.test(x); });
    if (p.telefono !== undefined) u.telefono = String(p.telefono || '').replace(/\D/g, '').slice(0, 15);
    ensureHeaders('Usuarios');
    if (nuevo) u.aprobadoPor = me.email;
    writeRow('Usuarios', u._row, u);
    cacheDrop();
    bit(me.email, 'usuario', email + ' ' + u.rol + ' ' + u.estado + ' ' + (u.negocios || []).join('|'));
    if (nuevo) {
      try {
        MailApp.sendEmail({ to: email, name: 'Arqueo La Barra', subject: 'Ya tienes acceso a Arqueo La Barra',
          body: 'Hola ' + u.nombre + ',\n\nTu acceso fue aprobado como ' + u.rol + '.\nEntra aquí: ' + appUrl() + '\n\nUsa tu mismo Gmail; te pediremos un código por correo.' });
      } catch (e) { }
      notify('acceso-ok', 'Acceso aprobado', 'Bienvenido, ' + u.nombre + '.', { para: 'u:' + email, email: false });
    }
    return { ok: true };
  });
}

/* ============================ avisos ============================ */
function recipients(para, tipo) {
  var toks = String(para).split(','), out = {};
  var users = readAll('Usuarios').filter(function (u) { return u.estado === 'aprobado'; });
  users.forEach(function (u) {
    var hit = toks.indexOf(u.rol) > -1 || toks.indexOf('u:' + u.email) > -1 || toks.indexOf('todos') > -1 || (u.rol === 'supervisor' && toks.indexOf('admin') > -1 && tipo !== 'acceso');
    if (!hit && (u.rol === 'lider' || u.rol === 'colaborador')) (u.negocios || []).forEach(function (n) { if (toks.indexOf('n:' + n) > -1 || (u.rol === 'lider' && toks.indexOf('nl:' + n) > -1)) hit = true; });
    if (hit) out[u.email] = 1;
  });
  return Object.keys(out);
}
function notify(tipo, titulo, texto, o) {
  o = o || {};
  var id = 'n_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  appendObj('Notificaciones', { id: id, ts: now(), para: o.para || 'admin', tipo: tipo, titulo: titulo, texto: texto, negocio: o.negocio || '', ref: o.ref || '', leidoPor: [] });
  if (o.email) {
    try {
      var cfg = getConfig(), flag = ({ acceso: 'acceso', pendiente: 'pendiente', critico: 'critico', falta: 'falta' })[tipo];
      if (flag && cfg.avisos && cfg.avisos[flag] === false) return;
      var to = recipients(o.para || 'admin', tipo);
      if (!to.length || MailApp.getRemainingDailyQuota() < 5) return;
      MailApp.sendEmail({ to: to.join(','), name: 'Arqueo La Barra', subject: titulo, body: texto + '\n\nAbrir la app: ' + appUrl() });
    } catch (e) { }
  }
}
function markRead(me, p) {
  return withLock(function () {
    var s = sheet('Notificaciones'), last = s.getLastRow();
    if (last < 2) return { ok: true };
    var from = Math.max(2, last - 199), n = last - from + 1, col = colIdx('Notificaciones', 'leidoPor') + 1;
    var vals = s.getRange(from, 1, n, H.Notificaciones.length).getValues(), ids = p.ids || [], todos = !!p.todos;
    vals.forEach(function (r, i) {
      var id = String(r[0]);
      if (!todos && ids.indexOf(id) < 0) return;
      var lp = parseJ(r[col - 1], []);
      if (lp.indexOf(me.email) > -1) return;
      lp.push(me.email);
      s.getRange(from + i, col).setValue(JSON.stringify(lp));
    });
    return { ok: true };
  });
}

/* ============================ revisión automática (cada hora) ============================ */
function yaAvisado(ref, tipo) {
  var s = sheet('Notificaciones'), last = s.getLastRow();
  if (last < 2) return false;
  var from = Math.max(2, last - 299), n = last - from + 1;
  var refs = s.getRange(from, colIdx('Notificaciones', 'ref') + 1, n, 1).getValues();
  var tips = s.getRange(from, colIdx('Notificaciones', 'tipo') + 1, n, 1).getValues();
  for (var i = 0; i < n; i++) if (String(refs[i][0]) === ref && String(tips[i][0]) === tipo) return true;
  return false;
}
function revisarPendientes() {
  var cfg = getConfig(), h = hoy(), ahora = new Date();
  var hm = Utilities.formatDate(ahora, TZ, 'HH:mm');
  var recientes = readRecentConteos(3);
  var faltan = [];
  [fechaMas(h, -1), h].forEach(function (f) {
    cfg.negocios.forEach(function (neg) {
      (cfg.turnos[neg] || []).forEach(function (t) {
        var lim = cfg.limites[neg + '|' + t];
        if (!lim) return;
        var calN = cfg.calendario && cfg.calendario[neg];
        if (Array.isArray(calN) && calN.indexOf(new Date(f + 'T12:00:00Z').getUTCDay()) < 0) return;   // no es día de conteo
        var pasado = f < h || hm >= lim;
        if (!pasado) return;
        var hecho = recientes.some(function (c) { return c.negocio === neg && c.turno === t && c.fecha === f && c.estado !== 'anulado'; });
        if (hecho) return;
        var ref = 'falta|' + f + '|' + neg + '|' + t;
        if (yaAvisado(ref, 'falta')) return;
        faltan.push({ ref: ref, neg: neg, t: t, f: f });
      });
    });
  });
  faltan.forEach(function (x) {
    notify('falta', 'Falta el conteo: ' + x.neg, 'No se registró el conteo de ' + x.neg + ' · ' + x.t + ' del ' + x.f + '.', { para: 'admin,gerencia,n:' + x.neg, negocio: x.neg, ref: x.ref, email: false });
  });
  if (faltan.length) {
    var lines = faltan.map(function (x) { return '• ' + x.neg + ' · ' + x.t + ' · ' + x.f; }).join('\n');
    try {
      var cfg2 = getConfig();
      if (!(cfg2.avisos && cfg2.avisos.falta === false)) {
        var to = recipients('admin,gerencia');
        if (to.length && MailApp.getRemainingDailyQuota() > 5) MailApp.sendEmail({ to: to.join(','), name: 'Arqueo La Barra', subject: 'Conteos que faltan (' + faltan.length + ')', body: lines + '\n\nAbrir la app: ' + appUrl() });
      }
    } catch (e) { }
  }
  // traspasos sin confirmar por más de 6 horas
  readMovs(3).forEach(function (m) {
    if (m.tipo === 'traspaso' && !m.anulada && m.estado === 'enviado' && now() - m.ts > 6 * 3600000) {
      var ref = 'tras|' + m.id;
      if (!yaAvisado(ref, 'traspaso-tarde')) {
        notify('traspaso-tarde', 'Traspaso sin confirmar', 'De ' + m.negocio + ' a ' + m.destino + ' lleva más de 6 horas sin confirmarse: ' + itemsTexto(m.items) + '.', { para: 'admin,gerencia,n:' + m.destino, negocio: m.destino, ref: ref, email: false });
      }
    }
  });
  // ventas pendientes de registrar por más de 12 horas
  recientes.forEach(function (c) {
    if (c.estado === 'contado' && now() - c.ts > 12 * 3600000) {
      var ref = 'ventas|' + c.id;
      if (!yaAvisado(ref, 'ventas-tarde')) {
        notify('ventas-tarde', 'Ventas sin registrar', c.negocio + ' · ' + c.turno + ' · ' + c.fecha + ' lleva más de 12 horas esperando las ventas.', { para: 'admin,gerencia,nl:' + c.negocio, negocio: c.negocio, ref: ref, email: false });
      }
    }
  });
}

/* ============================ panel (admin / gerencia) ============================ */
function dash(p) {
  var cfg = getConfig(), desde = String(p.desde || fechaMas(hoy(), -6)), hasta = String(p.hasta || hoy()), filtro = String(p.negocio || '');
  var s = sheet('Conteos'), last = s.getLastRow(), rows = [];
  if (last > 1) {
    var from = Math.max(2, last - 1499), n = last - from + 1;
    var cols = [1, 2, 3, 4, 7, 8, 11, 12];   // id fecha negocio turno ts estado res resumen (1-based)
    var A = s.getRange(from, 1, n, 8).getValues();
    var RS = s.getRange(from, colIdx('Conteos', 'res') + 1, n, 2).getValues();
    for (var i = 0; i < n; i++) {
      var f = A[i][1] instanceof Date ? Utilities.formatDate(A[i][1], TZ, 'yyyy-MM-dd') : String(A[i][1]);
      if (f < desde || f > hasta) continue;
      if (filtro && String(A[i][2]) !== filtro) continue;
      rows.push({ id: String(A[i][0]), fecha: f, negocio: String(A[i][2]), turno: String(A[i][3]), ts: Number(A[i][6]), estado: String(A[i][7]), res: parseJ(RS[i][0], []), resumen: parseJ(RS[i][1], {}) });
    }
  }
  var vivos = rows.filter(function (r) { return r.estado !== 'anulado'; });
  var porNeg = {}, prod = {}, diario = {}, ahora = now();
  var negs = filtro ? [filtro] : cfg.negocios;
  negs.forEach(function (n) { porNeg[n] = { conteos: 0, arqueados: 0, pendientes: 0, ok: 0, rev: 0, crit: 0, items: 0, faltante: 0, sobrante: 0, decl: 0, esperados: 0, cumplidos: 0 }; });
  vivos.forEach(function (r) {
    var o = porNeg[r.negocio]; if (!o) return;
    o.conteos++;
    var d = diario[r.fecha] || (diario[r.fecha] = { fecha: r.fecha, faltante: 0, conteos: 0 });
    d.conteos++;
    if (r.estado === 'arqueado') {
      o.arqueados++;
      var rs = r.resumen || {};
      o.ok += rs.ok || 0; o.rev += rs.rev || 0; o.crit += rs.crit || 0; o.items += (rs.ok || 0) + (rs.rev || 0) + (rs.crit || 0);
      o.faltante += rs.faltante || 0; o.sobrante += rs.sobrante || 0; o.decl += rs.decl || 0; d.faltante += rs.faltante || 0;
      r.res.forEach(function (x) {
        var k = x[0] + '|' + r.negocio;
        var q = prod[k] || (prod[k] = { pid: x[0], nombre: x[1], unidad: x[2], negocio: r.negocio, faltaU: 0, faltaV: 0, veces: 0, crit: 0 });
        if (x[9] > 0) { q.faltaU += x[9]; q.faltaV += Math.max(x[12], 0); }
        if (x[11] !== 'OK') q.veces++;
        if (x[11] === 'CRÍTICO') q.crit++;
      });
    } else if (r.estado === 'contado') o.pendientes++;
  });
  // cumplimiento: turnos esperados vs. hechos (solo los cuyo límite ya pasó)
  var h = hoy(), hm = Utilities.formatDate(new Date(), TZ, 'HH:mm'), faltan = [];
  var f = desde;
  while (f <= hasta && f <= h) {
    negs.forEach(function (neg) {
      (cfg.turnos[neg] || []).forEach(function (t) {
        var lim = cfg.limites[neg + '|' + t];
        if (!lim) return;
        var calN = cfg.calendario && cfg.calendario[neg];
        if (Array.isArray(calN) && calN.indexOf(new Date(f + 'T12:00:00Z').getUTCDay()) < 0) return;   // no es día de conteo
        var hecho = vivos.some(function (c) { return c.negocio === neg && c.turno === t && c.fecha === f; });
        if (f === h && hm < lim && !hecho) return;   // aún no vence y todavía no se hace
        var o = porNeg[neg]; o.esperados++;
        if (hecho) o.cumplidos++; else faltan.push({ fecha: f, negocio: neg, turno: t });
      });
    });
    f = fechaMas(f, 1);
  }
  var tot = { conteos: 0, arqueados: 0, pendientes: 0, ok: 0, rev: 0, crit: 0, items: 0, faltante: 0, sobrante: 0, decl: 0, esperados: 0, cumplidos: 0 };
  Object.keys(porNeg).forEach(function (n) { var o = porNeg[n]; o.faltante = r2(o.faltante); o.sobrante = r2(o.sobrante); o.decl = r2(o.decl); Object.keys(tot).forEach(function (k) { tot[k] += o[k]; }); });
  tot.faltante = r2(tot.faltante); tot.sobrante = r2(tot.sobrante); tot.decl = r2(tot.decl);
  var top = Object.keys(prod).map(function (k) { var q = prod[k]; q.faltaU = r2(q.faltaU); q.faltaV = r2(q.faltaV); return q; })
    .filter(function (q) { return q.faltaU > 0; }).sort(function (a, b) { return (b.faltaV - a.faltaV) || (b.faltaU - a.faltaU); }).slice(0, 12);
  var pendList = vivos.filter(function (r) { return r.estado === 'contado'; }).sort(function (a, b) { return a.ts - b.ts; })
    .map(function (r) { return { id: r.id, fecha: r.fecha, negocio: r.negocio, turno: r.turno, horas: Math.floor((ahora - r.ts) / 3600000) }; });
  var dd = Object.keys(diario).sort().map(function (k) { diario[k].faltante = r2(diario[k].faltante); return diario[k]; });
  var pmm = productMap(), mm = { total: 0, porMotivo: {}, enviados: 0, sinConfirmar: 0 };
  readMovs(60).forEach(function (m) {
    if (m.anulada || m.fecha < desde || m.fecha > hasta) return;
    if (filtro && m.negocio !== filtro && m.destino !== filtro) return;
    if (m.tipo === 'merma') {
      var v = 0; m.items.forEach(function (i) { v += i.qty * ((pmm[i.pid] && pmm[i.pid].costo) || 0); });
      var q = mm.porMotivo[m.motivo] || (mm.porMotivo[m.motivo] = { n: 0, valor: 0 });
      q.n++; q.valor = r2(q.valor + v); mm.total = r2(mm.total + v);
    } else { mm.enviados++; if (m.estado === 'enviado') mm.sinConfirmar++; }
  });
  return { mermas: mm, desde: desde, hasta: hasta, total: tot, porNegocio: porNeg, top: top, diario: dd, faltan: faltan.slice(-40), pendientes: pendList };
}
