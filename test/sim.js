const {makeEnv}=require('./mock');
const E=makeEnv({clock:Date.UTC(2026,10,2,12,0,0)});E.ctx.instalar();
let seed=42;const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296};
function login(email,nombre){E.call('reqCode',{email});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];const r=E.call('verifyCode',{email,code:c,nombre});if(!r.ok)throw new Error(JSON.stringify(r));return r.data.token}
const A=login('dueno@gmail.com');
const staff=[['lider.lb1@gmail.com','Carla (LB1)','La Barra 1'],['lider.lb2@gmail.com','Pedro (LB2)','La Barra 2'],['lider.lb3@gmail.com','Rosa (LB3)','La Barra 3'],['lider.fs@gmail.com','Ana (Food Shop)','Food Shop'],['lider.zp@gmail.com','Luis (Zona Pres.)','Zona Presidente']];
const TK={};staff.forEach(([e,n,ng])=>{TK[ng]=login(e,n);const r=E.call('setUser',{email:e,rol:'lider',estado:'aprobado',negocios:[ng]},A);if(!r.ok)throw new Error(JSON.stringify(r))});
const G=login('gerencia@gmail.com','Gerencia');E.call('setUser',{email:'gerencia@gmail.com',rol:'gerencia',estado:'aprobado',negocios:[]},A);
const prods=E.call('sync',{},A).data.productos;
// costos simulados
const costo=p=>({unid:25,kg:180,lb:80,lt:60,ml:0.1,g:0.2}[p.unidad]||40);
prods.forEach(p=>{E.call('saveProducto',{...p,costo:costo(p)},A)});
const P=E.call('sync',{},A).data.productos;
const turnos=E.call('sync',{},A).data.config.turnos;
// estado de stock por negocio
const stock={};const fechas=['2026-11-02','2026-11-03','2026-11-04'];
// shrink config: negocio -> {pid prefix count, pct}
const leak={'La Barra 2':0.12,'Zona Presidente':0.08};
let id=1;const log={cont:0,rect:0,faltaron:[]};
const tiempo={};
fechas.forEach((f,di)=>{
  E.setClock(Date.UTC(2026,10,2+di,12,0,0)+0);
  Object.keys(TK).forEach(ng=>{
    const list=P.filter(p=>p.negocios.includes(ng));
    (turnos[ng]||[]).forEach((t,ti)=>{
      if(ng==='Food Shop'&&di===1&&ti===1){log.faltaron.push(ng+' '+t+' '+f);return}
      const st=stock[ng]=stock[ng]||{};const sr=stock[ng+'#']=stock[ng+'#']||{};
      const items=[],ventas={};
      list.forEach(p=>{
        const ini=st[p.id]!==undefined?st[p.id]:Math.round(20+rnd()*60);
        const ent=rnd()<0.3?Math.round(10+rnd()*30):0;
        const vend=Math.round(rnd()*(ng==='Food Shop'?8:12));
        let cons=vend*p.factor;
        if(leak[ng]&&di>0&&rnd()<0.25)cons*=(1+leak[ng]*(1+rnd()*3));
        if(rnd()<0.04)cons*=1.5; // error aleatorio de conteo
        const fin=Math.max(0,Math.round((ini+ent-cons)*100)/100);
        items.push({pid:p.id,ini,ent,fin,src:sr[p.id]||''});ventas[p.id]=vend;st[p.id]=fin});
      const cid='c_'+String(id++).padStart(8,'0');
      let r=E.call('saveConteo',{id:cid,fecha:f,negocio:ng,turno:t,items},TK[ng]);
      if(!r.ok){console.log('ERR',ng,t,JSON.stringify(r));return}
      log.cont++;list.forEach(p=>sr[p.id]=cid);
      if(di>0){r=E.call('saveVentas',{id:cid,ventas},A);if(!r.ok)console.log('ERRV',JSON.stringify(r))}
    })
  })
});
E.setClock(Date.UTC(2026,10,5,5,0,0));E.ctx.revisarPendientes();
const d=E.call('dash',{desde:'2026-11-02',hasta:'2026-11-04'},G).data;
console.log('CONTEOS',log.cont,'FALTARON',log.faltaron);
console.log('TOTAL',JSON.stringify(d.total));
Object.entries(d.porNegocio).forEach(([n,o])=>console.log(n.padEnd(16),JSON.stringify(o)));
console.log('TOP');d.top.slice(0,8).forEach(q=>console.log(q.negocio,q.nombre,q.faltaU,q.unidad,'RD$',q.faltaV,'veces',q.veces,'crit',q.crit));
console.log('FALTAN',JSON.stringify(d.faltan));
const s=E.call('sync',{},A).data;console.log('NOTIFS admin',s.notifs.length,[...new Set(s.notifs.map(n=>n.tipo))]);
console.log('MAILS',E.mails.map(m=>m.subject).reduce((a,x)=>(a[x.replace(/:.*/,'')]=(a[x.replace(/:.*/,'')]||0)+1,a),{}));
require('fs').writeFileSync('/tmp/simres.json',JSON.stringify(d));
