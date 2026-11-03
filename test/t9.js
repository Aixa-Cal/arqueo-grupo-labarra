// Almacén: recepción con foto, salida y marcar hecho
const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv({clock:Date.UTC(2026,10,3,15,0,0)});E.ctx.instalar();
function login(e,n){E.call('reqCode',{email:e});const c=E.mails[E.mails.length-1].body.match(/\d{6}/)[0];return E.call('verifyCode',{email:e,code:c,nombre:n}).data.token}
const ok=(a,p,t)=>{const r=E.call(a,p,t);assert(r.ok,a+' '+JSON.stringify(r));return r.data};
const no=(a,p,t)=>{const r=E.call(a,p,t);assert(!r.ok,a+' debía fallar');return r};
const A=login('dueno@gmail.com'),M=login('maria@g.com','Maria'),G=login('gris@g.com','Griselda'),K=login('k@g.com','Khristal'),X=login('x@g.com','Otra');
ok('setUser',{email:'maria@g.com',rol:'lider',estado:'aprobado',negocios:['Almacén']},A);
ok('setUser',{email:'gris@g.com',rol:'supervisor',estado:'aprobado',negocios:[]},A);
ok('setUser',{email:'k@g.com',rol:'admin',estado:'aprobado',negocios:[]},A);
ok('setUser',{email:'x@g.com',rol:'colaborador',estado:'aprobado',negocios:['La Barra Atala']},A);
const sm=ok('sync',{},M);assert(sm.config.negocios.includes('Almacén'));
const P=sm.productos.filter(p=>p.cat==='Almacén');assert.equal(P.length,125,'Maria ve los 125 productos');
const foto='data:image/jpeg;base64,'+Buffer.from('fotofalsa').toString('base64');
no('saveAlmacen',{id:'a_aaaaaa1',tipo:'recepcion',fotos:[foto]},X);
no('saveAlmacen',{id:'a_aaaaaa2',tipo:'recepcion',fotos:[]},M);
ok('saveAlmacen',{id:'a_aaaaaa3',tipo:'recepcion',fotos:[foto,foto],nota:'Factura 1234'},M);
no('saveAlmacen',{id:'a_aaaaaa4',tipo:'salida',destino:'Marte',items:[{pid:P[0].id,qty:2}]},M);
ok('saveAlmacen',{id:'a_aaaaaa5',tipo:'salida',destino:'La Barra Atala',items:[{pid:P[0].id,qty:2},{pid:P[1].id,qty:1.5}]},M);
let l=ok('sync',{},G).almacen;assert.equal(l.length,2);assert(l.every(a=>a.estado==='nuevo'));
assert.equal(l.find(a=>a.id==='a_aaaaaa3').nf,2);
assert.equal(ok('sync',{},X).almacen.length,0);
const f=ok('getFoto',{id:'a_aaaaaa3',n:1},G);assert(/^data:image\/jpeg;base64,/.test(f.foto));
no('getFoto',{id:'a_aaaaaa3',n:0},X);
no('marcarAlmacen',{id:'a_aaaaaa5'},M);
ok('marcarAlmacen',{id:'a_aaaaaa5'},G);ok('marcarAlmacen',{id:'a_aaaaaa3'},K);
l=ok('sync',{},K).almacen;assert(l.every(a=>a.estado==='hecho'));
assert(ok('sync',{},G).notifs.some(n=>/Llegó mercancía/.test(n.titulo)));
console.log('t9 ok');
// «Entró» del conteo semanal se llena con lo que Maria sacó para esa tienda
const T0=Date.UTC(2026,10,3,15,0,0);
ok('saveConteo',{id:'c_alm00001',fecha:'2026-11-03',negocio:'La Barra Miraflores General',turno:'Semanal',items:P.map(p=>({pid:p.id,ini:0,ent:0,fin:5,src:''}))},G);
E.setClock(T0+3600000);
ok('saveAlmacen',{id:'a_aaaaaa6',tipo:'salida',destino:'La Barra Miraflores',items:[{pid:P[0].id,qty:2},{pid:P[1].id,qty:1.5}]},M);
const st=ok('startCount',{negocio:'La Barra Miraflores General'},G);
const tot={};st.entradas.forEach(e=>e.items.forEach(i=>tot[i.pid]=(tot[i.pid]||0)+i.qty));
assert.equal(tot[P[0].id],2);assert.equal(tot[P[1].id],1.5);
const st2=ok('startCount',{negocio:'La Barra Atalaya General'},G);assert.equal(st2.entradas.length,0);
console.log('t9 entró ok');
