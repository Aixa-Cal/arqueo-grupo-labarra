// Producción de Maria: checklist diario y rendimiento
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,3,15,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const no=(a,p,t)=>{const r=E.call(a,p,t);assert(!r.ok,a+' debía fallar');return r};
const A=login('dueno@gmail.com'),M=login('maria@g.com','Maria'),X=login('x@g.com','Otra'),G=login('gris@g.com','Griselda');
ok('setUser',{email:'maria@g.com',rol:'lider',estado:'aprobado',negocios:['Almacén']},A);
ok('setUser',{email:'x@g.com',rol:'colaborador',estado:'aprobado',negocios:['La Barra Atala']},A);
ok('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
no('saveChecklist',{chk:[1,0],temps:{}},X);
let r=ok('saveChecklist',{chk:[1,1,0],temps:{aceite:290,camara:3,congelador:-20}},M);assert.equal(r.fuera,0);
r=ok('saveChecklist',{chk:[1,1,1],temps:{aceite:290,camara:8,congelador:-20},nota:'camara'},M);assert.equal(r.fuera,1);   // se reescribe el del día
let pr=ok('sync',{},G).produccion;assert.equal(pr.filter(x=>x.tipo==='checklist').length,1);assert.deepEqual(pr[0].datos.chk,[1,1,1]);
assert(ok('sync',{},G).notifs.some(n=>/Temperatura fuera/.test(n.titulo)));
assert.equal(ok('sync',{},X).produccion.length,0);
no('saveProd',{id:'p_aaaaaa01',lineas:[{prod:'Marte',rec:1,obt:1}]},M);
no('saveProd',{id:'p_aaaaaa02',lineas:[{prod:'Lulo',rec:0,obt:1}]},M);
// historial: 3 días de 50% y luego 30% → rendimiento bajo
for(let i=1;i<=3;i++){E.setClock(Date.UTC(2026,10,3+i,15,0,0));ok('saveProd',{id:'p_hist000'+i,lineas:[{prod:'Lulo',rec:10,obt:5}]},M)}
E.setClock(Date.UTC(2026,10,8,15,0,0));
r=ok('saveProd',{id:'p_hist0009',lineas:[{prod:'Lulo',rec:10,obt:3},{prod:'Piña',rec:10,obt:6}]},M);assert.equal(r.bajos,1);
assert(ok('sync',{},G).notifs.some(n=>/Rendimiento bajo/.test(n.titulo)));
console.log('t10 ok');
