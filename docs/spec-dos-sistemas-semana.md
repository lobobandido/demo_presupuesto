# Spec — Separar captura y visualización · plan de una semana

App: `demo-presupuesto` · React + Supabase · `src/App.jsx`
Origen: retro del 4 de agosto. Referencia visual: hoja **SERVICIO** de
`01022026 Presupuesto Monitoreo Cuervito.xlsx`

---

## El objetivo, en una frase

El cliente lo dijo así: *"primero es un sistema de captura y luego es un sistema de visualización,
está bien fácil."* Hoy están mezclados. Esta pasada los separa.

| Sistema | Pantallas | Regla |
|---|---|---|
| **1 · Captura** | Datos generales · Áreas · Capturar costos · **Ingresos** | Único lugar con campos editables |
| **2 · Visualización** | **Información general** (tabla SERVICIO + gráficas) · Resumen mensual (tabla FLUJO + gráficas) | Cero campos. Los botones "Editar" navegan al sistema 1 |

Dos movimientos que definen la pasada:

1. **Ingresos sale de Resumen mensual y se va a Captura.** Queja literal del cliente: *"¿por qué hay
   un botón de ingresos, o sea, para de un formulario en una visualización?"*
2. **El cuerpo de Información general deja de ser las tablas por área y pasa a ser la tabla
   SERVICIO.** Queja literal: *"dice materiales, materiales, materiales, materiales… nómina, nómina,
   nómina. No le entiendo."*

---

## El hallazgo que hace viable la semana

**La tabla que el cliente pide ya está construida en tu código.** `exportarExcel` genera la hoja
SERVICIO con exactamente esa estructura: detalle por subcategoría, subtotal por categoría contable
macro, `ACTIVOS` como rollup del CAPEX, `TOTAL EGRESOS` al final. Usa `macroDeCategoria`,
`distribuirOpex`, `distribuirNomina` y `mesIndexCapex` — todo ya probado.

El trabajo no es escribir esa lógica. Es **extraerla** de la función de Excel y renderizarla también
en pantalla.

Y de ahí sale la mejor prueba de regresión posible: **si el Excel exportado sigue dando los mismos
valores después de la extracción, la extracción es correcta.**

---

## La estructura objetivo (extraída del Excel real, al renglón)

```
Proyecto: Monitoreo Cuervito
Periodo: Feb 2026 – Feb 2027 · 13 meses
                                Total Presup.      Mo         M1         M2
                                                 Feb 26     Mar 26     Abr 26
INGRESOS año MXN                                                                  ← sección
  FACTURACIÓN                     6,609,600         —       669,600    648,000    ← detalle
EGRESOS año                                                                       ← sección
    EQUIPO DE TRANSPORTE            638,000     638,000        —          —       ← detalle
    EQUIPO DE ADQUISICIÓN         4,012,200   4,012,200        —          —
    GABINETE Y ENERGÍA            1,312,200   1,312,200        —          —
    TRANSMISIÓN                   1,118,160   1,118,160        —          —
    CENTRO DE MONITOREO              89,100      89,100        —          —
  ACTIVOS                         7,169,660   7,169,660        —          —       ← subtotal
    ARRENDAMIENTO DE INMUEBLES      120,000        —        10,000     10,000
    SERVICIOS DE LUZ, AGUA E INT     36,000        —         3,000      3,000
  ARRENDA DE INMUEBLES Y SERV       156,000        —        13,000     13,000     ← subtotal
  ARTÍCULOS DE SEGURIDAD             40,000      40,000        —          —
  EQUIPO DE CÓMPUTO                  84,000      84,000        —          —
  INSUMOS DE OFICINA                 32,400        —         2,700      2,700
  MATERIALES                        810,000     810,000        —          —
  NÓMINA Y ADICIONALES              881,882        —        73,490     73,490
  SERV TELEFONÍA CELULAR Y RADIO    792,000        —        66,000     66,000
  TOTAL EGRESOS                                                                   ← total
```

Reglas de la estructura:

- **Detalle** = subcategoría escrita por el usuario. Cursiva, sangrada, color tenue.
- **Subtotal** = categoría contable macro (`macroDeCategoria`). Negrita, con fondo.
- **El CAPEX va primero**, con sus categorías de detalle y `ACTIVOS` como subtotal.
- **Nómina se agrega en un solo renglón** `NÓMINA Y ADICIONALES`, no un renglón por puesto.
- Si una categoría macro tiene una sola subcategoría con el mismo nombre, **no se duplica el
  renglón** (`exportarExcel` ya lo maneja con `esUnaSolaIgualAMacro` — conservar esa regla).
