
(function(){
"use strict";
var DOBLE=["Zona Presidente"];
var INSUMOS=["Car Wash"];
var ROL={colaborador:"Colaborador",lider:"Líder",supervisor:"Supervisor",admin:"Administración",gerencia:"Gerencia"};
var DIAS=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],DIAS_L=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
var S={
  tok:null,auth:"load",me:null,loginEmail:"",loginNuevo:false,loginName:"",loginCode:"",loginBusy:false,
  hoy:"",cfg:{negocios:[],turnos:{},limites:{},calendario:{},catDias:{},avisos:{},todosNegocios:[]},
  productos:[],conteos:[],entradas:[],movs:[],motivos:[],notifs:[],pend:0,
  view:"",campo:false,step:"elegir",draft:null,saved:null,saving:false,
  rec:{modo:"entrada",negocio:"",nota:"",lines:[],q:"",saving:false,origen:"Proveedor",motivo:"",detalle:"",destino:"",tr:{}},
  vs:null,detail:null,fNeg:"",fRango:"7",fEstado:"",
  panel:{rango:"7",negocio:"",data:null,loading:false},
  cat:{q:"",editing:null,pendingDel:null,open:{}},
  eq:{users:null,editing:null,form:null},
  err:"",ready:false,syncing:false,lastSync:0
};
var toastT=null,pollT=null;

function $(s){return document.querySelector(s)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function pad(n){return n<10?"0"+n:""+n}
function dstr(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function today(){return S.hoy||dstr(new Date())}
function addDays(f,n){var p=f.split("-"),d=new Date(Date.UTC(+p[0],+p[1]-1,+p[2]+n));return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate())}
function fmtFecha(s){if(!s)return"";var p=s.split("-");return p[2]+"/"+p[1]+"/"+p[0]}
function dow(f){var p=f.split("-");return new Date(Date.UTC(+p[0],+p[1]-1,+p[2])).getUTCDay()}
function fmt(n){if(n==null||isNaN(n))return"";if(Math.abs(n-Math.round(n))<1e-9)return String(Math.round(n));return Number(n).toLocaleString("es-DO",{maximumFractionDigits:2})}
function money(n){return "RD$ "+Math.round(n||0).toLocaleString("es-DO")}
function pctf(n){return (n*100).toLocaleString("es-DO",{maximumFractionDigits:1})+"%"}
function r2(x,d){var m=Math.pow(10,d||2);return Math.round(x*m)/m}
function num(v){if(v===""||v==null)return null;var n=parseFloat(String(v).replace(",","."));return isNaN(n)?null:n}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function clone(o){return JSON.parse(JSON.stringify(o))}
function rid(p){var s="";var c="abcdefghijklmnopqrstuvwxyz0123456789";for(var i=0;i<14;i++)s+=c.charAt(Math.floor(Math.random()*c.length));return p+s}
function toast(msg){var t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true},4500)}
function hora(ts){try{return new Date(ts).toLocaleTimeString("es-DO",{hour:"2-digit",minute:"2-digit"})}catch(e){return""}}
function normClave(s){return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}
function role(){return S.me?S.me.rol:""}
function isAdmin(){return role()==="admin"}
function canVentas(){return role()==="admin"||role()==="lider"||role()==="supervisor"}
function canRect(){return role()==="admin"||role()==="supervisor"}
function prodById(id){for(var i=0;i<S.productos.length;i++)if(S.productos[i].id===id)return S.productos[i];return null}

/* ---------- servidor ---------- */
var API_URL="https://script.google.com/macros/s/AKfycbxusdGnNAF7tFw4qg71-CTZv14msgxn8otbbia31SgXbwKyj7ot2ipN1m3E-X1-vUZeQw/exec";
function api(a,p){
  return new Promise(function(res,rej){
    var ok=function(s){
      var r;try{r=JSON.parse(s)}catch(e){return rej({code:"net",msg:"Respuesta inválida del servidor."})}
      if(r.ok)return res(r.data);
      if(r.error==="sesion"&&S.auth==="app"){doLogout(true)}
      rej({code:r.error,msg:r.msg});
    };
    var bad=function(){rej({code:"net",msg:"No hay conexión con el servidor. Revisa tu señal e intenta de nuevo."})};
    var body=JSON.stringify({a:a,p:p||{},t:S.tok||""});
    if(window.google&&google.script&&google.script.run){
      try{google.script.run.withSuccessHandler(ok).withFailureHandler(bad).api(body)}catch(e){bad()}
    }else{
      /* pantalla alojada fuera de Google: POST de texto plano (sin preflight) al servidor de Apps Script */
      fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:body,redirect:"follow"})
        .then(function(r){return r.text()}).then(ok,bad);
    }
  });
}
function errMsg(e){return (e&&e.msg)||"Algo salió mal. Intenta de nuevo."}

/* ---------- sesión ---------- */
function doLogout(expired){
  lsSet("arq-tok","");S.tok=null;S.me=null;S.auth="email";S.ready=false;S.view="";S.campo=false;S.step="elegir";S.draft=null;S.vs=null;S.detail=null;
  if(expired)S.err="Tu sesión venció. Entra de nuevo.";
  render();
}
async function enter(data){
  S.tok=data.token||S.tok;if(data.token)lsSet("arq-tok",data.token);
  S.me=data.me;
  if(S.me.estado==="bloqueado"){S.auth="blocked";render();return}
  if(S.me.estado!=="aprobado"){S.auth="pending";render();startPoll();return}
  S.auth="app";S.err="";
  S.view=defaultView();
  await refresh(true);
  if(role()!=="gerencia"){restoreDraft();render()}
  startPoll();
}
function defaultView(){
  if(role()==="admin"||role()==="lider"||role()==="supervisor")return "pend";
  if(role()==="gerencia")return "panel";
  return "contar";
}
async function boot(){
  S.tok=lsGet("arq-tok");
  if(!S.tok){S.auth="email";render();return}
  try{var me=await api("me");await enter({me:me})}
  catch(e){if(e.code==="net"){S.auth="load";S.err=errMsg(e);render();setTimeout(boot,5000)}else{S.auth="email";render()}}
}
function startPoll(){
  clearInterval(pollT);
  pollT=setInterval(function(){
    if(document.hidden)return;
    if(S.auth==="pending"){checkPending();return}
    /* los líderes solo se actualizan al abrir/volver a la app; administración y gerencia cada minuto */
    if(S.auth==="app"&&role()!=="colaborador"&&Date.now()-S.lastSync>55000)refresh(false);
  },20000);
}
async function checkPending(){
  try{var me=await api("me");S.me=me;if(me.estado==="aprobado"){await enter({me:me})}else if(me.estado==="bloqueado"){S.auth="blocked";render()}}catch(e){}
}
function quiet(){
  /* pantallas con campos que no deben repintarse solas */
  if(S.auth!=="app")return false;
  if(S.view==="contar"&&S.step==="contar")return true;
  if(S.vs||(S.detail&&(S.detail.edit||S.detail.anular)))return true;
  if(S.cat.editing||S.eq.editing||S.cat.typing)return true;
  if(S.view==="recibir"&&S.rec.negocio)return true;
  return false;
}
async function refresh(force){
  if(S.syncing)return;
  S.syncing=true;
  try{
    var d=await api("sync");
    S.me=d.me;S.hoy=d.hoy;S.cfg=d.config;S.productos=d.productos;S.conteos=d.conteos;S.entradas=d.entradas;S.movs=d.movs||[];S.motivos=d.motivos||[];S.notifs=d.notifs;S.pend=d.pendientes;S.ready=true;S.err="";S.lastSync=Date.now();
    if(!S.contactos&&(role()==="admin"||role()==="supervisor")&&S.me.estado==="aprobado")api("contactos").then(function(c){S.contactos=c;if(S.view==="pend"&&!quiet())render()}).catch(function(){});
    if(S.me.estado!=="aprobado"){S.auth=S.me.estado==="bloqueado"?"blocked":"pending";render();return}
    if(!force&&quiet()){updateChrome()}else render();
  }catch(e){
    if(e.code==="net"){S.err="Sin conexión. Se muestran los últimos datos.";if(!quiet())render();else updateChrome()}
    else if(e.code==="bloqueado"){S.auth="blocked";render()}
    else {S.err=errMsg(e);if(!quiet())render()}
  }finally{S.syncing=false}
}
function unread(){var n=0;S.notifs.forEach(function(x){if(!x.leido)n++});return n}
function updateChrome(){
  var b=$("#bellbadge");if(b){var u=unread();b.textContent=u;b.hidden=!u}
  renderFoot();
}

/* ---------- render ---------- */
function render(){
  var banners="";
  if(S.err)banners+='<div class="banner bad">'+esc(S.err)+'</div>';
  $("#banners").innerHTML=banners;
  var top=$("#topbar");
  if(S.auth==="app"){
    var u=unread();
    top.innerHTML='<span class="brand">ARQUEO · LA BARRA</span><div class="tr"><div class="who">'+esc(S.me.nombre)+'<br>'+ROL[S.me.rol]+'</div>'+
      '<button class="bell" data-act="go" data-v="avisos" aria-label="Avisos"><svg viewBox="0 0 24 24"><path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5zM10 20a2 2 0 0 0 4 0"/></svg><span class="badge" id="bellbadge"'+(u?"":" hidden")+'>'+u+'</span></button></div>';
  }else top.innerHTML='<span class="brand">ARQUEO · LA BARRA</span>';
  var v=$("#view"),html="";
  if(S.auth!=="app")html=authHTML();
  else if(!S.ready)html='<div class="loading">Cargando…</div>';
  else html=routeHTML();
  v.innerHTML=html;
  renderFoot();
  afterRender();
}
function navItems(){
  var r=role();
  if(r==="supervisor")return [["pend","Pendientes",ICO.ventas,S.pend],["contar","Contar",ICO.contar],["recibir","Movimientos",ICO.recibir,movPend()],["res","Resultados",ICO.res],["avisos","Avisos",ICO.bell]];
  if(r==="lider")return [["pend","Pendientes",ICO.ventas,S.pend],["contar","Contar",ICO.contar],["recibir","Movimientos",ICO.recibir,movPend()],["res","Resultados",ICO.res]];
  if(r==="colaborador"||(r==="admin"&&S.campo))return [["contar","Contar",ICO.contar],["recibir","Movimientos",ICO.recibir,movPend()],["mios","Mis conteos",ICO.res]];
  if(r==="admin")return [["pend","Pendientes",ICO.ventas,S.pend],["res","Resultados",ICO.res],["panel","Panel",ICO.panel],["cat","Catálogo",ICO.cat],["eq","Equipo",ICO.eq]];
  return [["panel","Panel",ICO.panel],["res","Resultados",ICO.res],["avisos","Avisos",ICO.bell]];
}
var ICO={
 recibir:'<svg viewBox="0 0 24 24"><path d="M12 4v10M8 10l4 4 4-4M5 20h14"/></svg>',
 contar:'<svg viewBox="0 0 24 24"><rect x="5" y="6" width="14" height="15" rx="2"/><path d="M9 4h6v3H9zM9 14l2 2 4-4"/></svg>',
 res:'<svg viewBox="0 0 24 24"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
 ventas:'<svg viewBox="0 0 24 24"><path d="M4 7h16v12H4zM4 11h16M8 15h3"/></svg>',
 panel:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="5" rx="1"/><rect x="13" y="11" width="7" height="9" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/></svg>',
 cat:'<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
 eq:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a3 3 0 1 0 0-6M18 14c2 .7 3 2.5 3 6"/></svg>',
 bell:'<svg viewBox="0 0 24 24"><path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5zM10 20a2 2 0 0 0 4 0"/></svg>'
};
function renderFoot(){
  var f=$("#foot");
  if(S.auth!=="app"||!S.ready){f.innerHTML="";return}
  if(S.view==="contar"&&S.step==="contar"&&S.draft){
    f.innerHTML='<div class="savebar"><div class="in"><button class="btn" id="saveBtn" data-act="save" disabled>Guardar conteo</button><div class="savemsg" id="saveMsg"></div></div></div>';
    updateProgress();return;
  }
  if(S.vs){
    f.innerHTML='<div class="savebar"><div class="in"><button class="btn" id="vsBtn" data-act="vs-calc">Calcular arqueo</button><div class="savemsg" id="vsMsg"></div></div></div>';
    updateVsFoot();return;
  }
  var items=navItems(),cur=S.detail?"res":S.view;
  f.innerHTML='<nav class="nav"><div class="in n'+items.length+'">'+items.map(function(t){
    return '<button data-act="go" data-v="'+t[0]+'" class="'+(cur===t[0]?"on":"")+'">'+t[2]+t[1]+(t[3]?'<span class="badge">'+t[3]+'</span>':"")+'</button>'}).join("")+'</nav>';
}
function routeHTML(){
  if(S.vs)return ventasHTML();
  if(S.detail)return detalleHTML();
  var extra="";
  if(role()==="admin"&&S.campo)extra='<div class="banner">Modo conteo. <button class="linkbtn" data-act="campo-off">Volver a administración</button></div>';
  switch(S.view){
    case "contar":return extra+contarRoot();
    case "recibir":return extra+recibirHTML();
    case "mios":return extra+miosHTML();
    case "pend":return pendHTML();
    case "res":return resultadosHTML();
    case "panel":return panelHTML();
    case "cat":return catalogoHTML();
    case "eq":return equipoHTML();
    case "avisos":return avisosHTML();
  }
  return "";
}
function afterRender(){
  if(S.auth==="app"&&S.ready){
    if(S.view==="contar"&&S.step==="contar"&&S.draft){updateProgress();applyFilter()}
    if(S.view==="recibir")updateRecBtn();
    if(S.view==="panel"&&!S.panel.data&&!S.panel.loading&&!S.panel.err)loadPanel();
    if(S.view==="eq"&&!S.eq.users)loadUsers();
  }
}

/* ---------- acceso ---------- */
function authHTML(){
  if(S.auth==="load")return '<div class="loading">'+(S.err?esc(S.err):"Cargando…")+'</div>';
  if(S.auth==="blocked")return '<div class="panel login center"><h1>Acceso bloqueado</h1><p class="sub">Tu usuario no tiene acceso. Habla con administración.</p><button class="btn ghost" data-act="logout">Salir</button></div>';
  if(S.auth==="pending")return '<div class="panel login center"><div class="big">⏳</div><h1>Solicitud enviada</h1><p class="sub">Hola, '+esc(S.me.nombre)+'. Administración ya fue avisada. Cuando te aprueben, esta pantalla se abre sola y te llegará un correo.</p><button class="btn" data-act="check-pending">Revisar ahora</button><button class="btn ghost" data-act="logout">Salir</button></div>';
  if(S.auth==="code"){
    return '<div class="panel login"><div><h1>Revisa tu correo</h1><p class="sub">Enviamos un código de 6 números a <b>'+esc(S.loginEmail)+'</b>. Si no lo ves, mira en spam.</p></div>'+
      (S.err?'<div class="banner bad">'+esc(S.err)+'</div>':"")+
      '<div class="field"><label class="lbl" for="lg-code">Código</label><input id="lg-code" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······" value="'+esc(S.loginCode)+'"></div>'+
      (S.loginNuevo?'<div class="field"><label class="lbl" for="lg-name">Tu nombre (para pedir acceso)</label><input id="lg-name" autocomplete="name" placeholder="Nombre y apellido" value="'+esc(S.loginName)+'"></div>':"")+
      '<button class="btn" data-act="lg-verify"'+(S.loginBusy?" disabled":"")+'>'+(S.loginBusy?"Verificando…":"Entrar")+'</button>'+
      '<div class="row-act"><button class="linkbtn" data-act="lg-resend">Reenviar código</button><button class="linkbtn" data-act="lg-change">Cambiar correo</button></div></div>';
  }
  return '<div class="panel login"><div><h1>Entrar</h1><p class="sub">Usa tu Gmail. Te enviamos un código para confirmar que eres tú; no necesitas contraseña.</p></div>'+
    (S.err?'<div class="banner bad">'+esc(S.err)+'</div>':"")+
    '<div class="field"><label class="lbl" for="lg-email">Tu Gmail</label><input id="lg-email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" placeholder="nombre@gmail.com" value="'+esc(S.loginEmail)+'"></div>'+
    '<button class="btn" data-act="lg-send"'+(S.loginBusy?" disabled":"")+'>'+(S.loginBusy?"Enviando…":"Enviarme el código")+'</button></div>';
}
async function lgSend(){
  var em=($("#lg-email")||{}).value||S.loginEmail;S.loginEmail=String(em).trim().toLowerCase();
  if(!S.loginEmail)return;
  S.loginBusy=true;S.err="";render();
  try{var r=await api("reqCode",{email:S.loginEmail});S.loginNuevo=!!r.nuevo;S.auth="code";S.loginCode=""}
  catch(e){S.err=errMsg(e)}
  S.loginBusy=false;render();
}
async function lgVerify(){
  var code=($("#lg-code")||{}).value||"",nm=$("#lg-name")?$("#lg-name").value:"";
  S.loginCode=code;S.loginName=nm;S.loginBusy=true;S.err="";render();
  try{var r=await api("verifyCode",{email:S.loginEmail,code:code,nombre:nm});S.loginBusy=false;await enter(r)}
  catch(e){S.loginBusy=false;S.err=errMsg(e);render()}
}

