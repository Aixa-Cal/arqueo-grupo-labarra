const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');const assert=require('assert');
const html=fs.readFileSync('../docs/index.html','utf8');
const env=makeEnv();env.ctx.instalar();const errors=[];
const call=(a,p,t)=>JSON.parse(env.ctx.api(JSON.stringify({a,p,t})));
const ok=(a,p,t)=>{const r=call(a,p,t);assert(r.ok,a+JSON.stringify(r));return r.data};
async function page(b){const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
  p.on('pageerror',e=>errors.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errors.push('CONSOLE '+m.text())});
  await p.exposeFunction('__api',s=>env.ctx.api(s));
  await p.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};
    window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}};});
  await p.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await p.goto('http://app.local/');return p}
async function login(p,email,name){await p.waitForSelector('#lg-email');await p.fill('#lg-email',email);await p.click('[data-act=lg-send]');await p.waitForSelector('#lg-code');
  const code=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];await p.fill('#lg-code',code);if(name){const n=await p.$('#lg-name');if(n)await p.fill('#lg-name',name)}await p.click('[data-act=lg-verify]')}
(async()=>{
  const b=await chromium.launch();
  const adm=await page(b);await login(adm,'dueno@gmail.com');await adm.waitForSelector('text=Por completar');
  const TA=await adm.evaluate(()=>localStorage.getItem('arq-tok'));
  const col=await page(b);await login(col,'col@g.com','Carlos Ruiz');await col.waitForSelector('text=Solicitud enviada');
  const sup=await page(b);await login(sup,'sup@g.com','Sara Sup');await sup.waitForSelector('text=Solicitud enviada');
  // Equipo (admin, por pantalla): rol Supervisor + teléfono
  await adm.click('[data-act=go][data-v=eq]');await adm.waitForSelector('text=Solicitudes de acceso');
  await adm.click('[data-act=eq-edit][data-id="sup@g.com"]');await adm.waitForSelector('[data-act=eq-set][data-v=supervisor]');
  await adm.click('[data-act=eq-set][data-v=supervisor]');await adm.fill('#eq-tel','809-555-1234');
  await adm.screenshot({path:'shots/90-eq-sup.png'});
  await adm.click('[data-act=eq-save]');await adm.waitForSelector('text=Guardado');
  await adm.click('[data-act=eq-edit][data-id="col@g.com"]');await adm.click('[data-act=eq-set][data-v=colaborador]');await adm.fill('#eq-tel','829 111 2222');
  await adm.evaluate(()=>document.querySelector('[data-act=eq-neg]')?.click());await adm.click('[data-act=eq-save]');await adm.waitForSelector('text=Guardado');
  await sup.click('[data-act=check-pending]').catch(()=>{});await sup.waitForSelector('text=Por completar',{timeout:10000});
  const nav=await sup.$$eval('.foot button, nav button, .tabbar button',e=>e.map(x=>x.textContent.trim()));console.log('nav supervisor',nav);
  assert(!nav.some(x=>/Panel|Catálogo|Equipo/.test(x)),'supervisor no ve administración');
  await sup.reload();await sup.waitForSelector('text=Por completar');await sup.waitForTimeout(800);
  const links=await sup.$$eval('a.wa',a=>a.map(x=>x.href));console.log('wa',links.length,links[0]&&decodeURIComponent(links[0]).slice(0,200));
  assert(links.length>0,'botones de WhatsApp');assert(links.every(h=>/^https:\/\/wa\.me\/1?\d{10,11}\?text=/.test(h)));
  await sup.screenshot({path:'shots/91-sup-pend.png'});
  console.log('errores',errors);await b.close();if(errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
