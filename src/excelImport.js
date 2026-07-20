// ─── IMPORTADOR DE PRESUPUESTOS EXCEL (formato real Geolis) ─────────────────
// Lee la plantilla real de presupuestos (hojas F00 INVERSIÓN, NOMINA/F01 NÓMINA,
// F01 EPP, F01 UNIFORMES, F02 INMUEBLES Y S, F03 COM Y EQ COM, F05 VIÁTICOS,
// F06/F07 MAT-SERV-EQUIPO, F08 INGRESOS) y la convierte en la forma que usa
// la app: {capex, mat, via, nomina, precioFijoEstimado, avisos}.
//
// NO importa F04 VEHÍCULOS Y COMB. (formato por vehículo, no por partida) ni
// archivos tipo "CONCENTRADO" (son reportes multi-proyecto, no un presupuesto
// individual) — ver avisos devueltos.

function normalizarHeader(h) {
  return String(h || "").trim().toUpperCase().replace(/\s+/g, " ");
}

function encontrarFilaHeader(rows, nombresPosibles) {
  const normPosibles = nombresPosibles.map(normalizarHeader);
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const fila = (rows[i] || []).map(normalizarHeader);
    if (normPosibles.some((n) => fila.includes(n))) return i;
  }
  return -1;
}

function mapearColumnas(headerRow, mapeo) {
  const normalizados = (headerRow || []).map(normalizarHeader);
  const resultado = {};
  for (const [campo, nombres] of Object.entries(mapeo)) {
    let idx = -1;
    for (const n of nombres) {
      idx = normalizados.indexOf(normalizarHeader(n));
      if (idx !== -1) break;
    }
    resultado[campo] = idx;
  }
  return resultado;
}

// Encuentra la categoría contable macro más cercana usando el catálogo ya
// definido en App.jsx (CATS_MACRO_CONTABLE / SUBCAT_MAPPING) — mismo criterio
// de coincidencia parcial que ya usa buscarHistorial() en la app.
function mapearCategoria(catRaw, SUBCAT_MAPPING, CATS_MACRO_CONTABLE) {
  const catUp = String(catRaw || "").trim().toUpperCase();
  if (!catUp) return "";
  if (SUBCAT_MAPPING[catUp]) return SUBCAT_MAPPING[catUp];
  if (CATS_MACRO_CONTABLE.some((m) => m.toUpperCase() === catUp)) return catUp;
  let mejor = null, mejorLen = 0;
  for (const [key, macro] of Object.entries(SUBCAT_MAPPING)) {
    if (catUp.includes(key) && key.length > mejorLen) { mejor = macro; mejorLen = key.length; }
  }
  return mejor || String(catRaw).trim(); // sin match: se deja como categoría libre
}

function leerPartidasGenerico(rows, config, SUBCAT_MAPPING, CATS_MACRO_CONTABLE) {
  const headerIdx = encontrarFilaHeader(rows, config.catNames);
  if (headerIdx === -1) return [];
  const cols = mapearColumnas(rows[headerIdx], {
    cat: config.catNames,
    desc: config.descNames || [],
    unidad: config.unidadNames || ["UNIDAD"],
    cantidad: config.cantidadNames || ["CANTIDAD"],
    monto: config.montoNames || ["PU [MN]"],
  });
  if (cols.cat === -1) return [];
  const partidas = [];
  for (let i = headerIdx + 3; i < rows.length; i++) {
    const fila = rows[i];
    if (!fila) continue;
    const catRaw = fila[cols.cat];
    const cantidad = parseFloat(fila[cols.cantidad]) || 0;
    const monto = cols.monto !== -1 ? (parseFloat(fila[cols.monto]) || 0) : 0;
    if (!catRaw || (cantidad === 0 && monto === 0)) continue;
    partidas.push({
      cat: mapearCategoria(catRaw, SUBCAT_MAPPING, CATS_MACRO_CONTABLE),
      desc: cols.desc !== -1 ? String(fila[cols.desc] || "").trim() : String(catRaw).trim(),
      unidad: cols.unidad !== -1 ? (String(fila[cols.unidad] || "").trim() || "Unidad") : "Unidad",
      cantidad: cantidad || 1,
      monto,
    });
  }
  return partidas;
}