- **Colapsado por defecto:** se ven solo los subtotales; al picar la categoría se abren sus
  renglones de detalle. Petición literal: *"no tiene por qué aparecerme uno cada uno, solamente las
  categorías."* Reutilizar el patrón de `expandidosServicio` que ya existe en `TablaM`.
- **Los renglones en cero se ocultan** por defecto, con un interruptor "Mostrar categorías sin
  monto". El Excel los trae porque es una plantilla fija de las 27 categorías; en pantalla son
  ruido, y el cliente se quejó justo del ruido.
- Encabezado de dos líneas: código `M0/M1/M2` arriba, mes real debajo. Ya especificado.

---

# DÍA 1 — Extraer la lógica de agrupación

**El único cambio de esta pasada que toca código compartido. Aislarlo y verificarlo antes de
seguir.**

Crear una función pura a nivel de módulo:

```js
function construirFilasServicio({pres, areas, costos, capexPM, opexPM, ingresos, ingAdicionales}){
  // …exactamente la lógica que hoy vive dentro de exportarExcel, hoja SERVICIO…
  return filas; // ver forma abajo
}
```

**Forma de cada renglón:**

```js
{
  tipo: "seccion" | "detalle" | "subtotal" | "total",
  label: "ARRENDAMIENTO DE INMUEBLES",
  macro: "ARRENDA DE INMUEBLES Y SERV",   // null en secciones y totales
  bloque: "ingresos" | "capex" | "opex",
  total: 120000,
  mensual: [0, 10000, 10000, …]           // largo NMESES
}
```

**Procedimiento:**

1. Mover el bloque que hoy arma `rowsS` dentro de `exportarExcel` a `construirFilasServicio`,
   **sin cambiar una sola operación aritmética**. Los `sort`, el `esUnaSolaIgualAMacro`, el orden
   CAPEX→OPEX: todo idéntico.
2. `exportarExcel` pasa a consumir esa función y a mapear `filas` al formato AOA que ya usa.
   `seccionRows` / `subtotalRows` / `totalRows` se derivan del campo `tipo` en lugar de acumularse
   a mano.
3. **Verificación (bloqueante):** exportar el Excel de un presupuesto con datos antes y después.
   Los valores de la hoja SERVICIO deben ser idénticos celda por celda, y el formato (moneda,
   colores de sección y subtotal) igual. Si algo cambió, revertir.

No tocar `distribuirOpex`, `distribuirNomina`, `mesIndexCapex` ni `macroDeCategoria`.

---

# DÍA 2 — El componente de tabla

Componente nuevo `TablaServicio`, a nivel de módulo, que recibe `filas`, `MESES13`, `MESES13_MES` y
no calcula nada:

- Primera columna pegajosa (`position:sticky; left:0`), como ya hace `TablaM`.
- Segunda columna `Total Presupuestado`.
- Después una columna por mes, encabezado de dos líneas.
- Envolver en `<ScrollHint>` — es el estándar de la app para tablas anchas.
- Estilos por `tipo`:

| tipo | Fondo | Texto |
|---|---|---|
| `seccion` | `C.grayDark` | blanco, negrita, mayúsculas |
| `detalle` | alterno blanco / `#FAFAFA` | `C.grayMid`, cursiva, sangría 20px |
| `subtotal` | `C.yellowLight` | `C.grayDark`, negrita |
| `total` | `C.dangerLight` | `C.danger`, negrita, borde superior |

- Los `subtotal` con detalle llevan `▶`/`▼` a la izquierda; colapsados por defecto.
- Ceros como `—` en color `C.grayBorder`, igual que hoy en `TablaM`.
- Montos con `fmtK` (el que ya existe: `$1.2M`, `$540K`), para que quepan.

**No reemplaza a `TablaM`.** `TablaM` sigue sirviendo a la tabla FLUJO de Resumen mensual, que el
cliente aprobó: *"la tabla de flujo está bien, la tabla de servicios no."*

---

# DÍA 3 — Información general pasa a ser la vista de verdad

**Sustituir el cuerpo de `if(step===5)`:**

Sale:
- El `areas.map()` completo con sus `SCard`, `PartidaTable`, `NominaTable`, los KPIs por área y el
  botón "Guardar" por área.

Entra, en este orden:
1. Encabezado: nombre del proyecto, empresa, `Periodo: Feb 2026 – Feb 2027 · 13 meses`.
2. Los cinco KPIs del presupuesto completo (Ingresos, CAPEX, OPEX, Total egresos, Utilidad y
   margen). Ya existen en Step 4: reutilizar el mismo bloque.
