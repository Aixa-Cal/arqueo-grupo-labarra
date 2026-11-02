
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
