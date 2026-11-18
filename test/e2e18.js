const {chromium}=require('playwright');
const {makeEnv}=require('./mock');
const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');
const env=makeEnv({clock:Date.UTC(2026,10,2,15,0,0)});env.ctx.instalar();
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
(async()=>{env.setClock(Date.UTC(2026,10,18,15,0,0));
  const A=tok('dueno@gmail.com');const G=tok('gris@g.com','Griselda');tok('l@g.com','Lider');
  env.call('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
  env.call('setUser',{email:'l@g.com',rol:'lider',estado:'aprobado',negocios:['Food Shop','Zona Presidente']},A);
  const L=tok('l@g.com');
  const P=env.call('sync',{},G).data.productos;
  const items=(n,fin)=>P.filter(p=>p.negocios.includes(n)).map(p=>({pid:p.id,ini:0,ent:0,fin:fin}));
  const cierre={};
  const save=(id,fe,n,t,fin)=>{const r=env.call('saveConteo',{id,fecha:fe,negocio:n,turno:t,items:items(n,fin)},G);assert(r.ok,JSON.stringify(r))};
  
  env.ctx.setClock&&0;
  env.setClock(Date.UTC(2026,10,18,15,0,0));
  const sy0=env.call('sync',{},G).data; // dispara la migración: inicio = hoy
  console.log('inicio',JSON.stringify(sy0.config.inicio));
  const b=await chromium.launch();
  const g=await newUser(b);await login(g,'gris@g.com');
  await g.waitForSelector('text=Mi semana');
  const t=await g.innerText('#view');
  assert(!/Atrasado/.test(t.split('Conteos semanales')[1]||''),'los generales atrasados desaparecen');
  await g.click('[data-act=go][data-v=pend]');await g.waitForSelector('.stat');
  const tp=await g.innerText('#view');
  console.log(tp.replace(/\n+/g,' / ').slice(0,300));
  assert.equal(await g.locator('.pitem:has-text("Food Shop"):has-text("Atrasado")').count(),0,'Food Shop sin atrasados');
  await g.click('[data-act=go][data-v=sem]');await g.waitForSelector('.sem-hero');const ts=await g.innerText('#view');assert(!/Te falta/.test(ts.split('Conteos semanales')[0].split('Food Shop')[1]||''),'Mi semana Food Shop sin faltantes viejos');
  console.log('errores',errors);assert.equal(errors.length,0);await b.close();
})();
