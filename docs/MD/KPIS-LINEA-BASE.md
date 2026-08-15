# Línea base de los cinco KPIs — Resumen mensual

**Ampliada el 2026-08-15 (tercera versión) — se AGREGA `PERDIZ-PAPAN`. Cuervito y TI H1 2026
no se tocan: se volvieron a medir el mismo día y dieron exactamente los mismos valores de la
segunda versión, así que sus cifras congeladas siguen vigentes sin cambio.**

Perdiz no se había podido congelar antes por dos motivos, ya resueltos: `repeticiones` no se
persistía en `partidas_opex_via` (arreglado en el commit `2f01427` — hoy sus cuatro viáticos
traen `3, 3, 3, 2`, verificado por GET), y quedaban dos errores de captura en Materiales
(`hielo y agua` sin tope de repeticiones y `articulos digitales y de computo` con una
repetición en vez de dos), que el usuario corrigió desde la UI antes de esta congelación.

Esta versión agrega además el **desglose de OPEX** (nómina / materiales / viáticos) para los
tres presupuestos. Es información nueva, no un cambio: los tres desgloses suman exactamente
el OPEX ya congelado.

**Re-congelada el 2026-08-10 (segunda versión) — intencional, no un número que "se movió".**
La línea base anterior (2026-08-06) congeló a propósito un estado con datos de prueba: nómina de
Cuervito mal capturada (factores 0.32/0.00/0.05, sin repeticiones en CUADRILLA DE INSTALACION,
`repeticiones` sin columna en Supabase — ver CLAUDE.md, bug ya arreglado en el commit `3a1b3af`), e
Ingresos en `$0.00` porque la captura en Resumen mensual no persistía a Supabase (bug ya arreglado
— la captura se movió a Capturar costos). Esta versión reemplaza esos números por los que da la app
**después** de los dos arreglos, verificados con GET puro y confirmados por el usuario sobreviviendo
salir y volver a entrar dos veces a "Editar — Cuervito".

**Commit de referencia de la tercera versión (Perdiz): `e396d9f`.** El último cambio de código
antes de ella es `2f01427` ("fix: transportar repeticiones también en viáticos"), que es
precisamente el que hizo medible a Perdiz.

**Commit de referencia de la segunda re-congelación: `02f8a05`** — "fix: fusionar los dos botones
'Guardar' de Capturar costos en uno solo". Es el último cambio de código antes de esta
re-congelación; los valores de abajo reflejan el estado de Supabase tal como quedó después de
guardar con ese único botón.

Cualquier cambio que pueda mover un monto (`distribuirOpex`, `distribuirNomina`, `mesIndexCapex`,
`calcularNumMesesOp`, `calcularSerieMensual`, `construirFilasServicio`, `totalCat`, `totalNom`,
`totalOpexAnualCat`, `exportarExcel`, etc.) se verifica contra este archivo **antes y después**,
siguiendo el protocolo del skill `verificar-regresion`. Si un número se mueve sin que el usuario
haya confirmado que el cambio es intencional, es una regresión.

## Presupuestos de esta línea base

El listado en Supabase (tabla `presupuestos`) tiene hoy **tres** registros — los dos de la versión
anterior más Perdiz:

| Nombre | id | Tipo | Periodo |
|---|---|---|---|
| Presupuesto TI H1 2026 | `6bb13b6c-9d4e-44aa-be9a-975757411e17` | departamento | 2025-12-01 → 2026-06-01 (M0..M6, 7 meses) |
| Cuervito | `d53dbb14-0d02-41bf-b38d-ec53368793bc` | servicio | 2026-02-02 → 2027-02-02 (M0..M12, 13 meses) |
| PERDIZ-PAPAN | `a7ad9f62-d628-4569-ae7f-d47bd378fcc3` | instalacion | 2026-01-01 → 2027-02-01 (M0..M13, 14 meses) |

