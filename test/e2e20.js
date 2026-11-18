const fs=require('fs');let s=fs.readFileSync('ux1.js','utf8');
s=s.replace(/await m\.waitForSelector\('\.prow[\s\S]*$/,`
  const assert=require('assert');
  console.log(JSON.stringify(env.call('crearPersona',{nombre:'Sol Martínez',telefono:'8095551234',rol:'colaborador',negocios:['Food Shop']},A)).slice(0,80));
  env.call('crearPersona',{nombre:'Ana Gómez',telefono:'8295550000',rol:'admin'},A);
  const m2=await newUser(b);
  await m2.waitForSelector('#lg-nom');
  await m2.fill('#lg-nom','sol martinez');await m2.fill('#lg-tel','809-555-9999');await m2.click('[data-act=pn-sig]');await m2.waitForSelector('.banner.bad');
  console.log('mal:',await m2.innerText('.banner.bad'));
  await m2.fill('#lg-tel','809 555 1234');await m2.click('[data-act=pn-sig]');await m2.waitForSelector('#lg-pin2');
  await shot(m2,'pin_crear');
  await m2.fill('#lg-pin','1234');await m2.fill('#lg-pin2','1111');await m2.click('[data-act=pn-go]');await m2.waitForSelector('.banner.bad');
  console.log('distintos:',await m2.innerText('.banner.bad'));
  await m2.fill('#lg-pin','1234');await m2.fill('#lg-pin2','1234');await m2.click('[data-act=pn-go]');await m2.waitForSelector('.tabs, nav, [data-act=neg], .paso, .chip',{timeout:8000});
  console.log('dentro:',(await m2.innerText('body')).split(String.fromCharCode(10)).slice(0,6).join(' / '));
  // volver a entrar: solo PIN
  await m2.evaluate(()=>localStorage.setItem('arq-tok',''));await m2.reload();
  await m2.waitForSelector('#lg-pin',{timeout:5000});assert.equal(await m2.$('#lg-nom'),null,'no pide nombre');
  console.log('solo PIN:',(await m2.innerText('.panel')).split(String.fromCharCode(10)).slice(0,3).join(' / '));
  await m2.fill('#lg-pin','1234');await m2.click('[data-act=pn-go]');await m2.waitForSelector('[data-act=neg], .tchip, .chip',{timeout:8000});console.log('entró otra vez solo con PIN');
  await m2.evaluate(()=>localStorage.setItem('arq-tok',''));await m2.reload();await m2.waitForSelector('#lg-pin');await m2.click('[data-act=pn-atras]');await m2.waitForSelector('#lg-nom');console.log('No soy yo: pide nombre');
  // segundo teléfono: pide PIN
  const m3=await newUser(b);await m3.waitForSelector('#lg-nom');
  await m3.fill('#lg-nom','Sol Martínez');await m3.fill('#lg-tel','8095551234');await m3.click('[data-act=pn-sig]');await m3.waitForSelector('#lg-pin');
  assert.equal(await m3.$('#lg-pin2'),null,'solo un PIN');
  await m3.fill('#lg-pin','9999');await m3.click('[data-act=pn-go]');await m3.waitForSelector('.banner.bad');console.log('pin malo:',await m3.innerText('.banner.bad'));
  await m3.fill('#lg-pin','1234');await m3.click('[data-act=pn-go]');await m3.waitForSelector('.chip, [data-act=neg], .paso, .tabs, nav',{timeout:8000});console.log('entró con PIN');
  // admin no entra por aquí
  const m4=await newUser(b);await m4.waitForSelector('#lg-nom');await m4.fill('#lg-nom','Ana Gómez');await m4.fill('#lg-tel','8295550000');await m4.click('[data-act=pn-sig]');await m4.waitForSelector('.banner.bad');console.log('admin:',await m4.innerText('.banner.bad'));
  console.log(errors);await b.close();})();`);
fs.writeFileSync('e2e20run.js',s);