3. **`TablaServicio`** — el centro de la pantalla.
4. Las dos gráficas: flujo de efectivo y OPEX por categoría. Ya están ahí, se quedan abajo.
   Orden pedido: *"y abajo ya puedes ver tu flujo de efectivo y lo que es por categoría."*

**Consecuencia a decidir (importante):** con esto, Información general **no tiene campos**, así que
el interruptor `modoLectura` de la sesión pasada deja de tener sentido en esa pantalla. El botón
"Editar" pasa a **navegar** a Capturar costos, no a habilitar campos en el sitio.

Eso supersede tres puntos del spec anterior: **2.2** (ocultar gráficas al editar), **2.3**
(el modal de Cancelar) y **2.4** (el chip fuera del PDF) ya no aplican. El prop `readOnly` de
`PartidaTable`/`NominaTable` se conserva: no cuesta nada y esas tablas siguen vivas en Captura.

Es un cambio de criterio del cliente entre una retro y la siguiente, no un error de nadie. Pero hay
que asumirlo explícitamente en lugar de dejar las dos cosas conviviendo.

---

# DÍA 4 — Mover Ingresos a Captura

Sacar de Step 4 el bloque completo de captura de ingresos: el `MoneyInput` de `precioFijo`, el botón
"Limpiar", "+ Agregar ingreso", los renglones de `ingAdicionales` con sus selects y su `×`.

Llevarlo a **Capturar costos (Step 3)** como una sección más, al mismo nivel que CAPEX, Nómina,
Materiales y Viáticos:

- Tarjeta `SCard` con título **"Ingresos · Facturación proyectada"**, ícono `💵`, color de acento
  `C.success`.
- Solo visible cuando `pres.tipo` es `instalacion` o `servicio`. Departamento y Suministro no tienen
  ingresos.
- Como los ingresos son del presupuesto y no de un área, mostrarla **una sola vez**, arriba del
  selector de áreas o como una sección fija antes de las cuatro por área. No repetirla en cada área.

**No tocar** `precioFijo`, `ingresos`, `ingAdicionales` ni la distribución que hace el
`MoneyInput` de precio fijo. Se mueve el JSX, no la lógica.

En Resumen mensual se queda **solo la tabla** de facturación, en modo lectura.

---

# DÍA 5 — Cargar el ejemplo real completo

Petición literal, repetida cuatro veces: *"tienen que hacer un ejemplo real, güey."*

Hoy la plantilla `cuervito` tiene 16 CAPEX y 10 OPEX agregados. El Excel tiene ~45 subcategorías.
Con datos agregados la tabla nueva se ve igual de pobre que la vieja.

**Cargar Cuervito completo, subcategoría por subcategoría**, con estos datos del Excel:

| Categoría macro | Subcategorías con monto |
|---|---|
| ACTIVOS (CAPEX) | Equipo de transporte 638,000 · Equipo de adquisición 4,012,200 · Gabinete y energía 1,312,200 · Transmisión 1,118,160 · Centro de monitoreo 89,100 |
| ARRENDA DE INMUEBLES Y SERV | Arrendamiento de inmuebles 10,000/mes · Servicios de luz, agua e internet 3,000/mes |
| ARTÍCULOS DE SEGURIDAD | Ropa y artículos de protección 40,000 (mes 0) |
| EQUIPO DE CÓMPUTO | Equipo de cómputo adquisición 84,000 (mes 0) |
| INSUMOS DE OFICINA | Papelería 500/mes · Aseo y sanitarios 1,200/mes · Cafetería 1,000/mes |
| MATERIALES | Poste de telemetría 810,000 (mes 0) |
| SERV TELEFONÍA CELULAR Y RADIO | Telefonía celular 28,000/mes · Radiocomunicación 38,000/mes |
| SERVICIOS | Cuadrilla de instalación 288,000/mes **× 3 repeticiones** · Herramienta 430,000 (una vez, mes 1) |
| NÓMINA Y ADICIONALES | 73,490.13/mes — los puestos reales que ya trae la plantilla |

**Verificación:** con esos datos la tabla en pantalla debe dar
`ACTIVOS 7,169,660` · `FACTURACIÓN 6,609,600` · `NÓMINA 881,882` · `SERV TELEFONÍA 792,000` ·
`ARRENDA DE INMUEBLES 156,000` · `INSUMOS DE OFICINA 32,400` · `MATERIALES 810,000`. Son los
subtotales del Excel: si cuadran, la vista es correcta.

