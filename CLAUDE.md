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

- Un presupuesto se persiste en la nube al picar **Continuar** en Datos
  generales, ANTES de tener áreas: guardarPres llama a
  guardarPresupuestoEnNube con areas=[] y ese INSERT crea la fila
  (supabaseApi.js:141-143). El guardarraíl de cero áreas
  (supabaseApi.js:153-156) NO protege aquí — su condición es
  `idExistente && areas.length===0`, y en un INSERT idExistente es null; solo
  cubre presupuestos que ya existían. Si el usuario abandona en el paso de
  Participantes, el registro queda con cero áreas y sin partidas. Confirmado
  por GET el 2026-08-20: tres registros así (`605f3173…`, `1a4871eb…`,
  `93bb737b…`), los tres con created_at igual a updated_at.
  **La única protección hoy es el aviso de Step 3** («Este presupuesto todavía
  no tiene participantes» + botón `Elegir participantes`, App.jsx:3737-3749),
  que hace el estado recuperable desde la UI pero no evita que se produzca. La
  causa raíz —persistir antes de tener áreas— sigue abierta: arreglarla implica
  tocar `guardarPres`, protegida por la regla 4, y ese INSERT es el que promueve
  el id local al UUID real. No tocar sin autorización explícita.
  Nota sobre el arreglo: el `Atrás` del paso de Áreas quedó condicionado a
  `flujoCreacion` (App.jsx:3437) **a propósito**. El camino nuevo hacia Step 2
  abriría transitivamente Step 1 para un presupuesto guardado, o sea la edición
  de nombre/tipo/fechas — eso es justo lo que **A1 de docs/MD/DECISIONES.md**
  tiene sin resolver, y mover `fechaInicio` recorre todas las columnas de mes de
  lo ya capturado. Si algún día se decide reabrir A1, esa condición es el punto
  exacto donde se destraba, y es una decisión de producto, no un bug.

## Pendientes de producto

- No hay forma de eliminar un presupuesto desde ninguna parte de la UI (se quitó
  del listado en spec-navegacion-retro-410, y del breadcrumb hoy, por pedido de
  Luis). Si se necesita, hoy solo es posible por Supabase directo. Confirmado
  por Luis (hoy): intencional por ahora, sin fecha de revisión.

- **La app no puede expresar un gasto recurrente en meses IRREGULARES.**
  `distribuirOpex` solo sabe de `mesInicioOpex` + `periodicidad` (intervalo fijo
  de PM_INTERVALO) + `repeticiones`. Ene-Mar-Jul-Oct no es mensual, ni
  bimestral, ni trimestral: no hay periodicidad que lo describa. El workaround
  correcto —y el que el usuario ya está usando— es **una fila por ocurrencia**,
  cada una con su propio mes de inicio. Verificado el 2026-08-24 en «Cambio de
  servicio» contra el Excel del usuario: PINTURA Y OTROS RECUBRIMIENTOS
  (1,403,806.98 = 350,951.75 × 4, en Ene/Mar/Jul/Oct) y CERTIFICACION
  (325,499.14 = 50,000 en Mayo + 50,000 en Septiembre + 225,499.14 en otro mes).
  **Esas filas repetidas NO son duplicados** — no confundirlas con las que
  fabricaba el autollenado de `pick()` (arreglado hoy).
  **Hoy el workaround no sobrevive**, por el defecto A de este mismo día: el mes
  de inicio de OPEX se captura en los selectores Mes/Año, pero `mesGastoMes`/
  `mesGastoAnio` no se persisten —`partidas_opex_mat` y `partidas_opex_via` ni
  siquiera tienen esas columnas, y `opexToRow` (supabaseApi.js:33-42) no las
  escribe—, así que al recargar todas las filas vuelven con `mes_inicio_opex=1`.
  Medido: las 2 filas de PINTURA y las 3 de CERTIFICACION están hoy todas en
  `mes_inicio_opex=1`. **El total anual sale correcto; el flujo mensual no** —
  las 4 ocurrencias de PINTURA caen en M1 y M3 en vez de Ene/Mar/Jul/Oct, y las
  3 de CERTIFICACION caen todas en M1.
  Agrava esto el `Math.max(1,…)` de `distribuirOpex` (App.jsx:289) y el del
  onChange del selector de mes (App.jsx:1297,1312): aunque el mes persistiera,
  una ocurrencia que caiga en M0 se empuja a M1 y se apila con la primera. Es el
  bug de M0 ya listado arriba, y cualquier arreglo del mes de inicio de OPEX
  tiene que resolverlo a la vez o el workaround sigue sin dar el flujo correcto.

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
