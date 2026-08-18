# Estado actual de la app — derivado del código

**Fecha:** 2026-08-11 · **Commit base:** `bf3f5b0` · **Fuente única:** `src/App.jsx` (4,462 líneas)
y `src/supabaseApi.js` (279 líneas).

Este documento describe la app **tal como está hoy**, leída del código. **No** se derivó de los
specs: los cuatro specs de `docs/specs/` son actas históricas que se contradicen entre sí, y esta
auditoría existe justamente para saber cuál refleja la realidad. Cuando un spec pide algo que el
código no hace, se anota en la sección **E**, no se da por implementado.

Cada afirmación lleva su referencia `archivo:línea`. Lo que no se pudo verificar leyendo código está
al final, bajo **NO VERIFICABLE EN CÓDIGO** — no se completó ningún hueco con lo que dice un spec.

> **Nota de método:** esta pasada fue de solo lectura. No se tocó `src/App.jsx`, `src/supabaseApi.js`
> ni `src/supabaseClient.js`, no se consultó Supabase (ni con GET) y no se ejecutó ningún navegador.

> **Corrección a CLAUDE.md:** dice que `src/App.jsx` tiene «~3,700 líneas». Hoy tiene **4,462**.

---

## A. Pantallas y navegación

La app es un solo componente `App()` (`src/App.jsx:2189`) con seis ramas `if(step===N)` y un
`return null` final (`src/App.jsx:4462`). No hay router: la navegación es `setStep()`.

### Estructura común a todas las pantallas

Toda pantalla se pinta dentro de `wrap(children, miga)` (`src/App.jsx:2757`), que arma barra
lateral + encabezado + miga de pan.

**Barra lateral** (`src/App.jsx:2844-2883`): logo `GEOLIS` / `SA DE CV` / `Módulo de Presupuestos`
(`src/App.jsx:2851-2853`) y el menú `NAV`, que tiene **una sola entrada**:

```js
const NAV=[{i:0,icon:"◉",label:"Presupuestos"}];   // src/App.jsx:2738-2740
```

Al picarla, `setStep(0)` (`src/App.jsx:2862`). No hay más renglones, ni bloqueados ni atenuados.

**Miga de pan** (`src/App.jsx:2890-2914`): siempre arranca con el eslabón fijo **`Inicio`**, que
navega a `setStep(0)` (`src/App.jsx:2896-2897`). Después se concatenan los segmentos que cada
pantalla pasa como segundo argumento de `wrap`. Un eslabón es clicable solo si **no es el último**
y **tiene `onClick`** (`src/App.jsx:2904`); si no, se pinta en negritas y sin cursor de mano
(`src/App.jsx:2909-2910`).

El encabezado **no tiene ningún botón** — ni navegación ni 🗑 (`src/App.jsx:2915-2923`, comentario
que documenta el retiro).

Helper de navegación compartido, `irACapturarCostos` (`src/App.jsx:2752-2756`): preselecciona la
primera área si no hay activa, pone `flujoCreacion=false` y va a `setStep(3)`.

---

### Step 0 — Listado de presupuestos

| Elemento | Valor real | Referencia |
|---|---|---|
| Título | `Presupuestos` | `src/App.jsx:2937` |
| Subtítulo | `{lista.length} presupuesto(s) registrado(s)` | `src/App.jsx:2938` |
| Miga de pan | `Inicio / Presupuestos` | `src/App.jsx:3037` + `2896` |
| Columnas de la tabla | `Proyecto` · `Tipo` · `Acciones` | `src/App.jsx:2949` |

Debajo del nombre de cada renglón se muestran `Inicio del proyecto: …` y `Vigencia: … → …`
(`src/App.jsx:2964-2965`). **No hay columna «Estado»** (`src/App.jsx:2944-2945`).

**Botones de la pantalla:**

| Botón | Handler | Destino | Referencia |
|---|---|---|---|
| `+ Nuevo presupuesto` | `abrirNuevo` | Step 1 | `src/App.jsx:2940` · handler `2368-2376` |

**Botones por cada renglón** (en este orden, de izquierda a derecha):

| # | Botón | Handler | Destino | Referencia |
|---|---|---|---|---|
| 1 | `Información general` | `abrirPresupuesto(p)` | Step 5 | `src/App.jsx:2974-2980` · handler `2419-2433` |
| 2 | `Editar` | `abrirEdit(p)` | **Step 3** | `src/App.jsx:2981-2984` · handler `2382-2414` |
| 3 | `Clonar` | `setClonarModal(p)` + `setClonarTipo(p.tipo)` | abre modal | `src/App.jsx:2985-2991` |

