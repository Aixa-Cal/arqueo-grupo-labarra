
/* ===== Almacén: Maria recibe y saca mercancía; Griselda lo pasa a Citrus; Khristal marca facturas ===== */
function esVirtual(n){return n==="Almacén"||/ General$/.test(n||"")}
function almOk(){var r=role();return r==="admin"||r==="supervisor"||r==="gerencia"||(S.cfg&&S.cfg.negocios.indexOf("Almacén")>-1)}
function almSolo(){var n=(S.cfg&&S.cfg.negocios)||[];return n.length>0&&n.every(function(x){return x==="Almacén"})}
function almVe(){var r=role();return r==="admin"||r==="supervisor"}
function almPend(){return almVe()?(S.almacen||[]).filter(function(a){return a.estado==="nuevo"}).length:0}
function AL(){return S.alm||(S.alm={modo:"",ck:null,pr:{lineas:[],eid:null,saving:false},fotos:[],nota:"",destino:"",lines:[],q:"",saving:false,eid:null,ver:{}})}
function almProds(){return S.productos.filter(function(p){return p.cat==="Almacén"})}
function fotoComprimir(file){
  return new Promise(function(res,rej){
    var fr=new FileReader();
    fr.onerror=function(){rej(new Error("No pude leer la foto."))};
    fr.onload=function(){
      var im=new Image();
      im.onerror=function(){rej(new Error("No pude abrir la foto."))};
      im.onload=function(){
        var m=1400,w=im.width,h=im.height,k=Math.min(1,m/Math.max(w,h));
        var c=document.createElement("canvas");c.width=Math.round(w*k);c.height=Math.round(h*k);
        c.getContext("2d").drawImage(im,0,0,c.width,c.height);
        res(c.toDataURL("image/jpeg",0.72));
      };
      im.src=fr.result;
    };
    fr.readAsDataURL(file);
  });
}

var CK=[["Temperaturas",null,0]];
var CKI=[
 ["Cuarto frío","Confirmar que no haya contaminación cruzada"],["Cuarto frío","Revisar que no haya productos dañados"],["Cuarto frío","Todo tapado y etiquetado (FIFO)"],
 ["Higiene","Limpieza e higiene de colaboradores"],["Higiene","Uniforme completo en uso"],
 ["Limpieza","Áreas y superficies limpias y desinfectadas"],["Limpieza","Utensilios y equipos limpios y sanitizados"],["Limpieza","Rectificar limpieza de callejón"],["Limpieza","Rectificar limpieza de freidores"],
 ["Producción","Validar inicio de producción de pierna"],["Producción","Validar inicio de producción de pollo"],["Producción","Pierna o pollo enfriando"],["Producción","Empaque de pierna o pollo completo"],
 ["Producción","Producción de alitas y pechuguitas"],["Producción","Registro de cantidad de alitas/pechuguitas procesadas"],["Producción","Producción de carne de chicken"],["Producción","Bandejas rebanadas (cheddar, danés, jamón, salami)"],
 ["Producción","Registro de unidades producidas (alitas y pechuguitas)"],["Producción","Se pesó la fresa"],["Producción","Producción de aderezos (ajo, BBQ, buffalo, rosada, fundido)"],["Producción","Registro de cantidades de aderezos"],
 ["Producción","Existencia de insumos clave (salami Genoa, puerro, etc.)"],["Producción","Revisar producción de la tarde"],["Producción","Producto final cumple el estándar de calidad"],
 ["Mercancía y envíos","Recibir suplidores (cantidades y calidad)"],["Mercancía y envíos","Validar insumos retirados del cuarto frío"],["Mercancía y envíos","Coordinar envío a las sucursales"],
 ["Lunes","Informar a administración los productos disponibles para el pedido de la semana",1],["Lunes","Confirmar visita a Atalaya y Miraflores",1],["Viernes","Confirmar visita a sucursales",5]];
var CKT=[["aceite","Aceite de freidores","°F","275–300"],["camara","Cámaras","°C","0–5"],["congelador","Congeladores","°C","hasta −18"]];
var TRANGO={aceite:[275,300],camara:[0,5],congelador:[-100,-18]};
var PRODS=[["Frutas",["Lulo","Fresa (se empaca)","Granadillo","Chinola","Limón","Zapote","Tamarindo","Lechosa","Piña","Melón","Cereza","Guanábana","Mango"]],
 ["Cuarto frío y producción",["Caja de pechuga de pollo → pechuguitas","Caja de alitas → alitas","Barra de queso danés","Barra de queso cheddar","Queso rebanado (danés)","Queso rebanado (cheddar)","Jamón rebanado de cerdo","Salami Induveca","Caja de pechuga de pollo → bolsas de pollo","Masa de cerdo → bolsas de pierna"]]];
