import { useState, useRef, useEffect } from "react";

// ─── PALETA GEOLIS ────────────────────────────────────────────────────────────
const C = {
  yellow:      "#DDAC00",
  yellowLight: "#FFF8E1",
  yellowBorder:"#F0C800",
  yellowDark:  "#B08900",
  grayDark:    "#2C2C2C",
  grayMid:     "#6B6B6B",
  grayLight:   "#F5F5F5",
  grayBorder:  "#DEDEDE",
  white:       "#FFFFFF",
  // semánticos
  danger:      "#C0392B",
  dangerLight: "#FDECEA",
  success:     "#1E7E34",
  successLight:"#EAF7ED",
  info:        "#1A6FA8",
  infoLight:   "#E8F4FD",
};

// Colores para gráficas (líneas por categoría, igual que los Excels de Geolis)
const CHART_COLORS = {
  equipos:    "#DDAC00",
  materiales: "#6B6B6B",
  mano_obra:  "#2C2C2C",
  viaticos:   "#B08900",
  ingresos:   "#1E7E34",
  capex:      "#DDAC00",
  opex:       "#6B6B6B",
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TIPOS_PROYECTO = [
  { id: "instalacion", label: "Instalación", icon: "🏗️", desc: "Proyecto de instalación o construcción con ingresos por facturación" },
  { id: "servicio",    label: "Servicio",    icon: "⚙️", desc: "Contrato de servicio recurrente con facturación mensual" },
];

const AREAS_CATALOGO = [
  { id: "operaciones",    label: "Operaciones",    icon: "🔧" },
  { id: "ingenieria",     label: "Ingeniería",      icon: "📐" },
  { id: "sspa",           label: "SSPA",            icon: "🦺" },
  { id: "logistica",      label: "Logística",       icon: "🚛" },
  { id: "administracion", label: "Administración",  icon: "📋" },
  { id: "ti",             label: "Tecnología (TI)", icon: "💻" },
  { id: "compras",        label: "Compras",         icon: "🛒" },
];

const CATS_AREA = {
  materiales: { label: "Materiales",   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  mano_obra:  { label: "Mano de Obra", color: "#0891b2", bg: "#f0f9ff", border: "#bae6fd" },
  equipos:    { label: "Equipos",      color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  viaticos:   { label: "Viáticos",     color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
};

const CAPEX_CATS = [
  "EQUIPO DE TRANSPORTE","MAQUINARIA Y EQUIPO","EQUIPO DE MOBILIARIO",
  "EQUIPO DE COMPUTO","OTROS ACTIVOS","SOFTWARE Y LICENCIAS",
  "GABINETE Y ENERGÍA","TRANSMISIÓN","CENTRO DE MONITOREO",
];
const OPEX_CATS = [
  "NÓMINA Y ADICIONALES","ARRENDA DE INMUEBLES Y SERV","ARTÍCULOS DE SEGURIDAD",
  "INSUMOS OPERATIVOS","INSUMOS DE OFICINA","MATERIALES","MATERIALES DE SALUD",
  "SERV TELEFONÍA CELULAR Y RADIO","SERVICIOS","SERVICIOS DE CAPACITACIÓN",
  "VEHÍCULOS Y COMBUSTIBLE","VIÁTICOS","MARKETING","EQUIPOS Y ENSERES",
  "RENTA DE MAQUINARIA Y EQUIPO","HERRAMIENTAS","SEGUROS","FLETES NACIONALES",
  "AGUA Y ALCANTARILLADO","ENERGÍA ELÉCTRICA","TELEFONÍA FIJA",
];

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const UNIDADES = ["Unidad","Día","Semana","Mes","Año","Servicio","Viaje","Pieza","Kg","Metro","Litro","Hora"];

const ESTADOS = {
  BORRADOR:    { label: "Borrador",     color: C.grayMid,  bg: C.grayLight  },
  EN_CAPTURA:  { label: "En captura",   color: C.yellowDark, bg: C.yellowLight },
  EN_REVISION: { label: "En revisión",  color: C.info,     bg: C.infoLight  },
  CONSOLIDADO: { label: "Consolidado",  color: C.success,  bg: C.successLight},
};

let _id = 100;
const uid = () => ++_id;

const fmt = (n) => isNaN(n) || n == null ? "$0.00"
  : "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function initPartida(o = {}) {
  return { id: uid(), desc: "", unidad: "Unidad", cantidad: 1, monto: 0, ...o };
}
function initPartidaLibre(o = {}) {
  return { id: uid(), cat: "", desc: "", unidad: "Mes", cantidad: 1, monto: 0, distribucion: "uniforme", meses: Array(12).fill(0), ...o };
}

// Distribución mensual uniforme (CAPEX cae en M0, OPEX ÷ 12)
function distribuirMeses(total, tipo = "opex") {
  if (tipo === "capex") {
    const m = Array(12).fill(0);
    m[0] = total;
    return m;
  }
  const v = parseFloat((total / 12).toFixed(2));
  return Array(12).fill(v);
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Badge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.BORRADOR;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: e.bg, color: e.color, border: `1px solid ${e.color}44` }}>
      {e.label}
    </span>
  );
}