`abrirPresupuesto` no navega directo: guarda en `presToOpen` y un `useEffect` aplica el estado y
hace `setStep(5)` (`src/App.jsx:2304-2339`, el `setStep(5)` en `2334`). `abrirEdit` termina en
`setStep(3)` (`src/App.jsx:2413`).

**No existe ningún botón de eliminar en el listado.** La función `eliminarPresupuesto`
(`src/App.jsx:2436-2454`) y `eliminarPresupuestoDeNube` (`src/supabaseApi.js:69-75`) siguen
definidas, pero **ningún JSX las invoca** — son código vivo e inalcanzable.

**Modal de Clonar** (`src/App.jsx:3001-3035`): muestra de cuál presupuesto se copia
(`src/App.jsx:3008`), rejilla de cuatro tipos (`src/App.jsx:3014-3027`) y dos botones —
`Cancelar` → cierra (`src/App.jsx:3030`) y `Continuar` → `clonarPresupuesto(clonarModal,clonarTipo)`
(`src/App.jsx:3031`, handler `2463-2526`, aterriza en `setStep(1)` en `3525`).

---

### Step 1 — Datos generales

| Elemento | Valor real | Referencia |
|---|---|---|
| Título | `Editar presupuesto` si `modoEdit`, si no `Nuevo presupuesto` | `src/App.jsx:3055-3057` |
| Miga de pan | `Inicio / Presupuestos / [nombre]` — último eslabón sin acción | `src/App.jsx:3369` |

**Botones (fila superior, únicos de la pantalla):**

| Botón | Handler | Destino | Referencia |
|---|---|---|---|
| `Cancelar` | `()=>setStep(0)` | Step 0 | `src/App.jsx:3059` |
| `Guardar` (si `modoEdit`) / `Continuar` | `guardarPres` | Step 2 | `src/App.jsx:3060` · handler `2528-2559` |

No hay botón de PDF ni de «Información general» en esta pantalla. `guardarPres` valida
nombre/tipo/fechaInicio/fechaFin y, si falta alguno, activa los avisos en rojo y **no navega**
(`src/App.jsx:2529-2530`).

Campos: Nombre*, Empresa, Fecha inicio*, Fecha fin*, Fecha de elaboración
(`src/App.jsx:3073-3110`). Debajo de las fechas va el bloque de origen y después el de tipo
(`src/App.jsx:3117-3266`):

- Si `viaClonar` es `true`: tarjeta **«Presupuesto de origen»** con un `<select>` de otros
  presupuestos guardados del mismo tipo (`src/App.jsx:3126-3167`), y el tipo se muestra como texto
  fijo, **no editable** (`src/App.jsx:3230-3237`).
- Si no: tarjeta **«¿Cómo quieres iniciar este presupuesto?»** con dos opciones — «Partir de un
  presupuesto anterior» → abre el modal de plantillas (`src/App.jsx:3182`) e «Iniciar desde cero»
  → limpia todo el estado (`src/App.jsx:3204-3205`). Y la rejilla de cuatro tipos
  (`src/App.jsx:3239-3264`).

**Modal de plantillas** (`src/App.jsx:3273-3367`): título «Selecciona una plantilla». Presenta
**dos listas separadas**: las plantillas de código (`sug`, `src/App.jsx:3283-3301`) y los
presupuestos guardados en Supabase del mismo tipo (`src/App.jsx:3306-3350`), más un bloque
«¿Prefieres empezar desde cero?» (`src/App.jsx:3351-3364`).

---

### Step 2 — Áreas / Participantes

| Elemento | Valor real | Referencia |
|---|---|---|
| Título | `Participantes` | `src/App.jsx:3381` |
| Subtítulo | `Selecciona quién capturará costos · [tipo]` | `src/App.jsx:3382-3384` |
| Miga de pan | `Inicio / Presupuestos / [nombre] / Áreas` | `src/App.jsx:3423` |

El eslabón `[nombre]` **sí** es clicable aquí y va a `irACapturarCostos` → Step 3
(`src/App.jsx:3423`).

**Botones:**

| Botón | Handler | Destino | Referencia |
|---|---|---|---|
| `Atrás` | `()=>setStep(1)` | Step 1 | `src/App.jsx:3419` |
| `Confirmar` | `confirmarAreas` | Step 3 | `src/App.jsx:3420` · handler `2608-2642` |

`Confirmar` está deshabilitado mientras `areas.length===0` (`src/App.jsx:3420`).