function ckHoy(){var d=dow(S.hoy||today());return d}
function ckVis(i){var it=CKI[i],d=it[2];return !d||d===ckHoy()}
function ckState(){
  var a=AL();
  if(!a.ck||a.ck.f!==today()){
    var r=(S.produccion||[]).filter(function(x){return x.tipo==="checklist"&&x.fecha===today()})[0];
    a.ck={f:today(),chk:r?r.datos.chk.slice():[],temps:r?JSON.parse(JSON.stringify(r.datos.temps||{})):{},nota:r?(r.datos.nota||""):"",saved:r?r.ts:0,saving:false};
  }
  return a.ck;
}
function ckHTML(){
  var k=ckState(),sec="",out="",hecho=0,total=0;
  var temps='<div class="lbl" style="margin-top:6px">Temperaturas</div>'+CKT.map(function(t){
    var v=k.temps[t[0]],fuera=(v!=null&&v!==""&&(+v<TRANGO[t[0]][0]||+v>TRANGO[t[0]][1]));
    return '<div class="rline"><div><b>'+t[1]+'</b><small>Debe estar '+t[3]+' '+t[2]+(fuera?' · <span style="color:#B3261E">fuera de rango</span>':"")+'</small></div><input inputmode="decimal" autocomplete="off" placeholder="'+t[2]+'" aria-label="'+t[1]+'" data-ckt="'+t[0]+'" value="'+(v==null?"":esc(v))+'"></div>'}).join("");
  CKI.forEach(function(it,i){
    if(!ckVis(i))return;total++;if(k.chk[i])hecho++;
    if(it[0]!==sec){sec=it[0];out+='<div class="lbl" style="margin-top:14px">'+esc(sec)+(it[2]?" (hoy)":"")+'</div>'}
    out+='<button type="button" class="chk'+(k.chk[i]?" on":"")+'" data-act="ck-tog" data-v="'+i+'" aria-pressed="'+(k.chk[i]?"true":"false")+'"><span class="bx">'+(k.chk[i]?"✓":"")+'</span>'+esc(it[1])+'</button>';
  });
  return '<p class="sub">Marca cada tarea cuando la termines. Puedes guardar y seguir después.</p>'+temps+out+
    '<div class="field"><label class="lbl" for="cknota">Novedad (opcional)</label><input id="cknota" autocomplete="off" value="'+esc(k.nota)+'" placeholder="Ej. Se dañó un congelador"></div>'+
    '<p class="hint" id="ckprog">'+hecho+' de '+total+' tareas'+(k.saved?' · guardado '+hora(k.saved):"")+'</p>'+
    '<button class="btn" data-act="ck-save"'+(k.saving?" disabled":"")+'>'+(k.saving?"Guardando…":"Guardar checklist")+'</button>';
}
function prHTML(){
  var a=AL(),p=a.pr;
  var opts='<option value="">— Elige el producto —</option>'+PRODS.map(function(g){return '<optgroup label="'+g[0]+'">'+g[1].map(function(n){return '<option value="'+esc(n)+'">'+esc(n)+'</option>'}).join("")+'</optgroup>'}).join("");
  var lines=p.lineas.length?p.lineas.map(function(l,i){return '<div class="panel" style="padding:10px"><b>'+esc(l.prod)+'</b><div class="rline"><div><small>Cantidad recibida</small></div><input inputmode="decimal" autocomplete="off" placeholder="0" data-prr="'+i+'" value="'+esc(l.rec)+'"></div><div class="rline"><div><small>Cantidad obtenida</small></div><input inputmode="decimal" autocomplete="off" placeholder="0" data-pro="'+i+'" value="'+esc(l.obt)+'"></div><button type="button" class="btn small ghost" data-act="pr-del" data-v="'+i+'">Quitar</button></div>'}).join(""):'<p class="hint">Elige un producto para anotarlo.</p>';
  return '<p class="sub">Anota lo que recibiste y lo que obtuviste. La app calcula el rendimiento y avisa si baja.</p>'+
    '<div class="field"><label class="lbl" for="prsel">Agregar producto</label><select id="prsel">'+opts+'</select></div>'+lines+
    '<button class="btn" data-act="pr-save"'+(prListo()&&!p.saving?"":" disabled")+'>'+(p.saving?"Guardando…":"Guardar producción")+'</button>';
}
function prListo(){var p=AL().pr;return p.lineas.length>0&&p.lineas.every(function(l){var r=num(l.rec),o=num(l.obt);return r&&r>0&&o!=null&&o>=0&&l.obt!==""})}
function prBtn(){var b=document.querySelector("[data-act=pr-save]");if(b)b.disabled=!(prListo()&&!AL().pr.saving)}
function prodListaHTML(){
  var l=(S.produccion||[]).slice(0,25);
  if(!l.length)return '<p class="hint">Todavía no hay registros.</p>';
  return l.map(function(x){
    if(x.tipo==="checklist"){var d=x.datos,n=(d.chk||[]).filter(Boolean).length,t=[];
      CKT.forEach(function(c){if(d.temps&&d.temps[c[0]]!=null)t.push(c[1]+" "+d.temps[c[0]]+c[2])});
      return '<div class="pitem"><div><b>'+fmtFecha(x.fecha)+' · Checklist</b><small>'+n+' tareas marcadas · '+esc(x.resp)+' · '+hora(x.ts)+'</small>'+(t.length?'<small>'+esc(t.join(" · "))+'</small>':"")+(d.nota?'<small>Novedad: '+esc(d.nota)+'</small>':"")+'</div></div>'}
    return '<div class="pitem"><div><b>'+fmtFecha(x.fecha)+' '+hora(x.ts)+' · Producción</b>'+(x.datos.lineas||[]).map(function(l){return '<small>'+esc(l.prod)+': recibió '+fmt(l.rec)+' → obtuvo '+fmt(l.obt)+' ('+Math.round(l.rend*100)+'%)'+(l.bajo?' <span style="color:#B3261E">· rendimiento bajo</span>':"")+'</small>'}).join("")+'<small>'+esc(x.resp)+'</small></div></div>'}).join("");
}
function pendTxt(){var p=almVe()?(S.almacen||[]).filter(function(x){return x.estado==="nuevo"}).length:0;return p?'<div class="banner">Pendientes de Almacén: <b>'+p+'</b></div>':""}