function StepBar({ current }) {
  const steps = ["Info general","Áreas","Captura","Revisión PM","Consolidar"];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: `2px solid ${C.grayBorder}` }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          padding: "10px 18px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
          color: current === i ? C.yellowDark : current > i ? C.success : C.grayMid,
          borderBottom: current === i ? `2px solid ${C.yellow}` : "2px solid transparent",
          marginBottom: -2,
        }}>
          {current > i ? "✓ " : ""}{s}
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, subtitle, color, children, total }) {
  const bg = color || C.grayDark;
  return (
    <div style={{ border: `1px solid ${C.grayBorder}`, borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ background: bg, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.white }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{subtitle}</div>}
        </div>
        {total !== undefined && <div style={{ fontSize: 18, fontWeight: 800, color: C.white }}>{fmt(total)}</div>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function PartidaRow({ p, onUpdate, onRemove, catLabel }) {
  const total = (p.cantidad || 0) * (p.monto || 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 90px auto", gap: 8, alignItems: "center", marginBottom: 6 }}>
      <input value={p.desc} onChange={e => onUpdate({ ...p, desc: e.target.value })}
        placeholder={`Descripción${catLabel ? " — " + catLabel : ""}`}
        style={{ padding: "7px 10px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 13 }} />
      <select value={p.unidad} onChange={e => onUpdate({ ...p, unidad: e.target.value })}
        style={{ padding: "7px 8px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 12 }}>
        {UNIDADES.map(u => <option key={u}>{u}</option>)}
      </select>
      <input type="number" min="0" step="1" value={p.cantidad}
        onChange={e => onUpdate({ ...p, cantidad: parseFloat(e.target.value) || 0 })}
        style={{ padding: "7px 8px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 13, textAlign: "right" }} />
      <input type="number" min="0" step="0.01" value={p.monto}
        onChange={e => onUpdate({ ...p, monto: parseFloat(e.target.value) || 0 })}
        style={{ padding: "7px 8px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 13, textAlign: "right" }} />
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: C.yellowDark }}>{fmt(total)}</span>
      <button onClick={onRemove} style={{ background: C.dangerLight, color: C.danger, border: "none",
        borderRadius: 5, padding: "5px 9px", cursor: "pointer", fontSize: 13 }}>✕</button>
    </div>
  );
}

function PartidaLibreRow({ p, onUpdate, onRemove, cats }) {
  const total = (p.cantidad || 0) * (p.monto || 0);
  function handle(field, val) {
    const updated = { ...p, [field]: val };
    if (field === "cantidad" || field === "monto") {
      updated.meses = distribuirMeses((updated.cantidad || 0) * (updated.monto || 0),
        cats === CAPEX_CATS ? "capex" : "opex");
    }
    onUpdate(updated);
  }
  return (
    <div style={{ background: C.grayLight, border: `1px solid ${C.grayBorder}`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
        <select value={p.cat} onChange={e => handle("cat", e.target.value)}
          style={{ padding: "7px 8px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 12 }}>
          <option value="">— Categoría —</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={p.desc} onChange={e => handle("desc", e.target.value)}
          placeholder="Descripción" style={{ padding: "7px 10px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 13 }} />
        <select value={p.unidad} onChange={e => handle("unidad", e.target.value)}
          style={{ padding: "7px 8px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 12 }}>
          {UNIDADES.map(u => <option key={u}>{u}</option>)}
        </select>
        <input type="number" min="0" step="1" value={p.cantidad} onChange={e => handle("cantidad", parseFloat(e.target.value) || 0)}
          style={{ padding: "7px 8px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 13, textAlign: "right" }} />
        <input type="number" min="0" step="0.01" value={p.monto} onChange={e => handle("monto", parseFloat(e.target.value) || 0)}
          style={{ padding: "7px 8px", border: `1px solid ${C.grayBorder}`, borderRadius: 6, fontSize: 13, textAlign: "right" }} />
        <button onClick={onRemove} style={{ background: C.dangerLight, color: C.danger, border: "none",
          borderRadius: 5, padding: "5px 9px", cursor: "pointer", fontSize: 13 }}>✕</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: C.grayMid }}>
        <span>Total: <strong style={{ color: C.yellowDark }}>{fmt(total)}</strong></span>
        <span>Distribución: {cats === CAPEX_CATS ? "M0 (inversión única)" : "Uniforme ÷12 meses"}</span>
      </div>
    </div>
  );
}

// ─── CHART COMPONENTS ─────────────────────────────────────────────────────────

// Gráfica de líneas SVG pura — mes a mes por categoría
function LineChart({ series, height = 220 }) {
  if (!series || series.length === 0) return null;
  const W = 660, H = height, padL = 70, padR = 20, padT = 20, padB = 40;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const allVals = series.flatMap(s => s.data);
  const maxVal = Math.max(...allVals, 1);
  const minVal = 0;

  function xPos(i) { return padL + (i / 11) * cW; }
  function yPos(v) { return padT + cH - ((v - minVal) / (maxVal - minVal)) * cH; }

  const gridLines = 4;
  const step = maxVal / gridLines;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Grid lines */}
      {Array.from({ length: gridLines + 1 }, (_, i) => {
        const v = i * step;
        const y = yPos(v);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={C.grayBorder} strokeWidth="0.8" strokeDasharray="4 4" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill={C.grayMid}>
              {v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v.toFixed(0)}`}
            </text>
          </g>
        );
      })}
      {/* X axis labels */}
      {MESES.map((m, i) => (
        <text key={m} x={xPos(i)} y={H - 8} textAnchor="middle" fontSize="10" fill={C.grayMid}>{m}</text>
      ))}
      {/* Lines */}
      {series.map(s => {
        const pts = s.data.map((v, i) => `${xPos(i)},${yPos(v)}`).join(" ");
        return (
          <g key={s.label}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {s.data.map((v, i) => v > 0 && (
              <circle key={i} cx={xPos(i)} cy={yPos(v)} r="3.5" fill={s.color} stroke={C.white} strokeWidth="1.5" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// Gráfica de barras agrupadas SVG
function BarChart({ items, height = 200 }) {
  if (!items || items.length === 0) return null;
  const W = 660, H = height, padL = 70, padR = 20, padT = 20, padB = 50;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const maxVal = Math.max(...items.map(i => i.value), 1);
  const barW = Math.min(60, (cW / items.length) - 16);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = padT + cH * (1 - p);
        const v = maxVal * p;
        return (
          <g key={p}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={C.grayBorder} strokeWidth="0.8" strokeDasharray="4 4" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill={C.grayMid}>
              {v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v.toFixed(0)}`}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {items.map((item, i) => {
        const x = padL + (i / items.length) * cW + (cW / items.length - barW) / 2;
        const barH = (item.value / maxVal) * cH;
        const y = padT + cH - barH;
        return (
          <g key={item.label}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill={item.color} opacity="0.9" />
            <text x={x + barW / 2} y={H - padB + 14} textAnchor="middle" fontSize="10" fill={C.grayMid}>{item.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill={item.color} fontWeight="600">
              {item.value >= 1000000 ? `${(item.value/1000000).toFixed(1)}M` : item.value >= 1000 ? `${(item.value/1000).toFixed(0)}K` : item.value.toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Leyenda de gráfica
function ChartLegend({ items }) {
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
      {items.map(item => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color }} />
          <span style={{ fontSize: 12, color: C.grayMid }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Tabla mensual con totales
function TablaMensual({ filas, showTotal = true }) {
  const totalesMes = MESES.map((_, i) => filas.reduce((s, f) => s + (f.meses[i] || 0), 0));
  const totalGeneral = totalesMes.reduce((s, v) => s + v, 0);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: C.grayDark, color: C.white }}>
            <td style={{ padding: "8px 12px", fontWeight: 700, minWidth: 160 }}>Concepto</td>
            {MESES.map(m => <td key={m} style={{ padding: "6px 4px", textAlign: "right", fontWeight: 600, minWidth: 60 }}>{m}</td>)}
            <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 700 }}>Total</td>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => {
            const total = f.meses.reduce((s, v) => s + v, 0);
            return (
              <tr key={f.label} style={{ background: i % 2 === 0 ? C.white : C.grayLight, borderBottom: `1px solid ${C.grayBorder}` }}>
                <td style={{ padding: "7px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: f.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, color: C.grayDark }}>{f.label}</span>
                </td>
                {f.meses.map((v, mi) => (
                  <td key={mi} style={{ padding: "6px 4px", textAlign: "right", color: v > 0 ? C.grayDark : C.grayMid }}>
                    {v > 0 ? (v >= 1000 ? `$${(v/1000).toFixed(1)}K` : fmt(v)) : "—"}
                  </td>
                ))}
                <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 700, color: f.color }}>{fmt(total)}</td>
              </tr>
            );
          })}
          {showTotal && (
            <tr style={{ background: C.yellowLight, borderTop: `2px solid ${C.yellow}` }}>
              <td style={{ padding: "8px 12px", fontWeight: 800, color: C.grayDark }}>TOTAL</td>
              {totalesMes.map((v, i) => (
                <td key={i} style={{ padding: "6px 4px", textAlign: "right", fontWeight: 700, color: C.grayDark }}>
                  {v > 0 ? (v >= 1000 ? `$${(v/1000).toFixed(1)}K` : fmt(v)) : "—"}
                </td>
              ))}
              <td style={{ padding: "6px 12px", textAlign: "right", fontWeight: 800, color: C.yellowDark }}>{fmt(totalGeneral)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [vista, setVista]           = useState("lista");
  const [step, setStep]             = useState(0);
  const [presupuesto, setPresupuesto] = useState(null);
  const [areasSeleccionadas, setAreasSel] = useState([]);
  const [costosAreas, setCostosAreas]     = useState({});
  const [areaActiva, setAreaActiva]       = useState(null);
  const [capexPM, setCapexPM]             = useState([]);
  const [opexPM,  setOpexPM]              = useState([]);
  const [ingresos, setIngresos]           = useState({ totalAnual: 0, distribucion: "uniforme", facturacion: Array(12).fill(0) });
  const [listaBorradores] = useState([
    { id: 1, nombre: "Monitoreo Cuervito", cliente: "PEMEX", tipo: "servicio",    estado: "CONSOLIDADO", fecha: "2026-02-01" },
    { id: 2, nombre: "BEH Jujo F218358",   cliente: "PEMEX", tipo: "instalacion", estado: "EN_REVISION",  fecha: "2026-01-15" },
  ]);
  const [nuevoForm, setNuevoForm] = useState({ cliente:"", nombre:"", tipo:"", fechaInicio:"", fechaFin:"", moneda:"MXN" });

  // ── Helpers de totales ────────────────────────────────────────────────────
  function totalCat(areaId, cat) {
    return (costosAreas[areaId]?.[cat] || []).reduce((s, p) => s + (p.cantidad||0)*(p.monto||0), 0);
  }
  function totalArea(areaId) {
    return Object.keys(CATS_AREA).reduce((s, cat) => s + totalCat(areaId, cat), 0);
  }

  // Meses distribuidos por categoría (uniforme para OPEX, M0 para CAPEX)
  function mesesCat(areaId, cat) {
    const total = totalCat(areaId, cat);
    return distribuirMeses(total, cat === "equipos" ? "capex" : "opex");
  }

  const capexDesdeAreas  = areasSeleccionadas.reduce((s, id) => s + totalCat(id,"equipos"), 0);
  const opexDesdeAreas   = areasSeleccionadas.reduce((s, id) =>
    s + totalCat(id,"materiales") + totalCat(id,"mano_obra") + totalCat(id,"viaticos"), 0);
  const capexPMTotal     = capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const opexPMTotal      = opexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  const totalCAPEX       = capexDesdeAreas + capexPMTotal;
  const totalOPEX        = opexDesdeAreas  + opexPMTotal;
  const totalEgresos     = totalCAPEX + totalOPEX;
  const totalIngresos    = ingresos.facturacion.reduce((s,v)=>s+v,0);
  const utilidad         = totalIngresos - totalEgresos;
  const margen           = totalIngresos > 0 ? (utilidad/totalIngresos*100) : 0;

  const todasCapturadas  = areasSeleccionadas.length > 0 &&
    areasSeleccionadas.every(id => ["capturado","revisado"].includes(costosAreas[id]?.estado));

  // ── CU-001 ────────────────────────────────────────────────────────────────
  function crearPresupuesto() {
    setPresupuesto({ id: uid(), ...nuevoForm, estado: "BORRADOR", fecha: new Date().toISOString().slice(0,10) });
    setAreasSel([]); setCostosAreas({}); setCapexPM([]); setOpexPM([]);
    setIngresos({ totalAnual:0, distribucion:"uniforme", facturacion: Array(12).fill(0) });
    setVista("crear"); setStep(1);
  }

  // ── CU-002 ────────────────────────────────────────────────────────────────
  function confirmarAreas() {
    const costos = {};
    areasSeleccionadas.forEach(id => {
      costos[id] = { materiales:[], mano_obra:[], equipos:[], viaticos:[], estado:"pendiente", comentario:"" };
    });
    setCostosAreas(costos);
    setPresupuesto(p => ({ ...p, estado: "EN_CAPTURA" }));
    setVista("pm_revision");
  }

  // ── CU-003 ────────────────────────────────────────────────────────────────
  function updatePartidaArea(areaId, cat, id, updated) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], [cat]: prev[areaId][cat].map(p => p.id===id ? updated : p) } }));
  }
  function addPartidaArea(areaId, cat) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], [cat]: [...prev[areaId][cat], initPartida()] } }));
  }
  function removePartidaArea(areaId, cat, id) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], [cat]: prev[areaId][cat].filter(p => p.id!==id) } }));
  }
  function marcarAreaCapturada(areaId) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], estado:"capturado" } }));
    setVista("pm_revision");
  }

  // ── CU-004 ────────────────────────────────────────────────────────────────
  function solicitarCorreccion(areaId, comentario) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], estado:"correccion", comentario } }));
  }
  function aprobarArea(areaId) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], estado:"revisado" } }));
  }

  // ── CU-005 ────────────────────────────────────────────────────────────────
  function consolidar() {
    setPresupuesto(p => ({ ...p, estado:"CONSOLIDADO" }));
    setVista("consolidado");
  }

  const btn = (label, onClick, variant="primary", disabled=false) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 22px", borderRadius: 8, border: "none",
      cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14,
      background: disabled ? C.grayBorder
        : variant==="primary" ? C.yellow
        : variant==="success" ? C.success
        : variant==="danger"  ? C.danger
        : C.grayLight,
      color: disabled ? C.grayMid
        : variant==="primary" ? C.grayDark
        : variant==="success" || variant==="danger" ? C.white
        : C.grayDark,
    }}>{label}</button>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LISTA
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "lista") return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.grayDark, letterSpacing: -0.5 }}>
            <span style={{ color: C.yellow }}>GEOLIS</span> · Módulo de Presupuestos
          </div>
          <div style={{ fontSize: 13, color: C.grayMid, marginTop: 2 }}>Project Manager — Vista principal</div>
        </div>
        {btn("+ Nuevo presupuesto", () => { setVista("nuevo"); setNuevoForm({ cliente:"", nombre:"", tipo:"", fechaInicio:"", fechaFin:"", moneda:"MXN" }); })}
      </div>
      <div style={{ border: `1px solid ${C.grayBorder}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: C.grayLight, padding: "10px 16px", borderBottom: `1px solid ${C.grayBorder}`, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8 }}>
          {["Proyecto","Cliente","Tipo","Estado","Acciones"].map(h =>
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: C.grayMid, textTransform: "uppercase" }}>{h}</div>
          )}
        </div>
        {listaBorradores.map((p, i) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "12px 16px", borderBottom: i < listaBorradores.length-1 ? `1px solid ${C.grayLight}` : "none", background: i%2===0 ? C.white : C.grayLight }}>
            <div><div style={{ fontWeight: 600, fontSize: 14, color: C.grayDark }}>{p.nombre}</div><div style={{ fontSize: 12, color: C.grayMid }}>{p.fecha}</div></div>
            <div style={{ fontSize: 13 }}>{p.cliente}</div>
            <div style={{ fontSize: 13, textTransform: "capitalize" }}>{p.tipo}</div>
            <Badge estado={p.estado} />
            <button onClick={() => alert("En producción: abriría el presupuesto " + p.id)}
              style={{ padding: "6px 14px", background: C.yellowLight, border: `1px solid ${C.yellowBorder}`, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: C.yellowDark }}>Ver →</button>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CU-001 NUEVO
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "nuevo") return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setVista("lista")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.grayMid }}>←</button>
        <div><h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.grayDark }}>Nuevo presupuesto</h2><div style={{ fontSize: 13, color: C.grayMid }}>CU-001</div></div>
      </div>
      <SectionCard title="Datos del proyecto" color={C.grayDark}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Cliente","cliente"],["Nombre del proyecto","nombre"]].map(([label, key]) => (
            <div key={key}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.grayDark, display: "block", marginBottom: 5 }}>{label} *</label>
              <input value={nuevoForm[key]} onChange={e => setNuevoForm({ ...nuevoForm, [key]: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.grayBorder}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.grayDark, display: "block", marginBottom: 8 }}>Tipo de proyecto *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {TIPOS_PROYECTO.map(t => (
                <div key={t.id} onClick={() => setNuevoForm({ ...nuevoForm, tipo: t.id })} style={{
                  border: `2px solid`, borderColor: nuevoForm.tipo===t.id ? C.yellow : C.grayBorder,
                  borderRadius: 10, padding: 16, cursor: "pointer",
                  background: nuevoForm.tipo===t.id ? C.yellowLight : C.white,
                }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.grayDark }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: C.grayMid, marginTop: 4 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.grayDark, display: "block", marginBottom: 5 }}>Fecha inicio</label>
            <input type="date" value={nuevoForm.fechaInicio} onChange={e => setNuevoForm({ ...nuevoForm, fechaInicio: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.grayBorder}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.grayDark, display: "block", marginBottom: 5 }}>Fecha fin</label>
            <input type="date" value={nuevoForm.fechaFin} onChange={e => setNuevoForm({ ...nuevoForm, fechaFin: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.grayBorder}`, borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.grayDark, display: "block", marginBottom: 5 }}>Moneda</label>
            <select value={nuevoForm.moneda} onChange={e => setNuevoForm({ ...nuevoForm, moneda: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.grayBorder}`, borderRadius: 8, fontSize: 14 }}>
              <option>MXN</option><option>USD</option>
            </select>
          </div>
        </div>
      </SectionCard>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {btn("Cancelar", () => setVista("lista"), "secondary")}
        {btn("Guardar como Borrador →", crearPresupuesto, "primary", !nuevoForm.cliente || !nuevoForm.nombre || !nuevoForm.tipo)}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CU-002 ÁREAS
  // ══════════════════════════════════════════════════════════════════════════
  if (vista==="crear" && step===1) return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <StepBar current={1} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.grayDark }}>Áreas participantes</h2>
        <Badge estado={presupuesto?.estado} />
      </div>
      <p style={{ color: C.grayMid, fontSize: 14, marginBottom: 20 }}><strong>{presupuesto?.nombre}</strong> · {presupuesto?.cliente} · CU-002</p>
      <SectionCard title="Selecciona las áreas que capturarán costos" color={C.grayDark}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {AREAS_CATALOGO.map(a => {
            const sel = areasSeleccionadas.includes(a.id);
            return (
              <div key={a.id} onClick={() => setAreasSel(prev => sel ? prev.filter(x=>x!==a.id) : [...prev,a.id])} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                border: `2px solid`, borderColor: sel ? C.yellow : C.grayBorder,
                borderRadius: 10, cursor: "pointer", background: sel ? C.yellowLight : C.white,
              }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.grayDark }}>{a.label}</span>
                {sel && <span style={{ marginLeft: "auto", color: C.yellowDark, fontWeight: 800 }}>✓</span>}
              </div>
            );
          })}
        </div>
        {areasSeleccionadas.length > 0 && (
          <div style={{ marginTop: 14, padding: 10, background: C.yellowLight, borderRadius: 8, fontSize: 13, color: C.yellowDark, border: `1px solid ${C.yellowBorder}` }}>
            {areasSeleccionadas.length} área(s) seleccionada(s): {areasSeleccionadas.map(id => AREAS_CATALOGO.find(a=>a.id===id)?.label).join(", ")}
          </div>
        )}
      </SectionCard>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {btn("← Volver", () => setVista("nuevo"), "secondary")}
        {btn("Confirmar áreas →", confirmarAreas, "primary", areasSeleccionadas.length===0)}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CU-003 CAPTURA POR ÁREA — igual que antes, sin cambios funcionales
  // ══════════════════════════════════════════════════════════════════════════
  if (vista==="area_captura" && areaActiva) {
    const area   = AREAS_CATALOGO.find(a => a.id===areaActiva);
    const costos = costosAreas[areaActiva];
    const capexA = totalCat(areaActiva,"equipos");
    const opexA  = totalCat(areaActiva,"materiales") + totalCat(areaActiva,"mano_obra") + totalCat(areaActiva,"viaticos");
    const totalA = capexA + opexA;

    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
        <StepBar current={2} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <button onClick={() => setVista("pm_revision")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.grayMid }}>←</button>
          <span style={{ fontSize: 22 }}>{area?.icon}</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.grayDark }}>Área: {area?.label}</h2>
          <Badge estado={presupuesto?.estado} />
        </div>
        <p style={{ color: C.grayMid, fontSize: 13, marginBottom: 16, marginLeft: 42 }}>{presupuesto?.nombre} · CU-003: Solo ves tu sección.</p>

        {costos?.comentario && (
          <div style={{ background: C.yellowLight, border: `1px solid ${C.yellowBorder}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: C.yellowDark }}>
            ⚠️ <strong>Corrección solicitada por PM:</strong> {costos.comentario}
          </div>
        )}

        {/* KPIs CAPEX/OPEX/Total — igual que screenshot */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ background: C.yellowLight, border: `1px solid ${C.yellowBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.yellowDark, textTransform: "uppercase" }}>CAPEX del área</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.yellowDark, marginTop: 6 }}>{fmt(capexA)}</div>
            <div style={{ fontSize: 11, color: C.grayMid, marginTop: 2 }}>Equipos (inversión única)</div>
          </div>
          <div style={{ background: C.grayLight, border: `1px solid ${C.grayBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.grayMid, textTransform: "uppercase" }}>OPEX del área</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.grayDark, marginTop: 6 }}>{fmt(opexA)}</div>
            <div style={{ fontSize: 11, color: C.grayMid, marginTop: 2 }}>Mat. + Mano de obra + Viáticos</div>
          </div>
          <div style={{ background: C.grayLight, border: `1px solid ${C.grayBorder}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.grayMid, textTransform: "uppercase" }}>Total área</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.grayDark, marginTop: 6 }}>{fmt(totalA)}</div>
            <div style={{ fontSize: 11, color: C.grayMid, marginTop: 2 }}>CAPEX + OPEX</div>
          </div>
        </div>

        {/* Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 90px auto", gap: 8, marginBottom: 4 }}>
          {["Descripción","Unidad","Cantidad","Monto unit.","Total",""].map((h,i) =>
            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: C.grayMid, textTransform: "uppercase" }}>{h}</div>
          )}
        </div>

        {/* CAPEX */}
        <SectionCard title="CAPEX · Equipos" subtitle="Inversiones únicas: maquinaria, herramientas, vehículos asignados" color="#7c3aed" total={capexA}>
          {(costos?.equipos||[]).map(p => (
            <PartidaRow key={p.id} p={p} catLabel="Equipo"
              onUpdate={u => updatePartidaArea(areaActiva,"equipos",p.id,u)}
              onRemove={() => removePartidaArea(areaActiva,"equipos",p.id)} />
          ))}
          <button onClick={() => addPartidaArea(areaActiva,"equipos")} style={{ width:"100%",padding:"8px",border:"2px dashed #ddd6fe",borderRadius:6,background:"transparent",cursor:"pointer",color:"#7c3aed",fontSize:13,marginTop:4 }}>+ Agregar equipo (CAPEX)</button>
        </SectionCard>

        {/* OPEX */}
        {["materiales","mano_obra","viaticos"].map(catKey => {
          const catDef = CATS_AREA[catKey];
          return (
            <SectionCard key={catKey} title={`OPEX · ${catDef.label}`} subtitle={`Gasto recurrente — ${catDef.label}`} color={catDef.color} total={totalCat(areaActiva,catKey)}>
              {(costos?.[catKey]||[]).map(p => (
                <PartidaRow key={p.id} p={p} catLabel={catDef.label}
                  onUpdate={u => updatePartidaArea(areaActiva,catKey,p.id,u)}
                  onRemove={() => removePartidaArea(areaActiva,catKey,p.id)} />
              ))}
              <button onClick={() => addPartidaArea(areaActiva,catKey)} style={{ width:"100%",padding:"8px",border:`2px dashed ${catDef.border}`,borderRadius:6,background:"transparent",cursor:"pointer",color:catDef.color,fontSize:13,marginTop:4 }}>+ Agregar {catDef.label} (OPEX)</button>
            </SectionCard>
          );
        })}

        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
          {btn("Guardar borrador", () => setVista("pm_revision"), "secondary")}
          {btn("✓ Marcar como capturado", () => marcarAreaCapturada(areaActiva), "success")}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CU-004 REVISIÓN PM
  // ══════════════════════════════════════════════════════════════════════════
  if (vista==="pm_revision") return (
    <PMRevision
      presupuesto={presupuesto}
      areasSeleccionadas={areasSeleccionadas}
      costosAreas={costosAreas}
      totalArea={totalArea} totalCat={totalCat}
      totalCAPEX={totalCAPEX} totalOPEX={totalOPEX}
      totalEgresos={totalEgresos} totalIngresos={totalIngresos}
      utilidad={utilidad} margen={margen}
      capexPM={capexPM} setCapexPM={setCapexPM}
      opexPM={opexPM} setOpexPM={setOpexPM}
      ingresos={ingresos} setIngresos={setIngresos}
      todasCapturadas={todasCapturadas}
      onAbrirArea={id => { setAreaActiva(id); setVista("area_captura"); }}
      onSolicitarCorreccion={solicitarCorreccion}
      onAprobarArea={aprobarArea}
      onConsolidar={consolidar}
      btn={btn}
      mesesCat={mesesCat}
    />
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CU-005 CONSOLIDADO
  // ══════════════════════════════════════════════════════════════════════════
  if (vista==="consolidado") return (
    <Consolidado
      presupuesto={presupuesto}
      areasSeleccionadas={areasSeleccionadas}
      costosAreas={costosAreas}
      capexPM={capexPM} opexPM={opexPM}
      ingresos={ingresos}
      totalArea={totalArea} totalCat={totalCat}
      totalCAPEX={totalCAPEX} totalOPEX={totalOPEX}
      totalEgresos={totalEgresos} totalIngresos={totalIngresos}
      utilidad={utilidad} margen={margen}
      mesesCat={mesesCat}
      btn={btn}
      onVolver={() => setVista("pm_revision")}
      onNuevo={() => setVista("lista")}
    />
  );

  return null;
}

// ─── PM REVISION ──────────────────────────────────────────────────────────────
function PMRevision({ presupuesto, areasSeleccionadas, costosAreas, totalArea, totalCat,
  totalCAPEX, totalOPEX, totalEgresos, totalIngresos, utilidad, margen,
  capexPM, setCapexPM, opexPM, setOpexPM, ingresos, setIngresos,
  todasCapturadas, onAbrirArea, onSolicitarCorreccion, onAprobarArea, onConsolidar, btn, mesesCat }) {

  const [comentarios, setComentarios] = useState({});
  const [mostrarForm, setMostrarForm] = useState({});
  const [tabActiva, setTabActiva]     = useState("areas");

  const estadoLabel = { pendiente:"Pendiente", capturado:"Listo para revisar", revisado:"Aprobado", correccion:"Corrección solicitada" };
  const estadoColor = { pendiente:C.grayMid, capturado:C.yellowDark, revisado:C.success, correccion:C.danger };

  const tabStyle = (t) => ({
    padding: "10px 20px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
    borderBottom: tabActiva===t ? `3px solid ${C.yellow}` : "3px solid transparent",
    background: "none", color: tabActiva===t ? C.yellowDark : C.grayMid,
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <StepBar current={3} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.grayDark }}>Revisión de costos</h2>
            <Badge estado={presupuesto?.estado} />
          </div>
          <div style={{ fontSize: 13, color: C.grayMid, marginTop: 4 }}>CU-004 · {presupuesto?.nombre} · {presupuesto?.cliente}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.yellowDark }}>{fmt(totalEgresos)}</div>
          <div style={{ fontSize: 12, color: C.grayMid }}>Total egresos</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label:"CAPEX total",   val:totalCAPEX,   sub:"Equipos + activos",       color:C.yellowDark, bg:C.yellowLight, border:C.yellowBorder },
          { label:"OPEX total",    val:totalOPEX,    sub:"Mat. + nómina + viáticos", color:C.grayDark,  bg:C.grayLight,  border:C.grayBorder   },
          { label:"Ingresos",      val:totalIngresos,sub:"Facturación anual",        color:C.success,   bg:C.successLight,border:C.success+"44" },
          { label:`Utilidad ${margen.toFixed(1)}%`, val:utilidad, sub:"Ingresos − egresos",
            color: utilidad>=0?C.success:C.danger, bg: utilidad>=0?C.successLight:C.dangerLight, border:(utilidad>=0?C.success:C.danger)+"44" },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.border}`, borderRadius:10, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:k.color, textTransform:"uppercase" }}>{k.label}</div>
            <div style={{ fontSize:18, fontWeight:800, color:k.color, marginTop:6 }}>{fmt(k.val)}</div>
            <div style={{ fontSize:11, color:C.grayMid, marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.grayBorder}`, marginBottom:20 }}>
        <button style={tabStyle("areas")} onClick={() => setTabActiva("areas")}>📋 Costos por área</button>
        <button style={tabStyle("capex_opex")} onClick={() => setTabActiva("capex_opex")}>📊 CAPEX / OPEX</button>
        <button style={tabStyle("ingresos")} onClick={() => setTabActiva("ingresos")}>💰 Ingresos</button>
      </div>

      {/* TAB ÁREAS */}
      {tabActiva==="areas" && areasSeleccionadas.map(id => {
        const area   = AREAS_CATALOGO.find(a => a.id===id);
        const costos = costosAreas[id];
        const est    = costos?.estado || "pendiente";
        const capexA = totalCat(id,"equipos");
        const opexA  = totalCat(id,"materiales")+totalCat(id,"mano_obra")+totalCat(id,"viaticos");
        return (
          <div key={id} style={{ border:`1px solid ${C.grayBorder}`, borderRadius:10, marginBottom:14, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:C.grayLight, borderBottom:`1px solid ${C.grayBorder}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>{area?.icon}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:C.grayDark }}>{area?.label}</div>
                  <div style={{ fontSize:12, color:estadoColor[est] }}>
                    {est==="pendiente"?"⏳":est==="capturado"?"📋":est==="revisado"?"✅":"⚠️"} {estadoLabel[est]}
                    {costos?.comentario && <span> · "{costos.comentario}"</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:16, fontWeight:700, color:C.yellowDark }}>{fmt(totalArea(id))}</span>
                <button onClick={() => onAbrirArea(id)} style={{ padding:"6px 12px", background:C.yellowLight, border:`1px solid ${C.yellowBorder}`, borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600, color:C.yellowDark }}>Editar</button>
              </div>
            </div>
            {est !== "pendiente" && (
              <div style={{ padding:"10px 16px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                <div style={{ background:C.yellowLight, border:`1px solid ${C.yellowBorder}`, borderRadius:8, padding:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.yellowDark }}>CAPEX</div>
                  <div style={{ fontSize:15, fontWeight:700, marginTop:4, color:C.yellowDark }}>{fmt(capexA)}</div>
                </div>
                {["materiales","mano_obra","viaticos"].map(cat => (
                  <div key={cat} style={{ background:CATS_AREA[cat].bg, border:`1px solid ${CATS_AREA[cat].border}`, borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:CATS_AREA[cat].color }}>OPEX · {CATS_AREA[cat].label}</div>
                    <div style={{ fontSize:15, fontWeight:700, marginTop:4 }}>{fmt(totalCat(id,cat))}</div>
                  </div>
                ))}
              </div>
            )}
            {est==="capturado" && (
              <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.grayLight}`, display:"flex", gap:10, alignItems:"center" }}>
                {mostrarForm[id] ? (
                  <>
                    <input value={comentarios[id]||""} onChange={e => setComentarios({...comentarios,[id]:e.target.value})}
                      placeholder="Describe la corrección..." style={{ flex:1, padding:"7px 10px", border:`1px solid ${C.yellowBorder}`, borderRadius:6, fontSize:13 }} />
                    <button onClick={() => { onSolicitarCorreccion(id,comentarios[id]||"Favor de revisar"); setMostrarForm({...mostrarForm,[id]:false}); }}
                      style={{ padding:"7px 14px", background:C.yellowLight, color:C.yellowDark, border:`1px solid ${C.yellowBorder}`, borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:13 }}>Enviar</button>
                    <button onClick={() => setMostrarForm({...mostrarForm,[id]:false})}
                      style={{ padding:"7px 12px", background:C.grayLight, border:"none", borderRadius:6, cursor:"pointer", fontSize:13 }}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setMostrarForm({...mostrarForm,[id]:true})} style={{ padding:"7px 14px", background:C.yellowLight, color:C.yellowDark, border:`1px solid ${C.yellowBorder}`, borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:13 }}>⚠ Solicitar corrección</button>
                    <button onClick={() => onAprobarArea(id)} style={{ padding:"7px 14px", background:C.successLight, color:C.success, border:`1px solid ${C.success}44`, borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:13 }}>✓ Aprobar área</button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* TAB CAPEX/OPEX */}
      {tabActiva==="capex_opex" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:C.yellowDark, margin:0 }}>CAPEX · Inversiones</h3>
              <span style={{ fontSize:16, fontWeight:800, color:C.yellowDark }}>{fmt(totalCAPEX)}</span>
            </div>
            <div style={{ background:C.yellowLight, border:`1px solid ${C.yellowBorder}`, borderRadius:8, padding:12, marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.yellowDark, marginBottom:8 }}>DESDE ÁREAS (Equipos)</div>
              {areasSeleccionadas.map(id => {
                const v = totalCat(id,"equipos"); if(v===0) return null;
                const area = AREAS_CATALOGO.find(a=>a.id===id);
                return <div key={id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}><span>{area?.icon} {area?.label}</span><span style={{ fontWeight:600 }}>{fmt(v)}</span></div>;
              })}
              {areasSeleccionadas.every(id=>totalCat(id,"equipos")===0) && <div style={{ fontSize:13, color:C.grayMid }}>Sin equipos capturados aún</div>}
            </div>
            <SectionCard title="CAPEX adicional (PM)" color={C.yellowDark}>
              {capexPM.map(p => (
                <PartidaLibreRow key={p.id} p={p} cats={CAPEX_CATS}
                  onUpdate={u => setCapexPM(capexPM.map(x=>x.id===p.id?u:x))}
                  onRemove={() => setCapexPM(capexPM.filter(x=>x.id!==p.id))} />
              ))}
              <button onClick={() => setCapexPM([...capexPM, initPartidaLibre({ cat:CAPEX_CATS[0] })])} style={{ width:"100%",padding:"8px",border:`2px dashed ${C.yellowBorder}`,borderRadius:6,background:"transparent",cursor:"pointer",color:C.yellowDark,fontSize:13 }}>+ Agregar CAPEX</button>
            </SectionCard>
          </div>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:C.grayDark, margin:0 }}>OPEX · Recurrentes</h3>
              <span style={{ fontSize:16, fontWeight:800, color:C.grayDark }}>{fmt(totalOPEX)}</span>
            </div>
            <div style={{ background:C.grayLight, border:`1px solid ${C.grayBorder}`, borderRadius:8, padding:12, marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.grayMid, marginBottom:8 }}>DESDE ÁREAS (Mat. + M.O. + Viáticos)</div>
              {areasSeleccionadas.map(id => {
                const v = totalCat(id,"materiales")+totalCat(id,"mano_obra")+totalCat(id,"viaticos"); if(v===0) return null;
                const area = AREAS_CATALOGO.find(a=>a.id===id);
                return <div key={id} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}><span>{area?.icon} {area?.label}</span><span style={{ fontWeight:600 }}>{fmt(v)}</span></div>;
              })}
              {areasSeleccionadas.every(id=>(totalCat(id,"materiales")+totalCat(id,"mano_obra")+totalCat(id,"viaticos"))===0) && <div style={{ fontSize:13, color:C.grayMid }}>Sin OPEX capturado aún</div>}
            </div>
            <SectionCard title="OPEX adicional (PM)" color={C.grayDark}>
              {opexPM.map(p => (
                <PartidaLibreRow key={p.id} p={p} cats={OPEX_CATS}
                  onUpdate={u => setOpexPM(opexPM.map(x=>x.id===p.id?u:x))}
                  onRemove={() => setOpexPM(opexPM.filter(x=>x.id!==p.id))} />
              ))}
              <button onClick={() => setOpexPM([...opexPM, initPartidaLibre({ cat:OPEX_CATS[0] })])} style={{ width:"100%",padding:"8px",border:`2px dashed ${C.grayBorder}`,borderRadius:6,background:"transparent",cursor:"pointer",color:C.grayMid,fontSize:13 }}>+ Agregar OPEX</button>
            </SectionCard>
          </div>
        </div>
      )}

      {/* TAB INGRESOS */}
      {tabActiva==="ingresos" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6, color:C.grayDark }}>Total anual a facturar</label>
              <input type="number" min="0" step="0.01" value={ingresos.totalAnual}
                onChange={e => {
                  const total = parseFloat(e.target.value)||0;
                  const fac = ingresos.distribucion==="uniforme" ? Array(12).fill(parseFloat((total/12).toFixed(2))) : ingresos.facturacion;
                  setIngresos({ ...ingresos, totalAnual:total, facturacion:fac });
                }}
                style={{ width:"100%", padding:"10px 12px", border:`2px solid ${C.yellow}`, borderRadius:8, fontSize:16, fontWeight:600, boxSizing:"border-box" }} />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6, color:C.grayDark }}>Distribución mensual</label>
              <select value={ingresos.distribucion}
                onChange={e => {
                  const dist = e.target.value;
                  const fac = dist==="uniforme" ? Array(12).fill(parseFloat((ingresos.totalAnual/12).toFixed(2))) : ingresos.facturacion;
                  setIngresos({ ...ingresos, distribucion:dist, facturacion:fac });
                }}
                style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.grayBorder}`, borderRadius:8, fontSize:14 }}>
                <option value="uniforme">Uniforme (mismo monto cada mes)</option>
                <option value="manual">Personalizada por mes</option>
              </select>
            </div>
          </div>
          <TablaMensual filas={[{ label:"FACTURACIÓN", color:C.success, meses:ingresos.facturacion }]} showTotal={false} />
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:24, gap:10 }}>
        {btn("Consolidar presupuesto →", onConsolidar, "success", !todasCapturadas)}
      </div>
      {!todasCapturadas && <div style={{ textAlign:"right", fontSize:12, color:C.grayMid, marginTop:6 }}>Todas las áreas deben estar aprobadas para consolidar.</div>}
    </div>
  );
}

