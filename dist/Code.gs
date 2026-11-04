/**
 * ARQUEO LA BARRA — servidor (Google Apps Script)
 * Guarda todo en las hojas de esta misma hoja de cálculo.
 * Primera vez: ejecuta la función  instalar  una sola vez (ver instrucciones).
 */
var TZ = 'America/Santo_Domingo';
var TOKEN_DIAS = 60;

var H = {
  Usuarios: ['email', 'nombre', 'rol', 'estado', 'negocios', 'creado', 'aprobadoPor', 'ultimoAcceso', 'telefono', 'turnos'],
  Productos: ['id', 'nombre', 'cat', 'unidad', 'factor', 'tol', 'costo', 'critico', 'negocios', 'orden', 'activo'],
  Conteos: ['id', 'fecha', 'negocio', 'turno', 'resp', 'email', 'ts', 'estado', 'items', 'ventas', 'res', 'resumen', 'sin', 'ventasPor', 'ventasTs', 'rect', 'nota', 'cierre'],
  Entradas: ['id', 'fecha', 'negocio', 'resp', 'email', 'ts', 'nota', 'items', 'anulada', 'origen'],
  Movimientos: ['id', 'fecha', 'tipo', 'negocio', 'destino', 'motivo', 'detalle', 'resp', 'email', 'ts', 'items', 'estado', 'recPor', 'recTs', 'recItems', 'anulada'],
  Almacen: ['id', 'fecha', 'tipo', 'destino', 'items', 'nota', 'fotos', 'resp', 'email', 'ts', 'estado', 'hechoPor', 'hechoTs'],
  Produccion: ['id', 'fecha', 'tipo', 'datos', 'resp', 'email', 'ts'],
  CheckTurno: ['id', 'fecha', 'negocio', 'turno', 'datos', 'resp', 'email', 'ts'],
  Notificaciones: ['id', 'ts', 'para', 'tipo', 'titulo', 'texto', 'negocio', 'ref', 'leidoPor'],
  Bitacora: ['ts', 'email', 'accion', 'detalle'],
  Equivalencias: ['clave', 'pid', 'original'],
  Config: ['key', 'value']
};
var JSONC = { Usuarios: ['negocios', 'turnos'], Productos: ['negocios'], Conteos: ['items', 'ventas', 'res', 'resumen', 'sin', 'cierre'], Entradas: ['items'], Movimientos: ['items', 'recItems'], Almacen: ['items', 'fotos'], Produccion: ['datos'], CheckTurno: ['datos'], Notificaciones: ['leidoPor'] };
var NUMC = ['factor', 'tol', 'costo', 'critico', 'orden', 'activo', 'ts', 'rect', 'anulada', 'ventasTs', 'recTs'];
var TEXTC = ['id', 'fecha', 'email', 'turno', 'negocio', 'clave', 'pid', 'nombre', 'resp', 'ref'];

