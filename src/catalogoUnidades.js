// Catálogo de unidades de negocio (punto 3 del backlog, 11-sep-2026).
//
// FUENTE: src/data/unidades-negocio.csv — una sola copia, versionada con el
// código. Columnas: clave, descripcion, compania, tipo, clave_padre. Se importa
// con el sufijo ?raw de Vite (el texto entra al bundle en tiempo de compilación:
// sin petición en tiempo de ejecución, sin plugin, sin tocar vite.config) y se
// parsea al cargar el módulo. Para dar de alta una unidad basta agregar el
// renglón al CSV.
//
// Hasta el 11-sep-2026 el catálogo era una lista fija en este archivo (30
// claves copiadas del módulo de viáticos de apps.nuvoil.com). Claves que
// estaban ahí y NO vienen en el CSV: INTERNO, F118147, F218136POZ, F218147,
// F218152, F218152OPE, F218158, F218169, F218178, F218250, F218265, F218298,
// F218301A, F218368, G18ADMIN. Un presupuesto guardado con una de ellas NO
// pierde el dato: el <select> la agrega como opción seleccionada, marcada
// «(fuera de catálogo)» (ver App.jsx, Datos generales).
//
// El orden de la lista ES el orden del <select>: las unidades raíz en el orden
// del CSV y, inmediatamente después de cada padre, sus hijos (clave_padre), con
// nivel 1 para pintarlos con sangría. TODOS son seleccionables, también el padre
// (F218385 INFRAESTRUCTURA es una unidad real con tres proyectos colgando). Se
// guarda SOLO la clave del renglón elegido; el padre no se guarda aparte.
import csvUnidades from "./data/unidades-negocio.csv?raw";

/* Claves heredadas de presupuestos capturados antes del catálogo oficial.
   Sólo sirven para mostrar el nombre; no aparecen en el desplegable (ahí
   salen como «(fuera de catálogo)»). El CSV es la lista oficial de
   contabilidad y NO se le añaden renglones que ella no entregó.
   Pendientes de confirmar con contabilidad. */
const UNIDADES_HEREDADAS = {
  "F218301A": "GEOLIS GAS - SERVICIOS CUERVITO (JAYSAN)",   // Cuervito
  "G18ADMIN": "GEOLIS ADMINISTRACION",                      // Presupuesto TI H1 2026; dedazo por C18ADMIN (confirmado 12-sep-2026)
};

// Parser mínimo para el CSV del catálogo: una fila por línea, coma como
// separador, comillas dobles opcionales alrededor de un campo (con "" como
// comilla escapada). Quita el BOM y las líneas vacías. No es un parser general.
function parseCsv(texto){
  const lineas = texto.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l=>l.trim()!=="");
  const partir = l=>{
    const campos=[]; let cur="", enComillas=false;
    for(let i=0;i<l.length;i++){
      const ch=l[i];
      if(enComillas){
        if(ch==='"'){ if(l[i+1]==='"'){ cur+='"'; i++; } else enComillas=false; }
        else cur+=ch;
      }else if(ch==='"') enComillas=true;
      else if(ch===",") { campos.push(cur); cur=""; }
      else cur+=ch;
    }
    campos.push(cur);
    return campos.map(c=>c.trim());
  };
  const cab = partir(lineas[0]);
  return lineas.slice(1).map(l=>{
    const v=partir(l), fila={};
    cab.forEach((k,i)=>{ fila[k]=v[i]??""; });
    return fila;
  });
}

// Ordena padres e hijos: raíz en orden del CSV, hijos justo debajo de su padre
// (también en orden del CSV). Un hijo cuyo padre no está en el catálogo se trata
// como raíz para que no desaparezca; en desarrollo se avisa en consola.
function ordenarJerarquia(filas){
  const claves = new Set(filas.map(f=>f.clave));
  const hijosDe = new Map();
  const raices = [];
  filas.forEach(f=>{
    const padre = f.clave_padre||"";
    if(padre && claves.has(padre)){
      if(!hijosDe.has(padre)) hijosDe.set(padre, []);
      hijosDe.get(padre).push(f);
    }else{
      if(padre && import.meta.env.DEV){
        console.error(`[unidades] ${f.clave} declara clave_padre "${padre}" y esa clave no está en el CSV; se lista como raíz.`);
      }
      raices.push(f);
    }
  });
  const out = [];
  const meter = (f, nivel)=>{
    out.push({clave:f.clave, nombre:f.descripcion, compania:f.compania, tipo:f.tipo,
      clavePadre:(nivel>0?f.clave_padre:"")||"", nivel});
    (hijosDe.get(f.clave)||[]).forEach(h=>meter(h, nivel+1));
  };
  raices.forEach(r=>meter(r, 0));
  return out;
}

