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

// Unidad por omisión de los presupuestos de tipo DEPARTAMENTO (Luis,
// 02-sep-2026): "los presupuestos de departamento siempre son internos y van a
// esa unidad". Se referencia por esta constante y NUNCA escrita a mano en el
// JSX, porque está PENDIENTE DE VALIDAR con la contadora: si Anel la renombra,
// hay un solo lugar que cambiar.
//
// OJO: esto NO es lo mismo que consolidar unidades entre sí. Lo que Anel pidió
// ("esos tres tenemos que conjuntar en uno, que sería el C18000") sigue abierto
// y es otra decisión.
export const UNIDAD_DEPARTAMENTO = "G18ADMIN";

// Guardarraíl de desarrollo: si la clave deja de existir en el catálogo —porque
// la renombraron o la dieron de baja— el autollenado se degradaría en silencio,
// dejando el campo vacío sin que nadie se entere. Que truene en consola.
// import.meta.env.DEV lo deja fuera del bundle de producción.
if(import.meta.env.DEV && !UNIDADES_NEGOCIO.some(u=>u.clave===UNIDAD_DEPARTAMENTO)){
  console.error(
    `[unidades] UNIDAD_DEPARTAMENTO vale "${UNIDAD_DEPARTAMENTO}" y esa clave NO existe en\n`+
    `UNIDADES_NEGOCIO. Los presupuestos de tipo Departamento van a quedarse con la unidad\n`+
    `vacía en vez de autollenarse. Si la clave cambió de nombre, actualiza la constante;\n`+
    `si la unidad se dio de baja, decide con la contadora cuál la reemplaza.`
  );
}

// Formato de despliegue: "CLAVE — NOMBRE". El valor que se guarda es la CLAVE.
export function etiquetaUnidad(clave){
  if(!clave) return "";
  const u = UNIDADES_NEGOCIO.find(x=>x.clave===clave);
  // Una clave que ya no esté en el catálogo (unidad dada de baja, o guardada
  // antes de que esta copia se actualizara) se muestra tal cual en vez de
  // desaparecer: el dato guardado siempre se ve.
  return u ? `${u.clave} — ${u.nombre}` : clave;
}