var SEED_PRODUCTOS = [{"id":"cf-01","n":"Vasos Nescafé #8","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":200},{"id":"cf-02","n":"Vasos Nescafé #6","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":201},{"id":"cf-03","n":"Tapas Nescafé #6","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":202},{"id":"cf-04","n":"Tapas Nescafé #8","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":203},{"id":"cf-05","n":"Café en grano - Nescafé","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":204},{"id":"cf-06","n":"Polvo French Vanilla - Nescafé","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":205},{"id":"cf-07","n":"Polvo Latte - Nescafé","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":206},{"id":"cf-08","n":"Polvo Chocolate - Nescafé","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":207},{"id":"cf-09","n":"Bastones de azúcar Nescafé","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":208},{"id":"cf-10","n":"Removedores Nescafé","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":209},{"id":"cf-11","n":"Santo Domingo #8","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":210},{"id":"cf-12","n":"Santo Domingo #6","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":211},{"id":"cf-13","n":"Tapas Santo Domingo #6","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":212},{"id":"cf-14","n":"Tapas Santo Domingo #8","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":213},{"id":"cf-15","n":"Café en grano - Santo Domingo","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":214},{"id":"cf-16","n":"Polvo Capuccino - Santo Domingo","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":215},{"id":"cf-17","n":"Polvo Caramel Capuccino - Santo Domingo","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":216},{"id":"cf-18","n":"Polvo Chocolate - Santo Domingo","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":217},{"id":"cf-19","n":"Bastones de azúcar Santo Domingo","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":218},{"id":"cf-20","n":"Removedores Santo Domingo","c":"Insumos para café","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["Food Shop General"],"o":219},{"id":"fs-001","n":"Red Bull 250 ml","c":"Energizantes","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":37},{"id":"fs-002","n":"911 400 ml","c":"Energizantes","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":38},{"id":"fs-003","n":"Vive 100","c":"Energizantes","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":39},{"id":"fs-004","n":"Fireball Blazin Apple 50 ml","c":"Bebidas alcohólicas listas para tomar","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":40},{"id":"fs-005","n":"Fireball Original 50 ml","c":"Bebidas alcohólicas listas para tomar","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":41},{"id":"fs-006","n":"Four Loko Purple 355 ml","c":"Bebidas alcohólicas listas para tomar","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":42},{"id":"fs-007","n":"Four Loko Sandía 355 ml","c":"Bebidas alcohólicas listas para tomar","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":43},{"id":"fs-008","n":"Four Loko Gold 355 ml","c":"Bebidas alcohólicas listas para tomar","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":44},{"id":"fs-009","n":"Four Loko Blue 355 ml","c":"Bebidas alcohólicas listas para tomar","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":45},{"id":"fs-010","n":"BuzzBallz Chili Mango 200 ml","c":"Bebidas alcohólicas listas para tomar","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":46},{"id":"fs-011","n":"BuzzBallz Strawberry Rita 200 ml","c":"Bebidas alcohólicas listas para tomar","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":47},{"id":"fs-012","n":"Motts Manzana 10 oz","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":48},{"id":"fs-013","n":"Soda amarga Enriquillo o Canada Dry 400 ml","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":49},{"id":"fs-014","n":"Tónica Enriquillo o Canada Dry 400 ml","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":50},{"id":"fs-015","n":"San Pellegrino Zero Pomegranate Orange 330 ml","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":51},{"id":"fs-016","n":"San Pellegrino Aranciata 330 ml","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":52},{"id":"fs-017","n":"San Pellegrino Limone Menta 330 ml","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":53},{"id":"fs-018","n":"San Pellegrino Zero Peach Clementine 330 ml","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":54},{"id":"fs-019","n":"Agua San Pellegrino 8.45 oz","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":55},{"id":"fs-020","n":"Agua de coco con trozos, 11.8 oz — Goya","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":56},{"id":"fs-021","n":"Agua Dasani 20 oz","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":57},{"id":"fs-022","n":"Minute Maid Citrus Punch 500 ml","c":"Jugos, agua y mezcladores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":58},{"id":"fs-023","n":"Gatorade Cool Grape 20 oz","c":"Bebidas hidratantes","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":59},{"id":"fs-024","n":"Gatorade Fruit Punch 20 oz","c":"Bebidas hidratantes","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":60},{"id":"fs-025","n":"Gatorade Uva 20 oz","c":"Bebidas hidratantes","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":61},{"id":"fs-026","n":"Gatorade Naranja 20 oz","c":"Bebidas hidratantes","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":62},{"id":"fs-027","n":"Coca-Cola 400 ml","c":"Refrescos sin alcohol","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":63},{"id":"fs-028","n":"Sprite 400 ml","c":"Refrescos sin alcohol","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":64},{"id":"fs-029","n":"Country Club Frambuesa 400 ml","c":"Refrescos sin alcohol","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":65},{"id":"fs-030","n":"Country Club Merengue 400 ml","c":"Refrescos sin alcohol","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":66},{"id":"fs-031","n":"Country Club Naranja 400 ml","c":"Refrescos sin alcohol","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":67},{"id":"fs-032","n":"Presidente Dura 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":68},{"id":"fs-033","n":"Presidente Light 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":69},{"id":"fs-034","n":"Corona Extra 330 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":70},{"id":"fs-035","n":"Michelob Ultra 355 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":71},{"id":"fs-036","n":"The One 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":72},{"id":"fs-037","n":"Modelo Especial 355 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":73},{"id":"fs-038","n":"Modelo Negra 355 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":74},{"id":"fs-039","n":"Stella Artois 330 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":75},{"id":"fs-040","n":"Corona Cero 355 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":76},{"id":"fs-041","n":"Brahma Light 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":77},{"id":"fs-042","n":"Bohemia Especial 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":78},{"id":"fs-043","n":"Presidente Dura 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":79},{"id":"fs-044","n":"Presidente Light 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":80},{"id":"fs-045","n":"The One 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":81},{"id":"fs-046","n":"Brahma Light 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":82},{"id":"fs-047","n":"Bohemia Especial 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":83},{"id":"fs-048","n":"Coors Original 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":84},{"id":"fs-049","n":"Heineken 0.0 330 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":85},{"id":"fs-050","n":"Heineken 330 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":86},{"id":"fs-051","n":"Heineken 650 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":87},{"id":"fs-052","n":"Brugal Extra Viejo 700 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":88},{"id":"fs-053","n":"Brugal Extra Viejo 350 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":89},{"id":"fs-054","n":"Brugal Doble Reserva 700 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":90},{"id":"fs-055","n":"Brugal Doble Reserva 350 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":91},{"id":"fs-056","n":"Brugal Triple Reserva 700 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":92},{"id":"fs-057","n":"Brugal XV Reserva 700 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":93},{"id":"fs-058","n":"Brugal XV 350 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":94},{"id":"fs-059","n":"Stolichnaya 750 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":95},{"id":"fs-060","n":"Stolichnaya 375 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":96},{"id":"fs-061","n":"Stolichnaya miniatura 50 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":97},{"id":"fs-062","n":"Johnnie Walker Black Label 750 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":98},{"id":"fs-063","n":"Johnnie Walker Black Label 200 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":99},{"id":"fs-064","n":"Johnnie Walker Black miniatura 50 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":100},{"id":"fs-065","n":"Ron León Jimenez 110","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":101},{"id":"fs-066","n":"Ron León Jimenez 1903","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":102},{"id":"fs-067","n":"Johnnie Walker Blue Label","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":103},{"id":"fs-068","n":"Buchanan's Master","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":104},{"id":"fs-069","n":"Buchanan's 15 años","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":105},{"id":"fs-070","n":"The Glenlivet","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":106},{"id":"fs-071","n":"Glenfiddich","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":107},{"id":"fs-072","n":"Patrón XO Café","c":"Otros licores","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":108},{"id":"fs-073","n":"Vino 19 Crimes","c":"Vinos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":109},{"id":"fs-074","n":"Vino Robert Mondavi","c":"Vinos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":110},{"id":"fs-075","n":"Vino 689","c":"Vinos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":111},{"id":"fs-076","n":"Vino Beringer Merlot","c":"Vinos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":112},{"id":"fs-077","n":"Vino Beringer White Zinfandel","c":"Vinos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":113},{"id":"fs-078","n":"Vino Marqués de Riscal","c":"Vinos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":114},{"id":"fs-079","n":"Moët & Chandon Blue","c":"Espumantes","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":115},{"id":"fs-080","n":"Moët & Chandon Rosé Impérial","c":"Espumantes","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":116},{"id":"fs-081","n":"Moët & Chandon Ice Impérial","c":"Espumantes","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":117},{"id":"fs-082","n":"Ice Black Cherry — botella plástica","c":"Bebidas Ice","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":118},{"id":"fs-083","n":"Ice Peach Nectarine — botella plástica","c":"Bebidas Ice","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":119},{"id":"fs-084","n":"Ice Coconut Pineapple — botella plástica","c":"Bebidas Ice","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":120},{"id":"fs-085","n":"Ice Fruit Punch — botella plástica","c":"Bebidas Ice","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":121},{"id":"fs-086","n":"Lays Queso Blanco 55 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":122},{"id":"fs-087","n":"Lay Sal 55 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":123},{"id":"fs-088","n":"Natuchips Caribas Sal 55 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":124},{"id":"fs-089","n":"Ruffles Cheddar 55 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":125},{"id":"fs-090","n":"Doritos Nacho 70 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":126},{"id":"fs-091","n":"Doritos Nacho 140 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":127},{"id":"fs-092","n":"Mofongo 65 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":128},{"id":"fs-093","n":"Salsa Tostitos Mild Red 15.5 oz","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":129},{"id":"fs-094","n":"Cheetos Crunchy 85 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":130},{"id":"fs-095","n":"Tostitos Santa Elena 225 g","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":131},{"id":"fs-096","n":"Salsa Tostito Santa Elena","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":132},{"id":"fs-097","n":"Snickers — chocolate","c":"Chocolates","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":133},{"id":"fs-098","n":"Milky Way — chocolate","c":"Chocolates","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":134},{"id":"fs-099","n":"Hershey Cookie — chocolate","c":"Chocolates","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":135},{"id":"fs-100","n":"Chocolate Más Más","c":"Chocolates","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":136},{"id":"fs-101","n":"Chocolate Rocky Kid","c":"Chocolates","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":137},{"id":"fs-102","n":"M&M Original","c":"Chocolates","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":138},{"id":"fs-103","n":"M&M Maní","c":"Chocolates","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":139},{"id":"fs-104","n":"M&M Peanut Butter","c":"Chocolates","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":140},{"id":"fs-105","n":"Pringles Original 37 g","c":"Pringles","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":141},{"id":"fs-106","n":"Pringles Queso 37 g","c":"Pringles","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":142},{"id":"fs-107","n":"Pringles Crema y Cebolla 37 g","c":"Pringles","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":143},{"id":"fs-108","n":"Doublemint — chicle","c":"Gomas de mascar","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":144},{"id":"fs-109","n":"Trident Menta Blanca","c":"Gomas de mascar","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":145},{"id":"fs-110","n":"Galletas Biscoff 250 g","c":"Galletas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":146},{"id":"fs-111","n":"Galletas Hatuey","c":"Galletas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":147},{"id":"fs-112","n":"Club Social Original","c":"Galletas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":148},{"id":"fs-113","n":"Club Social Integral","c":"Galletas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":149},{"id":"fs-114","n":"Galletas Oreo","c":"Galletas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":150},{"id":"fs-115","n":"Nissin Sopa de Pollo","c":"Sopas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":151},{"id":"fs-116","n":"Sopa de pollo Issima","c":"Sopas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":152},{"id":"fs-117","n":"Snack de maní con pasas, 35 g","c":"Barras y frutos secos","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":153},{"id":"fs-118","n":"Nutri-Grain Cinnamon Apple","c":"Barras y frutos secos","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":154},{"id":"fs-119","n":"Nutri-Grain Blueberry","c":"Barras y frutos secos","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":155},{"id":"fs-120","n":"Nutri-Grain Strawberry","c":"Barras y frutos secos","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":156},{"id":"fs-121","n":"R/S Pistachios 1.5 oz","c":"Barras y frutos secos","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":157},{"id":"fs-122","n":"Nature Valley Sweet & Salty Chocolate Bar","c":"Barras y frutos secos","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":158},{"id":"fs-123","n":"Nosotras Nocturnas","c":"Higiene y cuidado personal","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":159},{"id":"fs-124","n":"Nosotras Invisible","c":"Higiene y cuidado personal","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":160},{"id":"fs-125","n":"Trojan Pro-Tech, paquete de 3","c":"Higiene y cuidado personal","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":161},{"id":"fs-126","n":"Trojan Magnum lubricado, paquete de 3","c":"Higiene y cuidado personal","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":162},{"id":"fs-127","n":"Trojan Ecstacy texturizado","c":"Higiene y cuidado personal","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":163},{"id":"fs-128","n":"Sumigran normal azul","c":"Medicamentos","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":164},{"id":"fs-129","n":"Sumigran Plus naranja","c":"Medicamentos","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":165},{"id":"fs-130","n":"Pinito New Car","c":"Ambientadores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":166},{"id":"fs-131","n":"Pinito Black Ice","c":"Ambientadores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":167},{"id":"fs-132","n":"Pinito Leather","c":"Ambientadores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":168},{"id":"fs-133","n":"Pinito Vainilla","c":"Ambientadores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":169},{"id":"fs-134","n":"Pinito Cinnamon Apple","c":"Ambientadores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":170},{"id":"fs-135","n":"Vent Wrap Vainilla","c":"Ambientadores","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":171},{"id":"fs-136","n":"Líquido de guía HS 12 oz","c":"Automotriz","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":172},{"id":"fs-137","n":"Aumentador de octanaje HS 12 oz","c":"Automotriz","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":173},{"id":"fs-138","n":"Tratamiento gasolina HS 12 oz","c":"Automotriz","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":174},{"id":"fs-139","n":"Tratamiento diésel HS 12 oz","c":"Automotriz","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":175},{"id":"fs-140","n":"Líquido de frenos HS DOT3 12 oz","c":"Automotriz","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":176},{"id":"fs-141","n":"Medidor de aire Crystal 50 PSI","c":"Automotriz","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":177},{"id":"fs-142","n":"Coolant verde Crystal HD, galón","c":"Automotriz","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":178},{"id":"fs-143","n":"MLB ARCI FUSION BOX20","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":179},{"id":"fs-144","n":"Marlboro rojo Crafted de 20","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":180},{"id":"fs-145","n":"Marlboro rojo Crafted de 10","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":181},{"id":"fs-146","n":"Marlboro menta de 20","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":182},{"id":"fs-147","n":"Marlboro menta de 10","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":183},{"id":"fs-148","n":"Marlboro Gold de 10","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":184},{"id":"fs-149","n":"Marlboro Gold de 20","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":185},{"id":"fs-150","n":"Marlboro Ice de 10","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":186},{"id":"fs-151","n":"Marlboro rojo especial de 20","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":187},{"id":"fs-152","n":"Marlboro Sunset Mix de 10","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":188},{"id":"fs-153","n":"L&M Forward","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":189},{"id":"fs-154","n":"L&M Samba","c":"Cigarrillos","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":190},{"id":"fs-155","n":"TEREA Sienna BOX10","c":"Tabaco calentado TEREA","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":191},{"id":"fs-156","n":"TEREA Yellow BOX10","c":"Tabaco calentado TEREA","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":192},{"id":"fs-157","n":"TEREA Zesty Mint BOX10","c":"Tabaco calentado TEREA","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":193},{"id":"fs-158","n":"VEEV N.SML Blue Mint 3.5%","c":"VEEV","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":194},{"id":"fs-159","n":"VEEV N.SML Watermelon 3.5%","c":"VEEV","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":195},{"id":"fs-160","n":"VEEV One Space Grey","c":"VEEV","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":196},{"id":"fs-161","n":"ZYN Black Cherry 3 mg","c":"ZYN","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":197},{"id":"fs-162","n":"ZYN Black Cherry 6 mg","c":"ZYN","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":198},{"id":"fs-163","n":"ZYN Cool Mint 3 mg","c":"ZYN","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":199},{"id":"fs-164","n":"ZYN Cool Mint 6 mg","c":"ZYN","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":200},{"id":"fs-165","n":"ZYN Spear Mint 3 mg","c":"ZYN","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":201},{"id":"fs-166","n":"ZYN Spear Mint 6 mg","c":"ZYN","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":202},{"id":"fs-167","n":"Chicharrón El Chef","c":"Papitas y salsas","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":132.5},{"id":"fs-168","n":"Gatorade Cool Blue 20 oz","c":"Bebidas hidratantes","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":62.5},{"id":"fs-169","n":"Stolichnaya 350 ml","c":"Ron, vodka y whisky","u":"unid","f":1,"t":0.02,"k":0,"cr":1,"ng":["Food Shop","Food Shop General"],"o":96.5},{"id":"fs-170","n":"Miller 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":88},{"id":"fs-171","n":"Miller 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Food Shop","Food Shop General"],"o":89},{"id":"ga-001","n":"Aceite (manteca)","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":300},{"id":"ga-002","n":"Aceite Oliva","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":301},{"id":"ga-003","n":"Alitas de Pollo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":302},{"id":"ga-004","n":"Axión Lavaplatos","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":303},{"id":"ga-005","n":"Azúcar","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":304},{"id":"ga-006","n":"Azúcar de Sobre para Café","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":305},{"id":"ga-007","n":"Botella de Agua","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":306},{"id":"ga-008","n":"Brillo Verde","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":307},{"id":"ga-009","n":"Café Maquina","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":308},{"id":"ga-010","n":"Caja Familiar","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":309},{"id":"ga-011","n":"Caramel Cappuccino","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":310},{"id":"ga-012","n":"Carne Angus","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":311},{"id":"ga-013","n":"Carne de Chicken Hamburguesa","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":312},{"id":"ga-014","n":"Cebolla","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":313},{"id":"ga-015","n":"Cereza","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":314},{"id":"ga-016","n":"China","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":315},{"id":"ga-017","n":"Chinola","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":316},{"id":"ga-018","n":"Cinta Adhesiva","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":317},{"id":"ga-019","n":"Ciruelas Pasas S/semilla","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":318},{"id":"ga-020","n":"Cloro Galón","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":319},{"id":"ga-021","n":"Cocoa Amarga","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":320},{"id":"ga-022","n":"Desengrasante","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":321},{"id":"ga-023","n":"Desinfectante","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":322},{"id":"ga-024","n":"Fresa Empacada","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":323},{"id":"ga-025","n":"Funda de Papel Sándwiches","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":324},{"id":"ga-026","n":"Funda Azul Jugos","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":325},{"id":"ga-027","n":"Funda para Basura","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":326},{"id":"ga-028","n":"Fundas Blancas Pequeñas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":327},{"id":"ga-029","n":"Fundas de Hielo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":328},{"id":"ga-030","n":"Guantes de Latex","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":329},{"id":"ga-031","n":"Talonario de Comanda","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":330},{"id":"ga-032","n":"Azucar Splenda","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":331},{"id":"ga-033","n":"Desembolsos","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":332},{"id":"ga-034","n":"Guineos Maduros","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":333},{"id":"ga-035","n":"Huevos","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":334},{"id":"ga-036","n":"Jamón de Cerdo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":335},{"id":"ga-037","n":"Jamón de Pavo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":336},{"id":"ga-038","n":"Kétchup Lata","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":337},{"id":"ga-039","n":"Kétchup Sobre Caja 500 Unid.","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":338},{"id":"ga-040","n":"Leche Cardinal","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":339},{"id":"ga-041","n":"Leche para Café 3% Grasa","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":340},{"id":"ga-042","n":"Leche Listamilk Salsa de Queso","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":341},{"id":"ga-043","n":"Lechosa","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":342},{"id":"ga-044","n":"Lechuga Repollada","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":343},{"id":"ga-045","n":"Limón","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":344},{"id":"ga-046","n":"Lulo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":345},{"id":"ga-047","n":"Mango","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":346},{"id":"ga-048","n":"Margarina Manicera Tarro","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":347},{"id":"ga-049","n":"Mascarilla","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":348},{"id":"ga-050","n":"Mayonesa Galón","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":349},{"id":"ga-051","n":"Melón","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":350},{"id":"ga-052","n":"Mostaza Galón","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":351},{"id":"ga-053","n":"Grapas Grapadora","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":352},{"id":"ga-054","n":"Pan Cuadrado","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":353},{"id":"ga-055","n":"Pan de Agua","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":354},{"id":"ga-056","n":"Pan Frances","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":355},{"id":"ga-057","n":"Pan Hamburguesa","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":356},{"id":"ga-058","n":"Pan Integral","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":357},{"id":"ga-059","n":"Papas para Freír Libras","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":358},{"id":"ga-060","n":"Papel de Baño Manos E Inodoro","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":359},{"id":"ga-061","n":"Papel de Impresora Caja","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":360},{"id":"ga-062","n":"Papel de Impresora Pedidos Ya","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":361},{"id":"ga-063","n":"Papel de Baño Inodoro","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":362},{"id":"ga-064","n":"Gel Antibacterial","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":363},{"id":"ga-065","n":"Gorros Desechables","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":364},{"id":"ga-066","n":"Granadillo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":365},{"id":"ga-067","n":"Fundas Blancas Grandes/ Azul","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":366},{"id":"ga-068","n":"Guanábana","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":367},{"id":"ga-069","n":"Papel Encerado","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":368},{"id":"ga-070","n":"Pechuguitas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":369},{"id":"ga-071","n":"Pepinillos Verdes","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":370},{"id":"ga-072","n":"Salsa Buffalo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":371},{"id":"ga-073","n":"Piña","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":372},{"id":"ga-074","n":"Puerro","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":373},{"id":"ga-075","n":"Queso Cheddar","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":374},{"id":"ga-076","n":"Queso Danés","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":375},{"id":"ga-077","n":"Refresco Coca Cola Botella","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":376},{"id":"ga-078","n":"Removedores de Café","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":377},{"id":"ga-079","n":"Repollo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":378},{"id":"ga-080","n":"Salami Genoa","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":379},{"id":"ga-081","n":"Salami Induveca","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":380},{"id":"ga-082","n":"Carne de Chimi","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":381},{"id":"ga-083","n":"Salsa Bbq","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":382},{"id":"ga-084","n":"Salsa Cheddar","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":383},{"id":"ga-085","n":"Salsa China","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":384},{"id":"ga-086","n":"Salsa Honey Mustard","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":385},{"id":"ga-087","n":"Salsa Rosada","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":386},{"id":"ga-088","n":"Servilletas Blancas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":387},{"id":"ga-089","n":"Pierna Empacada","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":388},{"id":"ga-090","n":"Pollo Empacado","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":389},{"id":"ga-091","n":"Crema Empacada","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":390},{"id":"ga-092","n":"Sorbetes","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":391},{"id":"ga-093","n":"Palillos Cortos","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":392},{"id":"ga-094","n":"Palillos Largos","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":393},{"id":"ga-095","n":"Cocoa Sobrino","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":394},{"id":"ga-096","n":"Tamarindo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":395},{"id":"ga-097","n":"Tortilla Wrap","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":396},{"id":"ga-098","n":"Tenedores","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":397},{"id":"ga-099","n":"Toallas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":398},{"id":"ga-100","n":"Tocineta","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":399},{"id":"ga-101","n":"Tomate","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":400},{"id":"ga-102","n":"Tapas p/vasos 16 Onzas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":401},{"id":"ga-103","n":"Vasos 16 Onzas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":402},{"id":"ga-104","n":"Vasos 7 Onzas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":403},{"id":"ga-105","n":"Vinagre","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":404},{"id":"ga-106","n":"Zapote","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":405},{"id":"ga-107","n":"Canela","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":406},{"id":"ga-108","n":"Pimienta","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":407},{"id":"ga-109","n":"Caja de Pechuga de Pollo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":408},{"id":"ga-110","n":"Caja de Alas de Pollo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":409},{"id":"ga-111","n":"Salsa de Ajo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":410},{"id":"ga-112","n":"Plato Papa Suprema","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":411},{"id":"ga-113","n":"Plato Barra Club","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":412},{"id":"ga-114","n":"Plato Peq. Papas Fritas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":413},{"id":"ga-115","n":"Barquito Papas Fritas","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":414},{"id":"ga-116","n":"Jabon de Cuaba","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":415},{"id":"ga-117","n":"Servilletas Marrones","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":416},{"id":"ga-118","n":"Sandia Limon","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":417},{"id":"ga-119","n":"Envase de Aderezo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":418},{"id":"ga-120","n":"Tapas de Aderezo","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":419},{"id":"ga-121","n":"Zanahoria","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":420},{"id":"ga-122","n":"Albahaca","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":421},{"id":"ga-123","n":"Zumo de Chinola","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":422},{"id":"ga-124","n":"Zumo de Limon","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":423},{"id":"ga-125","n":"Talonario Inventario","c":"Almacén","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala General","La Barra Atalaya General","La Barra Miraflores General","Almacén"],"o":424},{"id":"lb-01","n":"Pan de agua","c":"Pan","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":1},{"id":"lb-02","n":"Pan francés","c":"Pan","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":2},{"id":"lb-03","n":"Pan brioche","c":"Pan","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":3},{"id":"lb-04","n":"Pan integral (fundas cerradas)","c":"Pan","u":"funda","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":4},{"id":"lb-05","n":"Pan integral (lonjas de funda abierta)","c":"Pan","u":"lonja","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":5},{"id":"lb-06","n":"Pan cuadrado (fundas cerradas)","c":"Pan","u":"funda","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":6},{"id":"lb-07","n":"Pan cuadrado (lonjas de funda abierta)","c":"Pan","u":"lonja","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":7},{"id":"lb-08","n":"Empaques de crema de pollo","c":"Proteínas","u":"empaque","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":8},{"id":"lb-09","n":"Empaques de pierna de pollo","c":"Proteínas","u":"empaque","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":9},{"id":"lb-10","n":"Empaques de cerdo","c":"Proteínas","u":"empaque","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":10},{"id":"lb-11","n":"Vasos 16 oz","c":"Vasos y tapas","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":11},{"id":"lb-12","n":"Tapas 16 oz","c":"Vasos y tapas","u":"unid","f":1,"t":0.05,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":12},{"id":"lb-13","n":"Cerveza Dura","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":13},{"id":"lb-14","n":"Cerveza Light","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":14},{"id":"lb-15","n":"Cerveza Corona","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":15},{"id":"lb-16","n":"Cerveza Corona 0","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":16},{"id":"lb-17","n":"Cerveza Modelo rubia","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":17},{"id":"lb-18","n":"Cerveza Modelo negra","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":18},{"id":"lb-19","n":"Cerveza One","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":19},{"id":"lb-20","n":"Cerveza Stella","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["La Barra Atala","La Barra Atalaya","La Barra Miraflores"],"o":20},{"id":"zp-01","n":"Presidente Dura 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":21},{"id":"zp-02","n":"Presidente Light 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":22},{"id":"zp-03","n":"Corona Extra 330 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":23},{"id":"zp-04","n":"Michelob Ultra 355 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":24},{"id":"zp-05","n":"The One 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":25},{"id":"zp-06","n":"Modelo Especial 355 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":26},{"id":"zp-07","n":"Modelo Negra 355 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":27},{"id":"zp-08","n":"Stella Artois 330 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":28},{"id":"zp-09","n":"Corona Cero 355 ml","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":29},{"id":"zp-10","n":"Brahma Light 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":30},{"id":"zp-11","n":"Bohemia Especial 12 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":31},{"id":"zp-12","n":"Presidente Dura 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":32},{"id":"zp-13","n":"Presidente Light 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":33},{"id":"zp-14","n":"The One 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":34},{"id":"zp-15","n":"Brahma Light 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":35},{"id":"zp-16","n":"Bohemia Especial 22 oz","c":"Cervezas","u":"unid","f":1,"t":0.02,"k":0,"cr":0,"ng":["Zona Presidente"],"o":36}];
var SEED_ALIAS = [["fs presidente dura 12 oz pequena","fs-032","FS - Presidente Dura 12 oz pequeña"],["fs presidente light 12 oz pequena","fs-033","FS - Presidente Light 12 oz pequeña"],["fs corona extra 330 ml","fs-034","FS - Corona Extra 330 ml"],["fs michelob ultra 355 ml","fs-035","FS - Michelob Ultra 355 ml"],["fs presidente dura 22 oz mediana","fs-043","FS - Presidente Dura 22 oz mediana"],["fs the one 12 oz","fs-036","FS - The One 12 oz"],["fs presidente light 22 oz mediana","fs-044","FS - Presidente Light 22 oz mediana"],["ruffles cheddar 55 g","fs-089","Ruffles Cheddar 55 g"],["mofongo 65 g","fs-092","Mofongo 65 g"],["trident menta blanca","fs-109","Trident Menta Blanca"],["fs stella artois 330 ml","fs-039","FS - Stella Artois 330 ml"],["lays sal 55 g","fs-087","Lays Sal 55 g"],["club social original","fs-112","Club Social Original"],["galletas oreo","fs-114","Galletas Oreo"],["fs modelo negra 355 ml","fs-038","FS - Modelo Negra 355 ml"],["galletas hatuey","fs-111","Galletas Hatuey"],["gatorade fruit punch 20 oz fardo x24","fs-024","Gatorade Fruit Punch 20 oz - fardo x24"],["san pellegrino zero pomegranate orange 330 ml","fs-015","San Pellegrino Zero Pomegranate & Orange 330 ml"],["lays queso blanco 55 g","fs-086","Lays Queso Blanco 55 g"],["club social integral","fs-113","Club Social Integral"],["gatorade naranja 20 oz fardo x24","fs-026","Gatorade Naranja 20 oz - fardo x24"],["gatorade uva 20 oz fardo x24","fs-025","Gatorade Uva 20 oz - fardo x24"],["ice black cherry botella plastica","fs-082","Ice Black Cherry - botella plástica"],["agua san pellegrino 8 45 oz","fs-019","Agua San Pellegrino 8.45 oz"],["fireball blazin apple 50 ml","fs-004","Fireball Blazin Apple 50 ml"],["motts manzana 10 oz caja x24","fs-012","Motts Manzana 10 oz - caja x24"],["ice coconut pineapple botella plastica","fs-084","Ice Coconut Pineapple - botella plástica"],["m m mani","fs-103","M&M Maní"],["buzzballz chili mango 200 ml","fs-010","BuzzBallz Chili Mango 200 ml"],["pringles queso 37 g","fs-106","Pringles Queso 37 g"],["ice fruit punch botella plastica","fs-085","Ice Fruit Punch - botella plástica"],["pringles original 37 g","fs-105","Pringles Original 37 g"],["sopa con sabor a pollo issima caja x12","fs-116","Sopa con Sabor a Pollo Issima - caja x12"],["cheetos crunchy 85 g","fs-094","Cheetos Crunchy 85 g"],["fireball original 50 ml","fs-005","Fireball Original 50 ml"],["fs brahma light 22 oz","fs-046","FS - Brahma Light 22 oz"],["nissin sopa de pollo","fs-115","Nissin Sopa de Pollo"],["pringles crema y cebolla 37 g","fs-107","Pringles Crema y Cebolla 37 g"],["veev n sml blue mint 3 5","fs-158","VEEV N.SML BLUE MINT 3.5%"],["fs brahma light 12 oz","fs-041","FS - Brahma Light 12 oz"],["m m original","fs-102","M&M Original"],["san pellegrino aranciata 330 ml","fs-016","San Pellegrino Aranciata 330 ml"],["911 400 ml fardo x12","fs-002","911 400 ml - fardo x12"],["buzzballz strawberry rita 200 ml","fs-011","BuzzBallz Strawberry Rita 200 ml"],["fs bohemia especial 12 oz","fs-042","FS - Bohemia Especial 12 oz"],["galletas biscoff 250g","fs-110","Galletas Biscoff 250g"],["ice peach nectarine botella plastica","fs-083","Ice Peach Nectarine - botella plástica"],["red bull 250 ml fardo x12","fs-001","Red Bull 250 ml - fardo x12"],["snack de mani con pasas 35 g","fs-117","Snack de maní con pasas 35 g"],["chocolate mas mas","fs-100","Chocolate Más Más"],["four loko gold 355 ml","fs-008","Four Loko Gold 355 ml"],["fs bohemia especial 22 oz","fs-047","FS - Bohemia Especial 22 oz"],["gatorade cool grape 20 oz fardo x24","fs-023","Gatorade Cool Grape 20 oz - fardo x24"],["nutri grain strawberry","fs-120","Nutri-Grain STRAWBERRY"],["san pellegrino zero peach clementine 330 ml","fs-018","San Pellegrino Zero Peach & Clementine 330 ml"],["zyn black cherry 3mg","fs-161","ZYN BLACK CHERRY 3MG"],["zyn black cherry 6mg","fs-162","ZYN BLACK CHERRY 6MG"],["four loko purple 355 ml","fs-006","Four Loko Purple 355 ml"],["medidor aire crystal 50 psi","fs-141","MEDIDOR AIRE CRYSTAL 50 PSI"],["san pellegrino limone menta 330 ml","fs-017","San Pellegrino Limone & Menta 330 ml"],["zyn spear mint 6mg","fs-166","ZYN SPEAR MINT 6MG"],["chocolate rocky kid","fs-101","Chocolate Rocky Kid"],["coolant verde crystal hd galon","fs-142","COOLANT VERDE CRYSTAL HD GALON"],["fs corona cero 355 ml","fs-040","FS - Corona Cero 355 ml"],["nutri grain cinnamon apple","fs-118","Nutri-Grain CINNAMON APPLE"],["terea sienna box10","fs-155","TEREA SIENNA BOX10"],["terea yellow box10","fs-156","TEREA YELLOW BOX10"],["terea zesty mint box10","fs-157","TEREA ZESTY MINT BOX10"],["veev n sml watermelon 3 5","fs-159","VEEV N.SML WATERMELON 3.5%"],["zyn cool mint 3mg","fs-163","ZYN COOL MINT 3MG"],["fs merengue","fs-030","FS - MERENGUE"],["fs frambuesa","fs-029","FS - FRAMBUESA"],["fs sprite","fs-028","FS - SPRITE"],["fs coca cola","fs-027","FS - COCA COLA"]];

/* Negocios que cuentan «Había» (apertura) y «Quedan» (cierre) a mano. En los demás, «Había» es lo que dejó el conteo anterior. */
var DOBLE = ['Zona Presidente'];
/* Negocios sin POS: se controla el consumo por conteo, sin ventas */
var INSUMOS = ['Car Wash'];
/* Conteo general semanal del Food Shop (martes, lo hace supervisión): sin checklist de cierre, café ni freezers */
var GEN_LB = ['La Barra Atala General', 'La Barra Atalaya General', 'La Barra Miraflores General'];   // conteo semanal de almacén de La Barra (Griselda)
var SIN_CIERRE = ['Food Shop General'].concat(GEN_LB);
function SOLO_CONSUMO(n) { return INSUMOS.indexOf(n) > -1 || GEN_LB.indexOf(n) > -1; }
var CAT_CONSUMO = 'Insumos para café', CAT_ALMACEN = 'Almacén';   // dentro de ese conteo se controla solo el consumo, sin ventas
var INSUMOS_PRODUCTOS = [
  { id: 'cw-001', nombre: 'Shampoo (libras)', u: 'lb' },
  { id: 'cw-002', nombre: 'Desengrasante (libras)', u: 'lb' },
  { id: 'cw-003', nombre: 'Amorol (libras)', u: 'lb' },
  { id: 'cw-004', nombre: 'Lanilla', u: 'unid' },
  { id: 'cw-005', nombre: 'Esponja', u: 'unid' },
  { id: 'cw-006', nombre: 'Cera', u: 'unid' },
  { id: 'cw-007', nombre: 'Hidratante (galones)', u: 'gal' },
  { id: 'cw-008', nombre: 'Lija 2000', u: 'unid' },
  { id: 'cw-009', nombre: 'Lija 3000', u: 'unid' },
  { id: 'cw-010', nombre: 'Hidratante de motor', u: 'gal' },
  { id: 'cw-011', nombre: 'Hidratante de interior', u: 'gal' },
  { id: 'cw-012', nombre: 'Shampoo encerado', u: 'lb' }
];

var CONFIG_DEF = {
  negocios: ['La Barra Atala', 'La Barra Atalaya', 'La Barra Miraflores', 'Food Shop', 'Food Shop General', 'Almacén', 'La Barra Atala General', 'La Barra Atalaya General', 'La Barra Miraflores General', 'Zona Presidente', 'Car Wash'],
  turnos: {
    'La Barra Atala': ['Turno 1 (7AM-3PM)', 'Turno 2 (3PM-11PM)', 'Turno 3 (11PM-7AM)'],
    'La Barra Atalaya': ['Turno 1 (7AM-3PM)', 'Turno 2 (3PM-11PM)'],
    'La Barra Miraflores': ['Turno 1 (7AM-3PM)', 'Turno 2 (3PM-11PM)', 'Turno 3 (11PM-7AM)'],
    'Food Shop': ['Turno 1 (7AM-3PM)', 'Turno 2 (3PM-11PM)'],
    'Food Shop General': ['Semanal'],
    'Almacén': [],
    'La Barra Atala General': ['Semanal'], 'La Barra Atalaya General': ['Semanal'], 'La Barra Miraflores General': ['Semanal'],
    'Zona Presidente': ['Turno único (3PM-11PM)'],
    'Car Wash': []
  },
  /* El turno 3 (11PM-7AM) se cuenta al terminar, a las 7AM, y lleva la fecha de ese día */
  limites: {
    'La Barra Atala|Turno 1 (7AM-3PM)': '15:30', 'La Barra Atala|Turno 2 (3PM-11PM)': '23:30', 'La Barra Atala|Turno 3 (11PM-7AM)': '07:30',
    'La Barra Atalaya|Turno 1 (7AM-3PM)': '15:30', 'La Barra Atalaya|Turno 2 (3PM-11PM)': '23:30',
    'La Barra Miraflores|Turno 1 (7AM-3PM)': '15:30', 'La Barra Miraflores|Turno 2 (3PM-11PM)': '23:30', 'La Barra Miraflores|Turno 3 (11PM-7AM)': '07:30',
    'Food Shop|Turno 1 (7AM-3PM)': '15:30', 'Food Shop|Turno 2 (3PM-11PM)': '23:30',
    'Food Shop General|Semanal': '23:30',
    'La Barra Atala General|Semanal': '23:30', 'La Barra Atalaya General|Semanal': '23:30', 'La Barra Miraflores General|Semanal': '23:30',
    'Zona Presidente|Turno único (3PM-11PM)': '23:30'
  },
  calendario: { 'Food Shop General': [2], 'La Barra Atala General': [1], 'La Barra Atalaya General': [1], 'La Barra Miraflores General': [2] },
  /* Categorías que no se cuentan todos los días: {negocio: {categoría: [días 0=dom…6=sáb]}} */
  catDias: { 'La Barra Atala': { 'Cervezas': [1] }, 'La Barra Atalaya': { 'Cervezas': [1] }, 'La Barra Miraflores': { 'Cervezas': [1] } },
  avisos: { acceso: true, pendiente: true, critico: true, falta: true }
};

/* ============================ utilidades ============================ */
function fail(code, msg) { var e = new Error(msg || code); e.code = code; throw e; }
function props() { return PropertiesService.getScriptProperties(); }
function ssb() {
  var id = props().getProperty('SSID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function sheet(name) {
  var ss = ssb(), s = ss.getSheetByName(name);
  if (!s && H[name]) {   // hoja nueva de una versión posterior: se crea sola
    s = ss.insertSheet(name);
    s.getRange(1, 1, 1, H[name].length).setValues([H[name]]).setFontWeight('bold');
    s.setFrozenRows(1);
  }
  if (!s) fail('setup', 'Falta la hoja ' + name + '. Ejecuta la función instalar.');
  return s;
}
function now() { return new Date().getTime(); }
function hoy() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function fechaMas(f, d) {
  var p = f.split('-'); var dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + d));
  return dt.getUTCFullYear() + '-' + ('0' + (dt.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + dt.getUTCDate()).slice(-2);
}
function normEmail(e) {
  e = String(e || '').trim().toLowerCase();
  return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(e) ? e : '';
}
function normClave(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function r2(x, d) { var m = Math.pow(10, d || 2); return Math.round(x * m) / m; }
function num(v) { var n = Number(v); return isFinite(n) ? n : null; }
function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function sha(str) {
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return b.map(function (x) { return ('0' + (x < 0 ? x + 256 : x).toString(16)).slice(-2); }).join('');
}
function secret() {
  var s = props().getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props().setProperty('SECRET', s); }
  return s;
}
function appUrl() { try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; } }

/* ============================ tablas ============================ */
function headers(name) { return H[name]; }
function colIdx(name, col) { return H[name].indexOf(col); }
function parseJ(v, def) {
  if (v === '' || v == null) return def;
  try { return JSON.parse(v); } catch (e) { return def; }
}
function fromRow(name, row) {
  var h = H[name], o = {}, jc = JSONC[name] || [];
  for (var i = 0; i < h.length; i++) {
    var c = h[i], v = row[i];
    if (jc.indexOf(c) > -1) {
      var def = (c === 'ventas' || c === 'resumen') ? {} : [];
      o[c] = parseJ(v, def);
    } else if (NUMC.indexOf(c) > -1) { o[c] = v === '' || v == null ? 0 : Number(v); }
    else if (c === 'fecha') { o[c] = (v instanceof Date) ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v == null ? '' : v); }
    else { o[c] = v == null ? '' : (typeof v === 'string' ? v : String(v)); }
  }
  return o;
}
function toRow(name, o) {
  var h = H[name], jc = JSONC[name] || [], row = [];
  for (var i = 0; i < h.length; i++) {
    var c = h[i], v = o[c];
    if (jc.indexOf(c) > -1) {
      var s = JSON.stringify(v == null ? ((c === 'ventas' || c === 'resumen') ? {} : []) : v);
      if (s.length > 49000) fail('grande', 'Hay demasiados datos en un solo registro (' + c + ').');
      row.push(s);
    } else if (typeof v === 'string' && /^[=+\-@]/.test(v)) row.push(' ' + v);   // evita fórmulas inyectadas desde las hojas
    else row.push(v == null ? '' : v);
  }
  return row;
}
function readAll(name) {
  var s = sheet(name), last = s.getLastRow();
  if (last < 2) return [];
  var vals = s.getRange(2, 1, last - 1, H[name].length).getValues();
  return vals.map(function (r, i) { var o = fromRow(name, r); o._row = i + 2; return o; });
}
/* Solo las últimas n filas (las hojas crecen: nunca se lee toda la historia en cada sincronización) */
function readTail(name, n) {
  var s = sheet(name), last = s.getLastRow();
  if (last < 2) return [];
  var from = Math.max(2, last - n + 1);
  return s.getRange(from, 1, last - from + 1, H[name].length).getValues().map(function (r, i) { var o = fromRow(name, r); o._row = from + i; return o; });
}
function appendObj(name, o) { sheet(name).appendRow(toRow(name, o)); }
function writeRow(name, rowIdx, o) {
  sheet(name).getRange(rowIdx, 1, 1, H[name].length).setValues([toRow(name, o)]);
}
function findRowById(name, id) {
  var s = sheet(name), last = s.getLastRow();
  if (last < 2) return 0;
  var ids = s.getRange(2, 1, last - 1, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}
function readRowObj(name, rowIdx) {
  var r = sheet(name).getRange(rowIdx, 1, 1, H[name].length).getValues()[0];
  var o = fromRow(name, r); o._row = rowIdx; return o;
}
function bit(email, accion, detalle) {
  try { appendObj('Bitacora', { ts: now(), email: email, accion: accion, detalle: String(detalle || '').slice(0, 900) }); } catch (e) { }
}

/* ============================ config ============================ */
function cacheGet(k) {
  try { var v = CacheService.getScriptCache().get(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function cachePut(k, v, sec) {
  try { var s = JSON.stringify(v); if (s.length < 90000) CacheService.getScriptCache().put(k, s, sec); } catch (e) { }
}
function cacheDrop() {
  try { CacheService.getScriptCache().removeAll(['k_cfg', 'k_prods', 'k_users']); } catch (e) { }
}
function getConfig() {
  var hit = cacheGet('k_cfg');
  if (hit) return hit;
  var rows = readAll('Config'), c = {};
  rows.forEach(function (r) { try { c[r.key] = JSON.parse(r.value); } catch (e) { } });
  Object.keys(CONFIG_DEF).forEach(function (k) { if (c[k] == null) c[k] = JSON.parse(JSON.stringify(CONFIG_DEF[k])); });
  cachePut('k_cfg', c, 300);
  return c;
}
function getProductos() {
  var hit = cacheGet('k_prods');
  if (hit) return hit;
  var rows = readAll('Productos');
  cachePut('k_prods', rows, 300);
  return rows;
}
function setConfigKey(key, val) {
  var rows = readAll('Config'), row = 0;
  rows.forEach(function (r) { if (r.key === key) row = r._row; });
  var vals = [[key, JSON.stringify(val)]];
  if (row) sheet('Config').getRange(row, 1, 1, 2).setValues(vals);
  else sheet('Config').appendRow(vals[0]);
  cacheDrop();
}

/* ============================ instalación ============================ */
function instalar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  props().setProperty('SSID', ss.getId());
  props().setProperty('OWNER', Session.getEffectiveUser().getEmail().toLowerCase());
  secret();
  Object.keys(H).forEach(function (name) {
    var s = ss.getSheetByName(name);
    if (!s) s = ss.insertSheet(name);
    if (s.getLastRow() < 1) {
      s.getRange(1, 1, 1, H[name].length).setValues([H[name]]).setFontWeight('bold');
      s.setFrozenRows(1);
    }
    H[name].forEach(function (c, i) {
      if (TEXTC.indexOf(c) > -1) s.getRange(2, i + 1, Math.max(s.getMaxRows() - 1, 1), 1).setNumberFormat('@');
    });
  });
  var def = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja1');
  if (def && ss.getSheets().length > 1) { try { ss.deleteSheet(def); } catch (e) { } }
  // dueño = administrador
  var owner = props().getProperty('OWNER');
  if (!userByEmail(owner, true)) {
    appendObj('Usuarios', { email: owner, nombre: 'Administrador', rol: 'admin', estado: 'aprobado', negocios: [], creado: now(), aprobadoPor: 'sistema', ultimoAcceso: 0 });
  }
  // catálogo inicial
  if (readAll('Productos').length === 0) {
    var rows = SEED_PRODUCTOS.map(function (p) {
      return toRow('Productos', { id: p.id, nombre: p.n, cat: p.c, unidad: p.u, factor: p.f, tol: p.t, costo: p.k || 0, critico: p.cr ? 1 : 0, negocios: p.ng, orden: p.o, activo: 1 });
    });
    if (rows.length) sheet('Productos').getRange(2, 1, rows.length, H.Productos.length).setValues(rows);
  }
  if (readAll('Equivalencias').length === 0 && SEED_ALIAS.length) {
    var ar = SEED_ALIAS.map(function (a) { return [a[0], a[1], a[2]]; });
    sheet('Equivalencias').getRange(2, 1, ar.length, 3).setValues(ar);
  }
  if (readAll('Config').length === 0) {
    Object.keys(CONFIG_DEF).forEach(function (k) { setConfigKey(k, CONFIG_DEF[k]); });
  }
  // revisión automática cada hora (conteos que faltan, ventas pendientes)
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'revisarPendientes') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('revisarPendientes').timeBased().everyHours(1).create();
  cacheDrop();
  Logger.log('Listo. Administrador: ' + owner + ' · Productos: ' + readAll('Productos').length);
  return 'Instalado. Ahora publica la app como aplicación web.';
}

/* ============================ web ============================ */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Arqueo La Barra')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* Entrada para la pantalla alojada fuera de Google (GitHub Pages): mismo api(), por POST de texto plano. */
function doPost(e) {
  var body = (e && e.postData && e.postData.contents) || '{}';
  return ContentService.createTextOutput(api(body)).setMimeType(ContentService.MimeType.TEXT);
}
function api(json) {
  var out;
  try {
    var r = JSON.parse(json);
    out = { ok: true, data: dispatch(r.a, r.p || {}, r.t || '') };
  } catch (e) {
    out = { ok: false, error: (e && e.code) || 'error', msg: String((e && e.message) || e) };
  }
  return JSON.stringify(out);
}

/* ============================ sesión ============================ */
function userByEmail(email, fresh) {
  var rows = fresh ? null : cacheGet('k_users');
  if (!rows) { rows = readAll('Usuarios'); cachePut('k_users', rows, 60); }
  for (var i = 0; i < rows.length; i++) if (rows[i].email === email) return rows[i];
  return null;
}
function makeToken(email) {
  var payload = Utilities.base64EncodeWebSafe(email + '|' + (now() + TOKEN_DIAS * 86400000));
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret()));
  return payload + '.' + sig;
}
function readToken(tok) {
  var parts = String(tok || '').split('.');
  if (parts.length !== 2) return '';
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret()));
  if (sig !== parts[1]) return '';
  var dec = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString().split('|');
  if (dec.length !== 2 || Number(dec[1]) < now()) return '';
  return dec[0];
}
function publicMe(u) { return { email: u.email, nombre: u.nombre, rol: u.rol, estado: u.estado, negocios: u.negocios || [] }; }
function usersWithRole(role) {
  return readAll('Usuarios').filter(function (u) { return u.estado === 'aprobado' && u.rol === role; });
}

