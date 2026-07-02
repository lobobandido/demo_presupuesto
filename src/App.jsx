import { useState, useEffect, useRef } from "react";

// ─── PALETA GEOLIS ────────────────────────────────────────────────────────────
const C = {
  yellow:"#DDAC00", yellowLight:"#FFF8E1", yellowBorder:"#F0C800", yellowDark:"#B08900",
  grayDark:"#2C2C2C", grayMid:"#6B6B6B", grayLight:"#F5F5F5", grayBorder:"#DEDEDE",
  white:"#FFFFFF", danger:"#C0392B", dangerLight:"#FDECEA",
  success:"#1E7E34", successLight:"#EAF7ED",
};

// ─── ÁREAS (confirmadas del audio) ───────────────────────────────────────────
const AREAS_CATALOGO = [
  { id:"operaciones",  label:"Operaciones",  icon:"🔧" },
  { id:"construccion", label:"Construcción", icon:"🏗️" },
  { id:"electricidad", label:"Electricidad", icon:"⚡" },
  { id:"generacion",   label:"Generación",   icon:"⚙️" },
  { id:"calidad",      label:"Calidad",      icon:"✅" },
  { id:"sspa",         label:"SSPA",         icon:"🦺" },
  { id:"hps",          label:"HPS",          icon:"🔩" },
  { id:"mantenimiento",label:"Mantenimiento",icon:"🛠️" },
  { id:"logistica",    label:"Logística",    icon:"🚛" },
];

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const UNIDADES_BASE = ["Unidad","Día","Semana","Mes","Año","Servicio","Viaje","Pieza","Kg","Metro","Litro","Hora","Servicio","Global"];

// ─── PLANTILLAS PRECARGADAS ───────────────────────────────────────────────────
// Extraídas del Excel Presupuesto_Geolis_2026_v4.1_FormatoCuervito
const PLANTILLAS = {
  cuervito: {
    nombre: "Monitoreo Cuervito",
    descripcion: "Basada en 01022026 Presupuesto Monitoreo Cuervito",
    icon: "📋",
    capex: [
      { cat:"EQUIPO DE COMPUTO",  desc:"Laptops / Equipos de cómputo", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"ACCESORIOS",         desc:"Monitores, teclados, periféricos", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"EQUIPO DE TRANSPORTE",desc:"Vehículos / Camionetas de campo", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"MAQUINARIA Y EQUIPO", desc:"Maquinaria especializada", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"INFRAESTRUCTURA DE RED",desc:"Switches, access points, cableado", unidad:"Global", cantidad:1, monto:0 },
      { cat:"GABINETE Y ENERGÍA",  desc:"Gabinetes, UPS, instalación eléctrica", unidad:"Global", cantidad:1, monto:0 },
    ],
    opex: [
      { cat:"NÓMINA Y ADICIONALES",     desc:"Nómina mensual del proyecto", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"LICENCIAMIENTO MXN MENSUAL",desc:"Software mensual (Office, Adobe, etc.)", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"LICENCIAMIENTO MXN ANUAL", desc:"Software anual (AutoCAD, etc.)", unidad:"Año", cantidad:1, monto:0 },
      { cat:"TELECOMUNICACIONES",       desc:"Internet, radio, telefonía (Starlink, etc.)", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"VEHÍCULOS Y COMBUSTIBLE",  desc:"Combustible y operación de vehículos", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"VIÁTICOS",                 desc:"Viáticos y gastos de campo", unidad:"Día", cantidad:1, monto:0 },
      { cat:"ARTÍCULOS DE SEGURIDAD",   desc:"EPP y uniformes", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"MATERIALES",               desc:"Materiales de instalación y operación", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"SERVICIOS",                desc:"Servicios externos y contratistas", unidad:"Servicio", cantidad:1, monto:0 },
    ],
  },
  departamento: {
    nombre: "Presupuesto Departamental",
    descripcion: "Plantilla para áreas internas (TI, RRHH, Administración)",
    icon: "🏢",
    capex: [
      { cat:"EQUIPO DE COMPUTO",  desc:"Laptops y equipos de cómputo", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"EQUIPO DE MOBILIARIO",desc:"Mobiliario y enseres de oficina", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"SOFTWARE Y LICENCIAS",desc:"Software de uso interno", unidad:"Unidad", cantidad:1, monto:0 },
    ],
    opex: [
      { cat:"NÓMINA Y ADICIONALES",   desc:"Nómina del departamento", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"INSUMOS DE OFICINA",     desc:"Papelería y consumibles", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"TELECOMUNICACIONES",     desc:"Internet y telefonía", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"SERVICIOS",              desc:"Servicios de mantenimiento y limpieza", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"LICENCIAMIENTO MXN MENSUAL",desc:"Licencias de software", unidad:"Mes", cantidad:1, monto:0 },
    ],
  },
  instalacion: {
    nombre: "Proyecto de Instalación",
    descripcion: "Plantilla para proyectos de campo con mano de obra",
    icon: "🏗️",
    capex: [
      { cat:"EQUIPO DE TRANSPORTE",  desc:"Camionetas de campo", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"MAQUINARIA Y EQUIPO",   desc:"Equipo especializado de instalación", unidad:"Unidad", cantidad:1, monto:0 },
      { cat:"GABINETE Y ENERGÍA",    desc:"Gabinetes y sistema de energía", unidad:"Global", cantidad:1, monto:0 },
      { cat:"TRANSMISIÓN",           desc:"Equipos de transmisión y comunicación", unidad:"Global", cantidad:1, monto:0 },
    ],
    opex: [
      { cat:"NÓMINA Y ADICIONALES",  desc:"Nómina mensual del proyecto", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"ARTÍCULOS DE SEGURIDAD",desc:"EPP, uniformes y seguridad industrial", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"VEHÍCULOS Y COMBUSTIBLE",desc:"Combustible mensual de campo", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"VIÁTICOS",              desc:"Viáticos del equipo en campo", unidad:"Día", cantidad:1, monto:0 },
      { cat:"MATERIALES",            desc:"Materiales de instalación", unidad:"Global", cantidad:1, monto:0 },
      { cat:"TELECOMUNICACIONES",    desc:"Radio y comunicaciones de campo", unidad:"Mes", cantidad:1, monto:0 },
      { cat:"SERVICIOS DE CAPACITACIÓN",desc:"Capacitaciones requeridas", unidad:"Servicio", cantidad:1, monto:0 },
    ],
  },
};

// Factores nómina (RF-05)
const F_IMSS = 0.32, F_PREST = 0.40, F_ISR = 0.05;
const PUESTOS = ["Director de Proyecto","Gerente de Área","Supervisor","Ingeniero de Campo","Técnico Especialista","Técnico","Operador","Ayudante General","Otro"];

let _id = 1;
const uid = () => ++_id;
const fmt = n => isNaN(n)||n==null ? "$0.00" : "$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
const LS_KEY_CATS = "geolis_categorias_custom";

