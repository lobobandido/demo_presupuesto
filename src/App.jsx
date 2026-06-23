import { useState, useMemo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TIPOS_PROYECTO = [
  { id: "instalacion", label: "Instalación", icon: "🏗️", desc: "Proyecto de instalación o construcción con ingresos por facturación" },
  { id: "servicio",    label: "Servicio",    icon: "⚙️", desc: "Contrato de servicio recurrente con facturación mensual" },
];

const AREAS_CATALOGO = [
  { id: "operaciones",    label: "Operaciones",     icon: "🔧" },
  { id: "ingenieria",     label: "Ingeniería",       icon: "📐" },
  { id: "sspa",           label: "SSPA",             icon: "🦺" },
  { id: "logistica",      label: "Logística",        icon: "🚛" },
  { id: "administracion", label: "Administración",   icon: "📋" },
  { id: "ti",             label: "Tecnología (TI)",  icon: "💻" },
  { id: "compras",        label: "Compras",          icon: "🛒" },
];

// Categorías de captura por área (CU-003)
const CATS_AREA = {
  materiales: { label: "Materiales",   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  mano_obra:  { label: "Mano de Obra", color: "#0891b2", bg: "#f0f9ff", border: "#bae6fd" },
  equipos:    { label: "Equipos",      color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  viaticos:   { label: "Viáticos",     color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
};

// Clasificación OPEX / CAPEX — mapeo desde categoría de área
// CAPEX = inversión única; OPEX = gasto recurrente
const CAPEX_CATS_AREA = ["equipos"]; // Equipos son CAPEX por defecto
const OPEX_CATS_AREA  = ["materiales", "mano_obra", "viaticos"]; // el resto OPEX

// Catálogos CAPEX y OPEX reales de Geolis (para partidas libres del PM)
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
  BORRADOR:    { label: "Borrador",     color: "#64748b", bg: "#f1f5f9" },
  EN_CAPTURA:  { label: "En captura",   color: "#d97706", bg: "#fffbeb" },
  EN_REVISION: { label: "En revisión",  color: "#0891b2", bg: "#f0f9ff" },
  CONSOLIDADO: { label: "Consolidado",  color: "#7c3aed", bg: "#f5f3ff" },
};

let _id = 100;
const uid = () => ++_id;

const fmt = (n) => isNaN(n) || n == null ? "$0.00"
  : "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function initPartida(overrides = {}) {
  return { id: uid(), desc: "", unidad: "Unidad", cantidad: 1, monto: 0, ...overrides };
}

function initPartidaLibre(overrides = {}) {
  return { id: uid(), cat: "", desc: "", unidad: "Mes", cantidad: 1, monto: 0, distribucion: "uniforme", meses: Array(12).fill(0), ...overrides };
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function Badge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.BORRADOR;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: e.bg, color: e.color, border: `1px solid ${e.color}44`,
    }}>{e.label}</span>
  );
}

function StepBar({ current }) {
  const steps = ["Info general","Áreas","Captura","Revisión PM","Consolidar"];
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "2px solid #e2e8f0" }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          padding: "10px 18px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
          color: current === i ? "#1e40af" : current > i ? "#059669" : "#94a3b8",
          borderBottom: current === i ? "2px solid #1e40af" : "2px solid transparent",
          marginBottom: -2,
        }}>
          {current > i ? "✓ " : ""}{s}
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, subtitle, color = "#1e40af", children, total }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ background: color, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{subtitle}</div>}
        </div>
        {total !== undefined && (
          <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{fmt(total)}</div>
        )}
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
        style={{ padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }} />
      <select value={p.unidad} onChange={e => onUpdate({ ...p, unidad: e.target.value })}
        style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}>
        {UNIDADES.map(u => <option key={u}>{u}</option>)}
      </select>
      <input type="number" min="0" step="1" value={p.cantidad}
        onChange={e => onUpdate({ ...p, cantidad: parseFloat(e.target.value) || 0 })}
        style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
      <input type="number" min="0" step="0.01" value={p.monto}
        onChange={e => onUpdate({ ...p, monto: parseFloat(e.target.value) || 0 })}
        style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
      <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", color: "#1e40af" }}>{fmt(total)}</span>
      <button onClick={onRemove} style={{
        background: "#fee2e2", color: "#dc2626", border: "none",
        borderRadius: 5, padding: "5px 9px", cursor: "pointer", fontSize: 13,
      }}>✕</button>
    </div>
  );
}