function reqCode(p) {
  var email = normEmail(p.email);
  if (!email) fail('email', 'Escribe tu correo de Gmail completo.');
  var cache = CacheService.getScriptCache();
  var k = 'rc_' + email, n = Number(cache.get(k)) || 0;
  if (n >= 3) fail('limite', 'Ya pediste varios códigos. Espera unos minutos y revisa también la carpeta de spam.');
  var cuota = MailApp.getRemainingDailyQuota();
  if (cuota < 8) fail('cuota', 'Hoy se agotó el envío de correos. Intenta mañana o avisa al administrador.');
  var code = ('000000' + Math.floor(Math.random() * 1000000)).slice(-6);
  cache.put('cd_' + email, sha(code + email + secret()), 600);
  cache.put('at_' + email, '0', 600);
  cache.put(k, String(n + 1), 3600);
  MailApp.sendEmail({
    to: email,
    subject: 'Tu código de acceso: ' + code,
    name: 'Arqueo La Barra',
    body: 'Tu código para entrar a Arqueo La Barra es:\n\n    ' + code + '\n\nVale por 10 minutos. Si no lo pediste, ignora este correo.'
  });
  return { enviado: true, nuevo: !userByEmail(email) };
}

function verifyCode(p) {
  var email = normEmail(p.email), code = String(p.code || '').replace(/\D/g, '');
  if (!email || code.length !== 6) fail('codigo', 'Escribe el código de 6 números.');
  var cache = CacheService.getScriptCache();
  var h = cache.get('cd_' + email), at = Number(cache.get('at_' + email)) || 0;
  if (!h) fail('codigo', 'El código venció. Pide uno nuevo.');
  if (at >= 5) { cache.remove('cd_' + email); fail('codigo', 'Demasiados intentos. Pide un código nuevo.'); }
  if (sha(code + email + secret()) !== h) { cache.put('at_' + email, String(at + 1), 600); fail('codigo', 'Ese código no es correcto.'); }
  return withLock(function () {
    var u = userByEmail(email, true);
    if (!u) {
      var nombre = String(p.nombre || '').trim().slice(0, 60);
      if (nombre.length < 2) fail('nombre', 'Escribe tu nombre para pedir acceso.');
      cache.remove('cd_' + email);
      var owner = props().getProperty('OWNER');
      u = { email: email, nombre: nombre, rol: email === owner ? 'admin' : 'colaborador', estado: email === owner ? 'aprobado' : 'pendiente', negocios: [], creado: now(), aprobadoPor: '', ultimoAcceso: now() };
      appendObj('Usuarios', u);
      cacheDrop();
      if (u.estado === 'pendiente') {
        notify('acceso', 'Nuevo acceso solicitado', nombre + ' (' + email + ') pidió entrar. Asigna su rol en Equipo.', { para: 'admin', email: true });
      }
    } else {
      cache.remove('cd_' + email);
      u.ultimoAcceso = now();
      writeRow('Usuarios', u._row, u);
    }
    cacheDrop();
    return { token: makeToken(email), me: publicMe(u) };
  });
}