Las áreas ofrecidas dependen del tipo, vía `getAreasCat` (`src/App.jsx:41-45`): campo
(`AREAS_CAMPO`, 9 áreas, `src/App.jsx:17-27`), departamento (`AREAS_DEPTO`, 3,
`src/App.jsx:28-32`) o suministro (`AREAS_SUMINISTRO`, 6, `src/App.jsx:33-40`).

---

### Step 3 — Capturar costos

| Elemento | Valor real | Referencia |
|---|---|---|
| Título | `Captura de información` si `flujoCreacion`, si no `Editar — [nombre]` | `src/App.jsx:3460-3462` |
| Miga de pan | `Inicio / Presupuestos / [nombre] / Captura de información` | `src/App.jsx:3827` |

El eslabón `[nombre]` aquí se pinta **sin `onClick`** a propósito: se ve igual que el último, sin
acción (`src/App.jsx:3825-3827`).

**Botones de la fila superior:**

| Botón | Handler | Destino | Referencia |
|---|---|---|---|
| `← Información general` | `()=>setStep(5)` | Step 5 | `src/App.jsx:3479` |
| `Resumen mensual →` | `()=>setStep(4)` | Step 4 | `src/App.jsx:3480` |

Los dos están **deshabilitados mientras `flujoCreacion` es `true`** (`src/App.jsx:3479-3480`).

**Botón de guardado** (único de la pantalla, al final del panel de captura):

| Botón | Handler | Referencia |
|---|---|---|
| `Guardar` / `Guardando…` | `guardarTodo` | `src/App.jsx:3818` · handler `2658-2705` |

Se deshabilita mientras `guardando` es `true` (`src/App.jsx:3818`, estado en `2230`).

---

### Step 4 — Resumen mensual

| Elemento | Valor real | Referencia |
|---|---|---|
| Título | `Resumen mensual` | `src/App.jsx:3970` |
| Miga de pan | `Inicio / Presupuestos / [nombre] / Información general / Resumen mensual` | `src/App.jsx:4190` |

En esta miga, `[nombre]` va a `irACapturarCostos` (Step 3) e `Información general` va a
`setStep(5)` (`src/App.jsx:4190`).

**Botones:**

| Botón | Handler | Destino | Referencia |
|---|---|---|---|
| `← Información general` | `()=>setStep(5)` | Step 5 | `src/App.jsx:3992` |
| `⬇ Excel` | `exportarExcel({...})` | descarga `.xlsx` | `src/App.jsx:3993-3997` · función `1872-2108` |
| `⬇ PDF` | `()=>window.print()` | diálogo de impresión | `src/App.jsx:3998` |

Contenido, en orden: encabezado → tabla de Ingresos en **solo lectura** (si aplica el tipo,
`src/App.jsx:4011-4051`) → aviso de partidas sin categoría (`src/App.jsx:4054-4059`) → los cinco
KPIs (`src/App.jsx:4062-4083`) → Tabla SERVICIO (`src/App.jsx:4086-4094`) → Tabla FLUJO
(`src/App.jsx:4097-4107`) → Gráfica I (`src/App.jsx:4110-4125`) → Gráfica II
(`src/App.jsx:4128-4143`) → Resumen por área (`src/App.jsx:4146-4182`).

---

### Step 5 — Información general

| Elemento | Valor real | Referencia |
|---|---|---|
| Título | `Información general` | `src/App.jsx:4230` |
| Miga de pan | `Inicio / Presupuestos / [nombre] / Información general` | `src/App.jsx:4460` |

**Botones:**

| Botón | Handler | Destino | Referencia |
|---|---|---|---|
| `Resumen mensual →` | `()=>setStep(4)` | Step 4 | `src/App.jsx:4250` |
| `⬇ PDF` | `()=>window.print()` | diálogo de impresión | `src/App.jsx:4251` |

Contenido, en orden: encabezado con periodo (`src/App.jsx:4227-4243`) → los cinco KPIs
(`src/App.jsx:4256-4277`) → `TablaServicio` (`src/App.jsx:4280-4292`) → **detalle por área en solo
lectura** (`src/App.jsx:4299-4403`) → Gráfica de flujo (`src/App.jsx:4406-4430`) → Gráfica de OPEX
por categoría (`src/App.jsx:4433-4457`).

El detalle por área usa los mismos `SCard`/`PartidaTable`/`NominaTable` de Step 3 pero con
`readOnly={true}` (`src/App.jsx:4355`, `4366`, `4384`, `4399`): filas de puro texto, sin inputs, sin
«+ Agregar», sin `×` y sin botón Guardar. **No existe ningún interruptor de modo lectura/edición en
esta pantalla.**

