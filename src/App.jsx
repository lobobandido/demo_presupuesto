import { useState, useEffect, useRef, useCallback } from "react";

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

// ─── DATOS HISTÓRICOS DE PRESUPUESTOS REALES (Excel Geolis) ─────────────────
// Fuente: 01022026_Presupuesto_Monitoreo_Cuervito y PERDIZ_HPS_800_HP
const CATS_MACRO_CONTABLE = ["ACTIVOS", "ARRENDA DE INMUEBLES Y SERV", "ARTICULOS DE SEGURIDAD", "EQUIPO DE COMPUTO", "EQUIPOS Y ENSERES", "INSUMOS OPERATIVOS", "INSUMOS DE OFICINA", "MARKETING", "MATERIALES", "MATERIALES DE SALUD", "NOMINA Y ADICIONALES", "SERV TELEFONIA CELULAR Y RADIO", "SERVICIOS", "SERVICIOS DE CAPACITACION", "SERVICIOS DE SALUD", "UNIFORMES", "VEHICULOS Y COMBUSTIBLE", "VIATICOS", "EQUIPO DE TRANSPORTE", "EQUIPO DE ADQUISICION", "GABINETE Y ENERGIA", "TRANSMISION", "CENTRO DE MONITOREO", "MAQUINARIA Y EQUIPO", "EQUIPO DE MOBILIARIO", "SOFTWARE Y LICENCIAS", "OTROS ACTIVOS"];

// Mapping: subcategoría escrita → categoría macro contable
const SUBCAT_MAPPING = {"ARRENDAMIENTO DE INMUEBLES": "ARRENDA DE INMUEBLES Y SERV", "SERVICIOS DE LUZ, AGUA E INTERNET": "ARRENDA DE INMUEBLES Y SERV", "SERVICIOS DE LIMPIEZA": "ARRENDA DE INMUEBLES Y SERV", "SERVICIOS DE VIGILANCIA": "ARRENDA DE INMUEBLES Y SERV", "TELEFONIA FIJA": "ARRENDA DE INMUEBLES Y SERV", "AGUA Y ALCANTARILLADO": "ARRENDA DE INMUEBLES Y SERV", "ARRENDAMIENTO DE OF. MOVILES": "ARRENDA DE INMUEBLES Y SERV", "ROPA Y ARTICULOS DE PROTECCION": "ARTICULOS DE SEGURIDAD", "EQUIPO DE COMPUTO (ADQUISICION)": "EQUIPO DE COMPUTO", "ARRENDAMIENTO DE EQ. COMPUTO": "EQUIPO DE COMPUTO", "ENSERES MENORES DIVERSOS": "EQUIPOS Y ENSERES", "INSUMOS AGRICOLAS": "INSUMOS OPERATIVOS", "PAPELERIA Y UTILES DE OFICINA": "INSUMOS DE OFICINA", "ARTICULOS DE ASEO Y SANITARIOS": "INSUMOS DE OFICINA", "ARTICULOS DE CAFETERIA": "INSUMOS DE OFICINA", "ARTICULOS DIGITALES Y DE COMPUTO": "INSUMOS DE OFICINA", "SERVICIOS DE MERCADOTECNIA": "MARKETING", "PUBLICIDAD Y PROPAGANDA": "MARKETING", "ABRASIVOS": "MATERIALES", "ACEITE LUBRICANTE P/MAQUINARIA": "MATERIALES", "ACEITES Y LUBRICANTES": "MATERIALES", "BANDA CADEN TRANS COPL": "MATERIALES", "CONEXIONES PARA TUBERIA": "MATERIALES", "FIBRAS HILOS Y TELAS": "MATERIALES", "GRASAS": "MATERIALES", "HERRAMIENTAS MANUALES": "MATERIALES", "LLANTAS, CAMARAS Y ACCESORIOS": "MATERIALES", "MATERIAL ELECTRICO": "MATERIALES", "MATERIALES Y ART P/MANTENIMIENTO": "MATERIALES", "POSTE DE TELEMETRIA": "MATERIALES", "MATERIAL PRIMEROS AUXILIOS": "MATERIALES DE SALUD", "NOMINA": "NOMINA Y ADICIONALES", "SERV TELEFONIA CELULAR (PARA TRANSMITIR)": "SERV TELEFONIA CELULAR Y RADIO", "SERVICIO DE BANDA ANCHA": "SERV TELEFONIA CELULAR Y RADIO", "SERVICIO DE RADIOCOMUNICACION": "SERV TELEFONIA CELULAR Y RADIO", "CUADRILLA DE INSTALACION": "SERVICIOS", "HERRAMIENTA": "SERVICIOS", "CAPACITACION": "SERVICIOS DE CAPACITACION", "SERVICIOS MEDICOS": "SERVICIOS DE SALUD", "SERVICIOS Y COMBUSTIBLE": "VEHICULOS Y COMBUSTIBLE", "COMBUSTIBLE": "VEHICULOS Y COMBUSTIBLE", "ALIMENTACION": "VIATICOS", "CASETAS PUENTES Y PEAJES": "VIATICOS", "SERV DE TRANSPORTAC AEREA": "VIATICOS", "SERV DE TRANSPORTAC TERRESTRE": "VIATICOS", "SERVICIOS DE HOSPEDAJE": "VIATICOS", "CAJA CHICA": "VIATICOS", "REEMBOLSOS": "VIATICOS", "MOBILIARIO": "EQUIPOS Y ENSERES", "SILLA DE OFICINA": "EQUIPOS Y ENSERES", "ESCRITORIO": "EQUIPOS Y ENSERES", "MUEBLES": "EQUIPOS Y ENSERES"};

// Partidas históricas para autocompletar al escribir categoría
const HISTORIAL_CAPEX = {
  "cuervito": [{"cat": "EQUIPO DE TRANSPORTE", "desc": "Camionetas", "unidad": "Unidad", "cantidad": 1, "monto": 550000.0}, {"cat": "EQUIPO DE ADQUISICION", "desc": "Sensores de presión", "unidad": "Unidad", "cantidad": 360, "monto": 165.0}, {"cat": "EQUIPO DE ADQUISICION", "desc": "Gateway", "unidad": "Unidad", "cantidad": 180, "monto": 175.0}, {"cat": "EQUIPO DE ADQUISICION", "desc": "PLC", "unidad": "Unidad", "cantidad": 50, "monto": 300.0}, {"cat": "EQUIPO DE ADQUISICION", "desc": "Arreglos  y accesorios", "unidad": "Unidad", "cantidad": 180, "monto": 650.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Panel solar", "unidad": "Unidad", "cantidad": 180, "monto": 60.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Controlador de carga", "unidad": "Unidad", "cantidad": 180, "monto": 35.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Bateria Ciclo profundo", "unidad": "Unidad", "cantidad": 360, "monto": 80.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Gabinete", "unidad": "Unidad", "cantidad": 180, "monto": 90.0}, {"cat": "GABINETE Y ENERGIA", "desc": "Cableado, clemas y riel", "unidad": "Unidad", "cantidad": 180, "monto": 60.0}, {"cat": "TRANSMISION", "desc": "Kit Starlink mini", "unidad": "Unidad", "cantidad": 40, "monto": 277.0}, {"cat": "TRANSMISION", "desc": "Antenas repetidoras", "unidad": "Unidad", "cantidad": 40, "monto": 1100.0}, {"cat": "CENTRO DE MONITOREO", "desc": "Monitores", "unidad": "Unidad", "cantidad": 6, "monto": 450.0}, {"cat": "CENTRO DE MONITOREO", "desc": "Workstation", "unidad": "Unidad", "cantidad": 1, "monto": 1800.0}, {"cat": "CENTRO DE MONITOREO", "desc": "UPS", "unidad": "Unidad", "cantidad": 1, "monto": 250.0}, {"cat": "CENTRO DE MONITOREO", "desc": "Accesorios", "unidad": "Unidad", "cantidad": 1, "monto": 200.0}],
  "perdiz":   [{"cat": "EQUIPO DE TRANSPORTE", "desc": "Camionetas", "unidad": "Unidad", "cantidad": 0, "monto": 32025.45}, {"cat": "EQUIPO DE MOBILIARIO", "desc": "Comisionamiento Gen", "unidad": "Unidad", "cantidad": 1, "monto": 6500.0}, {"cat": "EQUIPO DE MOBILIARIO", "desc": "Material de Seguridad", "unidad": "Unidad", "cantidad": 0, "monto": 3500.0}, {"cat": "EQUIPO DE MOBILIARIO", "desc": "Herramienta Manual", "unidad": "Unidad", "cantidad": 1, "monto": 11538.46}, {"cat": "EQUIPO DE MOBILIARIO", "desc": "Comisionamiento HPS", "unidad": "Unidad", "cantidad": 0, "monto": 2000.0}, {"cat": "MAQUINARIA Y EQUIPO 1", "desc": "Bomba HPS", "unidad": "Unidad", "cantidad": 1, "monto": 176089.03}, {"cat": "MAQUINARIA Y EQUIPO 2", "desc": "VDF", "unidad": "Unidad", "cantidad": 1, "monto": 79961.3}, {"cat": "MAQUINARIA Y EQUIPO 3", "desc": "Generador", "unidad": "Unidad", "cantidad": 1, "monto": 513000.0}, {"cat": "MAQUINARIA Y EQUIPO 4", "desc": "Refaccionamiento bomba", "unidad": "Unidad", "cantidad": 1, "monto": 65000.0}, {"cat": "MAQUINARIA Y EQUIPO 5", "desc": "Refaccionamiento generador", "unidad": "Unidad", "cantidad": 1, "monto": 65000.0}, {"cat": "MAQUINARIA Y EQUIPO 6", "desc": "CCM", "unidad": "Unidad", "cantidad": 1, "monto": 160486.99501936912}, {"cat": "MAQUINARIA Y EQUIPO 7", "desc": "Cobertizo", "unidad": "Unidad", "cantidad": 1, "monto": 100000.0}, {"cat": "OTROS ACTIVOS", "desc": "Obra mecanica", "unidad": "Unidad", "cantidad": 1, "monto": 94452.26}, {"cat": "OTROS ACTIVOS", "desc": "Valvulas", "unidad": "Unidad", "cantidad": 1, "monto": 117998.91}, {"cat": "OTROS ACTIVOS", "desc": "Obra Electrica", "unidad": "Unidad", "cantidad": 1, "monto": 556015.9120088544}, {"cat": "OTROS ACTIVOS", "desc": "RICCSSA", "unidad": "Obra civil", "cantidad": 1, "monto": 280969.06156405987}, {"cat": "OTROS ACTIVOS", "desc": "Pruebas PND y Pintura", "unidad": "Unidad", "cantidad": 1, "monto": 17867.79}, {"cat": "PARIDAD", "desc": "18.07", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "MES", "desc": "30.4", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "PERIODO PAGO (DÍAS)", "desc": "30", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "GASOLINA MAGNA", "desc": "22", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "DIESEL", "desc": "23", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "LINEA DE 12 A 4", "desc": "1265057.97", "unidad": "Unidad", "cantidad": 1, "monto": 0}, {"cat": "LINEA DE 16 A 6", "desc": "1553586.78", "unidad": "Unidad", "cantidad": 1, "monto": 0}],
};
const HISTORIAL_NOMINA = {
  "cuervito": [{"puesto": "Especialista telemetría", "cantidad": 1, "salario": 25000.0}, {"puesto": "Técnico instrumentista", "cantidad": 1, "salario": 20000.0}],
};

