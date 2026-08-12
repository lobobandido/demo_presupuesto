## Arquitectura

- App React + Supabase, deploy en Vercel (demo-presupuesto.vercel.app).
- TODO el código vive en src/App.jsx (4,462 líneas), más src/supabaseApi.js
  (279) y src/supabaseClient.js (6). No hay más archivos de aplicación.
- Dos sistemas separados a propósito: CAPTURA (Datos generales · Áreas ·
  Capturar costos) y VISUALIZACIÓN (Información general · Resumen mensual).
  No mezclar captura dentro de pantallas de visualización.
- Cuatro tipos de presupuesto: Instalación (factura por entregable en el mes
  que se cobra) · Servicio (precio unitario diario × días del mes) ·
  Departamento (sin ingresos) · Suministro (otro modelo: requisiciones con
  orden de compra).

## Dónde está cada cosa

- **Qué hace la app hoy:** `docs/MD/ESTADO-ACTUAL.md`. Derivado del código, con
  referencia archivo:línea en cada afirmación — pantallas y navegación por step,
  secciones de captura, reglas de cálculo, estado de PLANTILLAS, y una sección E
  con lo que los specs piden y el código no implementa. **Es la referencia de
  estado.** Los cuatro specs de `docs/specs/` NO lo son: son actas históricas y
  se contradicen entre sí. Cada uno lleva al inicio un bloque que dice qué de él
  se implementó, qué quedó superado y por cuál spec, y qué nunca se hizo.
- **Por qué la app es así:** `docs/MD/DECISIONES.md`. Una fila por decisión de
  producto con su cita textual, su fecha, el spec de origen y su firmeza
  (CERRADA · CERRADA-PENDIENTE · REABIERTA · ABIERTA). Antes de "arreglar" algo
  que parece inconsistente, búscalo ahí: nueve decisiones son REABIERTA (el
  cliente cambió de criterio) y lo que parece un bug puede ser lo último que
  pidió. Las ABIERTA son preguntas sin responder — no las resuelvas por tu
  cuenta.
- **Contra qué se verifica un monto:** `docs/MD/KPIS-LINEA-BASE.md`.
- **Cómo se usa la app:** `docs/MD/04_Manual_Usuario_Final.md`.

Al cambiar comportamiento, actualiza `ESTADO-ACTUAL.md`; al cerrar o reabrir una
decisión de producto, actualiza `DECISIONES.md`.

## Reglas duras

1. PROHIBIDO que cualquier prueba automatizada escriba en Supabase. Ni INSERT,
   ni UPDATE, ni DELETE, ni upsert, ni RPC que mute. Solo GET. Las pruebas de
   navegador las ejecuta el usuario a mano.
2. CATS_MACRO_CONTABLE y SUBCAT_MAPPING (27 categorías) vienen de finanzas.
   No se modifican ni se amplían sin autorización explícita.
3. Todo cambio que pueda mover un monto exige verificación de KPIs antes y
   después. Si un monto se movió, revertir.
4. No abrir sin motivo explícito del usuario: distribuirOpex, distribuirNomina,
   mesIndexCapex, calcularNumMesesOp, calcularSerieMensual,
   construirFilasServicio, exportarExcel, guardarArea, guardarPres, totalCat,
   totalNom, totalOpexAnualCat.
5. `npm run build` limpio NO es evidencia de que funciona. No hay tipado: una
   variable eliminada que sigue usándose compila y truena al hacer clic. Al
   terminar, entrega la lista exacta de caminos de UI a recorrer.
6. Un commit por cambio, con mensaje que diga QUÉ y POR QUÉ. No hacer push sin
   que el usuario lo pida.

## Regla de captura (se equivoca seguido)

En "Categoría" va la subcategoría descriptiva; en "Descripción" va el concepto.
Nunca el nombre de la cuenta contable en ambas. Correcto: Categoría
"POSTE DE TELEMETRIA" → la app mapea sola a MATERIALES y arma el subtotal.
Incorrecto: MATERIALES / MATERIALES → tabla plana, queja literal del cliente.

