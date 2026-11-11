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

const tok=(e,n)=>{env.call('reqCode',{email:e});const c=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];return env.call('verifyCode',{email:e,code:c,nombre:n}).data.token};
const assert=require('assert');
(async()=>{
  tok('dueno@gmail.com');
  const b=await chromium.launch();
  const a=await newUser(b);await login(a,'dueno@gmail.com');
  await a.waitForSelector('[data-act=go][data-v=eq]');await a.click('[data-act=go][data-v=eq]');
  await a.waitForSelector('[data-act=eqn-abrir]');await a.click('[data-act=eqn-abrir]');
  await a.fill('#eqn-nombre','Sol Pérez');await a.fill('#eqn-tel','809 555 1234');
  await a.click('[data-act=eqn-neg] >> text=Food Shop');await a.click('[data-act=eqn-tur][data-v="1"]');
  await a.click('[data-act=eqn-guardar]');await a.waitForSelector('.eq-enlace');await shot(a,'eq1');
  const href=await a.getAttribute('.eq-enlace a.wa','href');
  assert(/wa\.me\/18095551234/.test(href),href);
  const url=decodeURIComponent(href).match(/http:\/\/app\.local\/#i=[A-Za-z0-9]+/)[0];
  // Sol abre el enlace en su teléfono: entra directo, sin código
  const s=await newUser(b);
  await s.goto(url);
  await s.waitForSelector('[data-act=go][data-v=contar]');
  const t=await s.innerText('body');assert(/Sol/.test(t)&&!/Enviarme el código/.test(t),'entró sin código');
  assert.equal(await s.evaluate(()=>location.hash),'');
  await shot(s,'eq2');
  // el mismo enlace tras recargar: la sesión se mantiene
  await s.goto('http://app.local/');await s.waitForSelector('[data-act=go][data-v=contar]');
  // enlace malo: pantalla de login con mensaje
  const m=await newUser(b);await m.goto('http://app.local/#i='+'a'.repeat(40));await m.waitForSelector('#lg-email');
  assert(/ya no sirve|no es válido/.test(await m.innerText('body')));await shot(m,'eq3');
  console.log('errores',errors);await b.close();
})();