// ── PUNTO 8: Autocompletar con histórico real ────────────────────────────────
// Busca en: 1) presupuestos guardados en localStorage 2) datos de Excel

// OPEX histórico de Cuervito (pestaña SERVICIO)
const HISTORIAL_OPEX_BASE = [
  {cat:"ARRENDA DE INMUEBLES Y SERV",  desc:"Arrendamiento de inmuebles y servicios", unidad:"Mes",    cantidad:12,  monto:13000},
  {cat:"ARTICULOS DE SEGURIDAD",       desc:"Ropa y artículos de protección EPP",     unidad:"Unidad", cantidad:1,   monto:40000},
  {cat:"EQUIPO DE COMPUTO",            desc:"Equipo de cómputo adquisición",          unidad:"Unidad", cantidad:1,   monto:84000},
  {cat:"INSUMOS OPERATIVOS",           desc:"Insumos operativos varios",              unidad:"Mes",    cantidad:12,  monto:2700},
  {cat:"INSUMOS DE OFICINA",           desc:"Papelería y útiles de oficina",          unidad:"Mes",    cantidad:12,  monto:2700},
  {cat:"MATERIALES",                   desc:"Poste de telemetría y materiales",       unidad:"Global", cantidad:1,   monto:810000},
  {cat:"NOMINA Y ADICIONALES",         desc:"Nómina y adicionales mensual",           unidad:"Mes",    cantidad:12,  monto:73490.13},
  {cat:"SERV TELEFONIA CELULAR Y RADIO",desc:"Servicio telefonía celular y radio",    unidad:"Mes",    cantidad:12,  monto:66000},
  {cat:"SERVICIOS",                    desc:"Cuadrilla de instalación y herramienta", unidad:"Global", cantidad:1,   monto:1294000},
  {cat:"VEHICULOS Y COMBUSTIBLE",      desc:"Vehículos y combustible mensual",        unidad:"Mes",    cantidad:12,  monto:26216.67},
  {cat:"VIATICOS",                     desc:"Alimentación y hospedaje",              unidad:"Día",    cantidad:30,  monto:800},
  {cat:"VIATICOS",                     desc:"Casetas, puentes y peajes",             unidad:"Mes",    cantidad:12,  monto:500},
  {cat:"SERVICIOS DE CAPACITACION",    desc:"Capacitación técnica especializada",    unidad:"Servicio",cantidad:1,  monto:15000},
  {cat:"UNIFORMES",                    desc:"Uniformes y ropa de trabajo",           unidad:"Unidad", cantidad:10,  monto:1200},
  {cat:"MARKETING",                    desc:"Materiales de marketing y publicidad",  unidad:"Mes",    cantidad:1,   monto:5000},
];

