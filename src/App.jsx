import { useState, useEffect, useRef } from "react";

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = {
  yellow:"#DDAC00", yellowLight:"#FFF8E1", yellowBorder:"#F0C800", yellowDark:"#B08900",
  grayDark:"#1a1a1a", grayMid:"#6B6B6B", grayLight:"#F5F5F5", grayBorder:"#E0E0E0",
  white:"#FFFFFF", danger:"#C0392B", dangerLight:"#FDECEA",
  success:"#1E7E34", successLight:"#EAF7ED",
  sidebar:"#111111", contentBg:"#F8F8F8",
};

// ─── ÁREAS POR TIPO ───────────────────────────────────────────────────────────
const AREAS_CAMPO = [
  { id:"operaciones",  label:"Operaciones", },
  { id:"construccion", label:"Construcción", },
  { id:"electricidad", label:"Electricidad", },
  { id:"generacion",   label:"Generación",    },
  { id:"calidad",      label:"Calidad",       },
  { id:"sspa",         label:"SSPA",         },
  { id:"hps",          label:"HPS",          },
  { id:"mantenimiento",label:"Mantenimiento",},
  { id:"logistica",    label:"Logística",    },
];

const AREAS_DEPTO = [
  { id:"ti",              label:"Tecnología (TI)",        },
  { id:"innovacion",      label:"Innovación y Tecnología", },
  { id:"finanzas",        label:"Finanzas",            },
];

const AREAS_SUMINISTRO = [
  { id:"seguridad",       label:"Seguridad",               },
  { id:"staff_direccion", label:"Staff de Dirección",      },
  { id:"dir_general",     label:"Dirección General",       },
  { id:"comunicacion",    label:"Comunicación",            },
  { id:"innov_tec",       label:"Innovación y Tecnología",  },
  { id:"almacen",         label:"Almacén",               },
];

