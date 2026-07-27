# GEOLIS — Módulo de Presupuestos
## Bitácora técnica de cambios
**Versión:** 1.0 MVP | **Periodo:** Junio–Julio 2026 | **Stack:** React 18 + Vite + Vercel

---

## Punto de partida

Se tomó como base un prototipo funcional desplegado en Netlify:
`https://delightful-begonia-a2e7a6.netlify.app/`

El prototipo tenía el flujo básico pero carecía de lógica de negocio real, separación CAPEX/OPEX, datos del Excel de Geolis y diseño alineado al corporativo.

---

## Iteración 1 — Arquitectura base y flujo CU-001 a CU-005

### Cambios técnicos

**Archivo:** `src/App.jsx` — creación desde cero

**Constantes y catálogos:**
- `AREAS_CAMPO`, `AREAS_DEPTO`, `AREAS_SUMINISTRO` — 3 catálogos de áreas según tipo de presupuesto
- `PLANTILLAS` — objeto con estructura base Cuervito, Instalación y Departamento TI
- `CATS_MACRO_CONTABLE` — 27 categorías contables extraídas de la pestaña SERVICIO del Excel
- `SUBCAT_MAPPING` — mapa de subcategoría → categoría macro (ej. "silla de oficina" → "INSUMOS DE OFICINA")
- `HISTORIAL_CAPEX` / `HISTORIAL_OPEX_BASE` — partidas reales de los archivos Excel Cuervito y Perdiz

**Componentes creados:**
- `MoneyInput` — input con prefijo `$` fijo, sin bloqueo del cero, formato con comas al salir (`$1,234,567.89`)
- `CatalogInput` — dropdown con búsqueda, opción de agregar nueva categoría y modal de categoría contable
- `PartidaTable` — tabla de partidas con headers internos, sugerencias históricas y botón agregar
- `NominaTable` — tabla de nómina con fórmula visible (salario × factor × cantidad)
- `SCard` — card de sección con acento de color lateral
- `Badge` / `EstadoBadge` — indicadores de estado del presupuesto
- `Toast` — notificación temporal al guardar
- `FL` — label de campo con indicador de requerido

**Flujo implementado (5 pasos en sidebar):**
1. Lista de presupuestos — tabla con Abrir / Editar / Clonar
2. Info general — nombre, empresa, tipo (4 tipos), fechas, plantilla
3. Áreas / Participantes — catálogo dinámico según tipo
4. Captura de costos — CAPEX / Nómina / Materiales / Viáticos por área
5. Resumen mensual — tablas + gráficas + exportación

---

## Iteración 2 — Paleta corporativa y layout full-width

### Cambios técnicos

**Paleta de colores** (`const C = {...}`):
```
yellow:      #DDAC00   (acento principal)
yellowDark:  #B08900   (texto sobre fondo claro)
sidebar:     #111111   (panel izquierdo)
grayDark:    #1a1a1a   (texto principal)
contentBg:   #F8F8F8   (fondo general)
```

**Layout:**
- `aside` fijo de 220px — sidebar negro con navegación, indicadores de paso circulares, presupuesto activo y fechas
- `header` sticky 52px — breadcrumb + botón condicional "Ver Resumen mensual"
- `main` con padding 28px × 32px — contenido principal sin maxWidth

**Sidebar inferior** — muestra:
- Nombre del presupuesto activo (amarillo)
- Tipo del presupuesto
- Fecha de elaboración (sección separada)
- Vigencia inicio → fin

---

## Iteración 3 — Datos reales del Excel + distribución de plantilla

### Extracción de datos (Python + openpyxl)

Se procesaron dos archivos Excel de Geolis:
- `01022026_Presupuesto_Monitoreo_Cuervito.xlsx` — hojas: SERVICIO, FLUJO, GRÁFICA, GRÁFICA II, F00 INVERSIÓN, F01 NÓMINA
- `PERDIZ_HPS_800_HP.xlsx` — hoja F00 INVERSIÓN

**Datos extraídos e integrados en el código:**

