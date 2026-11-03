// Food Shop General: conteo semanal (martes) de supervisión, con insumos de café por consumo
const {makeEnv}=require('./mock');const assert=require('assert');
const MAR=Date.UTC(2026,10,3,15,0,0),MAR2=Date.UTC(2026,10,10,15,0,0),LUN=Date.UTC(2026,10,9,15,0,0);
const E=makeEnv({clock:MAR});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const no=(a,p,t,m)=>{const r=E.call(a,p,t);assert(!r.ok,a+' debía fallar');if(m)assert.equal(r.error,m);return r};
const A=login('dueno@gmail.com'),G=login('gris@g.com','Griselda'),C=login('sol@g.com','Sol');
ok('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
ok('setUser',{email:'sol@g.com',rol:'colaborador',estado:'aprobado',negocios:['Food Shop']},A);
// configuración
const s=ok('sync',{},G);
assert(s.config.negocios.includes('Food Shop General'));assert.deepEqual(s.config.turnos['Food Shop General'],['Semanal']);assert.deepEqual(s.config.calendario['Food Shop General'],[2]);
const P=s.productos.filter(p=>p.negocios.includes('Food Shop General'));
const cafe=P.filter(p=>p.cat==='Insumos para café'),vend=P.filter(p=>p.cat!=='Insumos para café');
assert.equal(cafe.length,20);assert(vend.length>=165,'productos de venta '+vend.length);
// el colaborador del Food Shop no ve ni cuenta el general
const sc=ok('sync',{},C);assert(!sc.config.negocios.includes('Food Shop General'));assert(!sc.productos.some(p=>p.cat==='Insumos para café'));
const items=(fin,src)=>P.map(p=>({pid:p.id,ini:0,ent:0,fin:fin,src:src||''}));
no('saveConteo',{id:'c_gen00000',fecha:'2026-11-03',negocio:'Food Shop General',turno:'Semanal',items:items(5)},C,'permiso');
no('saveConteo',{id:'c_gen00009',fecha:'2026-11-04',negocio:'Food Shop General',turno:'Semanal',items:items(5)},G);
// primera semana (inicial), sin cierre
const r1=ok('saveConteo',{id:'c_gen00001',fecha:'2026-11-03',negocio:'Food Shop General',turno:'Semanal',items:items(10)},G);assert(r1.inicial);
// segunda semana: entra 30 de cada insumo, quedan 20 → consumo 20; ventas de 4 en un producto
E.setClock(MAR2);
const it2=P.map(p=>({pid:p.id,ini:10,ent:p.cat==='Insumos para café'?30:0,fin:p.cat==='Insumos para café'?20:6,src:'c_gen00001'}));
const r2=ok('saveConteo',{id:'c_gen00002',fecha:'2026-11-10',negocio:'Food Shop General',turno:'Semanal',items:it2},G);
assert(!r2.inicial&&!r2.consumo);
let c=ok('getConteo',{id:'c_gen00002'},G);assert.equal(c.estado,'contado');
const ventas={};vend.forEach(p=>{ventas[p.id]=0});ventas[vend[0].id]=4;
ok('saveVentas',{id:'c_gen00002',ventas:ventas},G);
c=ok('getConteo',{id:'c_gen00002'},G);assert.equal(c.estado,'arqueado');
const fc=c.res.filter(x=>cafe.some(p=>p.id===x[0]));assert.equal(fc.length,20);
assert(fc.every(x=>x[11]==='OK'&&x[7]===20),'café: solo consumo, siempre OK');
const v0=c.res.find(x=>x[0]===vend[0].id);assert.equal(v0[7],4);assert.equal(v0[11],'OK');
assert(c.res.filter(x=>vend.some(p=>p.id===x[0]&&p.id!==vend[0].id)).every(x=>x[7]===4));  // ini10+0-6 = 4 salieron, ventas 0 → debía 0: se marca
console.log('t7 ok');
