import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import { listarPresupuestos, guardarPresupuestoEnNube, cargarPresupuestoDeNube, eliminarPresupuestoDeNube, buscarArticulosAlmacen, listarGruposAlmacen } from "./supabaseApi";

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

// Categoría escrita → categoría contable macro (misma regla que usa el modal
// "¿A qué categoría contable pertenece?" y el aviso de partidas sin categoría) —
// versión standalone para usarse fuera del componente (ej. exportarExcel).
function macroDeCategoria(cat){
  const catUp=(cat||"").trim().toUpperCase();
  if(!catUp) return "SIN CATEGORÍA";
  if(CATS_MACRO_CONTABLE.some(m=>m.toUpperCase()===catUp)) return catUp;
  if(SUBCAT_MAPPING[catUp]) return SUBCAT_MAPPING[catUp];
  try{
    const m=JSON.parse(localStorage.getItem("geolis_subcat_map")||"{}");
    if(m[catUp]) return m[catUp];
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

const PM_INTERVALO = {mensual:1, bimestral:2, trimestral:3, semestral:6, anual:12};

// Calcula cuántas veces ocurre el gasto durante N meses del proyecto
function vecesEnProyecto(periodicidad, numMeses=12){
  const intervalo = PM_INTERVALO[periodicidad]||1;
  return Math.ceil(numMeses / intervalo);
}

// Distribuye el OPEX en los meses correctos según periodicidad y mes de inicio.
// M0 nunca lleva OPEX (es el mes de instalación) — el mínimo mes de inicio es M1.
function distribuirOpex(p, numMeses=12){
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
  return numMeses;
}

// Distribuye el costo de nómina de un puesto en los meses en que está activo
function distribuirNomina(puesto, numMeses=12){
  const f=1+(puesto.imss||F_IMSS)+(puesto.prestaciones||F_PREST)+(puesto.isr||F_ISR);
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
  mesGasto:0,             // índice M0-M12 para CAPEX
  mesGastoMes:"",         // mes real (1-12) para mostrar en calendario
  mesGastoAnio:"",        // año real para mostrar en calendario  
  periodicidad:"mensual", // OPEX: mensual/bimestral/trimestral/semestral/anual
  mesInicioOpex:1,        // mes en que inicia el OPEX (1=primer mes)
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
function CatalogInput({value,onChange,options,placeholder="Seleccionar o escribir",allowCustom=true,onPartidaSelect}){
  const [open,setOpen]=useState(false);
  const [txt,setTxt]=useState(value||"");
  const [macroModal,setMacroModal]=useState(false);
  const [newCatPending,setNewCatPending]=useState("");
  const [pos,setPos]=useState({top:0,left:0,width:0});
  const ref=useRef();
  const allOpts=[...new Set([...options,...getCats()])];
  const filtered=allOpts.filter(o=>o.toLowerCase().includes(txt.toLowerCase()));

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
          {filtered.length===0&&<div style={{padding:"10px 12px",fontSize:12,color:C.grayMid}}>Sin resultados</div>}
          {filtered.map(opt=>(
            <div key={opt} onMouseDown={e=>{e.preventDefault();pick(opt);}}
              style={{padding:"10px 14px",fontSize:12,cursor:"pointer",
                background:value===opt?"#FFFBF0":"transparent",
                borderBottom:`1px solid ${C.line}`,lineHeight:1.4}}
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
// Categorías de OPEX Materiales — igual que CAT_OPEX pero sin nómina/licenciamiento
// (esas no son "materiales", confundían el dropdown de esta sección)
const CAT_OPEX_MAT = CAT_OPEX.filter(c=>![
  "NÓMINA Y ADICIONALES","LICENCIAMIENTO MXN MENSUAL","LICENCIAMIENTO MXN ANUAL","LICENCIAMIENTO USD",
].includes(c));
// Categorías propias de OPEX Viáticos — más específicas que la única "VIÁTICOS" genérica
const CAT_OPEX_VIA = [
  "VIÁTICOS","ALIMENTACION","HOSPEDAJE","TRANSPORTE","CASETAS PUENTES Y PEAJES",
  "SERV DE TRANSPORTAC AEREA","SERV DE TRANSPORTAC TERRESTRE",
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

// ─── PARTIDA ROW ─────────────────────────────────────────────────────────────
// Headers y fila en el mismo componente, dentro del card
function PartidaTable({partidas, onUpdate, onRemove, onAdd, catOptions, addLabel, headerColor, showMes=false, showPeriod=false, fechaInicioProyecto, fechaFinProyecto, numMesesOpProyecto=12}){
  // Rango de años de los selects "Año" — antes fijo 2024-2035; ahora se ajusta
  // a la duración real del proyecto (soporta desde 6 meses hasta 20 años).
  const anioIniProy = fechaInicioProyecto ? new Date(fechaInicioProyecto+"T00:00:00").getFullYear() : 2024;
  const anioFinProy = fechaFinProyecto ? new Date(fechaFinProyecto+"T00:00:00").getFullYear() : anioIniProy+11;
  const RANGO_ANIOS = Array.from({length: Math.max(12, anioFinProy-anioIniProy+3)}, (_,i)=>anioIniProy-1+i);
  // Grupos reales del catálogo de almacén — se cargan una sola vez por tabla y se
  // fusionan con las categorías fijas de siempre (CAT_CAPEX/CAT_OPEX) en el dropdown.
  const [gruposAlmacen,setGruposAlmacen]=useState([]);
  useEffect(()=>{ listarGruposAlmacen().then(setGruposAlmacen); },[]);
  const catOptionsConAlmacen=[...new Set([...catOptions, ...gruposAlmacen])];
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
        return(
          <div key={p.id} className="partida-row" style={{display:"grid",
            gridTemplateColumns:cols,background:idx%2===1?"#FAFBFC":"transparent",
            gap:16,alignItems:"center",padding:"14px 12px",margin:"0 -12px",
            borderBottom:idx<partidas.length-1?`1px solid ${C.line}`:"none"}}>
            <div>
              <CatalogInput value={p.cat} onChange={v=>{
                onUpdate({...p,cat:v,subcat:""});
                // El dropdown de sugerencias se activa cuando hay historial
              }} options={catOptionsConAlmacen} placeholder="Categoría"
                onPartidaSelect={hist=>{
                  if(hist) onUpdate({...p,cat:hist.cat,desc:hist.desc,unidad:hist.unidad,cantidad:hist.cantidad,monto:hist.monto,
                    periodicidad:hist.periodicidad||p.periodicidad});
                }}/>
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
            <select value={p.unidad} onChange={e=>onUpdate({...p,unidad:e.target.value})}
              className="sel-brand"
              title="Unidad = naturaleza del bien. Ej: Servicio para arrendamiento, Pieza para EPP, Global para partidas alzadas"
              style={{padding:"8px 10px",border:`1px solid ${C.grayBorder}`,
                borderRadius:6,fontSize:11,width:"100%",background:C.white}}>
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
                  <option value="">Mes*</option>
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
                  <option value="">Año*</option>
                  {RANGO_ANIOS.map(y=>(
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
            {showPeriod&&(
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <select value={p.periodicidad||"mensual"} onChange={e=>onUpdate({...p,periodicidad:e.target.value})}
                  className="sel-brand"
                  title="¿Con qué frecuencia se repite este gasto?"
                  style={{padding:"6px 6px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
                    fontSize:10,width:"100%",background:C.white}}>
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
                    <option value="">Mes</option>
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
                    <option value="">Año</option>
                    {RANGO_ANIOS.map(y=>(
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {p.mesInicioOpex&&!p.mesGastoMes&&(
                  <div style={{fontSize:9,color:C.grayMid}}>Inicia M{p.mesInicioOpex} (sin fecha)</div>
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
          Aún no hay partidas capturadas en esta sección.
        </div>
      )}
      {/* Add row */}
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
    </div>
  );
}

// ─── NOMINA TABLE ─────────────────────────────────────────────────────────────
function NominaTable({nomina,onUpdate,onRemove,onAdd}){
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
        const factor=1+(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR);
        const costo=(p.salario||0)*factor*(p.cantidad||1);
        const meses = mesesNomina(p, 12);
        const costoTotal = costoTotalNomina(p, 12);
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
                options={PUESTOS_CAT} placeholder="Puesto" allowCustom={true}/>
              {/* Tipo de personal */}
              <select value={p.tipoPersonal||"fijo"}
                onChange={e=>onUpdate({...p,tipoPersonal:e.target.value})}
                className="sel-brand"
                style={{padding:"8px 10px",border:`1px solid ${C.grayBorder}`,borderRadius:6,
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
    </ScrollHint>
      {nomina.length===0&&(
        <div style={{padding:"26px 16px",textAlign:"center",color:C.grayMid,fontSize:13,
          background:"#FAFAFA",borderRadius:10,marginBottom:14}}>
          Aún no hay puestos de nómina capturados en esta área.
        </div>
      )}
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
  mFlujo: mFlujoBase, mFlujoAcum: mFlujoAcumBase, mIngresos: mIngresosBase, totalCAPEX, totalOPEX, totalEgr,
  totalIngresosAnual, MESES13, NMESES, totalNom, totalCat, ingAdicionales=[]}) {
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
  function addRowS(desc, total, mensual){
    rowsS.push([desc, total, ...mensual]);
    return rowsS.length-1;
  }

  seccionRows.push(addRowS("INGRESOS año MXN","",Array(NMESES).fill("")));
  addRowS("FACTURACIÓN", totalIngresosAnual, mIngresos);
  seccionRows.push(addRowS("EGRESOS año","",Array(NMESES).fill("")));

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
    addRowS(cat, arr.reduce((s,v)=>s+v,0), arr);
  });
  if(Object.keys(capexPorCat).length>0) subtotalRows.push(addRowS("ACTIVOS", totalCAPEX, mCapex));

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
  Object.entries(macroGrupos).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([macro,cats])=>{
    const catEntries=Object.entries(cats).sort((a,b)=>a[0].localeCompare(b[0]));
    const esUnaSolaIgualAMacro=catEntries.length===1 && catEntries[0][0].toUpperCase()===macro.toUpperCase();
    if(esUnaSolaIgualAMacro){
      const [cat,arr]=catEntries[0];
      addRowS(cat, arr.reduce((s,v)=>s+v,0), arr);
    } else {
      catEntries.forEach(([cat,arr])=>addRowS(cat, arr.reduce((s,v)=>s+v,0), arr));
      const macroArr=Array(NMESES).fill(0);
      catEntries.forEach(([,arr])=>arr.forEach((v,i)=>macroArr[i]+=v));
      subtotalRows.push(addRowS(macro, macroArr.reduce((s,v)=>s+v,0), macroArr));
    }
  });

  totalRows.push(addRowS("TOTAL EGRESOS", totalEgr, mEgresos));

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
    ["Ingresos (MN)","","","",""],
    ["INGRESOS","","","","",...mIngresos],
    ["Ingresos Totales (MN)","","","","",...mIngresos],
    ["Ingresos Totales (MN) IVA","","","","",...mIngresosIVA],
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
  // "Partir de un presupuesto anterior" — lista real de Supabase (solo lectura)
  const [presupuestosGuardados,setPresupuestosGuardados] = useState([]);
  const [cargandoGuardados,setCargandoGuardados]         = useState(false);
  const [origenReal,setOrigenReal]                       = useState(null); // {nombre,capex,opex}
  const [modoEdit,setModoEdit]     = useState(false);
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

  // "Partir de un presupuesto anterior" — al abrir el modal, consultar Supabase (SOLO LECTURA)
  // No modifica el flujo existente de PLANTILLAS (Cuervito/TI), que sigue igual más abajo.
  useEffect(()=>{
    if(!plantModal || !supabase) return;
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
  },[plantModal]);
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
  // Nota: totalCat/totalNom son sumas "por ocurrencia" (útiles como vista rápida durante
  // la captura). El total ANUAL real que respeta periodicidad/tipo de personal vive en
  // totalOpexAnualCat/totalNomAnual, y es el que alimenta el Resumen mensual (Step 4).
  function totalCat(id,cat){return(costos[id]?.[cat]||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);}
  function totalNom(id){return(costos[id]?.nomina||[]).reduce((s,p)=>{const f=1+(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR);return s+(p.salario||0)*f*(p.cantidad||1);},0);}
  function totalOpexAnualCat(id,cat){return(costos[id]?.[cat]||[]).reduce((s,p)=>s+totalOpexPartida(p,12),0);}
  function totalNomAnual(id){return(costos[id]?.nomina||[]).reduce((s,p)=>s+costoTotalNomina(p,12),0);}
  const capexAreas=areas.reduce((s,id)=>s+totalCat(id,"capex"),0);
  const opexAreas =areas.reduce((s,id)=>s+totalOpexAnualCat(id,"mat")+totalNomAnual(id)+totalOpexAnualCat(id,"via"),0);
  const capexPMt  =capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const opexPMt   =opexPM.reduce((s,p)=>s+totalOpexPartida(p,12),0);
  const totalCAPEX=capexAreas+capexPMt;
  const totalOPEX =opexAreas +opexPMt;
  const totalEgr  =totalCAPEX+totalOPEX;

  // ── Acciones ────────────────────────────────────────────────────────────────
  function abrirNuevo(){
    setForm({nombre:"",tipo:"",empresa:"GEOLIS SA DE CV",fechaInicio:"",fechaFin:"",
      fechaElaboracion:new Date().toISOString().slice(0,10)});
    setAreas([]); setCostos({}); setCapexPM([]); setOpexPM([]); setIngresos(Array(13).fill(0)); setPrecioFijo(0); setIngAd([]);
    setPlantKey(null); setOrigenReal(null); setPres(null); setModoEdit(false); setAreaSaved(false);
    setIntentoGuardar(false);
    setStep(1);
  }
  function abrirEdit(p){
    setForm({nombre:p.nombre,tipo:p.tipo,empresa:p.empresa||"GEOLIS SA DE CV",
      fechaInicio:p.fechaInicio||"",fechaFin:p.fechaFin||""});
    setAreas(p._areas||[]); setCostos(p._costos||{});
    setCapexPM(p._capexPM||[]); setOpexPM(p._opexPM||[]);
    setPlantKey(null); setPres(p); setModoEdit(true);
    setAreaSaved((p._areas||[]).some(id=>(p._costos||{})[id]?.estado==="guardado"));
    setIntentoGuardar(false);
    setStep(1);
  }

  // FIX 6 v4: Abrir presupuesto — flag pausa el guardado en localStorage
  async function abrirPresupuesto(p){
    isOpening.current = true;
    // Si el presupuesto vive en Supabase (id = UUID), traer siempre la versión más reciente
    if(supabase && typeof p.id === "string"){
      const remoto = await cargarPresupuestoDeNube(p.id, {uid, initP, initN});
      if(remoto){ setPresToOpen(remoto); return; }
    }
    setPresToOpen(p);
  }

  // Eliminar presupuesto — acción destructiva, requiere confirmación explícita
  async function eliminarPresupuesto(p){
    const ok = window.confirm(`¿Eliminar el presupuesto "${p.nombre}"? Esta acción no se puede deshacer.`);
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
    setIngresos(p._ingresos||Array(13).fill(0));
    setPrecioFijo(p._precioFijo||0);
    setIngAd((p._ingAdicionales||[]).map(x=>({...x,id:uid()})));
    setPres(null); setModoEdit(false);
    setPlantKey(null); setAreaSaved(false);
    setIntentoGuardar(false);
    setStep(1);
  }

  function guardarPres(){
    const invalido = !form.nombre||!form.tipo||!form.fechaInicio||!form.fechaFin;
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
    setAreas([]); setCostos({}); setCapexPM([]); setOpexPM([]);
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
        const capexBase = (plData.capex||[]).map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto,mesGasto:p.mesGasto||0}));
        // OPEX: separar nómina de materiales
        const nomBase = (plData.nomina||[]).map(p=>initN({puesto:p.puesto,cantidad:p.cantidad||1,salario:p.salario||0}));
        // Del opex de la plantilla — los que son NOMINA van a nómina, resto a mat
        const opexNom = (plData.opex||[]).filter(p=>p.cat?.toUpperCase().includes("NOMINA"));
        const opexMat = (plData.opex||[]).filter(p=>!p.cat?.toUpperCase().includes("NOMINA")&&!p.cat?.toUpperCase().includes("VIATICO"));
        const opexVia = (plData.opex||[]).filter(p=>p.cat?.toUpperCase().includes("VIATICO"));
        const matBase = opexMat.map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto,periodicidad:p.periodicidad||"mensual"}));
        const viaBase = opexVia.map(p=>({...initP(),cat:p.cat,desc:p.desc,unidad:p.unidad,cantidad:p.cantidad,monto:p.monto,periodicidad:p.periodicidad||"mensual"}));
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
    const nuevoCostos={...costos,[id]:{...costos[id],estado:"guardado"}};
    setCostos(nuevoCostos);
    setAreaSaved(true);
    showToast("Costos guardados correctamente");

    if(pres){
      const snap={_areas:areas,_costos:nuevoCostos,_capexPM:capexPM,_opexPM:opexPM,
        _ingresos:ingresos,_precioFijo:precioFijo,_ingAdicionales:ingAdicionales};
      const actualizado={...pres,...snap};
      setPres(actualizado);
      setLista(prev=>prev.map(x=>x.id===pres.id?{...x,...snap}:x));

      if(supabase){
        guardarPresupuestoEnNube({pres:actualizado, form:actualizado, areas, costos:nuevoCostos,
          ingAdicionales, precioFijo}).then(cloudId=>{
          if(cloudId && cloudId!==actualizado.id){
            // Presupuesto local (id numérico) recién promovido a la nube: adoptar el UUID real
            setPres(prevPres=>prevPres&&prevPres.id===actualizado.id?{...prevPres,id:cloudId}:prevPres);
            setLista(prevLista=>prevLista.map(x=>x.id===actualizado.id?{...x,id:cloudId}:x));
          }
        }).catch(err=>console.error("[supabase] guardarArea:",err));
      }
    }
  }

  // ── BTN ──────────────────────────────────────────────────────────────────────
  // Jerarquía visual: primary/success = acción principal (llenas, con sombra),
  // secondary = acción secundaria (borde, sin relleno), danger = destructiva.
  const btn=(label,onClick,variant="primary",disabled=false)=>{
    const bg=variant==="primary"?C.yellow:variant==="success"?C.success:
      variant==="danger"?C.danger:C.white;
    const bgHover=variant==="primary"?C.yellowDark:variant==="success"?"#166430":
      variant==="danger"?"#a5321f":C.grayLight;
    const isFilled=variant==="primary"||variant==="success"||variant==="danger";
    return(
      <button onClick={onClick} disabled={disabled} style={{
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
        }
      `}</style>
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {/* Sidebar */}
      <aside className="sidebar-nav" style={{width:220,background:C.sidebar,flexShrink:0,
        display:"flex",flexDirection:"column",position:"fixed",overflow:"hidden",
        top:0,left:0,bottom:0,zIndex:50}}>
        <div style={{padding:"22px 20px 18px",borderBottom:"1px solid #222"}}>
          <div className="sidebar-logo-text" style={{fontSize:10,color:"#444",letterSpacing:2.5,textTransform:"uppercase",marginBottom:6,whiteSpace:"nowrap"}}>Corporativo</div>
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
      <div className="main-content" style={{flex:1,minWidth:0,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
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
            {pres&&(step===3||step===4)&&(
              <button onClick={async()=>{ await eliminarPresupuesto(pres); setStep(0); }}
                title="Eliminar este presupuesto (no se puede deshacer)"
                style={{width:30,height:30,padding:0,background:"transparent",
                  border:`1px solid ${C.grayBorder}`,borderRadius:7,
                  cursor:"pointer",fontSize:13,color:C.grayMid,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=C.dangerLight;e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=C.grayBorder;e.currentTarget.style.color=C.grayMid;}}>
                🗑
              </button>
            )}
            <span style={{fontSize:12,color:C.grayMid}}>{form.empresa||pres?.empresa||"GEOLIS SA DE CV"}</span>
          </div>
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
        {/* Header tabla — oculto en móvil, donde cada fila se muestra como card apilada */}
        <div className="lista-header" style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 210px",gap:0,
          padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${C.line}`}}>
          {["Proyecto","Tipo","Estado","Acciones"].map((h,i)=>(
            <div key={h} style={{fontSize:11,fontWeight:700,color:C.grayMid,
              textTransform:"uppercase",letterSpacing:0.5,
              textAlign:i===3?"center":"left"}}>{h}</div>
          ))}
        </div>
        {lista.map((p,i)=>(
          <div key={p.id} className="lista-row" style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 210px",
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
            <div className="lista-acciones" style={{display:"flex",gap:8,justifyContent:"center"}}>
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
              <button onClick={()=>eliminarPresupuesto(p)}
                title="Eliminar presupuesto (no se puede deshacer)"
                style={{width:30,height:30,padding:0,background:C.white,
                  border:`1px solid ${C.grayBorder}`,borderRadius:6,
                  cursor:"pointer",fontSize:14,color:C.grayMid,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=C.dangerLight;e.currentTarget.style.borderColor=C.danger;e.currentTarget.style.color=C.danger;}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.borderColor=C.grayBorder;e.currentTarget.style.color=C.grayMid;}}>
                🗑
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
              <div>
                <FL>Fecha de elaboración</FL>
                <input type="date" value={form.fechaElaboracion} onChange={e=>setForm({...form,fechaElaboracion:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,
                    borderRadius:8,fontSize:14,boxSizing:"border-box",outline:"none"}}/>
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <FL required>Tipo de presupuesto {intentoGuardar&&!form.tipo&&<span style={{color:C.danger,fontSize:10,fontWeight:400,marginLeft:6}}>← selecciona uno para continuar</span>}</FL>
                <div className="tipo-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:2}}>
                  {[
                    {id:"instalacion", label:"Instalación",  desc:"Proyectos de campo",    icon:"🏗️"},
                    {id:"servicio",    label:"Servicio",     desc:"Servicio recurrente",   icon:"🔁"},
                    {id:"departamento",label:"Departamento", desc:"Área interna",          icon:"🏢"},
                    {id:"suministro",  label:"Suministro",   desc:"Compra de materiales",  icon:"📦"},
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
        )}
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {btn("Cancelar",()=>setStep(0),"secondary")}
          {/* Los avisos de campos faltantes van justo debajo de cada input (ver arriba)
              — solo aparecen tras un intento fallido de Continuar/Guardar */}
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
                              {p.tipo} · {p.estado} {p.fechaInicio?`· ${p.fechaInicio}`:""}
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
    const opexA  =areaActiva?totalOpexAnualCat(areaActiva,"mat")+totalNomAnual(areaActiva)+totalOpexAnualCat(areaActiva,"via"):0;

    return wrap(
      <div>
        <style>{`.noprint{}.@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        <div className="capture-grid" style={{display:"grid",gridTemplateColumns:"248px minmax(0,1fr)",gap:28,maxWidth:1320}}>

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
                  <NominaTable
                    nomina={datos?.nomina||[]}
                    onUpdate={u=>upP(areaActiva,"nomina",u.id,u)}
                    onRemove={rmN(areaActiva)}
                    onAdd={()=>addN(areaActiva)}/>
                  {nomMes>0&&<div style={{marginTop:10,fontSize:11,color:C.grayMid,textAlign:"right"}}>
                    Costo anual nómina: <strong style={{color:"#059669"}}>{fmt(totalNomAnual(areaActiva))}</strong>
                  </div>}
                </SCard>

                {/* Materiales */}
                <SCard title="OPEX · Materiales" icon="📦"
                  subtitle="Materiales e insumos recurrentes — Unidad = naturaleza del bien (Servicio, Pieza...) · Periodicidad = cada cuánto se repite"
                  total={totalOpexAnualCat(areaActiva,"mat")} accentColor="#0891b2">
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
    // Duración real del proyecto (de 6 meses a 20 años) según fechaInicio/fechaFin —
    // ya no se asume siempre M0..M12.
    const NUM_MESES_OP=calcularNumMesesOp(pres?.fechaInicio, pres?.fechaFin);
    const NMESES=NUM_MESES_OP+1; // +1 por M0 (instalación)
    const MESES13=["M0 (Inst.)",...Array.from({length:NUM_MESES_OP},(_,i)=>`M${i+1}`)];
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

    // Partidas sin categoría contable macro asignada (para revisión posterior) —
    // una categoría "tiene macro" si es ella misma una de las 27 CATS_MACRO_CONTABLE,
    // o si aparece en SUBCAT_MAPPING (fijo) o geolis_subcat_map (elegido por el usuario).
    const subcatMapLS=(()=>{ try{ return JSON.parse(localStorage.getItem("geolis_subcat_map")||"{}"); }catch(e){ return {}; } })();
    function tieneCategoriaMacro(cat){
      const catUp=(cat||"").trim().toUpperCase();
      if(!catUp) return false;
      if(CATS_MACRO_CONTABLE.some(m=>m.toUpperCase()===catUp)) return true;
      if(SUBCAT_MAPPING[catUp]) return true;
      if(subcatMapLS[catUp]) return true;
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

    // Totales
    const totalCAPEX=mCapex.reduce((s,v)=>s+v,0);
    const totalOPEX=mOpex.reduce((s,v)=>s+v,0);
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
        <ScrollHint>
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
        </ScrollHint>
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
              totalIngresosAnual,MESES13,NMESES,totalNom,totalCat,ingAdicionales
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
                      className="sel-brand"
                      style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12,background:C.white}}>
                      {Array.from({length:NUM_MESES_OP},(_,i)=>i+1).map(m=>(
                        <option key={m} value={m}>M{m} · {MESES[(m-1)%12]}</option>
                      ))}
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
          <div className="resumen-kpi" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
            {[
              {l:"Ingresos",    v:totalIngresosAnual,c:C.success,   b:C.successLight},
              {l:"CAPEX",       v:totalCAPEX,        c:C.yellowDark,b:C.yellowLight},
              {l:"OPEX",        v:totalOPEX,         c:"#374151",   b:C.grayLight},
              {l:"Total egresos",v:totalEgr,          c:C.danger,    b:C.dangerLight},
              {l:"Utilidad y margen",v:utilidad,badge:`${margen.toFixed(1)}%`,
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
    ,"Resumen mensual");
  }
  return null;
}