Conteo de partidas al momento de congelar, para detectar si alguien agregó o borró filas:

| Presupuesto | áreas | CAPEX | OPEX-mat | OPEX-via | nómina | ingresos adic. |
|---|---:|---:|---:|---:|---:|---:|
| Presupuesto TI H1 2026 | 1 | 9 | 12 | 0 | 0 | 0 |
| Cuervito | 1 | 17 | 12 | 0 | 2 | 12 |
| PERDIZ-PAPAN | 1 | 9 | 20 | 4 | 8 | 3 |

## Metodología (sin navegador, sin escritura)

Los cinco KPIs se muestran en `src/App.jsx`, Step 4 ("Resumen mensual", líneas ~4064 en adelante) y
Step 5 ("Información general", líneas ~4258 en adelante) — mismo bloque de KPIs en las dos
pantallas. Los totales se calculan justo arriba de cada bloque (`totalCAPEX`/`totalOPEX`/
`totalEgr`/`utilidad`/`margen`, líneas ~3841-3845 y ~4211-4215), a partir de `calcularSerieMensual()`
(línea 380) y su `totalIngresosAnual` (línea 492: `mIngresos.reduce((s,v)=>s+v,0)`).

Para obtener los valores actuales **no se usó navegador** (la skill de proyecto
`verificar-regresion` prohíbe pruebas automatizadas de navegador; eso lo hace el usuario a mano). En
su lugar:

1. Se hizo **GET puro** (REST API de Supabase, con la anon key pública del `.env`) a
   `presupuestos`, `areas_presupuesto`, `partidas_capex`, `partidas_opex_mat`,
   `partidas_opex_via`, `nomina` e `ingresos_adicionales` para los tres presupuestos.
   Cero INSERT/UPDATE/DELETE.
2. Se copiaron **verbatim** las funciones puras que ya usa la app —
   `distribuirOpex`, `mesIndexCapex`, `calcularNumMesesOp`, `distribuirNomina` (y las
   constantes `PM_INTERVALO`, `F_IMSS`, `F_PREST`, `F_ISR`) — a un script Node aparte,
   y el mapeo snake_case→camelCase de `cargarPresupuestoDeNube` (`supabaseApi.js`),
   incluida la lectura de `repeticiones` (columna agregada en el commit `3a1b3af`) y la
   derivación de `ingresos` a partir de `precio_fijo`. Cero lógica reescrita a mano.
3. El script corrió esas mismas funciones sobre los datos reales bajados por GET.

**Caveat que sigue aplicando:** esto reproduce exactamente lo que la app calcula a partir de lo que
está guardado en Supabase. **No incluye** partidas de plantillas (`capexPM`/`opexPM`), que viven
solo en `localStorage` del navegador y no se leen por GET.

**Lo que ya NO aplica de la versión anterior:** el caveat de que "Ingresos = $0.00 no es un bug,
es lo que hay guardado" — ya no es cierto. Ingresos de Cuervito persiste correctamente
($7,905,600.00, 12 renglones reales en `ingresos_adicionales`); TI H1 2026 sigue en $0.00 porque de
verdad no tiene ingresos capturados (es tipo Departamento, sin sección de Ingresos en la UI).

## Los cinco KPIs

### 1. Ingresos

- **Variable:** `totalIngresosAnual` (retornada por `calcularSerieMensual`, línea 492:
  `mIngresos.reduce((s,v)=>s+v,0)`).
- **Fórmula:** suma de `mIngresos[i]`, donde `mIngresos[i] = ingresos[i] + Σ ingAdicionales con mes=i`;
  `ingresos` se deriva de `precio_fijo × meses` al cargar desde Supabase.
- **Cuervito:** `$7,905,600.00`
- **Presupuesto TI H1 2026:** `$0.00`
- **PERDIZ-PAPAN:** `$71,207,752.69` (los 3 renglones de `ingresos_adicionales`; `precio_fijo` en 0)

