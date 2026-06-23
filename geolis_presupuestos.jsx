import { useState, useMemo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TIPOS_PROYECTO = [
  { id: "instalacion", label: "Instalación", icon: "🏗️", desc: "Proyecto de instalación o construcción con ingresos por facturación" },
  { id: "servicio",    label: "Servicio",    icon: "⚙️", desc: "Contrato de servicio recurrente con facturación mensual" },
];

const AREAS_CATALOGO = [
  { id: "operaciones",  label: "Operaciones",        icon: "🔧" },
  { id: "ingenieria",   label: "Ingeniería",          icon: "📐" },
  { id: "sspa",         label: "SSPA",                icon: "🦺" },
  { id: "logistica",    label: "Logística",           icon: "🚛" },
  { id: "administracion", label: "Administración",   icon: "📋" },
  { id: "ti",           label: "Tecnología (TI)",     icon: "💻" },
  { id: "compras",      label: "Compras",             icon: "🛒" },
];

const CATS_AREA = {
  materiales:   { label: "Materiales",   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  mano_obra:    { label: "Mano de Obra", color: "#0891b2", bg: "#f0f9ff", border: "#bae6fd" },
  equipos:      { label: "Equipos",      color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  viaticos:     { label: "Viáticos",     color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
};

const OPEX_CATS = [
  "NÓMINA Y ADICIONALES","ARRENDA DE INMUEBLES Y SERV","ARTÍCULOS DE SEGURIDAD",
  "INSUMOS OPERATIVOS","INSUMOS DE OFICINA","MATERIALES","MATERIALES DE SALUD",
  "SERV TELEFONÍA CELULAR Y RADIO","SERVICIOS","SERVICIOS DE CAPACITACIÓN",
  "VEHÍCULOS Y COMBUSTIBLE","VIÁTICOS","MARKETING","EQUIPOS Y ENSERES",
  "RENTA DE MAQUINARIA Y EQUIPO","HERRAMIENTAS","SEGUROS","FLETES NACIONALES",
];
const CAPEX_CATS = [
  "EQUIPO DE TRANSPORTE","MAQUINARIA Y EQUIPO","EQUIPO DE MOBILIARIO",
  "EQUIPO DE COMPUTO","OTROS ACTIVOS","SOFTWARE Y LICENCIAS","GABINETE Y ENERGÍA","TRANSMISIÓN",
];

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const UNIDADES = ["Unidad","Día","Semana","Mes","Año","Servicio","Viaje","Pieza","Kg","Metro","Litro","Hora"];

// Estado global del presupuesto
const ESTADOS = {
  BORRADOR:     { label: "Borrador",      color: "#64748b", bg: "#f1f5f9" },
  EN_CAPTURA:   { label: "En captura",    color: "#d97706", bg: "#fffbeb" },
  EN_REVISION:  { label: "En revisión",   color: "#0891b2", bg: "#f0f9ff" },
  CONSOLIDADO:  { label: "Consolidado",   color: "#7c3aed", bg: "#f5f3ff" },
};

let _id = 100;
const uid = () => ++_id;

const fmt = (n) => isNaN(n) || n == null ? "$0.00"
  : "$" + Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function initPartida(overrides = {}) {
  return { id: uid(), desc: "", unidad: "Unidad", cantidad: 1, monto: 0, ...overrides };
}

// ─── SUBCOMPONENTS ───────────────────────────────────────────────────────────

function Badge({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.BORRADOR;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: e.bg, color: e.color, border: `1px solid ${e.color}33`,
    }}>{e.label}</span>
  );
}

function StepBar({ steps, current }) {
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

function SectionCard({ title, subtitle, color = "#1e40af", children }) {
  return (
    <div style={{ border: `1px solid #e2e8f0`, borderRadius: 10, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ background: color, padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "white" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function PartidaRow({ p, onUpdate, onRemove, catLabel }) {
  const total = (p.cantidad || 0) * (p.monto || 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px auto", gap: 8, alignItems: "center", marginBottom: 6 }}>
      <input value={p.desc} onChange={e => onUpdate({ ...p, desc: e.target.value })}
        placeholder={`Descripción (${catLabel})`}
        style={{ padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13 }} />
      <select value={p.unidad} onChange={e => onUpdate({ ...p, unidad: e.target.value })}
        style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12 }}>
        {UNIDADES.map(u => <option key={u}>{u}</option>)}
      </select>
      <input type="number" min="0" step="0.01" value={p.cantidad}
        onChange={e => onUpdate({ ...p, cantidad: parseFloat(e.target.value) || 0 })}
        placeholder="Cant." style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
      <input type="number" min="0" step="0.01" value={p.monto}
        onChange={e => onUpdate({ ...p, monto: parseFloat(e.target.value) || 0 })}
        placeholder="Monto" style={{ padding: "7px 8px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, textAlign: "right" }} />
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{fmt(total)}</span>
        <button onClick={onRemove} style={{
          background: "#fee2e2", color: "#dc2626", border: "none",
          borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 13,
        }}>✕</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // Vista principal: "lista" | "crear" | "area_captura" | "pm_revision" | "consolidado"
  const [vista, setVista] = useState("lista");
  const [step, setStep] = useState(0);

  // Datos del presupuesto activo
  const [presupuesto, setPresupuesto] = useState(null);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState([]);
  // costosAreas: { [areaId]: { materiales: [], mano_obra: [], equipos: [], viaticos: [], estado: "pendiente"|"capturado"|"revisado" } }
  const [costosAreas, setCostosAreas] = useState({});
  const [areaActiva, setAreaActiva] = useState(null);

  // Lista simulada de presupuestos
  const [listaBorradores, setListaBorradores] = useState([
    { id: 1, nombre: "Monitoreo Cuervito", cliente: "PEMEX", tipo: "servicio", estado: "CONSOLIDADO", fecha: "2026-02-01" },
    { id: 2, nombre: "BEH Jujo F218358", cliente: "PEMEX", tipo: "instalacion", estado: "EN_REVISION", fecha: "2026-01-15" },
  ]);

  // ── CU-001: Crear presupuesto ─────────────────────────────────────────────
  const [nuevoForm, setNuevoForm] = useState({
    cliente: "", nombre: "", tipo: "", fechaInicio: "", fechaFin: "", moneda: "MXN",
  });

  function crearPresupuesto() {
    const p = {
      id: uid(),
      ...nuevoForm,
      estado: "BORRADOR",
      fecha: new Date().toISOString().slice(0, 10),
    };
    setPresupuesto(p);
    setAreasSeleccionadas([]);
    setCostosAreas({});
    setVista("crear");
    setStep(1); // Saltar a paso de áreas
  }

  // ── CU-002: Áreas participantes ───────────────────────────────────────────
  function confirmarAreas() {
    const costos = {};
    areasSeleccionadas.forEach(id => {
      costos[id] = {
        materiales: [], mano_obra: [], equipos: [], viaticos: [],
        estado: "pendiente", comentario: "",
      };
    });
    setCostosAreas(costos);
    // Cambiar estado a En Captura
    setPresupuesto(p => ({ ...p, estado: "EN_CAPTURA" }));
    setVista("pm_revision");
  }

  // ── CU-003: Captura de costos por área ────────────────────────────────────
  function updatePartidaArea(areaId, cat, id, updated) {
    setCostosAreas(prev => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        [cat]: prev[areaId][cat].map(p => p.id === id ? updated : p),
      },
    }));
  }
  function addPartidaArea(areaId, cat) {
    setCostosAreas(prev => ({
      ...prev,
      [areaId]: { ...prev[areaId], [cat]: [...prev[areaId][cat], initPartida()] },
    }));
  }
  function removePartidaArea(areaId, cat, id) {
    setCostosAreas(prev => ({
      ...prev,
      [areaId]: { ...prev[areaId], [cat]: prev[areaId][cat].filter(p => p.id !== id) },
    }));
  }
  function marcarAreaCapturada(areaId) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], estado: "capturado" } }));
    setVista("pm_revision");
  }

  // ── CU-004: Revisión PM ───────────────────────────────────────────────────
  function solicitarCorreccion(areaId, comentario) {
    setCostosAreas(prev => ({
      ...prev, [areaId]: { ...prev[areaId], estado: "correccion", comentario },
    }));
  }
  function aprobarArea(areaId) {
    setCostosAreas(prev => ({ ...prev, [areaId]: { ...prev[areaId], estado: "revisado" } }));
  }

  // ── CU-005: Consolidar ────────────────────────────────────────────────────
  function consolidar() {
    setPresupuesto(p => ({ ...p, estado: "CONSOLIDADO" }));
    setVista("consolidado");
  }

  function totalArea(areaId) {
    if (!costosAreas[areaId]) return 0;
    return Object.values(costosAreas[areaId])
      .flat()
      .filter(x => x && x.monto !== undefined)
      .reduce((s, p) => s + (p.cantidad || 0) * (p.monto || 0), 0);
  }

  function totalCat(areaId, cat) {
    if (!costosAreas[areaId]?.[cat]) return 0;
    return costosAreas[areaId][cat].reduce((s, p) => s + (p.cantidad || 0) * (p.monto || 0), 0);
  }

  const todasCapturadas = areasSeleccionadas.length > 0 &&
    areasSeleccionadas.every(id => costosAreas[id]?.estado === "capturado" || costosAreas[id]?.estado === "revisado");

  const btn = (label, onClick, variant = "primary", disabled = false, style = {}) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "10px 22px", borderRadius: 8, border: "none",
      cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14,
      background: disabled ? "#e2e8f0" : variant === "primary" ? "#1e40af" : variant === "success" ? "#059669"
        : variant === "danger" ? "#dc2626" : variant === "warning" ? "#d97706" : "#f1f5f9",
      color: disabled ? "#94a3b8" : ["primary","success","danger","warning"].includes(variant) ? "white" : "#374151",
      ...style,
    }}>{label}</button>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA: LISTA DE PRESUPUESTOS
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "lista") return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>
            GEOLIS · Módulo de Presupuestos
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Project Manager — Vista principal</div>
        </div>
        {btn("+ Nuevo presupuesto", () => { setVista("nuevo"); setNuevoForm({ cliente:"", nombre:"", tipo:"", fechaInicio:"", fechaFin:"", moneda:"MXN" }); })}
      </div>

      {/* Tabla de presupuestos */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: "#f8fafc", padding: "10px 16px", borderBottom: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8 }}>
          {["Proyecto", "Cliente", "Tipo", "Estado", "Acciones"].map(h =>
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</div>
          )}
        </div>
        {listaBorradores.map((p, i) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "12px 16px", borderBottom: i < listaBorradores.length - 1 ? "1px solid #f1f5f9" : "none", background: i % 2 === 0 ? "white" : "#fafafa" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.fecha}</div>
            </div>
            <div style={{ fontSize: 13 }}>{p.cliente}</div>
            <div style={{ fontSize: 13, textTransform: "capitalize" }}>{p.tipo}</div>
            <Badge estado={p.estado} />
            <button onClick={() => alert("En producción: abriría el presupuesto " + p.id)}
              style={{ padding: "6px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Ver →
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA: CU-001 CREAR PRESUPUESTO
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "nuevo") return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setVista("lista")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>←</button>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Nuevo presupuesto</h2>
          <div style={{ fontSize: 13, color: "#64748b" }}>CU-001 · Información general</div>
        </div>
      </div>

      <SectionCard title="Datos del proyecto" color="#1e40af">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Cliente", "cliente"], ["Nombre del proyecto", "nombre"]].map(([label, key]) => (
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
                <div key={t.id} onClick={() => setNuevoForm({ ...nuevoForm, tipo: t.id })} style={{
                  border: `2px solid`, borderColor: nuevoForm.tipo === t.id ? "#1e40af" : "#e2e8f0",
                  borderRadius: 10, padding: 16, cursor: "pointer",
                  background: nuevoForm.tipo === t.id ? "#eff6ff" : "white",
                }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{t.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Fecha inicio</label>
            <input type="date" value={nuevoForm.fechaInicio} onChange={e => setNuevoForm({ ...nuevoForm, fechaInicio: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Fecha fin</label>
            <input type="date" value={nuevoForm.fechaFin} onChange={e => setNuevoForm({ ...nuevoForm, fechaFin: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Moneda</label>
            <select value={nuevoForm.moneda} onChange={e => setNuevoForm({ ...nuevoForm, moneda: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}>
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
  // VISTA: CU-002 SELECCIONAR ÁREAS
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "crear" && step === 1) return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <StepBar steps={["Info general", "Áreas", "Captura", "Revisión PM", "Consolidar"]} current={1} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Áreas participantes</h2>
        <Badge estado={presupuesto?.estado} />
      </div>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
        <strong>{presupuesto?.nombre}</strong> · {presupuesto?.cliente}<br />
        Selecciona las áreas que capturarán costos en este presupuesto.
      </p>

      <SectionCard title="CU-002 · Catálogo de áreas" color="#0891b2" subtitle="Selecciona una o varias áreas participantes">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {AREAS_CATALOGO.map(a => {
            const sel = areasSeleccionadas.includes(a.id);
            return (
              <div key={a.id} onClick={() => setAreasSeleccionadas(prev =>
                sel ? prev.filter(x => x !== a.id) : [...prev, a.id]
              )} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                border: `2px solid`, borderColor: sel ? "#0891b2" : "#e2e8f0",
                borderRadius: 10, cursor: "pointer",
                background: sel ? "#f0f9ff" : "white",
              }}>
                <div style={{ fontSize: 22 }}>{a.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</div>
                {sel && <div style={{ marginLeft: "auto", color: "#0891b2", fontSize: 16 }}>✓</div>}
              </div>
            );
          })}
        </div>
        {areasSeleccionadas.length > 0 && (
          <div style={{ marginTop: 14, padding: 10, background: "#f0f9ff", borderRadius: 8, fontSize: 13, color: "#0c4a6e" }}>
            {areasSeleccionadas.length} área(s) seleccionada(s): {areasSeleccionadas.map(id => AREAS_CATALOGO.find(a => a.id === id)?.label).join(", ")}
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
  // VISTA: CU-003 CAPTURA DE COSTOS POR ÁREA
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "area_captura" && areaActiva) {
    const area = AREAS_CATALOGO.find(a => a.id === areaActiva);
    const costos = costosAreas[areaActiva];
    const totalAreaActual = totalArea(areaActiva);

    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
        <StepBar steps={["Info general","Áreas","Captura","Revisión PM","Consolidar"]} current={2} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <button onClick={() => setVista("pm_revision")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748b" }}>←</button>
          <div style={{ fontSize: 22 }}>{area?.icon}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Área: {area?.label}</h2>
          <Badge estado={presupuesto?.estado} />
        </div>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20, marginLeft: 42 }}>
          {presupuesto?.nombre} · CU-003: Captura los costos de tu área. Solo ves tu sección.
        </p>

        {costos?.comentario && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
            ⚠️ <strong>Solicitud de corrección del PM:</strong> {costos.comentario}
          </div>
        )}

        {/* Columnas de headers */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px auto", gap: 8, marginBottom: 4, padding: "0 0 0 0" }}>
          {["Descripción", "Unidad", "Cantidad", "Monto unit.", "Total"].map(h =>
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</div>
          )}
        </div>

        {Object.entries(CATS_AREA).map(([catKey, catDef]) => (
          <SectionCard key={catKey} title={`${catDef.label}  ·  ${fmt(totalCat(areaActiva, catKey))}`} color={catDef.color} subtitle={`Partidas de ${catDef.label.toLowerCase()} de esta área`}>
            {(costos?.[catKey] || []).map(p => (
              <PartidaRow key={p.id} p={p} catLabel={catDef.label}
                onUpdate={updated => updatePartidaArea(areaActiva, catKey, p.id, updated)}
                onRemove={() => removePartidaArea(areaActiva, catKey, p.id)} />
            ))}
            <button onClick={() => addPartidaArea(areaActiva, catKey)} style={{
              width: "100%", padding: "8px", border: "2px dashed #cbd5e1",
              borderRadius: 6, background: "transparent", cursor: "pointer", color: "#64748b", fontSize: 13, marginTop: 4,
            }}>+ Agregar {catDef.label}</button>
          </SectionCard>
        ))}

        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Total del área</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#1e40af" }}>{fmt(totalAreaActual)}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {btn("Guardar borrador", () => setVista("pm_revision"), "secondary")}
          {btn("✓ Marcar como capturado", () => marcarAreaCapturada(areaActiva), "success")}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA: CU-004 REVISIÓN PM
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "pm_revision") {
    const [comentario, setComentario] = useState ? useState("") : ["", () => {}];

    return (
      <PMRevision
        presupuesto={presupuesto}
        areasSeleccionadas={areasSeleccionadas}
        costosAreas={costosAreas}
        totalArea={totalArea}
        totalCat={totalCat}
        todasCapturadas={todasCapturadas}
        onAbrirArea={id => { setAreaActiva(id); setVista("area_captura"); }}
        onSolicitarCorreccion={solicitarCorreccion}
        onAprobarArea={aprobarArea}
        onConsolidar={consolidar}
        btn={btn}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VISTA: CU-005 CONSOLIDADO
  // ══════════════════════════════════════════════════════════════════════════
  if (vista === "consolidado") {
    return (
      <Consolidado
        presupuesto={presupuesto}
        areasSeleccionadas={areasSeleccionadas}
        costosAreas={costosAreas}
        totalArea={totalArea}
        totalCat={totalCat}
        btn={btn}
        onVolver={() => setVista("pm_revision")}
        onNuevo={() => { setVista("lista"); }}
      />
    );
  }

  return null;
}

// ─── PM REVISION COMPONENT ────────────────────────────────────────────────────
function PMRevision({ presupuesto, areasSeleccionadas, costosAreas, totalArea, totalCat, todasCapturadas, onAbrirArea, onSolicitarCorreccion, onAprobarArea, onConsolidar, btn }) {
  const [comentarios, setComentarios] = useState({});
  const [mostrarForm, setMostrarForm] = useState({});

  const estadoIcono = { pendiente: "⏳", capturado: "📋", revisado: "✅", correccion: "⚠️" };
  const estadoLabel = { pendiente: "Pendiente", capturado: "Listo para revisar", revisado: "Aprobado", correccion: "Corrección solicitada" };
  const estadoColor = { pendiente: "#64748b", capturado: "#d97706", revisado: "#059669", correccion: "#dc2626" };

  const totalGlobal = areasSeleccionadas.reduce((s, id) => s + totalArea(id), 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <StepBar steps={["Info general","Áreas","Captura","Revisión PM","Consolidar"]} current={3} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Revisión de costos</h2>
            <Badge estado={presupuesto?.estado} />
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            CU-004 · {presupuesto?.nombre} · {presupuesto?.cliente}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af" }}>{
            "$" + totalGlobal.toLocaleString("es-MX", { minimumFractionDigits: 2 })
          }</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Total acumulado</div>
        </div>
      </div>

      {/* Tarjetas por área */}
      {areasSeleccionadas.map(id => {
        const area = AREAS_CATALOGO.find(a => a.id === id);
        const costos = costosAreas[id];
        const est = costos?.estado || "pendiente";
        const totalA = totalArea(id);

        return (
          <div key={id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 14, overflow: "hidden" }}>
            {/* Header área */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{area?.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{area?.label}</div>
                  <div style={{ fontSize: 12, color: estadoColor[est] }}>
                    {estadoIcono[est]} {estadoLabel[est]}
                    {costos?.comentario && <span> · "{costos.comentario}"</span>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1e40af" }}>{
                  "$" + totalA.toLocaleString("es-MX", { minimumFractionDigits: 2 })
                }</span>
                <button onClick={() => onAbrirArea(id)} style={{
                  padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe",
                  borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1e40af",
                }}>Editar</button>
              </div>
            </div>

            {/* Desglose por categoría */}
            {est !== "pendiente" && (
              <div style={{ padding: "10px 16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {Object.entries(CATS_AREA).map(([catKey, catDef]) => (
                  <div key={catKey} style={{ background: catDef.bg, border: `1px solid ${catDef.border}`, borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: catDef.color, textTransform: "uppercase" }}>{catDef.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                      {"$" + totalCat(id, catKey).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      {(costosAreas[id]?.[catKey] || []).length} partida(s)
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Acciones del PM */}
            {est === "capturado" && (
              <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, alignItems: "center" }}>
                {mostrarForm[id] ? (
                  <>
                    <input value={comentarios[id] || ""} onChange={e => setComentarios({ ...comentarios, [id]: e.target.value })}
                      placeholder="Describe qué debe corregirse..."
                      style={{ flex: 1, padding: "7px 10px", border: "1px solid #fde047", borderRadius: 6, fontSize: 13 }} />
                    <button onClick={() => { onSolicitarCorreccion(id, comentarios[id] || "Favor de revisar"); setMostrarForm({ ...mostrarForm, [id]: false }); }}
                      style={{ padding: "7px 14px", background: "#fef9c3", color: "#92400e", border: "1px solid #fde047", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                      Enviar corrección
                    </button>
                    <button onClick={() => setMostrarForm({ ...mostrarForm, [id]: false })}
                      style={{ padding: "7px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setMostrarForm({ ...mostrarForm, [id]: true })}
                      style={{ padding: "7px 14px", background: "#fef9c3", color: "#92400e", border: "1px solid #fde047", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                      ⚠ Solicitar corrección
                    </button>
                    <button onClick={() => onAprobarArea(id)}
                      style={{ padding: "7px 14px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                      ✓ Aprobar área
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Estado general */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Estado de captura por área</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {areasSeleccionadas.map(id => {
            const area = AREAS_CATALOGO.find(a => a.id === id);
            const est = costosAreas[id]?.estado || "pendiente";
            return (
              <div key={id} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: est === "revisado" ? "#dcfce7" : est === "capturado" ? "#fef9c3" : est === "correccion" ? "#fee2e2" : "#f1f5f9", color: est === "revisado" ? "#15803d" : est === "capturado" ? "#92400e" : est === "correccion" ? "#dc2626" : "#64748b" }}>
                {area?.icon} {area?.label}: {estadoLabel[est]}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {btn(
          "Consolidar presupuesto →",
          onConsolidar,
          "success",
          !todasCapturadas,
        )}
      </div>
      {!todasCapturadas && (
        <div style={{ textAlign: "right", fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
          Todas las áreas deben estar en estado "Aprobado" o "Listo" para consolidar.
        </div>
      )}
    </div>
  );
}

// ─── CONSOLIDADO COMPONENT ────────────────────────────────────────────────────
function Consolidado({ presupuesto, areasSeleccionadas, costosAreas, totalArea, totalCat, btn, onVolver, onNuevo }) {
  const totalGlobal = areasSeleccionadas.reduce((s, id) => s + totalArea(id), 0);

  // Consolidar por categoría global
  const totalesCat = Object.keys(CATS_AREA).reduce((acc, cat) => {
    acc[cat] = areasSeleccionadas.reduce((s, id) => s + totalCat(id, cat), 0);
    return acc;
  }, {});

  // Todas las partidas consolidadas por categoría
  const partidasConsolidadas = Object.keys(CATS_AREA).reduce((acc, cat) => {
    acc[cat] = areasSeleccionadas.flatMap(id => {
      const area = AREAS_CATALOGO.find(a => a.id === id);
      return (costosAreas[id]?.[cat] || []).map(p => ({ ...p, areaLabel: area?.label, areaIcon: area?.icon }));
    });
    return acc;
  }, {});

  const fmt2 = (n) => "$" + (n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <StepBar steps={["Info general","Áreas","Captura","Revisión PM","Consolidar"]} current={4} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Presupuesto consolidado</h2>
            <Badge estado="CONSOLIDADO" />
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            CU-005 · {presupuesto?.nombre} · {presupuesto?.cliente} · {presupuesto?.tipo}
          </div>
        </div>
        <button onClick={() => window.print()} style={{ padding: "10px 18px", background: "#1e40af", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          ⬇ Exportar
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16, gridColumn: "1 / 2" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total egresos</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1e40af", marginTop: 6 }}>{fmt2(totalGlobal)}</div>
        </div>
        {Object.entries(CATS_AREA).map(([cat, def]) => (
          <div key={cat} style={{ background: def.bg, border: `1px solid ${def.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: def.color, textTransform: "uppercase" }}>{def.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: def.color, marginTop: 6 }}>{fmt2(totalesCat[cat])}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              {((totalesCat[cat] / totalGlobal) * 100 || 0).toFixed(1)}% del total
            </div>
          </div>
        ))}
      </div>

      {/* Tabla consolidada por área */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ background: "#0f172a", color: "white", padding: "12px 16px", fontWeight: 700, fontSize: 15 }}>
          Resumen por área · CU-005 Consolidación
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>Área</td>
              {Object.values(CATS_AREA).map(c => (
                <td key={c.label} style={{ padding: "10px 8px", fontWeight: 700, fontSize: 12, color: c.color, textAlign: "right", textTransform: "uppercase" }}>{c.label}</td>
              ))}
              <td style={{ padding: "10px 16px", fontWeight: 700, fontSize: 12, color: "#0f172a", textAlign: "right", textTransform: "uppercase" }}>Total área</td>
            </tr>
          </thead>
          <tbody>
            {areasSeleccionadas.map((id, i) => {
              const area = AREAS_CATALOGO.find(a => a.id === id);
              return (
                <tr key={id} style={{ background: i % 2 === 0 ? "white" : "#fafafa", borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                    {area?.icon} {area?.label}
                  </td>
                  {Object.keys(CATS_AREA).map(cat => (
                    <td key={cat} style={{ padding: "10px 8px", textAlign: "right" }}>{fmt2(totalCat(id, cat))}</td>
                  ))}
                  <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: "#1e40af" }}>{fmt2(totalArea(id))}</td>
                </tr>
              );
            })}
            <tr style={{ background: "#0f172a", color: "white", fontWeight: 700 }}>
              <td style={{ padding: "12px 16px" }}>TOTAL CONSOLIDADO</td>
              {Object.keys(CATS_AREA).map(cat => (
                <td key={cat} style={{ padding: "12px 8px", textAlign: "right" }}>{fmt2(totalesCat[cat])}</td>
              ))}
              <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 15 }}>{fmt2(totalGlobal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detalle partidas por categoría */}
      {Object.entries(CATS_AREA).map(([catKey, catDef]) => {
        const partidas = partidasConsolidadas[catKey].filter(p => p.monto > 0 || p.desc);
        if (partidas.length === 0) return null;
        return (
          <div key={catKey} style={{ border: `1px solid ${catDef.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ background: catDef.color, padding: "10px 16px", color: "white", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
              <span>{catDef.label}</span>
              <span>{fmt2(totalesCat[catKey])}</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: catDef.bg }}>
                  <td style={{ padding: "8px 16px", fontWeight: 600, fontSize: 12, color: "#64748b" }}>Área</td>
                  <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 12, color: "#64748b" }}>Descripción</td>
                  <td style={{ padding: "8px 8px", fontWeight: 600, fontSize: 12, color: "#64748b", textAlign: "right" }}>Unidad</td>
                  <td style={{ padding: "8px 8px", fontWeight: 600, fontSize: 12, color: "#64748b", textAlign: "right" }}>Cant.</td>
                  <td style={{ padding: "8px 8px", fontWeight: 600, fontSize: 12, color: "#64748b", textAlign: "right" }}>Monto unit.</td>
                  <td style={{ padding: "8px 16px", fontWeight: 600, fontSize: 12, color: "#64748b", textAlign: "right" }}>Total</td>
                </tr>
              </thead>
              <tbody>
                {partidas.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : catDef.bg + "44" }}>
                    <td style={{ padding: "8px 16px", fontSize: 12, color: "#64748b" }}>{p.areaIcon} {p.areaLabel}</td>
                    <td style={{ padding: "8px 12px" }}>{p.desc || <span style={{ color: "#94a3b8" }}>Sin descripción</span>}</td>
                    <td style={{ padding: "8px 8px", textAlign: "right", color: "#64748b" }}>{p.unidad}</td>
                    <td style={{ padding: "8px 8px", textAlign: "right" }}>{p.cantidad}</td>
                    <td style={{ padding: "8px 8px", textAlign: "right" }}>{fmt2(p.monto)}</td>
                    <td style={{ padding: "8px 16px", textAlign: "right", fontWeight: 600 }}>{fmt2((p.cantidad || 0) * (p.monto || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {btn("← Volver a revisión", onVolver, "secondary")}
        <div style={{ display: "flex", gap: 10 }}>
          {btn("🔄 Nuevo presupuesto", onNuevo, "secondary")}
          {btn("✅ Enviar a aprobación →", () => alert("CU-007: En producción esto cambiaría el estado a 'En aprobación' y notificaría a Dirección."), "success")}
        </div>
      </div>
    </div>
  );
}

// Exportar Badge para uso en subcomponentes
function Badge({ estado }) {
  const ESTADOS = {
    BORRADOR:    { label: "Borrador",     color: "#64748b", bg: "#f1f5f9" },
    EN_CAPTURA:  { label: "En captura",   color: "#d97706", bg: "#fffbeb" },
    EN_REVISION: { label: "En revisión",  color: "#0891b2", bg: "#f0f9ff" },
    CONSOLIDADO: { label: "Consolidado",  color: "#7c3aed", bg: "#f5f3ff" },
  };
  const e = ESTADOS[estado] || ESTADOS.BORRADOR;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: e.bg, color: e.color, border: `1px solid ${e.color}33`,
    }}>{e.label}</span>
  );
}
