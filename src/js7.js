/* ---------- Mi semana (panel del supervisor: arqueos semanales obligatorios) ---------- */
var SEM_OBLIG=["Food Shop","Zona Presidente"];
var SEM_GEN=["Food Shop General","La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General"];
var DIA_INI=["D","L","M","M","J","V","S"];
function semLunes(h){return addDays(h,-((dow(h)+6)%7))}
function semFechas(lun){var a=[];for(var i=0;i<7;i++)a.push(addDays(lun,i));return a}
function semRango(lun){
  var d=addDays(lun,6),a=+lun.slice(8),b=+d.slice(8),ma=+lun.slice(5,7),mb=+d.slice(5,7);
  return ma===mb?a+" al "+b+" de "+MESES[mb-1]:a+" de "+MESES[ma-1]+" al "+b+" de "+MESES[mb-1];
}
/* estado de un turno en una fecha: ok | ini | ventas | falta | hoy | na */
function semEstado(neg,t,fe,h){
  var c=S.conteos.filter(function(x){return x.negocio===neg&&x.turno===t&&x.fecha===fe&&x.estado!=="anulado"})[0];
  if(c)return {k:c.estado==="arqueado"?"ok":(c.estado==="contado"?"ventas":"ini"),c:c};
  if(fe>h)return {k:"na"};
  if(fe<h)return {k:"falta",past:true};
  var lim=limiteDe(neg,t);
  return {k:(lim&&nowHM()>lim)?"falta":"hoy"};
}
var SEM_PRI={falta:4,ventas:3,hoy:2,ini:1,ok:0,na:-1};
/* devuelve {dias:[{fe,marks:[k..],peor}],rows:[{k,n,t,fe,c,lim,past}]} para un negocio y una semana */
function semInicio(neg,h){var f=h;S.conteos.forEach(function(c){if(c.negocio===neg&&c.estado!=="anulado"&&c.fecha<f)f=c.fecha});return f}
function semNegocio(neg,lun,h){
  var ini=semInicio(neg,h);
  var rows=[],dias=semFechas(lun).map(function(fe){
    var marks=[];
    if(fe>h||fe<ini||!isFullDay(neg,fe))return {fe:fe,marks:["na"],peor:"na"};
    turnosFor(neg).forEach(function(t){
      var e=semEstado(neg,t,fe,h);marks.push(e.k);
      if(e.k==="falta"||e.k==="ventas")rows.push({k:e.k==="falta"?"atraso":"ventas",n:neg,t:t,fe:fe,c:e.c,lim:limiteDe(neg,t),past:!!e.past});
    });
    if(!marks.length)marks=["na"];
    var peor=marks.reduce(function(a,b){return SEM_PRI[b]>SEM_PRI[a]?b:a},"na");
    return {fe:fe,marks:marks,peor:peor};
  });
  return {dias:dias,rows:rows};
}
function semTodo(){
  var h=today(),lun=semLunes(h),prev=addDays(lun,-7),neg={},acc=[],tot=0,ok=0,ant=[];
  SEM_OBLIG.filter(function(n){return S.cfg.negocios.indexOf(n)>-1}).forEach(function(n){
    var d=semNegocio(n,lun,h);neg[n]=d;
    d.dias.forEach(function(x){x.marks.forEach(function(k){if(k==="ok"||k==="ini"){tot++;ok++}else if(k==="falta"||k==="ventas")tot++})});
    acc=acc.concat(d.rows);
    var p=semNegocio(n,prev,h);ant=ant.concat(p.rows);
  });
  var ord=function(a,b){return (a.k===b.k?0:(a.k==="atraso"?-1:1))||(a.fe<b.fe?-1:a.fe>b.fe?1:0)};
  acc.sort(ord);ant.sort(ord);
  return {h:h,lun:lun,neg:neg,acc:acc,ant:ant,tot:tot,ok:ok};
}
/* conteos semanales generales: estado de esta semana */
function semGenerales(h,lun){
  var dom=addDays(lun,6);
  return SEM_GEN.filter(function(n){return S.cfg.negocios.indexOf(n)>-1}).map(function(n){
    var cal=(S.cfg.calendario&&S.cfg.calendario[n])||[],d=cal[0],c=S.conteos.filter(function(x){return x.negocio===n&&x.fecha>=lun&&x.fecha<=dom&&x.estado!=="anulado"})[0];
    var fe=(d==null)?"":addDays(lun,(d+6)%7),k,txt;
    if(c){k="ok";txt="Hecho"}
    else if(fe&&fe<h){k="falta";txt="Atrasado"}
    else if(fe===h){k="hoy";txt="Toca hoy"}
    else{k="na";txt="Toca el "+(d==null?"":DIAS_L[d].toLowerCase())}
    return {n:n,k:k,txt:txt,hoy:fe===h&&!c};
  });
}
function semMarca(k){return {ok:"✓",ini:"✓",ventas:"$",falta:"!",hoy:"…",na:"–"}[k]||""}
function semNota(k){return {ok:"Listo",ini:"Listo",ventas:"Falta cargar ventas",falta:"Falta el conteo",hoy:"Hoy todavía puede contarse",na:"No aplica"}[k]||""}
function semDiasHTML(neg,d){
  return '<div class="sem-dias">'+d.dias.map(function(x){
    var l=DIA_INI[dow(x.fe)],esHoy=x.fe===today();
    return '<button type="button" class="sem-d k-'+x.peor+(esHoy?" hoy":"")+'" data-act="sem-dia" data-fe="'+x.fe+'" aria-label="'+esc(fechaCorta(x.fe)+": "+semNota(x.peor))+'"><i>'+l+'</i><b>'+x.marks.map(semMarca).join(" ")+'</b></button>'}).join("")+'</div>';
}
function semCard(n,d,lun){
  var tot=0,ok=0,fal=0,ven=0;
  d.dias.forEach(function(x){x.marks.forEach(function(k){if(k==="ok"||k==="ini"){tot++;ok++}else if(k==="falta"){tot++;fal++}else if(k==="ventas"){tot++;ven++}})});
  var estado=fal?'<span class="pill crit">'+fal+' sin contar</span>':(ven?'<span class="pill rev">'+ven+' sin ventas</span>':'<span class="pill ok">Al día</span>');
  var nt=turnosFor(n).length;
  return '<section class="sem-card"><div class="sem-h"><div><h2>'+esc(n)+'</h2><small>'+(nt>1?nt+" turnos al día":"Conteo diario")+' · '+ok+' de '+tot+' listos</small></div>'+estado+'</div>'+semDiasHTML(n,d)+'</section>';
}
function semAccion(r,prev){
  var falta=r.k==="atraso",c=r.c;
  var titulo=falta?"Falta el conteo":"Falta cargar las ventas";
  var sub=esc(r.n)+" · "+esc(r.t)+" · "+esc(fechaCorta(r.fe))+(prev?" · semana pasada":"");
  var btn=falta?"":'<button class="btn small" data-act="vs-open" data-id="'+esc(c.id)+'">Registrar ventas</button>';
  var info=!falta&&c?'<small>Contó '+esc(c.resp)+' · '+haceTxt(c.ts)+'</small>':"";
  return '<div class="sem-acc '+(falta?"bad":"warn")+'"><div class="sem-at"><b>'+titulo+'</b><small>'+sub+'</small>'+info+(falta?waBtns(r):"")+'</div>'+btn+'</div>';
}
function semHTML(){
  var D=semTodo(),h=D.h,pend=D.acc.length+D.ant.length,hayAlm=almPend()>0;
  var pct=D.tot?Math.round(D.ok*100/D.tot):100;
  var nombre=(S.me&&S.me.nombre||"").split(" ")[0];
  var hero;
  if(!pend)hero='<div class="sem-hero ok"><div class="big">✓</div><div><h2>Vas al día'+(nombre?', '+esc(nombre):"")+'</h2><p>Food Shop y Zona Presidente están completos hasta hoy. Mañana vuelve a mirar este panel.</p></div></div>';
  else hero='<div class="sem-hero bad"><div class="big">'+pend+'</div><div><h2>'+(pend===1?"Te falta 1 cosa":"Te faltan "+pend+" cosas")+'</h2><p>Empieza por la primera de la lista de abajo. Son pasos cortos.</p></div></div>';
  var barra='<div class="sem-bar" role="img" aria-label="'+pct+'% de la semana completo"><span style="width:'+pct+'%"></span></div><p class="sem-barp"><b>'+D.ok+' de '+D.tot+'</b> arqueos de la semana listos · La semana cierra el domingo</p>';
  var acc=D.ant.map(function(r){return semAccion(r,true)}).concat(D.acc.map(function(r){return semAccion(r,false)}));
  if(hayAlm)acc.push('<div class="sem-acc warn"><div class="sem-at"><b>Traslados por hacer en Citrus</b><small>Hay '+almPend()+' movimientos del almacén esperando</small></div><button class="btn small" data-act="sem-ir" data-v="alm">Abrir Almacén</button></div>');
  var gen=semGenerales(h,D.lun);
  var genHTML=gen.length?'<section class="sem-card"><div class="sem-h"><div><h2>Conteos semanales</h2><small>Uno por semana, solo se abre su día</small></div></div>'+gen.map(function(g){
    return '<div class="sem-g"><span>'+esc(g.n)+'</span>'+(g.hoy?'<button class="btn small" data-act="sem-contar" data-n="'+esc(g.n)+'">Contar ahora</button>':'<span class="pill '+(g.k==="ok"?"ok":(g.k==="falta"?"crit":"rev"))+(g.k==="na"?" mute":"")+'">'+esc(g.txt)+'</span>')+'</div>'}).join("")+'</section>':"";
  var avisos=unread();
  var avisosHTML2=avisos?'<button class="sem-link" data-act="sem-ir" data-v="avisos">Tienes '+avisos+(avisos===1?" aviso sin leer":" avisos sin leer")+' <span>Ver</span></button>':"";
  var cards=Object.keys(D.neg).map(function(n){return semCard(n,D.neg[n],D.lun)}).join("");
  var leyenda='<div class="sem-ley"><span class="k-ok"><b>✓</b> Listo</span><span class="k-ventas"><b>$</b> Falta cargar ventas</span><span class="k-falta"><b>!</b> Falta el conteo</span><span class="k-hoy"><b>…</b> Aún es hora</span></div>';
  var ayuda='<details class="sem-ayuda"'+(S.semAyuda?" open":"")+'><summary>Cómo se hace, paso a paso</summary>'+
    '<ol class="sem-pasos">'+
    '<li><b>Mira este panel cada día.</b> Si todo está en verde, no tienes que hacer nada más.</li>'+
    '<li><b>Si ves rojo (!)</b> falta un conteo. Toca el botón de WhatsApp para avisarle a quien le toca contar.</li>'+
    '<li><b>Si ves amarillo ($)</b> ya contaron y faltan las ventas. Toca <em>Registrar ventas</em>, sube el archivo «Ventas por producto» de Citrus de ese turno y toca <em>Calcular arqueo</em>.</li>'+
    '<li><b>Mira el resultado.</b> Si sale algún producto en «Revisar» o «Crítico», entra al día y pregunta qué pasó.</li>'+
    '<li><b>La semana está completa</b> cuando Food Shop y Zona Presidente tienen ✓ en todos los días, hasta el domingo.</li></ol>'+
    '<div class="sem-nota"><b>Food Shop:</b> dos turnos al día (mañana y tarde), cada uno con su conteo y sus ventas.<br><b>Zona Presidente:</b> un conteo al día. Cuentan «Había» a las 3PM y «Quedan» a las 11PM.<br><b>Te equivocaste:</b> no pasa nada, pídele a administración que anule o corrija ese conteo.</div></details>';
  return '<div><h1>Mi semana</h1><p class="sub">Del '+esc(semRango(D.lun))+'. Food Shop y Zona Presidente se arquean todas las semanas: no se pueden saltar.</p></div>'+
    hero+barra+
    (acc.length?'<section class="sem-lista"><h2>Qué hago ahora</h2>'+acc.join("")+'</section>':"")+
    avisosHTML2+cards+leyenda+genHTML+ayuda+
    '<button class="btn ghost" data-act="sem-ir" data-v="pend">Ver pendientes de hoy</button>';
}
document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act^='sem-']");if(!el)return;
  var act=el.dataset.act;
  if(act==="sem-ir"){S.detail=null;S.vs=null;S.view=el.dataset.v;render();window.scrollTo(0,0)}
  else if(act==="sem-dia"){S.pFecha=el.dataset.fe<=today()?el.dataset.fe:"";S.detail=null;S.vs=null;S.view="pend";render();window.scrollTo(0,0)}
  else if(act==="sem-contar"){var n=el.dataset.n;S.detail=null;S.vs=null;S.view="contar";S.step="elegir";S.draft=newDraft();S.draft.negocio=n;S.draft.turno=sugTurno(n,S.draft.fecha);render();window.scrollTo(0,0)}
});
document.addEventListener("toggle",function(ev){var t=ev.target;if(t&&t.classList&&t.classList.contains("sem-ayuda"))S.semAyuda=t.open},true);

