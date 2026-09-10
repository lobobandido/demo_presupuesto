// Genera los .sql de carga del codificador oficial de almacén a partir de los CSV
// de docs/catalogo/, y (desde el 2026-09-10) valida y carga por REST el maestro
// completo de artículos. Solo INSERT: ni DELETE, ni UPDATE, ni DROP, ni TRUNCATE,
// ni ALTER, en ningún modo. No toca catalogo_almacen ni catalogo_subgrupos.
//
// MODOS
//   node scripts/gen-carga-catalogo.mjs
//       Modo original: lee los dos CSV chicos y escribe
//       scripts/carga_catalogo_subgrupos.sql y scripts/carga_catalogo_articulos.sql.
//       No toca Supabase.
//
//   node scripts/gen-carga-catalogo.mjs --maestro <dir>
//       Lee docs/catalogo/catalogo-articulos-completo.csv (16,668 artículos),
//       baja catalogo_subgrupos por GET y valida que TODOS los pares
//       (grupo, subgrupo) existan. Si falla uno, no escribe nada. Si pasa,
//       escribe lotes de 1,000 renglones como JSON en <dir> (fuera del repo),
//       más <dir>/resumen.json. No escribe en Supabase.
//
//   node scripts/gen-carga-catalogo.mjs --cargar <dir> --si-autorizado
//       Carga los lotes de <dir> con POST a /rest/v1/catalogo_articulos
//       ?on_conflict=codigo_articulo y Prefer: resolution=ignore-duplicates.
//       Idempotente por el unique de codigo_articulo. Si un lote falla, se
//       DETIENE en ese lote (sin reintentar) y deja <dir>/carga.log con lo
//       que entró. Exige --si-autorizado a propósito: esto SÍ escribe en
//       Supabase. No es una prueba: es una carga de datos ordenada, idempotente,
//       sobre una tabla que hoy la app no lee (ver regla 1 de CLAUDE.md y su
//       precisión del 2026-09-10).
//
// Los CSV vienen con BOM (utf-8-sig) y CRLF; hay campos entre comillas dobles
// con comas y saltos de línea adentro y comillas dobles duplicadas ("" = una
// comilla). Las comillas simples se escapan duplicándolas en el modo SQL.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSV_SUBGRUPOS = path.join(RAIZ, 'docs/catalogo/catalogo-grupos-subgrupos.csv');
const CSV_ARTICULOS = path.join(RAIZ, 'docs/catalogo/catalogo-articulos-servicios.csv');
const CSV_MAESTRO   = path.join(RAIZ, 'docs/catalogo/catalogo-articulos-completo.csv');
const OUT_SUBGRUPOS = path.join(RAIZ, 'scripts/carga_catalogo_subgrupos.sql');
const OUT_ARTICULOS = path.join(RAIZ, 'scripts/carga_catalogo_articulos.sql');
const TAM_LOTE = 1000;

