const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync('../docs/index.html','utf8');const env=makeEnv();env.ctx.instalar();const errors=[];
const call=(a,p,t)=>JSON.parse(env.ctx.api(JSON.stringify({a,p,t})));
(async()=>{const b=await chromium.launch();
 async function page(scheme){const c=await b.newContext({viewport:{width:390,height:700},colorScheme:scheme});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.exposeFunction('__api',s=>env.ctx.api(s));
  await p.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}}});
  await p.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await p.goto('http://app.local/');return p}
 async function login(p,email,name){await p.waitForSelector('#lg-email');await p.fill('#lg-email',email);await p.click('[data-act=lg-send]');await p.waitForSelector('#lg-code');
  await p.fill('#lg-code',env.mails[env.mails.length-1].body.match(/\d{6}/)[0]);const n=await p.$('#lg-name');if(n)await p.fill('#lg-name',name||'X');await p.click('[data-act=lg-verify]')}
 const adm=await page('light');await login(adm,'dueno@gmail.com');await adm.waitForSelector('text=Por completar');const TA=await adm.evaluate(()=>localStorage.getItem('arq-tok'));
 call('saveConfig',{cfg:{calendario:{'Car Wash':[0,1,2,3,4,5,6]}}},TA);
 for(const [em,neg,scheme] of [['cw@g.com','Car Wash','light'],['zp@g.com','Zona Presidente','light'],['cw2@g.com','Car Wash','dark']]){
  const p=await page(scheme);await login(p,em,'Ana');await p.waitForSelector('text=Solicitud enviada');
  call('setUser',{email:em,rol:'colaborador',estado:'aprobado',negocios:[neg]},TA);
  await p.click('[data-act=check-pending]').catch(()=>{});await p.waitForSelector('[data-act=neg]',{timeout:10000});
  const tag=neg.slice(0,2)+'-'+scheme;
  await p.screenshot({path:'shots/t-'+tag+'-1.png'});
  await p.click('[data-act=neg]');await p.click('[data-act=turno][data-v="0"]');await p.click('#startBtn');await p.waitForSelector('#saveBtn');
  await p.screenshot({path:'shots/t-'+tag+'-2.png'});
  console.log(tag,await p.evaluate(()=>document.documentElement.dataset.neg+' '+getComputedStyle(document.documentElement).getPropertyValue('--brand')));
 }
 // administrador: sin tema
 console.log('admin',await adm.evaluate(()=>document.documentElement.dataset.neg||'rojo'));
 console.log('errores',errors);await b.close()})();
