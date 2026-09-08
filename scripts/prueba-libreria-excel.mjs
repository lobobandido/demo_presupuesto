#!/usr/bin/env node
// ETAPA 0 — La prueba que decide la librería.
//
// FUERA de src/. No toca la app. Genera un .xlsx con xlsx-js-style que ejercita
// las cinco cosas que el formato de Anel necesita, y después ABRE EL ARCHIVO
// ESCRITO para verificarlas.
//
// La verificación se hace sobre el XML crudo del .xlsx (un .xlsx es un zip),
// NO releyendo con la misma librería: el lector normaliza cell.s y ya me dio un
// falso negativo antes. El XML es lo que Excel va a leer.
//
//   node scripts/prueba-libreria-excel.mjs
import XLSX from "xlsx-js-style";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const FMT_CONTABLE = '_-* #,##0.00_-;\\-* #,##0.00_-;_-* "-"??_-;_-@_-';
const DEST = path.join(os.tmpdir(), "etapa0-prueba.xlsx");

// ── Se construye la hoja ────────────────────────────────────────────────────
const aoa = [
  ["INGRESOS", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], // fila 1
  ["sub A", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],                      // fila 2
  ["sub B", 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],                         // fila 3
  ["sub C", 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],                         // fila 4
  ["RUBRO", 0],                                                              // fila 5
];
const ws = XLSX.utils.aoa_to_sheet(aoa);

// 1 — combinada A1:P1, negritas, texto FFFFFF, relleno 808080
ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }];
ws["A1"].s = {
  font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: "FF808080" } },
  alignment: { horizontal: "center", vertical: "center" },
};

// 2 — outlineLevel: 1 en las tres subcuentas, 0 en el rubro de abajo
ws["!rows"] = [
  {},                 // fila 1
  { level: 1 },       // fila 2
  { level: 1 },       // fila 3
  { level: 1 },       // fila 4
  { level: 0 },       // fila 5
];

// 3 — summaryBelow. En SheetJS se escribe como !outline.above:
//     above:false  ->  summaryBelow="1"  (el resumen va DEBAJO)
ws["!outline"] = { above: false };

// 4 — formato contable en B2
ws["B2"].z = FMT_CONTABLE;

// 5 — fórmula =SUM(C2:N2) en B5
ws["B5"] = { t: "n", f: "SUM(C2:N2)" };

ws["!cols"] = Array.from({ length: 16 }, () => ({ wch: 15 }));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Prueba");
XLSX.writeFile(wb, DEST);

// ── Se abre el archivo escrito y se lee su XML crudo ────────────────────────
function xml(nombre) {
  try { return execFileSync("unzip", ["-p", DEST, nombre], { encoding: "utf8" }); }
  catch { return ""; }
}
const hoja = xml("xl/worksheets/sheet1.xml");
const estilos = xml("xl/styles.xml");

const resultados = [];
function check(n, titulo, ok, detalle) {
  resultados.push({ n, titulo, ok, detalle });
}

// --- 1
const hayMerge = /<mergeCell ref="A1:P1"\s*\/>/.test(hoja);
// El xf de A1 apunta a un font y un fill; se resuelven por índice.
const sA1 = /<c r="A1"[^>]*\ss="(\d+)"/.exec(hoja);
let fuenteOk = false, rellenoOk = false, centradoOk = false;
if (sA1) {
  const xfs = estilos.split("<cellXfs")[1] || "";
  const lista = [...xfs.matchAll(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)].map(m => m[0]);
  const xf = lista[Number(sA1[1])] || "";
  const fi = /fontId="(\d+)"/.exec(xf), fl = /fillId="(\d+)"/.exec(xf);
  const fonts = [...(estilos.split("<fonts")[1] || "").matchAll(/<font>[\s\S]*?<\/font>/g)].map(m => m[0]);
  const fills = [...(estilos.split("<fills")[1] || "").matchAll(/<fill>[\s\S]*?<\/fill>/g)].map(m => m[0]);
  const f = fonts[Number(fi?.[1] ?? -1)] || "", g = fills[Number(fl?.[1] ?? -1)] || "";
  fuenteOk = /<b\/>/.test(f) && /FFFFFF/i.test(f);
  rellenoOk = /808080/i.test(g);
  centradoOk = /horizontal="center"/.test(xf);
}
check(1, "Combinada A1:P1 + negritas + texto FFFFFF + relleno 808080",
  hayMerge && fuenteOk && rellenoOk && centradoOk,
  `mergeCell=${hayMerge} negritas+FFFFFF=${fuenteOk} relleno808080=${rellenoOk} centrada=${centradoOk}`);

