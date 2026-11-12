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
(async()=>{
  const A=tok('dueno@gmail.com');tok('sol@g.com','Sol');
  env.call('setUser',{email:'sol@g.com',rol:'colaborador',estado:'aprobado',negocios:['La Barra Atala']},A);
  const b=await chromium.launch();const m=await newUser(b);await login(m,'sol@g.com');
  await m.waitForSelector('[data-act=neg]');await shot(m,'ux0');
  await m.click('[data-act=neg]');await m.waitForSelector('.tchip');await m.click('.tchip');await m.click('[data-act=start]');await m.waitForSelector('.pcard');await m.waitForTimeout(500);
  const pid=await m.$eval('[data-f=fin]',e=>e.dataset.pid);
  await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="-1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="-1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="-1"]');
  console.log('v0',await m.inputValue('#i-'+pid+'-fin'));
  await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="1"]');
  console.log('v2',await m.inputValue('#i-'+pid+'-fin'));
  await m.evaluate(()=>window.scrollTo(0,640));await shot(m,'ux3');console.log(errors);await b.close();})();