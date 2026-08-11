# Línea base de los cinco KPIs — Resumen mensual

**Re-congelada el 2026-08-10 (segunda versión) — intencional, no un número que "se movió".**
La línea base anterior (2026-08-06) congeló a propósito un estado con datos de prueba: nómina de
Cuervito mal capturada (factores 0.32/0.00/0.05, sin repeticiones en CUADRILLA DE INSTALACION,
`repeticiones` sin columna en Supabase — ver CLAUDE.md, bug ya arreglado en el commit `3a1b3af`), e
Ingresos en `$0.00` porque la captura en Resumen mensual no persistía a Supabase (bug ya arreglado
— la captura se movió a Capturar costos). Esta versión reemplaza esos números por los que da la app
**después** de los dos arreglos, verificados con GET puro y confirmados por el usuario sobreviviendo
salir y volver a entrar dos veces a "Editar — Cuervito".

**Commit de referencia de esta re-congelación: `02f8a05`** — "fix: fusionar los dos botones
'Guardar' de Capturar costos en uno solo". Es el último cambio de código antes de esta
re-congelación; los valores de abajo reflejan el estado de Supabase tal como quedó después de
guardar con ese único botón.

Cualquier cambio que pueda mover un monto (`distribuirOpex`, `distribuirNomina`, `mesIndexCapex`,
`calcularNumMesesOp`, `calcularSerieMensual`, `construirFilasServicio`, `totalCat`, `totalNom`,
`totalOpexAnualCat`, `exportarExcel`, etc.) se verifica contra este archivo **antes y después**,
siguiendo el protocolo del skill `verificar-regresion`. Si un número se mueve sin que el usuario
haya confirmado que el cambio es intencional, es una regresión.

## Presupuestos de esta línea base

El listado en Supabase (tabla `presupuestos`) sigue con los mismos dos registros de la versión
anterior:

| Nombre | id | Tipo | Periodo |
|---|---|---|---|
| Presupuesto TI H1 2026 | `6bb13b6c-9d4e-44aa-be9a-975757411e17` | departamento | 2025-12-01 → 2026-06-01 (M0..M6, 7 meses) |
| Cuervito | `d53dbb14-0d02-41bf-b38d-ec53368793bc` | servicio | 2026-02-02 → 2027-02-02 (M0..M12, 13 meses) |

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
   `partidas_opex_via`, `nomina` e `ingresos_adicionales` para ambos presupuestos.
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

### 2. CAPEX

- **Variable:** `totalCAPEX` (`mCapex.reduce((s,v)=>s+v,0)`).
- **Fórmula:** suma de `mCapex[i]`, donde cada partida CAPEX cae en `mesIndexCapex(p,fechaInicio,NUM_MESES_OP)`
  con monto `cantidad×monto`.
- **Cuervito:** `$7,038,940.00`
- **Presupuesto TI H1 2026:** `$3,822,412.00`

### 3. OPEX

- **Variable:** `totalOPEX` (`mOpex.reduce((s,v)=>s+v,0)`).
- **Fórmula:** suma de `mOpex[i]`, acumulando `distribuirOpex(p,NUM_MESES_OP)` de cada partida
  mat/vía (ahora incluyendo `repeticiones` cuando está capturado) y `distribuirNomina(p,NUM_MESES_OP)`
  de cada puesto de nómina, por área.
- **Cuervito:** `$3,939,800.00`
- **Presupuesto TI H1 2026:** `$1,157,279.86`

### 4. Total egresos

- **Variable:** `totalEgr` (`totalCAPEX+totalOPEX`).
- **Fórmula:** `totalCAPEX + totalOPEX`.
- **Cuervito:** `$10,978,740.00`
- **Presupuesto TI H1 2026:** `$4,979,691.86`

### 5. Utilidad y margen

- **Variable:** `utilidad` (`totalIngresosAnual-totalEgr`) y `margen`
  (`totalIngresosAnual>0 ? (utilidad/totalIngresosAnual)*100 : 0`), mostrado
  como el número principal más un badge de porcentaje ("—" cuando `totalIngresosAnual` es `0`).
- **Fórmula:** `utilidad = totalIngresosAnual − totalEgr`; `margen = utilidad/totalIngresosAnual × 100`
  (o `0`/"—" si `totalIngresosAnual` es `0`).
- **Cuervito:** `$-3,073,140.00` · margen `-38.9%`
- **Presupuesto TI H1 2026:** `$-4,979,691.86` · margen `0.0%` (badge muestra "—")

## Resumen de tabla

| KPI | Cuervito | Presupuesto TI H1 2026 |
|---|---|---|
| Ingresos | $7,905,600.00 | $0.00 |
| CAPEX | $7,038,940.00 | $3,822,412.00 |
| OPEX | $3,939,800.00 | $1,157,279.86 |
| Total egresos | $10,978,740.00 | $4,979,691.86 |
| Utilidad | $-3,073,140.00 | $-4,979,691.86 |
| Margen | -38.9% | 0.0% ("—" en pantalla) |
