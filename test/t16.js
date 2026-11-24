// Zona Presidente General (martes): conteo semanal aparte con los productos de Zona Presidente
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,24,15,0,0)});E.ctx.instalar();
function login(e){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:'X'}).data.token}
const A=login('dueno@gmail.com');const s=E.call('sync',{},A).data;const Z='Zona Presidente General';
assert(s.config.negocios.includes(Z));assert.deepEqual(s.config.turnos[Z],['Semanal']);assert.deepEqual(s.config.calendario[Z],[2]);
const zp=s.productos.filter(p=>p.negocios.includes('Zona Presidente')),zg=s.productos.filter(p=>p.negocios.includes(Z));
assert(zp.length>=10&&zg.length===zp.length,zp.length+' vs '+zg.length);
console.log('t16 ok',zg.length);