`CUADRILLA DE INSTALACIÓN` es la prueba de fuego de `repeticiones`: 288,000 en tres meses y cero
después. Ya funciona; este ejemplo lo demuestra frente al cliente.

---

# Limpieza — qué quitar

Código muerto verificado, sin referencias en ninguna parte:

| Qué | Aprox. | Nota |
|---|---|---|
| `LineChart` | ~35 líneas | definida, nunca renderizada |
| `BarChart` | ~40 líneas | definida, nunca renderizada |
| `distMeses` | 4 líneas | reemplazada por `distribuirOpex` |
| `vecesEnProyecto` | 4 líneas | `totalOpexPartida` suma la distribución real |
| `HISTORIAL_NOMINA` | 3 líneas | `buscarHistorial` nunca lo consulta |
| `fmtMiles` | 1 línea | sin usos |
| campo `factor` de `PERIODICIDADES` | — | la lógica usa `PM_INTERVALO` |
| campo `mesGasto` de `initP` | — | vestigial; la lógica usa `mesGastoMes`/`mesGastoAnio` |
| `PLANTILLAS.instalacion` | ~15 líneas | esqueleto en ceros (ya en el spec anterior) |
| `EstadoBadge` | ~8 líneas | queda sin uso tras quitar la columna Estado |

Redundancias a resolver, **con más cuidado**:

- `HISTORIAL_OPEX_BASE` duplica casi al peso `PLANTILLAS.cuervito.opex`. Derivar uno del otro en vez
  de mantener dos copias que se van a desincronizar.
- `CATALOGO_CASCADA` son ~200 líneas de artículos escritos a mano que se solapan con
  `buscarArticulosAlmacen` (catálogo real en Supabase). **No borrar en esta pasada** — funciona hoy y
  el cliente no se ha quejado. Anotarlo para después.
- `innov_tec` en `AREAS_SUMINISTRO` duplica `innovacion` de `AREAS_DEPTO`: "Innovación y Tecnología"
  con dos ids distintos, así que sus presupuestos no se pueden comparar entre tipos.
- Los archivos de generación en la raíz del repo (`_gen_catalogo_almac…`, `catalogo_almacen_*.json`,
  `catalogo_stats.txt`) no son código fuente. Moverlos a `scripts/` o `data/`.

**Regla:** la limpieza va **al final**, después de que la tabla funcione. Borrar código muerto es
seguro, pero si se hace primero y algo se rompe, no vas a saber si fue la tabla o la limpieza.

---

## Qué cambiar en el spec anterior cuando Claude Code termine

| Punto | Estado |
|---|---|
| Fase 1 completa (1.1 – 1.7) | **Se queda igual.** Menú, nombres, botones, fechas, Estado: todo sigue aplicando |
| 1.6.b | Ya corregido: encabezado de dos líneas, `M1` arriba y mes real debajo |
| 2.1 indicador de pasos | **Se queda.** Más necesario que antes: Captura gana una sección |
| 2.2 ocultar gráficas al editar | **Se elimina.** Información general ya no tiene modo edición |
| 2.3 modal de Cancelar | **Se elimina.** Sin edición en el sitio, no hay qué cancelar |
| 2.4 chip fuera del PDF | **Se elimina.** No hay chip de modo |
| Fase 3 completa | **Se queda**, y el día 5 la refuerza con el ejemplo real |

---

## Protocolo de verificación (repetir en cada día)

1. Antes de tocar código: abrir un presupuesto con datos, anotar los cinco KPIs de Resumen mensual
   y exportar el Excel.
2. Hacer el cambio del día. `npm run build` limpio.
3. Volver a anotar los cinco KPIs y exportar el Excel. **Comparar los dos Excel celda por celda en
   la hoja SERVICIO.**
4. Confirmar que la lista de presupuestos sigue mostrando los mismos tres registros.
5. Si un monto se movió, revertir el día completo antes de seguir.
6. Reportar los KPIs de ambos momentos pegados, no un "sí coinciden".

El día 1 es el único donde el Excel es el juez principal. Del día 2 en adelante, el Excel solo debe
confirmar que nada se movió.

---

## Riesgos

- **El día 1 es el único con riesgo real.** Si la extracción sale bien, los días 2 a 5 son JSX.
- **El día 3 borra bastante JSX de Step 5.** Hacerlo en un commit propio, para poder revertir solo
  eso.
- **El día 5 no es código, es captura de datos.** Si va lento, la tabla ya se puede mostrar con lo
  que hay; el ejemplo completo es lo que la vuelve presentable ante el cliente, pero no bloquea nada
  técnico.