## Bugs conocidos abiertos (NO arreglar salvo que se pidan)

- M0 no acepta OPEX: Math.max(1,…) en distribuirOpex y en el onChange del
  selector de mes. El cliente confirmó que M0 SÍ debe permitirse.
- calcularNumMesesOp: duración con un mes de menos.
- opexPMt hardcodeado a 12 mientras opexAreas usa la duración real.
- Leyendas de FlowChart: dice #374151 y dibuja #1E40AF; dice #C0392B y dibuja
  #EF4444.
- PLANTILLAS: las tres están mal (instalación en ceros, Cuervito en dólares,
  TI subestima CAPEX ~230k).
- p.cantidad||1 en nómina: un puesto con cantidad 0 se calcula como 1 persona,
  sumando un sueldo que nadie cobra. Falta decidir si cantidad 0 debe poder
  capturarse.
- Selector de mes de ingresos: rotula en base enero (M1 · Ene) en vez de
  derivar de fechaInicio; la distribución usa el índice M y descarta mes y año.
  En Cuervito corrió doce ingresos dos meses, dejó Ago 26 vacío y apiló dos
  renglones en M1.
- exportarExcel línea 2033 usa los literales 0.32/0.40/0.05 en vez de F_IMSS/
  F_PREST/F_ISR: si finanzas cambia un factor, pantalla y Excel se despegan.
- Tira verde de nómina línea 1501: interpola {p.imss} y {p.prestaciones} crudos
  mientras {p.isr??F_ISR} sí usa ??. Si alguno queda undefined imprime
  "(1++0.05)".
- Cuervito no cuadra contra docs/guia-capturar-cuervito.html: SERVICIOS da 3K
  contra 1,294,000 esperados, ARRENDA cae en SIN CATEGORÍA, HERRAMIENTA cae en
  EQUIPOS Y ENSERES, INSUMOS DE OFICINA da 21K contra 32,400. Sin diagnosticar:
  falta separar dato mal capturado de mapeo incorrecto.
- Un presupuesto clonado (o nuevo) vive solo en el estado local hasta que se
  guarda un área: aparece en el listado como si existiera, pero no está en
  Supabase. Si su id local se promueve a string sin que la fila exista,
  abrirPresupuesto falla con "No se pudo cargar el presupuesto" y el registro
  queda inaccesible — el 🗑 tampoco aparece, porque requiere que pres se haya
  cargado. Se limpia recargando la página. Misma clase de problema que tenían
  los ingresos antes de moverlos a Capturar costos: la UI aparenta permanencia
  donde no la hay.
- guardarArea y guardarIngresos pueden solaparse: ambos hacen delete+insert
  completo de ingresos_adicionales/áreas sin candado ni merge — el que resuelva
  último sobrescribe al otro. Baja probabilidad (requiere clics casi
  simultáneos), sin arreglar. Opción A (deshabilitar botones mientras hay
  guardado en tránsito) es la más simple si se decide corregir.
- La sección de Ingresos se oculta por tipo solo en la UI — calcularSerieMensual
  sigue sumando ingAdicionales sin filtrar por tipo. Si se insertan datos
  directo en Supabase (o quedan de antes de ocultar la sección), un Departamento
  puede mostrar ingresos igual. Confirmado hoy en TI H1 2026 ($10M de ingresos
  de prueba, limpiados).
