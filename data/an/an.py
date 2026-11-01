import csv, re, unicodedata, difflib, json, glob
rows=[]
with open('rep.csv',encoding='utf-8-sig') as f:
    for line in csv.reader(f):
        if len(line)<2: continue
        try: q=float(line[1].replace(',',''))
        except: continue
        rows.append((line[0].strip(),q))
print("filas",len(rows),"unidades",sum(q for _,q in rows))

def norm(s):
    s=unicodedata.normalize('NFD',s.lower()); s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    s=re.sub(r'\b(fs|zp|inventario|botella|plastica|plástica|caja|fardo|x12|x24|pequena|mediana|grande|bolsa|de|con|sabor|a)\b',' ',s)
    s=re.sub(r'[^a-z0-9. ]',' ',s); s=re.sub(r'\s+',' ',s).strip(); return s
# catálogo Food Shop desde los seeds
cat=[]
for fn in sorted(glob.glob('/home/claude/s/fs-*.json')):
    d=json.load(open(fn)); d['id']=fn.split('/')[-1][:-5]; cat.append(d)
cn=[(norm(d['nombre']),d) for d in cat]
def best(name):
    n=norm(name); sc=[(difflib.SequenceMatcher(None,n,c).ratio(),d) for c,d in cn]
    return max(sc,key=lambda x:x[0])

res=[]
for name,q in rows:
    up=name.upper()
    if re.match(r'^ZP\b',up) or re.match(r'^ZP-',up): grp='ZP'
    elif re.match(r'^FS\b',up) or re.search(r'(\bFS$)|(- FS$)',up): grp='FS'
    elif up.endswith('INVENTARIO'): grp='BAR'
    else: grp='?'
    sc,d=best(name)
    res.append(dict(name=name,q=q,grp=grp,sc=sc,cat=d['nombre'],c=d['cat'],cid=d['id']))
# resolver '?'
for r in res:
    if r['grp']=='?':
        r['grp']='FS?' if r['sc']>=0.72 and r['c'] not in ('Cervezas','Refrescos sin alcohol') else 'OTRO'
for g in ['FS','FS?','ZP','BAR','OTRO']:
    s=[r for r in res if r['grp']==g]; print(g,len(s),sum(r['q'] for r in s))
print("\n== FS? (retail sin prefijo, mapeados al catálogo) ==")
for r in res:
    if r['grp']=='FS?': print(f"{r['q']:6.0f} {r['name'][:48]:48} -> {r['cat'][:40]} ({r['sc']:.2f})")
print("\n== OTRO (no FS) ==")
for r in res:
    if r['grp']=='OTRO': print(f"{r['q']:6.0f} {r['name'][:50]:50} best={r['cat'][:32]} ({r['sc']:.2f})")
print("\n== FS con prefijo: baja confianza ==")
for r in res:
    if r['grp']=='FS' and r['sc']<0.8: print(f"{r['q']:6.0f} {r['name'][:50]:50} -> {r['cat'][:38]} ({r['sc']:.2f})")
json.dump(res,open('res.json','w'),ensure_ascii=False)
