// Lista oficial del Food Shop: renombra sin perder historial, agrega nuevos y desactiva los que ya no están
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,18,15,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const A=login('dueno@gmail.com');
const fs=()=>ok('sync',{},A).productos.filter(p=>p.negocios.includes('Food Shop'));
let P=fs();
assert.equal(P.length,199,'semilla nueva: lista + Lenguita + Miller/Chicharrón + empanadas, pastelistos, Aurora y vasos de café');
const nn0=P.map(p=>p.nombre);['EMPANADA POLLO','EMPANADA RES VEGETAL','PASTELISTO 3 QUESOS','LA AURORA 107','LA AURORA CAMEROON','VASOS CAFÉ NESCAFÉ','VASOS CAFÉ SANTO DOMINGO','MILLER PEQUEÑA 12 OZ','MILLER MEDIANA 22 OZ','CHICHARRÓN EL CHEF'].forEach(n=>assert(nn0.includes(n),'falta '+n));
assert(P.some(p=>p.nombre==='LENGUITA ACIDA')&&P.some(p=>p.nombre==='SVUKIL VODKA'));
assert.equal(new Set(P.map(p=>p.cat)).size,10);
// instalación vieja: nombres anteriores, un producto que ya no está, y sin los nuevos
const gold=P.find(p=>p.nombre==='MLB GOLD 3.5 BOX10');
ok('saveProducto',Object.assign({},gold,{nombre:'Marlboro Gold de 10',cat:'Tabaco',orden:5,costo:99}),A);
ok('saveProducto',{id:'fs-170',nombre:'Miller 12 oz',cat:'Cervezas',unidad:'unid',factor:1,tol:0.02,costo:0,negocios:['Food Shop']},A);
const lg=P.find(p=>p.nombre==='LENGUITA ACIDA');
ok('saveProducto',Object.assign({},lg,{nombre:'Chicharrón El Chef',cat:'Snacks'}),A); // simula producto viejo que sale de la lista
E.ctx.PropertiesService.getScriptProperties().deleteProperty('MIG_FSLISTA_V1');
ok('sync',{},A);ok('sync',{},A); // idempotente
P=fs();
const nm=P.map(p=>p.nombre);
assert(nm.includes('MLB GOLD 3.5 BOX10')&&!nm.includes('Marlboro Gold de 10'),'renombrado');
const g2=P.find(p=>p.id===gold.id);assert.equal(g2.costo,99,'conserva el costo');assert.equal(g2.cat,'TABACO / NICOTINA');assert.equal(g2.id,gold.id,'mismo id: conserva historial');
assert(!nm.includes('Miller 12 oz'),'el viejo nombre ya no existe');
console.log('inicio',JSON.stringify(ok('sync',{},A).config.inicio));assert.equal(ok('sync',{},A).config.inicio['Food Shop'],'2026-11-18');
assert(nm.includes('LENGUITA ACIDA'),'el nuevo se vuelve a crear');
assert.equal(new Set(nm).size,nm.length,'sin duplicados');
assert.equal(P.length,182,'la prueba vuelve a correr V1 y apaga Miller y Chicharrón; Lenguita se recrea');
console.log('t13 OK');