### 2. CAPEX

- **Variable:** `totalCAPEX` (`mCapex.reduce((s,v)=>s+v,0)`).
- **Fórmula:** suma de `mCapex[i]`, donde cada partida CAPEX cae en `mesIndexCapex(p,fechaInicio,NUM_MESES_OP)`
  con monto `cantidad×monto`.
- **Cuervito:** `$7,038,940.00`
- **Presupuesto TI H1 2026:** `$3,822,412.00`
- **PERDIZ-PAPAN:** `$25,351,949.81`

### 3. OPEX

- **Variable:** `totalOPEX` (`mOpex.reduce((s,v)=>s+v,0)`).
- **Fórmula:** suma de `mOpex[i]`, acumulando `distribuirOpex(p,NUM_MESES_OP)` de cada partida
  mat/vía (ahora incluyendo `repeticiones` cuando está capturado) y `distribuirNomina(p,NUM_MESES_OP)`
  de cada puesto de nómina, por área.
- **Cuervito:** `$3,939,800.00`
- **Presupuesto TI H1 2026:** `$1,157,279.86`
- **PERDIZ-PAPAN:** `$9,863,166.04`

### 4. Total egresos

- **Variable:** `totalEgr` (`totalCAPEX+totalOPEX`).
- **Fórmula:** `totalCAPEX + totalOPEX`.
- **Cuervito:** `$10,978,740.00`
- **Presupuesto TI H1 2026:** `$4,979,691.86`
- **PERDIZ-PAPAN:** `$35,215,115.85`

### 5. Utilidad y margen

- **Variable:** `utilidad` (`totalIngresosAnual-totalEgr`) y `margen`
  (`totalIngresosAnual>0 ? (utilidad/totalIngresosAnual)*100 : 0`), mostrado
  como el número principal más un badge de porcentaje ("—" cuando `totalIngresosAnual` es `0`).
- **Fórmula:** `utilidad = totalIngresosAnual − totalEgr`; `margen = utilidad/totalIngresosAnual × 100`
  (o `0`/"—" si `totalIngresosAnual` es `0`).
- **Cuervito:** `$-3,073,140.00` · margen `-38.9%`
- **Presupuesto TI H1 2026:** `$-4,979,691.86` · margen `0.0%` (badge muestra "—")
- **PERDIZ-PAPAN:** `$35,992,636.84` · margen `50.5%`

## Desglose de OPEX (nómina / materiales / viáticos)

No es un KPI de pantalla: la app muestra el OPEX como un solo número. Este desglose se congela
porque es lo que permite localizar **en qué componente** se movió un monto cuando el total cambia,
sin volver a bajar todo. Cada renglón suma exactamente el OPEX congelado arriba.

| Presupuesto | Nómina | Materiales | Viáticos | **OPEX total** |
|---|---:|---:|---:|---:|
| Presupuesto TI H1 2026 | `$0.00` | `$1,157,279.86` | `$0.00` | **`$1,157,279.86`** |
| Cuervito | `$783,000.00` | `$3,156,800.00` | `$0.00` | **`$3,939,800.00`** |
| PERDIZ-PAPAN | `$2,802,000.00` | `$4,594,242.59` | `$2,466,923.45` | **`$9,863,166.04`** |

- **Nómina** = Σ `distribuirNomina(p, NUM_MESES_OP)` de cada puesto.
- **Materiales** = Σ `distribuirOpex(p, NUM_MESES_OP)` de cada partida de `partidas_opex_mat`.
- **Viáticos** = Σ `distribuirOpex(p, NUM_MESES_OP)` de cada partida de `partidas_opex_via`.

Perdiz es el único de los tres con viáticos capturados, y por lo tanto **el único que ejercita
`repeticiones` en esa tabla**. Sus cuatro partidas traen `3, 3, 3, 2`: si alguna aparece en `null`
en una medición futura, no es que el dato haya cambiado — es que se rompió la persistencia otra vez
(ver commit `2f01427`).