---

## B. Captura

### Secciones de «Capturar costos» y su orden

En Step 3, de arriba hacia abajo:

| # | Sección | Ámbito | Referencia |
|---|---|---|---|
| 0 | **Ingresos** (condicional por tipo) | todo el presupuesto | `src/App.jsx:3495-3648` |
| — | Sidebar de participantes + Totales del presupuesto | — | `src/App.jsx:3653-3705` |
| 1 | **CAPEX · Equipos e inversiones** | área activa | `src/App.jsx:3748-3769` |
| 2 | **OPEX · Nómina y Mano de Obra** | área activa | `src/App.jsx:3772-3783` |
| 3 | **OPEX · Materiales** | área activa | `src/App.jsx:3786-3798` |
| 4 | **OPEX · Viáticos** | área activa | `src/App.jsx:3801-3813` |
| — | Botón `Guardar` | todo | `src/App.jsx:3817-3819` |

La sección de Ingresos vive **fuera** de `capture-grid` y por eso se muestra **una sola vez por
presupuesto**, no por área (`src/App.jsx:3495`, antes del `<div className="capture-grid">` de
`3650`).

Se oculta por completo cuando el tipo no factura:

```js
const mostrarIngresos = pres?.tipo==="instalacion"||pres?.tipo==="servicio";  // src/App.jsx:3447
```

### Dónde vive hoy la captura de Ingresos

**En Capturar costos (Step 3), y solo ahí.** Sus tres controles editables:

| Control | Referencia |
|---|---|
| `MoneyInput` de precio fijo mensual (distribuye a M1..Mn al cambiar) | `src/App.jsx:3516-3524` |
| Botón `Limpiar` (pone `precioFijo=0` e `ingresos` en ceros) | `src/App.jsx:3533-3537` |
| Botón `+ Agregar ingreso` y los renglones de `ingAdicionales` (mes, año, descripción, monto, `×`) | `src/App.jsx:3550-3604` |

En **Resumen mensual (Step 4)** solo queda la tabla ya calculada, sin un solo campo editable
(`src/App.jsx:4002-4051`; el comentario de `4002-4010` documenta el movimiento).

### Cuántos botones de «Guardar» hay y qué escribe cada uno

**Dos en toda la app, en pantallas distintas. Ninguna pantalla tiene dos.**

| # | Botón | Pantalla | Handler | Qué escribe |
|---|---|---|---|---|
| 1 | `Guardar` / `Continuar` | Step 1 | `guardarPres` (`src/App.jsx:2528-2559`) | Crea/actualiza en `lista` y `pres` locales, y llama a `guardarPresupuestoEnNube` con el snapshot completo (`src/App.jsx:2549-2558`) |
| 2 | `Guardar` | Step 3 | `guardarTodo` (`src/App.jsx:2658-2705`) | Marca el área activa como `"guardado"`, actualiza `pres`/`lista` y llama a `guardarPresupuestoEnNube` **una sola vez** con `areas`, `costos`, `ingAdicionales` y `precioFijo` (`src/App.jsx:2681-2682`) |

`guardarTodo` es el resultado de fusionar los dos botones que antes existían en Step 3
(`src/App.jsx:2650-2657`). El candado `guardando` se pone en `true` antes de la llamada y en `false`
en el `.finally` (`src/App.jsx:2680`, `2696`).

Ambos desembocan en `guardarPresupuestoEnNube` (`src/supabaseApi.js:128-189`), que escribe en siete
tablas: `presupuestos` (`:136`/`:139`), y tras un `delete` de `areas_presupuesto` (`:157`) reinserta
`areas_presupuesto` (`:163`), `partidas_capex` (`:170`), `partidas_opex_mat` (`:173`),
`partidas_opex_via` (`:176`), `nomina` (`:179`) e `ingresos_adicionales` (`:183-185`).

**Guardarraíl activo:** si el presupuesto ya existe y llegan **cero áreas**, no se toca ninguna área
ni partida — solo los campos generales (`src/supabaseApi.js:151-154`).

---

## C. Reglas de cálculo vigentes

Toda la serie mensual sale de `calcularSerieMensual` (`src/App.jsx:380-532`). La duración es
`NUM_MESES_OP = calcularNumMesesOp(fechaInicio, fechaFin)` (`src/App.jsx:384`, función en
`344-349`) y los arreglos tienen largo `NMESES = NUM_MESES_OP+1` por el M0 (`src/App.jsx:385`).

### CAPEX

