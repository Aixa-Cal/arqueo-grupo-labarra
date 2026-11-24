// Cuarto frío del Atala: conteo semanal aparte; sus productos salen del general del Atala y siguen en Atalaya/Miraflores
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,23,15,0,0)});E.ctx.instalar();
function login(e){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:'X'}).data.token}
const A=login('dueno@gmail.com');
const s=E.call('sync',{},A).data;
const F='La Barra Atala Cuarto Frío';
assert(s.config.negocios.includes(F),'negocio nuevo');
assert.deepEqual(s.config.turnos[F],['Semanal']);assert.deepEqual(s.config.calendario[F],[1]);
const cnt=n=>s.productos.filter(p=>(p.negocios||[]).includes(n)).length;
const fr=cnt(F),ag=cnt('La Barra Atala General'),ay=cnt('La Barra Atalaya General'),mi=cnt('La Barra Miraflores General');
console.log({fr,ag,ay,mi});
assert(fr>=40&&fr<=60,'productos de frío');assert.equal(fr+ag,125,'nada se pierde');assert.equal(ay,125);assert.equal(mi,125);
assert(!s.productos.some(p=>(p.negocios||[]).includes(F)&&(p.negocios||[]).includes('La Barra Atala General')),'no repetidos');
console.log('t15 ok');
