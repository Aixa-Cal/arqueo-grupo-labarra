// Car Wash semanal en libras (consumo sin ventas), «Había» y Zona Presidente
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,1,15,0,0)});E.ctx.instalar();   // domingo
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];const r=E.call('verifyCode',{email:e,code:c,nombre:n});assert(r.ok);return r.data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const A=login('dueno@gmail.com'),W=login('cw@g.com','Pedro CW'),Z=login('zp@g.com','Luis ZP');
ok('setUser',{email:'cw@g.com',rol:'colaborador',estado:'aprobado',negocios:['Car Wash']},A);
ok('setUser',{email:'zp@g.com',rol:'colaborador',estado:'aprobado',negocios:['Zona Presidente']},A);
// migración: productos, turno semanal y día de conteo
let s=ok('sync',{},W);
const P=s.productos.filter(p=>p.negocios.includes('Car Wash'));
assert.equal(P.length,12);assert.deepEqual(P.slice(0,3).map(p=>p.unidad),['lb','lb','lb']);assert(P.some(p=>p.nombre==='Lija 2000')&&P.some(p=>p.unidad==='gal'));
assert.deepEqual(s.config.turnos['Car Wash'],['Semanal']);assert.deepEqual(s.config.calendario['Car Wash'],[0]);
console.log('car wash productos',P.map(p=>p.nombre));
s=ok('sync',{},W);assert.equal(s.productos.filter(p=>p.negocios.includes('Car Wash')).length,12,'migración una sola vez');
// primer conteo = punto de partida; el siguiente = consumo sin pedir ventas
const items0=P.map(p=>({pid:p.id,ini:20,ent:0,fin:20,src:''}));
let r=ok('saveConteo',{id:'c_cw000001',fecha:'2026-11-01',negocio:'Car Wash',turno:'Semanal',items:items0},W);assert(r.inicial);
const b=ok('startCount',{negocio:'Car Wash'},W);P.forEach(p=>assert(b.ultimos[p.id]));
E.setClock(Date.UTC(2026,10,8,15,0,0));
const items1=P.map(p=>({pid:p.id,ini:999,ent:5,fin:18.5,src:'c_cw000001'}));
r=ok('saveConteo',{id:'c_cw000002',fecha:'2026-11-08',negocio:'Car Wash',turno:'Semanal',items:items1,nota:'Falta cera y 2 esponjas'},W);assert(r.consumo);
assert(ok('sync',{},A).notifs.some(n=>n.tipo==='faltan-insumos'&&/cera/.test(n.texto)),'avisa lo que hace falta');
const c=ok('getConteo',{id:'c_cw000002'},A);
assert.equal(c.estado,'arqueado');assert(c.resumen.consumo);
assert.equal(c.items[0].ini,20,'había viene del conteo anterior');
assert.equal(c.res[0][7],6.5,'consumo = 20+5-18.5');assert.equal(c.resumen.total,6.5*12);assert.equal(c.nota,'Falta cera y 2 esponjas');
assert.equal(ok('sync',{},A).pendientes,0,'no queda pendiente de ventas');
console.log('consumo',c.res.map(x=>[x[1],x[7]]));
// calendario: solo domingo se espera conteo del Car Wash
const faltan=ok('dash',{desde:'2026-11-02',hasta:'2026-11-07'},A);
assert(!JSON.stringify(faltan).includes('"negocio":"Car Wash"'),'Car Wash no debe faltar entre semana');
E.setClock(Date.UTC(2026,10,1,20,0,0));
// Zona Presidente cuenta Había y Quedan: no se fuerza
const zp=ok('sync',{},Z).productos.filter(p=>p.negocios.includes('Zona Presidente'))[0];
ok('saveConteo',{id:'c_zp000001',fecha:'2026-11-01',negocio:'Zona Presidente',turno:'Turno único (3PM-11PM)',items:[{pid:zp.id,ini:10,ent:0,fin:10,src:''}]},Z);
console.log('T3 OK');
