# Arqueo Grupo La Barra

Sistema de conteo de inventario y arqueo contra ventas del POS (Google Apps Script + Google Sheets).

## Estructura
- `src/` código fuente (servidor `Code.template.gs`, pantalla en `js*.js`/`css*`, esqueleto HTML)
- `data/` catálogo semilla de productos
- `docs/` la pantalla publicada con GitHub Pages (`index.html`, copia de `dist/Index.html`)
- `dist/` archivos listos para pegar en Apps Script: `Code.gs` y `Index.html`
- `test/` pruebas (`node test/t1.js`, `node test/t2.js`; las e2e usan Playwright)
- `build.sh` regenera `dist/` desde `src/`

## Flujo de cambios
1. Editar `src/`, correr `./build.sh` y las pruebas.
2. Subir a GitHub (`dist/` incluido).
3. En el editor de Apps Script: pegar `dist/Code.gs` en `Código.gs` y `dist/Index.html` en `Index.html`, guardar.
4. Implementar → Gestionar implementaciones → lápiz → Versión nueva.

Versión actual: v7 (mermas y traspasos entre negocios).

## Publicación de la pantalla (GitHub Pages)
La pantalla se sirve desde GitHub Pages (Settings → Pages → rama `main`, carpeta `/docs`) y habla con Apps Script por POST (`doPost`).
Apps Script solo hace falta para el servidor: pegar `dist/Code.gs` y publicar versión nueva (acceso «Cualquiera»).
`Index.html` ya no se pega en Apps Script (se puede dejar o borrar).

## Roles
- **colaborador**: cuenta y registra entradas, mermas y traspasos de sus negocios.
- **lider**: lo mismo, más ver resultados y registrar/completar ventas (arqueo) solo de sus negocios. No rectifica ni anula.
- **admin**: todo. **gerencia**: panel y resultados de todos los negocios.
Los usuarios nuevos entran como colaborador hasta que administración les asigna rol y negocios en Equipo.