Cada partida cae **entera en un solo mes**, el de su fecha real de compra:

```js
mCapex[mesIndexCapex(p,pres?.fechaInicio,NUM_MESES_OP)] += (p.cantidad||0)*(p.monto||0);
// src/App.jsx:409
```

`mesIndexCapex` (`src/App.jsx:309-315`) calcula la diferencia en meses entre `mesGastoMes`/
`mesGastoAnio` y `fechaInicio`, y la recorta al rango `[0, numMeses]` (`src/App.jsx:314`). **Sin
mes o sin año capturados, devuelve `0`** — la partida cae en M0 (`src/App.jsx:310`).

### OPEX (Materiales y Viáticos)

`distribuirOpex` (`src/App.jsx:287-301`) devuelve un arreglo de largo `numMeses+1`:

- El intervalo sale de `PM_INTERVALO` (`src/App.jsx:277`): mensual 1, bimestral 2, trimestral 3,
  semestral 6, anual 12.
- El mes de arranque es `Math.max(1, p.mesInicioOpex||1)` — **M0 nunca lleva OPEX**
  (`src/App.jsx:289`).
- El monto por ocurrencia es `(p.monto||0)*(p.cantidad||1)` (`src/App.jsx:290`).
- Un mes lleva monto solo si `i>=inicio` y `(i-inicio)%intervalo===0` (`src/App.jsx:296-297`).

### Qué hace `repeticiones`

Es el **tope de ocurrencias** de una partida OPEX:

```js
const maxOcurrencias = p.repeticiones>0 ? p.repeticiones : Infinity;   // src/App.jsx:294
...
const ocurrencia=(i-inicio)/intervalo+1;
return ocurrencia<=maxOcurrencias ? montoMes : 0;                      // src/App.jsx:298-299
```

Vacío, `0` o `null` significa **sin tope**: el gasto se repite hasta el fin del proyecto. Con un
número N, ocurre N veces y después queda en cero. Se captura en un input opcional dentro de la
columna de periodicidad (`src/App.jsx:1333-1338`), visible solo cuando `showPeriod` es `true` —
o sea, en Materiales y Viáticos, no en CAPEX.

**Se persiste en las dos tablas OPEX.** `opexToRow` agrega el campo cuando se le pasa
`incluirRepeticiones=true` (`src/supabaseApi.js:33-42`), y hoy lo reciben tanto materiales
(`src/supabaseApi.js:174`) como viáticos (`src/supabaseApi.js:177`). Al leer se recupera con
`repeticiones:r.repeticiones||null` en los dos casos (`src/supabaseApi.js:234` para materiales,
`:244` para viáticos). El parámetro conserva su default en `false` a propósito: si mañana se
agrega una tercera tabla OPEX sin esa columna, queda fuera sin romper su insert
(`src/supabaseApi.js:25-29`).

> **Corrección posterior (2026-08-18).** Este párrafo decía «Solo se persiste en
> `partidas_opex_mat`» y que viáticos no recibía el campo. Fue cierto entre `3a1b3af` (que lo
> transportó solo para materiales) y `2f01427` (que lo corrigió para viáticos). Esta auditoría,
> fechada el 2026-08-11, no se actualizó al corregirse. El comportamiento vigente es el descrito
> arriba: **Repeticiones funciona igual en Materiales y en Viáticos**, tanto al guardar como al
> recuperar.

### Nómina

`distribuirNomina` (`src/App.jsx:360-369`):

```js
const f = 1+(puesto.imss??F_IMSS)+(puesto.prestaciones??F_PREST)+(puesto.isr??F_ISR);
const costoMes = (puesto.salario||0)*f*(puesto.cantidad||1);
// src/App.jsx:361-362
```

La duración sale de `mesesNomina` (`src/App.jsx:352-357`): `fijo` dura todos los meses; `contrato` y
`outsourcing` duran `min(mesesContrato||12, numMeses)`. El mes de arranque es `1` para `fijo` y
`Math.max(1, mesInicio||1)` para los demás (`src/App.jsx:364`).

### Factores de nómina y de dónde salen

```js
const F_IMSS=0.32, F_PREST=0.40, F_ISR=0.05;   // src/App.jsx:539
```

Se usan con `??` (no `||`), así que un `0` capturado se respeta. Consumidores: `distribuirNomina`
(`src/App.jsx:361`), `NominaTable` (`src/App.jsx:1418`) y `totalNom` (`src/App.jsx:2353`).

**Los mismos tres factores están escritos en otros dos lugares del código:**

