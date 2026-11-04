// Checklist corto del turno
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,3,15,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const no=(a,p,t)=>{const r=E.call(a,p,t);assert(!r.ok,a+' debía fallar');return r};
const A=login('dueno@gmail.com'),L=login('l@g.com','Lider'),G=login('gris@g.com','Griselda'),O=login('o@g.com','Otro');
ok('setUser',{email:'l@g.com',rol:'lider',estado:'aprobado',negocios:['La Barra Atala']},A);
ok('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
ok('setUser',{email:'o@g.com',rol:'lider',estado:'aprobado',negocios:['Food Shop']},A);
const T='Turno 1 (7AM-3PM)';
no('saveCheckTurno',{negocio:'La Barra Atala',turno:T,chk:{}},L);                       // freidora obligatoria
no('saveCheckTurno',{negocio:'La Barra Atala',turno:T,fry:290},O);                       // otro negocio
no('saveCheckTurno',{negocio:'Food Shop',turno:T,fry:290},O);                            // solo La Barra
let r=ok('saveCheckTurno',{negocio:'La Barra Atala',turno:T,fry:290,nev:4,chk:{vf:1,fl:1,fryok:1},fruta:['Fresa']},L);assert.equal(r.fuera,0);assert.equal(r.sin,0);
r=ok('saveCheckTurno',{negocio:'La Barra Atala',turno:T,fry:250,nev:4,chk:{vf:1}},L);assert.equal(r.fuera,1);assert.equal(r.sin,1);   // se reescribe
const l=ok('sync',{},G).checkTurno;assert.equal(l.length,1);assert.equal(l[0].datos.fry,250);
assert.equal(ok('sync',{},O).checkTurno.length,0);
const n=ok('sync',{},G).notifs;assert(n.some(x=>/Temperatura fuera/.test(x.titulo)&&/Atala/.test(x.titulo)));assert(n.some(x=>/Equipos sin carga/.test(x.titulo)));
console.log('t11 ok');