- El listado no reconcilia borrados: presupuestos fantasma. El useEffect de
  montaje (App.jsx:2246-2269) fusiona el caché de localStorage con el resultado
  de listarPresupuestos(), pero `soloLocales` conserva todo lo que está en caché
  y NO viene del remoto — que es exactamente la firma de un registro borrado.
  Un presupuesto eliminado directo en Supabase sigue apareciendo en la app hasta
  que se limpia el localStorage del navegador (clave `geolis_app_state_v4`).
  Confirmado el 2026-08-12 con dos registros borrados desde el dashboard.
  Agravante encontrado al verificarlo: el `if(remotos.length===0) return;` de la
  línea 2262 corta antes de fusionar, así que si se borran TODOS los
  presupuestos del remoto no se reconcilia ninguno — la app sigue mostrando el
  listado completo del caché, como si nada se hubiera borrado.
  Al abrir un fantasma, cargarPresupuestoDeNube devuelve null y sale
  "No se pudo cargar el presupuesto" (misma pantalla que un fallo de red, así
  que el usuario no puede distinguir "esto ya no existe" de "revisa tu
  conexión"). Misma clase que el fantasma del presupuesto clonado ya listado
  arriba: la UI aparenta permanencia donde no la hay.
  **Agrava el A1 de docs/MD/DECISIONES.md**: como no hay ningún botón de
  eliminar en la UI, el dashboard de Supabase es el único camino para borrar —
  y es justo el que deja fantasmas. Cualquier arreglo de A1 (devolver el borrado
  a la UI) debería resolver los dos de una vez.

## Pendientes de producto

- No hay forma de eliminar un presupuesto desde ninguna parte de la UI (se quitó
  del listado en spec-navegacion-retro-410, y del breadcrumb hoy, por pedido de
  Luis). Si se necesita, hoy solo es posible por Supabase directo. Confirmado
  por Luis (hoy): intencional por ahora, sin fecha de revisión.

## Excel de referencia

En docs/. La hoja SERVICIO de cada uno es el resumen contra el que se verifica.
Los precios vienen en dólares y pesos en columnas contiguas, con la paridad en
la hoja PREMISAS (18 en Cuervito, 18.07 en Papán). Usar SIEMPRE la columna [MN].
Los archivos tienen inconsistencias propias ya identificadas (IVA mezclado en un
renglón de Cuervito, subtotal de transmisión sin partida de origen, insumos
duplicados, premisas despegadas entre hojas). No son bugs de la app.

## Mantenimiento de esta documentación

- El commit que arregla un bug lo elimina de "Bugs conocidos abiertos".
- El commit que cambia comportamiento actualiza el spec correspondiente en
  docs/, o anota la discrepancia en una sección "Corrección posterior".
- La línea base de KPIs NO se actualiza porque un número cambió: solo cuando el
  usuario confirma que el cambio es intencional y aprobado.

## Cambios de comportamiento

Registro de cambios intencionales que alteran resultados numéricos respecto a versiones
anteriores de la app — para no confundirlos con regresiones al comparar contra un Excel viejo
o un cálculo hecho a mano.

### `imss`/`prestaciones`/`isr` en nómina: `||` → `??` (2026-08-06, commit `4e4d6e8`)

**Antes:** `distribuirNomina`, `NominaTable`, `totalNom` y `exportarExcel` armaban el factor de
carga social con `(p.imss||F_IMSS)+(p.prestaciones||F_PREST)+(p.isr||F_ISR)`. Como `0` es falsy en
JavaScript, capturar `0` en cualquiera de esos tres campos hacía que el cálculo usara el valor por
omisión (imss 0.32, prestaciones 0.40, isr 0.05) en vez del cero capturado.

**Ahora:** el mismo factor usa `??` en vez de `||` para esos tres campos exclusivamente
(`p.cantidad||1` y `p.salario||0` no cambiaron — ahí el cero sí debe caer al valor por omisión).
Un `0` capturado se respeta tal cual.

**Efecto:** si algún puesto de nómina ya guardado tiene `0` explícito en `imss`, `prestaciones` o
`isr`, su costo mensual/anual y el Excel exportado van a dar un número **menor** que antes de este
cambio — es el comportamiento correcto, no una regresión. Puestos con los tres campos en sus
valores por omisión (0.32/0.40/0.05) dan exactamente el mismo resultado que siempre, porque `||` y
`??` solo difieren cuando el valor es `0`, `""`, `NaN` o `false`.
