// Avisos de WhatsApp por turno: solo a quien cubre ese turno
const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');const assert=require('assert');
const html=fs.readFileSync('../docs/index.html','utf8');
const env=makeEnv({clock:Date.UTC(2026,10,2,15,0,0)});env.ctx.instalar();const errors=[];
const call=(a,p,t)=>JSON.parse(env.ctx.api(JSON.stringify({a,p,t})));
const login=(e,n)=>{call('reqCode',{email:e});const c=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];return call('verifyCode',{email:e,code:c,nombre:n}).data.token};
(async()=>{
  const A=login('dueno@gmail.com');login('sol@g.com','Sol Ruiz');login('dey@g.com','Deyanira Paz');login('ana@g.com','Anabelle');
  const r=call('setUser',{email:'sol@g.com',rol:'colaborador',estado:'aprobado',negocios:['Food Shop'],telefono:'809 111 1111',turnos:['1']},A);assert(r.ok,JSON.stringify(r));
  call('setUser',{email:'dey@g.com',rol:'colaborador',estado:'aprobado',negocios:['Food Shop'],telefono:'809 222 2222',turnos:['2']},A);
  call('setUser',{email:'ana@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
  assert.deepEqual(call('listUsers',{},A).data.find(u=>u.email==='sol@g.com').turnos,['1']);
  const b=await chromium.launch(),c=await b.newContext({viewport:{width:390,height:844}}),p=await c.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  await p.exposeFunction('__api',s=>env.ctx.api(s));
  await p.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};
    window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}};});
  await p.route('http://app.local/',x=>x.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await p.goto('http://app.local/');
  await p.fill('#lg-email','ana@g.com');await p.click('[data-act=lg-send]');await p.waitForSelector('#lg-code');
  await p.fill('#lg-code',env.mails[env.mails.length-1].body.match(/\d{6}/)[0]);await p.click('[data-act=lg-verify]');
  await p.waitForSelector('text=Por completar');await p.waitForTimeout(800);
  const rows=await p.$$eval('.pitem',els=>els.filter(e=>/Food Shop/.test(e.textContent)).map(e=>({t:e.querySelector('b').textContent,wa:[...e.querySelectorAll('a.wa')].map(a=>a.textContent)})));
  console.log(JSON.stringify(rows));
  const g=t=>rows.find(x=>x.t.includes(t));
  assert.deepEqual(g('Turno 1').wa,['WhatsApp · Sol']);
  assert.deepEqual(g('Turno 2').wa,['WhatsApp · Deyanira']);
  assert.deepEqual(g('Turno 3').wa,[]);
  console.log('errores',errors);await b.close();if(errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