function leerNomina(rows) {
  const headerIdx = encontrarFilaHeader(rows, ["RESUMEN"]);
  if (headerIdx === -1) return [];
  const cols = mapearColumnas(rows[headerIdx], {
    puesto: ["PUESTO"], cantidad: ["CANTIDAD"], salario: ["SALARIO"], impuestos: ["IMPUESTOS"],
  });
  if (cols.salario === -1) return [];
  const puestos = [];
  for (let i = headerIdx + 3; i < rows.length; i++) {
    const fila = rows[i];
    if (!fila) continue;
    const salario = parseFloat(fila[cols.salario]) || 0;
    const puesto = cols.puesto !== -1 ? String(fila[cols.puesto] || "").trim() : "";
    if (!salario || !puesto) continue;
    // El Excel trae un factor combinado (IMSS+prestaciones+ISR juntos, ej. 0.8)
    // en vez de separado por concepto — se coloca completo en "prestaciones"
    // para que el costo total real no cambie, aunque el desglose no sea idéntico.
    const factor = cols.impuestos !== -1 ? (parseFloat(fila[cols.impuestos]) || 0) : 0.77;
    puestos.push({
      puesto: puesto || "Puesto",
      cantidad: parseFloat(fila[cols.cantidad]) || 1,
      salario,
      imss: 0, prestaciones: factor, isr: 0,
    });
  }
  return puestos;
}

const HOJAS_CAPEX = ["F00 INVERSIÓN", "F00 INVERSION"];
const HOJAS_NOMINA = ["NOMINA", "NÓMINA", "F01 NÓMINA", "F01 NOMINA"];
const HOJAS_MAT_SIMPLE = ["F01 EPP", "F01 UNIFORMES", "F02 INMUEBLES Y S", "F03 COM Y EQ COM"];
const HOJAS_MAT_DOBLE = ["F06 (MAT,SERV & EQUIPO)", "F07 OPERAC. (MAT,SERV & EQUIPO)"];
const HOJAS_VIA = ["F05 VIÁTICOS", "F05 VIATICOS"];
const HOJAS_INGRESOS = ["F08 INGRESOS"];
const HOJAS_VEHICULOS = ["F04 VEHÍCULOS Y COMB. ", "F04 VEHICULOS Y COMB. ", "F04 VEHÍCULOS Y COMB.", "F04 VEHICULOS Y COMB."];

export function esArchivoConcentrado(workbook) {
  // Los archivos "CONCENTRADO" son reportes multi-proyecto, no un presupuesto
  // individual — no tienen ninguna de las hojas estándar F00/F01/etc.
  const hojas = workbook.SheetNames;
  return !HOJAS_CAPEX.concat(HOJAS_NOMINA, HOJAS_MAT_SIMPLE, HOJAS_MAT_DOBLE, HOJAS_VIA)
    .some((h) => hojas.includes(h));
}

