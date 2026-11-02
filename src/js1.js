var LOGO="data:image/png;base64,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";
(function(){try{var l=document.createElement("link");l.rel="icon";l.href=LOGO;document.head.appendChild(l);var m=document.createElement("meta");m.name="theme-color";m.content="#D8160F";document.head.appendChild(m)}catch(e){}})();
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
    top.innerHTML='<span class="brand"><img src="'+LOGO+'" alt="">ARQUEO · LA BARRA</span><div class="tr"><div class="who">'+esc(S.me.nombre)+'<br>'+ROL[S.me.rol]+'</div>'+
      '<button class="bell" data-act="go" data-v="avisos" aria-label="Avisos"><svg viewBox="0 0 24 24"><path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5zM10 20a2 2 0 0 0 4 0"/></svg><span class="badge" id="bellbadge"'+(u?"":" hidden")+'>'+u+'</span></button></div>';
  }else top.innerHTML='<span class="brand"><img src="'+LOGO+'" alt="">ARQUEO · LA BARRA</span>';
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
