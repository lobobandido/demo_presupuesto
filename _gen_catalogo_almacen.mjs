import XLSX from 'xlsx';
import fs from 'fs';

const SRC = '/home/adolfo-antonio/Documentos/oficina-dev/documentacion App presupuesto /categorias/Articulos Almacen (3)_todas las categorias.xlsx';
const OUT_DIR = '/home/adolfo-antonio/geolis-presupuestos';

const NOMBRE_GRUPO = {
  "01":"TUBERIAS","02":"CONEXIONES","03":"VALVULAS","04":"BRIDAS",
  "05":"EMPAQUES Y SELLOS","06":"INSTRUMENTACION","07":"ELECTRICIDAD",
  "08":"HERRAMIENTAS","10":"EQUIPOS","11":"MANTENIMIENTO",
  "12":"MATERIALES GENERALES","13":"QUIMICOS","14":"CONSUMIBLES",
  "15":"SEGURIDAD INDUSTRIAL","16":"PINTURA","17":"AISLAMIENTO",
  "18":"CIVIL","19":"TRANSPORTE","20":"COMPUTO Y TELECOMUNICACIONES",
  "21":"MOBILIARIO","30":"TUBERIA PEAD","31":"CONEXIONES PEAD",
  "32":"TUBERIA ESPECIAL","33":"ACCESORIOS ESPECIALES",
  "40":"MEDICION Y CONTROL","41":"SISTEMAS DE BOMBEO",
  "50":"MAQUINARIA Y EQUIPO","60":"VEHICULOS","61":"REFACCIONES VEHICULOS",
  "62":"LLANTAS","63":"LUBRICANTES","70":"PAPELERIA",
  "71":"ARTICULOS DE OFICINA","80":"SERVICIOS","90":"ACTIVOS FIJOS",
  "91":"SOFTWARE","92":"COMUNICACIONES","93":"ALMACEN GENERAL",
  "94":"MATERIALES CAMPO","95":"EQUIPOS CAMPO","96":"INSUMOS OPERATIVOS",
  "97":"INSUMOS OFICINA","98":"ARTICULOS LIMPIEZA","99":"VARIOS",
};
const NOMBRE_SUBGRUPO = {
  "01-01":"ACERO AL CARBON SIN COSTURA","01-02":"ACERO INOXIDABLE SIN COSTURA",
  "01-03":"ALEACION DE ACERO SIN COSTURA","01-04":"ACERO AL CARBON CON COSTURA",
  "01-05":"ACERO INOXIDABLE CON COSTURA","01-06":"TUBING","01-07":"CPVC",
  "01-08":"PEAD","01-09":"R.C.I",
  "02-01":"CODO","02-02":"TEE","02-03":"TAPON","02-04":"REDUCCION","02-05":"SWAGE",
  "02-06":"NIPLE","02-07":"COPLE","02-08":"OLET","02-09":"BRIDA","02-10":"FIGURA 8",
  "02-11":"ESPACIADOR ABIERTO/CIEGO","02-12":"ESPARRAGO/TUERCAS",
  "02-13":"KIT DE AISLAMIENTO","02-14":"FILTRO PARA TUBERIA","02-15":"ACCESORIOS PEAD",
  "02-16":"ACCESORIOS TUBING","02-17":"ORIFICE FITTING","02-18":"CRUZ",
  "02-19":"ACCESORIOS R.C.I","02-20":"TUERCA UNION",
};
function nombreSubgrupo(grupo, subgrupo){
  return NOMBRE_SUBGRUPO[`${grupo}-${subgrupo}`] || `SUBGRUPO ${subgrupo}`;
}