/* ===== Checklist corto del turno (La Barra): freidora y equipos ===== */
var CTI=[["fryok","Freidora limpia y aceite en condiciones"],["vf","Verifone con carga"],["fl","Flota con carga"],["sand","Sándwichera en funciones y limpia"],["plancha","Plancha limpia y funcionando"],["mesa","Mesa fría enfriando y limpia"]];
var CTJ=[["lic","Licuadoras funcionan"],["agua","Agua potable disponible"],["hielo","Hielo tapado y con pinzas"]];
var CTF=["Aceites y salsas","Proteínas","Quesos y embutidos","Panes y tortillas","Papas","Vegetales","Sal y pimienta"];
var CTR=["Fresa","Ciruela","China","Chinola","Limón","Zapote","Tamarindo","Lechosa","Piña","Melón","Cereza","Guanábana","Guineo","Mango","Leche batida","Sandía limón","Cocoa Sobrino","Leche","Azúcar","Zumo de chinola","Zumo de limón"];
function ctNegs(){return S.cfg.negocios.filter(function(n){return /^La Barra/.test(n)&&!/ General$/.test(n)})}
function ctOk(){return ctNegs().length>0}
function CT(){
  if(!S.ct){var n=ctNegs();S.ct={neg:n.length===1?n[0]:"",turno:"",fry:"",nev:"",chk:{},falta:[],fruta:[],nota:"",saving:false}}
  return S.ct;
}
function ctHecho(neg,turno){return (S.checkTurno||[]).filter(function(x){return x.fecha===today()&&x.negocio===neg&&x.turno===turno})[0]}
function ctForm(){
  var c=CT(),ns=ctNegs();
  var negs=ns.length>1?'<div class="lbl">Sucursal</div><div class="negs">'+ns.map(function(n,i){return '<button class="neg'+(c.neg===n?" on":"")+'" data-act="ct-neg" data-v="'+i+'">'+esc(n)+'</button>'}).join("")+'</div>':"";
  var ts=c.neg?turnosFor(c.neg):[];
  var tch=c.neg?'<div class="lbl" style="margin-top:10px">Turno</div><div class="tchips">'+ts.map(function(t,i){var h=ctHecho(c.neg,t);return '<button class="tchip'+(c.turno===t?" on":"")+'" data-act="ct-turno" data-v="'+i+'">'+(h?"✓ ":"")+esc(t)+'</button>'}).join("")+'</div>':"";
  if(!c.neg||!c.turno)return negs+tch;
  var fb=c.fry!==""&&(+c.fry<275||+c.fry>300),nb=c.nev!==""&&(+c.nev<0||+c.nev>8);
  var tick=function(l){return l.map(function(x){return '<button type="button" class="chk'+(c.chk[x[0]]?" on":"")+'" data-act="ct-tog" data-v="'+x[0]+'" aria-pressed="'+(c.chk[x[0]]?"true":"false")+'"><span class="bx">'+(c.chk[x[0]]?"✓":"")+'</span>'+esc(x[1])+'</button>'}).join("")};
  var chips=function(arr,sel,act){return '<div class="chips2">'+arr.map(function(n,i){var on=sel.indexOf(n)>-1;return '<button type="button" class="tchip'+(on?" on":"")+'" data-act="'+act+'" data-v="'+i+'">'+(on?"✗ ":"")+esc(n)+'</button>'}).join("")+'</div>'};
  return negs+tch+
   '<div class="lbl" style="margin-top:14px">Freidora (obligatorio)</div><div class="rline"><div><b>Temperatura</b><small id="ctfs">Debe estar 275–300 °F'+(fb?' · <span style="color:#B3261E">fuera de rango</span>':"")+'</small></div><input inputmode="decimal" autocomplete="off" placeholder="°F" aria-label="Temperatura de la freidora" data-ctn="fry" value="'+esc(c.fry)+'"></div>'+
   '<div class="lbl" style="margin-top:14px">Equipos</div>'+tick(CTI)+
   '<div class="lbl" style="margin-top:14px">Juguera</div><div class="rline"><div><b>Neveras</b><small id="ctns">Debe estar 0–8 °C'+(nb?' · <span style="color:#B3261E">fuera de rango</span>':"")+'</small></div><input inputmode="decimal" autocomplete="off" placeholder="°C" aria-label="Temperatura de las neveras" data-ctn="nev" value="'+esc(c.nev)+'"></div>'+tick(CTJ)+
   '<div class="lbl" style="margin-top:14px">¿Qué falta en la sándwichera? <small>(toca solo lo que NO hay)</small></div>'+chips(CTF,c.falta,"ct-falta")+
   '<div class="lbl" style="margin-top:14px">¿Qué falta en la juguera? <small>(toca solo lo que NO hay)</small></div>'+chips(CTR,c.fruta,"ct-fruta")+
   '<div class="field"><label class="lbl" for="ctnota">Novedad (opcional)</label><input id="ctnota" autocomplete="off" value="'+esc(c.nota)+'" placeholder="Ej. La flota no carga"></div>'+
   '<button class="btn" data-act="ct-save"'+(ctListo()&&!c.saving?"":" disabled")+'>'+(c.saving?"Guardando…":"Guardar checklist")+'</button>';
}
function ctListo(){var c=CT();return !!(c.neg&&c.turno&&c.fry!==""&&!isNaN(parseFloat(c.fry)))}
function ctBtn(){var b=document.querySelector("[data-act=ct-save]");if(b)b.disabled=!(ctListo()&&!CT().saving)}
function ctListaHTML(){
  var l=(S.checkTurno||[]).slice(0,12);
  if(!l.length)return '<p class="hint">Todavía no hay checklists.</p>';
  return l.map(function(x){var d=x.datos,bad=(d.fry<275||d.fry>300),sin=[];if(!d.chk.vf)sin.push("Verifone");if(!d.chk.fl)sin.push("Flota");
    return '<div class="pitem"><div><b>'+fmtFecha(x.fecha)+' · '+esc(x.negocio)+'</b><small>'+esc(x.turno)+' · '+esc(x.resp)+' · '+hora(x.ts)+'</small><small>Freidora '+d.fry+' °F'+(bad?' <span style="color:#B3261E">· fuera de rango</span>':' ✓')+(d.nev!=null&&d.nev!==""?' · Neveras '+d.nev+' °C':"")+'</small>'+(sin.length?'<small><span style="color:#B3261E">Sin carga: '+sin.join(", ")+'</span></small>':"")+((d.falta||[]).length||(d.fruta||[]).length?'<small>Falta: '+esc((d.falta||[]).concat(d.fruta||[]).join(", "))+'</small>':"")+(d.nota?'<small>Novedad: '+esc(d.nota)+'</small>':"")+'</div></div>'}).join("");
}
function ctPantalla(){
  return '<div class="panel"><div><h1>Checklist del turno</h1><p class="sub">Lo esencial al empezar el turno. Dura un minuto.</p></div>'+ctForm()+'</div>'+
    '<div><div class="lbl" style="margin-bottom:8px">Últimos checklists</div><div class="plist">'+ctListaHTML()+'</div></div>'+
    '<button class="btn ghost" data-act="ct-volver">Volver</button>';
}
function ctCard(){
  if(!ctOk())return "";
  var ns=ctNegs(),hoyN=0,tot=0;
  ns.forEach(function(n){turnosFor(n).forEach(function(t){tot++;if(ctHecho(n,t))hoyN++})});
  return '<button type="button" class="panel" style="width:100%;text-align:left;cursor:pointer" data-act="ct-open"><b>🔥 Checklist del turno</b><small style="display:block">Freidora y equipos con carga · '+hoyN+' de '+tot+' hechos hoy</small></button>';
}
async function ctGuardar(){
  var c=CT();if(c.saving||!ctListo())return;c.saving=true;render();
  try{
    var r=await api("saveCheckTurno",{negocio:c.neg,turno:c.turno,fry:parseFloat(c.fry),nev:c.nev===""?null:parseFloat(c.nev),chk:c.chk,falta:c.falta,fruta:c.fruta,nota:(c.nota||"").trim()});
    var neg=c.neg;S.ct=null;S.ct=CT();S.ct.neg=neg;
    toast(r.fuera||r.sin?"Guardado. Se avisó lo que está fuera de rango o sin carga":"Checklist guardado");await refresh(true);render();
  }catch(e){c.saving=false;render();toast(errMsg(e))}
}
function almListo(){var a=AL();return a.modo==="recepcion"?a.fotos.length>0:!!(a.destino&&a.lines.some(function(l){var q=num(l.qty);return q&&q>0}))}
function almBtn(){var b=document.querySelector("[data-act=alm-save]");if(b)b.disabled=!(almListo()&&!AL().saving)}
function almItemsTxt(items){return (items||[]).map(function(i){var p=prodById(i.pid);return esc(p?p.nombre:i.pid)+" "+fmt(i.qty)}).join(" · ")}
function almListaHTML(){
  var l=(S.almacen||[]).slice(0,40),ve=almVe();
  if(!l.length)return '<p class="hint">Todavía no hay registros.</p>';
  return l.map(function(a){
    var hecho=a.estado==="hecho",rec=a.tipo==="recepcion";
    var titulo=rec?"Llegó mercancía":"Salida para "+esc(a.destino);
    var st=hecho?'<span class="st ok">✓ '+(rec?"Factura registrada":"Hecho en Citrus")+' · '+esc(a.hechoPor)+'</span>':'<span class="st wait">'+(rec?"Falta registrar la factura":"Falta hacerlo en Citrus")+'</span>';
    var fot="";
    if(ve&&a.nf){for(var n=0;n<a.nf;n++){var k=a.id+":"+n,u=AL().ver[k];
      fot+=u?'<img class="alfoto" alt="Foto" src="'+u+'">':'<button type="button" class="btn small ghost" data-act="alm-foto" data-id="'+esc(a.id)+'" data-n="'+n+'">Ver foto '+(a.nf>1?(n+1):"")+'</button>'}}
    else if(a.nf)fot='<small>📷 '+a.nf+' foto'+(a.nf>1?"s":"")+' enviada'+(a.nf>1?"s":"")+'</small>';
    var btn=(ve&&!hecho)?'<button class="btn small" data-act="alm-hecho" data-id="'+esc(a.id)+'">'+(rec?"Ya registré la factura":"Ya lo hice en Citrus")+'</button>':"";
    return '<div class="pitem"><div><b>'+fmtFecha(a.fecha)+' '+hora(a.ts)+' · '+titulo+'</b>'+(a.items&&a.items.length?'<small>'+almItemsTxt(a.items)+'</small>':"")+(a.nota?'<small>'+esc(a.nota)+'</small>':"")+'<small>'+esc(a.resp)+'</small>'+fot+st+(btn?'<div style="margin-top:8px">'+btn+'</div>':"")+'</div></div>';
  }).join("");
}
function almHTML(){
  var a=AL();if(!a.modo)a.modo=almVe()?"recepcion":"ck";
  var rec=a.modo==="recepcion";
  var modos=(almVe()?[["turno","Checklist turno"]]:[]).concat([["ck","Checklist"],["prod","Producción"],["recepcion","Llegó mercancía"],["salida","Saqué producto"]]).map(function(x){return '<button class="'+(a.modo===x[0]?"on":"")+'" data-act="alm-modo" data-v="'+x[0]+'">'+x[1]+'</button>'}).join("");
  var fotos=a.fotos.map(function(f,i){return '<div class="alth"><img alt="Foto '+(i+1)+'" src="'+f+'"><button type="button" class="rx" data-act="alm-fdel" data-v="'+i+'" aria-label="Quitar foto">×</button></div>'}).join("");
  var fotoBtn=a.fotos.length<4?'<label class="btn ghost" style="display:block;text-align:center;cursor:pointer">📷 '+(a.fotos.length?"Agregar otra foto":"Tomar foto")+'<input type="file" accept="image/*" capture="environment" hidden data-almfoto="1"></label>':"";
  var cuerpo;
  if(a.modo==="turno"){
    return pendTxt()+'<div class="panel"><div><h1>Almacén</h1></div><div class="seg" style="flex-wrap:wrap">'+modos+'</div>'+ctForm()+'</div><div><div class="lbl" style="margin-bottom:8px">Últimos checklists</div><div class="plist">'+ctListaHTML()+'</div></div>';
  }
  if(a.modo==="ck"||a.modo==="prod"){
    return (pendTxt())+'<div class="panel"><div><h1>Almacén</h1></div><div class="seg" style="flex-wrap:wrap">'+modos+'</div>'+(a.modo==="ck"?ckHTML():prHTML())+'</div>'+
      '<div><div class="lbl" style="margin-bottom:8px">Últimos registros</div><div class="plist">'+prodListaHTML()+'</div></div>';
  }
  if(rec){
    cuerpo='<p class="sub">Toma la foto de la mercancía junto con la factura. Griselda y Khristal la ven al momento.</p><div class="althw">'+fotos+'</div>'+fotoBtn+
      '<div class="field"><label class="lbl" for="alnota">Nota (opcional)</label><input id="alnota" autocomplete="off" value="'+esc(a.nota)+'" placeholder="Ej. Factura 1234 · Distribuidora"></div>';
  }else{
    var dd='<option value="">— ¿A dónde va? —</option>'+["Producción (cocina)","La Barra Atala","La Barra Atalaya","La Barra Miraflores","Food Shop","Zona Presidente","Car Wash"].map(function(n){return '<option value="'+esc(n)+'"'+(a.destino===n?" selected":"")+'>'+esc(n)+'</option>'}).join("");
    var used={};a.lines.forEach(function(l){used[l.pid]=1});
    var q=a.q.trim().toLowerCase(),lst=almProds().filter(function(p){return !used[p.id]&&q&&String(p.nombre).toLowerCase().indexOf(q)>-1}).slice(0,10);
    var res=lst.map(function(p){return '<button type="button" class="rres" data-act="alm-add" data-id="'+esc(p.id)+'">+ '+esc(p.nombre)+'</button>'}).join("")||(q?'<p class="hint">No hay productos con ese nombre.</p>':'<p class="hint">Escribe para buscar el producto.</p>');
    var lines=a.lines.length?a.lines.map(function(l){var p=prodById(l.pid);return '<div class="rline"><div><b>'+esc(p?p.nombre:l.pid)+'</b></div><input inputmode="decimal" autocomplete="off" placeholder="0" aria-label="Cantidad" data-alq="'+esc(l.pid)+'" value="'+esc(l.qty)+'"><button type="button" class="rx" data-act="alm-del" data-id="'+esc(l.pid)+'" aria-label="Quitar">×</button></div>'}).join(""):'<p class="hint">Aún no has agregado productos.</p>';
    cuerpo='<p class="sub">Anota lo que sacas del almacén o del cuarto frío. Griselda lo pasa a Citrus.</p>'+
      '<div class="field"><label class="lbl" for="aldest">¿A dónde va?</label><select id="aldest">'+dd+'</select></div>'+
      '<div class="field"><label class="lbl" for="alq">Agregar producto</label><input id="alq" type="search" autocomplete="off" placeholder="Buscar producto…" value="'+esc(a.q)+'"></div><div class="plist" id="alres">'+res+'</div>'+
      '<div class="lbl">Lo que sacas</div><div class="plist">'+lines+'</div>'+
      '<div class="althw">'+fotos+'</div>'+fotoBtn+
      '<div class="field"><label class="lbl" for="alnota">Nota (opcional)</label><input id="alnota" autocomplete="off" value="'+esc(a.nota)+'" placeholder="Ej. Para producción de mañana"></div>';
  }
  var ok=almListo();
  var pend=almVe()?(S.almacen||[]).filter(function(x){return x.estado==="nuevo"}).length:0;
  return (pend?'<div class="banner">Pendientes: <b>'+pend+'</b></div>':"")+
    '<div class="panel"><div><h1>Almacén</h1></div><div class="seg">'+modos+'</div>'+cuerpo+
    '<button class="btn" data-act="alm-save"'+(ok&&!a.saving?"":" disabled")+'>'+(a.saving?"Enviando…":"Enviar")+'</button></div>'+
    '<div><div class="lbl" style="margin-bottom:8px">Últimos registros</div><div class="plist">'+almListaHTML()+'</div></div>';
}
async function almGuardar(){
  var a=AL();if(a.saving)return;
  var rec=a.modo==="recepcion",items=[];
  a.lines.forEach(function(l){var q=num(l.qty);if(prodById(l.pid)&&q&&q>0)items.push({pid:l.pid,qty:q})});
  if(rec?!a.fotos.length:(!a.destino||!items.length))return;
  a.saving=true;render();
  try{
    await api("saveAlmacen",{id:a.eid||(a.eid=rid("a_")),tipo:a.modo,destino:a.destino,items:items,nota:(a.nota||"").trim(),fotos:a.fotos});
    a.fotos=[];a.lines=[];a.nota="";a.q="";a.eid=null;a.saving=false;
    toast(rec?"Listo, ya lo ven Griselda y Khristal":"Listo, Griselda lo va a pasar a Citrus");await refresh(true);render();
  }catch(e){a.saving=false;render();toast(errMsg(e))}
}
document.addEventListener("change",async function(ev){
  var t=ev.target;
  if(t.dataset&&t.dataset.almfoto){
    var a=AL(),fs=Array.prototype.slice.call(t.files||[]);
    for(var i=0;i<fs.length&&a.fotos.length<4;i++){try{a.fotos.push(await fotoComprimir(fs[i]))}catch(e){toast(errMsg(e))}}
    render();
  }else if(t.id==="aldest"){AL().destino=t.value;render()}
  else if(t.id==="prsel"&&t.value){var pr=AL().pr;if(!pr.lineas.some(function(l){return l.prod===t.value}))pr.lineas.push({prod:t.value,rec:"",obt:""});render()}
});
document.addEventListener("input",function(ev){
  var t=ev.target,a=AL();
  if(t.id==="alnota")a.nota=t.value;
  else if(t.id==="alq"){a.q=t.value;var r=$("#alres");if(r){var q=a.q.trim().toLowerCase(),used={};a.lines.forEach(function(l){used[l.pid]=1});
    var lst=almProds().filter(function(p){return !used[p.id]&&q&&String(p.nombre).toLowerCase().indexOf(q)>-1}).slice(0,10);
    r.innerHTML=lst.map(function(p){return '<button type="button" class="rres" data-act="alm-add" data-id="'+esc(p.id)+'">+ '+esc(p.nombre)+'</button>'}).join("")||(q?'<p class="hint">No hay productos con ese nombre.</p>':'<p class="hint">Escribe para buscar el producto.</p>')}}
  else if(t.id==="cknota"){ckState().nota=t.value}
  else if(t.id==="ctnota"){CT().nota=t.value}
  else if(t.dataset&&t.dataset.ctn){var c2=t.value.replace(/[^0-9.,\-]/g,"").replace(",",".");if(c2!==t.value)t.value=c2;var ct=CT();ct[t.dataset.ctn]=c2;var v2=parseFloat(c2),isF=t.dataset.ctn==="fry",lim=isF?[275,300]:[0,8],bad2=!isNaN(v2)&&(v2<lim[0]||v2>lim[1]),sm2=document.getElementById(isF?"ctfs":"ctns");
    if(sm2)sm2.innerHTML="Debe estar "+(isF?"275–300 °F":"0–8 °C")+(bad2?' · <span style="color:#B3261E">fuera de rango</span>':"");ctBtn()}
  else if(t.dataset&&t.dataset.ckt){var c0=t.value.replace(/[^0-9.,\-]/g,"").replace(",",".");if(c0!==t.value)t.value=c0;ckState().temps[t.dataset.ckt]=c0;
    var cc=CKT.filter(function(x){return x[0]===t.dataset.ckt})[0],sm=t.closest(".rline").querySelector("small"),v=parseFloat(c0),bad=!isNaN(v)&&(v<TRANGO[cc[0]][0]||v>TRANGO[cc[0]][1]);
    sm.innerHTML="Debe estar "+cc[3]+" "+cc[2]+(bad?' · <span style="color:#B3261E">fuera de rango</span>':"")}
  else if(t.dataset&&(t.dataset.prr!=null||t.dataset.pro!=null)){var c1=t.value.replace(/[^0-9.,]/g,"").replace(",",".");if(c1!==t.value)t.value=c1;var pl=AL().pr.lineas[+(t.dataset.prr!=null?t.dataset.prr:t.dataset.pro)];if(pl){if(t.dataset.prr!=null)pl.rec=c1;else pl.obt=c1}prBtn()}
  else if(t.dataset&&t.dataset.alq){var c=t.value.replace(/[^0-9.,]/g,"").replace(",",".");if(c!==t.value)t.value=c;var ln=a.lines.filter(function(l){return l.pid===t.dataset.alq})[0];if(ln)ln.qty=c;almBtn()}
});
document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act^='alm-'],[data-act^='ck-'],[data-act^='pr-'],[data-act^='ct-']");if(!el)return;
  var act=el.dataset.act,a=AL(),id=el.dataset.id,v=el.dataset.v;
  if(act==="alm-modo"){a.modo=v;render()}
  else if(act==="ct-open"){S.view="ct";render()}
  else if(act==="ct-volver"){S.view=navItems().some(function(x){return x[0]==="contar"})?"contar":defaultView();render()}
  else if(act==="ct-neg"){var c=CT();c.neg=ctNegs()[+v];c.turno="";render()}
  else if(act==="ct-turno"){var c3=CT();c3.turno=turnosFor(c3.neg)[+v];var h=ctHecho(c3.neg,c3.turno);if(h){var d=h.datos;c3.fry=String(d.fry);c3.nev=d.nev==null?"":String(d.nev);c3.chk=JSON.parse(JSON.stringify(d.chk));c3.falta=(d.falta||[]).slice();c3.fruta=(d.fruta||[]).slice();c3.nota=d.nota||""}else{c3.fry="";c3.nev="";c3.chk={};c3.falta=[];c3.fruta=[];c3.nota=""}render()}
  else if(act==="ct-tog"){var c4=CT();c4.chk[v]=c4.chk[v]?0:1;render()}
  else if(act==="ct-falta"){var c5=CT(),n5=CTF[+v],i5=c5.falta.indexOf(n5);if(i5>-1)c5.falta.splice(i5,1);else c5.falta.push(n5);render()}
  else if(act==="ct-fruta"){var c6=CT(),n6=CTR[+v],i6=c6.fruta.indexOf(n6);if(i6>-1)c6.fruta.splice(i6,1);else c6.fruta.push(n6);render()}
  else if(act==="ct-save"){ctGuardar()}
  else if(act==="ck-tog"){var k=ckState();k.chk[+v]=k.chk[+v]?0:1;render()}
  else if(act==="ck-save"){ckGuardar()}
  else if(act==="pr-del"){AL().pr.lineas.splice(+v,1);render()}
  else if(act==="pr-save"){prGuardar()}
  else if(act==="alm-fdel"){a.fotos.splice(+v,1);render()}
  else if(act==="alm-add"){a.lines.push({pid:id,qty:""});a.q="";render()}
  else if(act==="alm-del"){a.lines=a.lines.filter(function(l){return l.pid!==id});render()}
  else if(act==="alm-save"){almGuardar()}
  else if(act==="alm-foto"){el.disabled=true;el.textContent="Cargando…";api("getFoto",{id:id,n:+el.dataset.n}).then(function(d){a.ver[id+":"+el.dataset.n]=d.foto;render()}).catch(function(e){el.disabled=false;el.textContent="Ver foto";toast(errMsg(e))})}
  else if(act==="alm-hecho"){el.disabled=true;api("marcarAlmacen",{id:id}).then(function(){toast("Listo");return refresh(true)}).then(render).catch(function(e){el.disabled=false;toast(errMsg(e))})}
});

async function ckGuardar(){
  var k=ckState();if(k.saving)return;k.saving=true;render();
  try{
    var chk=[];for(var i=0;i<CKI.length;i++)chk[i]=k.chk[i]?1:0;
    var r=await api("saveChecklist",{chk:chk,temps:k.temps,nota:(k.nota||"").trim()});
    k.saving=false;toast(r.fuera?"Guardado. Hay una temperatura fuera de rango y se avisó":"Checklist guardado");await refresh(true);S.alm.ck=null;render();
  }catch(e){k.saving=false;render();toast(errMsg(e))}
}
async function prGuardar(){
  var p=AL().pr;if(p.saving||!prListo())return;p.saving=true;render();
  try{
    var r=await api("saveProd",{id:p.eid||(p.eid=rid("p_")),lineas:p.lineas.map(function(l){return {prod:l.prod,rec:num(l.rec),obt:num(l.obt)}})});
    p.lineas=[];p.eid=null;p.saving=false;toast(r.bajos?"Guardado. Hay un rendimiento bajo y se avisó":"Producción guardada");await refresh(true);render();
  }catch(e){p.saving=false;render();toast(errMsg(e))}
}
