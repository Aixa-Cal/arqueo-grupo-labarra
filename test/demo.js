const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');
const U=(d,h,m)=>Date.UTC(2026,10,d,h+4,m||0);
const env=makeEnv({clock:U(1,22,0)});env.ctx.instalar();
const call=(a,p,t)=>{const r=env.call(a,p,t);if(!r.ok)throw new Error(a+' '+JSON.stringify(r));return r.data};
function login(email,nombre){env.call('reqCode',{email});const c=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];return env.call('verifyCode',{email,code:c,nombre}).data.token}
const A=login('dueno@gmail.com');
login('pedro@gmail.com','Pedro Ramírez');call('setUser',{email:'pedro@gmail.com',rol:'lider',estado:'aprobado',negocios:['La Barra 2']},A);
login('gerencia@gmail.com','Gerencia');call('setUser',{email:'gerencia@gmail.com',rol:'gerencia',estado:'aprobado',negocios:[]},A);
const P=call('sync',{},A).productos;P.forEach(p=>call('saveProducto',{...p,costo:({unid:25,kg:180,lb:80,lt:60}[p.unidad]||40)},A));
const prods=call('sync',{},A).productos.filter(p=>p.negocios.includes('La Barra 2'));
// conteo inicial de ayer (backend)
const TP=login('pedro@gmail.com');
const base=prods.map((p,i)=>({pid:p.id,ini:30+i,ent:0,fin:30+i,src:''}));
call('saveConteo',{id:'c_base0001',fecha:'2026-11-01',negocio:'La Barra 2',turno:'Día completo',items:base},TP);
env.setClock(U(2,23,10));
const vend={};prods.forEach((p,i)=>vend[p.id]=3+(i*7)%9);
const leakSet={};[2,9,14].forEach(i=>leakSet[prods[i].id]=1.35);
(async()=>{
  const browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,recordVideo:{dir:'/tmp/demo',size:{width:390,height:844}}});
  const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.exposeFunction('__api',s=>env.ctx.api(s));
  await page.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};
    window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}}});
  await page.clock.setFixedTime(new Date(U(2,23,10)));
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
  const cap=async t=>{await page.evaluate(t=>{let d=document.getElementById('__cap');if(!d){d=document.createElement('div');d.id='__cap';d.style.cssText='position:fixed;left:8px;right:8px;top:8px;z-index:99999;background:#111c;color:#fff;font:600 14px system-ui;padding:10px 12px;border-radius:10px;pointer-events:none';document.body.appendChild(d)}d.textContent=t},t);};
  const pause=ms=>page.waitForTimeout(ms);
  async function loginUI(email){await page.goto('http://app.local/');await page.waitForSelector('#lg-email');await cap('Entrar con el correo: llega un código de 6 dígitos');await pause(1200);
    await page.fill('#lg-email',email);await pause(600);await page.click('[data-act=lg-send]');await page.waitForSelector('#lg-code');
    const c=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];await page.fill('#lg-code',c);await pause(800);await page.click('[data-act=lg-verify]');await pause(1500)}
  // 1 líder
  await loginUI('pedro@gmail.com');await cap('1. LÍDER (Pedro, La Barra 2) abre la app en su celular');await pause(1800);
  await page.screenshot({path:'/tmp/demo/s1.png'});
  await page.waitForSelector('[data-act=neg]').then(()=>page.click('[data-act=neg]')).catch(()=>{});
  await pause(800);
  await page.waitForSelector('[data-act=turno]').then(()=>page.click('[data-act=turno][data-v="0"]')).catch(()=>{});
  await cap('Elige negocio y turno, y empieza el conteo');await pause(1200);
  await page.click('#startBtn');await page.waitForSelector('#saveBtn');
  await cap('"Había" aparece solo: viene del conteo anterior');await pause(2200);
  const ids=await page.$$eval('[data-f=fin]',els=>els.map(e=>e.dataset.pid));
  const inis=await page.$$eval('[data-f=ini]',els=>Object.fromEntries(els.map(e=>[e.dataset.pid,Number(e.value)])));
  await cap('Solo escribe cuánto QUEDA de cada producto');
  const fin={};
  for(let i=0;i<ids.length;i++){const pid=ids[i],p=prods.find(x=>x.id===pid);const cons=vend[pid]*p.factor*(leakSet[pid]||1);const f=Math.max(0,Math.round((inis[pid]-cons)*100)/100);fin[pid]=f;
    if(i<4){await page.type(`#i-${pid}-fin`,String(f),{delay:120});await pause(400)}else{await page.fill(`#i-${pid}-fin`,String(f))}}
  await pause(1200);await page.screenshot({path:'/tmp/demo/s2.png'});
  await cap('La barra de progreso muestra que está todo listo');await pause(1500);
  await page.click('#saveBtn');await page.waitForSelector('text=Conteo guardado');await cap('Conteo guardado. Administración recibe un aviso');await pause(2200);
  await page.screenshot({path:'/tmp/demo/s3.png'});
  // 2 admin
  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
  await loginUI('dueno@gmail.com');await cap('2. ADMINISTRACIÓN: ve el conteo esperando ventas');await pause(2000);
  await page.click('[data-act=go][data-v=pend]');await page.waitForSelector('button:has-text("Registrar ventas")');await pause(1200);
  await page.click('button:has-text("Registrar ventas")');await page.waitForSelector('[data-vq]');
  await cap('Registra lo vendido (CSV de Citrus o a mano)');await pause(1800);
  const vids=await page.$$eval('[data-vq]',els=>els.map(e=>e.dataset.vq));
  for(let i=0;i<vids.length;i++){if(i<4){await page.type(`[data-vq="${vids[i]}"]`,String(vend[vids[i]]),{delay:120});await pause(300)}else await page.fill(`[data-vq="${vids[i]}"]`,String(vend[vids[i]]))}
  await pause(1000);await page.click('[data-act=vs-calc]');await page.waitForSelector('text=Arqueo calculado',{timeout:8000}).catch(()=>{});
  await pause(1200);await page.click('[data-act=go][data-v=res]').catch(()=>{});await pause(1500);
  await page.click('[data-act=det-open]').catch(()=>{});await page.waitForSelector('text=Faltante estimado');
  await cap('El arqueo: lo que salió vs. lo que debía salir');await pause(2500);await page.screenshot({path:'/tmp/demo/s4.png'});
  await page.mouse.wheel(0,300);await pause(1500);await cap('Los productos con diferencia salen en CRÍTICO');await pause(2200);
  // 3 gerencia
  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
  await loginUI('gerencia@gmail.com');await cap('3. GERENCIA: panel con el resultado del día');await pause(1500);
  await page.click('[data-act=go][data-v=panel]');await page.waitForTimeout(800);await page.click('text=Hoy').catch(()=>{});await pause(2500);
  await page.screenshot({path:'/tmp/demo/s5.png'});await cap('Cumplimiento, faltante en RD$ y productos con más pérdida');await pause(3000);
  await page.mouse.wheel(0,500);await pause(2500);
  console.log('ERRS',errs);
  await ctx.close();await browser.close();
  const v=fs.readdirSync('/tmp/demo').find(f=>f.endsWith('.webm'));console.log('VIDEO',v);
})();
