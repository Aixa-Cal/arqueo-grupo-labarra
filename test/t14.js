// Supervisora solo de Almacén: ve únicamente Almacén y entra con nombre+teléfono+PIN
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,23,15,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const A=login('dueno@gmail.com');
ok('crearPersona',{nombre:'Griselda Lara',telefono:'8099747446',rol:'supervisor',negocios:['Almacén'],turnos:[]},A);
const r=E.call('entrarPin',{nombre:'Griselda Lara',tel:'8099747446',pin:'1234',pin2:'1234'});
assert(r.ok,JSON.stringify(r));
const T=r.data.token;
const s=ok('sync',{},T);
const negs=(s.config&&s.config.negocios)||[];
assert.deepEqual(negs,['Almacén'],'solo Almacén: '+JSON.stringify(negs));
assert.equal((s.conteos||[]).length,0);
console.log('t14 ok');
