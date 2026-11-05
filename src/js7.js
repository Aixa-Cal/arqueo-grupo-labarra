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
