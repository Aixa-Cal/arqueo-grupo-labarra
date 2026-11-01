const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');
const html=fs.readFileSync('../dist/Index.html','utf8');const env=makeEnv();env.ctx.instalar();
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>console.log('C',m.type(),m.text()));
await p.exposeFunction('__api',s=>{console.log('API',s.slice(0,100));const r=env.ctx.api(s);console.log('->',r.slice(0,120));return r});
await p.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};
window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}};});
await p.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html',body:html}));await p.goto('http://app.local/');await p.waitForSelector('#lg-email');await p.fill('#lg-email','dueno@gmail.com');await p.click('[data-act=lg-send]');await p.waitForTimeout(1500);
console.log(await p.innerText('#view'));await b.close()})();