function auth(tok) {
  var email = readToken(tok);
  if (!email) fail('sesion', 'Tu sesión venció. Entra de nuevo.');
  var u = userByEmail(email);
  if (!u) fail('sesion', 'Tu sesión venció. Entra de nuevo.');
  return u;
}
function need(me, roles) {
  if (me.estado !== 'aprobado') fail('permiso', 'Tu acceso aún no está aprobado.');
  if (roles.indexOf(me.rol) < 0) fail('permiso', 'No tienes permiso para esto.');
}
/* Roles: admin, supervisor (sub-administración: valida/completa conteos de todos los negocios y todo queda en la bitácora), gerencia, lider (cuenta + revisa/registra ventas de SUS negocios), colaborador (solo cuenta y registra movimientos de SUS negocios) */
function conFreezer(neg) { return neg === 'Food Shop'; }
function conCafe(neg) { return /^La Barra/.test(neg) || neg === 'Food Shop'; }
function scoped(me) { return me.rol === 'lider' || me.rol === 'colaborador'; }
function negOk(me, neg) {
  if (me.rol === 'admin' || me.rol === 'gerencia' || me.rol === 'supervisor') return true;
  return (me.negocios || []).indexOf(neg) > -1;
}

/* ============================ despacho ============================ */
function dispatch(a, p, t) {
  if (a === 'reqCode') return reqCode(p);
  if (a === 'verifyCode') return verifyCode(p);
  var me = auth(t);
  if (a === 'me') return publicMe(me);
  if (me.estado === 'bloqueado') fail('bloqueado', 'Tu acceso está bloqueado.');
  if (me.estado !== 'aprobado') fail('permiso', 'Tu acceso aún no está aprobado.');
  switch (a) {
    case 'sync': return sync(me);
    case 'startCount': return startCount(me, p);
    case 'saveConteo': return saveConteo(me, p);
    case 'addEntrada': return addEntrada(me, p);
    case 'delEntrada': need(me, ['admin']); return delEntrada(me, p);
    case 'addMerma': return addMerma(me, p);
    case 'addTraspaso': return addTraspaso(me, p);
    case 'recibirTraspaso': return recibirTraspaso(me, p);
    case 'anularMov': need(me, ['admin']); return anularMov(me, p);
    case 'saveAlmacen': return saveAlmacen(me, p);
    case 'marcarAlmacen': need(me, ['admin', 'supervisor']); return marcarAlmacen(me, p);
    case 'getFoto': return getFoto(me, p);
    case 'saveChecklist': return saveChecklist(me, p);
    case 'saveProd': return saveProd(me, p);
    case 'saveCheckTurno': return saveCheckTurno(me, p);
    case 'getConteo': return getConteo(me, p);
    case 'saveVentas': need(me, ['admin', 'supervisor', 'lider']); return saveVentas(me, p);
    case 'rectificar': need(me, ['admin', 'supervisor']); return rectificar(me, p);
    case 'anular': need(me, ['admin']); return anular(me, p);
    case 'saveProducto': need(me, ['admin']); return saveProducto(me, p);
    case 'delProducto': need(me, ['admin']); return delProducto(me, p);
    case 'saveConfig': need(me, ['admin']); return saveConfig(me, p);
    case 'listUsers': need(me, ['admin']); return listUsers();
    case 'setUser': need(me, ['admin']); return setUser(me, p);
    case 'aliases': need(me, ['admin', 'supervisor', 'lider']); return getAliases();
    case 'saveAliases': need(me, ['admin', 'supervisor', 'lider']); return saveAliases(me, p);
    case 'dash': need(me, ['admin', 'gerencia']); return dash(p);
    case 'contactos': need(me, ['admin', 'supervisor']); return contactos();
    case 'markRead': return markRead(me, p);
  }
  fail('accion', 'Acción desconocida');
}

/* ============================ sync ============================ */
function productoOut(r) {
  return { id: r.id, nombre: r.nombre, cat: r.cat, unidad: r.unidad, factor: r.factor, tol: r.tol, costo: r.costo, critico: !!r.critico, negocios: r.negocios || [], orden: r.orden };
}
function visibleNegocios(me, cfg) {
  return scoped(me) ? cfg.negocios.filter(function (n) { return (me.negocios || []).indexOf(n) > -1; }) : cfg.negocios;
}
function readRecentConteos(dias) {
  var s = sheet('Conteos'), last = s.getLastRow();
  if (last < 2) return [];
  var desde = fechaMas(hoy(), -dias), out = [];
  var from = Math.max(2, last - 599), n = last - from + 1;
  var A = s.getRange(from, 1, n, 8).getValues();            // id..estado
  var R = s.getRange(from, colIdx('Conteos', 'resumen') + 1, n, 1).getValues();
  var X = s.getRange(from, colIdx('Conteos', 'rect') + 1, n, 1).getValues();
  for (var i = 0; i < n; i++) {
    var f = A[i][1] instanceof Date ? Utilities.formatDate(A[i][1], TZ, 'yyyy-MM-dd') : String(A[i][1]);
    if (f < desde) continue;
    out.push({ id: String(A[i][0]), fecha: f, negocio: String(A[i][2]), turno: String(A[i][3]), resp: String(A[i][4]), email: String(A[i][5]), ts: Number(A[i][6]), estado: String(A[i][7]), resumen: parseJ(R[i][0], {}), rect: Number(X[i][0]) || 0 });
  }
  out.sort(function (a, b) { return b.ts - a.ts; });
  return out;
}
function readRecentEntradas(dias) {
  var s = sheet('Entradas'), last = s.getLastRow();
  if (last < 2) return [];
  var desde = fechaMas(hoy(), -dias), from = Math.max(2, last - 299), n = last - from + 1;
  var vals = s.getRange(from, 1, n, H.Entradas.length).getValues(), out = [];
  vals.forEach(function (r) {
    var o = fromRow('Entradas', r);
    if (o.fecha >= desde && !o.anulada) out.push(o);
  });
  out.sort(function (a, b) { return b.ts - a.ts; });
  return out;
}
function notifsFor(me) {
  var s = sheet('Notificaciones'), last = s.getLastRow();
  if (last < 2) return [];
  var from = Math.max(2, last - 199), n = last - from + 1;
  var vals = s.getRange(from, 1, n, H.Notificaciones.length).getValues(), out = [];
  vals.forEach(function (r) {
    var o = fromRow('Notificaciones', r), toks = String(o.para).split(',');
    var mine = toks.indexOf(me.rol) > -1 || toks.indexOf('u:' + me.email) > -1 || toks.indexOf('todos') > -1 || (me.rol === 'supervisor' && toks.indexOf('admin') > -1 && o.tipo !== 'acceso');
    if (!mine && scoped(me)) (me.negocios || []).forEach(function (ng) { if (toks.indexOf('n:' + ng) > -1 || (me.rol === 'lider' && toks.indexOf('nl:' + ng) > -1)) mine = true; });
    if (mine) out.push({ id: o.id, ts: o.ts, tipo: o.tipo, titulo: o.titulo, texto: o.texto, negocio: o.negocio, ref: o.ref, leido: (o.leidoPor || []).indexOf(me.email) > -1 });
  });
  out.sort(function (a, b) { return b.ts - a.ts; });
  return out.slice(0, 50);
}
function sync(me) {
  migrarInsumos();
  migrarLaBarra();
  migrarFoodShopT3(); migrarMiller(); migrarFoodShopGeneral(); migrarLaBarraGeneral(); migrarAlmacen();
  var cfg = getConfig(), negs = visibleNegocios(me, cfg);
  var prods = getProductos().filter(function (r) { return r.activo; }).map(productoOut);
  if (scoped(me)) {
    prods = prods.filter(function (p) { return !p.negocios.length || p.negocios.some(function (n) { return negs.indexOf(n) > -1; }); });
  }
  var conteos = readRecentConteos(scoped(me) ? 14 : 45);
  if (scoped(me)) conteos = conteos.filter(function (c) { return negs.indexOf(c.negocio) > -1; });
  var entradas = readRecentEntradas(14);
  if (scoped(me)) entradas = entradas.filter(function (e) { return negs.indexOf(e.negocio) > -1; });
  var pend = [];
  if (me.rol !== 'colaborador') {
    pend = conteos.filter(function (c) { return c.estado === 'contado'; });
  }
  var movs = readMovs(14).filter(function (m) { return !m.anulada; });
  if (scoped(me)) movs = movs.filter(function (m) { return negs.indexOf(m.negocio) > -1 || negs.indexOf(m.destino) > -1; });
  movs = movs.map(function (m) { return { id: m.id, fecha: m.fecha, tipo: m.tipo, negocio: m.negocio, destino: m.destino, motivo: m.motivo, detalle: m.detalle, resp: m.resp, ts: m.ts, items: m.items, estado: m.estado, recPor: m.recPor, recTs: m.recTs, recItems: m.recItems }; });
  return {
    me: publicMe(me), hoy: hoy(), ahora: now(),
    config: { negocios: negs, turnos: cfg.turnos, limites: cfg.limites, calendario: cfg.calendario, catDias: cfg.catDias || {}, avisos: cfg.avisos, todosNegocios: cfg.negocios },
    productos: prods, conteos: conteos, entradas: entradas.map(function (e) { return { id: e.id, fecha: e.fecha, negocio: e.negocio, resp: e.resp, ts: e.ts, nota: e.nota, items: e.items, origen: e.origen || 'Proveedor' }; }), movs: movs, motivos: MOTIVOS,
    almacen: almacenFor(me), produccion: produccionFor(me), checkTurno: checkTurnoFor(me), notifs: notifsFor(me), pendientes: pend.length
  };
}

/* ============================ conteos ============================ */
function startCount(me, p) {
  var neg = String(p.negocio || '');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  var s = sheet('Conteos'), last = s.getLastRow(), ult = {}, scanned = 0, minTs = now();
  while (last > 1 && scanned < 150) {
    var from = Math.max(2, last - 29), n = last - from + 1;
    var vals = s.getRange(from, 1, n, 9).getValues();
    for (var i = n - 1; i >= 0; i--) {
      scanned++;
      var r = vals[i];
      if (String(r[2]) !== neg || String(r[7]) === 'anulado') continue;
      var items = parseJ(r[8], []), fecha = r[1] instanceof Date ? Utilities.formatDate(r[1], TZ, 'yyyy-MM-dd') : String(r[1]);
      items.forEach(function (it) { if (!ult[it[0]]) ult[it[0]] = [it[3], fecha, Number(r[6]), String(r[0]), String(r[3])]; });
    }
    last = from - 1;
  }
  Object.keys(ult).forEach(function (k) { if (ult[k][2] < minTs) minTs = ult[k][2]; });
  var ents = [], es = sheet('Entradas'), el = es.getLastRow();
  var cut = Math.max(minTs, now() - 90 * 86400000);
  if (el > 1) {
    var ef = Math.max(2, el - 299), ev = es.getRange(ef, 1, el - ef + 1, H.Entradas.length).getValues();
    ev.forEach(function (r) {
      var o = fromRow('Entradas', r);
      if (o.negocio === neg && !o.anulada && o.ts > cut) ents.push({ ts: o.ts, items: o.items });
    });
  }
  var sals = [], enTransito = [];
  readMovs(90).forEach(function (m) {
    if (m.anulada) return;
    if (m.tipo === 'traspaso' && m.destino === neg) {
      if (m.estado === 'recibido' && m.recTs > cut) ents.push({ ts: m.recTs, items: m.recItems });
      if (m.estado === 'enviado') enTransito.push({ id: m.id, de: m.negocio, ts: m.ts });
    }
    if (m.negocio === neg && m.ts > cut) sals.push({ ts: m.ts, tipo: m.tipo, motivo: m.motivo, destino: m.destino, items: m.items });
  });
  if (GEN_LB.indexOf(neg) > -1) {   // conteo semanal de la tienda: «Entró» = lo que Maria sacó del almacén para ella
    var base = neg.replace(/ General$/, '');
    readTail('Almacen', 400).forEach(function (x) { if (x.tipo === 'salida' && x.destino === base && x.ts > cut) ents.push({ ts: x.ts, items: x.items }); });
  }
  return { ultimos: ult, entradas: ents, salidas: sals, enTransito: enTransito };
}