function getCatsCustom() {
  try { return JSON.parse(localStorage.getItem(LS_KEY_CATS)||"[]"); } catch { return []; }
}
function saveCatCustom(cat) {
  const existing = getCatsCustom();
  if (!existing.includes(cat)) {
    localStorage.setItem(LS_KEY_CATS, JSON.stringify([...existing, cat]));
  }
}

function initPartida(o={}) { return { id:uid(), cat:"", desc:"", unidad:"Unidad", cantidad:1, monto:0, ...o }; }
function initNomina(o={}) { return { id:uid(), puesto:"Técnico", puestoCustom:"", cantidad:1, salario:0, imss:F_IMSS, prestaciones:F_PREST, isr:F_ISR, ...o }; }
function distribuirMeses(total, tipo="opex") {
  if (tipo==="capex") { const m=Array(12).fill(0); m[0]=total; return m; }
  return Array(12).fill(parseFloat((total/12).toFixed(2)));
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return <span style={{ padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700, background:bg||C.grayLight, color:color||C.grayMid, border:`1px solid ${color||C.grayMid}44` }}>{label}</span>;
}

// ─── CATEGORY INPUT (editable con localStorage) ───────────────────────────────
function CatInput({ value, onChange, placeholder="Categoría" }) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState(value||"");
  const baseCats = [...new Set([
    "NÓMINA Y ADICIONALES","EQUIPO DE COMPUTO","EQUIPO DE TRANSPORTE","MAQUINARIA Y EQUIPO",
    "ACCESORIOS","MATERIALES","VIÁTICOS","TELECOMUNICACIONES","VEHÍCULOS Y COMBUSTIBLE",
    "ARTÍCULOS DE SEGURIDAD","SERVICIOS","LICENCIAMIENTO MXN MENSUAL","LICENCIAMIENTO MXN ANUAL",
    "INFRAESTRUCTURA DE RED","GABINETE Y ENERGÍA","TRANSMISIÓN","INSUMOS DE OFICINA",
    "INSUMOS OPERATIVOS","HERRAMIENTAS","EQUIPOS Y ENSERES","SEGUROS","FLETES NACIONALES",
    "SERVICIOS DE CAPACITACIÓN","RENTA DE MAQUINARIA","SOFTWARE Y LICENCIAS","EQUIPO DE MOBILIARIO",
    ...getCatsCustom(),
  ])];
  const filtradas = baseCats.filter(c => c.toLowerCase().includes(texto.toLowerCase()));
  const ref = useRef();

  useEffect(() => { setTexto(value||""); }, [value]);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(cat) { setTexto(cat); onChange(cat); setOpen(false); }
  function handleKey(e) {
    if (e.key==="Enter" && texto.trim()) {
      saveCatCustom(texto.trim().toUpperCase());
      select(texto.trim().toUpperCase());
    }
  }

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <input value={texto} onChange={e => { setTexto(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onKeyDown={handleKey} placeholder={placeholder}
        style={{ width:"100%", padding:"7px 10px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:12 }} />
      {open && filtradas.length > 0 && (
        <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:100, background:C.white,
          border:`1px solid ${C.grayBorder}`, borderRadius:6, maxHeight:180, overflowY:"auto", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
          {texto && !baseCats.includes(texto.toUpperCase()) && (
            <div onClick={() => { saveCatCustom(texto.toUpperCase()); select(texto.toUpperCase()); }}
              style={{ padding:"8px 12px", fontSize:12, color:C.yellowDark, cursor:"pointer", borderBottom:`1px solid ${C.grayLight}`, fontWeight:700 }}>
              + Agregar "{texto.toUpperCase()}"
            </div>
          )}
          {filtradas.map(c => (
            <div key={c} onClick={() => select(c)} style={{ padding:"7px 12px", fontSize:12, cursor:"pointer", background:value===c?C.yellowLight:"transparent" }}
              onMouseEnter={e => e.currentTarget.style.background=C.yellowLight}
              onMouseLeave={e => e.currentTarget.style.background=value===c?C.yellowLight:"transparent"}>
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PARTIDA ROW ──────────────────────────────────────────────────────────────
function PartidaRow({ p, onUpdate, onRemove }) {
  const total = (p.cantidad||0)*(p.monto||0);
  const unidades = [...new Set([...UNIDADES_BASE])];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 80px 1fr 1fr 80px 28px", gap:6, alignItems:"center", marginBottom:5 }}>
      <CatInput value={p.cat} onChange={v => onUpdate({...p,cat:v})} />
      <input value={p.desc} onChange={e => onUpdate({...p,desc:e.target.value})} placeholder="Descripción"
        style={{ padding:"7px 8px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:12 }} />
      <select value={p.unidad} onChange={e => onUpdate({...p,unidad:e.target.value})}
        style={{ padding:"7px 6px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:11 }}>
        {unidades.map(u=><option key={u}>{u}</option>)}
      </select>
      <input type="number" min="0" step="1" value={p.cantidad} onChange={e => onUpdate({...p,cantidad:parseFloat(e.target.value)||0})}
        style={{ padding:"7px 6px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:12, textAlign:"right" }} />
      <input type="number" min="0" step="0.01" value={p.monto} onChange={e => onUpdate({...p,monto:parseFloat(e.target.value)||0})}
        style={{ padding:"7px 6px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:12, textAlign:"right" }} />
      <span style={{ fontSize:12, fontWeight:700, color:C.yellowDark, textAlign:"right" }}>{fmt(total)}</span>
      <button onClick={onRemove} style={{ background:C.dangerLight, color:C.danger, border:"none", borderRadius:4, padding:"4px 7px", cursor:"pointer", fontSize:12 }}>✕</button>
    </div>
  );
}

// ─── NOMINA ROW ───────────────────────────────────────────────────────────────
function NominaRow({ p, onUpdate, onRemove }) {
  const factor = 1+(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR);
  const costoMensual = (p.salario||0)*factor*(p.cantidad||1);
  return (
    <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:10, marginBottom:8 }}>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 50px 1fr 80px 80px 1fr 28px", gap:6, alignItems:"center" }}>
        <div>
          <select value={p.puesto} onChange={e => onUpdate({...p,puesto:e.target.value})}
            style={{ width:"100%", padding:"6px 8px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:12 }}>
            {PUESTOS.map(pu=><option key={pu}>{pu}</option>)}
          </select>
          {p.puesto==="Otro" && <input value={p.puestoCustom||""} onChange={e => onUpdate({...p,puestoCustom:e.target.value})} placeholder="Nombre del puesto"
            style={{ width:"100%", marginTop:3, padding:"5px 8px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:12 }} />}
        </div>
        <input type="number" min="1" value={p.cantidad} onChange={e => onUpdate({...p,cantidad:parseInt(e.target.value)||1})}
          style={{ padding:"6px 4px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:12, textAlign:"center" }} />
        <input type="number" min="0" step="0.01" value={p.salario} onChange={e => onUpdate({...p,salario:parseFloat(e.target.value)||0})}
          placeholder="Salario/mes" style={{ padding:"6px 6px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:12, textAlign:"right" }} />
        <div style={{ textAlign:"center" }}>
          <input type="number" min="0" max="1" step="0.01" value={p.imss} onChange={e => onUpdate({...p,imss:parseFloat(e.target.value)||0})}
            style={{ width:"100%", padding:"4px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:11, textAlign:"center" }} />
          <div style={{ fontSize:9, color:C.grayMid }}>IMSS+PT</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <input type="number" min="0" max="2" step="0.01" value={p.prestaciones} onChange={e => onUpdate({...p,prestaciones:parseFloat(e.target.value)||0})}
            style={{ width:"100%", padding:"4px", border:`1px solid ${C.grayBorder}`, borderRadius:6, fontSize:11, textAlign:"center" }} />
          <div style={{ fontSize:9, color:C.grayMid }}>Prestac.</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.success }}>{fmt(costoMensual)}</div>
          <div style={{ fontSize:9, color:C.grayMid }}>Costo real/mes</div>
        </div>
        <button onClick={onRemove} style={{ background:C.dangerLight, color:C.danger, border:"none", borderRadius:4, padding:"4px 7px", cursor:"pointer", fontSize:12 }}>✕</button>
      </div>
      <div style={{ marginTop:6, padding:"4px 8px", background:"#dcfce7", borderRadius:4, fontSize:10, color:"#15803d" }}>
        {fmt(p.salario)} × (1+{p.imss} IMSS+{p.prestaciones} Prest.+{p.isr||F_ISR} ISR) × {p.cantidad} = <strong>{fmt(costoMensual)}/mes</strong> · Anual: <strong>{fmt(costoMensual*12)}</strong>
      </div>
    </div>
  );
}

// ─── CHARTS SVG ───────────────────────────────────────────────────────────────
function LineChart({ series, height=200 }) {
  if (!series||series.length===0) return null;
  const W=660,H=height,pL=60,pR=16,pT=16,pB=36;
  const cW=W-pL-pR, cH=H-pT-pB;
  const allV=series.flatMap(s=>s.data);
  const maxV=Math.max(...allV,1);
  const xP=i=>pL+(i/11)*cW, yP=v=>pT+cH-(v/maxV)*cH;
  const gridLines=4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      {Array.from({length:gridLines+1},(_,i)=>{
        const v=maxV*(i/gridLines), y=yP(v);
        return <g key={i}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke={C.grayBorder} strokeWidth="0.8" strokeDasharray="4 3"/>
          <text x={pL-4} y={y+4} textAnchor="end" fontSize="10" fill={C.grayMid}>{v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:v.toFixed(0)}</text></g>;
      })}
      {MESES.map((m,i)=><text key={m} x={xP(i)} y={H-6} textAnchor="middle" fontSize="10" fill={C.grayMid}>{m}</text>)}
      {series.map(s=>{
        const pts=s.data.map((v,i)=>`${xP(i)},${yP(v)}`).join(" ");
        return <g key={s.label}>
          <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
          {s.data.map((v,i)=>v>0&&<circle key={i} cx={xP(i)} cy={yP(v)} r="3.5" fill={s.color} stroke={C.white} strokeWidth="1.5"/>)}
        </g>;
      })}
    </svg>
  );
}

function BarChart({ items, height=180 }) {
  if (!items||items.length===0) return null;
  const W=660,H=height,pL=60,pR=16,pT=16,pB=44;
  const cW=W-pL-pR, cH=H-pT-pB;
  const maxV=Math.max(...items.map(i=>i.value),1);
  const barW=Math.min(55,(cW/items.length)-12);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      {[0,.25,.5,.75,1].map(p=>{const v=maxV*p,y=pT+cH*(1-p);return <g key={p}><line x1={pL} y1={y} x2={W-pR} y2={y} stroke={C.grayBorder} strokeWidth="0.8" strokeDasharray="4 3"/>
        <text x={pL-4} y={y+4} textAnchor="end" fontSize="10" fill={C.grayMid}>{v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:v.toFixed(0)}</text></g>;})}
      {items.map((item,i)=>{const x=pL+(i/items.length)*cW+(cW/items.length-barW)/2,bH=(item.value/maxV)*cH,y=pT+cH-bH;
        return <g key={item.label}><rect x={x} y={y} width={barW} height={bH} rx="3" fill={item.color} opacity="0.9"/>
          <text x={x+barW/2} y={H-pB+14} textAnchor="middle" fontSize="9" fill={C.grayMid}>{item.label.length>10?item.label.slice(0,10)+"…":item.label}</text>
          {bH>12&&<text x={x+barW/2} y={y-4} textAnchor="middle" fontSize="9" fill={item.color} fontWeight="600">
            {item.value>=1000000?`${(item.value/1000000).toFixed(1)}M`:item.value>=1000?`${(item.value/1000).toFixed(0)}K`:item.value.toFixed(0)}</text>}
        </g>;
      })}
    </svg>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // step: 0=lista 1=crear 2=areas 3=captura 4=resumen
  const [step, setStep]     = useState(0);
  const [presupuesto, setPres] = useState(null);
  const [areasSeleccionadas, setAreasSel] = useState([]);
  const [costosAreas, setCostosAreas]     = useState({});
  const [capexPM, setCapexPM] = useState([]);
  const [opexPM,  setOpexPM]  = useState([]);
  const [areaActiva, setAreaActiva] = useState(null);
  const [lista, setLista]   = useState([
    { id:1, nombre:"Monitoreo Cuervito", tipo:"servicio",     estado:"Borrador", fecha:"2026-02-01" },
    { id:2, nombre:"BEH Jujo F218358",   tipo:"instalacion",  estado:"En revisión", fecha:"2026-01-15" },
  ]);
  const [nuevoForm, setNuevoForm] = useState({ nombre:"", tipo:"", empresa:"GEOLIS SA DE CV", fechaInicio:"", fechaFin:"" });
  const [plantillaModal, setPlantillaModal] = useState(false);

  // ── Totales ─────────────────────────────────────────────────────────────────
  function totalCat(areaId, cat) {
    return (costosAreas[areaId]?.[cat]||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  }
  function totalNominaArea(areaId) {
    return (costosAreas[areaId]?.nomina||[]).reduce((s,p)=>{
      const f=1+(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR);
      return s+(p.salario||0)*f*(p.cantidad||1);
    },0);
  }
  const capexAreas = areasSeleccionadas.reduce((s,id)=>s+totalCat(id,"capex"),0);
  const opexAreas  = areasSeleccionadas.reduce((s,id)=>s+totalCat(id,"materiales")+totalNominaArea(id)*12+totalCat(id,"viaticos"),0);
  const capexPMTotal = capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const opexPMTotal  = opexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const totalCAPEX   = capexAreas + capexPMTotal;
  const totalOPEX    = opexAreas  + opexPMTotal;
  const totalEgresos = totalCAPEX + totalOPEX;

  // ── Acciones ────────────────────────────────────────────────────────────────
  function crearPresupuesto() {
    const p = { id:uid(), ...nuevoForm, estado:"Borrador", fecha:new Date().toISOString().slice(0,10) };
    setLista(prev=>[p,...prev]);
    setPres(p);
    setAreasSel([]); setCostosAreas({}); setCapexPM([]); setOpexPM([]);
    setStep(2);
  }

  function cargarPlantilla(key) {
    const pl = PLANTILLAS[key];
    if (!pl) return;
    setCapexPM(pl.capex.map(p=>initPartida(p)));
    setOpexPM(pl.opex.map(p=>initPartida(p)));
    setPlantillaModal(false);
  }

  function confirmarAreas() {
    const costos = {};
    areasSeleccionadas.forEach(id=>{
      costos[id] = { capex:[], materiales:[], nomina:[], viaticos:[], estado:"pendiente", comentario:"" };
    });
    setCostosAreas(costos);
    setStep(3);
    setAreaActiva(areasSeleccionadas[0]||null);
  }

  function updatePartida(areaId, cat, id, updated) {
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],[cat]:prev[areaId][cat].map(p=>p.id===id?updated:p)}}));
  }
  function addPartida(areaId, cat) {
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],[cat]:[...(prev[areaId][cat]||[]),initPartida()]}}));
  }
  function removePartida(areaId, cat, id) {
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],[cat]:prev[areaId][cat].filter(p=>p.id!==id)}}));
  }
  function addNomina(areaId) {
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],nomina:[...(prev[areaId].nomina||[]),initNomina()]}}));
  }

  const btn = (label, onClick, variant="primary", disabled=false, extra={}) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"9px 20px", borderRadius:8, border:"none", cursor:disabled?"not-allowed":"pointer",
      fontWeight:700, fontSize:13,
      background:disabled?C.grayBorder:variant==="primary"?C.yellow:variant==="success"?C.success:variant==="danger"?C.danger:C.grayLight,
      color:disabled?C.grayMid:["primary","success","danger"].includes(variant)?variant==="primary"?C.grayDark:C.white:C.grayDark,
      ...extra,
    }}>{label}</button>
  );

  // ── TABS NAV ──────────────────────────────────────────────────────────────
  const tabs = [
    { i:1, label:"Info general" },
    { i:2, label:"Áreas" },
    { i:3, label:"Capturar costos" },
    { i:4, label:"Resumen mensual" },
  ];

  function TabBar() {
    if (step===0) return null;
    return (
      <div style={{ display:"flex", borderBottom:`2px solid ${C.grayBorder}`, marginBottom:24 }}>
        {tabs.map(t=>(
          <button key={t.i} onClick={()=>t.i<step?setStep(t.i):null}
            disabled={t.i>step}
            style={{ padding:"10px 20px", border:"none", background:"none", cursor:t.i<=step?"pointer":"not-allowed",
              fontWeight:600, fontSize:13,
              color:step===t.i?C.yellowDark:step>t.i?C.success:C.grayMid,
              borderBottom:step===t.i?`2px solid ${C.yellow}`:"2px solid transparent",
              marginBottom:-2 }}>
            {step>t.i?"✓ ":""}{t.label}
          </button>
        ))}
        {presupuesto && (
          <div style={{ marginLeft:"auto", padding:"8px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:12, color:C.grayMid }}>Presupuesto activo:</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.grayDark }}>{presupuesto.nombre}</span>
            <button onClick={()=>{setPres(null);setStep(0);}} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.grayMid }}>← Cambiar</button>
          </div>
        )}
      </div>
    );
  }

  const wrap = (children) => (
    <div style={{ maxWidth:1050, margin:"0 auto", padding:"20px 24px", fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ marginBottom:20 }}>
        <span style={{ fontSize:20, fontWeight:800, color:C.grayDark }}>
          <span style={{ color:C.yellow }}>GEOLIS</span> · Módulo de Presupuestos
        </span>
      </div>
      <TabBar/>
      {children}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0: LISTA
  // ══════════════════════════════════════════════════════════════════════════
  if (step===0) return wrap(
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ margin:0, fontSize:18, color:C.grayDark }}>Presupuestos</h2>
        {btn("+ Nuevo presupuesto", ()=>{ setNuevoForm({nombre:"",tipo:"",empresa:"GEOLIS SA DE CV",fechaInicio:"",fechaFin:""}); setStep(1); })}
      </div>
      <div style={{ border:`1px solid ${C.grayBorder}`, borderRadius:10, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8, padding:"10px 16px", background:C.grayLight, borderBottom:`1px solid ${C.grayBorder}` }}>
          {["Proyecto","Tipo","Estado","Acciones"].map(h=><div key={h} style={{ fontSize:11, fontWeight:700, color:C.grayMid, textTransform:"uppercase" }}>{h}</div>)}
        </div>
        {lista.map((p,i)=>(
          <div key={p.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:8, alignItems:"center", padding:"12px 16px", background:i%2===0?C.white:C.grayLight, borderBottom:i<lista.length-1?`1px solid ${C.grayLight}`:"none" }}>
            <div><div style={{ fontWeight:600, fontSize:14 }}>{p.nombre}</div><div style={{ fontSize:11, color:C.grayMid }}>{p.fecha}</div></div>
            <div style={{ fontSize:13, textTransform:"capitalize" }}>{p.tipo}</div>
            <Badge label={p.estado} color={p.estado==="Borrador"?C.grayMid:p.estado==="CONSOLIDADO"?C.success:C.yellowDark} bg={p.estado==="CONSOLIDADO"?C.successLight:C.yellowLight} />
            <button onClick={()=>{setPres(p);setStep(3);}} style={{ padding:"6px 14px", background:C.yellowLight, border:`1px solid ${C.yellowBorder}`, borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600, color:C.yellowDark }}>Abrir →</button>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1: CREAR PRESUPUESTO
  // ══════════════════════════════════════════════════════════════════════════
  if (step===1) return wrap(
    <div style={{ maxWidth:700 }}>
      <h2 style={{ fontSize:18, fontWeight:800, color:C.grayDark, marginBottom:20 }}>Nuevo presupuesto</h2>
      <div style={{ border:`1px solid ${C.grayBorder}`, borderRadius:10, overflow:"hidden", marginBottom:20 }}>
        <div style={{ background:C.grayDark, padding:"12px 16px" }}>
          <div style={{ fontWeight:700, fontSize:15, color:C.white }}>Datos generales</div>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {[["Nombre del proyecto *","nombre"],["Empresa","empresa"]].map(([label,key])=>(
              <div key={key}>
                <label style={{ fontSize:13, fontWeight:600, color:C.grayDark, display:"block", marginBottom:5 }}>{label}</label>
                <input value={nuevoForm[key]} onChange={e=>setNuevoForm({...nuevoForm,[key]:e.target.value})}
                  style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.grayBorder}`, borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.grayDark, display:"block", marginBottom:5 }}>Fecha inicio</label>
              <input type="date" value={nuevoForm.fechaInicio} onChange={e=>setNuevoForm({...nuevoForm,fechaInicio:e.target.value})}
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.grayBorder}`, borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:C.grayDark, display:"block", marginBottom:5 }}>Fecha fin</label>
              <input type="date" value={nuevoForm.fechaFin} onChange={e=>setNuevoForm({...nuevoForm,fechaFin:e.target.value})}
                style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.grayBorder}`, borderRadius:8, fontSize:14, boxSizing:"border-box" }} />
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:13, fontWeight:600, color:C.grayDark, display:"block", marginBottom:8 }}>Tipo de presupuesto *</label>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                {[
                  {id:"instalacion",label:"Instalación",icon:"🏗️"},
                  {id:"servicio",label:"Servicio",icon:"⚙️"},
                  {id:"departamento",label:"Departamento",icon:"🏢"},
                  {id:"suministro",label:"Suministro",icon:"📦"},
                ].map(t=>(
                  <div key={t.id} onClick={()=>setNuevoForm({...nuevoForm,tipo:t.id})} style={{
                    border:`2px solid`, borderColor:nuevoForm.tipo===t.id?C.yellow:C.grayBorder,
                    borderRadius:10, padding:14, cursor:"pointer", textAlign:"center",
                    background:nuevoForm.tipo===t.id?C.yellowLight:C.white,
                  }}>
                    <div style={{ fontSize:24, marginBottom:4 }}>{t.icon}</div>
                    <div style={{ fontWeight:700, fontSize:13, color:C.grayDark }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plantillas */}
      <div style={{ border:`1px solid ${C.yellowBorder}`, borderRadius:10, overflow:"hidden", marginBottom:20 }}>
        <div style={{ background:C.yellowLight, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:C.yellowDark }}>📋 Cargar plantilla (opcional)</div>
            <div style={{ fontSize:12, color:C.grayMid }}>Precarga partidas desde una estructura existente. Puedes editarlas después.</div>
          </div>
          <button onClick={()=>setPlantillaModal(true)} style={{ padding:"8px 16px", background:C.yellow, border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, color:C.grayDark }}>
            Ver plantillas
          </button>
        </div>
        {capexPM.length>0||opexPM.length>0 ? (
          <div style={{ padding:"10px 16px", fontSize:13, color:C.success }}>
            ✓ Plantilla cargada: {capexPM.length} CAPEX + {opexPM.length} OPEX partidas precargadas
          </div>
        ) : null}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between" }}>
        {btn("← Cancelar", ()=>setStep(0), "secondary")}
        {btn("Guardar y continuar →", crearPresupuesto, "primary", !nuevoForm.nombre||!nuevoForm.tipo)}
      </div>

      {/* Modal plantillas */}
      {plantillaModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:C.white, borderRadius:12, padding:28, maxWidth:560, width:"90%", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin:"0 0 16px", fontSize:17, color:C.grayDark }}>Selecciona una plantilla base</h3>
            <p style={{ margin:"0 0 20px", fontSize:13, color:C.grayMid }}>La estructura se cargará como punto de partida. Puedes editar, agregar o eliminar cualquier partida.</p>
            <div style={{ display:"grid", gap:12 }}>
              {Object.entries(PLANTILLAS).map(([key,pl])=>(
                <div key={key} style={{ border:`2px solid ${C.grayBorder}`, borderRadius:10, padding:16, cursor:"pointer" }}
                  onClick={()=>cargarPlantilla(key)}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.yellow}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.grayBorder}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:C.grayDark }}>{pl.icon} {pl.nombre}</div>
                      <div style={{ fontSize:12, color:C.grayMid, marginTop:3 }}>{pl.descripcion}</div>
                      <div style={{ fontSize:11, color:C.yellowDark, marginTop:4 }}>{pl.capex.length} CAPEX · {pl.opex.length} OPEX</div>
                    </div>
                    <span style={{ fontSize:20, color:C.yellow }}>→</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button onClick={()=>setPlantillaModal(false)} style={{ padding:"8px 16px", background:C.grayLight, border:"none", borderRadius:8, cursor:"pointer", fontSize:13 }}>
                Continuar sin plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2: ÁREAS
  // ══════════════════════════════════════════════════════════════════════════
  if (step===2) return wrap(
    <div style={{ maxWidth:700 }}>
      <h2 style={{ fontSize:18, fontWeight:800, color:C.grayDark, marginBottom:6 }}>Áreas participantes</h2>
      <p style={{ color:C.grayMid, fontSize:14, marginBottom:20 }}>Selecciona las áreas que capturarán costos en este presupuesto.</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        {AREAS_CATALOGO.map(a=>{
          const sel=areasSeleccionadas.includes(a.id);
          return (
            <div key={a.id} onClick={()=>setAreasSel(prev=>sel?prev.filter(x=>x!==a.id):[...prev,a.id])} style={{
              display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
              border:`2px solid`, borderColor:sel?C.yellow:C.grayBorder,
              borderRadius:10, cursor:"pointer", background:sel?C.yellowLight:C.white,
            }}>
              <span style={{ fontSize:20 }}>{a.icon}</span>
              <span style={{ fontWeight:600, fontSize:13, color:C.grayDark }}>{a.label}</span>
              {sel && <span style={{ marginLeft:"auto", color:C.yellowDark, fontWeight:800 }}>✓</span>}
            </div>
          );
        })}
      </div>
      {areasSeleccionadas.length>0 && (
        <div style={{ padding:"10px 14px", background:C.yellowLight, border:`1px solid ${C.yellowBorder}`, borderRadius:8, fontSize:13, color:C.yellowDark, marginBottom:20 }}>
          {areasSeleccionadas.length} área(s): {areasSeleccionadas.map(id=>AREAS_CATALOGO.find(a=>a.id===id)?.label).join(", ")}
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        {btn("← Volver", ()=>setStep(1), "secondary")}
        {btn("Confirmar áreas →", confirmarAreas, "primary", areasSeleccionadas.length===0)}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3: CAPTURA DE COSTOS
  // ══════════════════════════════════════════════════════════════════════════
  if (step===3) {
    const costos = areaActiva ? costosAreas[areaActiva] : null;
    const area   = AREAS_CATALOGO.find(a=>a.id===areaActiva);
    const capexA = areaActiva ? totalCat(areaActiva,"capex") : 0;
    const nomMens= areaActiva ? totalNominaArea(areaActiva) : 0;
    const opexA  = areaActiva ? totalCat(areaActiva,"materiales")+(nomMens*12)+totalCat(areaActiva,"viaticos") : 0;

    return wrap(
      <div>
        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16 }}>
          {/* Sidebar áreas */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.grayMid, textTransform:"uppercase", marginBottom:10 }}>Áreas del proyecto</div>
            {areasSeleccionadas.map(id=>{
              const a=AREAS_CATALOGO.find(x=>x.id===id);
              const est=costosAreas[id]?.estado||"pendiente";
              const isActive=areaActiva===id;
              return (
                <div key={id} onClick={()=>setAreaActiva(id)} style={{
                  display:"flex", alignItems:"center", gap:8, padding:"10px 12px", marginBottom:4,
                  borderRadius:8, cursor:"pointer",
                  background:isActive?C.yellowLight:C.white,
                  border:`1px solid`, borderColor:isActive?C.yellowBorder:C.grayBorder,
                }}>
                  <span style={{ fontSize:16 }}>{a?.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.grayDark }}>{a?.label}</div>
                    <div style={{ fontSize:10, color:est==="capturado"?C.success:C.grayMid }}>
                      {est==="capturado"?"✓ Capturado":"En captura"}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop:16, padding:12, background:C.grayLight, borderRadius:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.grayMid, marginBottom:8 }}>TOTALES GENERALES</div>
              <div style={{ marginBottom:4 }}>
                <div style={{ fontSize:10, color:C.grayMid }}>CAPEX</div>
                <div style={{ fontSize:14, fontWeight:800, color:C.yellowDark }}>{fmt(totalCAPEX)}</div>
              </div>
              <div style={{ marginBottom:4 }}>
                <div style={{ fontSize:10, color:C.grayMid }}>OPEX</div>
                <div style={{ fontSize:14, fontWeight:800, color:C.grayDark }}>{fmt(totalOPEX)}</div>
              </div>
              <div style={{ paddingTop:8, borderTop:`1px solid ${C.grayBorder}` }}>
                <div style={{ fontSize:10, color:C.grayMid }}>Total egresos</div>
                <div style={{ fontSize:15, fontWeight:800, color:C.grayDark }}>{fmt(totalEgresos)}</div>
              </div>
            </div>
          </div>

          {/* Panel de captura */}
          <div>
            {!areaActiva ? (
              <div style={{ padding:40, textAlign:"center", color:C.grayMid, background:C.grayLight, borderRadius:10 }}>
                Selecciona un área del panel izquierdo para capturar sus costos.
              </div>
            ) : (
              <div>
                {/* Header área */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ fontSize:22 }}>{area?.icon}</span>
                  <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:C.grayDark }}>{area?.label}</h3>
                  <Badge label={costos?.estado==="capturado"?"✓ Capturado":"En captura"} color={costos?.estado==="capturado"?C.success:C.yellowDark} bg={costos?.estado==="capturado"?C.successLight:C.yellowLight} />
                </div>

                {/* KPIs del área */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                  {[
                    {label:"CAPEX del área", val:capexA, color:C.yellowDark, bg:C.yellowLight, sub:"Equipos e inversiones"},
                    {label:"OPEX del área", val:opexA, color:C.grayDark, bg:C.grayLight, sub:"Nómina + Mat. + Viáticos"},
                    {label:"Total área", val:capexA+opexA, color:C.grayDark, bg:C.grayLight, sub:"CAPEX + OPEX"},
                  ].map(k=>(
                    <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.color}33`, borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:k.color, textTransform:"uppercase" }}>{k.label}</div>
                      <div style={{ fontSize:16, fontWeight:800, color:k.color, marginTop:4 }}>{fmt(k.val)}</div>
                      <div style={{ fontSize:10, color:C.grayMid }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Headers columnas partida */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 80px 1fr 1fr 80px 28px", gap:6, marginBottom:4 }}>
                  {["Categoría","Descripción","Unidad","Cant.","Monto unit.","Total",""].map((h,i)=>
                    <div key={i} style={{ fontSize:10, fontWeight:700, color:C.grayMid, textTransform:"uppercase" }}>{h}</div>
                  )}
                </div>

                {/* CAPEX */}
                <div style={{ border:`1px solid #ddd6fe`, borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                  <div style={{ background:"#7c3aed", padding:"10px 14px", display:"flex", justifyContent:"space-between" }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.white }}>CAPEX · Equipos e inversiones</div>
                    <div style={{ fontSize:14, fontWeight:800, color:C.white }}>{fmt(capexA)}</div>
                  </div>
                  <div style={{ padding:12 }}>
                    {(costos?.capex||[]).map(p=>(
                      <PartidaRow key={p.id} p={p}
                        onUpdate={u=>updatePartida(areaActiva,"capex",p.id,u)}
                        onRemove={()=>removePartida(areaActiva,"capex",p.id)} />
                    ))}
                    <button onClick={()=>addPartida(areaActiva,"capex")} style={{ width:"100%",padding:"7px",border:"2px dashed #ddd6fe",borderRadius:6,background:"transparent",cursor:"pointer",color:"#7c3aed",fontSize:12 }}>
                      + Agregar equipo / inversión (CAPEX)
                    </button>
                  </div>
                </div>

                {/* OPEX Nómina */}
                <div style={{ border:"1px solid #bbf7d0", borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                  <div style={{ background:"#059669", padding:"10px 14px", display:"flex", justifyContent:"space-between" }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.white }}>OPEX · Nómina y Mano de Obra</div>
                    <div style={{ fontSize:14, fontWeight:800, color:C.white }}>{fmt(nomMens)}/mes</div>
                  </div>
                  <div style={{ padding:12 }}>
                    {nomMens>0 && (
                      <div style={{ display:"grid", gridTemplateColumns:"2fr 50px 1fr 80px 80px 1fr 28px", gap:6, marginBottom:6 }}>
                        {["Puesto","Cant.","Salario base/mes","IMSS+PT","Prestac.","Costo real/mes",""].map((h,i)=>
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:C.grayMid, textTransform:"uppercase" }}>{h}</div>
                        )}
                      </div>
                    )}
                    {(costos?.nomina||[]).map(p=>(
                      <NominaRow key={p.id} p={p}
                        onUpdate={u=>updatePartida(areaActiva,"nomina",p.id,u)}
                        onRemove={()=>removePartida(areaActiva,"nomina",p.id)} />
                    ))}
                    <button onClick={()=>addNomina(areaActiva)} style={{ width:"100%",padding:"7px",border:"2px dashed #bbf7d0",borderRadius:6,background:"transparent",cursor:"pointer",color:"#059669",fontSize:12 }}>
                      + Agregar puesto (Nómina)
                    </button>
                  </div>
                </div>

                {/* OPEX Materiales y Viáticos */}
                {[
                  {cat:"materiales",label:"OPEX · Materiales",color:"#0891b2",border:"#bae6fd"},
                  {cat:"viaticos",  label:"OPEX · Viáticos",  color:"#d97706",border:"#fde68a"},
                ].map(({cat,label,color,border})=>(
                  <div key={cat} style={{ border:`1px solid ${border}`, borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                    <div style={{ background:color, padding:"10px 14px", display:"flex", justifyContent:"space-between" }}>
                      <div style={{ fontWeight:700, fontSize:14, color:C.white }}>{label}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:C.white }}>{fmt(totalCat(areaActiva,cat))}</div>
                    </div>
                    <div style={{ padding:12 }}>
                      {(costos?.[cat]||[]).map(p=>(
                        <PartidaRow key={p.id} p={p}
                          onUpdate={u=>updatePartida(areaActiva,cat,p.id,u)}
                          onRemove={()=>removePartida(areaActiva,cat,p.id)} />
                      ))}
                      <button onClick={()=>addPartida(areaActiva,cat)} style={{ width:"100%",padding:"7px",border:`2px dashed ${border}`,borderRadius:6,background:"transparent",cursor:"pointer",color,fontSize:12 }}>
                        + Agregar {cat==="materiales"?"material":"viático"} (OPEX)
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                  {btn("Guardar área", ()=>setCostosAreas(prev=>({...prev,[areaActiva]:{...prev[areaActiva],estado:"capturado"}})), "success")}
                </div>
              </div>
            )}

            {/* CAPEX/OPEX adicional del PM */}
            <div style={{ marginTop:24, borderTop:`2px solid ${C.grayBorder}`, paddingTop:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.grayMid, marginBottom:12 }}>CAPEX / OPEX adicional (PM)</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.yellowDark, marginBottom:8 }}>CAPEX adicional · {fmt(capexPMTotal)}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 80px 1fr 1fr 80px 28px", gap:6, marginBottom:4 }}>
                    {["Cat","Desc","Unidad","Cant","Monto","Total",""].map((h,i)=>
                      <div key={i} style={{ fontSize:9, fontWeight:700, color:C.grayMid, textTransform:"uppercase" }}>{h}</div>
                    )}
                  </div>
                  {capexPM.map(p=>(
                    <PartidaRow key={p.id} p={p} onUpdate={u=>setCapexPM(capexPM.map(x=>x.id===p.id?u:x))} onRemove={()=>setCapexPM(capexPM.filter(x=>x.id!==p.id))} />
                  ))}
                  <button onClick={()=>setCapexPM([...capexPM,initPartida()])} style={{ width:"100%",padding:"7px",border:`2px dashed ${C.yellowBorder}`,borderRadius:6,background:"transparent",cursor:"pointer",color:C.yellowDark,fontSize:12 }}>+ CAPEX</button>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.grayMid, marginBottom:8 }}>OPEX adicional · {fmt(opexPMTotal)}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 2fr 80px 1fr 1fr 80px 28px", gap:6, marginBottom:4 }}>
                    {["Cat","Desc","Unidad","Cant","Monto","Total",""].map((h,i)=>
                      <div key={i} style={{ fontSize:9, fontWeight:700, color:C.grayMid, textTransform:"uppercase" }}>{h}</div>
                    )}
                  </div>
                  {opexPM.map(p=>(
                    <PartidaRow key={p.id} p={p} onUpdate={u=>setOpexPM(opexPM.map(x=>x.id===p.id?u:x))} onRemove={()=>setOpexPM(opexPM.filter(x=>x.id!==p.id))} />
                  ))}
                  <button onClick={()=>setOpexPM([...opexPM,initPartida()])} style={{ width:"100%",padding:"7px",border:`2px dashed ${C.grayBorder}`,borderRadius:6,background:"transparent",cursor:"pointer",color:C.grayMid,fontSize:12 }}>+ OPEX</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
          {btn("Ver Resumen Mensual →", ()=>setStep(4), "primary")}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4: RESUMEN MENSUAL + PDF
  // ══════════════════════════════════════════════════════════════════════════
  if (step===4) {
    // Distribución mensual
    const mesesCAPEX = MESES.map((_,i)=>{
      const desdeAreas = areasSeleccionadas.reduce((s,id)=>s+(distribuirMeses(totalCat(id,"capex"),"capex")[i]||0),0);
      const desdePM    = capexPM.reduce((s,p)=>s+(distribuirMeses((p.cantidad||0)*(p.monto||0),"capex")[i]||0),0);
      return desdeAreas + desdePM;
    });
    const mesesOPEX = MESES.map((_,i)=>{
      const mat = areasSeleccionadas.reduce((s,id)=>s+(distribuirMeses(totalCat(id,"materiales"),"opex")[i]||0),0);
      const via = areasSeleccionadas.reduce((s,id)=>s+(distribuirMeses(totalCat(id,"viaticos"),"opex")[i]||0),0);
      const nom = areasSeleccionadas.reduce((s,id)=>s+totalNominaArea(id),0); // ya mensual
      const pm  = opexPM.reduce((s,p)=>s+(distribuirMeses((p.cantidad||0)*(p.monto||0),"opex")[i]||0),0);
      return mat+via+nom+pm;
    });

    const seriesCats = [
      { label:"CAPEX", color:C.yellowDark, data:mesesCAPEX },
      { label:"OPEX",  color:C.grayMid,   data:mesesOPEX  },
    ].filter(s=>s.data.some(v=>v>0));

    const barrasAreas = areasSeleccionadas.map((id,idx)=>({
      label:AREAS_CATALOGO.find(a=>a.id===id)?.label||id,
      value:totalCat(id,"capex")+(totalCat(id,"materiales")+totalNominaArea(id)*12+totalCat(id,"viaticos")),
      color:idx%2===0?C.yellow:C.grayMid,
    })).filter(b=>b.value>0);

    const totalesMes = MESES.map((_,i)=>mesesCAPEX[i]+mesesOPEX[i]);

    return wrap(
      <div>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #resumen-pdf, #resumen-pdf * { visibility: visible; }
            #resumen-pdf { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}</style>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:C.grayDark }}>Resumen mensual</h2>
            <div style={{ fontSize:13, color:C.grayMid }}>{presupuesto?.nombre} · {presupuesto?.empresa}</div>
          </div>
          <div style={{ display:"flex", gap:10 }} className="no-print">
            {btn("← Regresar a captura", ()=>setStep(3), "secondary")}
            {btn("⬇ Exportar PDF", ()=>window.print(), "primary")}
          </div>
        </div>

        <div id="resumen-pdf">
          {/* KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
            {[
              {label:"CAPEX total",  val:totalCAPEX,   color:C.yellowDark, bg:C.yellowLight},
              {label:"OPEX total",   val:totalOPEX,    color:C.grayDark,  bg:C.grayLight},
              {label:"Total egresos",val:totalEgresos,  color:C.danger,    bg:C.dangerLight},
              {label:"Nómina anual", val:areasSeleccionadas.reduce((s,id)=>s+totalNominaArea(id)*12,0), color:C.success, bg:C.successLight},
            ].map(k=>(
              <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.color}33`, borderRadius:10, padding:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:k.color, textTransform:"uppercase" }}>{k.label}</div>
                <div style={{ fontSize:18, fontWeight:800, color:k.color, marginTop:6 }}>{fmt(k.val)}</div>
              </div>
            ))}
          </div>

          {/* Gráfica 1: CAPEX vs OPEX mensual */}
          {seriesCats.length>0 && (
            <div style={{ background:C.white, border:`1px solid ${C.grayBorder}`, borderRadius:10, padding:20, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:4, height:18, background:C.yellow, borderRadius:2 }}/>
                <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:C.grayDark }}>CAPEX y OPEX por mes (M0–M12)</h3>
              </div>
              <div style={{ display:"flex", gap:16, marginBottom:10 }}>
                {seriesCats.map(s=><div key={s.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:12, height:12, borderRadius:2, background:s.color }}/><span style={{ fontSize:12, color:C.grayMid }}>{s.label}</span>
                </div>)}
              </div>
              <LineChart series={seriesCats} height={220}/>
              <div style={{ fontSize:11, color:C.grayMid, textAlign:"center", marginTop:6 }}>CAPEX concentrado en M0 · OPEX distribuido uniformemente</div>
            </div>
          )}

          {/* Gráfica 2: por área */}
          {barrasAreas.length>0 && (
            <div style={{ background:C.white, border:`1px solid ${C.grayBorder}`, borderRadius:10, padding:20, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:4, height:18, background:C.yellow, borderRadius:2 }}/>
                <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:C.grayDark }}>Costo total por área</h3>
              </div>
              <BarChart items={barrasAreas} height={200}/>
            </div>
          )}

          {/* Tabla mensual M0–M12 */}
          <div style={{ background:C.white, border:`1px solid ${C.grayBorder}`, borderRadius:10, padding:20, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ width:4, height:18, background:C.yellow, borderRadius:2 }}/>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:C.grayDark }}>Tabla de egresos mensual</h3>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ background:C.grayDark, color:C.white }}>
                    <td style={{ padding:"8px 12px", fontWeight:700, minWidth:120 }}>Concepto</td>
                    {MESES.map(m=><td key={m} style={{ padding:"6px 4px", textAlign:"right", fontWeight:600, minWidth:52 }}>{m}</td>)}
                    <td style={{ padding:"6px 12px", textAlign:"right", fontWeight:700 }}>Total</td>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {label:"CAPEX", color:C.yellowDark, meses:mesesCAPEX, total:totalCAPEX, bg:C.yellowLight},
                    {label:"OPEX",  color:C.grayMid,   meses:mesesOPEX,  total:totalOPEX,  bg:C.grayLight},
                  ].map((f,fi)=>(
                    <tr key={f.label} style={{ background:fi%2===0?C.white:C.grayLight, borderBottom:`1px solid ${C.grayBorder}` }}>
                      <td style={{ padding:"7px 12px", fontWeight:700, color:f.color, display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:f.color, flexShrink:0 }}/>{f.label}
                      </td>
                      {f.meses.map((v,i)=>(
                        <td key={i} style={{ padding:"6px 4px", textAlign:"right", color:v>0?C.grayDark:C.grayMid }}>
                          {v>0?(v>=1000?`$${(v/1000).toFixed(0)}K`:fmt(v)):"—"}
                        </td>
                      ))}
                      <td style={{ padding:"6px 12px", textAlign:"right", fontWeight:700, color:f.color }}>{fmt(f.total)}</td>
                    </tr>
                  ))}
                  <tr style={{ background:C.yellowLight, borderTop:`2px solid ${C.yellow}` }}>
                    <td style={{ padding:"8px 12px", fontWeight:800, color:C.grayDark }}>TOTAL</td>
                    {totalesMes.map((v,i)=>(
                      <td key={i} style={{ padding:"6px 4px", textAlign:"right", fontWeight:700, color:C.grayDark }}>
                        {v>0?(v>=1000?`$${(v/1000).toFixed(0)}K`:fmt(v)):"—"}
                      </td>
                    ))}
                    <td style={{ padding:"6px 12px", textAlign:"right", fontWeight:800, color:C.yellowDark }}>{fmt(totalEgresos)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalle por área */}
          {areasSeleccionadas.length>0 && (
            <div style={{ background:C.white, border:`1px solid ${C.grayBorder}`, borderRadius:10, padding:20, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:4, height:18, background:C.yellow, borderRadius:2 }}/>
                <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:C.grayDark }}>Resumen por área</h3>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:C.grayLight }}>
                    <td style={{ padding:"8px 12px", fontWeight:700, fontSize:11, color:C.grayMid }}>Área</td>
                    <td style={{ padding:"8px 8px", fontWeight:700, fontSize:11, color:C.yellowDark, textAlign:"right" }}>CAPEX</td>
                    <td style={{ padding:"8px 8px", fontWeight:700, fontSize:11, color:C.grayMid, textAlign:"right" }}>OPEX</td>
                    <td style={{ padding:"8px 12px", fontWeight:700, fontSize:11, color:C.grayDark, textAlign:"right" }}>Total</td>
                  </tr>
                </thead>
                <tbody>
                  {areasSeleccionadas.map((id,i)=>{
                    const a=AREAS_CATALOGO.find(x=>x.id===id);
                    const cx=totalCat(id,"capex");
                    const ox=totalCat(id,"materiales")+totalNominaArea(id)*12+totalCat(id,"viaticos");
                    return (
                      <tr key={id} style={{ background:i%2===0?C.white:C.grayLight, borderTop:`1px solid ${C.grayBorder}` }}>
                        <td style={{ padding:"9px 12px", fontWeight:600 }}>{a?.icon} {a?.label}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", color:C.yellowDark }}>{fmt(cx)}</td>
                        <td style={{ padding:"9px 8px", textAlign:"right", color:C.grayMid }}>{fmt(ox)}</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", fontWeight:700 }}>{fmt(cx+ox)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ background:C.grayDark }}>
                    <td style={{ padding:"10px 12px", fontWeight:700, color:C.white }}>TOTAL</td>
                    <td style={{ padding:"10px 8px", textAlign:"right", fontWeight:700, color:C.yellow }}>{fmt(totalCAPEX)}</td>
                    <td style={{ padding:"10px 8px", textAlign:"right", fontWeight:700, color:"#aaa" }}>{fmt(totalOPEX)}</td>
                    <td style={{ padding:"10px 12px", textAlign:"right", fontWeight:800, color:C.white, fontSize:13 }}>{fmt(totalEgresos)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer PDF */}
          <div style={{ textAlign:"center", fontSize:11, color:C.grayMid, paddingTop:16, borderTop:`1px solid ${C.grayBorder}` }}>
            GEOLIS SA DE CV · {presupuesto?.nombre} · Generado el {new Date().toLocaleDateString("es-MX")}
          </div>
        </div>
      </div>
    );
  }

  return null;
}