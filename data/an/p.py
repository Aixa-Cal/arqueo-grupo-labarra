import json, re, glob, collections
res=json.load(open('res.json'))
cat={}
for fn in sorted(glob.glob('/home/claude/s/fs-*.json')):
    d=json.load(open(fn)); cat[fn.split('/')[-1][:-5]]=d
byname={d['nombre']:i for i,d in cat.items()}
# correcciones manuales de clasificación y de mapeo
EXCL={'BRUGAL DOBLE RESERVA – BASE (ML)'}                       # base en ML del bar
FORCE_FS={'Snickers','Milky Way','PERFUMADOR PINITO NEW CAR','PERFUMADOR PINITO LEATHER','EXTRA VIEJO MEDIANO  350ML','STOLI MEDIANO 350 ML','MALBOTO ICE - MLB ICE MIX BOX10'}
FORCE_FS|={r['name'] for r in res if re.match(r'^MALBORO',r['name'])}
MAP={'FS - HEINEKEN 12 oz':'Heineken 330 ml','FS - HEINEKEN 22 oz':'Heineken 650 ml','FS - COCA COLA':'Coca-Cola 400 ml','FS - SPRITE':'Sprite 400 ml',
 'FS - MERENGUE':'Country Club Merengue 400 ml','FS - FRAMBUESA':'Country Club Frambuesa 400 ml','FS - NARANJA':'Country Club Naranja 400 ml',
 'FS - MINUTE MAID':'Minute Maid Citrus Punch 500 ml','689 VINO - FS':'Vino 689','San Pellegrino Agua  250 ML':'Agua San Pellegrino 8.45 oz',
 'EXTRA VIEJO MEDIANO  350ML':'Brugal Extra Viejo 350 ml','MALBORO GOLD DE 10 -MLB GOLD 3.5 BOX10':'Marlboro Gold de 10',
 'MALBORO ROJO ESPECIAL DE 20 - MLB RED 3.5 BOX20':'Marlboro rojo especial de 20','MALBORO SUNSET MIX - MLB SUNSET MIX BOX10':'Marlboro Sunset Mix de 10',
 'MALBORO MENTA DE 10  -MLB CRAF 3 MNT SOFT10':'Marlboro menta de 10','MALBORO MENTA DE 20 -MLB CRAF 3 MNT BOX20':'Marlboro menta de 20',
 'MALBOTO ICE - MLB ICE MIX BOX10':'Marlboro Ice de 10','MALBORO ROJO ESPECIAL DE 10 - LMLB RED 3.5 BOX10':None,'STOLI MEDIANO 350 ML':None,
 'Snickers':'Snickers — chocolate','Milky Way':'Milky Way — chocolate','PERFUMADOR PINITO NEW CAR':'Pinito New Car','PERFUMADOR PINITO LEATHER':'Pinito Leather',
 'Gatorade Azul 20 oz - fardo x24':None,'CUBETAZO DURA FS':None,'CUBETAZO LIGHT FS':None,'Soda Enriquillo / Candada Dry 400 ml - fardo x12':'Soda amarga Enriquillo o Canada Dry 400 ml'}
fs=[]
for r in res:
    n=r['name']
    if n in EXCL: continue
    if r['grp'] in ('FS','FS?') or n in FORCE_FS:
        if n in MAP: pid=byname.get(MAP[n]) if MAP[n] else None
        else: pid=r['cid']
        fs.append((n,r['q'],pid))
print("filas FS",len(fs),"unidades",sum(q for _,q,_ in fs))
# merge por producto del catálogo
agg=collections.OrderedDict()
for n,q,pid in fs:
    key=pid or ('NOCAT:'+n)
    a=agg.setdefault(key,{'nombre':cat[pid]['nombre'] if pid else n,'cat':cat[pid]['cat'] if pid else 'Fuera del catálogo','q':0,'rows':[]})
    a['q']+=q; a['rows'].append(n)
items=sorted(agg.values(),key=lambda x:-x['q'])
tot=sum(i['q'] for i in items); cum=0; nA=nB=0
print("productos vendidos",len(items),"total",tot)
for k,i in enumerate(items,1):
    cum+=i['q']; i['cum']=cum/tot
    i['cls']='A' if (cum-i['q'])/tot<0.80 else ('B' if (cum-i['q'])/tot<0.95 else 'C')
A=[i for i in items if i['cls']=='A']; B=[i for i in items if i['cls']=='B']; C=[i for i in items if i['cls']=='C']
print("A",len(A),sum(i['q'] for i in A)/tot,"B",len(B),sum(i['q'] for i in B)/tot,"C",len(C),sum(i['q'] for i in C)/tot)
print("\nCLASE A:")
for k,i in enumerate(A,1): print(f"{k:2} {i['nombre'][:42]:42} {i['q']:5.0f} {i['q']/tot*100:5.1f}% cum {i['cum']*100:5.1f}%  [{i['cat'][:22]}]")
print("\nPor categoría (unidades):")
cc=collections.Counter()
for i in items: cc[i['cat']]+=i['q']
for c,q in cc.most_common(): print(f"  {c[:34]:34} {q:5.0f} {q/tot*100:5.1f}%")
sold=set(k for k in agg if not k.startswith('NOCAT:'))
nosale=[d for i,d in cat.items() if i not in sold]
print("\ncatálogo",len(cat),"con ventas",len(sold),"sin ventas",len(nosale))
bycat=collections.Counter(d['cat'] for d in nosale)
for c,q in bycat.most_common(): print(f"  sin ventas · {c[:30]:30} {q}")
print("\nFuera del catálogo:")
for i in items:
    if i['cat']=='Fuera del catálogo': print("  ",i['nombre'],i['q'])
print("\nSin ventas, alto riesgo:")
for d in nosale:
    if d['cat'] in ('Ron, vodka y whisky','Otros licores','Vinos','Espumantes','Cigarrillos','Tabaco calentado TEREA','VEEV','ZYN'): print("  ",d['cat'][:14],d['nombre'])
json.dump({'items':items},open('items.json','w'),ensure_ascii=False)