| Lugar | Forma | Referencia |
|---|---|---|
| `supabaseApi.js`, como valores por omisión al persistir | `F_IMSS_DEFAULT=0.32, F_PREST_DEFAULT=0.40, F_ISR_DEFAULT=0.05` | `src/supabaseApi.js:52`, usados en `:47` |
| `exportarExcel`, como **literales** | `(p.imss??0.32)+(p.prestaciones??0.40)+(p.isr??0.05)` | `src/App.jsx:2033` |

Son tres copias independientes del mismo dato. Hoy coinciden en valor.

### Ingresos

```js
const mIngresos = Array(NMESES).fill(0)
  .map((_,i)=>(ingresos[i]||0)+ingAdicionales.filter(x=>x.mes===i).reduce((s,x)=>s+x.monto,0));
const totalIngresosAnual = mIngresos.reduce((s,v)=>s+v,0);
// src/App.jsx:490-492
```

`ingresos[i]` viene del precio fijo distribuido a M1..Mn (`src/App.jsx:3520-3523` en captura;
`src/supabaseApi.js:259-260` al cargar de la nube). `calcularSerieMensual` **no filtra
`ingAdicionales` por tipo de presupuesto** (`src/App.jsx:491`): el ocultamiento por tipo es solo de
UI (`src/App.jsx:3447`, `3849`).

### Totales de pantalla (Capturar costos)

Los totales del sidebar de Step 3 no salen de `calcularSerieMensual` sino de sus propios helpers
(`src/App.jsx:2352-2365`). Ahí `opexPMt` usa **12 meses fijos** mientras `opexAreas` usa la duración
real (`src/App.jsx:2360` vs `2362`).

---

## D. Bases / plantillas

### Qué ofrece cada tipo al crear un presupuesto nuevo

El filtro es `plantillasSugeridas(tipo)` (`src/App.jsx:261-265`), que devuelve las entradas de
`PLANTILLAS` cuyo campo `tipos` incluye el tipo elegido.

| Tipo | Plantillas de código que ofrece | Referencia |
|---|---|---|
| `instalacion` | **2** — `cuervito` e `instalacion` | `src/App.jsx:171` y `212` |
| `servicio` | **1** — `cuervito` | `src/App.jsx:171` |
| `departamento` | **1** — `depto_ti` | `src/App.jsx:231` |
| `suministro` | **0** — ninguna entrada lo incluye | `src/App.jsx:171`, `212`, `231` |

A eso se suman, en el mismo modal, los presupuestos guardados en Supabase filtrados por el mismo
tipo (`src/App.jsx:3306-3350`), en una **segunda lista visualmente distinta**.

### Contenido de cada plantilla

| Clave | Nombre | `tipos` | CAPEX | OPEX | Nómina | Referencia |
|---|---|---|---|---|---|---|
| `cuervito` | Monitoreo Cuervito | `["servicio","instalacion"]` | 16 partidas | 10 partidas | 2 puestos | `src/App.jsx:170-210` |
| `instalacion` | Proyecto de Instalación | `["instalacion"]` | 4 partidas, **todas en `monto:0`** | 7 partidas, **todas en `monto:0`** | — | `src/App.jsx:211-229` |
| `depto_ti` | Depto. TI 2026 — Geolis | `["departamento"]` | 10 partidas | 7 partidas | `[]` | `src/App.jsx:230-258` |

`cuervito` trae además `tipos` con dos valores y montos de CAPEX que parecen unitarios en dólares
(ej. `Camionetas … monto:550000` en `src/App.jsx:175` frente a `Sensores de presión … monto:165` en
`176`); `depto_ti` trae `fechaInicio`/`fechaFin` propias (`src/App.jsx:233`).

### Estado del campo `tipos` de PLANTILLAS

**Los tres siguen poblados.** Ninguno está en `[]`:

```js
cuervito:    tipos:["servicio","instalacion"],   // src/App.jsx:171
instalacion: tipos:["instalacion"],              // src/App.jsx:212
depto_ti:    tipos:["departamento"],             // src/App.jsx:231
```

Las tres plantillas son **alcanzables desde la UI** hoy. `cargarPlantilla` (`src/App.jsx:2561-2569`)
y la rama de `plantKey` en `confirmarAreas` (`src/App.jsx:2611-2636`) están activas.

---

## E. Lo que NO existe (aunque algún spec lo pida)

Ordenado por spec de origen. Solo se listan puntos donde el spec pide algo concreto y el código
**no** lo implementa.

### De `spec-final-ux-agosto.md`