| Fuente | Datos | Uso |
|---|---|---|
| F00 INVERSIÓN Cuervito | 16 partidas CAPEX reales con montos | Plantilla automática |
| F01 NÓMINA Cuervito | Especialista telemetría $25,000 / Técnico instrumentista $20,000 | Plantilla nómina |
| SERVICIO Cuervito | 10 partidas OPEX con montos reales | Plantilla y autocompletar |
| F00 INVERSIÓN Perdiz | 24 partidas CAPEX (Bomba HPS, VDF, Generador, CCM...) | Autocompletar historial |
| SERVICIO Cuervito | Jerarquía categorías macro contables | Modal categoría contable |

**`confirmarAreas()` — lógica de distribución:**
```
Si hay plantilla cargada y es el primer área:
  ├── capex de plantilla → costos[primerArea].capex
  ├── opex con "NOMINA" → costos[primerArea].nomina (como PuestoNomina)
  ├── opex restante sin "VIATICO" → costos[primerArea].mat
  └── opex con "VIATICO" → costos[primerArea].via
Las demás áreas inician vacías.
```

**Plantilla automática:**
- Al seleccionar Instalación o Servicio → carga Cuervito automáticamente (sin clic extra)
- Al seleccionar Departamento → sugiere plantilla TI
- Al cambiar el tipo → resetea áreas y partidas

---

## Iteración 4 — Persistencia y funciones de gestión

### `localStorage` — clave `geolis_app_state_v3`

**Guardar** (`useEffect` en cambios de estado):
```javascript
saveAppState({pres, areas, costos, capexPM, opexPM, lista, areaSaved, step, ingresos})
```

**Restaurar** (al montar el componente):
```javascript
const saved = loadAppState();
if(saved?.pres) → restaurar todo el estado
```

La clave `v3` fuerza un reset limpio al actualizar la versión (invalida cache anterior).

### `clonarPresupuesto(p)`
- Crea nuevo presupuesto con nombre `"(copia)"`
- Copia todas las partidas con nuevos `uid()` para evitar colisiones de ID
- Copia costos de áreas con estado `"pendiente"` (no marcado como guardado)
- Lleva al usuario al paso 1 para editar antes de confirmar

### Editar presupuesto en Borrador/En revisión
- Botón "Editar" en lista → `abrirEdicion(p)` → pre-carga `form`, `areas`, `costos`, `capexPM`, `opexPM`
- `modoEdicion = true` → al guardar hace `setLista(prev => prev.map(...))` en vez de agregar nuevo

### Fecha de elaboración
- Campo `fechaElaboracion` en `form` — valor por defecto: fecha actual
- Visible en: sidebar inferior, header del Resumen, pie de página del PDF y Excel

---

## Iteración 5 — Punto 8: Autocompletar con historial

### `buscarHistorial(cat, tipo)`

Busca en tres fuentes en orden:
1. `HISTORIAL_CAPEX` — datos fijos de Cuervito y Perdiz (CAPEX)
2. `HISTORIAL_OPEX_BASE` — datos fijos de Cuervito (OPEX)
3. `getHistorialLS()` — presupuestos guardados en localStorage del usuario

**Lógica de coincidencia:**
```
Match si:
  p.cat.includes(catBuscada) OR catBuscada.includes(p.cat) OR p.desc.includes(catBuscada)
Deduplicación por (desc + monto)
Máximo 8 sugerencias
```

**UI de sugerencias:**
- Aparecen como chips amarillos debajo del campo de categoría
- Solo se muestran cuando la categoría tiene texto Y la descripción está vacía
- Al hacer clic → autocompleta categoría, descripción, unidad, cantidad y monto completos

---

## Iteración 6 — Resumen mensual completo

### Estructura de datos mensual (13 meses: M0–M12)

```javascript
mCapex[0]  = totalCAPEX  // Todo en M0 (instalación)
mCapex[1..12] = 0

mOpex[0] = 0  // M0 sin OPEX
mOpex[1..12] = totalOPEX / 12  // Distribuido uniforme

mFlujo[i]     = mIngresos[i] - mEgresos[i]
mFlujoAcum[i] = mFlujoAcum[i-1] + mFlujo[i]
```

### Componentes de gráfica (SVG puro, sin dependencias)

**`FlowChart`** — Gráfica I (barras + línea):
- Barras: flujo mensual (amarillo si ≥0, rojo si <0)
- Línea: flujo acumulado con puntos circulares
- Eje Y centrado en cero para mostrar negativos correctamente

**`CatLinesChart`** — Gráfica II (líneas por categoría):
- Una línea por categoría OPEX capturada
- 8 colores rotativos
- Datos M0 siempre en 0, M1–M12 con valor mensual uniforme

