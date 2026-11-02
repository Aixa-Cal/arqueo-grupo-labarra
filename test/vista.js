const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync('../docs/index.html','utf8');const env=makeEnv();env.ctx.instalar();const errors=[];
const call=(a,p,t)=>JSON.parse(env.ctx.api(JSON.stringify({a,p,t})));
(async()=>{const b=await chromium.launch();
 async function page(){const c=await b.newContext({viewport:{width:390,height:760},deviceScaleFactor:1.5,colorScheme:'light'});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.exposeFunction('__api',s=>env.ctx.api(s));
  await p.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}}});
  await p.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await p.goto('http://app.local/');return p}
 async function login(p,email,name){await p.waitForSelector('#lg-email');await p.fill('#lg-email',email);await p.click('[data-act=lg-send]');await p.waitForSelector('#lg-code');
  await p.fill('#lg-code',env.mails[env.mails.length-1].body.match(/\d{6}/)[0]);const n=await p.$('#lg-name');if(n)await p.fill('#lg-name',name||'X');await p.click('[data-act=lg-verify]')}
 const adm=await page();await login(adm,'dueno@gmail.com');await adm.waitForSelector('text=Por completar');const TA=await adm.evaluate(()=>localStorage.getItem('arq-tok'));
 call('saveConfig',{cfg:{calendario:{'Car Wash':[0,1,2,3,4,5,6]}}},TA);
 async function user(em,nombre,rol,neg,tel){const p=await page();await login(p,em,nombre);await p.waitForSelector('text=Solicitud enviada');call('setUser',{email:em,rol,estado:'aprobado',negocios:neg?[neg]:[],telefono:tel||''},TA);await p.click('[data-act=check-pending]').catch(()=>{});return p}
 async function iniciar(p){await p.waitForSelector('[data-act=neg]');await p.click('[data-act=neg]');await p.click('[data-act=turno][data-v="0"]');await p.click('#startBtn');await p.waitForSelector('#saveBtn')}
 // 1 y 2: La Barra
 const lb=await user('lb@g.com','María Pérez','colaborador','La Barra 1','8095551234');await iniciar(lb);
 await lb.evaluate(()=>{document.querySelectorAll('.pcard').forEach((c,i)=>{const id=c.card=c.id.replace('card-','');const e=document.getElementById('i-'+id+'-fin');if(e){e.value=String(4+i);e.dispatchEvent(new Event('input',{bubbles:true}))}})});
 await lb.evaluate(()=>window.scrollTo(0,0));await lb.waitForTimeout(200);await lb.screenshot({path:'shots/v1.png'});
 for(const i of [0,1,2,3])await lb.click('[data-act=ck][data-v="'+i+'"]');await lb.click('[data-act=caf][data-k=rell][data-v=si]');await lb.click('[data-act=caf][data-k=func][data-v=no]');await lb.fill('#ccaf','La máquina 2 no calienta');
 await lb.evaluate(()=>document.getElementById('cierre').scrollIntoView({block:'start'}));await lb.waitForTimeout(200);await lb.screenshot({path:'shots/v2.png'});
 // 3: Food Shop cierre con freezer
 const fs_=await user('fs@g.com','Luis Gómez','colaborador','Food Shop');await iniciar(fs_);
 await fs_.evaluate(()=>{document.querySelectorAll('.pcard').forEach((c,i)=>{const id=c.id.replace('card-','');const e=document.getElementById('i-'+id+'-fin');if(e){e.value=String(3+i%7);e.dispatchEvent(new Event('input',{bubbles:true}))}})});
 for(let i=0;i<6;i++)await fs_.click('[data-act=ck][data-v="'+i+'"]');await fs_.click('[data-act=caf][data-k=rell][data-v=si]');await fs_.click('[data-act=caf][data-k=func][data-v=si]');await fs_.click('[data-act=fz][data-v=no]');await fs_.fill('#cfz','El freezer 3 no enfría');await fs_.click('[data-act=nov][data-v=no]');
 await fs_.evaluate(()=>document.querySelector('[data-act=fz]').scrollIntoView({block:'center'}));await fs_.waitForTimeout(200);await fs_.screenshot({path:'shots/v3.png'});
 // 4: supervisor pendientes con WhatsApp
 const sup=await user('sup@g.com','Sara Supervisora','supervisor',null);await sup.waitForSelector('text=Por completar');await sup.reload();await sup.waitForSelector('text=Por completar');await sup.waitForTimeout(800);await sup.screenshot({path:'shots/v4.png'});
 // 5 Car Wash, 6 ZP
 const cw=await user('cw@g.com','Pedro Car','colaborador','Car Wash');await iniciar(cw);await cw.screenshot({path:'shots/v5.png'});
 const zp=await user('zp@g.com','Ana Zona','colaborador','Zona Presidente');await iniciar(zp);await zp.screenshot({path:'shots/v6.png'});
 console.log('errores',errors);await b.close()})();
