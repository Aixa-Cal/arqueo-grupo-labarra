// Supervisora de Almacén con conteos generales asignados: ve solo lo suyo y entra con nombre+teléfono+PIN
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,23,15,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const A=login('dueno@gmail.com');
ok('crearPersona',{nombre:'Griselda Lara',telefono:'8099747446',rol:'supervisor',negocios:['Almacén','La Barra Atala General','La Barra Atalaya General','Food Shop General'],turnos:[]},A);
const r=E.call('entrarPin',{nombre:'Griselda Lara',tel:'8099747446',pin:'1234',pin2:'1234'});
assert(r.ok,JSON.stringify(r));
const T=r.data.token;
const s=ok('sync',{},T);
const negs=(s.config&&s.config.negocios)||[];
assert.deepEqual(negs.slice().sort(),['Almacén','Food Shop General','La Barra Atala General','La Barra Atalaya General'],'solo lo suyo: '+JSON.stringify(negs));
assert.equal((s.conteos||[]).length,0);
// Lo que registra Griselda llega por correo a administración (no a ella ni a otros supervisores)
ok('crearPersona',{nombre:'Otra Supervisora',telefono:'8091112222',rol:'supervisor',negocios:['Food Shop'],turnos:[]},A);
const antes=E.mails.length;
const id='a_'+Math.random().toString(36).slice(2,10)+'abc';
ok('saveAlmacen',{tipo:'salida',id,destino:'La Barra Miraflores',items:[{pid:(s.productos[0]||{}).id||'x',qty:2}],nota:''},T);
const nuevos=E.mails.slice(antes);
assert(nuevos.length>=1,'debe enviarse correo');
assert(/dueno@gmail.com/.test(nuevos.map(m=>m.to).join(',')),'llega al admin: '+nuevos.map(m=>m.to));
assert(!/8091112222|griselda/i.test(nuevos.map(m=>m.to).join(',')),'no llega a supervisores');
assert(/Citrus/.test(nuevos[0].subject),'asunto con Citrus: '+nuevos[0].subject);
console.log('t14 ok');
// Agenda de Griselda: lunes Atala (general + frío) y Atalaya; martes Food Shop, Zona Presidente y Miraflores
{const E2=makeEnv({clock:Date.UTC(2026,10,24,15,0,0)});E2.ctx.instalar();
const lg=e=>{E2.call('reqCode',{email:e});const c=E2.mails[E2.mails.length-1].body.match(/\d{6}/)[0];return E2.call('verifyCode',{email:e,code:c,nombre:'X'}).data.token};
const A2=lg('dueno@gmail.com');const N=['Almacén','La Barra Atala General','La Barra Atala Cuarto Frío','La Barra Atalaya General','Food Shop General','Zona Presidente General','La Barra Miraflores General'];
assert(E2.call('crearPersona',{nombre:'Griselda Lara',telefono:'8099747446',rol:'supervisor',negocios:N,turnos:[]},A2).ok);
const T2=E2.call('entrarPin',{nombre:'Griselda Lara',tel:'8099747446',pin:'1234',pin2:'1234'}).data.token;
const s2=E2.call('sync',{},T2).data;
assert.deepEqual(s2.config.negocios.slice().sort(),N.slice().sort());
const cal=s2.config.calendario;assert.deepEqual([cal['La Barra Atala General'],cal['La Barra Atala Cuarto Frío'],cal['La Barra Atalaya General']],[[1],[1],[1]]);
assert.deepEqual([cal['Food Shop General'],cal['Zona Presidente General'],cal['La Barra Miraflores General']],[[2],[2],[2]]);
console.log('t14 agenda ok');}