**`TablaM`** — Tabla mensual reutilizable:
- Sticky first column para labels
- Formato `$XXK` / `$X.XM` para ahorrar espacio
- Fila TOTAL con fondo amarillo claro

### Captura de ingresos
- Tabla editable con `MoneyInput` por mes (M0 bloqueado)
- Botón "Distribuir uniforme" → `prompt()` con monto mensual → llena M1–M12
- Persiste en `localStorage` junto con el resto del estado

---

## Iteración 7 — Exportación Excel (SheetJS)

### Carga dinámica
```javascript
// SheetJS se carga solo cuando el usuario hace clic en "⬇ Excel"
const s = document.createElement("script");
s.src = "https://cdnjs.cloudflare.com/.../xlsx.full.min.js";
```
No afecta el tiempo de carga inicial de la app.

### 4 hojas generadas

| Hoja | Contenido |
|---|---|
| SERVICIO | Ingresos, CAPEX, OPEX, Egresos totales, OPEX acumulado, detalle por categoría |
| FLUJO | OPEX, CAPEX, Egresos, Ingresos, Flujo efectivo, Flujo acumulado |
| EGRESOS | Todas las partidas con categoría, descripción, unidad, cantidad, monto, tipo |
| INFO | Datos generales + resumen financiero (Ingresos, CAPEX, OPEX, Utilidad, Margen%) |

### Formato de moneda en celdas
```javascript
const FMT_MONEY = '"$"#,##0.00';
// Aplicado a todas las celdas numéricas vía:
function applyMoneyFmt(ws, startRow, startCol, endRow, endCol)
```
Nota: Los estilos de color (negritas, fondos) requieren SheetJS Pro. La versión CDN gratuita solo soporta formato numérico nativo de Excel.

---

## Estado final del repositorio

```
geolis-presupuestos/
├── src/
│   ├── App.jsx          ← ~2,050 líneas — toda la lógica
│   ├── main.jsx         ← entrada React
│   └── index.css        ← estilos globales mínimos
├── index.html
├── vite.config.js
├── vercel.json          ← routing SPA
├── package.json
├── .gitignore
└── README.md
```

**Backups disponibles localmente:**
- `App.v2.backup.jsx` — antes del rediseño CoreWell
- `App.v3.backup.jsx` — antes de datos reales Excel
- `App.v4.backup.jsx` — antes de paleta corporativa
- `App.v5.backup.jsx` — antes de áreas por tipo
- `App.v6.backup.jsx` — antes del polish UX
- `App.v7.backup.jsx` — antes de historial y Excel
- `App.v8.backup.jsx` — antes del resumen completo
- `App.v9.backup.jsx` — antes de punto 8 y Excel export
- `App.v10.backup.jsx` — antes del formato moneda

---

## Dependencias del proyecto

| Paquete | Versión | Uso |
|---|---|---|
| react | 18.2.0 | UI |
| react-dom | 18.2.0 | Rendering |
| vite | 5.0.0 | Build tool |
| @vitejs/plugin-react | 4.2.1 | JSX transform |
| xlsx (CDN) | 0.18.5 | Exportación Excel — carga dinámica |

**Sin backend.** Todo el estado vive en `localStorage`. La siguiente fase conecta con Django + DRF + PostgreSQL (Supabase).

---

## Estándar responsive para tablas (móvil)

Al auditar la app en viewport de 375px (iPhone SE) se encontraron tablas que se
desbordaban horizontalmente sin indicación clara de scroll. Se definió un
estándar único, aplicado a **todas** las tablas de la app:

1. **Listados con acciones** (pocas columnas + botones, ej. lista de
   "Presupuestos"): la fila-grid se convierte en card apilada en móvil
   (`className="lista-row"` + regla `@media (max-width:480px)` que fuerza
   `grid-template-columns:1fr`). El header de la tabla (`lista-header`) se
   oculta; los botones de acción envuelven en fila (`flex-wrap`).

2. **Tablas de captura/datos con muchas columnas** (partidas CAPEX/OPEX,
   nómina, tablas de meses M0–M12 del Resumen): se envuelven en el componente
   compartido `<ScrollHint>` (definido junto a `MoneyInput`/`Toast` en
   `src/App.jsx`) — scroll horizontal contenido (no rompe el layout de la
   página) + sombra en el borde derecho que **solo aparece si hay contenido
   real por desplazar** (se oculta al llegar al final del scroll).

