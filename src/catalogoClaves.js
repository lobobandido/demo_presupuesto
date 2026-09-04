// Claves de 3 letras de los rubros contables, tal como las exige el sistema de
// la contadora en la columna "Clave" del archivo de carga ("Excel para Apps").
// Sin Clave el archivo no carga.
//
// FUENTE: docs/claves-rubros-anel.csv, dictadas por Anel el 2026-09-04. NO se
// inventan y NO se deducen del nombre del rubro: son los códigos de su sistema.
// Si alguna cambia, se cambia en los DOS lugares — el CSV es el documento para
// finanzas, este archivo es la copia que consume la app. Los guardarraíles de
// abajo avisan si los dos se despegan de CATS_MACRO_CONTABLE.
//
// El orden de esta lista ES el orden del archivo de Anel, el mismo de
// docs/catalogo_contable_2027.csv. No alfabetizar.
//
// bloque: "ingresos" para FAC, "egresos" para los 18 rubros contables. Decide
// bajo cuál de los dos encabezados del archivo va cada fila.
export const CLAVES_RUBRO = [
  {clave:"FAC", rubro:"FACTURACION",                    bloque:"ingresos"},
  {clave:"ACT", rubro:"ACTIVOS",                         bloque:"egresos"},
  {clave:"CAS", rubro:"ARRENDA DE INMUEBLES Y SERV",     bloque:"egresos"},
  {clave:"SEG", rubro:"ARTICULOS DE SEGURIDAD",          bloque:"egresos"},
  {clave:"EQU", rubro:"EQUIPO DE COMPUTO",               bloque:"egresos"},
  {clave:"EQE", rubro:"EQUIPOS Y ENSERES",               bloque:"egresos"},
  {clave:"INA", rubro:"INSUMOS AGRICOLAS",               bloque:"egresos"},
  {clave:"INO", rubro:"INSUMOS DE OFICINA",              bloque:"egresos"},
  {clave:"MKT", rubro:"MARKETING",                       bloque:"egresos"},
  {clave:"MAT", rubro:"MATERIALES",                      bloque:"egresos"},
  {clave:"MAS", rubro:"MATERIALES DE SALUD",             bloque:"egresos"},
  {clave:"NCI", rubro:"NOMINA Y ADICIONALES",            bloque:"egresos"},
  {clave:"TEL", rubro:"SERV TELEFONIA CELULAR Y RADIO",  bloque:"egresos"},
  {clave:"SER", rubro:"SERVICIOS",                       bloque:"egresos"},
  {clave:"SCA", rubro:"SERVICIOS DE CAPACITACION",       bloque:"egresos"},
  {clave:"SAL", rubro:"SERVICIOS DE SALUD",              bloque:"egresos"},
  {clave:"UNI", rubro:"UNIFORMES",                       bloque:"egresos"},
  {clave:"VEH", rubro:"VEHICULOS Y COMBUSTIBLE",         bloque:"egresos"},
  {clave:"VIA", rubro:"VIATICOS",                        bloque:"egresos"},
];

// La fila de FACTURACION del bloque de ingresos, aparte: no es un rubro de
// egresos y no debe colarse en el recorrido de los 18.
export const CLAVE_FACTURACION = "FAC";

// Los 18 rubros de egresos, en el orden del archivo. Es la lista que recorre el
// exportador: los 18 van SIEMPRE, en cero si hace falta, porque el sistema de
// la contadora espera el formato completo.
export const RUBROS_EGRESOS = CLAVES_RUBRO.filter(r => r.bloque === "egresos");

// Índice rubro → clave. La comparación se hace normalizada (sin acentos, sin
// mayúsculas, sin espacios sobrantes), igual que normCat en App.jsx, para que
// una grafía acentuada del dropdown empate con la del catálogo.
function norm(s){
  return (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"")
    .toUpperCase().replace(/\s+/g," ").trim();
}
const CLAVE_POR_NORM = new Map(CLAVES_RUBRO.map(r => [norm(r.rubro), r.clave]));

// Clave de un rubro, o null si no tiene. Devolver null y no una cadena vacía es
// deliberado: quien exporte tiene que decidir explícitamente qué hace con un
// rubro sin clave, no escribir una celda vacía que el sistema rechace en
// silencio.
export function claveDeRubro(rubro){
  return CLAVE_POR_NORM.get(norm(rubro)) ?? null;
}

// ─── GUARDARRAÍLES DE DESARROLLO ────────────────────────────────────────────
// import.meta.env.DEV los deja fuera del bundle de producción.
// El cruce contra CATS_MACRO_CONTABLE NO se hace aquí, sino en App.jsx, que es
// donde vive esa lista: importarla desde este archivo crearía un ciclo.
if(import.meta.env.DEV){
  const esperadas = 19; // FAC + los 18 rubros de docs/catalogo_contable_2027.csv
  if(CLAVES_RUBRO.length !== esperadas){
    console.error(
      `[claves] CLAVES_RUBRO tiene ${CLAVES_RUBRO.length} entradas y se esperaban ${esperadas}\n`+
      `(FACTURACION + los 18 rubros). Si el catálogo de la contadora cambió de verdad,\n`+
      `actualiza docs/claves-rubros-anel.csv, esta lista y este conteo en la misma pasada.`
    );
  }
  const claves = CLAVES_RUBRO.map(r => r.clave);
  const dupClaves = claves.filter((c,i) => claves.indexOf(c) !== i);
  if(dupClaves.length){
    console.error(
      `[claves] clave(s) repetida(s): ${[...new Set(dupClaves)].join(", ")}. Cada rubro tiene\n`+
      `la suya; dos rubros con la misma clave se cargarían como el mismo renglón en el\n`+
      `sistema de la contadora, sumando dinero que no va junto.`
    );
  }
  const malFormadas = CLAVES_RUBRO.filter(r => !/^[A-Z]{3}$/.test(r.clave));
  if(malFormadas.length){
    console.error(
      `[claves] clave(s) que no son tres letras mayúsculas: `+
      malFormadas.map(r => `"${r.clave}" (${r.rubro})`).join(", ")
    );
  }
  const sinRubro = CLAVES_RUBRO.filter(r => !r.rubro || !r.bloque);
  if(sinRubro.length){
    console.error(`[claves] ${sinRubro.length} entrada(s) sin rubro o sin bloque.`);
  }
}
