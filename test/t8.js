// La Barra General: conteo semanal de almacén (lunes Atala/Atalaya, martes Miraflores)
const {makeEnv}=require('./mock');const assert=require('assert');
const LUN=Date.UTC(2026,10,2,15,0,0),LUN2=Date.UTC(2026,10,9,15,0,0);
const E=makeEnv({clock:LUN});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const no=(a,p,t)=>{const r=E.call(a,p,t);assert(!r.ok,a+' debía fallar');return r};
const A=login('dueno@gmail.com'),G=login('gris@g.com','Griselda'),C=login('c@g.com','Col');
ok('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
ok('setUser',{email:'c@g.com',rol:'colaborador',estado:'aprobado',negocios:['La Barra Atala']},A);
const s=ok('sync',{},G);
const GN=['La Barra Atala General','La Barra Atalaya General','La Barra Miraflores General'];
GN.forEach(n=>{assert(s.config.negocios.includes(n),n);assert.deepEqual(s.config.turnos[n],['Semanal'])});
assert.deepEqual(s.config.calendario['La Barra Atala General'],[1]);assert.deepEqual(s.config.calendario['La Barra Miraflores General'],[2]);
const P=s.productos.filter(p=>p.negocios.includes('La Barra Atala General'));
assert.equal(P.length,125);assert(P.every(p=>p.cat==='Almacén'));
assert(!ok('sync',{},C).config.negocios.includes('La Barra Atala General'));
const items=(fin,src)=>P.map(p=>({pid:p.id,ini:0,ent:0,fin:fin,src:src||''}));
// lunes: Atala sí; Miraflores no
const r1=ok('saveConteo',{id:'c_lbg00001',fecha:'2026-11-02',negocio:'La Barra Atala General',turno:'Semanal',items:items(10)},G);assert(r1.inicial);
no('saveConteo',{id:'c_lbg00002',fecha:'2026-11-02',negocio:'La Barra Miraflores General',turno:'Semanal',items:items(10)},G);
ok('saveConteo',{id:'c_lbg00003',fecha:'2026-11-03',negocio:'La Barra Miraflores General',turno:'Semanal',items:items(7)},G);
// segunda semana: consumo sin ventas
E.setClock(LUN2);
const r2=ok('saveConteo',{id:'c_lbg00004',fecha:'2026-11-09',negocio:'La Barra Atala General',turno:'Semanal',items:P.map(p=>({pid:p.id,ini:10,ent:5,fin:8,src:'c_lbg00001'}))},G);
const d=ok('getConteo',{id:'c_lbg00004'},G);
assert.equal(d.estado,'arqueado');assert(r2.consumo);assert(d.res.length===125&&d.res.every(x=>x[11]==='OK'&&x[7]===7),'consumo 10+5-8=7');
console.log('t8 ok',d.estado,d.resumen&&JSON.stringify(d.resumen));