function limpiarDescripcion(desc){
  const fragmentos = String(desc||"").split(",").map(f=>f.trim()).filter(f=>f.length>0);
  const vistos = new Set();
  const limpios = [];
  for (const f of fragmentos){
    const key = f.toUpperCase();
    if (vistos.has(key)) continue;
    vistos.add(key);
    limpios.push(f);
  }
  let resultado = limpios.join(", ");
  if (resultado.length > 150) resultado = resultado.slice(0,150).trim();
  return resultado;
}
function esc(s){ return String(s).replace(/'/g,"''"); }
function pad2(v){ return String(v).trim().padStart(2,"0"); }

// ─── Leer Excel ───────────────────────────────────────────────────────────
const wb = XLSX.readFile(SRC);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Articulos"], {header:1, defval:""}).slice(1);

const articulos = rows
  .filter(r => String(r[0]).trim() !== "")
  .map(r => {
    const grupo = pad2(r[1]);
    const subgrupo = pad2(r[2]);
    return {
      codigo_articulo: String(r[0]).trim(),
      grupo, subgrupo,
      nombre_grupo: NOMBRE_GRUPO[grupo] || `GRUPO ${grupo}`,
      nombre_subgrupo: nombreSubgrupo(grupo, subgrupo),
      descripcion: limpiarDescripcion(r[3]),
      unidad_medida: String(r[5]||"").trim(),
    };
  });

// ─── Selección de 500 representativos ──────────────────────────────────────
const porSubgrupo = new Map(); // "grupo-subgrupo" -> [articulos]
articulos.forEach(a => {
  const k = `${a.grupo}-${a.subgrupo}`;
  if (!porSubgrupo.has(k)) porSubgrupo.set(k, []);
  porSubgrupo.get(k).push(a);
});

const seleccionados = [];
const seleccionadosCodigos = new Set();
const countPorGrupo = {};

// Pasada 1: 1 artículo por subgrupo único (variedad máxima, sin tope aún)
for (const [, lista] of porSubgrupo){
  const a = lista[0];
  seleccionados.push(a);
  seleccionadosCodigos.add(a.codigo_articulo);
  countPorGrupo[a.grupo] = (countPorGrupo[a.grupo]||0) + 1;
}

// Pasada 2: completar hasta 500, máx 15 por grupo, round-robin entre grupos
const CAP_GRUPO = 15;
const OBJETIVO = 500;
const porGrupoTodos = new Map(); // grupo -> [articulos] (candidatos restantes)
articulos.forEach(a => {
  if (!porGrupoTodos.has(a.grupo)) porGrupoTodos.set(a.grupo, []);
  porGrupoTodos.get(a.grupo).push(a);
});
const gruposOrdenados = [...porGrupoTodos.keys()].sort();
const cursor = {}; gruposOrdenados.forEach(g=>cursor[g]=0);

let avanzo = true;
while (seleccionados.length < OBJETIVO && avanzo){
  avanzo = false;
  for (const g of gruposOrdenados){
    if (seleccionados.length >= OBJETIVO) break;
    if ((countPorGrupo[g]||0) >= CAP_GRUPO) continue;
    const candidatos = porGrupoTodos.get(g);
    let idx = cursor[g];
    while (idx < candidatos.length && seleccionadosCodigos.has(candidatos[idx].codigo_articulo)) idx++;
    if (idx >= candidatos.length){ cursor[g]=idx; continue; }
    const a = candidatos[idx];
    seleccionados.push(a);
    seleccionadosCodigos.add(a.codigo_articulo);
    countPorGrupo[g] = (countPorGrupo[g]||0) + 1;
    cursor[g] = idx+1;
    avanzo = true;
  }
}

seleccionados.sort((a,b)=> a.codigo_articulo.localeCompare(b.codigo_articulo));

// ─── Generar SQL ────────────────────────────────────────────────────────────
const header = `CREATE TABLE IF NOT EXISTS catalogo_almacen (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo_articulo  TEXT UNIQUE,
  grupo            TEXT,
  subgrupo         TEXT,
  nombre_grupo     TEXT,
  nombre_subgrupo  TEXT,
  descripcion      TEXT,
  unidad_medida    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE catalogo_almacen ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename='catalogo_almacen' AND policyname='public_all'
  ) THEN
    CREATE POLICY "public_all" ON catalogo_almacen
    FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_catalogo_grupo
  ON catalogo_almacen(grupo);
CREATE INDEX IF NOT EXISTS idx_catalogo_desc
  ON catalogo_almacen USING gin(to_tsvector('spanish', descripcion));

INSERT INTO catalogo_almacen
  (codigo_articulo, grupo, subgrupo, nombre_grupo,
   nombre_subgrupo, descripcion, unidad_medida)
VALUES
`;

const valores = seleccionados.map(a =>
  `  ('${esc(a.codigo_articulo)}', '${esc(a.grupo)}', '${esc(a.subgrupo)}', '${esc(a.nombre_grupo)}', '${esc(a.nombre_subgrupo)}', '${esc(a.descripcion)}', '${esc(a.unidad_medida)}')`
).join(",\n");

const footer = `
ON CONFLICT (codigo_articulo) DO NOTHING;

SELECT nombre_grupo, COUNT(*) as total
FROM catalogo_almacen
GROUP BY nombre_grupo
ORDER BY nombre_grupo;
`;

const sql = header + valores + ";\n" + footer;
fs.writeFileSync(`${OUT_DIR}/catalogo_almacen_500.sql`, sql, 'utf8');

// ─── Generar JSON ───────────────────────────────────────────────────────────
fs.writeFileSync(`${OUT_DIR}/catalogo_almacen_500.json`, JSON.stringify(seleccionados, null, 2), 'utf8');

// ─── Generar stats ──────────────────────────────────────────────────────────
const statsPorGrupo = {};
seleccionados.forEach(a => { statsPorGrupo[a.nombre_grupo] = (statsPorGrupo[a.nombre_grupo]||0)+1; });
const subgruposUnicosCubiertos = new Set(seleccionados.map(a=>`${a.grupo}-${a.subgrupo}`)).size;
const sqlKB = (Buffer.byteLength(sql,'utf8')/1024).toFixed(1);

let stats = `CATALOGO ALMACEN — 500 ARTICULOS REPRESENTATIVOS\n`;
stats += `Fuente: Articulos Almacen (3)_todas las categorias.xlsx (${rows.length} artículos totales, ${porSubgrupo.size} pares grupo-subgrupo únicos)\n`;
stats += `${"=".repeat(60)}\n\n`;
stats += `TOTAL ARTICULOS SELECCIONADOS: ${seleccionados.length}\n`;
stats += `SUBGRUPOS UNICOS CUBIERTOS: ${subgruposUnicosCubiertos} / ${porSubgrupo.size}\n`;
stats += `TAMAÑO DEL SQL GENERADO: ${sqlKB} KB\n\n`;
stats += `ARTICULOS POR GRUPO:\n`;
Object.entries(statsPorGrupo).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([g,c])=>{
  stats += `  ${g.padEnd(32,".")} ${c}\n`;
});
fs.writeFileSync(`${OUT_DIR}/catalogo_stats.txt`, stats, 'utf8');

console.log(`Seleccionados: ${seleccionados.length}`);
console.log(`Subgrupos únicos cubiertos: ${subgruposUnicosCubiertos} / ${porSubgrupo.size}`);
console.log(`SQL: ${sqlKB} KB`);
console.log('Grupos que superan 15 (por variedad garantizada en pasada 1):', Object.entries(countPorGrupo).filter(([,c])=>c>15).map(([g,c])=>`${g}:${c}`).join(', '));
