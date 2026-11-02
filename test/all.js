// Pruebas de punta a punta en TODAS las tiendas: pantalla real (docs/index.html) + servidor simulado
const {chromium}=require('playwright');const {makeEnv}=require('./mock');const fs=require('fs');const assert=require('assert');
const html=fs.readFileSync('../docs/index.html','utf8');
const env=makeEnv();env.ctx.instalar();const errors=[];const rep=[];
const call=(a,p,t)=>JSON.parse(env.ctx.api(JSON.stringify({a,p,t})));
const ok=(a,p,t)=>{const r=call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
async function page(b){const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();
  p.on('pageerror',e=>errors.push('PAGEERROR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL/.test(m.text()))errors.push('CONSOLE '+m.text())});
  await p.exposeFunction('__api',s=>env.ctx.api(s));
  await p.addInitScript(()=>{const mk=()=>{let ok=()=>{},bad=()=>{};const o={withSuccessHandler(f){ok=f;return o},withFailureHandler(f){bad=f;return o},api(s){window.__api(s).then(ok,bad)}};return o};
    window.google={script:{run:{withSuccessHandler(f){return mk().withSuccessHandler(f)},withFailureHandler(f){return mk().withFailureHandler(f)},api(s){return mk().api(s)}}}};});
  await p.route('http://app.local/',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}));await p.goto('http://app.local/');return p}
async function login(p,email,name){await p.waitForSelector('#lg-email');await p.fill('#lg-email',email);await p.click('[data-act=lg-send]');await p.waitForSelector('#lg-code');
  const code=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];await p.fill('#lg-code',code);if(name){const n=await p.$('#lg-name');if(n)await p.fill('#lg-name',name)}await p.click('[data-act=lg-verify]')}
const TURNOS={};
async function contar(p,turnoIdx,opts){
  await p.click('[data-act=go][data-v=contar]');await p.click('[data-act=neg]');await p.click('[data-act=turno][data-v="'+turnoIdx+'"]');await p.click('#startBtn');await p.waitForSelector('#saveBtn');
  const info=await p.evaluate(()=>({cards:document.querySelectorAll('.pcard').length,ini:document.querySelectorAll('[data-f=ini]').length,ent:document.querySelectorAll('[data-f=ent]').length,fin:document.querySelectorAll('[data-f=fin]').length,
    cats:[...document.querySelectorAll('#fcat-sel option')].map(o=>o.textContent),names:[...document.querySelectorAll('.pcard h3')].map(h=>h.textContent),cierre:!!document.getElementById('cierre'),cnota:!!document.getElementById('cnota'),
    overflow:document.documentElement.scrollWidth>innerWidth}));
  // botón bloqueado hasta llenar
  await p.evaluate((opts)=>{document.querySelectorAll('.pcard').forEach(card=>{const id=card.id.replace('card-','');const set=(f,v)=>{const e=document.getElementById('i-'+id+'-'+f);if(!e||e.readOnly)return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))};set('ini',opts.ini??'20');set('ent',opts.ent??'');set('fin',opts.fin??'8')})},opts);
  if(info.cierre){
    assert(await p.$eval('#saveBtn',b=>b.disabled),'guardar debe estar bloqueado sin cierre');
    for(let i=0;i<6;i++)await p.click('[data-act=ck][data-v="'+i+'"]');
    assert(await p.$eval('#saveBtn',b=>b.disabled),'sigue bloqueado sin novedad');
    const cafe=await p.$('[data-act=caf]');
    if(cafe){assert(await p.$eval('#saveBtn',b=>b.disabled));await p.click('[data-act=caf][data-k=rell][data-v=si]');await p.click('[data-act=caf][data-k=func][data-v=no]');await p.fill('#ccaf','Gotea y no calienta');}
    if(await p.$('[data-act=fz]')){assert(await p.$eval('#saveBtn',b=>b.disabled));await p.click('[data-act=fz][data-v=no]');await p.fill('#cfz','Freezer 2 no enfría')}
    await p.click('[data-act=nov][data-v=si]');assert(await p.$eval('#saveBtn',b=>b.disabled),'novedad sí exige texto');
    await p.fill('#cnov','Se dañó una nevera');assert(!(await p.$eval('#saveBtn',b=>b.disabled)),'listo con texto');
    if(opts.novNo){await p.click('[data-act=nov][data-v=no]');assert(!(await p.$eval('#saveBtn',b=>b.disabled)))}
  }
  if(info.cnota)await p.fill('#cnota','Falta cera');
  console.log('guardando',opts.t||'',await p.$eval('#saveMsg',e=>e.textContent));
  await p.click('#saveBtn',{timeout:4000});await p.waitForSelector('text=Conteo guardado',{timeout:15000});return info}
