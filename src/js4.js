
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
      ((f.rol==="lider"||f.rol==="colaborador")?'<div><div class="lbl">Turnos que cubre (opcional)</div><p class="hint">Sirve para que el aviso de WhatsApp le llegue a quien le toca. Sin marcar, se le avisa de todos los turnos.</p><div class="chips" style="margin-top:8px">'+["1","2","3"].map(function(t){return '<button type="button" class="tchip'+((f.turnos||[]).indexOf(t)>-1?" on":"")+'" data-act="eq-tur" data-v="'+t+'">Turno '+t+'</button>'}).join("")+'</div></div>':"")+
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