function saveConteo(me, p) {
  need(me, ['admin', 'supervisor', 'lider', 'colaborador']);
  var neg = String(p.negocio || ''), turno = String(p.turno || ''), fecha = String(p.fecha || '');
  var cfg = getConfig();
  if (cfg.negocios.indexOf(neg) < 0) fail('datos', 'Negocio desconocido.');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  var tl = (cfg.turnos || {})[neg] || [];
  if (tl.length && tl.indexOf(turno) < 0) fail('datos', neg + ' no tiene ese turno.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) fail('datos', 'Fecha inválida.');
  var h = hoy();
  if (fecha > fechaMas(h, 1)) fail('datos', 'La fecha no puede ser futura.');
  if (scoped(me) && fecha < fechaMas(h, -2)) fail('datos', 'Solo puedes guardar conteos de hoy. Pide ayuda a administración.');
  if (SIN_CIERRE.indexOf(neg) > -1 && me.rol !== 'admin') {
    var calS = cfg.calendario && cfg.calendario[neg];
    if (calS && calS.length && calS.indexOf(new Date(fecha + 'T12:00:00Z').getUTCDay()) < 0) fail('datos', neg + ' solo se cuenta los días programados.');
  }
  var id = String(p.id || '');
  if (!/^c_[A-Za-z0-9]{6,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  if (!turno) fail('datos', 'Falta el turno.');
  var items = (p.items || []).map(function (it) {
    var ini = num(it.ini), ent = num(it.ent), fin = num(it.fin);
    if (ini == null || fin == null || ini < 0 || fin < 0) fail('datos', 'Hay cantidades inválidas.');
    if (ent == null || ent < 0) ent = 0;
    return [String(it.pid), r2(ini, 3), r2(ent, 3), r2(fin, 3), String(it.src || '')];
  });
  if (!items.length) fail('datos', 'No hay productos contados.');
  /* «Había» es lo que dejó el turno anterior: el personal no lo puede cambiar. Se toma del conteo de origen. */
  if (me.rol !== 'admin' && DOBLE.indexOf(neg) < 0) {
    var srcCache = {};
    items.forEach(function (it) {
      var sid = it[4];
      if (!sid) return;
      if (!srcCache[sid]) {
        var sr = findRowById('Conteos', sid), m = {};
        if (sr) {
          var so = readRowObj('Conteos', sr);
          if (so.negocio !== neg) fail('datos', 'El conteo de origen no es de este negocio.');
          so.items.forEach(function (x) { m[x[0]] = x[3]; });
        }
        srcCache[sid] = m;
      }
      if (srcCache[sid][it[0]] != null) it[1] = r2(srcCache[sid][it[0]], 3);
    });
  }
  var inicial = items.every(function (it) { return !it[4]; });   // ningún producto tiene conteo previo: es el punto de partida
  return withLock(function () {
    if (findRowById('Conteos', id)) return { id: id, repetido: true };
    var dup = readRecentConteos(4).filter(function (c) { return c.negocio === neg && c.turno === turno && c.fecha === fecha && c.estado !== 'anulado'; });
    if (dup.length) fail('duplicado', 'Ya hay un conteo de ' + neg + ' · ' + turno + ' del ' + fecha + '. Si hubo un error, pide a administración que lo anule o rectifique.');
    var o = {
      id: id, fecha: fecha, negocio: neg, turno: turno, resp: me.nombre, email: me.email, ts: now(), estado: inicial ? 'inicial' : (SOLO_CONSUMO(neg) ? 'arqueado' : 'contado'),
      items: items, ventas: {}, res: [], resumen: {}, sin: (p.sin || []).slice(0, 200).map(String), ventasPor: '', ventasTs: 0, rect: 0, nota: String(p.nota || '').slice(0, 300), cierre: null
    };
    if (INSUMOS.indexOf(neg) < 0 && SIN_CIERRE.indexOf(neg) < 0) {
      var ck = p.cierre;
      if (!ck || !ck.chk || ck.chk.length !== 6 || ck.chk.some(function (x) { return x !== true; })) fail('datos', 'Completa el cierre del turno.');
      if (ck.nov !== 'si' && ck.nov !== 'no') fail('datos', 'Indica si hubo novedad.');
      var ctxt = String(ck.txt || '').trim().slice(0, 400);
      if (ck.nov === 'si' && ctxt.length < 3) fail('datos', 'Cuenta qué novedad hubo.');
      o.cierre = { ok: 1, nov: ck.nov, txt: ck.nov === 'si' ? ctxt : '' };
      if (conFreezer(neg)) {
        var fz = ck.fz || {};
        if (['si', 'no'].indexOf(fz.ok) < 0) fail('datos', 'Confirma si los freezers funcionan.');
        var fzt = String(fz.txt || '').trim().slice(0, 300);
        if (fz.ok === 'no' && fzt.length < 3) fail('datos', 'Cuenta qué pasó con los freezers.');
        o.cierre.fz = { ok: fz.ok, txt: fz.ok === 'no' ? fzt : '' };
      }
      if (conCafe(neg)) {
        var cf = ck.cafe || {};
        if (['si', 'no'].indexOf(cf.rell) < 0 || ['si', 'no'].indexOf(cf.func) < 0) fail('datos', 'Responde lo de las máquinas de café.');
        var cft = String(cf.txt || '').trim().slice(0, 300);
        if ((cf.rell === 'no' || cf.func === 'no') && cft.length < 3) fail('datos', 'Cuenta qué pasó con las máquinas de café.');
        o.cierre.cafe = { rell: cf.rell, func: cf.func, txt: (cf.rell === 'no' || cf.func === 'no') ? cft : '' };
      }
    }
    ensureHeaders('Conteos');
    if (!inicial && SOLO_CONSUMO(neg)) {
      var cons = consumoDe(o, productMap());
      o.res = cons.res; o.resumen = cons.resumen; o.ventasPor = 'Sin ventas (consumo)'; o.ventasTs = now();
    }
    appendObj('Conteos', o);
    if (o.cierre && o.cierre.cafe && (o.cierre.cafe.rell === 'no' || o.cierre.cafe.func === 'no')) notify('cafetera', 'Máquinas de café: ' + neg, me.nombre + ' · ' + turno + ': ' + (o.cierre.cafe.rell === 'no' ? 'NO rellenadas. ' : '') + (o.cierre.cafe.func === 'no' ? 'NO funcionan bien. ' : '') + o.cierre.cafe.txt, { para: 'admin,gerencia', negocio: neg, ref: 'conteo|' + id, email: true });
    if (o.cierre && o.cierre.fz && o.cierre.fz.ok === 'no') notify('freezer', 'Freezers con problema: ' + neg, me.nombre + ' · ' + turno + ': ' + o.cierre.fz.txt, { para: 'admin,gerencia', negocio: neg, ref: 'conteo|' + id, email: true });
    if (o.cierre && o.cierre.nov === 'si') notify('novedad', 'Novedad en el cierre: ' + neg, me.nombre + ' · ' + turno + ': ' + o.cierre.txt, { para: 'admin,gerencia', negocio: neg, ref: 'conteo|' + id, email: true });
    if (inicial) return { id: id, inicial: true };
    if (SOLO_CONSUMO(neg)) {
      if (o.nota) notify('faltan-insumos', 'Insumos que hacen falta: ' + neg, me.nombre + ': ' + o.nota, { para: 'admin,gerencia', negocio: neg, ref: 'conteo|' + id, email: true });
      return { id: id, consumo: true };
    }
    notify('pendiente', 'Conteo listo para registrar ventas', neg + ' · ' + turno + ' · ' + fecha + ' (contó ' + me.nombre + '). Falta registrar las ventas.', { para: 'admin,nl:' + neg, negocio: neg, ref: 'conteo|' + id, email: true });
    return { id: id };
  });
}

function productMap() {
  var m = {};
  getProductos().forEach(function (r) { m[r.id] = r; });
  return m;
}
function expandItems(items, pm) {
  return items.map(function (it) {
    var pr = pm[it[0]] || { nombre: it[0], unidad: '' };
    return { pid: it[0], nombre: pr.nombre, unidad: pr.unidad, cat: pr.cat || '', ini: it[1], ent: it[2], fin: it[3], src: it[4] || '' };
  });
}
function getConteo(me, p) {
  var row = findRowById('Conteos', p.id);
  if (!row) fail('datos', 'No encontré ese conteo.');
  var c = readRowObj('Conteos', row);
  if (!negOk(me, c.negocio)) fail('permiso', 'No tienes acceso a ese conteo.');
  var pm = productMap(), srcInfo = {};
  c.items.forEach(function (it) {
    var sid = it[4];
    if (sid && !srcInfo[sid]) {
      var sr = findRowById('Conteos', sid);
      if (sr) { var so = readRowObj('Conteos', sr); srcInfo[sid] = { fecha: so.fecha, turno: so.turno, ts: so.ts }; }
    }
  });
  var out = {
    id: c.id, fecha: c.fecha, negocio: c.negocio, turno: c.turno, resp: c.resp, ts: c.ts, estado: c.estado, nota: c.nota, rect: c.rect, sin: c.sin, cierre: c.cierre,
    items: expandItems(c.items, pm), srcInfo: srcInfo, ventasPor: c.ventasPor, ventasTs: c.ventasTs
  };
  if (me.rol !== 'colaborador') { var sm = salidasDe(c), so2 = {}; Object.keys(sm).forEach(function (k) { so2[k] = { q: r2(sm[k].q, 3), det: sm[k].det.join(', ') }; }); out.sal = so2; }
  if (me.rol !== 'colaborador') out.hist = histDe(c.id);
  if (me.rol !== 'colaborador') { out.ventas = c.ventas; out.res = c.res; out.resumen = c.resumen; }
  else if (c.estado === 'arqueado') { out.resumen = { ok: c.resumen.ok, rev: c.resumen.rev, crit: c.resumen.crit }; }
  return out;
}

function calcItem(pr, ini, ent, fin, ven, sal) {
  sal = sal || 0;
  var real = ini + ent - fin, esp = ven * pr.factor + sal, dif = real - esp;
  var pct = esp === 0 ? (Math.abs(dif) < 1e-9 ? 0 : 1) : dif / esp;
  var tol = pr.tol;
  var estado = Math.abs(pct) <= tol + 1e-9 ? 'OK' : (Math.abs(pct) <= 2 * tol + 1e-9 ? 'REVISAR' : 'CRÍTICO');
  if (real < 0 && estado === 'OK') estado = 'REVISAR';
  return { real: r2(real), esp: r2(esp), dif: r2(dif), pct: r2(pct, 4), estado: estado, valor: r2(dif * (pr.costo || 0)) };
}
function computeArqueo(c, pm) {
  var res = [], rs = { ok: 0, rev: 0, crit: 0, faltante: 0, sobrante: 0, decl: 0 };
  var sals = salidasDe(c);
  c.items.forEach(function (it) {
    var pr = pm[it[0]];
    if (!pr || !it[4]) return;   // sin conteo previo: queda como inventario inicial, no se arquea
    var ven = Number(c.ventas[it[0]]) || 0, sal = (sals[it[0]] && sals[it[0]].q) || 0;
    var k = calcItem(pr, it[1], it[2], it[3], ven, sal);
    if (pr.cat === CAT_CONSUMO || pr.cat === CAT_ALMACEN) k = { real: r2(it[1] + it[2] - it[3]), esp: r2(it[1] + it[2] - it[3]), dif: 0, pct: 0, estado: 'OK', valor: 0 };   // insumos: solo consumo
    res.push([it[0], pr.nombre, pr.unidad, it[1], it[2], it[3], ven, k.real, k.esp, k.dif, k.pct, k.estado, k.valor, r2(sal, 3)]);
    rs.decl += sal * (pr.costo || 0);
    if (k.estado === 'OK') rs.ok++; else if (k.estado === 'REVISAR') rs.rev++; else rs.crit++;
    if (k.valor > 0) rs.faltante += k.valor; else rs.sobrante += -k.valor;
  });
  rs.faltante = r2(rs.faltante); rs.sobrante = r2(rs.sobrante); rs.decl = r2(rs.decl);
  return { res: res, resumen: rs };
}
/* Consumo de insumos (sin POS): lo que salió = había + entró − quedan */
function consumoDe(c, pm) {
  var res = [], tot = 0;
  c.items.forEach(function (it) {
    var pr = pm[it[0]];
    if (!pr || !it[4]) return;
    var real = r2(it[1] + it[2] - it[3], 3);
    res.push([it[0], pr.nombre, pr.unidad, it[1], it[2], it[3], 0, real, 0, 0, 0, 'OK', 0, 0]);
    tot += real;
  });
  return { res: res, resumen: { ok: res.length, rev: 0, crit: 0, faltante: 0, sobrante: 0, decl: 0, consumo: true, total: r2(tot, 3) } };
}
/* Una sola vez: La Barra 1/2/3 pasan a llamarse Atala/Atalaya/Miraflores y estrenan sus turnos */
var RENOMBRES = { 'La Barra 1': 'La Barra Atala', 'La Barra 2': 'La Barra Atalaya', 'La Barra 3': 'La Barra Miraflores' };
function migrarLaBarra() {
  if (props().getProperty('MIG_LABARRA_V1')) return;
  withLock(function () {
    if (props().getProperty('MIG_LABARRA_V1')) return;
    var cols = { Productos: ['negocios'], Usuarios: ['negocios'], Conteos: ['negocio'], Entradas: ['negocio'], Movimientos: ['negocio', 'destino'], Notificaciones: ['negocio'], Config: ['value'] };
    Object.keys(cols).forEach(function (name) {
      var s = sheet(name), last = s.getLastRow();
      if (last < 2) return;
      cols[name].forEach(function (c) {
        var ix = H[name].indexOf(c) + 1, rg = s.getRange(2, ix, last - 1, 1), v = rg.getValues(), ch = false;
        v.forEach(function (r) {
          var t = String(r[0]), n = t;
          Object.keys(RENOMBRES).forEach(function (k) { n = n.split(k).join(RENOMBRES[k]); });
          if (n !== t) { r[0] = n; ch = true; }
        });
        if (ch) rg.setValues(v);
      });
    });
    var cfg = getConfig(), t = cfg.turnos || {}, l = cfg.limites || {};
    Object.keys(CONFIG_DEF.turnos).forEach(function (n) { if (/^La Barra/.test(n)) t[n] = CONFIG_DEF.turnos[n]; });
    Object.keys(CONFIG_DEF.limites).forEach(function (k) { if (/^La Barra/.test(k)) l[k] = CONFIG_DEF.limites[k]; });
    Object.keys(l).forEach(function (k) { if (/Día completo/.test(k)) delete l[k]; });
    setConfigKey('turnos', t); setConfigKey('limites', l);
    props().setProperty('MIG_LABARRA_V1', '1');
    cacheDrop();
  });
}
/* Una sola vez: el Food Shop cuenta solo 2 turnos (cada colaboradora cuenta al final de su turno) */
function migrarFoodShopT3() {
  if (props().getProperty('MIG_FSDOS_V1')) return;
  withLock(function () {
    if (props().getProperty('MIG_FSDOS_V1')) return;
    var cfg = getConfig(), t = cfg.turnos || {}, l = cfg.limites || {};
    t['Food Shop'] = CONFIG_DEF.turnos['Food Shop'];
    delete l['Food Shop|Turno 3 (11PM-7AM)'];
    setConfigKey('turnos', t); setConfigKey('limites', l);
    props().setProperty('MIG_FSDOS_V1', '1');
    cacheDrop();
  });
}
/* Una sola vez: Miller 12 oz y Miller 22 oz en el Food Shop */
function migrarMiller() {
  if (props().getProperty('MIG_MILLER_V1')) return;
  withLock(function () {
    if (props().getProperty('MIG_MILLER_V1')) return;
    [['fs-170', 'Miller 12 oz', 88], ['fs-171', 'Miller 22 oz', 89]].forEach(function (p) {
      if (findRowById('Productos', p[0])) return;
      appendObj('Productos', { id: p[0], nombre: p[1], cat: 'Cervezas', unidad: 'unid', factor: 1, tol: 0.02, costo: 0, critico: 0, negocios: ['Food Shop'], orden: p[2], activo: 1 });
    });
    props().setProperty('MIG_MILLER_V1', '1');
    cacheDrop();
  });
}
/* Una sola vez: conteo general semanal del Food Shop (martes) con los insumos de café */
var CAFE_INSUMOS = [["Vasos Nescafé #8", "unid"], ["Vasos Nescafé #6", "unid"], ["Tapas Nescafé #6", "unid"], ["Tapas Nescafé #8", "unid"], ["Café en grano - Nescafé", "unid"], ["Polvo French Vanilla - Nescafé", "unid"], ["Polvo Latte - Nescafé", "unid"], ["Polvo Chocolate - Nescafé", "unid"], ["Bastones de azúcar Nescafé", "unid"], ["Removedores Nescafé", "unid"], ["Vasos Santo Domingo #8", "unid"], ["Vasos Santo Domingo #6", "unid"], ["Tapas Santo Domingo #6", "unid"], ["Tapas Santo Domingo #8", "unid"], ["Café en grano - Santo Domingo", "unid"], ["Polvo Capuccino - Santo Domingo", "unid"], ["Polvo Caramel Capuccino - Santo Domingo", "unid"], ["Polvo Chocolate - Santo Domingo", "unid"], ["Bastones de azúcar Santo Domingo", "unid"], ["Removedores Santo Domingo", "unid"]];
function migrarFoodShopGeneral() {
  if (props().getProperty('MIG_FSGEN_V1')) return;
  withLock(function () {
    if (props().getProperty('MIG_FSGEN_V1')) return;
    var s = sheet('Productos'), n = s.getLastRow() - 1, col = H.Productos.indexOf('negocios') + 1;
    if (n > 0) {
      var rg = s.getRange(2, col, n, 1), vals = rg.getValues(), cambio = false;
      vals = vals.map(function (r) {
        var a; try { a = JSON.parse(r[0] || '[]'); } catch (e) { a = []; }
        if (a.indexOf('Food Shop') > -1 && a.indexOf('Food Shop General') < 0) { a.push('Food Shop General'); cambio = true; return [JSON.stringify(a)]; }
        return [r[0]];
      });
      if (cambio) rg.setValues(vals);
    }
    CAFE_INSUMOS.forEach(function (p, i) {
      var id = 'cf-' + (i < 9 ? '0' : '') + (i + 1);
      if (findRowById('Productos', id)) return;
      appendObj('Productos', { id: id, nombre: p[0], cat: CAT_CONSUMO, unidad: p[1], factor: 1, tol: 0.05, costo: 0, critico: 0, negocios: ['Food Shop General'], orden: 200 + i, activo: 1 });
    });
    var cfg = getConfig(), ng = cfg.negocios || [], t = cfg.turnos || {}, l = cfg.limites || {}, cal = cfg.calendario || {};
    if (ng.indexOf('Food Shop General') < 0) { var ix = ng.indexOf('Food Shop'); ng.splice(ix > -1 ? ix + 1 : ng.length, 0, 'Food Shop General'); setConfigKey('negocios', ng); }
    if (!(t['Food Shop General'] && t['Food Shop General'].length)) { t['Food Shop General'] = ['Semanal']; setConfigKey('turnos', t); }
    if (!l['Food Shop General|Semanal']) { l['Food Shop General|Semanal'] = '23:30'; setConfigKey('limites', l); }
    if (!Array.isArray(cal['Food Shop General'])) { cal['Food Shop General'] = [2]; setConfigKey('calendario', cal); }
    props().setProperty('MIG_FSGEN_V1', '1');
    cacheDrop();
  });
}

/* Una sola vez: conteo semanal de almacén de La Barra (lunes Atala/Atalaya, martes Miraflores) */
var ALMACEN_LB = ["Aceite (manteca)", "Aceite Oliva", "Alitas de Pollo", "Axión Lavaplatos", "Azúcar", "Azúcar de Sobre para Café", "Botella de Agua", "Brillo Verde", "Café Maquina", "Caja Familiar", "Caramel Cappuccino", "Carne Angus", "Carne de Chicken Hamburguesa", "Cebolla", "Cereza", "China", "Chinola", "Cinta Adhesiva", "Ciruelas Pasas S/semilla", "Cloro Galón", "Cocoa Amarga", "Desengrasante", "Desinfectante", "Fresa Empacada", "Funda de Papel Sándwiches", "Funda Azul Jugos", "Funda para Basura", "Fundas Blancas Pequeñas", "Fundas de Hielo", "Guantes de Latex", "Talonario de Comanda", "Azucar Splenda", "Desembolsos", "Guineos Maduros", "Huevos", "Jamón de Cerdo", "Jamón de Pavo", "Kétchup Lata", "Kétchup Sobre Caja 500 Unid.", "Leche Cardinal", "Leche para Café 3% Grasa", "Leche Listamilk Salsa de Queso", "Lechosa", "Lechuga Repollada", "Limón", "Lulo", "Mango", "Margarina Manicera Tarro", "Mascarilla", "Mayonesa Galón", "Melón", "Mostaza Galón", "Grapas Grapadora", "Pan Cuadrado", "Pan de Agua", "Pan Frances", "Pan Hamburguesa", "Pan Integral", "Papas para Freír Libras", "Papel de Baño Manos E Inodoro", "Papel de Impresora Caja", "Papel de Impresora Pedidos Ya", "Papel de Baño Inodoro", "Gel Antibacterial", "Gorros Desechables", "Granadillo", "Fundas Blancas Grandes/ Azul", "Guanábana", "Papel Encerado", "Pechuguitas", "Pepinillos Verdes", "Salsa Buffalo", "Piña", "Puerro", "Queso Cheddar", "Queso Danés", "Refresco Coca Cola Botella", "Removedores de Café", "Repollo", "Salami Genoa", "Salami Induveca", "Carne de Chimi", "Salsa Bbq", "Salsa Cheddar", "Salsa China", "Salsa Honey Mustard", "Salsa Rosada", "Servilletas Blancas", "Pierna Empacada", "Pollo Empacado", "Crema Empacada", "Sorbetes", "Palillos Cortos", "Palillos Largos", "Cocoa Sobrino", "Tamarindo", "Tortilla Wrap", "Tenedores", "Toallas", "Tocineta", "Tomate", "Tapas p/vasos 16 Onzas", "Vasos 16 Onzas", "Vasos 7 Onzas", "Vinagre", "Zapote", "Canela", "Pimienta", "Caja de Pechuga de Pollo", "Caja de Alas de Pollo", "Salsa de Ajo", "Plato Papa Suprema", "Plato Barra Club", "Plato Peq. Papas Fritas", "Barquito Papas Fritas", "Jabon de Cuaba", "Servilletas Marrones", "Sandia Limon", "Envase de Aderezo", "Tapas de Aderezo", "Zanahoria", "Albahaca", "Zumo de Chinola", "Zumo de Limon", "Talonario Inventario"];
function migrarLaBarraGeneral() {
  if (props().getProperty('MIG_LBGEN_V1')) return;
  withLock(function () {
    if (props().getProperty('MIG_LBGEN_V1')) return;
    ALMACEN_LB.forEach(function (n, i) {
      var id = 'ga-' + ('00' + (i + 1)).slice(-3);
      if (findRowById('Productos', id)) return;
      appendObj('Productos', { id: id, nombre: n, cat: CAT_ALMACEN, unidad: 'unid', factor: 1, tol: 0.05, costo: 0, critico: 0, negocios: GEN_LB, orden: 300 + i, activo: 1 });
    });
    var cfg = getConfig(), ng = cfg.negocios || [], t = cfg.turnos || {}, l = cfg.limites || {}, cal = cfg.calendario || {};
    var dias = { 'La Barra Atala General': [1], 'La Barra Atalaya General': [1], 'La Barra Miraflores General': [2] };
    GEN_LB.forEach(function (g) {
      if (ng.indexOf(g) < 0) { var ix = ng.indexOf('Food Shop General'); ng.splice(ix > -1 ? ix + 1 : ng.length, 0, g); }
      t[g] = ['Semanal']; l[g + '|Semanal'] = '23:30'; cal[g] = dias[g];
    });
    setConfigKey('negocios', ng); setConfigKey('turnos', t); setConfigKey('limites', l); setConfigKey('calendario', cal);
    props().setProperty('MIG_LBGEN_V1', '1');
    cacheDrop();
  });
}

/* ============================ Almacén: recepción de mercancía y salidas (Maria → Griselda → Citrus) ============================ */
var ALM = 'Almacén', ALM_DESTINOS = ['Producción (cocina)', 'La Barra Atala', 'La Barra Atalaya', 'La Barra Miraflores', 'Food Shop', 'Zona Presidente', 'Car Wash'];
function almOk(me) { return me.rol === 'admin' || me.rol === 'gerencia' || me.rol === 'supervisor' || (me.negocios || []).indexOf(ALM) > -1; }
function almFolder() {
  var it = DriveApp.getFoldersByName('Arqueo La Barra - Fotos de almacén');
  return it.hasNext() ? it.next() : DriveApp.createFolder('Arqueo La Barra - Fotos de almacén');
}
function autorizarDrive() { almFolder(); Logger.log('Drive autorizado'); }
function almacenFor(me) {
  if (!almOk(me)) return [];
  var cut = now() - 45 * 86400000;
  return readTail('Almacen', 400).filter(function (a) { return a.ts > cut; })
    .map(function (a) { return { id: a.id, fecha: a.fecha, tipo: a.tipo, destino: a.destino, items: a.items, nota: a.nota, nf: (a.fotos || []).length, resp: a.resp, ts: a.ts, estado: a.estado, hechoPor: a.hechoPor, hechoTs: a.hechoTs }; })
    .sort(function (x, y) { return y.ts - x.ts; });
}
function saveAlmacen(me, p) {
  need(me, ['admin', 'supervisor', 'lider', 'colaborador']);
  if (!almOk(me)) fail('permiso', 'No tienes acceso a Almacén.');
  var tipo = String(p.tipo || ''), id = String(p.id || '');
  if (tipo !== 'recepcion' && tipo !== 'salida') fail('datos', 'Tipo inválido.');
  if (!/^a_[A-Za-z0-9]{6,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  var destino = String(p.destino || ''), nota = String(p.nota || '').trim().slice(0, 400);
  var fotos = (p.fotos || []).slice(0, 4);
  var items = [];
  if (tipo === 'salida') {
    if (ALM_DESTINOS.indexOf(destino) < 0) fail('datos', 'Elige a dónde va.');
    items = movItems(p);
  } else {
    if (!fotos.length) fail('datos', 'Toma la foto de la mercancía con la factura.');
    destino = '';
  }
  return withLock(function () {
    if (findRowById('Almacen', id)) return { id: id, repetido: true };
    var ids = [];
    if (fotos.length) {
      var folder = almFolder();
      fotos.forEach(function (b64, i) {
        var raw = String(b64 || '').replace(/^data:image\/\w+;base64,/, '');
        if (raw.length > 3000000) fail('datos', 'Una foto es muy pesada.');
        var f = folder.createFile(Utilities.newBlob(Utilities.base64Decode(raw), 'image/jpeg', id + '_' + (i + 1) + '.jpg'));
        ids.push(f.getId());
      });
    }
    appendObj('Almacen', { id: id, fecha: hoy(), tipo: tipo, destino: destino, items: items, nota: nota, fotos: ids, resp: me.nombre, email: me.email, ts: now(), estado: 'nuevo', hechoPor: '', hechoTs: 0 });
    bit(me.email, 'almacen-' + tipo, (destino ? destino + ' · ' : '') + (items.length ? itemsTexto(items) : ids.length + ' foto(s)'));
    if (tipo === 'recepcion') notify('almacen', 'Llegó mercancía', me.nombre + ' recibió mercancía y subió la foto con la factura.' + (nota ? ' ' + nota : ''), { para: 'admin', ref: 'alm|' + id, email: false });
    else notify('almacen', 'Salida para ' + destino, me.nombre + ': ' + itemsTexto(items) + '. Falta hacerla en Citrus.', { para: 'admin', ref: 'alm|' + id, email: false });
    return { id: id };
  });
}
function marcarAlmacen(me, p) {
  return withLock(function () {
    var row = findRowById('Almacen', p.id);
    if (!row) fail('datos', 'No encontré ese registro.');
    var a = readRowObj('Almacen', row);
    if (a.estado === 'hecho') return { id: a.id, repetido: true };
    a.estado = 'hecho'; a.hechoPor = me.nombre; a.hechoTs = now();
    writeRow('Almacen', row, a);
    bit(me.email, 'almacen-hecho', a.id + ' ' + a.tipo);
    return { id: a.id };
  });
}
function getFoto(me, p) {
  if (!almOk(me)) fail('permiso', 'No tienes acceso a Almacén.');
  var row = findRowById('Almacen', p.id);
  if (!row) fail('datos', 'No encontré ese registro.');
  var a = readRowObj('Almacen', row), n = parseInt(p.n, 10) || 0, fid = (a.fotos || [])[n];
  if (!fid) fail('datos', 'No hay foto.');
  var blob = DriveApp.getFileById(fid).getBlob();
  return { foto: 'data:image/jpeg;base64,' + Utilities.base64Encode(blob.getBytes()) };
}
function migrarAlmacen() {
  if (props().getProperty('MIG_ALM_V1')) return;
  withLock(function () {
    if (props().getProperty('MIG_ALM_V1')) return;
    var s = sheet('Productos'), last = s.getLastRow();
    if (last >= 2) {
      var col = colIdx('Productos', 'negocios') + 1, ci = colIdx('Productos', 'cat') + 1;
      var cats = s.getRange(2, ci, last - 1, 1).getValues(), rg = s.getRange(2, col, last - 1, 1), vals = rg.getValues();
      vals = vals.map(function (r, i) {
        if (cats[i][0] !== CAT_ALMACEN) return [r[0]];
        var a; try { a = JSON.parse(r[0] || '[]'); } catch (e) { a = []; }
        if (a.indexOf(ALM) < 0) a.push(ALM);
        return [JSON.stringify(a)];
      });
      rg.setValues(vals);
    }
    var cfg = getConfig(), ng = cfg.negocios || [], t = cfg.turnos || {};
    if (ng.indexOf(ALM) < 0) { ng.push(ALM); setConfigKey('negocios', ng); }
    if (!t[ALM]) { t[ALM] = []; setConfigKey('turnos', t); }
    props().setProperty('MIG_ALM_V1', '1');
    cacheDrop();
  });
}

/* ============================ Producción de Maria: checklist diario y rendimiento ============================ */
var PROD_DEF = ['Lulo', 'Fresa (se empaca)', 'Granadillo', 'Chinola', 'Limón', 'Zapote', 'Tamarindo', 'Lechosa', 'Piña', 'Melón', 'Cereza', 'Guanábana', 'Mango',
  'Caja de pechuga de pollo → pechuguitas', 'Caja de alitas → alitas', 'Barra de queso danés', 'Barra de queso cheddar', 'Queso rebanado (danés)', 'Queso rebanado (cheddar)',
  'Jamón rebanado de cerdo', 'Salami Induveca', 'Caja de pechuga de pollo → bolsas de pollo', 'Masa de cerdo → bolsas de pierna'];
var TEMP_RANGOS = { aceite: [275, 300, 'Aceite de freidores (°F)'], camara: [0, 5, 'Cámaras (°C)'], congelador: [-100, -18, 'Congeladores (°C)'] };
function produccionFor(me) {
  if (!almOk(me)) return [];
  var cut = fechaMas(hoy(), -21);
  return readTail('Produccion', 300).filter(function (a) { return a.fecha >= cut; })
    .map(function (a) { return { id: a.id, fecha: a.fecha, tipo: a.tipo, datos: a.datos, resp: a.resp, ts: a.ts }; })
    .sort(function (x, y) { return y.ts - x.ts; });
}
function saveChecklist(me, p) {
  need(me, ['admin', 'supervisor', 'lider', 'colaborador']);
  if (!almOk(me)) fail('permiso', 'No tienes acceso a Almacén.');
  var fecha = hoy(), id = 'k_' + fecha;
  var chk = (p.chk || []).slice(0, 60).map(function (x) { return x ? 1 : 0; });
  var temps = {}, fuera = [];
  Object.keys(TEMP_RANGOS).forEach(function (k) {
    var v = num((p.temps || {})[k]);
    if (v == null) return;
    temps[k] = v;
    var r = TEMP_RANGOS[k];
    if (v < r[0] || v > r[1]) fuera.push(r[2] + ': ' + v);
  });
  var datos = { chk: chk, temps: temps, nota: String(p.nota || '').trim().slice(0, 400) };
  return withLock(function () {
    var row = findRowById('Produccion', id);
    var rec = { id: id, fecha: fecha, tipo: 'checklist', datos: datos, resp: me.nombre, email: me.email, ts: now() };
    if (row) writeRow('Produccion', row, rec); else appendObj('Produccion', rec);
    bit(me.email, 'checklist', fecha + ' · ' + chk.filter(Boolean).length + '/' + chk.length);
    if (fuera.length) notify('temperatura', 'Temperatura fuera de rango', me.nombre + ' reportó: ' + fuera.join('; ') + '.', { para: 'admin,gerencia', ref: 'prod|' + id, email: false });
    return { id: id, fuera: fuera.length };
  });
}
function mediana(a) { var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function saveProd(me, p) {
  need(me, ['admin', 'supervisor', 'lider', 'colaborador']);
  if (!almOk(me)) fail('permiso', 'No tienes acceso a Almacén.');
  var id = String(p.id || '');
  if (!/^p_[A-Za-z0-9]{6,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  var lineas = (p.lineas || []).map(function (l) {
    var prod = String(l.prod || ''), rec = num(l.rec), obt = num(l.obt);
    if (PROD_DEF.indexOf(prod) < 0) fail('datos', 'Producto desconocido.');
    if (rec == null || rec <= 0 || obt == null || obt < 0) fail('datos', 'Revisa las cantidades de ' + prod + '.');
    return { prod: prod, rec: r2(rec, 3), obt: r2(obt, 3) };
  });
  if (!lineas.length) fail('datos', 'No hay producción anotada.');
  return withLock(function () {
    if (findRowById('Produccion', id)) return { id: id, repetido: true };
    var hist = readTail('Produccion', 400).filter(function (x) { return x.tipo === 'prod'; });
    var bajos = [];
    lineas.forEach(function (l) {
      l.rend = r2(l.obt / l.rec, 4);
      var prev = [];
      hist.forEach(function (h) { (h.datos.lineas || []).forEach(function (x) { if (x.prod === l.prod && x.rend > 0) prev.push(x.rend); }); });
      if (prev.length >= 3) { var med = mediana(prev.slice(-10)); l.med = r2(med, 4); if (l.rend < med * 0.8) { l.bajo = 1; bajos.push(l.prod + ': ' + Math.round(l.rend * 100) + '% (normal ' + Math.round(med * 100) + '%)'); } }
    });
    appendObj('Produccion', { id: id, fecha: hoy(), tipo: 'prod', datos: { lineas: lineas }, resp: me.nombre, email: me.email, ts: now() });
    bit(me.email, 'produccion', lineas.length + ' línea(s)');
    if (bajos.length) notify('rendimiento', 'Rendimiento bajo en producción', me.nombre + ': ' + bajos.join('; ') + '.', { para: 'admin,gerencia', ref: 'prod|' + id, email: false });
    return { id: id, bajos: bajos.length };
  });
}

/* ============================ Checklist corto del turno (La Barra): freidora y equipos con carga ============================ */
var CT_EQUIPOS = { vf: 'Verifone con carga', fl: 'Flota con carga' };
function checkTurnoFor(me) {
  var cut = fechaMas(hoy(), -2);
  return readTail('CheckTurno', 200).filter(function (a) { return a.fecha >= cut && (!scoped(me) || negOk(me, a.negocio)); })
    .map(function (a) { return { id: a.id, fecha: a.fecha, negocio: a.negocio, turno: a.turno, datos: a.datos, resp: a.resp, ts: a.ts }; })
    .sort(function (x, y) { return y.ts - x.ts; });
}
function saveCheckTurno(me, p) {
  need(me, ['admin', 'supervisor', 'lider', 'colaborador']);
  var neg = String(p.negocio || ''), turno = String(p.turno || ''), cfg = getConfig();
  if (!/^La Barra/.test(neg) || / General$/.test(neg) || cfg.negocios.indexOf(neg) < 0) fail('datos', 'Negocio inválido.');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  if (((cfg.turnos || {})[neg] || []).indexOf(turno) < 0) fail('datos', 'Turno inválido.');
  var fry = num(p.fry), nev = num(p.nev);
  if (fry == null) fail('datos', 'Anota la temperatura de la freidora.');
  var chk = {}, sin = [];
  ['fryok', 'vf', 'fl', 'sand', 'plancha', 'mesa', 'lic', 'agua', 'hielo'].forEach(function (k) { chk[k] = (p.chk || {})[k] ? 1 : 0; });
  Object.keys(CT_EQUIPOS).forEach(function (k) { if (!chk[k]) sin.push(CT_EQUIPOS[k]); });
  var arr = function (a) { return (a || []).slice(0, 40).map(function (x) { return String(x).slice(0, 60); }); };
  var datos = { fry: fry, nev: nev, chk: chk, falta: arr(p.falta), fruta: arr(p.fruta), nota: String(p.nota || '').trim().slice(0, 300) };
  var fecha = hoy(), id = 'ct_' + fecha + '_' + neg.replace(/\W+/g, '') + '_' + turno.replace(/^Turno (\d).*$/, '$1');
  var fuera = [];
  if (fry < 275 || fry > 300) fuera.push('Freidora ' + fry + ' °F (debe estar 275–300)');
  if (nev != null && (nev < 0 || nev > 8)) fuera.push('Neveras de la juguera ' + nev + ' °C (debe estar 0–8)');
  return withLock(function () {
    var row = findRowById('CheckTurno', id), rec = { id: id, fecha: fecha, negocio: neg, turno: turno, datos: datos, resp: me.nombre, email: me.email, ts: now() };
    if (row) writeRow('CheckTurno', row, rec); else appendObj('CheckTurno', rec);
    bit(me.email, 'check-turno', neg + ' · ' + turno + ' · freidora ' + fry);
    var para = 'admin,gerencia,nl:' + neg;
    if (fuera.length) notify('temperatura', 'Temperatura fuera de rango en ' + neg, me.nombre + ' (' + turno + '): ' + fuera.join('; ') + '.', { para: para, negocio: neg, ref: 'ct|' + id, email: false });
    if (sin.length) notify('equipos', 'Equipos sin carga en ' + neg, me.nombre + ' (' + turno + '): ' + sin.join(', ') + '.', { para: para, negocio: neg, ref: 'ct|' + id, email: false });
    return { id: id, fuera: fuera.length, sin: sin.length };
  });
}
/* Una sola vez: productos del Car Wash y su conteo semanal */
function migrarInsumos() {
  if (props().getProperty('MIG_INSUMOS_V2')) return;
  withLock(function () {
    if (props().getProperty('MIG_INSUMOS_V2')) return;
    INSUMOS_PRODUCTOS.forEach(function (p, i) {
      if (findRowById('Productos', p.id)) return;
      appendObj('Productos', { id: p.id, nombre: p.nombre, cat: 'Insumos', unidad: p.u, factor: 1, tol: 1, costo: 0, critico: 0, negocios: ['Car Wash'], orden: i + 1, activo: 1 });
    });
    var cfg = getConfig(), t = cfg.turnos || {}, l = cfg.limites || {}, cal = cfg.calendario || {};
    if (!(t['Car Wash'] && t['Car Wash'].length)) { t['Car Wash'] = ['Semanal']; setConfigKey('turnos', t); }
    if (!l['Car Wash|Semanal']) { l['Car Wash|Semanal'] = '23:30'; setConfigKey('limites', l); }
    if (!Array.isArray(cal['Car Wash'])) { cal['Car Wash'] = [0]; setConfigKey('calendario', cal); }
    props().setProperty('MIG_INSUMOS_V2', '1');
    cacheDrop();
  });
}
function avisarArqueo(c, rs) {
  if (rs.crit > 0) {
    notify('critico', 'Diferencias críticas: ' + c.negocio, c.negocio + ' · ' + c.turno + ' · ' + c.fecha + ': ' + rs.crit + ' productos críticos, ' + rs.rev + ' por revisar. Faltante estimado RD$ ' + Math.round(rs.faltante) + '.', { para: 'admin,gerencia', negocio: c.negocio, ref: 'conteo|' + c.id, email: true });
  }
  notify('arqueado', 'Arqueo listo', c.negocio + ' · ' + c.turno + ' · ' + c.fecha + ': ' + rs.ok + ' OK, ' + rs.rev + ' por revisar, ' + rs.crit + ' críticos.', { para: 'gerencia,n:' + c.negocio, negocio: c.negocio, ref: 'conteo|' + c.id, email: false });
}
function saveVentas(me, p) {
  return withLock(function () {
    var row = findRowById('Conteos', p.id);
    if (!row) fail('datos', 'No encontré ese conteo.');
    var c = readRowObj('Conteos', row);
    if (!negOk(me, c.negocio)) fail('permiso', 'No tienes acceso a ese negocio.');
    if (c.estado === 'anulado') fail('datos', 'Ese conteo está anulado.');
    var ventas = {};
    Object.keys(p.ventas || {}).forEach(function (k) {
      var v = num(p.ventas[k]);
      if (v == null || v < 0) fail('datos', 'Hay ventas con valores inválidos.');
      ventas[k] = r2(v, 3);
    });
    var antesV = c.ventas || {}, difV = [];
    Object.keys(ventas).forEach(function (k) { if (Object.keys(antesV).length && num(antesV[k]) !== ventas[k]) difV.push(k + ':' + (antesV[k] == null ? '-' : antesV[k]) + '→' + ventas[k]); });
    c.ventas = ventas;
    var pm = productMap(), r = computeArqueo(c, pm);
    var primera = c.estado !== 'arqueado';
    c.res = r.res; c.resumen = r.resumen; c.estado = 'arqueado'; c.ventasPor = me.nombre; c.ventasTs = now();
    writeRow('Conteos', row, c);
    bit(me.email, difV.length ? 'ventas-cambio' : 'ventas', c.id + ' ' + c.negocio + ' ' + c.turno + ' ' + c.fecha + (difV.length ? ' · cambios: ' + difV.slice(0, 40).join('; ') : ''));
    if (primera) avisarArqueo(c, r.resumen);
    return { resumen: r.resumen };
  });
}
/* Historial de cambios de un conteo (quién, cuándo y qué) leído de la bitácora */
function histDe(id) {
  var s = sheet('Bitacora'), last = s.getLastRow();
  if (last < 2) return [];
  var from = Math.max(2, last - 799), vals = s.getRange(from, 1, last - from + 1, 4).getValues(), nm = {}, out = [];
  readAll('Usuarios').forEach(function (u) { nm[u.email] = u.nombre + ' (' + u.rol + ')'; });
  vals.forEach(function (r) {
    var d = String(r[3]);
    if (d.indexOf(id) === 0 && ['ventas', 'ventas-cambio', 'rectificar', 'anular'].indexOf(String(r[2])) > -1)
      out.push({ ts: Number(r[0]) || 0, quien: nm[String(r[1])] || String(r[1]), accion: String(r[2]), detalle: d.slice(id.length + 1) });
  });
  return out.reverse().slice(0, 30);
}
function rectificar(me, p) {
  return withLock(function () {
    var row = findRowById('Conteos', p.id);
    if (!row) fail('datos', 'No encontré ese conteo.');
    var c = readRowObj('Conteos', row);
    var motivo = String(p.motivo || '').trim();
    if (motivo.length < 3) fail('datos', 'Escribe el motivo de la rectificación.');
    var ch = p.cambios || {}, antes = [];
    c.items = c.items.map(function (it) {
      var n = ch[it[0]];
      if (!n) return it;
      var ini = num(n.ini), ent = num(n.ent), fin = num(n.fin);
      if (ini == null || ent == null || fin == null || ini < 0 || ent < 0 || fin < 0) fail('datos', 'Hay cantidades inválidas.');
      antes.push(it[0] + ':' + it[1] + '/' + it[2] + '/' + it[3] + '→' + ini + '/' + ent + '/' + fin);
      return [it[0], r2(ini, 3), r2(ent, 3), r2(fin, 3), it[4]];
    });
    if (!antes.length) fail('datos', 'No hay cambios.');
    c.rect = 1;
    if (c.estado === 'arqueado') { var r = computeArqueo(c, productMap()); c.res = r.res; c.resumen = r.resumen; }
    writeRow('Conteos', row, c);
    bit(me.email, 'rectificar', c.id + ' · ' + motivo + ' · ' + antes.join('; '));
    return { resumen: c.resumen };
  });
}
function anular(me, p) {
  return withLock(function () {
    var row = findRowById('Conteos', p.id);
    if (!row) fail('datos', 'No encontré ese conteo.');
    var c = readRowObj('Conteos', row), motivo = String(p.motivo || '').trim();
    if (motivo.length < 3) fail('datos', 'Escribe el motivo.');
    c.estado = 'anulado'; c.nota = (c.nota ? c.nota + ' | ' : '') + 'Anulado: ' + motivo;
    writeRow('Conteos', row, c);
    bit(me.email, 'anular', c.id + ' ' + c.negocio + ' ' + c.turno + ' ' + c.fecha + ' · ' + motivo);
    return { ok: true };
  });
}

/* ============================ mermas y traspasos ============================ */
var MOTIVOS = ['Rotura', 'Vencimiento', 'Cortesía', 'Consumo del personal', 'Se dañó', 'Otros'];
function readMovs(dias) {
  var s = sheet('Movimientos'), last = s.getLastRow();
  if (last < 2) return [];
  var desde = fechaMas(hoy(), -dias), from = Math.max(2, last - 499), n = last - from + 1;
  var vals = s.getRange(from, 1, n, H.Movimientos.length).getValues(), out = [];
  vals.forEach(function (r, i) {
    var o = fromRow('Movimientos', r); o._row = from + i;
    if (o.fecha >= desde) out.push(o);
  });
  out.sort(function (a, b) { return b.ts - a.ts; });
  return out;
}
function movItems(p) {
  var pm = productMap(), seen = {};
  var items = (p.items || []).map(function (i) {
    var q = num(i.qty), pid = String(i.pid);
    if (q == null || q <= 0) fail('datos', 'Cantidad inválida.');
    if (!pm[pid]) fail('datos', 'Producto desconocido.');
    if (seen[pid]) fail('datos', 'Hay un producto repetido.');
    seen[pid] = 1;
    return { pid: pid, qty: r2(q, 3) };
  });
  if (!items.length) fail('datos', 'No hay productos.');
  return items;
}
function itemsTexto(items) {
  var pm = productMap();
  return (items || []).map(function (i) { return (pm[i.pid] ? pm[i.pid].nombre : i.pid) + ' ' + i.qty; }).join(', ');
}
function movBase(me, p, tipo) {
  need(me, ['admin', 'lider', 'colaborador']);
  var neg = String(p.negocio || ''), cfg = getConfig();
  if (cfg.negocios.indexOf(neg) < 0) fail('datos', 'Negocio desconocido.');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  var id = String(p.id || '');
  if (!/^m_[A-Za-z0-9]{6,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  return { id: id, neg: neg, cfg: cfg };
}
function addMerma(me, p) {
  var b = movBase(me, p, 'merma');
  var motivo = String(p.motivo || ''), detalle = String(p.detalle || '').trim().slice(0, 300);
  if (MOTIVOS.indexOf(motivo) < 0) fail('datos', 'Elige el motivo.');
  if ((motivo === 'Se dañó' || motivo === 'Otros') && detalle.length < 5) {
    fail('datos', motivo === 'Se dañó' ? 'Explica por qué se dañó.' : 'Explica el motivo.');
  }
  var items = movItems(p);
  return withLock(function () {
    if (findRowById('Movimientos', b.id)) return { id: b.id, repetido: true };
    appendObj('Movimientos', { id: b.id, fecha: hoy(), tipo: 'merma', negocio: b.neg, destino: '', motivo: motivo, detalle: detalle, resp: me.nombre, email: me.email, ts: now(), items: items, estado: 'registrada', recPor: '', recTs: 0, recItems: [], anulada: 0 });
    bit(me.email, 'merma', b.neg + ' · ' + motivo + ' · ' + itemsTexto(items));
    if (motivo === 'Se dañó' || motivo === 'Otros') {
      notify('merma', 'Merma: ' + motivo + ' en ' + b.neg, me.nombre + ': ' + itemsTexto(items) + '. ' + detalle, { para: 'admin,gerencia', negocio: b.neg, ref: 'mov|' + b.id, email: false });
    }
    return { id: b.id };
  });
}
// el mismo producto tiene un código distinto en cada negocio: se empareja por nombre
function equivEn(pm, pid, destino) {
  var key = normClave(pm[pid].nombre), hit = '';
  Object.keys(pm).forEach(function (k) {
    var q = pm[k];
    if (hit || k === pid || !q.activo || normClave(q.nombre) !== key) return;
    if (!q.negocios.length || q.negocios.indexOf(destino) > -1) hit = k;
  });
  if (!hit && (!pm[pid].negocios.length || pm[pid].negocios.indexOf(destino) > -1)) hit = pid;
  return hit;
}
function addTraspaso(me, p) {
  var b = movBase(me, p, 'traspaso');
  var dest = String(p.destino || '');
  if (b.cfg.negocios.indexOf(dest) < 0 || dest === b.neg) fail('datos', 'Elige el negocio que recibe.');
  var items = movItems(p), pm0 = productMap();
  items.forEach(function (i) {
    i.dpid = equivEn(pm0, i.pid, dest);
    if (!i.dpid) fail('datos', 'El producto «' + pm0[i.pid].nombre + '» no está en el catálogo de ' + dest + '. Pídele a administración que lo agregue.');
  });
  return withLock(function () {
    if (findRowById('Movimientos', b.id)) return { id: b.id, repetido: true };
    appendObj('Movimientos', { id: b.id, fecha: hoy(), tipo: 'traspaso', negocio: b.neg, destino: dest, motivo: '', detalle: String(p.detalle || '').trim().slice(0, 300), resp: me.nombre, email: me.email, ts: now(), items: items, estado: 'enviado', recPor: '', recTs: 0, recItems: [], anulada: 0 });
    bit(me.email, 'traspaso', b.neg + ' → ' + dest + ' · ' + itemsTexto(items));
    notify('traspaso', 'Traspaso por recibir en ' + dest, 'Desde ' + b.neg + ': ' + itemsTexto(items) + '. Confírmalo cuando llegue.', { para: 'n:' + dest + ',admin', negocio: dest, ref: 'mov|' + b.id, email: false });
    return { id: b.id };
  });
}
function recibirTraspaso(me, p) {
  need(me, ['admin', 'lider', 'colaborador']);
  return withLock(function () {
    var row = findRowById('Movimientos', p.id);
    if (!row) fail('datos', 'No encontré ese traspaso.');
    var m = readRowObj('Movimientos', row);
    if (m.tipo !== 'traspaso' || m.anulada) fail('datos', 'Ese traspaso no está disponible.');
    if (!negOk(me, m.destino)) fail('permiso', 'Ese traspaso no es para tu negocio.');
    if (m.estado === 'recibido') return { id: m.id, repetido: true };
    var sent = {}, dmap = {}; m.items.forEach(function (i) { sent[i.pid] = i.qty; dmap[i.pid] = i.dpid || i.pid; });
    var rec = [], dif = [];
    (p.items || []).forEach(function (i) {
      var pid = String(i.pid), q = num(i.qty);
      if (sent[pid] == null) fail('datos', 'Producto que no venía en el traspaso.');
      if (q == null || q < 0) fail('datos', 'Cantidad inválida.');
      rec.push({ pid: pid, dpid: dmap[pid], qty: r2(q, 3) });
    });
    if (!rec.length) fail('datos', 'Confirma las cantidades recibidas.');
    var pm = productMap();
    m.items.forEach(function (i) {
      var r = rec.filter(function (x) { return x.pid === i.pid; })[0];
      var q = r ? r.qty : 0;
      if (Math.abs(q - i.qty) > 1e-9) dif.push((pm[i.pid] ? pm[i.pid].nombre : i.pid) + ': salió ' + i.qty + ', llegó ' + q);
    });
    m.estado = 'recibido'; m.recPor = me.nombre; m.recTs = now();
    m.recItems = rec.filter(function (x) { return x.qty > 0; }).map(function (x) { return { pid: x.dpid, qty: x.qty }; });
    writeRow('Movimientos', row, m);
    bit(me.email, 'recibir-traspaso', m.id + ' ' + m.negocio + ' → ' + m.destino + (dif.length ? ' · DIFERENCIA ' + dif.join('; ') : ''));
    if (dif.length) {
      notify('traspaso-dif', 'Diferencia en traspaso a ' + m.destino, 'Desde ' + m.negocio + ' hacia ' + m.destino + ': ' + dif.join('; ') + '.', { para: 'admin,gerencia', negocio: m.destino, ref: 'mov|' + m.id, email: true });
    }
    return { id: m.id, diferencias: dif.length };
  });
}
function anularMov(me, p) {
  return withLock(function () {
    var row = findRowById('Movimientos', p.id);
    if (!row) fail('datos', 'No encontré ese movimiento.');
    var m = readRowObj('Movimientos', row);
    m.anulada = 1; writeRow('Movimientos', row, m);
    bit(me.email, 'anular-mov', m.id + ' ' + m.tipo + ' ' + m.negocio + (m.destino ? ' → ' + m.destino : ''));
    return { ok: true };
  });
}
function countTs(id) {
  var row = findRowById('Conteos', id);
  if (!row) return 0;
  return Number(sheet('Conteos').getRange(row, colIdx('Conteos', 'ts') + 1).getValues()[0][0]) || 0;
}
// salidas declaradas (mermas y traspasos enviados) de un negocio entre el conteo anterior y este
function salidasDe(c) {
  var movs = readMovs(60).filter(function (m) { return m.negocio === c.negocio && !m.anulada; });
  var out = {}, tsCache = {};
  if (!movs.length) return out;
  c.items.forEach(function (it) {
    if (!it[4]) return;
    if (tsCache[it[4]] == null) tsCache[it[4]] = countTs(it[4]);
    var from = tsCache[it[4]], to = Number(c.ts) || now();
    movs.forEach(function (m) {
      if (m.ts <= from || m.ts > to) return;
      m.items.forEach(function (x) {
        if (x.pid !== it[0]) return;
        var o = out[x.pid] || (out[x.pid] = { q: 0, det: [] });
        o.q += x.qty;
        o.det.push(m.tipo === 'traspaso' ? 'traspaso a ' + m.destino : m.motivo.toLowerCase());
      });
    });
  });
  return out;
}

/* ============================ entradas ============================ */
function addEntrada(me, p) {
  need(me, ['admin', 'lider', 'colaborador']);
  var neg = String(p.negocio || '');
  if (getConfig().negocios.indexOf(neg) < 0) fail('datos', 'Negocio desconocido.');
  if (!negOk(me, neg)) fail('permiso', 'Ese negocio no está asignado a tu usuario.');
  var id = String(p.id || '');
  if (!/^e_[A-Za-z0-9]{6,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  var items = (p.items || []).map(function (i) {
    var q = num(i.qty);
    if (q == null || q <= 0) fail('datos', 'Cantidad inválida.');
    return { pid: String(i.pid), qty: r2(q, 3) };
  });
  if (!items.length) fail('datos', 'No hay productos.');
  return withLock(function () {
    if (findRowById('Entradas', id)) return { id: id, repetido: true };
    var origen = ['Cocina', 'Principal', 'Cuarto frío'].indexOf(p.origen) > -1 ? p.origen : 'Proveedor';
    appendObj('Entradas', { id: id, fecha: hoy(), negocio: neg, resp: me.nombre, email: me.email, ts: now(), nota: String(p.nota || '').slice(0, 200), items: items, anulada: 0, origen: origen });
    return { id: id };
  });
}
function delEntrada(me, p) {
  return withLock(function () {
    var row = findRowById('Entradas', p.id);
    if (!row) fail('datos', 'No encontré esa entrada.');
    var o = readRowObj('Entradas', row); o.anulada = 1; writeRow('Entradas', row, o);
    bit(me.email, 'anular-entrada', o.id + ' ' + o.negocio);
    return { ok: true };
  });
}

/* ============================ catálogo y configuración ============================ */
function saveProducto(me, p) {
  var id = String(p.id || '');
  if (!/^[A-Za-z0-9_\-]{2,40}$/.test(id)) fail('datos', 'Identificador inválido.');
  var nombre = String(p.nombre || '').trim();
  if (!nombre) fail('datos', 'Escribe el nombre.');
  var f = num(p.factor), t = num(p.tol), k = num(p.costo);
  if (f == null || f <= 0) fail('datos', 'El factor debe ser mayor que 0.');
  if (t == null || t < 0 || t > 1) fail('datos', 'Tolerancia inválida.');
  if (k == null || k < 0) k = 0;
  return withLock(function () {
    var row = findRowById('Productos', id), o = row ? readRowObj('Productos', row) : { orden: num(p.orden) || now() };
    o.id = id; o.nombre = nombre; o.cat = String(p.cat || '').trim(); o.unidad = String(p.unidad || 'unid').trim(); o.factor = f; o.tol = t; o.costo = k;
    o.critico = p.critico ? 1 : 0; o.negocios = (p.negocios || []).map(String); o.activo = 1;
    if (row) writeRow('Productos', row, o); else appendObj('Productos', o);
    cacheDrop();
    bit(me.email, 'producto', id + ' ' + nombre);
    return { ok: true };
  });
}
function delProducto(me, p) {
  return withLock(function () {
    var row = findRowById('Productos', p.id);
    if (!row) return { ok: true };
    var o = readRowObj('Productos', row); o.activo = 0; writeRow('Productos', row, o);
    cacheDrop();
    bit(me.email, 'producto-baja', o.id + ' ' + o.nombre);
    return { ok: true };
  });
}
function saveConfig(me, p) {
  var ok = ['negocios', 'turnos', 'limites', 'calendario', 'catDias', 'avisos'];
  return withLock(function () {
    Object.keys(p.cfg || {}).forEach(function (k) {
      if (ok.indexOf(k) < 0) return;
      var v = p.cfg[k];
      if (k === 'negocios' && (!Array.isArray(v) || !v.length)) fail('datos', 'Deja al menos un negocio.');
      setConfigKey(k, v);
    });
    bit(me.email, 'config', Object.keys(p.cfg || {}).join(','));
    return { ok: true };
  });
}
function getAliases() {
  var m = {};
  readAll('Equivalencias').forEach(function (r) { m[r.clave] = r.pid; });
  return m;
}
function saveAliases(me, p) {
  return withLock(function () {
    var rows = readAll('Equivalencias'), ex = {};
    rows.forEach(function (r) { ex[r.clave] = r; });
    var m = p.map || {};
    Object.keys(m).forEach(function (clave) {
      var v = m[clave], pid = String(v.pid || ''), orig = String(v.original || '').slice(0, 120);
      if (!pid) return;
      if (ex[clave]) sheet('Equivalencias').getRange(ex[clave]._row, 1, 1, 3).setValues([[clave, pid, orig]]);
      else sheet('Equivalencias').appendRow([clave, pid, orig]);
    });
    return { ok: true };
  });
}

/* ============================ equipo ============================ */
function listUsers() {
  return readAll('Usuarios').map(function (u) { return { email: u.email, nombre: u.nombre, rol: u.rol, estado: u.estado, negocios: u.negocios || [], creado: u.creado, ultimoAcceso: u.ultimoAcceso, telefono: u.telefono || '', turnos: u.turnos || [] }; });
}
/* Personas con acceso y su teléfono, para recordatorios por WhatsApp */
function contactos() {
  return readAll('Usuarios').filter(function (u) { return u.estado === 'aprobado' && u.telefono; }).map(function (u) { return { nombre: u.nombre, rol: u.rol, negocios: u.negocios || [], telefono: String(u.telefono), turnos: u.turnos || [] }; });
}
/* Agrega al encabezado las columnas nuevas de versiones posteriores */
function ensureHeaders(name) {
  var s = sheet(name), h = H[name], r = s.getRange(1, 1, 1, h.length), cur = r.getValues()[0], ch = false;
  for (var i = 0; i < h.length; i++) if (!cur[i]) { cur[i] = h[i]; ch = true; }
  if (ch) r.setValues([cur]).setFontWeight('bold');
}
function setUser(me, p) {
  var email = normEmail(p.email);
  return withLock(function () {
    var u = userByEmail(email, true);
    if (!u) fail('datos', 'No existe ese usuario.');
    var owner = props().getProperty('OWNER');
    if (email === owner && (p.rol !== 'admin' || p.estado !== 'aprobado')) fail('datos', 'El dueño de la app siempre es administrador.');
    if (['colaborador', 'lider', 'supervisor', 'admin', 'gerencia'].indexOf(p.rol) < 0) fail('datos', 'Rol inválido.');
    if (['aprobado', 'pendiente', 'bloqueado'].indexOf(p.estado) < 0) fail('datos', 'Estado inválido.');
    var nuevo = u.estado !== 'aprobado' && p.estado === 'aprobado';
    u.rol = p.rol; u.estado = p.estado; u.negocios = (p.negocios || []).map(String);
    if (p.nombre) u.nombre = String(p.nombre).trim().slice(0, 60);
    if (p.turnos !== undefined) u.turnos = (p.turnos || []).map(String).filter(function (x) { return /^[1-3]$/.test(x); });
    if (p.telefono !== undefined) u.telefono = String(p.telefono || '').replace(/\D/g, '').slice(0, 15);
    ensureHeaders('Usuarios');
    if (nuevo) u.aprobadoPor = me.email;
    writeRow('Usuarios', u._row, u);
    cacheDrop();
    bit(me.email, 'usuario', email + ' ' + u.rol + ' ' + u.estado + ' ' + (u.negocios || []).join('|'));
    if (nuevo) {
      try {
        MailApp.sendEmail({ to: email, name: 'Arqueo La Barra', subject: 'Ya tienes acceso a Arqueo La Barra',
          body: 'Hola ' + u.nombre + ',\n\nTu acceso fue aprobado como ' + u.rol + '.\nEntra aquí: ' + appUrl() + '\n\nUsa tu mismo Gmail; te pediremos un código por correo.' });
      } catch (e) { }
      notify('acceso-ok', 'Acceso aprobado', 'Bienvenido, ' + u.nombre + '.', { para: 'u:' + email, email: false });
    }
    return { ok: true };
  });
}

/* ============================ avisos ============================ */
function recipients(para, tipo) {
  var toks = String(para).split(','), out = {};
  var users = readAll('Usuarios').filter(function (u) { return u.estado === 'aprobado'; });
  users.forEach(function (u) {
    var hit = toks.indexOf(u.rol) > -1 || toks.indexOf('u:' + u.email) > -1 || toks.indexOf('todos') > -1 || (u.rol === 'supervisor' && toks.indexOf('admin') > -1 && tipo !== 'acceso');
    if (!hit && (u.rol === 'lider' || u.rol === 'colaborador')) (u.negocios || []).forEach(function (n) { if (toks.indexOf('n:' + n) > -1 || (u.rol === 'lider' && toks.indexOf('nl:' + n) > -1)) hit = true; });
    if (hit) out[u.email] = 1;
  });
  return Object.keys(out);
}
function notify(tipo, titulo, texto, o) {
  o = o || {};
  var id = 'n_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  appendObj('Notificaciones', { id: id, ts: now(), para: o.para || 'admin', tipo: tipo, titulo: titulo, texto: texto, negocio: o.negocio || '', ref: o.ref || '', leidoPor: [] });
  if (o.email) {
    try {
      var cfg = getConfig(), flag = ({ acceso: 'acceso', pendiente: 'pendiente', critico: 'critico', falta: 'falta' })[tipo];
      if (flag && cfg.avisos && cfg.avisos[flag] === false) return;
      var to = recipients(o.para || 'admin', tipo);
      if (!to.length || MailApp.getRemainingDailyQuota() < 5) return;
      MailApp.sendEmail({ to: to.join(','), name: 'Arqueo La Barra', subject: titulo, body: texto + '\n\nAbrir la app: ' + appUrl() });
    } catch (e) { }
  }
}
function markRead(me, p) {
  return withLock(function () {
    var s = sheet('Notificaciones'), last = s.getLastRow();
    if (last < 2) return { ok: true };
    var from = Math.max(2, last - 199), n = last - from + 1, col = colIdx('Notificaciones', 'leidoPor') + 1;
    var vals = s.getRange(from, 1, n, H.Notificaciones.length).getValues(), ids = p.ids || [], todos = !!p.todos;
    vals.forEach(function (r, i) {
      var id = String(r[0]);
      if (!todos && ids.indexOf(id) < 0) return;
      var lp = parseJ(r[col - 1], []);
      if (lp.indexOf(me.email) > -1) return;
      lp.push(me.email);
      s.getRange(from + i, col).setValue(JSON.stringify(lp));
    });
    return { ok: true };
  });
}

/* ============================ revisión automática (cada hora) ============================ */
function yaAvisado(ref, tipo) {
  var s = sheet('Notificaciones'), last = s.getLastRow();
  if (last < 2) return false;
  var from = Math.max(2, last - 299), n = last - from + 1;
  var refs = s.getRange(from, colIdx('Notificaciones', 'ref') + 1, n, 1).getValues();
  var tips = s.getRange(from, colIdx('Notificaciones', 'tipo') + 1, n, 1).getValues();
  for (var i = 0; i < n; i++) if (String(refs[i][0]) === ref && String(tips[i][0]) === tipo) return true;
  return false;
}
function revisarPendientes() {
  var cfg = getConfig(), h = hoy(), ahora = new Date();
  var hm = Utilities.formatDate(ahora, TZ, 'HH:mm');
  var recientes = readRecentConteos(3);
  var faltan = [];
  [fechaMas(h, -1), h].forEach(function (f) {
    cfg.negocios.forEach(function (neg) {
      (cfg.turnos[neg] || []).forEach(function (t) {
        var lim = cfg.limites[neg + '|' + t];
        if (!lim) return;
        var calN = cfg.calendario && cfg.calendario[neg];
        if (Array.isArray(calN) && calN.indexOf(new Date(f + 'T12:00:00Z').getUTCDay()) < 0) return;   // no es día de conteo
        var pasado = f < h || hm >= lim;
        if (!pasado) return;
        var hecho = recientes.some(function (c) { return c.negocio === neg && c.turno === t && c.fecha === f && c.estado !== 'anulado'; });
        if (hecho) return;
        var ref = 'falta|' + f + '|' + neg + '|' + t;
        if (yaAvisado(ref, 'falta')) return;
        faltan.push({ ref: ref, neg: neg, t: t, f: f });
      });
    });
  });
  faltan.forEach(function (x) {
    notify('falta', 'Falta el conteo: ' + x.neg, 'No se registró el conteo de ' + x.neg + ' · ' + x.t + ' del ' + x.f + '.', { para: 'admin,gerencia,n:' + x.neg, negocio: x.neg, ref: x.ref, email: false });
  });
  if (faltan.length) {
    var lines = faltan.map(function (x) { return '• ' + x.neg + ' · ' + x.t + ' · ' + x.f; }).join('\n');
    try {
      var cfg2 = getConfig();
      if (!(cfg2.avisos && cfg2.avisos.falta === false)) {
        var to = recipients('admin,gerencia');
        if (to.length && MailApp.getRemainingDailyQuota() > 5) MailApp.sendEmail({ to: to.join(','), name: 'Arqueo La Barra', subject: 'Conteos que faltan (' + faltan.length + ')', body: lines + '\n\nAbrir la app: ' + appUrl() });
      }
    } catch (e) { }
  }
  // traspasos sin confirmar por más de 6 horas
  readMovs(3).forEach(function (m) {
    if (m.tipo === 'traspaso' && !m.anulada && m.estado === 'enviado' && now() - m.ts > 6 * 3600000) {
      var ref = 'tras|' + m.id;
      if (!yaAvisado(ref, 'traspaso-tarde')) {
        notify('traspaso-tarde', 'Traspaso sin confirmar', 'De ' + m.negocio + ' a ' + m.destino + ' lleva más de 6 horas sin confirmarse: ' + itemsTexto(m.items) + '.', { para: 'admin,gerencia,n:' + m.destino, negocio: m.destino, ref: ref, email: false });
      }
    }
  });
  // ventas pendientes de registrar por más de 12 horas
  recientes.forEach(function (c) {
    if (c.estado === 'contado' && now() - c.ts > 12 * 3600000) {
      var ref = 'ventas|' + c.id;
      if (!yaAvisado(ref, 'ventas-tarde')) {
        notify('ventas-tarde', 'Ventas sin registrar', c.negocio + ' · ' + c.turno + ' · ' + c.fecha + ' lleva más de 12 horas esperando las ventas.', { para: 'admin,gerencia,nl:' + c.negocio, negocio: c.negocio, ref: ref, email: false });
      }
    }
  });
}

/* ============================ panel (admin / gerencia) ============================ */
function dash(p) {
  var cfg = getConfig(), desde = String(p.desde || fechaMas(hoy(), -6)), hasta = String(p.hasta || hoy()), filtro = String(p.negocio || '');
  var s = sheet('Conteos'), last = s.getLastRow(), rows = [];
  if (last > 1) {
    var from = Math.max(2, last - 1499), n = last - from + 1;
    var cols = [1, 2, 3, 4, 7, 8, 11, 12];   // id fecha negocio turno ts estado res resumen (1-based)
    var A = s.getRange(from, 1, n, 8).getValues();
    var RS = s.getRange(from, colIdx('Conteos', 'res') + 1, n, 2).getValues();
    for (var i = 0; i < n; i++) {
      var f = A[i][1] instanceof Date ? Utilities.formatDate(A[i][1], TZ, 'yyyy-MM-dd') : String(A[i][1]);
      if (f < desde || f > hasta) continue;
      if (filtro && String(A[i][2]) !== filtro) continue;
      rows.push({ id: String(A[i][0]), fecha: f, negocio: String(A[i][2]), turno: String(A[i][3]), ts: Number(A[i][6]), estado: String(A[i][7]), res: parseJ(RS[i][0], []), resumen: parseJ(RS[i][1], {}) });
    }
  }
  var vivos = rows.filter(function (r) { return r.estado !== 'anulado'; });
  var porNeg = {}, prod = {}, diario = {}, ahora = now();
  var negs = filtro ? [filtro] : cfg.negocios;
  negs.forEach(function (n) { porNeg[n] = { conteos: 0, arqueados: 0, pendientes: 0, ok: 0, rev: 0, crit: 0, items: 0, faltante: 0, sobrante: 0, decl: 0, esperados: 0, cumplidos: 0 }; });
  vivos.forEach(function (r) {
    var o = porNeg[r.negocio]; if (!o) return;
    o.conteos++;
    var d = diario[r.fecha] || (diario[r.fecha] = { fecha: r.fecha, faltante: 0, conteos: 0 });
    d.conteos++;
    if (r.estado === 'arqueado') {
      o.arqueados++;
      var rs = r.resumen || {};
      o.ok += rs.ok || 0; o.rev += rs.rev || 0; o.crit += rs.crit || 0; o.items += (rs.ok || 0) + (rs.rev || 0) + (rs.crit || 0);
      o.faltante += rs.faltante || 0; o.sobrante += rs.sobrante || 0; o.decl += rs.decl || 0; d.faltante += rs.faltante || 0;
      r.res.forEach(function (x) {
        var k = x[0] + '|' + r.negocio;
        var q = prod[k] || (prod[k] = { pid: x[0], nombre: x[1], unidad: x[2], negocio: r.negocio, faltaU: 0, faltaV: 0, veces: 0, crit: 0 });
        if (x[9] > 0) { q.faltaU += x[9]; q.faltaV += Math.max(x[12], 0); }
        if (x[11] !== 'OK') q.veces++;
        if (x[11] === 'CRÍTICO') q.crit++;
      });
    } else if (r.estado === 'contado') o.pendientes++;
  });
  // cumplimiento: turnos esperados vs. hechos (solo los cuyo límite ya pasó)
  var h = hoy(), hm = Utilities.formatDate(new Date(), TZ, 'HH:mm'), faltan = [];
  var f = desde;
  while (f <= hasta && f <= h) {
    negs.forEach(function (neg) {
      (cfg.turnos[neg] || []).forEach(function (t) {
        var lim = cfg.limites[neg + '|' + t];
        if (!lim) return;
        var calN = cfg.calendario && cfg.calendario[neg];
        if (Array.isArray(calN) && calN.indexOf(new Date(f + 'T12:00:00Z').getUTCDay()) < 0) return;   // no es día de conteo
        var hecho = vivos.some(function (c) { return c.negocio === neg && c.turno === t && c.fecha === f; });
        if (f === h && hm < lim && !hecho) return;   // aún no vence y todavía no se hace
        var o = porNeg[neg]; o.esperados++;
        if (hecho) o.cumplidos++; else faltan.push({ fecha: f, negocio: neg, turno: t });
      });
    });
    f = fechaMas(f, 1);
  }
  var tot = { conteos: 0, arqueados: 0, pendientes: 0, ok: 0, rev: 0, crit: 0, items: 0, faltante: 0, sobrante: 0, decl: 0, esperados: 0, cumplidos: 0 };
  Object.keys(porNeg).forEach(function (n) { var o = porNeg[n]; o.faltante = r2(o.faltante); o.sobrante = r2(o.sobrante); o.decl = r2(o.decl); Object.keys(tot).forEach(function (k) { tot[k] += o[k]; }); });
  tot.faltante = r2(tot.faltante); tot.sobrante = r2(tot.sobrante); tot.decl = r2(tot.decl);
  var top = Object.keys(prod).map(function (k) { var q = prod[k]; q.faltaU = r2(q.faltaU); q.faltaV = r2(q.faltaV); return q; })
    .filter(function (q) { return q.faltaU > 0; }).sort(function (a, b) { return (b.faltaV - a.faltaV) || (b.faltaU - a.faltaU); }).slice(0, 12);
  var pendList = vivos.filter(function (r) { return r.estado === 'contado'; }).sort(function (a, b) { return a.ts - b.ts; })
    .map(function (r) { return { id: r.id, fecha: r.fecha, negocio: r.negocio, turno: r.turno, horas: Math.floor((ahora - r.ts) / 3600000) }; });
  var dd = Object.keys(diario).sort().map(function (k) { diario[k].faltante = r2(diario[k].faltante); return diario[k]; });
  var pmm = productMap(), mm = { total: 0, porMotivo: {}, enviados: 0, sinConfirmar: 0 };
  readMovs(60).forEach(function (m) {
    if (m.anulada || m.fecha < desde || m.fecha > hasta) return;
    if (filtro && m.negocio !== filtro && m.destino !== filtro) return;
    if (m.tipo === 'merma') {
      var v = 0; m.items.forEach(function (i) { v += i.qty * ((pmm[i.pid] && pmm[i.pid].costo) || 0); });
      var q = mm.porMotivo[m.motivo] || (mm.porMotivo[m.motivo] = { n: 0, valor: 0 });
      q.n++; q.valor = r2(q.valor + v); mm.total = r2(mm.total + v);
    } else { mm.enviados++; if (m.estado === 'enviado') mm.sinConfirmar++; }
  });
  return { mermas: mm, desde: desde, hasta: hasta, total: tot, porNegocio: porNeg, top: top, diario: dd, faltan: faltan.slice(-40), pendientes: pendList };
}
