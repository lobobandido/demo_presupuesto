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
  queda inaccesible. Se limpia recargando la página, o desde el 2026-08-25 con
  el botón `🗑 Eliminar` del listado, que no necesita que el presupuesto se haya
  podido cargar. Misma clase de problema que tenían
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
  **El botón `🗑 Eliminar` (2026-08-25) NO cierra este bug.** `eliminarPresupuesto`
  reescribe localStorage (App.jsx:2458), pero **localStorage es por origen**:
  limpia el caché únicamente del navegador y el dominio donde se picó el botón.
  Verificado el 2026-08-25: se borró desde `localhost:5173` y los mismos
  registros **siguen apareciendo** en `demo-presupuesto.vercel.app`, que tiene
  su propio `geolis_app_state_v4`. Cada combinación navegador × dominio arrastra
  su propia colección de fantasmas, y ninguna se entera de los borrados hechas
  desde otra.
  La causa raíz sigue intacta y es la única que cerraría el bug de verdad:
  `soloLocales` conserva todo lo que está en caché y no viene del remoto
  (App.jsx:2246-2269), más el `if(remotos.length===0) return;` de la línea 2262.
  Mientras eso no se arregle, el borrado desde el dashboard de Supabase y el
  borrado desde otro origen dejan fantasma igual; el botón solo evita crear uno
  nuevo en el origen donde se usó.

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

- **R4 de docs/MD/DECISIONES.md queda PENDIENTE DE RECONFIRMAR con Luis.** El
  2026-08-07 Luis dijo "ahorita no" a un botón de eliminar y se quitó del
  listado y del breadcrumb. El 2026-08-25 volvió al listado (`🗑 Eliminar`,
  App.jsx:3009-3016) — **no está aprobado por él todavía**. Argumento para
  cuando se le pregunte: (a) **no requirió código nuevo** —
  `eliminarPresupuesto` ya existía completa y solo estaba inalcanzable, el diff
  es el botón más el texto del `window.confirm` que ya traía; (b) devuelve un
  camino de borrado que no obliga a entrar al dashboard de Supabase.
  **NO usar el argumento de que "cierra el fantasma de localStorage": es falso.**
  Solo limpia el caché del navegador y dominio donde se picó el botón — ver el
  bug del fantasma arriba. Si Luis dice que no, revertir es quitar el botón y
  nada más.

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
  **El workaround ya se puede capturar, pero sigue sin dar el flujo correcto en
  lo ya guardado.** El defecto que lo impedía —`mesGastoMes`/`mesGastoAnio` no
  se persistían en OPEX— quedó arreglado el 2026-08-24: las columnas se
  agregaron a `partidas_opex_mat`/`partidas_opex_via` y `opexToRow` ya las
  escribe. De aquí en adelante, capturar una fila por ocurrencia con su Mes/Año
  sobrevive a salir y reentrar.
  Lo que NO se arregló, porque son cosas distintas: las partidas guardadas
  **antes** de esa fecha tienen las dos columnas en `null` y su
  `mes_inicio_opex` sigue en 1. Medido en «Cambio de servicio»: las 2 filas de
  PINTURA y las 3 de CERTIFICACION están todas en `mes_inicio_opex=1`. **El
  total anual sale correcto; el flujo mensual no** — las 4 ocurrencias de
  PINTURA caen en M1 y M3 en vez de Ene/Mar/Jul/Oct, y las 3 de CERTIFICACION
  caen todas en M1. Para corregirlas hay que reelegir su Mes/Año en la UI, lo
  que sí recalcula `mesInicioOpex` (App.jsx:1300,1315) — y eso **mueve montos de
  mes**, así que es una acción deliberada del usuario, no algo que la app deba
  hacer sola al cargar.
  Sigue abierto el `Math.max(1,…)` de `distribuirOpex` (App.jsx:289) y el del
  onChange del selector de mes (App.jsx:1300,1315): una ocurrencia que caiga en
  M0 se empuja a M1 y se apila con la primera. Es el bug de M0 ya listado
  arriba. Mientras siga, el workaround no puede expresar un gasto que ocurra en
  el mes cero del proyecto.

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
