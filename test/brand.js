const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync('../docs/index.html','utf8');const env=makeEnv();env.ctx.instalar();const errors=[];
(async()=>{const b=await chromium.launch();
 for(const scheme of ['light','dark']){
  const c=await b.newContext({viewport:{width:390,height:844},colorScheme:scheme});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.exposeFunction('__api',s=>env.ctx.api(s));
  await p.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}}});
  await p.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await p.goto('http://app.local/');
  await p.waitForSelector('#lg-email');await p.screenshot({path:'shots/b-login-'+scheme+'.png'});
  await p.fill('#lg-email','dueno@gmail.com');await p.click('[data-act=lg-send]');await p.waitForSelector('#lg-code');
  await p.fill('#lg-code',env.mails[env.mails.length-1].body.match(/\d{6}/)[0]);await p.click('[data-act=lg-verify]');await p.waitForSelector('text=Por completar');
  await p.screenshot({path:'shots/b-pend-'+scheme+'.png'});
  await p.click('[data-act=campo-on]');await p.click('[data-act=neg]');await p.click('[data-act=turno][data-v="0"]');await p.click('#startBtn');await p.waitForSelector('#saveBtn');
  await p.screenshot({path:'shots/b-contar-'+scheme+'.png'});
 }
 console.log('errores',errors);await b.close()})();