/* ---------- calendario / turnos ---------- */
function isFullDay(neg,fecha){
  var c=S.cfg.calendario&&S.cfg.calendario[neg];if(!Array.isArray(c))return true;
  return c.indexOf(dow(fecha||today()))>-1;
}
function turnosFor(neg){return (S.cfg.turnos&&S.cfg.turnos[neg])||[]}
function turnoDone(neg,turno,fecha){return S.conteos.some(function(c){return c.negocio===neg&&c.turno===turno&&c.fecha===fecha&&c.estado!=="anulado"})}
function sugTurno(neg,fecha){var ts=turnosFor(neg);for(var i=0;i<ts.length;i++)if(!turnoDone(neg,ts[i],fecha))return ts[i];return ts[0]||""}
function prodsFor(neg){
  return S.productos.filter(function(p){return !p.negocios||!p.negocios.length||p.negocios.indexOf(neg)>-1})
    .sort(function(a,b){return (a.orden||0)-(b.orden||0)||String(a.nombre).localeCompare(String(b.nombre))});
}
function newDraft(){return {negocio:"",turno:"",fecha:today(),vals:{},base:null,id:null,fcat:null,fmode:""}}
var CIERRE=["Revisé las áreas","Rellené lo necesario","El turno completó sus limpiezas","Dejé los equipos cargando y en orden","Cerré el sistema e hice el cierre de caja","Dejé los baños limpios y los safacones listos"];
function conCierre(neg){return !!neg&&INSUMOS.indexOf(neg)<0}
function conCafe(neg){return esLB(neg)||neg==="Food Shop"}
function conFreezer(neg){return neg==="Food Shop"}
function cierreDe(d){var c=d.cierre||(d.cierre={chk:[],nov:"",txt:""});if(!c.cafe)c.cafe={rell:"",func:"",txt:""};if(!c.fz)c.fz={ok:"",txt:""};return c}
function cierreOk(d){
  if(!conCierre(d.negocio))return true;
  var c=cierreDe(d);
  for(var i=0;i<CIERRE.length;i++)if(!c.chk[i])return false;
  if(conCafe(d.negocio)){var f=c.cafe;if(!f.rell||!f.func)return false;if((f.rell==="no"||f.func==="no")&&f.txt.trim().length<3)return false}
  if(conFreezer(d.negocio)){if(!c.fz.ok)return false;if(c.fz.ok==="no"&&c.fz.txt.trim().length<3)return false}
  return c.nov==="no"||(c.nov==="si"&&c.txt.trim().length>=3);
}
function fzHTML(c){
  var f=c.fz;return '<div class="lbl" style="margin-top:12px">¿Todos los freezers funcionan correctamente?</div><div class="seg"><button type="button" class="'+(f.ok==="si"?'on':'')+'" data-act="fz" data-v="si">Sí</button><button type="button" class="'+(f.ok==="no"?'on':'')+'" data-act="fz" data-v="no">No</button></div>'+
    (f.ok==="no"?'<div class="field"><label class="lbl" for="cfz">¿Qué pasó? ¿Cuál freezer?</label><textarea id="cfz" rows="2" maxlength="300" placeholder="Cuéntalo brevemente">'+esc(f.txt)+'</textarea></div>':'');
}
function cafeHTML(c){
  var f=c.cafe;function q(k,t){return '<div class="lbl" style="margin-top:12px">'+t+'</div><div class="seg"><button type="button" class="'+(f[k]==="si"?'on':'')+'" data-act="caf" data-k="'+k+'" data-v="si">Sí</button><button type="button" class="'+(f[k]==="no"?'on':'')+'" data-act="caf" data-k="'+k+'" data-v="no">No</button></div>'}
  return q("rell","¿Las máquinas de café fueron rellenadas?")+q("func","¿Las máquinas de café funcionan bien?")+
    ((f.rell==="no"||f.func==="no")?'<div class="field"><label class="lbl" for="ccaf">¿Qué pasó con las máquinas?</label><textarea id="ccaf" rows="2" maxlength="300" placeholder="Cuéntalo brevemente">'+esc(f.txt)+'</textarea></div>':'');
}
function cierreHTML(){
  var d=S.draft,c=cierreDe(d);
  return '<div class="panel" id="cierre"><h2>Cierre del turno</h2><p class="sub">Confirma antes de guardar.</p>'+
    CIERRE.map(function(t,i){return '<button type="button" class="chk'+(c.chk[i]?' on':'')+'" data-act="ck" data-v="'+i+'" aria-pressed="'+(c.chk[i]?'true':'false')+'"><span class="bx">'+(c.chk[i]?'✓':'')+'</span>'+esc(t)+'</button>'}).join('')+
    (conCafe(d.negocio)?cafeHTML(c):'')+(conFreezer(d.negocio)?fzHTML(c):'')+'<div class="lbl" style="margin-top:12px">¿Hubo alguna novedad?</div><div class="seg"><button type="button" class="'+(c.nov==="si"?'on':'')+'" data-act="nov" data-v="si">Sí</button><button type="button" class="'+(c.nov==="no"?'on':'')+'" data-act="nov" data-v="no">No</button></div>'+
    (c.nov==="si"?'<div class="field"><label class="lbl" for="cnov">¿Qué pasó? ¿Se dañó algo?</label><textarea id="cnov" rows="3" maxlength="400" placeholder="Cuéntalo brevemente">'+esc(c.txt)+'</textarea></div>':'')+'</div>';
}
function esLB(neg){return /^La Barra/.test(neg||"")}
/* ¿esta categoría se cuenta en esa fecha? (ej. cervezas de La Barra solo los lunes) */
function catHoy(neg,cat,fecha){
  var m=(S.cfg.catDias&&S.cfg.catDias[neg])||{},d=m[cat||""];
  return !Array.isArray(d)||d.indexOf(dow(fecha||today()))>-1;
}
function catsFuera(neg,fecha){
  var m=(S.cfg.catDias&&S.cfg.catDias[neg])||{},out=[];
  Object.keys(m).forEach(function(c){if(Array.isArray(m[c])&&m[c].indexOf(dow(fecha||today()))<0&&prodsFor(neg).some(function(p){return (p.cat||"")===c}))out.push(c+" (solo "+m[c].map(function(i){return DIAS_L[i].toLowerCase()}).join(", ")+")")});
  return out;
}
function negProducts(){var d=S.draft;return prodsFor(d.negocio).filter(function(p){return (isFullDay(d.negocio,d.fecha)||!!p.critico)&&catHoy(d.negocio,p.cat,d.fecha)})}
function fmtRaw(n){return String(Math.round(n*100)/100)}
function dueInfo(d){
  if(!d.negocio)return"";
  var full=isFullDay(d.negocio,d.fecha),list=prodsFor(d.negocio),n=full?list.length:list.filter(function(p){return p.critico}).length;
  var fuera=catsFuera(d.negocio,d.fecha);
  return '<p class="hint"><b>'+DIAS_L[dow(d.fecha)]+':</b> '+(full?"conteo completo":"solo productos críticos")+' ('+negProducts().length+' productos).'+(fuera.length?' Hoy no se cuenta: '+esc(fuera.join(", "))+'.':'')+'</p>';
}
function limiteDe(neg,t){return (S.cfg.limites||{})[neg+"|"+t]||""}
function nowHM(){var d=new Date();return pad(d.getHours())+":"+pad(d.getMinutes())}

