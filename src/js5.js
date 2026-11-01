
/* ---------- eventos ---------- */
function clean(v){return v.replace(/[^0-9.,]/g,"")}
document.addEventListener("input",function(ev){
  var t=ev.target,ds=t.dataset||{};
  if(ds.f&&S.draft){
    var cl=clean(t.value);if(cl!==t.value)t.value=cl;
    var v=S.draft.vals[ds.pid];v[ds.f]=cl;
    if(ds.f==="ini")v.iniTouched=true;
    if(ds.f==="ent")v.entTouched=true;
    updateCard(ds.pid);updateProgress();persistDraft();
  }
  else if(ds.vq&&S.vs){
    var c2=clean(t.value);if(c2!==t.value)t.value=c2;
    S.vs.vals[ds.vq]=c2;S.vs.touched[ds.vq]=true;S.vs.auto0[ds.vq]=false;S.vs.confirm=false;
    var row=t.closest(".vrow");if(row)row.classList.remove("auto0");
    updateVsFoot();
  }
  else if(ds.rect&&S.detail){
    var c3=clean(t.value);if(c3!==t.value)t.value=c3;
    var pr=ds.rect.split(":"),ch=S.detail.cambios[pr[0]]||(S.detail.cambios[pr[0]]={});ch[pr[1]]=c3;
  }
  else if(ds.pf&&S.cat.editing){S.cat.editing[ds.pf]=t.value}
  else if(ds.tt!=null){S.cat.typing=true}
  else if(ds.rq){var c4=clean(t.value);if(c4!==t.value)t.value=c4;var ln=S.rec.lines.filter(function(l){return l.pid===ds.rq})[0];if(ln)ln.qty=c4;updateRecBtn()}
  else if(t.id==="rq"){S.rec.q=t.value;var rr=$("#rres");if(rr)rr.innerHTML=recSearchHTML()}
  else if(t.id==="rnota"){S.rec.nota=t.value}
  else if(t.id==="rdet"){S.rec.detalle=t.value;updateRecBtn()}
  else if(ds.tq){var c5=clean(t.value);if(c5!==t.value)t.value=c5;var tp=ds.tq.split("|"),tt=S.rec.tr[tp[0]]||(S.rec.tr[tp[0]]={});tt[tp[1]]=c5}
  else if(t.id==="fecha"){S.draft.fecha=t.value||today()}
  else if(t.id==="q"){applyFilter()}
  else if(t.id==="vq"&&S.vs){S.vs.q=t.value;var qq=t.value.trim().toLowerCase();document.querySelectorAll(".vrow").forEach(function(r){r.hidden=!!qq&&r.dataset.n.indexOf(qq)<0})}
  else if(t.id==="motivo"&&S.detail){S.detail.motivo=t.value}
  else if(t.id==="cq"){S.cat.q=t.value;clearTimeout(S.cat.tm);S.cat.tm=setTimeout(function(){var pos=t.selectionStart;render();var n=$("#cq");if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}},250)}
  else if(t.id==="lg-email"){S.loginEmail=t.value}
  else if(t.id==="lg-code"){var c5=t.value.replace(/\D/g,"").slice(0,6);if(c5!==t.value)t.value=c5;S.loginCode=c5}
  else if(t.id==="lg-name"){S.loginName=t.value}
});
document.addEventListener("keydown",function(ev){
  if(ev.key!=="Enter")return;
  var id=ev.target.id;
  if(id==="lg-email")lgSend();
  else if(id==="lg-code"||id==="lg-name")lgVerify();
});
document.addEventListener("change",function(ev){
  var t=ev.target,ds=t.dataset||{};
  if(t.id==="fcat-sel"&&S.draft){var op=t.options[t.selectedIndex];S.draft.fcat=(+t.value<0)?null:op.dataset.c;persistDraft();applyFilter()}
  else if(t.id==="f-neg"){S.fNeg=t.value;render()}
  else if(t.id==="f-rango"){S.fRango=t.value;render()}
  else if(t.id==="f-est"){S.fEstado=t.value;render()}
  else if(t.id==="p-neg"){S.panel.negocio=t.value;S.panel.data=null;render()}
  else if(t.id==="cneg"){S.cat.neg=t.value;render()}
  else if(t.id==="rorigen"){S.rec.origen=t.value;render()}
  else if(t.id==="rmotivo"){S.rec.motivo=t.value;render();var dd=$("#rdet");if(dd&&(t.value==="Se dañó"||t.value==="Otros"))dd.focus()}
  else if(t.id==="rdest"){S.rec.destino=t.value;updateRecBtn()}
  else if(ds.asg&&S.vs){S.vs.assign[ds.asg]=t.value||undefined;if(!t.value)delete S.vs.assign[ds.asg];recomputeTramo(ds.tr);var y=window.pageYOffset;render();window.scrollTo(0,y)}
  else if(ds.csv&&S.vs&&t.files&&t.files[0]){
    var file=t.files[0],key=ds.csv,fr=new FileReader();
    fr.onload=function(){
      var buf=fr.result,txt;
      try{txt=new TextDecoder("utf-8",{fatal:true}).decode(buf)}catch(e){txt=new TextDecoder("windows-1252").decode(buf)}
      applyCsv(key,txt,file.name);render();
    };
    fr.readAsArrayBuffer(file);
  }
});
async function guarded(fn){try{await fn()}catch(e){toast(errMsg(e))}}
document.addEventListener("click",function(ev){
  var el=ev.target.closest("[data-act]");if(!el)return;
  var act=el.dataset.act,v=el.dataset.v,id=el.dataset.id;
  var A={
    "go":function(){
      S.detail=null;S.vs=null;S.view=v;S.cat.editing=null;S.eq.form=null;
      if(v==="panel")loadPanel();
      if(v==="eq")S.eq.users=null;
      render();window.scrollTo(0,0);refresh(false);
    },
    "campo-on":function(){S.campo=true;S.view="contar";S.step="elegir";S.draft=newDraft();render();window.scrollTo(0,0)},
    "campo-off":function(){S.campo=false;S.view="pend";S.step="elegir";S.draft=null;render()},
    "logout":function(){doLogout(false)},
    "check-pending":function(){checkPending()},
    "lg-send":function(){lgSend()},
    "lg-resend":function(){lgSend()},
    "lg-change":function(){S.auth="email";S.err="";render()},
    "lg-verify":function(){lgVerify()},
    /* contar */
    "neg":function(){var n=S.cfg.negocios[+v];S.draft.negocio=n;S.draft.turno=sugTurno(n,S.draft.fecha);render()},
    "turno":function(){S.draft.turno=turnosFor(S.draft.negocio)[+v];render()},
    "start":function(){startCount()},
    "fcat":function(){var d=S.draft;d.fcat=(+v<0)?null:el.dataset.c;persistDraft();applyFilter()},
    "fmode":function(){var d=S.draft;d.fmode=(d.fmode===v)?"":v;persistDraft();applyFilter()},
    "back":function(){S.step="elegir";S.draft=newDraft();clearDraft();render();window.scrollTo(0,0)},
    "save":function(){guardar()},
    "again":function(){S.draft=newDraft();S.step="elegir";S.saved=null;render();window.scrollTo(0,0)},
    /* recibir */
    "rneg":function(){S.rec.negocio=S.cfg.negocios[+v];S.rec.lines=[];S.rec.q="";S.rec.destino="";S.rec.origen=/^La Barra/.test(S.rec.negocio)?"Cocina":"Proveedor";S.rec.eid=null;render()},
    "rmodo":function(){S.rec.modo=v;S.rec.eid=null;S.rec.q="";render()},
    "tr-recv":function(){confirmarTraspaso(id)},
    "mov-del":function(){if(!confirm("¿Anular este registro?"))return;guarded(async function(){await api("anularMov",{id:id});toast("Registro anulado");await refresh(true);render()})},
    "rec-add":function(){S.rec.lines.push({pid:id,qty:""});S.rec.q="";var qi=$("#rq");if(qi)qi.value="";var a=$("#rres"),b=$("#rlines");if(a)a.innerHTML=recSearchHTML();if(b)b.innerHTML=recLinesHTML();var ins=document.querySelectorAll("[data-rq]");if(ins.length)ins[ins.length-1].focus();updateRecBtn()},
    "rec-del":function(){S.rec.lines=S.rec.lines.filter(function(l){return l.pid!==id});var a=$("#rres"),b=$("#rlines");if(a)a.innerHTML=recSearchHTML();if(b)b.innerHTML=recLinesHTML();updateRecBtn()},
    "rec-save":function(){registrarEntrada()},
    "rec-del-ent":function(){guarded(async function(){await api("delEntrada",{id:id});toast("Entrada anulada");await refresh(true);render()})},
    /* ventas */
    "vs-open":function(){openVentas(id)},
    "vs-back":function(){S.vs=null;render();window.scrollTo(0,0)},
    "vs-calc":function(){calcVentas()},
    "vs-ign":function(){
      var vs=S.vs,csv=vs.csv[el.dataset.tr];
      csv.otros.forEach(function(u){vs.assign[u.key]="-"});
      recomputeTramo(el.dataset.tr);var y=window.pageYOffset;render();window.scrollTo(0,y);toast("Listo. No volverán a preguntarse.");
    },
    /* resultados */
    "det-open":function(){openDetalle(id)},
    "det-back":function(){S.detail=null;render();window.scrollTo(0,0)},
    "rect-start":function(){S.detail.edit=true;S.detail.cambios={};S.detail.motivo="";render()},
    "rect-cancel":function(){S.detail.edit=false;render()},
    "rect-save":function(){rectSave()},
    "anular":function(){S.detail.anular=true;S.detail.motivo="";render()},
    "anular-no":function(){S.detail.anular=false;render()},
    "anular-ok":function(){
      var d=S.detail;if(!d.motivo.trim())return toast("Escribe el motivo.");
      guarded(async function(){await api("anular",{id:d.id,motivo:d.motivo.trim()});toast("Conteo anulado");S.detail=null;await refresh(true);render()});
    },
    /* avisos */
    "notif":function(){openNotif(id)},
    "read-all":function(){S.notifs.forEach(function(n){n.leido=true});render();api("markRead",{todos:true}).catch(function(){})},
    /* panel */
    "p-rango":function(){S.panel.rango=v;S.panel.data=null;loadPanel();render()},
    "p-reload":function(){S.panel.err="";S.panel.data=null;render();loadPanel()},
    /* catálogo */
    "new-prod":function(){S.cat.editing=blankProd();render();window.scrollTo(0,0)},
    "edit-prod":function(){var p=prodById(id);if(p){S.cat.editing={nuevo:false,id:p.id,nombre:p.nombre,cat:p.cat||"",critico:!!p.critico,unidad:p.unidad,factor:String(p.factor),tol:String(r2(p.tol*100,2)),costo:String(p.costo||0),negocios:(p.negocios||[]).slice(),orden:p.orden||Date.now()};render();window.scrollTo(0,0)}},
    "cancel-prod":function(){S.cat.editing=null;S.cat.pendingDel=null;render()},
    "tog-crit":function(){S.cat.editing.critico=!S.cat.editing.critico;el.classList.toggle("on")},
    "tog-neg":function(){var nn=S.cfg.todosNegocios[+v],a=S.cat.editing.negocios,i=a.indexOf(nn);if(i>-1)a.splice(i,1);else a.push(nn);el.classList.toggle("on")},
    "save-prod":function(){
      var e=S.cat.editing,fa=num(e.factor),to=num(e.tol),co=num(e.costo);
      if(!e.nombre.trim())return toast("Escribe el nombre del producto.");
      if(fa==null||fa<=0)return toast("«Se gasta por cada venta» debe ser mayor que 0.");
      if(to==null||to<0||to>100)return toast("La tolerancia va de 0 a 100.");
      if(co==null||co<0)co=0;
      guarded(async function(){
        await api("saveProducto",{id:e.id,nombre:e.nombre.trim(),cat:(e.cat||"").trim(),critico:!!e.critico,unidad:(e.unidad||"unid").trim(),factor:fa,tol:to/100,costo:co,negocios:e.negocios.slice(),orden:e.orden});
        S.cat.editing=null;toast("Producto guardado");await refresh(true);render();
      });
    },
    "del-prod":function(){S.cat.pendingDel=S.cat.editing.id;render()},
    "del-prod-no":function(){S.cat.pendingDel=null;render()},
    "del-prod-ok":function(){guarded(async function(){await api("delProducto",{id:S.cat.editing.id});S.cat.editing=null;S.cat.pendingDel=null;toast("Producto quitado");await refresh(true);render()})},
    "tog-dia":function(){
      var n=S.cfg.todosNegocios[+v],d=+el.dataset.d,cal=Object.assign({},S.cfg.calendario),arr=(Array.isArray(cal[n])?cal[n]:[0,1,2,3,4,5,6]).slice(),ix=arr.indexOf(d);
      if(ix>-1)arr.splice(ix,1);else arr.push(d);
      arr.sort();if(arr.length>=7)delete cal[n];else cal[n]=arr;
      S.cfg.calendario=cal;el.classList.toggle("on");
      saveCfg({calendario:cal},"Calendario guardado");
    },
    "tog-aviso":function(){var a=Object.assign({},S.cfg.avisos);a[v]=a[v]===false;S.cfg.avisos=a;render();saveCfg({avisos:a},"Guardado")},
    "save-turnos":function(){
      var negs=($("#neg-edit").value||"").split("\n").map(function(s){return s.trim()}).filter(Boolean);
      if(!negs.length)return toast("Deja al menos un negocio.");
      var turnos={},lim={},bad="";
      S.cfg.todosNegocios.forEach(function(n,i){
        var ta=$("#tt-"+i);if(!ta)return;
        var list=[];
        ta.value.split("\n").forEach(function(l){
          l=l.trim();if(!l)return;
          var p=l.split("|"),nm=p[0].trim(),hm=(p[1]||"").trim();
          if(hm&&!/^([01]?\d|2[0-3]):[0-5]\d$/.test(hm)){bad=n+": «"+hm+"» no es una hora válida (usa 23:30)";return}
          if(hm&&hm.length===4)hm="0"+hm;
          list.push(nm);if(hm)lim[n+"|"+nm]=hm;
        });
        turnos[n]=list;
      });
      if(bad)return toast(bad);
      negs.forEach(function(n){if(!turnos[n])turnos[n]=[]});
      S.cat.typing=false;
      saveCfg({negocios:negs,turnos:turnos,limites:lim},"Turnos guardados");
    },
    /* equipo */
    "eq-edit":function(){var u=S.eq.users.filter(function(x){return x.email===id})[0];if(u){S.eq.form={email:u.email,nombre:u.nombre,rol:u.rol,estado:u.estado==="pendiente"?"aprobado":u.estado,negocios:(u.negocios||[]).slice()};S.eq.editing=true;render();window.scrollTo(0,0)}},
    "eq-set":function(){S.eq.form[el.dataset.k]=v;render()},
    "eq-neg":function(){var n=S.cfg.todosNegocios[+v],a=S.eq.form.negocios,i=a.indexOf(n);if(i>-1)a.splice(i,1);else a.push(n);el.classList.toggle("on")},
    "eq-cancel":function(){S.eq.form=null;S.eq.editing=false;render()},
    "eq-save":function(){
      var f=S.eq.form;
      if((f.rol==="lider"||f.rol==="colaborador")&&f.estado==="aprobado"&&!f.negocios.length)return toast("Asigna al menos un negocio.");
      guarded(async function(){
        await api("setUser",{email:f.email,rol:f.rol,estado:f.estado,negocios:(f.rol==="lider"||f.rol==="colaborador")?f.negocios:[]});
        S.eq.form=null;S.eq.editing=false;toast("Guardado");S.eq.users=await api("listUsers");render();
      });
    }
  };
  if(A[act])A[act]();
});
document.addEventListener("visibilitychange",function(){if(!document.hidden&&S.auth==="app"&&Date.now()-S.lastSync>45000)refresh(false)});

/* ---------- arranque ---------- */
boot();
})();
