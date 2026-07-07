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

*GEOLIS SA DE CV — Bitácora técnica interna — Módulo de Presupuestos v1.0 MVP*