3. **Texto descriptivo largo**: word-wrap normal (comportamiento por defecto
   de los `<div>`); nunca `white-space:nowrap` combinado con `overflow:hidden`
   salvo en chips/etiquetas cortas con `title` de respaldo.

**Bug raíz encontrado durante la auditoría:** `<main>` y `.main-content` eran
hijos flex sin `min-width:0`. Por default, un hijo flex no se encoge por
debajo del ancho mínimo de su contenido (`min-width:auto`), así que cualquier
tabla ancha en cualquier parte de la página — aunque estuviera envuelta en su
propio scroll — empujaba a **toda la página** a desbordarse horizontalmente.
Se corrigió agregando `minWidth:0` a ambos, y `minmax(0,1fr)` en las columnas
de grid con `1fr` (mismo problema existe en CSS Grid). Cualquier nuevo layout
flex/grid de columna ancha en esta app debe seguir este mismo patrón.

**Para nuevas tablas:** usar siempre `<ScrollHint minWidth={N}>` en vez de un
`<div style={{overflowX:"auto"}}>` manual, y verificar que ningún ancestro
flex/grid en la cadena hacia `<main>` carezca de `min-width:0`.

---

## Iteración 8 — Backend real: Supabase + catálogo de almacén

**Archivos:** `src/supabaseClient.js`, `src/supabaseApi.js`, `supabase_catalogo.sql`,
`catalogo_almacen.json` / `catalogo_almacen_500.json` / `.sql`, `_gen_catalogo_almacen.mjs`

La app deja de vivir solo en `localStorage`: se conecta a un proyecto de
Supabase (Postgres + REST) para persistir presupuestos y consultar el
catálogo real de artículos de almacén.

### Catálogo de almacén

`_gen_catalogo_almacen.mjs` procesa el Excel real de Geolis
("Articulos Almacen (3)_todas las categorias.xlsx", 17,312 artículos) y
genera:
- `catalogo_almacen_500.json/.sql` — muestra de 500 artículos (1 por cada
  uno de los 322 pares grupo-subgrupo únicos, completado hasta 500 con tope
  de 15 por grupo)
- `catalogo_almacen.json` — jerárquico grupos → subgrupos → artículos
- `supabase_catalogo.sql` — inserts en lotes para cargar los 44 grupos reales
  a la tabla `catalogo_almacen` en Supabase

Limpieza aplicada a las descripciones: se eliminan fragmentos duplicados
separados por coma y se truncan a 150 caracteres.

### `supabaseApi.js` — funciones expuestas

| Función | Uso |
|---|---|
| `listarPresupuestos()` | lista de presupuestos guardados en la nube |
| `eliminarPresupuestoDeNube(id)` | borra un presupuesto remoto |
| `buscarArticulosAlmacen(query)` | busca por palabra (AND) en descripción o coincidencia directa en grupo/código — usada por los chips "Artículos de esta categoría" en CAPEX/OPEX |
| `listarGruposAlmacen()` / `listarSubgruposAlmacen(grupo)` / `listarArticulosPorSubgrupo(...)` | quedaron de un intento de cascada Categoría→Subcategoría→Artículo (ver más abajo, revertido); no se usan en la UI actual pero se dejan por si se retoma la cascada |
| `guardarPresupuestoEnNube({pres, form, areas, costos, ingAdicionales, precioFijo})` | sube un presupuesto completo a Supabase |
| `cargarPresupuestoDeNube(id, {uid, initP, initN})` | trae un presupuesto guardado y lo reconstruye en el estado de la app |

**Importante:** nunca se cargan los 17,312 artículos completos al navegador —
cada consulta (grupos, subgrupos de 1 grupo, artículos de 1 grupo+subgrupo)
trae solo lo necesario.

---

## Iteración 9 — Intento de cascada Categoría→Subcategoría→Artículo (revertido)

Se probaron **tres enfoques distintos** para conectar el catálogo de almacén
al campo Categoría de una partida, en varias vueltas de retroalimentación:

1. **`e75a1a6`** — Subcategoría y Artículo como columnas propias del grid de
   la tabla de partidas (revertido en `a675ea2`: rompía el layout cuando la
   fila ya tenía muchas columnas).
