// Acceso por enlace de WhatsApp: crear persona sin correo, invitar, entrar con el enlace
const {makeEnv}=require('./mock');const assert=require('assert');
const D=86400000,T0=Date.UTC(2026,10,11,15,0,0);
const E=makeEnv({clock:T0});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const no=(a,p,t,m)=>{const r=E.call(a,p,t);assert(!r.ok,a+' debía fallar');if(m)assert.equal(r.error,m);return r};
const A=login('dueno@gmail.com'),G=login('gris@g.com','Griselda');
ok('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
no('crearPersona',{nombre:'X',telefono:'8095551234',rol:'colaborador'},G,'permiso');
no('crearPersona',{nombre:'Sol Pérez',telefono:'123',rol:'colaborador'},A,'datos');
const r=ok('crearPersona',{nombre:'Sol Pérez',telefono:'(809) 555-1234',rol:'colaborador',negocios:['Food Shop'],turnos:['1']},A);
assert(/^tel8095551234@/.test(r.email));
no('crearPersona',{nombre:'Otra',telefono:'809-555-1234',rol:'colaborador',negocios:['Food Shop']},A,'datos');
const us=ok('listUsers',{},A),sol=us.find(u=>u.email===r.email);
assert(sol.sinCorreo&&sol.estado==='aprobado'&&sol.ultimoAcceso===0&&!JSON.stringify(us).includes('invHash'));
no('invitar',{email:r.email},G,'permiso');
const inv=ok('invitar',{email:r.email},A);assert(inv.token.length===40&&inv.telefono==='8095551234');
// el enlace entra sin código
no('entrarLink',{t:'x'.repeat(40)},undefined,'enlace');
const e1=ok('entrarLink',{t:inv.token});assert.equal(e1.me.nombre,'Sol Pérez');assert.equal(e1.me.rol,'colaborador');
const s=ok('sync',{},e1.token);assert(s.config.negocios.includes('Food Shop'));
// la sesión dura un año
E.setClock(T0+300*D);ok('sync',{},e1.token);E.setClock(T0+366*D);no('sync',{},e1.token,'sesion');E.setClock(T0);
// un enlace nuevo invalida el anterior
const inv2=ok('invitar',{email:r.email},A);no('entrarLink',{t:inv.token},undefined,'enlace');ok('entrarLink',{t:inv2.token});
// vence a los 7 días
E.setClock(T0+8*D);no('entrarLink',{t:inv2.token},undefined,'enlace');E.setClock(T0);
// usos limitados
const inv3=ok('invitar',{email:r.email},A);for(let i=0;i<6;i++)ok('entrarLink',{t:inv3.token});no('entrarLink',{t:inv3.token},undefined,'enlace');
// bloqueado no entra
const inv4=ok('invitar',{email:r.email},A);
ok('setUser',{email:r.email,rol:'colaborador',estado:'bloqueado',negocios:['Food Shop']},A);
no('entrarLink',{t:inv4.token},undefined,'bloqueado');no('invitar',{email:r.email},A,'datos');
// setUser no rompe el enlace ni manda correo a la dirección falsa
const antes=E.mails.length;ok('setUser',{email:r.email,rol:'colaborador',estado:'aprobado',negocios:['Food Shop']},A);
assert(!E.mails.slice(antes).some(m=>/sin-correo/.test(m.to)),'no se escribe a correos falsos');
console.log('t12 OK');