| Punto | Qué pide | Estado real |
|---|---|---|
| **1.4** | Información general con `✎ Editar partidas` | No existe. Los botones son `Resumen mensual →` y `⬇ PDF` (`src/App.jsx:4250-4251`) |
| **1.4** | Resumen mensual con `Editar por área` | No existe (`src/App.jsx:3991-3999`) |
| **1.5** | Botón del listado etiquetado `Datos generales` | Se llama `Editar` y va a Step 3, no a Step 1 (`src/App.jsx:2981-2984`) |
| **1.6.b** | `LineChart` debe recibir las etiquetas ya calculadas | `LineChart` acepta el prop `meses` (`src/App.jsx:1576`, `1602`) pero **nunca se renderiza** en toda la app — es código muerto |
| **2.1** | Indicador de 3 pasos durante la creación | No existe. `flujoCreacion` sí existe (`src/App.jsx:2221`) y se usa para el título y los botones, pero **no hay ningún JSX de indicador** dentro de `wrap` |
| **2.2 / 2.3 / 2.4** | Ocultar gráficas al editar · modal de Cancelar · chip de modo fuera del PDF | No existen. Superados por `spec-dos-sistemas-semana.md` día 3, que eliminó el modo edición de Step 5 |
| **3.1** | Eliminar `PLANTILLAS.instalacion` | Sigue completa (`src/App.jsx:211-229`) |
| **3.1** | Dejar `PLANTILLAS.cuervito.tipos` en `["servicio"]` | Sigue con `["servicio","instalacion"]` (`src/App.jsx:171`) |
| **3.2** | Una sola lista en el modal, con chip `Plantilla` / `Guardado` | Siguen siendo **dos listas separadas** con estilos distintos (`src/App.jsx:3283-3301` y `3325-3341`). Ningún chip de origen |

### De `spec-navegacion-retro-410.md`

| Punto | Qué pide | Estado real |
|---|---|---|
| **4** | Formulario de edición con botón `Información general` | No existe; solo `Cancelar` y `Guardar`/`Continuar` (`src/App.jsx:3058-3061`). El comentario de `3049-3053` documenta que Luis pidió quitarlo |
| **3.2** | «Editar» primero en el listado | El orden es `Información general`, `Editar`, `Clonar` (`src/App.jsx:2974-2991`), revertido por pedido posterior de Luis |
| **3.2** | Que Eliminar quede al menos en el 🗑 de la barra superior | **No queda ningún camino de UI para eliminar** (`src/App.jsx:2915-2923`) |

### De `spec-dos-sistemas-semana.md`

| Punto | Qué pide | Estado real |
|---|---|---|
| **Día 2** | Ocultar renglones en cero, con interruptor «Mostrar categorías sin monto» | No existe. `TablaServicio` (`src/App.jsx:2114-2186`) pinta todas las filas que recibe; su único estado es `expandidos` (`:2115`) |
| **Día 3** | Sustituir el `areas.map()` de Step 5 | **Sigue ahí**, ahora en solo lectura (`src/App.jsx:4299-4403`). Corrección posterior documentada en `src/App.jsx:4201-4204` |
| **Día 4** | Sección de Ingresos como `SCard` con título «Ingresos · Facturación proyectada» e ícono 💵 | Es un `<div>` con `<h3>Ingresos</h3>` (`src/App.jsx:3496-3506`), no un `SCard` y sin ícono |
| **Día 5** | Cargar Cuervito completo, ~45 subcategorías | La plantilla sigue con 16 CAPEX y 10 OPEX agregados (`src/App.jsx:174-204`) |
| **Limpieza** | Borrar `LineChart`, `BarChart`, `distMeses`, `vecesEnProyecto`, `HISTORIAL_NOMINA`, `fmtMiles`, `factor` de `PERIODICIDADES`, `mesGasto` de `initP`, `PLANTILLAS.instalacion`, `EstadoBadge` | **Los diez siguen en el archivo**: `1576`, `1621`, `570`, `280`, `76`, `543`, `269-275`, `558`, `211-229`, `673` |
| **D.1** | Unificar colores de leyenda de `FlowChart` con constantes | No hecho. La leyenda dice `C.danger`=`#C0392B` (`src/App.jsx:4115`) y se dibuja `#EF4444` (`:1711`); dice `#374151` (`:4116`) y se dibuja `#1E40AF` (`:1718`). Las constantes `COLOR_FLUJO_POS`/`COLOR_FLUJO_NEG`/`COLOR_ACUM` **no existen**. Falta también el cuarto elemento de leyenda |
| **D.2** | «Cifras presupuestadas — no incluye gasto ejecutado» bajo el título | No existe en ninguna pantalla |
| **D.2** | Encabezado «EGRESOS PRESUPUESTADOS» | Dice `EGRESOS año` (`src/App.jsx:1805`) |
| **D.3** | Aviso de meses iniciales sin movimiento | No existe |
| **D.4** | Validación que impida capturar nómina en Materiales/Viáticos | No existe. `CAT_OPEX_MAT` excluye la categoría del dropdown (`src/App.jsx:870-872`), pero `CatalogInput` acepta texto libre (`:763`) y no hay validación al guardar |
| **Limpieza** | Mover los archivos de generación de la raíz a `scripts/`/`data/` | No verificable en esta pasada (ver abajo) |