export function parsearPresupuestoExcel(workbook, XLSX, { SUBCAT_MAPPING, CATS_MACRO_CONTABLE }) {
  const avisos = [];
  const hojasDisponibles = workbook.SheetNames;
  const leerHoja = (nombre) => {
    const ws = workbook.Sheets[nombre];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  };

  if (esArchivoConcentrado(workbook)) {
    return { capex: [], mat: [], via: [], nomina: [], precioFijoEstimado: 0,
      avisos: ["Este archivo parece un CONCENTRADO (reporte multi-proyecto), no un presupuesto individual — no se importó."],
      esConcentrado: true };
  }

  let capex = [];
  const hojaCapex = HOJAS_CAPEX.find((h) => hojasDisponibles.includes(h));
  if (hojaCapex) {
    capex = leerPartidasGenerico(leerHoja(hojaCapex), {
      catNames: ["RESUMEN"], descNames: ["DESCRIPCIÓN 1", "DESCRIPCION 1"],
      unidadNames: ["UNIDAD"], cantidadNames: ["CANTIDAD"], montoNames: ["PU [MN]"],
    }, SUBCAT_MAPPING, CATS_MACRO_CONTABLE);
  } else avisos.push("No se encontró hoja de inversión (F00 INVERSIÓN) — sin datos de CAPEX.");

  let nomina = [];
  const hojaNomina = HOJAS_NOMINA.find((h) => hojasDisponibles.includes(h));
  if (hojaNomina) nomina = leerNomina(leerHoja(hojaNomina));
  else avisos.push("No se encontró hoja de nómina — sin datos de nómina.");

  let mat = [];
  HOJAS_MAT_SIMPLE.forEach((h) => {
    if (hojasDisponibles.includes(h)) {
      mat = mat.concat(leerPartidasGenerico(leerHoja(h), {
        catNames: ["RESUMEN"], descNames: ["NOMBRE", "CONCEPTO"],
        unidadNames: ["UNIDAD"], cantidadNames: ["CANTIDAD"], montoNames: ["PU [MN]"],
      }, SUBCAT_MAPPING, CATS_MACRO_CONTABLE));
    }
  });
  HOJAS_MAT_DOBLE.forEach((h) => {
    if (hojasDisponibles.includes(h)) {
      mat = mat.concat(leerPartidasGenerico(leerHoja(h), {
        catNames: ["RESUMEN 1"], descNames: ["RESUMEN 2"],
        unidadNames: ["UNIDAD"], cantidadNames: ["CANTIDAD", "CANTIDAD "], montoNames: ["PU [MN]"],
      }, SUBCAT_MAPPING, CATS_MACRO_CONTABLE));
    }
  });

  let via = [];
  const hojaVia = HOJAS_VIA.find((h) => hojasDisponibles.includes(h));
  if (hojaVia) {
    via = leerPartidasGenerico(leerHoja(hojaVia), {
      catNames: ["RESUMEN"], descNames: [],
      unidadNames: ["UNIDAD"], cantidadNames: ["CANTIDAD"], montoNames: ["PU [MN]"],
    }, SUBCAT_MAPPING, CATS_MACRO_CONTABLE);
  }

  let precioFijoEstimado = 0;
  const hojaIngresos = HOJAS_INGRESOS.find((h) => hojasDisponibles.includes(h));
  if (hojaIngresos) {
    const filasIngreso = leerPartidasGenerico(leerHoja(hojaIngresos), {
      catNames: ["RESUMEN"], descNames: ["CONCEPTO"],
      unidadNames: ["UNIDAD"], cantidadNames: ["CANTIDAD"], montoNames: ["TOTAL [MN]"],
    }, SUBCAT_MAPPING, CATS_MACRO_CONTABLE);
    const totalAnual = filasIngreso.reduce((s, p) => s + p.cantidad * p.monto, 0);
    if (totalAnual > 0) {
      precioFijoEstimado = Math.round((totalAnual / 12) * 100) / 100;
      avisos.push(`Ingresos: se estimó un precio fijo mensual de $${precioFijoEstimado.toLocaleString("es-MX")} a partir de F08 INGRESOS — revisa y ajusta manualmente en el Resumen.`);
    }
  }

  if (HOJAS_VEHICULOS.some((h) => hojasDisponibles.includes(h))) {
    avisos.push("F04 VEHÍCULOS Y COMB. tiene un formato distinto (por vehículo) — no se importó automáticamente. Agrégalo manualmente en OPEX Materiales si aplica.");
  }

  if (capex.length + mat.length + via.length + nomina.length === 0) {
    avisos.push("No se encontraron partidas reconocibles en este archivo — revisa el formato.");
  }

  return { capex, mat, via, nomina, precioFijoEstimado, avisos, esConcentrado: false };
}