/* ---------- contar ---------- */
function contarRoot(){
  if(!S.draft)S.draft=newDraft();
  if(S.step==="contar")return contarHTML();
  if(S.step==="listo")return listoHTML();
  return elegirHTML();
}
function hoyHTML(){
  var f=today(),rows="";
  S.cfg.negocios.forEach(function(n){
    turnosFor(n).forEach(function(t){
      var c=S.conteos.filter(function(x){return x.negocio===n&&x.turno===t&&x.fecha===f&&x.estado!=="anulado"})[0];
      var lim=limiteDe(n,t),st;
      if(c)st='<span class="st ok">✓ Hecho '+hora(c.ts)+'</span>';
      else if(lim&&nowHM()>lim)st='<span class="st late">Atrasado</span>';
      else st='<span class="st wait">Pendiente'+(lim?" · hasta "+lim:"")+'</span>';
      rows+='<div class="hoyrow"><span><b>'+esc(n)+'</b> · '+esc(t)+'</span>'+st+'</div>';
    });
  });
  return rows?'<div class="panel"><div class="lbl">Hoy</div><div>'+rows+'</div></div>':"";
}
function elegirHTML(){
  var d=S.draft;
  var negs=S.cfg.negocios.map(function(n,i){
    var ts=turnosFor(n),k=ts.filter(function(t){return turnoDone(n,t,d.fecha)}).length;
    return '<button class="neg'+(d.negocio===n?" on":"")+(ts.length&&k===ts.length?" done":"")+'" data-act="neg" data-v="'+i+'">'+esc(n)+'<small>'+(ts.length?(k+" de "+ts.length+" hoy"):"Sin conteos")+'</small></button>';
  }).join("");
  if(!S.cfg.negocios.length)negs='<p class="banner">Todavía no tienes negocios asignados. Pide a administración que te asigne uno en Equipo.</p>';
  var ts=turnosFor(d.negocio),tchips=ts.map(function(t,i){
    var done=turnoDone(d.negocio,t,d.fecha);
    return '<button class="tchip'+(d.turno===t?" on":"")+'" data-act="turno" data-v="'+i+'">'+(done?"✓ ":"")+esc(t)+'</button>'}).join("");
  var nada=(d.negocio&&!ts.length)?'<p class="banner">Este negocio no tiene turnos de conteo configurados.</p>':"";
  var dup=(d.negocio&&d.turno&&turnoDone(d.negocio,d.turno,d.fecha))?'<p class="banner">Ya hay un conteo de este turno hoy. Si hubo un error, pide a administración que lo anule o rectifique.</p>':"";
  var can=d.negocio&&d.turno&&!dup&&prodsFor(d.negocio).length&&!S.starting;
  var fechaF=isAdmin()?'<div class="field"><label class="lbl" for="fecha">Fecha</label><input id="fecha" type="date" value="'+esc(d.fecha)+'" max="'+esc(today())+'"></div>':"";
  return '<div class="panel"><div><h1>¿Qué vas a contar?</h1><p class="sub">Elige el negocio y el turno. Son 3 datos por producto.</p></div>'+
    '<div class="lbl">Negocio</div><div class="negs">'+negs+'</div>'+
    (d.negocio?'<div class="lbl">Turno</div><div class="turnos">'+tchips+'</div>'+dueInfo(d):"")+nada+dup+fechaF+
    '<button class="btn" id="startBtn" data-act="start"'+(can?"":" disabled")+'>'+(S.starting?"Preparando…":"Empezar conteo")+'</button></div>'+hoyHTML();
}
function entradasSince(pid,ts){
  var s=0;
  ((S.draft.base&&S.draft.base.entradas)||[]).forEach(function(e){
    if(e.ts<=ts)return;
    (e.items||[]).forEach(function(i){if(i.pid===pid)s+=i.qty});
  });
  return s;
}
function initVals(){
  var d=S.draft;
  negProducts().forEach(function(p){
    if(d.vals[p.id])return;
    var v={ini:"",ent:"",fin:"",src:""},l=d.base&&d.base.ultimos&&d.base.ultimos[p.id];
    if(l){v.ini=fmtRaw(l[0]);v.src=l[3];v.iniFecha=l[1];v.iniAuto=true;var s=entradasSince(p.id,l[2]);if(s>0){v.ent=fmtRaw(s);v.entAuto=true}}
    d.vals[p.id]=v;
  });
}
function persistDraft(){if(S.draft&&S.me)lsSet("arq-draft",JSON.stringify({u:S.me.email,step:S.step,draft:S.draft}))}
function clearDraft(){lsSet("arq-draft","")}
function restoreDraft(){
  var r=lsGet("arq-draft");if(!r||!S.me)return;
  try{var o=JSON.parse(r);if(o&&o.u===S.me.email&&o.step==="contar"&&o.draft&&o.draft.fecha===today()&&o.draft.negocio&&S.cfg.negocios.indexOf(o.draft.negocio)>-1){S.draft=o.draft;S.step="contar";S.view="contar"}}catch(e){}
}
async function startCount(){
  var d=S.draft;if(S.starting)return;
  if(!d.negocio||!d.turno)return;
  S.starting=true;render();
  try{
    var base=await api("startCount",{negocio:d.negocio});
    d.base=base;d.id=rid("c_");d.vals={};S.step="contar";S.starting=false;initVals();render();window.scrollTo(0,0);persistDraft();
  }catch(e){S.starting=false;toast(errMsg(e));render()}
}
function diasConteo(neg){var n=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],c=S.cfg.calendario&&S.cfg.calendario[neg];return Array.isArray(c)?c.map(function(i){return n[i]}).join(", "):"todos"}
function contarHTML(){
  var d=S.draft,list=negProducts();
  if(!list.length)return '<div class="panel"><h2>No hay productos para '+esc(d.negocio)+'</h2><p class="sub">'+(isFullDay(d.negocio,d.fecha)?"Un administrador debe asignarlos en Catálogo.":(INSUMOS.indexOf(d.negocio)>-1?"Hoy no toca contar este negocio. Se cuenta los días: "+diasConteo(d.negocio)+". Si necesitas contar otro día, pídele a administración que cambie el calendario.":"Hoy solo se cuentan los productos críticos y este negocio no tiene ninguno marcado."))+'</p><button class="btn ghost" data-act="back">Volver</button></div>';
  var cards="",lastCat=null;
  list.forEach(function(p){var ct=p.cat||"";if(ct!==lastCat){cards+='<h2 class="cat" data-c="'+esc(ct)+'">'+esc(ct||"Productos")+'</h2>';lastCat=ct}cards+=cardHTML(p)});
  return '<div class="bar"><div class="bar-row"><button class="back" data-act="back">← Cambiar</button><span class="sub"><b>'+esc(d.negocio)+'</b> · '+esc(d.turno)+'</span></div>'+
    '<div class="bar-row"><span class="sub" id="prog"></span><span class="chip">'+(isFullDay(d.negocio,d.fecha)?"Conteo completo":"Solo críticos")+'</span></div><div class="meter"><i id="meter"></i></div></div>'+
    '<div class="fbox"><input id="q" class="srch" type="search" placeholder="Buscar producto…" autocomplete="off">'+filtroHTML(list)+'</div>'+
    (esLB(d.negocio)?'<div class="banner"><b>Entró:</b> lo que recibiste de la principal o sacaste del cuarto frío.<br><b>Quedan:</b> lo que dejas, contando todo: lo que está en la sandwichera y lo que está almacenado.</div>':'')+
    '<details class="help"><summary>¿Qué pongo en cada casilla?</summary><ul>'+(conDoble()?'<li><b>Había:</b> lo que hay al empezar el turno (cuéntalo).</li>':'')+'<li><b>Entró:</b> '+(esLB(d.negocio)?'lo que recibiste de la principal o sacaste del cuarto frío en tu turno (lo registrado en Movimientos).':'la mercancía que llegó en tu turno (lo registrado en Movimientos).')+'</li><li><b>Quedan:</b> '+(esLB(d.negocio)?'lo que dejas al cerrar, incluido lo de la sandwichera y lo almacenado.':'lo que cuentas ahora mismo.')+'</li></ul></details>'+
    '<div class="plist">'+cards+'</div><p class="banner" id="fempty" hidden>Ningún producto coincide con el filtro.</p>'+
    (INSUMOS.indexOf(d.negocio)>-1?'<div class="panel"><div class="field"><label class="lbl" for="cnota">¿Qué te hace falta? (opcional)</label><textarea id="cnota" rows="3" maxlength="300" placeholder="Ej. Falta cera, 2 esponjas y una lija 3000">'+esc(d.nota||"")+'</textarea><p class="hint">Administración recibe este aviso. Escribe lo que necesites, esté o no en la lista.</p></div></div>':cierreHTML());
}
function cardHTML(p){
  var v=S.draft.vals[p.id]||(S.draft.vals[p.id]={ini:"",ent:"",fin:"",src:""});
  var dbl=conDoble(),lockIni=!!v.src&&!isAdmin()&&!dbl;
  function f(k,l){return '<label class="f"><span>'+l+(k==="ini"&&lockIni?' 🔒':'')+'</span><input'+(k==="ini"&&lockIni?' readonly tabindex="-1" class="ro"':'')+' id="i-'+esc(p.id)+'-'+k+'" data-pid="'+esc(p.id)+'" data-f="'+k+'" inputmode="decimal" autocomplete="off" placeholder="0" value="'+esc(v[k])+'"></label>'}
  var u=usage(v);
  return '<section class="pcard'+(u?(u.real<0?" s-crit":" s-ok"):"")+'" id="card-'+esc(p.id)+'" data-n="'+esc(String(p.nombre).toLowerCase())+'" data-c="'+esc(p.cat||"")+'" data-z="'+(isZero(v)?"1":"")+'" data-p="'+(usage(v)?"":"1")+'"><div class="phead"><h3>'+esc(p.nombre)+'</h3><span class="unit">'+esc(p.unidad)+'</span></div>'+
    (sinEnt(p)?'<div class="grid2"><label class="f"><span>Quedan</span><input id="i-'+esc(p.id)+'-fin" data-pid="'+esc(p.id)+'" data-f="fin" inputmode="decimal" autocomplete="off" placeholder="0" value="'+esc(v.fin)+'"></label></div>':dbl?'<div class="grid3">'+f("ini","Había")+f("ent","Entró")+f("fin","Quedan")+'</div>':'<div class="grid2">'+f("ent","Entró")+f("fin","Quedan")+'</div>')+
    '<div class="res" id="res-'+esc(p.id)+'">'+usageHTML(u)+'</div><p class="note" id="note-'+esc(p.id)+'">'+noteText(v)+'</p></section>';
}
function sinEnt(p){return !!S.draft&&/^La Barra/.test(S.draft.negocio)&&/funda abierta/i.test(p.nombre||'')}
function conDoble(){return !!S.draft&&DOBLE.indexOf(S.draft.negocio)>-1}
function usage(v){
  var ini=num(v.ini),ent=num(v.ent)||0,fin=num(v.fin);
  if(!conDoble()&&!v.src){if(fin==null)return null;return {real:0,first:true}}
  if(ini==null||fin==null)return null;
  return {real:ini+ent-fin};
}
function usageHTML(u){
  if(!u)return '<span class="hint">'+(conDoble()?'Llena «Había» y «Quedan».':'Llena «Quedan».')+'</span>';
  if(u.first)return '<span class="pill ok">Listo</span><span class="hint">Primer conteo: punto de partida</span>';
  if(u.real<0)return '<span class="pill crit">Revisa</span><span class="hint">Quedan más de los que había y entraron. Cuenta de nuevo.</span>';
  return '<span class="pill ok">Listo</span><span class="hint">Salieron '+fmt(u.real)+'</span>';
}
function noteText(v){
  var a=[];
  if(conDoble()){
    if(!v.src&&!v.iniAuto&&v.ini==="")a.push("Primer conteo de este producto: escribe lo que había al empezar. Esta vez no se arquea.");
  }else if(!v.src)a.push("Primer conteo de este producto: lo que cuentes es el punto de partida. Esta vez no se arquea.");
  if(conDoble()&&v.iniAuto&&!v.iniTouched)a.push("«Había» viene del conteo del "+fmtFecha(v.iniFecha)+".");
  if(v.entAuto&&!v.entTouched)a.push("«Entró» suma lo registrado en Recibir.");
  return a.length?a.join(" "):"";
}
function updateCard(pid){
  var v=S.draft.vals[pid],u=usage(v);
  var r=document.getElementById("res-"+pid);if(r)r.innerHTML=usageHTML(u);
  var n=document.getElementById("note-"+pid);if(n)n.textContent=noteText(v);
  var cd=document.getElementById("card-"+pid);if(cd){cd.className="pcard"+(u?(u.real<0?" s-crit":" s-ok"):"");cd.dataset.z=isZero(v)?"1":"";cd.dataset.p=u?"":"1"}
}
function progress(){
  var list=negProducts(),done=0,partial=0;
  list.forEach(function(p){var v=S.draft.vals[p.id]||{};var u=usage(v);if(u)done++;else if((v.fin||"")!=="")partial++});
  return {total:list.length,done:done,partial:partial};
}
function cierreRefresh(){var e=document.getElementById('cierre');if(e){var t=document.createElement('div');t.innerHTML=cierreHTML();e.replaceWith(t.firstChild)}persistDraft();updateProgress()}
function updateProgress(){
  if(!S.draft||S.step!=="contar")return;
  var pr=progress(),g=$("#prog");if(!g)return;updateFiltroCounts();
  g.textContent=pr.done+" de "+pr.total+" listos";
  $("#meter").style.width=(pr.total?pr.done/pr.total*100:0)+"%";
  var b=$("#saveBtn"),m=$("#saveMsg");if(!b)return;
  var cok=cierreOk(S.draft),ok=pr.done>0&&pr.partial===0&&cok&&!S.saving;
  b.disabled=!ok;b.textContent=S.saving?"Guardando…":"Guardar conteo";
  m.textContent=pr.partial>0?("Falta «Había» en "+pr.partial+(pr.partial>1?" productos":" producto")):
    pr.done===0?"Cuenta al menos un producto":!cok?"Completa el cierre del turno":(pr.total-pr.done>0?"Quedan "+(pr.total-pr.done)+" sin contar; se guardan los "+pr.done+" listos":"Todo listo para guardar");
}
async function guardar(){
  if(S.saving)return;
  var d=S.draft,items=[],sin=[];
  negProducts().forEach(function(p){
    var v=d.vals[p.id],u=usage(v);
    if(u)items.push({pid:p.id,ini:(u.first?num(v.fin):num(v.ini)),ent:num(v.ent)||0,fin:num(v.fin),src:v.src||""});
    else sin.push(p.nombre);
  });
  if(!items.length)return;
  S.saving=true;updateProgress();
  try{
    await api("saveConteo",{id:d.id,fecha:d.fecha,negocio:d.negocio,turno:d.turno,items:items,sin:sin,nota:(d.nota||"").trim(),cierre:conCierre(d.negocio)?{chk:CIERRE.map(function(t,i){return !!cierreDe(d).chk[i]}),nov:cierreDe(d).nov,txt:cierreDe(d).nov==='si'?cierreDe(d).txt.trim():'',cafe:conCafe(d.negocio)?cierreDe(d).cafe:undefined,fz:conFreezer(d.negocio)?cierreDe(d).fz:undefined}:null});
    S.saved={negocio:d.negocio,turno:d.turno,fecha:d.fecha,n:items.length,sin:sin.length,ini:items.every(function(i){return !i.src})};
    S.step="listo";clearDraft();S.saving=false;render();window.scrollTo(0,0);refresh(true);
  }catch(e){
    S.saving=false;
    if(e.code==="duplicado"){toast(errMsg(e));S.step="elegir";clearDraft();render()}
    else{updateProgress();toast(errMsg(e))}
  }
}
function listoHTML(){
  var s=S.saved;
  return '<div class="panel center"><div class="big">✓</div><h1>Conteo guardado</h1><p class="sub">'+esc(s.negocio)+' · '+esc(s.turno)+' · '+fmtFecha(s.fecha)+'</p>'+
    '<p class="sub">'+s.n+' productos contados'+(s.sin?" y "+s.sin+" sin contar":"")+(s.ini?'. Este es tu conteo inicial: sirve de punto de partida y no necesita ventas. El arqueo empieza con tu próximo conteo.':'. Administración ya fue avisada para registrar las ventas y hacer el arqueo.')+'</p></div>'+
    '<div class="btnrow"><button class="btn" data-act="again">Hacer otro conteo</button><button class="btn ghost" data-act="go" data-v="mios">Ver mis conteos</button></div>';
}

