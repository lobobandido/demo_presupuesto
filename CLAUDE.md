## Arquitectura

- App React + Supabase, deploy en Vercel (demo-presupuesto.vercel.app).
- TODO el código vive en src/App.jsx (~3,700 líneas), más src/supabaseApi.js y
  src/supabaseClient.js. No hay más archivos de aplicación.
- Dos sistemas separados a propósito: CAPTURA (Datos generales · Áreas ·
  Capturar costos) y VISUALIZACIÓN (Información general · Resumen mensual).
  No mezclar captura dentro de pantallas de visualización.
- Cuatro tipos de presupuesto: Instalación (factura por entregable en el mes
  que se cobra) · Servicio (precio unitario diario × días del mes) ·
  Departamento (sin ingresos) · Suministro (otro modelo: requisiciones con
  orden de compra).

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
- Total de FLUJO ACUMULADO en TablaM: reduce() suma la serie en vez de tomar
  el último valor (-76.43M donde debía dar -9.71M).
- exportarExcel línea 2033 usa los literales 0.32/0.40/0.05 en vez de F_IMSS/
  F_PREST/F_ISR: si finanzas cambia un factor, pantalla y Excel se despegan.
- Tira verde de nómina línea 1501: interpola {p.imss} y {p.prestaciones} crudos
  mientras {p.isr??F_ISR} sí usa ??. Si alguno queda undefined imprime
  "(1++0.05)".
- KPI de margen muestra 0.0% con ingresos en cero (división por cero pintada
  como resultado).
- Ingresos se capturan en Resumen mensual (pantalla de visualización, sin botón
  Guardar) y NO persisten a Supabase — CONFIRMADO por GET: precio_fijo e
  ingAdicionales vacíos en Cuervito mientras la pantalla mostraba $7,905,600 desde
  localStorage.
- Cuervito no cuadra contra docs/guia-capturar-cuervito.html: SERVICIOS da 3K
  contra 1,294,000 esperados, ARRENDA cae en SIN CATEGORÍA, HERRAMIENTA cae en
  EQUIPOS Y ENSERES, INSUMOS DE OFICINA da 21K contra 32,400. Sin diagnosticar:
  falta separar dato mal capturado de mapeo incorrecto.

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
