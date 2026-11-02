const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,2,12,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];const r=E.call('verifyCode',{email:e,code:c,nombre:n});assert(r.ok,JSON.stringify(r));return r.data.token}
const A=login('dueno@gmail.com');const F=login('fs@g.com','Ana FS'),Z=login('zp@g.com','Luis ZP'),B=login('b1@g.com','Carla LB1');
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const bad=(a,p,t,code)=>{const r=E.call(a,p,t);assert(!r.ok,a+' debía fallar');if(code)assert.equal(r.error,code,JSON.stringify(r));return r};
ok('setUser',{email:'fs@g.com',rol:'lider',estado:'aprobado',negocios:['Food Shop']},A);
ok('setUser',{email:'zp@g.com',rol:'lider',estado:'aprobado',negocios:['Zona Presidente']},A);
ok('setUser',{email:'b1@g.com',rol:'lider',estado:'aprobado',negocios:['La Barra Atala']},A);
const P=ok('sync',{},A).productos;
const fsPL=P.find(p=>p.nombre==='Presidente Light 12 oz'&&p.negocios.includes('Food Shop')),zpPL=P.find(p=>p.nombre==='Presidente Light 12 oz'&&p.negocios.includes('Zona Presidente'));
ok('saveProducto',{...fsPL,costo:50},A);ok('saveProducto',{...zpPL,costo:50},A);
const fsDura=P.find(p=>p.nombre==='Presidente Dura 12 oz'&&p.negocios.includes('Food Shop'));
// conteos iniciales
const cnt=(tok,id,neg,turno,items,fecha)=>ok('saveConteo',{id,fecha:fecha||'2026-11-02',negocio:neg,turno,items},tok);
cnt(F,'c_fs000001','Food Shop','Turno 1 (7AM-3PM)',[{pid:fsPL.id,ini:100,ent:0,fin:100,src:''},{pid:fsDura.id,ini:50,ent:0,fin:50,src:''}]);
cnt(Z,'c_zp000001','Zona Presidente','Turno único (3PM-11PM)',[{pid:zpPL.id,ini:20,ent:0,fin:20,src:''}]);
E.setClock(Date.UTC(2026,10,2,16,0,0));
// ---- permisos y validaciones
bad('addMerma',{id:'m_aaaaaa01',negocio:'Zona Presidente',motivo:'Rotura',items:[{pid:fsPL.id,qty:1}]},F,'permiso');
bad('addMerma',{id:'m_aaaaaa02',negocio:'Food Shop',motivo:'Se dañó',detalle:'',items:[{pid:fsPL.id,qty:1}]},F,'datos');
bad('addMerma',{id:'m_aaaaaa03',negocio:'Food Shop',motivo:'Se dañó',detalle:'no',items:[{pid:fsPL.id,qty:1}]},F,'datos');
bad('addMerma',{id:'m_aaaaaa04',negocio:'Food Shop',motivo:'Otros',detalle:'',items:[{pid:fsPL.id,qty:1}]},F,'datos');
bad('addMerma',{id:'m_aaaaaa05',negocio:'Food Shop',motivo:'Inventado',items:[{pid:fsPL.id,qty:1}]},F,'datos');
bad('addMerma',{id:'m_aaaaaa06',negocio:'Food Shop',motivo:'Rotura',items:[{pid:fsPL.id,qty:0}]},F,'datos');
// ---- merma válida: 3 Presidente Light se rompieron
ok('addMerma',{id:'m_merma001',negocio:'Food Shop',motivo:'Rotura',detalle:'Se cayó la caja',items:[{pid:fsPL.id,qty:3}]},F);
assert.equal(ok('addMerma',{id:'m_merma001',negocio:'Food Shop',motivo:'Rotura',items:[{pid:fsPL.id,qty:3}]},F).repetido,true);
ok('addMerma',{id:'m_merma002',negocio:'Food Shop',motivo:'Se dañó',detalle:'Se calentó por falla de la nevera',items:[{pid:fsDura.id,qty:2}]},F);
let n=ok('sync',{},A).notifs.map(x=>x.tipo);assert(n.includes('merma'),'aviso de merma dañó');
// ---- traspaso Food Shop -> Zona Presidente: 12 Presidente Light
bad('addTraspaso',{id:'m_tras0001',negocio:'Food Shop',destino:'Food Shop',items:[{pid:fsPL.id,qty:1}]},F,'datos');
ok('addTraspaso',{id:'m_tras0001',negocio:'Food Shop',destino:'Zona Presidente',items:[{pid:fsPL.id,qty:12}]},F);
let zs=ok('sync',{},Z);assert(zs.notifs.some(x=>x.tipo==='traspaso'),'ZP ve aviso');
assert.equal(zs.movs.filter(m=>m.tipo==='traspaso'&&m.estado==='enviado').length,1);
bad('recibirTraspaso',{id:'m_tras0001',items:[{pid:fsPL.id,qty:12}]},B,'permiso');
// ZP recibe 11 (llegó 1 menos) -> diferencia
const rr=ok('recibirTraspaso',{id:'m_tras0001',items:[{pid:fsPL.id,qty:11}]},Z);assert.equal(rr.diferencias,1);
n=ok('sync',{},A).notifs.map(x=>x.tipo);assert(n.includes('traspaso-dif'));
// startCount ZP: la entrada llega con el código de ZP
let sc=ok('startCount',{negocio:'Zona Presidente'},Z);
const ent=sc.entradas.find(e=>e.items.some(i=>i.pid===zpPL.id));assert(ent&&ent.items[0].qty===11,'entrada por traspaso con código de ZP');
sc=ok('startCount',{negocio:'Food Shop'},F);assert(sc.salidas.length===3||sc.salidas.length===2,'salidas de FS '+sc.salidas.length);
// ---- conteos y arqueo
E.setClock(Date.UTC(2026,10,2,23,0,0));
// FS: había 100, mermas 3 + traspaso 12 = 15 declarado; vendió 70 -> debía 85; quedan 15 => real 85 -> OK
cnt(F,'c_fs000002','Food Shop','Turno 2 (3PM-11PM)',[{pid:fsPL.id,ini:100,ent:0,fin:15,src:'c_fs000001'},{pid:fsDura.id,ini:50,ent:0,fin:38,src:'c_fs000001'}]);
let r=ok('saveVentas',{id:'c_fs000002',ventas:{[fsPL.id]:70,[fsDura.id]:10}},A);
let det=ok('getConteo',{id:'c_fs000002'},A);
const x1=det.res.find(x=>x[0]===fsPL.id),x2=det.res.find(x=>x[0]===fsDura.id);
console.log('FS PL',x1.join('|'));console.log('FS Dura',x2.join('|'));
assert.equal(x1[13],15);assert.equal(x1[11],'OK');assert.equal(x1[9],0);
assert.equal(x2[13],2);assert.equal(x2[11],'OK');  // 50-38=12 = 10 vendidas + 2 dañadas
assert.equal(det.sal[fsPL.id].q,15);
assert.equal(r.resumen.decl,15*50+0);
// ZP: había 20, entraron 11, quedan 25 -> salió 6, vendió 6 -> OK
cnt(Z,'c_zp000002','Zona Presidente','Turno único (3PM-11PM)',[{pid:zpPL.id,ini:20,ent:11,fin:25,src:'c_zp000001'}],'2026-11-03');
ok('saveVentas',{id:'c_zp000002',ventas:{[zpPL.id]:6}},A);
det=ok('getConteo',{id:'c_zp000002'},A);assert.equal(det.res[0][11],'OK');
// sin declarar: la misma pérdida sale crítica
cnt(F,'c_fs000003','Food Shop','Turno 1 (7AM-3PM)',[{pid:fsPL.id,ini:15,ent:0,fin:5,src:'c_fs000002'}],'2026-11-03');
r=ok('saveVentas',{id:'c_fs000003',ventas:{[fsPL.id]:5}},A);assert.equal(r.resumen.crit,1,'lo no declarado sigue siendo crítico');
// dashboard
const d=ok('dash',{desde:'2026-11-02',hasta:'2026-11-03'},A);console.log('mermas',JSON.stringify(d.mermas),'decl',d.total.decl);
assert.equal(d.mermas.enviados,1);assert(d.mermas.porMotivo['Rotura'].valor===150);
// anular merma (solo admin)
bad('anularMov',{id:'m_merma001'},F,'permiso');ok('anularMov',{id:'m_merma001'},A);
// traspaso a negocio sin el producto
const noCat=P.find(p=>p.negocios.includes('Zona Presidente')&&!/Light|Dura/.test(p.nombre)&&p.nombre.includes('Brahma'));
// lider LB1 no puede traspasar fuera de su negocio y producto inexistente en destino
bad('addTraspaso',{id:'m_tras0002',negocio:'La Barra Atala',destino:'Zona Presidente',items:[{pid:'lb-01',qty:2}]},B,'datos');
// entrada con origen
ok('addEntrada',{id:'e_cocina001',negocio:'La Barra Atala',origen:'Cocina',items:[{pid:'lb-01',qty:30}]},B);
assert.equal(ok('sync',{},B).entradas[0].origen,'Cocina');
// avisos por traspaso sin confirmar
ok('addTraspaso',{id:'m_tras0003',negocio:'Zona Presidente',destino:'Food Shop',items:[{pid:zpPL.id,qty:2}]},Z);
E.setClock(Date.UTC(2026,10,3,12,0,0));E.ctx.revisarPendientes();
assert(ok('sync',{},A).notifs.some(x=>x.tipo==='traspaso-tarde'));
console.log('T2 OK');
