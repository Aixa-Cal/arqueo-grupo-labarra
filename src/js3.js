
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
    if(r.k==="atraso")return '<div class="pitem"><div>'+title+'<small><span class="st late">Atrasado: sin contar</span>'+dia+(r.lim&&!r.past?' · límite '+r.lim:"")+'</small></div></div>';
    return '<div class="pitem"><div>'+title+'<small><span class="st wait">Sin contar · hasta '+(r.lim||"fin del día")+'</span></small></div></div>';
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
  var c=d.c,adm=isAdmin();
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
    acts+=d.anular?'<div class="panel"><div class="field"><label class="lbl" for="motivo">Motivo para anular</label><input id="motivo" value="'+esc(d.motivo)+'"></div><div class="btnrow"><button class="btn danger" data-act="anular-ok">Sí, anular conteo</button><button class="btn ghost" data-act="anular-no">No</button></div></div>':'<button class="btn small ghost" data-act="anular">Anular este conteo</button>';
  }
  return head+kp+table+notaH+sin+acts+'<div style="height:8px"></div>';
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
