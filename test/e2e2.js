const {chromium}=require('playwright');
const {makeEnv}=require('./mock');
const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');
const env=makeEnv();env.ctx.instalar();
const errors=[];
async function newUser(browser){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errors.push('CONSOLE '+m.text())});
  await page.exposeFunction('__api',s=>env.ctx.api(s));
  await page.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};
    window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}};});
  await page.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
  await page.goto('http://app.local/');return page;
}
async function login(page,email,name){
  await page.waitForSelector('#lg-email');await page.fill('#lg-email',email);
  await page.click('[data-act=lg-send]');await page.waitForSelector('#lg-code');
  const code=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];
  await page.fill('#lg-code',code);if(name)await page.fill('#lg-name',name);
  await page.click('[data-act=lg-verify]');
}
const shot=(p,n)=>p.screenshot({path:'shots/'+n+'.png'});
(async()=>{
  const b=await chromium.launch();
  const adm=await newUser(b);await login(adm,'dueno@gmail.com');await adm.waitForSelector('text=Por completar');
  const ana=await newUser(b);await login(ana,'ana@gmail.com','Ana Pérez');await ana.waitForSelector('text=Solicitud enviada');
  // approve through api for speed
  const tok=await adm.evaluate(()=>localStorage.getItem('arq-tok'));
  console.log(JSON.parse(env.ctx.api(JSON.stringify({a:'setUser',p:{email:'ana@gmail.com',rol:'lider',estado:'aprobado',negocios:['Food Shop','Zona Presidente']},t:tok}))).ok);
  await ana.click('[data-act=check-pending]');await ana.waitForSelector('text=¿Qué vas a contar?');
  // --- Recibir
  await ana.click('[data-act=go][data-v=recibir]');
  await ana.click('[data-act=rneg][data-v="0"]');
  await ana.fill('#rq','Red Bull');
  await ana.click('[data-act=rec-add]');
  await ana.fill('[data-rq]','24');
  await ana.fill('#rnota','Pedido proveedor');
  await ana.click('#rbtn');await ana.waitForSelector('text=Entrada registrada');
  await shot(ana,'20-recibir');
  // --- Contar T1 todos los productos (lunes 2-nov)
  await ana.click('[data-act=go][data-v=contar]');
  await ana.click('[data-act=neg]');await ana.click('[data-act=turno][data-v="0"]');await ana.click('#startBtn');await ana.waitForSelector('#saveBtn');
  const n1=await ana.$$eval('.pcard',e=>e.length);console.log('lunes tarjetas',n1);
  const ent=await ana.$eval('#i-fs-001-ent',e=>e.value);console.log('Entró autollenado (sin conteo previo)',JSON.stringify(ent));
  await ana.evaluate(()=>{document.querySelectorAll('[data-f=ini]').forEach(e=>{e.value='50';e.dispatchEvent(new Event('input',{bubbles:true}))});document.querySelectorAll('[data-f=fin]').forEach(e=>{e.value='40';e.dispatchEvent(new Event('input',{bubbles:true}))})});
  await ana.click('#saveBtn');await ana.waitForSelector('text=Conteo guardado');
  // admin cierra T1 (todo inicial)
  await adm.click('[data-act=go][data-v=pend]');await adm.waitForSelector('button:has-text("Registrar ventas")');await adm.click('button:has-text("Registrar ventas")');
  await adm.waitForSelector('text=Sin conteo previo');await adm.click('[data-act=vs-calc]');await adm.waitForSelector('text=Arqueo calculado');
  await adm.waitForTimeout(300);
  // T2 con base
  await ana.click('[data-act=again]');await ana.click('[data-act=neg]');await ana.click('[data-act=turno][data-v="1"]');await ana.click('#startBtn');await ana.waitForSelector('#saveBtn');
  const ent2=await ana.$eval('#i-fs-001-ent',e=>e.value);console.log('Entró T2 fs-001 (debe ser 24? entrada fue antes del T1 => 0)',JSON.stringify(ent2));
  const ini2=await ana.$eval('#i-fs-001-ini',e=>e.value);console.log('Había T2',ini2);
  await ana.evaluate(()=>{document.querySelectorAll('[data-f=fin]').forEach((e,i)=>{e.value=String(30-(i%3));e.dispatchEvent(new Event('input',{bubbles:true}))})});
  await ana.click('#saveBtn');await ana.waitForSelector('text=Conteo guardado');
  // admin: ventas con CSV
  await adm.click('[data-act=go][data-v=pend]');await adm.waitForSelector('button:has-text("Registrar ventas")');await adm.click('button:has-text("Registrar ventas")');
  await adm.waitForSelector('text=Subir CSV de Citrus');
  await adm.setInputFiles('input[type=file]','/home/claude/an/rep.csv');
  await adm.waitForSelector('text=filas leídas');
  console.log('CSV stats:',await adm.$eval('.note',e=>e.textContent));
  const por=await adm.$$eval('.ualloc b',e=>e.map(x=>x.textContent));console.log('por asignar',por.length,por.slice(0,12));
  
  await shot(adm,'21-csv-full');
  // asignar primera sugerencia a las filas por asignar
  for(let k=0;k<60;k++){
    const idx=await adm.evaluate(()=>{const s=[...document.querySelectorAll('select[data-asg]')];return s.findIndex(x=>x.value==='')});
    if(idx<0)break;
    const val=await adm.evaluate(i=>{const s=document.querySelectorAll('select[data-asg]')[i];return [...s.options].map(o=>o.value)[1]},idx);
    await adm.locator('select[data-asg]').nth(idx).selectOption(val);
  }
  console.log('post-asign stats:',await adm.$eval('.note',e=>e.textContent));
  const dura=await adm.$eval('[data-vq=fs-032]',e=>e.value);console.log('Presidente Dura 12oz vendido',dura);
  await adm.click('[data-act=vs-calc]');await adm.waitForSelector('text=Faltante estimado');
  await shot(adm,'22-resultado-full');
  // rectificar via UI
  await adm.click('[data-act=rect-start]');
  await adm.fill('[data-rect="fs-032:fin"]','35');
  await adm.fill('#motivo','Conteo mal hecho');
  await adm.click('[data-act=rect-save]');await adm.waitForSelector('text=Conteo rectificado');
  await adm.waitForSelector('text=rectificado');
  // anular
  await adm.click('[data-act=anular]');await adm.fill('#motivo','Prueba');await adm.click('[data-act=anular-ok]');await adm.waitForSelector('text=Conteo anulado');
  // leader view history
  await ana.click('[data-act=go][data-v=mios]');await shot(ana,'23-mios');
  // martes (3-nov): solo críticos
  env.setClock(Date.UTC(2026,10,3,14,0,0));
  await ana.click('[data-act=go][data-v=contar]');await ana.evaluate(()=>document.visibilityState);
  await ana.reload();await ana.waitForSelector('text=¿Qué vas a contar?');
  await ana.click('[data-act=neg]');await ana.click('[data-act=turno][data-v="0"]');
  console.log('aviso martes:',await ana.$eval('.hint',e=>e.textContent));
  await ana.click('#startBtn');await ana.waitForSelector('#saveBtn');
  console.log('martes tarjetas',await ana.$$eval('.pcard',e=>e.length));
  // zona presidente un turno
  await ana.click('[data-act=back]');await ana.click('[data-act=neg][data-v="0"]');
  console.log('ZP turnos:',await ana.$$eval('.tchip',e=>e.map(x=>x.textContent)));
  await shot(ana,'24-zp');
  // admin panel
  await adm.click('[data-act=go][data-v=panel]');await adm.waitForSelector('text=Cumplimiento');await adm.waitForTimeout(400);await shot(adm,'25-panel');
  console.log('ERRORS',errors);
  await b.close();
})().catch(e=>{console.error('FAIL',e.message,errors);process.exit(1)});