// --- 2
const filas = [...hoja.matchAll(/<row r="(\d+)"([^>]*)>/g)]
  .map(m => ({ r: Number(m[1]), lvl: /outlineLevel="(\d+)"/.exec(m[2])?.[1] ?? "0" }));
const n1 = filas.filter(f => [2, 3, 4].includes(f.r) && f.lvl === "1").length;
const fila5 = filas.find(f => f.r === 5);
check(2, "outlineLevel=1 en tres filas y 0 en la de abajo",
  n1 === 3 && fila5 && fila5.lvl === "0",
  `filas 2-4 con outlineLevel="1": ${n1}/3 · fila 5 nivel="${fila5?.lvl ?? "(sin fila)"}"`);

// --- 3
// En OOXML summaryBelow="1" es el DEFAULT: si el atributo no aparece, Excel ya
// pone el resumen abajo. Que el atributo esté explícito es lo ideal; que esté
// en "0" sería el fallo real.
const mSum = /summaryBelow="(\d|true|false)"/.exec(hoja);
const sumBelowOk = mSum ? /^(1|true)$/.test(mSum[1]) : true;
check(3, "summaryBelow = true en la hoja", sumBelowOk,
  mSum ? `escrito explícito: summaryBelow="${mSum[1]}"`
       : `atributo ausente = el default de OOXML, que ya es summaryBelow=true (resumen debajo)`);

// --- 4
const fmtEsc = FMT_CONTABLE
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const numFmt = new RegExp(`<numFmt numFmtId="(\\d+)" formatCode="${fmtEsc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).exec(estilos);
let fmtEnCelda = false;
if (numFmt) {
  const sB2 = /<c r="B2"[^>]*\ss="(\d+)"/.exec(hoja);
  if (sB2) {
    const xfs = estilos.split("<cellXfs")[1] || "";
    const lista = [...xfs.matchAll(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)].map(m => m[0]);
    fmtEnCelda = new RegExp(`numFmtId="${numFmt[1]}"`).test(lista[Number(sB2[1])] || "");
  }
}
check(4, "Formato de número contable", !!numFmt && fmtEnCelda,
  `numFmt declarado=${!!numFmt}${numFmt ? ` (id ${numFmt[1]})` : ""} · aplicado a B2=${fmtEnCelda}`);

// --- 5
const formula = /<c r="B5"[^>]*>[\s\S]*?<f>([^<]*)<\/f>/.exec(hoja);
check(5, "Fórmula =SUM(C2:N2)", formula?.[1] === "SUM(C2:N2)",
  formula ? `escrita como <f>${formula[1]}</f>` : "no se encontró ningún <f> en B5");

// ── Reporte ────────────────────────────────────────────────────────────────
console.log(`Archivo: ${DEST}\n`);
for (const r of resultados) console.log(`${r.ok ? "PASA" : "FALLA"}  ${r.n}. ${r.titulo}\n        ${r.detalle}`);
const pasan = resultados.filter(r => r.ok).length;
console.log(`\n${pasan} de 5 pasan.`);
const criticos = resultados.filter(r => [2, 3].includes(r.n) && !r.ok);
if (criticos.length) {
  console.log("FALLA LA AGRUPACIÓN COLAPSABLE (punto " + criticos.map(c => c.n).join(" y ") + "). Hay que parar y avisar.");
  process.exit(1);
}
process.exit(pasan === 5 ? 0 : 1);