- **Sigue fuera de alcance**, y cada uno en su propia pasada: el off-by-one de
  `calcularNumMesesOp`, `guardarPres` limpiando `costos`, `opexPMt` con 12 fijo, y las cifras
  agrupadas de `depto_ti`.

---

# APÉNDICE A — De dónde sale cada cosa (leer si hay duda)

**La app nunca lee el archivo de Excel.** El diagrama de la sección "estructura objetivo" es
referencia visual del *formato*, no un listado de qué renglones mostrar. Está abreviado a propósito.

| Elemento de la tabla | De dónde sale | Qué NO lo determina |
|---|---|---|
| Número de columnas de mes | `NMESES` = `calcularNumMesesOp(fechaInicio, fechaFin) + 1` | el Excel |
| Encabezado `M0/M1/M2…` | `MESES13`, que ya existe | el Excel |
| Segunda línea del encabezado (`Feb 26`) | `MESES13_MES`, derivado de `fechaInicio` | el Excel |
| Renglones de detalle | las categorías que el usuario capturó, las que sean | una lista fija |
| Renglones de subtotal | `macroDeCategoria(cat)` agrupando esas categorías | una lista fija |
| Montos por mes | `mesIndexCapex` (CAPEX), `distribuirOpex` (OPEX), `distribuirNomina` (nómina) | el Excel |
| `ACTIVOS` | rollup de todo el CAPEX, igual que hoy en `exportarExcel` | — |
| `TOTAL EGRESOS` | `mEgresos`, igual que hoy | — |

**Regla dura: NO codificar ninguna lista fija de categorías, subcategorías ni meses.** Si un
presupuesto tiene dos categorías, la tabla debe tener dos renglones de detalle. Si tiene cuarenta,
cuarenta. Si dura seis meses, seis columnas; si dura veinte años, doscientas cuarenta con scroll.

La única lista fija que ya existe y se conserva es `CATS_MACRO_CONTABLE` (las 27 categorías
contables de finanzas) con su `SUBCAT_MAPPING`, que es lo que alimenta `macroDeCategoria`. No se
toca ni se amplía en esta pasada.

---

# APÉNDICE B — Salida esperada completa, Cuervito

Esto **no** es lo que hay que codificar: es lo que la tabla debe **producir** el día 5, una vez
cargado el ejemplo completo. Sirve como prueba de aceptación, no como fuente de datos.

Extraído de la hoja SERVICIO del Excel real. `S` = subtotal (categoría contable macro),
`d` = detalle (subcategoría).

| | Renglón | Total |
|---|---|---|
| **sección** | INGRESOS año MXN | |
| d | FACTURACIÓN | 6,609,600 |
| **sección** | EGRESOS año | |
| d | EQUIPO DE TRANSPORTE | 638,000 |
| d | EQUIPO DE ADQUISICIÓN | 4,012,200 |
| d | GABINETE Y ENERGÍA | 1,312,200 |
| d | TRANSMISIÓN | 1,118,160 |
| d | CENTRO DE MONITOREO | 89,100 |
| **S** | **ACTIVOS** | **7,169,660** |
| d | ARRENDAMIENTO DE INMUEBLES | 120,000 |
| d | SERVICIOS DE LUZ, AGUA E INTERNET | 36,000 |
| **S** | **ARRENDA DE INMUEBLES Y SERV** | **156,000** |
| d | ROPA Y ARTÍCULOS DE PROTECCIÓN | 40,000 |
| **S** | **ARTÍCULOS DE SEGURIDAD** | **40,000** |
| d | EQUIPO DE CÓMPUTO (Adquisición) | 84,000 |
| **S** | **EQUIPO DE CÓMPUTO** | **84,000** |
| d | PAPELERÍA Y ÚTILES DE OFICINA | 6,000 |
| d | ARTÍCULOS DE ASEO Y SANITARIOS | 14,400 |
| d | ARTÍCULOS DE CAFETERÍA | 12,000 |
| **S** | **INSUMOS DE OFICINA** | **32,400** |
| d | POSTE DE TELEMETRÍA | 810,000 |
| **S** | **MATERIALES** | **810,000** |
| **S** | **NÓMINA Y ADICIONALES** | **881,882** |
| d | SERV TELEFONÍA CELULAR (PARA TRANSMITIR) | 336,000 |
| d | SERVICIO DE RADIOCOMUNICACIÓN (PARA TRANSMITIR) | 456,000 |
| **S** | **SERV TELEFONÍA CELULAR Y RADIO** | **792,000** |
| d | CUADRILLA DE INSTALACIÓN | 864,000 |
| d | HERRAMIENTA | 430,000 |
| **S** | **SERVICIOS** | **1,294,000** |
| **total** | **TOTAL EGRESOS** | **11,292,342** |

