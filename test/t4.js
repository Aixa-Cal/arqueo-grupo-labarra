// La Barra: cervezas solo los lunes (semanales) y el resto diario; cada producto se arquea contra su propio conteo previo
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,2,15,0,0)});E.ctx.instalar();   // lunes 2-nov
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];const r=E.call('verifyCode',{email:e,code:c,nombre:n});assert(r.ok);return r.data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const A=login('dueno@gmail.com'),C=login('b1@g.com','Carla');
ok('setUser',{email:'b1@g.com',rol:'colaborador',estado:'aprobado',negocios:['La Barra 1']},A);
const s=ok('sync',{},C);assert.deepEqual(s.config.catDias['La Barra 1'],{Cervezas:[1]});
const P=s.productos.filter(p=>p.negocios.includes('La Barra 1'));
const cerv=P.filter(p=>p.cat==='Cervezas'),otros=P.filter(p=>p.cat!=='Cervezas');
assert(cerv.length>0&&otros.length>0);
const cnt=(id,fecha,prods,ini,ent,fin,srcMap)=>ok('saveConteo',{id,fecha,negocio:'La Barra 1',turno:'Día completo',items:prods.map(p=>({pid:p.id,ini,ent,fin,src:srcMap?srcMap(p):''}))},C);
// lunes 2: conteo inicial de todo
cnt('c_lb000001','2026-11-02',P,50,0,50,null);
// martes 3 .. domingo 8: solo lo que no es cerveza (cada día con su src del día previo)
let prev='c_lb000001',prevTs=null;
for(let d=3;d<=8;d++){
  E.setClock(Date.UTC(2026,10,d,15,0,0));
  const id='c_lb0000'+String(d).padStart(2,'0');
  cnt(id,'2026-11-0'+d,otros,50,0,50,()=>prev);prev=id;
}
// lunes 9: todo, cada producto contra su último conteo
E.setClock(Date.UTC(2026,10,9,15,0,0));
const b=ok('startCount',{negocio:'La Barra 1'},C);
cerv.forEach(p=>assert.equal(b.ultimos[p.id][3],'c_lb000001','cerveza: conteo previo = lunes anterior'));
otros.forEach(p=>assert.equal(b.ultimos[p.id][3],prev,'resto: conteo previo = ayer'));
cnt('c_lb000009','2026-11-09',P,50,0,30,p=>b.ultimos[p.id][3]);
const g=ok('getConteo',{id:'c_lb000009'},A);
const tramos=new Set(g.items.map(i=>i.src));assert.equal(tramos.size,2,'dos períodos: semana (cervezas) y día (resto)');
const ventas={};cerv.forEach(p=>ventas[p.id]=Math.round(20/p.factor));  // 20 salidas en la semana
const r=ok('saveVentas',{id:'c_lb000009',ventas},A);
const res=ok('getConteo',{id:'c_lb000009'},A).res;
cerv.forEach(p=>{const x=res.find(y=>y[0]===p.id);assert.equal(x[7],20,'cerveza: salieron 20 en la semana');});
console.log('resumen',JSON.stringify(r.resumen));
console.log('T4 OK');
{ // cierre del turno obligatorio y novedad
  const it=[{pid:otros[0].id,ini:5,ent:0,fin:5,src:''}];
  const bad=(c)=>{const r=E.call('saveConteo',{id:'c_cierre'+Math.random().toString(36).slice(2,6),fecha:'2026-11-09',negocio:'La Barra 2',turno:'Día completo',items:it,cierre:c},C);return r};
  ok('setUser',{email:'b1@g.com',rol:'colaborador',estado:'aprobado',negocios:['La Barra 1','La Barra 2']},A);
  assert(!bad(null).ok);assert(!bad({chk:[true,true,true,true,true,false],nov:'no',txt:'',cafe:{rell:'si',func:'si',txt:''}}).ok);
  assert(!bad({chk:[true,true,true,true,true,true],nov:'',txt:'',cafe:{rell:'si',func:'si',txt:''}}).ok);assert(!bad({chk:[true,true,true,true,true,true],nov:'si',txt:'',cafe:{rell:'si',func:'si',txt:''}}).ok);
  const n0=E.mails.length;
  const g=bad({chk:[true,true,true,true,true,true],nov:'si',txt:'Se dañó la licuadora',cafe:{rell:'si',func:'si',txt:''}});assert(g.ok,JSON.stringify(g));
  assert(E.mails.slice(n0).some(m=>/Novedad/.test(m.subject||m.body||'')),'mail novedad');
  console.log('cierre OK');
}