function getHistorialLS(){
  // Leer presupuestos guardados del localStorage para autocompletar
  try {
    const estado = JSON.parse(localStorage.getItem("geolis_app_state_v3")||"{}");
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

const UNIDADES=["Unidad","Día","Semana","Mes","Año","Servicio","Viaje","Pieza","Kg","Metro","Litro","Hora","Global"];

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
      {cat:"ARRENDA DE INMUEBLES Y SERV",  desc:"Arrendamiento de inmuebles y servicios", unidad:"Mes",      cantidad:12, monto:13000},
      {cat:"ARTICULOS DE SEGURIDAD",       desc:"Ropa y artículos de protección EPP",     unidad:"Unidad",   cantidad:1,  monto:40000},
      {cat:"EQUIPO DE COMPUTO",            desc:"Equipo de cómputo adquisición",          unidad:"Unidad",   cantidad:1,  monto:84000},
      {cat:"INSUMOS OPERATIVOS",           desc:"Insumos operativos varios",              unidad:"Mes",      cantidad:12, monto:2700},
      {cat:"INSUMOS DE OFICINA",           desc:"Papelería y útiles de oficina",          unidad:"Mes",      cantidad:12, monto:2700},
      {cat:"MATERIALES",                   desc:"Poste de telemetría y materiales",       unidad:"Global",   cantidad:1,  monto:810000},
      {cat:"NOMINA Y ADICIONALES",         desc:"Nómina y adicionales mensual",           unidad:"Mes",      cantidad:12, monto:73490.13},
      {cat:"SERV TELEFONIA CELULAR Y RADIO",desc:"Servicio telefonía celular y radio",    unidad:"Mes",      cantidad:12, monto:66000},
      {cat:"SERVICIOS",                    desc:"Cuadrilla de instalación y herramienta", unidad:"Global",   cantidad:1,  monto:1294000},
      {cat:"VEHICULOS Y COMBUSTIBLE",      desc:"Vehículos y combustible mensual",        unidad:"Mes",      cantidad:12, monto:26216.67},
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
    desc:"Presupuesto_Geolis_2026_v4.1 — 1er semestre Innovación y Tecnología",
    capex:[
      {cat:"EQUIPO DE COMPUTO",     desc:"Laptop Geolis — Dell Pro",         unidad:"Unidad",cantidad:52, monto:25209},
      {cat:"EQUIPO DE COMPUTO",     desc:"Laptop Geolis — Dell Pro Plus",     unidad:"Unidad",cantidad:16, monto:33861},
      {cat:"EQUIPO DE COMPUTO",     desc:"Laptop Geolis — Dell Pro Max",      unidad:"Unidad",cantidad:4,  monto:50331},
      {cat:"EQUIPO DE COMPUTO",     desc:"Laptop Cuervito — Dell Pro",        unidad:"Unidad",cantidad:16, monto:25209},
      {cat:"ACCESORIOS",            desc:"Kit Teclado/Mouse Dell KM3322W",    unidad:"Unidad",cantidad:56, monto:408},
      {cat:"ACCESORIOS",            desc:"Monitor Dell SE2425HM",             unidad:"Unidad",cantidad:20, monto:2000},
      {cat:"ACCESORIOS",            desc:"Monitor Dell SE2725HM",             unidad:"Unidad",cantidad:20, monto:2549},
      {cat:"ACCESORIOS",            desc:"Docking Station WD25",              unidad:"Unidad",cantidad:20, monto:3239},
    ],
    opex:[
      {cat:"LICENCIAMIENTO MXN MENSUAL",desc:"MS Office 365 Negocios x25",    unidad:"Mes",   cantidad:6, monto:4575},
      {cat:"LICENCIAMIENTO MXN MENSUAL",desc:"Adobe Acrobat Standard x16",    unidad:"Mes",   cantidad:6, monto:4784},
      {cat:"LICENCIAMIENTO MXN MENSUAL",desc:"Adobe Creative Cloud x3",       unidad:"Mes",   cantidad:6, monto:4500},
      {cat:"LICENCIAMIENTO MXN MENSUAL",desc:"Correos .mx POP x324",          unidad:"Mes",   cantidad:6, monto:38880},
      {cat:"LICENCIAMIENTO MXN MENSUAL",desc:"Antivirus Cortex x26",          unidad:"Mes",   cantidad:6, monto:3328},
      {cat:"LICENCIAMIENTO MXN ANUAL",  desc:"Autodesk AutoCAD x5",           unidad:"Año",   cantidad:1, monto:130750},
      {cat:"LICENCIAMIENTO MXN ANUAL",  desc:"Autodesk AutoCAD LT",           unidad:"Año",   cantidad:1, monto:6335},
      {cat:"LICENCIAMIENTO USD",        desc:"ChatGPT Business x15 /mes",     unidad:"Mes",   cantidad:6, monto:450},
      {cat:"LICENCIAMIENTO USD",        desc:"Claude Pro Team x4 /mes",       unidad:"Mes",   cantidad:6, monto:100},
      {cat:"LICENCIAMIENTO USD",        desc:"ClickUp Business x7 /año",      unidad:"Año",   cantidad:1, monto:1008},
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

// Calcula cuántas veces ocurre el gasto durante N meses del proyecto
function vecesEnProyecto(periodicidad, numMeses=12){
  const pm = {mensual:1, bimestral:2, trimestral:3, semestral:6, anual:12};
  const intervalo = pm[periodicidad]||1;
  return Math.ceil(numMeses / intervalo);
}

// Total OPEX de una partida = monto × veces en el proyecto
function totalOpexPartida(p, numMeses=12){
  return (p.monto||0) * (p.cantidad||1) * vecesEnProyecto(p.periodicidad||"mensual", numMeses);
}

// Distribuye el OPEX en los meses correctos según periodicidad
function distribuirOpex(p, numMeses=12){
  const pm = {mensual:1, bimestral:2, trimestral:3, semestral:6, anual:12};
  const intervalo = pm[p.periodicidad||"mensual"]||1;
  const montoMes = (p.monto||0)*(p.cantidad||1);
  return Array(numMeses+1).fill(0).map((_,i)=>{
    if(i===0) return 0; // M0 sin OPEX
    return (i-1) % intervalo === 0 ? montoMes : 0;
  });
}

// Meses activos de un puesto de nómina
function mesesNomina(puesto, numMeses=12){
  if(puesto.tipoPersonal==="fijo") return numMeses;
  if(puesto.tipoPersonal==="contrato"||puesto.tipoPersonal==="outsourcing")
    return Math.min(puesto.mesesContrato||12, numMeses);
  return numMeses;
}

// Costo total nómina de un puesto en el proyecto
function costoTotalNomina(puesto, numMeses=12){
  const f=1+(puesto.imss||F_IMSS)+(puesto.prestaciones||F_PREST)+(puesto.isr||F_ISR);
  const costoMes=(puesto.salario||0)*f*(puesto.cantidad||1);
  return costoMes * mesesNomina(puesto, numMeses);
}

// ─── PERSISTENCIA localStorage (PUNTO 5 — no perder datos al navegar) ────────
const LS_APP_KEY = "geolis_app_state_v4"; // v4: fix abrir + TI real + validaciones
function saveAppState(state){ try{ localStorage.setItem(LS_APP_KEY, JSON.stringify(state)); }catch(e){} }
function loadAppState(){ try{ const s=localStorage.getItem(LS_APP_KEY); return s?JSON.parse(s):null; }catch(e){return null;} }

const F_IMSS=0.32, F_PREST=0.40, F_ISR=0.05;
let _id=1; const uid=()=>++_id;

const fmt=n=>isNaN(n)||n==null?"$0.00":"$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtMiles=n=>isNaN(n)||n==null?"0.00":Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});

const LS_CATS="geolis_cats_v3";
function getCats(){try{return JSON.parse(localStorage.getItem(LS_CATS)||"[]");}catch{return[];}}
function saveCat(c){const e=getCats();if(!e.includes(c))localStorage.setItem(LS_CATS,JSON.stringify([...e,c]));}

function initP(o={}){return{id:uid(),cat:"",desc:"",unidad:"Unidad",cantidad:1,monto:0,
  mesGasto:0,        // CAPEX: mes en que se compra (0=M0, 1=M1...)
  periodicidad:"mensual", // OPEX: mensual/bimestral/trimestral/semestral/anual
  ...o};}
function initN(o={}){return{id:uid(),puesto:"Técnico",puestoCustom:"",cantidad:1,salario:0,
  imss:F_IMSS,prestaciones:F_PREST,isr:F_ISR,
  tipoPersonal:"fijo",   // fijo / contrato / outsourcing
  mesesContrato:12,      // solo aplica si tipoPersonal=contrato
  mesInicio:1,           // mes en que inicia (para contrato)
  ...o};}
function distMeses(total,tipo="opex"){
  if(tipo==="capex"){const m=Array(12).fill(0);m[0]=total;return m;}
  return Array(12).fill(parseFloat((total/12).toFixed(2)));
}

// ─── MONEY INPUT — prefijo $ fijo, sin bloqueo del 0 ──────────────────────────
// ─── MONEY INPUT ─────────────────────────────────────────────────────────────
// $ fijo | focus: edición limpia sin comas | blur: formato 1,500,000.00
function parseMoney(str){ return parseFloat(String(str).replace(/,/g,""))||0; }
function displayMoney(n){ return n===0?"":Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2}); }

function MoneyInput({value, onChange, style={}}){
  const [focused, setFocused] = useState(false);
  const [editRaw, setEditRaw] = useState("");
  const ref = useRef();
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
          setEditRaw(n===0?"":String(n));
          setFocused(true);
          setTimeout(()=>ref.current?.select(),0);
        }}
        onChange={e=>{
          const parts=e.target.value.replace(/[^0-9.]/g,"").split(".");
          const safe=parts.length>2?parts[0]+"."+parts.slice(1).join(""):e.target.value.replace(/[^0-9.]/g,"");
          setEditRaw(safe);
          onChange(parseMoney(safe));
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
function CatalogInput({value,onChange,options,placeholder="Seleccionar o escribir",allowCustom=true,onPartidaSelect}){
  const [open,setOpen]=useState(false);
  const [txt,setTxt]=useState(value||"");
  const [macroModal,setMacroModal]=useState(false);
  const [newCatPending,setNewCatPending]=useState("");
  const ref=useRef();
  const allOpts=[...new Set([...options,...getCats()])];
  const filtered=allOpts.filter(o=>o.toLowerCase().includes(txt.toLowerCase()));

  useEffect(()=>{setTxt(value||"");},[value]);
  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  function pick(v){
    setTxt(v);onChange(v);setOpen(false);
    // Si hay historial para esta categoría, notificar
    if(onPartidaSelect){
      const hist=buscarHistorial(v,"capex");
      if(hist.length>0) onPartidaSelect(hist[0]);
    }
  }

  function handleNewCat(rawTxt){
    const upper=rawTxt.trim().toUpperCase();
    // Verificar si ya existe en cats macro
    const isMacro=CATS_MACRO_CONTABLE.some(m=>m.toUpperCase()===upper);
    const hasSub=SUBCAT_MAPPING[upper];
    if(isMacro||hasSub){
      // Existe, guardar directo
      saveCat(upper); pick(upper);
    } else {
      // Nueva categoría — pedir categoría macro
      setNewCatPending(upper);
      setMacroModal(true);
      setOpen(false);
    }
  }

  function confirmMacro(macro){
    saveCat(newCatPending);
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
        onChange={e=>{setTxt(e.target.value);onChange(e.target.value);setOpen(true);}}
        onFocus={()=>setOpen(true)}
        onKeyDown={e=>{if(e.key==="Enter"&&txt.trim())handleNewCat(txt);}}
        placeholder={placeholder}
        style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.grayBorder}`,
          borderRadius:6,fontSize:12,boxSizing:"border-box",outline:"none",
          transition:"border-color 0.15s"}}
        onFocusCapture={e=>e.target.style.borderColor=C.yellow}
        onBlurCapture={e=>e.target.style.borderColor=C.grayBorder}
      />
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:1000,
          background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:8,
          maxHeight:220,overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.12)"}}>
          {allowCustom&&txt&&!allOpts.map(o=>o.toUpperCase()).includes(txt.toUpperCase())&&(
            <div onMouseDown={e=>{e.preventDefault();handleNewCat(txt);}}
              style={{padding:"9px 12px",fontSize:12,color:C.yellowDark,cursor:"pointer",
                borderBottom:`1px solid ${C.line}`,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}>+</span> Agregar "{txt.toUpperCase()}"
            </div>
          )}
          {filtered.length===0&&<div style={{padding:"10px 12px",fontSize:12,color:C.grayMid}}>Sin resultados</div>}
          {filtered.map(opt=>(
            <div key={opt} onMouseDown={e=>{e.preventDefault();pick(opt);}}
              style={{padding:"9px 12px",fontSize:12,cursor:"pointer",
                background:value===opt?"#FFFBF0":"transparent",
                borderBottom:`1px solid ${C.line}`}}
              onMouseEnter={e=>e.currentTarget.style.background="#FFFBF0"}
              onMouseLeave={e=>e.currentTarget.style.background=value===opt?"#FFFBF0":"transparent"}>
              {opt}
            </div>
          ))}
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
const CAT_CAPEX=[
  "EQUIPO DE COMPUTO","EQUIPO DE TRANSPORTE","MAQUINARIA Y EQUIPO","ACCESORIOS",
  "INFRAESTRUCTURA DE RED","GABINETE Y ENERGÍA","TRANSMISIÓN","EQUIPO DE MOBILIARIO",
  "SOFTWARE Y LICENCIAS","OTROS ACTIVOS",
];
const CAT_OPEX=[
  "NÓMINA Y ADICIONALES","ARTÍCULOS DE SEGURIDAD","VEHÍCULOS Y COMBUSTIBLE","VIÁTICOS",
  "MATERIALES","TELECOMUNICACIONES","SERVICIOS","LICENCIAMIENTO MXN MENSUAL",
  "LICENCIAMIENTO MXN ANUAL","LICENCIAMIENTO USD","INSUMOS DE OFICINA","INSUMOS OPERATIVOS",
  "HERRAMIENTAS","EQUIPOS Y ENSERES","SEGUROS","FLETES NACIONALES",
  "SERVICIOS DE CAPACITACIÓN","RENTA DE MAQUINARIA",
];

// ─── FIELD LABEL ─────────────────────────────────────────────────────────────
function FL({children,required}){
  return <label style={{fontSize:11,fontWeight:700,color:C.grayMid,
    textTransform:"uppercase",letterSpacing:0.4,display:"block",marginBottom:5}}>
    {children}{required&&<span style={{color:C.danger,marginLeft:2}}>*</span>}
  </label>;
}

// ─── PARTIDA ROW ─────────────────────────────────────────────────────────────
// Headers y fila en el mismo componente, dentro del card
function PartidaTable({partidas, onUpdate, onRemove, onAdd, catOptions, addLabel, headerColor, showMes=false, showPeriod=false}){
  return(
    <div>
      {/* Headers internos */}
      {partidas.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:showMes?"2fr 2fr 80px 70px 70px 1fr 90px 32px":"2fr 2fr 80px 70px 1fr 90px 32px",
          gap:8,padding:"0 0 6px 0",marginBottom:2,
          borderBottom:`1px solid ${C.line}`}}>
          {(showMes
            ?["Categoría","Descripción","Unidad","Cant.","Mes gasto","Monto unit.","Total",""]
            :["Categoría","Descripción","Unidad","Cant.","Monto unit.","Total",""]
          ).map((h,i)=>(
            <div key={i} style={{fontSize:10,fontWeight:700,color:C.grayMid,
              textTransform:"uppercase",letterSpacing:0.3,
              textAlign:i>=3?"right":"left"}}>{h}</div>
          ))}
        </div>
      )}
      {/* Filas */}
      {partidas.map((p,idx)=>{
        const total=(p.cantidad||0)*(p.monto||0);
        return(
          <div key={p.id} style={{display:"grid",
            gridTemplateColumns:showMes?"2fr 2fr 80px 70px 70px 1fr 90px 32px":"2fr 2fr 80px 70px 1fr 90px 32px",
            gap:8,alignItems:"center",padding:"6px 0",
            borderBottom:idx<partidas.length-1?`1px solid ${C.line}`:"none"}}>
            <div>
              <CatalogInput value={p.cat} onChange={v=>{
                onUpdate({...p,cat:v});
                // El dropdown de sugerencias se activa cuando hay historial
              }} options={catOptions} placeholder="Categoría"
                onPartidaSelect={hist=>{
                  if(hist) onUpdate({...p,cat:hist.cat,desc:hist.desc,unidad:hist.unidad,cantidad:hist.cantidad,monto:hist.monto});
                }}/>
              {/* Sugerencias históricas al escribir categoría */}
              {p.cat&&buscarHistorial(p.cat,catOptions===CAT_CAPEX?"capex":"opex").length>0&&!p.desc&&(
                <div style={{marginTop:4}}>
                  <div style={{fontSize:9,color:C.grayMid,marginBottom:3,textTransform:"uppercase",letterSpacing:0.5}}>Sugerencias del historial:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {buscarHistorial(p.cat,catOptions===CAT_CAPEX?"capex":"opex").map((h,hi)=>(
                      <button key={hi} onClick={()=>onUpdate({...p,cat:h.cat,desc:h.desc,unidad:h.unidad,cantidad:h.cantidad,monto:h.monto})}
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
            </div>
            <input value={p.desc} onChange={e=>onUpdate({...p,desc:e.target.value})}
              placeholder="Descripción"
              style={{padding:"7px 10px",border:`1px solid ${C.grayBorder}`,
                borderRadius:6,fontSize:12,outline:"none",boxSizing:"border-box",width:"100%"}}/>
            <select value={p.unidad} onChange={e=>onUpdate({...p,unidad:e.target.value})}
              style={{padding:"7px 6px",border:`1px solid ${C.grayBorder}`,
                borderRadius:6,fontSize:12,width:"100%"}}>
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
              <select value={p.mesGasto??0} onChange={e=>onUpdate({...p,mesGasto:parseInt(e.target.value)})}
                title="Mes en que se realiza este gasto"
                style={{padding:"7px 5px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  fontSize:11,width:"100%",background:C.white,color:C.grayDark}}>
                {Array.from({length:13},(_,i)=>
                  <option key={i} value={i}>M{i}{i===0?" (Inst.)":""}</option>
                )}
              </select>
            )}
            {showPeriod&&(
              <select value={p.periodicidad||"mensual"} onChange={e=>onUpdate({...p,periodicidad:e.target.value})}
                title="¿Con qué frecuencia se repite este gasto?"
                style={{padding:"7px 5px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  fontSize:11,width:"100%",background:C.white}}>
                {PERIODICIDADES.map(pd=><option key={pd.id} value={pd.id}>{pd.label}</option>)}
              </select>
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
      {/* Add row */}
      <button onClick={onAdd}
        style={{width:"100%",marginTop:10,padding:"9px",
          border:`1.5px dashed ${C.grayBorder}`,borderRadius:6,
          background:"transparent",cursor:"pointer",color:C.grayMid,
          fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
          transition:"all 0.15s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=headerColor;e.currentTarget.style.color=headerColor;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.grayBorder;e.currentTarget.style.color=C.grayMid;}}>
        <span style={{fontSize:16}}>+</span> {addLabel}
      </button>
    </div>
  );
}

// ─── NOMINA TABLE ─────────────────────────────────────────────────────────────
function NominaTable({nomina,onUpdate,onRemove,onAdd}){
  return(
    <div>
      {nomina.length>0&&(
        <div style={{display:"grid",
          gridTemplateColumns:"2fr 100px 50px 1fr 70px 70px 110px 32px",
          gap:8,padding:"0 0 6px 0",marginBottom:2,
          borderBottom:`1px solid ${C.line}`}}>
          {["Puesto","Tipo","Cant.","Salario/mes","IMSS+PT","Prestac.","Costo total",""].map((h,i)=>(
            <div key={i} style={{fontSize:10,fontWeight:700,color:C.grayMid,
              textTransform:"uppercase",letterSpacing:0.3,
              textAlign:i>=2?"right":"left"}}>{h}</div>
          ))}
        </div>
      )}
      {nomina.map((p,idx)=>{
        const factor=1+(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR);
        const costo=(p.salario||0)*factor*(p.cantidad||1);
        const meses = mesesNomina(p, 12);
        const costoTotal = costoTotalNomina(p, 12);
        return(
          <div key={p.id} style={{marginBottom:8}}>
            <div style={{display:"grid",
              gridTemplateColumns:"2fr 100px 50px 1fr 70px 70px 110px 32px",
              gap:8,alignItems:"center",padding:"6px 0",
              borderBottom:idx<nomina.length-1?`1px solid ${C.line}`:"none"}}>
              {/* Puesto */}
              <CatalogInput value={p.puesto==="Otro"?p.puestoCustom||"":p.puesto}
                onChange={v=>{
                  if(PUESTOS_CAT.includes(v)) onUpdate({...p,puesto:v,puestoCustom:""});
                  else onUpdate({...p,puesto:"Otro",puestoCustom:v});
                }}
                options={PUESTOS_CAT} placeholder="Puesto" allowCustom={true}/>
              {/* Tipo de personal */}
              <select value={p.tipoPersonal||"fijo"}
                onChange={e=>onUpdate({...p,tipoPersonal:e.target.value})}
                style={{padding:"7px 5px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  fontSize:11,width:"100%",background:C.white}}>
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
                {fmt(p.salario)} × (1+{p.imss}+{p.prestaciones}+{p.isr||F_ISR}) × {p.cantidad} = <strong>{fmt(costo)}/mes</strong>
              </span>
              {(p.tipoPersonal==="contrato"||p.tipoPersonal==="outsourcing")&&(
                <span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:C.grayMid}}>Meses de contrato:</span>
                  <input type="number" min="1" max="240" value={p.mesesContrato||12}
                    onChange={e=>onUpdate({...p,mesesContrato:parseInt(e.target.value)||1})}
                    style={{width:48,padding:"2px 5px",border:`1px solid #bbf7d0`,
                      borderRadius:4,fontSize:11,textAlign:"center"}}/>
                  <span style={{color:"#059669",fontWeight:700}}>× Total: {fmt(costoTotal)}</span>
                </span>
              )}
              {p.tipoPersonal==="fijo"&&(
                <span style={{color:"#059669",fontWeight:700}}>× 12 meses = {fmt(costoTotal)}</span>
              )}
            </div>
          </div>
        );
      })}
      <button onClick={onAdd}
        style={{width:"100%",marginTop:10,padding:"9px",
          border:"1.5px dashed #bbf7d0",borderRadius:6,
          background:"transparent",cursor:"pointer",color:"#059669",
          fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#059669";}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#bbf7d0";}}>
        <span style={{fontSize:16}}>+</span> Agregar puesto
      </button>
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SCard({title,subtitle,total,accentColor,children}){
  return(
    <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,
      borderRadius:10,overflow:"hidden",marginBottom:14,
      boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
      <div style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",
        alignItems:"center",borderBottom:`1px solid ${C.line}`,
        borderLeft:`3px solid ${accentColor}`}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:C.grayDark}}>{title}</div>
          {subtitle&&<div style={{fontSize:11,color:C.grayMid,marginTop:2}}>{subtitle}</div>}
        </div>
        {total!==undefined&&(
          <div style={{fontSize:15,fontWeight:800,color:accentColor}}>{fmt(total)}</div>
        )}
      </div>
      <div style={{padding:18}}>{children}</div>
    </div>
  );
}

