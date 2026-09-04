import { useState, useEffect, useLayoutEffect, useRef, useCallback, Fragment } from "react";
import { supabase } from "./supabaseClient";
import { listarPresupuestos, guardarPresupuestoEnNube, cargarPresupuestoDeNube, eliminarPresupuestoDeNube, buscarArticulosAlmacen } from "./supabaseApi";
import { UNIDADES_NEGOCIO, etiquetaUnidad, UNIDAD_DEPARTAMENTO } from "./catalogoUnidades";
// CLAVE_FACTURACION se importará cuando el exportador lo use (paso 4); hoy solo
// se necesitan estas dos para el guardarraíl de abajo.
import { claveDeRubro, RUBROS_EGRESOS } from "./catalogoClaves";

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = {
  yellow:"#DDAC00", yellowLight:"#FFF8E1", yellowBorder:"#F0C800", yellowDark:"#B08900",
  grayDark:"#1a1a1a", grayMid:"#6B6B6B", grayLight:"#F5F5F5", grayBorder:"#E0E0E0",
  white:"#FFFFFF", danger:"#C0392B", dangerLight:"#FDECEA",
  success:"#1E7E34", successLight:"#EAF7ED",
  sidebar:"#111111", contentBg:"#F5F5F5",
  // tonos de línea
  line:"#E8E8E8",
};

// ─── ÁREAS ───────────────────────────────────────────────────────────────────
const AREAS_CAMPO = [
  {id:"operaciones",   label:"Operaciones",           icon:"🔧"},
  {id:"construccion",  label:"Construcción",          icon:"🏗️"},
  {id:"electricidad",  label:"Electricidad",          icon:"⚡"},
  {id:"generacion",    label:"Generación",            icon:"⚙️"},
  {id:"calidad",       label:"Calidad",               icon:"✅"},
  {id:"sspa",          label:"SSPA",                  icon:"🦺"},
  {id:"hps",           label:"HPS",                   icon:"🔩"},
  {id:"mantenimiento", label:"Mantenimiento",         icon:"🛠️"},
  {id:"logistica",     label:"Logística",             icon:"🚛"},
];
const AREAS_DEPTO = [
  {id:"ti",        label:"Tecnología (TI)",        icon:"💻"},
  {id:"innovacion",label:"Innovación y Tecnología", icon:"🚀"},
  {id:"finanzas",  label:"Finanzas",               icon:"💰"},
];
const AREAS_SUMINISTRO = [
  {id:"seguridad",      label:"Seguridad",               icon:"🔒"},
  {id:"staff_dir",      label:"Staff de Dirección",      icon:"👔"},
  {id:"dir_general",    label:"Dirección General",       icon:"🏛️"},
  {id:"comunicacion",   label:"Comunicación",            icon:"📢"},
  {id:"innov_tec",      label:"Innovación y Tecnología", icon:"🚀"},
  {id:"almacen",        label:"Almacén",                 icon:"📦"},
];
function getAreasCat(tipo){
  if(tipo==="departamento") return AREAS_DEPTO;
  if(tipo==="suministro")   return AREAS_SUMINISTRO;
  return AREAS_CAMPO;
}

const MESES=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Los 18 RUBROS de docs/catalogo_contable_2027.csv, en el orden del archivo.
// En el Excel de contabilidad los rubros se distinguen POR FORMATO: negritas
// sobre relleno dorado DBAC00. Las subcuentas van en cursiva, y en el archivo
// aparecen ARRIBA de su rubro (el rubro es la fila de suma). El CSV se regenera
// leyendo ese formato, no adivinando por los valores de las columnas de meses.
//
// Una subcuenta NUNCA va en esta lista: si está, macroDeCategoria la devuelve
// como si fuera rubro (gana sobre SUBCAT_MAPPING) y pinta un subtotal que no
// existe en el archivo de Anel.
const CATS_MACRO_CONTABLE = ["ACTIVOS", "ARRENDA DE INMUEBLES Y SERV", "ARTICULOS DE SEGURIDAD", "EQUIPO DE COMPUTO", "EQUIPOS Y ENSERES", "INSUMOS AGRICOLAS", "INSUMOS DE OFICINA", "MARKETING", "MATERIALES", "MATERIALES DE SALUD", "NOMINA Y ADICIONALES", "SERV TELEFONIA CELULAR Y RADIO", "SERVICIOS", "SERVICIOS DE CAPACITACION", "SERVICIOS DE SALUD", "UNIFORMES", "VEHICULOS Y COMBUSTIBLE", "VIATICOS"];

// Mapping: subcategoría escrita → categoría macro contable
const SUBCAT_MAPPING = {"ARRENDAMIENTO DE INMUEBLES": "ARRENDA DE INMUEBLES Y SERV", "SERVICIOS DE LUZ, AGUA E INTERNET": "ARRENDA DE INMUEBLES Y SERV", "SERVICIOS DE LIMPIEZA": "ARRENDA DE INMUEBLES Y SERV", "SERVICIOS DE VIGILANCIA": "ARRENDA DE INMUEBLES Y SERV", "TELEFONIA FIJA": "ARRENDA DE INMUEBLES Y SERV", "AGUA Y ALCANTARILLADO": "ARRENDA DE INMUEBLES Y SERV", "ARRENDAMIENTO DE OF. MOVILES": "ARRENDA DE INMUEBLES Y SERV", "ROPA Y ARTICULOS DE PROTECCION": "ARTICULOS DE SEGURIDAD", "EQUIPO DE COMPUTO (ADQUISICION)": "EQUIPO DE COMPUTO", "ARRENDAMIENTO DE EQ. COMPUTO": "EQUIPO DE COMPUTO", "ENSERES MENORES DIVERSOS": "EQUIPOS Y ENSERES", "PAPELERIA Y UTILES DE OFICINA": "INSUMOS DE OFICINA", "ARTICULOS DE ASEO Y SANITARIOS": "INSUMOS DE OFICINA", "ARTICULOS DE CAFETERIA": "INSUMOS DE OFICINA", "ARTICULOS DIGITALES Y DE COMPUTO": "INSUMOS DE OFICINA", "SERVICIOS DE MERCADOTECNIA": "MARKETING", "PUBLICIDAD Y PROPAGANDA": "MARKETING", "ABRASIVOS": "MATERIALES", "ACEITE LUBRICANTE P/MAQUINARIA": "MATERIALES", "ACEITES Y LUBRICANTES": "MATERIALES", "BANDA CADEN TRANS COPL": "MATERIALES", "CONEXIONES PARA TUBERIA": "MATERIALES", "FIBRAS HILOS Y TELAS": "MATERIALES", "GRASAS": "MATERIALES", "HERRAMIENTAS MANUALES": "MATERIALES", "LLANTAS, CAMARAS Y ACCESORIOS": "MATERIALES", "MATERIAL ELECTRICO": "MATERIALES", "MATERIALES Y ART P/MANTENIMIENTO": "MATERIALES", "POSTE DE TELEMETRIA": "MATERIALES", "MATERIAL PRIMEROS AUXILIOS": "MATERIALES DE SALUD", "NOMINA": "NOMINA Y ADICIONALES", "SERV TELEFONIA CELULAR (PARA TRANSMITIR)": "SERV TELEFONIA CELULAR Y RADIO", "SERVICIO DE BANDA ANCHA": "SERV TELEFONIA CELULAR Y RADIO", "SERVICIO DE RADIOCOMUNICACION": "SERV TELEFONIA CELULAR Y RADIO", "CUADRILLA DE INSTALACION": "SERVICIOS", "HERRAMIENTA": "SERVICIOS", "SERVICIOS MEDICOS": "SERVICIOS DE SALUD", "SERVICIOS Y COMBUSTIBLE": "VEHICULOS Y COMBUSTIBLE", "COMBUSTIBLE": "VEHICULOS Y COMBUSTIBLE", "ALIMENTACION": "VIATICOS", "CASETAS PUENTES Y PEAJES": "VIATICOS", "SERV DE TRANSPORTAC AEREA": "VIATICOS", "SERV DE TRANSPORTAC TERRESTRE": "VIATICOS", "SERVICIOS DE HOSPEDAJE": "VIATICOS", "CAJA CHICA": "VIATICOS", "REEMBOLSOS": "VIATICOS", "MOBILIARIO": "EQUIPOS Y ENSERES", "SILLA DE OFICINA": "EQUIPOS Y ENSERES", "ESCRITORIO": "EQUIPOS Y ENSERES", "MUEBLES": "EQUIPOS Y ENSERES",
  // ─── Aprobados el 2026-08-31 (diagnóstico del catálogo contable 2027) ───
  // Grafías reales encontradas en Cuervito, TI H1 2026 y PERDIZ-PAPAN que caían
  // en SIN CATEGORÍA. Las dos primeras ya las resuelve normCat por acento; se
  // dejan explícitas porque así vinieron aprobadas y porque documentan la
  // grafía exacta que hay capturada hoy en Supabase.
  "ARTÍCULOS DE SEGURIDAD": "ARTICULOS DE SEGURIDAD",
  "VIÁTICOS": "VIATICOS",
  // El valor es el RUBRO, no la subcuenta: macroDeCategoria NO encadena, así que
  // apuntar a "ARRENDAMIENTO DE INMUEBLES" (que es subcuenta, CSV línea 7)
  // creaba un grupo fantasma separado del de la grafía en singular.
  "ARRENDAMIENTOS DE INMUEBLES": "ARRENDA DE INMUEBLES Y SERV",
  "MATERIAL DE SALUD": "MATERIALES DE SALUD",
  // TUBERIAS es SUBCUENTA del rubro MATERIALES en el catálogo 2027 (CSV línea
  // 60), no un rubro. Estuvo mapeada a sí misma entre el commit 45bbe74 y el
  // 2026-08-31, lo que creaba un grupo "TUBERIAS" fuera de los 15 rubros.
  "TUBERIAS": "MATERIALES",
  // ─── Aprobados por el usuario el 2026-08-31 ───
  // Estos dos sí requerían criterio: el texto capturado no es la subcuenta del
  // catálogo, se decidió a cuál corresponde. El valor es el RUBRO, que es lo
  // que agrupa la tabla contable.
  "HOSPEDAJE": "VIATICOS",            // subcuenta del catálogo: SERVICIOS DE HOSPEDAJE
  "IMPRESORAS EN RENTA": "SERVICIOS", // subcuenta del catálogo: SERVICIOS DE COPIADO
  // ─── Aprobados el 2026-08-31 ───
  // Coincidencia EXACTA con el CSV, sin criterio de por medio. Son opciones que
  // el dropdown CAT_OPEX ya ofrece y que hoy no tienen ninguna partida
  // capturada: el efecto es que dejan de caer en SIN CATEGORÍA si alguien las
  // elige a partir de ahora.
  "SEGUROS": "SERVICIOS",             // CSV línea 104: SERVICIOS,SEGUROS
  "FLETES NACIONALES": "SERVICIOS",   // CSV línea 83:  SERVICIOS,FLETES NACIONALES
  // ─── Definidos por Anel (contabilidad), 2026-09-01 ───
  // "las que se pagan cada mes van en cuotas y suscripciones, y las que se
  // pagan de manera anual van en software". Las dos anuales quedan aquí; la
  // mensual NO se pudo capturar todavía — ver nota al pie de este bloque.
  "LICENCIAMIENTO USD": "ACTIVOS",
  "LICENCIAMIENTO MXN ANUAL": "ACTIVOS",
  // "se podría incluir en otros activos" (Anel). Solo estas dos entran: las
  // otras tres que venían en el mismo pedido —GABINETE Y ENERGIA, TRANSMISION
  // y CENTRO DE MONITOREO— YA son rubros de CATS_MACRO_CONTABLE, y
  // macroDeCategoria consulta MACRO_POR_NORM antes que SUBCAT_POR_NORM, así
  // que un mapeo suyo aquí nunca se ejecutaría. Moverlas a OTROS ACTIVOS exige
  // sacarlas de CATS_MACRO_CONTABLE, que es de finanzas (regla 2 de CLAUDE.md).
  "ACCESORIOS": "ACTIVOS",
  "INFRAESTRUCTURA DE RED": "ACTIVOS",
  // Corrección del 2026-09-01. "CUOTAS Y SUSCRIPCIONES", el destino que había
  // dictado Anel, es SUBCUENTA del rubro SERVICIOS en el catálogo 2027, no un
  // rubro — habría sido el tercer caso del mismo error. Se mapea al rubro que la
  // contiene. Cero partidas capturadas: no mueve ningún monto.
  "LICENCIAMIENTO MXN MENSUAL": "SERVICIOS",
  // Estas tres SALIERON de CATS_MACRO_CONTABLE el 2026-09-01, con autorización
  // explícita del usuario (regla 2 de CLAUDE.md): Anel dictaminó que van a OTROS
  // ACTIVOS, o sea que no son rubros contables — tenerlas en la lista de rubros
  // era el error. Mientras estuvieron ahí, MACRO_POR_NORM ganaba sobre
  // SUBCAT_POR_NORM y cualquier mapeo suyo quedaba inerte.
  "GABINETE Y ENERGIA": "ACTIVOS",
  "TRANSMISION": "ACTIVOS",
  "CENTRO DE MONITOREO": "ACTIVOS",
  // ─── 2026-09-01: subcuentas que estaban mal puestas en CATS_MACRO_CONTABLE ───
  // Las nueve salieron de la lista de rubros ese día. Estas seis se mapean aquí
  // a su rubro real del CSV porque tienen partidas capturadas o son opción del
  // dropdown de CAPEX; sin el mapeo caerían en SIN CATEGORÍA.
  "EQUIPO DE TRANSPORTE": "ACTIVOS",   // CSV: subcuenta de ACTIVOS · 1 partida
  "MAQUINARIA Y EQUIPO": "ACTIVOS",    // CSV: subcuenta de ACTIVOS · 4 partidas
  "EQUIPO DE MOBILIARIO": "ACTIVOS",   // CSV: subcuenta de ACTIVOS · opción de CAT_CAPEX
  "OTROS ACTIVOS": "ACTIVOS",          // CSV: subcuenta de ACTIVOS · 5 partidas
  "SOFTWARE Y LICENCIAS": "ACTIVOS",   // CSV: "SOFTWARE Y LICICENCIAS" (errata de Anel), subcuenta de ACTIVOS
  // EQUIPO DE ADQUISICION no existe en el CSV. Aprobado a ACTIVOS: es CAPEX, ya
  // cuelga del macro:"ACTIVOS" fijo, y cualquier respuesta de Anel va a ser una
  // subcuenta de ACTIVOS igual. 4 partidas de Cuervito.
  "EQUIPO DE ADQUISICION": "ACTIVOS",
  // INSUMOS OPERATIVOS tampoco existe en el CSV. Su rubro se deduce de que
  // INSUMOS AGRICOLAS —la única clave que apuntaba aquí— es subcuenta de
  // INSUMOS DE OFICINA en el catálogo. 1 partida de Cuervito.
  "INSUMOS OPERATIVOS": "INSUMOS DE OFICINA",
  // NO se mapean, a propósito, y caen en SIN CATEGORÍA — van como pregunta a Anel:
  //   SERVICIOS DE CAPACITACION: el CSV la cuelga de SERVICIOS DE SALUD (línea 130).
  //     Capacitación bajo salud no es criterio contable, es una fila mal puesta.
  //     Son $225,499.14 de PERDIZ-PAPAN, visibles y honestos en SIN CATEGORÍA.
  //   UNIFORMES: el CSV la cuelga de VEHICULOS Y COMBUSTIBLE (línea 132). Mismo
  //     caso. Sin partidas capturadas hoy.
  };

// Normalización SOLO para comparar categorías contra el catálogo: ignora
// mayúsculas, espacios sobrantes y ACENTOS. No cambia ninguna lista ni ningún
// texto que capture o vea el usuario — únicamente cómo se comparan.
// Motivo: los dropdowns de captura están acentuados (CAT_OPEX trae "VIÁTICOS",
// "NÓMINA Y ADICIONALES", "ARTÍCULOS DE SEGURIDAD") y el catálogo contable no
// (VIATICOS, NOMINA Y ADICIONALES, ARTICULOS DE SEGURIDAD). Con la comparación
// anterior —.trim().toUpperCase() y nada más— elegir una opción del propio menú
// de la app la mandaba a SIN CATEGORÍA: 13 de 18 en CAT_OPEX, 3 de 7 en
// CAT_OPEX_VIA y 4 de 10 en CAT_CAPEX.
function normCat(s){
  return (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"")
    .toUpperCase().replace(/\s+/g," ").trim();
}
// Índices normalizados, armados una sola vez al cargar el módulo. El valor que
// guardan es la grafía CANÓNICA del catálogo, para que dos grafías de la misma
// cuenta ("VIÁTICOS" y "VIATICOS") caigan en el mismo grupo y no en dos.
const MACRO_POR_NORM  = new Map(CATS_MACRO_CONTABLE.map(m=>[normCat(m), m]));
const SUBCAT_POR_NORM = new Map(Object.entries(SUBCAT_MAPPING).map(([k,v])=>[normCat(k), v]));

// ─── GUARDARRAÍL DE DESARROLLO ──────────────────────────────────────────────
// Todo VALOR de SUBCAT_MAPPING tiene que ser uno de los rubros de
// CATS_MACRO_CONTABLE. Si apunta a una subcuenta, macroDeCategoria la devuelve
// tal cual —NO encadena, no vuelve a resolver— y esa partida termina en un
// grupo con un nombre que no existe entre los rubros del catálogo. No truena
// nada: el monto es correcto, el subtotal es correcto, y el error solo se ve
// leyendo con cuidado la tabla contable.
//
// Pasó tres veces: "TUBERIAS" -> "TUBERIAS" y "ARRENDAMIENTOS DE INMUEBLES" ->
// "ARRENDAMIENTO DE INMUEBLES" (ambas del commit 45bbe74, corregidas en 68dd4ee
// y 2550d47), y "LICENCIAMIENTO MXN MENSUAL" -> "CUOTAS Y SUSCRIPCIONES", que
// este guardarraíl atajó antes de entrar (2026-09-01).
//
// import.meta.env.DEV lo deja fuera del bundle de producción: Vite lo sustituye
// por false y elimina el bloque entero como código muerto.
if(import.meta.env.DEV){
  // (1) Todo VALOR de SUBCAT_MAPPING tiene que ser un rubro.
  const rubros=new Set(CATS_MACRO_CONTABLE.map(normCat));
  const malas=Object.entries(SUBCAT_MAPPING).filter(([,v])=>!rubros.has(normCat(v)));
  if(malas.length){
    console.error(
      `[catálogo contable] ${malas.length} entrada(s) de SUBCAT_MAPPING apuntan a algo que NO es\n`+
      `un rubro de CATS_MACRO_CONTABLE. macroDeCategoria devuelve el valor sin volver a\n`+
      `resolverlo, así que cada una crea un grupo fantasma en la tabla contable.\n`+
      `Corregir el VALOR para que sea el rubro al que pertenece la subcuenta:\n`+
      malas.map(([k,v])=>`    "${k}"  ->  "${v}"   ← "${v}" no es un rubro`).join("\n")
    );
  }
  // (2) La lista de rubros tiene que seguir siendo los 14 del CSV + la
  // excepción provisional. Esta es la comprobación que faltaba: las nueve
  // subcuentas que salieron el 2026-09-01 llevaban meses ahí sin que nada
  // avisara, y cada una pintaba un subtotal inexistente en el archivo de Anel.
  // El CSV no se puede leer en tiempo de ejecución, así que se vigila el conteo:
  // si alguien agrega o quita, que lo tenga que justificar a mano.
  const ESPERADOS=18; // los 18 RUBROS de docs/catalogo_contable_2027.csv
  if(CATS_MACRO_CONTABLE.length!==ESPERADOS){
    console.error(
      `[catálogo contable] CATS_MACRO_CONTABLE tiene ${CATS_MACRO_CONTABLE.length} entradas y se\n`+
      `esperaban ${ESPERADOS}: los RUBROS de docs/catalogo_contable_2027.csv, que en el Excel van\n`+
      `en negritas sobre dorado. Si agregaste una SUBCUENTA aquí, quítala y ponla en\n`+
      `SUBCAT_MAPPING apuntando a su rubro: en esta lista gana sobre SUBCAT_MAPPING y pinta un\n`+
      `subtotal que no existe en el archivo de contabilidad. Si de verdad cambió el catálogo,\n`+
      `actualiza el CSV y ESPERADOS en la misma pasada.`
    );
  }
  // (3) Todo rubro tiene su clave de 3 letras, y toda clave apunta a un rubro
  // real. El cruce va AQUÍ y no en catalogoClaves.js porque CATS_MACRO_CONTABLE
  // vive en este archivo: importarla desde allá crearía un ciclo.
  // Sin clave, el "Excel para Apps" escribiría una celda vacía en la columna
  // Clave y el sistema de la contadora rechaza el archivo — o peor, lo carga
  // incompleto. Que se vea en desarrollo, no al momento de entregar.
  const sinClave=CATS_MACRO_CONTABLE.filter(r=>!claveDeRubro(r));
  if(sinClave.length){
    console.error(
      `[claves] ${sinClave.length} rubro(s) de CATS_MACRO_CONTABLE no tienen clave de 3 letras:\n`+
      sinClave.map(r=>`    ${r}`).join("\n")+"\n"+
      `El "Excel para Apps" no puede escribir su columna Clave y el sistema de la contadora\n`+
      `rechazaría el archivo. Agrégalas en docs/claves-rubros-anel.csv y en\n`+
      `src/catalogoClaves.js — las dicta ella, no se deducen del nombre.`
    );
  }
  const rubrosNorm=new Set(CATS_MACRO_CONTABLE.map(normCat));
  const clavesHuerfanas=RUBROS_EGRESOS.filter(r=>!rubrosNorm.has(normCat(r.rubro)));
  if(clavesHuerfanas.length){
    console.error(
      `[claves] clave(s) que apuntan a un rubro que ya no existe en CATS_MACRO_CONTABLE:\n`+
      clavesHuerfanas.map(r=>`    ${r.clave} -> "${r.rubro}"`).join("\n")+"\n"+
      `O el rubro se renombró y hay que actualizar la clave, o la clave sobra.`
    );
  }
}

// Categoría escrita → categoría contable macro (misma regla que usa el modal
// "¿A qué categoría contable pertenece?" y el aviso de partidas sin categoría) —
// versión standalone para usarse fuera del componente (ej. exportarExcel).
function macroDeCategoria(cat){
  const key=normCat(cat);
  if(!key) return "SIN CATEGORÍA";
  const macro=MACRO_POR_NORM.get(key);
  if(macro) return macro;
  const sub=SUBCAT_POR_NORM.get(key);
  if(sub) return sub;
  try{
    const m=JSON.parse(localStorage.getItem("geolis_subcat_map")||"{}");
    // Se recorre en vez de indexar: las claves ya guardadas se escribieron sin
    // normalizar, así que un "VIÁTICOS" viejo tiene que seguir empatando.
    for(const k in m){ if(normCat(k)===key) return m[k]; }
  }catch(e){}
  return "SIN CATEGORÍA";
}

// Partidas históricas para autocompletar al escribir categoría
const HISTORIAL_CAPEX = {
  "cuervito": [{"cat": "EQUIPO DE TRANSPORTE", "desc": "Camionetas", "unidad": "Unidad", "cantidad": 1, "monto": 550000.0}, {"cat": "EQUIPO DE ADQUISICION", "desc": "Sensores de presión", "unidad": "Unidad", "cantidad": 360, "monto": 2970.0}, {"cat": "EQUIPO DE ADQUISICION", "desc": "Gateway", "unidad": "Unidad", "cantidad": 180, "monto": 3150.0}, {"cat": "EQUIPO DE ADQUISICION", "desc": "PLC", "unidad": "Unidad", "cantidad": 50, "monto": 5400.0}, {"cat": "EQUIPO DE ADQUISICION", "desc": "Arreglos  y accesorios", "unidad": "Unidad", "cantidad": 180, "monto": 11700.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Panel solar", "unidad": "Unidad", "cantidad": 180, "monto": 1080.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Controlador de carga", "unidad": "Unidad", "cantidad": 180, "monto": 630.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Bateria Ciclo profundo", "unidad": "Unidad", "cantidad": 360, "monto": 1440.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Gabinete", "unidad": "Unidad", "cantidad": 180, "monto": 1620.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Cableado, clemas y riel", "unidad": "Unidad", "cantidad": 180, "monto": 1080.0}, {"cat": "TRANSMISION", "desc": "Kit Starlink mini", "unidad": "Unidad", "cantidad": 40, "monto": 4986.0}, {"cat": "TRANSMISION", "desc": "Antenas repetidoras", "unidad": "Unidad", "cantidad": 40, "monto": 19800.0}, {"cat": "CENTRO DE MONITOREO", "desc": "Monitores", "unidad": "Unidad", "cantidad": 6, "monto": 8100.0}, {"cat": "CENTRO DE MONITOREO", "desc": "Workstation", "unidad": "Unidad", "cantidad": 1, "monto": 32400.0}, {"cat": "CENTRO DE MONITOREO", "desc": "UPS", "unidad": "Unidad", "cantidad": 1, "monto": 4500.0}, {"cat": "CENTRO DE MONITOREO", "desc": "Accesorios", "unidad": "Unidad", "cantidad": 1, "monto": 3600.0}],
  "perdiz":   [{"cat": "EQUIPO DE TRANSPORTE", "desc": "Camionetas", "unidad": "Unidad", "cantidad": 0, "monto": 32025.45}, {"cat": "EQUIPO DE MOBILIARIO", "desc": "Comisionamiento Gen", "unidad": "Unidad", "cantidad": 1, "monto": 6500.0}, {"cat": "EQUIPO DE MOBILIARIO", "desc": "Material de Seguridad", "unidad": "Unidad", "cantidad": 0, "monto": 3500.0}, {"cat": "EQUIPO DE MOBILIARIO", "desc": "Herramienta Manual", "unidad": "Unidad", "cantidad": 1, "monto": 11538.46}, {"cat": "EQUIPO DE MOBILIARIO", "desc": "Comisionamiento HPS", "unidad": "Unidad", "cantidad": 0, "monto": 2000.0}, {"cat": "MAQUINARIA Y EQUIPO 1", "desc": "Bomba HPS", "unidad": "Unidad", "cantidad": 1, "monto": 176089.03}, {"cat": "MAQUINARIA Y EQUIPO 2", "desc": "VDF", "unidad": "Unidad", "cantidad": 1, "monto": 79961.3}, {"cat": "MAQUINARIA Y EQUIPO 3", "desc": "Generador", "unidad": "Unidad", "cantidad": 1, "monto": 513000.0}, {"cat": "MAQUINARIA Y EQUIPO 4", "desc": "Refaccionamiento bomba", "unidad": "Unidad", "cantidad": 1, "monto": 65000.0}, {"cat": "MAQUINARIA Y EQUIPO 5", "desc": "Refaccionamiento generador", "unidad": "Unidad", "cantidad": 1, "monto": 65000.0}, {"cat": "MAQUINARIA Y EQUIPO 6", "desc": "CCM", "unidad": "Unidad", "cantidad": 1, "monto": 160486.99501936912}, {"cat": "MAQUINARIA Y EQUIPO 7", "desc": "Cobertizo", "unidad": "Unidad", "cantidad": 1, "monto": 100000.0}, {"cat": "OTROS ACTIVOS", "desc": "Obra mecanica", "unidad": "Unidad", "cantidad": 1, "monto": 94452.26}, {"cat": "OTROS ACTIVOS", "desc": "Valvulas", "unidad": "Unidad", "cantidad": 1, "monto": 117998.91}, {"cat": "OTROS ACTIVOS", "desc": "Obra Electrica", "unidad": "Unidad", "cantidad": 1, "monto": 556015.9120088544}, {"cat": "OTROS ACTIVOS", "desc": "RICCSSA", "unidad": "Obra civil", "cantidad": 1, "monto": 280969.06156405987}, {"cat": "OTROS ACTIVOS", "desc": "Pruebas PND y Pintura", "unidad": "Unidad", "cantidad": 1, "monto": 17867.79}, {"cat": "PARIDAD", "desc": "18.07", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "MES", "desc": "30.4", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "PERIODO PAGO (DÍAS)", "desc": "30", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "GASOLINA MAGNA", "desc": "22", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "DIESEL", "desc": "23", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "LINEA DE 12 A 4", "desc": "1265057.97", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "LINEA DE 16 A 6", "desc": "1553586.78", "unidad": "Unidad", "cantidad": 1, "monto": 0}],
};
const HISTORIAL_NOMINA = {
  "cuervito": [{"puesto": "Especialista telemetría", "cantidad": 1, "salario": 25000.0}, {"puesto": "Técnico instrumentista", "cantidad": 1, "salario": 20000.0}],
};

// ── PUNTO 8: Autocompletar con histórico real ────────────────────────────────
// Busca en: 1) presupuestos guardados en localStorage 2) datos de Excel

// OPEX histórico de Cuervito (pestaña SERVICIO)
const HISTORIAL_OPEX_BASE = [
  {cat:"ARRENDA DE INMUEBLES Y SERV",  desc:"Arrendamiento de inmuebles y servicios", unidad:"Servicio",cantidad:1, monto:13000, periodicidad:"mensual"},
  {cat:"ARTICULOS DE SEGURIDAD",       desc:"Ropa y artículos de protección EPP",     unidad:"Unidad", cantidad:1,   monto:40000, periodicidad:"anual"},
  {cat:"EQUIPO DE COMPUTO",            desc:"Equipo de cómputo adquisición",          unidad:"Unidad", cantidad:1,   monto:84000, periodicidad:"anual"},
  {cat:"INSUMOS OPERATIVOS",           desc:"Insumos operativos varios",              unidad:"Servicio",cantidad:1, monto:2700,  periodicidad:"mensual"},
  {cat:"INSUMOS DE OFICINA",           desc:"Papelería y útiles de oficina",          unidad:"Servicio",cantidad:1, monto:2700,  periodicidad:"mensual"},
  {cat:"MATERIALES",                   desc:"Poste de telemetría y materiales",       unidad:"Global", cantidad:1,   monto:810000, periodicidad:"anual"},
  {cat:"NOMINA Y ADICIONALES",         desc:"Nómina y adicionales mensual",           unidad:"Servicio",cantidad:1, monto:73490.13,periodicidad:"mensual"},
  {cat:"SERV TELEFONIA CELULAR Y RADIO",desc:"Servicio telefonía celular y radio",    unidad:"Servicio",cantidad:1, monto:66000, periodicidad:"mensual"},
  {cat:"SERVICIOS",                    desc:"Cuadrilla de instalación y herramienta", unidad:"Global", cantidad:1,   monto:1294000, periodicidad:"anual"},
  {cat:"VEHICULOS Y COMBUSTIBLE",      desc:"Vehículos y combustible mensual",        unidad:"Servicio",cantidad:1, monto:26216.67,periodicidad:"mensual"},
  {cat:"VIATICOS",                     desc:"Alimentación y hospedaje",              unidad:"Día",    cantidad:30,  monto:800,   periodicidad:"mensual"},
  {cat:"VIATICOS",                     desc:"Casetas, puentes y peajes",             unidad:"Servicio",cantidad:1, monto:500,   periodicidad:"mensual"},
  {cat:"SERVICIOS DE CAPACITACION",    desc:"Capacitación técnica especializada",    unidad:"Servicio",cantidad:1,  monto:15000, periodicidad:"anual"},
  {cat:"UNIFORMES",                    desc:"Uniformes y ropa de trabajo",           unidad:"Unidad", cantidad:10,  monto:1200,  periodicidad:"anual"},
  {cat:"MARKETING",                    desc:"Materiales de marketing y publicidad",  unidad:"Servicio",cantidad:1, monto:5000,  periodicidad:"mensual"},
];

function getHistorialLS(){
  // Leer presupuestos guardados del localStorage para autocompletar
  try {
    const estado = JSON.parse(localStorage.getItem(LS_APP_KEY)||"{}");
    const lista = estado.lista || [];
    const partidas = [];
    lista.forEach(p => {
      const costos = p._costos || {};
      Object.values(costos).forEach(area => {
        ["capex","mat","via"].forEach(cat => {
          (area[cat]||[]).forEach(p => {
            if(p.desc && p.monto > 0) partidas.push({...p, _fuente:"historial"});
          });
        });
      });
      (p._capexPM||[]).forEach(p=>{ if(p.desc&&p.monto>0) partidas.push({...p,_fuente:"historial"});});
      (p._opexPM||[]).forEach(p=>{ if(p.desc&&p.monto>0) partidas.push({...p,_fuente:"historial"});});
    });
    return partidas;
  } catch(e){ return []; }
}

function buscarHistorial(cat, tipo="capex") {
  // Buscar en datos fijos del Excel
  const histFijo = tipo==="capex"
    ? Object.values(HISTORIAL_CAPEX).flat()
    : HISTORIAL_OPEX_BASE;
  // Buscar también en localStorage
  const histLS = getHistorialLS().filter(p => tipo==="capex"
    ? !["mat","via"].includes(p._origen)
    : true);
  const todos = [...histFijo, ...histLS];
  const results = [];
  const catUp = cat.toUpperCase();
  todos.forEach(p => {
    if(!p.cat||!p.desc) return;
    const match = p.cat.toUpperCase().includes(catUp) || catUp.includes(p.cat.toUpperCase())
      || p.desc.toUpperCase().includes(catUp);
    if(match && !results.find(r=>r.desc===p.desc && r.monto===p.monto)) {
      results.push(p);
    }
  });
  return results.slice(0,8);
}

const UNIDADES=[
  "Unidad",    // equipos, piezas contables
  "Pieza",     // repuestos, artículos
  "Servicio",  // contratos de servicio (arrendamiento, telefonía, etc.)
  "Global",    // partidas de suma alzada
  "Día",       // viáticos, jornadas
  "Hora",      // mano de obra por hora
  "Kg",        // materiales por peso
  "Metro",     // materiales por longitud
  "Litro",     // combustibles, insumos líquidos
  "Viaje",     // fletes, transportes
];
// NOTA: "Mes" y "Año" NO son unidades — son periodicidades.
// Arrendamiento: Unidad=Servicio, Cantidad=1, Periodicidad=Mensual

// Catálogo de puestos nómina
const PUESTOS_CAT=[
  "Director de Proyecto","Gerente de Área","Supervisor","Ingeniero de Campo",
  "Técnico Especialista","Técnico","Operador","Ayudante General",
];

// ─── PLANTILLAS ───────────────────────────────────────────────────────────────
const PLANTILLAS={
  cuervito:{
    nombre:"Monitoreo Cuervito", icon:"📋", tipos:["servicio","instalacion"],
    desc:"01022026 Presupuesto Monitoreo Cuervito — datos reales del Excel",
    // ── CAPEX real del archivo Excel F00 INVERSIÓN ──────────────────────────
    capex:[
      {cat:"EQUIPO DE TRANSPORTE",   desc:"Camionetas",              unidad:"Unidad", cantidad:1,   monto:550000},
      {cat:"EQUIPO DE ADQUISICION",  desc:"Sensores de presión",     unidad:"Unidad", cantidad:360, monto:165},
      {cat:"EQUIPO DE ADQUISICION",  desc:"Gateway",                 unidad:"Unidad", cantidad:180, monto:175},
      {cat:"EQUIPO DE ADQUISICION",  desc:"PLC",                     unidad:"Unidad", cantidad:50,  monto:300},
      {cat:"EQUIPO DE ADQUISICION",  desc:"Arreglos y accesorios",   unidad:"Unidad", cantidad:180, monto:650},
      {cat:"GABINETE Y ENERGIA",     desc:"Panel solar",             unidad:"Unidad", cantidad:180, monto:60},
      {cat:"GABINETE Y ENERGIA",     desc:"Controlador de carga",    unidad:"Unidad", cantidad:180, monto:35},
      {cat:"GABINETE Y ENERGIA",     desc:"Bateria Ciclo profundo",  unidad:"Unidad", cantidad:360, monto:80},
      {cat:"GABINETE Y ENERGIA",     desc:"Gabinete",                unidad:"Unidad", cantidad:180, monto:90},
      {cat:"GABINETE Y ENERGIA",     desc:"Cableado, clemas y riel", unidad:"Unidad", cantidad:180, monto:60},
      {cat:"TRANSMISION",            desc:"Kit Starlink mini",       unidad:"Unidad", cantidad:40,  monto:277},
      {cat:"TRANSMISION",            desc:"Antenas repetidoras",     unidad:"Unidad", cantidad:40,  monto:1100},
      {cat:"CENTRO DE MONITOREO",    desc:"Monitores",               unidad:"Unidad", cantidad:6,   monto:450},
      {cat:"CENTRO DE MONITOREO",    desc:"Workstation",             unidad:"Unidad", cantidad:1,   monto:1800},
      {cat:"CENTRO DE MONITOREO",    desc:"UPS",                     unidad:"Unidad", cantidad:1,   monto:250},
      {cat:"CENTRO DE MONITOREO",    desc:"Accesorios",              unidad:"Unidad", cantidad:1,   monto:200},
    ],
    // ── OPEX real del archivo Excel (pestaña SERVICIO/EGRESOS) ───────────────
    opex:[
      {cat:"ARRENDA DE INMUEBLES Y SERV",  desc:"Arrendamiento de inmuebles y servicios", unidad:"Servicio", cantidad:1,  monto:13000,   periodicidad:"mensual"},
      {cat:"ARTICULOS DE SEGURIDAD",       desc:"Ropa y artículos de protección EPP",     unidad:"Unidad",   cantidad:1,  monto:40000, periodicidad:"anual"},
      {cat:"EQUIPO DE COMPUTO",            desc:"Equipo de cómputo adquisición",          unidad:"Unidad",   cantidad:1,  monto:84000, periodicidad:"anual"},
      {cat:"INSUMOS OPERATIVOS",           desc:"Insumos operativos varios",              unidad:"Servicio", cantidad:1,  monto:2700,    periodicidad:"mensual"},
      {cat:"INSUMOS DE OFICINA",           desc:"Papelería y útiles de oficina",          unidad:"Servicio", cantidad:1,  monto:2700,    periodicidad:"mensual"},
      {cat:"MATERIALES",                   desc:"Poste de telemetría y materiales",       unidad:"Global",   cantidad:1,  monto:810000, periodicidad:"anual"},
      {cat:"NOMINA Y ADICIONALES",         desc:"Nómina y adicionales mensual",           unidad:"Servicio", cantidad:1,  monto:73490.13,periodicidad:"mensual"},
      {cat:"SERV TELEFONIA CELULAR Y RADIO",desc:"Servicio telefonía celular y radio",    unidad:"Servicio", cantidad:1,  monto:66000,   periodicidad:"mensual"},
      {cat:"SERVICIOS",                    desc:"Cuadrilla de instalación y herramienta", unidad:"Global",   cantidad:1,  monto:1294000, periodicidad:"anual"},
      {cat:"VEHICULOS Y COMBUSTIBLE",      desc:"Vehículos y combustible mensual",        unidad:"Servicio", cantidad:1,  monto:26216.67,periodicidad:"mensual"},
    ],
    // ── Nómina real del archivo Excel F01 NÓMINA ─────────────────────────────
    nomina:[
      {puesto:"Especialista telemetría",   cantidad:1, salario:25000},
      {puesto:"Técnico instrumentista",    cantidad:1, salario:20000},
    ],
  },
  instalacion:{
    nombre:"Proyecto de Instalación",icon:"🏗️",tipos:["instalacion"],
    desc:"Proyectos de campo con mano de obra",
    capex:[
      {cat:"EQUIPO DE TRANSPORTE", desc:"Camionetas de campo",                    unidad:"Unidad",cantidad:1,monto:0},
      {cat:"MAQUINARIA Y EQUIPO",  desc:"Equipo especializado de instalación",    unidad:"Unidad",cantidad:1,monto:0},
      {cat:"GABINETE Y ENERGÍA",   desc:"Gabinetes y sistema de energía",         unidad:"Global",cantidad:1,monto:0},
      {cat:"TRANSMISIÓN",          desc:"Equipos de transmisión y comunicación",  unidad:"Global",cantidad:1,monto:0},
    ],
    opex:[
      {cat:"NÓMINA Y ADICIONALES",     desc:"Nómina mensual del proyecto",          unidad:"Mes",     cantidad:1,monto:0},
      {cat:"ARTÍCULOS DE SEGURIDAD",   desc:"EPP, uniformes y seguridad industrial",unidad:"Mes",     cantidad:1,monto:0},
      {cat:"VEHÍCULOS Y COMBUSTIBLE",  desc:"Combustible mensual de campo",         unidad:"Mes",     cantidad:1,monto:0},
      {cat:"VIÁTICOS",                 desc:"Viáticos del equipo en campo",          unidad:"Día",     cantidad:1,monto:0},
      {cat:"MATERIALES",               desc:"Materiales de instalación",             unidad:"Global",  cantidad:1,monto:0},
      {cat:"TELECOMUNICACIONES",       desc:"Radio y comunicaciones de campo",       unidad:"Mes",     cantidad:1,monto:0},
      {cat:"SERVICIOS DE CAPACITACIÓN",desc:"Capacitaciones requeridas",             unidad:"Servicio",cantidad:1,monto:0},
    ],
  },
  depto_ti:{
    nombre:"Depto. TI 2026 — Geolis",icon:"💻",tipos:["departamento"],
    desc:"Presupuesto TI 1er Semestre 2026 — Geolis SA de CV",
    fechaInicio:"2026-01-01", fechaFin:"2026-06-30",
    // ── CAPEX real de Presupuesto_1er_semestre2026_Geolis.xlsx ──────────────
    capex:[
      {cat:"EQUIPO DE COMPUTO",      desc:"Laptops Dell Pro/Plus/Max — Geolis Ene", unidad:"Unidad", cantidad:72, monto:25209, mesGastoMes:1, mesGastoAnio:2026},
      {cat:"EQUIPO DE COMPUTO",      desc:"Laptop Dell Pro — Cuervito Mar",         unidad:"Unidad", cantidad:16, monto:25209, mesGastoMes:3, mesGastoAnio:2026},
      {cat:"EQUIPO DE COMPUTO",      desc:"Laptops Dell — Geolis Abr",              unidad:"Unidad", cantidad:20, monto:25209, mesGastoMes:4, mesGastoAnio:2026},
      {cat:"EQUIPO DE COMPUTO",      desc:"Laptops Dell — May",                     unidad:"Unidad", cantidad:15, monto:25209, mesGastoMes:5, mesGastoAnio:2026},
      {cat:"ACCESORIOS",             desc:"Monitores y teclados Dell — Mar",        unidad:"Unidad", cantidad:96, monto:1652,  mesGastoMes:3, mesGastoAnio:2026},
      {cat:"ACCESORIOS",             desc:"Monitores, teclados y docking — Abr",    unidad:"Unidad", cantidad:60, monto:2835,  mesGastoMes:4, mesGastoAnio:2026},
      {cat:"ACCESORIOS",             desc:"Monitor Dell S3225QS — May",             unidad:"Unidad", cantidad:4,  monto:9000,  mesGastoMes:5, mesGastoAnio:2026},
      {cat:"ACCESORIOS",             desc:"Monitores y accesorios — Jun",           unidad:"Unidad", cantidad:7,  monto:2000,  mesGastoMes:6, mesGastoAnio:2026},
      {cat:"ACCESORIOS",             desc:"Plaud — Grabador IA",                    unidad:"Unidad", cantidad:1,  monto:3800,  mesGastoMes:6, mesGastoAnio:2026},
      {cat:"INFRAESTRUCTURA DE RED", desc:"Starlinks y switches — Jun",             unidad:"Unidad", cantidad:8,  monto:13612, mesGastoMes:6, mesGastoAnio:2026},
    ],
    // ── OPEX real de Presupuesto_1er_semestre2026_Geolis.xlsx ───────────────
    opex:[
      {cat:"LICENCIAMIENTO MXN MENSUAL", desc:"MS Office 365 Negocios 25u",                      unidad:"Servicio", cantidad:25,  monto:183,   periodicidad:"mensual", mesInicioOpex:1},
      {cat:"LICENCIAMIENTO MXN MENSUAL", desc:"MS Office 365 Teams 25u",                         unidad:"Servicio", cantidad:25,  monto:75,    periodicidad:"mensual", mesInicioOpex:1},
      {cat:"LICENCIAMIENTO MXN MENSUAL", desc:"Adobe Acrobat Standard 16u",                      unidad:"Servicio", cantidad:16,  monto:299,   periodicidad:"mensual", mesInicioOpex:1},
      {cat:"LICENCIAMIENTO MXN MENSUAL", desc:"Adobe Creative Cloud 3u",                         unidad:"Servicio", cantidad:3,   monto:1500,  periodicidad:"mensual", mesInicioOpex:1},
      {cat:"LICENCIAMIENTO MXN MENSUAL", desc:"Correos .mx POP 324u",                            unidad:"Servicio", cantidad:324, monto:120,   periodicidad:"mensual", mesInicioOpex:1},
      {cat:"TELECOMUNICACIONES",         desc:"Internet 7 sitios (Totalplay+Telmex+Megacable)",  unidad:"Servicio", cantidad:1,   monto:8396,  periodicidad:"mensual", mesInicioOpex:1},
      {cat:"TELECOMUNICACIONES",         desc:"Starlink Business 43 unidades activas",           unidad:"Servicio", cantidad:1,   monto:67725, periodicidad:"mensual", mesInicioOpex:1},
    ],
    nomina:[],
  },
};

function plantillasSugeridas(tipo){
  return Object.entries(PLANTILLAS)
    .filter(([,pl])=>pl.tipos.includes(tipo))
    .map(([key,pl])=>({key,...pl}));
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// ─── HELPERS PERIODICIDAD ────────────────────────────────────────────────────
const PERIODICIDADES = [
  {id:"mensual",      label:"Mensual",      factor:1},
  {id:"bimestral",    label:"Bimestral",    factor:0.5},
  {id:"trimestral",   label:"Trimestral",   factor:1/3},
  {id:"semestral",    label:"Semestral",    factor:1/6},
  {id:"anual",        label:"Anual",        factor:1/12},
];

const PM_INTERVALO = {mensual:1, bimestral:2, trimestral:3, semestral:6, anual:12};

// Calcula cuántas veces ocurre el gasto durante N meses del proyecto
function vecesEnProyecto(periodicidad, numMeses=12){
  const intervalo = PM_INTERVALO[periodicidad]||1;
  return Math.ceil(numMeses / intervalo);
}

// Distribuye el OPEX en los meses correctos según periodicidad y mes de inicio.
// M0 nunca lleva OPEX (es el mes de instalación) — el mínimo mes de inicio es M1.
function distribuirOpex(p, numMeses=12){
  // Periodicidad sin elegir (02-sep-2026): el renglón NO se distribuye en ningún
  // mes y aporta $0.00. Antes el `||"mensual"` de abajo asumía la periodicidad
  // más cara que existe —repetir el gasto todos los meses— sobre un campo que el
  // usuario nunca tocó. Un $0.00 con aviso amarillo arriba es incómodo a
  // propósito: es la única forma de que el hueco se vea.
  // Los renglones ya guardados traen su periodicidad y no pasan por aquí.
  if(!p.periodicidad) return Array(numMeses+1).fill(0);
  const intervalo = PM_INTERVALO[p.periodicidad||"mensual"]||1;
  const inicio = Math.max(1, p.mesInicioOpex||1);
  const montoMes = (p.monto||0)*(p.cantidad||1);
  // Repeticiones: cuántas veces ocurre este gasto antes de parar (ej. una cuadrilla
  // de instalación mensual que solo dura 3 meses). Vacío/0 = sin límite (se repite
  // hasta el fin del proyecto, comportamiento de siempre).
  const maxOcurrencias = p.repeticiones>0 ? p.repeticiones : Infinity;
  return Array(numMeses+1).fill(0).map((_,i)=>{
    if(i<inicio) return 0;
    if((i-inicio)%intervalo!==0) return 0;
    const ocurrencia=(i-inicio)/intervalo+1;
    return ocurrencia<=maxOcurrencias ? montoMes : 0;
  });
}

// Total OPEX de una partida en el proyecto = suma de su distribución mensual real
function totalOpexPartida(p, numMeses=12){
  return distribuirOpex(p, numMeses).reduce((s,v)=>s+v, 0);
}

// Índice de mes (0=M0) en que cae una compra CAPEX, según su fecha real vs. fecha de inicio del proyecto
function mesIndexCapex(p, fechaInicio, numMeses=12){
  if(!p.mesGastoMes || !p.mesGastoAnio || !fechaInicio) return 0;
  const inicio = new Date(fechaInicio+"T00:00:00");
  const anioIni = inicio.getFullYear(), mesIni = inicio.getMonth()+1;
  const diff = (parseInt(p.mesGastoAnio)-anioIni)*12 + (parseInt(p.mesGastoMes)-mesIni);
  return Math.min(Math.max(diff,0), numMeses);
}

// Traduce un mes relativo del proyecto (0=M0) a "Mmm AAAA" real, a partir de
// la Fecha Inicio del presupuesto — misma fórmula que ya usa el bloque "Cae
// en:" de abajo, extraída aquí para reutilizarla donde solo hay el mes
// relativo y no una fecha capturada (ver PartidaTable, mostrarFechaReal).
function mesLabelReal(offset, fechaInicio){
  if(!fechaInicio) return null;
  const d = new Date(fechaInicio+"T00:00:00");
  d.setMonth(d.getMonth()+offset);
  const nombresMes=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${nombresMes[d.getMonth()]} ${d.getFullYear()}`;
}

// Fase 1.6.b (corrección) — versión corta "Mmm AA" para encabezados de columna
// angostos (55-62px). NO reemplaza a MESES13 (M0/M1/M2...), que sigue
// alimentando gráficas/Excel tal cual — este arreglo es paralelo, mismo largo,
// solo para pintar el nombre del mes debajo del código.
function nombreMesReal(offset, fechaInicio){
  if(!fechaInicio) return "";
  const d=new Date(fechaInicio+"T00:00:00");
  d.setMonth(d.getMonth()+offset);
  const m=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${m[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

// Duración real del proyecto en meses operativos (M1..Mn), a partir de las fechas
// capturadas — soporta desde presupuestos de 6 meses hasta de 20 años (240 meses).
// Default 12 si no hay fechas (mismo comportamiento de siempre para M0..M12).
function calcularNumMesesOp(fechaInicio, fechaFin){
  if(!fechaInicio || !fechaFin) return 12;
  const ini=new Date(fechaInicio+"T00:00:00"), fin=new Date(fechaFin+"T00:00:00");
  const meses=(fin.getFullYear()-ini.getFullYear())*12 + (fin.getMonth()-ini.getMonth());
  return Math.max(1, meses);
}

// Meses activos de un puesto de nómina
function mesesNomina(puesto, numMeses=12){
  if(puesto.tipoPersonal==="fijo") return numMeses;
  if(puesto.tipoPersonal==="contrato"||puesto.tipoPersonal==="outsourcing")
    return Math.min(puesto.mesesContrato||12, numMeses);
  // Tipo de personal sin elegir (02-sep-2026): 0 meses activos, o sea $0.00 al
  // costo anual, y aviso amarillo en la sección. Antes este return caía en
  // numMeses, o sea que un puesto sin tipo se cobraba como FIJO —el caso más
  // caro— durante todo el proyecto. Un puesto ya guardado siempre trae tipo
  // (verificado por GET: 10 fijo, 9 contrato, 0 vacíos), así que no cambia nada
  // de lo existente.
  return 0;
}

// Distribuye el costo de nómina de un puesto en los meses en que está activo
function distribuirNomina(puesto, numMeses=12){
  const f=1+(puesto.imss??F_IMSS)+(puesto.prestaciones??F_PREST)+(puesto.isr??F_ISR);
  const costoMes=(puesto.salario||0)*f*(puesto.cantidad||1);
  const duracion = mesesNomina(puesto, numMeses);
  const inicio = puesto.tipoPersonal==="fijo" ? 1 : Math.max(1, puesto.mesInicio||1);
  return Array(numMeses+1).fill(0).map((_,i)=>{
    if(i<inicio || i>=inicio+duracion) return 0;
    return costoMes;
  });
}

// Costo total nómina de un puesto en el proyecto
function costoTotalNomina(puesto, numMeses=12){
  return distribuirNomina(puesto, numMeses).reduce((s,v)=>s+v, 0);
}

// ─── SERIE MENSUAL DEL PRESUPUESTO COMPLETO ──────────────────────────────────
// Extraído de Step 4 (Resumen mensual) para poder reutilizarse tal cual en
// Step 5 (Mi presupuesto) sin duplicar la lógica de cálculo — misma función,
// mismos resultados, cero cambio de comportamiento en Step 4.
function calcularSerieMensual({pres, areas, costos, capexPM, opexPM, ingresos, ingAdicionales}){
  const cats=getAreasCat(pres?.tipo||"instalacion");
  // Duración real del proyecto (de 6 meses a 20 años) según fechaInicio/fechaFin —
  // ya no se asume siempre M0..M12.
  const NUM_MESES_OP=calcularNumMesesOp(pres?.fechaInicio, pres?.fechaFin);
  const NMESES=NUM_MESES_OP+1; // +1 por M0 (instalación)
  // Fase 1.6.b (corrección 2) — "(Inst.)" solo aplica a instalación/servicio;
  // un departamental no tiene mes de instalación. Cambia solo el elemento 0,
  // el arreglo sigue teniendo el mismo largo (NUM_MESES_OP+1) — no mueve
  // geometría de gráficas ni nada que dependa de MESES13.length.
  const esProyecto = pres?.tipo==="instalacion" || pres?.tipo==="servicio";
  const MESES13=[esProyecto?"M0 (Inst.)":"M0",
    ...Array.from({length:NUM_MESES_OP},(_,i)=>`M${i+1}`)];
  // Fase 1.6.b (corrección) — arreglo paralelo a MESES13, mismo largo, solo con
  // el nombre real del mes ("Mar 26"). Sin fechaInicio queda de puras cadenas
  // vacías (mismo comportamiento de hoy: se ve únicamente el código M1/M2...).
  const MESES13_MES = Array.from({length: NUM_MESES_OP+1},
    (_,i) => nombreMesReal(i, pres?.fechaInicio));
  // Rango de años para selects (ingresos adicionales) — mismo criterio que PartidaTable
  const anioIniProy=pres?.fechaInicio ? new Date(pres.fechaInicio+"T00:00:00").getFullYear() : 2024;
  const anioFinProy=pres?.fechaFin ? new Date(pres.fechaFin+"T00:00:00").getFullYear() : anioIniProy+11;
  const RANGO_ANIOS=Array.from({length: Math.max(12, anioFinProy-anioIniProy+3)}, (_,i)=>anioIniProy-1+i);

  // ── Cálculos mensuales ─────────────────────────────────────────────────

  // CAPEX: cada partida cae en el mes real de compra (fecha vs. fecha de inicio del proyecto)
  const mCapex=Array(NMESES).fill(0);
  areas.forEach(id=>{
    (costos[id]?.capex||[]).forEach(p=>{
      mCapex[mesIndexCapex(p,pres?.fechaInicio,NUM_MESES_OP)]+=(p.cantidad||0)*(p.monto||0);
    });
  });
  capexPM.forEach(p=>{
    mCapex[mesIndexCapex(p,pres?.fechaInicio,NUM_MESES_OP)]+=(p.cantidad||0)*(p.monto||0);
  });

  // Detalle por partida CAPEX (para la fila expandible de Tabla SERVICIO) —
  // no participa en ningún cálculo, solo reutiliza mesIndexCapex por partida.
  const capexDetalle=[];
  areas.forEach(id=>{
    (costos[id]?.capex||[]).forEach(p=>{
      const datos=Array(NMESES).fill(0);
      datos[mesIndexCapex(p,pres?.fechaInicio,NUM_MESES_OP)]+=(p.cantidad||0)*(p.monto||0);
      capexDetalle.push({label:p.desc||p.cat||"CAPEX",datos});
    });
  });
  capexPM.forEach(p=>{
    const datos=Array(NMESES).fill(0);
    datos[mesIndexCapex(p,pres?.fechaInicio,NUM_MESES_OP)]+=(p.cantidad||0)*(p.monto||0);
    capexDetalle.push({label:p.desc||p.cat||"CAPEX",datos});
  });

  // OPEX: cada partida se distribuye según su periodicidad y mes de inicio
  const mOpex=Array(NMESES).fill(0);
  areas.forEach(id=>{
    ["mat","via"].forEach(cat=>{
      (costos[id]?.[cat]||[]).forEach(p=>{
        distribuirOpex(p,NUM_MESES_OP).forEach((v,i)=>mOpex[i]+=v);
      });
    });
    (costos[id]?.nomina||[]).forEach(p=>{
      distribuirNomina(p,NUM_MESES_OP).forEach((v,i)=>mOpex[i]+=v);
    });
  });
  opexPM.forEach(p=>{
    distribuirOpex(p,NUM_MESES_OP).forEach((v,i)=>mOpex[i]+=v);
  });

  // Detalle por partida OPEX (para la fila expandible de Tabla SERVICIO) —
  // reutiliza distribuirOpex/distribuirNomina por partida, sin afectar mOpex.
  const opexDetalle=[];
  areas.forEach(id=>{
    ["mat","via"].forEach(cat=>{
      (costos[id]?.[cat]||[]).forEach(p=>{
        opexDetalle.push({label:p.desc||p.cat||"OPEX",datos:distribuirOpex(p,NUM_MESES_OP)});
      });
    });
    (costos[id]?.nomina||[]).forEach(p=>{
      opexDetalle.push({label:p.puesto==="Otro"?(p.puestoCustom||"Puesto"):(p.puesto||"Puesto"),datos:distribuirNomina(p,NUM_MESES_OP)});
    });
  });
  opexPM.forEach(p=>{
    opexDetalle.push({label:p.desc||p.cat||"OPEX",datos:distribuirOpex(p,NUM_MESES_OP)});
  });

  // Partidas sin categoría contable macro asignada (para revisión posterior) —
  // una categoría "tiene macro" si es ella misma una de las 27 CATS_MACRO_CONTABLE,
  // o si aparece en SUBCAT_MAPPING (fijo) o geolis_subcat_map (elegido por el usuario).
  const subcatMapLS=(()=>{ try{ return JSON.parse(localStorage.getItem("geolis_subcat_map")||"{}"); }catch(e){ return {}; } })();
  // Misma comparación normalizada que macroDeCategoria (ver normCat arriba):
  // si no, este contador diría "sin categoría" de partidas que la tabla sí
  // agrupa, y al revés.
  function tieneCategoriaMacro(cat){
    const key=normCat(cat);
    if(!key) return false;
    if(MACRO_POR_NORM.has(key)) return true;
    if(SUBCAT_POR_NORM.has(key)) return true;
    for(const k in subcatMapLS){ if(normCat(k)===key) return true; }
    return false;
  }
  let sinCategoriaMacro=0;
  areas.forEach(id=>{
    ["capex","mat","via"].forEach(cat=>{
      (costos[id]?.[cat]||[]).forEach(p=>{ if(!tieneCategoriaMacro(p.cat)) sinCategoriaMacro++; });
    });
  });

  // Egresos totales por mes
  const mEgresos=Array(NMESES).fill(0).map((_,i)=>mCapex[i]+mOpex[i]);

  // Ingresos (estado editable) + ingresos adicionales del mes correspondiente —
  // se arma con Array(NMESES) en vez de recortar "ingresos" para que proyectos
  // más largos que el arreglo guardado (ej. 20 años) no pierdan meses.
  const mIngresos=Array(NMESES).fill(0)
    .map((_,i)=>(ingresos[i]||0)+ingAdicionales.filter(x=>x.mes===i).reduce((s,x)=>s+x.monto,0));
  const totalIngresosAnual=mIngresos.reduce((s,v)=>s+v,0);

  // Flujo efectivo mensual = Ingresos - Egresos
  const mFlujo=Array(NMESES).fill(0).map((_,i)=>mIngresos[i]-mEgresos[i]);

  // Flujo acumulado
  const mFlujoAcum=Array(NMESES).fill(0);
  mFlujoAcum[0]=mFlujo[0];
  for(let i=1;i<NMESES;i++) mFlujoAcum[i]=mFlujoAcum[i-1]+mFlujo[i];

  // OPEX por categoría para Gráfica II — misma distribución real, agrupada por categoría
  const catOpexData={};
  function addACat(label,arr){
    if(!catOpexData[label]) catOpexData[label]=Array(NMESES).fill(0);
    arr.forEach((v,i)=>catOpexData[label][i]+=v);
  }
  areas.forEach(id=>{
    ["mat","via"].forEach(cat=>{
      (costos[id]?.[cat]||[]).forEach(p=>{
        addACat(p.cat||"SIN CATEGORÍA", distribuirOpex(p,NUM_MESES_OP));
      });
    });
    (costos[id]?.nomina||[]).forEach(p=>{
      addACat("NOMINA Y ADICIONALES", distribuirNomina(p,NUM_MESES_OP));
    });
  });
  opexPM.forEach(p=>{
    addACat(p.cat||"SIN CATEGORÍA", distribuirOpex(p,NUM_MESES_OP));
  });
  const catOpexSeries=Object.entries(catOpexData)
    .filter(([,arr])=>arr.some(v=>v>0))
    .map(([label,data],i)=>({
      label,
      color:["#DDAC00","#374151","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#6366f1"][i%8],
      data,
    }));

  return {cats, NUM_MESES_OP, NMESES, MESES13, MESES13_MES, anioIniProy, anioFinProy, RANGO_ANIOS,
    mCapex, capexDetalle, mOpex, opexDetalle, sinCategoriaMacro, mEgresos, mIngresos,
    totalIngresosAnual, mFlujo, mFlujoAcum, catOpexSeries};
}

// ─── PERSISTENCIA localStorage (PUNTO 5 — no perder datos al navegar) ────────
const LS_APP_KEY = "geolis_app_state_v4"; // v4: fix abrir + TI real + validaciones
function saveAppState(state){ try{ localStorage.setItem(LS_APP_KEY, JSON.stringify(state)); }catch(e){} }
function loadAppState(){ try{ const s=localStorage.getItem(LS_APP_KEY); return s?JSON.parse(s):null; }catch(e){return null;} }

const F_IMSS=0.32, F_PREST=0.40, F_ISR=0.05;
let _id=1; const uid=()=>++_id;

const fmt=n=>isNaN(n)||n==null?"$0.00":"$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtMiles=n=>isNaN(n)||n==null?"0.00":Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
// Monto compacto para que quepa en columnas angostas de mes ($1.2M, $540K) —
// movida a nivel de módulo para que TablaServicio (día 2) la use igual que TablaM.
const fmtK=v=>{
  if(v===0)return "—";
  const abs=Math.abs(v);
  const str=abs>=1000000?`$${(abs/1000000).toFixed(2)}M`:abs>=1000?`$${(abs/1000).toFixed(0)}K`:fmt(abs);
  return v<0?`-${str}`:str;
};

const LS_CATS="geolis_cats_v3";
function getCats(key=LS_CATS){try{return JSON.parse(localStorage.getItem(key)||"[]");}catch{return[];}}
function saveCat(c,key=LS_CATS){const e=getCats(key);if(!e.includes(c))localStorage.setItem(key,JSON.stringify([...e,c]));}

// unidad y periodicidad arrancan VACÍAS desde el 02-sep-2026 (pedido de Luis):
// un valor por omisión que el usuario nunca eligió mete dinero inventado en el
// presupuesto sin que nadie se entere. Ver distribuirOpex: periodicidad vacía
// aporta $0.00 y levanta aviso amarillo, en vez de asumir "mensual".
// Los renglones YA GUARDADOS no cambian: cargarPresupuestoDeNube pasa su valor
// explícito y el spread de o lo sobrescribe. Medido por GET el 02-sep-2026:
// cero renglones vacíos en toda la base.
function initP(o={}){return{id:uid(),cat:"",desc:"",unidad:"",cantidad:1,monto:0,
  mesGasto:0,             // índice M0-M12 para CAPEX
  mesGastoMes:"",         // mes real (1-12) para mostrar en calendario
  mesGastoAnio:"",        // año real para mostrar en calendario
  periodicidad:"",        // OPEX: mensual/bimestral/trimestral/semestral/anual — vacío = sin elegir
  mesInicioOpex:1,        // mes en que inicia el OPEX (1=primer mes)
  ...o};}
// puesto y tipoPersonal, mismo criterio. imss/prestaciones/isr NO se vacían: son
// tasas estándar de la empresa, iguales para todos, y campos numéricos, no
// selects — vaciarlas obligaría a teclear los mismos dos números en cada puesto.
function initN(o={}){return{id:uid(),puesto:"",puestoCustom:"",cantidad:1,salario:0,
  imss:F_IMSS,prestaciones:F_PREST,isr:F_ISR,
  tipoPersonal:"",       // fijo / contrato / outsourcing — vacío = sin elegir
  mesesContrato:12,      // solo aplica si tipoPersonal=contrato
  mesInicio:1,           // mes en que inicia (para contrato)
  ...o};}
function distMeses(total,tipo="opex"){
  if(tipo==="capex"){const m=Array(12).fill(0);m[0]=total;return m;}
  return Array(12).fill(parseFloat((total/12).toFixed(2)));
}

// ─── AÑO DEL PRESUPUESTO (solo valor inicial del formulario de creación) ─────
// Dos escenarios confirmados por Anel (contabilidad), 2026-09-02:
//   (a) el ciclo normal — el ejercicio del AÑO SIGUIENTE, completo: en
//       septiembre de 2026 se captura enero–diciembre de 2027. Es el grueso, y
//       por eso es el valor por omisión.
//   (b) una unidad de negocio que se da de alta en lo que resta del año EN
//       CURSO: su presupuesto cubre solo los meses que quedan, así que arranca
//       el primer día del mes actual, no en enero.
// Los años NO están escritos fijos en ningún lado: salen de new Date(). El fin
// de vigencia es 31-dic del año elegido en los dos casos.
//
// Esto NO cambia cómo se guardan las fechas ni cómo se calculan las columnas de
// mes: devuelve dos cadenas "YYYY-MM-DD" que se escriben en form.fechaInicio y
// form.fechaFin, los mismos campos que el usuario podía teclear a mano, y que
// siguen siendo editables después. Los presupuestos ya guardados no la ejecutan.
function fechasDeAnio(anio, hoy=new Date()){
  const mes = anio===hoy.getFullYear() ? hoy.getMonth()+1 : 1;
  return {
    fechaInicio: `${anio}-${String(mes).padStart(2,"0")}-01`,
    fechaFin: `${anio}-12-31`,
  };
}
// Año que de verdad tienen las fechas del formulario ahora mismo. El selector se
// pinta a partir de ESTO y no de un estado propio, para que el año que se lee en
// pantalla no pueda despegarse de las fechas capturadas (un clon hereda las
// fechas de su origen, y el usuario puede editar cualquiera de las dos después).
function anioDeFecha(f){
  const m = /^(\d{4})-/.exec(f||"");
  return m ? Number(m[1]) : null;
}

// ─── MONEY INPUT — prefijo $ fijo, sin bloqueo del 0 ──────────────────────────
// ─── MONEY INPUT ─────────────────────────────────────────────────────────────
// $ fijo | focus: edición limpia sin comas | blur: formato 1,500,000.00
function parseMoney(str){ return parseFloat(String(str).replace(/,/g,""))||0; }
function displayMoney(n){ return n===0?"":Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2}); }

// ─── Formato con comas MIENTRAS se teclea (02-sep-2026, pedido de Luis) ──────
// Agrupa SOLO la parte entera y deja la decimal exactamente como se escribió:
// "1234.5" queda "1,234.5" y puede seguir a "1,234.56" sin que nadie meta ceros
// ni mueva el punto. Un punto final ("1234.") se conserva para poder seguir
// tecleando. La cadena que devuelve es solo para pintar — el estado guarda el
// número, igual que antes.
function agruparMiles(raw){
  const [ent="", ...resto] = String(raw).split(".");
  const entero = ent.replace(/\D/g,"");
  // Intl en vez de armar la coma a mano; sin decimales porque la parte decimal
  // se concatena tal cual abajo.
  const entFmt = entero===""?"":new Intl.NumberFormat("es-MX",{maximumFractionDigits:0}).format(Number(entero));
  return resto.length ? `${entFmt}.${resto.join("")}` : entFmt;
}
// Cuántos caracteres SIGNIFICATIVOS hay a la izquierda de una posición del
// cursor. Significativo = dígito o punto decimal: son los que el usuario tecleó
// y que el reformateo nunca mueve entre sí. Las comas NO cuentan, porque son
// justo lo que se inserta y se quita.
//
// El punto TIENE que contar. Contando solo dígitos, al teclear el punto en
// "1,234." el cursor se reponía en la posición con 4 dígitos a la izquierda —o
// sea ANTES del punto— y el siguiente dígito caía en la parte entera:
// "1,234." + "5" daba "12,345." en vez de "1,234.5".
function signifAntes(str, pos){
  let n=0;
  for(let i=0;i<pos && i<str.length;i++) if(/[0-9.]/.test(str[i])) n++;
  return n;
}
// La posición del cursor que deja los mismos N caracteres significativos a su
// izquierda.
function posConSignif(str, n){
  if(n<=0) return 0;
  let vistos=0;
  for(let i=0;i<str.length;i++){
    if(/[0-9.]/.test(str[i])) vistos++;
    if(vistos===n) return i+1;
  }
  return str.length;
}

function MoneyInput({value, onChange, style={}}){
  const [focused, setFocused] = useState(false);
  const [editRaw, setEditRaw] = useState("");
  const ref = useRef();
  // Posición del cursor pendiente de reponer tras un reformateo. Se aplica en
  // useLayoutEffect —antes de que el navegador pinte— porque hacerlo dentro del
  // onChange no sirve: React todavía no ha escrito el value nuevo en el DOM y el
  // navegador manda el cursor al final.
  const caret = useRef(null);
  useLayoutEffect(()=>{
    if(caret.current!==null && ref.current){
      ref.current.setSelectionRange(caret.current, caret.current);
      caret.current=null;
    }
  });
  // Ahora editRaw ya viene agrupado, así que se pinta tal cual mientras hay foco.
  const displayValue = focused ? editRaw : displayMoney(value);
  return(
    <div style={{display:"flex",alignItems:"stretch",
      border:`1px solid ${focused?C.yellow:C.grayBorder}`,
      borderRadius:6,overflow:"hidden",background:C.white,
      transition:"border-color 0.15s",...style}}>
      <span style={{padding:"0 9px",fontSize:13,color:C.grayMid,background:"#FAFAFA",
        borderRight:`1px solid ${C.grayBorder}`,display:"flex",alignItems:"center",
        fontWeight:700,userSelect:"none",flexShrink:0}}>$</span>
      <input ref={ref} type="text" inputMode="decimal"
        value={displayValue}
        onFocus={()=>{
          const n=parseMoney(value);
          // Al entrar se muestra ya agrupado: el campo se ve igual que al salir,
          // así que enfocar no "salta" visualmente. Los decimales sobrantes no se
          // inventan — String(n) da "1234.56" y "30000" tal cual.
          setEditRaw(n===0?"":agruparMiles(String(n)));
          setFocused(true);
          setTimeout(()=>ref.current?.select(),0);
        }}
        onChange={e=>{
          const el=e.target;
          const antes=el.value;                    // lo que el navegador acaba de dejar
          const posAntes=el.selectionStart??antes.length;
          // 1) Limpiar: solo dígitos y UN punto decimal. Esto es lo que hace que
          //    pegar "2,668,500" funcione: las comas se caen y queda 2668500.
          const soloNum=antes.replace(/[^0-9.]/g,"");
          const partes=soloNum.split(".");
          const limpio=partes.length>2 ? partes[0]+"."+partes.slice(1).join("") : soloNum;
          // 2) Cuántos caracteres significativos (dígitos y punto) quedaban a la
          //    izquierda del cursor ANTES de formatear.
          const nSig=signifAntes(antes, posAntes);
          // 3) Formatear y 4) reponer el cursor contando los mismos.
          const fmtStr=agruparMiles(limpio);
          caret.current=posConSignif(fmtStr, nSig);
          setEditRaw(fmtStr);
          onChange(parseMoney(limpio));
        }}
        onBlur={()=>{
          onChange(parseMoney(editRaw));
          setFocused(false);
        }}
        placeholder="0.00"
        style={{flex:1,padding:"7px 10px",border:"none",outline:"none",
          fontSize:13,textAlign:"right",background:"transparent",minWidth:0,
          fontVariantNumeric:"tabular-nums"}}/>
    </div>
  );
}

// ─── SCROLL HINT ──────────────────────────────────────────────────────────────
// Estándar responsive para TODAS las tablas de varias columnas de la app
// (ver nota completa junto a PartidaTable). Envuelve el contenido en un
// contenedor con scroll horizontal y muestra una sombra en el borde derecho
// SOLO mientras haya contenido oculto por desplazar — desaparece al llegar
// al final, para no confundir cuando ya no hay nada más que ver.
function ScrollHint({children, minWidth}){
  const ref = useRef();
  const [canScrollRight, setCanScrollRight] = useState(false);
  function check(){
    const el = ref.current;
    if(!el) return;
    setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
  }
  useEffect(()=>{ check(); });
  useEffect(()=>{
    window.addEventListener("resize", check);
    return ()=>window.removeEventListener("resize", check);
  },[]);
  return (
    <div style={{position:"relative"}}>
      <div ref={ref} onScroll={check} style={{overflowX:"auto"}}>
        <div style={minWidth?{minWidth}:undefined}>{children}</div>
      </div>
      {canScrollRight && (
        <div style={{position:"absolute",top:0,right:0,bottom:0,width:28,
          background:"linear-gradient(to right, rgba(255,255,255,0), rgba(0,0,0,0.13))",
          pointerEvents:"none"}}/>
      )}
    </div>
  );
}

// ─── TOAST NOTIFICATION ───────────────────────────────────────────────────────
function Toast({msg,onDone}){
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",top:16,right:24,zIndex:9999,
      background:C.grayDark,color:C.white,borderLeft:`3px solid ${C.yellow}`,
      padding:"12px 20px",borderRadius:8,fontSize:13,fontWeight:600,
      boxShadow:"0 4px 20px rgba(0,0,0,0.25)",display:"flex",alignItems:"center",gap:10,
      animation:"slideIn 0.25s ease"}}>
      <span style={{color:C.yellow,fontSize:16}}>✓</span> {msg}
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({label,color,bg}){
  return <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,
    background:bg||C.grayLight,color:color||C.grayMid,
    border:`1px solid ${color||C.grayMid}33`}}>{label}</span>;
}
function EstadoBadge({estado}){
  const map={"Borrador":{c:C.grayMid,b:"#F0F0F0"},"En revisión":{c:C.yellowDark,b:C.yellowLight},"Aprobado":{c:C.success,b:C.successLight}};
  const e=map[estado]||map["Borrador"];
  return <Badge label={estado} color={e.c} bg={e.b}/>;
}

// ─── CATALOG INPUT (CatInput + PuestoInput — mismo patrón) ───────────────────
function CatalogInput({value,onChange,options,placeholder="Seleccionar o escribir",allowCustom=true,storageKey=LS_CATS,extraOptions=[],extraLabel=""}){
  const [open,setOpen]=useState(false);
  const [txt,setTxt]=useState(value||"");
  const [macroModal,setMacroModal]=useState(false);
  const [newCatPending,setNewCatPending]=useState("");
  const [pos,setPos]=useState({top:0,left:0,width:0});
  const ref=useRef();
  // `options` llega AGRUPADO: [{rubro, subs:[...]}]. El rubro es encabezado y NO
  // se puede elegir; solo las subs son opciones. Es lo que pidió Luis: "en vez
  // de frutas dice activos y en vez de naranjas, manzanas, peras, piñas dice
  // equipo de transporte, equipo de mobiliario, todo eso".
  const grupos = Array.isArray(options)&&options.length&&typeof options[0]==="object"
    ? options
    : [{rubro:null, subs:options||[]}];   // respaldo para cualquier llamada plana
  // Las categorías que el usuario creó a mano van en su propio grupo, nunca
  // revueltas con el catálogo contable.
  const misCats = getCats(storageKey).filter(c=>!grupos.some(g=>g.subs.includes(c)));
  const gruposConMias = misCats.length ? [...grupos,{rubro:"Mis categorías", subs:misCats}] : grupos;

  const coincide = o => o.toLowerCase().includes(txt.toLowerCase());
  // Al filtrar, un encabezado se oculta si ninguna de sus subcuentas coincide.
  const gruposFiltrados = gruposConMias
    .map(g=>({...g, subs:g.subs.filter(coincide)}))
    .filter(g=>g.subs.length>0);
  // allOpts sigue existiendo plano: lo usan el "Crear categoría" y handleNewCat.
  const allOpts=[...new Set(gruposConMias.flatMap(g=>g.subs))];
  const totalVisible = gruposFiltrados.reduce((n,g)=>n+g.subs.length,0);
  // Grupos del catálogo de almacén — opciones extra al final del dropdown,
  // separadas por su propio divisor. Nunca se mezclan con el catálogo contable.
  const extraFiltradas=extraOptions.filter(coincide);

  // El menú se renderiza con position:fixed (ver abajo) para no ser recortado
  // por contenedores con overflow:hidden/auto (ej. el scroll horizontal de las
  // tablas de partidas) — por eso necesita su posición calculada explícitamente.
  function updatePos(){
    if(!ref.current) return;
    const r=ref.current.getBoundingClientRect();
    setPos({top:r.bottom+4, left:r.left, width:r.width});
  }
  function openMenu(){ updatePos(); setOpen(true); }

  useEffect(()=>{setTxt(value||"");},[value]);
  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  useEffect(()=>{
    if(!open) return;
    function onScrollOrResize(){ updatePos(); }
    window.addEventListener("scroll",onScrollOrResize,true);
    window.addEventListener("resize",onScrollOrResize);
    return()=>{
      window.removeEventListener("scroll",onScrollOrResize,true);
      window.removeEventListener("resize",onScrollOrResize);
    };
  },[open]);

  // Elegir una categoría del desplegable cambia SOLO la categoría. Antes esto
  // también disparaba onPartidaSelect(hist[0]), que rellenaba descripción,
  // unidad, cantidad y monto con una copia de otra partida ya capturada — sin
  // que el usuario lo pidiera y sin decir de cuál la copiaba. Esa fue la causa
  // de las partidas duplicadas de "Cambio de servicio" (98 filas de Materiales
  // donde había 29 reales, $160,588,772.90 contra $127,156,439.29): al capturar
  // la siguiente partida se escribía la categoría, la fila se autollenaba con la
  // anterior y quedaba una copia exacta. Las copias se reconocían porque traían
  // los cinco campos que este autollenado copiaba y perdían los que no
  // (repeticiones, mes/año). Sugerir sigue estando bien; decidir por el usuario,
  // no — para eso están los chips "Sugerencias del historial" de PartidaTable,
  // que copian lo mismo pero con un clic explícito sobre la partida elegida.
  function pick(v){
    setTxt(v);onChange(v);setOpen(false);
  }

  function handleNewCat(rawTxt){
    const upper=rawTxt.trim().toUpperCase();
    // Misma comparación normalizada que macroDeCategoria (ver normCat arriba):
    // si no, escribir "VIÁTICOS" abriría el modal "¿A qué categoría contable
    // pertenece?" para una cuenta que el catálogo ya tiene como VIATICOS.
    const isMacro=MACRO_POR_NORM.has(normCat(rawTxt));
    const hasSub=SUBCAT_POR_NORM.has(normCat(rawTxt));
    if(isMacro||hasSub){
      // Existe, guardar directo
      saveCat(upper,storageKey); pick(upper);
    } else {
      // Nueva categoría — pedir categoría macro
      setNewCatPending(upper);
      setMacroModal(true);
      setOpen(false);
    }
  }

  function confirmMacro(macro){
    saveCat(newCatPending,storageKey);
    // Guardar el mapping en localStorage
    try{
      const m=JSON.parse(localStorage.getItem("geolis_subcat_map")||"{}");
      m[newCatPending]=macro||"";
      localStorage.setItem("geolis_subcat_map",JSON.stringify(m));
    }catch(e){}
    pick(newCatPending);
    setMacroModal(false);
    setNewCatPending("");
  }

  return(
    <div ref={ref} style={{position:"relative"}}>
      <input value={txt}
        onChange={e=>{setTxt(e.target.value);onChange(e.target.value);openMenu();}}
        onFocus={openMenu}
        onKeyDown={e=>{if(e.key==="Enter"&&txt.trim())handleNewCat(txt);}}
        placeholder={placeholder}
        style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.grayBorder}`,
          borderRadius:6,fontSize:12,boxSizing:"border-box",outline:"none",
          transition:"border-color 0.15s"}}
        onFocusCapture={e=>e.target.style.borderColor=C.yellow}
        onBlurCapture={e=>e.target.style.borderColor=C.grayBorder}
      />
      {open&&(
        <div style={{position:"fixed",top:pos.top,left:pos.left,width:pos.width,zIndex:1000,
          background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:8,
          maxHeight:340,overflowY:"auto",boxShadow:"0 8px 28px rgba(0,0,0,0.15)"}}>
          {allowCustom&&txt&&!allOpts.map(o=>o.toUpperCase()).includes(txt.toUpperCase())&&(
            <div onMouseDown={e=>{e.preventDefault();handleNewCat(txt);}}
              style={{padding:"11px 14px",fontSize:12,color:C.yellowDark,cursor:"pointer",
                borderBottom:`1px solid ${C.line}`,fontWeight:700,display:"flex",alignItems:"center",gap:8,
                background:"#FFFDF0"}}>
              <span style={{fontSize:16,background:C.yellow,color:C.grayDark,
                width:22,height:22,borderRadius:"50%",display:"flex",alignItems:"center",
                justifyContent:"center",flexShrink:0}}>+</span>
              <span>Crear categoría <strong>"{txt.toUpperCase()}"</strong></span>
            </div>
          )}
          {totalVisible===0&&extraFiltradas.length===0&&<div style={{padding:"10px 12px",fontSize:12,color:C.grayMid}}>Sin resultados</div>}
          {gruposFiltrados.map(g=>(
            <div key={g.rubro||"__plano"}>
              {/* Encabezado de RUBRO: no seleccionable — sin onMouseDown y sin cursor */}
              {g.rubro&&(
                <div style={{padding:"7px 12px",fontSize:10,fontWeight:800,
                  color:C.grayMid,background:"#F5F5F5",textTransform:"uppercase",
                  letterSpacing:0.5,borderTop:`1px solid ${C.line}`,
                  borderBottom:`1px solid ${C.line}`,userSelect:"none"}}>
                  {g.rubro}
                </div>
              )}
              {g.subs.map(opt=>(
                <div key={g.rubro+"_"+opt} onMouseDown={e=>{e.preventDefault();pick(opt);}}
                  style={{padding:"10px 14px",paddingLeft:g.rubro?28:14,fontSize:12,cursor:"pointer",
                    background:value===opt?"#FFFBF0":"transparent",
                    borderBottom:`1px solid ${C.line}`,lineHeight:1.4}}
                  onMouseEnter={e=>e.currentTarget.style.background="#FFFBF0"}
                  onMouseLeave={e=>e.currentTarget.style.background=value===opt?"#FFFBF0":"transparent"}>
                  {opt}
                </div>
              ))}
            </div>
          ))}
          {extraFiltradas.length>0&&(
            <>
              <div style={{padding:"4px 12px",fontSize:9,
                color:C.grayMid,background:"#F5F5F5",
                textTransform:"uppercase",letterSpacing:0.4,
                borderTop:`1px solid ${C.line}`,
                borderBottom:`1px solid ${C.line}`}}>
                {extraLabel || "── catálogo almacén ──"}
              </div>
              {extraFiltradas.map((opt,i)=>(
                <div key={"extra_"+i} onMouseDown={e=>{e.preventDefault();pick(opt);}}
                  style={{padding:"9px 12px",fontSize:12,cursor:"pointer",
                    background:"transparent",
                    borderBottom:`1px solid ${C.line}`}}
                  onMouseEnter={e=>e.currentTarget.style.background="#FFFBF0"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {opt}
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {/* PUNTO 1+2: Modal categoría contable macro */}
      {macroModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.white,borderRadius:12,padding:28,maxWidth:500,width:"90%",
            boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{margin:"0 0 8px",fontSize:17,fontWeight:800,color:C.grayDark}}>
              Nueva categoría: <span style={{color:C.yellowDark}}>{newCatPending}</span>
            </h3>
            <p style={{margin:"0 0 20px",fontSize:13,color:C.grayMid,lineHeight:1.5}}>
              ¿A qué categoría contable pertenece? <br/>
              <span style={{fontSize:11}}>Ejemplo: "Silla de oficina" pertenece a <strong>INSUMOS DE OFICINA</strong></span>
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxHeight:260,overflowY:"auto",marginBottom:16}}>
              {CATS_MACRO_CONTABLE.map(m=>(
                <button key={m} onClick={()=>confirmMacro(m)}
                  style={{padding:"9px 12px",border:`1px solid ${C.grayBorder}`,borderRadius:8,
                    background:C.white,cursor:"pointer",fontSize:11,fontWeight:600,
                    color:C.grayDark,textAlign:"left",transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=C.yellowLight;e.currentTarget.style.borderColor=C.yellowBorder;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.borderColor=C.grayBorder;}}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={()=>confirmMacro("")}
              style={{width:"100%",padding:"9px",border:`1px solid ${C.grayBorder}`,borderRadius:8,
                background:C.grayLight,cursor:"pointer",fontSize:12,color:C.grayMid,fontWeight:600}}>
              No sé / Dejar sin categoría contable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── LISTAS DE CATEGORÍA DE LOS DROPDOWNS ────────────────────────────────────
// Derivadas de docs/catalogo_contable_2027.csv, GENERADAS del archivo y no
// transcritas a mano. Cada lista es un arreglo de GRUPOS {rubro, subs}: el rubro
// es el encabezado, NO seleccionable, y las subs son las opciones, en el orden
// del CSV. CatalogInput es quien los pinta.
//
// Reparto de los 18 rubros, según en qué sección se capturan (medido por GET
// sobre los presupuestos de la base: ningún rubro aparece en dos secciones):
//   CAPEX ->  2 rubros: ACTIVOS, EQUIPO DE COMPUTO            (7 subcuentas)
//   VIA   ->  1 rubro : VIATICOS                              (5 subcuentas)
//   MAT   -> 14 rubros: los demás                           (125 subcuentas)
//   ninguno-> NOMINA Y ADICIONALES                            (1 subcuenta)
// 7+5+125+1 = 138. NOMINA Y ADICIONALES no va a ningún dropdown porque la
// nómina se captura en NominaTable, que no tiene campo de Categoría.
//
// "Otras (fuera del catálogo 2027)" recoge las opciones que existían antes y no
// están en el CSV. No se borran: varias tienen partidas capturadas y quitarlas
// dejaría esas partidas apuntando a un texto que el menú ya no ofrece.
//
// NO existe un grupo con los rubros para captura antigua, a propósito. Hay ~71
// partidas que usan un RUBRO como categoría en vez de una subcuenta; que no se
// puedan re-elegir es el mecanismo que las va a ir corrigiendo cuando alguien
// toque cada partida. Abrir ese grupo le daría permiso a los PMs que entran el
// 25 de septiembre para seguir capturando al nivel de rubro.
const OTRAS_FUERA = "Otras (fuera del catálogo 2027)";

const CAT_CAPEX=[
  {rubro:"ACTIVOS", subs:[
    "EQUIPO DE TRANSPORTE",
    "EQUIPO DE MOBILIARIO",
    "MAQUINARIA Y EQUIPO",
    "OTROS ACTIVOS",
    "SOFTWARE Y LICICENCIAS",
  ]},
  {rubro:"EQUIPO DE COMPUTO", subs:[
    "EQUIPO DE COMPUTO (Adquisición)",
    "ARRENDAMIENTO DE EQ. COMPUTO",
  ]},
  {rubro:OTRAS_FUERA, subs:["ACCESORIOS","INFRAESTRUCTURA DE RED","GABINETE Y ENERGÍA","TRANSMISIÓN","SOFTWARE Y LICENCIAS"]},
];

const CAT_OPEX_MAT=[
  {rubro:"ARRENDA DE INMUEBLES Y SERV", subs:[
    "ARRENDAMIENTO DE INMUEBLES",
    "ENERGIA ELECTRICA",
    "RENTA DE CASAS NO DEDUCIBLE",
    "SERVICIOS DE LIMPIEZA",
    "SERVICIOS DE VIGILANCIA",
    "SERVICIOS DE FUMIGACION",
    "TELEFONIA FIJA",
    "AGUA Y ALCANTARILLADO",
    "ARRENDAMIENTO DE OF. MOVILES",
  ]},
  {rubro:"ARTICULOS DE SEGURIDAD", subs:["ROPA Y ARTICULOS DE PROTECCION"]},
  {rubro:"EQUIPOS Y ENSERES", subs:["ENSERES MENORES DIVERSOS (Acondicionamiento de casas)"]},
  {rubro:"INSUMOS AGRICOLAS", subs:["INSUMOS AGRICOLAS"]},
  {rubro:"INSUMOS DE OFICINA", subs:[
    "PAPELERIA Y UTILES DE OFICINA",
    "ARTICULOS DE ASEO Y SANITARIOS",
    "ARTICULOS DE CAFETERIA",
    "ARTICULOS DIGITALES Y DE COMPUTO",
  ]},
  {rubro:"MARKETING", subs:["SERVICIOS DE MERCADOTECNIA", "PUBLICIDAD Y PROPAGANDA"]},
  {rubro:"MATERIALES", subs:[
    "ABRASIVOS",
    "ACEITE LUBRICANTE P/MAQUINARIA",
    "ACEITES Y LUBRICANTES",
    "AISLANTES IMPERM REFRA",
    "BANDA CADEN TRANS COPL",
    "CONEXIONES PARA TUBERIA",
    "EMPAQUETAD JTAS Y SELLOS",
    "ENVASES",
    "FIBRAS HILOS Y TELAS",
    "GRASAS",
    "HERRAMIENTAS MANUALES",
    "INSTRUM DE MEDICION Y CONTROL",
    "LLANTAS, CAMARAS Y ACCESORIOS",
    "MANGUERAS, CONEXIONES",
    "MATERIAL ELECTRICO",
    "MATERIAL PARA LA CONSTRUCCION",
    "MATERIALES Y ART P/MANTENIMIENTO",
    "METALES",
    "PART REP ACCES Y PROD P/VEHIC",
    "PARTES ACCES Y MAT P/LABORATORIO",
    "PARTES ACCES Y REFAC P/ LUBRICANTES",
    "PARTES ELECT, ACCES Y REFACC",
    "PARTES Y REFAC TELECOM Y VIDEO",
    "PARTES Y REFACCION C/INCENDIO",
    "PASTA PEGAMENTO OTRO COMPUESTO",
    "PINTURA Y OTROS RECUBRIMIENTOS",
    "REFAC P/INSTRUM DE MED Y CONTROL",
    "REFACC Y ACCES PARA VALVULAS",
    "REFACC Y ACCESORIO PARA HERRAMIENTA",
    "REFACCIONES P/MAQUINARIA",
    "RODAM ACCES Y SELLOS P/ ACEITE",
    "SUSTANCIAS QUIMICAS",
    "TORNILLERIA Y ARTICULO",
    "TUBERIAS",
    "VALVULAS",
  ]},
  {rubro:"MATERIALES DE SALUD", subs:["MATERIAL PRIMEROS AUXILIOS"]},
  {rubro:"SERV TELEFONIA CELULAR Y RADIO", subs:[
    "SERV TELEFONIA CELULAR",
    "SERVICIO DE BANDA ANCHA",
    "SERVICIO DE RADIOCOMUNICACION",
  ]},
  {rubro:"SERVICIOS", subs:[
    "ACONDICION DE CASA HABITACION",
    "ADICION Y MODIFIC DE MATERIAL",
    "ADQUISICION TARJET COMBUSTIBLE",
    "ANALISIS CAUSA RAIZ",
    "ANALISIS DE RIESGO",
    "ANALISIS DE VIBRACION",
    "BASES LICITACION Y CONCURSOS",
    "CARGOS EXTRAORDINARIOS",
    "CERTIFICACION",
    "COLOCACION DE PILOTE",
    "CORREOS Y MENSAJERIAS",
    "CUOTAS Y SUSCRIPCIONES",
    "DEDUCIBLE POR SINIESTRO",
    "DESARROLLO DE SOFTWARE",
    "FIANZAS",
    "FLETES  EXTRANJEROS",
    "FLETES NACIONALES",
    "GASTOS DE IMPORTACION",
    "GTO EXPED DE SEG/TRAMITE",
    "HIELO Y AGUA",
    "HONORARIOS A PERSONA FISICA",
    "IMPUESTOS Y DERECHOS",
    "INTERNET Y DATOS",
    "MANIOBRAS",
    "MANTENIMIENTO A VEHICULOS",
    "MANTTO A EQUIPOS DE SEGURIDAD",
    "MANTTO DE MOBILIARIO Y EQUIPO",
    "MANTTO PREV A EQUIPOS DE MEDICION",
    "MANTTO Y ACONDICION DE CAMPER",
    "MECANICA DE SUELOS",
    "OTROS DERECHOS",
    "PACMA PEMEX EXPLORACION",
    "PAGO DE RECARGOS",
    "RECARGA DE GASES INDUSTRIALES",
    "RENTA DE MAQUINARIA Y EQUIPO",
    "RENTA DE SANITARIOS",
    "REPARACIONES",
    "SEGUROS",
    "SERV DE DISEÑO Y ROTULACION",
    "SERV DE DISPOS DE RESIDUOS",
    "SERV DE MANTO A INSTALACIONES",
    "SERV DE RECARGA DE EXTINTORES",
    "SERV DE TRANSMISION DE DATOS",
    "SERV PROFES DE PERSONA MORAL",
    "SERV Y MANTTO A EQ INFORMATICO",
    "SERVICIO DE AUTOLAVADO",
    "SERVICIO DE EQPO Y MAQUINARIA",
    "SERVICIO REPRESENTACION LEGAL",
    "SERVICIOS DE BANQUETERIA",
    "SERVICIOS DE COPIADO",
    "SERVICIOS DE TAXI",
    "SERVICIOS PREOPERATIVOS",
    "SERVICIOS RADIOGRAFICOS",
    "TENENCIA",
    "TOPOGRAFIA",
    "VERIFICACIONES",
    "ASESORIA ESPECIAL INTERNA",
    "ASESORIA ESPECIAL OPERATIVA",
    "ASESORIA ESPECIAL SINDICAL",
    "ASESORIA ESPECIAL VIAL",
    "FIANZAS",
    "INTERESES",
    "PAGO DE MULTAS",
  ]},
  {rubro:"SERVICIOS DE CAPACITACION", subs:["SERVICIOS DE CAPACITACION"]},
  {rubro:"SERVICIOS DE SALUD", subs:["SERVICIOS MEDICOS"]},
  {rubro:"UNIFORMES", subs:["UNIFORMES"]},
  {rubro:"VEHICULOS Y COMBUSTIBLE", subs:["ARRENDAMIENTO DE VEHIC", "COMBUSTIBLES"]},
  // Los tres de licenciamiento van aquí aunque la lista vieja los excluía: hay
  // 6 partidas en partidas_opex_mat de TI H1 2026 ($559,214.55) capturadas con
  // ellos, y sin la opción no serían re-seleccionables al editar.
  {rubro:OTRAS_FUERA, subs:["TELECOMUNICACIONES","INSUMOS OPERATIVOS","HERRAMIENTAS","RENTA DE MAQUINARIA","LICENCIAMIENTO USD","LICENCIAMIENTO MXN ANUAL","LICENCIAMIENTO MXN MENSUAL"]},
];

const CAT_OPEX_VIA=[
  {rubro:"VIATICOS", subs:[
    "ALIMENTACION",
    "CASETAS PUENTES Y PEAJES",
    "SERV DE TRANSPORTAC AEREA",
    "SERV DE TRANSPORTAC TERRESTRE",
    "SERVICIOS DE HOSPEDAJE",
  ]},
  {rubro:OTRAS_FUERA, subs:["HOSPEDAJE","TRANSPORTE"]},
];

// ─── FIELD LABEL ─────────────────────────────────────────────────────────────
function FL({children,required}){
  return <label style={{fontSize:11,fontWeight:700,color:C.grayMid,
    textTransform:"uppercase",letterSpacing:0.4,display:"block",marginBottom:6}}>
    {children}{required&&<span style={{color:C.danger,marginLeft:3,fontSize:13,fontWeight:800}}>*</span>}
  </label>;
}

// El almacén usa códigos abreviados (MT, PC, LT...) que no existen en UNIDADES
// (el <select> de la app) — se traducen al vocabulario que la app ya entiende.
const UM_ALMACEN_A_UNIDAD={MT:"Metro",PC:"Pieza",LT:"Litro",KG:"Kg",CU:"Unidad",EQ:"Unidad",SR:"Servicio",SV:"Servicio"};

// ─── SUGERENCIAS DEL CATALOGO DE ALMACEN ─────────────────────────────────────
// Busca en la tabla catalogo_almacen (Supabase) mientras se escribe la
// Categoría — al elegir un artículo se llenan Descripción/Unidad con datos
// reales del almacén; la Categoría se deja como nombre_grupo (ej. "TUBERIAS"),
// que pasa por el flujo normal de categoría contable macro si no está mapeada.
function AlmacenSuggestions({query, onPick}){
  const [resultados, setResultados] = useState([]);
  useEffect(()=>{
    let cancelado=false;
    buscarArticulosAlmacen(query).then(data=>{ if(!cancelado) setResultados(data); });
    return ()=>{ cancelado=true; };
  }, [query]);
  if(resultados.length===0) return null;
  return (
    <div style={{marginTop:4}}>
      <div style={{fontSize:9,color:C.grayMid,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Artículos de esta categoría:</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
        {resultados.map(a=>(
          <button key={a.codigo_articulo} onClick={()=>onPick(a)}
            style={{textAlign:"left",padding:"3px 8px",background:C.grayLight,
              border:`1px solid ${C.grayBorder}`,borderRadius:4,cursor:"pointer",fontSize:10,color:C.grayDark,
              maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
            title={a.descripcion}>
            {a.descripcion}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CATÁLOGO EN CASCADA (OPEX Materiales) ────────────────────────────────────
// Grupo del almacén → subcategoría → artículos. Solo se usa como opciones
// EXTRA al final del dropdown de Categoría en OPEX Materiales; las 27 cuentas
// contables (CAT_OPEX) siguen siendo la base y no se tocan.
const CATALOGO_CASCADA = {
  "MATERIALES": {
    "TUBERIAS": [
      {desc:'TUBO ACERO AL CARBON S/C 1/2"', um:"MT"},
      {desc:'TUBO ACERO AL CARBON S/C 3/4"', um:"MT"},
      {desc:'TUBO ACERO AL CARBON S/C 1"',   um:"MT"},
      {desc:'TUBO ACERO AL CARBON S/C 2"',   um:"MT"},
      {desc:'TUBO ACERO INOXIDABLE S/C 1/2"',um:"MT"},
      {desc:'TUBO ACERO INOXIDABLE S/C 1"',  um:"MT"},
      {desc:'TUBO CPVC DIAMETRO 1/2"',        um:"MT"},
      {desc:'TUBO PEAD DIAMETRO 3/4"',        um:"MT"},
    ],
    "CONEXIONES": [
      {desc:'CODO 90° ACERO AL CARBON 1/2"', um:"PC"},
      {desc:'CODO 90° ACERO AL CARBON 1"',   um:"PC"},
      {desc:'CODO 45° ACERO AL CARBON 3/4"', um:"PC"},
      {desc:'TEE ACERO AL CARBON 3/4"',       um:"PC"},
      {desc:'REDUCCION CONCENTRICA AC 1x3/4"',um:"PC"},
      {desc:'NIPLE ACERO AL CARBON 1/2"',    um:"PC"},
      {desc:'COPLE ACERO AL CARBON 3/4"',    um:"PC"},
      {desc:'TAPON MACHO AC 1/2"',           um:"PC"},
    ],
    "VALVULAS": [
      {desc:'VALVULA DE GLOBO AC 150# 1"',   um:"PC"},
      {desc:'VALVULA DE BOLA AI 150# 1/2"',  um:"PC"},
      {desc:'VALVULA CHECK AC 3/4"',          um:"PC"},
      {desc:'VALVULA DE CONTROL NEUMATICA 1"',um:"PC"},
    ],
    "BRIDAS": [
      {desc:'BRIDA SLIP-ON AC 150# 1"',      um:"PC"},
      {desc:'BRIDA SLIP-ON AC 150# 2"',      um:"PC"},
      {desc:'BRIDA WELD NECK AC 300# 1"',    um:"PC"},
      {desc:'ESPARRAGO CON TUERCAS 5/8"',    um:"PC"},
    ],
    "EMPAQUES Y SELLOS": [
      {desc:'EMPAQUE ESPIRAL METALICO 1"',   um:"PC"},
      {desc:'SELLO MECANICO JOHN CRANE',      um:"PC"},
      {desc:'EMPAQUE DE GRAFITO 1/8"',       um:"MT"},
    ],
    "INSTRUMENTACION": [
      {desc:"SENSOR DE PRESION 4-20MA",       um:"PC"},
      {desc:"SENSOR DE TEMPERATURA RTD PT100",um:"PC"},
      {desc:"TRANSMISOR DE PRESION DIFER.",   um:"PC"},
      {desc:"TRANSMISOR DE FLUJO ELECTR.",    um:"PC"},
    ],
    "ELECTRICIDAD": [
      {desc:'CABLE THHN 12 AWG NEGRO',        um:"MT"},
      {desc:'CABLE THHN 10 AWG ROJO',         um:"MT"},
      {desc:'CABLE DE CONTROL 16AWG 4 HILOS', um:"MT"},
      {desc:'INTERRUPTOR TERMOMAGNETICO 2P 20A',um:"PC"},
      {desc:'GUARDAMOTOR 3P 9-13A',           um:"PC"},
    ],
    "SEGURIDAD INDUSTRIAL": [
      {desc:"CASCO DE SEGURIDAD TIPO II",     um:"PC"},
      {desc:"LENTES DE SEGURIDAD CLAROS",     um:"PC"},
      {desc:"GUANTES DE CUERO SOLDADOR",      um:"PC"},
      {desc:"BOTAS SEGURIDAD PUNTA DE ACERO", um:"PC"},
      {desc:"EXTINTOR PQS 9 KG ABC",          um:"PC"},
    ],
  },
  "TUBERIAS": {
    "ACERO AL CARBON": [
      {desc:'TUBO AC S/C 1/2"', um:"MT"},
      {desc:'TUBO AC S/C 3/4"', um:"MT"},
      {desc:'TUBO AC S/C 1"',   um:"MT"},
      {desc:'TUBO AC S/C 2"',   um:"MT"},
    ],
    "ACERO INOXIDABLE": [
      {desc:'TUBO AI S/C 1/2"', um:"MT"},
      {desc:'TUBO AI S/C 1"',   um:"MT"},
    ],
    "CPVC / PEAD": [
      {desc:'TUBO CPVC 1/2"',   um:"MT"},
      {desc:'TUBO PEAD 3/4"',   um:"MT"},
    ],
  },
  "CONEXIONES": {
    "CODOS": [
      {desc:'CODO 90° AC 1/2"', um:"PC"},
      {desc:'CODO 90° AC 1"',   um:"PC"},
      {desc:'CODO 45° AC 3/4"', um:"PC"},
    ],
    "TEES Y REDUCCIONES": [
      {desc:'TEE AC 3/4"',                   um:"PC"},
      {desc:'REDUCCION CONC. AC 1x3/4"',     um:"PC"},
    ],
    "NIPLES Y COPLES": [
      {desc:'NIPLE AC 1/2"',    um:"PC"},
      {desc:'COPLE AC 3/4"',    um:"PC"},
    ],
    "BRIDAS Y ESPÁRRAGOS": [
      {desc:'BRIDA SLIP-ON AC 150# 1"',      um:"PC"},
      {desc:'ESPARRAGO CON TUERCAS 5/8"',    um:"PC"},
    ],
  },
  "VALVULAS": {
    "GLOBO Y BOLA": [
      {desc:'VALVULA GLOBO AC 1"',           um:"PC"},
      {desc:'VALVULA BOLA AI 1/2"',          um:"PC"},
    ],
    "CHECK Y CONTROL": [
      {desc:'VALVULA CHECK AC 3/4"',         um:"PC"},
      {desc:'VALVULA CONTROL NEUMATICA 1"',  um:"PC"},
    ],
  },
  "INSTRUMENTACION": {
    "SENSORES": [
      {desc:"SENSOR PRESION 4-20MA",         um:"PC"},
      {desc:"SENSOR TEMPERATURA RTD PT100",  um:"PC"},
      {desc:"SENSOR NIVEL ULTRASONICO",      um:"PC"},
    ],
    "TRANSMISORES": [
      {desc:"TRANSMISOR PRESION DIFERENCIAL",um:"PC"},
      {desc:"TRANSMISOR FLUJO ELECTROMAGNETICO",um:"PC"},
    ],
  },
  "ELECTRICIDAD": {
    "CABLES": [
      {desc:'CABLE THHN 12 AWG NEGRO',       um:"MT"},
      {desc:'CABLE THHN 10 AWG ROJO',        um:"MT"},
      {desc:'CABLE CONTROL 16AWG 4 HILOS',   um:"MT"},
    ],
    "PROTECCIONES": [
      {desc:'INTERRUPTOR TERMOMAGNETICO 2P 20A',um:"PC"},
      {desc:'GUARDAMOTOR 3P 9-13A',          um:"PC"},
    ],
  },
  "SEGURIDAD INDUSTRIAL": {
    "EPP": [
      {desc:"CASCO SEGURIDAD TIPO II",       um:"PC"},
      {desc:"LENTES SEGURIDAD CLAROS",       um:"PC"},
      {desc:"GUANTES CUERO SOLDADOR",        um:"PC"},
      {desc:"BOTAS SEGURIDAD PUNTA ACERO",   um:"PC"},
    ],
    "EQUIPOS CONTRA INCENDIO": [
      {desc:"EXTINTOR PQS 9 KG ABC",         um:"PC"},
      {desc:"BOTIQUIN PRIMEROS AUXILIOS",    um:"PC"},
    ],
  },
};

// ─── PARTIDA ROW ─────────────────────────────────────────────────────────────
// Headers y fila en el mismo componente, dentro del card
function PartidaTable({partidas, onUpdate, onRemove, onAdd, catOptions, addLabel, headerColor, showMes=false, showPeriod=false, fechaInicioProyecto, fechaFinProyecto, numMesesOpProyecto=12, mostrarFechaReal=false, readOnly=false}){
  // Cascada Subcategoría/Artículo (solo OPEX Materiales) — key=p.id, value=subcategoría elegida
  const [subcatSel, setSubcatSel] = useState({});
  // Rango de años de los selects "Año" — antes fijo 2024-2035; ahora se ajusta
  // a la duración real del proyecto (soporta desde 6 meses hasta 20 años).
  const anioIniProy = fechaInicioProyecto ? new Date(fechaInicioProyecto+"T00:00:00").getFullYear() : 2024;
  const anioFinProy = fechaFinProyecto ? new Date(fechaFinProyecto+"T00:00:00").getFullYear() : anioIniProy+11;
  const RANGO_ANIOS = Array.from({length: Math.max(12, anioFinProy-anioIniProy+3)}, (_,i)=>anioIniProy-1+i);
  // Categorías personalizadas ("Crear categoría...") guardadas por sección —
  // antes usaban una sola clave global y se mezclaban entre CAPEX/Materiales/Viáticos.
  const catStorageKey = addLabel==="Agregar equipo / inversión" ? "geolis_cats_capex"
    : addLabel==="Agregar material" ? "geolis_cats_mat"
    : addLabel==="Agregar viático" ? "geolis_cats_via"
    : LS_CATS;
  const cols = showMes
    ? "2fr 2fr 74px 56px 150px 100px 92px 34px"
    : showPeriod
      ? "2fr 2fr 74px 56px 150px 100px 92px 34px"
      : "2fr 2fr 90px 76px 1fr 100px 34px";
  const headers = showMes
    ? ["Categoría","Descripción","Unidad","Cant.","Fecha compra *","Monto unit.","Total",""]
    : showPeriod
      ? ["Categoría","Descripción","Unidad","Cant.","Periodicidad / Inicio","Monto unit.","Total",""]
      : ["Categoría","Descripción","Unidad","Cant.","Monto unit.","Total",""];
  // ── Estándar responsive de tablas (ver ScrollHint más arriba) ──────────────
  // Cualquier tabla de varias columnas de la app debe envolverse en <ScrollHint>
  // en vez de un <div overflowX> manual — centraliza el scroll horizontal +
  // la sombra indicadora.
  // showMes/showPeriod agregan una columna extra (Fecha o Periodicidad/Inicio) —
  // con 8 columnas necesitan más ancho mínimo antes de compactarse o Categoría/
  // Descripción quedan ilegibles; por debajo de ese ancho, ScrollHint hace scroll
  // horizontal en vez de comprimir el texto.
  return(
    <div>
    <ScrollHint minWidth={showMes||showPeriod?1000:760}>
      {/* Headers internos */}
      {partidas.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:cols,
          gap:16,padding:"0 0 12px 0",marginBottom:4,
          borderBottom:`1px solid ${C.line}`}}>
          {headers.map((h,i)=>(
            <div key={i} style={{fontSize:11,fontWeight:700,color:C.grayMid,
              textTransform:"uppercase",letterSpacing:0.3,
              textAlign:i>=3?"right":"left"}}>{h}</div>
          ))}
        </div>
      )}
      {/* Filas */}
      {partidas.map((p,idx)=>{
        const total=(p.cantidad||0)*(p.monto||0);
        // Modo lectura ("Mi presupuesto" antes de presionar Editar) — fila de solo
        // texto, sin inputs ni widgets de captura (cascada/chips/historial no aplican
        // sin edición). Es un branch temprano, no toca la fila editable de abajo.
        if(readOnly){
          const fechaOPeriodo = showMes
            ? (p.mesGastoMes&&p.mesGastoAnio
                ? `${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][p.mesGastoMes-1]} ${p.mesGastoAnio}`
                : "—")
            : showPeriod
              ? (PERIODICIDADES.find(pd=>pd.id===(p.periodicidad||"mensual"))?.label||p.periodicidad||"—")
                + (p.mesGastoMes&&p.mesGastoAnio ? ` · desde ${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][p.mesGastoMes-1]} ${p.mesGastoAnio}`
                   : p.mesInicioOpex ? ` · desde M${p.mesInicioOpex}` : "")
              : null;
          return(
            <div key={p.id} className="partida-row" style={{display:"grid",
              gridTemplateColumns:cols,background:idx%2===1?"#FAFBFC":"transparent",
              gap:16,alignItems:"center",padding:"14px 12px",margin:"0 -12px",
              borderBottom:idx<partidas.length-1?`1px solid ${C.line}`:"none"}}>
              <div style={{fontSize:12.5,fontWeight:600,color:C.grayDark}}>{p.cat||"—"}</div>
              <div style={{fontSize:12.5,color:C.grayDark}}>{p.desc||"—"}</div>
              <div style={{fontSize:12,color:C.grayMid}}>{p.unidad||"—"}</div>
              <div style={{fontSize:12,color:C.grayMid,textAlign:"right"}}>{p.cantidad||0}</div>
              {(showMes||showPeriod)&&(
                <div style={{fontSize:11,color:C.grayMid}}>{fechaOPeriodo}</div>
              )}
              <div style={{fontSize:12,color:C.grayMid,textAlign:"right"}}>{fmt(p.monto||0)}</div>
              <div style={{textAlign:"right",fontSize:13,fontWeight:700,
                color:total>0?headerColor:C.grayMid}}>{fmt(total)}</div>
              <div/>
            </div>
          );
        }
        return(
          <div key={p.id} className="partida-row" style={{display:"grid",
            gridTemplateColumns:cols,background:idx%2===1?"#FAFBFC":"transparent",
            gap:16,alignItems:"center",padding:"14px 12px",margin:"0 -12px",
            borderBottom:idx<partidas.length-1?`1px solid ${C.line}`:"none"}}>
            <div>
              <CatalogInput value={p.cat} onChange={v=>{
                onUpdate({...p,cat:v,subcat:""});
                setSubcatSel(prev=>({...prev,[p.id]:""}));
                // El dropdown de sugerencias se activa cuando hay historial
              }} options={catOptions} placeholder="Categoría" storageKey={catStorageKey}
                extraOptions={addLabel==="Agregar material"?Object.keys(CATALOGO_CASCADA):[]}
                extraLabel="── catálogo almacén ──"/>
              {/* Cascada Subcategoría/Artículo — solo OPEX Materiales, solo si la
                  categoría elegida tiene entrada en CATALOGO_CASCADA. p.cat nunca
                  cambia aquí: solo se autocompletan desc/unidad al elegir artículo. */}
              {addLabel==="Agregar material"&&CATALOGO_CASCADA[p.cat]&&(
                <div style={{marginTop:4,display:"flex",flexDirection:"column",gap:4}}>
                  <select
                    value={subcatSel[p.id]||""}
                    onChange={e=>setSubcatSel(prev=>({...prev,[p.id]:e.target.value}))}
                    className="sel-brand"
                    style={{padding:"6px 6px",
                      border:`1px solid ${C.grayBorder}`,
                      borderRadius:6,fontSize:11,
                      background:C.white,width:"100%",
                      color:subcatSel[p.id]?C.grayDark:C.grayMid}}>
                    <option value="">Subcategoría...</option>
                    {Object.keys(CATALOGO_CASCADA[p.cat]).map(sg=>(
                      <option key={sg} value={sg}>{sg}</option>
                    ))}
                  </select>
                  {subcatSel[p.id]&&CATALOGO_CASCADA[p.cat]?.[subcatSel[p.id]]&&(
                    <select
                      value=""
                      onChange={e=>{
                        const art=CATALOGO_CASCADA[p.cat][subcatSel[p.id]]
                          .find(a=>a.desc===e.target.value);
                        if(art){
                          onUpdate({...p,desc:art.desc,unidad:UM_ALMACEN_A_UNIDAD[art.um]||"Unidad"});
                          setSubcatSel(prev=>({...prev,[p.id]:""}));
                        }
                      }}
                      className="sel-brand"
                      style={{padding:"6px 6px",
                        border:`1px solid ${C.grayBorder}`,
                        borderRadius:6,fontSize:11,
                        background:C.white,width:"100%",
                        color:C.grayMid}}>
                      <option value="">Artículo...</option>
                      {CATALOGO_CASCADA[p.cat][subcatSel[p.id]].map((a,i)=>(
                        <option key={i} value={a.desc}>{a.desc} ({a.um})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {/* Sugerencias históricas al escribir categoría */}
              {p.cat&&buscarHistorial(p.cat,catOptions===CAT_CAPEX?"capex":"opex").length>0&&!p.desc&&(
                <div style={{marginTop:4}}>
                  <div style={{fontSize:9,color:C.grayMid,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Sugerencias del historial:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {buscarHistorial(p.cat,catOptions===CAT_CAPEX?"capex":"opex").map((h,hi)=>(
                      <button key={hi} onClick={()=>onUpdate({...p,cat:h.cat,desc:h.desc,unidad:h.unidad,cantidad:h.cantidad,monto:h.monto,
                        periodicidad:h.periodicidad||p.periodicidad})}
                        style={{padding:"3px 8px",background:C.yellowLight,border:`1px solid ${C.yellowBorder}`,
                          borderRadius:4,cursor:"pointer",fontSize:10,color:C.yellowDark,fontWeight:600,
                          maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
                        title={`${h.desc} — ${h.unidad} × ${h.cantidad} @ $${h.monto}`}>
                        {h.desc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Chips de artículos del almacén para esta categoría — clic autocompleta
                  Descripción y Unidad. Nada más (sin subcategoría, sin selects). */}
              {p.cat&&!p.desc&&(
                <AlmacenSuggestions query={p.cat} onPick={a=>onUpdate({...p,
                  desc:a.descripcion, unidad:UM_ALMACEN_A_UNIDAD[a.unidad_medida]||"Unidad",
                  articuloCodigo:a.codigo_articulo})}/>
              )}
            </div>
            <input value={p.desc} onChange={e=>onUpdate({...p,desc:e.target.value})}
              placeholder="Descripción"
              style={{padding:"7px 10px",border:`1px solid ${C.grayBorder}`,
                borderRadius:6,fontSize:12,outline:"none",boxSizing:"border-box",width:"100%"}}/>
            <select value={p.unidad||""} onChange={e=>onUpdate({...p,unidad:e.target.value})}
              className="sel-brand"
              title="Unidad = naturaleza del bien. Ej: Servicio para arrendamiento, Pieza para EPP, Global para partidas alzadas"
              style={{padding:"8px 10px",border:`1px solid ${C.grayBorder}`,
                borderRadius:6,fontSize:11,width:"100%",background:C.white}}>
              <option value="" disabled>— Elige unidad —</option>
              {UNIDADES.map(u=><option key={u}>{u}</option>)}
            </select>
            <input type="number" min="0" step="1" value={p.cantidad===0?"":p.cantidad}
              onChange={e=>onUpdate({...p,cantidad:parseFloat(e.target.value)||0})}
              onFocus={e=>{if(p.cantidad===0)onUpdate({...p,cantidad:""});e.target.select();}}
              onBlur={e=>onUpdate({...p,cantidad:parseFloat(e.target.value)||0})}
              placeholder="0"
              style={{padding:"7px 8px",border:`1px solid ${C.grayBorder}`,
                borderRadius:6,fontSize:12,textAlign:"right",width:"100%",boxSizing:"border-box"}}/>
            {showMes&&(
              <div style={{display:"flex",gap:3}}>
                <select value={p.mesGastoMes||""}
                  onChange={e=>onUpdate({...p,mesGastoMes:e.target.value})}
                  className="sel-brand"
                  title="Mes de compra"
                  style={{padding:"7px 6px",border:`1px solid ${!p.mesGastoMes?C.danger:C.grayBorder}`,
                    borderRadius:6,fontSize:11,width:"50%",background:!p.mesGastoMes?"#FFF5F5":C.white,color:C.grayDark}}>
                  <option value="" disabled>— Mes —</option>
                  {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((m,i)=>(
                    <option key={i} value={i+1}>{m}</option>
                  ))}
                </select>
                <select value={p.mesGastoAnio||""}
                  onChange={e=>onUpdate({...p,mesGastoAnio:e.target.value})}
                  className="sel-brand"
                  title={fechaInicioProyecto&&fechaFinProyecto&&p.mesGastoAnio&&(parseInt(p.mesGastoAnio)<anioIniProy||parseInt(p.mesGastoAnio)>anioFinProy)?`Fuera del rango del proyecto (${anioIniProy}-${anioFinProy})`:"Año de compra"}
                  style={{padding:"7px 4px",border:`1px solid ${!p.mesGastoAnio||(fechaInicioProyecto&&fechaFinProyecto&&(parseInt(p.mesGastoAnio)<anioIniProy||parseInt(p.mesGastoAnio)>anioFinProy))?C.danger:C.grayBorder}`,
                    borderRadius:6,fontSize:11,width:"50%",textAlign:"center",
                    background:!p.mesGastoAnio||(fechaInicioProyecto&&fechaFinProyecto&&(parseInt(p.mesGastoAnio)<anioIniProy||parseInt(p.mesGastoAnio)>anioFinProy))?"#FFF5F5":C.white,color:C.grayDark}}>
                  <option value="" disabled>— Año —</option>
                  {RANGO_ANIOS.map(y=>(
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
            {showPeriod&&(
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                {/* Sin periodicidad el renglón aporta $0.00 y no se distribuye
                    (ver distribuirOpex). Se marca en rojo como los selectores de
                    fecha, para que el hueco se vea en el renglón y no solo en el
                    aviso de arriba. */}
                <select value={p.periodicidad||""} onChange={e=>onUpdate({...p,periodicidad:e.target.value})}
                  className="sel-brand"
                  title={p.periodicidad?"¿Con qué frecuencia se repite este gasto?":"Sin periodicidad este renglón aporta $0.00 y no se distribuye en ningún mes"}
                  style={{padding:"6px 6px",border:`1px solid ${!p.periodicidad?C.danger:C.grayBorder}`,borderRadius:6,
                    fontSize:10,width:"100%",background:!p.periodicidad?"#FFF5F5":C.white}}>
                  <option value="" disabled>— Elige periodicidad —</option>
                  {PERIODICIDADES.map(pd=><option key={pd.id} value={pd.id}>{pd.label}</option>)}
                </select>
                <div style={{display:"flex",gap:3}}>
                  <select value={p.mesGastoMes||""}
                    onChange={e=>{
                      const mesGastoMes=e.target.value;
                      const idx=mesIndexCapex({...p,mesGastoMes},fechaInicioProyecto,numMesesOpProyecto);
                      onUpdate({...p,mesGastoMes,mesInicioOpex:mesGastoMes&&p.mesGastoAnio?Math.max(1,idx):(p.mesInicioOpex||1)});
                    }}
                    className="sel-brand"
                    title="¿En qué mes del calendario inicia este gasto? Se convierte automáticamente al mes del proyecto."
                    style={{padding:"6px 4px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                      fontSize:10,width:"50%",background:C.white,color:C.grayDark}}>
                    <option value="" disabled>— Mes —</option>
                    {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((m,i)=>(
                      <option key={i} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <select value={p.mesGastoAnio||""}
                    onChange={e=>{
                      const mesGastoAnio=e.target.value;
                      const idx=mesIndexCapex({...p,mesGastoAnio},fechaInicioProyecto,numMesesOpProyecto);
                      onUpdate({...p,mesGastoAnio,mesInicioOpex:p.mesGastoMes&&mesGastoAnio?Math.max(1,idx):(p.mesInicioOpex||1)});
                    }}
                    className="sel-brand"
                    title={fechaInicioProyecto&&fechaFinProyecto&&p.mesGastoAnio&&(parseInt(p.mesGastoAnio)<anioIniProy||parseInt(p.mesGastoAnio)>anioFinProy)?`Fuera del rango del proyecto (${anioIniProy}-${anioFinProy})`:"Año en que inicia este gasto"}
                    style={{padding:"6px 4px",
                      border:`1px solid ${fechaInicioProyecto&&fechaFinProyecto&&p.mesGastoAnio&&(parseInt(p.mesGastoAnio)<anioIniProy||parseInt(p.mesGastoAnio)>anioFinProy)?C.danger:C.grayBorder}`,
                      borderRadius:6,fontSize:10,width:"50%",textAlign:"center",background:C.white,color:C.grayDark}}>
                    <option value="" disabled>— Año —</option>
                    {RANGO_ANIOS.map(y=>(
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {p.mesInicioOpex&&!p.mesGastoMes&&(
                  <div style={{fontSize:9,color:C.grayMid}}>
                    {mostrarFechaReal&&mesLabelReal(p.mesInicioOpex,fechaInicioProyecto)
                      ? `Inicia M${p.mesInicioOpex} · ${mesLabelReal(p.mesInicioOpex,fechaInicioProyecto)}`
                      : `Inicia M${p.mesInicioOpex} (sin fecha)`}
                  </div>
                )}
                {/* Número de repeticiones — opcional, vacío = sin límite (se repite hasta el fin del proyecto) */}
                <input type="number" min="1" placeholder="Vacío = durante todo el proyecto"
                  value={p.repeticiones||""}
                  onChange={e=>onUpdate({...p,repeticiones:e.target.value?parseInt(e.target.value):null})}
                  title="Número de veces que se repite. Ejemplo: trimestral × 4 = solo 4 trimestres aunque el proyecto dure más"
                  style={{padding:"4px 6px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                    fontSize:9,width:"100%",background:C.white,color:C.grayDark,boxSizing:"border-box"}}/>
                {/* Meses donde cae el gasto — solo si no es mensual (si es mensual, es obvio) */}
                {p.periodicidad&&p.periodicidad!=="mensual"&&(
                  !p.mesGastoMes||!p.mesGastoAnio ? (
                    <div style={{fontSize:10,color:C.grayMid,marginTop:3}}>Define el mes de inicio para ver la distribución</div>
                  ) : (()=>{
                    const dist=distribuirOpex(p,numMesesOpProyecto);
                    const inicio=new Date(fechaInicioProyecto+"T00:00:00");
                    const nombresMes=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                    const mesesActivos=[];
                    dist.forEach((v,i)=>{
                      if(v>0){
                        const d=new Date(inicio); d.setMonth(d.getMonth()+i);
                        mesesActivos.push(nombresMes[d.getMonth()]);
                      }
                    });
                    return (
                      <div style={{fontSize:10,color:C.grayMid,marginTop:3}}>
                        Cae en: {mesesActivos.join(" · ")} ({mesesActivos.length} veces)
                      </div>
                    );
                  })()
                )}
              </div>
            )}
            <MoneyInput value={p.monto} onChange={v=>onUpdate({...p,monto:v})}/>
            <div style={{textAlign:"right",fontSize:13,fontWeight:700,
              color:total>0?headerColor:C.grayMid}}>{fmt(total)}</div>
            <button onClick={onRemove(p.id)}
              style={{background:"transparent",border:"none",cursor:"pointer",
                color:C.grayMid,fontSize:16,padding:"2px 4px",borderRadius:4,
                display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>e.currentTarget.style.color=C.danger}
              onMouseLeave={e=>e.currentTarget.style.color=C.grayMid}>×</button>
          </div>
        );
      })}
    </ScrollHint>
      {/* Estado vacío */}
      {partidas.length===0&&(
        <div style={{padding:"26px 16px",textAlign:"center",color:C.grayMid,fontSize:13,
          background:"#FAFAFA",borderRadius:10,marginBottom:14}}>
          {readOnly?"Sin partidas capturadas en esta sección.":"Aún no hay partidas capturadas en esta sección."}
        </div>
      )}
      {/* Add row — no aplica en modo lectura */}
      {!readOnly&&(
        <button onClick={onAdd}
          style={{width:"100%",marginTop:partidas.length===0?0:14,padding:"16px 24px",
            border:`2px dashed ${headerColor}50`,borderRadius:10,
            background:`${headerColor}0D`,cursor:"pointer",color:headerColor,
            fontSize:13.5,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=headerColor;e.currentTarget.style.background=`${headerColor}1A`;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=`${headerColor}50`;e.currentTarget.style.background=`${headerColor}0D`;}}>
          <span style={{fontSize:18,fontWeight:800,lineHeight:1}}>+</span> {addLabel}
        </button>
      )}
    </div>
  );
}

// ─── NOMINA TABLE ─────────────────────────────────────────────────────────────
// numMesesProyecto (A1, 02-sep-2026): la duración REAL del proyecto, la misma que
// ya usa totalNomAnual vía calcularNumMesesOp. Antes esta tabla tenía un 12
// escrito a mano, así que el COSTO ANUAL del renglón y el TOTAL ANUAL de la
// sección se despegaban en cuanto el proyecto no duraba exactamente 12 meses:
// en "Cambio de servicio" (8 meses) los renglones mostraban $5,713,560 contra
// los $3,809,040 reales de la sección. El que mentía era el renglón — el total de
// la sección es el que alimenta los KPIs.
// numMesesProyecto NO tiene valor por omisión, a propósito. Un default de 12 sería
// el mismo 12 mentiroso que este cambio vino a quitar: una llamada que olvidara
// pasarlo revivirá el bug en silencio y solo en esa pantalla. Sin default, el
// olvido se ve —el guardarraíl de abajo lo grita en desarrollo y los importes
// salen NaN en pantalla— en vez de mostrar un número creíble y equivocado.
// Hoy hay exactamente DOS llamadas y las dos lo pasan: Capturar costos
// (App.jsx:4674) y la vista de solo lectura (App.jsx:5290).
function NominaTable({nomina,onUpdate,onRemove,onAdd,readOnly=false,numMesesProyecto}){
  if(import.meta.env.DEV && !(numMesesProyecto>0)){
    console.error(
      "[nómina] NominaTable se llamó sin numMesesProyecto. Pásale la duración real\n"+
      "del proyecto, la misma que usa totalNomAnual:\n"+
      "    numMesesProyecto={calcularNumMesesOp(pres?.fechaInicio,pres?.fechaFin)}\n"+
      "Sin eso, el COSTO ANUAL del renglón no cuadra con el TOTAL ANUAL de la sección."
    );
  }
  return(
    <div>
    <ScrollHint minWidth={720}>
      {nomina.length>0&&(
        <div style={{display:"grid",
          gridTemplateColumns:"2fr 110px 60px 1fr 80px 80px 120px 34px",
          gap:16,padding:"0 0 12px 0",marginBottom:4,
          borderBottom:`1px solid ${C.line}`}}>
          {["Puesto","Tipo","Cant.","Salario/mes","IMSS+PT","Prestac.","Costo anual",""].map((h,i)=>(
            <div key={i} style={{fontSize:11,fontWeight:700,color:C.grayMid,
              textTransform:"uppercase",letterSpacing:0.3,
              textAlign:i>=2?"right":"left"}}>{h}</div>
          ))}
        </div>
      )}
      {nomina.map((p,idx)=>{
        const factor=1+(p.imss??F_IMSS)+(p.prestaciones??F_PREST)+(p.isr??F_ISR);
        const costo=(p.salario||0)*factor*(p.cantidad||1);
        const meses = mesesNomina(p, numMesesProyecto);
        const costoTotal = costoTotalNomina(p, numMesesProyecto);
        // Modo lectura — mismo patrón que PartidaTable: fila de solo texto, sin
        // inputs ni botón de eliminar.
        if(readOnly){
          const puestoLabel = p.puesto==="Otro" ? (p.puestoCustom||"Otro") : (p.puesto||"—");
          return(
            <div key={p.id} style={{marginBottom:14}}>
              <div className="partida-row" style={{display:"grid",
                gridTemplateColumns:"2fr 110px 60px 1fr 80px 80px 120px 34px",background:idx%2===1?"#FAFBFC":"transparent",
                gap:16,alignItems:"center",padding:"14px 12px",margin:"0 -12px",
                borderBottom:idx<nomina.length-1?`1px solid ${C.line}`:"none"}}>
                <div style={{fontSize:12.5,fontWeight:600,color:C.grayDark}}>{puestoLabel}</div>
                <div style={{fontSize:12,color:C.grayMid,textTransform:"capitalize"}}>{p.tipoPersonal||"fijo"}</div>
                <div style={{fontSize:12,color:C.grayMid,textAlign:"right"}}>{p.cantidad||1}</div>
                <div style={{fontSize:12,color:C.grayMid,textAlign:"right"}}>{fmt(p.salario||0)}</div>
                <div style={{fontSize:12,color:C.grayMid,textAlign:"right"}}>{p.imss}</div>
                <div style={{fontSize:12,color:C.grayMid,textAlign:"right"}}>{p.prestaciones}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.success}}>{fmt(costoTotal)}</div>
                  <div style={{fontSize:9,color:C.grayMid}}>{meses} mes(es)</div>
                </div>
                <div/>
              </div>
            </div>
          );
        }
        return(
          <div key={p.id} style={{marginBottom:14}}>
            <div className="partida-row" style={{display:"grid",
              gridTemplateColumns:"2fr 110px 60px 1fr 80px 80px 120px 34px",background:idx%2===1?"#FAFBFC":"transparent",
              gap:16,alignItems:"center",padding:"14px 12px",margin:"0 -12px",
              borderBottom:idx<nomina.length-1?`1px solid ${C.line}`:"none"}}>
              {/* Puesto */}
              <CatalogInput value={p.puesto==="Otro"?p.puestoCustom||"":p.puesto}
                onChange={v=>{
                  if(PUESTOS_CAT.includes(v)) onUpdate({...p,puesto:v,puestoCustom:""});
                  else onUpdate({...p,puesto:"Otro",puestoCustom:v});
                }}
                options={PUESTOS_CAT} placeholder="— Elige puesto —" allowCustom={true}/>
              {/* Tipo de personal */}
              {/* Sin tipo, el puesto aporta $0.00 al costo anual (ver mesesNomina).
                  Mismo marcado en rojo que periodicidad. */}
              <select value={p.tipoPersonal||""}
                onChange={e=>onUpdate({...p,tipoPersonal:e.target.value})}
                className="sel-brand"
                title={p.tipoPersonal?undefined:"Sin tipo de personal este puesto no suma al costo anual"}
                style={{padding:"8px 10px",border:`1px solid ${!p.tipoPersonal?C.danger:C.grayBorder}`,borderRadius:6,
                  fontSize:11,width:"100%",background:!p.tipoPersonal?"#FFF5F5":C.white}}>
                <option value="" disabled>— Elige tipo —</option>
                <option value="fijo">Fijo</option>
                <option value="contrato">Contrato</option>
                <option value="outsourcing">Outsourcing</option>
              </select>
              <input type="number" min="1" value={p.cantidad===0?"":p.cantidad}
                onChange={e=>onUpdate({...p,cantidad:parseInt(e.target.value)||1})}
                onFocus={e=>e.target.select()}
                style={{padding:"7px 5px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  fontSize:12,textAlign:"right",width:"100%",boxSizing:"border-box"}}/>
              <MoneyInput value={p.salario} onChange={v=>onUpdate({...p,salario:v})}/>
              <input type="number" min="0" max="1" step="0.01" value={p.imss}
                onChange={e=>onUpdate({...p,imss:parseFloat(e.target.value)||0})}
                onFocus={e=>e.target.select()}
                style={{padding:"7px 5px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  fontSize:12,textAlign:"right",width:"100%",boxSizing:"border-box"}}/>
              <input type="number" min="0" max="2" step="0.01" value={p.prestaciones}
                onChange={e=>onUpdate({...p,prestaciones:parseFloat(e.target.value)||0})}
                onFocus={e=>e.target.select()}
                style={{padding:"7px 5px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  fontSize:12,textAlign:"right",width:"100%",boxSizing:"border-box"}}/>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:700,color:C.success}}>{fmt(costoTotal)}</div>
                <div style={{fontSize:9,color:C.grayMid}}>{meses} mes(es)</div>
              </div>
              <button onClick={()=>onRemove(p.id)}
                style={{background:"transparent",border:"none",cursor:"pointer",
                  color:C.grayMid,fontSize:16,padding:"2px 4px"}}
                onMouseEnter={e=>e.currentTarget.style.color=C.danger}
                onMouseLeave={e=>e.currentTarget.style.color=C.grayMid}>×</button>
            </div>
            {/* Fórmula + meses de contrato si aplica */}
            <div style={{padding:"5px 8px",fontSize:10,color:"#16a34a",
              background:"#f0fdf4",borderRadius:4,marginTop:2,
              display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <span>
                {fmt(p.salario)} × (1+{p.imss}+{p.prestaciones}+{p.isr??F_ISR}) × {p.cantidad} = <strong>{fmt(costo)}/mes</strong>
              </span>
              {(p.tipoPersonal==="contrato"||p.tipoPersonal==="outsourcing")&&(
                <span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:C.grayMid}}>Meses de contrato:</span>
                  <input type="number" min="1" max="240" value={p.mesesContrato||12}
                    onChange={e=>onUpdate({...p,mesesContrato:parseInt(e.target.value)||1})}
                    style={{width:48,padding:"2px 5px",border:`1px solid #bbf7d0`,
                      borderRadius:4,fontSize:11,textAlign:"center"}}/>
                  {/* Quitado el 02-sep-2026 a petición de Luis: aquí iba
                      "x Total: {fmt(costoTotal)}", el mismo número que ya está en
                      la columna COSTO ANUAL del renglón de arriba. Verlo dos veces
                      confunde. El input de Meses de contrato SE QUEDA: es la única
                      forma de capturar ese dato. costoTotal se sigue calculando
                      igual, solo deja de pintarse en esta línea. */}
                </span>
              )}
              {/* Decía "x 12 meses" fijo, que era falso en cuanto el proyecto no
                  duraba 12. Ahora dice los meses que de verdad se cobran, los
                  mismos que la columna COSTO ANUAL del renglón. */}
              {p.tipoPersonal==="fijo"&&(
                <span style={{color:"#059669",fontWeight:700}}>× {meses} mes{meses===1?"":"es"} = {fmt(costoTotal)}</span>
              )}
            </div>
          </div>
        );
      })}
    </ScrollHint>
      {nomina.length===0&&(
        <div style={{padding:"26px 16px",textAlign:"center",color:C.grayMid,fontSize:13,
          background:"#FAFAFA",borderRadius:10,marginBottom:14}}>
          {readOnly?"Sin puestos de nómina capturados en esta área.":"Aún no hay puestos de nómina capturados en esta área."}
        </div>
      )}
      {!readOnly&&(
        <button onClick={onAdd}
          style={{width:"100%",marginTop:nomina.length===0?0:14,padding:"16px 24px",
            border:"2px dashed #86e0b8",borderRadius:10,
            background:"#0596690D",cursor:"pointer",color:"#059669",
            fontSize:13.5,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#059669";e.currentTarget.style.background="#0596691A";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#86e0b8";e.currentTarget.style.background="#0596690D";}}>
          <span style={{fontSize:18,fontWeight:800,lineHeight:1}}>+</span> Agregar puesto
        </button>
      )}
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SCard({title,subtitle,total,accentColor,icon,children}){
  return(
    <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,
      borderRadius:14,overflow:"hidden",marginBottom:26,
      boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
      <div style={{padding:"22px 28px",display:"flex",justifyContent:"space-between",
        alignItems:"center",borderBottom:`1px solid ${C.line}`,
        borderLeft:`4px solid ${accentColor}`,background:"linear-gradient(#FBFBFB,#F7F7F7)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {icon&&(
            <div style={{width:38,height:38,borderRadius:10,flexShrink:0,
              background:`${accentColor}18`,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:18}}>{icon}</div>
          )}
          <div>
            <div style={{fontWeight:700,fontSize:16,color:C.grayDark,letterSpacing:0.2}}>{title}</div>
            {subtitle&&<div style={{fontSize:12,color:C.grayMid,marginTop:4,lineHeight:1.5}}>{subtitle}</div>}
          </div>
        </div>
        {total!==undefined&&(
          <div style={{textAlign:"right",flexShrink:0,marginLeft:16}}>
            <div style={{fontSize:9,fontWeight:700,color:C.grayMid,textTransform:"uppercase",letterSpacing:0.5}}>Total anual</div>
            <div style={{fontSize:19,fontWeight:800,color:accentColor,marginTop:2}}>{fmt(total)}</div>
          </div>
        )}
      </div>
      <div style={{padding:28}}>{children}</div>
    </div>
  );
}

// ─── CAJA DE ÁREA COLAPSABLE (solo Información general, Step 5) ──────────────
// Luis: "elimínalas de ahí porque inclusive nadie las va a ver" y "ya viene
// sumarizado en esta tabla de CAPEX y OPEX". No se borran porque Salvador (PMO)
// las ocupa para revisar su área: se colapsan, cerradas por defecto, con el
// mismo triángulo ▶/▼ que ya usan los subtotales de la tabla contable
// (TablaServicio). El estado NO se persiste: vive en este componente y se
// reinicia en cada visita, a propósito — nada de una séptima clave en
// localStorage.
//
// OJO: esto es SOLO para Step 5. Las cajas de Capturar costos (Step 3), las que
// tienen "+ Agregar puesto" y "+ Agregar equipo", NO usan este componente y no
// se tocaron: ahí se trabaja y tienen que estar abiertas.
function AreaColapsable({encabezado, derecha, children}){
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <div onClick={()=>setAbierta(v=>!v)}
        title={abierta?"Clic para colapsar el área":"Clic para ver el detalle del área"}
        style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          marginBottom:abierta?18:0,cursor:"pointer",userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,width:12,flexShrink:0,color:C.grayMid}}>{abierta?"▼":"▶"}</span>
          {encabezado}
        </div>
        {derecha}
      </div>
      {abierta&&children}
    </>
  );
}

// ─── CHARTS ──────────────────────────────────────────────────────────────────
function LineChart({series,height=260,meses}){
  if(!series||series.length===0)return null;
  const W=900,H=height,pL=80,pR=24,pT=24,pB=44;
  const cW=W-pL-pR,cH=H-pT-pB;
  const allV=series.flatMap(s=>s.data).filter(v=>v>0);
  const maxV=Math.max(...allV,1);
  const n=series[0]?.data?.length||12;
  const xP=i=>pL+(i/(n-1))*cW;
  const yP=v=>pT+cH-Math.max(0,Math.min(1,v/maxV))*cH;
  const fmtY=v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v.toFixed(0)}`;
  const gridVals=[0,.2,.4,.6,.8,1];
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      {/* Fondo área gráfica */}
      <rect x={pL} y={pT} width={cW} height={cH} fill="#FAFAFA" rx="3"/>
      {/* Grid horizontal */}
      {gridVals.map(p=>{
        const v=maxV*p, y=yP(v);
        return <g key={p}>
          <line x1={pL} y1={y} x2={W-pR} y2={y} stroke={p===0?"#ccc":C.line} strokeWidth={p===0?"1.5":"0.8"} strokeDasharray={p===0?"none":"4 3"}/>
          <text x={pL-10} y={y+4} textAnchor="end" fontSize="11" fill={C.grayMid} fontFamily="Inter,sans-serif">{fmtY(v)}</text>
        </g>;
      })}
      {/* Etiquetas X — con `meses` ya no asume arranque en enero (MESES[i%12] mentía
          en proyectos que no empiezan en enero); sin ese prop, mismo comportamiento de hoy. */}
      {Array.from({length:n},(_,i)=>{
        const lbl=meses ? (meses[i]||"") : (MESES[i%12]||`M${i}`);
        return <text key={i} x={xP(i)} y={H-12} textAnchor="middle" fontSize="11" fill={C.grayMid} fontFamily="Inter,sans-serif">{lbl}</text>;
      })}
      {/* Líneas de datos */}
      {series.map((s,si)=>{
        const pts=s.data.map((v,i)=>`${xP(i)},${yP(v)}`).join(" ");
        return <g key={s.label}>
          <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5"
            strokeLinejoin="round" strokeLinecap="round"/>
          {s.data.map((v,i)=>(
            <circle key={i} cx={xP(i)} cy={yP(v)} r="5"
              fill={s.color} stroke={C.white} strokeWidth="2.5"/>
          ))}
        </g>;
      })}
    </svg>
  );
}

function BarChart({items,height=260}){
  if(!items||items.length===0)return null;
  const W=900,H=height,pL=80,pR=24,pT=24,pB=56;
  const cW=W-pL-pR,cH=H-pT-pB;
  const maxV=Math.max(...items.map(i=>i.value),1);
  const slot=cW/items.length;
  const barW=Math.min(80,slot*0.55);
  const fmtY=v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v.toFixed(0)}`;
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <rect x={pL} y={pT} width={cW} height={cH} fill="#FAFAFA" rx="3"/>
      {[0,.25,.5,.75,1].map(p=>{
        const v=maxV*p, y=pT+cH*(1-p);
        return <g key={p}>
          <line x1={pL} y1={y} x2={W-pR} y2={y} stroke={p===0?"#ccc":C.line} strokeWidth={p===0?"1.5":"0.8"} strokeDasharray={p===0?"none":"4 3"}/>
          <text x={pL-10} y={y+4} textAnchor="end" fontSize="11" fill={C.grayMid} fontFamily="Inter,sans-serif">{fmtY(v)}</text>
        </g>;
      })}
      {items.map((item,i)=>{
        const cx=pL+slot*i+slot/2;
        const x=cx-barW/2;
        const bH=Math.max(2,(item.value/maxV)*cH);
        const y=pT+cH-bH;
        const lbl=item.label.length>14?item.label.slice(0,14)+"…":item.label;
        return <g key={item.label}>
          {/* Barra con gradiente visual */}
          <rect x={x} y={y} width={barW} height={bH} rx="4" fill={item.color} opacity="0.88"/>
          {/* Etiqueta valor encima */}
          <text x={cx} y={Math.max(y-8,pT+14)} textAnchor="middle" fontSize="11"
            fill={item.color} fontWeight="700" fontFamily="Inter,sans-serif">
            {fmtY(item.value)}
          </text>
          {/* Etiqueta área debajo */}
          <text x={cx} y={H-16} textAnchor="middle" fontSize="11" fill={C.grayMid} fontFamily="Inter,sans-serif">{lbl}</text>
        </g>;
      })}
    </svg>
  );
}

// ─── GRÁFICA I: barras + línea para flujo de efectivo ────────────────────────
// Extraída de Step 4 (Resumen mensual) para poder reutilizarse tal cual en
// Step 5 (Mi presupuesto). Único cambio de forma respecto al original: recibe
// `meses` como prop en vez de cerrar sobre NMESES/MESES13 de Step 4 (una
// función a nivel de módulo no puede cerrar sobre variables locales de un
// bloque de otra función) — la lógica de dibujo es idéntica.
function FlowChart({barData,lineData,height=300,meses}){
  const NMESES=meses.length;
  const W=960,H=height,pL=90,pR=24,pT=28,pB=44;
  const cW=W-pL-pR, cH=H-pT-pB;
  const absMax=Math.max(...[...barData,...lineData].map(Math.abs),1);
  // Eje Y: de -absMax a +absMax, cero en el centro
  const yZero=pT+cH/2;
  const yP=v=>yZero-(v/absMax)*(cH/2);
  const xP=i=>pL+((i+0.5)/NMESES)*cW;
  const bW=Math.max(18,(cW/NMESES)*0.55);
  const fmtA=v=>{
    if(v===0)return "$0";
    const abs=Math.abs(v);
    const s=abs>=1000000?`$${(abs/1000000).toFixed(1)}M`:abs>=1000?`$${(abs/1000).toFixed(0)}K`:`$${abs.toFixed(0)}`;
    return v<0?`-${s}`:s;
  };
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      {/* Fondo */}
      <rect x={pL} y={pT} width={cW} height={cH} fill="#FAFAFA" rx="3"/>
      {/* Fondo zona positiva */}
      <rect x={pL} y={pT} width={cW} height={cH/2} fill="#f0fdf4" rx="3" opacity="0.5"/>
      {/* Grid lines */}
      {[-1,-0.5,0,0.5,1].map(p=>{
        const y=yZero-(p*cH/2);
        return <g key={p}>
          <line x1={pL} y1={y} x2={W-pR} y2={y}
            stroke={p===0?"#888":"#E5E7EB"}
            strokeWidth={p===0?2:0.8}
            strokeDasharray={p===0?"none":"4 3"}/>
          <text x={pL-10} y={y+4} textAnchor="end" fontSize="11"
            fill={p===0?C.grayDark:C.grayMid} fontWeight={p===0?"700":"400"}
            fontFamily="Inter,sans-serif">
            {fmtA(absMax*p)}
          </text>
        </g>;
      })}
      {/* Barras flujo mensual */}
      {barData.map((v,i)=>{
        const x=xP(i)-bW/2;
        const barH=Math.max(1,Math.abs(v)/absMax*(cH/2));
        const y=v>=0?yZero-barH:yZero;
        return <g key={i}>
          <rect x={x} y={y} width={bW} height={barH} rx="3"
            fill={v>=0?"#DDAC00":"#EF4444"} opacity="0.9"/>
        </g>;
      })}
      {/* Línea flujo acumulado */}
      {lineData.length>0&&(()=>{
        const pts=lineData.map((v,i)=>`${xP(i)},${yP(v)}`).join(" ");
        return <g>
          <polyline points={pts} fill="none" stroke="#1E40AF" strokeWidth="2.5"
            strokeLinejoin="round" strokeLinecap="round"/>
          {lineData.map((v,i)=>(
            <circle key={i} cx={xP(i)} cy={yP(v)} r="4.5"
              fill={v>=0?"#059669":"#EF4444"} stroke={C.white} strokeWidth="2"/>
          ))}
        </g>;
      })()}
      {/* Etiquetas X */}
      {meses.map((m,i)=>(
        <text key={m} x={xP(i)} y={H-10} textAnchor="middle" fontSize="11"
          fill={C.grayMid} fontFamily="Inter,sans-serif">{m}</text>
      ))}
    </svg>
  );
}

// ─── GRÁFICA II: líneas por categoría OPEX ───────────────────────────────────
// Extraída de Step 4 igual que FlowChart — mismo motivo, mismo único cambio
// de forma (recibe `meses` como prop en vez de cerrar sobre NMESES/MESES13).
function CatLinesChart({series,height=300,meses}){
  if(!series||series.length===0) return(
    <div style={{padding:"32px 20px",color:C.grayMid,fontSize:13,textAlign:"center",
      background:"#FAFAFA",borderRadius:8,border:`1px dashed ${C.grayBorder}`}}>
      Captura partidas OPEX en las áreas para ver esta gráfica.
    </div>
  );
  const NMESES=meses.length;
  // pR era 130 para dejar sitio a los rótulos del final de cada línea. Sin
  // rótulos, ese margen quedaba como una franja vacía a la derecha de la
  // gráfica: se reduce a 24 y la línea usa el ancho. Solo geometría del SVG —
  // los datos y las escalas no cambian.
  const W=960,H=height,pL=90,pR=24,pT=24,pB=44;
  const cW=W-pL-pR, cH=H-pT-pB;
  const allV=series.flatMap(s=>s.data).filter(v=>v>0);
  const maxV=Math.max(...allV,1);
  const xP=i=>pL+(i/(NMESES-1))*cW;
  const yP=v=>pT+cH-Math.max(0,Math.min(1,v/maxV))*cH;
  const fmtY=v=>v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v.toFixed(0)}`;
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <rect x={pL} y={pT} width={cW} height={cH} fill="#FAFAFA" rx="3"/>
      {/* Grid */}
      {[0,.25,.5,.75,1].map(p=>{
        const v=maxV*p, y=yP(v);
        return <g key={p}>
          <line x1={pL} y1={y} x2={pL+cW} y2={y}
            stroke={p===0?"#ccc":C.line} strokeWidth={p===0?"1.5":"0.8"} strokeDasharray={p===0?"none":"4 3"}/>
          <text x={pL-10} y={y+4} textAnchor="end" fontSize="11"
            fill={C.grayMid} fontFamily="Inter,sans-serif">{fmtY(v)}</text>
        </g>;
      })}
      {/* Etiquetas X */}
      {meses.map((m,i)=>(
        <text key={m} x={xP(i)} y={H-10} textAnchor="middle" fontSize="11"
          fill={C.grayMid} fontFamily="Inter,sans-serif">{m}</text>
      ))}
      {/* Líneas por categoría */}
      {series.map((s,si)=>{
        const pts=s.data.map((v,i)=>`${xP(i)},${yP(v)}`).join(" ");
        // lastV/lastY solo servían para colocar el rótulo del final de la línea,
        // que se quitó (ver abajo). Se eliminan para no dejar código muerto.
        return <g key={s.label}>
          <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5"
            strokeLinejoin="round" strokeLinecap="round"/>
          {s.data.map((v,i)=>(
            <circle key={i} cx={xP(i)} cy={yP(v)} r="4"
              fill={s.color} stroke={C.white} strokeWidth="2"/>
          ))}
          {/* Aquí iba un rótulo por serie al final de su línea. Quitado el
              03-sep-2026: todas las series se rotulaban en la MISMA x, y las que
              terminan en cero comparten la misma y, así que se encimaban unas
              sobre otras y quedaban ilegibles. No es un caso raro — en
              PERDIZ-PAPAN las CATORCE series terminan en cero, o sea catorce
              rótulos en el mismo punto. Separarlos verticalmente los habría
              alejado tanto de su línea que ya no diría cuál es cuál.
              La leyenda de colores de arriba de la gráfica ya dice qué es cada
              línea, y esta vista es la única que queda tras la fusión: un rótulo
              ilegible estorba más de lo que ayuda. */}
        </g>;
      })}
    </svg>
  );
}

// ─── EXPORTAR EXCEL (SheetJS) ────────────────────────────────────────────────
// Agrupación de la hoja SERVICIO — extraída tal cual de exportarExcel (spec
// "Separar captura y visualización", día 1) para poder reutilizarla también
// en pantalla (TablaServicio, día 2) sin duplicar la lógica de agrupación.
// Ninguna operación aritmética cambia respecto al bloque original.
function construirFilasServicio({pres, areas, costos, NMESES, mCapex, mEgresos, totalCAPEX, totalIngresosAnual, mIngresos, totalEgr}){
  const NUM_MESES_OP=NMESES-1;
  const filas=[];

  filas.push({tipo:"seccion", label:"INGRESOS año MXN", macro:null, bloque:null, total:"", mensual:Array(NMESES).fill("")});
  filas.push({tipo:"detalle", label:"FACTURACIÓN", macro:null, bloque:"ingresos", total:totalIngresosAnual, mensual:mIngresos});
  filas.push({tipo:"seccion", label:"EGRESOS año", macro:null, bloque:null, total:"", mensual:Array(NMESES).fill("")});

  // CAPEX: 1 renglón por categoría (fecha real de compra), + rollup "ACTIVOS"
  const capexPorCat={};
  areas.forEach(id=>{
    (costos[id]?.capex||[]).forEach(p=>{
      const k=p.cat||"SIN CATEGORÍA";
      if(!capexPorCat[k]) capexPorCat[k]=Array(NMESES).fill(0);
      capexPorCat[k][mesIndexCapex(p,pres?.fechaInicio,NUM_MESES_OP)]+=(p.cantidad||0)*(p.monto||0);
    });
  });
  Object.entries(capexPorCat).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([cat,arr])=>{
    filas.push({tipo:"detalle", label:cat, macro:"ACTIVOS", bloque:"capex", total:arr.reduce((s,v)=>s+v,0), mensual:arr});
  });
  if(Object.keys(capexPorCat).length>0){
    filas.push({tipo:"subtotal", label:"ACTIVOS", macro:"ACTIVOS", bloque:"capex", total:totalCAPEX, mensual:mCapex});
  }

  // OPEX: 1 renglón por categoría (mat/via con periodicidad real), nómina agregada en un solo renglón
  const opexPorCat={};
  areas.forEach(id=>{
    ["mat","via"].forEach(c=>{
      (costos[id]?.[c]||[]).forEach(p=>{
        const k=p.cat||"SIN CATEGORÍA";
        if(!opexPorCat[k]) opexPorCat[k]=Array(NMESES).fill(0);
        distribuirOpex(p,NUM_MESES_OP).forEach((v,i)=>opexPorCat[k][i]+=v);
      });
    });
  });
  const nominaArr=Array(NMESES).fill(0);
  let hayNomina=false;
  areas.forEach(id=>{
    (costos[id]?.nomina||[]).forEach(p=>{
      hayNomina=true;
      distribuirNomina(p,NUM_MESES_OP).forEach((v,i)=>nominaArr[i]+=v);
    });
  });
  if(hayNomina) opexPorCat["NOMINA Y ADICIONALES"]=nominaArr;

  // Agrupar categorías OPEX bajo su categoría contable macro
  const macroGrupos={};
  Object.entries(opexPorCat).forEach(([cat,arr])=>{
    const macro=macroDeCategoria(cat);
    if(!macroGrupos[macro]) macroGrupos[macro]={};
    macroGrupos[macro][cat]=arr;
  });
  // ── Orden de los rubros: EL DEL ARCHIVO DE ANEL, no alfabético ──────────
  // (03-sep-2026, autorizado por el usuario a tocar esta función.)
  // CATS_MACRO_CONTABLE ya viene en el orden exacto de
  // docs/catalogo_contable_2027.csv — se usa su índice, no se modifica la lista
  // (regla 2 de CLAUDE.md: es de finanzas). Antes era localeCompare, que en
  // estos 18 rubros da casi el mismo resultado por casualidad —el catálogo está
  // casi alfabetizado— pero no lo garantiza y además metía SIN CATEGORÍA en la
  // "S", entre SERVICIOS DE CAPACITACION y VEHICULOS.
  // Cambia el ORDEN de las filas, no los montos: es un sort, cada fila conserva
  // su total y su arreglo mensual.
  const ORDEN_RUBRO=new Map(CATS_MACRO_CONTABLE.map((r,i)=>[normCat(r),i]));
  const SIN_CATEGORIA="SIN CATEGORÍA";
  function posMacro(m){
    if(m===SIN_CATEGORIA) return 9999;                 // siempre al final, con su etiqueta
    const i=ORDEN_RUBRO.get(normCat(m));
    return i===undefined ? 9000 : i;                   // lo que no es rubro del CSV, antes de SIN CATEGORÍA
  }
  const ordenMacro=(a,b)=>{
    const d=posMacro(a)-posMacro(b);
    return d!==0 ? d : a.localeCompare(b);             // desempate estable entre los "no rubro"
  };
  Object.entries(macroGrupos).sort((a,b)=>ordenMacro(a[0],b[0])).forEach(([macro,cats])=>{
    const catEntries=Object.entries(cats).sort((a,b)=>a[0].localeCompare(b[0]));
    const macroArr=Array(NMESES).fill(0);
    catEntries.forEach(([,arr])=>arr.forEach((v,i)=>macroArr[i]+=v));
    const totalMacro=macroArr.reduce((s,v)=>s+v,0);
    // Rubro sin dinero no se pinta.
    if(totalMacro===0) return;
    // TODO rubro emite su fila de subtotal, siempre. Antes, un rubro con una
    // sola subcuenta que se llamaba igual que él (esUnaSolaIgualAMacro) salía
    // como una fila de detalle suelta y SIN subtotal — o sea que Anel no lo veía
    // como rubro. Le pasa a SERVICIOS en PERDIZ-PAPAN y a otros siete rubros
    // ahí, y a cinco en Cuervito: entre los dos son $8.0M colgando de filas que
    // no son de rubro. En el Excel condensado, que se arma con las filas de
    // subtotal, ese dinero simplemente no aparecería.
    // La fila de detalle redundante (la que repite el nombre del rubro) se
    // omite: no aporta nada y duplicaría el renglón en pantalla.
    const soloRepiteElRubro=catEntries.length===1 && normCat(catEntries[0][0])===normCat(macro);
    if(!soloRepiteElRubro){
      catEntries.forEach(([cat,arr])=>{
        filas.push({tipo:"detalle", label:cat, macro, bloque:"opex", total:arr.reduce((s,v)=>s+v,0), mensual:arr});
      });
    }
    filas.push({tipo:"subtotal", label:macro, macro, bloque:"opex", total:totalMacro, mensual:macroArr});
  });

  filas.push({tipo:"total", label:"TOTAL EGRESOS", macro:null, bloque:null, total:totalEgr, mensual:mEgresos});

  return filas;
}

// nivel (03-sep-2026) — UNA sola función con una bandera, no dos generadores:
//   "detalle" → "Excel visual": SERVICIO con rubro + subcuenta, más FLUJO,
//               EGRESOS (partida por partida) e INFO. Es para revisar la
//               clasificación antes de cargar.
//   "rubro"   → "Excel para Apps": la MISMA hoja SERVICIO colapsada a nivel
//               rubro (solo las filas de subtotal) más INFO. Es el que se carga
//               al sistema de Anel.
// Colapsar salió más chico que emitir dos recorridos: construirFilasServicio ya
// etiqueta cada fila con su tipo, así que el condensado es un filtro sobre las
// mismas filas. Los montos son los mismos en los dos archivos — no se vuelve a
// sumar nada aquí.
async function exportarExcel({pres, areas, costos, ingresos, mCapex, mOpex, mEgresos,
  mFlujo: mFlujoBase, mFlujoAcum: mFlujoAcumBase, mIngresos: mIngresosBase, totalCAPEX, totalOPEX, totalEgr,
  totalIngresosAnual, MESES13, NMESES, totalNom, totalCat, ingAdicionales=[], nivel="detalle"}) {
  const soloRubro = nivel==="rubro";
  // mIngresosBase ya incluye los ingresos adicionales por mes (fusionados en el cálculo
  // del Resumen mensual) — se reutiliza tal cual para que el Excel cuadre con la pantalla.
  const mIngresos = mIngresosBase;
  const mFlujo = mFlujoBase;
  const mFlujoAcum = mFlujoAcumBase;
  // Cargar SheetJS con soporte de estilos
  if(!window.XLSX){
    await new Promise((res,rej)=>{
      const s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload=res; s.onerror=rej;
      document.head.appendChild(s);
    });
  }
  const XLSX=window.XLSX;
  const wb=XLSX.utils.book_new();

  // Formato de moneda MXN para celdas numéricas
  const FMT_MONEY = '"$"#,##0.00';
  const FMT_INT   = '#,##0';

  // Helper: aplicar formato de moneda a un rango de celdas en una hoja
  function applyMoneyFmt(ws, startRow, startCol, endRow, endCol, fmt=FMT_MONEY){
    for(let r=startRow;r<=endRow;r++){
      for(let c=startCol;c<=endCol;c++){
        const addr=XLSX.utils.encode_cell({r,c});
        if(ws[addr]&&typeof ws[addr].v==="number"){
          ws[addr].t="n";
          ws[addr].z=fmt;
        }
      }
    }
  }

  // Helper: crear celda con estilo de header
  function hCell(v, color="1a1a1a", bg="DDAC00", bold=true){
    return {v, t:"s", s:{
      font:{bold, color:{rgb:color}, sz:11},
      fill:{fgColor:{rgb:bg}},
      alignment:{horizontal:"center",vertical:"center"},
      border:{bottom:{style:"medium",color:{rgb:"B08900"}}}
    }};
  }

  // ── Hoja 1: SERVICIO ──────────────────────────────────────────────────────
  // Estructura calcada del archivo real de Geolis (SERVICIO): cada subcategoría
  // en su propio renglón con distribución mensual real (fecha real para CAPEX,
  // periodicidad real para OPEX), agrupada bajo su categoría contable macro con
  // un renglón de subtotal — en vez del resumen de 4 filas que había antes.
  const NUM_MESES_OP=NMESES-1;
  const hdrS=["Descripción","Total Presupuestado",...MESES13];
  const rowsS=[hdrS];
  const seccionRows=[], subtotalRows=[], totalRows=[];

  const filasServicio=construirFilasServicio({pres, areas, costos, NMESES, mCapex, mEgresos, totalCAPEX, totalIngresosAnual, mIngresos, totalEgr});
  // El condensado se queda con las secciones, los subtotales de rubro y el
  // total; se van las filas de subcuenta.
  //
  // Y EXACTAMENTE UNA FILA POR RUBRO (03-sep-2026): si dos filas comparten
  // rubro, se suman en una sola. Es regla general, no un parche — hoy le pasa a
  // ACTIVOS, que sale dos veces porque el subtotal del bloque CAPEX se rotula
  // ACTIVOS y además hay categorías de OPEX que mapean ahí (LICENCIAMIENTO,
  // ACCESORIOS, INFRAESTRUCTURA DE RED); si mañana pasa con otro rubro, ya está
  // resuelto.
  // POR QUÉ solo aquí: el archivo de Anel no separa CAPEX de OPEX. Su estructura
  // es INGRESOS / EGRESOS y bajo egresos una fila por rubro. El corte
  // CAPEX/OPEX es un concepto de esta app, no contable: un licenciamiento que
  // mapea a un rubro de activos es un activo, se haya capturado donde se haya
  // capturado. En "Excel visual" y EN PANTALLA la separación se queda, porque
  // ahí el público es interno y sí necesita ver qué es inversión y qué es gasto
  // recurrente.
  // No se recalcula nada: se suman filas ya calculadas. Y se trabaja sobre
  // COPIAS —{...f} con su mensual clonado— porque este mismo arreglo de filas
  // es el que está pintando la tabla en pantalla: mutarlo la corrompería.
  const filasHoja = (()=>{
    if(!soloRubro) return filasServicio;
    const sinDetalle = filasServicio.filter(f=>f.tipo!=="detalle" || f.bloque==="ingresos");
    const out=[], porRubro=new Map();
    sinDetalle.forEach(f=>{
      if(f.tipo!=="subtotal"){ out.push(f); return; }
      const clave=f.macro||f.label;
      const ya=porRubro.get(clave);
      if(!ya){
        const copia={...f, mensual:[...f.mensual]};
        porRubro.set(clave,copia); out.push(copia);
        return;
      }
      // Se funde en la fila que ya existe: conserva su posición, que es la que
      // le da el orden del CSV.
      ya.total+=f.total;
      f.mensual.forEach((v,i)=>{ ya.mensual[i]=(ya.mensual[i]||0)+v; });
    });
    return out;
  })();
  filasHoja.forEach(fila=>{
    rowsS.push([fila.label, fila.total, ...fila.mensual]);
    const ri=rowsS.length-1;
    if(fila.tipo==="seccion") seccionRows.push(ri);
    else if(fila.tipo==="subtotal") subtotalRows.push(ri);
    else if(fila.tipo==="total") totalRows.push(ri);
  });

  const wsS=XLSX.utils.aoa_to_sheet(rowsS);
  wsS["!cols"]=[{wch:34},{wch:18},...Array(NMESES).fill({wch:14})];
  // Formato moneda en todas las columnas numéricas
  applyMoneyFmt(wsS, 1, 1, rowsS.length-1, NMESES+1);
  // Fila 0 (header) en negrita
  for(let c=0;c<=NMESES+1;c++){
    const a=XLSX.utils.encode_cell({r:0,c});
    if(wsS[a]) wsS[a].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1a1a1a"}},alignment:{horizontal:"center"}};
  }
  // Filas de sección (INGRESOS año, EGRESOS año)
  seccionRows.forEach(ri=>{
    for(let c=0;c<=NMESES+1;c++){
      const a=XLSX.utils.encode_cell({r:ri,c});
      if(wsS[a]) wsS[a].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"374151"}}};
    }
  });
  // Filas de subtotal por categoría macro (ACTIVOS, y macro-rollups de OPEX)
  subtotalRows.forEach(ri=>{
    for(let c=0;c<=NMESES+1;c++){
      const a=XLSX.utils.encode_cell({r:ri,c});
      if(wsS[a]) wsS[a].s={font:{bold:true,color:{rgb:"7c3aed"}},fill:{fgColor:{rgb:"F5F3FF"}}};
    }
  });
  // Fila de total general de egresos
  totalRows.forEach(ri=>{
    for(let c=0;c<=NMESES+1;c++){
      const a=XLSX.utils.encode_cell({r:ri,c});
      if(wsS[a]) wsS[a].s={font:{bold:true,color:{rgb:"991B1B"}},fill:{fgColor:{rgb:"FEE2E2"}}};
    }
  });
  XLSX.utils.book_append_sheet(wb,wsS,"SERVICIO");

  // ── Hoja 2: FLUJO ─────────────────────────────────────────────────────────
  // Incluye las filas "IVA" (16%) que trae el archivo real de Geolis junto a
  // cada total — la app no cobra IVA automáticamente en la captura, así que
  // estas filas son el total con IVA agregado sobre lo ya capturado.
  const IVA_RATE=0.16;
  const mIngresosIVA=mIngresos.map(v=>v*(1+IVA_RATE));
  const mEgresosIVA=mEgresos.map(v=>v*(1+IVA_RATE));
  const mFlujoIVA=mIngresosIVA.map((v,i)=>v-mEgresosIVA[i]);
  const mFlujoAcumIVA=mFlujoIVA.reduce((acc,v,i)=>{ acc.push(i===0?v:acc[i-1]+v); return acc; },[]);
  const rowsF=[
    ["","","","","Mes 0","Mes 0",...Array(11).fill("").map((_,i)=>`Mes ${i+1}`)],
    ["","","","","ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","FEB"],
    // "Ingresos (MN)" se queda: es encabezado de sección y hace par con
    // "Egresos (MX)" tres renglones abajo, igual que INGRESOS 2027 / EGRESOS 2027
    // en el archivo de contabilidad. Los tres renglones de adentro sí pasan a
    // Facturación: nombran el monto por sí solos.
    ["Ingresos (MN)","","","",""],
    ["FACTURACIÓN","","","","",...mIngresos],
    ["Facturación Total (MN)","","","","",...mIngresos],
    ["Facturación Total (MN) IVA","","","","",...mIngresosIVA],
    [""],
    ["Egresos (MX)","","","",""],
    ["OPEX","","","","",...mOpex],
    ["CAPEX","","","","",...mCapex],
    [""],
    ["Egresos Totales (MN)","","","","",...mEgresos],
    ["Egresos Totales (MN) IVA","","","","",...mEgresosIVA],
    [""],
    ["FLUJO EFECTIVO","","","","",...mFlujo],
    ["FLUJO EFECTIVO IVA","","","","",...mFlujoIVA],
    [""],
    ["FLUJO ACUMULADO","","","","",...mFlujoAcum],
    ["FLUJO ACUMULADO IVA","","","","",...mFlujoAcumIVA],
    [""],
    ["OPEX Promedio",(totalOPEX/NUM_MESES_OP).toFixed(2)],
  ];
  const wsF=XLSX.utils.aoa_to_sheet(rowsF);
  wsF["!cols"]=[{wch:26},{wch:8},{wch:8},{wch:8},...Array(NMESES).fill({wch:14})];
  applyMoneyFmt(wsF, 3, 4, rowsF.length-1, 4+NMESES);
  // Header principal oscuro
  for(let c=0;c<4+NMESES;c++){
    const a=XLSX.utils.encode_cell({r:0,c});
    if(wsF[a]) wsF[a].s={font:{bold:true,color:{rgb:"DDAC00"}},fill:{fgColor:{rgb:"1a1a1a"}}};
  }
  // Filas FLUJO EFECTIVO y ACUMULADO (sin y con IVA) en color
  [14,15,17,18].forEach(ri=>{
    for(let c=0;c<4+NMESES;c++){
      const a=XLSX.utils.encode_cell({r:ri,c});
      if(wsF[a]) wsF[a].s={font:{bold:true,color:{rgb:"7c3aed"}},fill:{fgColor:{rgb:"F5F3FF"}}};
    }
  });
  if(!soloRubro) XLSX.utils.book_append_sheet(wb,wsF,"FLUJO");

  // ── Hoja 3: EGRESOS detallado ─────────────────────────────────────────────
  const hdrE=["#","Categoría","Descripción","Unidad","Cantidad","Monto Unit.","Total","Tipo"];
  const rowsE=[hdrE];
  let row=1;
  // CAPEX por área
  areas.forEach(id=>{
    const aLabel=id.toUpperCase();
    (costos[id]?.capex||[]).forEach(p=>{
      rowsE.push([row++,p.cat,p.desc,p.unidad,p.cantidad,p.monto,(p.cantidad||0)*(p.monto||0),"CAPEX"]);
    });
  });
  // OPEX por área
  areas.forEach(id=>{
    (costos[id]?.nomina||[]).forEach(p=>{
      const f=1+(p.imss??0.32)+(p.prestaciones??0.40)+(p.isr??0.05);
      const costo=(p.salario||0)*f*(p.cantidad||1);
      rowsE.push([row++,"NOMINA Y ADICIONALES",p.puesto||"Puesto","Mes",p.cantidad||1,p.salario||0,costo,"OPEX-NOM"]);
    });
    ["mat","via"].forEach(c=>{
      (costos[id]?.[c]||[]).forEach(p=>{
        rowsE.push([row++,p.cat,p.desc,p.unidad,p.cantidad,p.monto,(p.cantidad||0)*(p.monto||0),c==="mat"?"OPEX-MAT":"OPEX-VIA"]);
      });
    });
  });
  rowsE.push(["","","","","","TOTAL CAPEX",totalCAPEX,""]);
  rowsE.push(["","","","","","TOTAL OPEX",totalOPEX,""]);
  rowsE.push(["","","","","","TOTAL EGRESOS",totalEgr,""]);
  const wsE=XLSX.utils.aoa_to_sheet(rowsE);
  wsE["!cols"]=[{wch:5},{wch:30},{wch:38},{wch:10},{wch:10},{wch:16},{wch:16},{wch:12}];
  // Formato moneda en columnas Monto Unit. (col 5), Total (col 6)
  applyMoneyFmt(wsE, 1, 5, rowsE.length-1, 6);
  // Header row
  for(let c=0;c<8;c++){
    const a=XLSX.utils.encode_cell({r:0,c});
    if(wsE[a]) wsE[a].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1a1a1a"}},alignment:{horizontal:"center"}};
  }
  // Filas totales al final en negrita
  [rowsE.length-3,rowsE.length-2,rowsE.length-1].forEach(ri=>{
    for(let c=0;c<8;c++){
      const a=XLSX.utils.encode_cell({r:ri,c});
      if(wsE[a]) wsE[a].s={font:{bold:true,color:{rgb:"B08900"}},fill:{fgColor:{rgb:"FFF8E1"}}};
    }
  });
  // Filas alternadas CAPEX/OPEX con color de tipo
  for(let ri=1;ri<rowsE.length-3;ri++){
    const tipoCell=wsE[XLSX.utils.encode_cell({r:ri,c:7})];
    if(tipoCell){
      const bg=tipoCell.v==="CAPEX"?"FFF8E1":tipoCell.v?.includes("NOM")?"F0FDF4":"F0F9FF";
      for(let c=0;c<8;c++){
        const a=XLSX.utils.encode_cell({r:ri,c});
        if(wsE[a]&&!wsE[a].s) wsE[a].s={fill:{fgColor:{rgb:bg}}};
      }
    }
  }
  if(!soloRubro) XLSX.utils.book_append_sheet(wb,wsE,"EGRESOS");

  // ── Hoja 4: INFO ──────────────────────────────────────────────────────────
  const wsI=XLSX.utils.aoa_to_sheet([
    ["GEOLIS SA DE CV — Módulo de Presupuestos"],
    ["Presupuesto:",pres?.nombre||""],
    ["Tipo:",pres?.tipo||""],
    ["Empresa:",pres?.empresa||"GEOLIS SA DE CV"],
    ["Fecha elaboración:",pres?.fechaElaboracion||""],
    ["Fecha inicio:",pres?.fechaInicio||""],
    ["Fecha fin:",pres?.fechaFin||""],
    ["Generado:",new Date().toLocaleDateString("es-MX",{year:"numeric",month:"long",day:"numeric"})],
    [""],
    ["RESUMEN FINANCIERO"],
    ["Facturación total:",totalIngresosAnual],
    ["CAPEX total:",totalCAPEX],
    ["OPEX total:",totalOPEX],
    ["Total egresos:",totalEgr],
    ["Utilidad:",totalIngresosAnual-totalEgr],
    ["Margen %:",totalIngresosAnual>0?((totalIngresosAnual-totalEgr)/totalIngresosAnual*100).toFixed(2)+"%":"N/A"],
  ]);
  wsI["!cols"]=[{wch:24},{wch:30}];
  applyMoneyFmt(wsI, 10, 1, 16, 1);
  // Título grande
  const t=wsI["A1"]; if(t) t.s={font:{bold:true,sz:14,color:{rgb:"B08900"}}};
  // Labels en negrita
  for(let r=1;r<17;r++){
    const a=XLSX.utils.encode_cell({r,c:0});
    if(wsI[a]) wsI[a].s={font:{bold:true}};
  }
  XLSX.utils.book_append_sheet(wb,wsI,"INFO");

  // Guardar
  // El nombre distingue los dos archivos, para que no se pisen en Descargas.
  const sufijo = soloRubro ? "Apps" : "Visual";
  const fileName=`Presupuesto_${(pres?.nombre||"GEOLIS").replace(/\s+/g,"_")}_${sufijo}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb,fileName);
}

// ─── TABLA SERVICIO ───────────────────────────────────────────────────────────
// Spec "Separar captura y visualización" (día 2). Recibe `filas` ya armadas
// por construirFilasServicio — no calcula nada, solo pinta. No reemplaza a
// TablaM, que sigue sirviendo a la tabla FLUJO de Resumen mensual.
function TablaServicio({filas, MESES13, MESES13_MES}){
  const [expandidos, setExpandidos] = useState({});

  // Un subtotal "tiene detalle" si algún renglón de detalle comparte su macro —
  // eso es lo único que decide si lleva ▶/▼ (los casos esUnaSolaIgualAMacro no
  // generan subtotal propio, así que nunca entran aquí).
  const macrosConSubtotal = new Set(filas.filter(f=>f.tipo==="subtotal").map(f=>f.macro));

  const ESTILO_TIPO = {
    seccion:  {bg:C.grayDark,    color:C.white,   bold:800},
    detalle:  {bg:null,          color:C.grayMid, bold:400},
    subtotal: {bg:C.yellowLight, color:C.grayDark,bold:800},
    total:    {bg:C.dangerLight, color:C.danger,  bold:800},
  };

  return (
    <ScrollHint>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:900}}>
        <thead>
          <tr style={{background:C.grayDark}}>
            <td style={{padding:"8px 14px",fontWeight:700,color:C.white,minWidth:220,position:"sticky",left:0,background:C.grayDark}}>Descripción</td>
            <td style={{padding:"7px 12px",textAlign:"right",fontWeight:700,color:C.white,minWidth:110}}>Total Presupuestado</td>
            {MESES13.map((m,i)=>(
              <td key={i} style={{padding:"5px 4px",textAlign:"right",minWidth:62}}>
                <div style={{fontSize:9,fontWeight:600,opacity:0.6,color:"#aaa"}}>{m}</div>
                <div style={{fontSize:11,fontWeight:700,color:C.white}}>{MESES13_MES[i]}</div>
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f,fi)=>{
            // Detalle oculto por defecto bajo su subtotal, hasta que se expanda
            if(f.tipo==="detalle" && f.macro && macrosConSubtotal.has(f.macro) && !expandidos[f.macro]) return null;

            const puedeExpandir = f.tipo==="subtotal" && macrosConSubtotal.has(f.macro)
              && filas.some(o=>o.tipo==="detalle"&&o.macro===f.macro);
            const st = ESTILO_TIPO[f.tipo];
            const bg = f.tipo==="detalle" ? (fi%2===0?C.white:"#FAFAFA") : st.bg;

            return (
              <tr key={fi} style={{background:bg, borderBottom:`1px solid ${C.line}`,
                borderTop:f.tipo==="total"?`2px solid ${C.danger}`:undefined}}>
                <td style={{padding:"7px 14px", paddingLeft:f.tipo==="detalle"?32:14,
                  position:"sticky", left:0, background:bg,
                  fontWeight:st.bold, fontStyle:f.tipo==="detalle"?"italic":"normal",
                  color:st.color, textTransform:f.tipo==="seccion"?"uppercase":"none",
                  display:"flex", alignItems:"center", gap:8}}>
                  {puedeExpandir&&(
                    <span onClick={()=>setExpandidos(prev=>({...prev,[f.macro]:!prev[f.macro]}))}
                      style={{cursor:"pointer",fontSize:9,width:10,flexShrink:0,userSelect:"none",color:st.color}}>
                      {expandidos[f.macro]?"▼":"▶"}
                    </span>
                  )}
                  <span>{f.label}</span>
                </td>
                <td style={{padding:"7px 12px",textAlign:"right",fontWeight:st.bold,color:st.color}}>
                  {f.total===""?"":fmtK(f.total)}
                </td>
                {f.mensual.map((v,i)=>(
                  <td key={i} style={{padding:"7px 4px",textAlign:"right",fontWeight:st.bold,
                    color:v===""?st.color:(v!==0?st.color:C.grayBorder)}}>
                    {v===""?"":(v!==0?fmtK(v):"—")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollHint>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
// ═══ Bloques de Información general extraídos a componentes ═══
// Tarea 8, paso 1 de 3 (03-sep-2026). Refactor PURO: la app se ve exactamente
// igual que antes. El paso 2 (renderizarlos también en Resumen mensual) y el
// paso 3 (mover el botón Ver y ocultar la pestaña) NO se hicieron aquí.
// Regla de los cuatro: reciben resultados por props y los pintan. Cero
// aritmética adentro — si alguna operación se cuela aquí, el bloque dejó de
// ser presentación y hay que devolverla a App.

// ── Tarea 8, paso 1 (03-sep-2026) — extraído de Información general TAL CUAL.
// NO CALCULA NADA: los seis números llegan ya calculados por props; aquí solo se
// pintan. Se extrae para poder renderizarlo también en Resumen mensual (paso 2)
// sin duplicar JSX ni tocar una línea de cálculo.
function KPIsPresupuesto({totalIngresosAnual, totalCAPEX, totalOPEX, totalEgr, utilidad, margen}){
  return(
    <>
          {/* ── Los cinco KPIs del presupuesto completo — mismo bloque que Step 4 ── */}
          <div className="resumen-kpi" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
            {[
              {l:"Facturación",v:totalIngresosAnual,c:C.success,   b:C.successLight},
              {l:"CAPEX",       v:totalCAPEX,        c:C.yellowDark,b:C.yellowLight},
              {l:"OPEX",        v:totalOPEX,         c:"#374151",   b:C.grayLight},
              {l:"Total egresos",v:totalEgr,          c:C.danger,    b:C.dangerLight},
              /* Bug conocido corregido — con ingresos en cero, margen=utilidad/0 no es
                     "0.0%", es indefinido: se muestra "—" en vez de fingir un resultado.
                     Solo cambia la presentación; la fórmula de margen no se toca. */
              {l:"Utilidad y margen",v:utilidad,badge:totalIngresosAnual===0?"—":`${margen.toFixed(1)}%`,
                c:utilidad>=0?C.success:C.danger,b:utilidad>=0?C.successLight:C.dangerLight},
            ].map(k=>(
              <div key={k.l} style={{background:k.b,border:`1px solid ${k.c}22`,
                borderRadius:10,padding:"14px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <div style={{fontSize:10,fontWeight:700,color:k.c,textTransform:"uppercase",letterSpacing:0.5}}>{k.l}</div>
                  {k.badge&&<div style={{fontSize:11,fontWeight:800,color:k.c}}>{k.badge}</div>}
                </div>
                <div style={{fontSize:19,fontWeight:800,color:k.c,marginTop:7}}>{fmt(k.v)}</div>
              </div>
            ))}
          </div>
    </>
  );
}

// ── Tarea 8, paso 1 — la tabla contable CAPEX y OPEX, agrupada por rubro.
// NO CALCULA NADA: `filas` llega ya armada por construirFilasServicio, que no se
// toca. Es la tabla que la contadora Anel aprobó como prueba de que SERVICIOS
// sale como rubro propio: si desaparece, se pierde esa evidencia.
function TablaContableCard({filas, MESES13, MESES13_MES}){
  return(
    <>
          {/* ── TablaServicio — el centro de la pantalla (día 2 + día 3) ── */}
          <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
            padding:24,marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:18,background:C.yellow,borderRadius:2}}/>
                <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.grayDark}}>CAPEX y OPEX</h3>
              </div>
              <div style={{fontSize:11,color:C.grayMid,marginTop:4,marginLeft:13}}>
                Detalle por categoría, agrupado por categoría contable — haz clic en un subtotal para expandir
              </div>
            </div>
            <TablaServicio filas={filas} MESES13={MESES13} MESES13_MES={MESES13_MES}/>
          </div>
    </>
  );
}

// ── Tarea 8, paso 1 — las cajas por departamento (Operaciones, Construcción...).
// NO CALCULA NADA: cada área llega en areasDetalle con sus totales ya sumados
// (capexA, opexA, totalArea, nomAnual, opexMat, opexVia) y con esUltima ya
// resuelto. Las sumas siguen viviendo en App, donde estaban.
// Los handlers se reciben por props aunque la vista sea readOnly: así el bloque
// queda idéntico al que había, sin decidir aquí que nunca se van a usar.
function DetallePorArea({areasDetalle, pres, numMesesProyecto, upP, rmP, addP, rmN, addN}){
  return(
    <>
          {/* ── Detalle por área, en texto plano (recuperado — el cliente pidió cambiar
              el mecanismo de edición, no borrar esta consulta). Solo lectura: SCard,
              PartidaTable y NominaTable con readOnly={true} — sin inputs, sin agregar/
              quitar fila, sin botón Guardar. Editar de verdad se hace en Capturar
              costos (Step 3). ── */}
          {areasDetalle.length===0?(
            <div style={{padding:"60px 40px",textAlign:"center",color:C.grayMid,
              background:C.white,borderRadius:10,border:`1px solid ${C.grayBorder}`,marginBottom:20}}>
              Aún no hay áreas capturadas en este presupuesto.
            </div>
          ):areasDetalle.map(({id,esUltima,datos,areaInfo,capexA,nomMes,opexA,totalArea,nomAnual,opexMat,opexVia})=>{
            return(
              <div key={id} style={{marginBottom:!esUltima?36:20,
                paddingBottom:!esUltima?28:0,
                borderBottom:!esUltima?`2px solid ${C.line}`:"none"}}>

                <AreaColapsable
                  encabezado={<>
                    <span style={{fontSize:24}}>{areaInfo?.icon}</span>
                    <div>
                      <h3 style={{margin:0,fontSize:18,fontWeight:800,color:C.grayDark}}>{areaInfo?.label}</h3>
                      <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>{pres?.nombre}</div>
                    </div>
                  </>}
                  derecha={<Badge label={datos?.estado==="guardado"?"✓ Guardado":"En captura"}
                    color={datos?.estado==="guardado"?C.success:C.yellowDark}
                    bg={datos?.estado==="guardado"?C.successLight:C.yellowLight}/>}>

                <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:26}}>
                  {[
                    {l:"CAPEX del área",  v:capexA, c:"#7c3aed",bg:"#faf5ff"},
                    {l:"OPEX del área",   v:opexA,  c:"#0891b2",bg:"#f0f9ff"},
                    {l:"Total",           v:totalArea,c:C.grayDark,bg:C.grayLight},
                  ].map(k=>(
                    <div key={k.l} style={{background:k.bg,border:`1px solid ${k.c}18`,
                      borderRadius:10,padding:"16px 18px"}}>
                      <div style={{fontSize:10.5,fontWeight:700,color:k.c,
                        textTransform:"uppercase",letterSpacing:0.3}}>{k.l}</div>
                      <div style={{fontSize:19,fontWeight:800,color:k.c,marginTop:6}}>{fmt(k.v)}</div>
                    </div>
                  ))}
                </div>

                <SCard title="CAPEX · Equipos e inversiones" icon="🔧"
                  subtitle="Inversiones únicas: maquinaria, equipos, activos"
                  total={capexA} accentColor="#7c3aed">
                  <PartidaTable
                    partidas={datos?.capex||[]}
                    onUpdate={u=>upP(id,"capex",u.id,u)}
                    onRemove={rmP(id,"capex")}
                    onAdd={()=>addP(id,"capex")}
                    catOptions={CAT_CAPEX}
                    addLabel="Agregar equipo / inversión"
                    headerColor="#7c3aed"
                    showMes={true} fechaInicioProyecto={pres?.fechaInicio} fechaFinProyecto={pres?.fechaFin}
                    readOnly={true}/>
                </SCard>

                <SCard title="OPEX · Nómina y Mano de Obra" icon="👥"
                  subtitle="Costo real por puesto incluyendo cargas sociales"
                  total={nomAnual} accentColor="#059669">
                  <NominaTable
                    nomina={datos?.nomina||[]}
                    onUpdate={u=>upP(id,"nomina",u.id,u)}
                    onRemove={rmN(id)}
                    onAdd={()=>addN(id)}
                    readOnly={true}
                    numMesesProyecto={numMesesProyecto}/>
                  {nomMes>0&&<div style={{marginTop:10,fontSize:11,color:C.grayMid,textAlign:"right"}}>
                    Costo anual nómina: <strong style={{color:"#059669"}}>{fmt(nomAnual)}</strong>
                  </div>}
                </SCard>

                <SCard title="OPEX · Materiales" icon="📦"
                  subtitle="Materiales e insumos recurrentes — Unidad = naturaleza del bien (Servicio, Pieza...) · Periodicidad = cada cuánto se repite"
                  total={opexMat} accentColor="#0891b2">
                  <PartidaTable
                    partidas={datos?.mat||[]}
                    onUpdate={u=>upP(id,"mat",u.id,u)}
                    onRemove={rmP(id,"mat")}
                    onAdd={()=>addP(id,"mat")}
                    catOptions={CAT_OPEX_MAT}
                    addLabel="Agregar material"
                    headerColor="#0891b2"
                    showPeriod={true} fechaInicioProyecto={pres?.fechaInicio} fechaFinProyecto={pres?.fechaFin} numMesesOpProyecto={numMesesProyecto}
                    mostrarFechaReal={true} readOnly={true}/>
                </SCard>

                <SCard title="OPEX · Viáticos" icon="🧳"
                  subtitle="Viáticos, hospedaje y gastos de campo · Unidad = Día o Viaje · Periodicidad = con qué frecuencia"
                  total={opexVia} accentColor="#d97706">
                  <PartidaTable
                    partidas={datos?.via||[]}
                    onUpdate={u=>upP(id,"via",u.id,u)}
                    onRemove={rmP(id,"via")}
                    onAdd={()=>addP(id,"via")}
                    catOptions={CAT_OPEX_VIA}
                    addLabel="Agregar viático"
                    headerColor="#d97706"
                    showPeriod={true} fechaInicioProyecto={pres?.fechaInicio} fechaFinProyecto={pres?.fechaFin} numMesesOpProyecto={numMesesProyecto}
                    mostrarFechaReal={true} readOnly={true}/>
                </SCard>
                </AreaColapsable>
              </div>
            );
          })}
    </>
  );
}

// ── Tarea 8, paso 1 — las dos gráficas (flujo de efectivo y OPEX por categoría).
// NO CALCULA NADA: las series llegan ya construidas por calcularSerieMensual.
function GraficasPresupuesto({mFlujo, mFlujoAcum, MESES13_MES, catOpexSeries}){
  return(
    <>
          {/* ── Gráfica: flujo de efectivo ── */}
          <div className="chart-card" style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
            padding:24,marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:18,background:C.yellow,borderRadius:2}}/>
                <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.grayDark}}>Flujo de efectivo</h3>
              </div>
              <div style={{fontSize:11,color:C.grayMid,marginTop:4,marginLeft:13}}>
                Barras: flujo mensual (amarillo=positivo, rojo=negativo) · Línea: flujo acumulado
              </div>
            </div>
            <div style={{display:"flex",gap:20,marginBottom:12}}>
              {[
                {label:"Flujo mensual positivo",color:C.yellow},
                {label:"Flujo mensual negativo",color:C.danger},
                {label:"Flujo acumulado",       color:"#374151"},
              ].map(s=>(
                <div key={s.label} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:14,height:14,borderRadius:3,background:s.color}}/>
                  <span style={{fontSize:11,color:C.grayMid,fontWeight:600}}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={{overflowX:"auto",overflowY:"hidden"}}><FlowChart barData={mFlujo} lineData={mFlujoAcum} height={240} meses={MESES13_MES}/></div>
          </div>

          {/* ── Gráfica: OPEX por categoría ── */}
          <div className="chart-card" style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
            padding:24,marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:3,height:18,background:C.yellow,borderRadius:2}}/>
                <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.grayDark}}>OPEX por categoría</h3>
              </div>
              <div style={{fontSize:11,color:C.grayMid,marginTop:4,marginLeft:13}}>
                Líneas por categoría contable mes a mes
              </div>
            </div>
            {catOpexSeries.length>0?(
              <>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12}}>
                  {catOpexSeries.map(s=>(
                    <div key={s.label} style={{display:"flex",alignItems:"center",gap:5}}>
                      <div style={{width:12,height:12,borderRadius:2,background:s.color}}/>
                      <span style={{fontSize:10,color:C.grayMid}}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{overflowX:"auto",overflowY:"hidden"}}><CatLinesChart series={catOpexSeries} height={240} meses={MESES13_MES}/></div>
              </>
            ):<div style={{padding:20,color:C.grayMid,fontSize:13,textAlign:"center"}}>Captura partidas OPEX en las áreas para ver esta gráfica.</div>}
          </div>
    </>
  );
}

export default function App(){
  const [step,setStep]         = useState(0);
  const [pres,setPres]         = useState(null);   // presupuesto activo
  const [areas,setAreas]       = useState([]);
  const [costos,setCostos]     = useState({});
  const [areaActiva,setActiva] = useState(null);
  const [capexPM,setCapexPM]   = useState([]);
  const [opexPM,setOpexPM]     = useState([]);
  // Fase 1 (corrección) — cascarones sin _costos que ensuciaban la lista;
  // listarPresupuestos() y la lógica de mezcla en el useEffect de montaje
  // siguen exactamente iguales.
  const [lista,setLista]       = useState([]);
  const [form,setForm]         = useState({nombre:"",tipo:"",empresa:"GEOLIS SA DE CV",unidadNegocio:"",fechaInicio:"",fechaFin:"",fechaElaboracion:new Date().toISOString().slice(0,10)});
  const [plantModal,setPlantModal] = useState(false);
  // Diálogo de Clonar (spec navegación-retro-410, punto 8) — presupuesto de
  // origen y tipo elegido, solo mientras el diálogo está abierto.
  const [clonarModal,setClonarModal] = useState(null);
  const [clonarTipo,setClonarTipo]   = useState(null);
  const [plantKey,setPlantKey]     = useState(null);
  // "Partir de un presupuesto anterior" — lista real de Supabase (solo lectura)
  const [presupuestosGuardados,setPresupuestosGuardados] = useState([]);
  const [cargandoGuardados,setCargandoGuardados]         = useState(false);
  const [origenReal,setOrigenReal]                       = useState(null); // {nombre,capex,opex}
  // Punto 8 spec-navegación-retro-410 — corrección posterior: al entrar a Step 1
  // desde Clonar, el origen YA está decidido (no tiene sentido el bloque "¿Cómo
  // quieres iniciar?" con sus dos tarjetas). Distingue ese caso del flujo normal
  // de "+ Nuevo presupuesto", donde ese bloque sigue teniendo sentido.
  const [viaClonar,setViaClonar]   = useState(false);
  const [modoEdit,setModoEdit]     = useState(false);
  // Spec navegación-retro-410 punto 7 — distingue "presupuesto nuevo, en el
  // flujo de creación" (Captura de información) de "presupuesto existente"
  // (Editar — [nombre]) para el título de Capturar costos.
  const [flujoCreacion,setFlujoCreacion] = useState(false);
  // Desbloqueo del acceso al Resumen mensual desde Capturar costos (02-sep-2026).
  // Se prende cuando guardarTodo confirma un guardado EXITOSO y ya no se vuelve a
  // apagar mientras se trabaja ese presupuesto: un botón que prende y apaga a cada
  // tecla es peor que uno siempre apagado. Solo se reinicia al empezar OTRO
  // presupuesto (abrirNuevo/clonarPresupuesto), que son los dos únicos puntos que
  // ponen flujoCreacion en true.
  //
  // Deliberadamente NO se persiste: al volver a entrar por Ver, Editar o la miga
  // de pan, esas tres rutas ya ponen flujoCreacion en false y los botones salen
  // habilitados de todos modos. Una columna en Supabase no cambiaría nada de lo
  // que el usuario ve.
  const [resumenDesbloqueado,setResumenDesbloqueado] = useState(false);
  // ¿El usuario ya eligió Unidad de negocio a mano en ESTE presupuesto?
  // Gobierna el autollenado de G18ADMIN al elegir tipo Departamento
  // (02-sep-2026): mientras sea false el tipo puede poner y quitar la unidad;
  // en cuanto el usuario elige una, deja de tocarse — su elección manda aunque
  // después cambie el tipo. Se reinicia al empezar otro presupuesto.
  const [unidadTocada,setUnidadTocada] = useState(false);
  // Candado de guardado (Opción A) — true desde que guardarTodo dispara
  // guardarPresupuestoEnNube hasta que resuelve o falla; el único botón
  // "Guardar" de Capturar costos se deshabilita mientras esté en true. Antes
  // protegía contra el solapamiento de DOS botones (área e Ingresos) que
  // hacían llamadas independientes — con la fusión de hoy en un solo botón
  // (guardarTodo) ya no hay un segundo botón con el que solaparse, pero se
  // deja por si en el futuro se agrega otro punto de guardado en esta
  // pantalla. No toca clonarPresupuesto/abrirNuevo/flujos de creación.
  const [guardando,setGuardando] = useState(false);
  const [intentoGuardar,setIntentoGuardar] = useState(false); // true tras un intento fallido de Continuar/Guardar — recién ahí se muestran los avisos de campos faltantes
  const [toast,setToast]           = useState(null);
  const [areaSaved,setAreaSaved]   = useState(false); // al menos un área guardada
  // Estado para abrir presupuesto después del render (evita race condition)
  const [presToOpen, setPresToOpen] = useState(null);
  const isOpening = useRef(false); // flag: no guardar en localStorage mientras se abre
  // Ingresos mes a mes (13 meses: M0..M12)
  const [ingresos,setIngresos]     = useState(Array(13).fill(0));
  const [precioFijo,setPrecioFijo]  = useState(0);   // precio mensual fijo del servicio
  const [ingAdicionales,setIngAd]   = useState([]);  // [{id,mes,anio,monto,desc}]
  // Filas expandibles (CAPEX/OPEX) en la Tabla SERVICIO del Resumen mensual
  const [expandidosServicio,setExpandidosServicio] = useState({});

  // ── PUNTO 5: Persistir estado en localStorage ─────────────────────────────
  // Restaurar al montar
  useEffect(()=>{
    const saved=loadAppState();
    if(saved&&saved.pres){
      // Solo restaurar la lista de presupuestos al inicio, no el step activo
      // El usuario debe abrir manualmente para ver el contenido
      setLista(prev=>{
        const ids=prev.map(x=>x.id);
        const extra=(saved.lista||[]).filter(x=>!ids.includes(x.id));
        return [...prev,...extra];
      });
      // No restaurar step ni estado activo — evita conflictos con abrirPresupuesto
    }
    // Presupuestos guardados en Supabase (fuente de verdad cuando está configurado)
    if(supabase){
      listarPresupuestos().then(remotos=>{
        if(remotos.length===0) return;
        setLista(prev=>{
          const idsRemotos=remotos.map(x=>x.id);
          const soloLocales=prev.filter(x=>!idsRemotos.includes(x.id));
          return [...remotos,...soloLocales];
        });
      });
    }
  },[]);

  // PDF — F1 (Fernando): document.title dinámico al nombre del presupuesto en
  // Resumen mensual/Información general, para que el título que imprime el
  // navegador (si el usuario deja "Encabezados y pies de página" activado) diga
  // de cuál presupuesto es, no el genérico de index.html. La función de limpieza
  // de useEffect restaura el título anterior exacto al salir de Step 4/5 (o si
  // cambia de presupuesto/step), sin necesidad de guardar el original aparte.
  useEffect(()=>{
    // Tarea 8 paso 3 — Step 5 (Información general) queda oculto, así que la
    // condición se reduce a la vista Ver.
    if(step===4 && pres?.nombre){
      const original=document.title;
      // "Resumen", igual que el último eslabón de la miga. No lo pediste
      // explícitamente: se alinea porque este título es el que imprime el
      // navegador en el encabezado del PDF, y decir "— Ver" ahí quedaba
      // descolgado de lo que muestra la pantalla. Si lo prefieres de otra
      // forma, es esta línea.
      document.title=`${pres.nombre} — Resumen`;
      return ()=>{ document.title=original; };
    }
  },[step,pres?.nombre]);

  // "Partir de un presupuesto anterior" — al abrir el modal, consultar Supabase (SOLO LECTURA)
  // No modifica el flujo existente de PLANTILLAS (Cuervito/TI), que sigue igual más abajo.
  useEffect(()=>{
    // También dispara con viaClonar=true — el select de origen del flujo de
    // Clonar (Step 1) necesita la misma lista, sin duplicar la consulta.
    if(!(plantModal||viaClonar) || !supabase) return;
    setCargandoGuardados(true);
    console.log("[partir-de] Consultando presupuestos guardados en Supabase (solo lectura)...");
    listarPresupuestos().then(lista=>{
      console.log(`[partir-de] ${lista.length} presupuesto(s) encontrados en Supabase.`);
      setPresupuestosGuardados(lista);
      setCargandoGuardados(false);
    }).catch(err=>{
      console.error("[partir-de] Error consultando Supabase:", err);
      setCargandoGuardados(false);
    });
  },[plantModal,viaClonar]);
  // FIX 6 v3: procesar apertura de presupuesto en useEffect separado
  // Esto garantiza que todos los setState se aplicaron antes de setActiva
  useEffect(()=>{
    if(!presToOpen) return;
    const p = presToOpen;
    const areasP    = p._areas||[];
    const costosP   = p._costos||{};
    const capexPMP  = p._capexPM||[];
    const opexPMP   = p._opexPM||[];
    const ingresosP = p._ingresos||Array(13).fill(0);
    const precioFijoP = p._precioFijo||0;
    const ingAdicionalesP = p._ingAdicionales||[];
    const saved     = areasP.some(id=>costosP[id]?.estado==="guardado");
    const primera   = areasP.find(id=>{
      const c=costosP[id];
      return c&&(c.capex?.length>0||c.mat?.length>0||c.nomina?.length>0||c.via?.length>0);
    })||areasP[0]||null;
    // Aplicar todo el estado de una vez
    setPres(p);
    setAreas(areasP);
    setCostos(costosP);
    setCapexPM(capexPMP);
    setOpexPM(opexPMP);
    setIngresos(ingresosP);
    setPrecioFijo(precioFijoP);
    setIngAd(ingAdicionalesP);
    setAreaSaved(saved);
    setActiva(primera);
    setFlujoCreacion(false);
    setViaClonar(false);
    // Tarea 8 paso 3 (03-sep-2026, confirmado por Luis en audio: "cuando entre
    // usted en Ver pues lo lleva directo... ya directo... por la navegación va").
    // El botón "Ver" del listado aterriza DIRECTO en la vista Ver (Step 4), que
    // desde el paso 2 ya trae los KPIs, la tabla contable por rubro, las cajas
    // por departamento y las gráficas. Antes aterrizaba en Información general
    // (Step 5), que a partir de hoy queda oculta.
    setStep(4);
    setPresToOpen(null); // limpiar para no re-ejecutar
    // Pequeño delay para que React termine el render antes de reanudar guardado
    setTimeout(()=>{ isOpening.current = false; }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[presToOpen]);

  // Guardar ante cualquier cambio relevante (no guardar mientras se abre)
  useEffect(()=>{
    if(pres && !isOpening.current) saveAppState({pres,areas,costos,capexPM,opexPM,lista,areaSaved,step,ingresos,precioFijo,ingAdicionales});
  },[pres,areas,costos,capexPM,opexPM,areaSaved,step,ingresos]);

  function showToast(msg){setToast(msg);}

  // ── Totales ─────────────────────────────────────────────────────────────────
  // Nota: totalCat/totalNom son sumas "por ocurrencia" (útiles como vista rápida durante
  // la captura). El total ANUAL real que respeta periodicidad/tipo de personal vive en
  // totalOpexAnualCat/totalNomAnual, y es el que alimenta el Resumen mensual (Step 4).
  function totalCat(id,cat){return(costos[id]?.[cat]||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);}
  function totalNom(id){return(costos[id]?.nomina||[]).reduce((s,p)=>{const f=1+(p.imss??F_IMSS)+(p.prestaciones??F_PREST)+(p.isr??F_ISR);return s+(p.salario||0)*f*(p.cantidad||1);},0);}
  // Duración real del proyecto (no siempre 12 meses) — mismo criterio que usa
  // el Resumen mensual (calcularNumMesesOp), para que el total que se ve en
  // Captura de costos no quede duplicado/recortado en proyectos != 12 meses.
  function totalOpexAnualCat(id,cat){const n=calcularNumMesesOp(pres?.fechaInicio,pres?.fechaFin);return(costos[id]?.[cat]||[]).reduce((s,p)=>s+totalOpexPartida(p,n),0);}
  function totalNomAnual(id){const n=calcularNumMesesOp(pres?.fechaInicio,pres?.fechaFin);return(costos[id]?.nomina||[]).reduce((s,p)=>s+costoTotalNomina(p,n),0);}
  const capexAreas=areas.reduce((s,id)=>s+totalCat(id,"capex"),0);
  const opexAreas =areas.reduce((s,id)=>s+totalOpexAnualCat(id,"mat")+totalNomAnual(id)+totalOpexAnualCat(id,"via"),0);
  const capexPMt  =capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const opexPMt   =opexPM.reduce((s,p)=>s+totalOpexPartida(p,12),0);
  const totalCAPEX=capexAreas+capexPMt;
  const totalOPEX =opexAreas +opexPMt;
  const totalEgr  =totalCAPEX+totalOPEX;

  // ── Acciones ────────────────────────────────────────────────────────────────
  function abrirNuevo(){
    // Año por omisión = AÑO ACTUAL + 1 (ver fechasDeAnio). Antes las dos fechas
    // arrancaban vacías y había que teclearlas; ahora vienen rellenas con el
    // ejercicio siguiente completo y siguen siendo editables en el formulario.
    const {fechaInicio,fechaFin}=fechasDeAnio(new Date().getFullYear()+1);
    setForm({nombre:"",tipo:"",empresa:"GEOLIS SA DE CV",unidadNegocio:"",fechaInicio,fechaFin,
      fechaElaboracion:new Date().toISOString().slice(0,10)});
    setAreas([]); setCostos({}); setCapexPM([]); setOpexPM([]); setIngresos(Array(13).fill(0)); setPrecioFijo(0); setIngAd([]);
    setPlantKey(null); setOrigenReal(null); setViaClonar(false); setPres(null); setModoEdit(false); setAreaSaved(false);
    setIntentoGuardar(false);
    setFlujoCreacion(true);
    setResumenDesbloqueado(false); // presupuesto nuevo: todavía no hay nada guardado
    setUnidadTocada(false);        // nadie ha elegido unidad: el tipo puede autollenarla
    setStep(1);
  }
  // Spec recuperación-datos, paso 2 — p llega ligero (de listarPresupuestos, sin
  // _areas/_costos); cargar siempre la versión completa de la nube antes de abrir
  // el formulario, mismo patrón que abrirPresupuesto. Si la carga falla, no
  // continuar con el objeto ligero (eso fue lo que vació Perdiz y Cuervito el 6
  // de agosto) — avisar y quedarse en el listado.
  async function abrirEdit(p){
    if(supabase && typeof p.id === "string"){
      const remoto = await cargarPresupuestoDeNube(p.id, {uid, initP, initN});
      if(!remoto){
        showToast("No se pudo cargar el presupuesto — revisa tu conexión e intenta de nuevo");
        return;
      }
      p = remoto;
    }
    setForm({nombre:p.nombre,tipo:p.tipo,empresa:p.empresa||"GEOLIS SA DE CV",
      // Los 5 presupuestos anteriores al 02-sep-2026 no tienen unidad: queda "".
      unidadNegocio:p.unidadNegocio||"",
      fechaInicio:p.fechaInicio||"",fechaFin:p.fechaFin||""});
    setAreas(p._areas||[]); setCostos(p._costos||{});
    setCapexPM(p._capexPM||[]); setOpexPM(p._opexPM||[]);
    // Bug confirmado hoy — abrirEdit era la única de las cuatro funciones que
    // cargan un presupuesto completo (junto con el effect de presToOpen,
    // clonarPresupuesto y partirDePresupuestoAnterior) que NO hidrataba
    // ingresos/precioFijo/ingAdicionales: Cuervito mostraba $0.00 en pantalla
    // pese a tener las 12 filas correctas en Supabase. Mismo patrón que esas
    // tres — p ya es remoto en este punto si vino de Supabase.
    setIngresos(p._ingresos||[]);
    setPrecioFijo(p._precioFijo||0);
    setIngAd(p._ingAdicionales||[]);
    setPlantKey(null); setViaClonar(false); setPres(p); setModoEdit(true);
    setAreaSaved((p._areas||[]).some(id=>(p._costos||{})[id]?.estado==="guardado"));
    setIntentoGuardar(false);
    setFlujoCreacion(false);
    // Corrección retro 4:10 — "Editar" del listado lleva a Capturar costos, no a
    // Datos generales: el cliente decía "formulario de edición" señalando la
    // pantalla de captura, no el paso 1. Se usa p._areas (recién cargado), no el
    // estado areas todavía sin actualizar.
    // Antes: `if(!areaActiva) setActiva(...)` — solo asignaba si areaActiva
    // estaba vacío, así que al abrir un presupuesto con "Editar" se conservaba el
    // área activa del presupuesto ANTERIOR de la sesión. Si ese id no existe en
    // el presupuesto que se abre, costos[areaActiva] es undefined: el panel de
    // captura se pinta igual (datos?.capex||[] da []) pero "+ Agregar" truena en
    // silencio, porque addP hace prev[id][cat] sobre ese undefined. Ahora el área
    // activa siempre sale del presupuesto que se está abriendo — mismo criterio
    // que ya usaban confirmarAreas (setActiva(areas[0]||null)) y el effect de
    // presToOpen (setActiva(primera)).
    setActiva((p._areas||[])[0]||null);
    setStep(3);
  }

  // FIX 6 v4: Abrir presupuesto — flag pausa el guardado en localStorage
  // Guardarraíl (spec recuperación-datos) — si la carga de Supabase falla, no
  // continuar con el objeto ligero: mismo criterio que abrirEdit/clonarPresupuesto.
  async function abrirPresupuesto(p){
    isOpening.current = true;
    // Si el presupuesto vive en Supabase (id = UUID), traer siempre la versión más reciente
    if(supabase && typeof p.id === "string"){
      const remoto = await cargarPresupuestoDeNube(p.id, {uid, initP, initN});
      if(!remoto){
        isOpening.current = false;
        showToast("No se pudo cargar el presupuesto — revisa tu conexión e intenta de nuevo");
        return;
      }
      setPresToOpen(remoto);
      return;
    }
    setPresToOpen(p);
  }

  // Eliminar presupuesto — acción destructiva, requiere confirmación explícita
  async function eliminarPresupuesto(p){
    const ok = window.confirm(`¿Eliminar el presupuesto "${p.nombre}" (inicio ${p.fechaInicio})? Se borrarán también todas sus áreas y partidas. Esta acción no se puede deshacer.`);
    if(!ok) return;
    const nuevaLista = lista.filter(x=>x.id!==p.id);
    setLista(nuevaLista);
    const presRestante = pres?.id===p.id ? null : pres;
    if(pres?.id===p.id) setPres(null);
    // Guardar explícito: el autoguardado normal no corre si no hay presupuesto
    // activo (ej. borrando desde la lista sin haber abierto nada) — sin esto,
    // el ítem borrado podría "resucitar" desde localStorage tras un refresh.
    saveAppState({pres:presRestante,areas,costos,capexPM,opexPM,lista:nuevaLista,areaSaved,step,ingresos,precioFijo,ingAdicionales});
    if(supabase && typeof p.id === "string"){
      const res = await eliminarPresupuestoDeNube(p.id);
      if(!res.ok) showToast("No se pudo eliminar de la nube — revisa tu conexión");
      else showToast("Presupuesto eliminado");
    } else {
      showToast("Presupuesto eliminado");
    }
  }

  // PUNTO 9: Clonar presupuesto como base de uno nuevo
  // tipoOverride: spec navegación-retro-410 punto 8 — el diálogo de Clonar deja
  // elegir un tipo distinto al del presupuesto de origen antes de continuar.
  // Spec recuperación-datos, paso 3 — mismo bug y mismo arreglo que abrirEdit
  // (paso 2): p llega ligero del listado, sin _areas/_costos/_capexPM/_opexPM/
  // _ingresos/_precioFijo/_ingAdicionales. Cargar la versión completa de la nube
  // antes de copiar; si falla, no continuar con el objeto ligero.
  async function clonarPresupuesto(p,tipoOverride){
    if(supabase && typeof p.id === "string"){
      const remoto = await cargarPresupuestoDeNube(p.id, {uid, initP, initN});
      if(!remoto){
        showToast("No se pudo cargar el presupuesto de origen — revisa tu conexión e intenta de nuevo");
        return;
      }
      p = remoto;
    }
    const hoy = new Date().toISOString().slice(0,10);
    const tipoFinal = tipoOverride||p.tipo;
    // Punto 8 spec-navegación-retro-410 — "si usted cambia la plantilla a una de
    // departamento, tiene que cambiar sus opciones": las áreas y sus costos están
    // capturados bajo las categorías del tipo de ORIGEN (getAreasCat); si el
    // diálogo de Clonar elige un tipo distinto, esas áreas ya no aplican al nuevo
    // tipo — arrancan vacías (igual que un presupuesto nuevo de ese tipo) en vez
    // de arrastrar partidas de categorías que no existen ahí.
    const mismoTipo = tipoFinal===p.tipo;
    setForm({
      nombre: p.nombre + " (copia)",
      tipo: tipoFinal,
      empresa: p.empresa||"GEOLIS SA DE CV",
      // La copia hereda la unidad del origen y se puede cambiar antes de guardar
      // (el clon pasa por Step 1 con modoEdit en false, o sea con el select
      // habilitado). Un origen sin unidad deja el clon sin unidad: el select sale
      // vacío y "Continuar" lo va a exigir, que es justo lo que se quiere.
      unidadNegocio: p.unidadNegocio||"",
      fechaInicio: p.fechaInicio||hoy,
      fechaFin: p.fechaFin||"",
      fechaElaboracion: hoy,
    });
    // Copiar partidas con nuevos IDs
    setCapexPM((p._capexPM||[]).map(x=>({...x,id:uid()})));
    setOpexPM((p._opexPM||[]).map(x=>({...x,id:uid()})));
    // Copiar costos de áreas con nuevos IDs — solo si el tipo no cambió
    const nuevosCostos={};
    if(mismoTipo){
      (p._areas||[]).forEach(id=>{
        if(p._costos?.[id]){
          const ac=p._costos[id];
          nuevosCostos[id]={
            ...ac,
            capex:(ac.capex||[]).map(x=>({...x,id:uid()})),
            mat:(ac.mat||[]).map(x=>({...x,id:uid()})),
            nomina:(ac.nomina||[]).map(x=>({...x,id:uid()})),
            via:(ac.via||[]).map(x=>({...x,id:uid()})),
            estado:"pendiente",
          };
        }
      });
    }
    setAreas(mismoTipo?(p._areas||[]):[]);
    setCostos(nuevosCostos);
    setIngresos(p._ingresos||Array(13).fill(0));
    setPrecioFijo(p._precioFijo||0);
    setIngAd((p._ingAdicionales||[]).map(x=>({...x,id:uid()})));
    setPres(null); setModoEdit(false);
    setPlantKey(null); setAreaSaved(false);
    setIntentoGuardar(false);
    setFlujoCreacion(true);
    // El origen ya está decidido al clonar (viene del botón "Clonar" del listado,
    // no de elegir entre "Partir de anterior"/"Iniciar desde cero") — Step 1
    // muestra el select de origen en vez de esas dos tarjetas. Si mismoTipo es
    // false, el origen ya no corresponde al tipo elegido: queda sin preseleccionar
    // hasta que el usuario elija uno del tipo nuevo en el select.
    setViaClonar(true);
    setOrigenReal(mismoTipo?{id:p.id,nombre:p.nombre,tipo:p.tipo}:null);
    setResumenDesbloqueado(false); // la copia todavía no se ha guardado
    // La copia hereda la unidad del origen. Si trae una, cuenta como elegida: el
    // tipo no debe pisarla. Si el origen no tenía, queda libre para autollenarse.
    setUnidadTocada(!!p.unidadNegocio);
    setStep(1);
  }

  function guardarPres(){
    // Unidad de negocio obligatoria SOLO al crear (02-sep-2026, pedido de Anel).
    // En modoEdit no se exige: los 5 presupuestos anteriores a esta fecha están
    // en NULL y su select está deshabilitado — exigirla ahí los dejaría sin
    // poder guardarse hasta que se decida cómo se editan (A1 de DECISIONES.md).
    const faltaUnidad = !modoEdit && !form.unidadNegocio;
    const invalido = !form.nombre||!form.tipo||!form.fechaInicio||!form.fechaFin||faltaUnidad;
    if(invalido){ setIntentoGuardar(true); return; }
    const snap={...form,estado:"Borrador",fecha:new Date().toISOString().slice(0,10),
      _areas:areas,_costos:costos,_capexPM:capexPM,_opexPM:opexPM,_ingresos:ingresos,
      _precioFijo:precioFijo,_ingAdicionales:ingAdicionales};
    let p;
    if(modoEdit&&pres){
      p={...pres,...snap};
      setLista(prev=>prev.map(x=>x.id===pres.id?p:x));
    } else {
      p={id:uid(),...snap};
      setLista(prev=>[p,...prev]);
    }
    setPres(p);
    // Spec recuperación-datos, paso 5 — redundante: abrirNuevo ya deja areas/costos/
    // capexPM/opexPM en vacío al crear. Limpiarlos otra vez aquí borraba lo que
    // "partir de un presupuesto anterior" (partirDePresupuestoAnterior) acababa de
    // copiar a areas/costos justo antes de Guardar/Continuar.
    setStep(2);

    if(supabase){
      const pFinal=p;
      guardarPresupuestoEnNube({pres:pFinal, form:pFinal, areas:pFinal._areas, costos:pFinal._costos,
        ingAdicionales:pFinal._ingAdicionales, precioFijo:pFinal._precioFijo}).then(cloudId=>{
        if(cloudId && cloudId!==pFinal.id){
          setPres(prevPres=>prevPres&&prevPres.id===pFinal.id?{...prevPres,id:cloudId}:prevPres);
          setLista(prevLista=>prevLista.map(x=>x.id===pFinal.id?{...x,id:cloudId}:x));
        }
      }).catch(err=>console.error("[supabase] guardarPres:",err));
    }
  }

  function cargarPlantilla(key){
    const pl=PLANTILLAS[key];
    if(!pl)return;
    setCapexPM(pl.capex.map(p=>initP(p)));
    setOpexPM(pl.opex.map(p=>initP(p)));
    setPlantKey(key);
    setOrigenReal(null);
    setPlantModal(false);
  }

  // "Partir de un presupuesto anterior" (real, de Supabase) — SOLO LECTURA.
  // No escribe nada en Supabase; solo copia a memoria local con ids nuevos.
  async function partirDePresupuestoAnterior(p){
    console.log("[partir-de] Cargando presupuesto de referencia (solo lectura):", p.id, p.nombre);
    const remoto = await cargarPresupuestoDeNube(p.id, {uid, initP, initN});
    if(!remoto){
      console.warn("[partir-de] No se pudo cargar el presupuesto", p.id);
      showToast("No se pudo cargar el presupuesto de referencia");
      return;
    }
    const resumenPartidas = Object.fromEntries(
      Object.entries(remoto._costos).map(([k,v])=>[k,{capex:v.capex.length,mat:v.mat.length,via:v.via.length,nomina:v.nomina.length}])
    );
    console.log("[partir-de] Áreas copiadas:", remoto._areas);
    console.log("[partir-de] Partidas copiadas por área (todas con ids NUEVOS):", resumenPartidas);
    console.log("[partir-de] IDs de muestra generados:",
      Object.values(remoto._costos).flatMap(v=>v.capex.slice(0,2).map(x=>x.id)));

    // Resetear estado a "pendiente" en todas las áreas copiadas — el original queda intacto
    const costosPendientes={};
    Object.entries(remoto._costos).forEach(([k,v])=>{ costosPendientes[k]={...v,estado:"pendiente"}; });

    setAreas(remoto._areas);
    setCostos(costosPendientes);
    setCapexPM([]); setOpexPM([]);
    setIngresos(remoto._ingresos);
    setPrecioFijo(remoto._precioFijo);
    setIngAd(remoto._ingAdicionales);
    setPlantKey(null); // no es una plantilla estática — no interfiere con ese flujo
    setOrigenReal({nombre:remoto.nombre, capex:Object.values(costosPendientes).reduce((s,a)=>s+a.capex.length,0),
      opex:Object.values(costosPendientes).reduce((s,a)=>s+a.mat.length+a.via.length,0)});
    setPlantModal(false);
    console.log("[partir-de] Copia completa en memoria. Ningún dato fue escrito en Supabase todavía — "+
      "solo se escribirá cuando el usuario guarde este presupuesto nuevo explícitamente.");
    showToast(`Partiendo de "${remoto.nombre}" — revisa y ajusta antes de guardar`);
  }

  function confirmarAreas(){
    const c={};
    // Obtener la plantilla activa con sus datos completos
    const plData = plantKey ? PLANTILLAS[plantKey] : null;
    areas.forEach((id,idx)=>{
      const existing=costos[id];
      if(existing&&existing.estado!=="pendiente"){ c[id]=existing; return; }
      if(idx===0 && plData){
        // Distribuir plantilla completa al primer área con datos reales
        const capexBase = (plData.capex||[]).map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto,mesGasto:p.mesGasto||0,
          mesGastoMes:p.mesGastoMes||"",mesGastoAnio:p.mesGastoAnio||""}));
        // OPEX: separar nómina de materiales
        const nomBase = (plData.nomina||[]).map(p=>initN({puesto:p.puesto,cantidad:p.cantidad||1,salario:p.salario||0}));
        // Del opex de la plantilla — los que son NOMINA van a nómina, resto a mat
        const opexNom = (plData.opex||[]).filter(p=>p.cat?.toUpperCase().includes("NOMINA"));
        const opexMat = (plData.opex||[]).filter(p=>!p.cat?.toUpperCase().includes("NOMINA")&&!p.cat?.toUpperCase().includes("VIATICO"));
        const opexVia = (plData.opex||[]).filter(p=>p.cat?.toUpperCase().includes("VIATICO"));
        const matBase = opexMat.map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto,periodicidad:p.periodicidad||"mensual",mesInicioOpex:p.mesInicioOpex||1}));
        const viaBase = opexVia.map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto,periodicidad:p.periodicidad||"mensual",mesInicioOpex:p.mesInicioOpex||1}));
        // Si la plantilla tiene nómina propia usarla, si no, convertir las OPEX-NOMINA
        const nomFinal = nomBase.length>0 ? nomBase
          : opexNom.map(p=>initN({puesto:p.desc||"Puesto",cantidad:1,salario:p.monto||0}));
        c[id]={
          capex:capexBase,
          mat:matBase,
          nomina:nomFinal,
          via:viaBase,
          estado:"pendiente",
        };
      } else {
        c[id]=existing||{capex:[],mat:[],nomina:[],via:[],estado:"pendiente"};
      }
    });
    setCostos(c); setStep(3); setActiva(areas[0]||null);
  }

  function upP(id,cat,pid,u){setCostos(prev=>({...prev,[id]:{...prev[id],[cat]:prev[id][cat].map(p=>p.id===pid?u:p)}}));}
  function addP(id,cat){setCostos(prev=>({...prev,[id]:{...prev[id],[cat]:[...(prev[id][cat]||[]),initP()]}}));}
  function rmP(id,cat){return pid=>()=>setCostos(prev=>({...prev,[id]:{...prev[id],[cat]:prev[id][cat].filter(p=>p.id!==pid)}}));}
  function addN(id){setCostos(prev=>({...prev,[id]:{...prev[id],nomina:[...(prev[id].nomina||[]),initN()]}}));}
  function rmN(id){return pid=>setCostos(prev=>({...prev,[id]:{...prev[id],nomina:prev[id].nomina.filter(p=>p.id!==pid)}}));}

  // Único botón "Guardar" de Capturar costos — fusiona lo que antes eran
  // guardarArea + guardarIngresos (pedido de hoy: dejar de tener dos llamadas
  // a guardarPresupuestoEnNube con snapshots independientes, que podían
  // solaparse o desincronizarse entre sí — bug documentado en CLAUDE.md). Una
  // sola llamada, con TODO el estado vigente al momento del clic: areas,
  // costos (marcando la área activa como "guardado", igual que hacía
  // guardarArea), ingAdicionales, precioFijo. Ya no hay snapshot parcial de
  // solo-ingresos ni de solo-un-área.
  function guardarTodo(){
    const nuevoCostos = areaActiva
      ? {...costos,[areaActiva]:{...costos[areaActiva],estado:"guardado"}}
      : costos;
    setCostos(nuevoCostos);
    setAreaSaved(true);

    if(pres){
      const snap={_areas:areas,_costos:nuevoCostos,_capexPM:capexPM,_opexPM:opexPM,
        _ingresos:ingresos,_precioFijo:precioFijo,_ingAdicionales:ingAdicionales};
      const actualizado={...pres,...snap};
      setPres(actualizado);
      setLista(prev=>prev.map(x=>x.id===pres.id?{...x,...snap}:x));

      if(supabase){
        // El toast solo dice "guardado" si guardarPresupuestoEnNube en efecto
        // resolvió con un id real. cloudId===null es la propia función
        // reportando un error interno (insert/update fallido) sin lanzar
        // excepción, así que no basta con el .catch(): hay que revisar el
        // valor resuelto. Candado (Opción A) — sigue existiendo, aunque con un
        // solo botón ya no hay un segundo botón con el que solaparse; se deja
        // por si en el futuro hay otro punto de guardado en esta pantalla.
        setGuardando(true);
        guardarPresupuestoEnNube({pres:actualizado, form:actualizado, areas, costos:nuevoCostos,
          ingAdicionales, precioFijo}).then(cloudId=>{
          if(cloudId){
            if(cloudId!==actualizado.id){
              // Presupuesto local (id numérico) recién promovido a la nube: adoptar el UUID real
              setPres(prevPres=>prevPres&&prevPres.id===actualizado.id?{...prevPres,id:cloudId}:prevPres);
              setLista(prevLista=>prevLista.map(x=>x.id===actualizado.id?{...x,id:cloudId}:x));
            }
            showToast("Costos guardados correctamente");
            // Guardado confirmado por la nube (cloudId real): se abre el acceso al
            // Resumen mensual. Va junto al toast de éxito a propósito — es el mismo
            // evento, así que no pueden despegarse uno del otro.
            setResumenDesbloqueado(true);
          } else {
            // cloudId===null es un fallo reportado sin excepción: NO desbloquea.
            showToast("No se pudo guardar — intenta de nuevo");
          }
        }).catch(err=>{
          console.error("[supabase] guardarTodo:",err);
          showToast("No se pudo guardar — intenta de nuevo");
        }).finally(()=>setGuardando(false));
      } else {
        // Sin Supabase configurado, el guardado es solo local — no hay nada
        // async que esperar, el toast de éxito es inmediato como antes.
        showToast("Costos guardados correctamente");
        setResumenDesbloqueado(true);
      }
    } else {
      showToast("Costos guardados correctamente");
      setResumenDesbloqueado(true);
    }
  }

  // ── BTN ──────────────────────────────────────────────────────────────────────
  // Jerarquía visual: primary/success = acción principal (llenas, con sombra),
  // secondary = acción secundaria (borde, sin relleno), danger = destructiva.
  // `title` (5º parámetro, 02-sep-2026): tooltip nativo, sobre todo para explicar
  // por qué un botón está deshabilitado — antes el usuario veía un botón gris sin
  // saber qué hacer. Es opcional con default undefined, así que las ~40 llamadas
  // que ya existen a btn() no cambian en nada.
  const btn=(label,onClick,variant="primary",disabled=false,title=undefined)=>{
    const bg=variant==="primary"?C.yellow:variant==="success"?C.success:
      variant==="danger"?C.danger:C.white;
    const bgHover=variant==="primary"?C.yellowDark:variant==="success"?"#166430":
      variant==="danger"?"#a5321f":C.grayLight;
    const isFilled=variant==="primary"||variant==="success"||variant==="danger";
    return(
      <button onClick={onClick} disabled={disabled} title={title} style={{
        padding:isFilled?"10px 24px":"9px 20px",borderRadius:8,
        border:isFilled?"none":`1.5px solid ${C.grayBorder}`,
        cursor:disabled?"not-allowed":"pointer",
        fontWeight:isFilled?700:600,fontSize:13,
        transition:"all 0.15s",opacity:disabled?0.5:1,
        background:bg,
        color:variant==="primary"?C.grayDark:variant==="success"||variant==="danger"?C.white:C.grayMid,
        boxShadow:variant==="primary"?"0 2px 8px rgba(221,172,0,0.3)":
          variant==="success"?"0 2px 8px rgba(30,126,52,0.25)":"none",
      }}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background=bgHover;}}
      onMouseLeave={e=>{if(!disabled)e.currentTarget.style.background=bg;}}
      >{label}</button>
    );
  };

  // ── LAYOUT ───────────────────────────────────────────────────────────────────
  // Fase 1.1 — menú lateral vacío: la navegación vive dentro del presupuesto,
  // no en steps bloqueados que no llevan a nada. `areaSaved` NO se borra:
  // sigue usándose en otras condiciones (botones, gráficas de Step 5, etc.).
  const NAV=[
    {i:0,icon:"◉",label:"Presupuestos"},
  ];

  // Nombre del proyecto para la miga de pan — pres siempre está poblado desde
  // Step 2 en adelante (guardarPres/abrirEdit/presToOpen lo fijan antes de
  // navegar); en Step 1 con un presupuesto nuevo sin guardar aún, cae a form.
  const nombreProy = pres?.nombre||form?.nombre||"Nuevo presupuesto";
  // Cambio de navegación pedido hoy — citas: "De acá pues debería de mandarlo no
  // aquí, sino al formulario de captura" · "de la ventana de información general,
  // cuando le dé a presupuesto TI, que mande al formulario de captura". El
  // eslabón [nombre del proyecto] de la miga de pan deja de ir a Datos generales
  // (Step 1) y pasa a ir a Capturar costos (Step 3) — mismo patrón que ya usa
  // abrirEdit para preseleccionar área y avisar que no es flujo de creación.
  const irACapturarCostos=()=>{
    if(!areaActiva) setActiva(areas[0]||null);
    setFlujoCreacion(false);
    setStep(3);
  };
  const wrap=(children,miga=[])=>(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"Inter,-apple-system,sans-serif",background:C.contentBg}}>
      <style>{`
        /* ── Dropdowns con marca (flecha propia + hover/focus consistentes) ── */
        .sel-brand {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B6B6B' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 10px 6px;
          padding-right: 26px !important;
          min-height: 36px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sel-brand:hover {
          border-color: #B0B0B0 !important;
        }
        .sel-brand:focus {
          outline: none;
          border-color: #DDAC00 !important;
          box-shadow: 0 0 0 3px rgba(221,172,0,0.16);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23DDAC00' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        }
        .sel-brand:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        /* ── Filas de tabla con hover — estándar en tablas de datos enterprise ── */
        .partida-row {
          transition: background-color 0.12s;
          border-radius: 8px;
        }
        .partida-row:hover {
          background-color: #FAFAFA;
        }
        @media (max-width: 1024px) {
          .sidebar-nav { width: 60px !important; }
          .sidebar-nav .nav-label { display: none !important; }
          .sidebar-nav .sidebar-logo-text { display: none !important; }
          .main-content { margin-left: 60px !important; }
          .capture-grid { grid-template-columns: 1fr !important; }
          .resumen-kpi { grid-template-columns: 1fr 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .sidebar-nav { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .capture-grid { grid-template-columns: 1fr !important; }
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .tipo-grid { grid-template-columns: 1fr 1fr !important; }
          .dates-grid { grid-template-columns: 1fr !important; }
          .areas-grid { grid-template-columns: 1fr 1fr !important; }
          .resumen-kpi { grid-template-columns: 1fr 1fr !important; }
          .base-opciones { grid-template-columns: 1fr !important; }
          .sel-brand { min-height: 42px; font-size: 13px !important; }
        }
        /* ── Móvil (≤480px, ej. iPhone SE) ──────────────────────────────────
           Estándar para listados con acciones: la fila-grid se convierte en
           card apilada (datos arriba, botones de acción abajo en fila que
           envuelve). Las tablas de captura/meses usan <ScrollHint> en vez de
           esto — ver componente ScrollHint arriba. */
        @media (max-width: 480px) {
          .lista-header { display: none !important; }
          .lista-row { grid-template-columns: 1fr !important; gap: 10px !important; }
          .lista-acciones { justify-content: flex-start !important; flex-wrap: wrap; }
          .areas-grid { grid-template-columns: 1fr !important; }
          .kpi-grid { grid-template-columns: 1fr !important; }
          .resumen-kpi { grid-template-columns: 1fr 1fr !important; }
        }
        @media print {
          .sidebar-nav { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .noprint { display: none !important; }
          #rpdf, #rpdf * { visibility: visible; }
          body * { visibility: hidden; }
          #rpdf { position: absolute; left: 0; top: 0; width: 100%; }
          /* F1 (Fernando) — que ninguna gráfica se corte entre dos páginas al
             imprimir/exportar PDF. Solo las 2 tarjetas de gráfica por pantalla
             (Resumen mensual, Información general) llevan className="chart-card";
             tablas y KPIs no la llevan y siguen partiéndose normal entre páginas. */
          .chart-card { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {/* Sidebar */}
      <aside className="sidebar-nav" style={{width:220,background:C.sidebar,flexShrink:0,
        display:"flex",flexDirection:"column",position:"fixed",overflow:"hidden",
        top:0,left:0,bottom:0,zIndex:50}}>
        <div style={{padding:"22px 20px 18px",borderBottom:"1px solid #222"}}>
          {/* Retro — el logo dice el nombre completo. A 22px/900 "GEOLIS SA DE CV"
              no cabe en los 220px de la barra, así que se parte en dos líneas:
              GEOLIS grande arriba, SA DE CV chico debajo. */}
          <div className="sidebar-logo-text" style={{fontSize:22,fontWeight:900,color:C.yellow,letterSpacing:-0.5,lineHeight:1.05}}>GEOLIS</div>
          <div className="sidebar-logo-text" style={{fontSize:12,fontWeight:700,color:C.yellow,letterSpacing:0.5,marginTop:1}}>SA DE CV</div>
          <div className="sidebar-logo-text" style={{fontSize:11,color:"#555",marginTop:3}}>Módulo de Presupuestos</div>
        </div>
        <nav style={{padding:"8px 0",flex:1}}>
          {NAV.map(t=>{
            const active=step===t.i;
            const done=step>t.i;
            const locked=t.locked&&step<t.i;
            return(
              <div key={t.i}
                onClick={()=>{if(!locked){if(t.i===0)setStep(0);else if(t.i<=step)setStep(t.i);}}}
                style={{display:"flex",alignItems:"center",gap:10,
                  padding:"10px 20px",cursor:locked?"default":t.i<=step||t.i===0?"pointer":"default",
                  background:active?"#1E1E1E":"transparent",
                  borderLeft:active?`3px solid ${C.yellow}`:"3px solid transparent",
                  opacity:locked?0.35:1}}>
                <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,
                  background:active?C.yellow:done?"#2a2a2a":"transparent",
                  border:active?"none":done?`1.5px solid #555`:`1.5px solid #333`,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {done&&<span style={{fontSize:9,color:"#aaa"}}>✓</span>}
                </div>
                <span className="nav-label" style={{fontSize:13,fontWeight:active?700:400,
                  color:active?C.yellow:done?"#888":"#444"}}>{t.label}</span>
              </div>
            );
          })}
        </nav>
        {/* Fase 1.2 — bloque "Activo" eliminado: nombre/elaboración/vigencia
            ya viven en el cuerpo de cada pantalla (Información general,
            Resumen mensual y ahora también Capturar costos). */}
      </aside>
      {/* Main */}
      <div className="main-content" style={{flex:1,minWidth:0,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <header style={{background:C.white,borderBottom:`1px solid ${C.line}`,
          padding:"0 32px",height:52,display:"flex",alignItems:"center",
          justifyContent:"space-between",position:"sticky",top:0,zIndex:40,
          boxShadow:"0 1px 0 rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
            {/* Spec navegación-retro-410 punto 1 — la miga de pan es la navegación:
                cada eslabón salvo el último es clicable. "Inicio" y "Presupuestos"
                van al mismo lugar por ahora (duda 2 del spec, sin resolver con el
                cliente); no sustituye a los botones de regreso propios de cada
                pantalla (punto 6). */}
            <span style={{cursor:"pointer",color:C.yellowDark,fontWeight:600}}
              onClick={()=>setStep(0)}>Inicio</span>
            {miga.map((seg,i)=>{
              const esUltimo=i===miga.length-1;
              // Cambio de navegación pedido hoy, punto (b) — "aquí no debería de
              // aparecer... o sea, sí, pero no debería de tener acción": un eslabón
              // sin onClick (aunque no sea el último) se ve igual que el último —
              // sin cursor de mano, sin acción — en vez de solo depender de esUltimo.
              const clicable=!esUltimo&&!!seg.onClick;
              return (
                <Fragment key={i}>
                  <span style={{color:C.grayBorder}}>/</span>
                  {clicable
                    ? <span style={{cursor:"pointer",color:C.yellowDark,fontWeight:600}} onClick={seg.onClick}>{seg.label}</span>
                    : <span style={{color:C.grayDark,fontWeight:700}}>{seg.label}</span>}
                </Fragment>
              );
            })}
          </div>
          {/* Fase 1.4 — los tres botones cruzados (Ver Resumen mensual → / Mi
              presupuesto → / ← Resumen mensual) se quitaron de la barra pegajosa:
              duplicaban la fila de botones propia de cada pantalla.
              Cambio pedido por Luis (WhatsApp) — "en el breadcrumb quite el
              botecito de eliminar en todas las pantallas": se quita el 🗑 que
              vivía aquí (Capturar costos, Resumen mensual, Información general —
              único lugar donde aparecía). Con esto no queda NINGÚN camino de UI
              para eliminar un presupuesto — ver "Pendientes de producto" en
              CLAUDE.md. */}
        </header>
        <main style={{padding:"28px 32px",flex:1,minWidth:0}}>{children}</main>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0 — LISTA
  // ══════════════════════════════════════════════════════════════════════════
  if(step===0) return wrap(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:C.grayDark}}>Presupuestos</h1>
          <p style={{margin:"4px 0 0",fontSize:13,color:C.grayMid}}>{lista.length} presupuesto(s) registrado(s)</p>
        </div>
        {btn("+ Nuevo presupuesto",abrirNuevo)}
      </div>
      <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
        overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
        {/* Fase 1.7 — columna "Estado" oculta de la interfaz (NO se borra del modelo:
            guardarPres sigue escribiendo estado:"Borrador" tal cual). */}
        {/* Header tabla — oculto en móvil, donde cada fila se muestra como card apilada */}
        <div className="lista-header" style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 400px",gap:0,
          padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${C.line}`}}>
          {["Proyecto","Tipo","Acciones"].map((h,i)=>(
            <div key={h} style={{fontSize:11,fontWeight:700,color:C.grayMid,
              textTransform:"uppercase",letterSpacing:0.5,
              textAlign:i===2?"center":"left"}}>{h}</div>
          ))}
        </div>
        {lista.map((p,i)=>(
          <div key={p.id} className="lista-row" style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 400px",
            gap:0,alignItems:"center",padding:"14px 20px",
            background:i%2===0?C.white:"#FAFAFA",
            borderBottom:i<lista.length-1?`1px solid ${C.line}`:"none",
            transition:"background 0.1s"}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:C.grayDark}}>{p.nombre}</div>
              {/* Unidad de negocio debajo del nombre (Luis, 02-sep-2026) — mismo
                  criterio que el encabezado del presupuesto: sin etiqueta, y si no
                  hay unidad el renglón no se pinta. La clave viaja en el listado
                  desde que listarPresupuestos la incluye en su select. */}
              {p.unidadNegocio&&<div style={{fontSize:12,color:C.grayDark,fontWeight:600,marginTop:2}}>{etiquetaUnidad(p.unidadNegocio)}</div>}
              {/* Spec navegación-retro-410 punto 3.1 — reemplaza la fecha suelta */}
              {p.fechaInicio&&<div style={{fontSize:11,color:C.grayMid,marginTop:2}}>Inicio del proyecto: {p.fechaInicio}</div>}
              {p.fechaInicio&&<div style={{fontSize:11,color:C.grayMid,marginTop:1}}>Vigencia: {p.fechaInicio} → {p.fechaFin||"—"}</div>}
            </div>
            <div style={{fontSize:13,color:C.grayMid,textTransform:"capitalize"}}>{p.tipo}</div>
            {/* Punto 3.2, corrección posterior (Luis, WhatsApp) — orden invertido de
                los primeros dos: Ver (antes rotulado "Información general"),
                Editar, Clonar. Los destinos
                no cambian, solo el orden — ver "Corrección posterior" en
                docs/specs/spec-navegacion-retro-410.md.
                "Eliminar" se había quitado de aquí (duda 1 del spec, R4 de
                docs/MD/DECISIONES.md) y vuelve hoy, para no obligar a entrar al
                dashboard de Supabase. R4 queda pendiente de reconfirmar con Luis
                — ver CLAUDE.md. La confirmación es el window.confirm que
                eliminarPresupuesto ya traía (App.jsx:2449); identifica por nombre
                Y fecha de inicio porque hay registros con nombre casi idéntico.
                OJO: esto NO cierra el bug del presupuesto fantasma. localStorage
                es por origen — borrar en localhost no limpia el caché de
                demo-presupuesto.vercel.app. Ver CLAUDE.md. */}
            <div className="lista-acciones" style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={()=>{
                // FIX 6 v2: usar abrirPresupuesto para evitar race condition de setState
                abrirPresupuesto(p);
              }}
                style={{padding:"6px 14px",background:C.white,
                  border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  cursor:"pointer",fontSize:12,fontWeight:600,color:C.grayMid}}>Ver</button>
              <button onClick={()=>abrirEdit(p)}
                style={{padding:"6px 14px",background:C.yellow,border:"none",
                  borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,color:C.grayDark,
                  boxShadow:"0 1px 6px rgba(221,172,0,0.25)"}}>Editar</button>
              <button onClick={()=>{setClonarModal(p);setClonarTipo(p.tipo);}}
                title="Crear nuevo presupuesto basado en este"
                style={{padding:"6px 14px",background:C.white,
                  border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  cursor:"pointer",fontSize:12,fontWeight:600,color:C.grayMid}}>
                Clonar
              </button>
              <button onClick={()=>eliminarPresupuesto(p)}
                title="Eliminar este presupuesto y todas sus áreas y partidas"
                style={{padding:"6px 14px",background:C.dangerLight,
                  border:`1px solid ${C.danger}`,borderRadius:6,
                  cursor:"pointer",fontSize:12,fontWeight:700,color:C.danger,
                  whiteSpace:"nowrap"}}>
                🗑 Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Punto 8 — diálogo de Clonar: muestra de cuál presupuesto se copia y deja
          ajustar el tipo antes de continuar (el tipo ya elegido aquí sigue siendo
          reactivo en el formulario de edición vía getAreasCat/plantillasSugeridas,
          sin lógica nueva). Solo Cancelar y Continuar — nada más. */}
      {clonarModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.white,borderRadius:12,padding:32,maxWidth:480,width:"90%",
            boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
            <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:C.grayDark}}>Clonar presupuesto</h3>
            <p style={{margin:"0 0 20px",fontSize:13,color:C.grayMid}}>
              Copiando de: <strong style={{color:C.grayDark}}>{clonarModal.nombre}</strong>
            </p>
            <div style={{fontSize:11,fontWeight:700,color:C.grayMid,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>
              Tipo de presupuesto
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:24}}>
              {[
                {id:"instalacion", label:"Instalación",  icon:"🏗️"},
                {id:"servicio",    label:"Servicio",     icon:"🔁"},
                {id:"departamento",label:"Departamento", icon:"🏢"},
                {id:"suministro",  label:"Suministro",   icon:"📦"},
              ].map(t=>(
                <div key={t.id} onClick={()=>setClonarTipo(t.id)}
                  style={{border:"2px solid",borderColor:clonarTipo===t.id?C.yellow:C.grayBorder,
                    borderRadius:10,padding:"12px 10px",cursor:"pointer",textAlign:"center",
                    background:clonarTipo===t.id?C.yellowLight:C.white,transition:"all 0.15s"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{t.icon}</div>
                  <div style={{fontWeight:700,fontSize:12,color:C.grayDark}}>{t.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
              {btn("Cancelar",()=>setClonarModal(null),"secondary")}
              {btn("Continuar",()=>{clonarPresupuesto(clonarModal,clonarTipo);setClonarModal(null);},"primary")}
            </div>
          </div>
        </div>
      )}
    </div>
  ,[{label:"Presupuestos"}]);

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — INFO GENERAL
  // ══════════════════════════════════════════════════════════════════════════
  if(step===1){
    const sug=plantillasSugeridas(form.tipo);
    return wrap(
      <div style={{maxWidth:740}}>
        {/* Spec navegación-retro-410 punto 4 — fila de botones arriba, una sola
            pareja Cancelar/Guardar (se quita la de abajo). Sin PDF: esta pantalla
            nunca lo tuvo.
            Cambio pedido por Luis (WhatsApp) — en esta pantalla (Nuevo presupuesto,
            flujoCreacion en su fase inicial) "Información general" ya NO aparece,
            ni siquiera atenuado: solo quedan Cancelar y Continuar. Distinto del
            mismo eslabón en Capturar costos (Step 3, línea ~3409), que sigue
            visible-pero-atenuado — ese no se toca. */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:C.grayDark}}>
            {modoEdit?"Editar presupuesto":"Nuevo presupuesto"}
          </h2>
          {/* Los botones Cancelar / Continuar vivían aquí, junto al título.
              El 02-sep-2026 bajaron al final del formulario a petición de Luis
              ("el botón de abajo"): se piden al terminar de llenar, no antes de
              empezar. Ver el bloque al fondo de esta pantalla. */}
        </div>

        <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
          overflow:"hidden",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${C.line}`,
            borderLeft:`3px solid ${C.yellow}`}}>
            <span style={{fontWeight:700,fontSize:14,color:C.grayDark}}>Datos generales</span>
          </div>
          <div style={{padding:24}}>
            <div className="dates-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
              <div>
                <FL required>Nombre del proyecto</FL>
                <input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}
                  placeholder="Ej. BECH-PERDIZ-2026"
                  style={{width:"100%",padding:"9px 12px",
                    border:`1px solid ${intentoGuardar&&!form.nombre?"#C0392B":C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none",
                    background:intentoGuardar&&!form.nombre?"#FFF5F5":C.white}}/>
                {intentoGuardar&&!form.nombre&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>⚠ Nombre del proyecto requerido</div>}
              </div>
              <div>
                <FL>Empresa</FL>
                <input value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none"}}/>
              </div>
              {/* Oculto por petición de Luis (02-sep-2026). El año queda visible
                  en Fecha inicio / Fecha fin, que ya lo muestran. NO BORRAR: si
                  la captura de presupuestos del año en curso se vuelve frecuente,
                  este selector es la forma rápida de cambiar entre ejercicios.

                  LO QUE NO SE PIERDE — el valor por omisión de las dos fechas
                  SIGUE SIENDO AÑO ACTUAL + 1. Lo aplica abrirNuevo llamando a
                  fechasDeAnio(new Date().getFullYear()+1), que NO se tocó: hoy
                  (2026) "+ Nuevo presupuesto" sigue proponiendo 2027-01-01 y
                  2027-12-31. Es la regla que definió la contadora Anel. Lo único
                  que se va es la forma VISUAL de elegirlo; para un presupuesto
                  del año en curso, el usuario cambia las dos fechas a mano.

                  El recuadro amarillo ("Ejercicio 2027 — del ... al ...") ya
                  estaba comentado desde el commit 04cb918, por la misma petición.
                  Aquí queda dentro de ESTE comentario y se le quitaron sus
                  delimitadores propios, porque los comentarios de bloque de JS no
                  se anidan.

                  Para reactivarlo: borrar esta cabecera y el cierre de abajo (y,
                  si se quiere también el recuadro, volver a envolverlo). Depende
                  de anioDeFecha y fechasDeAnio; las dos siguen en el archivo
                  —fechasDeAnio la usa abrirNuevo—, así que no hay nada más que
                  restaurar.

                  Contexto original del bloque: iba antes de las fechas porque lo
                  único que hacía era rellenarlas, y solo se pintaba en creación —
                  en modoEdit, mover fechaInicio recorre todas las columnas de mes
                  de lo ya capturado, que es la decisión A1 de
                  docs/MD/DECISIONES.md y sigue sin resolver.

              {!modoEdit&&(()=>{
                const anioActual=new Date().getFullYear();
                const anioSel=anioDeFecha(form.fechaInicio);
                const opciones=[
                  {anio:anioActual,   nota:"año en curso"},
                  {anio:anioActual+1, nota:"siguiente"},
                ];
                // Un clon hereda las fechas de su origen y las dos fechas de
                // abajo son editables: si el año capturado no es ninguno de los
                // dos, se agrega como opción para que el selector nunca muestre
                // resaltado un año distinto del que dicen las fechas.
                if(anioSel && !opciones.some(o=>o.anio===anioSel))
                  opciones.push({anio:anioSel, nota:"según las fechas capturadas"});
                opciones.sort((a,b)=>a.anio-b.anio);
                return(
                <div style={{gridColumn:"1 / -1"}}>
                  <FL>Año del presupuesto</FL>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {opciones.map(o=>{
                      const activo=anioSel===o.anio;
                      return(
                        <div key={o.anio} onClick={()=>setForm({...form,...fechasDeAnio(o.anio)})}
                          style={{border:"2px solid",borderColor:activo?C.yellow:C.grayBorder,
                            borderRadius:10,padding:"10px 20px",cursor:"pointer",textAlign:"center",
                            background:activo?C.yellowLight:C.white,transition:"all 0.15s",
                            boxShadow:activo?"0 0 0 3px rgba(221,172,0,0.15)":"none"}}>
                          <div style={{fontWeight:800,fontSize:18,color:C.grayDark,lineHeight:1.1}}>
                            {activo?"● ":""}{o.anio}
                          </div>
                          <div style={{fontSize:10,color:C.grayMid,marginTop:3}}>{o.nota}</div>
                        </div>
                      );
                    })}
                  </div>
                  El recuadro amarillo, oculto desde 04cb918:

                  <div style={{marginTop:8,fontSize:12,color:C.grayDark,background:C.yellowLight,
                    border:`1px solid ${C.yellowBorder}`,borderRadius:8,padding:"8px 12px"}}>
                    {anioSel
                      ?<>Ejercicio <strong>{anioSel}</strong> — del <strong>{form.fechaInicio}</strong> al <strong>{form.fechaFin||"—"}</strong>. Las dos fechas de abajo son editables.</>
                      :<>Elige un año para rellenar las fechas, o captúralas a mano abajo.</>}
                  </div>
                </div>
                );
              })()}
              */}

              {/* UNIDAD DE NEGOCIO (02-sep-2026, pedido de Anel) — a la altura de
                  Fecha inicio, en fila propia de ancho completo: son 30 opciones
                  con clave y nombre largos y no caben en media rejilla.
                  Se guarda SOLO la clave (catalogoUnidades.js). En modoEdit se
                  muestra deshabilitado con el valor guardado a la vista: abrir su
                  edición hoy es la misma pregunta sin responder que la de las
                  fechas (A1 de docs/MD/DECISIONES.md). */}
              <div style={{gridColumn:"1 / -1"}}>
                <FL required={!modoEdit}>Unidad de negocio {modoEdit&&<span style={{color:C.grayMid,fontSize:10,fontWeight:400,marginLeft:6,textTransform:"none"}}>— no editable por ahora</span>}</FL>
                <select value={form.unidadNegocio||""} disabled={modoEdit}
                  onChange={e=>{
                    // A partir de aquí la elección es del usuario y el
                    // autollenado por tipo deja de tocarla (ver unidadTocada).
                    setUnidadTocada(true);
                    setForm({...form,unidadNegocio:e.target.value});
                  }}
                  className="sel-brand"
                  style={{width:"100%",padding:"9px 12px",
                    border:`1px solid ${intentoGuardar&&!modoEdit&&!form.unidadNegocio?"#C0392B":C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none",
                    background:modoEdit?C.grayLight:(intentoGuardar&&!form.unidadNegocio?"#FFF5F5":C.white),
                    color:modoEdit?C.grayMid:C.grayDark,
                    cursor:modoEdit?"not-allowed":"pointer"}}>
                  <option value="">— Selecciona la unidad de negocio —</option>
                  {/* Una clave guardada que ya no esté en el catálogo se agrega
                      como opción para que el <select> no la borre al pintarse. */}
                  {form.unidadNegocio&&!UNIDADES_NEGOCIO.some(u=>u.clave===form.unidadNegocio)&&(
                    <option value={form.unidadNegocio}>{form.unidadNegocio} — (fuera del catálogo)</option>
                  )}
                  {UNIDADES_NEGOCIO.map(u=>(
                    <option key={u.clave} value={u.clave}>{u.clave} — {u.nombre}</option>
                  ))}
                </select>
                {intentoGuardar&&!modoEdit&&!form.unidadNegocio&&(
                  <div style={{fontSize:11,color:C.danger,marginTop:4}}>⚠ Unidad de negocio requerida</div>
                )}
                <div style={{fontSize:11,color:C.grayMid,marginTop:4}}>
                  {modoEdit
                    ? <>Guardada: <strong>{etiquetaUnidad(form.unidadNegocio)||"—"}</strong></>
                    : <>Se guarda la clave (<strong>{form.unidadNegocio||"—"}</strong>). Escribe la clave con el select abierto para saltar a ella.</>}
                </div>
              </div>

              <div>
                <FL required>Fecha inicio</FL>
                <input type="date" value={form.fechaInicio} onChange={e=>setForm({...form,fechaInicio:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",
                    border:`1px solid ${intentoGuardar&&!form.fechaInicio?"#C0392B":C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none",
                    background:intentoGuardar&&!form.fechaInicio?"#FFF5F5":C.white}}/>
                {intentoGuardar&&!form.fechaInicio&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>⚠ Fecha inicio requerida</div>}
              </div>
              <div>
                <FL required>Fecha fin</FL>
                <input type="date" value={form.fechaFin} onChange={e=>setForm({...form,fechaFin:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",
                    border:`1px solid ${intentoGuardar&&!form.fechaFin?"#C0392B":C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none",
                    background:intentoGuardar&&!form.fechaFin?"#FFF5F5":C.white}}/>
                {intentoGuardar&&!form.fechaFin&&<div style={{fontSize:11,color:C.danger,marginTop:4}}>⚠ Fecha fin requerida</div>}
              </div>
              {/* Oculto temporalmente (02-sep-2026). Este dato pasa a ser por
                  usuario cuando exista el login: se llenará solo con la fecha en
                  que el usuario capturó, no como campo editable en pantalla.
                  No borrar hasta que el login esté.

                  Solo se oculta el CAMPO de esta pantalla. form.fechaElaboracion
                  se sigue armando igual (abrirNuevo y clonarPresupuesto le ponen
                  la fecha de hoy, App.jsx:2805 y 2931), presToRow lo sigue
                  mandando a la columna fecha_elaboracion (supabaseApi.js:13) y
                  las pantallas que solo lo muestran no se tocan: "Elaborado:" en
                  Resumen mensual (App.jsx:4525) y el pie del PDF (App.jsx:4733).

              <div>
                <FL>Fecha de elaboración</FL>
                <input type="date" value={form.fechaElaboracion} onChange={e=>setForm({...form,fechaElaboracion:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none"}}/>
              </div>
              */}

              <div style={{gridColumn:"1 / -1"}}>
                <FL required>Tipo de presupuesto {intentoGuardar&&!form.tipo&&<span style={{color:C.danger,fontSize:10,fontWeight:400,marginLeft:6}}>← selecciona uno para continuar</span>}</FL>
                {/* Confirmado en producción — el tipo lo hereda el clon del origen y NO
                    debe poder cambiarse ahí: cambiar un clon de Servicio a Departamento
                    produce partidas que ese tipo no admite. form.tipo no se toca — solo
                    se quita la edición mientras viaClonar es true. En "+ Nuevo
                    presupuesto" las cuatro tarjetas siguen igual. */}
                {viaClonar?(()=>{
                  const tipoLabel={"instalacion":"Instalación","servicio":"Servicio","departamento":"Departamento","suministro":"Suministro"};
                  return(
                    <div style={{padding:"9px 12px",border:`1px solid ${C.grayBorder}`,borderRadius:8,
                      fontSize:14,background:C.grayLight,color:C.grayDark}}>
                      Tipo: <strong>{tipoLabel[form.tipo]||form.tipo}</strong> — heredado del presupuesto de origen
                    </div>
                  );
                })():(
                <div className="tipo-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:2}}>
                  {[
                    {id:"instalacion", label:"Instalación",  desc:"Proyectos de campo",    icon:"🏗️"},
                    {id:"servicio",    label:"Servicio",     desc:"Servicio recurrente",   icon:"🔁"},
                    {id:"departamento",label:"Departamento", desc:"Área interna",          icon:"🏢"},
                    {id:"suministro",  label:"Suministro",   desc:"Compra de materiales",  icon:"📦"},
                  ].map(t=>(
                    <div key={t.id}
                      onClick={()=>{
                        // Autollenado de Unidad de negocio (Luis, 02-sep-2026):
                        // un presupuesto de Departamento siempre es interno y va
                        // a G18ADMIN, así que se pone solo — quien no conoce la
                        // plataforma no tiene por qué buscar entre 30 claves.
                        // Solo actúa mientras el usuario NO haya tocado el campo:
                        // si ya eligió una unidad, su elección manda y no se pisa.
                        // Y si no la tocó y sale de Departamento, vuelve al
                        // placeholder — nada de G18ADMIN colgado en una
                        // Instalación. El campo sigue editable y obligatorio: es
                        // un atajo, no una imposición.
                        const unidadAuto = unidadTocada
                          ? form.unidadNegocio
                          : (t.id==="departamento" ? UNIDAD_DEPARTAMENTO : "");
                        setForm({...form,tipo:t.id,unidadNegocio:unidadAuto});
                        setAreas([]);
                        setOpexPM([]);
                        // Usuario decide si cargar base o empezar desde cero
                        setCapexPM([]);
                        setPlantKey(null);
                      }}
                      style={{border:"2px solid",borderColor:form.tipo===t.id?C.yellow:C.grayBorder,
                        borderRadius:10,padding:"14px 10px",cursor:"pointer",textAlign:"center",
                        background:form.tipo===t.id?C.yellowLight:C.white,transition:"all 0.15s",
                        boxShadow:form.tipo===t.id?"0 0 0 3px rgba(221,172,0,0.15)":"none"}}>
                      <div style={{fontSize:26,marginBottom:6}}>{t.icon}</div>
                      <div style={{fontWeight:700,fontSize:13,color:C.grayDark}}>{t.label}</div>
                      {/* Oculto por petición de Luis (02-sep-2026). NO BORRAR: la
                          contadora Anel probablemente lo va a pedir de vuelta, porque
                          define el ejercicio presupuestal y qué significa cada tipo.

                          Solo se oculta el SUBTÍTULO: las cuatro tarjetas siguen ahí
                          con su icono y su nombre, y `desc` se sigue definiendo en el
                          arreglo de arriba (no se borró ningún texto).

                      <div style={{fontSize:10,color:C.grayMid,marginTop:3}}>{t.desc}</div>
                      */}
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Bloque de origen: el select de Clonar, o las dos tarjetas de
                  "+ Nuevo presupuesto" (plantilla / desde cero).
                  Posición actual (Luis, 02-sep-2026): "cómo quieres iniciar este
                  proceso... debería ir debajo de este tipo de presupuesto" — va
                  DESPUÉS de las tarjetas de Tipo y es el último bloque del
                  formulario, justo arriba de Continuar. Sigue el orden del flujo:
                  primero qué presupuesto es, después de dónde arranca.
                  Antes vivía debajo de las fechas y ANTES de Tipo (punto 8 de
                  spec-navegación-retro-410); ese requisito queda superado por
                  este.
                  Las dos veces fue lo mismo: reubicar el JSX tal cual dentro de la
                  rejilla. Cero lógica nueva — mismo estado, mismos handlers. */}
              <div style={{gridColumn:"1 / -1"}}>
                {!modoEdit && form.tipo&&(viaClonar?(()=>{
                  // El tipo ya no se puede cambiar aquí (hereda del origen, ver bloque
                  // de Tipo de presupuesto) — el texto ya no habla de "cambiar el tipo".
                  // El select tampoco se ofrece a sí mismo: excluye el presupuesto que
                  // ya es el origen actual (origenReal), para no permitir "copiar de
                  // Cuervito (copia)" mientras ya se está copiando de Cuervito (copia) —
                  // evita encadenar copias de copias sin darse cuenta.
                  const origenesDelTipo = presupuestosGuardados.filter(p=>p.tipo===form.tipo && p.nombre!==origenReal?.nombre);
                  return(
                  <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
                    overflow:"hidden",marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                    <div style={{padding:"16px 24px",borderBottom:`1px solid ${C.line}`,
                      borderLeft:`3px solid ${C.yellowDark}`}}>
                      <div style={{fontWeight:700,fontSize:14,color:C.grayDark}}>Presupuesto de origen</div>
                      <div style={{fontSize:12,color:C.grayMid,marginTop:3}}>
                        De cuál presupuesto se está copiando — solo se muestran otros presupuestos guardados de tipo <strong style={{textTransform:"capitalize"}}>{form.tipo}</strong>.
                      </div>
                    </div>
                    <div style={{padding:"16px 24px"}}>
                      {cargandoGuardados&&(
                        <div style={{fontSize:12,color:C.grayMid}}>Cargando…</div>
                      )}
                      {!cargandoGuardados&&origenesDelTipo.length===0&&(
                        <div style={{fontSize:12,color:C.grayMid}}>
                          No hay otros presupuestos guardados de tipo <strong style={{textTransform:"capitalize"}}>{form.tipo}</strong> — continúa y captura las áreas manualmente.
                        </div>
                      )}
                      {!cargandoGuardados&&origenesDelTipo.length>0&&(
                        <select value=""
                          onChange={e=>{
                            const elegido=origenesDelTipo.find(p=>p.id===e.target.value);
                            if(elegido) partirDePresupuestoAnterior(elegido);
                          }}
                          className="sel-brand"
                          style={{width:"100%",maxWidth:420,padding:"9px 12px",border:`1px solid ${C.grayBorder}`,
                            borderRadius:8,fontSize:13,background:C.white}}>
                          <option value="" disabled>Cambiar a otro presupuesto de origen…</option>
                          {origenesDelTipo.map(p=>(
                            <option key={p.id} value={p.id}>{p.nombre}{p.fechaInicio?` · ${p.fechaInicio}`:""}</option>
                          ))}
                        </select>
                      )}
                      {origenReal&&(
                        <div style={{marginTop:10,fontSize:11,color:C.yellowDark,fontWeight:600}}>
                          ✓ Copiando de "{origenReal.nombre}" — editable antes de guardar
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })():(
                  <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
                    overflow:"hidden",marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                    <div style={{padding:"16px 24px",borderBottom:`1px solid ${C.line}`,
                      borderLeft:`3px solid ${C.yellowDark}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:C.grayDark}}>¿Cómo quieres iniciar este presupuesto?</div>
                        <div style={{fontSize:12,color:C.grayMid,marginTop:3}}>
                          Parte de un presupuesto anterior o comienza con secciones vacías.
                        </div>
                      </div>
                    </div>
                    <div className="base-opciones" style={{padding:"16px 24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      {/* Opción A: partir de presupuesto anterior */}
                      <div onClick={()=>setPlantModal(true)}
                        style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",
                          border:`2px solid`,borderColor:(plantKey||origenReal)?C.yellow:C.grayBorder,
                          borderRadius:10,cursor:"pointer",background:(plantKey||origenReal)?C.yellowLight:C.white,
                          transition:"all 0.15s"}}
                        onMouseEnter={e=>{if(!plantKey&&!origenReal)e.currentTarget.style.borderColor=C.yellow;}}
                        onMouseLeave={e=>{if(!plantKey&&!origenReal)e.currentTarget.style.borderColor=C.grayBorder;}}>
                        <span style={{fontSize:28}}>📋</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:C.grayDark}}>
                            {plantKey?`✓ ${PLANTILLAS[plantKey]?.nombre}`:origenReal?`✓ ${origenReal.nombre}`:"Partir de un presupuesto anterior"}
                          </div>
                          <div style={{fontSize:11,color:C.grayMid,marginTop:3}}>
                            {plantKey
                              ?`${PLANTILLAS[plantKey]?.capex?.length} CAPEX · ${PLANTILLAS[plantKey]?.opex?.length} OPEX cargados — editables`
                              :origenReal
                                ?`${origenReal.capex} CAPEX · ${origenReal.opex} OPEX copiados — editables`
                                :"Carga partidas de Cuervito, TI u otro proyecto existente"}
                          </div>
                        </div>
                      </div>
                      {/* Opción B: desde cero */}
                      <div onClick={()=>{setCapexPM([]);setOpexPM([]);setPlantKey(null);setOrigenReal(null);
                        setAreas([]);setCostos({});setIngresos(Array(13).fill(0));setPrecioFijo(0);setIngAd([]);}}
                        style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",
                          border:`2px solid`,borderColor:!plantKey&&form.tipo?C.grayDark:C.grayBorder,
                          borderRadius:10,cursor:"pointer",background:!plantKey&&form.tipo?"#F8F8F8":C.white,
                          transition:"all 0.15s"}}
                        onMouseEnter={e=>{if(plantKey)e.currentTarget.style.borderColor=C.grayDark;}}
                        onMouseLeave={e=>{if(plantKey)e.currentTarget.style.borderColor=C.grayBorder;}}>
                        <span style={{fontSize:28}}>✏️</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:C.grayDark}}>Iniciar desde cero</div>
                          <div style={{fontSize:11,color:C.grayMid,marginTop:3}}>Secciones vacías — agregas cada partida manualmente</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Fila de botones del formulario (Luis, 02-sep-2026): antes estaba
            arriba, junto al título; ahora es lo último de la pantalla, después
            de "¿Cómo quieres iniciar este presupuesto?". Mismos handlers y misma
            validación que tenían arriba — guardarPres sigue exigiendo nombre,
            tipo, unidad de negocio (al crear) y las dos fechas, y sigue activando
            los avisos en rojo sin navegar cuando falta alguno. */}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginBottom:24}} className="noprint">
          {btn("Cancelar",()=>setStep(0),"secondary")}
          {btn(modoEdit?"Guardar":"Continuar",guardarPres,"primary")}
        </div>

        {/* Modal plantillas */}
        {plantModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:C.white,borderRadius:12,padding:32,maxWidth:560,width:"90%",
              boxShadow:"0 16px 48px rgba(0,0,0,0.2)"}}>
              <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:C.grayDark}}>Selecciona una plantilla</h3>
              <p style={{margin:"0 0 24px",fontSize:13,color:C.grayMid}}>
                Para presupuestos de tipo <strong style={{textTransform:"capitalize"}}>{form.tipo}</strong>.
              </p>
              <div style={{display:"grid",gap:10}}>
                {sug.map(pl=>(
                  <div key={pl.key} onClick={()=>cargarPlantilla(pl.key)}
                    style={{border:"2px solid",borderColor:plantKey===pl.key?C.yellow:C.grayBorder,
                      borderRadius:10,padding:18,cursor:"pointer",
                      background:plantKey===pl.key?C.yellowLight:C.white,transition:"all 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.yellow}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=plantKey===pl.key?C.yellow:C.grayBorder}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,color:C.grayDark}}>{pl.icon} {pl.nombre}</div>
                        <div style={{fontSize:12,color:C.grayMid,marginTop:4}}>{pl.desc}</div>
                        <div style={{fontSize:11,color:C.yellowDark,marginTop:6,fontWeight:600}}>
                          {pl.capex.length} CAPEX · {pl.opex.length} OPEX
                        </div>
                      </div>
                      <span style={{fontSize:22,color:C.yellow}}>→</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Presupuestos guardados reales (Supabase) — solo lectura, no altera plantillas fijas.
                  Se filtran por el mismo tipo del presupuesto que se está creando: partir de un
                  presupuesto de Servicio no tiene sentido para uno de Departamento. */}
              {supabase&&(()=>{
                const guardadosDelTipo = presupuestosGuardados.filter(p=>p.tipo===form.tipo);
                return (
                <div style={{marginTop:16}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.grayDark,marginBottom:8}}>
                    Presupuestos guardados de tipo <span style={{textTransform:"capitalize"}}>{form.tipo}</span>
                  </div>
                  {cargandoGuardados&&(
                    <div style={{fontSize:12,color:C.grayMid,padding:"8px 0"}}>Cargando…</div>
                  )}
                  {!cargandoGuardados&&guardadosDelTipo.length===0&&(
                    <div style={{fontSize:12,color:C.grayMid,padding:"8px 0"}}>
                      {presupuestosGuardados.length===0
                        ?"Aún no hay presupuestos guardados en Supabase."
                        :<>No hay presupuestos guardados de tipo <strong style={{textTransform:"capitalize"}}>{form.tipo}</strong> — puedes iniciar desde cero.</>}
                    </div>
                  )}
                  {!cargandoGuardados&&guardadosDelTipo.length>0&&(
                    <div style={{display:"grid",gap:8,maxHeight:200,overflowY:"auto"}}>
                      {guardadosDelTipo.map(p=>(
                        <div key={p.id} onClick={()=>partirDePresupuestoAnterior(p)}
                          style={{border:"1px solid",borderColor:origenReal?.nombre===p.nombre?C.yellow:C.grayBorder,
                            borderRadius:8,padding:"10px 14px",cursor:"pointer",
                            background:origenReal?.nombre===p.nombre?C.yellowLight:C.white,
                            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:13,color:C.grayDark}}>{p.nombre}</div>
                            <div style={{fontSize:11,color:C.grayMid,marginTop:2,textTransform:"capitalize"}}>
                              {/* Fase 1.7 — se quita "· {p.estado}" de esta línea */}
                              {p.tipo} {p.fechaInicio?`· ${p.fechaInicio}`:""}
                            </div>
                          </div>
                          <span style={{fontSize:18,color:C.yellow}}>→</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {origenReal&&(
                    <div style={{marginTop:8,fontSize:11,color:C.yellowDark,fontWeight:600}}>
                      ✓ Partiendo de "{origenReal.nombre}" — {origenReal.capex} CAPEX · {origenReal.opex} OPEX copiados (editables)
                    </div>
                  )}
                </div>
                );
              })()}
              <div style={{marginTop:16,padding:"12px 16px",background:"#F8F8F8",borderRadius:8,border:`1px solid ${C.grayBorder}`}}>
                <div style={{fontSize:12,fontWeight:700,color:C.grayDark,marginBottom:6}}>¿Prefieres empezar desde cero?</div>
                <div style={{fontSize:11,color:C.grayMid,marginBottom:10}}>Las secciones de captura iniciarán vacías. Tú agregas cada partida manualmente.</div>
                <button onClick={()=>{
                  // LIMPIAR todo al iniciar desde cero
                  setCapexPM([]); setOpexPM([]); setPlantKey(null); setOrigenReal(null);
                  setAreas([]); setCostos({}); setIngresos(Array(13).fill(0)); setPrecioFijo(0); setIngAd([]);
                  setPlantModal(false);
                }}
                  style={{padding:"9px 20px",background:C.white,border:`1px solid ${C.grayBorder}`,
                    borderRadius:8,cursor:"pointer",fontSize:13,color:C.grayDark,fontWeight:600}}>
                  Iniciar desde cero — secciones vacías
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ,[{label:"Presupuestos",onClick:()=>setStep(0)},{label:nombreProy}]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — ÁREAS / PARTICIPANTES
  // ══════════════════════════════════════════════════════════════════════════
  if(step===2){
    const cats=getAreasCat(pres?.tipo||form?.tipo);
    const tipoLabel={"instalacion":"Instalación","servicio":"Servicio","departamento":"Departamento","suministro":"Suministro"};
    return wrap(
      <div style={{maxWidth:760}}>
        <div style={{marginBottom:28}}>
          <h2 style={{margin:"0 0 6px",fontSize:20,fontWeight:800,color:C.grayDark}}>Participantes</h2>
          <p style={{margin:0,color:C.grayMid,fontSize:14}}>
            Selecciona quién capturará costos · <strong>{tipoLabel[pres?.tipo]||pres?.tipo}</strong>
          </p>
        </div>
        <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
          padding:24,marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          {/* "Seleccionar todas" (Luis, 02-sep-2026): "Debería tener una opción de
              que elija... seleccionar todos para que no sea duplicado. Por si
              quieren todas."
              El "que no sea duplicado" es literal y es la parte que importa: al
              marcar se agregan SOLO las áreas que aún no están en `areas` (filtro
              !prev.includes), así que una ya seleccionada nunca entra dos veces.
              Al desmarcar se quitan solo las áreas de ESTE tipo de presupuesto
              (cats), no todo `areas`, para no borrar de paso un id heredado de otro
              tipo si alguna vez quedara uno.
              Estado maestro DERIVADO de `areas`, sin estado nuevo: si el usuario
              desmarca una tarjeta a mano, `todasSel` deja de ser true solo, y la
              casilla pasa a indeterminada. No toca cómo se guardan las áreas. */}
          {(()=>{
            const idsTipo=cats.map(a=>a.id);
            const todasSel=idsTipo.length>0 && idsTipo.every(id=>areas.includes(id));
            const algunaSel=idsTipo.some(id=>areas.includes(id));
            return(
              <label style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,
                padding:"10px 14px",border:`1px solid ${C.grayBorder}`,borderRadius:8,
                background:C.grayLight,cursor:"pointer",userSelect:"none"}}>
                <input type="checkbox" checked={todasSel}
                  ref={el=>{ if(el) el.indeterminate = algunaSel && !todasSel; }}
                  onChange={()=>setAreas(prev=>todasSel
                    ? prev.filter(id=>!idsTipo.includes(id))
                    : [...prev, ...idsTipo.filter(id=>!prev.includes(id))])}
                  style={{width:16,height:16,cursor:"pointer",accentColor:C.yellow}}/>
                <span style={{fontWeight:700,fontSize:13,color:C.grayDark}}>Seleccionar todas</span>
                <span style={{fontSize:11,color:C.grayMid}}>
                  {todasSel
                    ? `las ${idsTipo.length} áreas están seleccionadas`
                    : algunaSel
                      ? `${areas.filter(id=>idsTipo.includes(id)).length} de ${idsTipo.length}`
                      : `${idsTipo.length} áreas disponibles`}
                </span>
              </label>
            );
          })()}
          <div className="areas-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {cats.map(a=>{
              const sel=areas.includes(a.id);
              return(
                <div key={a.id}
                  onClick={()=>setAreas(prev=>sel?prev.filter(x=>x!==a.id):[...prev,a.id])}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",
                    border:"2px solid",borderColor:sel?C.yellow:C.grayBorder,
                    borderRadius:10,cursor:"pointer",background:sel?C.yellowLight:C.white,
                    transition:"all 0.15s",
                    boxShadow:sel?"0 0 0 3px rgba(221,172,0,0.12)":"none"}}>
                  <span style={{fontSize:20}}>{a.icon}</span>
                  <span style={{fontWeight:600,fontSize:13,color:C.grayDark,flex:1}}>{a.label}</span>
                  <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,
                    background:sel?C.yellow:"transparent",
                    border:`2px solid ${sel?C.yellow:C.grayBorder}`,
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {sel&&<span style={{fontSize:9,color:C.grayDark,fontWeight:900}}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {areas.length>0&&(
            <div style={{marginTop:16,padding:"10px 14px",background:C.yellowLight,
              border:`1px solid ${C.yellowBorder}`,borderRadius:8,fontSize:13,color:C.yellowDark}}>
              <strong>{areas.length}</strong> participante(s): {areas.map(id=>cats.find(a=>a.id===id)?.label).join(" · ")}
            </div>
          )}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {/* "Atrás" depende de cómo se llegó aquí. Durante la creación
              (flujoCreacion) el paso anterior es Datos generales, como siempre.
              Pero ahora también se llega desde Capturar costos, con el botón
              "Elegir participantes" de un presupuesto YA guardado: ahí el paso
              anterior es Capturar costos, no Datos generales — mandar a Step 1 un
              presupuesto guardado abriría la edición de nombre/tipo/fechas, que
              hoy es inalcanzable a propósito (A1 en docs/MD/DECISIONES.md) y
              cambiar fechaInicio recorre todas las columnas de mes de lo ya
              capturado. */}
          {btn("Atrás",()=>setStep(flujoCreacion?1:3),"secondary")}
          {btn("Confirmar",confirmarAreas,"primary",areas.length===0)}
        </div>
      </div>
    ,[{label:"Presupuestos",onClick:()=>setStep(0)},{label:nombreProy,onClick:irACapturarCostos},{label:"Áreas"}]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — CAPTURA
  // ══════════════════════════════════════════════════════════════════════════
  if(step===3){
    const cats=getAreasCat(pres?.tipo||"instalacion");
    const datos=areaActiva?costos[areaActiva]:null;
    const areaInfo=cats.find(a=>a.id===areaActiva);
    const capexA=areaActiva?totalCat(areaActiva,"capex"):0;
    const nomMes =areaActiva?totalNom(areaActiva):0;
    const opexA  =areaActiva?totalOpexAnualCat(areaActiva,"mat")+totalNomAnual(areaActiva)+totalOpexAnualCat(areaActiva,"via"):0;
    // Sección de ingresos movida aquí desde Resumen mensual (día de hoy) — se
    // necesitan NUM_MESES_OP/RANGO_ANIOS/MESES13/MESES13_MES/mIngresos/
    // totalIngresosAnual, que antes solo se calculaban en Step 4/5. Se llama a
    // calcularSerieMensual tal cual (no se toca la función, solo el punto desde
    // donde se le llama) — mismo patrón que ya usan Step 4 y Step 5.
    const {NUM_MESES_OP, RANGO_ANIOS, MESES13, MESES13_MES, mIngresos, totalIngresosAnual} =
      calcularSerieMensual({pres, areas, costos, capexPM, opexPM, ingresos, ingAdicionales});
    // PASO C — visibilidad por tipo: mismo criterio que ya usa esProyecto dentro
    // de calcularSerieMensual (línea ~390, no exportado en su return, así que se
    // recalcula aquí en vez de tocar esa función) — Servicio/Instalación sí,
    // Departamento/Suministro no.
    const mostrarIngresos = pres?.tipo==="instalacion"||pres?.tipo==="servicio";

    return wrap(
      <div>
        <style>{`.noprint{}.@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        {/* Fase 1.2/1.4 — Capturar costos no tenía encabezado propio: el nombre y el
            periodo del presupuesto no aparecían en ningún lado de esta pantalla, y
            tampoco había fila de botones (solo el "Guardar" verde al final). */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,maxWidth:1320}}>
          <div>
            {/* Spec navegación-retro-410 punto 7 — el título cambia según de dónde
                se llegue; la miga de pan sigue diciendo "Captura de información"
                siempre (ver tabla del punto 1). */}
            <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800,color:C.grayDark}}>
              {flujoCreacion?"Captura de información":`Editar — ${pres?.nombre||form?.nombre||""}`}
            </h2>
            {/* Encabezado en tres renglones (pedido de Luis, 02-sep-2026):
                  nombre / unidad de negocio / periodo.
                "GEOLIS SA DE CV" se quitó de la línea del nombre: la empresa es
                siempre la misma y robaba espacio. Sigue exportándose al Excel
                (exportarExcel, App.jsx:2512) — ahí no se toca.
                La unidad baja a renglón propio y SIN la etiqueta "Unidad:". Un
                presupuesto sin unidad (los viejos, en NULL) NO pinta el renglón:
                ni "—" ni hueco. Mismo bloque en las tres pantallas. */}
            <div style={{fontSize:13,color:C.grayMid}}>{pres?.nombre}</div>
            {pres?.unidadNegocio&&(
              <div style={{fontSize:13,color:C.grayDark,fontWeight:600,marginTop:2}}>{etiquetaUnidad(pres.unidadNegocio)}</div>
            )}
            {pres?.fechaInicio&&(()=>{
              const nMesesOp=calcularNumMesesOp(pres.fechaInicio,pres.fechaFin);
              return(
                <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>
                  Periodo: <strong>{mesLabelReal(0,pres.fechaInicio)} – {mesLabelReal(nMesesOp,pres.fechaInicio)}</strong> · {nMesesOp+1} meses
                </div>
              );
            })()}
          </div>
          {/* Citas del cliente — "Tampoco activa", "Estos dos tampoco": mientras el
              presupuesto no exista todavía, estos dos accesos van atenuados y no
              clicables. Lo que cambió el 02-sep-2026 es CUÁNDO deja de estar
              atenuado.
                ANTES: solo `flujoCreacion`, que únicamente se apaga al ENTRAR a un
              presupuesto ya existente (Ver / Editar / miga de pan). En una captura
              nueva no se apagaba nunca: se podía guardar diez veces y los botones
              seguían grises hasta salir y volver a entrar.
                AHORA: `flujoCreacion && !resumenDesbloqueado`. El desbloqueo lo
              prende guardarTodo en su rama de ÉXITO, el mismo evento que dispara
              «Costos guardados correctamente», y no se vuelve a apagar mientras se
              trabaja ese presupuesto. Un presupuesto que ya traía datos guardados
              sigue abriendo habilitado sin guardar de nuevo, porque esas tres rutas
              ya ponen flujoCreacion en false — ese caso no necesitó código.

              TAREA 8, PASO 3 (fusión de las dos vistas): «Resumen mensual →» es el
              botón que SOBREVIVE — cuando «Información general» salga del menú,
              este queda como único destino. Por eso los dos comparten una sola
              condición ya calculada (accesosBloqueados) en vez de repetirla: ese
              día se borra el renglón de «← Información general» y ya. No hay que
              rehacer nada de esta lógica. */}
          {(()=>{
            const accesosBloqueados = flujoCreacion && !resumenDesbloqueado;
            const motivo = accesosBloqueados ? "Guarda primero para ver el resumen" : undefined;
            return(
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}} className="noprint">
                <div style={{display:"flex",gap:10}}>
                  {/* Tarea 8 paso 3: aquí iba también un botón "← Información
                      general". Se fue con la vista. Como estaba previsto desde el
                      paso 1, fue borrar el renglón: la condición compartida
                      accesosBloqueados no se tocó. */}
                  {btn("Resumen mensual →",()=>setStep(4),"secondary",accesosBloqueados,motivo)}
                </div>
                {/* El tooltip solo aparece al pasar el mouse; el texto chico se ve
                    siempre que estén bloqueados, que es cuando hace falta. */}
                {accesosBloqueados&&(
                  <div style={{fontSize:11,color:C.grayMid}}>Guarda primero para ver el resumen</div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── SECCIÓN: Captura de ingresos — movida de Resumen mensual (pantalla de
            visualización, sin botón Guardar, por eso no persistía) a Capturar
            costos. Bloque fijo, UNA SOLA VEZ por presupuesto, no por área — por
            eso vive aquí arriba del selector de áreas, fuera de capture-grid, en
            vez de dentro del panel que cambia según areaActiva. Mismo JSX que
            tenía Resumen mensual (incluye el fix del rótulo del selector de
            mes). Ya NO tiene su propio botón "Guardar" — se guarda junto con
            el resto de la pantalla en el único botón guardarTodo, después de
            Viáticos (fusión de hoy).
            PASO C — oculta por completo para Departamento/Suministro
            (mostrarIngresos), que no facturan. */}
        {mostrarIngresos&&(
        <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
          padding:24,marginBottom:24,boxShadow:"0 1px 4px rgba(0,0,0,0.04)",maxWidth:1320}}>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:3,height:18,background:C.yellow,borderRadius:2}}/>
              <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.grayDark}}>Facturación</h3>
            </div>
            <div style={{fontSize:11,color:C.grayMid,marginTop:4,marginLeft:13}}>
              Precio fijo mensual del servicio × meses del proyecto. Puedes agregar facturación adicional en meses específicos.
            </div>
          </div>

          {/* Precio fijo mensual */}
          <div style={{background:C.successLight,border:`1px solid #bbf7d0`,borderRadius:10,padding:18,marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,color:C.success,marginBottom:12}}>
              Precio fijo del servicio (mensual)
            </div>
            <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div style={{width:220,maxWidth:220,flexShrink:0}}>
                <div style={{fontSize:11,color:C.grayMid,marginBottom:6}}>Monto a facturar por mes</div>
                <MoneyInput value={precioFijo} onChange={v=>{
                  setPrecioFijo(v);
                  // Distribuir automáticamente en M1..Mn (n = duración real del proyecto,
                  // de 6 meses a 20 años — ya no se recorta a 12)
                  const meses=calcularNumMesesOp(pres?.fechaInicio, pres?.fechaFin);
                  const n=Array(meses+1).fill(0);
                  for(let i=1;i<=meses;i++) n[i]=v;
                  setIngresos(n);
                }}/>
              </div>
              <div style={{textAlign:"center",padding:"10px 20px",background:C.white,borderRadius:8,border:`1px solid #bbf7d0`}}>
                <div style={{fontSize:10,color:C.grayMid,marginBottom:4}}>Total proyectado</div>
                <div style={{fontSize:18,fontWeight:800,color:C.success}}>{fmt(totalIngresosAnual)}</div>
                <div style={{fontSize:10,color:C.grayMid,marginTop:2}}>
                  {fmt(precioFijo)} × {mIngresos.filter(v=>v>0).length} meses
                </div>
              </div>
              <button onClick={()=>{setPrecioFijo(0);setIngresos(Array(13).fill(0));}}
                style={{padding:"8px 16px",background:C.white,border:`1px solid ${C.grayBorder}`,
                  borderRadius:6,cursor:"pointer",fontSize:12,color:C.grayMid}}>
                Limpiar
              </button>
            </div>
          </div>

          {/* Ingresos — este es el mecanismo principal de facturación, no un
              extra; se renombró hoy (antes "Ingreso por mes", con subtítulo de
              ejemplos de "extraordinarios" que ya no aplica). */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:C.grayDark}}>Facturación</div>
                <div style={{fontSize:11,color:C.grayMid}}>Captura la facturación de cada mes. Si el monto es igual todos los meses, usa el precio fijo de arriba; si varía, agrega cada mes por separado aquí.</div>
              </div>
              <button onClick={()=>setIngAd(prev=>[...prev,{id:uid(),mes:1,anio:new Date().getFullYear(),monto:0,desc:"Renovación de contrato"}])}
                style={{padding:"7px 16px",background:C.yellow,border:"none",borderRadius:7,
                  cursor:"pointer",fontSize:12,fontWeight:700,color:C.grayDark,whiteSpace:"nowrap"}}>
                + Agregar facturación
              </button>
            </div>
            {ingAdicionales.length===0&&(
              <div style={{padding:"14px 16px",background:"#F8F8F8",borderRadius:8,
                border:`1px dashed ${C.grayBorder}`,fontSize:12,color:C.grayMid,textAlign:"center"}}>
                Sin facturación adicional — solo el precio fijo mensual
              </div>
            )}
            {ingAdicionales.map((ing,idx)=>(
              <div key={ing.id} style={{display:"grid",gridTemplateColumns:"110px 90px 1fr 160px 32px",
                gap:10,alignItems:"end",padding:"10px 0",
                borderBottom:idx<ingAdicionales.length-1?`1px solid ${C.line}`:"none"}}>
                <div>
                  <div style={{fontSize:10,color:C.grayMid,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Mes *</div>
                  <select value={ing.mes} onChange={e=>setIngAd(prev=>prev.map(x=>x.id===ing.id?{...x,mes:parseInt(e.target.value)}:x))}
                    className="sel-brand"
                    style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12,background:C.white}}>
                    {Array.from({length:NUM_MESES_OP},(_,i)=>i+1).map(m=>{
                      const real=nombreMesReal(m,pres?.fechaInicio);
                      return(
                        <option key={m} value={m}>M{m}{real?` · ${real}`:""}</option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.grayMid,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Año *</div>
                  <select value={ing.anio}
                    onChange={e=>setIngAd(prev=>prev.map(x=>x.id===ing.id?{...x,anio:parseInt(e.target.value)}:x))}
                    className="sel-brand"
                    style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12,background:C.white}}>
                    {RANGO_ANIOS.map(y=>(
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.grayMid,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Descripción</div>
                  <input value={ing.desc} onChange={e=>setIngAd(prev=>prev.map(x=>x.id===ing.id?{...x,desc:e.target.value}:x))}
                    placeholder="Ej. Renovación de contrato"
                    style={{width:"100%",padding:"7px 12px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:C.grayMid,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Monto</div>
                  <MoneyInput value={ing.monto} onChange={v=>setIngAd(prev=>prev.map(x=>x.id===ing.id?{...x,monto:v}:x))}/>
                </div>
                <button onClick={()=>setIngAd(prev=>prev.filter(x=>x.id!==ing.id))}
                  style={{background:C.dangerLight,color:C.danger,border:"none",borderRadius:6,
                    padding:"6px 8px",cursor:"pointer",fontSize:16,height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            ))}
            {ingAdicionales.length>0&&(
              <div style={{marginTop:8,textAlign:"right",fontSize:12,color:C.grayMid}}>
                Total adicionales: <strong style={{color:C.success}}>{fmt(ingAdicionales.reduce((s,x)=>s+x.monto,0))}</strong>
              </div>
            )}
          </div>

          {/* Tabla resumen M0-M12 */}
          <ScrollHint minWidth={800}>
            <table style={{borderCollapse:"collapse",fontSize:11,width:"100%"}}>
              <thead>
                <tr style={{background:"#059669"}}>
                  <td style={{padding:"8px 14px",fontWeight:700,color:C.white,minWidth:140}}>Concepto</td>
                  {MESES13.map((m,i)=>(
                    <td key={i} style={{padding:"4px 4px",textAlign:"right",minWidth:58}}>
                      <div style={{fontSize:9,fontWeight:600,opacity:0.7,color:"rgba(255,255,255,0.7)"}}>{m}</div>
                      <div style={{fontSize:11,fontWeight:700,color:C.white}}>{MESES13_MES[i]}</div>
                    </td>
                  ))}
                  <td style={{padding:"6px 12px",textAlign:"right",fontWeight:700,color:C.white}}>Total</td>
                </tr>
              </thead>
              <tbody>
                {/* Fila "+ Adicionales" eliminada — mostraba solo la porción de
                    ingAdicionales, que mIngresos/totalIngresosAnual ya incluyen.
                    Con precioFijo=0 daba el mismo total que esta fila, aparentando
                    una suma duplicada sin serlo. Se llamó FACTURACIÓN, luego
                    INGRESOS para combinar con el título de sección, y vuelve a
                    FACTURACIÓN el 2026-08-31 con el título. mIngresos/
                    totalIngresosAnual sin cambios en ninguno de los tres pasos. */}
                <tr style={{background:C.successLight}}>
                  <td style={{padding:"8px 14px",fontWeight:700,color:C.success}}>FACTURACIÓN</td>
                  {mIngresos.map((v,i)=>(
                    <td key={i} style={{padding:"5px 4px",textAlign:"right",
                      color:v>0?C.success:C.grayBorder,fontWeight:v>0?600:400}}>
                      {v>0?fmtK(v):"—"}
                    </td>
                  ))}
                  <td style={{padding:"6px 12px",textAlign:"right",fontWeight:800,color:C.success}}>{fmt(totalIngresosAnual)}</td>
                </tr>
              </tbody>
            </table>
          </ScrollHint>
        </div>
        )}

        <div className="capture-grid" style={{display:"grid",gridTemplateColumns:"200px minmax(0,1fr)",gap:28,maxWidth:1320}}>

          {/* Sidebar áreas */}
          <div style={{minWidth:0}}>
            <div style={{fontSize:10,fontWeight:700,color:C.grayMid,
              textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>
              Participantes
            </div>
            <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,
              borderRadius:10,overflow:"hidden",
              boxShadow:"0 1px 4px rgba(0,0,0,0.05)",marginBottom:14}}>
              {areas.map((id,i)=>{
                const a=cats.find(x=>x.id===id);
                const est=costos[id]?.estado||"pendiente";
                const isAct=areaActiva===id;
                return(
                  <div key={id} onClick={()=>setActiva(id)}
                    style={{display:"flex",alignItems:"center",gap:12,
                      padding:"14px 16px",cursor:"pointer",
                      background:isAct?"#FFFBEF":"transparent",
                      borderLeft:isAct?`3px solid ${C.yellow}`:"3px solid transparent",
                      borderBottom:i<areas.length-1?`1px solid ${C.line}`:"none",
                      transition:"all 0.12s"}}>
                    <span style={{fontSize:16}}>{a?.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:isAct?700:500,
                        color:C.grayDark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a?.label}</div>
                      <div style={{fontSize:10,marginTop:1,
                        color:est==="guardado"?C.success:C.grayMid}}>
                        {est==="guardado"?"✓ Guardado":"Pendiente"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Totales sidebar — mismo lenguaje de color que los KPIs de arriba */}
            <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,
              borderRadius:12,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{fontSize:10,fontWeight:700,color:C.grayMid,
                textTransform:"uppercase",letterSpacing:0.5,marginBottom:14}}>Totales del presupuesto</div>
              {[{l:"CAPEX",v:totalCAPEX,c:C.yellowDark,bg:C.yellowLight},
                {l:"OPEX",v:totalOPEX,c:"#374151",bg:C.grayLight}].map(r=>(
                <div key={r.l} style={{background:r.bg,border:`1px solid ${r.c}22`,
                  borderRadius:10,padding:"13px 16px",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:r.c,textTransform:"uppercase",letterSpacing:0.3}}>{r.l}</div>
                  <div style={{fontSize:17,fontWeight:800,color:r.c,marginTop:4}}>{fmt(r.v)}</div>
                </div>
              ))}
              <div style={{background:C.dangerLight,border:`1px solid ${C.danger}22`,
                borderRadius:10,padding:"13px 16px",marginTop:4}}>
                <div style={{fontSize:10,fontWeight:700,color:C.danger,textTransform:"uppercase",letterSpacing:0.3}}>Total egresos</div>
                <div style={{fontSize:18,fontWeight:800,color:C.danger,marginTop:4}}>{fmt(totalEgr)}</div>
              </div>
            </div>
          </div>

          {/* Panel captura */}
          <div style={{minWidth:0}}>
            {/* Presupuesto guardado con CERO áreas — antes esta pantalla no lo
                distinguía de "no has seleccionado un área todavía": el sidebar
                salía vacío y no había ningún camino de UI para agregarlas
                (setStep(2) solo existía en guardarPres, o sea únicamente durante
                la creación). Un presupuesto que se abandonaba en el paso de
                Participantes quedaba inservible para siempre. Esta rama va ANTES
                que la de !areaActiva a propósito: con areas vacío, un areaActiva
                heredado de otro presupuesto pintaba las cuatro secciones como si
                todo estuviera bien y "+ Agregar" tronaba en silencio (addP hace
                prev[id][cat] sobre un costos[areaActiva] inexistente). */}
            {areas.length===0?(
              <div style={{padding:"48px 40px",textAlign:"center",
                background:C.white,borderRadius:10,border:`1px solid ${C.yellowBorder}`}}>
                <div style={{fontSize:36,marginBottom:14}}>👥</div>
                <div style={{fontSize:15,fontWeight:700,color:C.grayDark,marginBottom:8}}>
                  Este presupuesto todavía no tiene participantes
                </div>
                <div style={{fontSize:13,color:C.grayMid,marginBottom:20,lineHeight:1.6}}>
                  No se puede capturar ningún costo hasta elegir al menos un área.<br/>
                  Elígelas y regresas aquí a capturar.
                </div>
                {btn("Elegir participantes",()=>setStep(2),"primary")}
              </div>
            ):!areaActiva?(
              <div style={{padding:"60px 40px",textAlign:"center",color:C.grayMid,
                background:C.white,borderRadius:10,border:`1px solid ${C.grayBorder}`}}>
                <div style={{fontSize:36,marginBottom:12,opacity:0.3}}>←</div>
                <div style={{fontSize:14}}>Selecciona un participante para capturar sus costos</div>
              </div>
            ):(
              <div>
                {/* Header área */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:24}}>{areaInfo?.icon}</span>
                    <div>
                      <h3 style={{margin:0,fontSize:18,fontWeight:800,color:C.grayDark}}>{areaInfo?.label}</h3>
                      <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>{pres?.nombre}</div>
                    </div>
                  </div>
                  <Badge label={datos?.estado==="guardado"?"✓ Guardado":"En captura"}
                    color={datos?.estado==="guardado"?C.success:C.yellowDark}
                    bg={datos?.estado==="guardado"?C.successLight:C.yellowLight}/>
                </div>

                {/* KPIs área */}
                <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:26}}>
                  {[
                    {l:"CAPEX del área",  v:capexA, c:"#7c3aed",bg:"#faf5ff"},
                    {l:"OPEX del área",   v:opexA,  c:"#0891b2",bg:"#f0f9ff"},
                    {l:"Total",           v:capexA+opexA,c:C.grayDark,bg:C.grayLight},
                  ].map(k=>(
                    <div key={k.l} style={{background:k.bg,border:`1px solid ${k.c}18`,
                      borderRadius:10,padding:"16px 18px"}}>
                      <div style={{fontSize:10.5,fontWeight:700,color:k.c,
                        textTransform:"uppercase",letterSpacing:0.3}}>{k.l}</div>
                      <div style={{fontSize:19,fontWeight:800,color:k.c,marginTop:6}}>{fmt(k.v)}</div>
                    </div>
                  ))}
                </div>

                {/* CAPEX */}
                <SCard title="CAPEX · Equipos e inversiones" icon="🔧"
                  subtitle="Inversiones únicas: maquinaria, equipos, activos"
                  total={capexA} accentColor="#7c3aed">
                  {(()=>{
                    const sinFecha=(datos?.capex||[]).filter(p=>!p.mesGastoMes||!p.mesGastoAnio).length;
                    return sinFecha>0&&(
                      <div style={{marginBottom:12,padding:"9px 14px",background:C.yellowLight,
                        border:`1px solid ${C.yellowBorder}`,borderRadius:8,fontSize:12,color:C.yellowDark}}>
                        ⚠ {sinFecha} partida{sinFecha>1?"s":""} sin fecha de compra — no se reflejará{sinFecha>1?"n":""} correctamente en el Resumen mensual.
                      </div>
                    );
                  })()}
                  <PartidaTable
                    partidas={datos?.capex||[]}
                    onUpdate={u=>upP(areaActiva,"capex",u.id,u)}
                    onRemove={rmP(areaActiva,"capex")}
                    onAdd={()=>addP(areaActiva,"capex")}
                    catOptions={CAT_CAPEX}
                    addLabel="Agregar equipo / inversión"
                    headerColor="#7c3aed"
                    showMes={true} fechaInicioProyecto={pres?.fechaInicio} fechaFinProyecto={pres?.fechaFin}/>
                </SCard>

                {/* Nómina */}
                <SCard title="OPEX · Nómina y Mano de Obra" icon="👥"
                  subtitle="Costo real por puesto incluyendo cargas sociales"
                  total={totalNomAnual(areaActiva)} accentColor="#059669">
                  {/* Mismo aviso que el de "sin fecha de compra" de CAPEX, reusado
                      tal cual: un puesto sin tipo de personal aporta $0.00 y hay
                      que poder verlo sin revisar renglón por renglón. */}
                  {(()=>{
                    const sinTipo=(datos?.nomina||[]).filter(p=>!p.tipoPersonal).length;
                    return sinTipo>0&&(
                      <div style={{marginBottom:12,padding:"9px 14px",background:C.yellowLight,
                        border:`1px solid ${C.yellowBorder}`,borderRadius:8,fontSize:12,color:C.yellowDark}}>
                        ⚠ {sinTipo} puesto{sinTipo>1?"s":""} sin tipo de personal — no suma{sinTipo>1?"n":""} al costo anual.
                      </div>
                    );
                  })()}
                  <NominaTable
                    nomina={datos?.nomina||[]}
                    onUpdate={u=>upP(areaActiva,"nomina",u.id,u)}
                    onRemove={rmN(areaActiva)}
                    onAdd={()=>addN(areaActiva)}
                    numMesesProyecto={calcularNumMesesOp(pres?.fechaInicio,pres?.fechaFin)}/>
                  {nomMes>0&&<div style={{marginTop:10,fontSize:11,color:C.grayMid,textAlign:"right"}}>
                    Costo anual nómina: <strong style={{color:"#059669"}}>{fmt(totalNomAnual(areaActiva))}</strong>
                  </div>}
                </SCard>

                {/* Materiales */}
                <SCard title="OPEX · Materiales" icon="📦"
                  subtitle="Materiales e insumos recurrentes — Unidad = naturaleza del bien (Servicio, Pieza...) · Periodicidad = cada cuánto se repite"
                  total={totalOpexAnualCat(areaActiva,"mat")} accentColor="#0891b2">
                  {/* Mismo aviso reusado: sin periodicidad la partida no se
                      distribuye en ningún mes y aporta $0.00. */}
                  {(()=>{
                    const sinPer=(datos?.mat||[]).filter(p=>!p.periodicidad).length;
                    return sinPer>0&&(
                      <div style={{marginBottom:12,padding:"9px 14px",background:C.yellowLight,
                        border:`1px solid ${C.yellowBorder}`,borderRadius:8,fontSize:12,color:C.yellowDark}}>
                        ⚠ {sinPer} partida{sinPer>1?"s":""} sin periodicidad — no se distribuirá{sinPer>1?"n":""} en el Resumen mensual.
                      </div>
                    );
                  })()}
                  <PartidaTable
                    partidas={datos?.mat||[]}
                    onUpdate={u=>upP(areaActiva,"mat",u.id,u)}
                    onRemove={rmP(areaActiva,"mat")}
                    onAdd={()=>addP(areaActiva,"mat")}
                    catOptions={CAT_OPEX_MAT}
                    addLabel="Agregar material"
                    headerColor="#0891b2"
                    showPeriod={true} fechaInicioProyecto={pres?.fechaInicio} fechaFinProyecto={pres?.fechaFin} numMesesOpProyecto={calcularNumMesesOp(pres?.fechaInicio,pres?.fechaFin)}/>
                </SCard>

                {/* Viáticos */}
                <SCard title="OPEX · Viáticos" icon="🧳"
                  subtitle="Viáticos, hospedaje y gastos de campo · Unidad = Día o Viaje · Periodicidad = con qué frecuencia"
                  total={totalOpexAnualCat(areaActiva,"via")} accentColor="#d97706">
                  {/* Mismo aviso reusado, ver Materiales. */}
                  {(()=>{
                    const sinPer=(datos?.via||[]).filter(p=>!p.periodicidad).length;
                    return sinPer>0&&(
                      <div style={{marginBottom:12,padding:"9px 14px",background:C.yellowLight,
                        border:`1px solid ${C.yellowBorder}`,borderRadius:8,fontSize:12,color:C.yellowDark}}>
                        ⚠ {sinPer} partida{sinPer>1?"s":""} sin periodicidad — no se distribuirá{sinPer>1?"n":""} en el Resumen mensual.
                      </div>
                    );
                  })()}
                  <PartidaTable
                    partidas={datos?.via||[]}
                    onUpdate={u=>upP(areaActiva,"via",u.id,u)}
                    onRemove={rmP(areaActiva,"via")}
                    onAdd={()=>addP(areaActiva,"via")}
                    catOptions={CAT_OPEX_VIA}
                    addLabel="Agregar viático"
                    headerColor="#d97706"
                    showPeriod={true} fechaInicioProyecto={pres?.fechaInicio} fechaFinProyecto={pres?.fechaFin} numMesesOpProyecto={calcularNumMesesOp(pres?.fechaInicio,pres?.fechaFin)}/>
                </SCard>

                {/* Único botón "Guardar" de la pantalla (fusión de hoy) — junta
                    ingresos + esta área + todo lo demás en una sola llamada. */}
                <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                  {btn(guardando?"Guardando…":"Guardar",guardarTodo,"success",guardando)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    // Punto (b) — ya estamos en Capturar costos: [nombre] se muestra sin acción
    // (sin onClick), no ir a Step 3 sobre Step 3 mismo.
    ,[{label:"Presupuestos",onClick:()=>setStep(0)},{label:nombreProy},{label:"Captura de información"}]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4 — RESUMEN MENSUAL COMPLETO
  // ══════════════════════════════════════════════════════════════════════════
  if(step===4){
    // Cálculo mensual del presupuesto completo — compartido con Step 5, ver
    // calcularSerieMensual (mismos datos, mismos resultados, sin duplicar lógica).
    const {cats, NUM_MESES_OP, NMESES, MESES13, MESES13_MES, anioIniProy, anioFinProy, RANGO_ANIOS,
      mCapex, capexDetalle, mOpex, opexDetalle, sinCategoriaMacro, mEgresos, mIngresos,
      totalIngresosAnual, mFlujo, mFlujoAcum, catOpexSeries} = calcularSerieMensual({pres, areas, costos, capexPM, opexPM, ingresos, ingAdicionales});

    // Totales
    const totalCAPEX=mCapex.reduce((s,v)=>s+v,0);
    const totalOPEX=mOpex.reduce((s,v)=>s+v,0);
    const totalEgr=totalCAPEX+totalOPEX;
    const utilidad=totalIngresosAnual-totalEgr;
    const margen=totalIngresosAnual>0?((utilidad/totalIngresosAnual)*100):0;
    // PASO C — mismo criterio que Step 3 (esProyecto no sale del return de
    // calcularSerieMensual, se recalcula aquí en vez de tocar esa función):
    // Servicio/Instalación sí facturan, Departamento/Suministro no.
    const mostrarIngresos = pres?.tipo==="instalacion"||pres?.tipo==="servicio";

    // Tarea 8, paso 2 (03-sep-2026) — los mismos datos que ya armaba Información
    // general, con las mismas llamadas. Aquí no se calcula nada nuevo:
    // construirFilasServicio y los totales por área son las funciones que ya
    // existían; solo se las invoca también desde esta pantalla.
    const filasServicio=construirFilasServicio({pres, areas, costos, NMESES, mCapex, mEgresos,
      totalCAPEX, totalIngresosAnual, mIngresos, totalEgr});
    const areasDetalle=areas.map((id,ai)=>{
      const opexMat=totalOpexAnualCat(id,"mat"), opexVia=totalOpexAnualCat(id,"via"), nomAnual=totalNomAnual(id);
      const capexA=totalCat(id,"capex"), opexA=opexMat+nomAnual+opexVia;
      return {id, esUltima:ai===areas.length-1, datos:costos[id], areaInfo:cats.find(a=>a.id===id),
        capexA, nomMes:totalNom(id), opexA, totalArea:capexA+opexA, nomAnual, opexMat, opexVia};
    });

    // ── Helpers de render ──────────────────────────────────────────────────
    // 3er parámetro opcional className — hoy solo lo usan las dos tarjetas de
    // gráfica (className="chart-card"), para el break-inside:avoid del PDF (F1).
    // No cambia nada para el resto de las tarjetas (tablas, KPIs), que siguen
    // llamando card(children) o card(children,mb) igual que siempre.
    const card=(children,mb=16,className)=>(
      <div className={className} style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
        padding:24,marginBottom:mb,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>{children}</div>
    );
    const sTitle=(t,sub)=>(
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:3,height:18,background:C.yellow,borderRadius:2}}/>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,color:C.grayDark}}>{t}</h3>
        </div>
        {sub&&<div style={{fontSize:11,color:C.grayMid,marginTop:4,marginLeft:13}}>{sub}</div>}
      </div>
    );
    // ── Tabla mensual genérica ──────────────────────────────────────────────
    function TablaM({filas,showTotal=true,title}){
      const totMes=Array(NMESES).fill(0).map((_,i)=>filas.reduce((s,f)=>s+(f.datos[i]||0),0));
      const totGen=filas.reduce((s,f)=>s+f.datos.reduce((a,b)=>a+b,0),0);
      return(
        <ScrollHint>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:900}}>
            <thead>
              <tr style={{background:C.grayDark}}>
                <td style={{padding:"8px 14px",fontWeight:700,color:C.white,minWidth:160,position:"sticky",left:0,background:C.grayDark}}>Concepto</td>
                {/* Fase 1.6.b (corrección) — encabezado de dos líneas: código M{i} atenuado
                    arriba, nombre real del mes prominente abajo. key={i} porque con nombres
                    de mes puede haber repetidos en presupuestos de 13+ meses. */}
                {MESES13.map((m,i)=>(
                  <td key={i} style={{padding:"5px 4px",textAlign:"right",minWidth:62}}>
                    <div style={{fontSize:9,fontWeight:600,opacity:0.6,color:"#aaa"}}>{m}</div>
                    <div style={{fontSize:11,fontWeight:700,color:C.white}}>{MESES13_MES[i]}</div>
                  </td>
                ))}
                <td style={{padding:"7px 12px",textAlign:"right",fontWeight:700,color:C.white}}>Total</td>
              </tr>
            </thead>
            <tbody>
              {filas.map((f,fi)=>{
                const puedeExpandir=f.detalle&&f.detalle.length>0;
                const abierto=puedeExpandir&&!!expandidosServicio[f.label];
                return (
                <Fragment key={f.label}>
                <tr style={{background:fi%2===0?C.white:"#FAFAFA",borderBottom:`1px solid ${C.line}`}}>
                  <td style={{padding:"8px 14px",display:"flex",alignItems:"center",gap:8,position:"sticky",left:0,background:fi%2===0?C.white:"#FAFAFA"}}>
                    {puedeExpandir&&(
                      <span onClick={()=>setExpandidosServicio(prev=>({...prev,[f.label]:!prev[f.label]}))}
                        style={{cursor:"pointer",fontSize:9,color:C.grayMid,width:10,flexShrink:0,userSelect:"none"}}>
                        {abierto?"▼":"▶"}
                      </span>
                    )}
                    <div style={{width:8,height:8,borderRadius:2,background:f.color,flexShrink:0}}/>
                    <span style={{fontWeight:600,color:f.color,fontSize:11}}>{f.label}</span>
                  </td>
                  {f.datos.map((v,i)=>(
                    <td key={i} style={{padding:"7px 4px",textAlign:"right",
                      color:v>0?C.grayDark:v<0?C.danger:C.grayBorder,fontWeight:v!==0?600:400}}>
                      {v!==0?fmtK(v):"—"}
                    </td>
                  ))}
                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:700,color:f.color}}>
                    {/* Bug conocido corregido — una serie acumulada (f.acumulado=true,
                        ej. FLUJO ACUMULADO) no se "totaliza" sumando la serie: su total
                        es el último valor de la serie. Solo afecta filas marcadas así;
                        el resto sigue sumando igual que siempre. */}
                    {fmtK(f.acumulado ? f.datos[f.datos.length-1] : f.datos.reduce((s,v)=>s+v,0))}
                  </td>
                </tr>
                {abierto&&f.detalle.map((d,di)=>(
                  <tr key={f.label+"_det_"+di} style={{background:C.grayLight,fontSize:11,color:C.grayMid}}>
                    <td style={{padding:"5px 14px 5px 32px",position:"sticky",left:0,background:C.grayLight,color:C.grayMid}}>
                      {d.label}
                    </td>
                    {d.datos.map((v,i)=>(
                      <td key={i} style={{padding:"5px 4px",textAlign:"right",color:v>0?C.grayMid:C.grayBorder}}>
                        {v!==0?fmtK(v):"—"}
                      </td>
                    ))}
                    <td style={{padding:"5px 12px",textAlign:"right",color:C.grayMid}}>
                      {fmtK(d.datos.reduce((s,v)=>s+v,0))}
                    </td>
                  </tr>
                ))}
                </Fragment>
                );
              })}
              {showTotal&&(
                <tr style={{background:C.yellowLight,borderTop:`2px solid ${C.yellow}`}}>
                  <td style={{padding:"9px 14px",fontWeight:800,color:C.grayDark,position:"sticky",left:0,background:C.yellowLight}}>TOTAL</td>
                  {totMes.map((v,i)=>(
                    <td key={i} style={{padding:"7px 4px",textAlign:"right",fontWeight:700,
                      color:v>0?C.grayDark:v<0?C.danger:C.grayBorder}}>
                      {v!==0?fmtK(v):"—"}
                    </td>
                  ))}
                  <td style={{padding:"7px 12px",textAlign:"right",fontWeight:800,color:C.yellowDark}}>{fmtK(totGen)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollHint>
      );
    }

    return wrap(
      <div>
        <style>{`@media print{body *{visibility:hidden}#rpdf,#rpdf *{visibility:visible}#rpdf{position:absolute;left:0;top:0;width:100%}.noprint{display:none!important}}`}</style>

        <div id="rpdf">
          {/* Header — movido DENTRO de #rpdf (antes era hermano, fuera): con
              body *{visibility:hidden} + #rpdf,#rpdf *{visibility:visible}, todo lo
              que no fuera descendiente de #rpdf quedaba invisible al imprimir — el
              PDF exportado no traía nombre, periodo ni fechas. Los botones (dentro
              de la misma fila) siguen sin imprimirse porque ya tienen .noprint. */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
            <div>
              {/* 03-sep-2026, Luis: el título de la pantalla es el NOMBRE DEL
                  PRESUPUESTO. Antes había arriba un "Ver" que solo repetía de
                  dónde venías; el nombre estaba debajo, en gris pequeño. Ahora el
                  nombre ocupa el h2 y el "Ver" desaparece: a la vista se llega
                  desde el botón "Ver" del listado y la miga dice "Resumen", así
                  que la etiqueta no hacía falta en un tercer sitio.
                  Encabezado de tres renglones — ver nota en Capturar costos. */}
              <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800,color:C.grayDark}}>{pres?.nombre}</h2>
              {pres?.unidadNegocio&&(
                <div style={{fontSize:13,color:C.grayDark,fontWeight:600,marginTop:2}}>{etiquetaUnidad(pres.unidadNegocio)}</div>
              )}
              {/* Fase 1.6.a — línea de periodo, cero cálculo nuevo: reusa mesLabelReal
                  y calcularNumMesesOp, ya existentes. */}
              {pres?.fechaInicio&&(
                <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>
                  Periodo: <strong>{mesLabelReal(0,pres.fechaInicio)} – {mesLabelReal(NUM_MESES_OP,pres.fechaInicio)}</strong> · {NUM_MESES_OP+1} meses
                </div>
              )}
              {pres?.fechaElaboracion&&(
                <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>
                  Elaborado: <strong>{pres.fechaElaboracion}</strong>
                  {pres?.fechaInicio&&<> · Vigencia: {pres.fechaInicio} → {pres?.fechaFin||"—"}</>}
                </div>
              )}
            </div>
            {/* Fase 1.4 — fila de botones propia, sin depender de areaSaved; la barra
                pegajosa deja de repetir esta navegación. Spec navegación-retro-410
                punto 6 — se quita "Editar por área"; el botón de regreso ("←
                Información general") se queda: es el par recíproco del botón "Resumen
                mensual" de Información general. */}
            <div style={{display:"flex",gap:10}} className="noprint">
              {/* Solo cambia el texto (Luis, 03-sep-2026): sigue apuntando a
                  Capturar costos, que es a donde va irACapturarCostos. */}
              {btn("← Editar",irACapturarCostos,"secondary")}
              {/* Tarea 9 (03-sep-2026) — dos formatos, una sola función con la
                  bandera `nivel`. El de PDF se queda como estaba. */}
              {btn("⬇ Excel para Apps",()=>exportarExcel({
                pres,areas,costos,ingresos,mCapex,mOpex,mEgresos,
                mFlujo,mFlujoAcum,mIngresos,totalCAPEX,totalOPEX,totalEgr,
                totalIngresosAnual,MESES13,NMESES,totalNom,totalCat,ingAdicionales,
                nivel:"rubro"
              }),"secondary",false,"Condensado por rubro contable — el que se carga al sistema")}
              {btn("⬇ Excel visual",()=>exportarExcel({
                pres,areas,costos,ingresos,mCapex,mOpex,mEgresos,
                mFlujo,mFlujoAcum,mIngresos,totalCAPEX,totalOPEX,totalEgr,
                totalIngresosAnual,MESES13,NMESES,totalNom,totalCat,ingAdicionales,
                nivel:"detalle"
              }),"secondary",false,"Detalle por subcuenta — para revisar la clasificación antes de cargar")}
              {btn("⬇ PDF",()=>window.print(),"primary")}
            </div>
          </div>

          {/* ── SECCIÓN: Ingresos (solo lectura) ──────────────────────────
              Captura movida a Capturar costos (Step 3) — ahí vive el
              MoneyInput de precio fijo, el botón "+ Agregar ingreso" y el único
              botón "Guardar" de esa pantalla (guardarTodo). Aquí solo queda la
              tabla de facturación ya calculada (mIngresos) — visualización
              pura, cero campo editable, mismo patrón que el resto de Resumen
              mensual.
              PASO C — oculta por completo para Departamento/Suministro
              (mostrarIngresos), que no facturan. */}
          {mostrarIngresos&&card(<>
            {sTitle("Facturación","Precio fijo mensual del servicio × meses del proyecto, más facturación adicional por mes. Se captura en Capturar costos.")}

            {/* Tabla resumen M0-M12 */}
            <ScrollHint minWidth={800}>
              <table style={{borderCollapse:"collapse",fontSize:11,width:"100%"}}>
                <thead>
                  <tr style={{background:"#059669"}}>
                    <td style={{padding:"8px 14px",fontWeight:700,color:C.white,minWidth:140}}>Concepto</td>
                    {/* Fase 1.6.b (corrección) — mismo encabezado de dos líneas que TablaM */}
                    {MESES13.map((m,i)=>(
                      <td key={i} style={{padding:"4px 4px",textAlign:"right",minWidth:58}}>
                        <div style={{fontSize:9,fontWeight:600,opacity:0.7,color:"rgba(255,255,255,0.7)"}}>{m}</div>
                        <div style={{fontSize:11,fontWeight:700,color:C.white}}>{MESES13_MES[i]}</div>
                      </td>
                    ))}
                    <td style={{padding:"6px 12px",textAlign:"right",fontWeight:700,color:C.white}}>Total</td>
                  </tr>
                </thead>
                <tbody>
                  {/* Fila "+ Adicionales" eliminada — mostraba solo la porción de
                      ingAdicionales, que mIngresos/totalIngresosAnual ya incluyen.
                      Con precioFijo=0 daba el mismo total que esta fila, aparentando
                      una suma duplicada sin serlo. Se llamó FACTURACIÓN, luego
                      INGRESOS para combinar con el título de sección, y vuelve a
                      FACTURACIÓN el 2026-08-31 con el título. mIngresos/
                      totalIngresosAnual sin cambios. Mismo patrón que Capturar
                      costos. */}
                  <tr style={{background:C.successLight}}>
                    <td style={{padding:"8px 14px",fontWeight:700,color:C.success}}>FACTURACIÓN</td>
                    {mIngresos.map((v,i)=>(
                      <td key={i} style={{padding:"5px 4px",textAlign:"right",
                        color:v>0?C.success:C.grayBorder,fontWeight:v>0?600:400}}>
                        {v>0?fmtK(v):"—"}
                      </td>
                    ))}
                    <td style={{padding:"6px 12px",textAlign:"right",fontWeight:800,color:C.success}}>{fmt(totalIngresosAnual)}</td>
                  </tr>
                </tbody>
              </table>
            </ScrollHint>
          </>)}

          {/* Aviso: partidas sin categoría contable macro asignada */}
          {sinCategoriaMacro>0&&(
            <div style={{marginBottom:16,padding:"10px 16px",background:C.grayLight,
              border:`1px solid ${C.grayBorder}`,borderRadius:8,fontSize:12,color:C.grayDark}}>
              ⚠ {sinCategoriaMacro} partida{sinCategoriaMacro>1?"s":""} sin categoría contable asignada — revísala{sinCategoriaMacro>1?"s":""} antes de cerrar el presupuesto.
            </div>
          )}

          {/* ── KPIs ────────────────────────────────────────────────────── */}
          {/* Tarea 8 paso 2: la fila de KPIs pasa al componente compartido.
              El bloque que estaba aquí en línea era idéntico al de Información
              general (de ahí salió KPIsPresupuesto), así que no cambia nada de lo
              que se ve — deja de estar escrito dos veces. */}
          <KPIsPresupuesto totalIngresosAnual={totalIngresosAnual} totalCAPEX={totalCAPEX}
            totalOPEX={totalOPEX} totalEgr={totalEgr} utilidad={utilidad} margen={margen}/>

          {/* ── TABLA 1: SERVICIO (Ingresos vs Egresos) ─────────────────── */}
          {card(<>
            {sTitle("Tabla SERVICIO — Ingresos vs Egresos por mes","Equivalente a la pestaña SERVICIO del archivo Excel de Geolis")}
            <TablaM filas={[
              {label:"INGRESOS (Facturación)",color:C.success,   datos:mIngresos},
              {label:"CAPEX (Activos)",        color:C.yellowDark,datos:mCapex, detalle:capexDetalle},
              {label:"OPEX",                   color:"#374151",   datos:mOpex,  detalle:opexDetalle},
              {label:"EGRESOS TOTALES",         color:C.danger,    datos:mEgresos},
            ]} showTotal={false}/>
          </>)}

          {/* ── TABLA 2: FLUJO ───────────────────────────────────────────── */}
          {card(<>
            {sTitle("Tabla FLUJO — Flujo de efectivo","Equivalente a la pestaña FLUJO del archivo Excel de Geolis")}
            <TablaM filas={[
              {label:"OPEX",              color:"#374151",   datos:mOpex},
              {label:"CAPEX",             color:C.yellowDark,datos:mCapex},
              {label:"EGRESOS TOTALES",   color:C.danger,    datos:mEgresos},
              {label:"INGRESOS",          color:C.success,   datos:mIngresos},
              {label:"FLUJO EFECTIVO",    color:"#7c3aed",   datos:mFlujo},
              {label:"FLUJO ACUMULADO",   color:"#0891b2",   datos:mFlujoAcum, acumulado:true},
            ]} showTotal={false}/>
          </>)}

          {/* ── Tarea 8 paso 2 — la tabla contable agrupada por RUBRO, que hasta hoy
              solo estaba en Información general. NO reemplaza a las tablas
              mensuales de arriba: son dos vistas distintas del mismo dinero y las
              dos se quedan. Es la que la contadora Anel aprobó como prueba de que
              SERVICIOS sale como rubro propio. ── */}
          <TablaContableCard filas={filasServicio} MESES13={MESES13} MESES13_MES={MESES13_MES}/>

          {/* ── Tarea 8 paso 2 — las cajas por departamento, también traídas de
              Información general. Los totales por área se suman arriba, en App. ── */}
          <DetallePorArea areasDetalle={areasDetalle} pres={pres}
            numMesesProyecto={calcularNumMesesOp(pres?.fechaInicio,pres?.fechaFin)}
            upP={upP} rmP={rmP} addP={addP} rmN={rmN} addN={addN}/>

          {/* ── Tarea 8 paso 2 — las dos gráficas pasan al componente compartido.
              Antes estaban escritas en línea aquí Y en Información general; ahora
              hay un solo bloque. Cambia SOLO el rótulo de las dos tarjetas: decían
              "Gráfica I —" y "Gráfica II —" con la referencia a la pestaña del
              Excel, y ahora dicen "Flujo de efectivo" y "OPEX por categoría", que es
              como estaban rotuladas en Información general. Mismos datos, mismas dos
              gráficas, mismo orden. ── */}
          <GraficasPresupuesto mFlujo={mFlujo} mFlujoAcum={mFlujoAcum}
            MESES13_MES={MESES13_MES} catOpexSeries={catOpexSeries}/>

          {/* ── TABLA 3: Resumen por área ────────────────────────────────── */}
          {areas.length>0&&card(<>
            {sTitle("Resumen por área")}
            <ScrollHint minWidth={480}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#FAFAFA",borderBottom:`2px solid ${C.line}`}}>
                  {["Área","CAPEX","OPEX anual","Total"].map((h,i)=>(
                    <td key={h} style={{padding:"10px 14px",fontWeight:700,fontSize:11,
                      color:i===1?C.yellowDark:i===2?"#374151":C.grayMid,
                      textAlign:i>0?"right":"left",textTransform:"uppercase",letterSpacing:0.4}}>{h}</td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {areas.map((id,i)=>{
                  const a=cats.find(x=>x.id===id);
                  const cx=totalCat(id,"capex");
                  const ox=totalOpexAnualCat(id,"mat")+totalNomAnual(id)+totalOpexAnualCat(id,"via");
                  return(
                    <tr key={id} style={{background:i%2===0?C.white:"#FAFAFA",borderBottom:`1px solid ${C.line}`}}>
                      <td style={{padding:"10px 14px",fontWeight:600}}>{a?.icon} {a?.label}</td>
                      <td style={{padding:"10px 14px",textAlign:"right",color:C.yellowDark,fontWeight:600}}>{fmt(cx)}</td>
                      <td style={{padding:"10px 14px",textAlign:"right",color:"#374151"}}>{fmt(ox)}</td>
                      <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700}}>{fmt(cx+ox)}</td>
                    </tr>
                  );
                })}
                <tr style={{background:C.grayDark}}>
                  <td style={{padding:"11px 14px",fontWeight:700,color:C.white}}>TOTAL</td>
                  <td style={{padding:"11px 14px",textAlign:"right",fontWeight:700,color:C.yellow}}>{fmt(totalCAPEX)}</td>
                  <td style={{padding:"11px 14px",textAlign:"right",fontWeight:700,color:"#ccc"}}>{fmt(totalOPEX)}</td>
                  <td style={{padding:"11px 14px",textAlign:"right",fontWeight:800,color:C.white,fontSize:14}}>{fmt(totalEgr)}</td>
                </tr>
              </tbody>
            </table>
            </ScrollHint>
          </>,0)}

          <div style={{textAlign:"center",fontSize:11,color:C.grayMid,paddingTop:20,marginTop:20,
            borderTop:`1px solid ${C.line}`}}>
            GEOLIS SA DE CV · {pres?.nombre} · Elaborado: {pres?.fechaElaboracion||new Date().toLocaleDateString("es-MX")}
          </div>
        </div>
      </div>
    // Tarea 8 paso 3 — se fue el eslabón de Información general, que ya no es
    // alcanzable. El último eslabón dice "Resumen" (Luis, 03-sep-2026): el botón
    // del listado se llama "Ver" y la miga describe DÓNDE estás, no cómo
    // llegaste. Queda Inicio / Presupuestos / [nombre] / Resumen.
    ,[{label:"Presupuestos",onClick:()=>setStep(0)},{label:nombreProy,onClick:irACapturarCostos},{label:"Resumen"}]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 5 — MI PRESUPUESTO (vista completa, editable, para exponer)
  // ══════════════════════════════════════════════════════════════════════════
  // Reutiliza los mismos SCard/PartidaTable/NominaTable y los mismos handlers
  // (upP/addP/rmP/addN/rmN/guardarArea) que Step 3 — la única diferencia es
  // que aquí se recorren TODAS las áreas de corrido (sin selector lateral),
  // en vez de mostrar una a la vez. No se tocó Step 3 ni Step 4.
  // Vista de Información general. Oculta el 03-sep-2026 por
  // petición de Luis: su contenido (KPIs, tabla contable por
  // rubro, cajas por departamento y gráficas) vive ahora en la
  // vista Ver. NO BORRAR: es la vuelta atrás sin revertir
  // commits. Se borra semanas después, o nunca.
  //
  // Se comenta línea por línea, con doble barra, porque el bloque
  // contiene comentarios JSX y los comentarios de bloque de JS no
  // se anidan. Para reactivarla: quitar el prefijo de estas líneas
  // y devolver el eslabón de la miga y el botón de regreso.
  //   if(step===5){
  //     // Corrección posterior al día 3 (spec dos-sistemas-semana) — el cliente pidió
  //     // cambiar CÓMO se edita (a Capturar costos), no borrar el detalle por área de
  //     // esta pantalla de consulta. KPIs + TablaServicio + gráficas se quedan igual;
  //     // debajo vuelve el detalle por área en texto plano (sin inputs, sin Guardar).
  //     const cats=getAreasCat(pres?.tipo||"instalacion");
  //     // Panorama del presupuesto completo — misma función que usa Step 4, cero
  //     // lógica de cálculo duplicada.
  //     const {NMESES, MESES13, MESES13_MES, mCapex, mOpex, mEgresos, mIngresos,
  //       totalIngresosAnual, mFlujo, mFlujoAcum, catOpexSeries} =
  //       calcularSerieMensual({pres, areas, costos, capexPM, opexPM, ingresos, ingAdicionales});
  //     const totalCAPEX=mCapex.reduce((s,v)=>s+v,0);
  //     const totalOPEX=mOpex.reduce((s,v)=>s+v,0);
  //     const totalEgr=totalCAPEX+totalOPEX;
  //     const utilidad=totalIngresosAnual-totalEgr;
  //     const margen=totalIngresosAnual>0?((utilidad/totalIngresosAnual)*100):0;
  //     const filasServicio=construirFilasServicio({pres, areas, costos, NMESES, mCapex, mEgresos,
  //       totalCAPEX, totalIngresosAnual, mIngresos, totalEgr});
  //     // Tarea 8, paso 1 — los totales por área se calculan AQUÍ, como siempre, y
  //     // el componente DetallePorArea solo los pinta. Las mismas llamadas que había
  //     // en línea dentro del map: totalCat, totalNom, totalOpexAnualCat, totalNomAnual.
  //     const areasDetalle=areas.map((id,ai)=>{
  //       const opexMat=totalOpexAnualCat(id,"mat"), opexVia=totalOpexAnualCat(id,"via"), nomAnual=totalNomAnual(id);
  //       const capexA=totalCat(id,"capex"), opexA=opexMat+nomAnual+opexVia;
  //       return {id, esUltima:ai===areas.length-1, datos:costos[id], areaInfo:cats.find(a=>a.id===id),
  //         capexA, nomMes:totalNom(id), opexA, totalArea:capexA+opexA, nomAnual, opexMat, opexVia};
  //     });
  //
  //     return wrap(
  //       <div>
  //         <style>{`@media print{body *{visibility:hidden}#rpdf,#rpdf *{visibility:visible}#rpdf{position:absolute;left:0;top:0;width:100%}.noprint{display:none!important}}`}</style>
  //
  //         <div id="rpdf">
  //           {/* Header — movido DENTRO de #rpdf (antes era hermano, fuera): igual que en
  //               Resumen mensual, sin esto el PDF exportado no traía nombre ni periodo.
  //               Los botones siguen sin imprimirse por .noprint. */}
  //           <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
  //             <div>
  //               {/* Fase 1.3 — "Mi presupuesto" pasa a llamarse "Información general" en toda la app */}
  //               <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800,color:C.grayDark}}>Información general</h2>
  //               {/* Encabezado de tres renglones — ver nota en Capturar costos. */}
  //               <div style={{fontSize:13,color:C.grayMid}}>{pres?.nombre}</div>
  //               {pres?.unidadNegocio&&(
  //                 <div style={{fontSize:13,color:C.grayDark,fontWeight:600,marginTop:2}}>{etiquetaUnidad(pres.unidadNegocio)}</div>
  //               )}
  //               {/* Fase 1.6.a — línea de periodo */}
  //               {pres?.fechaInicio&&(()=>{
  //                 const nMesesOp=calcularNumMesesOp(pres.fechaInicio,pres.fechaFin);
  //                 return(
  //                   <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>
  //                     Periodo: <strong>{mesLabelReal(0,pres.fechaInicio)} – {mesLabelReal(nMesesOp,pres.fechaInicio)}</strong> · {nMesesOp+1} meses
  //                   </div>
  //                 );
  //               })()}
  //               {/* Spec navegación-retro-410 punto 5 — Elaborado/Vigencia se quitan de
  //                   aquí; ahora viven en el listado (punto 3.1). El periodo se queda. */}
  //             </div>
  //             {/* Corrección posterior al paso 4 de spec-recuperación-datos — el cliente
  //                 dijo "Capturar el costo pues no va aquí, ¿por qué lo pondría aquí?":
  //                 se quita el botón. No queda hueco de navegación: "Editar" del listado
  //                 (abrirEdit, commit d2763e1) ya manda directo a Capturar costos (Step 3),
  //                 y la miga de pan también permite volver a Información general desde ahí. */}
  //             <div style={{display:"flex",gap:10}} className="noprint">
  //               {btn("Resumen mensual →",()=>setStep(4),"secondary")}
  //               {btn("⬇ PDF",()=>window.print(),"secondary")}
  //             </div>
  //           </div>
  //
  //           {/* Tarea 8 paso 1: extraído a KPIsPresupuesto. */}
  //           <KPIsPresupuesto totalIngresosAnual={totalIngresosAnual} totalCAPEX={totalCAPEX}
  //             totalOPEX={totalOPEX} totalEgr={totalEgr} utilidad={utilidad} margen={margen}/>
  //
  //           {/* Tarea 8 paso 1: extraído a TablaContableCard. */}
  //           <TablaContableCard filas={filasServicio} MESES13={MESES13} MESES13_MES={MESES13_MES}/>
  //
  //           {/* Tarea 8 paso 1: extraído a DetallePorArea. Los totales por área se
  //               siguen sumando aquí, en App — el componente solo los pinta. */}
  //           <DetallePorArea areasDetalle={areasDetalle} pres={pres}
  //             numMesesProyecto={calcularNumMesesOp(pres?.fechaInicio,pres?.fechaFin)}
  //             upP={upP} rmP={rmP} addP={addP} rmN={rmN} addN={addN}/>
  //
  //           {/* Tarea 8 paso 1: extraído a GraficasPresupuesto. */}
  //           <GraficasPresupuesto mFlujo={mFlujo} mFlujoAcum={mFlujoAcum}
  //             MESES13_MES={MESES13_MES} catOpexSeries={catOpexSeries}/>
  //         </div>
  //       </div>
  //     ,[{label:"Presupuestos",onClick:()=>setStep(0)},{label:nombreProy,onClick:irACapturarCostos},{label:"Información general"}]);
  //   }
  return null;
}