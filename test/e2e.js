const {chromium}=require('playwright');
const {makeEnv}=require('./mock');
const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');
const env=makeEnv();
env.ctx.instalar();
const errors=[];
async function newUser(browser){
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text())});
  await page.exposeFunction('__api',s=>env.ctx.api(s));
  await page.addInitScript(()=>{
    window.google={script:{run:new Proxy({},{get(_,name){
      return function(...args){};
    }})}};
    const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},
      api(s){window.__api(s).then(ok,bad)}};return o};
    window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}};
  });
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await page.goto('http://app.local/');
  return page;
}
async function login(page,email,name){
  await page.waitForSelector('#lg-email');
  await page.fill('#lg-email',email);
  const before=env.mails.length;
  await page.click('[data-act=lg-send]');
  await page.waitForSelector('#lg-code');
  const code=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];
  await page.fill('#lg-code',code);
  if(name){await page.fill('#lg-name',name)}
  await page.click('[data-act=lg-verify]');
}
(async()=>{
  const browser=await chromium.launch();
  const shot=(p,n)=>p.screenshot({path:'shots/'+n+'.png'});
  fs.mkdirSync('shots',{recursive:true});
  // 1 owner
  const adm=await newUser(browser);
  await login(adm,'dueno@gmail.com');
  await adm.waitForSelector('text=Por completar');
  await shot(adm,'01-admin-pend');
  // 2 ana asks access
  const ana=await newUser(browser);
  await login(ana,'ana@gmail.com','Ana Pérez');
  await ana.waitForSelector('text=Solicitud enviada');
  await shot(ana,'02-ana-pending');
  // admin sees notification & approves
  await adm.click('[data-act=go][data-v=avisos]');
  await adm.waitForSelector('text=Nuevo acceso solicitado');
  await shot(adm,'03-admin-avisos');
  await adm.click('[data-act=notif]');
  await adm.waitForSelector('text=Solicitudes de acceso');
  await adm.click('[data-act=eq-edit]');
  await adm.click('[data-act=eq-neg][data-v="3"]'); // Food Shop idx 3
  await shot(adm,'04-admin-eq-form');
  await adm.click('[data-act=eq-save]');
  await adm.waitForSelector('text=Guardado');
  // ana gets in
  await ana.click('[data-act=check-pending]');
  await ana.waitForSelector('text=¿Qué vas a contar?');
  await shot(ana,'05-ana-contar');
  await ana.click('[data-act=neg]');
  await ana.waitForSelector('text=Turno 1');
  await ana.click('[data-act=turno][data-v="0"]');
  await shot(ana,'06-ana-elegido');
  await ana.click('#startBtn');
  await ana.waitForSelector('#saveBtn');
  // fill 3 products
  const ids=await ana.$$eval('[data-f=fin]',els=>els.slice(0,4).map(e=>e.dataset.pid));
  console.log('first pids',ids);
  for(const pid of ids){
    /* sin «Había» en el Food Shop: solo Quedan */
    await ana.fill(`#i-${pid}-fin`,'12');
  }
  await shot(ana,'07-ana-contando');
  for(let i=0;i<6;i++)await ana.click('[data-act=ck][data-v="'+i+'"]');await ana.click('[data-act=caf][data-k=rell][data-v=si]').catch(()=>{});await ana.click('[data-act=caf][data-k=func][data-v=si]').catch(()=>{});await ana.click('[data-act=fz][data-v=si]').catch(()=>{});await ana.click('[data-act=nov][data-v=no]');
  await ana.click('#saveBtn');
  await ana.waitForSelector('text=Conteo guardado');
  await shot(ana,'08-ana-listo');
  // el primer conteo es inicial: no pide ventas
  await ana.waitForSelector('text=conteo inicial');
  await adm.click('[data-act=go][data-v=pend]');
  await adm.waitForTimeout(300);
  if(await adm.locator('button:has-text("Registrar ventas")').count())errors.push('FAIL: conteo inicial aparece pendiente');
  // second count for ana next turno (Turno 2) so there is baseline
  await ana.click('[data-act=again]');
  await ana.click('[data-act=neg]');
  await ana.waitForSelector('text=Turno 2');
  await ana.click('[data-act=turno][data-v="1"]');
  await ana.click('#startBtn');
  await ana.waitForSelector('#saveBtn');
  const vals=await ana.$$eval('[data-f=fin]',els=>els.slice(0,6).map(e=>[e.dataset.pid,'']));
  console.log('Había oculto en Food Shop:',(await ana.$$('[data-f=ini]')).length===0);
  console.log('autofilled ini',vals);
  for(const [pid,v] of vals.slice(0,4)){await ana.fill(`#i-${pid}-fin`,'7')}
  for(let i=0;i<6;i++)await ana.click('[data-act=ck][data-v="'+i+'"]');await ana.click('[data-act=caf][data-k=rell][data-v=si]').catch(()=>{});await ana.click('[data-act=caf][data-k=func][data-v=si]').catch(()=>{});await ana.click('[data-act=fz][data-v=si]').catch(()=>{});await ana.click('[data-act=nov][data-v=no]');
  await ana.click('#saveBtn');
  await ana.waitForSelector('text=Conteo guardado');
  // admin: ventas with CSV
  await adm.click('[data-act=go][data-v=pend]');
  await adm.waitForSelector('button:has-text("Registrar ventas")');
  await adm.click('button:has-text("Registrar ventas")');
  await adm.waitForSelector('text=Subir CSV de Citrus');
  await shot(adm,'12-admin-ventas-tramo');
  await adm.setInputFiles('input[type=file]','/home/claude/an/rep.csv');
  await adm.waitForSelector('text=filas leídas');
  await adm.setInputFiles('input[data-add]','/home/claude/an/rep.csv');
  await adm.waitForSelector('text=rep.csv + rep.csv');
  await shot(adm,'13-admin-ventas-csv');
  await adm.click('[data-act=vs-calc]');
  await adm.waitForSelector('text=Faltante estimado',{timeout:5000});
  await shot(adm,'15-resultado');
  await adm.click('[data-act=go][data-v=panel]');
  await adm.waitForSelector('text=Cumplimiento');
  await adm.waitForTimeout(300);
  await shot(adm,'16-panel');
  await adm.click('[data-act=go][data-v=cat]');
  await adm.waitForSelector('text=Calendario de conteo');
  await shot(adm,'17-catalogo');
  // gerencia
  const ger=await newUser(browser);
  await login(ger,'ger@gmail.com','Gerente Uno');
  await ger.waitForSelector('text=Solicitud enviada');
  await adm.click('[data-act=go][data-v=eq]');
  await adm.waitForSelector('text=Solicitudes de acceso');
  await adm.click('[data-act=eq-edit]');
  await adm.click('[data-act=eq-set][data-k=rol][data-v=gerencia]');
  await adm.click('[data-act=eq-save]');
  await adm.waitForSelector('text=Guardado');
  await ger.click('[data-act=check-pending]');
  await ger.waitForSelector('text=Panel');
  await ger.waitForTimeout(400);
  await shot(ger,'18-gerencia-panel');
  console.log('ERRORS',errors);
  await browser.close();
})().catch(e=>{console.error('FAIL',e.message,errors);process.exit(1)});