## Diferencias ESPERADAS contra el documento fuente — no son bugs

Perdiz se capturó contra un documento de control cuyas cifras están en
`docs/MD/guia-capturar-perdiz.md`. **No cuadra al peso, y no debe cuadrar.** Las diferencias están
identificadas y explicadas; perseguirlas como si fueran errores de la app es tiempo perdido.

| KPI | App (congelado) | Control del spec | Diferencia |
|---|---:|---:|---:|
| Ingresos | `$71,207,752.69` | `71,207,752.69` | **cuadra al peso** |
| CAPEX | `$25,351,949.81` | `25,351,949.71` | `+0.10` |
| OPEX | `$9,863,166.04` | `9,886,209.30` | **`−23,043.26`** |
| Total egresos | `$35,215,115.85` | `35,238,159.02` | `−23,043.17` |

### El gap de OPEX se descompone en dos, y solo uno es estructural

**1. Nómina: `−23,042.76`. Esta es la diferencia esperada de verdad.**

La app da `$2,802,000.00`; el control dice `2,825,042.76`. Los `23,042.76` de diferencia son
**aguinaldo, fondo de ahorro y utilidades (PTU)**, que en el Excel de Geolis viven en columnas
propias de la hoja `F01 NÓMINA` y que **el modelo de nómina de la app no captura**: solo tiene
salario × (1 + IMSS + Prestaciones + ISR) × cantidad. No hay campo donde meterlos.

Es una limitación conocida del modelo, no un error de captura ni un defecto de cálculo. Mientras la
app no gane esos tres conceptos, **cualquier presupuesto con nómina va a quedar por debajo de su
documento fuente en la misma proporción**. Está documentado también en la sección 10.2 del manual
de usuario.

**2. Materiales: `−0.51`. Redondeo de captura, sin importancia.**

Son cuatro centavos sueltos de partidas capturadas con un decimal distinto al del control
(`aseo +0.01`, `cafetería +0.01`, `gases +0.42`, `hielo y agua −0.92`). Además, el propio documento
de control no cuadra consigo mismo: sus 20 renglones de materiales suman `4,594,243.07` pero su
renglón de total dice `4,594,243.10` — tres centavos que no salen de la app.

**Viáticos cuadra contra el control**, sin diferencia.

### Los `+0.10` de CAPEX

Sin explicar. Cuando se escribió `guia-capturar-perdiz.md`, la app daba `25,351,949.70` contra un
control de `25,351,949.71`; hoy da `25,351,949.81`. O sea, el CAPEX se movió `+0.11` entre aquella
medición y esta, por alguna corrección hecha desde la UI en el intervalo. Son diez centavos sobre
25.3 millones y no se rastreó. **Se congela así, a propósito**, para que quede constancia: si en
una medición futura el CAPEX de Perdiz vuelve a moverse, el punto de comparación es
`25,351,949.81`, no el número del spec.

## Resumen de tabla

| KPI | Cuervito | Presupuesto TI H1 2026 | PERDIZ-PAPAN |
|---|---|---|---|
| Ingresos | $7,905,600.00 | $0.00 | $71,207,752.69 |
| CAPEX | $7,038,940.00 | $3,822,412.00 | $25,351,949.81 |
| OPEX | $3,939,800.00 | $1,157,279.86 | $9,863,166.04 |
| · nómina | $783,000.00 | $0.00 | $2,802,000.00 |
| · materiales | $3,156,800.00 | $1,157,279.86 | $4,594,242.59 |
| · viáticos | $0.00 | $0.00 | $2,466,923.45 |
| Total egresos | $10,978,740.00 | $4,979,691.86 | $35,215,115.85 |
| Utilidad | $-3,073,140.00 | $-4,979,691.86 | $35,992,636.84 |
| Margen | -38.9% | 0.0% ("—" en pantalla) | 50.5% |
