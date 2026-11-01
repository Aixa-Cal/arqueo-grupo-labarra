// Pantalla alojada fuera de Google (sin google.script.run): POST a la URL de Apps Script
const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../docs/index.html','utf8');
const env=makeEnv();env.ctx.instalar();const errors=[];let posts=0;
(async()=>{
  const b=await chromium.launch();const page=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://arqueo.test/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));
  await page.route(/script\.google\.com\/macros\/.*\/exec/,async r=>{
    const q=r.request();if(q.method()!=='POST'||!/text\/plain/.test(q.headers()['content-type']||''))return r.fulfill({status:400,body:'x'});
    posts++;r.fulfill({status:200,contentType:'text/plain',headers:{'access-control-allow-origin':'*'},body:env.ctx.doPost?env.ctx.doPost({postData:{contents:q.postData()}}).getContent():env.ctx.api(q.postData())});
  });
  await page.goto('https://arqueo.test/');
  await page.waitForSelector('#lg-email');await page.fill('#lg-email','dueno@gmail.com');await page.click('[data-act=lg-send]');
  await page.waitForSelector('#lg-code');
  const code=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];await page.fill('#lg-code',code);await page.click('[data-act=lg-verify]');
  await page.waitForSelector('text=Por completar',{timeout:15000});
  console.log('POSTs',posts,'errores',errors);await b.close();
})();
