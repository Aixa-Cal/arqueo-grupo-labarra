const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync('../docs/index.html','utf8');const env=makeEnv();env.ctx.instalar();const errors=[];
const call=(a,p,t)=>JSON.parse(env.ctx.api(JSON.stringify({a,p,t})));
(async()=>{const b=await chromium.launch();
 async function page(){const c=await b.newContext({viewport:{width:390,height:760}});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.exposeFunction('__api',s=>env.ctx.api(s));
  await p.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}}});
  await p.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await p.goto('http://app.local/');return p}
 async function login(p,email,name){await p.waitForSelector('#lg-email');await p.fill('#lg-email',email);await p.click('[data-act=lg-send]');await p.waitForSelector('#lg-code');
  await p.fill('#lg-code',env.mails[env.mails.length-1].body.match(/\d{6}/)[0]);const n=await p.$('#lg-name');if(n)await p.fill('#lg-name',name||'X');await p.click('[data-act=lg-verify]')}
 const adm=await page();await login(adm,'dueno@gmail.com');await adm.waitForSelector('text=Por completar');const TA=await adm.evaluate(()=>localStorage.getItem('arq-tok'));
 const u=await page();await login(u,'l@g.com','Líder');await u.waitForSelector('text=Solicitud enviada');
 call('setUser',{email:'l@g.com',rol:'lider',estado:'aprobado',negocios:['La Barra Atala','La Barra Atalaya']},TA);
 await u.click('[data-act=check-pending]').catch(()=>{});await u.waitForSelector('text=Por completar',{timeout:10000});
 console.log('Pendientes del líder:',(await u.$$eval('.pitem b',e=>e.map(x=>x.textContent))).join(' | '));
 await u.click('[data-act=go][data-v=contar]');
 const negs=await u.$$eval('[data-act=neg]',e=>e.map(x=>x.textContent.trim()));console.log('negocios visibles:',negs);
 for(let i=0;i<2;i++){await u.click('[data-act=neg][data-v="'+i+'"]').catch(async()=>{const e=await u.$$('[data-act=neg]');await e[i].click()});
  console.log(negs[i].split('\n')[0],'turnos:',await u.$$eval('[data-act=turno]',e=>e.map(x=>x.textContent.trim())))}
 await u.screenshot({path:'shots/turnos.png'});
 console.log('errores',errors);await b.close()})();
