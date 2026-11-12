
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
  var sel=S.pFecha&&S.pFecha<=h?S.pFecha:"";if(sel)days=[sel];
  days.forEach(function(fe){
    S.cfg.negocios.forEach(function(n){
      if(!isFullDay(n,fe))return;
      turnosFor(n).forEach(function(t){
        var c=S.conteos.filter(function(x){return x.negocio===n&&x.turno===t&&x.fecha===fe&&x.estado!=="anulado"})[0];
        var lim=limiteDe(n,t);
        if(c){seen[c.id]=1;
          if(fe!==h&&!sel&&c.estado!=="contado")return;
          rows.push({k:c.estado==="contado"?"ventas":(c.estado==="arqueado"?"ok":"ini"),n:n,t:t,fe:fe,c:c,lim:lim});
        }else if(fe===h){
          var late=lim&&hm>lim;
          rows.push({k:late?"atraso":"falta",n:n,t:t,fe:fe,lim:lim});
        }else rows.push({k:"atraso",n:n,t:t,fe:fe,lim:lim,past:true});
      });
    });
  });
  if(!sel)S.conteos.forEach(function(c){if(c.estado==="contado"&&!seen[c.id])rows.push({k:"ventas",n:c.negocio,t:c.turno,fe:c.fecha,c:c,lim:""})});
  var ord={atraso:0,ventas:1,falta:2,ok:3,ini:4};
  rows.sort(function(a,b){return (ord[a.k]-ord[b.k])||(a.fe<b.fe?1:a.fe>b.fe?-1:0)});
  return rows;
}
/* Recordatorio por WhatsApp: abre el chat con el mensaje ya escrito (no envía solo) */
function waNum(t){var d=String(t||"").replace(/\D/g,"");return d.length===10?"1"+d:d}
function waBtns(r){
  if(!(role()==="admin"||role()==="supervisor"))return "";
  var gente=(S.contactos||[]).filter(function(c){return (c.rol==="lider"||c.rol==="colaborador")&&(c.negocios||[]).indexOf(r.n)>-1&&(!(c.turnos||[]).length||c.turnos.indexOf(String(r.t).replace(/^Turno (\d).*$/,"$1"))>-1)});
  if(!gente.length)return "";
  var url=location.origin+location.pathname;
  return '<div class="wabox">'+gente.map(function(c){
    var msg="Hola "+c.nombre.split(" ")[0]+", aún no aparece el conteo de "+r.n+" · "+r.t+" de hoy"+(r.lim?" (límite "+r.lim+")":"")+". Por favor cuéntalo y confirma el cierre del turno en: "+url;
    return '<a class="btn small wa" target="_blank" rel="noopener" href="https://wa.me/'+waNum(c.telefono)+'?text='+encodeURIComponent(msg)+'">WhatsApp · '+esc(c.nombre.split(" ")[0])+'</a>'}).join("")+'</div>';
}
var DOWS=["dom","lun","mar","mié","jue","vie","sáb"];
var MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
/* Selector de fecha: calendario del teléfono, mostrado siempre como dd/mm/aaaa y con el diseño de la app */
function datePick(id,val,max){
  return '<label class="dpick"><span class="dptxt">'+(val?fmtFecha(val):"dd/mm/aaaa")+'</span><svg class="dpic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg><input type="date" class="dpin" data-dpin="'+id+'" aria-label="Elegir fecha" max="'+max+'" value="'+esc(val||"")+'"></label>';
}
function fechaCorta(fe){var d=new Date(fe+"T12:00:00");return DOWS[d.getDay()]+" "+(+fe.slice(8))+"/"+(+fe.slice(5,7))}
function diaLbl(fe){var h=today();return (fe===h?"Hoy · ":fe===addDays(h,-1)?"Ayer · ":"")+fechaCorta(fe)}
function porDia(rows,fn){
  var g={},ord=[];rows.forEach(function(r){if(!g[r.fe]){g[r.fe]=[];ord.push(r.fe)}g[r.fe].push(r)});
  ord.sort(function(a,b){return a<b?1:-1});
  return ord.map(function(fe){
    var body=g[fe].map(fn).join(""),h=today();
    if(fe===h||ord.length===1)return '<div class="dayh"><b>'+esc(diaLbl(fe))+'</b><span>'+g[fe].length+'</span></div>'+body;
    return '<details class="dayd"><summary class="dayh"><b>'+esc(diaLbl(fe))+'</b><span>'+g[fe].length+'</span></summary>'+body+'</details>';
  }).join("");
}
function pendHTML(){
  var rows=porCompletar(),h=today();
  var falta=rows.filter(function(r){return r.k==="atraso"||r.k==="falta"});
  var vent=rows.filter(function(r){return r.k==="ventas"});
  var okr=rows.filter(function(r){return r.k==="ok"||r.k==="ini"});
  var resumen='<div class="stat"><div class="sbox'+(falta.length?" bad":"")+'"><b>'+falta.length+'</b><span>Sin contar</span></div><div class="sbox'+(vent.length?" bad":"")+'"><b>'+vent.length+'</b><span>Esperando ventas</span></div></div>';
  var rowFalta=function(r){
    var late=r.k==="atraso";
    return '<div class="pitem"><div><b>'+esc(r.n)+'</b><small>'+esc(r.t)+(r.lim&&!r.past?' · límite '+r.lim:"")+'</small>'+waBtns(r)+'</div><span class="st '+(late?"late":"wait")+'">'+(late?"Atrasado":"Por contar")+'</span></div>';
  };
  var rowVent=function(r){
    var c=r.c,late=Date.now()-c.ts>12*3600000;
    return '<div class="pitem"><div><b>'+esc(r.n)+'</b><small>'+esc(r.t)+'</small><small>Contó '+esc(c.resp)+' · <span'+(late?' class="hi"':"")+'>'+haceTxt(c.ts)+'</span></small></div><button class="btn small" data-act="vs-open" data-id="'+esc(c.id)+'">Registrar ventas</button></div>';
  };
  var rowOk=function(r){
    var c=r.c,rs=c.resumen||{};
    if(r.k==="ini")return '<div class="pitem"><div><b>'+esc(r.n)+'</b><small>'+esc(r.t)+' · conteo inicial</small></div><span class="st ok">Inicial</span></div>';
    return '<button class="pitem" style="width:100%;text-align:left" data-act="det-open" data-id="'+esc(c.id)+'"><div><b>'+esc(r.n)+'</b><small>'+esc(r.t)+'</small></div>'+(rs.crit?'<span class="pill crit">'+rs.crit+' crítico</span>':(rs.rev?'<span class="pill rev">'+rs.rev+' revisar</span>':'<span class="pill ok">Todo OK</span>'))+'</button>';
  };
  var html="";
  if(falta.length){
    var sinTel={};
    if(isAdmin())falta.forEach(function(r){var g=(S.contactos||[]).some(function(c){return (c.rol==="lider"||c.rol==="colaborador")&&(c.negocios||[]).indexOf(r.n)>-1});if(!g)sinTel[r.n]=1});
    var nt=Object.keys(sinTel);
    html+='<section class="psec"><h2>Falta contar <span>'+falta.length+'</span></h2>'+(nt.length?'<p class="hint">Para avisar por WhatsApp agrega teléfonos en Equipo: '+nt.map(esc).join(", ")+'.</p>':"")+porDia(falta,rowFalta)+'</section>';
  }
  if(vent.length)html+='<section class="psec"><h2>Falta cargar ventas <span>'+vent.length+'</span></h2>'+porDia(vent,rowVent)+'</section>';
  if(okr.length)html+='<details class="psec fold"'+(S.pFecha?' open':'')+'><summary>Al día <span>'+okr.length+'</span></summary>'+porDia(okr,rowOk)+'</details>';
  if(!rows.length)html='<div class="panel center"><div class="big">✓</div><h3>Todo al día</h3><p class="sub">No hay turnos configurados con conteo hoy.</p></div>';
  else if(!falta.length&&!vent.length)html='<div class="panel center"><div class="big">✓</div><h3>Todo al día</h3><p class="sub">No falta ningún conteo ni ventas por cargar.</p></div>'+html;
  var sel=S.pFecha&&S.pFecha<=h?S.pFecha:"";
  var fsel='<div class="datebar"><span class="lbl">Ver otro día</span><div class="dbrow">'+datePick("p-fecha",sel||h,h)+(sel&&sel!==h?'<button class="btn small ghost" data-act="p-hoy">Volver a hoy</button>':"")+'</div></div>';
  return '<div><h1>Por completar</h1><p class="sub">'+(sel?'Mostrando <b>'+esc(diaLbl(sel))+'</b>.':'Lo que falta por contar y por arquear, con su fecha.')+'</p></div>'+
    fsel+resumen+html+
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
function applyCsv(key,text,fname,add){
  var vs=S.vs,rows=parseCitrus(text);
  if(!rows.length){toast("No encontré ventas en ese archivo. Debe ser el reporte «Ventas por producto» de Citrus en CSV.");return false}
  var old=add&&vs.csv[key];
  vs.csv[key]=old?{name:old.name+" + "+fname,rows:old.rows.concat(rows)}:{name:fname,rows:rows};recomputeTramo(key);return true;
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
      '<label class="fileb"><input type="file" multiple accept=".csv,.txt,text/csv,text/plain" data-csv="'+esc(t.key)+'">'+(csv?"Cambiar archivo(s) CSV":"Subir CSV de Citrus")+'</label>'+(csv?'<label class="fileb ghost"><input type="file" multiple accept=".csv,.txt,text/csv,text/plain" data-csv="'+esc(t.key)+'" data-add="1">Agregar otro archivo (otra caja)</label>':'<p class="hint">Si el período tiene más de una caja (por ejemplo la de madrugada), sube todos los archivos juntos o agrégalos uno por uno: se suman.</p>')+stats+uns+
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
  if(S.fRango==="custom")return (!S.fDesde||f>=S.fDesde)&&(!S.fHasta||f<=S.fHasta);
  return f>=addDays(today(),-(n-1))&&f<=today();
}

function csvDown(name,rows){
  var t="﻿"+rows.map(function(r){return r.map(function(v){v=v==null?"":String(v);return /[",;\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(",")}).join("\r\n");
  var b=new Blob([t],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
  a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);
}

/* Excel (.xlsx) mínimo sin librerías: zip sin comprimir + hoja con texto en línea */
var CRCT=null;
function crc32(u8){if(!CRCT){CRCT=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;CRCT[n]=c>>>0}}var c=0xFFFFFFFF;for(var i=0;i<u8.length;i++)c=CRCT[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zipStore(files){
  var enc=new TextEncoder(),parts=[],cen=[],off=0;
  function u16(n){return [n&255,(n>>8)&255]}function u32(n){return [n&255,(n>>8)&255,(n>>16)&255,(n>>>24)&255]}
  files.forEach(function(f){
    var nm=enc.encode(f[0]),d=enc.encode(f[1]),cr=crc32(d);
    var lh=[].concat(u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(cr),u32(d.length),u32(d.length),u16(nm.length),u16(0));
    parts.push(new Uint8Array(lh),nm,d);
    cen.push([].concat(u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(cr),u32(d.length),u32(d.length),u16(nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off)),Array.prototype.slice.call(nm));
    off+=lh.length+nm.length+d.length;
  });
  var cs=0,cd=[];cen.forEach(function(a){cs+=a.length;cd.push(new Uint8Array(a))});
  var end=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cs),u32(off),u16(0)));
  return new Blob(parts.concat(cd,[end]),{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
function xmlE(v){return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function xlsxDown(name,sheet,rows){
  var cols="ABCDEFGHIJ";
  var sd=rows.map(function(r,ri){return '<row r="'+(ri+1)+'">'+r.map(function(v,ci){
    var ref=cols[ci]+(ri+1);if(v===""||v==null)return "";
    return typeof v==="number"?'<c r="'+ref+'"><v>'+v+'</v></c>':'<c r="'+ref+'" t="inlineStr"><is><t>'+xmlE(v)+'</t></is></c>'}).join("")+'</row>'}).join("");
  var X='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  var b=zipStore([
    ["[Content_Types].xml",X+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
    ["_rels/.rels",X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ["xl/workbook.xml",X+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+xmlE(sheet)+'" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ["xl/_rels/workbook.xml.rels",X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'],
    ["xl/worksheets/sheet1.xml",X+'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+sd+'</sheetData></worksheet>']
  ]);
  var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);
}
/* Archivo para importar existencias en Citrus (plantilla «Importar Inventario») */
function csvCitrus(c){
  var rows=[["Nombre","Costo","Cantidad","Series","Lote","Fecha Expiración"]];
  c.items.forEach(function(it){var p=prodById(it.pid);rows.push([it.nombre,(p&&+p.costo)||0,+it.fin||0,"","",""])});
  xlsxDown("Citrus_Inventario_"+slug(c.negocio.replace(/ General$/,""))+"_"+c.fecha+".xlsx","Lista de Inventario",rows);
}
function esGeneralLB(n){return /^La Barra .* General$/.test(n||"")}
function estTxt(e){return {inicial:"Conteo inicial",contado:"Esperando ventas",arqueado:"Arqueado",anulado:"Anulado"}[e]||e}
function slug(s){return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"_").replace(/^_|_$/g,"")}
function csvDet(c){
  var rs=c.resumen||{},rows=[["Negocio",c.negocio],["Turno",c.turno],["Fecha",fmtFecha(c.fecha)],["Contó",c.resp],["Estado",estTxt(c.estado)]];
  if(c.estado==="arqueado"&&!rs.consumo)rows.push(["OK",rs.ok||0],["Por revisar",rs.rev||0],["Críticos",rs.crit||0],["Faltante estimado",rs.faltante||0]);
  rows.push([]);
  if(c.estado==="arqueado"&&c.res&&!rs.consumo){
    rows.push(["Producto","Unidad","Había","Entró","Quedan","Ventas","Salió","Debía","Diferencia","Estado"]);
    c.res.forEach(function(x){rows.push([x[1],x[2],x[3],x[4],x[5],x[6],x[7],x[8],x[9],x[11]])});
  }else if(c.estado==="arqueado"&&c.res){
    rows.push(["Producto","Unidad","Había","Entró","Quedan","Consumo"]);
    c.res.forEach(function(x){rows.push([x[1],x[2],x[3],x[4],x[5],x[7]])});
  }else{
    rows.push(["Producto","Había","Entró","Quedan"]);
    c.items.forEach(function(it){rows.push([it.nombre,it.ini,it.ent,it.fin])});
  }
  csvDown("Arqueo_"+slug(c.negocio)+"_"+slug(c.turno.split(" (")[0])+"_"+c.fecha+".csv",rows);
}
function csvLista(list){
  var rows=[["Fecha","Negocio","Turno","Contó","Estado","OK","Por revisar","Críticos","Faltante estimado"]];
  list.slice().sort(function(a,b){return a.fecha<b.fecha?-1:a.fecha>b.fecha?1:0}).forEach(function(c){var r=c.resumen||{};
    rows.push([fmtFecha(c.fecha),c.negocio,c.turno,c.resp,estTxt(c.estado),r.ok||0,r.rev||0,r.crit||0,r.faltante||0])});
  csvDown("Arqueos_"+(S.fNeg?slug(S.fNeg)+"_":"")+new Date().toISOString().slice(0,10)+".csv",rows);
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
  var rg=[["1","Hoy"],["7","Últimos 7 días"],["30","Últimos 30 días"],["custom","Elegir fechas"],["all","Todo"]].map(function(r){return opt(r[0],r[1],S.fRango)}).join("");
  var es=[["","Todos"],["contado","Esperando ventas"],["inicial","Conteo inicial"],["arqueado","Arqueados"],["anulado","Anulados"]].map(function(r){return opt(r[0],r[1],S.fEstado)}).join("");
  var cards=list.length?list.map(function(c){
    return '<button class="pitem" style="width:100%;text-align:left" data-act="det-open" data-id="'+esc(c.id)+'"><div><b>'+esc(c.negocio)+' · '+esc(c.turno)+'</b><small>'+fmtFecha(c.fecha)+' · '+esc(c.resp)+(c.rect?' · rectificado':'')+'</small></div><div class="chips" style="justify-content:flex-end">'+resumenPills(c)+'</div></button>';
  }).join(""):'<div class="panel"><h3>Sin conteos en este período</h3><p class="sub">Cuando los líderes guarden conteos, aparecerán aquí.</p></div>';
  return '<div><h1>Resultados</h1></div>'+
    '<div class="row2"><div class="field"><label class="lbl" for="f-neg">Negocio</label><select id="f-neg">'+neg+'</select></div><div class="field"><label class="lbl" for="f-rango">Período</label><select id="f-rango">'+rg+'</select></div></div>'+
    (S.fRango==="custom"?'<div class="row2"><div class="field"><span class="lbl">Desde</span>'+datePick("f-desde",S.fDesde||addDays(today(),-6),today())+'</div><div class="field"><span class="lbl">Hasta</span>'+datePick("f-hasta",S.fHasta||today(),today())+'</div></div>':"")+
    '<div class="field"><label class="lbl" for="f-est">Estado</label><select id="f-est">'+es+'</select></div>'+
    '<div class="plist">'+cards+'</div>'+(list.length?'<button class="btn ghost" data-act="csv-lista">Descargar reporte (Excel/CSV)</button>':"");
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
  var cierreH=c.cierre?'<div class="panel"><div class="lbl">Cierre del turno</div><p>✓ Áreas, relleno, limpiezas, equipos, caja, baños y safacones confirmados.</p><p><b>Novedad:</b> '+(c.cierre.nov==="si"?esc(c.cierre.txt):"No")+'</p>'+(c.cierre.fz?'<p><b>Freezers:</b> '+(c.cierre.fz.ok==="si"?"✓ todos funcionan":"✗ NO funcionan")+(c.cierre.fz.txt?' — '+esc(c.cierre.fz.txt):"")+'</p>':"")+(c.cierre.bano?'<p><b>Baño y clientes:</b> papel y jabón '+(c.cierre.bano.papel==="si"?"✓ sí":"✗ NO")+' · área de clientes limpia '+(c.cierre.bano.cli==="si"?"✓ sí":"✗ NO")+(c.cierre.bano.txt?' — '+esc(c.cierre.bano.txt):"")+'</p>':"")+(c.cierre.cafe?'<p><b>Máquinas de café:</b> rellenadas '+(c.cierre.cafe.rell==="si"?"✓ sí":"✗ NO")+' · funcionan bien '+(c.cierre.cafe.func==="si"?"✓ sí":"✗ NO")+(c.cierre.cafe.txt?' — '+esc(c.cierre.cafe.txt):"")+'</p>':"")+'</div>':"";
  var histH=(c.hist&&c.hist.length)?'<div class="panel"><div class="lbl">Historial de cambios</div>'+c.hist.map(function(h){var a=h.accion==="rectificar"?"Rectificó el conteo":h.accion==="anular"?"Anuló el conteo":h.accion==="ventas-cambio"?"Cambió las ventas":"Registró las ventas";return '<div class="pitem"><div><b>'+esc(a)+'</b><small>'+esc(h.quien)+' · '+fmtFecha(new Date(h.ts).toISOString().slice(0,10))+' '+hora(h.ts)+'</small>'+(h.detalle?'<small>'+esc(h.detalle)+'</small>':"")+'</div></div>'}).join("")+'</div>':"";
  if(c.estado!=="anulado"&&esGeneralLB(c.negocio))acts+='<button class="btn" data-act="csv-citrus">Descargar para subir a Citrus (Excel)</button>';
  if(c.estado!=="anulado")acts+='<button class="btn ghost" data-act="csv-det">Descargar este arqueo (Excel/CSV)</button>';
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
  var g={},ord=[];
  S.notifs.forEach(function(n){var fe=new Date(n.ts).toISOString().slice(0,10);if(!g[fe]){g[fe]=[];ord.push(fe)}g[fe].push(n)});
  var list=ord.length?ord.map(function(fe){
    return '<div class="dayh"><b>'+esc(diaLbl(fe))+'</b></div>'+g[fe].map(function(n){
      return '<button class="ni'+(n.leido?"":" unread")+'" data-act="notif" data-id="'+esc(n.id)+'"><span class="dot"></span><span class="nbody"><b>'+esc(n.titulo)+'</b><small>'+esc(n.texto)+'</small></span><span class="when">'+hora(n.ts)+'</span></button>';
    }).join("");
  }).join(""):'<div class="panel center"><div class="big">✓</div><h3>Sin avisos</h3><p class="sub">Cuando pase algo importante, aparecerá aquí.</p></div>';
  var u=unread();
  return '<div class="top"><div><h1>Avisos</h1>'+(u?'<p class="sub">'+u+' sin leer</p>':"")+'</div>'+(u?'<button class="btn small ghost" data-act="read-all">Marcar leídos</button>':"")+'</div><div class="plist">'+list+'</div>';
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
