import io, contextlib, json
with contextlib.redirect_stdout(io.StringIO()):
    exec(open('p.py').read())
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
F="Arial"
hf=Font(name=F,bold=True,color="FFFFFF",size=10); hfill=PatternFill("solid",start_color="1B6B55")
bf=Font(name=F,size=10); thin=Side(style="thin",color="D9E2DB"); bd=Border(bottom=thin)
def head(ws,row,cols,widths):
    for j,(c,w) in enumerate(zip(cols,widths),1):
        x=ws.cell(row,j,c); x.font=hf; x.fill=hfill; x.alignment=Alignment(wrap_text=True,vertical="center")
        ws.column_dimensions[x.column_letter].width=w
    ws.row_dimensions[row].height=30
wb=Workbook()
# ---- ABC
ws=wb.active; ws.title="ABC Food Shop"
head(ws,1,["#","Producto","Categoría","Unidades vendidas","% del total","% acumulado","Clase"],[5,46,30,14,12,13,8])
n=len(items); last=n+1
for k,i in enumerate(items,1):
    r=k+1
    ws.cell(r,1,k); ws.cell(r,2,i['nombre']); ws.cell(r,3,i['cat']); ws.cell(r,4,i['q'])
    ws.cell(r,5,f"=D{r}/SUM($D$2:$D${last})"); ws.cell(r,6,f"=SUM($D$2:D{r})/SUM($D$2:$D${last})")
    ws.cell(r,7,f'=IF(F{r}-E{r}<0.8,"A",IF(F{r}-E{r}<0.95,"B","C"))')
    ws.cell(r,5).number_format="0.0%"; ws.cell(r,6).number_format="0.0%"; ws.cell(r,4).number_format="#,##0"
    for j in range(1,8): ws.cell(r,j).font=bf; ws.cell(r,j).border=bd
    ws.cell(r,7).alignment=Alignment(horizontal="center")
ws.freeze_panes="A2"; ws.auto_filter.ref=f"A1:G{last}"
# ---- Sin ventas
w2=wb.create_sheet("Sin ventas")
head(w2,1,["Categoría","Producto del catálogo","Nota"],[32,46,60])
for r,d in enumerate(sorted(nosale,key=lambda d:(d['cat'],d['nombre'])),2):
    w2.cell(r,1,d['cat']); w2.cell(r,2,d['nombre']); w2.cell(r,3,"Sin ventas en el reporte; puede venderse con otro nombre en Citrus")
    for j in range(1,4): w2.cell(r,j).font=bf; w2.cell(r,j).border=bd
w2.freeze_panes="A2"
# ---- Cruce
w3=wb.create_sheet("Cruce Citrus")
head(w3,1,["Item en Citrus","Unidades","Grupo asignado","Producto del catálogo","Cruce"],[52,12,30,44,16])
fsmap={nm:(pid,q) for nm,q,pid in fs}
por_conf={'Chicharrón El Chef','FUNDA DE HIELO','VASO CON HIELO','CERVEZA OKTOBEER CANITA','JUGO MOTTS PEQUEÑO'}
rows=[]
for r in res:
    nm=r['name']
    if nm in fsmap:
        pid=fsmap[nm][0]
        g="Food Shop"; prod=cat[pid]['nombre'] if pid else "(no está en el catálogo)"
        conf="Sin catálogo" if not pid else ("Exacto" if (r['sc']>=0.95 and nm not in MAP) else ("Manual" if nm in MAP else "Aproximado"))
    elif r['grp']=='ZP': g,prod,conf="Zona Presidente (no analizado)","",""
    elif nm in EXCL: g,prod,conf="Excluido: base en ML del bar","",""
    elif nm in por_conf: g,prod,conf="Por confirmar","",""
    else: g,prod,conf="Bar / Café (excluido)","",""
    rows.append((nm,r['q'],g,prod,conf))
order={"Food Shop":0,"Por confirmar":1,"Zona Presidente (no analizado)":2}
rows.sort(key=lambda x:(order.get(x[2],3),-x[1]))
for k,rw in enumerate(rows,2):
    for j,v in enumerate(rw,1):
        c=w3.cell(k,j,v); c.font=bf; c.border=bd
    w3.cell(k,2).number_format="#,##0"
w3.freeze_panes="A2"; w3.auto_filter.ref=f"A1:E{len(rows)+1}"
# ---- Resumen
w0=wb.create_sheet("Resumen",0)
w0.column_dimensions["A"].width=64; w0.column_dimensions["B"].width=16
w0["A1"]="80/20 del Food Shop · Citrus, 01/10/2026 al 31/10/2026"; w0["A1"].font=Font(name=F,bold=True,size=14)
lines=[("Productos del Food Shop con ventas",f"=COUNTA('ABC Food Shop'!B2:B{last})"),
("Unidades vendidas (Food Shop)",f"=SUM('ABC Food Shop'!D2:D{last})"),
("Productos clase A (80% de las unidades)",f"=COUNTIF('ABC Food Shop'!G2:G{last},\"A\")"),
("Productos clase B (siguiente 15%)",f"=COUNTIF('ABC Food Shop'!G2:G{last},\"B\")"),
("Productos clase C (último 5%)",f"=COUNTIF('ABC Food Shop'!G2:G{last},\"C\")"),
("Productos del catálogo sin ventas en el reporte",f"=COUNTA('Sin ventas'!B2:B{len(nosale)+1})")]
for r,(a,b) in enumerate(lines,3):
    w0.cell(r,1,a).font=bf; c=w0.cell(r,2,b); c.font=Font(name=F,bold=True); c.number_format="#,##0"
notes=["Supuestos (revisar):",
"1. El reporte mezcla todo el local. Se tomó como Food Shop lo que lleva «FS» y los productos de venta al detalle que coinciden con tu catálogo.",
"2. Se excluyeron los ítems «- INVENTARIO» y los cafés, agua, mojito y la base de Brugal en ML (bar/café), y Zona Presidente (ZP).",
"3. El ranking es por UNIDADES, no por valor: el reporte no trae importes. Licores, cigarrillos y vapes pesan poco en unidades pero mucho en dinero.",
"4. «Por confirmar» (hoja Cruce Citrus): chicharrón, hielo, jugo Motts pequeño y cerveza Oktobeer; no se contaron.",
"5. El cruce Citrus → catálogo es automático; la columna Cruce marca los que son aproximados o manuales."]
for k,t in enumerate(notes,11):
    w0.cell(k,1,t).font=Font(name=F,bold=(k==11),size=10); w0.cell(k,1).alignment=Alignment(wrap_text=True,vertical="top")
    w0.merge_cells(start_row=k,start_column=1,end_row=k,end_column=2)
    if k>11: w0.row_dimensions[k].height=32
wb.save("Pareto_FoodShop_Octubre.xlsx")