/* ---------- Equipo: agregar persona y enviar acceso por WhatsApp ---------- */
function eqN(){return S.eq.nuevo}
function eqEnlaceHTML(){
  var e=S.eq.enlace;if(!e)return "";
  var msg="Hola "+e.nombre.split(" ")[0]+" 👋\\n\\nToca este enlace para entrar a la app de La Barra. Es un solo toque, no necesitas código ni correo:\\n\\n"+e.url+"\\n\\nDespués de entrar, la app se queda abierta sola.";
  var wa=e.tel?'<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/'+waNum(e.tel)+'?text='+encodeURIComponent(msg)+'">Enviar por WhatsApp a '+esc(e.nombre.split(" ")[0])+'</a>':'<p class="hint">Esta persona no tiene teléfono guardado. Copia el enlace y envíaselo.</p>';
  return '<div class="panel eq-enlace"><h2>Enlace listo para '+esc(e.nombre)+'</h2><p class="sub">Vale 7 días. Cada persona tiene el suyo: no lo reenvíes a otra.</p>'+wa+
    '<button class="btn ghost" data-act="eqn-copiar">Copiar enlace</button><button class="linkbtn" data-act="eqn-cerrar">Listo, cerrar</button></div>';
}
function eqNuevoHTML(){
  var n=eqN();
  if(!n)return '<button class="btn" data-act="eqn-abrir">+ Agregar persona</button>';
  var chips=S.cfg.todosNegocios.map(function(x,i){return '<button type="button" class="tchip'+(n.negocios.indexOf(x)>-1?" on":"")+'" data-act="eqn-neg" data-v="'+i+'">'+esc(x)+'</button>'}).join("");
  var seg=[["colaborador","Colaborador"],["lider","Líder"],["supervisor","Supervisor"]].map(function(v){return '<button class="'+(n.rol===v[0]?"on":"")+'" data-act="eqn-rol" data-v="'+v[0]+'">'+v[1]+'</button>'}).join("");
  var scoped=n.rol==="lider"||n.rol==="colaborador";
  return '<div class="panel"><h2>Agregar persona</h2><p class="sub">Solo necesitas su nombre y su WhatsApp. No hace falta Gmail.</p>'+
    '<div class="field"><label class="lbl" for="eqn-nombre">Nombre</label><input id="eqn-nombre" autocomplete="off" placeholder="Nombre y apellido" value="'+esc(n.nombre)+'"></div>'+
    '<div class="field"><label class="lbl" for="eqn-tel">WhatsApp</label><input id="eqn-tel" type="tel" inputmode="tel" autocomplete="off" placeholder="809 555 1234" value="'+esc(n.telefono)+'"></div>'+
    '<div class="lbl">Rol</div><div class="seg">'+seg+'</div>'+
    (scoped?'<div><div class="lbl">Negocios</div><div class="chips" style="margin-top:8px">'+chips+'</div></div>':"")+
    (scoped?'<div><div class="lbl">Turnos (opcional)</div><div class="chips" style="margin-top:8px">'+["1","2","3"].map(function(t){return '<button type="button" class="tchip'+(n.turnos.indexOf(t)>-1?" on":"")+'" data-act="eqn-tur" data-v="'+t+'">Turno '+t+'</button>'}).join("")+'</div></div>':"")+
    '<div class="btnrow"><button class="btn" data-act="eqn-guardar">Guardar y crear enlace</button><button class="btn ghost" data-act="eqn-cerrar-form">Cancelar</button></div></div>';
}
function appBase(){
  var h=location.hostname;
  /* si la administración abre la app desde Apps Script, la dirección del navegador no sirve para otros: se usa la oficial */
  return (/\.github\.io$/.test(h)||h==="app.local")?location.origin+location.pathname:"https://aixa-cal.github.io/arqueo-grupo-labarra/";
}
async function eqInvitar(email){
  var r=await api("invitar",{email:email});
  S.eq.enlace={nombre:r.nombre,tel:r.telefono,url:appBase()+"#i="+r.token};
}
document.addEventListener("input",function(ev){
  var t=ev.target;if(!t||!t.id||!S.eq||!S.eq.nuevo)return;
  if(t.id==="eqn-nombre")S.eq.nuevo.nombre=t.value;else if(t.id==="eqn-tel")S.eq.nuevo.telefono=t.value;
});
document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act^='eqn-'],[data-act='eq-wa']");if(!el)return;
  var act=el.dataset.act,v=el.dataset.v,n=S.eq.nuevo;
  if(act==="eqn-abrir"){S.eq.nuevo={nombre:"",telefono:"",rol:"colaborador",negocios:[],turnos:[]};render()}
  else if(act==="eqn-cerrar-form"){S.eq.nuevo=null;render()}
  else if(act==="eqn-cerrar"){S.eq.enlace=null;render()}
  else if(act==="eqn-rol"){n.rol=v;render()}
  else if(act==="eqn-neg"){var nn=S.cfg.todosNegocios[+v],i=n.negocios.indexOf(nn);if(i>-1)n.negocios.splice(i,1);else n.negocios.push(nn);el.classList.toggle("on")}
  else if(act==="eqn-tur"){var j=n.turnos.indexOf(v);if(j>-1)n.turnos.splice(j,1);else n.turnos.push(v);el.classList.toggle("on")}
  else if(act==="eqn-copiar"){var u=S.eq.enlace&&S.eq.enlace.url;if(u&&navigator.clipboard)navigator.clipboard.writeText(u).then(function(){toast("Enlace copiado")},function(){toast("No se pudo copiar")});else toast("Mantén presionado el enlace para copiarlo")}
  else if(act==="eqn-guardar"){
    if(!n.nombre.trim()||String(n.telefono).replace(/\\D/g,"").length<10)return toast("Escribe el nombre y el WhatsApp completo.");
    if((n.rol==="colaborador"||n.rol==="lider")&&!n.negocios.length)return toast("Elige al menos un negocio.");
    guarded(async function(){
      var r=await api("crearPersona",{nombre:n.nombre.trim(),telefono:n.telefono,rol:n.rol,negocios:n.negocios,turnos:n.turnos});
      await eqInvitar(r.email);S.eq.nuevo=null;S.contactos=null;S.eq.users=await api("listUsers");render();window.scrollTo(0,0);
    });
  }
  else if(act==="eq-wa"){
    var id=el.dataset.id;
    guarded(async function(){await eqInvitar(id);render();window.scrollTo(0,0)});
  }
});