// ── CSV → objetos (RFC 4180 mínimo: comillas, comas, saltos y "" dentro de comillas) ──
function leerCsv(ruta){
  let texto = fs.readFileSync(ruta, 'utf8');
  if (texto.charCodeAt(0) === 0xFEFF) texto = texto.slice(1);       // BOM
  texto = texto.replace(/\r\n?/g, '\n');                              // CRLF → LF
  const filas = [];
  let fila = [], campo = '', enComillas = false;
  for (let i = 0; i < texto.length; i++){
    const c = texto[i];
    if (enComillas){
      if (c === '"'){
        if (texto[i+1] === '"'){ campo += '"'; i++; }               // "" → "
        else enComillas = false;
      } else campo += c;                                              // incluye \n
    } else if (c === '"'){ enComillas = true; }
    else if (c === ','){ fila.push(campo); campo = ''; }
    else if (c === '\n'){ fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else campo += c;
  }
  if (campo !== '' || fila.length > 0){ fila.push(campo); filas.push(fila); }
  const [enc, ...datos] = filas.filter(f => f.some(v => v.trim() !== ''));
  const cabeceras = enc.map(h => h.trim());
  return datos.map((f, n) => {
    if (f.length !== cabeceras.length)
      throw new Error(`${path.basename(ruta)} renglón ${n+2}: ${f.length} columnas, se esperaban ${cabeceras.length}`);
    return Object.fromEntries(cabeceras.map((h, i) => [h, f[i].trim()]));
  });
}

const esc = s => String(s).replace(/'/g, "''");
const lit = s => (s === '' || s == null) ? 'NULL' : `'${esc(s)}'`;
const hoy = new Date().toISOString().slice(0, 10);

// Guardarraíl: nada que no sea INSERT/SELECT sale de este script.
function exigirSoloInsert(nombre, sql){
  const sinComentarios = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  if (/\b(delete|update|drop|truncate|alter)\b/i.test(sinComentarios))
    throw new Error(`el SQL de ${nombre} trae una sentencia que no es INSERT — no se escribe`);
}

// ── Supabase (lee .env a mano; sin dependencias) ─────────────────────────────
function leerEnv(){
  const env = {};
  for (const linea of fs.readFileSync(path.join(RAIZ, '.env'), 'utf8').split('\n')){
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) throw new Error('.env sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  return env;
}
function cabecerasSupabase(env, extra = {}){
  return { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`, ...extra };
}
async function getTodos(env, tabla, select){
  // Paginado por Range para no depender del tope de filas de PostgREST.
  const todos = [];
  for (let desde = 0; ; desde += 1000){
    const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${tabla}?select=${select}`,
      { headers: cabecerasSupabase(env, { Range: `${desde}-${desde + 999}` }) });
    if (!r.ok) throw new Error(`GET ${tabla}: HTTP ${r.status} ${await r.text()}`);
    const pagina = await r.json();
    todos.push(...pagina);
    if (pagina.length < 1000) break;
  }
  return todos;
}
async function contar(env, tabla, filtro = ''){
  const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${tabla}?select=id${filtro}`,
    { method: 'HEAD', headers: cabecerasSupabase(env, { Prefer: 'count=exact', Range: '0-0' }) });
  const cr = r.headers.get('content-range') || '';
  return Number(cr.split('/')[1]);
}

// ── Validación común de artículos contra la estructura ───────────────────────
function validarArticulos(articulos, subgrupos, { conNombres }){
  const claves = new Map(subgrupos.map(s => [`${s.grupo}-${s.subgrupo}`, s]));
  const codigos = new Set();
  let ok = 0;
  const faltan = [];
  for (const a of articulos){
    for (const k of ['codigo_articulo','grupo','subgrupo','descripcion'])
      if (!a[k]) throw new Error(`artículo sin ${k}: ${JSON.stringify(a)}`);
    if (codigos.has(a.codigo_articulo)) throw new Error(`codigo_articulo repetido en el CSV: ${a.codigo_articulo}`);
    codigos.add(a.codigo_articulo);
    const s = claves.get(`${a.grupo}-${a.subgrupo}`);
    if (!s){ faltan.push(a); continue; }
    if (conNombres && (s.nombre_grupo !== a.nombre_grupo || s.nombre_subgrupo !== a.nombre_subgrupo))
      throw new Error(`artículo ${a.codigo_articulo}: nombres distintos a la estructura (${s.nombre_grupo}/${s.nombre_subgrupo} vs ${a.nombre_grupo}/${a.nombre_subgrupo})`);
    ok++;
  }
  return { ok, faltan };
}

// ═════════════════════════════════════════════════════════════════════════════
// MODO ORIGINAL — los dos .sql
// ═════════════════════════════════════════════════════════════════════════════
function modoSql(){
  const subgrupos = leerCsv(CSV_SUBGRUPOS);
  {
    const claves = new Set();
    for (const s of subgrupos){
      for (const k of ['grupo','nombre_grupo','subgrupo','nombre_subgrupo'])
        if (!s[k]) throw new Error(`subgrupo sin ${k}: ${JSON.stringify(s)}`);
      const clave = `${s.grupo}-${s.subgrupo}`;
      if (claves.has(clave)) throw new Error(`(grupo, subgrupo) repetido en el CSV: ${clave}`);
      claves.add(clave);
    }
  }
  const gruposSub = new Set(subgrupos.map(s => s.grupo));

  let sqlSub = `-- carga_catalogo_subgrupos.sql — generado el ${hoy} por scripts/gen-carga-catalogo.mjs
-- Fuente: docs/catalogo/catalogo-grupos-subgrupos.csv (${subgrupos.length} subgrupos, ${gruposSub.size} grupos).
-- SOLO INSERT. No toca catalogo_almacen ni ninguna otra tabla.
-- Estructura del codificador oficial de almacén (grupos y subgrupos), separada de
-- los artículos: de materiales todavía no hay detalle de artículo, así que sus
-- ${subgrupos.filter(s => s.grupo < '90').length} subgrupos solo existen aquí.
-- rubro_contable y subcuenta_contable van NULL a propósito: los llena contabilidad
-- cuando devuelva docs/catalogo/mapeo-almacen-contable.csv.
-- Requiere que la tabla catalogo_subgrupos ya exista (PASO 1). Idempotente por la
-- unique (grupo, subgrupo): si un renglón ya está, se deja como está.

insert into catalogo_subgrupos
  (grupo, nombre_grupo, subgrupo, nombre_subgrupo, unidad_medida)
values
`;
  sqlSub += subgrupos.map(s =>
    `  (${lit(s.grupo)}, ${lit(s.nombre_grupo)}, ${lit(s.subgrupo)}, ${lit(s.nombre_subgrupo)}, ${lit(s.unidad_medida)})`
  ).join(',\n');
  sqlSub += `
on conflict (grupo, subgrupo) do nothing;

-- Verificación esperada: ${subgrupos.length} y ${gruposSub.size}
select count(*) as subgrupos, count(distinct grupo) as grupos from catalogo_subgrupos;
`;

  const articulos = leerCsv(CSV_ARTICULOS);
  for (const a of articulos){
    for (const k of ['nombre_grupo','nombre_subgrupo']) if (!a[k]) throw new Error(`artículo sin ${k}: ${JSON.stringify(a)}`);
    if (a.grupo < '90') throw new Error(`artículo de materiales inesperado (grupo ${a.grupo}): ${a.codigo_articulo}`);
  }
  const { faltan } = validarArticulos(articulos, subgrupos, { conNombres: true });
  if (faltan.length) throw new Error(`artículos con subgrupo fuera de la estructura: ${faltan.map(a => a.codigo_articulo).join(', ')}`);
  const gruposArt = new Set(articulos.map(a => a.grupo));

  let sqlArt = `-- carga_catalogo_articulos.sql — generado el ${hoy} por scripts/gen-carga-catalogo.mjs
-- Fuente: docs/catalogo/catalogo-articulos-servicios.csv (${articulos.length} artículos, grupos ${[...gruposArt].sort().join(', ')}).
-- SOLO INSERT en la tabla NUEVA catalogo_articulos. No toca catalogo_almacen
-- (sus 500 registros de semilla quedan intactos) ni ninguna otra tabla.
-- Todos los artículos son de servicios (grupos 90-99): de materiales todavía no
-- hay detalle y eso es correcto. Los nombres de grupo/subgrupo no van aquí:
-- se resuelven por (grupo, subgrupo) contra catalogo_subgrupos.
-- Requiere que la tabla catalogo_articulos ya exista (PASO 1). Idempotente por el
-- unique de codigo_articulo: si un renglón ya está, se deja como está.

insert into catalogo_articulos
  (codigo_articulo, grupo, subgrupo, descripcion, unidad_medida)
values
`;
  sqlArt += articulos.map(a =>
    `  (${lit(a.codigo_articulo)}, ${lit(a.grupo)}, ${lit(a.subgrupo)}, ${lit(a.descripcion)}, ${lit(a.unidad_medida)})`
  ).join(',\n');
  sqlArt += `
on conflict (codigo_articulo) do nothing;

-- Verificación esperada: ${articulos.length}
select count(*) as articulos from catalogo_articulos;
`;

  exigirSoloInsert('subgrupos', sqlSub);
  exigirSoloInsert('articulos', sqlArt);
  fs.writeFileSync(OUT_SUBGRUPOS, sqlSub, 'utf8');
  fs.writeFileSync(OUT_ARTICULOS, sqlArt, 'utf8');

  console.log(`subgrupos: ${subgrupos.length} renglones, ${gruposSub.size} grupos → ${path.relative(RAIZ, OUT_SUBGRUPOS)}`);
  console.log(`artículos: ${articulos.length} renglones, ${gruposArt.size} grupos (${[...gruposArt].sort().join(',')}) → ${path.relative(RAIZ, OUT_ARTICULOS)}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// MODO --maestro <dir> — valida el maestro completo y escribe lotes JSON
// ═════════════════════════════════════════════════════════════════════════════
async function modoMaestro(dir){
  if (!dir) throw new Error('--maestro necesita el directorio de salida (fuera del repo)');
  if (path.resolve(dir).startsWith(RAIZ + path.sep)) throw new Error('los lotes van FUERA del repo');
  const env = leerEnv();
  const articulos = leerCsv(CSV_MAESTRO);
  const subgrupos = await getTodos(env, 'catalogo_subgrupos', 'grupo,subgrupo,nombre_grupo,nombre_subgrupo');
  console.log(`CSV maestro: ${articulos.length} artículos · catalogo_subgrupos por GET: ${subgrupos.length} pares`);

  const { ok, faltan } = validarArticulos(articulos, subgrupos, { conNombres: false });
  console.log(`pares (grupo, subgrupo) que existen en catalogo_subgrupos: ${ok} de ${articulos.length}`);
  if (faltan.length){
    console.error(`FALLA: ${faltan.length} artículos cuelgan de pares que NO están en catalogo_subgrupos. No se escribe nada.`);
    const porPar = {};
    faltan.forEach(a => { const k = `${a.grupo}-${a.subgrupo}`; porPar[k] = (porPar[k] || 0) + 1; });
    console.error(Object.entries(porPar).map(([k, n]) => `${k}:${n}`).join(' '));
    process.exit(2);
  }

  fs.mkdirSync(dir, { recursive: true });
  const filas = articulos.map(a => ({
    codigo_articulo: a.codigo_articulo, grupo: a.grupo, subgrupo: a.subgrupo,
    descripcion: a.descripcion, unidad_medida: a.unidad_medida || null,
  }));
  const lotes = [];
  for (let i = 0; i < filas.length; i += TAM_LOTE){
    const n = String(lotes.length + 1).padStart(2, '0');
    const archivo = path.join(dir, `lote_${n}.json`);
    fs.writeFileSync(archivo, JSON.stringify(filas.slice(i, i + TAM_LOTE)), 'utf8');
    lotes.push({ archivo: path.basename(archivo), renglones: Math.min(TAM_LOTE, filas.length - i) });
  }
  const pares = new Set(filas.map(f => `${f.grupo}-${f.subgrupo}`));
  const resumen = {
    fecha: hoy, fuente: path.relative(RAIZ, CSV_MAESTRO), articulos: filas.length,
    materiales: filas.filter(f => f.grupo < '90').length, servicios: filas.filter(f => f.grupo >= '90').length,
    pares_distintos: pares.size, lotes,
  };
  fs.writeFileSync(path.join(dir, 'resumen.json'), JSON.stringify(resumen, null, 2), 'utf8');
  console.log(`lotes escritos en ${dir}: ${lotes.length} × hasta ${TAM_LOTE} · materiales ${resumen.materiales} · servicios ${resumen.servicios} · pares distintos ${pares.size}`);
}

// ═════════════════════════════════════════════════════════════════════════════
// MODO --cargar <dir> --si-autorizado — POST por lotes, sin reintentos
// ═════════════════════════════════════════════════════════════════════════════
async function modoCargar(dir, autorizado){
  if (!dir) throw new Error('--cargar necesita el directorio de lotes');
  if (!autorizado) throw new Error('--cargar escribe en Supabase: exige --si-autorizado (autorización explícita del usuario para ESTA carga)');
  const env = leerEnv();
  const resumen = JSON.parse(fs.readFileSync(path.join(dir, 'resumen.json'), 'utf8'));
  const log = path.join(dir, 'carga.log');
  const escribirLog = l => { fs.appendFileSync(log, l + '\n'); console.log(l); };

  const antes = await contar(env, 'catalogo_articulos');
  const almacenAntes = await contar(env, 'catalogo_almacen');
  escribirLog(`[${new Date().toISOString()}] inicio · catalogo_articulos antes=${antes} · catalogo_almacen=${almacenAntes} · lotes=${resumen.lotes.length}`);

  // Única URL y único método de todo el script que escribe. on_conflict va en la
  // URL porque el unique está en codigo_articulo, no en la llave primaria.
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/catalogo_articulos?on_conflict=codigo_articulo`;
  let enviados = 0;
  for (const lote of resumen.lotes){
    const filas = JSON.parse(fs.readFileSync(path.join(dir, lote.archivo), 'utf8'));
    for (const f of filas)
      if (!f.codigo_articulo || !f.grupo || !f.subgrupo || !f.descripcion) throw new Error(`${lote.archivo}: renglón incompleto ${JSON.stringify(f)}`);
    const r = await fetch(url, {
      method: 'POST',
      headers: cabecerasSupabase(env, { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=minimal' }),
      body: JSON.stringify(filas),
    });
    if (!r.ok){
      const cuerpo = await r.text();
      const ahora = await contar(env, 'catalogo_articulos');
      escribirLog(`[${new Date().toISOString()}] FALLO en ${lote.archivo}: HTTP ${r.status} ${cuerpo.slice(0, 500)}`);
      escribirLog(`  lotes enviados OK antes del fallo: ${enviados} · catalogo_articulos ahora=${ahora} (antes=${antes}) · NO se reintenta`);
      process.exit(3);
    }
    enviados++;
    escribirLog(`[${new Date().toISOString()}] ${lote.archivo}: HTTP ${r.status} · ${filas.length} renglones enviados`);
  }
  const despues = await contar(env, 'catalogo_articulos');
  const almacenDespues = await contar(env, 'catalogo_almacen');
  escribirLog(`[${new Date().toISOString()}] fin · lotes OK=${enviados}/${resumen.lotes.length} · catalogo_articulos antes=${antes} después=${despues} (entraron ${despues - antes}) · catalogo_almacen=${almacenDespues}`);
}

// ── main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
try {
  if (args.includes('--maestro'))      await modoMaestro(arg('--maestro'));
  else if (args.includes('--cargar'))  await modoCargar(arg('--cargar'), args.includes('--si-autorizado'));
  else modoSql();
} catch (e) { console.error('ERROR:', e.message); process.exit(1); }
