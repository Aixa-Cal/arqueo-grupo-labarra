const fs=require('fs');let s=fs.readFileSync('ux1.js','utf8');
s=s.replace("['Food Shop']","['La Barra Atala']").replace(/await m\.waitForSelector\('\.prow[\s\S]*$/,`await m.waitForSelector('.turnos button');await m.click('.tchip');await m.click('[data-act=start]');await m.waitForSelector('.pcard');await m.waitForTimeout(500);
  const pid=await m.$eval('[data-f=fin]',e=>e.dataset.pid);
  await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="-1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="-1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="-1"]');
  console.log('v0',await m.inputValue('#i-'+pid+'-fin'));
  await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="1"]');await m.click('[data-act=stp][data-sp="'+pid+'"][data-sf=fin][data-d="1"]');
  console.log('v2',await m.inputValue('#i-'+pid+'-fin'));
  await m.evaluate(()=>window.scrollTo(0,250));await shot(m,'ux3');console.log(errors);await b.close();})();`);
fs.writeFileSync('ux2run.js',s);