function getAreasCatalogo(tipo) {
  if (tipo === "departamento") return AREAS_DEPTO;
  if (tipo === "suministro")   return AREAS_SUMINISTRO;
  return AREAS_CAMPO; // instalacion, servicio
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const UNIDADES_BASE = ["Unidad","Día","Semana","Mes","Año","Servicio","Viaje","Pieza","Kg","Metro","Litro","Hora","Global"];

// ─── PLANTILLAS ───────────────────────────────────────────────────────────────
const PLANTILLAS = {
  cuervito: {
    nombre:"Monitoreo Cuervito",
    desc:"Basada en 01022026 Presupuesto Monitoreo Cuervito · Servicio de campo",
    tipos:["servicio"],
    capex:[
      {cat:"EQUIPO DE COMPUTO",     desc:"Laptops / Equipos de cómputo",         unidad:"Unidad",  cantidad:1,monto:0},
      {cat:"ACCESORIOS",            desc:"Monitores, teclados, periféricos",      unidad:"Unidad",  cantidad:1,monto:0},
      {cat:"EQUIPO DE TRANSPORTE",  desc:"Vehículos / Camionetas de campo",       unidad:"Unidad",  cantidad:1,monto:0},
      {cat:"MAQUINARIA Y EQUIPO",   desc:"Maquinaria especializada",              unidad:"Unidad",  cantidad:1,monto:0},
      {cat:"INFRAESTRUCTURA DE RED",desc:"Switches, access points, cableado",     unidad:"Global",  cantidad:1,monto:0},
      {cat:"GABINETE Y ENERGÍA",    desc:"Gabinetes, UPS, instalación eléctrica", unidad:"Global",  cantidad:1,monto:0},
    ],
    opex:[
      {cat:"NÓMINA Y ADICIONALES",      desc:"Nómina mensual del proyecto",                unidad:"Mes",     cantidad:1,monto:0},
      {cat:"LICENCIAMIENTO MXN MENSUAL",desc:"Software mensual (Office, Adobe, etc.)",     unidad:"Mes",     cantidad:1,monto:0},
      {cat:"LICENCIAMIENTO MXN ANUAL",  desc:"Software anual (AutoCAD, etc.)",             unidad:"Año",     cantidad:1,monto:0},
      {cat:"TELECOMUNICACIONES",        desc:"Internet, radio, telefonía (Starlink, etc.)",unidad:"Mes",     cantidad:1,monto:0},
      {cat:"VEHÍCULOS Y COMBUSTIBLE",   desc:"Combustible y operación de vehículos",       unidad:"Mes",     cantidad:1,monto:0},
      {cat:"VIÁTICOS",                  desc:"Viáticos y gastos de campo",                 unidad:"Día",     cantidad:1,monto:0},
      {cat:"ARTÍCULOS DE SEGURIDAD",    desc:"EPP y uniformes",                            unidad:"Unidad",  cantidad:1,monto:0},
      {cat:"MATERIALES",                desc:"Materiales de instalación y operación",       unidad:"Unidad",  cantidad:1,monto:0},
      {cat:"SERVICIOS",                 desc:"Servicios externos y contratistas",           unidad:"Servicio",cantidad:1,monto:0},
    ],
  },
  instalacion: {
    nombre:"Proyecto de Instalación", 
    desc:"Proyectos de campo con mano de obra · Instalación, construcción",
    tipos:["instalacion"],
    capex:[
      {cat:"EQUIPO DE TRANSPORTE",  desc:"Camionetas de campo",                   unidad:"Unidad", cantidad:1,monto:0},
      {cat:"MAQUINARIA Y EQUIPO",   desc:"Equipo especializado de instalación",   unidad:"Unidad", cantidad:1,monto:0},
      {cat:"GABINETE Y ENERGÍA",    desc:"Gabinetes y sistema de energía",        unidad:"Global", cantidad:1,monto:0},
      {cat:"TRANSMISIÓN",           desc:"Equipos de transmisión y comunicación", unidad:"Global", cantidad:1,monto:0},
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
  depto_ti: {
    nombre:"Departamento TI 2026",
    desc:"Basada en Presupuesto_Geolis_2026_v4.1_FormatoCuervito · Solo para área de TI",
    tipos:["departamento"],
    areasTI:true, // solo se muestra si el área seleccionada es TI
    capex:[
      {cat:"EQUIPO DE COMPUTO",    desc:"Laptops Geolis y Cuervito (Dell Pro, Pro Plus, Pro Max)", unidad:"Unidad",cantidad:1,monto:0},
      {cat:"ACCESORIOS",           desc:"Monitores, teclados, docking stations",                   unidad:"Unidad",cantidad:1,monto:0},
      {cat:"INFRAESTRUCTURA DE RED",desc:"Access Points, cableado, switches",                      unidad:"Global",cantidad:1,monto:0},
    ],
    opex:[
      {cat:"LICENCIAMIENTO MXN MENSUAL",desc:"MS Office 365, Adobe, Antivirus, Correos .mx",      unidad:"Mes",     cantidad:1,monto:0},
      {cat:"LICENCIAMIENTO MXN ANUAL",  desc:"Autodesk AutoCAD, AutoCAD LT",                       unidad:"Año",     cantidad:1,monto:0},
      {cat:"LICENCIAMIENTO USD",        desc:"ChatGPT Business, Claude Pro, ClickUp, Solidworks",  unidad:"Mes",     cantidad:1,monto:0},
      {cat:"TELECOMUNICACIONES",        desc:"Internet satelital Starlink, líneas telefónicas",     unidad:"Mes",     cantidad:1,monto:0},
      {cat:"NÓMINA Y ADICIONALES",      desc:"Nómina del equipo de TI",                            unidad:"Mes",     cantidad:1,monto:0},
    ],
  },
};

// Sugerir plantilla según tipo seleccionado
function plantillasSugeridas(tipo) {
  return Object.entries(PLANTILLAS)
    .filter(([,pl])=>pl.tipos.includes(tipo))
    .map(([key,pl])=>({key,...pl}));
}

// Factores nómina
const F_IMSS=0.32, F_PREST=0.40, F_ISR=0.05;
const PUESTOS=["Director de Proyecto","Gerente de Área","Supervisor","Ingeniero de Campo","Técnico Especialista","Técnico","Operador","Ayudante General","Otro"];

let _id=1;
const uid=()=>++_id;
const fmt=n=>isNaN(n)||n==null?"$0.00":"$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
const LS_CATS="geolis_cats_v2";

function getCatsCustom(){try{return JSON.parse(localStorage.getItem(LS_CATS)||"[]");}catch{return[];}}
function saveCat(cat){const e=getCatsCustom();if(!e.includes(cat))localStorage.setItem(LS_CATS,JSON.stringify([...e,cat]));}

function initPartida(o={}){return{id:uid(),cat:"",desc:"",unidad:"Unidad",cantidad:1,monto:0,...o};}
function initNomina(o={}){return{id:uid(),puesto:"Técnico",puestoCustom:"",cantidad:1,salario:0,imss:F_IMSS,prestaciones:F_PREST,isr:F_ISR,...o};}
function distribuirMeses(total,tipo="opex"){
  if(tipo==="capex"){const m=Array(12).fill(0);m[0]=total;return m;}
  return Array(12).fill(parseFloat((total/12).toFixed(2)));
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({label,color,bg}){
  return <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700,
    background:bg||C.grayLight,color:color||C.grayMid,border:`1px solid ${color||C.grayMid}44`}}>{label}</span>;
}

// ─── ESTADO BADGE ─────────────────────────────────────────────────────────────
function EstadoBadge({estado}){
  const map={
    "Borrador":   {color:C.grayMid,    bg:"#F0F0F0"},
    "En revisión":{color:C.yellowDark, bg:C.yellowLight},
    "Aprobado":   {color:C.success,    bg:C.successLight},
  };
  const e=map[estado]||map["Borrador"];
  return <Badge label={estado} color={e.color} bg={e.bg}/>;
}

// ─── CATEGORY INPUT ───────────────────────────────────────────────────────────
function CatInput({value,onChange,placeholder="Categoría"}){
  const [open,setOpen]=useState(false);
  const [texto,setTexto]=useState(value||"");
  const ref=useRef();
  const BASE=[
    "NÓMINA Y ADICIONALES","EQUIPO DE COMPUTO","EQUIPO DE TRANSPORTE","MAQUINARIA Y EQUIPO",
    "ACCESORIOS","MATERIALES","VIÁTICOS","TELECOMUNICACIONES","VEHÍCULOS Y COMBUSTIBLE",
    "ARTÍCULOS DE SEGURIDAD","SERVICIOS","LICENCIAMIENTO MXN MENSUAL","LICENCIAMIENTO MXN ANUAL",
    "LICENCIAMIENTO USD","INFRAESTRUCTURA DE RED","GABINETE Y ENERGÍA","TRANSMISIÓN",
    "INSUMOS DE OFICINA","INSUMOS OPERATIVOS","HERRAMIENTAS","EQUIPOS Y ENSERES",
    "SEGUROS","FLETES NACIONALES","SERVICIOS DE CAPACITACIÓN","RENTA DE MAQUINARIA",
    "SOFTWARE Y LICENCIAS","EQUIPO DE MOBILIARIO",...getCatsCustom(),
  ];
  const cats=[...new Set(BASE)];
  const filtradas=cats.filter(c=>c.toLowerCase().includes(texto.toLowerCase()));

  useEffect(()=>{setTexto(value||"");},[value]);
  useEffect(()=>{
    function h(e){if(ref.current&&!ref.current.contains(e.target))setOpen(false);}
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  function select(cat){setTexto(cat);onChange(cat);setOpen(false);}

  return(
    <div ref={ref} style={{position:"relative"}}>
      <input value={texto}
        onChange={e=>{setTexto(e.target.value);onChange(e.target.value);setOpen(true);}}
        onFocus={()=>setOpen(true)}
        onKeyDown={e=>{if(e.key==="Enter"&&texto.trim()){saveCat(texto.trim().toUpperCase());select(texto.trim().toUpperCase());}}}
        placeholder={placeholder}
        style={{width:"100%",padding:"7px 10px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12}}/>
      {open&&filtradas.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:999,background:C.white,
          border:`1px solid ${C.grayBorder}`,borderRadius:6,maxHeight:180,overflowY:"auto",
          boxShadow:"0 4px 16px rgba(0,0,0,0.15)",marginTop:2}}>
          {texto&&!cats.includes(texto.toUpperCase())&&(
            <div onMouseDown={e=>{e.preventDefault();saveCat(texto.toUpperCase());select(texto.toUpperCase());}}
              style={{padding:"8px 12px",fontSize:12,color:C.yellowDark,cursor:"pointer",
                borderBottom:`1px solid ${C.grayLight}`,fontWeight:700}}>
              + Agregar "{texto.toUpperCase()}"
            </div>
          )}
          {filtradas.map(cat=>(
            <div key={cat} onMouseDown={e=>{e.preventDefault();select(cat);}}
              style={{padding:"7px 12px",fontSize:12,cursor:"pointer",
                background:value===cat?C.yellowLight:"transparent"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.yellowLight}
              onMouseLeave={e=>e.currentTarget.style.background=value===cat?C.yellowLight:"transparent"}>
              {cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PARTIDA ROW ──────────────────────────────────────────────────────────────
function PartidaRow({p,onUpdate,onRemove}){
  const total=(p.cantidad||0)*(p.monto||0);
  return(
    <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px 1fr 1fr 80px 28px",gap:6,alignItems:"center",marginBottom:5}}>
      <CatInput value={p.cat} onChange={v=>onUpdate({...p,cat:v})}/>
      <input value={p.desc} onChange={e=>onUpdate({...p,desc:e.target.value})} placeholder="Descripción"
        style={{padding:"7px 8px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12}}/>
      <select value={p.unidad} onChange={e=>onUpdate({...p,unidad:e.target.value})}
        style={{padding:"7px 6px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:11}}>
        {UNIDADES_BASE.map(u=><option key={u}>{u}</option>)}
      </select>
      <input type="number" min="0" step="1" value={p.cantidad} onChange={e=>onUpdate({...p,cantidad:parseFloat(e.target.value)||0})}
        style={{padding:"7px 6px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12,textAlign:"right"}}/>
      <input type="number" min="0" step="0.01" value={p.monto} onChange={e=>onUpdate({...p,monto:parseFloat(e.target.value)||0})}
        style={{padding:"7px 6px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12,textAlign:"right"}}/>
      <span style={{fontSize:12,fontWeight:700,color:C.yellowDark,textAlign:"right"}}>{fmt(total)}</span>
      <button onClick={onRemove} style={{background:C.dangerLight,color:C.danger,border:"none",borderRadius:4,padding:"4px 7px",cursor:"pointer",fontSize:12}}>✕</button>
    </div>
  );
}

// ─── NOMINA ROW ───────────────────────────────────────────────────────────────
function NominaRow({p,onUpdate,onRemove}){
  const factor=1+(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR);
  const costoMensual=(p.salario||0)*factor*(p.cantidad||1);
  return(
    <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:10,marginBottom:8}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 50px 1fr 80px 80px 1fr 28px",gap:6,alignItems:"center"}}>
        <div>
          <select value={p.puesto} onChange={e=>onUpdate({...p,puesto:e.target.value})}
            style={{width:"100%",padding:"6px 8px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12}}>
            {PUESTOS.map(pu=><option key={pu}>{pu}</option>)}
          </select>
          {p.puesto==="Otro"&&<input value={p.puestoCustom||""} onChange={e=>onUpdate({...p,puestoCustom:e.target.value})}
            placeholder="Nombre del puesto" style={{width:"100%",marginTop:3,padding:"5px 8px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12}}/>}
        </div>
        <input type="number" min="1" value={p.cantidad} onChange={e=>onUpdate({...p,cantidad:parseInt(e.target.value)||1})}
          style={{padding:"6px 4px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12,textAlign:"center"}}/>
        <input type="number" min="0" step="0.01" value={p.salario} onChange={e=>onUpdate({...p,salario:parseFloat(e.target.value)||0})}
          placeholder="Salario/mes" style={{padding:"6px 6px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:12,textAlign:"right"}}/>
        <div style={{textAlign:"center"}}>
          <input type="number" min="0" max="1" step="0.01" value={p.imss} onChange={e=>onUpdate({...p,imss:parseFloat(e.target.value)||0})}
            style={{width:"100%",padding:"4px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:11,textAlign:"center"}}/>
          <div style={{fontSize:9,color:C.grayMid}}>IMSS+PT</div>
        </div>
        <div style={{textAlign:"center"}}>
          <input type="number" min="0" max="2" step="0.01" value={p.prestaciones} onChange={e=>onUpdate({...p,prestaciones:parseFloat(e.target.value)||0})}
            style={{width:"100%",padding:"4px",border:`1px solid ${C.grayBorder}`,borderRadius:6,fontSize:11,textAlign:"center"}}/>
          <div style={{fontSize:9,color:C.grayMid}}>Prestac.</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:13,fontWeight:800,color:C.success}}>{fmt(costoMensual)}</div>
          <div style={{fontSize:9,color:C.grayMid}}>Costo real/mes</div>
        </div>
        <button onClick={onRemove} style={{background:C.dangerLight,color:C.danger,border:"none",borderRadius:4,padding:"4px 7px",cursor:"pointer",fontSize:12}}>✕</button>
      </div>
      <div style={{marginTop:6,padding:"4px 8px",background:"#dcfce7",borderRadius:4,fontSize:10,color:"#15803d"}}>
        {fmt(p.salario)} × (1+{p.imss} IMSS+{p.prestaciones} Prest.+{p.isr||F_ISR} ISR) × {p.cantidad} = <strong>{fmt(costoMensual)}/mes</strong> · Anual: <strong>{fmt(costoMensual*12)}</strong>
      </div>
    </div>
  );
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────
function LineChart({series,height=200}){
  if(!series||series.length===0)return null;
  const W=700,H=height,pL=64,pR=16,pT=16,pB=36;
  const cW=W-pL-pR,cH=H-pT-pB;
  const allV=series.flatMap(s=>s.data);
  const maxV=Math.max(...allV,1);
  const xP=i=>pL+(i/11)*cW, yP=v=>pT+cH-(v/maxV)*cH;
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      {[0,.25,.5,.75,1].map(p=>{const v=maxV*p,y=yP(v);return <g key={p}>
        <line x1={pL} y1={y} x2={W-pR} y2={y} stroke={C.grayBorder} strokeWidth="0.8" strokeDasharray="4 3"/>
        <text x={pL-6} y={y+4} textAnchor="end" fontSize="10" fill={C.grayMid}>
          {v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v.toFixed(0)}`}
        </text></g>;})}
      {MESES.map((m,i)=><text key={m} x={xP(i)} y={H-6} textAnchor="middle" fontSize="10" fill={C.grayMid}>{m}</text>)}
      {series.map(s=>{
        const pts=s.data.map((v,i)=>`${xP(i)},${yP(v)}`).join(" ");
        return <g key={s.label}>
          <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
          {s.data.map((v,i)=>v>0&&<circle key={i} cx={xP(i)} cy={yP(v)} r="4" fill={s.color} stroke={C.white} strokeWidth="2"/>)}
        </g>;
      })}
    </svg>
  );
}

function BarChart({items,height=180}){
  if(!items||items.length===0)return null;
  const W=700,H=height,pL=64,pR=16,pT=16,pB=44;
  const cW=W-pL-pR,cH=H-pT-pB;
  const maxV=Math.max(...items.map(i=>i.value),1);
  const barW=Math.min(60,(cW/items.length)-14);
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      {[0,.25,.5,.75,1].map(p=>{const v=maxV*p,y=pT+cH*(1-p);return <g key={p}>
        <line x1={pL} y1={y} x2={W-pR} y2={y} stroke={C.grayBorder} strokeWidth="0.8" strokeDasharray="4 3"/>
        <text x={pL-6} y={y+4} textAnchor="end" fontSize="10" fill={C.grayMid}>
          {v>=1000000?`$${(v/1000000).toFixed(1)}M`:v>=1000?`$${(v/1000).toFixed(0)}K`:`$${v.toFixed(0)}`}
        </text></g>;})}
      {items.map((item,i)=>{
        const x=pL+(i/items.length)*cW+(cW/items.length-barW)/2;
        const bH=(item.value/maxV)*cH,y=pT+cH-bH;
        return <g key={item.label}>
          <rect x={x} y={y} width={barW} height={bH} rx="3" fill={item.color} opacity="0.9"/>
          <text x={x+barW/2} y={H-pB+14} textAnchor="middle" fontSize="10" fill={C.grayMid}>
            {item.label.length>11?item.label.slice(0,11)+"…":item.label}
          </text>
          {bH>16&&<text x={x+barW/2} y={y-5} textAnchor="middle" fontSize="10" fill={item.color} fontWeight="700">
            {item.value>=1000000?`${(item.value/1000000).toFixed(1)}M`:item.value>=1000?`${(item.value/1000).toFixed(0)}K`:item.value.toFixed(0)}
          </text>}
        </g>;
      })}
    </svg>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [step,setStep]             = useState(0);
  const [presupuesto,setPres]      = useState(null);
  const [areasSeleccionadas,setAreasSel] = useState([]);
  const [costosAreas,setCostosAreas]    = useState({});
  const [areaActiva,setAreaActiva]      = useState(null);
  const [lista,setLista] = useState([
    {id:1,nombre:"Monitoreo Cuervito",tipo:"servicio",   estado:"Borrador",   fecha:"2026-02-01"},
    {id:2,nombre:"BEH Jujo F218358",  tipo:"instalacion",estado:"En revisión",fecha:"2026-01-15"},
  ]);
  const [form,setForm] = useState({nombre:"",tipo:"",empresa:"GEOLIS SA DE CV",fechaInicio:"",fechaFin:""});
  const [plantillaModal,setPlantillaModal] = useState(false);
  const [plantillaCargada,setPlantillaCargada] = useState(null);
  // partidas de plantilla se cargan directo en el área virtual "__pm__"
  const [capexPM,setCapexPM] = useState([]);
  const [opexPM, setOpexPM]  = useState([]);
  const [modoEdicion,setModoEdicion] = useState(false); // true = editando existente

  // Catálogo de áreas dinámico según tipo activo
  const areasCatalogo = getAreasCatalogo(presupuesto?.tipo || form?.tipo || "instalacion");

  // ── Totales ─────────────────────────────────────────────────────────────────
  function totalCat(areaId,cat){
    return (costosAreas[areaId]?.[cat]||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  }
  function totalNominaArea(areaId){
    return (costosAreas[areaId]?.nomina||[]).reduce((s,p)=>{
      const f=1+(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR);
      return s+(p.salario||0)*f*(p.cantidad||1);
    },0);
  }
  const capexAreas   = areasSeleccionadas.reduce((s,id)=>s+totalCat(id,"capex"),0);
  const opexAreas    = areasSeleccionadas.reduce((s,id)=>s+totalCat(id,"materiales")+totalNominaArea(id)*12+totalCat(id,"viaticos"),0);
  const capexPMTotal = capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const opexPMTotal  = opexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const totalCAPEX   = capexAreas+capexPMTotal;
  const totalOPEX    = opexAreas +opexPMTotal;
  const totalEgresos = totalCAPEX+totalOPEX;

  // ── Acciones ────────────────────────────────────────────────────────────────
  function abrirNuevo(){
    setForm({nombre:"",tipo:"",empresa:"GEOLIS SA DE CV",fechaInicio:"",fechaFin:""});
    setAreasSel([]); setCostosAreas({}); setCapexPM([]); setOpexPM([]);
    setPlantillaCargada(null); setPres(null); setModoEdicion(false);
    setStep(1);
  }

  function abrirEdicion(p){
    setForm({nombre:p.nombre,tipo:p.tipo,empresa:p.empresa||"GEOLIS SA DE CV",fechaInicio:p.fechaInicio||"",fechaFin:p.fechaFin||""});
    setAreasSel(p._areas||[]); setCostosAreas(p._costos||{}); setCapexPM(p._capexPM||[]); setOpexPM(p._opexPM||[]);
    setPlantillaCargada(null); setPres(p); setModoEdicion(true);
    setStep(1);
  }

  function guardarPresupuesto(){
    const snapshot={...form,estado:"Borrador",fecha:new Date().toISOString().slice(0,10),
      _areas:areasSeleccionadas,_costos:costosAreas,_capexPM:capexPM,_opexPM:opexPM};
    if(modoEdicion&&presupuesto){
      const actualizado={...presupuesto,...snapshot};
      setLista(prev=>prev.map(x=>x.id===presupuesto.id?actualizado:x));
      setPres(actualizado);
    } else {
      const p={id:uid(),...snapshot};
      setLista(prev=>[p,...prev]);
      setPres(p);
    }
    setAreasSel([]); setCostosAreas({}); setCapexPM([]); setOpexPM([]);
    setStep(2);
  }

  function cargarPlantilla(key){
    const pl=PLANTILLAS[key];
    if(!pl)return;
    setCapexPM(pl.capex.map(p=>initPartida(p)));
    setOpexPM(pl.opex.map(p=>initPartida(p)));
    setPlantillaCargada(key);
    setPlantillaModal(false);
  }

  function confirmarAreas(){
    const costos={};
    areasSeleccionadas.forEach(id=>{
      costos[id]=costosAreas[id]||{capex:[],materiales:[],nomina:[],viaticos:[],estado:"pendiente",comentario:""};
    });
    setCostosAreas(costos);
    setStep(3);
    setAreaActiva(areasSeleccionadas[0]||null);
  }

  function updatePartida(areaId,cat,id,updated){
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],[cat]:prev[areaId][cat].map(p=>p.id===id?updated:p)}}));
  }
  function addPartida(areaId,cat){
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],[cat]:[...(prev[areaId][cat]||[]),initPartida()]}}));
  }
  function removePartida(areaId,cat,id){
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],[cat]:prev[areaId][cat].filter(p=>p.id!==id)}}));
  }
  function addNomina(areaId){
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],nomina:[...(prev[areaId].nomina||[]),initNomina()]}}));
  }
  function guardarArea(areaId){
    setCostosAreas(prev=>({...prev,[areaId]:{...prev[areaId],estado:"capturado"}}));
  }

  // ── BOTÓN ────────────────────────────────────────────────────────────────────
  const btn=(label,onClick,variant="primary",disabled=false)=>(
    <button onClick={onClick} disabled={disabled} style={{
      padding:"9px 20px",borderRadius:8,border:"none",cursor:disabled?"not-allowed":"pointer",
      fontWeight:700,fontSize:13,
      background:disabled?C.grayBorder:variant==="primary"?C.yellow:variant==="success"?C.success:variant==="danger"?C.danger:C.grayLight,
      color:disabled?C.grayMid:variant==="primary"?C.grayDark:variant==="success"||variant==="danger"?C.white:C.grayDark,
    }}>{label}</button>
  );

  // ── LAYOUT WRAPPER ────────────────────────────────────────────────────────────
  const STEPS_NAV=[
    {label:"Presupuestos"},
    {label:"Info general"},
    {label:"Áreas"},
    {label:"Capturar costos"},
    {label:"Resumen mensual"},
  ];

  const wrap=(children,breadcrumb="")=>(
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"Inter,system-ui,sans-serif",background:C.contentBg}}>
      {/* Sidebar */}
      <div style={{width:220,background:C.sidebar,flexShrink:0,display:"flex",flexDirection:"column",
        position:"fixed",top:0,left:0,bottom:0,zIndex:50}}>
        <div style={{padding:"20px 20px 16px",borderBottom:"1px solid #2a2a2a"}}>
          <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Corporativo</div>
          <div style={{fontSize:22,fontWeight:800,color:C.yellow,letterSpacing:-0.5}}>GEOLIS</div>
          <div style={{fontSize:11,color:"#666",marginTop:2}}>Módulo de Presupuestos</div>
        </div>
        <nav style={{padding:"12px 0",flex:1}}>
          {STEPS_NAV.map(t=>(
            <div key={t.i} onClick={()=>t.i===0?setStep(0):t.i<=step?setStep(t.i):null}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 20px",
                cursor:t.i===0||t.i<=step?"pointer":"default",
                background:step===t.i?"#222":"transparent",
                borderLeft:step===t.i?`3px solid ${C.yellow}`:"3px solid transparent"}}>
              <span style={{fontSize:14}}>{t.icon}</span>
              <span style={{fontSize:13,fontWeight:step===t.i?700:400,
                color:step===t.i?C.yellow:step>t.i?"#aaa":"#555"}}>{t.label}</span>
              {step>t.i&&t.i>0&&<span style={{marginLeft:"auto",color:C.success,fontSize:12}}>✓</span>}
            </div>
          ))}
        </nav>
        {presupuesto&&step>0&&(
          <div style={{padding:"12px 16px",borderTop:"1px solid #2a2a2a",fontSize:11}}>
            <div style={{color:"#555",marginBottom:4}}>Presupuesto activo</div>
            <div style={{color:C.yellow,fontWeight:700,wordBreak:"break-word",fontSize:12}}>{presupuesto.nombre}</div>
            <div style={{color:"#555",fontSize:10,marginTop:2,textTransform:"capitalize"}}>{presupuesto.tipo}</div>
          </div>
        )}
      </div>
      {/* Main */}
      <div style={{flex:1,marginLeft:220,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        <div style={{background:C.white,borderBottom:`1px solid ${C.grayBorder}`,padding:"12px 32px",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          position:"sticky",top:0,zIndex:40,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.grayMid}}>
            <span style={{cursor:"pointer",color:C.yellowDark}} onClick={()=>setStep(0)}>Inicio</span>
            {breadcrumb&&<><span>/</span><span style={{color:C.grayDark,fontWeight:600}}>{breadcrumb}</span></>}
          </div>
          <span style={{fontSize:12,color:C.grayMid}}>{form.empresa||presupuesto?.empresa||"GEOLIS SA DE CV"}</span>
        </div>
        <div style={{padding:"28px 32px",flex:1}}>{children}</div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 0 — LISTA
  // ══════════════════════════════════════════════════════════════════════════
  if(step===0) return wrap(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{margin:0,fontSize:22,fontWeight:800,color:C.grayDark}}>Presupuestos</h2>
        {btn("+ Nuevo presupuesto",abrirNuevo)}
      </div>
      <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1fr",gap:8,padding:"10px 20px",
          background:"#FAFAFA",borderBottom:`1px solid ${C.grayBorder}`}}>
          {["Proyecto","Tipo","Estado","Acciones"].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:700,color:C.grayMid,textTransform:"uppercase",letterSpacing:0.5}}>{h}</div>
          ))}
        </div>
        {lista.map((p,i)=>(
          <div key={p.id} style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 1fr 1fr",gap:8,alignItems:"center",
            padding:"14px 20px",background:i%2===0?C.white:C.grayLight,
            borderBottom:i<lista.length-1?`1px solid ${C.grayBorder}`:"none"}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:C.grayDark}}>{p.nombre}</div>
              <div style={{fontSize:11,color:C.grayMid,marginTop:2}}>{p.fecha}</div>
            </div>
            <div style={{fontSize:13,color:C.grayMid,textTransform:"capitalize"}}>{p.tipo}</div>
            <EstadoBadge estado={p.estado}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setPres(p);setStep(3);}}
                style={{padding:"6px 14px",background:C.yellowLight,border:`1px solid ${C.yellowBorder}`,
                  borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,color:C.yellowDark}}>
                Abrir →
              </button>
              {(p.estado==="Borrador"||p.estado==="En revisión")&&(
                <button onClick={()=>abrirEdicion(p)}
                  style={{padding:"6px 14px",background:C.white,border:`1px solid ${C.grayBorder}`,
                    borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600,color:C.grayMid}}>
                  Editar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  ,"Presupuestos");

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — INFO GENERAL + PLANTILLA
  // ══════════════════════════════════════════════════════════════════════════
  if(step===1){
    const sugeridas = plantillasSugeridas(form.tipo);
    return wrap(
      <div style={{maxWidth:720}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:C.grayDark}}>
            {modoEdicion?"Editar presupuesto":"Nuevo presupuesto"}
          </h2>
          {modoEdicion&&presupuesto&&<EstadoBadge estado={presupuesto.estado}/>}
        </div>

        {/* Datos generales */}
        <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{background:C.grayDark,padding:"12px 20px"}}>
            <span style={{fontWeight:700,fontSize:14,color:C.white}}>Datos generales</span>
          </div>
          <div style={{padding:24}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <label style={{fontSize:13,fontWeight:600,color:C.grayDark,display:"block",marginBottom:6}}>Nombre del proyecto *</label>
                <input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:600,color:C.grayDark,display:"block",marginBottom:6}}>Empresa</label>
                <input value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:600,color:C.grayDark,display:"block",marginBottom:6}}>Fecha inicio</label>
                <input type="date" value={form.fechaInicio} onChange={e=>setForm({...form,fechaInicio:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:13,fontWeight:600,color:C.grayDark,display:"block",marginBottom:6}}>Fecha fin</label>
                <input type="date" value={form.fechaFin} onChange={e=>setForm({...form,fechaFin:e.target.value})}
                  style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.grayBorder}`,borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
              </div>
              <div style={{gridColumn:"1 / -1"}}>
                <label style={{fontSize:13,fontWeight:600,color:C.grayDark,display:"block",marginBottom:10}}>Tipo de presupuesto *</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {id:"instalacion", label:"Instalación", desc:"Proyectos de campo con mano de obra e ingresos"},
                    {id:"servicio",    label:"Servicio",     desc:"Contrato de servicio recurrente"},
                    {id:"departamento",label:"Departamento",   desc:"Presupuesto interno de área"},
                    {id:"suministro",  label:"Suministro",     desc:"Compra o entrega de materiales"},
                  ].map(t=>(
                    <div key={t.id} onClick={()=>{setForm({...form,tipo:t.id});setAreasSel([]);setPlantillaCargada(null);setCapexPM([]);setOpexPM([]);}}
                      style={{border:"2px solid",borderColor:form.tipo===t.id?C.yellow:C.grayBorder,
                        borderRadius:10,padding:"14px 12px",cursor:"pointer",textAlign:"center",
                        background:form.tipo===t.id?C.yellowLight:C.white,transition:"border-color 0.15s"}}>
                      <div style={{fontSize:26,marginBottom:6}}>{t.icon}</div>
                      <div style={{fontWeight:700,fontSize:13,color:C.grayDark}}>{t.label}</div>
                      <div style={{fontSize:10,color:C.grayMid,marginTop:4,lineHeight:1.3}}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plantilla — solo si hay sugeridas para el tipo */}
        {form.tipo&&(
          <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
            <div style={{background:C.yellowLight,padding:"12px 20px",borderBottom:`1px solid ${C.yellowBorder}`,
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:C.yellowDark}}>📋 Plantilla de partidas</div>
                <div style={{fontSize:12,color:C.grayMid,marginTop:2}}>
                  {sugeridas.length>0?"Carga una estructura base para este tipo de presupuesto.":"No hay plantillas definidas para este tipo todavía — próxima versión."}
                </div>
              </div>
              {sugeridas.length>0&&(
                <button onClick={()=>setPlantillaModal(true)}
                  style={{padding:"8px 16px",background:C.yellow,border:"none",borderRadius:8,
                    cursor:"pointer",fontWeight:700,fontSize:13,color:C.grayDark}}>
                  {plantillaCargada?"Cambiar plantilla":"Seleccionar plantilla"}
                </button>
              )}
            </div>
            {plantillaCargada&&(
              <div style={{padding:"10px 20px",fontSize:13,color:C.success,display:"flex",alignItems:"center",gap:8}}>
                <span>✓</span>
                <span>Plantilla "<strong>{PLANTILLAS[plantillaCargada]?.nombre}</strong>" cargada — {capexPM.length} CAPEX + {opexPM.length} OPEX partidas precargadas. Puedes editarlas en Capturar costos.</span>
              </div>
            )}
            {!plantillaCargada&&sugeridas.length>0&&(
              <div style={{padding:"10px 20px",fontSize:12,color:C.grayMid}}>
                Sin plantilla — las áreas iniciarán vacías.
              </div>
            )}
          </div>
        )}

        <div style={{display:"flex",justifyContent:"space-between"}}>
          {btn("← Cancelar",()=>setStep(0),"secondary")}
          {btn(modoEdicion?"Guardar cambios →":"Continuar → Áreas",guardarPresupuesto,"primary",!form.nombre||!form.tipo)}
        </div>

        {/* Modal plantillas */}
        {plantillaModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:C.white,borderRadius:12,padding:32,maxWidth:580,width:"90%",boxShadow:"0 12px 40px rgba(0,0,0,0.25)"}}>
              <h3 style={{margin:"0 0 6px",fontSize:18,color:C.grayDark}}>Selecciona una plantilla base</h3>
              <p style={{margin:"0 0 24px",fontSize:13,color:C.grayMid}}>Partidas precargadas para el tipo <strong>{form.tipo}</strong>. Editables después de cargar.</p>
              <div style={{display:"grid",gap:12}}>
                {sugeridas.map(pl=>(
                  <div key={pl.key} onClick={()=>cargarPlantilla(pl.key)}
                    style={{border:`2px solid`,borderColor:plantillaCargada===pl.key?C.yellow:C.grayBorder,
                      borderRadius:10,padding:18,cursor:"pointer",
                      background:plantillaCargada===pl.key?C.yellowLight:C.white,transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.yellow}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=plantillaCargada===pl.key?C.yellow:C.grayBorder}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,color:C.grayDark}}>{pl.icon} {pl.nombre}</div>
                        <div style={{fontSize:12,color:C.grayMid,marginTop:4}}>{pl.desc}</div>
                        <div style={{fontSize:11,color:C.yellowDark,marginTop:6,fontWeight:600}}>
                          {pl.capex.length} partidas CAPEX · {pl.opex.length} partidas OPEX
                        </div>
                      </div>
                      <span style={{fontSize:22,color:C.yellow}}>→</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
                <button onClick={()=>setPlantillaModal(false)}
                  style={{padding:"9px 20px",background:C.grayLight,border:"none",borderRadius:8,cursor:"pointer",fontSize:13,color:C.grayDark}}>
                  Continuar sin plantilla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ,modoEdicion?"Editar presupuesto":"Nuevo presupuesto");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — ÁREAS
  // ══════════════════════════════════════════════════════════════════════════
  if(step===2){
    const cats=getAreasCatalogo(presupuesto?.tipo||form?.tipo);
    return wrap(
      <div style={{maxWidth:740}}>
        <div style={{marginBottom:24}}>
          <h2 style={{margin:"0 0 6px",fontSize:20,fontWeight:800,color:C.grayDark}}>Áreas participantes</h2>
          <p style={{margin:0,color:C.grayMid,fontSize:14}}>
            Selecciona las áreas que capturarán costos · <strong style={{textTransform:"capitalize"}}>{presupuesto?.tipo}</strong>
          </p>
        </div>
        <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,padding:24,marginBottom:20,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {cats.map(a=>{
              const sel=areasSeleccionadas.includes(a.id);
              return(
                <div key={a.id} onClick={()=>setAreasSel(prev=>sel?prev.filter(x=>x!==a.id):[...prev,a.id])}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"13px 16px",
                    border:"2px solid",borderColor:sel?C.yellow:C.grayBorder,
                    borderRadius:10,cursor:"pointer",background:sel?C.yellowLight:C.white,
                    transition:"border-color 0.15s"}}>
                  <span style={{fontSize:20}}>{a.icon}</span>
                  <span style={{fontWeight:600,fontSize:13,color:C.grayDark}}>{a.label}</span>
                  {sel&&<span style={{marginLeft:"auto",color:C.yellowDark,fontWeight:800,fontSize:16}}>✓</span>}
                </div>
              );
            })}
          </div>
          {areasSeleccionadas.length>0&&(
            <div style={{marginTop:16,padding:"10px 14px",background:C.yellowLight,
              border:`1px solid ${C.yellowBorder}`,borderRadius:8,fontSize:13,color:C.yellowDark}}>
              {areasSeleccionadas.length} área(s) seleccionada(s): {areasSeleccionadas.map(id=>cats.find(a=>a.id===id)?.label).join(", ")}
            </div>
          )}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {btn("← Volver",()=>setStep(1),"secondary")}
          {btn("Confirmar áreas →",confirmarAreas,"primary",areasSeleccionadas.length===0)}
        </div>
      </div>
    ,"Áreas");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — CAPTURA
  // ══════════════════════════════════════════════════════════════════════════
  if(step===3){
    const cats=getAreasCatalogo(presupuesto?.tipo||"instalacion");
    const costos=areaActiva?costosAreas[areaActiva]:null;
    const area=cats.find(a=>a.id===areaActiva);
    const capexA=areaActiva?totalCat(areaActiva,"capex"):0;
    const nomMens=areaActiva?totalNominaArea(areaActiva):0;
    const opexA=areaActiva?totalCat(areaActiva,"materiales")+(nomMens*12)+totalCat(areaActiva,"viaticos"):0;

    return wrap(
      <div>
        <div style={{display:"grid",gridTemplateColumns:"230px 1fr",gap:20}}>

          {/* Panel lateral áreas */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.grayMid,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>
              Áreas del proyecto
            </div>
            <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              {areasSeleccionadas.map((id,i)=>{
                const a=cats.find(x=>x.id===id);
                const est=costosAreas[id]?.estado||"pendiente";
                const isActive=areaActiva===id;
                return(
                  <div key={id} onClick={()=>setAreaActiva(id)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
                      cursor:"pointer",background:isActive?"#FFFBF0":"transparent",
                      borderLeft:isActive?`3px solid ${C.yellow}`:"3px solid transparent",
                      borderBottom:i<areasSeleccionadas.length-1?`1px solid ${C.grayBorder}`:"none"}}>
                    <span style={{fontSize:18}}>{a?.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:isActive?700:500,color:C.grayDark}}>{a?.label}</div>
                      <div style={{fontSize:10,color:est==="capturado"?C.success:C.grayMid,marginTop:1}}>
                        {est==="capturado"?"✓ Guardado":"Pendiente"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{marginTop:16,background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:11,fontWeight:700,color:C.grayMid,textTransform:"uppercase",letterSpacing:0.5,marginBottom:12}}>Totales</div>
              {[
                {label:"CAPEX",val:totalCAPEX,color:C.yellowDark},
                {label:"OPEX", val:totalOPEX, color:C.grayDark},
              ].map(r=>(
                <div key={r.label} style={{marginBottom:10}}>
                  <div style={{fontSize:10,color:C.grayMid}}>{r.label}</div>
                  <div style={{fontSize:15,fontWeight:800,color:r.color}}>{fmt(r.val)}</div>
                </div>
              ))}
              <div style={{paddingTop:10,borderTop:`1px solid ${C.grayBorder}`}}>
                <div style={{fontSize:10,color:C.grayMid}}>Total egresos</div>
                <div style={{fontSize:16,fontWeight:800,color:C.grayDark}}>{fmt(totalEgresos)}</div>
              </div>
            </div>
          </div>

          {/* Panel principal captura */}
          <div>
            {!areaActiva?(
              <div style={{padding:48,textAlign:"center",color:C.grayMid,background:C.white,
                borderRadius:10,border:`1px solid ${C.grayBorder}`}}>
                <div style={{fontSize:32,marginBottom:12}}>←</div>
                Selecciona un área del panel izquierdo para comenzar la captura.
              </div>
            ):(
              <div>
                {/* Header área */}
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <span style={{fontSize:24}}>{area?.icon}</span>
                  <h3 style={{margin:0,fontSize:18,fontWeight:800,color:C.grayDark}}>{area?.label}</h3>
                  <Badge label={costos?.estado==="capturado"?"✓ Guardado":"En captura"}
                    color={costos?.estado==="capturado"?C.success:C.yellowDark}
                    bg={costos?.estado==="capturado"?C.successLight:C.yellowLight}/>
                </div>

                {/* KPIs área */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                  {[
                    {label:"CAPEX del área",val:capexA,  color:C.yellowDark,bg:C.yellowLight,sub:"Equipos e inversiones"},
                    {label:"OPEX del área", val:opexA,   color:C.grayDark,  bg:C.grayLight,  sub:"Nómina + Materiales + Viáticos"},
                    {label:"Total área",    val:capexA+opexA,color:C.grayDark,bg:C.grayLight,sub:"CAPEX + OPEX"},
                  ].map(k=>(
                    <div key={k.label} style={{background:k.bg,border:`1px solid ${k.color}22`,borderRadius:8,padding:14}}>
                      <div style={{fontSize:10,fontWeight:700,color:k.color,textTransform:"uppercase"}}>{k.label}</div>
                      <div style={{fontSize:17,fontWeight:800,color:k.color,marginTop:5}}>{fmt(k.val)}</div>
                      <div style={{fontSize:10,color:C.grayMid,marginTop:2}}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Cabecera columnas */}
                <div style={{display:"grid",gridTemplateColumns:"2fr 2fr 80px 1fr 1fr 80px 28px",gap:6,marginBottom:6,padding:"0 2px"}}>
                  {["Categoría","Descripción","Unidad","Cant.","Monto unit.","Total",""].map((h,i)=>(
                    <div key={i} style={{fontSize:10,fontWeight:700,color:C.grayMid,textTransform:"uppercase"}}>{h}</div>
                  ))}
                </div>

                {/* CAPEX */}
                <div style={{border:"1px solid #e9d5ff",borderRadius:10,overflow:"hidden",marginBottom:14}}>
                  <div style={{background:"#7c3aed",padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:700,fontSize:14,color:"#fff"}}>CAPEX · Equipos e inversiones</span>
                    <span style={{fontWeight:800,fontSize:14,color:"#fff"}}>{fmt(capexA)}</span>
                  </div>
                  <div style={{padding:14,background:C.white}}>
                    {(costos?.capex||[]).map(p=>(
                      <PartidaRow key={p.id} p={p}
                        onUpdate={u=>updatePartida(areaActiva,"capex",p.id,u)}
                        onRemove={()=>removePartida(areaActiva,"capex",p.id)}/>
                    ))}
                    <button onClick={()=>addPartida(areaActiva,"capex")}
                      style={{width:"100%",padding:"8px",border:"2px dashed #ddd6fe",borderRadius:6,
                        background:"transparent",cursor:"pointer",color:"#7c3aed",fontSize:12,marginTop:4}}>
                      + Agregar equipo / inversión (CAPEX)
                    </button>
                  </div>
                </div>

                {/* OPEX Nómina */}
                <div style={{border:"1px solid #bbf7d0",borderRadius:10,overflow:"hidden",marginBottom:14}}>
                  <div style={{background:"#059669",padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:700,fontSize:14,color:"#fff"}}>OPEX · Nómina y Mano de Obra</span>
                    <span style={{fontWeight:800,fontSize:14,color:"#fff"}}>{fmt(nomMens)}/mes</span>
                  </div>
                  <div style={{padding:14,background:C.white}}>
                    {(costos?.nomina||[]).length>0&&(
                      <div style={{display:"grid",gridTemplateColumns:"2fr 50px 1fr 80px 80px 1fr 28px",gap:6,marginBottom:8}}>
                        {["Puesto","Cant.","Salario/mes","IMSS+PT","Prestac.","Costo real/mes",""].map((h,i)=>(
                          <div key={i} style={{fontSize:10,fontWeight:700,color:C.grayMid,textTransform:"uppercase"}}>{h}</div>
                        ))}
                      </div>
                    )}
                    {(costos?.nomina||[]).map(p=>(
                      <NominaRow key={p.id} p={p}
                        onUpdate={u=>updatePartida(areaActiva,"nomina",p.id,u)}
                        onRemove={()=>removePartida(areaActiva,"nomina",p.id)}/>
                    ))}
                    <button onClick={()=>addNomina(areaActiva)}
                      style={{width:"100%",padding:"8px",border:"2px dashed #bbf7d0",borderRadius:6,
                        background:"transparent",cursor:"pointer",color:"#059669",fontSize:12,marginTop:4}}>
                      + Agregar puesto (Nómina)
                    </button>
                  </div>
                </div>

                {/* OPEX Materiales y Viáticos */}
                {[
                  {cat:"materiales",label:"OPEX · Materiales",    bg:"#0891b2",border:"#bae6fd",btnColor:"#0891b2"},
                  {cat:"viaticos",  label:"OPEX · Viáticos",      bg:"#d97706",border:"#fde68a",btnColor:"#d97706"},
                ].map(({cat,label,bg,border,btnColor})=>(
                  <div key={cat} style={{border:`1px solid ${border}`,borderRadius:10,overflow:"hidden",marginBottom:14}}>
                    <div style={{background:bg,padding:"11px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#fff"}}>{label}</span>
                      <span style={{fontWeight:800,fontSize:14,color:"#fff"}}>{fmt(totalCat(areaActiva,cat))}</span>
                    </div>
                    <div style={{padding:14,background:C.white}}>
                      {(costos?.[cat]||[]).map(p=>(
                        <PartidaRow key={p.id} p={p}
                          onUpdate={u=>updatePartida(areaActiva,cat,p.id,u)}
                          onRemove={()=>removePartida(areaActiva,cat,p.id)}/>
                      ))}
                      <button onClick={()=>addPartida(areaActiva,cat)}
                        style={{width:"100%",padding:"8px",border:`2px dashed ${border}`,borderRadius:6,
                          background:"transparent",cursor:"pointer",color:btnColor,fontSize:12,marginTop:4}}>
                        + Agregar {cat==="materiales"?"material":"viático"} (OPEX)
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                  {btn("✓ Guardar área",()=>guardarArea(areaActiva),"success")}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",marginTop:24,paddingTop:20,borderTop:`1px solid ${C.grayBorder}`}}>
          {btn("Ver Resumen Mensual →",()=>setStep(4),"primary")}
        </div>
      </div>
    ,"Capturar costos");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4 — RESUMEN MENSUAL + PDF
  // ══════════════════════════════════════════════════════════════════════════
  if(step===4){
    const cats=getAreasCatalogo(presupuesto?.tipo||"instalacion");
    const mesesCAPEX=MESES.map((_,i)=>{
      const desdeAreas=areasSeleccionadas.reduce((s,id)=>s+(distribuirMeses(totalCat(id,"capex"),"capex")[i]||0),0);
      const desdePM   =capexPM.reduce((s,p)=>s+(distribuirMeses((p.cantidad||0)*(p.monto||0),"capex")[i]||0),0);
      return desdeAreas+desdePM;
    });
    const mesesOPEX=MESES.map((_,i)=>{
      const mat=areasSeleccionadas.reduce((s,id)=>s+(distribuirMeses(totalCat(id,"materiales"),"opex")[i]||0),0);
      const via=areasSeleccionadas.reduce((s,id)=>s+(distribuirMeses(totalCat(id,"viaticos"),"opex")[i]||0),0);
      const nom=areasSeleccionadas.reduce((s,id)=>s+totalNominaArea(id),0);
      const pm =opexPM.reduce((s,p)=>s+(distribuirMeses((p.cantidad||0)*(p.monto||0),"opex")[i]||0),0);
      return mat+via+nom+pm;
    });
    const seriesCats=[
      {label:"CAPEX",color:C.yellowDark,data:mesesCAPEX},
      {label:"OPEX", color:C.grayMid,   data:mesesOPEX},
    ].filter(s=>s.data.some(v=>v>0));
    const barrasAreas=areasSeleccionadas.map((id,idx)=>({
      label:cats.find(a=>a.id===id)?.label||id,
      value:totalCat(id,"capex")+(totalCat(id,"materiales")+totalNominaArea(id)*12+totalCat(id,"viaticos")),
      color:idx%2===0?C.yellow:C.grayMid,
    })).filter(b=>b.value>0);
    const totalesMes=MESES.map((_,i)=>mesesCAPEX[i]+mesesOPEX[i]);
    const card=(children,mb=20)=>(
      <div style={{background:C.white,border:`1px solid ${C.grayBorder}`,borderRadius:10,padding:24,
        marginBottom:mb,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        {children}
      </div>
    );
    const sTitle=t=>(
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <div style={{width:4,height:20,background:C.yellow,borderRadius:2}}/>
        <h3 style={{margin:0,fontSize:16,fontWeight:800,color:C.grayDark}}>{t}</h3>
      </div>
    );
    return wrap(
      <div>
        <style>{`@media print{body *{visibility:hidden}#rpdf,#rpdf *{visibility:visible}#rpdf{position:absolute;left:0;top:0;width:100%}.noprint{display:none!important}}`}</style>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:800,color:C.grayDark}}>Resumen mensual</h2>
            <div style={{fontSize:13,color:C.grayMid}}>{presupuesto?.nombre} · {presupuesto?.empresa}</div>
          </div>
          <div style={{display:"flex",gap:10}} className="noprint">
            {btn("← Captura",()=>setStep(3),"secondary")}
            {btn("⬇ Exportar PDF",()=>window.print(),"primary")}
          </div>
        </div>
        <div id="rpdf">
          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
            {[
              {label:"CAPEX total",  val:totalCAPEX,  color:C.yellowDark,bg:C.yellowLight},
              {label:"OPEX total",   val:totalOPEX,   color:C.grayDark,  bg:C.grayLight},
              {label:"Total egresos",val:totalEgresos, color:C.danger,    bg:C.dangerLight},
              {label:"Nómina anual", val:areasSeleccionadas.reduce((s,id)=>s+totalNominaArea(id)*12,0),
                color:C.success, bg:C.successLight},
            ].map(k=>(
              <div key={k.label} style={{background:k.bg,border:`1px solid ${k.color}33`,borderRadius:10,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
                <div style={{fontSize:11,fontWeight:700,color:k.color,textTransform:"uppercase",letterSpacing:0.5}}>{k.label}</div>
                <div style={{fontSize:20,fontWeight:800,color:k.color,marginTop:7}}>{fmt(k.val)}</div>
              </div>
            ))}
          </div>

          {seriesCats.length>0&&card(<>
            {sTitle("CAPEX y OPEX por mes")}
            <div style={{display:"flex",gap:20,marginBottom:14}}>
              {seriesCats.map(s=><div key={s.label} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:14,height:14,borderRadius:3,background:s.color}}/><span style={{fontSize:12,color:C.grayMid,fontWeight:600}}>{s.label}</span>
              </div>)}
            </div>
            <LineChart series={seriesCats} height={230}/>
          </>)}

          {barrasAreas.length>0&&card(<>
            {sTitle("Costo total por área")}
            <BarChart items={barrasAreas} height={200}/>
          </>)}

          {card(<>
            {sTitle("Tabla de egresos mensual")}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:C.grayDark,color:C.white}}>
                    <td style={{padding:"9px 14px",fontWeight:700,minWidth:120}}>Concepto</td>
                    {MESES.map(m=><td key={m} style={{padding:"7px 5px",textAlign:"right",fontWeight:600,minWidth:50}}>{m}</td>)}
                    <td style={{padding:"7px 14px",textAlign:"right",fontWeight:700}}>Total</td>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {label:"CAPEX",color:C.yellowDark,meses:mesesCAPEX,total:totalCAPEX,bg:"#FFFEF5"},
                    {label:"OPEX", color:C.grayMid,   meses:mesesOPEX, total:totalOPEX, bg:C.white},
                  ].map((f,fi)=>(
                    <tr key={f.label} style={{background:f.bg,borderBottom:`1px solid ${C.grayBorder}`}}>
                      <td style={{padding:"8px 14px",fontWeight:700,color:f.color,display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:10,height:10,borderRadius:2,background:f.color,flexShrink:0}}/>{f.label}
                      </td>
                      {f.meses.map((v,i)=>(
                        <td key={i} style={{padding:"7px 5px",textAlign:"right",color:v>0?C.grayDark:C.grayBorder}}>
                          {v>0?(v>=1000?`$${(v/1000).toFixed(0)}K`:fmt(v)):"—"}
                        </td>
                      ))}
                      <td style={{padding:"7px 14px",textAlign:"right",fontWeight:700,color:f.color}}>{fmt(f.total)}</td>
                    </tr>
                  ))}
                  <tr style={{background:C.yellowLight,borderTop:`2px solid ${C.yellow}`}}>
                    <td style={{padding:"9px 14px",fontWeight:800,color:C.grayDark}}>TOTAL</td>
                    {totalesMes.map((v,i)=>(
                      <td key={i} style={{padding:"7px 5px",textAlign:"right",fontWeight:700,color:C.grayDark}}>
                        {v>0?(v>=1000?`$${(v/1000).toFixed(0)}K`:fmt(v)):"—"}
                      </td>
                    ))}
                    <td style={{padding:"7px 14px",textAlign:"right",fontWeight:800,color:C.yellowDark}}>{fmt(totalEgresos)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>)}

          {areasSeleccionadas.length>0&&card(<>
            {sTitle("Resumen por área")}
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#FAFAFA",borderBottom:`1px solid ${C.grayBorder}`}}>
                  <td style={{padding:"10px 14px",fontWeight:700,fontSize:11,color:C.grayMid,textTransform:"uppercase"}}>Área</td>
                  <td style={{padding:"10px 10px",fontWeight:700,fontSize:11,color:C.yellowDark,textAlign:"right",textTransform:"uppercase"}}>CAPEX</td>
                  <td style={{padding:"10px 10px",fontWeight:700,fontSize:11,color:C.grayMid,textAlign:"right",textTransform:"uppercase"}}>OPEX</td>
                  <td style={{padding:"10px 14px",fontWeight:700,fontSize:11,color:C.grayDark,textAlign:"right",textTransform:"uppercase"}}>Total</td>
                </tr>
              </thead>
              <tbody>
                {areasSeleccionadas.map((id,i)=>{
                  const a=cats.find(x=>x.id===id);
                  const cx=totalCat(id,"capex");
                  const ox=totalCat(id,"materiales")+totalNominaArea(id)*12+totalCat(id,"viaticos");
                  return(
                    <tr key={id} style={{background:i%2===0?C.white:C.grayLight,borderBottom:`1px solid ${C.grayBorder}`}}>
                      <td style={{padding:"10px 14px",fontWeight:600}}>{a?.icon} {a?.label}</td>
                      <td style={{padding:"10px 10px",textAlign:"right",color:C.yellowDark}}>{fmt(cx)}</td>
                      <td style={{padding:"10px 10px",textAlign:"right",color:C.grayMid}}>{fmt(ox)}</td>
                      <td style={{padding:"10px 14px",textAlign:"right",fontWeight:700}}>{fmt(cx+ox)}</td>
                    </tr>
                  );
                })}
                <tr style={{background:C.grayDark}}>
                  <td style={{padding:"11px 14px",fontWeight:700,color:C.white}}>TOTAL</td>
                  <td style={{padding:"11px 10px",textAlign:"right",fontWeight:700,color:C.yellow}}>{fmt(totalCAPEX)}</td>
                  <td style={{padding:"11px 10px",textAlign:"right",fontWeight:700,color:"#aaa"}}>{fmt(totalOPEX)}</td>
                  <td style={{padding:"11px 14px",textAlign:"right",fontWeight:800,color:C.white,fontSize:14}}>{fmt(totalEgresos)}</td>
                </tr>
              </tbody>
            </table>
          </>,0)}

          <div style={{textAlign:"center",fontSize:11,color:C.grayMid,paddingTop:20,marginTop:20,borderTop:`1px solid ${C.grayBorder}`}}>
            GEOLIS SA DE CV · {presupuesto?.nombre} · Generado el {new Date().toLocaleDateString("es-MX")}
          </div>
        </div>
      </div>
    ,"Resumen mensual");
  }

  return null;
}