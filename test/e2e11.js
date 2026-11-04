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
  const A=tok('dueno@gmail.com');const T=tok('gris@g.com','Griselda'),Mt=tok('maria@g.com','Maria');
  env.call('setUser',{email:'maria@g.com',rol:'lider',estado:'aprobado',negocios:['Almacén']},A);
  env.call('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
  const b=await chromium.launch();
  const m=await newUser(b);await login(m,'maria@g.com');
  await m.waitForSelector('text=Guardar checklist');await m.fill('[data-ckt=aceite]','320');await m.click('[data-act=ck-tog] >> nth=0');await shot(m,'ck1');await m.click('[data-act=ck-save]');await m.waitForSelector('#toast:not([hidden])');console.log('T1',await m.innerText('#toast'));await m.waitForTimeout(2500);console.log('TOAST',await m.innerText('#toast'),errors);
  await m.click('[data-act=alm-modo][data-v=prod]');await m.selectOption('#prsel','Lulo');await m.fill('[data-prr]','10');await m.fill('[data-pro]','5');await shot(m,'pr1');await m.click('[data-act=pr-save]');await m.waitForTimeout(2500);console.log('END',(await m.innerText('body')).slice(-500).replace(/\n/g,' | '),errors);
  await m.click('[data-act=alm-modo][data-v=recepcion]');
  require('child_process').execSync("python3 -c \"from PIL import Image;Image.new('RGB',(900,600),(200,120,60)).save('/tmp/f.jpg')\"");
  await m.setInputFiles('[data-almfoto]','/tmp/f.jpg');await m.waitForSelector('.alth img');
  await m.fill('#alnota','Factura 1234');await shot(m,'alm2');
  await m.click('[data-act=alm-save]');await m.waitForSelector('text=Falta registrar la factura');
  await m.click('[data-act=alm-modo][data-v=salida]');await m.selectOption('#aldest','La Barra Atala');
  await m.fill('#alq','leche');await m.click('[data-act=alm-add]');await m.fill('[data-alq]','3');await shot(m,'alm3');
  await m.click('[data-act=alm-save]');await m.waitForSelector('text=Salida para La Barra Atala');
  const g=await newUser(b);await login(g,'gris@g.com');
  await g.waitForSelector('text=Pendientes');await g.click('[data-act=go][data-v=alm]');
  await g.waitForTimeout(2000);console.log('G',(await g.innerText('body')).slice(0,700).replace(/\n/g,' | '));await g.waitForSelector('text=Ver foto');await g.click('[data-act=alm-foto]');await g.waitForSelector('.alfoto');await shot(g,'alm4');
  await g.click('text=Ya lo hice en Citrus');await g.waitForSelector('text=Hecho en Citrus');
  console.log('errores',errors);await b.close();
})();
