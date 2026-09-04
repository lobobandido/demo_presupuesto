#!/usr/bin/env node
// Genera src/catalogoContable.js a partir de docs/catalogo_contable_2027.csv.
//
// POR QUÉ EXISTE: el CSV es la fuente de verdad del mapeo subcuenta → rubro, y
// viene de finanzas. Pero vive en docs/, fuera de src/, así que el bundle no lo
// puede leer: por eso el mapeo se transcribía a mano en SUBCAT_MAPPING y se
// quedó atrás — 137 subcuentas en el CSV contra 74 entradas transcritas, y 91
// categorías del menú cayendo en SIN CATEGORÍA aunque el CSV ya dijera su rubro.
// Este script cierra ese hueco sin transcribir nada a mano.
//
//   node scripts/gen-catalogo-contable.mjs           regenera el módulo
//   node scripts/gen-catalogo-contable.mjs --check   verifica que esté al día
//                                                    (sale con código 1 si no)
//
// El modo --check es el que evita que se vuelvan a desincronizar: compara byte
// por byte lo que el CSV produciría contra lo que hay en src/, sin escribir.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSV = path.join(RAIZ, "docs/catalogo_contable_2027.csv");
const DESTINO = path.join(RAIZ, "src/catalogoContable.js");

// El CSV trae subcuentas con coma dentro, entrecomilladas
// ("LLANTAS, CAMARAS Y ACCESORIOS"): un split(",") pelado las parte en dos.
function campos(linea) {
  const out = []; let cur = "", dentro = false;
  for (const ch of linea) {
    if (ch === '"') { dentro = !dentro; continue; }
    if (ch === "," && !dentro) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

const filas = fs.readFileSync(CSV, "utf8").split("\n").slice(1)
  .filter(l => l.trim() && !l.startsWith("#"))
  .map(campos)
  .filter(([rubro, sub]) => rubro && sub);

// Duplicados exactos: el CSV trae FIANZAS dos veces, las dos bajo SERVICIOS.
// Se conserva la primera aparición; el conteo se reporta para que no pase
// desapercibido si algún día aparece un duplicado con rubros distintos.
const vistas = new Map();
const conflictos = [];
for (const [rubro, sub] of filas) {
  const k = sub.toUpperCase();
  if (vistas.has(k)) {
    if (vistas.get(k).rubro !== rubro) conflictos.push({ sub, a: vistas.get(k).rubro, b: rubro });
    continue;
  }
  vistas.set(k, { sub, rubro });
}
if (conflictos.length) {
  console.error("El CSV tiene subcuentas repetidas con RUBROS DISTINTOS. Eso hay que resolverlo en finanzas antes de generar:");
  conflictos.forEach(c => console.error(`   "${c.sub}": ${c.a}  vs  ${c.b}`));
  process.exit(1);
}
const subcuentas = [...vistas.values()];
const rubros = [...new Set(filas.map(([r]) => r))];

const ancho = Math.max(...subcuentas.map(s => s.sub.length)) + 3;
const cuerpo = subcuentas
  .map(s => `  [${JSON.stringify(s.sub).padEnd(ancho)}, ${JSON.stringify(s.rubro)}],`)
  .join("\n");

const salida = `// ARCHIVO GENERADO — NO EDITAR A MANO.
//
// Fuente: docs/catalogo_contable_2027.csv (${filas.length} filas · ${subcuentas.length} subcuentas
// distintas · ${rubros.length} rubros). Ese CSV viene de finanzas y es LA fuente de
// verdad del mapeo subcuenta → rubro contable.
//
// Para regenerarlo, después de que finanzas actualice el CSV:
//     node scripts/gen-catalogo-contable.mjs
// Para verificar que está al día (falla si el CSV cambió y esto no):
//     node scripts/gen-catalogo-contable.mjs --check
//
// POR QUÉ ESTE ARCHIVO EXISTE: el CSV vive en docs/, fuera de src/, así que el
// bundle no lo puede importar. Antes el mapeo se transcribía a mano en
// SUBCAT_MAPPING y se quedó atrás: 91 categorías del menú caían en SIN CATEGORÍA
// aunque el CSV ya dijera a qué rubro pertenecen. Generarlo elimina la
// transcripción y con ella la posibilidad de que se vuelvan a despegar.
//
// El orden es el del CSV, que es el del Excel de la contadora. No alfabetizar.

export const SUBCUENTAS_CONTABLES = [
${cuerpo}
];

// Comparación normalizada: ignora mayúsculas, acentos y espacios sobrantes,
// igual que normCat en App.jsx. Los dropdowns están acentuados ("VIÁTICOS") y
// el catálogo no ("VIATICOS"); sin esto, elegir una opción del propio menú de la
// app la mandaría a SIN CATEGORÍA.
function norm(s){
  return (s||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"")
    .toUpperCase().replace(/\\s+/g," ").trim();
}
const POR_NORM = new Map(SUBCUENTAS_CONTABLES.map(([sub, rubro]) => [norm(sub), rubro]));

// Rubro contable de una subcuenta según el CSV, o null si el CSV no la tiene.
// null y no "SIN CATEGORÍA" a propósito: quien pregunta necesita distinguir
// "el CSV dice que no la conoce" de "no tiene rubro", para poder seguir
// consultando las capas de respaldo (alias y mapeos del usuario).
export function rubroDeSubcuenta(cat){
  return POR_NORM.get(norm(cat)) ?? null;
}

export const TOTAL_SUBCUENTAS = ${subcuentas.length};
export const RUBROS_DEL_CSV = ${JSON.stringify(rubros, null, 2).split("\n").join("\n")};
`;

if (process.argv.includes("--check")) {
  const actual = fs.existsSync(DESTINO) ? fs.readFileSync(DESTINO, "utf8") : "";
  if (actual === salida) {
    console.log(`OK — src/catalogoContable.js está al día (${subcuentas.length} subcuentas, ${rubros.length} rubros).`);
    process.exit(0);
  }
  console.error("DESINCRONIZADO — docs/catalogo_contable_2027.csv cambió y src/catalogoContable.js no.");
  console.error("Corre:  node scripts/gen-catalogo-contable.mjs");
  process.exit(1);
}

fs.writeFileSync(DESTINO, salida);
console.log(`Generado src/catalogoContable.js — ${subcuentas.length} subcuentas, ${rubros.length} rubros, desde ${filas.length} filas del CSV.`);