/* ---------- recibir mercancía ---------- */
function movPend(){
  var n=0;if(!S.cfg||!S.movs)return 0;
  S.movs.forEach(function(m){if(m.tipo==="traspaso"&&m.estado==="enviado"&&S.cfg.negocios.indexOf(m.destino)>-1)n++});return n;
}
function movName(m,i){
  var mine=S.cfg.negocios.indexOf(m.negocio)>-1;
  var p=prodById((!mine&&i.dpid)?i.dpid:i.pid)||prodById(i.pid)||prodById(i.dpid);
  return p?p.nombre:i.pid;
}
function movItemsText(m,items){return (items||m.items||[]).map(function(i){return esc(movName(m,i))+" "+fmt(i.qty)}).join(" · ")}
function entrantesHTML(){
  var inc=S.movs.filter(function(m){return m.tipo==="traspaso"&&m.estado==="enviado"&&S.cfg.negocios.indexOf(m.destino)>-1});
  if(!inc.length)return "";
  return '<div class="panel"><div><h3>Traspasos por recibir ('+inc.length+')</h3><p class="sub">Confirma lo que realmente llegó. Si falta algo, cambia la cantidad: administración recibe el aviso.</p></div>'+
    inc.map(function(m){
      var t=S.rec.tr[m.id]||{};
      var rows=m.items.map(function(i){var v=t[i.pid]!=null?t[i.pid]:i.qty;
        return '<div class="rline" style="grid-template-columns:minmax(0,1fr) 96px"><div><b>'+esc(movName(m,i))+'</b><small>Salió '+fmt(i.qty)+'</small></div><input inputmode="decimal" autocomplete="off" aria-label="Recibido de '+esc(movName(m,i))+'" data-tq="'+esc(m.id)+'|'+esc(i.pid)+'" value="'+esc(v)+'"></div>'}).join("");
      return '<div class="pitem" style="flex-direction:column;align-items:stretch;gap:10px"><div><b>De '+esc(m.negocio)+' a '+esc(m.destino)+'</b><small>'+fmtFecha(m.fecha)+' '+hora(m.ts)+' · lo envió '+esc(m.resp)+'</small></div>'+rows+
        '<button class="btn" data-act="tr-recv" data-id="'+esc(m.id)+'">Confirmar recibido</button></div>';
    }).join("")+'</div>';
}
function modoDe(){return S.rec.modo||"entrada"}
function recibirHTML(){
  var r=S.rec,modo=modoDe();
  var negs=S.cfg.negocios.map(function(n,i){return '<button class="neg'+(r.negocio===n?" on":"")+'" data-act="rneg" data-v="'+i+'">'+esc(n)+'</button>'}).join("");
  var modos=[["entrada","Entrada"],["merma","Merma"],["traspaso","Traspaso"]].map(function(x){return '<button class="'+(modo===x[0]?"on":"")+'" data-act="rmodo" data-v="'+x[0]+'">'+x[1]+'</button>'}).join("");
  var campos="",titulo="Registrar entrada",sub="Anota la mercancía que llega o que metes para abastecer el turno. Se suma sola en «Entró» del próximo conteo.",lblLista="Lo que entró";
  if(modo==="entrada"){
    var lb=esLB(r.negocio),ops=lb?["Principal","Cuarto frío","Proveedor"]:["Proveedor","Cocina"];
    if(ops.indexOf(r.origen)<0)r.origen=ops[0];
    var interno=(r.origen!=="Proveedor");
    var og=ops.map(function(o){return '<option value="'+o+'"'+(r.origen===o?" selected":"")+'>'+(lb&&o==="Principal"?"De la principal":(lb&&o==="Cuarto frío"?"Del cuarto frío":o))+'</option>'}).join("");
    if(lb)sub="Anota lo que recibiste de la principal o sacaste del cuarto frío. Se suma sola en «Entró» de tu próximo conteo.";
    campos='<div class="field"><label class="lbl" for="rorigen">¿De dónde viene?</label><select id="rorigen">'+og+'</select></div>'+
      '<div class="field"><label class="lbl" for="rnota">'+(interno?"Nota (opcional)":"Factura o proveedor")+'</label><input id="rnota" autocomplete="off" value="'+esc(r.nota)+'" placeholder="'+(interno?"Ej. Reabasto turno 2":"Ej. Factura 1234 · Distribuidora")+'"></div>';
  }else if(modo==="merma"){
    titulo="Registrar merma";lblLista="Lo que se perdió";
    sub="Anota lo que sale sin ser una venta. Así el arqueo no lo cuenta como faltante.";
    var mo='<option value="">— Elige el motivo —</option>'+S.motivos.map(function(x){return '<option value="'+esc(x)+'"'+(r.motivo===x?" selected":"")+'>'+esc(x)+'</option>'}).join("");
    var need=(r.motivo==="Se dañó"||r.motivo==="Otros");
    campos='<div class="field"><label class="lbl" for="rmotivo">Motivo</label><select id="rmotivo">'+mo+'</select></div>'+
      '<div class="field"><label class="lbl" for="rdet">'+(r.motivo==="Se dañó"?"¿Por qué se dañó? (obligatorio)":(r.motivo==="Otros"?"Explica el motivo (obligatorio)":"Detalle (opcional)"))+'</label><input id="rdet" autocomplete="off" value="'+esc(r.detalle)+'" placeholder="'+(r.motivo==="Se dañó"?"Ej. Se calentó por falla de la nevera":"Ej. Se cayó la caja")+'"></div>'+(need?'<p class="note">Administración recibe este aviso.</p>':"");
  }else{
    titulo="Registrar traspaso";lblLista="Lo que envías";
    sub="Producto que sale de un negocio hacia otro. El otro negocio debe confirmar lo que recibió.";
    var otros=S.cfg.todosNegocios.filter(function(n){return n!==r.negocio});
    var dd='<option value="">— ¿A cuál negocio? —</option>'+otros.map(function(n){return '<option value="'+esc(n)+'"'+(r.destino===n?" selected":"")+'>'+esc(n)+'</option>'}).join("");
    campos='<div class="field"><label class="lbl" for="rdest">Lo recibe</label><select id="rdest">'+dd+'</select></div>'+
      '<div class="field"><label class="lbl" for="rnota">Nota (opcional)</label><input id="rnota" autocomplete="off" value="'+esc(r.nota)+'" placeholder="Ej. Cervezas para el evento"></div>';
  }
  var form="";
  if(r.negocio){
    form='<div class="field"><label class="lbl" for="rq">Agregar producto</label><input id="rq" type="search" autocomplete="off" placeholder="Buscar producto…" value="'+esc(r.q)+'"></div>'+
      '<div class="plist" id="rres">'+recSearchHTML()+'</div>'+
      '<div class="lbl">'+lblLista+'</div><div class="plist" id="rlines">'+recLinesHTML()+'</div>'+campos+
      '<button class="btn" id="rbtn" data-act="rec-save" disabled>Registrar</button><p class="savemsg" id="rmsg"></p>';
  }
  return entrantesHTML()+'<div class="panel"><div><h1>'+titulo+'</h1><p class="sub">'+sub+'</p></div>'+
    '<div class="seg">'+modos+'</div>'+
    '<div class="lbl">Negocio</div><div class="negs">'+negs+'</div>'+form+'</div>'+
    (r.negocio?'<div><div class="lbl" style="margin-bottom:8px">Últimos registros en '+esc(r.negocio)+'</div><div class="plist" id="rrecent">'+recentHTML()+'</div></div>':"");
}
function recSearchHTML(){
  var r=S.rec,list=prodsFor(r.negocio),q=r.q.trim().toLowerCase(),used={};
  r.lines.forEach(function(l){used[l.pid]=1});
  var m=list.filter(function(p){return !used[p.id]&&(q?String(p.nombre).toLowerCase().indexOf(q)>-1:list.length<=25)}).slice(0,q?10:25);
  if(!m.length)return q?'<p class="hint">No hay productos con ese nombre.</p>':(list.length>25?'<p class="hint">Escribe para buscar entre '+list.length+' productos.</p>':'');
  return m.map(function(p){return '<button type="button" class="rres" data-act="rec-add" data-id="'+esc(p.id)+'">+ '+esc(p.nombre)+(p.cat?'<small>'+esc(p.cat)+'</small>':'')+'</button>'}).join("");
}
function recLinesHTML(){
  var r=S.rec;
  if(!r.lines.length)return '<p class="hint">Aún no has agregado productos.</p>';
  return r.lines.map(function(l){
    var p=prodById(l.pid);if(!p)return"";
    return '<div class="rline"><div><b>'+esc(p.nombre)+'</b><small>'+esc(p.unidad)+'</small></div><input inputmode="decimal" autocomplete="off" placeholder="0" aria-label="Cantidad de '+esc(p.nombre)+'" data-rq="'+esc(l.pid)+'" value="'+esc(l.qty)+'"><button type="button" class="rx" data-act="rec-del" data-id="'+esc(l.pid)+'" aria-label="Quitar">✕</button></div>';
  }).join("");
}
function itemsText(items){return (items||[]).map(function(i){var p=prodById(i.pid);return esc(p?p.nombre:i.pid)+" "+fmt(i.qty)}).join(" · ")}
function recentHTML(){
  var r=S.rec,modo=modoDe();if(!r.negocio)return"";
  var del=function(act,id){return isAdmin()?'<button class="btn small ghost" data-act="'+act+'" data-id="'+esc(id)+'">Anular</button>':""};
  if(modo==="entrada"){
    var l=S.entradas.filter(function(e){return e.negocio===r.negocio}).slice(0,6);
    if(!l.length)return '<p class="hint">Todavía no hay entradas registradas para este negocio.</p>';
    return l.map(function(e){
      return '<div class="pitem"><div><b>'+fmtFecha(e.fecha)+' '+hora(e.ts)+' · '+esc(e.resp)+'</b><small>'+itemsText(e.items)+'</small><small>'+esc(e.origen||"Proveedor")+(e.nota?' · '+esc(e.nota):"")+'</small></div>'+del("rec-del-ent",e.id)+'</div>';
    }).join("");
  }
  var l2=S.movs.filter(function(m){return m.tipo===modo&&(m.negocio===r.negocio||(modo==="traspaso"&&m.destino===r.negocio))}).slice(0,6);
  if(!l2.length)return '<p class="hint">Todavía no hay '+(modo==="merma"?"mermas":"traspasos")+' registrados para este negocio.</p>';
  return l2.map(function(m){
    if(modo==="merma")return '<div class="pitem"><div><b>'+fmtFecha(m.fecha)+' '+hora(m.ts)+' · '+esc(m.motivo)+'</b><small>'+movItemsText(m)+'</small><small>'+esc(m.resp)+(m.detalle?' · '+esc(m.detalle):"")+'</small></div>'+del("mov-del",m.id)+'</div>';
    var st=m.estado==="recibido"?'<span class="st ok">✓ Recibido '+hora(m.recTs)+' por '+esc(m.recPor)+'</span>':'<span class="st wait">Por confirmar</span>';
    return '<div class="pitem"><div><b>'+esc(m.negocio)+' → '+esc(m.destino)+'</b><small>'+fmtFecha(m.fecha)+' '+hora(m.ts)+' · '+esc(m.resp)+'</small><small>'+movItemsText(m)+'</small><small>'+st+'</small></div>'+del("mov-del",m.id)+'</div>';
  }).join("");
}
function recValid(){var r=S.rec;if(!r.negocio)return 0;var n=0;r.lines.forEach(function(l){var q=num(l.qty);if(q&&q>0)n++});return n}
function recMsg(){
  var r=S.rec,m=modoDe(),n=recValid();
  if(!r.lines.length)return "Agrega al menos un producto";
  if(!n)return "Pon la cantidad de cada producto";
  if(m==="merma"){
    if(!r.motivo)return "Elige el motivo";
    if((r.motivo==="Se dañó"||r.motivo==="Otros")&&(r.detalle||"").trim().length<5)return r.motivo==="Se dañó"?"Explica por qué se dañó":"Explica el motivo";
  }
  if(m==="traspaso"&&!r.destino)return "Elige el negocio que recibe";
  return "";
}
function updateRecBtn(){
  var b=$("#rbtn");if(!b)return;
  var r=S.rec,m=$("#rmsg"),msg=recMsg(),modo=modoDe();
  var lab={entrada:"Registrar entrada",merma:"Registrar merma",traspaso:"Enviar traspaso"}[modo];
  b.disabled=!!msg||r.saving;b.textContent=r.saving?"Guardando…":lab;
  if(m)m.textContent=msg;
}
async function registrarEntrada(){
  var r=S.rec,items=[],modo=modoDe();
  if(r.saving||recMsg())return;
  r.lines.forEach(function(l){var q=num(l.qty);if(prodById(l.pid)&&q&&q>0)items.push({pid:l.pid,qty:q})});
  if(!r.negocio||!items.length)return;
  r.saving=true;updateRecBtn();
  try{
    if(modo==="entrada")await api("addEntrada",{id:r.eid||(r.eid=rid("e_")),negocio:r.negocio,origen:r.origen,nota:(r.nota||"").trim(),items:items});
    else if(modo==="merma")await api("addMerma",{id:r.eid||(r.eid=rid("m_")),negocio:r.negocio,motivo:r.motivo,detalle:(r.detalle||"").trim(),items:items});
    else await api("addTraspaso",{id:r.eid||(r.eid=rid("m_")),negocio:r.negocio,destino:r.destino,detalle:(r.nota||"").trim(),items:items});
    r.lines=[];r.nota="";r.detalle="";r.motivo="";r.q="";r.eid=null;r.saving=false;
    toast(modo==="entrada"?"Entrada registrada":(modo==="merma"?"Merma registrada":"Traspaso enviado"));await refresh(true);render();
  }catch(e){r.saving=false;updateRecBtn();toast(errMsg(e))}
}
async function confirmarTraspaso(id){
  var m=S.movs.filter(function(x){return x.id===id})[0];if(!m)return;
  var t=S.rec.tr[id]||{},items=m.items.map(function(i){var v=t[i.pid]!=null?num(t[i.pid]):i.qty;return {pid:i.pid,qty:v==null?0:v}});
  var dif=items.some(function(i,k){return Math.abs(i.qty-m.items[k].qty)>1e-9});
  if(dif&&!confirm("Marcaste una cantidad distinta a la que salió. Administración recibirá el aviso. ¿Confirmar?"))return;
  try{await api("recibirTraspaso",{id:id,items:items});delete S.rec.tr[id];toast("Traspaso recibido");await refresh(true);render()}
  catch(e){toast(errMsg(e))}
}

/* ---------- mis conteos ---------- */
function estadoChip(c){
  if(c.estado==="contado")return '<span class="pill rev">Esperando ventas</span>';
  if(c.estado==="inicial")return '<span class="pill">Conteo inicial</span>';
  if(c.estado==="arqueado")return '<span class="pill ok">Arqueado</span>';
  if(c.estado==="anulado")return '<span class="pill crit">Anulado</span>';
  return "";
}
function miosHTML(){
  var list=S.conteos.slice(0,40).map(function(c){
    return '<div class="pitem"><div><b>'+esc(c.negocio)+' · '+esc(c.turno)+'</b><small>'+fmtFecha(c.fecha)+' '+hora(c.ts)+' · '+esc(c.resp)+'</small></div>'+estadoChip(c)+'</div>';
  }).join("")||'<div class="panel"><p class="sub">Todavía no hay conteos en los últimos días.</p></div>';
  return '<div><h1>Mis conteos</h1><p class="sub">Los conteos de tus negocios en los últimos 14 días.</p></div>'+hoyHTML()+'<div class="plist">'+list+'</div>';
}

/* ---------- filtros: categorías / pendientes / en 0 ---------- */
function isZero(v){v=v||{};return (v.fin||"")!==""&&num(v.fin)===0}
function catsOf(list){var o=[],seen={};list.forEach(function(p){var c=p.cat||"";if(!seen[c]){seen[c]=1;o.push(c)}});return o}
function filtroHTML(list){
  var d=S.draft,cs=catsOf(list),chips="";
  if(cs.length>1){
    chips+='<div class="field"><label class="lbl" for="fcat-sel">Categoría</label><select id="fcat-sel"><option value="-1">Todas las categorías</option>';
    cs.forEach(function(c,i){chips+='<option value="'+i+'" data-c="'+esc(c)+'"'+(d.fcat===c?" selected":"")+'>'+esc(c||"Otros")+'</option>'});
    chips+='</select></div>';
  }
  chips+='<div class="fchips" id="fmodes">'+
    '<button type="button" class="tchip sm'+(d.fmode==="pend"?" on":"")+'" data-act="fmode" data-v="pend">Sin contar <small id="fm-pend"></small></button>'+
    '<button type="button" class="tchip sm'+(d.fmode==="cero"?" on":"")+'" data-act="fmode" data-v="cero">Productos en 0 <small id="fm-cero"></small></button></div>';
  return chips;
}
function updateFiltroCounts(){
  if(!S.draft||S.step!=="contar")return;
  var d=S.draft,list=negProducts(),cs=catsOf(list),st={},z=0,pe=0;
  list.forEach(function(p){var c=p.cat||"",e=st[c]||(st[c]={t:0,d:0}),v=d.vals[p.id]||{};e.t++;if(usage(v))e.d++;else pe++;if(isZero(v))z++});
  var sel=document.getElementById("fcat-sel");if(sel)cs.forEach(function(c,i){var o=sel.options[i+1];if(o)o.textContent=(c||"Otros")+" ("+st[c].d+"/"+st[c].t+")"});
  var a=document.getElementById("fm-pend"),b=document.getElementById("fm-cero");
  if(a)a.textContent="("+pe+")";if(b)b.textContent="("+z+")";
}
function applyFilter(){
  var d=S.draft;if(!d)return;
  var q=((document.getElementById("q")||{}).value||"").trim().toLowerCase();
  var cards=document.querySelectorAll(".pcard"),heads=document.querySelectorAll(".plist .cat");
  var vis={};
  cards.forEach(function(c){
    var ok=true;
    if(q&&c.dataset.n.indexOf(q)<0)ok=false;
    if(ok&&d.fcat!=null&&c.dataset.c!==d.fcat)ok=false;
    if(ok&&d.fmode==="cero"&&c.dataset.z!=="1")ok=false;
    if(ok&&d.fmode==="pend"&&c.dataset.p!=="1")ok=false;
    c.hidden=!ok;if(ok)vis[c.dataset.c]=true;
  });
  heads.forEach(function(h){h.hidden=!vis[h.dataset.c]});
  var e=document.getElementById("fempty");
  var any=Object.keys(vis).length>0;
  if(e)e.hidden=any;
  document.querySelectorAll("#fmodes [data-act]").forEach(function(b){
    var on=d.fmode===b.dataset.v;
    b.classList.toggle("on",!!on);
  });
  updateFiltroCounts();
}

/* ---------- bandeja de ventas (administración) ---------- */
function haceTxt(ts){
  var m=Math.max(0,Math.round((Date.now()-ts)/60000));
  if(m<60)return "hace "+m+" min";
  var h=Math.round(m/60);if(h<48)return "hace "+h+" h";
  return "hace "+Math.round(h/24)+" días";
}
function porCompletar(){
  var h=today(),hm=nowHM(),rows=[],seen={};
  var first=h;S.conteos.forEach(function(c){if(c.estado!=="anulado"&&c.fecha<first)first=c.fecha});
  var from=addDays(h,-2);if(from<first)from=first;
  var f=h,days=[];while(f>=from){days.push(f);f=addDays(f,-1)}
  days.forEach(function(fe){
    S.cfg.negocios.forEach(function(n){
      turnosFor(n).forEach(function(t){
        var c=S.conteos.filter(function(x){return x.negocio===n&&x.turno===t&&x.fecha===fe&&x.estado!=="anulado"})[0];
        var lim=limiteDe(n,t);
        if(c){seen[c.id]=1;
          if(fe!==h&&c.estado!=="contado")return;
          rows.push({k:c.estado==="contado"?"ventas":(c.estado==="arqueado"?"ok":"ini"),n:n,t:t,fe:fe,c:c,lim:lim});
        }else if(fe===h){
          var late=lim&&hm>lim;
          rows.push({k:late?"atraso":"falta",n:n,t:t,fe:fe,lim:lim});
        }else rows.push({k:"atraso",n:n,t:t,fe:fe,lim:lim,past:true});
      });
    });
  });
  S.conteos.forEach(function(c){if(c.estado==="contado"&&!seen[c.id])rows.push({k:"ventas",n:c.negocio,t:c.turno,fe:c.fecha,c:c,lim:""})});
  var ord={atraso:0,ventas:1,falta:2,ok:3,ini:4};
  rows.sort(function(a,b){return (ord[a.k]-ord[b.k])||(a.fe<b.fe?1:a.fe>b.fe?-1:0)});
  return rows;
}
/* Recordatorio por WhatsApp: abre el chat con el mensaje ya escrito (no envía solo) */
function waNum(t){var d=String(t||"").replace(/\D/g,"");return d.length===10?"1"+d:d}
function waBtns(r){
  if(!(role()==="admin"||role()==="supervisor"))return "";
  var gente=(S.contactos||[]).filter(function(c){return (c.rol==="lider"||c.rol==="colaborador")&&(c.negocios||[]).indexOf(r.n)>-1});
  if(!gente.length)return isAdmin()?'<small class="hint">Sin teléfonos de '+esc(r.n)+'. Agrégalos en Equipo para avisar por WhatsApp.</small>':"";
  var url=location.origin+location.pathname;
  return '<div class="wabox">'+gente.map(function(c){
    var msg="Hola "+c.nombre.split(" ")[0]+", aún no aparece el conteo de "+r.n+" · "+r.t+" de hoy"+(r.lim?" (límite "+r.lim+")":"")+". Por favor cuéntalo y confirma el cierre del turno en: "+url;
    return '<a class="btn small wa" target="_blank" rel="noopener" href="https://wa.me/'+waNum(c.telefono)+'?text='+encodeURIComponent(msg)+'">WhatsApp · '+esc(c.nombre.split(" ")[0])+'</a>'}).join("")+'</div>';
}
function pendHTML(){
  var rows=porCompletar(),h=today();
  var nSin=0,nVen=0,nOk=0;
  rows.forEach(function(r){if(r.k==="atraso"||r.k==="falta")nSin++;else if(r.k==="ventas")nVen++;else nOk++});
  var resumen='<div class="stat"><div class="sbox'+(nSin?" bad":"")+'"><b>'+nSin+'</b><span>Sin contar</span></div><div class="sbox'+(nVen?" bad":"")+'"><b>'+nVen+'</b><span>Esperando ventas</span></div></div>';
  var html=rows.map(function(r){
    var c=r.c,dia=r.fe===h?"":" · "+fmtFecha(r.fe);
    var title='<b>'+esc(r.n)+' · '+esc(r.t)+'</b>';
    if(r.k==="ventas"){
      var late=Date.now()-c.ts>12*3600000;
      return '<div class="pitem"><div>'+title+'<small>Contó '+esc(c.resp)+dia+' · <span'+(late?' class="hi"':"")+'>'+haceTxt(c.ts)+'</span></small><small><span class="st wait">Falta cargar ventas para arquear</span></small></div><button class="btn small" data-act="vs-open" data-id="'+esc(c.id)+'">Registrar ventas</button></div>';
    }
    if(r.k==="ok"){
      var rs=c.resumen||{};
      return '<button class="pitem" style="width:100%;text-align:left" data-act="det-open" data-id="'+esc(c.id)+'"><div>'+title+'<small><span class="st ok">✓ Arqueado</span>'+dia+'</small></div><div>'+(rs.crit?'<span class="pill crit">'+rs.crit+' crítico</span>':(rs.rev?'<span class="pill rev">'+rs.rev+' revisar</span>':'<span class="pill ok">Todo OK</span>'))+'</div></button>';
    }
    if(r.k==="ini"){
      return '<div class="pitem"><div>'+title+'<small><span class="st ok">✓ Conteo inicial</span>'+dia+' · no necesita ventas</small></div></div>';
    }
    if(r.k==="atraso")return '<div class="pitem"><div>'+title+'<small><span class="st late">Atrasado: sin contar</span>'+dia+(r.lim&&!r.past?' · límite '+r.lim:"")+'</small>'+waBtns(r)+'</div></div>';
    return '<div class="pitem"><div>'+title+'<small><span class="st wait">Sin contar · hasta '+(r.lim||"fin del día")+'</span></small>'+waBtns(r)+'</div></div>';
  }).join("");
  if(!rows.length)html='<div class="panel center"><div class="big">✓</div><h3>Todo al día</h3><p class="sub">No hay turnos configurados con conteo hoy.</p></div>';
  return '<div><h1>Por completar</h1><p class="sub">Cada conteo se arquea con sus propias ventas: no espera a los demás. Aquí ves qué falta por contar y qué falta por arquear.</p></div>'+
    resumen+'<div class="plist">'+html+'</div>'+
    '<button class="btn ghost" data-act="campo-on">Hacer un conteo o registrar entrada</button>';
}