Comprobaciones cruzadas de la distribución mensual:

- `ACTIVOS` cae **íntegro en el mes 0** (febrero). Los demás meses en cero.
- `ARRENDAMIENTO DE INMUEBLES` = 10,000 mensuales desde M1 → 120,000 en 12 meses.
- `NÓMINA Y ADICIONALES` = 73,490.13 mensuales desde M1 → 881,882.
- `CUADRILLA DE INSTALACIÓN` = 288,000 en M1, M2 y M3, **cero después**. Es la prueba de fuego de
  `repeticiones = 3`.
- `HERRAMIENTA` = 430,000 una sola vez, en M1.
- `FACTURACIÓN` = cero en el mes 0 y luego ~669,600/648,000 alternando; el mes 0 es instalación y no
  se factura.

## Dos diferencias que la app va a producir respecto al Excel — no son errores

**1. El Excel no trae el subtotal de SERVICIOS ni el TOTAL EGRESOS.** La hoja termina en el renglón
52, con `CUADRILLA DE INSTALACIÓN` y `HERRAMIENTA` sueltas. Pero ambas mapean a `SERVICIOS` en
`SUBCAT_MAPPING`, así que la app va a generar ese subtotal (1,294,000) y el total general. Está
bien: la app queda más completa que la fuente. Si alguien compara y pregunta, es esto.

**2. El Excel tiene dos subtotales de 32,400: `INSUMOS OPERATIVOS` e `INSUMOS DE OFICINA`.** El
detalle (papelería 500 + aseo 1,200 + cafetería 1,000 = 2,700/mes × 12 = 32,400) solo respalda uno
de los dos. El `INSUMOS OPERATIVOS` de arriba no tiene renglones de detalle propios.

**Esto hay que preguntárselo al cliente antes de cargar el ejemplo**, porque cambia el total en
32,400: ¿son dos rubros distintos de 2,700 mensuales cada uno, o el mismo dinero contado dos veces
en la hoja? El apéndice de arriba asume **uno solo** (32,400). Si son dos, el total de egresos sube
a 11,324,742.

---

# APÉNDICE C — Texto para pegarle a Claude Code al arrancar el día 1

> Lee `docs/spec-dos-sistemas-semana.md` completo, incluidos los apéndices, antes de escribir nada.
>
> Aclaración importante: **la app no lee ningún archivo de Excel.** El diagrama de la sección
> "estructura objetivo" y el apéndice B son referencia de formato y prueba de aceptación. La tabla
> se genera de los datos capturados: columnas según `fechaInicio`/`fechaFin`, renglones según las
> categorías que existan, agrupados por `macroDeCategoria`. **No codifiques ninguna lista fija de
> categorías ni de meses.**
>
> Implementa **únicamente el DÍA 1**: extraer la lógica de agrupación de `exportarExcel` a la
> función pura `construirFilasServicio`, sin cambiar una sola operación aritmética, y hacer que
> `exportarExcel` la consuma.
>
> Verificación bloqueante: exporta el Excel de un presupuesto con datos antes y después del cambio.
> La hoja SERVICIO debe quedar idéntica celda por celda, con el mismo formato de moneda y los mismos
> colores de sección, subtotal y total. Si algo cambió, revierte y repórtalo.
>
> No pases al día 2. No hagas commit hasta que yo confirme.

---

# APÉNDICE D — Puntos de la retro que faltaban

Todos salen de citas textuales del audio del 4 de agosto. Son cambios chicos, pero son los que el
cliente dijo con nombre y apellido.

## D.1 Las leyendas de la gráfica no corresponden a lo que se dibuja

> *"¿Cuál es el flujo acumulado y cuál es este? O sea, porque no son los colores, esta es una línea
> azul."*

Encontró un bug real. Hay dos desajustes en `FlowChart` y su leyenda:

| Leyenda dice | Color de la leyenda | Color que se dibuja | |
|---|---|---|---|
| Flujo mensual positivo | `C.yellow` = `#DDAC00` | barras `#DDAC00` | ✓ |
| Flujo mensual negativo | `C.danger` = `#C0392B` | barras `#EF4444` | ✗ |
| Flujo acumulado | `#374151` (gris) | línea `#1E40AF` (azul) | ✗ |

