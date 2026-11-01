import json,glob,re,unicodedata
def norm(s):
    s=unicodedata.normalize('NFD',s); s=''.join(c for c in s if unicodedata.category(c)!='Mn')
    return re.sub(r'[^a-z0-9]+',' ',s.lower()).strip()
crit=set(json.load(open('data/an/crit.json')))|{'fs-167','fs-168','fs-169'}
ps=[]
for f in sorted(glob.glob('data/s/*.json')):
    d=json.load(open(f)); pid=f.split('/')[-1][:-5]
    ps.append(dict(id=pid,n=d['nombre'],c=d.get('cat',''),u=d['unidad'],f=d['factor'],t=d['tol'],k=d.get('costo',0),cr=1 if pid in crit else 0,ng=d['negocios'],o=d['orden']))
res=json.load(open('data/an/res.json'))
al={}
for x in res:
    if x['grp'] in('FS','FS?') and x['sc']>=0.95: al[norm(x['name'])]=[norm(x['name']),x['cid'],x['name']]
for n,c in {'FS - MERENGUE':'fs-030','FS - FRAMBUESA':'fs-029','FS - SPRITE':'fs-028','FS - COCA COLA':'fs-027'}.items(): al[norm(n)]=[norm(n),c,n]
t=open('src/Code.template.gs').read()
t=t.replace('/*__SEED_PRODUCTOS__*/[]',json.dumps(ps,ensure_ascii=False,separators=(',',':')))
t=t.replace('/*__SEED_ALIAS__*/[]',json.dumps(list(al.values()),ensure_ascii=False,separators=(',',':')))
open('dist/Code.gs','w').write(t)
