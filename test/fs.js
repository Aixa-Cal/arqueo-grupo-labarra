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
  await ana.click('[data-act=go][data-v=contar]');
  await ana.click('[data-act=neg]');await ana.click('[data-act=turno][data-v="0"]');await ana.click('#startBtn');await ana.waitForSelector('#saveBtn');
  await shot(ana,'50-fs-inicio');
  const cats=await ana.$$eval('#fcat-sel option',e=>e.map(x=>x.textContent));
  console.log('cats',cats.length,cats.slice(0,6));
  const tot=await ana.$$eval('.pcard',e=>e.length);
  await ana.selectOption('#fcat-sel',{label:/Cervezas/}.label||undefined).catch(()=>{});await ana.evaluate(()=>{const s=document.getElementById('fcat-sel');const i=[...s.options].findIndex(o=>/^Cervezas/.test(o.textContent));s.value=s.options[i].value;s.dispatchEvent(new Event('change',{bubbles:true}))});
  const vis=await ana.$$eval('.pcard',e=>e.filter(c=>!c.hidden).length);
  console.log('total',tot,'visibles en Cervezas',vis);
  await shot(ana,'51-fs-cervezas');
  const vv=await ana.$$eval('.pcard',e=>e.filter(c=>c.offsetParent!==null).length);console.log('visibles de verdad',vv);
  await ana.fill('#q','corona');const v2=await ana.$$eval('.pcard',e=>e.filter(c=>c.offsetParent!==null).length);console.log('busqueda corona',v2);
  await ana.fill('#q','');await ana.click('[data-act=fmode][data-v=cero]');const v3=await ana.$$eval('.pcard',e=>e.filter(c=>c.offsetParent!==null).length);console.log('en 0 (esperado 0)',v3);
  console.log('errores',errors);await b.close();
})();