Además los puntos de la línea acumulada se pintan verde o rojo según el signo
(`fill={v>=0?"#059669":"#EF4444"}`) y eso no está explicado en ninguna parte.

**Arreglo:** que la leyenda tome los colores de una sola fuente. Definir las constantes arriba y
usarlas en los dos lados, para que no vuelvan a divergir:

```js
const COLOR_FLUJO_POS="#DDAC00", COLOR_FLUJO_NEG="#EF4444", COLOR_ACUM="#1E40AF";
```

Y agregar a la leyenda el cuarto elemento que hoy no está: los puntos verde/rojo de la línea
acumulada = acumulado positivo / acumulado negativo.

## D.2 No se distingue presupuesto de gasto real

> *"¿esto es lo que voy a gastar de CAPEX o lo que ya gasté?"*

La app no lo dice en ninguna parte. Rotularlo explícitamente:

- La columna de totales dice **"Total Presupuestado"**, no "Total".
- Debajo del título de Información general: **"Cifras presupuestadas — no incluye gasto ejecutado"**.
- El encabezado de la tabla de egresos dice **"EGRESOS PRESUPUESTADOS"**.

Es una línea de texto en cada lugar y quita la duda que él mismo planteó.

Nota: la hoja `F07 IMPRESORAS` del Excel departamental sí trae importes **facturados** (con número de
factura). O sea, mezclar presupuesto con real es un riesgo que ya existe en las fuentes. Rotularlo
ahora evita que el problema entre a la app sin que nadie lo note.

## D.3 El periodo debe arrancar en el mes del primer gasto

> *"Si mi primer gasto lo voy a realizar en febrero, pues inicio en febrero. Si mi primer gasto lo
> voy a hacer en marzo, pues inicio en marzo."*

Hoy `fechaInicio` se captura a mano y nada valida que coincida con el primer gasto. Si alguien pone
enero y el primer gasto es en febrero, la tabla arranca con una columna vacía.

**No cambiar `calcularNumMesesOp`** (sigue fuera de alcance). En su lugar, un aviso en Información
general:

> ⚠ Los primeros N meses del periodo no tienen ningún movimiento. El primer gasto ocurre en
> Mar 2026 — considera cambiar la fecha de inicio.

Se calcula recorriendo `mEgresos` y `mIngresos` desde el índice 0 hasta el primer valor distinto de
cero. Solo se muestra si ese índice es mayor que cero. Cero riesgo: es un aviso, no toca el cálculo.

## D.4 Nómina no debe poder capturarse en Materiales

> *"Metieron en OPEX en un OPEX de materiales nómina."* · *"¿y para qué chingados está acá
> entonces?"*

`CAT_OPEX_MAT` ya excluye "NÓMINA Y ADICIONALES" del dropdown, pero `CatalogInput` acepta texto
libre y las sugerencias del historial pueden reinyectarla. Agregar validación al guardar la partida:
si la categoría de una partida de Materiales o Viáticos mapea a `NOMINA Y ADICIONALES`, mostrar
aviso y no permitirlo — la nómina se captura en su propia sección.

## D.5 Orden de los bloques: decisión pendiente

Se contradice en el mismo audio:

> *"primero tu OPEX, luego ves tu CAPEX"*
> …y más adelante…
> *"aquí lo divides primero por OPEX y luego por CAPEX. O sea, no digo que esté mal, está chido."*

Su Excel de referencia pone **CAPEX primero** (renglones 8–13, terminando en `ACTIVOS`), y luego el
OPEX. Este spec sigue el Excel.

**Preguntárselo antes del día 3.** Invertirlo después es un `sort`, pero mejor no rehacer la vista
dos veces.

## D.6 Clasificación de EQUIPO DE CÓMPUTO: decisión pendiente

> *"El CAPEX solamente es esto: los activos. […] Igual equipos de cómputo debería ir acá. En CAPEX."*

En su Excel, `EQUIPO DE COMPUTO (Adquisición)` de 84,000 está en el bloque de **OPEX**. Él dice
verbalmente que debería estar en CAPEX.

En la app la división CAPEX/OPEX no la decide la categoría, la decide **en qué sección se captura**.
Así que esto se resuelve en los datos del día 5, no en código. Pero cambia dos cifras del apéndice B:

| | Siguiendo el Excel | Siguiendo su corrección verbal |
|---|---|---|
| ACTIVOS | 7,169,660 | **7,253,660** |
| EQUIPO DE CÓMPUTO (OPEX) | 84,000 | — |
| TOTAL EGRESOS | 11,292,342 | 11,292,342 (igual) |