**D.2 sí implementado:** la columna dice `Total Presupuestado` en pantalla (`src/App.jsx:2135`) y en
el Excel (`src/App.jsx:1925`).

### De `spec-recuperacion-datos.md`

| Paso | Qué pide | Estado real |
|---|---|---|
| **1** | Guardarraíl de cero áreas | ✅ **Implementado** (`src/supabaseApi.js:151-154`) |
| **2** | `abrirEdit` async que carga de la nube y aborta si falla | ✅ **Implementado** (`src/App.jsx:2382-2390`) |
| **3** | `clonarPresupuesto` con el mismo arreglo | ✅ **Implementado** (`src/App.jsx:2463-2471`) |
| **4** | Botón `Capturar costos` en Información general | ❌ **No existe.** Se quitó por pedido posterior del cliente (`src/App.jsx:4244-4248`) |
| **5** | `guardarPres` deja de limpiar el estado | ✅ **Implementado** — las cuatro asignaciones ya no están (`src/App.jsx:2543-2547`) |
| **6** | Poner el campo `tipos` de las tres plantillas en `[]` | ❌ **No hecho** (`src/App.jsx:171`, `212`, `231`) |

---

## NO VERIFICABLE EN CÓDIGO

Lo siguiente **no** se puede afirmar leyendo `src/App.jsx` ni `src/supabaseApi.js`, y esta pasada
tenía prohibido consultar Supabase (ni con GET) y ejecutar navegador. Se deja explícitamente sin
afirmar:

1. **Qué presupuestos existen hoy en Supabase, y con qué montos.** El listado se arma en tiempo de
   ejecución mezclando `localStorage` y `listarPresupuestos()` (`src/App.jsx:2246-2269`). No hay
   ninguna lista de presupuestos escrita en el código. Todo lo que los specs dicen sobre «Los
   Soldados», «Perdiz - Papan CS», «EJEMPLO CUERVITO» o «Prueba Browser QA» es contenido de la base,
   no del código.
2. **Si el PASO 0 de `spec-recuperacion-datos.md` (borrar tres registros) se ejecutó.** Es una
   operación de base de datos y no deja rastro en el código.
3. **El contenido de `capexPM` / `opexPM` de un presupuesto.** `cargarPresupuestoDeNube` siempre los
   devuelve vacíos (`src/supabaseApi.js:273-274`); solo viven en `localStorage` bajo
   `geolis_app_state_v4` (`src/App.jsx:535-537`). No son inspeccionables desde el código.
4. **El contenido de `geolis_subcat_map`.** Es el mapeo de categorías que el usuario eligió a mano y
   altera el resultado de `macroDeCategoria` (`src/App.jsx:64-67`). Vive solo en `localStorage`.
5. **Si `catalogo_almacen` tiene filas en Supabase.** `buscarArticulosAlmacen`
   (`src/supabaseApi.js:78-94`) devuelve `[]` tanto si la tabla está vacía como si la consulta
   falla, así que desde el código no se distingue una cosa de la otra.
6. **Si los archivos de generación siguen en la raíz del repo** (`_gen_catalogo_almac…`,
   `catalogo_almacen_*.json`, `catalogo_stats.txt`, punto de Limpieza de
   `spec-dos-sistemas-semana.md`). No se listó el árbol del repo en esta pasada; solo se leyeron los
   archivos que pide el paso 1.
7. **Si algún camino de la UI truena al hacer clic.** No hay tipado y esta pasada no ejecutó la app
   (regla 5 de CLAUDE.md). Todo lo de arriba es lectura estática: describe qué handler está cableado
   a qué botón, no que el flujo completo funcione en el navegador.
8. **Los datos del punto 3.4 de `spec-final-ux-agosto.md`** (fechas incoherentes de «Los Soldados»,
   facturación idéntica entre «Cunduacán» y «Los Soldados»). Son contenido de registros, no código.
