const {makeEnv}=require('./mock');const assert=require('assert');
const E=makeEnv();const evs=[];
E.ctx.CalendarApp={getDefaultCalendar:()=>({createEvent:(t,a,b,o)=>{const e={t,a,b,o,removeAllReminders(){},addPopupReminder(m){e.pop=m}};evs.push(e);return e}})};
E.ctx.instalar();
let r=E.call('reqCode',{email:'dueno@gmail.com'});const code=E.mails[0].body.match(/\d{6}/)[0];
r=E.call('verifyCode',{email:'dueno@gmail.com',code});const T=r.data.token;
const base={chk:[true,true,true,true,true,true],nov:'si',txt:'Se dañó la plancha',cafe:{rell:'si',func:'si',txt:''},fz:{ok:'no',txt:'freezer 2 no enfría'},bano:{papel:'si',cli:'si',txt:''}};
// 11:00 PM RD → evento 8:00 AM siguiente
E.setClock(Date.UTC(2026,10,19,3,0));
r=E.call('saveConteo',{id:'c_cal00001',fecha:'2026-11-18',negocio:'Food Shop',turno:'Turno 2 (3PM-11PM)',items:[{pid:'fs-032',ini:1,ent:0,fin:1}],cierre:base},T);assert(r.ok,JSON.stringify(r));
console.log(evs[0].t,'|',new Date(evs[0].a).toISOString(),'|',evs[0].o.description);
assert.equal(new Date(evs[0].a).toISOString(),'2026-11-19T12:00:00.000Z');
// 2 PM → +5 min
E.setClock(Date.UTC(2026,10,19,18,0));
r=E.call('saveConteo',{id:'c_cal00002',fecha:'2026-11-19',negocio:'Food Shop',turno:'Turno 1 (7AM-3PM)',items:[{pid:'fs-032',ini:1,ent:0,fin:1}],cierre:Object.assign({},base,{nov:'no',txt:'',fz:{ok:'si',txt:''}})},T);assert(r.ok,JSON.stringify(r));
assert.equal(evs.length,1); // sin reporte → sin evento
console.log('CAL OK');