/* ---------- Guía visual "Cómo contar" (primera vez y botón de ayuda) ---------- */
var GUIA=[
  {e:"👋",t:"Contar es fácil",p:"Tú solo <b>cuentas lo que ves</b>.<br>La app hace todas las cuentas por ti."},
  {e:"🏪",t:"Elige tu tienda y tu turno",p:"Toca el nombre de tu tienda.<br>Toca tu turno.<br>Después toca <b>«Empezar conteo»</b>."},
  {e:"🔢",t:"Cuenta cada producto",p:"Verás <b>un producto a la vez</b>.<br>Mira el estante y toca <b>+</b> por cada uno que <b>HAY AHORA</b>.<br>Si llegó mercancía hoy, ponla en <b>«Llegó hoy»</b>.<br>Toca <b>Siguiente</b>."},
  {e:"✅",t:"Termina y guarda",p:"Contesta las preguntas del final.<br>Toca <b>«Guardar conteo»</b>.<br>¡Listo! Si te equivocas, avísale a tu supervisora."}
];
function guiaSeen(){if(navigator.webdriver&&!window.__guiaTest)return true;try{return !!localStorage.getItem("arq-guia-"+(S.me&&S.me.email))}catch(e){return true}}
function guiaMark(){try{localStorage.setItem("arq-guia-"+(S.me&&S.me.email),"1")}catch(e){}}
function guiaAuto(){
  if(!S.me||(S.me.rol!=="colaborador"&&S.me.rol!=="lider")||guiaSeen()||document.getElementById("guia"))return;
  guiaOpen(0);
}
function guiaOpen(i){
  var old=document.getElementById("guia");if(old)old.remove();
  var g=GUIA[i],last=i===GUIA.length-1;
  var d=document.createElement("div");d.id="guia";d.className="guia";d.setAttribute("role","dialog");d.setAttribute("aria-label","Cómo contar");
  d.innerHTML='<div class="guia-box"><button type="button" class="guia-x" data-act="guia-x" aria-label="Cerrar">✕</button>'+
    '<div class="guia-e">'+g.e+'</div><h2>'+g.t+'</h2><p>'+g.p+'</p>'+
    '<div class="guia-dots">'+GUIA.map(function(_,k){return '<i class="'+(k===i?"on":"")+'"></i>'}).join("")+'</div>'+
    '<div class="guia-b">'+(i>0?'<button type="button" class="btn ghost" data-act="guia-go" data-v="'+(i-1)+'">Atrás</button>':"")+
    '<button type="button" class="btn" data-act="'+(last?"guia-x":"guia-go")+'" data-v="'+(i+1)+'">'+(last?"¡Entendido!":"Siguiente")+'</button></div></div>';
  document.body.appendChild(d);
}
document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act^='guia-']");if(!el)return;
  var a=el.dataset.act;
  if(a==="guia-open")guiaOpen(0);
  else if(a==="guia-go")guiaOpen(+el.dataset.v);
  else if(a==="guia-x"){guiaMark();var g=document.getElementById("guia");if(g)g.remove()}
});

