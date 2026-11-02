const {chromium}=require('playwright');
const {makeEnv}=require('./mock');
const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');
const env=makeEnv();env.ctx.instalar();
const errors=[];
async function newUser(browser){
  const ctx=await browser.newContext({viewport:{width:360,height:740}});
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
  console.log(JSON.parse(env.ctx.api(JSON.stringify({a:'setUser',p:{email:'ana@gmail.com',rol:'colaborador',estado:'aprobado',negocios:['Food Shop','Zona Presidente']},t:tok}))).ok);
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
  // --- Filtros en conteo
  await ana.click('[data-act=go][data-v=contar]');
  await ana.click('[data-act=neg]');await ana.click('[data-act=turno][data-v="0"]');await ana.click('#startBtn');await ana.waitForSelector('#saveBtn');
  const total=await ana.$$eval('.pcard',e=>e.length);
  const cats=await ana.$$eval('#fcat-sel option',e=>e.map(x=>x.textContent.trim()));
  console.log('tarjetas',total,'categorias',cats.length,cats.slice(0,4));
  // llenar 3: dos en 0
  await ana.evaluate(()=>{const c=[...document.querySelectorAll('.pcard')].slice(0,3);c.forEach((card,i)=>{const id=card.id.replace('card-','');const set=(f,v)=>{const e=document.getElementById('i-'+id+'-'+f);if(!e)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};set('ini','10');set('fin',i<2?'0':'4')})});
  const zc=await ana.$eval('#fm-cero',e=>e.textContent);const pc=await ana.$eval('#fm-pend',e=>e.textContent);
  console.log('contador cero',zc,'sin contar',pc);
  await ana.click('[data-act=fmode][data-v=cero]');
  const vz=await ana.$$eval('.pcard',e=>e.filter(c=>!c.hidden).length);console.log('visibles en 0 (esperado 2):',vz);
  await ana.click('[data-act=fmode][data-v=cero]');
  const va=await ana.$$eval('.pcard',e=>e.filter(c=>!c.hidden).length);console.log('visibles sin filtro',va,'(esperado',total,')');
  await ana.click('[data-act=fmode][data-v=pend]');
  const vp=await ana.$$eval('.pcard',e=>e.filter(c=>!c.hidden).length);console.log('sin contar (esperado',total-3,'):',vp);
  await ana.click('[data-act=fmode][data-v=pend]');
  // categoria
  await ana.selectOption('#fcat-sel',{index:1});
  const vc=await ana.$$eval('.pcard',e=>{const v=e.filter(c=>!c.hidden);return {n:v.length,cats:[...new Set(v.map(c=>c.dataset.c))]}});console.log('categoria 1',JSON.stringify(vc));
  const heads=await ana.$$eval('.plist .cat',e=>e.filter(h=>!h.hidden).length);console.log('encabezados visibles (1):',heads);
  await shot(ana,'30-filtros');
  console.log('overflowX',await ana.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth));
  await ana.evaluate(()=>window.scrollTo(0,600));await shot(ana,'31-scroll');
  // categoria + en 0 + busqueda
  await ana.selectOption('#fcat-sel',{index:0});
  await ana.fill('#q','zzzz');
  console.log('vacio visible:',await ana.$eval('#fempty',e=>!e.hidden));
  await ana.fill('#q','');
  // seguir llenando todo y guardar
  await ana.evaluate(()=>{document.querySelectorAll('[data-f=ini]').forEach(e=>{if(!e.value){e.value='50';e.dispatchEvent(new Event('input',{bubbles:true}))}});document.querySelectorAll('[data-f=fin]').forEach(e=>{if(!e.value){e.value='40';e.dispatchEvent(new Event('input',{bubbles:true}))}})});
  for(let i=0;i<6;i++)await ana.click('[data-act=ck][data-v="'+i+'"]');await ana.click('[data-act=nov][data-v=no]');
  await ana.click('#saveBtn');await ana.waitForSelector('text=Conteo guardado');console.log('guardado ok');
  console.log('ERRORS',JSON.stringify(errors));
  await b.close();
})();
