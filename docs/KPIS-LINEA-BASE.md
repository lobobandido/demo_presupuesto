# Línea base de los cinco KPIs — Resumen mensual

**Ingresos = $0.00 en los dos presupuestos NO es un error de este documento. Es
el valor real en Supabase: `precio_fijo` e `ingAdicionales` están vacíos en ambos
registros. La pantalla de Resumen mensual puede mostrar ingresos distintos
(en Cuervito llegó a mostrar $7,905,600) porque esos datos viven solo en
localStorage del navegador — se capturan en una pantalla de visualización que
no tiene botón Guardar. Si se limpia localStorage, se pierden.**

**Por eso el KPI de Ingresos NO sirve todavía como control de regresión: comparar
contra $0.00 es válido solo mientras la captura de ingresos siga sin persistir.
Cuando se arregle, hay que re-congelar esta línea base a propósito.**

Congelada el 2026-08-06. Cualquier cambio que pueda mover un monto (distribuirOpex,
distribuirNomina, mesIndexCapex, calcularNumMesesOp, calcularSerieMensual,
construirFilasServicio, totalCat, totalNom, totalOpexAnualCat, exportarExcel, etc.)
se verifica contra este archivo **antes y después**, siguiendo el protocolo del skill
`verificar-regresion`. Si un número se mueve sin que el usuario haya confirmado que el
cambio es intencional, es una regresión.

## Presupuestos de esta línea base

Al 2026-08-06 el listado en Supabase (tabla `presupuestos`) solo tiene dos registros:

| Nombre | id | Tipo | Periodo |
|---|---|---|---|
| Presupuesto TI H1 2026 | `6bb13b6c-9d4e-44aa-be9a-975757411e17` | departamento | 2025-12-01 → 2026-06-01 (M0..M6, 7 meses) |
| Cuervito | `d53dbb14-0d02-41bf-b38d-ec53368793bc` | servicio | 2026-02-02 → 2027-02-02 (M0..M12, 13 meses) |

**"Perdiz - Papan CS" ya no está en el listado** — no forma parte de esta línea base.

## Metodología (sin navegador, sin escritura)

Los cinco KPIs se muestran en `src/App.jsx`, Step 4 ("Resumen mensual"), líneas
3789-3807. Cada valor viene de una constante calculada más arriba en el mismo bloque
(línea 3477-3486), a partir de `calcularSerieMensual()` (línea 380).

Para obtener los valores actuales **no se usó navegador** (la skill de proyecto
`verificar-regresion` prohíbe pruebas automatizadas de navegador; eso lo hace el
usuario a mano). En su lugar:

1. Se hizo **GET puro** (REST API de Supabase, con la anon key pública del `.env`) a
   `presupuestos`, `areas_presupuesto`, `partidas_capex`, `partidas_opex_mat`,
   `partidas_opex_via`, `nomina` e `ingresos_adicionales` para ambos presupuestos.
   Cero INSERT/UPDATE/DELETE.
2. Se copiaron **verbatim** las funciones puras que ya usa la app —
   `distribuirOpex`, `mesIndexCapex`, `calcularNumMesesOp`, `distribuirNomina` (y las
   constantes `PM_INTERVALO`, `F_IMSS`, `F_PREST`, `F_ISR`) — a un script Node aparte,
   y el mapeo snake_case→camelCase de `cargarPresupuestoDeNube` (`supabaseApi.js`
   líneas 184-268), incluida la derivación de `ingresos` a partir de `precio_fijo`
   (líneas 244-249). Cero lógica reescrita a mano.
3. El script corrió esas mismas funciones sobre los datos reales bajados por GET.

**Caveat importante:** esto reproduce exactamente lo que la app calcula a partir de lo
que está guardado en Supabase. **No incluye** partidas de plantillas (`capexPM`/
`opexPM`), que viven solo en `localStorage` del navegador y no se leen por GET — si
algún presupuesto tiene plantillas activas sin guardar, esta línea base no las
refleja. Tampoco incluye ingresos capturados en pantalla pero no persistidos (bug
abierto: "Resumen mensual no tiene botón Guardar, sin confirmar si persiste a
Supabase o solo a localStorage" — ver CLAUDE.md). Para ambos presupuestos,
`ingresos_adicionales` está vacío y `precio_fijo` es `0` en Supabase, así que Ingresos
da `$0.00` en los dos — no es un bug de este cálculo, es lo que hay guardado.

## Los cinco KPIs

### 1. Ingresos

- **Variable:** `totalIngresosAnual` (retornada por `calcularSerieMensual`, línea 492:
  `mIngresos.reduce((s,v)=>s+v,0)`).
- **Fórmula:** suma de `mIngresos[i]`, donde `mIngresos[i] = ingresos[i] + Σ ingAdicionales con mes=i`;
  `ingresos` se deriva de `precio_fijo × meses` al cargar desde Supabase (`supabaseApi.js:244-249`).
- **Cuervito:** `$0.00`
- **Presupuesto TI H1 2026:** `$0.00`

### 2. CAPEX

- **Variable:** `totalCAPEX` (línea 3482: `mCapex.reduce((s,v)=>s+v,0)`).
- **Fórmula:** suma de `mCapex[i]`, donde cada partida CAPEX cae en `mesIndexCapex(p,fechaInicio,NUM_MESES_OP)`
  con monto `cantidad×monto`.
- **Cuervito:** `$7,038,940.00`
- **Presupuesto TI H1 2026:** `$3,822,412.00`

### 3. OPEX

- **Variable:** `totalOPEX` (línea 3483: `mOpex.reduce((s,v)=>s+v,0)`).
- **Fórmula:** suma de `mOpex[i]`, acumulando `distribuirOpex(p,NUM_MESES_OP)` de cada partida
  mat/vía y `distribuirNomina(p,NUM_MESES_OP)` de cada puesto de nómina, por área.
- **Cuervito:** `$3,024,336.00`
- **Presupuesto TI H1 2026:** `$1,157,279.86`

### 4. Total egresos

- **Variable:** `totalEgr` (línea 3484: `totalCAPEX+totalOPEX`).
- **Fórmula:** `totalCAPEX + totalOPEX`.
- **Cuervito:** `$10,063,276.00`
- **Presupuesto TI H1 2026:** `$4,979,691.86`

### 5. Utilidad y margen

- **Variable:** `utilidad` (línea 3485: `totalIngresosAnual-totalEgr`) y `margen`
  (línea 3486: `totalIngresosAnual>0 ? (utilidad/totalIngresosAnual)*100 : 0`), mostrado
  como el número principal más un badge de porcentaje.
- **Fórmula:** `utilidad = totalIngresosAnual − totalEgr`; `margen = utilidad/totalIngresosAnual × 100`
  (o `0` si `totalIngresosAnual` es `0` — KPI conocido de "margen 0.0% con ingresos en cero", ver
  bugs abiertos en CLAUDE.md).
- **Cuervito:** `$-10,063,276.00` · margen `0.0%`
- **Presupuesto TI H1 2026:** `$-4,979,691.86` · margen `0.0%`

## Resumen de tabla

| KPI | Cuervito | Presupuesto TI H1 2026 |
|---|---|---|
| Ingresos | $0.00 | $0.00 |
| CAPEX | $7,038,940.00 | $3,822,412.00 |
| OPEX | $3,024,336.00 | $1,157,279.86 |
| Total egresos | $10,063,276.00 | $4,979,691.86 |
| Utilidad | $-10,063,276.00 | $-4,979,691.86 |
| Margen | 0.0% | 0.0% |
