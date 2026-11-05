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
(async()=>{
  const A=tok('dueno@gmail.com');const G=tok('gris@g.com','Griselda');tok('l@g.com','Lider');
  env.call('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
  env.call('setUser',{email:'l@g.com',rol:'lider',estado:'aprobado',negocios:['Food Shop','Zona Presidente']},A);
  const L=tok('l@g.com');
  const P=env.call('sync',{},G).data.productos;
  const items=(n,fin)=>P.filter(p=>p.negocios.includes(n)).map(p=>({pid:p.id,ini:0,ent:0,fin:fin}));
  const cierre={};
  const save=(id,fe,n,t,fin)=>{const r=env.call('saveConteo',{id,fecha:fe,negocio:n,turno:t,items:items(n,fin)},G);assert(r.ok,JSON.stringify(r))};
  save('c_s000001','2026-11-02','Food Shop','Turno 1 (7AM-3PM)',10);
  env.ctx.setClock&&0;
  const b=await chromium.launch();
  env.setClock(Date.UTC(2026,10,5,15,0,0));
  save('c_s000002','2026-11-05','Food Shop','Turno 1 (7AM-3PM)',9);
  const g=await newUser(b);await login(g,'gris@g.com');
  await g.waitForSelector('text=Mi semana');
  const t=await g.innerText('#view');
  console.log(t.slice(0,900));
  assert(/Te falta/.test(t),'debe mostrar faltantes');
  assert(await g.locator('.sem-card').count()>=2,'dos tarjetas');
  assert(await g.locator('.sem-d').count()>=14,'7 dias por negocio');
  await g.click('.sem-ayuda summary');await shot(g,'sem1');
  await g.click('[data-act=sem-dia] >> nth=1');await g.waitForSelector('text=Por completar');
  await g.click('[data-act=go][data-v=sem]');await g.waitForSelector('.sem-hero');
  await shot(g,'sem2');
  console.log('errores',errors);assert.equal(errors.length,0);await b.close();
})();