/* ---------- registrar ventas ---------- */
function similar(a,b){
  function cl(s){return normClave(s).replace(/\b(fs|zp|inventario|botella|plastica|fardo|caja|x\d+|de|con)\b/g," ").replace(/\s+/g," ").trim()}
  a=cl(a);b=cl(b);if(!a||!b)return 0;if(a===b)return 1;
  function bg(s){var m={},n=0;for(var i=0;i<s.length-1;i++){var k=s.substr(i,2);m[k]=(m[k]||0)+1;n++}return {m:m,n:n}}
  var x=bg(a),y=bg(b),hit=0;
  Object.keys(x.m).forEach(function(k){if(y.m[k])hit+=Math.min(x.m[k],y.m[k])});
  return x.n+y.n?2*hit/(x.n+y.n):0;
}
function parseCSV(text){
  var rows=[],row=[],cur="",q=false;
  text=String(text).replace(/^﻿/,"");
  for(var i=0;i<text.length;i++){
    var c=text.charAt(i);
    if(q){if(c==='"'){if(text.charAt(i+1)==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;
    else if(c===","||c===";"){row.push(cur);cur=""}
    else if(c==="\n"){row.push(cur);rows.push(row);row=[];cur=""}
    else if(c!=="\r")cur+=c;
  }
  if(cur!==""||row.length){row.push(cur);rows.push(row)}
  return rows;
}
function parseQty(s){s=String(s).trim().replace(/,/g,"");return /^-?\d+(\.\d+)?$/.test(s)?parseFloat(s):null}
function parseCitrus(text){
  var out=[];
  parseCSV(text).forEach(function(r){
    if(r.length<2)return;
    var q=parseQty(r[r.length-1]),name=String(r[0]).trim();
    if(q==null||!name||q<0)return;
    out.push({name:name,q:q});
  });
  return out;
}
function nameIndex(){
  var m={};
  S.productos.forEach(function(p){m[normClave(p.nombre)]=p.id});
  return m;
}
function groupTramos(c){
  var g={},order=[];
  c.items.forEach(function(it){
    var k=it.src||"_ini";
    if(!g[k]){g[k]={key:k,items:[],set:{},info:c.srcInfo&&c.srcInfo[k]};order.push(k)}
    g[k].items.push(it.pid);g[k].set[it.pid]=1;
  });
  order.sort(function(a,b){var x=g[a].info?g[a].info.ts:0,y=g[b].info?g[b].info.ts:0;return x-y});
  return order.map(function(k){return g[k]});
}
function tramoLabel(t,c){
  if(t.key==="_ini")return "Sin conteo previo";
  var i=t.info;
  return i?("Ventas desde "+fmtFecha(i.fecha)+" · "+i.turno+" hasta este conteo"):"Ventas del período";
}
async function openVentas(id){
  S.vs={id:id,loading:true};S.detail=null;render();window.scrollTo(0,0);
  try{
    var r=await Promise.all([api("getConteo",{id:id}),S.aliases?Promise.resolve(S.aliases):api("aliases")]);
    S.aliases=r[1];
    var c=r[0],vs=S.vs;
    if(c.estado==="anulado"){S.vs=null;toast("Ese conteo está anulado.");render();return}
    vs.loading=false;vs.c=c;vs.tramos=groupTramos(c);vs.vals={};vs.auto0={};vs.touched={};vs.csv={};vs.assign={};vs.confirm=false;vs.q="";
    var real=!!(c.ventas&&Object.keys(c.ventas).length);
    c.items.forEach(function(it){if(real&&c.ventas[it.pid]!=null){vs.vals[it.pid]=fmtRaw(c.ventas[it.pid])}});
    render();
  }catch(e){S.vs=null;toast(errMsg(e));render()}
}
function applyCsv(key,text,fname){
  var vs=S.vs,rows=parseCitrus(text);
  if(!rows.length){toast("No encontré ventas en ese archivo. Debe ser el reporte «Ventas por producto» de Citrus en CSV.");return}
  vs.csv[key]={name:fname,rows:rows};recomputeTramo(key);
}
function recomputeTramo(key){
  var vs=S.vs,csv=vs.csv[key],t=vs.tramos.filter(function(x){return x.key===key})[0];
  if(!csv||!t)return;
  var sums={},uns={},fuera=0,ign=0,asg=0,idx=nameIndex(),names=t.items.map(function(pid){var p=prodById(pid);return {pid:pid,n:p?p.nombre:pid}});
  csv.rows.forEach(function(r){
    var k=normClave(r.name),pid=vs.assign[k]!=null?vs.assign[k]:(S.aliases[k]!=null?S.aliases[k]:idx[k]);
    if(pid==="-"){ign++;return}
    if(pid){if(t.set[pid]){sums[pid]=(sums[pid]||0)+r.q;asg++}else fuera++;return}
    var u=uns[k]||(uns[k]={key:k,name:r.name,q:0});u.q+=r.q;
  });
  var list=Object.keys(uns).map(function(k){
    var u=uns[k],sc=names.map(function(x){return {pid:x.pid,n:x.n,s:similar(u.name,x.n)}}).sort(function(a,b){return b.s-a.s}).slice(0,5);
    u.sug=sc.filter(function(x){return x.s>=0.35});u.best=sc.length?sc[0].s:0;return u;
  });
  csv.por=list.filter(function(u){return u.best>=0.55}).sort(function(a,b){return b.q-a.q}).slice(0,40);
  csv.otros=list.filter(function(u){return u.best<0.55});
  csv.stats={asg:asg,fuera:fuera,ign:ign,total:csv.rows.length};
  t.items.forEach(function(pid){
    if(vs.touched[pid])return;
    if(sums[pid]!=null){vs.vals[pid]=fmtRaw(sums[pid]);vs.auto0[pid]=false}
    else{vs.vals[pid]="0";vs.auto0[pid]=true}
  });
}
function vsItems(){return S.vs.c.items.filter(function(i){return i.src})}
function ventasHTML(){
  var vs=S.vs;
  if(vs.loading)return '<div class="loading">Cargando conteo…</div>';
  var c=vs.c;
  var head='<div class="bar"><div class="bar-row"><button class="back" data-act="vs-back">← Volver</button><span class="sub"><b>'+esc(c.negocio)+'</b> · '+esc(c.turno)+' · '+fmtFecha(c.fecha)+'</span></div></div>'+
    '<div><h1>Registrar ventas</h1><p class="sub">Contó '+esc(c.resp)+'. Sube el CSV de Citrus del período indicado o escribe las unidades vendidas.</p></div>';
  var body="";
  vs.tramos.forEach(function(t){
    if(t.key==="_ini"){
      body+='<div class="panel"><h3>Sin conteo previo</h3><p class="sub">'+t.items.length+' productos no tenían un conteo anterior. Quedan guardados como inventario inicial y se arquean desde el próximo conteo.</p></div>';
      return;
    }
    var csv=vs.csv[t.key],items=t.items.map(function(pid){return c.items.filter(function(i){return i.pid===pid})[0]});
    var stats=csv?'<p class="note">Archivo «'+esc(csv.name)+'»: '+csv.stats.total+' filas leídas · '+csv.stats.asg+' asignadas a productos de este conteo · '+csv.stats.fuera+' de otros productos · '+csv.stats.ign+' ignoradas.</p>':"";
    var uns="";
    if(csv&&csv.por.length){
      uns='<div class="lbl">Revisa estos nombres de Citrus ('+csv.por.length+')</div>'+csv.por.map(function(u){
        var cur=vs.assign[u.key];
        var opts='<option value="">— ¿Qué producto es? —</option>'+u.sug.map(function(x){return '<option value="'+esc(x.pid)+'"'+(cur===x.pid?" selected":"")+'>'+esc(x.n)+'</option>'}).join("")+'<option value="-"'+(cur==="-"?" selected":"")+'>No es de esta lista (ignorar)</option>';
        return '<div class="ualloc"><div><b>'+esc(u.name)+'</b> <span class="mini">· '+fmt(u.q)+' vendidas</span>'+(/inventario/i.test(u.name)?'<div class="mini hi">Dice INVENTARIO: confirma que es de este negocio antes de asignarlo.</div>':"")+'</div><select data-asg="'+esc(u.key)+'" data-tr="'+esc(t.key)+'">'+opts+'</select></div>';
      }).join("");
    }
    if(csv&&csv.otros.length)uns+='<div class="ualloc"><span class="mini">'+csv.otros.length+' filas del archivo no se parecen a ningún producto de este conteo.</span><button class="btn small ghost" data-act="vs-ign" data-tr="'+esc(t.key)+'">Ignorarlas y no volver a preguntar</button></div>';
    var rows=items.map(function(it){
      var real=it.ini+it.ent-it.fin,a0=vs.auto0[it.pid];
      return '<div class="vrow'+(a0?" auto0":"")+'" data-n="'+esc(String(it.nombre).toLowerCase())+'"><div><b>'+esc(it.nombre)+'</b><small>Salieron '+fmt(real)+' '+esc(it.unidad)+' (había '+fmt(it.ini)+', entró '+fmt(it.ent)+', quedan '+fmt(it.fin)+')'+(a0?' · no aparece en el archivo':'')+'</small></div>'+
        '<input inputmode="decimal" autocomplete="off" placeholder="Vendido" aria-label="Vendido de '+esc(it.nombre)+'" data-vq="'+esc(it.pid)+'" value="'+esc(vs.vals[it.pid]==null?"":vs.vals[it.pid])+'"></div>';
    }).join("");
    body+='<div class="panel"><div><h3>'+esc(tramoLabel(t,c))+'</h3><p class="sub">'+items.length+' productos. Todo el reporte debe cubrir exactamente ese período.</p></div>'+
      '<label class="fileb"><input type="file" accept=".csv,.txt,text/csv,text/plain" data-csv="'+esc(t.key)+'">'+(csv?"Cambiar archivo CSV":"Subir CSV de Citrus")+'</label>'+stats+uns+
      '<div><div class="lbl">Unidades vendidas por producto</div>'+rows+'</div></div>';
  });
  var srch='<input id="vq" class="srch" type="search" placeholder="Buscar producto…" autocomplete="off" value="'+esc(vs.q)+'">';
  return head+srch+body;
}
function vsCounts(){
  var vs=S.vs,blank=0,n=0;
  vsItems().forEach(function(i){n++;if(vs.vals[i.pid]==null||vs.vals[i.pid]==="")blank++});
  return {n:n,blank:blank};
}
function updateVsFoot(){
  if(!S.vs||S.vs.loading)return;
  var k=vsCounts(),b=$("#vsBtn"),m=$("#vsMsg");if(!b)return;
  b.disabled=S.vs.saving;
  b.textContent=S.vs.saving?"Calculando…":(S.vs.confirm?"Sí, calcular con esos ceros":(k.n?"Calcular arqueo":"Guardar"));
  m.textContent=k.blank?(S.vs.confirm?k.blank+" productos sin dato se tomarán como 0 vendidos":k.blank+" de "+k.n+" productos sin dato"):"Todo listo";
}
async function calcVentas(){
  var vs=S.vs,k=vsCounts();
  if(vs.saving)return;
  if(k.blank&&!vs.confirm){vs.confirm=true;updateVsFoot();return}
  var ventas={};
  vsItems().forEach(function(i){var q=num(vs.vals[i.pid]);ventas[i.pid]=q==null?0:q});
  vs.saving=true;updateVsFoot();
  try{
    var map={};
    Object.keys(vs.assign).forEach(function(key){
      var pid=vs.assign[key];if(!pid)return;
      var orig=key;
      Object.keys(vs.csv).forEach(function(tk){(vs.csv[tk].rows||[]).forEach(function(r){if(normClave(r.name)===key)orig=r.name})});
      map[key]={pid:pid,original:orig};
      S.aliases[key]=pid;
    });
    if(Object.keys(map).length)await api("saveAliases",{map:map});
    var r=await api("saveVentas",{id:vs.id,ventas:ventas});
    var id=vs.id;S.vs=null;toast("Arqueo calculado");
    await refresh(true);openDetalle(id);
  }catch(e){vs.saving=false;vs.confirm=false;updateVsFoot();toast(errMsg(e))}
}

/* ---------- resultados ---------- */
function inRange(f){
  var n=parseInt(S.fRango,10);
  if(S.fRango==="all")return true;
  return f>=addDays(today(),-(n-1))&&f<=today();
}
function resumenPills(c){
  var rs=c.resumen||{};
  if(c.estado!=="arqueado")return estadoChip(c);
  return '<span class="pill ok">'+(rs.ok||0)+' OK</span>'+(rs.rev?'<span class="pill rev">'+rs.rev+' revisar</span>':"")+(rs.crit?'<span class="pill crit">'+rs.crit+' crítico</span>':"");
}
function resultadosHTML(){
  var list=S.conteos.filter(function(c){return (!S.fNeg||c.negocio===S.fNeg)&&(!S.fEstado||c.estado===S.fEstado)&&inRange(c.fecha)});
  var opt=function(v,l,cur){return '<option value="'+esc(v)+'"'+(cur===v?" selected":"")+'>'+esc(l)+'</option>'};
  var neg=opt("","Todos los negocios",S.fNeg)+S.cfg.negocios.map(function(n){return opt(n,n,S.fNeg)}).join("");
  var rg=[["1","Hoy"],["7","Últimos 7 días"],["30","Últimos 30 días"],["all","Todo"]].map(function(r){return opt(r[0],r[1],S.fRango)}).join("");
  var es=[["","Todos"],["contado","Esperando ventas"],["inicial","Conteo inicial"],["arqueado","Arqueados"],["anulado","Anulados"]].map(function(r){return opt(r[0],r[1],S.fEstado)}).join("");
  var cards=list.length?list.map(function(c){
    return '<button class="pitem" style="width:100%;text-align:left" data-act="det-open" data-id="'+esc(c.id)+'"><div><b>'+esc(c.negocio)+' · '+esc(c.turno)+'</b><small>'+fmtFecha(c.fecha)+' · '+esc(c.resp)+(c.rect?' · rectificado':'')+'</small></div><div class="chips" style="justify-content:flex-end">'+resumenPills(c)+'</div></button>';
  }).join(""):'<div class="panel"><h3>Sin conteos en este período</h3><p class="sub">Cuando los líderes guarden conteos, aparecerán aquí.</p></div>';
  return '<div><h1>Resultados</h1></div>'+
    '<div class="row2"><div class="field"><label class="lbl" for="f-neg">Negocio</label><select id="f-neg">'+neg+'</select></div><div class="field"><label class="lbl" for="f-rango">Período</label><select id="f-rango">'+rg+'</select></div></div>'+
    '<div class="field"><label class="lbl" for="f-est">Estado</label><select id="f-est">'+es+'</select></div>'+
    '<div class="plist">'+cards+'</div>';
}
async function openDetalle(id){
  S.detail={id:id,loading:true,edit:false,cambios:{},motivo:"",anular:false};S.vs=null;render();window.scrollTo(0,0);
  try{var c=await api("getConteo",{id:id});S.detail.c=c;S.detail.loading=false;render()}
  catch(e){S.detail=null;toast(errMsg(e));render()}
}
function detalleHTML(){
  var d=S.detail;
  if(d.loading)return '<div class="loading">Cargando…</div>';
  var c=d.c,adm=canRect(),admX=isAdmin();
  var head='<div class="bar"><div class="bar-row"><button class="back" data-act="det-back">← Volver</button><span class="sub">'+fmtFecha(c.fecha)+'</span></div></div>'+
    '<div><h1>'+esc(c.negocio)+'</h1><p class="sub">'+esc(c.turno)+' · contó '+esc(c.resp)+' · '+hora(c.ts)+(c.rect?' · rectificado':'')+'</p></div>';
  var rs=c.resumen||{};
  var kp=(c.estado==="arqueado"&&rs.consumo)?'<div class="panel"><div class="stat"><div class="sbox good"><b>'+fmt(rs.total||0)+'</b><span>Consumo total</span></div></div><p class="sub">Insumos sin POS: se controla lo que se consumió en el período (había + entró − quedan).</p></div>':c.estado==="arqueado"?'<div class="stat"><div class="sbox good"><b>'+(rs.ok||0)+'</b><span>OK</span></div><div class="sbox"><b>'+(rs.rev||0)+'</b><span>Por revisar</span></div><div class="sbox bad"><b>'+(rs.crit||0)+'</b><span>Críticos</span></div><div class="sbox"><b>'+money(rs.faltante||0)+'</b><span>Faltante estimado</span></div></div>':
    '<div class="panel"><div>'+estadoChip(c)+'</div>'+(c.estado==="contado"?'<p class="sub">Falta registrar las ventas para arquear este conteo.</p>':(c.estado==="inicial"?'<p class="sub">Conteo inicial: es el punto de partida. Se arquea desde el siguiente conteo, no necesita ventas.</p>':""))+'</div>';
  var table="";
  if(d.edit){
    table='<div class="panel rt"><h3>Rectificar conteo</h3><p class="sub">Cambia solo lo que estuvo mal. Queda guardado quién lo cambió y por qué.</p><div class="tw"><table><thead><tr><th>Producto</th><th class="n">Había</th><th class="n">Entró</th><th class="n">Quedan</th></tr></thead><tbody>'+
      c.items.map(function(it){var ch=d.cambios[it.pid]||{};
        function f(k){return '<td class="n"><input inputmode="decimal" data-rect="'+esc(it.pid)+':'+k+'" value="'+esc(ch[k]!=null?ch[k]:it[k])+'"></td>'}
        return '<tr><td>'+esc(it.nombre)+'</td>'+f("ini")+f("ent")+f("fin")+'</tr>'}).join("")+'</tbody></table></div>'+
      '<div class="field"><label class="lbl" for="motivo">Motivo</label><input id="motivo" value="'+esc(d.motivo)+'" placeholder="Ej. Se contó mal el estante 2"></div>'+
      '<div class="btnrow"><button class="btn" data-act="rect-save">Guardar cambios</button><button class="btn ghost" data-act="rect-cancel">Cancelar</button></div></div>';
  }else if(c.estado==="arqueado"&&c.res){
    var order={"CRÍTICO":0,"REVISAR":1,"OK":2};
    var rows=c.res.slice().sort(function(a,b){return order[a[11]]-order[b[11]]}).map(function(x){
      return '<tr><td>'+esc(x[1])+(x[13]>0?'<small style="display:block;color:var(--muted)">incluye '+fmt(x[13])+' declarados (merma/traspaso)</small>':'')+'</td><td class="n">'+fmt(x[7])+'</td><td class="n">'+fmt(x[8])+'</td><td class="n">'+(x[9]>0?"+":"")+fmt(x[9])+'</td><td>'+pill(x[11])+'</td></tr>'}).join("");
    if(rs.consumo)table='<div class="panel"><div class="tw"><table><thead><tr><th>Producto</th><th class="n">Había</th><th class="n">Entró</th><th class="n">Quedan</th><th class="n">Consumo</th></tr></thead><tbody>'+c.res.map(function(x){return '<tr><td>'+esc(x[1])+'</td><td class="n">'+fmt(x[3])+'</td><td class="n">'+fmt(x[4])+'</td><td class="n">'+fmt(x[5])+'</td><td class="n"><b>'+fmt(x[7])+' '+esc(x[2])+'</b></td></tr>'}).join("")+'</tbody></table></div></div>';
    else table='<div class="panel"><div class="tw"><table><thead><tr><th>Producto</th><th class="n">Salió</th><th class="n">Debía</th><th class="n">Dif.</th><th>Estado</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="note">Dif. positiva = faltan unidades. «Debía» = ventas × lo que gasta cada venta.</p></div>';
  }else{
    var rows2=c.items.map(function(it){return '<tr><td>'+esc(it.nombre)+'</td><td class="n">'+fmt(it.ini)+'</td><td class="n">'+fmt(it.ent)+'</td><td class="n">'+fmt(it.fin)+'</td></tr>'}).join("");
    table='<div class="panel"><div class="tw"><table><thead><tr><th>Producto</th><th class="n">Había</th><th class="n">Entró</th><th class="n">Quedan</th></tr></thead><tbody>'+rows2+'</tbody></table></div></div>';
  }
  var notaH=(c.nota&&c.estado!=="anulado")?'<div class="panel"><div class="lbl">Nota del conteo</div><p>'+esc(c.nota)+'</p></div>':"";
  var sin=(c.sin&&c.sin.length)?'<p class="note">Sin contar: '+c.sin.map(esc).join(", ")+'</p>':"";
  var acts="";
  if(adm&&!d.edit&&c.estado!=="anulado"&&c.estado!=="inicial"&&!rs.consumo){
    acts='<div class="btnrow"><button class="btn" data-act="vs-open" data-id="'+esc(c.id)+'">'+(c.estado==="arqueado"?"Cambiar ventas":"Registrar ventas")+'</button><button class="btn ghost" data-act="rect-start">Rectificar conteo</button></div>';
    if(!admX)acts+='';else acts+=d.anular?'<div class="panel"><div class="field"><label class="lbl" for="motivo">Motivo para anular</label><input id="motivo" value="'+esc(d.motivo)+'"></div><div class="btnrow"><button class="btn danger" data-act="anular-ok">Sí, anular conteo</button><button class="btn ghost" data-act="anular-no">No</button></div></div>':'<button class="btn small ghost" data-act="anular">Anular este conteo</button>';
  }
  var cierreH=c.cierre?'<div class="panel"><div class="lbl">Cierre del turno</div><p>✓ Áreas, relleno, limpiezas, equipos, caja, baños y safacones confirmados.</p><p><b>Novedad:</b> '+(c.cierre.nov==="si"?esc(c.cierre.txt):"No")+'</p>'+(c.cierre.fz?'<p><b>Freezers:</b> '+(c.cierre.fz.ok==="si"?"✓ todos funcionan":"✗ NO funcionan")+(c.cierre.fz.txt?' — '+esc(c.cierre.fz.txt):"")+'</p>':"")+(c.cierre.cafe?'<p><b>Máquinas de café:</b> rellenadas '+(c.cierre.cafe.rell==="si"?"✓ sí":"✗ NO")+' · funcionan bien '+(c.cierre.cafe.func==="si"?"✓ sí":"✗ NO")+(c.cierre.cafe.txt?' — '+esc(c.cierre.cafe.txt):"")+'</p>':"")+'</div>':"";
  var histH=(c.hist&&c.hist.length)?'<div class="panel"><div class="lbl">Historial de cambios</div>'+c.hist.map(function(h){var a=h.accion==="rectificar"?"Rectificó el conteo":h.accion==="anular"?"Anuló el conteo":h.accion==="ventas-cambio"?"Cambió las ventas":"Registró las ventas";return '<div class="pitem"><div><b>'+esc(a)+'</b><small>'+esc(h.quien)+' · '+fmtFecha(new Date(h.ts).toISOString().slice(0,10))+' '+hora(h.ts)+'</small>'+(h.detalle?'<small>'+esc(h.detalle)+'</small>':"")+'</div></div>'}).join("")+'</div>':"";
  return head+kp+table+notaH+cierreH+histH+sin+acts+'<div style="height:8px"></div>';
}
function pill(e){var c=e==="OK"?"ok":e==="REVISAR"?"rev":"crit";return '<span class="pill '+c+'">'+(e==="OK"?"OK":e==="REVISAR"?"Revisar":"Crítico")+'</span>'}
async function rectSave(){
  var d=S.detail,cambios={},c=d.c;
  c.items.forEach(function(it){
    var ch=d.cambios[it.pid];if(!ch)return;
    var ini=num(ch.ini!=null?ch.ini:it.ini),ent=num(ch.ent!=null?ch.ent:it.ent),fin=num(ch.fin!=null?ch.fin:it.fin);
    if(ini!==it.ini||ent!==it.ent||fin!==it.fin)cambios[it.pid]={ini:ini,ent:ent,fin:fin};
  });
  if(!Object.keys(cambios).length)return toast("No cambiaste nada.");
  if(!d.motivo.trim())return toast("Escribe el motivo.");
  try{await api("rectificar",{id:d.id,cambios:cambios,motivo:d.motivo.trim()});toast("Conteo rectificado");var id=d.id;await refresh(true);openDetalle(id)}
  catch(e){toast(errMsg(e))}
}

/* ---------- avisos ---------- */
function avisosHTML(){
  var list=S.notifs.length?S.notifs.map(function(n){
    return '<button class="ni'+(n.leido?"":" unread")+'" data-act="notif" data-id="'+esc(n.id)+'"><span class="dot"></span><span><b>'+esc(n.titulo)+'</b><small>'+esc(n.texto)+'</small><small>'+fmtFecha(new Date(n.ts).toISOString().slice(0,10))+' '+hora(n.ts)+'</small></span></button>';
  }).join(""):'<div class="panel"><p class="sub">No hay avisos por ahora.</p></div>';
  return '<div class="top"><h1>Avisos</h1>'+(unread()?'<button class="btn small ghost" data-act="read-all">Marcar leídos</button>':"")+'</div><div class="plist">'+list+'</div>';
}
async function openNotif(id){
  var n=S.notifs.filter(function(x){return x.id===id})[0];if(!n)return;
  if(!n.leido){n.leido=true;api("markRead",{ids:[id]}).catch(function(){})}
  var ref=String(n.ref||"").split("|");
  if(isAdmin()&&n.tipo==="acceso"){S.view="eq";S.eq.users=null;render();return}
  if(ref[0]==="conteo"){
    if(canVentas()&&n.tipo==="pendiente"){openVentas(ref[1]);return}
    if(role()!=="colaborador"){openDetalle(ref[1]);return}
  }
  if(n.tipo==="falta"||n.tipo==="ventas-tarde"){S.view=canVentas()?"pend":(role()==="gerencia"?"panel":"mios");render();return}
  render();
}

/* ---------- panel ---------- */
async function loadPanel(){
  var p=S.panel;p.loading=true;p.err="";
  var hasta=today(),desde=addDays(hasta,-(parseInt(p.rango,10)-1));
  try{p.data=await api("dash",{desde:desde,hasta:hasta,negocio:p.negocio})}
  catch(e){p.err=errMsg(e)}
  p.loading=false;
  if(S.view==="panel"&&!S.vs&&!S.detail)render();
}
function bar(pct,cls){return '<div class="prog"><i class="'+(cls||"")+'" style="width:'+Math.max(0,Math.min(100,pct))+'%"></i></div>'}
function panelHTML(){
  var p=S.panel,d=p.data;
  var rg=[["1","Hoy"],["7","7 días"],["30","30 días"]].map(function(r){return '<button class="'+(p.rango===r[0]?"on":"")+'" data-act="p-rango" data-v="'+r[0]+'">'+r[1]+'</button>'}).join("");
  var neg='<option value="">Todos los negocios</option>'+S.cfg.negocios.map(function(n){return '<option value="'+esc(n)+'"'+(p.negocio===n?" selected":"")+'>'+esc(n)+'</option>'}).join("");
  var head='<div><h1>Panel</h1></div><div class="seg">'+rg+'</div><div class="field"><label class="lbl" for="p-neg">Negocio</label><select id="p-neg">'+neg+'</select></div>';
  if(p.err)return head+'<div class="banner bad">'+esc(p.err)+'</div><button class="btn ghost" data-act="p-reload">Reintentar</button>';
  if(!d)return head+'<div class="loading">Calculando…</div>';
  var t=d.total,cumpl=t.esperados?t.cumplidos/t.esperados:null,fuera=t.items?(t.rev+t.crit)/t.items:null;
  var kp='<div class="stat">'+
    '<div class="sbox '+(cumpl==null?"":cumpl>=0.9?"good":"bad")+'"><b>'+(cumpl==null?"—":Math.round(cumpl*100)+"%")+'</b><span>Cumplimiento de conteos ('+t.cumplidos+' de '+t.esperados+')</span></div>'+
    '<div class="sbox '+(t.faltante>0?"bad":"")+'"><b>'+money(t.faltante)+'</b><span>Faltante estimado</span></div>'+
    '<div class="sbox"><b>'+(fuera==null?"—":pctf(fuera))+'</b><span>Productos fuera de tolerancia</span></div>'+
    '<div class="sbox '+(t.pendientes?"bad":"good")+'"><b>'+t.pendientes+'</b><span>Conteos sin ventas</span></div></div>';
  var porNeg=Object.keys(d.porNegocio).map(function(n){
    var o=d.porNegocio[n],c=o.esperados?o.cumplidos/o.esperados:null;
    return '<div class="pitem" style="flex-direction:column;align-items:stretch;gap:8px"><div class="phead"><b>'+esc(n)+'</b><span class="mini">'+(c==null?"sin turnos configurados":Math.round(c*100)+"% cumplimiento")+'</span></div>'+(c==null?"":bar(c*100,c>=0.9?"":c>=0.6?"w":"b"))+
      '<div class="chips">'+(o.crit?'<span class="pill crit">'+o.crit+' críticos</span>':"")+(o.rev?'<span class="pill rev">'+o.rev+' revisar</span>':"")+(o.pendientes?'<span class="pill rev">'+o.pendientes+' sin ventas</span>':"")+(o.arqueados&&!o.crit&&!o.rev?'<span class="pill ok">Todo OK</span>':"")+'<span class="mini">Faltante '+money(o.faltante)+'</span></div></div>';
  }).join("");
  var top=d.top.length?'<div class="panel"><h3>Productos con más pérdida</h3><div class="tw"><table><thead><tr><th>Producto</th><th class="n">Faltan</th><th class="n">Valor</th><th class="n">Veces</th></tr></thead><tbody>'+
    d.top.map(function(q){return '<tr><td>'+esc(q.nombre)+(S.cfg.negocios.length>1&&!p.negocio?'<br><span class="mini">'+esc(q.negocio)+'</span>':"")+'</td><td class="n">'+fmt(q.faltaU)+'</td><td class="n">'+money(q.faltaV)+'</td><td class="n">'+q.veces+'</td></tr>'}).join("")+'</tbody></table></div></div>':"";
  var max=0;d.diario.forEach(function(x){if(x.faltante>max)max=x.faltante});
  var trend=d.diario.length>1?'<div class="panel"><h3>Faltante por día</h3><div class="bars">'+d.diario.map(function(x){return '<i class="'+(x.faltante?"":"z")+'" title="'+fmtFecha(x.fecha)+': '+money(x.faltante)+'" style="height:'+(max?Math.max(3,x.faltante/max*100):3)+'%"></i>'}).join("")+'</div><div class="barlbl">'+d.diario.map(function(x){return '<span>'+x.fecha.slice(8)+'</span>'}).join("")+'</div></div>':"";
  var falta=d.faltan.length?'<div class="panel"><h3>Conteos que no se hicieron</h3>'+d.faltan.slice().reverse().slice(0,12).map(function(x){return '<div class="hoyrow"><span><b>'+esc(x.negocio)+'</b> · '+esc(x.turno)+'</span><span class="st late">'+fmtFecha(x.fecha)+'</span></div>'}).join("")+'</div>':"";
  var pend=d.pendientes.length?'<div class="panel"><h3>Esperando ventas</h3>'+d.pendientes.map(function(x){
    return '<div class="hoyrow"><span><b>'+esc(x.negocio)+'</b> · '+esc(x.turno)+' · '+fmtFecha(x.fecha)+'</span>'+(canVentas()?'<button class="btn small" data-act="vs-open" data-id="'+esc(x.id)+'">Registrar</button>':'<span class="st pend">'+x.horas+' h</span>')+'</div>'}).join("")+'</div>':"";
  var sinCosto=!S.productos.some(function(x){return x.costo>0});
  if(sinCosto)kp+='<div class="banner">El faltante en RD$ sale en cero porque los productos no tienen costo. Agrégalo en Catálogo para ver el valor de las pérdidas.</div>';
  var mm=d.mermas,mer='';
  if(mm&&(mm.total||mm.enviados||Object.keys(mm.porMotivo||{}).length)){
    mer='<div class="panel"><div><h3>Pérdidas declaradas</h3><p class="sub">Mermas registradas por los líderes en el período.</p></div>'+Object.keys(mm.porMotivo).map(function(k){var o=mm.porMotivo[k];return '<div class="pitem"><div><b>'+esc(k)+'</b><small>'+o.n+' registro'+(o.n===1?'':'s')+'</small></div><b>'+money(o.valor)+'</b></div>'}).join('')+(mm.sinConfirmar?'<p class="note">'+mm.sinConfirmar+' traspaso'+(mm.sinConfirmar===1?'':'s')+' sin confirmar.</p>':'')+'</div>';
  }
  return head+kp+hoyHTML()+mer+'<div class="plist">'+porNeg+'</div>'+top+trend+falta+pend;
}

/* ---------- catálogo (administración) ---------- */
function blankProd(){return {nuevo:true,id:"p"+Date.now().toString(36),nombre:"",cat:"",critico:false,unidad:"unid",factor:"1",tol:"5",costo:"0",negocios:[],orden:Date.now()}}
function catalogoHTML(){
  var c=S.cat,e=c.editing,q=c.q.trim().toLowerCase();
  var list=S.productos.slice().sort(function(a,b){return (a.orden||0)-(b.orden||0)});
  if(c.neg)list=list.filter(function(p){return !p.negocios.length||p.negocios.indexOf(c.neg)>-1});
  if(q)list=list.filter(function(p){return String(p.nombre).toLowerCase().indexOf(q)>-1||String(p.cat).toLowerCase().indexOf(q)>-1});
  var total=list.length;list=list.slice(0,q||c.neg?60:30);
  var items=list.map(function(p){
    return '<div class="pitem"><div><b>'+esc(p.nombre)+'</b>'+(p.critico?'<span class="tag crit">crítico</span>':"")+'<small>'+(p.cat?esc(p.cat)+' · ':"")+esc(p.unidad)+' · gasta '+fmt(p.factor)+' por venta · tolerancia '+pctf(p.tol)+' · '+money(p.costo||0)+'</small><small>'+((p.negocios&&p.negocios.length)?p.negocios.map(esc).join(", "):"Todos los negocios")+'</small></div><button class="btn small ghost" data-act="edit-prod" data-id="'+esc(p.id)+'">Editar</button></div>';
  }).join("")||'<div class="panel"><p class="sub">No hay productos que coincidan.</p></div>';
  var form="";
  if(e){
    var chips=S.cfg.todosNegocios.map(function(n,i){var on=e.negocios.indexOf(n)>-1;return '<button type="button" class="tchip'+(on?" on":"")+'" data-act="tog-neg" data-v="'+i+'">'+esc(n)+'</button>'}).join("");
    form='<div class="panel"><h2>'+(e.nuevo?"Producto nuevo":"Editar producto")+'</h2>'+
      '<div class="field"><label class="lbl" for="pf-nombre">Nombre</label><input id="pf-nombre" data-pf="nombre" value="'+esc(e.nombre)+'"></div>'+
      '<div class="field"><label class="lbl" for="pf-cat">Categoría</label><input id="pf-cat" data-pf="cat" value="'+esc(e.cat)+'"></div>'+
      '<div class="row2"><div class="field"><label class="lbl" for="pf-unidad">Unidad</label><input id="pf-unidad" data-pf="unidad" value="'+esc(e.unidad)+'"></div>'+
      '<div class="field"><label class="lbl" for="pf-factor">Se gasta por cada venta</label><input id="pf-factor" data-pf="factor" inputmode="decimal" value="'+esc(e.factor)+'"></div></div>'+
      '<div class="row2"><div class="field"><label class="lbl" for="pf-tol">Tolerancia (%)</label><input id="pf-tol" data-pf="tol" inputmode="decimal" value="'+esc(e.tol)+'"></div>'+
      '<div class="field"><label class="lbl" for="pf-costo">Costo por unidad (RD$)</label><input id="pf-costo" data-pf="costo" inputmode="decimal" value="'+esc(e.costo)+'"></div></div>'+
      '<div><div class="lbl">Frecuencia de conteo</div><p class="note">Los críticos se cuentan todos los días; los demás, solo los días de conteo completo.</p><button type="button" class="tchip'+(e.critico?" on":"")+'" data-act="tog-crit" style="margin-top:8px">Producto crítico</button></div>'+
      '<div><div class="lbl">Se cuenta en</div><p class="note">Sin marcar ninguno, aparece en todos los negocios.</p><div class="chips" style="margin-top:8px">'+chips+'</div></div>'+
      '<div class="btnrow"><button class="btn" data-act="save-prod">Guardar producto</button><button class="btn ghost" data-act="cancel-prod">Cancelar</button></div>'+
      (!e.nuevo?(c.pendingDel===e.id?'<div class="btnrow"><button class="btn danger" data-act="del-prod-ok">Sí, quitar producto</button><button class="btn ghost" data-act="del-prod-no">No</button></div>':'<button class="btn small ghost" data-act="del-prod">Quitar producto</button>'):"")+'</div>';
  }else form='<button class="btn" data-act="new-prod">+ Agregar producto</button>';
  var negOpts='<option value="">Todos los negocios</option>'+S.cfg.todosNegocios.map(function(n){return '<option value="'+esc(n)+'"'+(c.neg===n?" selected":"")+'>'+esc(n)+'</option>'}).join("");
  return '<div><h1>Catálogo y ajustes</h1><p class="sub">Qué se cuenta, cuándo y quién recibe avisos.</p></div>'+
    form+
    '<div class="row2"><div class="field"><label class="lbl" for="cq">Buscar producto</label><input id="cq" type="search" autocomplete="off" value="'+esc(c.q)+'" placeholder="Nombre o categoría"></div><div class="field"><label class="lbl" for="cneg">Negocio</label><select id="cneg">'+negOpts+'</select></div></div>'+
    '<div class="plist">'+items+'</div>'+(total>list.length?'<p class="hint">Mostrando '+list.length+' de '+total+'. Escribe para buscar.</p>':"")+
    calHTML()+turnosHTML()+avisosCfgHTML();
}
function calHTML(){
  var order=[1,2,3,4,5,6,0];
  var rows=S.cfg.negocios.map(function(n,i){
    var cal=S.cfg.calendario[n],days=Array.isArray(cal)?cal:[0,1,2,3,4,5,6];
    var chips=order.map(function(d){return '<button type="button" class="dchip'+(days.indexOf(d)>-1?" on":"")+'" data-act="tog-dia" data-v="'+i+'" data-d="'+d+'" aria-label="'+DIAS_L[d]+'">'+DIAS[d]+'</button>'}).join("");
    return '<div class="calrow"><b>'+esc(n)+'</b><div class="dchips">'+chips+'</div></div>';
  }).join("");
  return '<div class="panel"><div><h2>Calendario de conteo</h2><p class="sub">Marca los días de <b>conteo completo</b>. Los demás días solo se cuentan los productos críticos. Con los 7 marcados se cuenta todo, todos los días. Se guarda al tocar.</p></div>'+rows+'</div>';
}
function turnosHTML(){
  var rows=S.cfg.todosNegocios.map(function(n,i){
    var txt=(S.cfg.turnos[n]||[]).map(function(t){return t+" | "+(S.cfg.limites[n+"|"+t]||"")}).join("\n");
    return '<div class="field"><label class="lbl" for="tt-'+i+'">'+esc(n)+'</label><textarea id="tt-'+i+'" data-tt="'+i+'" style="min-height:70px" placeholder="Un turno por línea: Nombre | hora límite">'+esc(txt)+'</textarea></div>';
  }).join("");
  return '<div class="panel"><div><h2>Turnos y hora límite</h2><p class="sub">Un turno por línea, así: <b>Turno 2 (3PM-11PM) | 23:30</b>. Si pasa la hora límite sin conteo, se avisa a administración y gerencia. Deja vacío un negocio que no cuenta.</p></div>'+rows+
    '<div class="field"><label class="lbl" for="neg-edit">Negocios (uno por línea)</label><textarea id="neg-edit" data-tt="neg">'+esc(S.cfg.todosNegocios.join("\n"))+'</textarea></div>'+
    '<button class="btn" data-act="save-turnos">Guardar turnos y negocios</button></div>';
}
function avisosCfgHTML(){
  var a=S.cfg.avisos||{};
  var rows=[["acceso","Alguien pidió acceso"],["pendiente","Un conteo espera las ventas"],["critico","Un arqueo salió con diferencias críticas"],["falta","No se hizo un conteo a tiempo"]].map(function(r){
    var on=a[r[0]]!==false;
    return '<div class="sw"><span>'+r[1]+'</span><button class="tchip'+(on?" on":"")+'" data-act="tog-aviso" data-v="'+r[0]+'">'+(on?"Sí":"No")+'</button></div>';
  }).join("");
  return '<div class="panel"><div><h2>Avisos por correo</h2><p class="sub">Siempre aparecen dentro de la app. Aquí eliges cuáles también llegan al correo de administración y gerencia (Gmail permite unos 100 correos al día).</p></div>'+rows+'</div>';
}
async function saveCfg(cfg,msg){
  try{await api("saveConfig",{cfg:cfg});await refresh(true);if(msg)toast(msg)}catch(e){toast(errMsg(e))}
}

/* ---------- equipo ---------- */
async function loadUsers(){
  try{S.eq.users=await api("listUsers")}catch(e){S.eq.users=[];toast(errMsg(e))}
  if(S.view==="eq")render();
}
function equipoHTML(){
  var us=S.eq.users;
  if(!us)return '<div class="loading">Cargando equipo…</div>';
  var f=S.eq.form,form="";
  if(f){
    var chips=S.cfg.todosNegocios.map(function(n,i){var on=f.negocios.indexOf(n)>-1;return '<button type="button" class="tchip'+(on?" on":"")+'" data-act="eq-neg" data-v="'+i+'">'+esc(n)+'</button>'}).join("");
    var seg=function(k,vals){return '<div class="seg">'+vals.map(function(v){return '<button class="'+(f[k]===v[0]?"on":"")+'" data-act="eq-set" data-k="'+k+'" data-v="'+v[0]+'">'+v[1]+'</button>'}).join("")+'</div>'};
    form='<div class="panel"><h2>'+esc(f.nombre)+'</h2><p class="sub">'+esc(f.email)+'</p>'+
      '<div class="lbl">Rol</div>'+seg("rol",[["colaborador","Colaborador"],["lider","Líder"],["supervisor","Supervisor"],["admin","Administración"],["gerencia","Gerencia"]])+
      (f.rol==='supervisor'?'<p class="sub">Valida y completa conteos y ventas de todos los negocios. Cada cambio queda registrado con su nombre.</p>':'')+
      '<div class="field"><label class="lbl" for="eq-tel">Teléfono de WhatsApp (opcional)</label><input id="eq-tel" type="tel" inputmode="tel" autocomplete="off" placeholder="809 555 1234" value="'+esc(f.telefono||"")+'"><p class="hint">Sirve para mandarle recordatorios si falta su conteo.</p></div>'+
      ((f.rol==="lider"||f.rol==="colaborador")?'<div><div class="lbl">Negocios asignados</div><div class="chips" style="margin-top:8px">'+chips+'</div></div>':"")+
      '<div class="lbl">Estado</div>'+seg("estado",[["aprobado","Con acceso"],["pendiente","Pendiente"],["bloqueado","Bloqueado"]])+
      '<div class="btnrow"><button class="btn" data-act="eq-save">Guardar</button><button class="btn ghost" data-act="eq-cancel">Cancelar</button></div></div>';
  }
  var pend=us.filter(function(u){return u.estado==="pendiente"});
  var rest=us.filter(function(u){return u.estado!=="pendiente"});
  var pHTML=pend.length?'<div><div class="lbl" style="margin-bottom:8px">Solicitudes de acceso ('+pend.length+')</div><div class="plist">'+pend.map(function(u){
    return '<div class="pitem"><div><b>'+esc(u.nombre)+'</b><small>'+esc(u.email)+'</small></div><button class="btn small" data-act="eq-edit" data-id="'+esc(u.email)+'">Revisar</button></div>'}).join("")+'</div></div>':'<p class="sub">No hay solicitudes pendientes.</p>';
  var rHTML=rest.map(function(u){
    return '<div class="pitem"><div><b>'+esc(u.nombre)+'</b> <span class="upill '+u.rol+'">'+ROL[u.rol]+'</span>'+(u.estado==="bloqueado"?' <span class="pill crit">Bloqueado</span>':"")+'<small>'+esc(u.email)+'</small>'+(u.rol==="lider"?'<small>'+((u.negocios&&u.negocios.length)?u.negocios.map(esc).join(", "):"Sin negocios asignados")+'</small>':"")+'</div><button class="btn small ghost" data-act="eq-edit" data-id="'+esc(u.email)+'">Editar</button></div>'}).join("");
  return '<div><h1>Equipo</h1><p class="sub">Quien pide acceso aparece aquí y en tus avisos. Asignas el rol y listo.</p></div>'+form+pHTML+
    '<div><div class="lbl" style="margin:8px 0">Personas con acceso</div><div class="plist">'+rHTML+'</div></div>';
}

/* ---------- eventos ---------- */
function clean(v){return v.replace(/[^0-9.,]/g,"")}
document.addEventListener("input",function(ev){
  var t=ev.target,ds=t.dataset||{};
  if(ds.f&&S.draft){
    var cl=clean(t.value);if(cl!==t.value)t.value=cl;
    var v=S.draft.vals[ds.pid];v[ds.f]=cl;
    if(ds.f==="ini")v.iniTouched=true;
    if(ds.f==="ent")v.entTouched=true;
    updateCard(ds.pid);updateProgress();persistDraft();
  }
  else if(ds.vq&&S.vs){
    var c2=clean(t.value);if(c2!==t.value)t.value=c2;
    S.vs.vals[ds.vq]=c2;S.vs.touched[ds.vq]=true;S.vs.auto0[ds.vq]=false;S.vs.confirm=false;
    var row=t.closest(".vrow");if(row)row.classList.remove("auto0");
    updateVsFoot();
  }
  else if(ds.rect&&S.detail){
    var c3=clean(t.value);if(c3!==t.value)t.value=c3;
    var pr=ds.rect.split(":"),ch=S.detail.cambios[pr[0]]||(S.detail.cambios[pr[0]]={});ch[pr[1]]=c3;
  }
  else if(ds.pf&&S.cat.editing){S.cat.editing[ds.pf]=t.value}
  else if(ds.tt!=null){S.cat.typing=true}
  else if(ds.rq){var c4=clean(t.value);if(c4!==t.value)t.value=c4;var ln=S.rec.lines.filter(function(l){return l.pid===ds.rq})[0];if(ln)ln.qty=c4;updateRecBtn()}
  else if(t.id==="rq"){S.rec.q=t.value;var rr=$("#rres");if(rr)rr.innerHTML=recSearchHTML()}
  else if(t.id==="rnota"){S.rec.nota=t.value}
  else if(t.id==="cfz"){if(S.draft){cierreDe(S.draft).fz.txt=t.value;persistDraft();updateProgress()}}
  else if(t.id==="ccaf"){if(S.draft){cierreDe(S.draft).cafe.txt=t.value;persistDraft();updateProgress()}}
  else if(t.id==="eq-tel"){if(S.eq.form)S.eq.form.telefono=t.value}
  else if(t.id==="cnov"){if(S.draft){cierreDe(S.draft).txt=t.value;persistDraft();updateProgress()}}
  else if(t.id==="cnota"){if(S.draft){S.draft.nota=t.value;persistDraft()}}
  else if(t.id==="rdet"){S.rec.detalle=t.value;updateRecBtn()}
  else if(ds.tq){var c5=clean(t.value);if(c5!==t.value)t.value=c5;var tp=ds.tq.split("|"),tt=S.rec.tr[tp[0]]||(S.rec.tr[tp[0]]={});tt[tp[1]]=c5}
  else if(t.id==="fecha"){S.draft.fecha=t.value||today()}
  else if(t.id==="q"){applyFilter()}
  else if(t.id==="vq"&&S.vs){S.vs.q=t.value;var qq=t.value.trim().toLowerCase();document.querySelectorAll(".vrow").forEach(function(r){r.hidden=!!qq&&r.dataset.n.indexOf(qq)<0})}
  else if(t.id==="motivo"&&S.detail){S.detail.motivo=t.value}
  else if(t.id==="cq"){S.cat.q=t.value;clearTimeout(S.cat.tm);S.cat.tm=setTimeout(function(){var pos=t.selectionStart;render();var n=$("#cq");if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}},250)}
  else if(t.id==="lg-email"){S.loginEmail=t.value}
  else if(t.id==="lg-code"){var c5=t.value.replace(/\D/g,"").slice(0,6);if(c5!==t.value)t.value=c5;S.loginCode=c5}
  else if(t.id==="lg-name"){S.loginName=t.value}
});
document.addEventListener("keydown",function(ev){
  if(ev.key!=="Enter")return;
  var id=ev.target.id;
  if(id==="lg-email")lgSend();
  else if(id==="lg-code"||id==="lg-name")lgVerify();
});
document.addEventListener("change",function(ev){
  var t=ev.target,ds=t.dataset||{};
  if(t.id==="fcat-sel"&&S.draft){var op=t.options[t.selectedIndex];S.draft.fcat=(+t.value<0)?null:op.dataset.c;persistDraft();applyFilter()}
  else if(t.id==="f-neg"){S.fNeg=t.value;render()}
  else if(t.id==="f-rango"){S.fRango=t.value;render()}
  else if(t.id==="f-est"){S.fEstado=t.value;render()}
  else if(t.id==="p-neg"){S.panel.negocio=t.value;S.panel.data=null;render()}
  else if(t.id==="cneg"){S.cat.neg=t.value;render()}
  else if(t.id==="rorigen"){S.rec.origen=t.value;render()}
  else if(t.id==="rmotivo"){S.rec.motivo=t.value;render();var dd=$("#rdet");if(dd&&(t.value==="Se dañó"||t.value==="Otros"))dd.focus()}
  else if(t.id==="rdest"){S.rec.destino=t.value;updateRecBtn()}
  else if(ds.asg&&S.vs){S.vs.assign[ds.asg]=t.value||undefined;if(!t.value)delete S.vs.assign[ds.asg];recomputeTramo(ds.tr);var y=window.pageYOffset;render();window.scrollTo(0,y)}
  else if(ds.csv&&S.vs&&t.files&&t.files[0]){
    var file=t.files[0],key=ds.csv,fr=new FileReader();
    fr.onload=function(){
      var buf=fr.result,txt;
      try{txt=new TextDecoder("utf-8",{fatal:true}).decode(buf)}catch(e){txt=new TextDecoder("windows-1252").decode(buf)}
      applyCsv(key,txt,file.name);render();
    };
    fr.readAsArrayBuffer(file);
  }
});
async function guarded(fn){try{await fn()}catch(e){toast(errMsg(e))}}
document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act]");if(!el)return;
  var act=el.dataset.act,v=el.dataset.v,id=el.dataset.id;
  var A={
    "ck":function(){var c=cierreDe(S.draft),i=+v;c.chk[i]=!c.chk[i];cierreRefresh()},
    "fz":function(){cierreDe(S.draft).fz.ok=v;cierreRefresh()},
    "caf":function(){cierreDe(S.draft).cafe[el.dataset.k]=v;cierreRefresh()},
    "nov":function(){cierreDe(S.draft).nov=v;cierreRefresh()},
    "go":function(){
      S.detail=null;S.vs=null;S.view=v;S.cat.editing=null;S.eq.form=null;
      if(v==="panel")loadPanel();
      if(v==="eq")S.eq.users=null;
      render();window.scrollTo(0,0);refresh(false);
    },
    "campo-on":function(){S.campo=true;S.view="contar";S.step="elegir";S.draft=newDraft();render();window.scrollTo(0,0)},
    "campo-off":function(){S.campo=false;S.view="pend";S.step="elegir";S.draft=null;render()},
    "logout":function(){doLogout(false)},
    "check-pending":function(){checkPending()},
    "lg-send":function(){lgSend()},
    "lg-resend":function(){lgSend()},
    "lg-change":function(){S.auth="email";S.err="";render()},
    "lg-verify":function(){lgVerify()},
    /* contar */
    "neg":function(){var n=S.cfg.negocios[+v];S.draft.negocio=n;S.draft.turno=sugTurno(n,S.draft.fecha);render()},
    "turno":function(){S.draft.turno=turnosFor(S.draft.negocio)[+v];render()},
    "start":function(){startCount()},
    "fcat":function(){var d=S.draft;d.fcat=(+v<0)?null:el.dataset.c;persistDraft();applyFilter()},
    "fmode":function(){var d=S.draft;d.fmode=(d.fmode===v)?"":v;persistDraft();applyFilter()},
    "back":function(){S.step="elegir";S.draft=newDraft();clearDraft();render();window.scrollTo(0,0)},
    "save":function(){guardar()},
    "again":function(){S.draft=newDraft();S.step="elegir";S.saved=null;render();window.scrollTo(0,0)},
    /* recibir */
    "rneg":function(){S.rec.negocio=S.cfg.negocios[+v];S.rec.lines=[];S.rec.q="";S.rec.destino="";S.rec.origen=/^La Barra/.test(S.rec.negocio)?"Principal":"Proveedor";S.rec.eid=null;render()},
    "rmodo":function(){S.rec.modo=v;S.rec.eid=null;S.rec.q="";render()},
    "tr-recv":function(){confirmarTraspaso(id)},
    "mov-del":function(){if(!confirm("¿Anular este registro?"))return;guarded(async function(){await api("anularMov",{id:id});toast("Registro anulado");await refresh(true);render()})},
    "rec-add":function(){S.rec.lines.push({pid:id,qty:""});S.rec.q="";var qi=$("#rq");if(qi)qi.value="";var a=$("#rres"),b=$("#rlines");if(a)a.innerHTML=recSearchHTML();if(b)b.innerHTML=recLinesHTML();var ins=document.querySelectorAll("[data-rq]");if(ins.length)ins[ins.length-1].focus();updateRecBtn()},
    "rec-del":function(){S.rec.lines=S.rec.lines.filter(function(l){return l.pid!==id});var a=$("#rres"),b=$("#rlines");if(a)a.innerHTML=recSearchHTML();if(b)b.innerHTML=recLinesHTML();updateRecBtn()},
    "rec-save":function(){registrarEntrada()},
    "rec-del-ent":function(){guarded(async function(){await api("delEntrada",{id:id});toast("Entrada anulada");await refresh(true);render()})},
    /* ventas */
    "vs-open":function(){openVentas(id)},
    "vs-back":function(){S.vs=null;render();window.scrollTo(0,0)},
    "vs-calc":function(){calcVentas()},
    "vs-ign":function(){
      var vs=S.vs,csv=vs.csv[el.dataset.tr];
      csv.otros.forEach(function(u){vs.assign[u.key]="-"});
      recomputeTramo(el.dataset.tr);var y=window.pageYOffset;render();window.scrollTo(0,y);toast("Listo. No volverán a preguntarse.");
    },
    /* resultados */
    "det-open":function(){openDetalle(id)},
    "det-back":function(){S.detail=null;render();window.scrollTo(0,0)},
    "rect-start":function(){S.detail.edit=true;S.detail.cambios={};S.detail.motivo="";render()},
    "rect-cancel":function(){S.detail.edit=false;render()},
    "rect-save":function(){rectSave()},
    "anular":function(){S.detail.anular=true;S.detail.motivo="";render()},
    "anular-no":function(){S.detail.anular=false;render()},
    "anular-ok":function(){
      var d=S.detail;if(!d.motivo.trim())return toast("Escribe el motivo.");
      guarded(async function(){await api("anular",{id:d.id,motivo:d.motivo.trim()});toast("Conteo anulado");S.detail=null;await refresh(true);render()});
    },
    /* avisos */
    "notif":function(){openNotif(id)},
    "read-all":function(){S.notifs.forEach(function(n){n.leido=true});render();api("markRead",{todos:true}).catch(function(){})},
    /* panel */
    "p-rango":function(){S.panel.rango=v;S.panel.data=null;loadPanel();render()},
    "p-reload":function(){S.panel.err="";S.panel.data=null;render();loadPanel()},
    /* catálogo */
    "new-prod":function(){S.cat.editing=blankProd();render();window.scrollTo(0,0)},
    "edit-prod":function(){var p=prodById(id);if(p){S.cat.editing={nuevo:false,id:p.id,nombre:p.nombre,cat:p.cat||"",critico:!!p.critico,unidad:p.unidad,factor:String(p.factor),tol:String(r2(p.tol*100,2)),costo:String(p.costo||0),negocios:(p.negocios||[]).slice(),orden:p.orden||Date.now()};render();window.scrollTo(0,0)}},
    "cancel-prod":function(){S.cat.editing=null;S.cat.pendingDel=null;render()},
    "tog-crit":function(){S.cat.editing.critico=!S.cat.editing.critico;el.classList.toggle("on")},
    "tog-neg":function(){var nn=S.cfg.todosNegocios[+v],a=S.cat.editing.negocios,i=a.indexOf(nn);if(i>-1)a.splice(i,1);else a.push(nn);el.classList.toggle("on")},
    "save-prod":function(){
      var e=S.cat.editing,fa=num(e.factor),to=num(e.tol),co=num(e.costo);
      if(!e.nombre.trim())return toast("Escribe el nombre del producto.");
      if(fa==null||fa<=0)return toast("«Se gasta por cada venta» debe ser mayor que 0.");
      if(to==null||to<0||to>100)return toast("La tolerancia va de 0 a 100.");
      if(co==null||co<0)co=0;
      guarded(async function(){
        await api("saveProducto",{id:e.id,nombre:e.nombre.trim(),cat:(e.cat||"").trim(),critico:!!e.critico,unidad:(e.unidad||"unid").trim(),factor:fa,tol:to/100,costo:co,negocios:e.negocios.slice(),orden:e.orden});
        S.cat.editing=null;toast("Producto guardado");await refresh(true);render();
      });
    },
    "del-prod":function(){S.cat.pendingDel=S.cat.editing.id;render()},
    "del-prod-no":function(){S.cat.pendingDel=null;render()},
    "del-prod-ok":function(){guarded(async function(){await api("delProducto",{id:S.cat.editing.id});S.cat.editing=null;S.cat.pendingDel=null;toast("Producto quitado");await refresh(true);render()})},
    "tog-dia":function(){
      var n=S.cfg.todosNegocios[+v],d=+el.dataset.d,cal=Object.assign({},S.cfg.calendario),arr=(Array.isArray(cal[n])?cal[n]:[0,1,2,3,4,5,6]).slice(),ix=arr.indexOf(d);
      if(ix>-1)arr.splice(ix,1);else arr.push(d);
      arr.sort();if(arr.length>=7)delete cal[n];else cal[n]=arr;
      S.cfg.calendario=cal;el.classList.toggle("on");
      saveCfg({calendario:cal},"Calendario guardado");
    },
    "tog-aviso":function(){var a=Object.assign({},S.cfg.avisos);a[v]=a[v]===false;S.cfg.avisos=a;render();saveCfg({avisos:a},"Guardado")},
    "save-turnos":function(){
      var negs=($("#neg-edit").value||"").split("\n").map(function(s){return s.trim()}).filter(Boolean);
      if(!negs.length)return toast("Deja al menos un negocio.");
      var turnos={},lim={},bad="";
      S.cfg.todosNegocios.forEach(function(n,i){
        var ta=$("#tt-"+i);if(!ta)return;
        var list=[];
        ta.value.split("\n").forEach(function(l){
          l=l.trim();if(!l)return;
          var p=l.split("|"),nm=p[0].trim(),hm=(p[1]||"").trim();
          if(hm&&!/^([01]?\d|2[0-3]):[0-5]\d$/.test(hm)){bad=n+": «"+hm+"» no es una hora válida (usa 23:30)";return}
          if(hm&&hm.length===4)hm="0"+hm;
          list.push(nm);if(hm)lim[n+"|"+nm]=hm;
        });
        turnos[n]=list;
      });
      if(bad)return toast(bad);
      negs.forEach(function(n){if(!turnos[n])turnos[n]=[]});
      S.cat.typing=false;
      saveCfg({negocios:negs,turnos:turnos,limites:lim},"Turnos guardados");
    },
    /* equipo */
    "eq-edit":function(){var u=S.eq.users.filter(function(x){return x.email===id})[0];if(u){S.eq.form={email:u.email,nombre:u.nombre,telefono:u.telefono||"",rol:u.rol,estado:u.estado==="pendiente"?"aprobado":u.estado,negocios:(u.negocios||[]).slice()};S.eq.editing=true;render();window.scrollTo(0,0)}},
    "eq-set":function(){S.eq.form[el.dataset.k]=v;render()},
    "eq-neg":function(){var n=S.cfg.todosNegocios[+v],a=S.eq.form.negocios,i=a.indexOf(n);if(i>-1)a.splice(i,1);else a.push(n);el.classList.toggle("on")},
    "eq-cancel":function(){S.eq.form=null;S.eq.editing=false;render()},
    "eq-save":function(){
      var f=S.eq.form;
      if((f.rol==="lider"||f.rol==="colaborador")&&f.estado==="aprobado"&&!f.negocios.length)return toast("Asigna al menos un negocio.");
      guarded(async function(){
        await api("setUser",{email:f.email,telefono:f.telefono||"",rol:f.rol,estado:f.estado,negocios:(f.rol==="lider"||f.rol==="colaborador")?f.negocios:[]});
        S.contactos=null;S.eq.form=null;S.eq.editing=false;toast("Guardado");S.eq.users=await api("listUsers");render();
      });
    }
  };
  if(A[act])A[act]();
});
document.addEventListener("visibilitychange",function(){if(!document.hidden&&S.auth==="app"&&Date.now()-S.lastSync>45000)refresh(false)});

/* ---------- arranque ---------- */
boot();
})();