// ─── CHARTS ──────────────────────────────────────────────────────────────────
function LineChart({series,height=260}){
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
      {/* Etiquetas X */}
      {Array.from({length:n},(_,i)=>{
        const lbl=MESES[i%12]||`M${i}`;
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


// ─── EXPORTAR EXCEL (SheetJS) ────────────────────────────────────────────────
async function exportarExcel({pres, areas, costos, ingresos, mCapex, mOpex, mEgresos,
  mFlujo, mFlujoAcum, mIngresos, totalCAPEX, totalOPEX, totalEgr,
  totalIngresosAnual, MESES13, NMESES, totalNom, totalCat}) {
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
  const hdrS=["Descripción","Total Presupuestado",...MESES13];
  const rowsS=[
    hdrS,
    ["INGRESOS año MXN",""],
    ["FACTURACIÓN",totalIngresosAnual,...mIngresos],
    ["EGRESOS año",""],
    ["CAPEX (Activos)",totalCAPEX,...mCapex],
    ["OPEX",totalOPEX,...mOpex],
    ["TOTAL",totalEgr,...mEgresos],
    ["OPEX",totalOPEX,...mOpex],
    ["ACUMULADO","",...mFlujoAcum],
  ];
  // Agregar detalle por categoría OPEX
  const catMap={};
  areas.forEach(id=>{
    ["mat","via"].forEach(c=>{
      (costos[id]?.[c]||[]).forEach(p=>{
        const k=p.cat||"SIN CAT";
        catMap[k]=(catMap[k]||0)+(p.cantidad||0)*(p.monto||0);
      });
    });
    const nom=totalNom(id);
    if(nom>0) catMap["NOMINA Y ADICIONALES"]=(catMap["NOMINA Y ADICIONALES"]||0)+nom*12;
  });
  Object.entries(catMap).sort().forEach(([cat,total])=>{
    const mens=parseFloat((total/12).toFixed(2));
    rowsS.push([cat,total,0,...Array(12).fill(mens)]);
  });
  const wsS=XLSX.utils.aoa_to_sheet(rowsS);
  wsS["!cols"]=[{wch:32},{wch:18},...Array(NMESES).fill({wch:14})];
  // Formato moneda en todas las columnas numéricas
  applyMoneyFmt(wsS, 2, 1, rowsS.length-1, NMESES+1);
  // Fila 0 (header) en negrita
  for(let c=0;c<=NMESES+1;c++){
    const a=XLSX.utils.encode_cell({r:0,c});
    if(wsS[a]) wsS[a].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"1a1a1a"}},alignment:{horizontal:"center"}};
  }
  // Filas de sección (INGRESOS, EGRESOS) en color
  [1,3].forEach(ri=>{
    for(let c=0;c<=NMESES+1;c++){
      const a=XLSX.utils.encode_cell({r:ri,c});
      if(wsS[a]) wsS[a].s={font:{bold:true,color:{rgb:"FFFFFF"}},fill:{fgColor:{rgb:"374151"}}};
    }
  });
  XLSX.utils.book_append_sheet(wb,wsS,"SERVICIO");

  // ── Hoja 2: FLUJO ─────────────────────────────────────────────────────────
  const rowsF=[
    ["","","","","Mes 0","Mes 0",...Array(11).fill("").map((_,i)=>`Mes ${i+1}`)],
    ["","","","","ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","FEB"],
    ["Ingresos (MN)","","","",""],
    ["INGRESOS","","","","",...mIngresos],
    ["Ingresos Totales (MN)","","","","",...mIngresos],
    [""],
    ["Egresos (MX)","","","",""],
    ["OPEX","","","","",...mOpex],
    ["CAPEX","","","","",...mCapex],
    [""],
    ["Egresos Totales (MN)","","","","",...mEgresos],
    [""],
    ["FLUJO EFECTIVO","","","","",...mFlujo],
    [""],
    ["FLUJO ACUMULADO","","","","",...mFlujoAcum],
    [""],
    ["OPEX Promedio",(totalOPEX/12).toFixed(2)],
  ];
  const wsF=XLSX.utils.aoa_to_sheet(rowsF);
  wsF["!cols"]=[{wch:24},{wch:8},{wch:8},{wch:8},...Array(NMESES).fill({wch:14})];
  applyMoneyFmt(wsF, 3, 4, rowsF.length-1, 4+NMESES);
  // Header principal oscuro
  for(let c=0;c<4+NMESES;c++){
    const a=XLSX.utils.encode_cell({r:0,c});
    if(wsF[a]) wsF[a].s={font:{bold:true,color:{rgb:"DDAC00"}},fill:{fgColor:{rgb:"1a1a1a"}}};
  }
  // Filas FLUJO EFECTIVO y ACUMULADO en color
  [12,14].forEach(ri=>{
    for(let c=0;c<4+NMESES;c++){
      const a=XLSX.utils.encode_cell({r:ri,c});
      if(wsF[a]) wsF[a].s={font:{bold:true,color:{rgb:"7c3aed"}},fill:{fgColor:{rgb:"F5F3FF"}}};
    }
  });
  XLSX.utils.book_append_sheet(wb,wsF,"FLUJO");

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
      const f=1+(p.imss||0.32)+(p.prestaciones||0.40)+(p.isr||0.05);
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
  XLSX.utils.book_append_sheet(wb,wsE,"EGRESOS");

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
    ["Ingresos totales:",totalIngresosAnual],
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
  const fileName=`Presupuesto_${(pres?.nombre||"GEOLIS").replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb,fileName);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [step,setStep]         = useState(0);
  const [pres,setPres]         = useState(null);   // presupuesto activo
  const [areas,setAreas]       = useState([]);
  const [costos,setCostos]     = useState({});
  const [areaActiva,setActiva] = useState(null);
  const [capexPM,setCapexPM]   = useState([]);
  const [opexPM,setOpexPM]     = useState([]);
  const [lista,setLista]       = useState([
    {id:1,nombre:"Monitoreo Cuervito",tipo:"servicio",   estado:"Borrador",   fecha:"2026-02-01"},
    {id:2,nombre:"BEH Jujo F218358",  tipo:"instalacion",estado:"En revisión",fecha:"2026-01-15"},
  ]);
  const [form,setForm]         = useState({nombre:"",tipo:"",empresa:"GEOLIS SA DE CV",fechaInicio:"",fechaFin:"",fechaElaboracion:new Date().toISOString().slice(0,10)});
  const [plantModal,setPlantModal] = useState(false);
  const [plantKey,setPlantKey]     = useState(null);
  const [modoEdit,setModoEdit]     = useState(false);
  const [toast,setToast]           = useState(null);
  const [areaSaved,setAreaSaved]   = useState(false); // al menos un área guardada
  // Estado para abrir presupuesto después del render (evita race condition)
  const [presToOpen, setPresToOpen] = useState(null);
  const isOpening = useRef(false); // flag: no guardar en localStorage mientras se abre
  // Ingresos mes a mes (13 meses: M0..M12)
  const [ingresos,setIngresos]     = useState(Array(13).fill(0));
  const [precioFijo,setPrecioFijo]  = useState(0);   // precio mensual fijo del servicio
  const [ingAdicionales,setIngAd]   = useState([]);  // [{id,mes,anio,monto,desc}]

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
  },[]);
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
    setAreaSaved(saved);
    setActiva(primera);
    setStep(3);
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
  function totalCat(id,cat){return(costos[id]?.[cat]||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);}
  function totalNom(id){return(costos[id]?.nomina||[]).reduce((s,p)=>{const f=1+(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR);return s+(p.salario||0)*f*(p.cantidad||1);},0);}
  const capexAreas=areas.reduce((s,id)=>s+totalCat(id,"capex"),0);
  const opexAreas =areas.reduce((s,id)=>s+totalCat(id,"mat")+totalNom(id)*12+totalCat(id,"via"),0);
  const capexPMt  =capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const opexPMt   =opexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const totalCAPEX=capexAreas+capexPMt;
  const totalOPEX =opexAreas +opexPMt;
  const totalEgr  =totalCAPEX+totalOPEX;

  // ── Acciones ────────────────────────────────────────────────────────────────
  function abrirNuevo(){
    setForm({nombre:"",tipo:"",empresa:"GEOLIS SA DE CV",fechaInicio:"",fechaFin:""});
    setAreas([]); setCostos({}); setCapexPM([]); setOpexPM([]); setIngresos(Array(13).fill(0)); setPrecioFijo(0); setIngAd([]);
    setPlantKey(null); setPres(null); setModoEdit(false); setAreaSaved(false);
    setStep(1);
  }
  function abrirEdit(p){
    setForm({nombre:p.nombre,tipo:p.tipo,empresa:p.empresa||"GEOLIS SA DE CV",
      fechaInicio:p.fechaInicio||"",fechaFin:p.fechaFin||""});
    setAreas(p._areas||[]); setCostos(p._costos||{});
    setCapexPM(p._capexPM||[]); setOpexPM(p._opexPM||[]);
    setPlantKey(null); setPres(p); setModoEdit(true);
    setAreaSaved((p._areas||[]).some(id=>(p._costos||{})[id]?.estado==="guardado"));
    setStep(1);
  }

  // FIX 6 v4: Abrir presupuesto — flag pausa el guardado en localStorage
  function abrirPresupuesto(p){
    isOpening.current = true;
    setPresToOpen(p);
  }

  // PUNTO 9: Clonar presupuesto como base de uno nuevo
  function clonarPresupuesto(p){
    const hoy = new Date().toISOString().slice(0,10);
    setForm({
      nombre: p.nombre + " (copia)",
      tipo: p.tipo,
      empresa: p.empresa||"GEOLIS SA DE CV",
      fechaInicio: p.fechaInicio||hoy,
      fechaFin: p.fechaFin||"",
      fechaElaboracion: hoy,
    });
    // Copiar partidas con nuevos IDs
    setCapexPM((p._capexPM||[]).map(x=>({...x,id:uid()})));
    setOpexPM((p._opexPM||[]).map(x=>({...x,id:uid()})));
    // Copiar costos de áreas con nuevos IDs
    const nuevosCostos={};
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
    setAreas(p._areas||[]);
    setCostos(nuevosCostos);
    setPres(null); setModoEdit(false);
    setPlantKey(null); setAreaSaved(false);
    setStep(1);
  }

  function guardarPres(){
    const snap={...form,estado:"Borrador",fecha:new Date().toISOString().slice(0,10),
      _areas:areas,_costos:costos,_capexPM:capexPM,_opexPM:opexPM,_ingresos:ingresos};
    if(modoEdit&&pres){
      const u={...pres,...snap};
      setLista(prev=>prev.map(x=>x.id===pres.id?u:x));
      setPres(u);
    } else {
      const p={id:uid(),...snap};
      setLista(prev=>[p,...prev]);
      setPres(p);
    }
    setAreas([]); setCostos({}); setCapexPM([]); setOpexPM([]);
    setStep(2);
  }

  function cargarPlantilla(key){
    const pl=PLANTILLAS[key];
    if(!pl)return;
    setCapexPM(pl.capex.map(p=>initP(p)));
    setOpexPM(pl.opex.map(p=>initP(p)));
    setPlantKey(key);
    setPlantModal(false);
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
        const capexBase = (plData.capex||[]).map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto}));
        // OPEX: separar nómina de materiales
        const nomBase = (plData.nomina||[]).map(p=>initN({puesto:p.puesto,cantidad:p.cantidad||1,salario:p.salario||0}));
        // Del opex de la plantilla — los que son NOMINA van a nómina, resto a mat
        const opexNom = (plData.opex||[]).filter(p=>p.cat?.toUpperCase().includes("NOMINA"));
        const opexMat = (plData.opex||[]).filter(p=>!p.cat?.toUpperCase().includes("NOMINA")&&!p.cat?.toUpperCase().includes("VIATICO"));
        const opexVia = (plData.opex||[]).filter(p=>p.cat?.toUpperCase().includes("VIATICO"));
        const matBase = opexMat.map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto}));
        const viaBase = opexVia.map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto}));
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

  function guardarArea(id){
    setCostos(prev=>({...prev,[id]:{...prev[id],estado:"guardado"}}));
    setAreaSaved(true);
    showToast("Costos guardados correctamente");
  }

  // ── BTN ──────────────────────────────────────────────────────────────────────
  const btn=(label,onClick,variant="primary",disabled=false)=>(
    <button onClick={onClick} disabled={disabled} style={{
      padding:"9px 22px",borderRadius:8,border:"none",
      cursor:disabled?"not-allowed":"pointer",fontWeight:700,fontSize:13,
      transition:"opacity 0.15s",opacity:disabled?0.5:1,
      background:variant==="primary"?C.yellow:variant==="success"?C.success:
        variant==="danger"?C.danger:C.white,
      color:variant==="primary"?C.grayDark:variant==="success"||variant==="danger"?C.white:C.grayMid,
      outline:variant==="secondary"?`1px solid ${C.grayBorder}`:"none",
      boxShadow:variant==="primary"?"0 2px 8px rgba(221,172,0,0.3)":
        variant==="success"?"0 2px 8px rgba(30,126,52,0.25)":"none",
    }}>{label}</button>
  );

  // ── LAYOUT ───────────────────────────────────────────────────────────────────
  const NAV=[
    {i:0,icon:"◉",label:"Presupuestos"},
    {i:1,icon:"○",label:"Info general"},
    {i:2,icon:"○",label:"Áreas"},
    {i:3,icon:"○",label:"Capturar costos"},
    {i:4,icon:"○",label:"Resumen mensual",locked:!areaSaved},
  ];

  const wrap=(children,bc="")=>(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"Inter,-apple-system,sans-serif",background:C.contentBg}}>
      <style>{`
        @media (max-width: 900px) {
          .sidebar-nav { width: 60px !important; }
          .sidebar-nav .nav-label { display: none !important; }
          .sidebar-nav .sidebar-logo-text { display: none !important; }
          .main-content { margin-left: 60px !important; }
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
        }
        @media print {
          .sidebar-nav { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .noprint { display: none !important; }
          #rpdf, #rpdf * { visibility: visible; }
          body * { visibility: hidden; }
          #rpdf { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {/* Sidebar */}
      <aside style={{width:220,background:C.sidebar,flexShrink:0,
        display:"flex",flexDirection:"column",position:"fixed",
        top:0,left:0,bottom:0,zIndex:50}}>
        <div style={{padding:"22px 20px 18px",borderBottom:"1px solid #222"}}>
          <div style={{fontSize:10,color:"#444",letterSpacing:2.5,textTransform:"uppercase",marginBottom:6}}>Corporativo</div>
          <div className="sidebar-logo-text" style={{fontSize:22,fontWeight:900,color:C.yellow,letterSpacing:-0.5}}>GEOLIS</div>
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
        {pres&&step>0&&(
          <div style={{padding:"14px 18px",borderTop:"1px solid #1E1E1E"}}>
            <div style={{fontSize:10,color:"#444",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Activo</div>
            <div style={{fontSize:12,fontWeight:700,color:C.yellow,lineHeight:1.3,wordBreak:"break-word"}}>{pres.nombre}</div>
            <div style={{fontSize:10,color:"#555",marginTop:3,textTransform:"capitalize"}}>{pres.tipo}</div>
            {pres.fechaElaboracion&&(
              <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #1E1E1E"}}>
                <div style={{fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>Elaboración</div>
                <div style={{fontSize:11,color:C.yellow,fontWeight:600}}>{pres.fechaElaboracion}</div>
              </div>
            )}
            {(pres.fechaInicio||pres.fechaFin)&&(
              <div style={{marginTop:6}}>
                <div style={{fontSize:9,color:"#444",textTransform:"uppercase",letterSpacing:0.8,marginBottom:3}}>Vigencia</div>
                <div style={{fontSize:10,color:"#888"}}>{pres.fechaInicio||'—'}</div>
                <div style={{fontSize:9,color:"#555"}}>→ {pres.fechaFin||'—'}</div>
              </div>
            )}
          </div>
        )}
      </aside>
      {/* Main */}
      <div className="main-content" style={{flex:1,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <header style={{background:C.white,borderBottom:`1px solid ${C.line}`,
          padding:"0 32px",height:52,display:"flex",alignItems:"center",
          justifyContent:"space-between",position:"sticky",top:0,zIndex:40,
          boxShadow:"0 1px 0 rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}>
            <span style={{cursor:"pointer",color:C.yellowDark,fontWeight:600}}
              onClick={()=>setStep(0)}>Inicio</span>
            {bc&&<><span style={{color:C.grayBorder}}>/</span>
              <span style={{color:C.grayDark,fontWeight:600}}>{bc}</span></>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            {areaSaved&&step===3&&(
              <button onClick={()=>setStep(4)}
                style={{padding:"6px 16px",background:C.yellowLight,
                  border:`1px solid ${C.yellowBorder}`,borderRadius:7,
                  cursor:"pointer",fontSize:12,fontWeight:700,color:C.yellowDark,
                  display:"flex",alignItems:"center",gap:6}}>
                Ver Resumen mensual →
              </button>
            )}
            <span style={{fontSize:12,color:C.grayMid}}>{form.empresa||pres?.empresa||"GEOLIS SA DE CV"}</span>
          </div>
        </header>
        <main style={{padding:"28px 32px",flex:1}}>{children}</main>
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
        {/* Header tabla */}
        <div style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 160px",gap:0,
          padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${C.line}`}}>
          {["Proyecto","Tipo","Estado","Acciones"].map((h,i)=>(
            <div key={h} style={{fontSize:11,fontWeight:700,color:C.grayMid,
              textTransform:"uppercase",letterSpacing:0.5,
              textAlign:i===3?"center":"left"}}>{h}</div>
          ))}
        </div>
        {lista.map((p,i)=>(
          <div key={p.id} style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 160px",
            gap:0,alignItems:"center",padding:"14px 20px",
            background:i%2===0?C.white:"#FAFAFA",
            borderBottom:i<lista.length-1?`1px solid ${C.line}`:"none",
            transition:"background 0.1s"}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:C.grayDark}}>{p.nombre}</div>
              <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>{p.fecha}</div>
            </div>
            <div style={{fontSize:13,color:C.grayMid,textTransform:"capitalize"}}>{p.tipo}</div>
            <div><EstadoBadge estado={p.estado}/></div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={()=>{
                // FIX 6 v2: usar abrirPresupuesto para evitar race condition de setState
                abrirPresupuesto(p);
              }}
                style={{padding:"6px 14px",background:C.yellow,border:"none",
                  borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,color:C.grayDark,
                  boxShadow:"0 1px 6px rgba(221,172,0,0.25)"}}>Abrir</button>
              {(p.estado==="Borrador"||p.estado==="En revisión")&&(
                <button onClick={()=>abrirEdit(p)}
                  style={{padding:"6px 14px",background:C.white,
                    border:`1px solid ${C.grayBorder}`,borderRadius:6,
                    cursor:"pointer",fontSize:12,fontWeight:600,color:C.grayMid}}>Editar</button>
              )}
              <button onClick={()=>clonarPresupuesto(p)}
                title="Crear nuevo presupuesto basado en este"
                style={{padding:"6px 14px",background:C.white,
                  border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  cursor:"pointer",fontSize:12,fontWeight:600,color:C.grayMid}}>
                Clonar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ,"Presupuestos");

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — INFO GENERAL
  // ══════════════════════════════════════════════════════════════════════════
  if(step===1){
    const sug=plantillasSugeridas(form.tipo);
    return wrap(
      <div style={{maxWidth:740}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:C.grayDark}}>
            {modoEdit?"Editar presupuesto":"Nuevo presupuesto"}
          </h2>
          {modoEdit&&pres&&<EstadoBadge estado={pres.estado}/>}
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
                    border:`1px solid ${!form.nombre?"#C0392B":C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none",
                    background:!form.nombre?"#FFF5F5":C.white}}/>
              </div>
              <div>
                <FL>Empresa</FL>
                <input value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div>
                <FL required>Fecha inicio</FL>
                <input type="date" value={form.fechaInicio} onChange={e=>setForm({...form,fechaInicio:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",
                    border:`1px solid ${!form.fechaInicio?"#C0392B":C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none",
                    background:!form.fechaInicio?"#FFF5F5":C.white}}/>
              </div>
              <div>
                <FL required>Fecha fin</FL>
                <input type="date" value={form.fechaFin} onChange={e=>setForm({...form,fechaFin:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",
                    border:`1px solid ${!form.fechaFin?"#C0392B":C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none",
                    background:!form.fechaFin?"#FFF5F5":C.white}}/>
              </div>
              <div>
                <FL>Fecha de elaboración</FL>
                <input type="date" value={form.fechaElaboracion} onChange={e=>setForm({...form,fechaElaboracion:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <FL required>Tipo de presupuesto {!form.tipo&&<span style={{color:C.danger,fontSize:10,fontWeight:400,marginLeft:6}}>← selecciona uno para continuar</span>}</FL>
                <div className="tipo-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:2}}>
                  {[
                    {id:"instalacion", label:"Instalación",  icon:"🏗️",desc:"Proyectos de campo"},
                    {id:"servicio",    label:"Servicio",      icon:"⚙️", desc:"Servicio recurrente"},
                    {id:"departamento",label:"Departamento",  icon:"🏢",desc:"Área interna"},
                    {id:"suministro",  label:"Suministro",    icon:"📦",desc:"Compra de materiales"},
                  ].map(t=>(
                    <div key={t.id}
                      onClick={()=>{
                        setForm({...form,tipo:t.id});
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
                      <div style={{fontSize:10,color:C.grayMid,marginTop:3}}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Cargar presupuesto base — solo si hay tipo seleccionado */}
        {form.tipo&&(
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
                  border:`2px solid`,borderColor:plantKey?C.yellow:C.grayBorder,
                  borderRadius:10,cursor:"pointer",background:plantKey?C.yellowLight:C.white,
                  transition:"all 0.15s"}}
                onMouseEnter={e=>{if(!plantKey)e.currentTarget.style.borderColor=C.yellow;}}
                onMouseLeave={e=>{if(!plantKey)e.currentTarget.style.borderColor=C.grayBorder;}}>
                <span style={{fontSize:28}}>📋</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:C.grayDark}}>
                    {plantKey?`✓ ${PLANTILLAS[plantKey]?.nombre}`:"Partir de un presupuesto anterior"}
                  </div>
                  <div style={{fontSize:11,color:C.grayMid,marginTop:3}}>
                    {plantKey
                      ?`${PLANTILLAS[plantKey]?.capex?.length} CAPEX · ${PLANTILLAS[plantKey]?.opex?.length} OPEX cargados — editables`
                      :"Carga partidas de Cuervito, TI u otro proyecto existente"}
                  </div>
                </div>
              </div>
              {/* Opción B: desde cero */}
              <div onClick={()=>{setCapexPM([]);setOpexPM([]);setPlantKey(null);}}
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
        )}
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {btn("Cancelar",()=>setStep(0),"secondary")}
          {/* FIX 1b: Mostrar errores de validación inline */}
          {(!form.nombre||!form.tipo||!form.fechaInicio||!form.fechaFin)&&(
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
              {!form.nombre&&<span style={{padding:"4px 10px",background:C.dangerLight,color:C.danger,borderRadius:6,fontSize:12,fontWeight:600}}>⚠ Nombre del proyecto requerido</span>}
              {!form.tipo&&<span style={{padding:"4px 10px",background:C.dangerLight,color:C.danger,borderRadius:6,fontSize:12,fontWeight:600}}>⚠ Selecciona el tipo de presupuesto</span>}
              {!form.fechaInicio&&<span style={{padding:"4px 10px",background:C.dangerLight,color:C.danger,borderRadius:6,fontSize:12,fontWeight:600}}>⚠ Fecha inicio requerida</span>}
              {!form.fechaFin&&<span style={{padding:"4px 10px",background:C.dangerLight,color:C.danger,borderRadius:6,fontSize:12,fontWeight:600}}>⚠ Fecha fin requerida</span>}
            </div>
          )}
          {btn(modoEdit?"Guardar":"Continuar",guardarPres,"primary",!form.nombre||!form.tipo||!form.fechaInicio||!form.fechaFin)}
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
              <div style={{marginTop:16,padding:"12px 16px",background:"#F8F8F8",borderRadius:8,border:`1px solid ${C.grayBorder}`}}>
                <div style={{fontSize:12,fontWeight:700,color:C.grayDark,marginBottom:6}}>¿Prefieres empezar desde cero?</div>
                <div style={{fontSize:11,color:C.grayMid,marginBottom:10}}>Las secciones de captura iniciarán vacías. Tú agregas cada partida manualmente.</div>
                <button onClick={()=>{
                  // LIMPIAR todo al iniciar desde cero
                  setCapexPM([]); setOpexPM([]); setPlantKey(null);
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
    ,modoEdit?"Editar":"Nuevo presupuesto");
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
          <div className="areas-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
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
          {btn("Atrás",()=>setStep(1),"secondary")}
          {btn("Confirmar",confirmarAreas,"primary",areas.length===0)}
        </div>
      </div>
    ,"Áreas");
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
    const opexA  =areaActiva?totalCat(areaActiva,"mat")+nomMes*12+totalCat(areaActiva,"via"):0;

    return wrap(
      <div>
        <style>{`.noprint{}.@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        <div className="capture-grid" style={{display:"grid",gridTemplateColumns:"224px 1fr",gap:20}}>

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
                    style={{display:"flex",alignItems:"center",gap:10,
                      padding:"11px 14px",cursor:"pointer",
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
            {/* Totales sidebar */}
            <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,
              borderRadius:10,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{fontSize:10,fontWeight:700,color:C.grayMid,
                textTransform:"uppercase",letterSpacing:0.5,marginBottom:12}}>Totales</div>
              {[{l:"CAPEX",v:totalCAPEX,c:C.yellowDark},{l:"OPEX",v:totalOPEX,c:C.grayDark}].map(r=>(
                <div key={r.l} style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:C.grayMid,marginBottom:2}}>{r.l}</div>
                  <div style={{fontSize:15,fontWeight:800,color:r.c}}>{fmt(r.v)}</div>
                </div>
              ))}
              <div style={{paddingTop:10,borderTop:`1px solid ${C.line}`}}>
                <div style={{fontSize:10,color:C.grayMid,marginBottom:2}}>Total egresos</div>
                <div style={{fontSize:16,fontWeight:800,color:C.grayDark}}>{fmt(totalEgr)}</div>
              </div>
            </div>
          </div>

          {/* Panel captura */}
          <div style={{minWidth:0}}>
            {!areaActiva?(
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
                <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                  {[
                    {l:"CAPEX del área",  v:capexA, c:"#7c3aed",bg:"#faf5ff"},
                    {l:"OPEX del área",   v:opexA,  c:"#0891b2",bg:"#f0f9ff"},
                    {l:"Total",           v:capexA+opexA,c:C.grayDark,bg:C.grayLight},
                  ].map(k=>(
                    <div key={k.l} style={{background:k.bg,border:`1px solid ${k.c}18`,
                      borderRadius:8,padding:"12px 14px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:k.c,
                        textTransform:"uppercase",letterSpacing:0.3}}>{k.l}</div>
                      <div style={{fontSize:17,fontWeight:800,color:k.c,marginTop:5}}>{fmt(k.v)}</div>
                    </div>
                  ))}
                </div>

                {/* CAPEX */}
                <SCard title="CAPEX · Equipos e inversiones"
                  subtitle="Inversiones únicas: maquinaria, equipos, activos"
                  total={capexA} accentColor="#7c3aed">
                  <PartidaTable
                    partidas={datos?.capex||[]}
                    onUpdate={u=>upP(areaActiva,"capex",u.id,u)}
                    onRemove={rmP(areaActiva,"capex")}
                    onAdd={()=>addP(areaActiva,"capex")}
                    catOptions={CAT_CAPEX}
                    addLabel="Agregar equipo / inversión"
                    headerColor="#7c3aed"
                    showMes={true}/>
                </SCard>

                {/* Nómina */}
                <SCard title="OPEX · Nómina y Mano de Obra"
                  subtitle="Costo real por puesto incluyendo cargas sociales"
                  total={nomMes} accentColor="#059669">
                  <NominaTable
                    nomina={datos?.nomina||[]}
                    onUpdate={u=>upP(areaActiva,"nomina",u.id,u)}
                    onRemove={rmN(areaActiva)}
                    onAdd={()=>addN(areaActiva)}/>
                  {nomMes>0&&<div style={{marginTop:10,fontSize:11,color:C.grayMid,textAlign:"right"}}>
                    Costo anual nómina: <strong style={{color:"#059669"}}>{fmt(nomMes*12)}</strong>
                  </div>}
                </SCard>

                {/* Materiales */}
                <SCard title="OPEX · Materiales"
                  subtitle="Materiales e insumos recurrentes"
                  total={totalCat(areaActiva,"mat")} accentColor="#0891b2">
                  <PartidaTable
                    partidas={datos?.mat||[]}
                    onUpdate={u=>upP(areaActiva,"mat",u.id,u)}
                    onRemove={rmP(areaActiva,"mat")}
                    onAdd={()=>addP(areaActiva,"mat")}
                    catOptions={CAT_OPEX}
                    addLabel="Agregar material"
                    headerColor="#0891b2"
                    showPeriod={true}/>
                </SCard>

                {/* Viáticos */}
                <SCard title="OPEX · Viáticos"
                  subtitle="Viáticos, hospedaje y gastos de campo"
                  total={totalCat(areaActiva,"via")} accentColor="#d97706">
                  <PartidaTable
                    partidas={datos?.via||[]}
                    onUpdate={u=>upP(areaActiva,"via",u.id,u)}
                    onRemove={rmP(areaActiva,"via")}
                    onAdd={()=>addP(areaActiva,"via")}
                    catOptions={CAT_OPEX}
                    addLabel="Agregar viático"
                    headerColor="#d97706"
                    showPeriod={true}/>
                </SCard>

                <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                  {btn("Guardar",()=>guardarArea(areaActiva),"success")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ,"Capturar costos");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4 — RESUMEN MENSUAL COMPLETO
  // ══════════════════════════════════════════════════════════════════════════
  if(step===4){
    const cats=getAreasCat(pres?.tipo||"instalacion");
    const NMESES=13; // M0..M12
    const MESES13=["M0 (Inst.)","M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"];

    // ── Cálculos mensuales ─────────────────────────────────────────────────
    // CAPEX: todo en M0
    const mCapex=Array(NMESES).fill(0);
    mCapex[0]=areas.reduce((s,id)=>s+totalCat(id,"capex"),0)+capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);

    // OPEX: distribuido uniforme M1..M12 (M0 es instalación sin OPEX)
    const totalOpexAnual=areas.reduce((s,id)=>s+totalCat(id,"mat")+totalNom(id)*12+totalCat(id,"via"),0)
      +opexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
    const opexMens=parseFloat((totalOpexAnual/12).toFixed(2));
    const mOpex=Array(NMESES).fill(0).map((_,i)=>i===0?0:opexMens);

    // Egresos totales por mes
    const mEgresos=Array(NMESES).fill(0).map((_,i)=>mCapex[i]+mOpex[i]);

    // Ingresos (estado editable)
    const mIngresos=ingresos.slice(0,NMESES);
    const totalIngresosAnual=mIngresos.reduce((s,v)=>s+v,0)
      + ingAdicionales.reduce((s,x)=>s+x.monto,0);

    // Flujo efectivo mensual = Ingresos - Egresos
    const mFlujo=Array(NMESES).fill(0).map((_,i)=>mIngresos[i]-mEgresos[i]);

    // Flujo acumulado
    const mFlujoAcum=Array(NMESES).fill(0);
    mFlujoAcum[0]=mFlujo[0];
    for(let i=1;i<NMESES;i++) mFlujoAcum[i]=mFlujoAcum[i-1]+mFlujo[i];

    // OPEX por categoría para Gráfica II
    const catOpexData={};
    areas.forEach(id=>{
      ["mat","via"].forEach(cat=>{
        (costos[id]?.[cat]||[]).forEach(p=>{
          const key=p.cat||"SIN CATEGORÍA";
          const v=(p.cantidad||0)*(p.monto||0)/12;
          catOpexData[key]=(catOpexData[key]||0)+v;
        });
      });
      // Nómina mensual por área
      const nomMes=totalNom(id);
      if(nomMes>0) catOpexData["NOMINA Y ADICIONALES"]=(catOpexData["NOMINA Y ADICIONALES"]||0)+nomMes;
    });
    const catOpexSeries=Object.entries(catOpexData)
      .filter(([,v])=>v>0)
      .map(([label,mensual],i)=>({
        label,
        color:["#DDAC00","#374151","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#6366f1"][i%8],
        data:Array(NMESES).fill(0).map((_,mi)=>mi===0?0:mensual),
      }));

    // Totales
    const totalCAPEX=mCapex[0];
    const totalOPEX=totalOpexAnual;
    const totalEgr=totalCAPEX+totalOPEX;
    const utilidad=totalIngresosAnual-totalEgr;
    const margen=totalIngresosAnual>0?((utilidad/totalIngresosAnual)*100):0;

    // ── Helpers de render ──────────────────────────────────────────────────
    const card=(children,mb=16)=>(
      <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,
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
    const fmtK=v=>{
      if(v===0)return "—";
      const abs=Math.abs(v);
      const str=abs>=1000000?`$${(abs/1000000).toFixed(2)}M`:abs>=1000?`$${(abs/1000).toFixed(0)}K`:fmt(abs);
      return v<0?`-${str}`:str;
    };

    // ── Gráfica barras+línea para flujo ────────────────────────────────────
    function FlowChart({barData,lineData,height=300}){
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
          {MESES13.map((m,i)=>(
            <text key={m} x={xP(i)} y={H-10} textAnchor="middle" fontSize="11"
              fill={C.grayMid} fontFamily="Inter,sans-serif">{m}</text>
          ))}
        </svg>
      );
    }

    // ── Gráfica II: líneas por categoría OPEX ──────────────────────────────────
    function CatLinesChart({series,height=300}){
      if(!series||series.length===0) return(
        <div style={{padding:"32px 20px",color:C.grayMid,fontSize:13,textAlign:"center",
          background:"#FAFAFA",borderRadius:8,border:`1px dashed ${C.grayBorder}`}}>
          Captura partidas OPEX en las áreas para ver esta gráfica.
        </div>
      );
      const W=960,H=height,pL=90,pR=130,pT=24,pB=44;
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
          {MESES13.map((m,i)=>(
            <text key={m} x={xP(i)} y={H-10} textAnchor="middle" fontSize="11"
              fill={C.grayMid} fontFamily="Inter,sans-serif">{m}</text>
          ))}
          {/* Líneas por categoría */}
          {series.map((s,si)=>{
            const pts=s.data.map((v,i)=>`${xP(i)},${yP(v)}`).join(" ");
            const lastV=s.data[s.data.length-1];
            const lastY=yP(lastV);
            return <g key={s.label}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round"/>
              {s.data.map((v,i)=>(
                <circle key={i} cx={xP(i)} cy={yP(v)} r="4"
                  fill={s.color} stroke={C.white} strokeWidth="2"/>
              ))}
              {/* Label inline al final de la línea */}
              <text x={pL+cW+8} y={Math.max(pT+10,Math.min(H-pB-4,lastY+4))}
                fontSize="10" fill={s.color} fontWeight="600" fontFamily="Inter,sans-serif">
                {s.label.length>16?s.label.slice(0,16)+"…":s.label}
              </text>
            </g>;
          })}
        </svg>
      );
    }

    // ── Tabla mensual genérica ──────────────────────────────────────────────
    function TablaM({filas,showTotal=true,title}){
      const totMes=Array(NMESES).fill(0).map((_,i)=>filas.reduce((s,f)=>s+(f.datos[i]||0),0));
      const totGen=filas.reduce((s,f)=>s+f.datos.reduce((a,b)=>a+b,0),0);
      return(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:900}}>
            <thead>
              <tr style={{background:C.grayDark}}>
                <td style={{padding:"8px 14px",fontWeight:700,color:C.white,minWidth:160,position:"sticky",left:0,background:C.grayDark}}>Concepto</td>
                {MESES13.map(m=><td key={m} style={{padding:"7px 4px",textAlign:"right",fontWeight:600,color:"#aaa",minWidth:60}}>{m}</td>)}
                <td style={{padding:"7px 12px",textAlign:"right",fontWeight:700,color:C.white}}>Total</td>
              </tr>
            </thead>
            <tbody>
              {filas.map((f,fi)=>(
                <tr key={f.label} style={{background:fi%2===0?C.white:"#FAFAFA",borderBottom:`1px solid ${C.line}`}}>
                  <td style={{padding:"8px 14px",display:"flex",alignItems:"center",gap:8,position:"sticky",left:0,background:fi%2===0?C.white:"#FAFAFA"}}>
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
                    {fmtK(f.datos.reduce((s,v)=>s+v,0))}
                  </td>
                </tr>
              ))}
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
        </div>
      );
    }

    return wrap(
      <div>
        <style>{`@media print{body *{visibility:hidden}#rpdf,#rpdf *{visibility:visible}#rpdf{position:absolute;left:0;top:0;width:100%}.noprint{display:none!important}}`}</style>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800,color:C.grayDark}}>Resumen mensual</h2>
            <div style={{fontSize:13,color:C.grayMid}}>{pres?.nombre} · {pres?.empresa}</div>
            {pres?.fechaElaboracion&&(
              <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>
                Elaborado: <strong>{pres.fechaElaboracion}</strong>
                {pres?.fechaInicio&&<> · Vigencia: {pres.fechaInicio} → {pres?.fechaFin||"—"}</>}
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10}} className="noprint">
            {btn("← Captura",()=>setStep(3),"secondary")}
            {btn("⬇ Excel",()=>exportarExcel({
              pres,areas,costos,ingresos,mCapex,mOpex,mEgresos,
              mFlujo,mFlujoAcum,mIngresos,totalCAPEX,totalOPEX,totalEgr,
              totalIngresosAnual,MESES13,NMESES,totalNom,totalCat
            }),"secondary")}
            {btn("⬇ PDF",()=>window.print(),"primary")}
          </div>
        </div>

        <div id="rpdf">

          {/* ── SECCIÓN: Captura de ingresos ────────────────────────────── */}
          {card(<>
            {sTitle("Ingresos — Facturación proyectada","Precio fijo mensual del servicio × meses del proyecto. Puedes agregar ingresos adicionales en meses específicos.")}

            {/* Precio fijo mensual */}
            <div style={{background:C.successLight,border:`1px solid #bbf7d0`,borderRadius:10,padding:18,marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:13,color:C.success,marginBottom:12}}>
                Precio fijo del servicio (mensual)
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:11,color:C.grayMid,marginBottom:6}}>Monto a facturar por mes</div>
                  <MoneyInput value={precioFijo} onChange={v=>{
                    setPrecioFijo(v);
                    // Distribuir automáticamente en M1..M12
                    const meses=pres?.fechaInicio&&pres?.fechaFin
                      ? Math.max(1,Math.round((new Date(pres.fechaFin)-new Date(pres.fechaInicio))/(1000*60*60*24*30)))
                      : 12;
                    const n=Array(13).fill(0);
                    for(let i=1;i<=Math.min(12,meses);i++) n[i]=v;
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

            {/* Ingresos adicionales */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:C.grayDark}}>Ingresos adicionales</div>
                  <div style={{fontSize:11,color:C.grayMid}}>Renovaciones de contrato, pagos extraordinarios, etc. Se suman al precio fijo.</div>
                </div>
                <button onClick={()=>setIngAd(prev=>[...prev,{id:uid(),mes:1,anio:new Date().getFullYear(),monto:0,desc:"Renovación de contrato"}])}
                  style={{padding:"7px 16px",background:C.yellow,border:"none",borderRadius:7,
                    cursor:"pointer",fontSize:12,fontWeight:700,color:C.grayDark,whiteSpace:"nowrap"}}>
                  + Agregar ingreso
                </button>
              </div>
              {ingAdicionales.length===0&&(
                <div style={{padding:"14px 16px",background:"#F8F8F8",borderRadius:8,
                  border:`1px dashed ${C.grayBorder}`,fontSize:12,color:C.grayMid,textAlign:"center"}}>
                  Sin ingresos adicionales — solo el precio fijo mensual
                </div>
              )}
              {ingAdicionales.map((ing,idx)=>(
                <div key={ing.id} style={{display:"grid",gridTemplateColumns:"110px 90px 1fr 160px 32px",
                  gap:10,alignItems:"end",padding:"10px 0",
                  borderBottom:idx<ingAdicionales.length-1?`1px solid ${C.line}`:"none"}}>
                  <div>
                    <div style={{fontSize:10,color:C.grayMid,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Mes *</div>
                    <select value={ing.mes} onChange={e=>setIngAd(prev=>prev.map(x=>x.id===ing.id?{...x,mes:parseInt(e.target.value)}:x))}
                      style={{width:"100%",padding:"7px 8px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12,background:C.white}}>
                      {Array.from({length:12},(_,i)=>i+1).map(m=>(
                        <option key={m} value={m}>M{m} · {MESES[m-1]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:C.grayMid,marginBottom:4,textTransform:"uppercase",letterSpacing:0.4}}>Año *</div>
                    <input type="number" value={ing.anio} min={2024} max={2045}
                      onChange={e=>setIngAd(prev=>prev.map(x=>x.id===ing.id?{...x,anio:parseInt(e.target.value)||2026}:x))}
                      style={{width:"100%",padding:"7px 8px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12}}/>
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
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",fontSize:11,minWidth:800,width:"100%"}}>
                <thead>
                  <tr style={{background:"#059669"}}>
                    <td style={{padding:"8px 14px",fontWeight:700,color:C.white,minWidth:140}}>Concepto</td>
                    {MESES13.map(m=><td key={m} style={{padding:"6px 4px",textAlign:"right",fontWeight:600,color:"rgba(255,255,255,0.8)",minWidth:55}}>{m}</td>)}
                    <td style={{padding:"6px 12px",textAlign:"right",fontWeight:700,color:C.white}}>Total</td>
                  </tr>
                </thead>
                <tbody>
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
                  {ingAdicionales.length>0&&(
                    <tr style={{background:"#F0FFF4"}}>
                      <td style={{padding:"8px 14px",fontWeight:600,color:"#065F46"}}>+ Adicionales</td>
                      {MESES13.map((_,i)=>{
                        const suma=ingAdicionales.filter(x=>x.mes===i).reduce((s,x)=>s+x.monto,0);
                        return <td key={i} style={{padding:"5px 4px",textAlign:"right",
                          color:suma>0?"#065F46":C.grayBorder,fontWeight:suma>0?600:400}}>
                          {suma>0?fmtK(suma):"—"}
                        </td>;
                      })}
                      <td style={{padding:"6px 12px",textAlign:"right",fontWeight:700,color:"#065F46"}}>
                        {fmt(ingAdicionales.reduce((s,x)=>s+x.monto,0))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>)}

          {/* ── KPIs ────────────────────────────────────────────────────── */}
          <div className="resumen-kpi" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
            {[
              {l:"Ingresos",    v:totalIngresosAnual,c:C.success,   b:C.successLight},
              {l:"CAPEX",       v:totalCAPEX,        c:C.yellowDark,b:C.yellowLight},
              {l:"OPEX",        v:totalOPEX,         c:"#374151",   b:C.grayLight},
              {l:"Total egresos",v:totalEgr,          c:C.danger,    b:C.dangerLight},
              {l:`Utilidad ${margen.toFixed(1)}%`,v:utilidad,
                c:utilidad>=0?C.success:C.danger,b:utilidad>=0?C.successLight:C.dangerLight},
            ].map(k=>(
              <div key={k.l} style={{background:k.b,border:`1px solid ${k.c}22`,
                borderRadius:10,padding:"14px 18px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{fontSize:10,fontWeight:700,color:k.c,textTransform:"uppercase",letterSpacing:0.5}}>{k.l}</div>
                <div style={{fontSize:19,fontWeight:800,color:k.c,marginTop:7}}>{fmt(k.v)}</div>
              </div>
            ))}
          </div>

          {/* ── TABLA 1: SERVICIO (Ingresos vs Egresos) ─────────────────── */}
          {card(<>
            {sTitle("Tabla SERVICIO — Ingresos vs Egresos por mes","Equivalente a la pestaña SERVICIO del archivo Excel de Geolis")}
            <TablaM filas={[
              {label:"INGRESOS (Facturación)",color:C.success,   datos:mIngresos},
              {label:"CAPEX (Activos)",        color:C.yellowDark,datos:mCapex},
              {label:"OPEX",                   color:"#374151",   datos:mOpex},
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
              {label:"FLUJO ACUMULADO",   color:"#0891b2",   datos:mFlujoAcum},
            ]} showTotal={false}/>
          </>)}

          {/* ── GRÁFICA I: Flujo de efectivo (barras + línea acumulada) ── */}
          {card(<>
            {sTitle("Gráfica I — Flujo de efectivo","Barras: flujo mensual (amarillo=positivo, rojo=negativo) · Línea: flujo acumulado")}
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
            <div style={{overflowX:"auto",overflowY:"hidden"}}><FlowChart barData={mFlujo} lineData={mFlujoAcum} height={240}/></div>
          </>)}

          {/* ── GRÁFICA II: Líneas por categoría OPEX ───────────────────── */}
          {card(<>
            {sTitle("Gráfica II — OPEX por categoría","Líneas por categoría contable mes a mes · Equivalente a pestaña GRÁFICA II del Excel")}
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
                <div style={{overflowX:"auto",overflowY:"hidden"}}><CatLinesChart series={catOpexSeries} height={240}/></div>
              </>
            ):<div style={{padding:20,color:C.grayMid,fontSize:13,textAlign:"center"}}>Captura partidas OPEX en las áreas para ver esta gráfica.</div>}
          </>)}

          {/* ── TABLA 3: Resumen por área ────────────────────────────────── */}
          {areas.length>0&&card(<>
            {sTitle("Resumen por área")}
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
                  const ox=totalCat(id,"mat")+totalNom(id)*12+totalCat(id,"via");
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
          </>,0)}

          <div style={{textAlign:"center",fontSize:11,color:C.grayMid,paddingTop:20,marginTop:20,
            borderTop:`1px solid ${C.line}`}}>
            GEOLIS SA DE CV · {pres?.nombre} · Elaborado: {pres?.fechaElaboracion||new Date().toLocaleDateString("es-MX")}
          </div>
        </div>
      </div>
    ,"Resumen mensual");
  }
  return null;
}