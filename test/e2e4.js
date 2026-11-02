const {chromium}=require('playwright');
const {makeEnv}=require('./mock');
const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8').replace('function errMsg(e){','function errMsg(e){console.error("ERRMSG",e&&(e.stack||e.msg||e));');
const env=makeEnv();env.ctx.instalar();
const errors=[];
async function newUser(browser){
  const ctx=await browser.newContext({viewport:{width:360,height:740}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push('PAGEERROR '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errors.push('CONSOLE '+m.text())});
  await page.exposeFunction('__api',s=>{const r=env.ctx.api(s);if(/"a":"(sync|startCount)"/.test(s)&&!JSON.parse(r).ok)console.log('API FAIL',s.slice(0,80),r.slice(0,300));return r});
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
  await ana.waitForTimeout(500);console.log('ERR',errors);await shot(ana,'dbg');console.log((await ana.innerText('body')).slice(0,300));
  await shot(ana,'40-lider-contar');
  // --- Movimientos
  await ana.click('[data-act=go][data-v=recibir]');
  await ana.click('[data-act=rneg][data-v="0"]'); // Food Shop
  await ana.fill('#rq','Red Bull');await ana.click('[data-act=rec-add]');await ana.fill('[data-rq]','24');await shot(ana,'41-entrada');await ana.click('[data-act=rec-del]');
  await ana.click('[data-act=rmodo][data-v=merma]');
  await ana.fill('#rq','Red Bull');await ana.click('[data-act=rec-add]');await ana.fill('[data-rq]','2');
  console.log('btn dis sin motivo',await ana.$eval('#rbtn',e=>e.disabled),await ana.$eval('#rmsg',e=>e.textContent));
  await ana.selectOption('#rmotivo','Se dañó');
  console.log('msg',await ana.$eval('#rmsg',e=>e.textContent));
  await ana.fill('#rdet','Se calentó por falla de nevera');
  await shot(ana,'30-merma');
  await ana.click('#rbtn');await ana.waitForSelector('text=Merma registrada');
  await ana.click('[data-act=rmodo][data-v=traspaso]');
  await ana.fill('#rq','Presidente Light');await ana.click('[data-act=rec-add]');await ana.fill('[data-rq]','12');
  await ana.selectOption('#rdest','Zona Presidente');
  await shot(ana,'31-traspaso');
  await ana.click('#rbtn');await ana.waitForTimeout(800);console.log('TOAST',await ana.$eval('#toast',e=>e.textContent));await ana.waitForSelector('text=Traspaso enviado');
  await shot(ana,'32-enviado');
  // la misma lider recibe en ZP
  await ana.click('[data-act=rneg][data-v="1"]');
  await ana.waitForSelector('text=Traspasos por recibir');
  await shot(ana,'33-por-recibir');
  await ana.fill('[data-tq]','11');
  ana.on('dialog',d=>d.accept());
  await ana.click('[data-act=tr-recv]');await ana.waitForSelector('text=Traspaso recibido');
  await shot(ana,'34-recibido');
  console.log('errores:',errors);
  await b.close();
})();
