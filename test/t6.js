// Migración en una hoja ya en uso: La Barra 1/2/3 -> Atala/Atalaya/Miraflores con sus turnos
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,2,15,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+JSON.stringify(r));return r.data};
const A=login('dueno@gmail.com'),L=login('l@g.com','Lider');
// estado "antiguo"
ok('saveConfig',{cfg:{negocios:['La Barra 1','La Barra 2','La Barra 3','Food Shop','Zona Presidente','Car Wash'],turnos:{'La Barra 1':['Día completo'],'La Barra 2':['Día completo'],'La Barra 3':['Día completo'],'Food Shop':['Turno 1 (7AM-3PM)','Turno 2 (3PM-11PM)'],'Zona Presidente':['Turno único (3PM-11PM)'],'Car Wash':['Semanal']},limites:{'La Barra 1|Día completo':'23:30','Food Shop|Turno 1 (7AM-3PM)':'15:30'},catDias:{'La Barra 1':{Cervezas:[1]},'La Barra 2':{Cervezas:[1]},'La Barra 3':{Cervezas:[1]}}}},A);
ok('setUser',{email:'l@g.com',rol:'lider',estado:'aprobado',negocios:['La Barra 2']},A);
E.ctx.PropertiesService.getScriptProperties().deleteProperty('MIG_LABARRA_V1');
const s=ok('sync',{},A);
console.log(s.config.todosNegocios,JSON.stringify(s.config.turnos['La Barra Atalaya']),JSON.stringify(s.config.limites).slice(0,200));
assert.deepEqual(s.config.todosNegocios.slice(0,3),['La Barra Atala','La Barra Atalaya','La Barra Miraflores']);
assert.deepEqual(s.config.turnos['La Barra Atala'],['Turno 1 (7AM-3PM)','Turno 2 (3PM-11PM)','Turno 3 (11PM-7AM)']);
assert.deepEqual(s.config.turnos['La Barra Atalaya'],['Turno 1 (7AM-3PM)','Turno 2 (3PM-11PM)']);
assert.deepEqual(s.config.turnos['La Barra Miraflores'].length,3);
assert(!Object.keys(s.config.limites).some(k=>/Día completo|La Barra \d/.test(k)));
assert.equal(s.config.limites['La Barra Atala|Turno 3 (11PM-7AM)'],'07:30');
assert.deepEqual(s.config.catDias['La Barra Atalaya'],{Cervezas:[1]});
assert(s.productos.some(p=>p.negocios.includes('La Barra Atalaya')),'productos renombrados');
assert(!s.productos.some(p=>p.negocios.some(n=>/La Barra \d/.test(n))),'sin nombres viejos');
// el líder (asignado a Atalaya) ve solo Atalaya y 2 turnos
const sl=ok('sync',{},L);assert.deepEqual(sl.config.negocios,['La Barra Atalaya']);assert.equal(sl.config.turnos['La Barra Atalaya'].length,2);
assert.deepEqual(s.config.turnos['Food Shop'],['Turno 1 (7AM-3PM)','Turno 2 (3PM-11PM)']);assert.equal(s.config.limites['Food Shop|Turno 3 (11PM-7AM)'],undefined);
// idempotente
const again=ok('sync',{},A);assert.deepEqual(again.config.turnos['La Barra Atala'].length,3);
// Atalaya no admite turno 3; Atala sí
const P=sl.productos.slice(0,2);const ck={chk:[true,true,true,true,true,true],nov:'no',txt:'',cafe:{rell:'si',func:'si',txt:''},fz:{ok:'si',txt:''}};
const r=E.call('saveConteo',{id:'c_mig00001',fecha:'2026-11-02',negocio:'La Barra Atalaya',turno:'Turno 3 (11PM-7AM)',items:P.map(p=>({pid:p.id,ini:5,ent:0,fin:5,src:''})),cierre:ck},L);
assert(!r.ok,'Atalaya no tiene turno 3');console.log('turno 3 en Atalaya rechazado:',r.msg);
ok('saveConteo',{id:'c_mig00002',fecha:'2026-11-02',negocio:'La Barra Atalaya',turno:'Turno 2 (3PM-11PM)',items:P.map(p=>({pid:p.id,ini:5,ent:0,fin:5,src:''})),cierre:ck},L);
console.log('t6 OK');
