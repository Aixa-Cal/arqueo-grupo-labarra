// Supervisor (sub-administración) + cafeteras + historial de cambios + contactos WhatsApp
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,2,15,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];const r=E.call('verifyCode',{email:e,code:c,nombre:n});return r.data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const no=(a,p,t,m)=>{const r=E.call(a,p,t);assert(!r.ok,a+' debía fallar');if(m)assert.equal(r.error,m);return r};
const A=login('dueno@gmail.com'),S=login('sup@g.com','Sara Sup'),C=login('col@g.com','Carlos'),F=login('fs@g.com','Fede');
ok('setUser',{email:'sup@g.com',rol:'supervisor',estado:'aprobado',negocios:[],telefono:'809-555-1234'},A);
ok('setUser',{email:'col@g.com',rol:'colaborador',estado:'aprobado',negocios:['La Barra Atala'],telefono:'(829) 111 2222'},A);
ok('setUser',{email:'fs@g.com',rol:'colaborador',estado:'aprobado',negocios:['Food Shop']},A);
// contactos
assert.deepEqual(ok('contactos',{},S).map(x=>x.telefono).sort(),['8091-555'.replace('8091-555','8095551234'),'8291112222'].sort());
no('contactos',{},C,'permiso');
// cafeteras
const P=ok('sync',{},C).productos.filter(p=>p.negocios.includes('La Barra Atala')).slice(0,3);
const it=P.map(p=>({pid:p.id,ini:10,ent:0,fin:10,src:''}));
const ck=(cafe,nov,fz)=>({chk:[true,true,true,true,true,true],nov:nov||'no',txt:'',cafe,fz:fz===undefined?{ok:'si',txt:''}:fz});
no('saveConteo',{id:'c_caf00001',fecha:'2026-11-02',negocio:'La Barra Atala',turno:'Turno 1 (7AM-3PM)',items:it,cierre:{chk:[true,true,true,true,true,true],nov:'no',txt:''}},C,'datos');
no('saveConteo',{id:'c_caf00001',fecha:'2026-11-02',negocio:'La Barra Atala',turno:'Turno 1 (7AM-3PM)',items:it,cierre:ck({rell:'si',func:'no',txt:''})},C,'datos');
const n0=E.mails.length;
ok('saveConteo',{id:'c_caf00001',fecha:'2026-11-02',negocio:'La Barra Atala',turno:'Turno 1 (7AM-3PM)',items:it,cierre:ck({rell:'no',func:'si',txt:'No había leche'})},C);
assert(E.mails.slice(n0).some(m=>/Máquinas de café/.test(m.subject||m.body||'')),'aviso cafetera');
assert(ok('sync',{},S).notifs.some(n=>n.tipo==='cafetera'),'supervisor recibe aviso de cafetera');
assert(!ok('sync',{},S).notifs.some(n=>n.tipo==='acceso'),'supervisor no recibe solicitudes de acceso');
// Food Shop también exige cafetera; Car Wash no
const FP=ok('sync',{},F).productos.filter(p=>p.negocios.includes('Food Shop')).slice(0,2);
no('saveConteo',{id:'c_caf00002',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items:FP.map(p=>({pid:p.id,ini:5,ent:0,fin:5,src:''})),cierre:ck(undefined)},F,'datos');
no('saveConteo',{id:'c_fz000001',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items:FP.map(p=>({pid:p.id,ini:5,ent:0,fin:5,src:''})),cierre:ck({rell:'si',func:'si',txt:''},'no',null)},F,'datos');
no('saveConteo',{id:'c_fz000001',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items:FP.map(p=>({pid:p.id,ini:5,ent:0,fin:5,src:''})),cierre:ck({rell:'si',func:'si',txt:''},'no',{ok:'no',txt:''})},F,'datos');
const nf=E.mails.length;ok('saveConteo',{id:'c_fz000001',fecha:'2026-11-02',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items:FP.map(p=>({pid:p.id,ini:5,ent:0,fin:5,src:''})),cierre:ck({rell:'si',func:'si',txt:''},'no',{ok:'no',txt:'Freezer 2 no enfría'})},F);
assert(E.mails.slice(nf).some(m=>/Freezers/.test(m.subject||m.body||'')),'aviso freezer');
assert(ok('getConteo',{id:'c_fz000001'},A).cierre.fz.txt==='Freezer 2 no enfría');
// segundo conteo para arqueo y supervisor completa
E.setClock(Date.UTC(2026,10,3,15,0,0));
const it2=P.map(p=>({pid:p.id,ini:10,ent:0,fin:7,src:'c_caf00001'}));
ok('saveConteo',{id:'c_caf00003',fecha:'2026-11-03',negocio:'La Barra Atala',turno:'Turno 1 (7AM-3PM)',items:it2,cierre:ck({rell:'si',func:'si',txt:''})},C);
// supervisor ve conteos de cualquier negocio, registra ventas y rectifica
assert(ok('sync',{},S).conteos.some(c=>c.id==='c_caf00003'));
const v={};P.forEach(p=>v[p.id]=3);
ok('saveVentas',{id:'c_caf00003',ventas:v,ventasPor:'POS'},S);
const v2={};P.forEach(p=>v2[p.id]=2);
ok('saveVentas',{id:'c_caf00003',ventas:v2,ventasPor:'POS'},S);
ok('rectificar',{id:'c_caf00003',motivo:'Se contó mal el estante',cambios:{[P[0].id]:{ini:10,ent:0,fin:6}}},S);
const d=ok('getConteo',{id:'c_caf00003'},S);
console.log('hist',d.hist.map(h=>h.quien+' | '+h.accion+' | '+h.detalle.slice(0,60)));
assert(d.hist.length>=3);assert(d.hist.every(h=>/Sara Sup \(supervisor\)/.test(h.quien)));
assert(d.hist.some(h=>h.accion==='ventas-cambio'&&/→2/.test(h.detalle)));
assert(d.hist.some(h=>h.accion==='rectificar'&&/estante/.test(h.detalle)));
assert(!ok('getConteo',{id:'c_caf00003'},C).hist,'colaborador no ve historial');
// lo que NO puede
for(const [a,p] of [['anular',{id:'c_caf00003',motivo:'xxx'}],['saveProducto',{nombre:'x'}],['delProducto',{id:'x'}],['saveConfig',{cfg:{}}],['listUsers',{}],['setUser',{email:'col@g.com',rol:'admin',estado:'aprobado'}],['anularMov',{id:'m_xxxxxx'}],['dash',{}]])no(a,p,S,'permiso');
// supervisor cuenta cualquier negocio
ok('saveConteo',{id:'c_caf00004',fecha:'2026-11-03',negocio:'Food Shop',turno:'Turno 2 (3PM-11PM)',items:FP.map(p=>({pid:p.id,ini:5,ent:0,fin:5,src:''})),cierre:ck({rell:'si',func:'si',txt:''})},S);
// bitácora de usuario con teléfono
console.log('t5 OK');