/* ---------- Dictado: «dime lo que tienes» ---------- */
var DIC_NUM={cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiun:21,veintiuno:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,treinta:30,cuarenta:40,cincuenta:50,sesenta:60,setenta:70,ochenta:80,noventa:90,cien:100,ciento:100,medio:0.5,media:0.5};
var DIC_STOP={de:1,del:1,la:1,el:1,los:1,las:1,y:1,e:1,con:1,en:1,mi:1,tengo:1,tenemos:1,hay:1,quedan:1,quedo:1,quedaron:1,queda:1,unidades:1,unidad:1,unid:1,empaque:1,empaques:1,cajas:1,caja:1,fundas:1,funda:1,paquetes:1,paquete:1,libras:1,libra:1,botellas:1,botella:1,latas:1,lata:1,pues:1,son:1,para:1,total:1,llegaron:1,llego:1,entro:1,entraron:1,recibi:1,recibimos:1,un:1,una:1,unos:1,unas:1};
function dicNorm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/ñ/g,"n").replace(/[^a-z0-9.,\s]/g," ").replace(/\s+/g," ").trim()}
function dicStem(w){return w.length>4&&/s$/.test(w)?w.slice(0,-1):w}
function dicToks(s){return dicNorm(s).split(" ").filter(function(w){return w&&!DIC_STOP[w]}).map(dicStem)}
function dicQty(words){
  /* devuelve {q,used:[índices]} con el primer número encontrado (acepta "dos y media", "2.5", "tres") */
  for(var i=0;i<words.length;i++){
    var w=words[i],q=null,used=[i];
    if(/^\d+([.,]\d+)?$/.test(w))q=parseFloat(w.replace(",","."));
    else if(DIC_NUM[w]!=null&&w!=="media"&&w!=="medio"){q=DIC_NUM[w];
      if(q>=20&&q<100&&words[i+1]==="y"&&DIC_NUM[words[i+2]]!=null&&DIC_NUM[words[i+2]]<10){q+=DIC_NUM[words[i+2]];used.push(i+1,i+2)}}
    else if(w==="media"||w==="medio"){q=0.5}
    if(q==null)continue;
    var n=words[i+used.length];
    if(q!==0.5&&words[i+used.length]==="y"&&(words[i+used.length+1]==="media"||words[i+used.length+1]==="medio")){q+=0.5;used.push(i+used.length,i+used.length+1)}
    else if(q!==0.5&&(n==="media"||n==="medio")){q+=0.5;used.push(i+used.length)}
    return {q:q,used:used};
  }
  return null;
}
function dicParse(text,prods){
  var t=dicNorm(text).replace(/\b(y)\s+(?=(\d|un\b|una\b|dos\b|tres\b|cuatro\b|cinco\b|seis\b|siete\b|ocho\b|nueve\b|diez\b|once\b|doce\b|quince\b|veinte\b))/g,function(m,a,off,str){
    /* «dos y media» no se corta; «pan y 3 salsas» sí */
    return " | "});
  t=t.replace(/\s*(\||,|;|\.(?=\s)|\bluego\b|\bdespues\b|\bademas\b)\s*/g,"|");
  var segs=t.split("|").map(function(x){return x.trim()}).filter(Boolean),ok=[],bad=[],idx=prods.map(function(p){return {p:p,tk:dicToks(p.nombre)}});
  segs.forEach(function(seg){
    var words=seg.split(" "),ent=/\b(llego|llegaron|entro|entraron|recibi|recibimos)\b/.test(seg),qq=dicQty(words);
    if(!qq){bad.push(seg);return}
    var rest=words.filter(function(_,i){return qq.used.indexOf(i)<0}).join(" "),tk=dicToks(rest);
    if(!tk.length){bad.push(seg);return}
    var best=null,tie=false;
    idx.forEach(function(x){
      if(!x.tk.length)return;
      var hit=0;tk.forEach(function(w){if(x.tk.some(function(y){return y===w||(w.length>=4&&y.indexOf(w)===0)||(y.length>=4&&w.indexOf(y)===0)}))hit++});
      if(!hit)return;
      var cover=hit/tk.length,prec=hit/x.tk.length,sc=cover*0.65+prec*0.35;
      if(cover<0.99&&sc<0.7)return;
      if(!best||sc>best.sc+0.001){best={x:x,sc:sc};tie=false}else if(Math.abs(sc-best.sc)<=0.001)tie=true;
    });
    if(!best||tie){bad.push(seg);return}
    ok.push({pid:best.x.p.id,nombre:best.x.p.nombre,unidad:best.x.p.unidad,qty:qq.q,f:ent?"ent":"fin",seg:seg});
  });
  return {ok:ok,bad:bad};
}
var DIC={txt:"",res:null,rec:null};
function dicOpen(){
  var old=document.getElementById("dic");if(old)old.remove();
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition,d=document.createElement("div");d.id="dic";d.className="guia";d.setAttribute("role","dialog");d.setAttribute("aria-label","Dime lo que tienes");
  var r=DIC.res,body;
  if(!r){
    body='<div class="guia-e">🎤</div><h2>Dime lo que tienes</h2><p>Toca el micrófono y habla, o escribe.<br>Ejemplo: <b>«pan de agua 3, pan brioche 2»</b></p>'+
      (SR?'<button type="button" class="btn dic-mic" data-act="dic-mic" id="dicmic">🎤 Hablar</button>':'<p class="hint">Usa el micrófono de tu teclado 🎤 para hablar.</p>')+
      '<textarea id="dictxt" rows="4" placeholder="Pan de agua 3, pan francés 2…">'+esc(DIC.txt)+'</textarea>'+
      '<div class="guia-b"><button type="button" class="btn ghost" data-act="dic-x">Cancelar</button><button type="button" class="btn" data-act="dic-go">Revisar</button></div>';
  }else{
    body='<h2>¿Está bien?</h2>'+(r.ok.length?'<ul class="dic-l">'+r.ok.map(function(o,i){return '<li><span class="dn">'+esc(o.nombre)+'<small>'+(o.f==="ent"?"Llegó":"Quedan")+'</small></span><span class="dq"><button type="button" class="sb" data-act="dic-q" data-i="'+i+'" data-d="-1" aria-label="Menos">−</button><b>'+fmt(o.qty)+'</b><button type="button" class="sb" data-act="dic-q" data-i="'+i+'" data-d="1" aria-label="Más">+</button></span><button type="button" class="dic-del" data-act="dic-del" data-i="'+i+'" aria-label="Quitar">✕</button></li>'}).join("")+'</ul>':'<p>No encontré productos.</p>')+
      (r.bad.length?'<div class="banner"><b>No entendí:</b> '+r.bad.map(esc).join(" · ")+'<br>Toca «Corregir» y dilo de otra forma.</div>':'')+
      '<div class="guia-b"><button type="button" class="btn ghost" data-act="dic-back">Corregir</button>'+(r.ok.length?'<button type="button" class="btn" data-act="dic-ok">✓ Confirmar</button>':'')+'</div>';
  }
  d.innerHTML='<div class="guia-box dic-box"><button type="button" class="guia-x" data-act="dic-x" aria-label="Cerrar">✕</button>'+body+'</div>';
  document.body.appendChild(d);
}
function dicClose(){if(DIC.rec){try{DIC.rec.stop()}catch(e){}DIC.rec=null}var d=document.getElementById("dic");if(d)d.remove()}
document.addEventListener("input",function(ev){if(ev.target.id==="dictxt")DIC.txt=ev.target.value});
document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act^='dic-']");if(!el)return;
  var a=el.dataset.act;
  if(a==="dic-open"){DIC.txt="";DIC.res=null;dicOpen()}
  else if(a==="dic-x"){DIC.res=null;dicClose()}
  else if(a==="dic-back"){DIC.res=null;dicOpen()}
  else if(a==="dic-go"){var ta=document.getElementById("dictxt");if(ta)DIC.txt=ta.value;if(DIC.rec){try{DIC.rec.stop()}catch(e){}DIC.rec=null}
    if(!DIC.txt.trim()){toast("Escribe o di lo que tienes");return}
    DIC.res=dicParse(DIC.txt,negProducts());dicOpen()}
  else if(a==="dic-q"){var o=DIC.res.ok[+el.dataset.i];o.qty=Math.max(0,Math.round((o.qty+(+el.dataset.d))*100)/100);dicOpen()}
  else if(a==="dic-del"){DIC.res.ok.splice(+el.dataset.i,1);dicOpen()}
  else if(a==="dic-ok"){
    var n=0;DIC.res.ok.forEach(function(o){var v=S.draft.vals[o.pid];if(!v)return;v[o.f]=fmtRaw(o.qty);if(o.f==="ent")v.entTouched=true;n++;
      var inp=document.getElementById("i-"+o.pid+"-"+o.f);if(inp)inp.value=v[o.f];updateCard(o.pid)});
    updateProgress();persistDraft();DIC.res=null;DIC.txt="";dicClose();toast("✓ Listo: se llenaron "+n+(n===1?" producto":" productos")+". Revisa y toca Guardar conteo.")}
  else if(a==="dic-mic"){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
    if(DIC.rec){try{DIC.rec.stop()}catch(e){}DIC.rec=null;el.textContent="🎤 Hablar";el.classList.remove("on");return}
    var r=new SR();r.lang="es-DO";r.interimResults=true;r.continuous=true;DIC.rec=r;el.textContent="⏹ Parar";el.classList.add("on");
    var base=(document.getElementById("dictxt")||{}).value||"";base=base.trim()?base.trim()+", ":"";
    r.onresult=function(e){var s="";for(var i=0;i<e.results.length;i++)s+=e.results[i][0].transcript+" ";DIC.txt=base+s.trim();var ta=document.getElementById("dictxt");if(ta)ta.value=DIC.txt};
    r.onerror=function(){DIC.rec=null;var b=document.getElementById("dicmic");if(b){b.textContent="🎤 Hablar";b.classList.remove("on")}toast("No pude oír. Escribe o usa el micrófono del teclado.")};
    r.onend=function(){DIC.rec=null;var b=document.getElementById("dicmic");if(b){b.textContent="🎤 Hablar";b.classList.remove("on")}};
    try{r.start()}catch(e){DIC.rec=null}
  }
});

document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act^='paso']");if(!el||!S.draft)return;
  var a=el.dataset.act,d=S.draft;
  if(a==="paso"){
    var list=negProducts(),i=(+d.paso||0)+(+el.dataset.v);
    if(i>=list.length){d.modo="lista";persistDraft();render();var c=document.getElementById("cierre");if(c)c.scrollIntoView({block:"start"});else window.scrollTo(0,document.body.scrollHeight);return}
    d.paso=Math.max(0,i);persistDraft();render();window.scrollTo(0,0);
  }
  else if(a==="paso-ll"){var pz=document.querySelector(".paso");if(pz)pz.classList.toggle("ll-open")}
  else if(a==="paso-lista"){d.modo="lista";persistDraft();render();window.scrollTo(0,0)}
  else if(a==="paso-uno"){d.modo="uno";persistDraft();render();window.scrollTo(0,0)}
});
