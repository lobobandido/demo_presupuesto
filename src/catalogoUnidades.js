// Catálogo provisional de unidades de negocio.
// FUENTE REAL: el módulo de viáticos de apps.nuvoil.com (Django,
// campo id_un_clave). Esta copia se queda vieja en cuanto den de
// alta una unidad nueva. Pendiente: preguntar a Anel si hay API o
// export.
// FALTAN, pendientes de confirmar con Anel (02-sep-2026):
//   C18000, C18, F21858, BHSA — mencionadas por ella, no aparecen
//     en el sistema de viáticos
//   F218385P001/P002/P003 — sub-proyectos de F218385, falta saber
//     si el presupuesto se captura contra el padre o contra cada uno
//
// El orden de la lista ES el orden del <select>: INTERNO va primero porque es
// la de los presupuestos que no tienen unidad propia (por ejemplo el de TI).
// Se guarda SOLO la clave; el nombre es para leerlo en pantalla.
export const UNIDADES_NEGOCIO = [
  {clave:"INTERNO",      nombre:"Interno / Departamento"},
  {clave:"F118147",      nombre:"GEOLIS - REHABILITA BENAVIDES"},
  {clave:"F218136POZ",   nombre:"GEOLIS OPE Y MAN JETPUMP POZAR"},
  {clave:"F218147",      nombre:"GEOLIS - SERVICIO BENAVIDES"},
  {clave:"F218152",      nombre:"GEOLIS - SERVICIO PRUEBA BCP"},
  {clave:"F218152OPE",   nombre:"GEOLIS - PEMEX BCP MM"},
  {clave:"F218158",      nombre:"GEOLIS - OPER POZOS CERRADOS"},
  {clave:"F218158VHSA",  nombre:"GEOLIS - GERENCIA OPERACIONES"},
  {clave:"F218169",      nombre:"GEOLIS - LIFTING BHJ"},
  {clave:"F218178",      nombre:"GEOLIS - PERENCO BES"},
  {clave:"F218184",      nombre:"GEOLIS - DEA MSP"},
  {clave:"F218222",      nombre:"GEOLIS - PERENCO BHJ"},
  {clave:"F218250",      nombre:"GEOLIS - COREWELL BURGOS"},
  {clave:"F218265",      nombre:"PEMEX BECH"},
  {clave:"F218294",      nombre:"GEOLIS - OPER PEMEX BEC MARINA"},
  {clave:"F218298",      nombre:"GEOLIS - OPER DEA BHJ"},
  {clave:"F218301A",     nombre:"GEOLIS GAS - SERVICIOS CUERVITO (JAYSAN)"},
  {clave:"F218357",      nombre:"GEOLIS - PEMEX BECH LITORAL"},
  {clave:"F218358",      nombre:"OPER Y MANTTO - BEH JUJO"},
  {clave:"F218368",      nombre:"PEMEX CALENTADORES"},
  {clave:"F218370",      nombre:"PEMEX APMM"},
  {clave:"F218373",      nombre:"PEMEX TRANSFORMADORES"},
  {clave:"F218376",      nombre:"PEMEX BECH VERACRUZ"},
  {clave:"F218379",      nombre:"PEMEX VINCULARES"},
  {clave:"F218381",      nombre:"PEMEX TURBOGENERADORES"},
  {clave:"F218382",      nombre:"GEOLIS ADMINISTRACION CUERVITO"},
  {clave:"F218383",      nombre:"GEOLIS ENERGIA"},
  {clave:"F218385",      nombre:"GEOLIS INFRAESTRUCTURA"},
  {clave:"F218388",      nombre:"GEOLIS PEMEX BLP M-M"},
  {clave:"G18ADMIN",     nombre:"GEOLIS ADMINISTRACION"},
];

// Formato de despliegue: "CLAVE — NOMBRE". El valor que se guarda es la CLAVE.
export function etiquetaUnidad(clave){
  if(!clave) return "";
  const u = UNIDADES_NEGOCIO.find(x=>x.clave===clave);
  // Una clave que ya no esté en el catálogo (unidad dada de baja, o guardada
  // antes de que esta copia se actualizara) se muestra tal cual en vez de
  // desaparecer: el dato guardado siempre se ve.
  return u ? `${u.clave} — ${u.nombre}` : clave;
}
