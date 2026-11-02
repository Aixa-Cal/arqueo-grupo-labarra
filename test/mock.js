const vm=require('vm'),fs=require('fs'),crypto=require('crypto');
function makeEnv(opts){
  opts=opts||{};
  const mails=[]; const cacheStore={}; const propStore={}; let clock=opts.clock||Date.UTC(2026,10,2,14,0,0); // 2026-11-02 10:00 DO
  const sheets={};
  function colToNum(){}
  class Range{constructor(sh,r,c,nr,nc){this.sh=sh;this.r=r;this.c=c;this.nr=nr;this.nc=nc}
    getValues(){const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++){const v=(this.sh.data[this.r-1+i]||[])[this.c-1+j];row.push(v===undefined?'':v)}o.push(row)}return o}
    setValues(v){for(let i=0;i<this.nr;i++){const rr=this.r-1+i;this.sh.data[rr]=this.sh.data[rr]||[];for(let j=0;j<this.nc;j++)this.sh.data[rr][this.c-1+j]=v[i][j]}return this}
    setValue(v){return this.setValues([[v]])}
    setFontWeight(){return this} setNumberFormat(){return this}}
  class Sheet{constructor(n){this.name=n;this.data=[]}
    getLastRow(){let l=0;this.data.forEach((r,i)=>{if(r&&r.some(x=>x!==''&&x!==undefined))l=i+1});return l}
    getMaxRows(){return 1000} setFrozenRows(){}
    getRange(r,c,nr,nc){return new Range(this,r,c,nr||1,nc||1)}
    appendRow(row){const l=this.getLastRow();this.data[l]=row.slice()}}
  const ss={getId:()=>'SS1',getSheetByName:n=>sheets[n]||null,insertSheet:n=>sheets[n]=new Sheet(n),getSheets:()=>Object.values(sheets),deleteSheet(){}};
  const triggers=[];
  const ctx={console,JSON,Math,Date:class extends Date{constructor(...a){a.length?super(...a):super(clock)} static now(){return clock}},
    SpreadsheetApp:{getActiveSpreadsheet:()=>ss,openById:()=>ss},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>propStore[k]||null,setProperty:(k,v)=>{propStore[k]=v}})},
    CacheService:{getScriptCache:()=>({get:k=>cacheStore[k]===undefined?null:cacheStore[k],put:(k,v)=>{cacheStore[k]=v},remove:k=>{delete cacheStore[k]},removeAll:ks=>ks.forEach(k=>delete cacheStore[k])})},
    LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
    MailApp:{sendEmail:m=>mails.push(m),getRemainingDailyQuota:()=>100-mails.length},
    Session:{getEffectiveUser:()=>({getEmail:()=>'dueno@gmail.com'})},
    ScriptApp:{getService:()=>({getUrl:()=>'https://script.google.com/macros/s/X/exec'}),getProjectTriggers:()=>triggers,deleteTrigger(){},newTrigger:()=>({timeBased:()=>({everyHours:()=>({create(){triggers.push({getHandlerFunction:()=>'revisarPendientes'})}})})})},
    ContentService:{MimeType:{TEXT:"TEXT"},createTextOutput:(t)=>({setMimeType(){return this},getContent:()=>t})},
    HtmlService:{createHtmlOutputFromFile:()=>({setTitle(){return this},addMetaTag(){return this},setXFrameOptionsMode(){return this}}),XFrameOptionsMode:{ALLOWALL:1}},
    Logger:{log(){}},
    Utilities:{
      formatDate:(d,tz,f)=>{const o=new Date(d.getTime()-4*3600000);const p=n=>String(n).padStart(2,'0');const Y=o.getUTCFullYear(),M=p(o.getUTCMonth()+1),D=p(o.getUTCDate());return f==='yyyy-MM-dd'?`${Y}-${M}-${D}`:f==='HH:mm'?`${p(o.getUTCHours())}:${p(o.getUTCMinutes())}`:`${Y}`},
      getUuid:()=>crypto.randomUUID(),
      DigestAlgorithm:{SHA_256:'sha256'},
      computeDigest:(a,s)=>Array.from(crypto.createHash('sha256').update(s).digest()).map(x=>x>127?x-256:x),
      computeHmacSha256Signature:(s,k)=>Array.from(crypto.createHmac('sha256',k).update(s).digest()).map(x=>x>127?x-256:x),
      base64EncodeWebSafe:x=>(typeof x==='string'?Buffer.from(x):Buffer.from(x.map(b=>b&255))).toString('base64url'),
      base64DecodeWebSafe:s=>Array.from(Buffer.from(s,'base64url')),
      newBlob:b=>({getDataAsString:()=>Buffer.from(b.map(x=>x&255)).toString()})
    }};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(__dirname+'/../dist/Code.gs','utf8'),ctx);
  return {ctx,mails,sheets,cacheStore,setClock:t=>{clock=t},getClock:()=>clock,
    call(a,p,t){if(a==='saveConteo'&&p&&p.negocio!=='Car Wash'&&p.cierre===undefined)p=Object.assign({cierre:{chk:[true,true,true,true,true,true],nov:'no',txt:''}},p);return JSON.parse(ctx.api(JSON.stringify({a,p,t})))}};
}
module.exports={makeEnv};
