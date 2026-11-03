
/* ===== Almacén: Maria recibe y saca mercancía; Griselda lo pasa a Citrus; Khristal marca facturas ===== */
function esVirtual(n){return n==="Almacén"||/ General$/.test(n||"")}
function almOk(){var r=role();return r==="admin"||r==="supervisor"||r==="gerencia"||(S.cfg&&S.cfg.negocios.indexOf("Almacén")>-1)}
function almSolo(){var n=(S.cfg&&S.cfg.negocios)||[];return n.length>0&&n.every(function(x){return x==="Almacén"})}
function almVe(){var r=role();return r==="admin"||r==="supervisor"}
function almPend(){return almVe()?(S.almacen||[]).filter(function(a){return a.estado==="nuevo"}).length:0}
function AL(){return S.alm||(S.alm={modo:"recepcion",fotos:[],nota:"",destino:"",lines:[],q:"",saving:false,eid:null,ver:{}})}
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
  var a=AL(),rec=a.modo==="recepcion";
  var modos=[["recepcion","Llegó mercancía"],["salida","Saqué producto"]].map(function(x){return '<button class="'+(a.modo===x[0]?"on":"")+'" data-act="alm-modo" data-v="'+x[0]+'">'+x[1]+'</button>'}).join("");
  var fotos=a.fotos.map(function(f,i){return '<div class="alth"><img alt="Foto '+(i+1)+'" src="'+f+'"><button type="button" class="rx" data-act="alm-fdel" data-v="'+i+'" aria-label="Quitar foto">×</button></div>'}).join("");
  var fotoBtn=a.fotos.length<4?'<label class="btn ghost" style="display:block;text-align:center;cursor:pointer">📷 '+(a.fotos.length?"Agregar otra foto":"Tomar foto")+'<input type="file" accept="image/*" capture="environment" hidden data-almfoto="1"></label>':"";
  var cuerpo;
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
});
document.addEventListener("input",function(ev){
  var t=ev.target,a=AL();
  if(t.id==="alnota")a.nota=t.value;
  else if(t.id==="alq"){a.q=t.value;var r=$("#alres");if(r){var q=a.q.trim().toLowerCase(),used={};a.lines.forEach(function(l){used[l.pid]=1});
    var lst=almProds().filter(function(p){return !used[p.id]&&q&&String(p.nombre).toLowerCase().indexOf(q)>-1}).slice(0,10);
    r.innerHTML=lst.map(function(p){return '<button type="button" class="rres" data-act="alm-add" data-id="'+esc(p.id)+'">+ '+esc(p.nombre)+'</button>'}).join("")||(q?'<p class="hint">No hay productos con ese nombre.</p>':'<p class="hint">Escribe para buscar el producto.</p>')}}
  else if(t.dataset&&t.dataset.alq){var c=t.value.replace(/[^0-9.,]/g,"").replace(",",".");if(c!==t.value)t.value=c;var ln=a.lines.filter(function(l){return l.pid===t.dataset.alq})[0];if(ln)ln.qty=c;almBtn()}
});
document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act^='alm-']");if(!el)return;
  var act=el.dataset.act,a=AL(),id=el.dataset.id,v=el.dataset.v;
  if(act==="alm-modo"){a.modo=v;render()}
  else if(act==="alm-fdel"){a.fotos.splice(+v,1);render()}
  else if(act==="alm-add"){a.lines.push({pid:id,qty:""});a.q="";render()}
  else if(act==="alm-del"){a.lines=a.lines.filter(function(l){return l.pid!==id});render()}
  else if(act==="alm-save"){almGuardar()}
  else if(act==="alm-foto"){el.disabled=true;el.textContent="Cargando…";api("getFoto",{id:id,n:+el.dataset.n}).then(function(d){a.ver[id+":"+el.dataset.n]=d.foto;render()}).catch(function(e){el.disabled=false;el.textContent="Ver foto";toast(errMsg(e))})}
  else if(act==="alm-hecho"){el.disabled=true;api("marcarAlmacen",{id:id}).then(function(){toast("Listo");return refresh(true)}).then(render).catch(function(e){el.disabled=false;toast(errMsg(e))})}
});