// ─── CONSOLIDADO CON GRÁFICAS ─────────────────────────────────────────────────
function Consolidado({ presupuesto, areasSeleccionadas, costosAreas, capexPM, opexPM,
  ingresos, totalArea, totalCat, totalCAPEX, totalOPEX, totalEgresos, totalIngresos,
  utilidad, margen, mesesCat, btn, onVolver, onNuevo }) {

  // Distribución mensual por categoría (uniforme automático — opción C)
  const seriesMeses = [
    {
      label: "Equipos (CAPEX)",
      color: CHART_COLORS.equipos,
      data: MESES.map((_, i) => areasSeleccionadas.reduce((s, id) => s + (mesesCat(id,"equipos")[i]||0), 0)
        + capexPM.reduce((s,p) => { const m=p.meses||[]; return s+(m[i]||0); }, 0)),
    },
    {
      label: "Materiales",
      color: CHART_COLORS.materiales,
      data: MESES.map((_, i) => areasSeleccionadas.reduce((s, id) => s + (mesesCat(id,"materiales")[i]||0), 0)
        + opexPM.filter(p=>p.cat&&p.cat.toLowerCase().includes("material")).reduce((s,p)=>{const m=p.meses||[];return s+(m[i]||0);},0)),
    },
    {
      label: "Mano de Obra",
      color: CHART_COLORS.mano_obra,
      data: MESES.map((_, i) => areasSeleccionadas.reduce((s, id) => s + (mesesCat(id,"mano_obra")[i]||0), 0)
        + opexPM.filter(p=>p.cat&&p.cat.toLowerCase().includes("nómina")).reduce((s,p)=>{const m=p.meses||[];return s+(m[i]||0);},0)),
    },
    {
      label: "Viáticos",
      color: CHART_COLORS.viaticos,
      data: MESES.map((_, i) => areasSeleccionadas.reduce((s, id) => s + (mesesCat(id,"viaticos")[i]||0), 0)
        + opexPM.filter(p=>p.cat&&p.cat.toLowerCase().includes("viático")).reduce((s,p)=>{const m=p.meses||[];return s+(m[i]||0);},0)),
    },
  ].filter(s => s.data.some(v => v > 0));

  // Serie ingresos
  const serieIngreso = { label:"Ingresos", color:CHART_COLORS.ingresos, data:ingresos.facturacion };

  // Totales mensuales CAPEX + OPEX
  const mesesCapex = MESES.map((_, i) =>
    areasSeleccionadas.reduce((s, id) => s + (mesesCat(id,"equipos")[i]||0), 0)
    + capexPM.reduce((s,p)=>{const m=p.meses||[];return s+(m[i]||0);},0)
  );
  const mesesOpex = MESES.map((_, i) =>
    areasSeleccionadas.reduce((s, id) =>
      s + (mesesCat(id,"materiales")[i]||0) + (mesesCat(id,"mano_obra")[i]||0) + (mesesCat(id,"viaticos")[i]||0), 0)
    + opexPM.reduce((s,p)=>{const m=p.meses||[];return s+(m[i]||0);},0)
  );

  // Barras por área
  const barrasAreas = areasSeleccionadas.map((id, idx) => ({
    label: AREAS_CATALOGO.find(a=>a.id===id)?.label || id,
    value: totalArea(id),
    color: idx % 2 === 0 ? C.yellow : C.grayMid,
  }));

  // Filas tabla mensual
  const filasTabla = [
    ...(totalIngresos > 0 ? [{ label:"Ingresos", color:C.success, meses:ingresos.facturacion }] : []),
    { label:"CAPEX (Equipos)", color:C.yellowDark, meses:mesesCapex },
    { label:"OPEX",            color:C.grayMid,    meses:mesesOpex },
  ];

  const cardStyle = { background:C.white, border:`1px solid ${C.grayBorder}`, borderRadius:10, padding:20, marginBottom:20 };
  const sectionTitle = (t) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
      <div style={{ width:4, height:20, background:C.yellow, borderRadius:2 }} />
      <h3 style={{ fontSize:16, fontWeight:800, color:C.grayDark, margin:0 }}>{t}</h3>
    </div>
  );

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:24, fontFamily:"Inter, system-ui, sans-serif" }}>
      <StepBar current={4} />

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <h2 style={{ fontSize:22, fontWeight:800, margin:0, color:C.grayDark }}>Presupuesto consolidado</h2>
            <Badge estado="CONSOLIDADO" />
          </div>
          <div style={{ fontSize:13, color:C.grayMid, marginTop:4 }}>
            CU-005 · {presupuesto?.nombre} · {presupuesto?.cliente} · {presupuesto?.tipo} · {presupuesto?.moneda}
          </div>
        </div>
        <button onClick={() => window.print()} style={{ padding:"10px 18px", background:C.yellow, color:C.grayDark, border:"none", borderRadius:8, cursor:"pointer", fontWeight:700 }}>
          ⬇ Exportar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Ingresos",      val:totalIngresos, color:C.success,   bg:C.successLight },
          { label:"CAPEX",         val:totalCAPEX,    color:C.yellowDark,bg:C.yellowLight  },
          { label:"OPEX",          val:totalOPEX,     color:C.grayDark,  bg:C.grayLight    },
          { label:"Total egresos", val:totalEgresos,  color:C.danger,    bg:C.dangerLight  },
          { label:`Utilidad ${margen.toFixed(1)}%`, val:utilidad,
            color:utilidad>=0?C.success:C.danger, bg:utilidad>=0?C.successLight:C.dangerLight },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, border:`1px solid ${k.color}33`, borderRadius:10, padding:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:k.color, textTransform:"uppercase" }}>{k.label}</div>
            <div style={{ fontSize:18, fontWeight:800, color:k.color, marginTop:6 }}>{fmt(k.val)}</div>
          </div>
        ))}
      </div>

      {/* GRÁFICA 1: Líneas por categoría mes a mes */}
      <div style={cardStyle}>
        {sectionTitle("Distribución mensual por categoría (M0–M12)")}
        <ChartLegend items={seriesMeses} />
        <LineChart series={seriesMeses} height={240} />
        <div style={{ fontSize:11, color:C.grayMid, marginTop:8, textAlign:"center" }}>
          CAPEX concentrado en M0 (instalación) · OPEX distribuido uniformemente en 12 meses
        </div>
      </div>

      {/* GRÁFICA 2: Ingresos vs Egresos mes a mes */}
      {totalIngresos > 0 && (
        <div style={cardStyle}>
          {sectionTitle("Ingresos vs Egresos — toma de decisión")}
          <ChartLegend items={[
            { label:"Ingresos",       color:CHART_COLORS.ingresos },
            { label:"CAPEX",          color:CHART_COLORS.capex    },
            { label:"OPEX",           color:CHART_COLORS.opex     },
          ]} />
          <LineChart series={[
            serieIngreso,
            { label:"CAPEX", color:CHART_COLORS.capex, data:mesesCapex },
            { label:"OPEX",  color:CHART_COLORS.opex,  data:mesesOpex  },
          ]} height={240} />
          <div style={{ fontSize:11, color:C.grayMid, marginTop:8, textAlign:"center" }}>
            Meses donde los egresos superan los ingresos requieren revisión
          </div>
        </div>
      )}

      {/* GRÁFICA 3: Barras por área */}
      {barrasAreas.length > 0 && (
        <div style={cardStyle}>
          {sectionTitle("Costo total por área")}
          <BarChart items={barrasAreas} height={200} />
          <div style={{ fontSize:11, color:C.grayMid, marginTop:8, textAlign:"center" }}>
            Áreas con mayor peso presupuestal — candidatas a ajuste
          </div>
        </div>
      )}

      {/* GRÁFICA 4: CAPEX vs OPEX donut simple */}
      {(totalCAPEX > 0 || totalOPEX > 0) && (
        <div style={cardStyle}>
          {sectionTitle("Composición CAPEX vs OPEX")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"center" }}>
            <div>
              {/* Donut SVG */}
              <svg width="100%" viewBox="0 0 200 200" style={{ maxWidth:200, margin:"0 auto", display:"block" }}>
                {(() => {
                  const total = totalCAPEX + totalOPEX;
                  if (total === 0) return null;
                  const capexPct = totalCAPEX / total;
                  const r = 70, cx = 100, cy = 100;
                  const circumference = 2 * Math.PI * r;
                  const capexDash = circumference * capexPct;
                  const opexDash  = circumference * (1 - capexPct);
                  return (
                    <>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.grayBorder} strokeWidth="28" />
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.yellow} strokeWidth="28"
                        strokeDasharray={`${capexDash} ${opexDash}`}
                        strokeDashoffset={circumference * 0.25}
                        strokeLinecap="butt" />
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.grayMid} strokeWidth="28"
                        strokeDasharray={`${opexDash} ${capexDash}`}
                        strokeDashoffset={circumference * 0.25 - capexDash}
                        strokeLinecap="butt" />
                      <text x={cx} y={cy-8} textAnchor="middle" fontSize="22" fontWeight="800" fill={C.grayDark}>{(capexPct*100).toFixed(0)}%</text>
                      <text x={cx} y={cy+14} textAnchor="middle" fontSize="11" fill={C.grayMid}>CAPEX</text>
                    </>
                  );
                })()}
              </svg>
            </div>
            <div>
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight:600, color:C.grayDark }}>
                    <div style={{ width:12, height:12, borderRadius:2, background:C.yellow }} /> CAPEX
                  </span>
                  <span style={{ fontWeight:800, color:C.yellowDark }}>{fmt(totalCAPEX)}</span>
                </div>
                <div style={{ height:6, background:C.grayBorder, borderRadius:3 }}>
                  <div style={{ height:6, background:C.yellow, borderRadius:3, width:`${totalEgresos>0?(totalCAPEX/totalEgresos*100):0}%` }} />
                </div>
                <div style={{ fontSize:11, color:C.grayMid, marginTop:2 }}>{totalEgresos>0?(totalCAPEX/totalEgresos*100).toFixed(1):0}% del total</div>
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:14, fontWeight:600, color:C.grayDark }}>
                    <div style={{ width:12, height:12, borderRadius:2, background:C.grayMid }} /> OPEX
                  </span>
                  <span style={{ fontWeight:800, color:C.grayDark }}>{fmt(totalOPEX)}</span>
                </div>
                <div style={{ height:6, background:C.grayBorder, borderRadius:3 }}>
                  <div style={{ height:6, background:C.grayMid, borderRadius:3, width:`${totalEgresos>0?(totalOPEX/totalEgresos*100):0}%` }} />
                </div>
                <div style={{ fontSize:11, color:C.grayMid, marginTop:2 }}>{totalEgresos>0?(totalOPEX/totalEgresos*100).toFixed(1):0}% del total</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLA MENSUAL */}
      <div style={cardStyle}>
        {sectionTitle("Tabla mensual de egresos (M0–M12)")}
        <TablaMensual filas={filasTabla} showTotal={true} />
      </div>

      {/* RESUMEN POR ÁREA */}
      <div style={{ border:`1px solid ${C.grayBorder}`, borderRadius:10, overflow:"hidden", marginBottom:24 }}>
        <div style={{ background:C.grayDark, color:C.white, padding:"12px 16px", fontWeight:700, fontSize:15 }}>Resumen por área</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:C.grayLight }}>
              <td style={{ padding:"10px 16px", fontWeight:700, fontSize:12, color:C.grayMid }}>Área</td>
              <td style={{ padding:"10px 8px", fontWeight:700, fontSize:12, color:C.yellowDark, textAlign:"right" }}>CAPEX</td>
              <td style={{ padding:"10px 8px", fontWeight:700, fontSize:12, color:C.grayMid, textAlign:"right" }}>OPEX</td>
              <td style={{ padding:"10px 16px", fontWeight:700, fontSize:12, color:C.grayDark, textAlign:"right" }}>Total</td>
            </tr>
          </thead>
          <tbody>
            {areasSeleccionadas.map((id, i) => {
              const area = AREAS_CATALOGO.find(a=>a.id===id);
              const cx   = totalCat(id,"equipos");
              const ox   = totalCat(id,"materiales")+totalCat(id,"mano_obra")+totalCat(id,"viaticos");
              return (
                <tr key={id} style={{ background:i%2===0?C.white:C.grayLight, borderTop:`1px solid ${C.grayBorder}` }}>
                  <td style={{ padding:"10px 16px", fontWeight:600, color:C.grayDark }}>{area?.icon} {area?.label}</td>
                  <td style={{ padding:"10px 8px", textAlign:"right", color:C.yellowDark }}>{fmt(cx)}</td>
                  <td style={{ padding:"10px 8px", textAlign:"right", color:C.grayMid }}>{fmt(ox)}</td>
                  <td style={{ padding:"10px 16px", textAlign:"right", fontWeight:700, color:C.grayDark }}>{fmt(cx+ox)}</td>
                </tr>
              );
            })}
            {capexPM.length>0 && <tr style={{ background:C.yellowLight, borderTop:`1px solid ${C.grayBorder}` }}>
              <td style={{ padding:"10px 16px", color:C.yellowDark }}>➕ CAPEX adicional (PM)</td>
              <td style={{ padding:"10px 8px", textAlign:"right", color:C.yellowDark }}>{fmt(capexPMTotal)}</td>
              <td style={{ padding:"10px 8px", textAlign:"right" }}>—</td>
              <td style={{ padding:"10px 16px", textAlign:"right", fontWeight:700 }}>{fmt(capexPMTotal)}</td>
            </tr>}
            {opexPM.length>0 && <tr style={{ background:C.grayLight, borderTop:`1px solid ${C.grayBorder}` }}>
              <td style={{ padding:"10px 16px", color:C.grayMid }}>➕ OPEX adicional (PM)</td>
              <td style={{ padding:"10px 8px", textAlign:"right" }}>—</td>
              <td style={{ padding:"10px 8px", textAlign:"right", color:C.grayMid }}>{fmt(opexPMTotal)}</td>
              <td style={{ padding:"10px 16px", textAlign:"right", fontWeight:700 }}>{fmt(opexPMTotal)}</td>
            </tr>}
            <tr style={{ background:C.grayDark, color:C.white, fontWeight:700 }}>
              <td style={{ padding:"12px 16px" }}>TOTAL CONSOLIDADO</td>
              <td style={{ padding:"12px 8px", textAlign:"right" }}>{fmt(totalCAPEX)}</td>
              <td style={{ padding:"12px 8px", textAlign:"right" }}>{fmt(totalOPEX)}</td>
              <td style={{ padding:"12px 16px", textAlign:"right", fontSize:15 }}>{fmt(totalEgresos)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between" }}>
        {btn("← Volver a revisión", onVolver, "secondary")}
        <div style={{ display:"flex", gap:10 }}>
          {btn("🔄 Nuevo presupuesto", onNuevo, "secondary")}
          {btn("✅ Enviar a aprobación →", () => alert("CU-007: En producción esto notificaría a Dirección."), "success")}
        </div>
      </div>
    </div>
  );

  // helper local para capexPMTotal / opexPMTotal
  var capexPMTotal = (capexPM||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
  var opexPMTotal  = (opexPM||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0);
}