(async()=>{
  const b=await chromium.launch();
  const adm=await page(b);await login(adm,'dueno@gmail.com');await adm.waitForSelector('text=Por completar');
  const A=call('verifyCode',{email:'dueno@gmail.com',code:'x'}).ok;
  // token de admin vía API
  call('reqCode',{email:'dueno@gmail.com'});const ac=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];const TA=ok('verifyCode',{email:'dueno@gmail.com',code:ac}).token;
  const tiendas=['La Barra Atala','La Barra Atalaya','La Barra Miraflores','Food Shop','Zona Presidente','Car Wash'];
  ok('saveConfig',{cfg:{calendario:{'Car Wash':[0,1,2,3,4,5,6]}}},TA);
  for(const [i,t] of tiendas.entries()){
    const em='u'+i+'@gmail.com';const p=await page(b);await login(p,em,'Usuario '+i);await p.waitForSelector('text=Solicitud enviada');
    ok('setUser',{email:em,rol:'colaborador',estado:'aprobado',negocios:[t]},TA);
    await p.click('[data-act=check-pending]').catch(()=>{});await p.waitForSelector('[data-act=go][data-v=contar]',{timeout:10000});
    const info=await contar(p,0,{ini:'20',fin:'8',novNo:i%2===0});
    const dbl=t==='Zona Presidente',cw=t==='Car Wash',lb=/La Barra/.test(t);
    assert(!info.overflow,t+' desborda horizontal');
    assert(info.cards>0,t+' sin tarjetas');
    assert.equal(info.cierre,!cw,t+' cierre');assert.equal(info.cnota,cw,t+' nota insumos');
    assert.equal(info.ini>0,dbl,t+' "Había" solo en ZP (ini='+info.ini+')');
    if(lb){const fa=info.names.filter(n=>/funda abierta/i.test(n)).length;assert(info.ent===info.cards-fa&&fa>0,t+' fundas abiertas sin Entró (ent '+info.ent+', cards '+info.cards+', fa '+fa+')');assert(info.cats.some(c=>/Cervezas/.test(c)),t+' lunes: cervezas sí '+JSON.stringify(info.cats))}
    const row0=ok('sync',{},TA).conteos.find(c=>c.negocio===t);const row=row0&&Object.assign({},row0,ok('getConteo',{id:row0.id},TA));
    rep.push([t,'tarjetas',info.cards,'Entró',info.ent,'Había',info.ini,'cierre',!!(row&&row.cierre&&row.cierre.ok)||cw,'estado',row&&row.estado]);
    if(!cw){assert(row&&row.cierre&&row.cierre.ok,t+' cierre no guardado');if(t==='Food Shop')assert(row.cierre.fz&&row.cierre.fz.ok==='no','freezer');else assert(!row.cierre.fz);if(/La Barra|Food Shop/.test(t)){assert(row.cierre.cafe&&row.cierre.cafe.func==='no'&&row.cierre.cafe.rell==='si',t+' cafe')}else{assert(!row.cierre.cafe,t+' sin cafe')}}
    await p.close();
  }
  // Food Shop turno 2 por pantalla (usa el conteo del turno 1 como inicio)
  {const p=await page(b);const em='u3@gmail.com';await login(p,em);await p.waitForSelector('[data-act=go][data-v=contar]',{timeout:10000});
   const info=await contar(p,1,{fin:'5',novNo:true});
   const c=ok('sync',{},TA).conteos.filter(x=>x.negocio==='Food Shop').sort((a,b)=>a.ts-b.ts);
   assert.equal(c.length,2);assert(c[1].estado==='contado','turno 2 contado: '+c[1].estado);
   const it=ok('getConteo',{id:c[1].id},TA).items[0];console.log('FS turno2 item',JSON.stringify(it));assert(it.src||it[4],'turno 2 usa src');await p.close()}
  // Líder del Food Shop: solo ve su negocio y puede registrar ventas
  {call('reqCode',{email:'lider@gmail.com'});const cd=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];const TL=ok('verifyCode',{email:'lider@gmail.com',code:cd,nombre:'Lider FS'}).token;
   ok('setUser',{email:'lider@gmail.com',rol:'lider',estado:'aprobado',negocios:['Food Shop']},TA);
   const s=ok('sync',{},TL);assert(s.conteos.every(c=>c.negocio==='Food Shop'),'líder solo ve Food Shop');
   const pend=s.conteos.filter(c=>c.estado==='contado');assert(pend.length>=1);
   const full=ok('getConteo',{id:pend[0].id},TL);const ventas={};(full.items||[]).forEach(i=>ventas[i.pid]=2);
   const r=call('saveVentas',{id:pend[0].id,ventas,ventasPor:'POS'},TL);assert(r.ok,JSON.stringify(r));
   const bad=call('rectificar',{id:pend[0].id,cambios:{}},TL);assert(!bad.ok,'líder no rectifica');
   const other=call('saveVentas',{id:ok('sync',{},TA).conteos.find(c=>c.negocio==='La Barra Atala').id,ventas:{},ventasPor:'x'},TL);assert(!other.ok,'líder no toca otro negocio');
   rep.push(['Líder Food Shop','solo su negocio, ventas ok, sin rectificar']);}
  // Día 2 por servidor en las demás tiendas: arqueo con ventas
  env.setClock(Date.UTC(2026,10,3,15,0,0));// martes
  for(const t of ['La Barra Atala','La Barra Atalaya','La Barra Miraflores','Zona Presidente','Car Wash']){
    const em='u'+tiendas.indexOf(t)+'@gmail.com';call('reqCode',{email:em});const cd=env.mails[env.mails.length-1].body.match(/\d{6}/)[0];const T=ok('verifyCode',{email:em,code:cd}).token;
    const prev=ok('sync',{},TA).conteos.filter(c=>c.negocio===t).sort((a,b)=>b.ts-a.ts)[0];
    const full=ok('getConteo',{id:prev.id},TA);
    const prods=ok('sync',{},T).productos.filter(p=>p.negocios.includes(t));
    const cw=t==='Car Wash',dbl=t==='Zona Presidente';
    const items=prods.map(p=>{const pi=(full.items||[]).find(i=>i.pid===p.id);return {pid:p.id,ini:dbl?(pi?pi.fin:20):(pi?pi.fin:8),ent:0,fin:(pi?pi.fin:8)-2,src:pi?prev.id:''}}).filter(i=>i.src||dbl);
    if(!items.length){rep.push([t,'martes: sin productos que contar (esperado según calendario)']);continue}
    const cid='c_all'+t.replace(/\W/g,'');
    const r=call('saveConteo',{id:cid,fecha:'2026-11-03',negocio:t,turno:t==='Zona Presidente'?'Turno único (3PM-11PM)':(cw?'Semanal':'Turno 1 (7AM-3PM)'),items,cierre:cw?null:{chk:[true,true,true,true,true,true],nov:'no',txt:'',cafe:{rell:'si',func:'si',txt:''},fz:{ok:'si',txt:''}}},T);
    if(!r.ok){rep.push([t,'martes error',r.msg]);assert(false,t+' '+JSON.stringify(r))}
    if(!cw){const v={};items.forEach(i=>v[i.pid]=2);const rv=call('saveVentas',{id:cid,ventas:v,ventasPor:'POS'},TA);assert(rv.ok,t+' ventas '+JSON.stringify(rv));
      const d=ok('getConteo',{id:cid},TA);assert(d.res&&d.res.length,t+' sin resultados');rep.push([t,'martes arqueo',JSON.stringify(d.resumen)])}
    else{const d=ok('getConteo',{id:cid},TA);rep.push([t,'martes consumo',d.estado,d.res.length+' líneas'])}
  }
  rep.forEach(r=>console.log(r.join(' | ')));
  console.log('errores',errors);await b.close();if(errors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
