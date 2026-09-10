// Genera los dos .sql de carga del codificador oficial de almacén a partir de
// los CSV de docs/catalogo/. NO toca Supabase: solo lee CSV y escribe SQL.
// Los .sql resultantes llevan ÚNICAMENTE sentencias INSERT (ni DELETE, ni
// UPDATE, ni DROP): cargan las dos tablas NUEVAS catalogo_subgrupos y
// catalogo_articulos, y no tocan catalogo_almacen ni sus 500 registros.
//
//   node scripts/gen-carga-catalogo.mjs
//
// Entrada:
//   docs/catalogo/catalogo-grupos-subgrupos.csv    (estructura: 342 subgrupos, 44 grupos)
//   docs/catalogo/catalogo-articulos-servicios.csv (artículos: 233, todos de servicios 90-99)
// Salida:
//   scripts/carga_catalogo_subgrupos.sql  → INSERT en catalogo_subgrupos
//   scripts/carga_catalogo_articulos.sql  → INSERT en catalogo_articulos
//
// Los CSV vienen con BOM (utf-8-sig) y CRLF; hay campos entre comillas dobles
// con comas adentro y comillas dobles duplicadas ("" = una comilla). Las
// comillas simples de los nombres se escapan duplicándolas para SQL.
// 2026-09-10.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSV_SUBGRUPOS = path.join(RAIZ, 'docs/catalogo/catalogo-grupos-subgrupos.csv');
const CSV_ARTICULOS = path.join(RAIZ, 'docs/catalogo/catalogo-articulos-servicios.csv');
const OUT_SUBGRUPOS = path.join(RAIZ, 'scripts/carga_catalogo_subgrupos.sql');
const OUT_ARTICULOS = path.join(RAIZ, 'scripts/carga_catalogo_articulos.sql');

// ── CSV → objetos (RFC 4180 mínimo: comillas, comas y "" dentro de comillas) ──
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
      } else campo += c;
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

// ── Subgrupos ────────────────────────────────────────────────────────────────
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

// ── Artículos ────────────────────────────────────────────────────────────────
const articulos = leerCsv(CSV_ARTICULOS);
{
  const codigos = new Set();
  for (const a of articulos){
    for (const k of ['codigo_articulo','grupo','nombre_grupo','subgrupo','nombre_subgrupo','descripcion'])
      if (!a[k]) throw new Error(`artículo sin ${k}: ${JSON.stringify(a)}`);
    if (codigos.has(a.codigo_articulo)) throw new Error(`codigo_articulo repetido: ${a.codigo_articulo}`);
    codigos.add(a.codigo_articulo);
    if (a.grupo < '90') throw new Error(`artículo de materiales inesperado (grupo ${a.grupo}): ${a.codigo_articulo}`);
    // Cada artículo debe colgar de un subgrupo que exista en la estructura,
    // con el mismo nombre de grupo y de subgrupo (los nombres NO se insertan en
    // catalogo_articulos — viven en catalogo_subgrupos — pero se validan aquí).
    const s = subgrupos.find(x => x.grupo === a.grupo && x.subgrupo === a.subgrupo);
    if (!s) throw new Error(`artículo ${a.codigo_articulo} apunta a subgrupo ${a.grupo}-${a.subgrupo} que no está en la estructura`);
    if (s.nombre_grupo !== a.nombre_grupo || s.nombre_subgrupo !== a.nombre_subgrupo)
      throw new Error(`artículo ${a.codigo_articulo}: nombres distintos a la estructura (${s.nombre_grupo}/${s.nombre_subgrupo} vs ${a.nombre_grupo}/${a.nombre_subgrupo})`);
  }
}
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

// Guardarraíl: los archivos generados no deben llevar nada que no sea INSERT/SELECT.
for (const [nombre, sql] of [['subgrupos', sqlSub], ['articulos', sqlArt]]){
  const sinComentarios = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  if (/\b(delete|update|drop|truncate|alter)\b/i.test(sinComentarios))
    throw new Error(`el SQL de ${nombre} trae una sentencia que no es INSERT — no se escribe`);
}

fs.writeFileSync(OUT_SUBGRUPOS, sqlSub, 'utf8');
fs.writeFileSync(OUT_ARTICULOS, sqlArt, 'utf8');

console.log(`subgrupos: ${subgrupos.length} renglones, ${gruposSub.size} grupos → ${path.relative(RAIZ, OUT_SUBGRUPOS)}`);
console.log(`artículos: ${articulos.length} renglones, ${gruposArt.size} grupos (${[...gruposArt].sort().join(',')}) → ${path.relative(RAIZ, OUT_ARTICULOS)}`);
console.log(`con comilla simple: subgrupos=${subgrupos.filter(s => /'/.test(Object.values(s).join())).length}, artículos=${articulos.filter(a => /'/.test(Object.values(a).join())).length}`);