**Recomendación:** cargar el ejemplo **siguiendo el Excel**, para que los subtotales cuadren al peso
contra el archivo que él va a tener abierto al lado cuando lo revise. Y preguntarle la clasificación
aparte. Si se cambia primero y luego compara, el 7,253,660 va a parecer un error de la app.

## D.7 Gantt: fuera de alcance, anotado

> *"Todavía no logran hacer la visualización de Gantt."*

Lo mencionó de paso, sin desarrollarlo. No entra en esta semana. Queda anotado para no perderlo, y
conviene preguntarle qué espera ver ahí: una barra por partida a lo largo de los meses es lo natural,
y los datos para hacerlo ya existen (`distribuirOpex` devuelve exactamente el arreglo que necesita
un Gantt).

---

## Dónde caen estos puntos en el plan

| Punto | Cuándo | Riesgo |
|---|---|---|
| D.1 leyendas de la gráfica | día 2, con la tabla | nulo, son colores |
| D.2 rótulos de presupuestado | día 3, con el encabezado | nulo, es texto |
| D.3 aviso de meses vacíos | día 3 | nulo, es un aviso |
| D.4 validación de nómina | día 4, con Ingresos | bajo |
| D.5 orden CAPEX/OPEX | **preguntar antes del día 3** | — |
| D.6 clasificación cómputo | **preguntar antes del día 5** | — |
| D.7 Gantt | fuera de alcance | — |

---

# APÉNDICE E — Decisiones cerradas por el cliente

Resuelven los dos puntos abiertos de D.5 y D.6. **Sustituyen lo que dicen esas secciones.**

## E.1 Orden de los bloques: CAPEX primero — RESUELTO

CAPEX antes de OPEX, igual que su Excel de referencia. `construirFilasServicio` conserva el orden
que ya tiene hoy `exportarExcel`: ingresos → detalle CAPEX → `ACTIVOS` → detalle OPEX por macro →
`TOTAL EGRESOS`. **No hay nada que cambiar**; solo queda confirmado que no se invierte.

## E.2 Equipo de cómputo es CAPEX — RESUELTO

La adquisición de equipo de cómputo se captura en la sección **CAPEX** y entra en `ACTIVOS`.

Matiz que hay que respetar al cargar los datos: `EQUIPO DE COMPUTO (Adquisición)` es un activo y va
en CAPEX; `ARRENDAMIENTO DE EQ. COMPUTO` es renta y va en OPEX. Las dos mapean a la misma categoría
contable macro (`EQUIPO DE COMPUTO`) en `SUBCAT_MAPPING`, así que lo que las separa es **en qué
sección se capturan**, no la categoría.

### Corrección al APÉNDICE B

Con esta decisión, dos cifras esperadas cambian respecto a lo que dice ese apéndice:

| Renglón | Apéndice B decía | Valor correcto |
|---|---|---|
| **ACTIVOS** | 7,169,660 | **7,253,660** |
| EQUIPO DE CÓMPUTO (subtotal OPEX) | 84,000 | **desaparece** |
| TOTAL EGRESOS | 11,292,342 | 11,292,342 *(sin cambio)* |

Los 84,000 se mueven de OPEX a CAPEX: el total general no se mueve.

Y en la distribución mensual, esos 84,000 caen en el **mes 0** (febrero), igual que el resto del
CAPEX de Cuervito.

### Nota para cuando el cliente compare

Su Excel dice `ACTIVOS 7,169,660` porque ahí el equipo de cómputo está clasificado en el bloque de
OPEX. La app va a decir **7,253,660**. **No es un error de la app: es la corrección que él pidió.**

Conviene tenerlo a mano cuando revise, porque va a tener el archivo abierto al lado. El `TOTAL
EGRESOS` sí cuadra al peso con su Excel, y ese es el número que importa para validar que la vista
está bien.

## E.3 Gráficas abajo — ya especificado

El orden de Información general que pide el cliente ya es el del día 3, sin cambios:

1. Encabezado: proyecto, empresa, periodo.
2. Los cinco KPIs (Ingresos, CAPEX, OPEX, Total egresos, Utilidad y margen).
3. **`TablaServicio`** — CAPEX y OPEX, el centro de la pantalla.
4. Gráfica de flujo de efectivo.
5. Gráfica de OPEX por categoría.

Cita textual: *"ves tus CAPEX […] y abajo ya puedes ver tu flujo de efectivo y lo que es por
categoría."*

Aplica igual a Resumen mensual: KPIs, después la tabla FLUJO, y las gráficas al final. Ninguna
gráfica queda arriba de una tabla en ninguna de las dos pantallas.
