const {makeEnv}=require('./mock');
const assert=require('assert');
const E=makeEnv();
E.ctx.instalar();
const sent=[];
E.ctx.UrlFetchApp={fetch:(u,o)=>{const b=JSON.parse(o.payload);sent.push(b);return {getResponseCode:()=>202,getContentText:()=>'{}'}}};
const P=E.ctx.PropertiesService.getScriptProperties();
P.setProperty('BIRD_API_KEY','bk_us1_test');P.setProperty('WA_ACTIVO','si');
// RD = UTC-4. at(fecha, 'HH:mm') local
const at=(f,hm)=>{const [y,m,d]=f.split('-').map(Number);const [h,mi]=hm.split(':').map(Number);E.setClock(Date.UTC(y,m-1,d,h+4,mi));};
function tick(f,hm){at(f,hm);const r=E.ctx.waRevisar();return r;}
function last(n){return sent.slice(-n).map(s=>s.to+' '+s.template.slug+' '+JSON.stringify(s.template.parameters));}
// Wed 2026-11-18
let n0=sent.length; tick('2026-11-18','14:00');
let s=sent.slice(n0); console.log('Mié 2PM:\n '+s.map(x=>x.to+' '+x.template.parameters.nombre+' · '+x.template.parameters.tienda).join('\n '));
assert(s.some(x=>x.template.parameters.nombre==='Claribel'));   // Juanito libra miércoles
assert(s.some(x=>x.template.parameters.nombre==='Anabelle'&&x.template.parameters.tienda==='Food Shop')); // Sol libra miércoles
assert.equal(s.length,4);
// repeat tick: no duplicates
n0=sent.length; tick('2026-11-18','14:10'); assert.equal(sent.length,n0);
// one count done for Atala T1, then alerts at 15:30
E.sheets.Conteos.appendRow(['c1','2026-11-18','La Barra Atala','Turno 1 (7AM-3PM)','Claribel','x',1,'contado']);
n0=sent.length; tick('2026-11-18','15:30'); s=sent.slice(n0);
console.log('Mié 3:30PM alertas:\n '+s.map(x=>x.to+' '+x.template.parameters.nombre+' · '+x.template.parameters.tienda+' · '+x.template.parameters.persona).join('\n '));
assert(!s.some(x=>x.template.parameters.tienda==='La Barra Atala'));
// Wed 6AM: T3 de la noche del martes: Atala cerrado (Elvira libra martes), Miraflores Esperanza (libra miércoles → la noche del miércoles)
n0=sent.length; tick('2026-11-18','06:00'); s=sent.slice(n0);
console.log('Mié 6AM:',s.map(x=>x.template.parameters.nombre+' · '+x.template.parameters.tienda));
assert.equal(s.length,1); assert.equal(s[0].template.parameters.nombre,'Esperanza');
// Thu 6AM: Miraflores T3 → Lismell
n0=sent.length; tick('2026-11-19','06:00'); s=sent.slice(n0); console.log('Jue 6AM:',s.map(x=>x.template.parameters.nombre+' · '+x.template.parameters.tienda));
assert(s.some(x=>x.template.parameters.nombre==='Lismell'));
// Thu 7:30 resumen
n0=sent.length; tick('2026-11-19','07:30'); s=sent.slice(n0).filter(x=>x.template.slug==='resumen_conteos_diario');
console.log('Resumen:',JSON.stringify(s[0].template.parameters));
// Monday: ZP closed, Griselda 7AM, Leidy cover
n0=sent.length; tick('2026-11-23','07:00'); s=sent.slice(n0); console.log('Lun 7AM:',s.map(x=>x.template.parameters.nombre+' · '+x.template.parameters.tienda));
n0=sent.length; tick('2026-11-23','15:00'); assert.equal(sent.length,n0); // ZP cerrado lunes
n0=sent.length; tick('2026-11-23','22:00'); s=sent.slice(n0); console.log('Lun 10PM:',s.map(x=>x.template.parameters.nombre+' · '+x.template.parameters.tienda));
assert(s.some(x=>x.template.parameters.nombre==='Génesis'));assert(!s.some(x=>x.template.parameters.tienda==='Zona Presidente'));
// Tuesday 23:30 alert FS: no Anabelle
n0=sent.length; tick('2026-11-24','23:30'); s=sent.slice(n0); console.log('Mar 11:30PM:',s.map(x=>x.template.parameters.nombre+' · '+x.template.parameters.tienda));
assert(!s.some(x=>x.template.parameters.nombre==='Anabelle'));
// late (>60 min) not sent
n0=sent.length; tick('2026-11-25','16:45'); assert(!sent.slice(n0).some(x=>x.template.slug==='alerta_conteo_faltante'&&x.template.parameters.turno.startsWith('Turno 1')));
// prueba mode
P.setProperty('WA_PRUEBA','8299196334'); n0=sent.length; at('2026-11-25','10:00'); console.log('waPrueba:',E.ctx.waPrueba()); assert(sent.slice(n0).every(x=>x.to==='+18299196334'));
// apagado
P.setProperty('WA_ACTIVO','no'); n0=sent.length; tick('2026-11-26','14:00'); assert.equal(sent.length,n0);
console.log('log rows',E.sheets.WhatsApp.getLastRow());
console.log('WA OK');
