const {makeEnv}=require('./mock');
const assert=require('assert');
const E=makeEnv();
E.ctx.instalar();
console.log('productos', E.sheets.Productos.getLastRow()-1,'alias',E.sheets.Equivalencias.getLastRow()-1);
// login owner
let r=E.call('reqCode',{email:'dueno@gmail.com'});assert(r.ok,JSON.stringify(r));
let code=E.mails[0].body.match(/\d{6}/)[0];
r=E.call('verifyCode',{email:'dueno@gmail.com',code});assert(r.ok,JSON.stringify(r));
const T=r.data.token; assert.equal(r.data.me.rol,'admin');
// wrong code
E.call('reqCode',{email:'ana@gmail.com'});
let c2=E.mails[1].body.match(/\d{6}/)[0];
r=E.call('verifyCode',{email:'ana@gmail.com',code:'000000',nombre:'Ana'});assert(!r.ok&&r.error==='codigo');
r=E.call('verifyCode',{email:'ana@gmail.com',code:c2});assert(!r.ok&&r.error==='nombre',JSON.stringify(r));
r=E.call('verifyCode',{email:'ana@gmail.com',code:c2,nombre:'Ana Pérez'});assert(r.ok,JSON.stringify(r));
const TA=r.data.token; assert.equal(r.data.me.estado,'pendiente');
console.log('mails',E.mails.map(m=>m.subject));
// pending can't sync
r=E.call('sync',{},TA);assert(!r.ok);
// admin sees notification
r=E.call('sync',{},T);assert(r.ok,JSON.stringify(r));console.log('notifs',r.data.notifs.map(n=>n.titulo),'prods',r.data.productos.length);
// approve Ana as lider Food Shop
r=E.call('setUser',{email:'ana@gmail.com',rol:'lider',estado:'aprobado',negocios:['Food Shop']},T);assert(r.ok,JSON.stringify(r));
assert(E.mails.some(m=>m.to==='ana@gmail.com'&&/acceso/i.test(m.subject)));
r=E.call('sync',{},TA);assert(r.ok);assert.equal(r.data.config.negocios.join(),'Food Shop');
const fsProds=r.data.productos.filter(p=>p.negocios.includes('Food Shop'));console.log('fs prods',fsProds.length);
// startCount first time
r=E.call('startCount',{negocio:'Food Shop'},TA);assert(r.ok);assert.equal(Object.keys(r.data.ultimos).length,0);
// leader cannot access other negocio
r=E.call('startCount',{negocio:'La Barra 1'},TA);assert(!r.ok&&r.error==='permiso');
// entrada
r=E.call('addEntrada',{id:'e_abc12345',negocio:'Food Shop',items:[{pid:'fs-032',qty:24}]},TA);assert(r.ok,JSON.stringify(r));
// save conteo
const items=[{pid:'fs-032',ini:10,ent:24,fin:20,src:'c_prev0001'},{pid:'fs-033',ini:5,ent:0,fin:3,src:'c_prev0001'}];
r=E.call('saveConteo',{id:'c_test0001',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items},TA);assert(r.ok,JSON.stringify(r));
r=E.call('saveConteo',{id:'c_test0001',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items},TA);assert(r.ok&&r.data.repetido);
r=E.call('saveConteo',{id:'c_test0002',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items},TA);assert(!r.ok&&r.error==='duplicado');
// leader can't save ventas
r=E.call('saveVentas',{id:'c_test0001',ventas:{}},TA);assert(!r.ok&&r.error==='permiso');
// admin: pending
r=E.call('sync',{},T);assert.equal(r.data.pendientes,1);
r=E.call('getConteo',{id:'c_test0001'},T);assert(r.ok);console.log('items',r.data.items.length,r.data.items[0].nombre);
r=E.call('saveVentas',{id:'c_test0001',ventas:{'fs-032':14,'fs-033':2}},T);assert(r.ok,JSON.stringify(r));console.log('resumen',r.data.resumen);
r=E.call('getConteo',{id:'c_test0001'},T);console.log(r.data.res);
// leader sees only summary
r=E.call('getConteo',{id:'c_test0001'},TA);assert(!r.data.res);console.log('lider view',r.data.estado,r.data.resumen);
// second count uses ultimos
r=E.call('startCount',{negocio:'Food Shop'},TA);console.log('ultimos',JSON.stringify(r.data.ultimos).slice(0,200),'ents',r.data.entradas.length);
// rectificar
r=E.call('rectificar',{id:'c_test0001',cambios:{'fs-032':{ini:10,ent:24,fin:18}},motivo:'Error de conteo'},T);assert(r.ok,JSON.stringify(r));console.log('rect',r.data.resumen);
// dash
r=E.call('dash',{desde:'2026-11-01',hasta:'2026-11-02'},T);assert(r.ok,JSON.stringify(r));console.log(JSON.stringify(r.data.total),JSON.stringify(r.data.top[0]),r.data.faltan.length);
// gerencia
E.call('reqCode',{email:'ger@gmail.com'});let c3=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];
r=E.call('verifyCode',{email:'ger@gmail.com',code:c3,nombre:'Gerente'});const TG=r.data.token;
E.call('setUser',{email:'ger@gmail.com',rol:'gerencia',estado:'aprobado',negocios:[]},T);
r=E.call('dash',{},TG);assert(r.ok);r=E.call('saveVentas',{id:'c_test0001',ventas:{}},TG);assert(!r.ok);
r=E.call('saveProducto',{id:'x'},TG);assert(!r.ok&&r.error==='permiso');
// check missed counts
E.setClock(Date.UTC(2026,10,3,5,0,0)); // 2026-11-03 01:00 DO -> yesterday's turnos expired
E.ctx.revisarPendientes();
r=E.call('sync',{},T);console.log('notifs after',r.data.notifs.slice(0,6).map(n=>n.tipo+': '+n.titulo));
console.log('mail subjects',E.mails.map(m=>m.subject).slice(-4));
r=E.call('markRead',{todos:true},T);assert(r.ok);r=E.call('sync',{},T);assert(r.data.notifs.every(n=>n.leido));
// token tamper
r=E.call('sync',{},T+'x');assert(!r.ok&&r.error==='sesion');
console.log('ALL OK');
