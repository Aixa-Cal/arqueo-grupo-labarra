const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');const U=(d,h,m)=>Date.UTC(2026,10,d,h+4,m||0);
const env=makeEnv({clock:U(1,22,0)});env.ctx.instalar();
const call=(a,p,t)=>{const r=env.call(a,p,t);if(!r.ok)throw new Error(a+JSON.stringify(r));return r.data};
function login(e,n){env.call('reqCode',{email:e});const c=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];return env.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const A=login('dueno@gmail.com');
const staff={'La Barra 1':'a@g.com','La Barra 2':'b@g.com','La Barra 3':'c@g.com','Food Shop':'d@g.com','Zona Presidente':'e@g.com'};const TK={};
Object.entries(staff).forEach(([n,e])=>{TK[n]=login(e,'Líder '+n);call('setUser',{email:e,rol:'lider',estado:'aprobado',negocios:[n]},A)});
const P=call('sync',{},A).productos;const turnos=call('sync',{},A).config.turnos;let id=1;const last={};
function cont(d,h,m,n,t,ventas){env.setClock(U(d,h,m));const list=P.filter(p=>p.negocios.includes(n)).slice(0,12);const sr=last[n]=last[n]||{};
  const items=list.map(p=>({pid:p.id,ini:40,ent:0,fin:35,src:sr[p.id]||''}));const cid='c_'+String(id++).padStart(8,'0');
  call('saveConteo',{id:cid,fecha:`2026-11-0${d}`,negocio:n,turno:t,items},TK[n]);list.forEach(p=>sr[p.id]=cid);
  if(ventas){const v={};list.forEach(p=>v[p.id]=5*p.factor?5:5);call('saveVentas',{id:cid,ventas:v},A)}return cid}
// ayer: todos menos Zona Presidente
['La Barra 1','La Barra 2','La Barra 3'].forEach(n=>cont(1,23,10,n,'Día completo',false));cont(1,15,10,'Food Shop','Turno 1 (7AM-3PM)',false);cont(1,23,10,'Food Shop','Turno 2 (3PM-11PM)',false);
// hoy 20:00
cont(2,19,30,'La Barra 1','Día completo',true);cont(2,19,40,'La Barra 2','Día completo',false);
env.setClock(U(2,20,0));
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.exposeFunction('__api',s=>env.ctx.api(s));
 await page.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}}});
 await page.clock.setFixedTime(new Date(U(2,20,0)));
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));await page.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await page.goto('http://app.local/');
 await page.fill('#lg-email','dueno@gmail.com');await page.click('[data-act=lg-send]');await page.waitForSelector('#lg-code');await page.fill('#lg-code',env.mails[env.mails.length-1].body.match(/\d{6}/)[0]);await page.click('[data-act=lg-verify]');
 await page.waitForSelector('text=Por completar');await page.waitForTimeout(1200);await page.screenshot({path:'shots/pc.png',fullPage:true});console.log('ERRS',errs);await b.close()})();
