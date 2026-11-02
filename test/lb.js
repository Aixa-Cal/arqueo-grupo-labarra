const {chromium}=require('playwright');
const {makeEnv}=require('./mock');
const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');
const env=makeEnv({clock:Date.UTC(2026,10,3,15,0,0)});env.ctx.instalar();
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
  console.log(JSON.parse(env.ctx.api(JSON.stringify({a:'setUser',p:{email:'ana@gmail.com',rol:'colaborador',estado:'aprobado',negocios:['La Barra 1']},t:tok}))).ok);
  await ana.click('[data-act=check-pending]');await ana.waitForSelector('text=¿Qué vas a contar?');
  const days=async(iso,label)=>{
    env.setClock(new Date(iso).getTime());
    await ana.clock.setFixedTime(new Date(iso));
    await ana.reload();await ana.waitForSelector('text=¿Qué vas a contar?');
    await ana.click('[data-act=neg]');await ana.click('[data-act=turno][data-v="0"]');
    console.log(label,'| aviso:',(await ana.$$eval('.hint',e=>e.map(x=>x.textContent)).catch(()=>[])).filter(t=>/Hoy no se cuenta|conteo completo/.test(t)).join(' / '));
    await ana.click('#startBtn');await ana.waitForSelector('#saveBtn');
    const cats=await ana.$$eval('.pcard',e=>[...new Set(e.map(c=>c.dataset.c))]);
    console.log(label,'categorías que se cuentan:',cats.join(', '));
    console.log(label,'banner sandwichera:',/sandwichera/.test(await ana.innerText('body')));await shot(ana,'80-lb-'+label);
    await ana.click('[data-act=back]');
  };
  await days('2026-11-03T15:00:00Z','martes');
  await days('2026-11-02T15:00:00Z','lunes');
  console.log('errores',errors);await b.close();
})();
