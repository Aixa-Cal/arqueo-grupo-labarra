const {chromium}=require('playwright');
const {makeEnv}=require('./mock');
const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');
const env=makeEnv();env.ctx.instalar();
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
  const tok=await adm.evaluate(()=>localStorage.getItem('arq-tok'));
  const call=(a,p,t)=>{if(a==='saveConteo'&&p.cierre===undefined)p=Object.assign({cierre:{chk:[1,1,1,1,1,1].map(Boolean),nov:'no',txt:''}},p);return JSON.parse(env.ctx.api(JSON.stringify({a,p,t})))};
  const mk=async(email,name,rol)=>{const pg=await newUser(b);await login(pg,email,name);await pg.waitForSelector('text=Solicitud enviada');
    console.log('setUser',email,call('setUser',{email,rol,estado:'aprobado',negocios:['Food Shop']},tok).ok);return pg};
  const ana=await mk('ana@gmail.com','Ana Pérez','colaborador');
  const rosa=await mk('rosa@gmail.com','Rosa Líder','lider');
  await ana.click('[data-act=check-pending]');await ana.waitForSelector('text=¿Qué vas a contar?');
  await rosa.click('[data-act=check-pending]');
  const tA=await ana.evaluate(()=>localStorage.getItem('arq-tok'));
  const items=[{pid:'fs-032',ini:0,ent:0,fin:50,src:''},{pid:'fs-033',ini:0,ent:0,fin:100,src:''}];
  console.log('c1',call('saveConteo',{id:'c_e2e00001',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items},tA).ok);
  const it2=[{pid:'fs-032',ini:50,ent:0,fin:38,src:'c_e2e00001'},{pid:'fs-033',ini:100,ent:0,fin:85,src:'c_e2e00001'}];
  console.log('c2',call('saveConteo',{id:'c_e2e00002',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 2 (3PM-11PM)',items:it2},tA).ok);
  await ana.reload();await ana.waitForSelector('text=¿Qué vas a contar?');
  const navA=await ana.$$eval('nav button',e=>e.map(x=>x.textContent.trim()));console.log('colaborador nav',navA);
  await shot(ana,'60-colaborador');
  await rosa.reload();await rosa.waitForSelector('nav');
  await rosa.waitForSelector('button:has-text("Registrar ventas")',{timeout:15000});
  const navR=await rosa.$$eval('nav button',e=>e.map(x=>x.textContent.trim()));console.log('lider nav',navR);
  await shot(rosa,'61-lider-pendientes');
  await rosa.click('button:has-text("Registrar ventas")');
  await rosa.waitForSelector('text=Subir CSV de Citrus');
  await shot(rosa,'62-lider-ventas');
  console.log('errores',errors);await b.close();
})();