2. **`a1eedd8`** — cascada Categoría→Subcategoría→Artículo solo en OPEX
   Materiales, usando el catálogo estático como opciones extra al final del
   dropdown de Categoría.
3. **`f8235ea`** — se elimina por completo el componente `CascadaAlmacen`:
   42 de los 44 grupos del almacén no tienen subcategoría real definida
   (caían todos en el texto genérico "SUBGRUPO XX"), lo que rompía la UI.
   Se reemplaza por **chips simples** bajo el campo Categoría
   ("Artículos de esta categoría:", hasta 6 sugerencias vía
   `buscarArticulosAlmacen`, estilo gris sin colores nuevos) — al hacer clic
   autocompleta Descripción y Unidad. Este es el diseño **vigente**.

**Bug relacionado (`7034a4c`):** el dropdown de Categoría mezclaba los 44
grupos reales del almacén (TUBERIAS, VALVULAS, ELECTRICIDAD...) por igual en
CAPEX, OPEX Materiales y OPEX Viáticos — aparecían categorías de un rubro en
otro (ej. TUBERIAS en Viáticos). Se corrigió para que cada sección muestre
solo su propia lista fija (`CAT_CAPEX` / `CAT_OPEX_MAT` / `CAT_OPEX_VIA`),
sin nada del almacén mezclado. El buscador de chips no se vio afectado
porque busca por texto libre, no por lo que esté en el dropdown.

---

## Iteración 10 — Categorías por sección, ancho de captura, resumen expandible

**Commits:** `751cdb2`, `a1eedd8`

- **Categorías personalizadas** ("Crear categoría") ahora se guardan por
  sección (CAPEX / OPEX Materiales / OPEX Viáticos) en vez de una sola clave
  global — antes una categoría creada en una sección "contaminaba" el
  dropdown de las otras.
- Columna izquierda de captura (`.capture-grid`) más angosta en desktop
  (248px → 200px), sin tocar el breakpoint `<768px`.
- Filas CAPEX y OPEX de la Tabla SERVICIO (Resumen mensual) ahora son
  **expandibles**: muestran el detalle mes a mes por partida sin salir de la
  tabla.
- **`src/excelImport.js`** (nuevo, 206 líneas): parser para leer la plantilla
  real de presupuestos de Geolis (hojas `F00 INVERSIÓN`, `NOMINA/F01 NÓMINA`,
  `F01 EPP`, `F01 UNIFORMES`, `F02 INMUEBLES Y S`, `F03 COM Y EQ COM`,
  `F05 VIÁTICOS`, `F06/F07 MAT-SERV-EQUIPO`, `F08 INGRESOS`) y convertirla en
  la forma que usa la app (`{capex, mat, via, nomina, precioFijoEstimado, avisos}`).
  No procesa `F04 VEHÍCULOS Y COMB.` (formato por vehículo, no por partida)
  ni archivos tipo "CONCENTRADO" (reportes multi-proyecto).
  **Pendiente:** este archivo existe y exporta `parsearPresupuestoExcel` /
  `esArchivoConcentrado`, pero **todavía no está importado ni llamado desde
  `src/App.jsx`** — falta conectarlo a un botón/flujo de "importar Excel real"
  en la UI para que se use.

---

## Iteración 11 — Plantilla depto_ti con datos reales del semestre

**Commit:** `9a007a3` (26-jul-2026)

- La plantilla "depto_ti" (usada al crear un presupuesto de referencia rápido)
  se reemplazó con los montos, cantidades y fechas reales del archivo
  `Presupuesto_1er_ semestre2026_Geolis.xlsx` (10 partidas CAPEX, 7 OPEX).
- `confirmarAreas()` ahora **preserva** `mesGastoMes`/`mesGastoAnio` (CAPEX) y
  `mesInicioOpex` (OPEX) al distribuir cualquier plantilla a un área — antes
  se perdían y dejaban las fechas de compra sin llenar.
- `totalOpexAnualCat` / `totalNomAnual` ahora usan la duración real del
  proyecto (`calcularNumMesesOp`) en vez de asumir 12 meses fijos, para que
  el total mostrado en Captura de costos coincida con el que ya calculaba el
  Resumen mensual.

---

*GEOLIS SA DE CV — Bitácora técnica interna — Módulo de Presupuestos v1.0 MVP*
