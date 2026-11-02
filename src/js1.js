(function(){
"use strict";
var DOBLE=["Zona Presidente"];
var INSUMOS=["Car Wash"];
var ROL={colaborador:"Colaborador",lider:"Líder",admin:"Administración",gerencia:"Gerencia"};
var DIAS=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],DIAS_L=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
var S={
  tok:null,auth:"load",me:null,loginEmail:"",loginNuevo:false,loginName:"",loginCode:"",loginBusy:false,
  hoy:"",cfg:{negocios:[],turnos:{},limites:{},calendario:{},avisos:{},todosNegocios:[]},
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
function canVentas(){return role()==="admin"||role()==="lider"}
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
  if(role()==="admin"||role()==="lider")return "pend";
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
