const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');
const U=(d,h,m)=>Date.UTC(2026,10,d,h+4,m||0); // hora local RD -> UTC
const env=makeEnv({clock:U(2,12)});env.ctx.instalar();
let seed=7;const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296};
const call=(a,p,t)=>{const r=env.call(a,p,t);if(!r.ok)throw new Error(a+' '+JSON.stringify(r));return r.data};
function login(email,nombre){env.call('reqCode',{email});const c=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];return env.call('verifyCode',{email,code:c,nombre}).data.token}
const A=login('dueno@gmail.com');
const staff=[['carla@gmail.com','Carla M.','La Barra Atala'],['pedro@gmail.com','Pedro R.','La Barra Atalaya'],['rosa@gmail.com','Rosa T.','La Barra Miraflores'],['ana@gmail.com','Ana P.','Food Shop'],['luis@gmail.com','Luis G.','Zona Presidente']];
const TK={};staff.forEach(([e,n,ng])=>{TK[ng]=login(e,n);call('setUser',{email:e,rol:'lider',estado:'aprobado',negocios:[ng]},A)});
const G=login('gerencia@gmail.com','Gerencia');call('setUser',{email:'gerencia@gmail.com',rol:'gerencia',estado:'aprobado',negocios:[]},A);
const sync=call('sync',{},A);const P0=sync.productos;const turnos=sync.config.turnos;
const costo=p=>({unid:25,kg:180,lb:80,lt:60}[p.unidad]||40);
P0.forEach(p=>call('saveProducto',{...p,costo:costo(p)},A));
const P=call('sync',{},A).productos;
const stock={},last={};let id=1;const timeline=[];
const leak={'La Barra Atalaya':0.12,'Zona Presidente':0.08};
function conteo(d,h,m,ng,t,leakOn,vh,vm,note){
  env.setClock(U(d,h,m));
  const list=P.filter(p=>p.negocios.includes(ng)),st=stock[ng]=stock[ng]||{},sr=last[ng]=last[ng]||{};
  const items=[],ventas={};let ents=[];
  list.forEach(p=>{
    const ini=st[p.id]!==undefined?st[p.id]:Math.round(20+rnd()*60);
    const ent=rnd()<0.25?Math.round(10+rnd()*30):0;if(ent)ents.push({pid:p.id,qty:ent});
    const vend=Math.round(rnd()*(ng==='Food Shop'?8:12));let cons=vend*p.factor;
    if(leakOn&&leak[ng]&&rnd()<0.25)cons*=1+leak[ng]*(1+rnd()*3);
    if(rnd()<0.03)cons*=1.5;
    const fin=Math.max(0,Math.round((ini+ent-cons)*100)/100);
    items.push({pid:p.id,ini,ent,fin,src:sr[p.id]||''});ventas[p.id]=vend;st[p.id]=fin});
  if(ents.length)call('addEntrada',{id:'e_'+String(id).padStart(8,'0'),negocio:ng,items:ents.slice(0,8)},TK[ng]);
  const cid='c_'+String(id++).padStart(8,'0');
  const r=call('saveConteo',{id:cid,fecha:`2026-11-0${d}`,negocio:ng,turno:t,items},TK[ng]);
  list.forEach(p=>sr[p.id]=cid);
  timeline.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}  ${ng} · ${t}: conteo de ${items.length} productos${r.inicial?' (INICIAL)':''}`);
  return {cid,ventas,vh,vm,ng,t,note};
}
// día previo: conteos iniciales al cierre
const base=[];
['La Barra Atala','La Barra Atalaya','La Barra Miraflores'].forEach(n=>conteo(2,23,10,n,'Turno 1 (7AM-3PM)',false));
conteo(2,23,10,'Food Shop','Turno 2 (3PM-11PM)',false);conteo(2,23,20,'Zona Presidente','Turno único (3PM-11PM)',false);
timeline.length=0;
// el día
const day=[
 conteo(3,15,5,'Food Shop','Turno 1 (7AM-3PM)',true,15,50),
 conteo(3,23,15,'Food Shop','Turno 2 (3PM-11PM)',true,0,0),
 conteo(3,23,20,'La Barra Atala','Turno 1 (7AM-3PM)',true,9,10),
 conteo(3,23,25,'La Barra Atalaya','Turno 1 (7AM-3PM)',true,9,40),
 conteo(3,23,35,'La Barra Miraflores','Turno 1 (7AM-3PM)',true,10,5),
 conteo(3,23,40,'Zona Presidente','Turno único (3PM-11PM)',true,10,30),
];
// administración carga ventas
const ordered=[day[0],day[2],day[3],day[4],day[5],day[1]];
ordered.forEach(x=>{
  const dd=({'La Barra Atala':[3,23,45],'La Barra Atalaya':[3,23,48],'La Barra Miraflores':[3,23,51],'Zona Presidente':[3,23,53],'Food Shop':[3,23,55]})[x.ng]; // ventas Food Shop T2 y demás: día siguiente 
  env.setClock(U(3,dd[1],dd[2]));
  if(x===day[0])env.setClock(U(3,16,0));
  const r=call('saveVentas',{id:x.cid,ventas:x.ventas},A);
  const hh=(x===day[0])?'16:00':`${dd[1]}:${String(dd[2]).padStart(2,'0')}`;timeline.push(`${hh}  Administración carga ventas ${x.ng} · ${x.t}: ${r.resumen.ok} OK, ${r.resumen.rev} revisar, ${r.resumen.crit} críticos, faltante RD$ ${Math.round(r.resumen.faltante)}`);
});
// rectificación
env.setClock(U(3,23,58));
const rc=call('getConteo',{id:day[4].cid},A);
const w=rc.res.find(x=>x[11]!=='OK');
if(w){const it=rc.items.find(i=>i.pid===w[0]);
  call('rectificar',{id:day[4].cid,cambios:{[w[0]]:{ini:it.ini,ent:it.ent,fin:it.fin+Math.max(w[9],0)}},motivo:'Rosa recontó el estante y encontró más unidades'},A);
  timeline.push(`10:15  Administración rectifica ${w[1]} en La Barra Miraflores (recuento)`)}
env.setClock(U(3,23,59));
const d=call('dash',{desde:'2026-11-03',hasta:'2026-11-03'},G);
fs.writeFileSync('/tmp/day.json',JSON.stringify({timeline,d}));
(async()=>{
  const browser=await chromium.launch();fs.mkdirSync('shots',{recursive:true});
  async function newUser(){
    const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
    const page=await ctx.newPage();
    await page.exposeFunction('__api',s=>env.ctx.api(s));
    await page.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};
      window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}}});
    await page.clock.setFixedTime(new Date(U(3,23,59)));
    await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
    await page.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await page.goto('http://app.local/');return page}
  async function login(page,email){await page.waitForSelector('#lg-email');await page.fill('#lg-email',email);await page.click('[data-act=lg-send]');await page.waitForSelector('#lg-code');
    const c=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];await page.fill('#lg-code',c);await page.click('[data-act=lg-verify]')}
  const errs=[];
  const g=await newUser();g.on('pageerror',e=>errs.push(e.message));await login(g,'gerencia@gmail.com');await g.waitForTimeout(1500);
  await g.screenshot({path:'shots/d1-inicio.png'});
  const nav=await g.$$eval('nav button',b=>b.map(x=>x.dataset.v+':'+x.textContent.trim()));console.log('NAV',nav);
  await g.click('[data-act=go][data-v=panel]');await g.waitForTimeout(800);await g.click('text=Hoy').catch(()=>{});await g.waitForTimeout(1200);await g.screenshot({path:'shots/d2-panel.png',fullPage:true});
  const a=await newUser();a.on('pageerror',e=>errs.push(e.message));await login(a,'dueno@gmail.com');await a.waitForTimeout(1200);
  await a.click('[data-act=go][data-v=res]');await a.waitForTimeout(1000);await a.screenshot({path:'shots/d3-resultados.png',fullPage:true});
  await a.click('[data-act=det-open]:has-text("La Barra Atalaya")');await a.waitForTimeout(1000);await a.screenshot({path:'shots/d4-detalle-lb2.png',fullPage:true});
  const l=await newUser();l.on('pageerror',e=>errs.push(e.message));await login(l,'pedro@gmail.com');await l.waitForTimeout(1200);await l.screenshot({path:'shots/d5-lider.png'});
  console.log('ERRS',errs);await browser.close();
})();