export const UNIDADES_NEGOCIO = ordenarJerarquia(
  parseCsv(csvUnidades).filter(f=>f.clave)
);

// Unidad por omisión de los presupuestos de tipo DEPARTAMENTO (Luis,
// 02-sep-2026): "los presupuestos de departamento siempre son internos y van a
// esa unidad". Se referencia por esta constante y NUNCA escrita a mano en el
// JSX, porque está PENDIENTE DE VALIDAR con la contadora: si Anel la renombra,
// hay un solo lugar que cambiar.
//
// 12-sep-2026, confirmado por la contadora en la revisión con Luis: la clave
// correcta es C18ADMIN («GEOLIS - ADMINISTRACION», tipo DP, en el CSV oficial).
// El G18ADMIN que decía esta constante hasta hoy era un dedazo en la libreta de
// donde se capturó. El presupuesto «TI H1 2026» sigue guardado con G18ADMIN y
// conserva su nombre gracias a UNIDADES_HEREDADAS; no se cambia solo.
//
// OJO: esto NO es lo mismo que consolidar unidades entre sí. Lo que Anel pidió
// ("esos tres tenemos que conjuntar en uno, que sería el C18000") sigue abierto
// y es otra decisión.
export const UNIDAD_DEPARTAMENTO = "C18ADMIN";

// Guardarraíl de desarrollo: si la clave deja de existir en el catálogo —porque
// la renombraron o la dieron de baja— el autollenado se degradaría en silencio,
// dejando el campo vacío sin que nadie se entere. Que truene en consola.
// import.meta.env.DEV lo deja fuera del bundle de producción.
if(import.meta.env.DEV && !UNIDADES_NEGOCIO.some(u=>u.clave===UNIDAD_DEPARTAMENTO)){
  console.error(
    `[unidades] UNIDAD_DEPARTAMENTO vale "${UNIDAD_DEPARTAMENTO}" y esa clave NO existe en\n`+
    `src/data/unidades-negocio.csv. Los presupuestos de tipo Departamento se autollenan con una\n`+
    `clave que el select marca «(fuera de catálogo)». Si la clave cambió de nombre, actualiza la\n`+
    `constante; si la unidad se dio de baja, decide con la contadora cuál la reemplaza.`
  );
}

export function unidadPorClave(clave){
  return UNIDADES_NEGOCIO.find(x=>x.clave===clave) || null;
}

// Formato de despliegue: "CLAVE — NOMBRE". El valor que se guarda es la CLAVE.
// Resolución del nombre, en este orden: catálogo oficial (CSV) → UNIDADES_HEREDADAS
// → sólo la clave. Una clave que no esté en ninguno de los dos se muestra tal
// cual en vez de desaparecer: el dato guardado siempre se ve.
export function etiquetaUnidad(clave){
  if(!clave) return "";
  const u = unidadPorClave(clave);
  if(u) return `${u.clave} — ${u.nombre}`;
  const heredado = UNIDADES_HEREDADAS[clave];
  return heredado ? `${clave} — ${heredado}` : clave;
}

// Texto de la <option> del <select>: los hijos llevan sangría con espacios
// duros (los espacios normales al inicio de una <option> los recorta el
// navegador). No se usa <optgroup> porque su etiqueta no es seleccionable y el
// padre sí tiene que poderse elegir.
export const MARCA_FUERA_CATALOGO = "(fuera de catálogo)";
export function textoOpcionUnidad(u){
  const sangria = "\u00A0\u00A0\u00A0\u00A0".repeat(u.nivel||0);
  return `${sangria}${u.clave} — ${u.nombre}`;
}