// Partida libre con catálogo OPEX/CAPEX y distribución mensual
function PartidaLibreRow({ p, onUpdate, onRemove, cats, label }) {
  const total = (p.cantidad || 0) * (p.monto || 0);
  function distribuir(updated) {
    if (updated.distribucion === "uniforme") {
      const v = parseFloat(((updated.cantidad || 0) * (updated.monto || 0) / 12).toFixed(2));
      return { ...updated, meses: Array(12).fill(v) };
    }
    if (updated.distribucion === "m0") {
      const meses = Array(12).fill(0);
      meses[0] = (updated.cantidad || 0) * (updated.monto || 0);
      return { ...updated, meses };
    }
    return updated;
  }
  function handle(field, val) { onUpdate(distribuir({ ...p, [field]: val })); }

  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
        <select value={p.cat} onChange={e => handle("cat", e.target.value)}
          style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}>
          <option value="">— Seleccionar categoría —</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={p.desc} onChange={e => handle("desc", e.target.value)}
          placeholder="Descripción" style={{ padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }} />
        <select value={p.unidad} onChange={e => handle("unidad", e.target.value)}
          style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}>
          {UNIDADES.map(u => <option key={u}>{u}</option>)}
        </select>
        <input type="number" min="0" step="1" value={p.cantidad}
          onChange={e => handle("cantidad", parseFloat(e.target.value) || 0)}
          style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
        <input type="number" min="0" step="0.01" value={p.monto}
          onChange={e => handle("monto", parseFloat(e.target.value) || 0)}
          style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
        <button onClick={onRemove} style={{
          background: "#fee2e2", color: "#dc2626", border: "none",
          borderRadius: 5, padding: "5px 9px", cursor: "pointer", fontSize: 13,
        }}>✕</button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>Total: <strong style={{ color: "#1e40af" }}>{fmt(total)}</strong></span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Distribución:</span>
          <select value={p.distribucion} onChange={e => handle("distribucion", e.target.value)}
            style={{ padding: "4px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}>
            <option value="uniforme">Uniforme (÷12)</option>
            <option value="m0">Solo M0 (instalación)</option>
            <option value="manual">Manual por mes</option>
          </select>
        </div>
      </div>
      {p.distribucion === "manual" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4, marginTop: 10 }}>
          {MESES.map((m, i) => (
            <div key={m}>
              <div style={{ fontSize: 10, color: "#64748b", textAlign: "center", marginBottom: 2 }}>{m}</div>
              <input type="number" min="0" step="0.01" value={p.meses[i]}
                onChange={e => {
                  const meses = [...p.meses];
                  meses[i] = parseFloat(e.target.value) || 0;
                  onUpdate({ ...p, meses });
                }}
                style={{ width: "100%", padding: "4px", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 11, textAlign: "right" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [vista, setVista] = useState("lista");
  const [step, setStep]   = useState(0);

  const [presupuesto, setPresupuesto]           = useState(null);
  const [areasSeleccionadas, setAreasSel]        = useState([]);
  const [costosAreas, setCostosAreas]            = useState({});
  const [areaActiva, setAreaActiva]              = useState(null);

  // Partidas libres CAPEX/OPEX del PM (independientes de las áreas)
  const [capexPM, setCapexPM] = useState([]);
  const [opexPM,  setOpexPM]  = useState([]);

  // Ingresos
  const [ingresos, setIngresos] = useState({ totalAnual: 0, distribucion: "uniforme", facturacion: Array(12).fill(0) });

  const [listaBorradores] = useState([
    { id: 1, nombre: "Monitoreo Cuervito", cliente: "PEMEX", tipo: "servicio", estado: "CONSOLIDADO", fecha: "2026-02-01" },
    { id: 2, nombre: "BEH Jujo F218358",   cliente: "PEMEX", tipo: "instalacion", estado: "EN_REVISION", fecha: "2026-01-15" },
  ]);

  const [nuevoForm, setNuevoForm] = useState({ cliente:"", nombre:"", tipo:"", fechaInicio:"", fechaFin:"", moneda:"MXN" });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function totalPartidas(lista) {
    return lista.reduce((s, p) => s + (p.cantidad || 0) * (p.monto || 0), 0);
  }
  function totalCat(areaId, cat) {
    return (costosAreas[areaId]?.[cat] || []).reduce((s, p) => s + (p.cantidad || 0) * (p.monto || 0), 0);
  }
  function totalArea(areaId) {
    return Object.keys(CATS_AREA).reduce((s, cat) => s + totalCat(areaId, cat), 0);
  }

  // CAPEX desde áreas: categorías de equipos de cada área
  const capexDesdeAreas = areasSeleccionadas.flatMap(id =>
    (costosAreas[id]?.equipos || []).map(p => ({ ...p, areaId: id, areaLabel: AREAS_CATALOGO.find(a => a.id === id)?.label }))
  );
  // OPEX desde áreas: materiales + mano_obra + viaticos
  const opexDesdeAreas = areasSeleccionadas.flatMap(id =>
    ["materiales","mano_obra","viaticos"].flatMap(cat =>
      (costosAreas[id]?.[cat] || []).map(p => ({ ...p, areaId: id, catLabel: CATS_AREA[cat].label, areaLabel: AREAS_CATALOGO.find(a => a.id === id)?.label }))
    )
  );

  const totalCAPEX = totalPartidas(capexDesdeAreas) + totalPartidas(capexPM);
  const totalOPEX  = totalPartidas(opexDesdeAreas)  + totalPartidas(opexPM);
  const totalEgresos = totalCAPEX + totalOPEX;
  const totalIngresos = ingresos.facturacion.reduce((s, v) => s + v, 0);
  const utilidad = totalIngresos - totalEgresos;
  const margen   = totalIngresos > 0 ? (utilidad / totalIngresos * 100) : 0;

  const todasCapturadas = areasSeleccionadas.length > 0 &&
    areasSeleccionadas.every(id => ["capturado","revisado"].includes(costosAreas[id]?.estado));

  // ── CU-001 ────────────────────────────────────────────────────────────────
  function crearPresupuesto() {
    setPresupuesto({ id: uid(), ...nuevoForm, estado: "BORRADOR", fecha: new Date().toISOString().slice(0,10) });
    setAreasSel([]); setCostosAreas({}); setCapexPM([]); setOpexPM([]);
    setIngresos({ totalAnual: 0, distribucion: "uniforme", facturacion: Array(12).fill(0) });
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

  // ── CU-003 helpers ────────────────────────────────────────────────────────
  function updatePartidaArea(areaId, cat, id, updated) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], [cat]: prev[areaId][cat].map(p => p.id === id ? updated : p) } }));
  }
  function addPartidaArea(areaId, cat) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], [cat]: [...prev[areaId][cat], initPartida()] } }));
  }
  function removePartidaArea(areaId, cat, id) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], [cat]: prev[areaId][cat].filter(p => p.id !== id) } }));
  }
  function marcarAreaCapturada(areaId) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], estado: "capturado" } }));
    setVista("pm_revision");
  }

  // ── CU-004 helpers ────────────────────────────────────────────────────────
  function solicitarCorreccion(areaId, comentario) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], estado: "correccion", comentario } }));
  }
  function aprobarArea(areaId) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], estado: "revisado" } }));
  }

  // ── CU-005 ────────────────────────────────────────────────────────────────
  function consolidar() {
    setPresupuesto(p => ({ ...p, estado: "CONSOLIDADO" }));
    setVista("consolidado");
  }

  const btn = (label, onClick, variant = "primary", disabled = false) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 22px", borderRadius: 8, border: "none",
      cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14,
      background: disabled ? "#e2e8f0" : variant === "primary" ? "#1e40af" : variant === "success" ? "#059669" : variant === "danger" ? "#dc2626" : "#f1f5f9",
      color: disabled ? "#94a3b8" : ["primary","success","danger"].includes(variant) ? "white" : "#374151",
    }}>{label}</button>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA LISTA
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "lista") return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>GEOLIS · Módulo de Presupuestos</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Project Manager — Vista principal</div>
        </div>
        {btn("+ Nuevo presupuesto", () => { setVista("nuevo"); setNuevoForm({ cliente:"", nombre:"", tipo:"", fechaInicio:"", fechaFin:"", moneda:"MXN" }); })}
      </div>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8 }}>
          {["Proyecto","Cliente","Tipo","Estado","Acciones"].map(h =>
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</div>
          )}
        </div>
        {listaBorradores.map((p, i) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "12px 16px", borderBottom: i < listaBorradores.length - 1 ? "1px solid #f1f5f9" : "none", background: i % 2 === 0 ? "white" : "#fafafa" }}>
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{p.fecha}</div></div>
            <div style={{ fontSize: 13 }}>{p.cliente}</div>
            <div style={{ fontSize: 13, textTransform: "capitalize" }}>{p.tipo}</div>
            <Badge estado={p.estado} />
            <button onClick={() => alert("En producción: abriría el presupuesto " + p.id)} style={{ padding: "6px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>Ver →</button>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CU-001 NUEVO PRESUPUESTO
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "nuevo") return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setVista("lista")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>←</button>
        <div><h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Nuevo presupuesto</h2><div style={{ fontSize: 13, color: "#64748b" }}>CU-001</div></div>
      </div>
      <SectionCard title="Datos del proyecto" color="#1e40af">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Cliente","cliente"],["Nombre del proyecto","nombre"]].map(([label, key]) => (
            <div key={key}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{label} *</label>
              <input value={nuevoForm[key]} onChange={e => setNuevoForm({ ...nuevoForm, [key]: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Tipo de proyecto *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {TIPOS_PROYECTO.map(t => (
                <div key={t.id} onClick={() => setNuevoForm({ ...nuevoForm, tipo: t.id })} style={{ border: "2px solid", borderColor: nuevoForm.tipo === t.id ? "#1e40af" : "#e2e8f0", borderRadius: 10, padding: 16, cursor: "pointer", background: nuevoForm.tipo === t.id ? "#eff6ff" : "white" }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Fecha inicio</label>
            <input type="date" value={nuevoForm.fechaInicio} onChange={e => setNuevoForm({ ...nuevoForm, fechaInicio: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Fecha fin</label>
            <input type="date" value={nuevoForm.fechaFin} onChange={e => setNuevoForm({ ...nuevoForm, fechaFin: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Moneda</label>
            <select value={nuevoForm.moneda} onChange={e => setNuevoForm({ ...nuevoForm, moneda: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}>
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
  if (vista === "crear" && step === 1) return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <StepBar current={1} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Áreas participantes</h2>
        <Badge estado={presupuesto?.estado} />
      </div>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}><strong>{presupuesto?.nombre}</strong> · {presupuesto?.cliente} · CU-002</p>
      <SectionCard title="Selecciona las áreas que capturarán costos" color="#0891b2">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {AREAS_CATALOGO.map(a => {
            const sel = areasSeleccionadas.includes(a.id);
            return (
              <div key={a.id} onClick={() => setAreasSel(prev => sel ? prev.filter(x => x !== a.id) : [...prev, a.id])} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "2px solid", borderColor: sel ? "#0891b2" : "#e2e8f0", borderRadius: 10, cursor: "pointer", background: sel ? "#f0f9ff" : "white" }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</span>
                {sel && <span style={{ marginLeft: "auto", color: "#0891b2" }}>✓</span>}
              </div>
            );
          })}
        </div>
        {areasSeleccionadas.length > 0 && (
          <div style={{ marginTop: 14, padding: 10, background: "#f0f9ff", borderRadius: 8, fontSize: 13, color: "#0c4a6e" }}>
            {areasSeleccionadas.length} área(s): {areasSeleccionadas.map(id => AREAS_CATALOGO.find(a => a.id === id)?.label).join(", ")}
          </div>
        )}
      </SectionCard>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {btn("← Volver", () => setVista("nuevo"), "secondary")}
        {btn("Confirmar áreas →", confirmarAreas, "primary", areasSeleccionadas.length === 0)}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CU-003 CAPTURA POR ÁREA
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "area_captura" && areaActiva) {
    const area   = AREAS_CATALOGO.find(a => a.id === areaActiva);
    const costos = costosAreas[areaActiva];
    const totalA = totalArea(areaActiva);
    const totalCapexArea = totalCat(areaActiva, "equipos");
    const totalOpexArea  = totalCat(areaActiva, "materiales") + totalCat(areaActiva, "mano_obra") + totalCat(areaActiva, "viaticos");

    return (
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
        <StepBar current={2} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <button onClick={() => setVista("pm_revision")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>←</button>
          <span style={{ fontSize: 22 }}>{area?.icon}</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Área: {area?.label}</h2>
          <Badge estado={presupuesto?.estado} />
        </div>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16, marginLeft: 42 }}>{presupuesto?.nombre} · CU-003: Solo ves tu sección.</p>

        {costos?.comentario && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
            ⚠️ <strong>Corrección solicitada por PM:</strong> {costos.comentario}
          </div>
        )}

        {/* Mini resumen CAPEX/OPEX del área */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>CAPEX del área</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", marginTop: 6 }}>{fmt(totalCapexArea)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Equipos (inversión única)</div>
          </div>
          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0891b2", textTransform: "uppercase" }}>OPEX del área</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0891b2", marginTop: 6 }}>{fmt(totalOpexArea)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Mat. + Mano de obra + Viáticos</div>
          </div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>Total área</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", marginTop: 6 }}>{fmt(totalA)}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>CAPEX + OPEX</div>
          </div>
        </div>

        {/* Headers de columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 90px auto", gap: 8, marginBottom: 4 }}>
          {["Descripción","Unidad","Cantidad","Monto unit.","Total",""].map((h,i) =>
            <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</div>
          )}
        </div>

        {/* CAPEX del área = Equipos */}
        <SectionCard title="CAPEX · Equipos" subtitle="Inversiones únicas: maquinaria, herramientas, vehículos asignados" color="#7c3aed" total={totalCapexArea}>
          {(costos?.equipos || []).map(p => (
            <PartidaRow key={p.id} p={p} catLabel="Equipo"
              onUpdate={updated => updatePartidaArea(areaActiva, "equipos", p.id, updated)}
              onRemove={() => removePartidaArea(areaActiva, "equipos", p.id)} />
          ))}
          <button onClick={() => addPartidaArea(areaActiva, "equipos")} style={{ width: "100%", padding: "8px", border: "2px dashed #ddd6fe", borderRadius: 6, background: "transparent", cursor: "pointer", color: "#7c3aed", fontSize: 13, marginTop: 4 }}>+ Agregar equipo (CAPEX)</button>
        </SectionCard>

        {/* OPEX del área = Materiales + Mano de obra + Viáticos */}
        {["materiales","mano_obra","viaticos"].map(catKey => {
          const catDef = CATS_AREA[catKey];
          return (
            <SectionCard key={catKey} title={`OPEX · ${catDef.label}`} subtitle={`Gasto recurrente — ${catDef.label}`} color={catDef.color} total={totalCat(areaActiva, catKey)}>
              {(costos?.[catKey] || []).map(p => (
                <PartidaRow key={p.id} p={p} catLabel={catDef.label}
                  onUpdate={updated => updatePartidaArea(areaActiva, catKey, p.id, updated)}
                  onRemove={() => removePartidaArea(areaActiva, catKey, p.id)} />
              ))}
              <button onClick={() => addPartidaArea(areaActiva, catKey)} style={{ width: "100%", padding: "8px", border: `2px dashed ${catDef.border}`, borderRadius: 6, background: "transparent", cursor: "pointer", color: catDef.color, fontSize: 13, marginTop: 4 }}>+ Agregar {catDef.label} (OPEX)</button>
            </SectionCard>
          );
        })}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {btn("Guardar borrador", () => setVista("pm_revision"), "secondary")}
          {btn("✓ Marcar como capturado", () => marcarAreaCapturada(areaActiva), "success")}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CU-004 REVISIÓN PM
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "pm_revision") return (
    <PMRevision
      presupuesto={presupuesto}
      areasSeleccionadas={areasSeleccionadas}
      costosAreas={costosAreas}
      totalArea={totalArea} totalCat={totalCat}
      totalCAPEX={totalCAPEX} totalOPEX={totalOPEX}
      totalEgresos={totalEgresos} totalIngresos={totalIngresos}
      utilidad={utilidad} margen={margen}
      capexPM={capexPM} setCapexPM={setCapexPM}
      opexPM={opexPM}  setOpexPM={setOpexPM}
      ingresos={ingresos} setIngresos={setIngresos}
      todasCapturadas={todasCapturadas}
      onAbrirArea={id => { setAreaActiva(id); setVista("area_captura"); }}
      onSolicitarCorreccion={solicitarCorreccion}
      onAprobarArea={aprobarArea}
      onConsolidar={consolidar}
      btn={btn}
    />
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CU-005 CONSOLIDADO
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "consolidado") return (
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
      btn={btn}
      onVolver={() => setVista("pm_revision")}
      onNuevo={() => setVista("lista")}
    />
  );

  return null;
}

// ─── PM REVISION ─────────────────────────────────────────────────────────────
function PMRevision({ presupuesto, areasSeleccionadas, costosAreas, totalArea, totalCat,
  totalCAPEX, totalOPEX, totalEgresos, totalIngresos, utilidad, margen,
  capexPM, setCapexPM, opexPM, setOpexPM, ingresos, setIngresos,
  todasCapturadas, onAbrirArea, onSolicitarCorreccion, onAprobarArea, onConsolidar, btn }) {

  const [comentarios, setComentarios] = useState({});
  const [mostrarForm, setMostrarForm] = useState({});
  const [tabActiva, setTabActiva]     = useState("areas"); // "areas" | "capex_opex" | "ingresos"

  const estadoLabel = { pendiente:"Pendiente", capturado:"Listo para revisar", revisado:"Aprobado", correccion:"Corrección solicitada" };
  const estadoColor = { pendiente:"#64748b", capturado:"#d97706", revisado:"#059669", correccion:"#dc2626" };

  const tabStyle = (t) => ({
    padding: "10px 20px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
    borderBottom: tabActiva === t ? "3px solid #1e40af" : "3px solid transparent",
    background: "none", color: tabActiva === t ? "#1e40af" : "#64748b",
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <StepBar current={3} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Revisión de costos</h2>
            <Badge estado={presupuesto?.estado} />
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>CU-004 · {presupuesto?.nombre} · {presupuesto?.cliente}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af" }}>{fmt(totalEgresos)}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Total egresos</div>
        </div>
      </div>

      {/* KPI CAPEX/OPEX */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>CAPEX total</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#7c3aed", marginTop: 6 }}>{fmt(totalCAPEX)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Equipos + activos</div>
        </div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0891b2", textTransform: "uppercase" }}>OPEX total</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0891b2", marginTop: 6 }}>{fmt(totalOPEX)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Mat. + nómina + viáticos</div>
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>Ingresos</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#059669", marginTop: 6 }}>{fmt(totalIngresos)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Facturación anual</div>
        </div>
        <div style={{ background: utilidad >= 0 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${utilidad >= 0 ? "#bbf7d0" : "#fecaca"}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: utilidad >= 0 ? "#059669" : "#dc2626", textTransform: "uppercase" }}>Utilidad</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: utilidad >= 0 ? "#059669" : "#dc2626", marginTop: 6 }}>{fmt(utilidad)}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Margen: {margen.toFixed(1)}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 20 }}>
        <button style={tabStyle("areas")} onClick={() => setTabActiva("areas")}>📋 Costos por área</button>
        <button style={tabStyle("capex_opex")} onClick={() => setTabActiva("capex_opex")}>📊 CAPEX / OPEX</button>
        <button style={tabStyle("ingresos")} onClick={() => setTabActiva("ingresos")}>💰 Ingresos</button>
      </div>

      {/* TAB: ÁREAS */}
      {tabActiva === "areas" && (
        <>
          {areasSeleccionadas.map(id => {
            const area = AREAS_CATALOGO.find(a => a.id === id);
            const costos = costosAreas[id];
            const est  = costos?.estado || "pendiente";
            const capexA = totalCat(id, "equipos");
            const opexA  = totalCat(id,"materiales") + totalCat(id,"mano_obra") + totalCat(id,"viaticos");
            return (
              <div key={id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{area?.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{area?.label}</div>
                      <div style={{ fontSize: 12, color: estadoColor[est] }}>
                        {est === "pendiente" ? "⏳" : est === "capturado" ? "📋" : est === "revisado" ? "✅" : "⚠️"} {estadoLabel[est]}
                        {costos?.comentario && <span> · "{costos.comentario}"</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#1e40af" }}>{fmt(totalArea(id))}</span>
                    <button onClick={() => onAbrirArea(id)} style={{ padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e40af" }}>Editar</button>
                  </div>
                </div>
                {est !== "pendiente" && (
                  <div style={{ padding: "10px 16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>CAPEX (Equipos)</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{fmt(capexA)}</div>
                    </div>
                    {["materiales","mano_obra","viaticos"].map(cat => (
                      <div key={cat} style={{ background: CATS_AREA[cat].bg, border: `1px solid ${CATS_AREA[cat].border}`, borderRadius: 8, padding: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: CATS_AREA[cat].color }}>OPEX · {CATS_AREA[cat].label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{fmt(totalCat(id, cat))}</div>
                      </div>
                    ))}
                  </div>
                )}
                {est === "capturado" && (
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center" }}>
                    {mostrarForm[id] ? (
                      <>
                        <input value={comentarios[id] || ""} onChange={e => setComentarios({ ...comentarios, [id]: e.target.value })}
                          placeholder="Describe la corrección..." style={{ flex: 1, padding: "7px 10px", border: "1px solid #fde047", borderRadius: 6, fontSize: 13 }} />
                        <button onClick={() => { onSolicitarCorreccion(id, comentarios[id] || "Favor de revisar"); setMostrarForm({ ...mostrarForm, [id]: false }); }}
                          style={{ padding: "7px 14px", background: "#fef9c3", color: "#92400e", border: "1px solid #fde047", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Enviar</button>
                        <button onClick={() => setMostrarForm({ ...mostrarForm, [id]: false })}
                          style={{ padding: "7px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setMostrarForm({ ...mostrarForm, [id]: true })} style={{ padding: "7px 14px", background: "#fef9c3", color: "#92400e", border: "1px solid #fde047", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>⚠ Solicitar corrección</button>
                        <button onClick={() => onAprobarArea(id)} style={{ padding: "7px 14px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✓ Aprobar área</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* TAB: CAPEX / OPEX */}
      {tabActiva === "capex_opex" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* CAPEX */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#7c3aed", margin: 0 }}>CAPEX · Inversiones</h3>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#7c3aed" }}>{fmt(totalCAPEX)}</span>
              </div>
              <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 8 }}>DESDE ÁREAS (Equipos)</div>
                {areasSeleccionadas.map(id => {
                  const v = totalCat(id, "equipos");
                  if (v === 0) return null;
                  const area = AREAS_CATALOGO.find(a => a.id === id);
                  return <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{area?.icon} {area?.label}</span><span style={{ fontWeight: 600 }}>{fmt(v)}</span></div>;
                })}
                {areasSeleccionadas.every(id => totalCat(id,"equipos") === 0) && <div style={{ fontSize: 13, color: "#94a3b8" }}>Sin equipos capturados aún</div>}
              </div>
              <SectionCard title="CAPEX adicional (PM)" color="#7c3aed" subtitle="Activos no capturados por área">
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                  {["Categoría","Descripción","Cant.","Monto"].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</div>)}
                </div>
                {capexPM.map(p => (
                  <PartidaLibreRow key={p.id} p={p} cats={CAPEX_CATS} label="CAPEX"
                    onUpdate={updated => setCapexPM(capexPM.map(x => x.id === p.id ? updated : x))}
                    onRemove={() => setCapexPM(capexPM.filter(x => x.id !== p.id))} />
                ))}
                <button onClick={() => setCapexPM([...capexPM, initPartidaLibre({ cat: CAPEX_CATS[0] })])} style={{ width: "100%", padding: "8px", border: "2px dashed #ddd6fe", borderRadius: 6, background: "transparent", cursor: "pointer", color: "#7c3aed", fontSize: 13 }}>+ Agregar CAPEX</button>
              </SectionCard>
            </div>

            {/* OPEX */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#0891b2", margin: 0 }}>OPEX · Gastos recurrentes</h3>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#0891b2" }}>{fmt(totalOPEX)}</span>
              </div>
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0891b2", marginBottom: 8 }}>DESDE ÁREAS (Mat. + M.O. + Viáticos)</div>
                {areasSeleccionadas.map(id => {
                  const v = totalCat(id,"materiales") + totalCat(id,"mano_obra") + totalCat(id,"viaticos");
                  if (v === 0) return null;
                  const area = AREAS_CATALOGO.find(a => a.id === id);
                  return <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{area?.icon} {area?.label}</span><span style={{ fontWeight: 600 }}>{fmt(v)}</span></div>;
                })}
                {areasSeleccionadas.every(id => (totalCat(id,"materiales")+totalCat(id,"mano_obra")+totalCat(id,"viaticos")) === 0) && <div style={{ fontSize: 13, color: "#94a3b8" }}>Sin OPEX capturado aún</div>}
              </div>
              <SectionCard title="OPEX adicional (PM)" color="#0891b2" subtitle="Gastos recurrentes no capturados por área">
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                  {["Categoría","Descripción","Cant.","Monto"].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</div>)}
                </div>
                {opexPM.map(p => (
                  <PartidaLibreRow key={p.id} p={p} cats={OPEX_CATS} label="OPEX"
                    onUpdate={updated => setOpexPM(opexPM.map(x => x.id === p.id ? updated : x))}
                    onRemove={() => setOpexPM(opexPM.filter(x => x.id !== p.id))} />
                ))}
                <button onClick={() => setOpexPM([...opexPM, initPartidaLibre({ cat: OPEX_CATS[0] })])} style={{ width: "100%", padding: "8px", border: "2px dashed #bae6fd", borderRadius: 6, background: "transparent", cursor: "pointer", color: "#0891b2", fontSize: 13 }}>+ Agregar OPEX</button>
              </SectionCard>
            </div>
          </div>
        </>
      )}

      {/* TAB: INGRESOS */}
      {tabActiva === "ingresos" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Total anual a facturar ({presupuesto?.moneda || "MXN"})</label>
              <input type="number" min="0" step="0.01" value={ingresos.totalAnual}
                onChange={e => {
                  const total = parseFloat(e.target.value) || 0;
                  const fac = ingresos.distribucion === "uniforme" ? Array(12).fill(parseFloat((total/12).toFixed(2))) : ingresos.facturacion;
                  setIngresos({ ...ingresos, totalAnual: total, facturacion: fac });
                }}
                style={{ width: "100%", padding: "10px 12px", border: "2px solid #059669", borderRadius: 8, fontSize: 16, fontWeight: 600, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Distribución mensual</label>
              <select value={ingresos.distribucion}
                onChange={e => {
                  const dist = e.target.value;
                  const fac = dist === "uniforme" ? Array(12).fill(parseFloat((ingresos.totalAnual/12).toFixed(2))) : ingresos.facturacion;
                  setIngresos({ ...ingresos, distribucion: dist, facturacion: fac });
                }}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}>
                <option value="uniforme">Uniforme (mismo monto cada mes)</option>
                <option value="manual">Personalizada por mes</option>
              </select>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#059669", color: "white" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 700 }}>Concepto</td>
                  {MESES.map(m => <td key={m} style={{ padding: "6px", textAlign: "right", fontWeight: 600 }}>{m}</td>)}
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>Total</td>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#f0fdf4" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 700 }}>FACTURACIÓN</td>
                  {ingresos.facturacion.map((v, i) => (
                    <td key={i} style={{ padding: "4px" }}>
                      {ingresos.distribucion === "manual"
                        ? <input type="number" min="0" step="0.01" value={v}
                            onChange={e => { const fac = [...ingresos.facturacion]; fac[i] = parseFloat(e.target.value)||0; setIngresos({ ...ingresos, facturacion: fac }); }}
                            style={{ width: 72, padding: "4px 5px", border: "1px solid #cbd5e1", borderRadius: 4, fontSize: 11, textAlign: "right" }} />
                        : <span style={{ display: "block", textAlign: "right", padding: "4px 5px" }}>{fmt(v)}</span>
                      }
                    </td>
                  ))}
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#059669" }}>{fmt(ingresos.facturacion.reduce((s,v) => s+v, 0))}</td>
                </tr>
                <tr style={{ background: "#fef2f2" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 700, color: "#dc2626" }}>EGRESOS</td>
                  {MESES.map((_, i) => <td key={i} style={{ padding: "6px", textAlign: "right", fontSize: 11, color: "#dc2626" }}>{fmt(totalOPEX/12 + (i===0 ? totalCAPEX : 0))}</td>)}
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#dc2626" }}>{fmt(totalEgresos)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, gap: 10 }}>
        {btn("Consolidar presupuesto →", onConsolidar, "success", !todasCapturadas)}
      </div>
      {!todasCapturadas && <div style={{ textAlign: "right", fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Todas las áreas deben estar aprobadas para consolidar.</div>}
    </div>
  );
}

// ─── CONSOLIDADO ──────────────────────────────────────────────────────────────
function Consolidado({ presupuesto, areasSeleccionadas, costosAreas, capexPM, opexPM,
  ingresos, totalArea, totalCat, totalCAPEX, totalOPEX, totalEgresos, totalIngresos, utilidad, margen,
  btn, onVolver, onNuevo }) {

  const capexDesdeAreas = areasSeleccionadas.flatMap(id => {
    const area = AREAS_CATALOGO.find(a => a.id === id);
    return (costosAreas[id]?.equipos || []).map(p => ({ ...p, areaLabel: area?.label, areaIcon: area?.icon, cat: "CAPEX — Equipos" }));
  });
  const opexDesdeAreas = areasSeleccionadas.flatMap(id => {
    const area = AREAS_CATALOGO.find(a => a.id === id);
    return ["materiales","mano_obra","viaticos"].flatMap(cat =>
      (costosAreas[id]?.[cat] || []).map(p => ({ ...p, areaLabel: area?.label, areaIcon: area?.icon, cat: "OPEX — " + CATS_AREA[cat].label }))
    );
  });

  const totalNominalCAPEX = totalCat ? areasSeleccionadas.reduce((s,id) => s + totalCat(id,"equipos"), 0) + (capexPM||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0) : 0;
  const totalNominalOPEX  = totalCat ? areasSeleccionadas.reduce((s,id) => s + totalCat(id,"materiales")+totalCat(id,"mano_obra")+totalCat(id,"viaticos"), 0) + (opexPM||[]).reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0) : 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <StepBar current={4} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Presupuesto consolidado</h2>
            <Badge estado="CONSOLIDADO" />
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>CU-005 · {presupuesto?.nombre} · {presupuesto?.cliente} · {presupuesto?.tipo}</div>
        </div>
        <button onClick={() => window.print()} style={{ padding: "10px 18px", background: "#1e40af", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>⬇ Exportar</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label:"Ingresos",     val: totalIngresos, color:"#059669", bg:"#f0fdf4", border:"#bbf7d0" },
          { label:"CAPEX",        val: totalNominalCAPEX, color:"#7c3aed", bg:"#f5f3ff", border:"#ddd6fe" },
          { label:"OPEX",         val: totalNominalOPEX,  color:"#0891b2", bg:"#f0f9ff", border:"#bae6fd" },
          { label:"Total egresos",val: totalEgresos,   color:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
          { label:`Utilidad (${margen.toFixed(1)}%)`, val: utilidad, color: utilidad>=0?"#059669":"#dc2626", bg: utilidad>=0?"#f0fdf4":"#fef2f2", border: utilidad>=0?"#bbf7d0":"#fecaca" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: k.color, textTransform: "uppercase" }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color, marginTop: 6 }}>{fmt(k.val)}</div>
          </div>
        ))}
      </div>

      {/* Tabla mensual INGRESOS / CAPEX / OPEX */}
      <div style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#0f172a", color: "white" }}>
              <td style={{ padding: "10px 12px", fontWeight: 700 }}>Concepto</td>
              {MESES.map(m => <td key={m} style={{ padding: "8px 5px", textAlign: "right", fontWeight: 600 }}>{m}</td>)}
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>Total</td>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: "#f0fdf4" }}>
              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#059669" }}>INGRESOS</td>
              {ingresos.facturacion.map((v,i) => <td key={i} style={{ padding: "6px 5px", textAlign: "right" }}>{fmt(v)}</td>)}
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#059669" }}>{fmt(totalIngresos)}</td>
            </tr>
            <tr style={{ background: "#f5f3ff" }}>
              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#7c3aed" }}>CAPEX</td>
              {MESES.map((_,i) => <td key={i} style={{ padding: "6px 5px", textAlign: "right" }}>{fmt(i===0 ? totalNominalCAPEX : 0)}</td>)}
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#7c3aed" }}>{fmt(totalNominalCAPEX)}</td>
            </tr>
            <tr style={{ background: "#f0f9ff" }}>
              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0891b2" }}>OPEX</td>
              {MESES.map((_,i) => <td key={i} style={{ padding: "6px 5px", textAlign: "right" }}>{fmt(totalNominalOPEX/12)}</td>)}
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#0891b2" }}>{fmt(totalNominalOPEX)}</td>
            </tr>
            <tr style={{ background: "#e2e8f0", fontWeight: 700 }}>
              <td style={{ padding: "8px 12px" }}>TOTAL EGRESOS</td>
              {MESES.map((_,i) => <td key={i} style={{ padding: "6px 5px", textAlign: "right" }}>{fmt((i===0?totalNominalCAPEX:0) + totalNominalOPEX/12)}</td>)}
              <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(totalEgresos)}</td>
            </tr>
            <tr style={{ background: utilidad>=0?"#dcfce7":"#fee2e2", fontWeight: 800 }}>
              <td style={{ padding: "8px 12px", color: utilidad>=0?"#059669":"#dc2626" }}>UTILIDAD</td>
              {MESES.map((_,i) => { const u = ingresos.facturacion[i] - (i===0?totalNominalCAPEX:0) - totalNominalOPEX/12; return <td key={i} style={{ padding: "6px 5px", textAlign: "right", color: u>=0?"#059669":"#dc2626" }}>{fmt(u)}</td>; })}
              <td style={{ padding: "8px 12px", textAlign: "right", color: utilidad>=0?"#059669":"#dc2626" }}>{fmt(utilidad)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Resumen por área */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ background: "#0f172a", color: "white", padding: "12px 16px", fontWeight: 700, fontSize: 15 }}>Resumen por área</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: 12, color: "#64748b" }}>Área</td>
              <td style={{ padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#7c3aed", textAlign: "right" }}>CAPEX</td>
              <td style={{ padding: "10px 8px", fontWeight: 700, fontSize: 12, color: "#0891b2", textAlign: "right" }}>OPEX</td>
              <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: 12, color: "#1e40af", textAlign: "right" }}>Total</td>
            </tr>
          </thead>
          <tbody>
            {areasSeleccionadas.map((id, i) => {
              const area = AREAS_CATALOGO.find(a => a.id === id);
              const cx = totalCat(id,"equipos");
              const ox = totalCat(id,"materiales")+totalCat(id,"mano_obra")+totalCat(id,"viaticos");
              return (
                <tr key={id} style={{ background: i%2===0?"white":"#fafafa", borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>{area?.icon} {area?.label}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#7c3aed" }}>{fmt(cx)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#0891b2" }}>{fmt(ox)}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "#1e40af" }}>{fmt(cx+ox)}</td>
                </tr>
              );
            })}
            {capexPM.length > 0 && <tr style={{ background: "#faf5ff", borderTop: "1px solid #f1f5f9" }}>
              <td style={{ padding: "10px 16px", color: "#7c3aed" }}>➕ CAPEX adicional (PM)</td>
              <td style={{ padding: "10px 8px", textAlign: "right", color: "#7c3aed" }}>{fmt(capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0))}</td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>—</td>
              <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700 }}>{fmt(capexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0))}</td>
            </tr>}
            {opexPM.length > 0 && <tr style={{ background: "#f0f9ff", borderTop: "1px solid #f1f5f9" }}>
              <td style={{ padding: "10px 16px", color: "#0891b2" }}>➕ OPEX adicional (PM)</td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>—</td>
              <td style={{ padding: "10px 8px", textAlign: "right", color: "#0891b2" }}>{fmt(opexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0))}</td>
              <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700 }}>{fmt(opexPM.reduce((s,p)=>s+(p.cantidad||0)*(p.monto||0),0))}</td>
            </tr>}
            <tr style={{ background: "#0f172a", color: "white", fontWeight: 700 }}>
              <td style={{ padding: "12px 16px" }}>TOTAL CONSOLIDADO</td>
              <td style={{ padding: "12px 8px", textAlign: "right" }}>{fmt(totalNominalCAPEX)}</td>
              <td style={{ padding: "12px 8px", textAlign: "right" }}>{fmt(totalNominalOPEX)}</td>
              <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 15 }}>{fmt(totalEgresos)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {btn("← Volver a revisión", onVolver, "secondary")}
        <div style={{ display: "flex", gap: 10 }}>
          {btn("🔄 Nuevo presupuesto", onNuevo, "secondary")}
          {btn("✅ Enviar a aprobación →", () => alert("CU-007: En producción esto notificaría a Dirección y cambiaría el estado a 'En aprobación'."), "success")}
        </div>
      </div>
    </div>
  );
}

